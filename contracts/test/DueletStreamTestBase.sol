// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {Test} from "forge-std/Test.sol";
import {DueletStream} from "../src/DueletStream.sol";
import {MockUSDC} from "./mocks/MockUSDC.sol";

abstract contract DueletStreamTestBase is Test {
    uint256 internal constant TOTAL = 10_000;
    uint64 internal constant DURATION = 180;

    address internal payer = makeAddr("payer");
    address internal payee = makeAddr("payee");
    address internal caller = makeAddr("claim-caller");

    MockUSDC internal usdc;
    DueletStream internal duelet;
    uint64 internal start;

    function setUp() public virtual {
        vm.warp(1_800_000_000);
        usdc = new MockUSDC();
        duelet = new DueletStream(usdc);
        start = uint64(block.timestamp);
        usdc.mint(payer, 1_000_000_000_000);
        vm.prank(payer);
        usdc.approve(address(duelet), type(uint256).max);
    }

    function _create(bytes32 referenceHash) internal returns (bytes32 invoiceId) {
        vm.prank(payer);
        invoiceId = duelet.createAndFund(referenceHash, payee, TOTAL, start, start + DURATION, keccak256("metadata"));
    }

    function _reference(uint256 seed) internal pure returns (bytes32) {
        return keccak256(abi.encode("invoice", seed));
    }
}
