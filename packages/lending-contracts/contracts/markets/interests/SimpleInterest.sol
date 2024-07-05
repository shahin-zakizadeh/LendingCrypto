// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "./InterestMarket.sol";

/// @title Create a vault with compound interest
abstract contract SimpleInterest is InterestMarket {

    uint256 private interestRate;
    uint256 private gracePeriod;

    event InterestAccrued(uint256 interestYield, uint256 timeElapsed);

    function _setInterestRate(uint256 _yearlyInterestRate) override virtual internal {
        _compoundInterest();
        interestRate =  _yearlyInterestRate / 365 days;
    }

    function APR() external view returns(uint256) {
        return interestRate * 365 days;
    }

    function roiSinceCompound() internal view returns(uint256) {
        return _elapsedSeconds() * interestRate + 10 ** _INTEREST_RATE_DECIMALS();
    }

    /// @dev compounds the interest every second and updates the interest index and vault interest index
    /// @notice elapsedSeconds Calculate the elapsed time in seconds since the last update
    function _compoundInterest() override virtual internal {
        uint256 roi = roiSinceCompound();
        _compoundROI(roi);
        emit InterestAccrued(roi, _elapsedSeconds());
    }

    function _getGracePeriod() internal view returns(uint256) {
        return gracePeriod;
    }

    function _setGracePeriod(uint256 grace) internal {
        gracePeriod = grace;
    }

    function _interestGrace(uint256) override virtual internal view returns(uint256) {
        return (interestRate * gracePeriod) + 10 ** _INTEREST_RATE_DECIMALS();
    }
}