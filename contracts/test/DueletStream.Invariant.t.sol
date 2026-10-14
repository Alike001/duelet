// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {Test} from "forge-std/Test.sol";
import {DueletStream} from "../src/DueletStream.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract DueletInvariantHandler is Test {
    DueletStream public immutable duelet;
    MockUSDC public immutable usdc;
    address public immutable payer;

    bytes32[] private _invoiceIds;
    address[] private _payees;
    mapping(bytes32 invoiceId => uint256 vested) public greatestObservedVested;

    constructor(DueletStream duelet_, MockUSDC usdc_, address payer_) {
        duelet = duelet_;
        usdc = usdc_;
        payer = payer_;
    }

    function register(bytes32 invoiceId, address payee) external {
        require(msg.sender == address(this) || _invoiceIds.length < 3, "registration closed");
        _invoiceIds.push(invoiceId);
        _payees.push(payee);
        _observe(invoiceId);
    }

    function advanceTime(uint256 secondsSeed) external {
        vm.warp(block.timestamp + bound(secondsSeed, 0, 300));
        _observeAll();
    }

    function withdraw(uint256 invoiceSeed) external {
        bytes32 invoiceId = _invoiceIds[bound(invoiceSeed, 0, _invoiceIds.length - 1)];
        try duelet.withdraw(invoiceId) {} catch {}
        _observe(invoiceId);
    }

    function cancel(uint256 invoiceSeed) external {
        bytes32 invoiceId = _invoiceIds[bound(invoiceSeed, 0, _invoiceIds.length - 1)];
        vm.prank(payer);
        try duelet.cancel(invoiceId) {} catch {}
        _observe(invoiceId);
    }

    function settle(uint256 invoiceSeed) external {
        bytes32 invoiceId = _invoiceIds[bound(invoiceSeed, 0, _invoiceIds.length - 1)];
        DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
        // forge-lint: disable-next-line(block-timestamp)
        if (invoice.canceledAt == 0 && block.timestamp < invoice.endTime) vm.warp(invoice.endTime);
        try duelet.withdraw(invoiceId) {} catch {}
        _observe(invoiceId);
    }

    function invoiceCount() external view returns (uint256) {
        return _invoiceIds.length;
    }

    function invoiceIdAt(uint256 index) external view returns (bytes32) {
        return _invoiceIds[index];
    }

    function payeeAt(uint256 index) external view returns (address) {
        return _payees[index];
    }

    function _observeAll() private {
        for (uint256 index = 0; index < _invoiceIds.length; ++index) {
            _observe(_invoiceIds[index]);
        }
    }

    function _observe(bytes32 invoiceId) private {
        uint256 vested = duelet.vestedAmount(invoiceId);
        assertGe(vested, greatestObservedVested[invoiceId], "vesting decreased");
        greatestObservedVested[invoiceId] = vested;
    }
}

contract DueletStreamInvariantTest is StdInvariant, Test {
    DueletStream private duelet;
    MockUSDC private usdc;
    DueletInvariantHandler private handler;
    address private payer;

    function setUp() public {
        vm.warp(1_800_000_000);
        payer = makeAddr("invariant-payer");
        usdc = new MockUSDC();
        duelet = new DueletStream(usdc);
        handler = new DueletInvariantHandler(duelet, usdc, payer);
        usdc.mint(payer, 60_000);
        vm.prank(payer);
        usdc.approve(address(duelet), type(uint256).max);

        uint64 start = uint64(block.timestamp);
        for (uint256 index = 0; index < 3; ++index) {
            address payee = makeAddr(string.concat("invariant-payee-", vm.toString(index)));
            vm.prank(payer);
            bytes32 invoiceId = duelet.createAndFund(
                keccak256(abi.encode("invariant-reference", index)),
                payee,
                10_000 + (index * 5_000),
                start,
                start + uint64(180 * (index + 1)),
                bytes32(index)
            );
            handler.register(invoiceId, payee);
        }

        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = handler.advanceTime.selector;
        selectors[1] = handler.withdraw.selector;
        selectors[2] = handler.cancel.selector;
        selectors[3] = handler.settle.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    function invariantAggregateLiabilityEqualsInvoiceSumAndIsCovered() public view {
        uint256 liabilitySum;
        for (uint256 index = 0; index < handler.invoiceCount(); ++index) {
            liabilitySum += duelet.invoiceLiability(handler.invoiceIdAt(index));
        }
        assertEq(duelet.totalOutstandingLiability(), liabilitySum);
        assertGe(usdc.balanceOf(address(duelet)), liabilitySum);
    }

    function invariantNoInvoiceOverwithdrawsOrOverrefunds() public view {
        for (uint256 index = 0; index < handler.invoiceCount(); ++index) {
            bytes32 invoiceId = handler.invoiceIdAt(index);
            DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
            assertLe(invoice.withdrawnAmount, duelet.vestedAmount(invoiceId));
            assertLe(invoice.withdrawnAmount + invoice.refundedAmount, invoice.totalAmount);
            assertEq(
                invoice.totalAmount,
                invoice.withdrawnAmount + invoice.refundedAmount + duelet.invoiceLiability(invoiceId)
            );
        }
    }

    function invariantCancellationPreservesVestedEntitlement() public view {
        for (uint256 index = 0; index < handler.invoiceCount(); ++index) {
            bytes32 invoiceId = handler.invoiceIdAt(index);
            DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
            if (invoice.canceledAt != 0) {
                uint256 vested = duelet.vestedAmount(invoiceId);
                assertEq(invoice.refundedAmount + vested, invoice.totalAmount);
                assertEq(duelet.invoiceLiability(invoiceId), vested - invoice.withdrawnAmount);
            }
            assertGe(duelet.vestedAmount(invoiceId), handler.greatestObservedVested(invoiceId));
        }
    }

    function invariantWithdrawalsOnlyReachImmutablePayees() public view {
        for (uint256 index = 0; index < handler.invoiceCount(); ++index) {
            bytes32 invoiceId = handler.invoiceIdAt(index);
            DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
            address immutablePayee = handler.payeeAt(index);
            assertEq(invoice.payee, immutablePayee);
            assertEq(usdc.balanceOf(immutablePayee), invoice.withdrawnAmount);
        }
        assertEq(usdc.balanceOf(address(handler)), 0);
    }
}
