// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./flashloan/SolidlyFlashLoan.sol";
import "./swaps/SolidlySwap.sol";
import "./SimpleLiquidator.sol";

contract SimpleSolidlyLiqu is SimpleLiquidator, SolidlyFlashLoan, SolidlySwap {
    constructor(address treasury, address pairFactory, address pair) 
        SimpleLiquidator(treasury) 
        SolidlyFlashLoan(pairFactory, pair){}
}