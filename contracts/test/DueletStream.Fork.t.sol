// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Test} from "forge-std/Test.sol";
import {DueletStream} from "../src/DueletStream.sol";

interface IImplementationProxy {
    function implementation() external view returns (address);
}

contract DueletStreamArcForkTest is Test {
    address private constant ARC_USDC = 0x3600000000000000000000000000000000000000;
    bytes32 private constant EXPECTED_RUNTIME_CODEHASH =
        0xf4ad4b494fd7d609868ae5737d5840ee903b001767718cba4f249309ff84606f;
    uint256 private constant TOTAL = 10_000;

    bool private forkEnabled;
    IERC20 private usdc;
    DueletStream private duelet;
    address private payer;
    address private payee;

    function setUp() public {
        string memory rpcUrl = vm.envOr("ARC_MAINNET_RPC_URL", string(""));
        if (bytes(rpcUrl).length == 0) return;

        uint256 forkBlock = vm.envOr("ARC_MAINNET_FORK_BLOCK", uint256(0));
        if (forkBlock == 0) vm.createSelectFork(rpcUrl);
        else vm.createSelectFork(rpcUrl, forkBlock);
        forkEnabled = true;
        payer = makeAddr("arc-fork-payer-local-only");
        payee = makeAddr("arc-fork-payee-local-only");
        usdc = IERC20(ARC_USDC);
        duelet = new DueletStream(usdc);
    }

    function testForkArcConfigurationAndDecimalDomains() public view {
        if (!forkEnabled) return;
        assertEq(block.chainid, 5042);
        assertGt(ARC_USDC.code.length, 0);
        address implementation = IImplementationProxy(ARC_USDC).implementation();
        assertGt(implementation.code.length, 0);
        assertEq(IERC20Metadata(ARC_USDC).decimals(), 6);
        assertEq(IERC20Metadata(ARC_USDC).symbol(), "USDC");
        assertEq(address(duelet.USDC()), ARC_USDC);
        assertEq(address(duelet).codehash, EXPECTED_RUNTIME_CODEHASH);

        assertEq(TOTAL, 0.01 * 1e6);
        assertEq(uint256(0.01 ether), uint256(10_000_000_000_000_000));
        assertNotEq(TOTAL, 0.01 ether);
    }

    function testForkApprovalFundingClaimCancellationAndReconciliation() public {
        if (!forkEnabled) return;

        // Arc's native and ERC-20 USDC views share one balance at 18- and 6-decimal
        // precision. This cheatcode changes fork-local EVM state only.
        vm.deal(payer, 0.01 ether);
        assertEq(usdc.balanceOf(payer), TOTAL);
        vm.prank(payer);
        usdc.approve(address(duelet), TOTAL);

        // Arc's current timestamp is safely inside uint64 for this fork-only test.
        // forge-lint: disable-next-line(unsafe-typecast)
        uint64 start = uint64(vm.getBlockTimestamp());
        vm.prank(payer);
        bytes32 invoiceId = duelet.createAndFund(
            keccak256("duelet-fork-canary"), payee, TOTAL, start, start + 180, keccak256("local-fork-only")
        );
        assertEq(usdc.balanceOf(address(duelet)), TOTAL);
        assertEq(duelet.totalOutstandingLiability(), TOTAL);

        vm.warp(start + 18);
        vm.prank(payer);
        assertEq(duelet.withdraw(invoiceId), 1_000);
        assertEq(usdc.balanceOf(payee), 1_000);

        vm.warp(start + 60);
        vm.prank(payer);
        assertEq(duelet.cancel(invoiceId), 6_667);
        vm.prank(payer);
        assertEq(duelet.withdraw(invoiceId), 2_333);

        assertEq(usdc.balanceOf(payee), 3_333);
        assertEq(usdc.balanceOf(payer), 6_667);
        assertEq(usdc.balanceOf(address(duelet)), 0);
        assertEq(duelet.invoiceLiability(invoiceId), 0);
        assertEq(duelet.totalOutstandingLiability(), 0);
        assertTrue(duelet.isSolvent());
    }
}
