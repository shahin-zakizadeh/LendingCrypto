// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {Swap} from "./Swap.sol";

import {IZeroEx} from "../../interfaces/IZeroEx.sol";

contract ZeroExSwap is Swap {
    using SafeERC20 for IERC20;

    function _swap(
        IERC20 input, 
        IERC20 output, 
        uint256 amountIn,
        uint256 amountOutMin,
        bytes memory data
    ) internal override returns(uint256){
        (address routerAddress, bytes memory swapData) = abi.decode(data, (address, bytes));
        input.safeApprove(routerAddress, amountIn);
        IZeroEx router = IZeroEx(routerAddress);
        IZeroEx.Transformation[] memory transformations = abi.decode(swapData, (IZeroEx.Transformation[]));
        return router.transformERC20(
            input, 
            output, 
            amountIn, 
            amountOutMin, 
            transformations
        );
    }
}