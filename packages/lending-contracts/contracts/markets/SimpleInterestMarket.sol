// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "./LimitedMarket.sol";
import "./interests/SimpleInterest.sol";

/**
 * @title SimpleInterestMarket
 * @author 
 * @notice Implements simple interest on principal. The interest is compounded on every withdraw, borrow, repay and liquidation.
 */
contract SimpleInterestMarket is LimitedMarket, SimpleInterest {
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
    ) LimitedMarket (
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

    function principalAmount(uint256 accountID) external override view virtual returns(uint256) {
        return InterestMarket._principalAmount(accountID) * roiSinceCompound() / 10**_INTEREST_RATE_DECIMALS();
    }

    function interestIndex() external view returns(uint256) {
        return _interestIndex() * roiSinceCompound() / 10**_INTEREST_RATE_DECIMALS();
    }

    function setInterestRate(uint256 _yearlyInterestRate) external onlyAdmin {
        _setInterestRate(_yearlyInterestRate);
    }

    function _setInterestRate(uint256 _yearlyInterestRate) override(BaseMarket, SimpleInterest) virtual internal {
        SimpleInterest._setInterestRate(_yearlyInterestRate);
    }

    function _compoundInterest() override(BaseMarket, SimpleInterest) internal {
        SimpleInterest._compoundInterest();
    }

    function _interestGrace(uint256 principal) override(BaseMarket, SimpleInterest) virtual internal view returns(uint256) {
        return SimpleInterest._interestGrace(principal);
    }

    function setInterestGracePeriod(uint256 gracePeriod) external onlyAdmin {
        SimpleInterest._setGracePeriod(gracePeriod);
    }

    function getGracePeriod() external view returns(uint256) {
        return _getGracePeriod();
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(OwnableMarket, ERC721Enumerable) returns (bool) {
        return OwnableMarket.supportsInterface(interfaceId);
    }
}