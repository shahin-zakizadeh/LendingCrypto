// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract Swap {
    function _swap(IERC20 input, IERC20 output, uint256 amountIn, uint256 amountOutMin, bytes memory data) internal virtual returns(uint256);
}