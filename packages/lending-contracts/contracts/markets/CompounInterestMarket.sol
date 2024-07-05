// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "./OwnableMarket.sol";
import "./interests/CompoundInterest.sol";

contract CompoundInterestMarket is OwnableMarket, CompoundInterest {
    constructor(
        address priceProviderAddress,
        uint256 liquidationThreshold,
        string memory name,
        string memory symbol,
        address debtToken,
        address collateralToken,
        string memory baseURI,
        uint liquidationMaxHR,
        uint liquidationPenalty,
        uint closingFee
    ) OwnableMarket (
        priceProviderAddress,
        liquidationThreshold,
        name,
        symbol,
        debtToken,
        collateralToken,
        baseURI,
        liquidationMaxHR,
        liquidationPenalty,
        closingFee
    )  {}

    function setInterestRate(uint256 _yearlyInterestRate) external onlyAdmin {
        _setInterestRate(_yearlyInterestRate);
    }

    function _setInterestRate(uint256 _yearlyInterestRate) override(BaseMarket, CompoundInterest) virtual internal {
        CompoundInterest._setInterestRate(_yearlyInterestRate);
    }

    function _compoundInterest() override(BaseMarket, CompoundInterest) internal {
        CompoundInterest._compoundInterest();
    }

    function _interestGrace(uint256 principal) override(BaseMarket, CompoundInterest) virtual internal view returns(uint256) {
        return CompoundInterest._interestGrace(principal);
    }
}