// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "../../lib/ABDKMath64x64.sol";

import "./InterestMarket.sol";

/// @title Create a vault with compound interest
abstract contract CompoundInterest is InterestModel {
    using ABDKMath64x64 for int128;

    int128 private interestRate;
    uint256 private gracePeriod;

    function _setInterestRate(uint256 _yearlyInterestRate) override virtual internal {
        interestRate = ABDKMath64x64.add(
            ABDKMath64x64.divu(
                _yearlyInterestRate,
                10 ** _INTEREST_RATE_DECIMALS() * 365 days
            ),
            ABDKMath64x64.fromUInt(1)
        );
    }

    function APR() external view returns (uint) {
        uint year = 365 days;
        int128 apr = ABDKMath64x64.mul(interestRate.sub(ABDKMath64x64.fromUInt(1)), ABDKMath64x64.fromUInt(year));
        return ABDKMath64x64.mulu(apr, 10 ** _INTEREST_RATE_DECIMALS());
    }

    function APY() external view returns (uint){
        uint year = 365 days;
        return ABDKMath64x64.toUInt(interestRate.pow(year).sub(ABDKMath64x64.fromUInt(1)).mul(ABDKMath64x64.fromUInt(10 ** _INTEREST_RATE_DECIMALS())));
    }

    /// @dev compounds the interest every second and updates the interest index and vault interest index
    /// @notice elapsedSeconds Calculate the elapsed time in seconds since the last update
    function _compoundInterest() override virtual internal {
        //Early return if interestRate has been updates in this block already
        uint256 elapsedSeconds = _elapsedSeconds();
        if (elapsedSeconds == 0) {
            return;
        }
        uint256 roi = ABDKMath64x64.toUInt(
            interestRate.pow(elapsedSeconds).mul(
                ABDKMath64x64.fromUInt(10 ** _INTEREST_RATE_DECIMALS())
            )
        );
        _compoundROI(roi);
    }

    function _interestGrace(uint256 principal) override virtual internal view returns(uint256) {
        return principal * ABDKMath64x64.mulu(ABDKMath64x64.mul(interestRate, ABDKMath64x64.fromUInt(gracePeriod)), 10 ** _INTEREST_RATE_DECIMALS()) / 10 ** _INTEREST_RATE_DECIMALS();
    }
}