// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IMarket.sol";

import "./flashloan/FlashLoanHandler.sol";
import "./swaps/Swap.sol";

import "hardhat/console.sol";

abstract contract SimpleLiquidator is FlashLoanHandler, Swap {
    using SafeERC20 for IERC20;

    struct LiquidationParams {
        address market;
        uint256[] accounts;
        uint256[] amounts;
        bytes swapData;
    }

    address treasury;

    constructor(address _treasury){
        treasury = _treasury;
    }

    function liquidate(
        address flashLoanAsset,
        uint flashLoanAmount,
        bytes memory liquidationParams
    ) external {
        _initiateFlashLoan(flashLoanAsset, flashLoanAmount, liquidationParams);
    }

    function _handleCallBack(address principal, uint256 loanAmount, bytes memory params) public override {

        LiquidationParams memory liqu = abi.decode(params, (LiquidationParams));
        IMarket market = IMarket(liqu.market);
        IERC20 liquPrincipal = market.debtToken();
        IERC20 liquCollateral = market.collateralToken();
        liquPrincipal.safeIncreaseAllowance(liqu.market, type(uint256).max);
        require(address(liquPrincipal) == principal, "Wrong loan?");
        for(uint256 i = 0; i < liqu.accounts.length; i++){
            market.liquidate(liqu.accounts[i], liqu.amounts[i]);
        }
        uint256 collateralOut = market.claimLiquidationRewards();
        _swap(liquCollateral, liquPrincipal, collateralOut, loanAmount, liqu.swapData);

        uint256 profit = _repayFlashLoan(principal, loanAmount);
        liquPrincipal.safeTransfer(treasury, profit);
    }
}