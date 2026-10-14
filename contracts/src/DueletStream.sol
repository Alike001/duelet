// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DueletStream
/// @notice Fully funded, fixed-duration USDC invoice streams on Arc.
/// @dev The ARC_INVOICE_STREAM_V1 domain is intentionally stable across the Duelet rebrand.
// forge-lint: disable-start(block-timestamp)
contract DueletStream is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant ARC_MAINNET_CHAIN_ID = 5042;
    address public constant ARC_MAINNET_USDC = 0x3600000000000000000000000000000000000000;
    bytes32 public constant INVOICE_ID_DOMAIN = keccak256("ARC_INVOICE_STREAM_V1");

    IERC20 public immutable USDC;
    uint256 public totalOutstandingLiability;

    struct Invoice {
        address payer;
        address payee;
        uint256 totalAmount;
        uint256 withdrawnAmount;
        uint256 refundedAmount;
        uint64 startTime;
        uint64 endTime;
        uint64 canceledAt;
        bytes32 metadataHash;
    }

    enum InvoiceStatus {
        Nonexistent,
        Scheduled,
        Streaming,
        Matured,
        Canceled,
        Settled
    }

    mapping(bytes32 invoiceId => Invoice invoice) private _invoices;
    mapping(bytes32 invoiceId => bool exists) public invoiceExists;

    error CancellationAfterMaturity();
    error FundingAmountMismatch(uint256 expected, uint256 received);
    error HistoricalStart();
    error InvalidAmount();
    error InvalidArcUsdc(address supplied);
    error InvalidInvoiceReference();
    error InvalidPayee();
    error InvalidSchedule();
    error InvalidToken(address token);
    error InvalidRecipientDelta(uint256 expected, uint256 actual);
    error InvalidTransferDelta(uint256 expected, uint256 actual);
    error InvoiceAlreadyCanceled();
    error InvoiceAlreadyExists(bytes32 invoiceId);
    error InvoiceNotFound(bytes32 invoiceId);
    error NoClaimableAmount();
    error TimestampOverflow();
    error UnauthorizedCancellation(address caller);

    event InvoiceCreated(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed payee,
        bytes32 referenceHash,
        uint256 totalAmount,
        uint64 startTime,
        uint64 endTime,
        bytes32 metadataHash
    );
    event FundsWithdrawn(
        bytes32 indexed invoiceId, address indexed caller, address indexed payee, uint256 amount, uint256 totalWithdrawn
    );
    event InvoiceCanceled(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed payee,
        uint64 canceledAt,
        uint256 vestedAmount,
        uint256 refundedAmount
    );

    constructor(IERC20 usdc) {
        address token = address(usdc);
        if (token == address(0) || token.code.length == 0) revert InvalidToken(token);
        if (block.chainid == ARC_MAINNET_CHAIN_ID && token != ARC_MAINNET_USDC) {
            revert InvalidArcUsdc(token);
        }
        USDC = usdc;
    }

    /// @notice Creates an immutable invoice stream and atomically escrows its full amount.
    /// @param requestedStartTime Zero starts now; otherwise it must not be historical.
    function createAndFund(
        bytes32 referenceHash,
        address payee,
        uint256 totalAmount,
        uint64 requestedStartTime,
        uint64 endTime,
        bytes32 metadataHash
    ) external nonReentrant returns (bytes32 invoiceId) {
        if (referenceHash == bytes32(0)) revert InvalidInvoiceReference();
        if (payee == address(0) || payee == msg.sender || payee == address(this)) revert InvalidPayee();
        if (totalAmount == 0) revert InvalidAmount();
        if (block.timestamp > type(uint64).max) revert TimestampOverflow();

        // The preceding bound check proves this conversion cannot truncate.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 currentTime = uint64(block.timestamp);
        uint64 startTime = requestedStartTime == 0 ? currentTime : requestedStartTime;
        if (startTime < currentTime) revert HistoricalStart();
        if (endTime <= startTime) revert InvalidSchedule();

        invoiceId = computeInvoiceId(msg.sender, referenceHash);
        if (invoiceExists[invoiceId]) revert InvoiceAlreadyExists(invoiceId);

        invoiceExists[invoiceId] = true;
        _invoices[invoiceId] = Invoice({
            payer: msg.sender,
            payee: payee,
            totalAmount: totalAmount,
            withdrawnAmount: 0,
            refundedAmount: 0,
            startTime: startTime,
            endTime: endTime,
            canceledAt: 0,
            metadataHash: metadataHash
        });
        totalOutstandingLiability += totalAmount;

        uint256 balanceBefore = USDC.balanceOf(address(this));
        USDC.safeTransferFrom(msg.sender, address(this), totalAmount);
        uint256 balanceAfter = USDC.balanceOf(address(this));
        uint256 received = balanceAfter >= balanceBefore ? balanceAfter - balanceBefore : 0;
        if (received != totalAmount) revert FundingAmountMismatch(totalAmount, received);

        emit InvoiceCreated(invoiceId, msg.sender, payee, referenceHash, totalAmount, startTime, endTime, metadataHash);
    }

    /// @notice Sends all currently claimable funds to the immutable payee.
    /// @dev Anyone may trigger the claim, but no caller can redirect or size it.
    function withdraw(bytes32 invoiceId) external nonReentrant returns (uint256 amount) {
        Invoice storage invoice = _existingInvoice(invoiceId);
        amount = _vestedAmount(invoice, block.timestamp) - invoice.withdrawnAmount;
        if (amount == 0) revert NoClaimableAmount();

        invoice.withdrawnAmount += amount;
        totalOutstandingLiability -= amount;
        _safeExactTransfer(invoice.payee, amount);

        // Emitting after the transfer means a successful event always corresponds to
        // completed token movement. nonReentrant prevents callback log reordering.
        // forge-lint: disable-next-line(reentrancy-events)
        emit FundsWithdrawn(invoiceId, msg.sender, invoice.payee, amount, invoice.withdrawnAmount);
    }

    /// @notice Stops future vesting and atomically refunds all unvested funds to the payer.
    function cancel(bytes32 invoiceId) external nonReentrant returns (uint256 refund) {
        Invoice storage invoice = _existingInvoice(invoiceId);
        if (msg.sender != invoice.payer) revert UnauthorizedCancellation(msg.sender);
        if (invoice.canceledAt != 0) revert InvoiceAlreadyCanceled();
        if (block.timestamp >= invoice.endTime) revert CancellationAfterMaturity();
        if (block.timestamp == 0 || block.timestamp > type(uint64).max) revert TimestampOverflow();

        uint256 vested = _vestedAmount(invoice, block.timestamp);
        refund = invoice.totalAmount - vested;

        // The preceding bound check proves this conversion cannot truncate.
        // forge-lint: disable-next-line(unsafe-typecast)
        invoice.canceledAt = uint64(block.timestamp);
        invoice.refundedAmount = refund;
        totalOutstandingLiability -= refund;
        _safeExactTransfer(invoice.payer, refund);

        // Emitting after the refund means a successful event always corresponds to
        // completed token movement. nonReentrant prevents callback log reordering.
        // forge-lint: disable-next-line(reentrancy-events)
        emit InvoiceCanceled(invoiceId, invoice.payer, invoice.payee, invoice.canceledAt, vested, refund);
    }

    function computeInvoiceId(address payer, bytes32 referenceHash) public view returns (bytes32) {
        return keccak256(abi.encode(INVOICE_ID_DOMAIN, block.chainid, address(this), payer, referenceHash));
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return _existingInvoice(invoiceId);
    }

    function vestedAmount(bytes32 invoiceId) public view returns (uint256) {
        return _vestedAmount(_existingInvoice(invoiceId), block.timestamp);
    }

    function claimableAmount(bytes32 invoiceId) public view returns (uint256) {
        Invoice storage invoice = _existingInvoice(invoiceId);
        return _vestedAmount(invoice, block.timestamp) - invoice.withdrawnAmount;
    }

    function refundableAmount(bytes32 invoiceId) public view returns (uint256) {
        Invoice storage invoice = _existingInvoice(invoiceId);
        if (invoice.canceledAt != 0 || block.timestamp >= invoice.endTime) return 0;
        return invoice.totalAmount - _vestedAmount(invoice, block.timestamp);
    }

    function invoiceLiability(bytes32 invoiceId) public view returns (uint256) {
        Invoice storage invoice = _existingInvoice(invoiceId);
        return invoice.totalAmount - invoice.withdrawnAmount - invoice.refundedAmount;
    }

    function invoiceStatus(bytes32 invoiceId) external view returns (InvoiceStatus) {
        if (!invoiceExists[invoiceId]) return InvoiceStatus.Nonexistent;
        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.canceledAt != 0) return InvoiceStatus.Canceled;
        if (invoiceLiability(invoiceId) == 0) return InvoiceStatus.Settled;
        if (block.timestamp < invoice.startTime) return InvoiceStatus.Scheduled;
        if (block.timestamp < invoice.endTime) return InvoiceStatus.Streaming;
        return InvoiceStatus.Matured;
    }

    function isSolvent() external view returns (bool) {
        return USDC.balanceOf(address(this)) >= totalOutstandingLiability;
    }

    function surplusBalance() external view returns (uint256) {
        uint256 balance = USDC.balanceOf(address(this));
        return balance > totalOutstandingLiability ? balance - totalOutstandingLiability : 0;
    }

    function _existingInvoice(bytes32 invoiceId) internal view returns (Invoice storage invoice) {
        if (!invoiceExists[invoiceId]) revert InvoiceNotFound(invoiceId);
        return _invoices[invoiceId];
    }

    function _vestedAmount(Invoice storage invoice, uint256 timestamp) internal view returns (uint256) {
        uint256 effectiveTime = timestamp < invoice.endTime ? timestamp : invoice.endTime;
        if (invoice.canceledAt != 0 && invoice.canceledAt < effectiveTime) {
            effectiveTime = invoice.canceledAt;
        }
        if (effectiveTime <= invoice.startTime) return 0;
        if (effectiveTime >= invoice.endTime) return invoice.totalAmount;

        return Math.mulDiv(invoice.totalAmount, effectiveTime - invoice.startTime, invoice.endTime - invoice.startTime);
    }

    function _safeExactTransfer(address recipient, uint256 amount) internal {
        uint256 balanceBefore = USDC.balanceOf(address(this));
        uint256 recipientBalanceBefore = USDC.balanceOf(recipient);
        USDC.safeTransfer(recipient, amount);
        uint256 balanceAfter = USDC.balanceOf(address(this));
        uint256 recipientBalanceAfter = USDC.balanceOf(recipient);
        uint256 sent = balanceBefore >= balanceAfter ? balanceBefore - balanceAfter : 0;
        if (sent != amount) revert InvalidTransferDelta(amount, sent);
        uint256 received =
            recipientBalanceAfter >= recipientBalanceBefore ? recipientBalanceAfter - recipientBalanceBefore : 0;
        if (received != amount) revert InvalidRecipientDelta(amount, received);
    }
}
// forge-lint: disable-end(block-timestamp)
