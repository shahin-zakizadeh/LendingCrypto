// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../oracles/interfaces/AggregatorV3Interface.sol";

contract MockAggregatorV3 is AggregatorV3Interface {

    uint80 roundId;
    int256 answer;
    uint256 startedAt;
    uint256 updatedAt;
    uint80 answeredInRound;

    function setAnswer(
        uint80 _roundId,
        int256 _answer,
        uint256 _startedAt,
        uint256 _updatedAt,
        uint80 _answeredInRound
    ) external {
        roundId = _roundId;
        answer = _answer;
        startedAt = _startedAt;
        updatedAt = _updatedAt;
        answeredInRound = _answeredInRound;
    }

    function decimals() external view returns (uint8) {
        return 8;
    }

    function description() external view returns (string memory){
        return "mock aggregator";
    }

    function version() external view returns (uint256){
        return 90;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId)
    external
    view
    returns (uint80, int256, uint256, uint256, uint80) {
        return (_roundId, answer, startedAt, updatedAt, answeredInRound);
    }

    function latestRoundData()
    external
    view
    returns (uint80, int256, uint256, uint256, uint80) {
        return (roundId, answer, startedAt, updatedAt, answeredInRound);
    }

    function latestAnswer() external view returns (int256){
        return answer;
    }


}