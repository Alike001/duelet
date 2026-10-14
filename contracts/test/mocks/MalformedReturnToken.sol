// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

contract MalformedReturnToken {
    mapping(address account => uint256 amount) public balanceOf;
    mapping(address owner => mapping(address spender => uint256 amount)) public allowance;

    function mint(address recipient, uint256 amount) external {
        balanceOf[recipient] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address, uint256) external pure returns (bool) {
        assembly ("memory-safe") {
            mstore(0, 1)
            return(31, 1)
        }
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        assembly ("memory-safe") {
            mstore(0, 1)
            return(31, 1)
        }
    }
}
