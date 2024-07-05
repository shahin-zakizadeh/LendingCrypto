// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/IPriceProvider.sol";

contract MockPriceProvider is IPriceProvider {
    uint8 public decimals;
    mapping(address => uint256) answer;

    constructor(uint8 _decimals) {
        decimals = _decimals;
    }

    function setSafePrice(address token, uint256 _answer) external {
        answer[token] = _answer;
    }

    function getSafePrice(
        address token
    ) external view override returns (uint256) {
        return answer[token];
    }

    function getCurrentPrice(
        address token
    ) external view override returns (uint256) {
        return answer[token];
    }

    function updateSafePrice(
        address token
    ) external override returns (uint256) {
        return answer[token];
    }

    function DECIMALS() external view returns (uint8) {
        return decimals;
    }

    function BASE_TOKEN() external view override returns (address) {
    }
}

