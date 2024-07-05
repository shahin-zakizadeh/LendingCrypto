// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IFlashLoanSimpleReceiver} from '@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol';
import {IPoolAddressesProvider} from '@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol';
import {IPool} from '@aave/core-v3/contracts/interfaces/IPool.sol';

import "./FlashLoanHandler.sol";

abstract contract AaaveFlashLoan is FlashLoanHandler, IFlashLoanSimpleReceiver {
    using SafeERC20 for ERC20;
    IPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
    IPool public immutable override POOL;

    constructor(address provider) FlashLoanHandler() {
        ADDRESSES_PROVIDER = IPoolAddressesProvider(provider);
        POOL = IPool(ADDRESSES_PROVIDER.getPool());
    }

    function _initiateFlashLoan(address asset, uint256 amount, bytes memory data) internal virtual override {
        POOL.flashLoanSimple(address(this), asset, amount, data, 0);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address iniator, // initiator
        bytes memory params
    ) public override returns (bool) {
        require(msg.sender == address(POOL));
        require(iniator == address(this));
        uint256 amountToRepay = amount + premium;
        _handleCallBack(asset, amountToRepay, params);
    }

    function _repayFlashLoan(address asset, uint amount) internal virtual override returns(uint256) {
        ERC20 erc20 = ERC20(asset);
        erc20.safeApprove(address(POOL), amount);
        return erc20.balanceOf(address(this)) - amount;
    }

}