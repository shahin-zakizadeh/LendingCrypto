// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "../CollaterizedMarket.sol";

import "hardhat/console.sol";

abstract contract InterestModel {
    function _setInterestRate(uint256 yearlyInterestRate) virtual internal;

    function _compoundInterest() virtual internal;

    function _compoundROI(uint256 _interestYielded) virtual internal;

    function _elapsedSeconds() virtual internal view returns(uint256);

    function _INTEREST_RATE_DECIMALS() virtual internal pure returns(uint8);

    function _interestGrace(uint256 principal) virtual internal view returns(uint256);
}

/**
 * @title InterestMarket
 * @author 
 * @notice tracks interest owed on principal using index.
 * 
 * The interest index is compounded and tracks the total interest accrued to the market.
 * If a user borrows at index 1.5 and repays at index 2, he will have accried 2/1.5 = 33% of interest on his principal.
 */
abstract contract InterestMarket is CollaterizedMarket, InterestModel {
    uint8 public constant INTEREST_RATE_DECIMALS = 18;

    uint256 private interestIndex;
    uint256 private lastUpdate; 
    mapping(uint256 => uint256) private accountInterestIndex;

    function getAccountInterestIndex(uint256 accountID) external view returns(uint256) {
        return accountInterestIndex[accountID];
    }

    constructor(string memory name, string memory symbol, string memory uri) CollaterizedMarket(name, symbol, uri){
        interestIndex = 10 ** INTEREST_RATE_DECIMALS;
        lastUpdate = block.timestamp;
    }

    function _INTEREST_RATE_DECIMALS() override internal pure returns(uint8){
        return INTEREST_RATE_DECIMALS;
    }

    function _compoundROI(uint256 _roi) override internal {
        interestIndex = interestIndex * _roi / 10 ** INTEREST_RATE_DECIMALS;
        lastUpdate = block.timestamp;
    }

    function _interestIndex() internal view returns(uint256) {
        return interestIndex;
    }

    function _elapsedSeconds() override internal view returns(uint256) {
        return block.timestamp - lastUpdate;
    }

    function _principalAmount(uint256 _accountID) override internal view returns (uint256) {
        if (accountInterestIndex[_accountID] == 0) {
                return 0;
        }
        return CollaterizedMarket._principalAmount(_accountID) * interestIndex / accountInterestIndex[_accountID];
    }

    function _increasePrincipalAmount(uint256 accountID, uint256 amount) virtual internal returns (uint){
        uint256 pa = _principalAmount(accountID) + amount;
        _setPrincipalAmount(accountID, pa);
        accountInterestIndex[accountID] = interestIndex;
        return pa;
    }

    /**
     * @notice decreases the principal amount and will forget some debt accrued
     * during the grace period to let people fully repay loan. Indeed, because interest accrues over time
     * the amount paid at the time of sending the tx and when the tx is processed will not be the same.
     * For this reason, the grace period should be defined as the time it takes for
     * a tx to be confirmed.
     */
    function _decreasePrincipalAmount(uint256 accountID, uint256 amount) virtual internal returns (uint){
        uint256 pa = _principalAmount(accountID);
        uint256 graceIndexFactor = _interestGrace(pa);
        uint256 actualIndexFactor = interestIndex * 10**INTEREST_RATE_DECIMALS/ accountInterestIndex[accountID];
        uint256 gracedFactor = graceIndexFactor > actualIndexFactor ? actualIndexFactor: graceIndexFactor;
        uint256 graceInterestAmount = (pa * gracedFactor / 10 ** INTEREST_RATE_DECIMALS) - pa;
        require(pa >= amount, "Principal repaid is gt outstanding");
        pa -= amount;
        if (pa <= graceInterestAmount){
            pa = 0;
        }
        _setPrincipalAmount(accountID, pa);
        accountInterestIndex[accountID] = interestIndex;
        return pa;
    }

    function _increaseCollateralAmount(uint256 accountID, uint256 amount) virtual internal returns(uint){
        uint collateral = _collateralAmount(accountID) + amount;
        _setCollateralAmount(accountID, collateral);
        return collateral;
    }

    function _decreaseCollateralAmount(uint256 accountID, uint256 amount) virtual internal returns(uint){
        uint collateral = _collateralAmount(accountID);
        require(collateral >= amount, "Account does not have enough collateral");
        collateral -= amount;
        _setCollateralAmount(accountID, collateral);
        return collateral;
    }
}