// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "hardhat/console.sol";
import "../accounts/MarketAccounts.sol";

/**
 * @title CollaterizedMarket
 * @author 
 * @notice Tracks the collateral amount and principal amount of accounts
 */
contract CollaterizedMarket is MarketAccounts {

    mapping(uint256 => uint256) private collateralAmount;
    mapping(uint256 => uint256) private principalAmount;
    
    constructor(string memory name, string memory symbol, string memory uri) MarketAccounts(name, symbol, uri){}

    function _principalAmount(uint256 accountID) virtual internal view returns(uint){
        return principalAmount[accountID];
    }

    function _setPrincipalAmount(uint256 accountID, uint256 principal) virtual internal {
        principalAmount[accountID] = principal;
    }

    function _collateralAmount(uint256 accountID) virtual internal view returns(uint){
        return collateralAmount[accountID];
    }

    function _setCollateralAmount(uint256 accountID, uint256 collateral) virtual internal {
        collateralAmount[accountID] = collateral;
    }

}