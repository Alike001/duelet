// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {DueletStream} from "../src/DueletStream.sol";
import {DueletStreamTestBase} from "./DueletStreamTestBase.sol";
import {FalseReturnToken} from "./mocks/FalseReturnToken.sol";
import {MalformedReturnToken} from "./mocks/MalformedReturnToken.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";
import {ReentrantUSDC} from "./mocks/ReentrantUSDC.sol";

contract DueletStreamAdversarialTest is DueletStreamTestBase {
    function testFeeOnTransferFundingRevertsAllState() public {
        bytes32 referenceHash = _reference(3_000);
        bytes32 invoiceId = duelet.computeInvoiceId(payer, referenceHash);
        uint256 payerBefore = usdc.balanceOf(payer);
        usdc.setFeeBps(100);

        vm.expectRevert(abi.encodeWithSelector(DueletStream.FundingAmountMismatch.selector, TOTAL, 9_900));
        vm.prank(payer);
        duelet.createAndFund(referenceHash, payee, TOTAL, start, start + DURATION, bytes32(0));

        assertFalse(duelet.invoiceExists(invoiceId));
        assertEq(duelet.totalOutstandingLiability(), 0);
        assertEq(usdc.balanceOf(address(duelet)), 0);
        assertEq(usdc.balanceOf(payer), payerBefore);
    }

    function testFalseReturnFundingRevertsThroughSafeERC20() public {
        FalseReturnToken token = new FalseReturnToken();
        DueletStream stream = new DueletStream(IERC20(address(token)));
        token.mint(payer, TOTAL);
        vm.prank(payer);
        token.approve(address(stream), TOTAL);

        vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(token)));
        vm.prank(payer);
        stream.createAndFund(_reference(3_001), payee, TOTAL, start, start + DURATION, bytes32(0));
        assertEq(stream.totalOutstandingLiability(), 0);
    }

    function testMalformedReturnFundingRevertsAllState() public {
        MalformedReturnToken token = new MalformedReturnToken();
        DueletStream stream = new DueletStream(IERC20(address(token)));
        token.mint(payer, TOTAL);
        vm.prank(payer);
        token.approve(address(stream), TOTAL);
        bytes32 referenceHash = _reference(3_001_001);

        vm.expectRevert();
        vm.prank(payer);
        stream.createAndFund(referenceHash, payee, TOTAL, start, start + DURATION, bytes32(0));

        assertFalse(stream.invoiceExists(stream.computeInvoiceId(payer, referenceHash)));
        assertEq(stream.totalOutstandingLiability(), 0);
    }

    function testPausedAndBlocklistedFundingRevertWithoutInvoice() public {
        bytes32 pausedReference = _reference(3_002);
        usdc.setPaused(true);
        vm.expectRevert(MockUSDC.TokenPaused.selector);
        vm.prank(payer);
        duelet.createAndFund(pausedReference, payee, TOTAL, start, start + DURATION, bytes32(0));
        assertFalse(duelet.invoiceExists(duelet.computeInvoiceId(payer, pausedReference)));

        usdc.setPaused(false);
        usdc.setBlocked(payer, true);
        bytes32 blockedReference = _reference(3_003);
        vm.expectRevert(abi.encodeWithSelector(MockUSDC.AccountBlocked.selector, payer));
        vm.prank(payer);
        duelet.createAndFund(blockedReference, payee, TOTAL, start, start + DURATION, bytes32(0));
        assertFalse(duelet.invoiceExists(duelet.computeInvoiceId(payer, blockedReference)));
    }

    function testWithdrawalTransferFailureRestoresClaimAndLiability() public {
        bytes32 invoiceId = _create(_reference(3_010));
        vm.warp(start + 18);
        usdc.setBlocked(payee, true);

        vm.expectRevert(abi.encodeWithSelector(MockUSDC.AccountBlocked.selector, payee));
        duelet.withdraw(invoiceId);

        assertEq(duelet.getInvoice(invoiceId).withdrawnAmount, 0);
        assertEq(duelet.claimableAmount(invoiceId), 1_000);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
        assertEq(usdc.balanceOf(address(duelet)), TOTAL);
    }

    function testNoOpWithdrawalIsCaughtByExactContractBalanceDelta() public {
        bytes32 invoiceId = _create(_reference(3_011));
        vm.warp(start + 18);
        usdc.setNoOpTransfers(true);

        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvalidTransferDelta.selector, 1_000, 0));
        duelet.withdraw(invoiceId);

        assertEq(duelet.getInvoice(invoiceId).withdrawnAmount, 0);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
    }

    function testFeeOnTransferWithdrawalRevertsWithoutShortPayingPayee() public {
        bytes32 invoiceId = _create(_reference(3_011_001));
        vm.warp(start + 18);
        usdc.setFeeBps(100);

        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvalidRecipientDelta.selector, 1_000, 990));
        duelet.withdraw(invoiceId);

        assertEq(duelet.getInvoice(invoiceId).withdrawnAmount, 0);
        assertEq(usdc.balanceOf(payee), 0);
        assertEq(usdc.balanceOf(address(duelet)), TOTAL);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
    }

    function testCancellationTransferFailureRestoresTimestampRefundAndLiability() public {
        bytes32 invoiceId = _create(_reference(3_012));
        vm.warp(start + 60);
        usdc.setPaused(true);

        vm.expectRevert(MockUSDC.TokenPaused.selector);
        vm.prank(payer);
        duelet.cancel(invoiceId);

        DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
        assertEq(invoice.canceledAt, 0);
        assertEq(invoice.refundedAmount, 0);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
        assertEq(usdc.balanceOf(address(duelet)), TOTAL);
    }

    function testFeeOnTransferCancellationRevertsWithoutShortPayingPayer() public {
        bytes32 invoiceId = _create(_reference(3_012_001));
        vm.warp(start + 60);
        usdc.setFeeBps(100);
        uint256 payerBalanceBefore = usdc.balanceOf(payer);

        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvalidRecipientDelta.selector, 6_667, 6_601));
        vm.prank(payer);
        duelet.cancel(invoiceId);

        DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
        assertEq(invoice.canceledAt, 0);
        assertEq(invoice.refundedAmount, 0);
        assertEq(usdc.balanceOf(payer), payerBalanceBefore);
        assertEq(usdc.balanceOf(address(duelet)), TOTAL);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
    }

    function testReentrantFundingRevertsWithoutReservingInvoice() public {
        ReentrantUSDC token = new ReentrantUSDC();
        DueletStream stream = new DueletStream(token);
        token.mint(payer, TOTAL * 2);
        vm.prank(payer);
        token.approve(address(stream), type(uint256).max);

        bytes32 outerReference = _reference(3_020);
        bytes32 callbackReference = _reference(3_021);
        token.configureCallback(
            address(stream),
            abi.encodeCall(
                stream.createAndFund, (callbackReference, payee, TOTAL, start, start + DURATION, bytes32(0))
            ),
            true,
            false
        );

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        vm.prank(payer);
        stream.createAndFund(outerReference, payee, TOTAL, start, start + DURATION, bytes32(0));

        assertFalse(stream.invoiceExists(stream.computeInvoiceId(payer, outerReference)));
        assertEq(stream.totalOutstandingLiability(), 0);
        assertEq(token.balanceOf(address(stream)), 0);
    }

    function testReentrantWithdrawalRevertsAndPreservesClaim() public {
        ReentrantUSDC token = new ReentrantUSDC();
        DueletStream stream = new DueletStream(token);
        token.mint(payer, TOTAL);
        vm.prank(payer);
        token.approve(address(stream), TOTAL);
        vm.prank(payer);
        bytes32 invoiceId = stream.createAndFund(_reference(3_030), payee, TOTAL, start, start + DURATION, bytes32(0));
        token.configureCallback(address(stream), abi.encodeCall(stream.withdraw, invoiceId), false, true);
        vm.warp(start + 18);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        stream.withdraw(invoiceId);

        assertEq(stream.getInvoice(invoiceId).withdrawnAmount, 0);
        assertEq(stream.claimableAmount(invoiceId), 1_000);
        assertEq(stream.totalOutstandingLiability(), TOTAL);
    }

    function testReentrantCancellationRevertsAndPreservesRefund() public {
        ReentrantUSDC token = new ReentrantUSDC();
        DueletStream stream = new DueletStream(token);
        token.mint(payer, TOTAL);
        vm.prank(payer);
        token.approve(address(stream), TOTAL);
        vm.prank(payer);
        bytes32 invoiceId = stream.createAndFund(_reference(3_031), payee, TOTAL, start, start + DURATION, bytes32(0));
        token.configureCallback(address(stream), abi.encodeCall(stream.cancel, invoiceId), false, true);
        vm.warp(start + 60);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        vm.prank(payer);
        stream.cancel(invoiceId);

        DueletStream.Invoice memory invoice = stream.getInvoice(invoiceId);
        assertEq(invoice.canceledAt, 0);
        assertEq(invoice.refundedAmount, 0);
        assertEq(stream.refundableAmount(invoiceId), 6_667);
        assertEq(stream.totalOutstandingLiability(), TOTAL);
    }

    function testUnsupportedTokenTransferDoesNotChangeLiabilities() public {
        bytes32 invoiceId = _create(_reference(3_040));
        MockUSDC unsupported = new MockUSDC();
        unsupported.mint(address(duelet), 999);

        assertEq(unsupported.balanceOf(address(duelet)), 999);
        assertEq(duelet.invoiceLiability(invoiceId), TOTAL);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
        assertEq(duelet.surplusBalance(), 0);
    }
}
