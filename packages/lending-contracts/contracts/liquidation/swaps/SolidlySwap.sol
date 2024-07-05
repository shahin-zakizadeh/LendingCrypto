// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {Swap} from "./Swap.sol";

import {ISolidlyRouter} from "../../interfaces/ISolidlyRouter.sol";

contract SolidlySwap is Swap {
    using SafeERC20 for IERC20;

    function _swap(
        IERC20 input, 
        IERC20, 
        uint256 amountIn,
        uint256 amountOutMin,
        bytes memory data
    ) internal override returns(uint256){
        (address routerAddress, ISolidlyRouter.route[] memory swapData) = abi.decode(data, (address, ISolidlyRouter.route[]));
        if (swapData.length == 0) {
            return amountIn;
        }
        
        input.safeIncreaseAllowance(routerAddress, amountIn);
        require(input.allowance(address(this), routerAddress) >= amountIn, "not enough allowance");
        ISolidlyRouter router = ISolidlyRouter(routerAddress);
        uint256[] memory amounts = router.swapExactTokensForTokens(amountIn, amountOutMin, swapData, address(this), block.timestamp);
        return amounts[amounts.length - 1];
    }
}

contract SolidlySwapExt is SolidlySwap {
    function swap(
        address input,
        uint256 amountIn,
        uint256 amountOutMin,
        bytes memory data
    ) external {
        _swap(IERC20(input), IERC20(address(0)), amountIn, amountOutMin, data);
    }
}