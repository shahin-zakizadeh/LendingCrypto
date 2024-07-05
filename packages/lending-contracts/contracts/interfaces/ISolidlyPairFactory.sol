// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISolidlyPairFactory {
    function getFee(bool _stable) external returns(uint256);
}

