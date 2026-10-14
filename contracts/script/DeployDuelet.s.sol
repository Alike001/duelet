// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Script} from "forge-std/Script.sol";
import {DueletStream} from "../src/DueletStream.sol";

/// @notice Deterministic Arc mainnet deployment entry point. It does not read a
/// private key; wallet selection and broadcasting remain explicit CLI actions.
contract DeployDuelet is Script {
    uint256 private constant ARC_MAINNET_CHAIN_ID = 5042;
    address private constant ARC_MAINNET_USDC = 0x3600000000000000000000000000000000000000;

    error WrongChain(uint256 actual);

    function run() external returns (DueletStream stream) {
        if (block.chainid != ARC_MAINNET_CHAIN_ID) revert WrongChain(block.chainid);

        vm.startBroadcast();
        stream = new DueletStream(IERC20(ARC_MAINNET_USDC));
        vm.stopBroadcast();
    }
}
