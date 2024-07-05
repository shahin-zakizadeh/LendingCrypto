// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

abstract contract FlashLoanHandler {

    constructor() {}

    function _initiateFlashLoan(address asset, uint256 amount, bytes memory data) internal virtual;

    function _handleCallBack(address asset, uint256 repayAmount, bytes memory params) public virtual;

    function _repayFlashLoan(address asset, uint amount) internal virtual returns(uint256);
}