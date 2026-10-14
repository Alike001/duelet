// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {DueletStream} from "../src/DueletStream.sol";
import {DueletStreamTestBase} from "./DueletStreamTestBase.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

contract DueletStreamFuzzTest is DueletStreamTestBase {
    function testFuzzVestingMatchesFloorDivision(uint128 rawAmount, uint32 rawDuration, uint32 rawElapsed) public {
        uint256 amount = bound(uint256(rawAmount), 1, type(uint128).max);
        uint64 duration = uint64(bound(uint256(rawDuration), 1, 10 * 365 days));
        uint64 elapsed = uint64(bound(uint256(rawElapsed), 0, duration));
        usdc.mint(payer, amount);

        vm.prank(payer);
        bytes32 invoiceId = duelet.createAndFund(_reference(amount), payee, amount, start, start + duration, bytes32(0));
        vm.warp(start + elapsed);

        uint256 expected = elapsed == duration ? amount : Math.mulDiv(amount, elapsed, duration);
        assertEq(duelet.vestedAmount(invoiceId), expected);
        assertEq(duelet.claimableAmount(invoiceId), expected);
        assertEq(duelet.refundableAmount(invoiceId), amount - expected);
    }

    function testFuzzCancellationReconcilesAnyTimingAndPriorClaim(
        uint128 rawAmount,
        uint32 rawDuration,
        uint32 rawClaimTime,
        uint32 rawCancelTime
    ) public {
        uint256 amount = bound(uint256(rawAmount), 1, type(uint128).max);
        uint64 duration = uint64(bound(uint256(rawDuration), 2, 365 days));
        uint64 cancelElapsed = uint64(bound(uint256(rawCancelTime), 0, duration - 1));
        uint64 claimElapsed = uint64(bound(uint256(rawClaimTime), 0, cancelElapsed));
        usdc.mint(payer, amount);

        vm.prank(payer);
        bytes32 invoiceId =
            duelet.createAndFund(_reference(amount ^ duration), payee, amount, start, start + duration, bytes32(0));

        vm.warp(start + claimElapsed);
        uint256 vestedAtClaim = Math.mulDiv(amount, claimElapsed, duration);
        if (vestedAtClaim != 0) duelet.withdraw(invoiceId);

        vm.warp(start + cancelElapsed);
        uint256 vestedAtCancel = Math.mulDiv(amount, cancelElapsed, duration);
        vm.prank(payer);
        uint256 refund = duelet.cancel(invoiceId);
        assertEq(refund, amount - vestedAtCancel);
        assertEq(duelet.claimableAmount(invoiceId), vestedAtCancel - vestedAtClaim);

        if (vestedAtCancel > vestedAtClaim) duelet.withdraw(invoiceId);
        DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
        assertEq(invoice.withdrawnAmount, vestedAtCancel);
        assertEq(invoice.refundedAmount, amount - vestedAtCancel);
        assertEq(invoice.withdrawnAmount + invoice.refundedAmount, amount);
        assertEq(duelet.invoiceLiability(invoiceId), 0);
        assertEq(duelet.totalOutstandingLiability(), 0);
    }

    function testFuzzSequentialClaimsNeverExceedCurrentVesting(
        uint128 rawAmount,
        uint32 rawDuration,
        uint32 t1Seed,
        uint32 t2Seed,
        uint32 t3Seed
    ) public {
        uint256 amount = bound(uint256(rawAmount), 1, type(uint128).max);
        uint64 duration = uint64(bound(uint256(rawDuration), 3, 365 days));
        uint64 t1 = uint64(bound(uint256(t1Seed), 0, duration));
        uint64 t2 = uint64(bound(uint256(t2Seed), t1, duration));
        uint64 t3 = uint64(bound(uint256(t3Seed), t2, duration));
        usdc.mint(payer, amount);

        vm.prank(payer);
        bytes32 invoiceId =
            duelet.createAndFund(_reference(amount ^ t1 ^ t2 ^ t3), payee, amount, start, start + duration, bytes32(0));

        uint64[3] memory times = [t1, t2, t3];
        for (uint256 index = 0; index < times.length; ++index) {
            vm.warp(start + times[index]);
            uint256 claimable = duelet.claimableAmount(invoiceId);
            if (claimable != 0) duelet.withdraw(invoiceId);
            DueletStream.Invoice memory invoice = duelet.getInvoice(invoiceId);
            assertLe(invoice.withdrawnAmount, duelet.vestedAmount(invoiceId));
        }

        uint256 expected = t3 == duration ? amount : Math.mulDiv(amount, t3, duration);
        assertEq(duelet.getInvoice(invoiceId).withdrawnAmount, expected);
        assertEq(duelet.invoiceLiability(invoiceId), amount - expected);
    }

    function testFuzzMultipleInvoicesKeepExactAggregate(uint8 rawCount, uint96 rawAmount) public {
        uint256 count = bound(uint256(rawCount), 2, 12);
        uint256 amount = bound(uint256(rawAmount), 1, type(uint96).max);
        usdc.mint(payer, amount * count);
        bytes32[] memory ids = new bytes32[](count);

        for (uint256 index = 0; index < count; ++index) {
            vm.prank(payer);
            ids[index] =
                duelet.createAndFund(_reference(index + 1_000), payee, amount, start, start + DURATION, bytes32(index));
        }

        vm.warp(start + 90);
        for (uint256 index = 0; index < count; index += 2) {
            if (duelet.claimableAmount(ids[index]) != 0) duelet.withdraw(ids[index]);
        }

        uint256 expectedLiability;
        for (uint256 index = 0; index < count; ++index) {
            expectedLiability += duelet.invoiceLiability(ids[index]);
        }
        assertEq(duelet.totalOutstandingLiability(), expectedLiability);
        assertEq(usdc.balanceOf(address(duelet)), expectedLiability);
    }

    function testFuzzDuplicateReferenceCannotReplay(bytes32 referenceHash) public {
        vm.assume(referenceHash != bytes32(0));
        bytes32 invoiceId = _create(referenceHash);
        vm.expectRevert(abi.encodeWithSelector(DueletStream.InvoiceAlreadyExists.selector, invoiceId));
        vm.prank(payer);
        duelet.createAndFund(referenceHash, payee, TOTAL, start, start + DURATION, bytes32(0));
    }

    function testVeryLargeAmountUsesOverflowSafeMulDiv() public {
        MockUSDC largeToken = new MockUSDC();
        DueletStream largeDuelet = new DueletStream(largeToken);
        uint256 amount = type(uint256).max;
        largeToken.mint(payer, amount);
        vm.prank(payer);
        largeToken.approve(address(largeDuelet), amount);
        vm.prank(payer);
        bytes32 invoiceId = largeDuelet.createAndFund(_reference(2_000), payee, amount, start, start + 3, bytes32(0));
        vm.warp(start + 2);
        assertEq(largeDuelet.vestedAmount(invoiceId), Math.mulDiv(amount, 2, 3));
    }
}
