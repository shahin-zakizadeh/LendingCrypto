// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../interfaces/IPriceSource.sol";

contract MockPriceSource is IPriceSource {

    uint8 public decimals;
    uint public answer;

    constructor(uint8 _decimals, uint _answer) {
        decimals = _decimals;
        answer = _answer;
    }


    function setAnswer(uint _answer) external {
        answer = _answer;
    }

    function latestRoundData() external view override returns (uint256) {
        return answer;
    }

    function latestAnswer() external view override returns (uint256) {
        return answer;
    }
}