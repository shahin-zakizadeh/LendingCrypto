// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMarket {
    function deposit(uint256 accountID, uint256 amount) external;
    function withdraw(
        uint256 accountID,
        uint256 amount
    ) external;
    function borrow(
        uint256 accountID,
        uint256 amount
    ) external;
    function repay(uint256 accountID, uint256 amount) external;
    function liquidate(uint256 accountID, uint amountLiquidated) external returns(uint256);
    function claimLiquidationRewards() external returns(uint256);
    function collateralToken() external returns(IERC20);
    function debtToken() external returns(IERC20);
}