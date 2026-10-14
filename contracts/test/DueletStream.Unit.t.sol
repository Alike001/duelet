// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {DueletStream} from "../src/DueletStream.sol";
import {DueletStreamTestBase} from "./DueletStreamTestBase.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract DueletStreamUnitTest is DueletStreamTestBase {
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

    function testConstructorRejectsZeroAndNonContractToken() public {
        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvalidToken.selector, address(0)));
        new DueletStream(MockUSDC(address(0)));

        address noCode = makeAddr("no-code-token");
        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvalidToken.selector, noCode));
        new DueletStream(MockUSDC(noCode));
    }

    function testArcMainnetRejectsWrongAsset() public {
        vm.chainId(5042);
        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvalidArcUsdc.selector, address(usdc)));
        new DueletStream(usdc);
    }

    function testFirstInvoiceCreationStoresAndFundsExactState() public {
        bytes32 referenceHash = _reference(1);
        bytes32 invoiceId = duelet.computeInvoiceId(payer, referenceHash);
        bytes32 metadataHash = keccak256("metadata");

        vm.expectEmit(true, true, true, true, address(duelet));
        emit InvoiceCreated(invoiceId, payer, payee, referenceHash, TOTAL, start, start + DURATION, metadataHash);
        vm.prank(payer);
        bytes32 returnedId = duelet.createAndFund(referenceHash, payee, TOTAL, start, start + DURATION, metadataHash);

        assertEq(returnedId, invoiceId);
        assertTrue(duelet.invoiceExists(invoiceId));
        DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
        assertEq(invoice.payer, payer);
        assertEq(invoice.payee, payee);
        assertEq(invoice.totalAmount, TOTAL);
        assertEq(invoice.withdrawnAmount, 0);
        assertEq(invoice.refundedAmount, 0);
        assertEq(invoice.startTime, start);
        assertEq(invoice.endTime, start + DURATION);
        assertEq(invoice.canceledAt, 0);
        assertEq(invoice.metadataHash, metadataHash);
        assertEq(usdc.balanceOf(address(duelet)), TOTAL);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
        assertTrue(duelet.isSolvent());
    }

    function testZeroRequestedStartResolvesToCurrentTimestamp() public {
        bytes32 referenceHash = _reference(2);
        vm.prank(payer);
        bytes32 invoiceId =
            duelet.createAndFund(referenceHash, payee, TOTAL, 0, uint64(block.timestamp + DURATION), bytes32(0));
        assertEq(duelet.getInvoice(invoiceId).startTime, block.timestamp);
    }

    function testMultipleInvoicesRemainIndependent() public {
        bytes32 first = _create(_reference(10));
        bytes32 second = _create(_reference(11));
        assertNotEq(first, second);
        assertEq(duelet.totalOutstandingLiability(), TOTAL * 2);

        vm.warp(start + 90);
        duelet.withdraw(first);
        assertEq(duelet.invoiceLiability(first), 5_000);
        assertEq(duelet.invoiceLiability(second), TOTAL);
        assertEq(duelet.totalOutstandingLiability(), 15_000);
        assertEq(usdc.balanceOf(address(duelet)), 15_000);
    }

    function testDuplicateReferenceRevertsWithoutTakingMoreFunds() public {
        bytes32 referenceHash = _reference(20);
        bytes32 invoiceId = _create(referenceHash);
        uint256 payerBalance = usdc.balanceOf(payer);

        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvoiceAlreadyExists.selector, invoiceId));
        vm.prank(payer);
        duelet.createAndFund(referenceHash, payee, TOTAL, start, start + DURATION, bytes32(0));

        assertEq(usdc.balanceOf(payer), payerBalance);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
    }

    function testDifferentPayersCanUseSameReference() public {
        bytes32 referenceHash = _reference(21);
        bytes32 first = _create(referenceHash);
        address secondPayer = makeAddr("second-payer");
        usdc.mint(secondPayer, TOTAL);
        vm.startPrank(secondPayer);
        usdc.approve(address(duelet), TOTAL);
        bytes32 second = duelet.createAndFund(referenceHash, payee, TOTAL, start, start + DURATION, bytes32(0));
        vm.stopPrank();
        assertNotEq(first, second);
    }

    function testInvoiceIdChangesAcrossContractAndChainContext() public {
        bytes32 referenceHash = _reference(22);
        bytes32 originalId = duelet.computeInvoiceId(payer, referenceHash);
        DueletStream otherDeployment = new DueletStream(usdc);
        assertNotEq(originalId, otherDeployment.computeInvoiceId(payer, referenceHash));

        vm.chainId(99_999);
        assertNotEq(originalId, duelet.computeInvoiceId(payer, referenceHash));
    }

    function testInvalidCreationInputsRevert() public {
        vm.startPrank(payer);
        vm.expectRevert(DueletStream.InvalidInvoiceReference.selector);
        duelet.createAndFund(bytes32(0), payee, TOTAL, start, start + DURATION, bytes32(0));

        vm.expectRevert(DueletStream.InvalidPayee.selector);
        duelet.createAndFund(_reference(30), address(0), TOTAL, start, start + DURATION, bytes32(0));

        vm.expectRevert(DueletStream.InvalidPayee.selector);
        duelet.createAndFund(_reference(31), payer, TOTAL, start, start + DURATION, bytes32(0));

        vm.expectRevert(DueletStream.InvalidPayee.selector);
        duelet.createAndFund(_reference(311), address(duelet), TOTAL, start, start + DURATION, bytes32(0));

        vm.expectRevert(DueletStream.InvalidAmount.selector);
        duelet.createAndFund(_reference(32), payee, 0, start, start + DURATION, bytes32(0));
        vm.stopPrank();
    }

    function testInvalidSchedulesRevert() public {
        vm.startPrank(payer);
        vm.expectRevert(DueletStream.HistoricalStart.selector);
        duelet.createAndFund(_reference(40), payee, TOTAL, start - 1, start + DURATION, bytes32(0));

        vm.expectRevert(DueletStream.InvalidSchedule.selector);
        duelet.createAndFund(_reference(41), payee, TOTAL, start, start, bytes32(0));

        vm.expectRevert(DueletStream.InvalidSchedule.selector);
        duelet.createAndFund(_reference(42), payee, TOTAL, start + 10, start + 9, bytes32(0));
        vm.stopPrank();
    }

    function testBeforeStartPartialAndCompleteVesting() public {
        uint64 futureStart = start + 60;
        vm.prank(payer);
        bytes32 invoiceId =
            duelet.createAndFund(_reference(50), payee, TOTAL, futureStart, futureStart + DURATION, bytes32(0));
        assertEq(duelet.vestedAmount(invoiceId), 0);
        vm.warp(futureStart);
        assertEq(duelet.vestedAmount(invoiceId), 0);
        vm.warp(futureStart + 60);
        assertEq(duelet.vestedAmount(invoiceId), 3_333);
        vm.warp(futureStart + DURATION);
        assertEq(duelet.vestedAmount(invoiceId), TOTAL);
    }

    function testPermissionlessClaimPaysOnlyPayee() public {
        bytes32 invoiceId = _create(_reference(60));
        vm.warp(start + 18);
        vm.expectEmit(true, true, true, true, address(duelet));
        emit FundsWithdrawn(invoiceId, caller, payee, 1_000, 1_000);
        vm.prank(caller);
        uint256 amount = duelet.withdraw(invoiceId);
        assertEq(amount, 1_000);
        assertEq(usdc.balanceOf(payee), 1_000);
        assertEq(usdc.balanceOf(caller), 0);
        assertEq(duelet.claimableAmount(invoiceId), 0);
    }

    function testZeroClaimRevertsIncludingSameTimestampSecondClaim() public {
        bytes32 invoiceId = _create(_reference(61));
        vm.expectRevert(DueletStream.NoClaimableAmount.selector);
        duelet.withdraw(invoiceId);

        vm.warp(start + 18);
        duelet.withdraw(invoiceId);
        assertEq(duelet.vestedAmount(invoiceId), 1_000);
        vm.roll(block.number + 1);
        vm.expectRevert(DueletStream.NoClaimableAmount.selector);
        duelet.withdraw(invoiceId);
    }

    function testGoldenFixtureWithdrawalCancellationAndFinalClaim() public {
        string memory fixture = vm.readFile("../fixtures/invoice-stream-golden.json");
        uint256 total = vm.parseUint(vm.parseJsonString(fixture, ".totalAmount"));
        uint256 firstElapsed = vm.parseJsonUint(fixture, ".firstWithdrawalElapsedSeconds");
        uint256 firstWithdrawal = vm.parseUint(vm.parseJsonString(fixture, ".withdrawnBeforeCancellation"));
        uint256 cancellationElapsed = vm.parseJsonUint(fixture, ".cancellationElapsedSeconds");
        uint256 vestedAtCancellation = vm.parseUint(vm.parseJsonString(fixture, ".vestedAmountAtCancellation"));
        uint256 refund = vm.parseUint(vm.parseJsonString(fixture, ".refundedAmount"));
        uint256 finalClaim = vm.parseUint(vm.parseJsonString(fixture, ".remainingPayeeEntitlement"));

        assertEq(total, TOTAL);
        bytes32 invoiceId = _create(_reference(70));
        vm.warp(start + firstElapsed);
        assertEq(duelet.withdraw(invoiceId), firstWithdrawal);
        vm.warp(start + cancellationElapsed);

        vm.expectEmit(true, true, true, true, address(duelet));
        emit InvoiceCanceled(invoiceId, payer, payee, uint64(block.timestamp), vestedAtCancellation, refund);
        vm.prank(payer);
        assertEq(duelet.cancel(invoiceId), refund);
        assertEq(duelet.claimableAmount(invoiceId), finalClaim);
        assertEq(duelet.withdraw(invoiceId), finalClaim);

        DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
        assertEq(invoice.withdrawnAmount, vestedAtCancellation);
        assertEq(invoice.refundedAmount, refund);
        assertEq(duelet.invoiceLiability(invoiceId), 0);
        assertEq(duelet.totalOutstandingLiability(), 0);
        assertEq(usdc.balanceOf(address(duelet)), 0);
    }

    function testCancellationBeforeStartRefundsEverything() public {
        uint64 futureStart = start + 60;
        vm.prank(payer);
        bytes32 invoiceId =
            duelet.createAndFund(_reference(80), payee, TOTAL, futureStart, futureStart + DURATION, bytes32(0));
        uint256 payerBefore = usdc.balanceOf(payer);
        vm.prank(payer);
        assertEq(duelet.cancel(invoiceId), TOTAL);
        assertEq(usdc.balanceOf(payer), payerBefore + TOTAL);
        assertEq(duelet.invoiceLiability(invoiceId), 0);
    }

    function testCancellationAfterWithdrawalPreservesVestedClaim() public {
        bytes32 invoiceId = _create(_reference(81));
        vm.warp(start + 18);
        duelet.withdraw(invoiceId);
        vm.warp(start + 60);
        vm.prank(payer);
        duelet.cancel(invoiceId);
        assertEq(duelet.vestedAmount(invoiceId), 3_333);
        assertEq(duelet.claimableAmount(invoiceId), 2_333);
        vm.warp(start + DURATION + 1_000);
        assertEq(duelet.vestedAmount(invoiceId), 3_333);
        assertEq(duelet.withdraw(invoiceId), 2_333);
    }

    function testCancellationNearCompletionUsesFloorRounding() public {
        bytes32 invoiceId = _create(_reference(82));
        vm.warp(start + DURATION - 1);
        assertEq(duelet.vestedAmount(invoiceId), 9_944);
        vm.prank(payer);
        assertEq(duelet.cancel(invoiceId), 56);
        assertEq(duelet.withdraw(invoiceId), 9_944);
        assertEq(duelet.totalOutstandingLiability(), 0);
    }

    function testUnauthorizedDoubleAndMatureCancellationRevert() public {
        bytes32 invoiceId = _create(_reference(83));
        vm.expectRevert(abi.encodeWithSelector(DueletStream.UnauthorizedCancellation.selector, caller));
        vm.prank(caller);
        duelet.cancel(invoiceId);

        vm.prank(payer);
        duelet.cancel(invoiceId);
        vm.expectRevert(DueletStream.InvoiceAlreadyCanceled.selector);
        vm.prank(payer);
        duelet.cancel(invoiceId);

        bytes32 matured = _create(_reference(84));
        vm.warp(start + DURATION);
        vm.expectRevert(DueletStream.CancellationAfterMaturity.selector);
        vm.prank(payer);
        duelet.cancel(matured);
    }

    function testMaturedStreamFullyReconciles() public {
        bytes32 invoiceId = _create(_reference(90));
        vm.warp(start + DURATION);
        assertEq(uint256(duelet.invoiceStatus(invoiceId)), uint256(DueletStream.InvoiceStatus.Matured));
        assertEq(duelet.withdraw(invoiceId), TOTAL);
        assertEq(uint256(duelet.invoiceStatus(invoiceId)), uint256(DueletStream.InvoiceStatus.Settled));
        assertEq(duelet.invoiceLiability(invoiceId), 0);
    }

    function testUnsolicitedUsdcIsOnlySurplus() public {
        bytes32 invoiceId = _create(_reference(91));
        usdc.mint(address(duelet), 777);
        assertEq(duelet.surplusBalance(), 777);
        assertEq(duelet.invoiceLiability(invoiceId), TOTAL);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);
        assertEq(usdc.balanceOf(address(duelet)), TOTAL + 777);
    }

    function testMissingInvoiceViewsAndActionsRevert() public {
        bytes32 missing = _reference(999);
        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvoiceNotFound.selector, missing));
        duelet.getInvoice(missing);
        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvoiceNotFound.selector, missing));
        duelet.withdraw(missing);
        assertEq(uint256(duelet.invoiceStatus(missing)), uint256(DueletStream.InvoiceStatus.Nonexistent));
    }
}
