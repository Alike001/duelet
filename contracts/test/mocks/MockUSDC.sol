// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    uint256 public feeBps;
    bool public noOpTransfers;
    bool public paused;
    mapping(address account => bool blocked) public blocked;

    error AccountBlocked(address account);
    error TokenPaused();

    constructor() ERC20("Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }

    function setFeeBps(uint256 newFeeBps) external {
        require(newFeeBps <= 10_000, "fee too high");
        feeBps = newFeeBps;
    }

    function setNoOpTransfers(bool enabled) external {
        noOpTransfers = enabled;
    }

    function setPaused(bool enabled) external {
        paused = enabled;
    }

    function setBlocked(address account, bool enabled) external {
        blocked[account] = enabled;
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        if (paused && from != address(0) && to != address(0)) revert TokenPaused();
        if (blocked[from]) revert AccountBlocked(from);
        if (blocked[to]) revert AccountBlocked(to);

        if (from != address(0) && to != address(0)) {
            if (noOpTransfers) return;
            uint256 fee = (value * feeBps) / 10_000;
            if (fee != 0) {
                super._update(from, to, value - fee);
                super._update(from, address(0), fee);
                return;
            }
        }
        super._update(from, to, value);
    }
}
