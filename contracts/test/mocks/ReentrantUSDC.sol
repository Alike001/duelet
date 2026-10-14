// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {MockUSDC} from "./MockUSDC.sol";

contract ReentrantUSDC is MockUSDC {
    address public callbackTarget;
    bytes public callbackData;
    bool public callbackOnTransferFrom;
    bool public callbackOnTransfer;
    bool private _insideCallback;

    function configureCallback(address target, bytes calldata data, bool onTransferFrom, bool onTransfer) external {
        callbackTarget = target;
        callbackData = data;
        callbackOnTransferFrom = onTransferFrom;
        callbackOnTransfer = onTransfer;
    }

    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        bool result = super.transferFrom(from, to, value);
        if (callbackOnTransferFrom) _callback();
        return result;
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        bool result = super.transfer(to, value);
        if (callbackOnTransfer && msg.sender == callbackTarget) _callback();
        return result;
    }

    function _callback() private {
        if (_insideCallback || callbackTarget == address(0)) return;
        _insideCallback = true;
        (bool success, bytes memory returnData) = callbackTarget.call(callbackData);
        _insideCallback = false;
        if (!success) {
            assembly ("memory-safe") {
                revert(add(returnData, 0x20), mload(returnData))
            }
        }
    }
}
