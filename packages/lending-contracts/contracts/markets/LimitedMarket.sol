// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./PausableMarket.sol";
import "./OwnableMarket.sol";

/**
 * @title LimitedMarket
 * @author 
 * @notice Limits the daily amount of principal that can be borrowed each day.
 * The daily issuance increase linearly every second up to the limit and decreases when a user borrows.
 * The daily issuance is recovered if the user repays to avoid DOS.
 */
contract LimitedMarket is PausableMarket {
    uint256 public dailyIssuanceLimit; //daily issuance limit, which is the maximum amount of debt tokens that the market can issue for borrowing in a day,
    uint256 private dailyIssuanceLeft; // amount of debt tokens that the limited market can still issue for borrowing on that day.
    uint256 public lastIssuanceTime;
    uint256 public constant SECONDS_PER_DAY = 86400;

    constructor(
        address priceProviderAddress,
        uint256 liquidationThreshold,
        string memory name,
        string memory symbol,
        address _debtToken,
        address _collateralToken,
        string memory baseURI,
        uint _liquidationMaxHR,
        uint _liquidationPenalty,
        uint _closingFee
    )
        PausableMarket(
            priceProviderAddress,
            liquidationThreshold,
            name,
            symbol,
            _debtToken,
            _collateralToken,
            baseURI,
            _liquidationMaxHR,
            _liquidationPenalty,
            _closingFee
        )
    {
        lastIssuanceTime = block.timestamp;
    }

    function getIssuanceLeft() public view returns (uint256) {
        uint256 timeSinceLastIssuance = block.timestamp - lastIssuanceTime;

        uint256 replenishingRate = dailyIssuanceLimit / SECONDS_PER_DAY;
        uint256 replenishinedAmount = replenishingRate * timeSinceLastIssuance;
        uint256 currentIssuanceLeft = dailyIssuanceLeft + replenishinedAmount;

        if (currentIssuanceLeft > dailyIssuanceLimit) {
            currentIssuanceLeft = dailyIssuanceLimit;
        }
        return currentIssuanceLeft;
    }

    function setDailyIssuanceLimit(uint256 newLimit) external onlyAdmin {
        dailyIssuanceLimit = newLimit;
    }

    function borrow(
        uint256 accountID,
        uint256 amount
    ) public override virtual {
        uint256 currentIssuanceLeft = getIssuanceLeft();

        require(
            currentIssuanceLeft >= amount,
            "Not enough daily issuance left for this borrow amount"
        );
        dailyIssuanceLeft = currentIssuanceLeft - amount;

        lastIssuanceTime = block.timestamp;
        super.borrow(accountID, amount);
    }

    function repay(
        uint256 accountID,
        uint256 amount
    ) public virtual override {
        uint256 currentIssuanceLeft = getIssuanceLeft();
        uint256 newDailyIssuance = currentIssuanceLeft + amount;
        dailyIssuanceLeft = newDailyIssuance > dailyIssuanceLimit ? dailyIssuanceLimit: dailyIssuanceLeft;

        super.repay(accountID, amount);

    }
}
