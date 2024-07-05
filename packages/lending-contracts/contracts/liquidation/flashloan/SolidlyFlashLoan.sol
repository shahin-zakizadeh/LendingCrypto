// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {ISolidlyPairFactory} from "../../interfaces/ISolidlyPairFactory.sol";
import {ISolidlyPair} from "../../interfaces/ISolidlyPair.sol";

import "./FlashLoanHandler.sol";

abstract contract SolidlyFlashLoan is FlashLoanHandler {
    using SafeERC20 for ERC20;

    ISolidlyPair public immutable pair;
    ISolidlyPairFactory public immutable pairFactory;

    struct HookParams {
        address asset;
        uint amount;
        bytes data;
    }

    constructor(address _pairFactory, address _pair) FlashLoanHandler() {
        pairFactory = ISolidlyPairFactory(_pairFactory);
        pair = ISolidlyPair(_pair);
    }

    function _initiateFlashLoan(address asset, uint256 amount, bytes memory data) internal virtual override {
        (address token0,) = pair.tokens();
        (uint256 amount0, uint256 amount1) = asset == token0? (amount, uint256(0)): (uint256(0), amount);
        pair.swap(amount0, amount1, address(this), abi.encode(HookParams(asset, amount, data)));
    }

    function hook(
        address iniator,
        uint256,
        uint256,
        bytes memory data
    ) public {
        require(msg.sender == address(pair));
        require(iniator == address(this));
        HookParams memory params = abi.decode(data, (HookParams));
        // Add fees to the amount borrowed
        uint toRepay = params.amount * (pairFactory.getFee(pair.stable())+10001) / 10000;
        _handleCallBack(params.asset, toRepay, params.data);
    }

    function _repayFlashLoan(address asset, uint256 amount) internal virtual override returns(uint256){
        (address token0, address token1) = pair.tokens();
        bool shouldRepay0 = token0 != asset;
        ERC20 repay = ERC20(shouldRepay0? token0: token1);
        uint256 repayBalance = repay.balanceOf(address(this));
        repay.safeTransfer(address(pair), repayBalance);
        return ERC20(asset).balanceOf(address(this));
    }
}

contract SolidlyFlashLoanTest is SolidlyFlashLoan {
    constructor(address _pairFactory, address _pair) SolidlyFlashLoan(_pairFactory, _pair){}

    function flash(address asset, uint256 amount, bytes memory data) external {
        _initiateFlashLoan(asset, amount, data);
    }

    function _handleCallBack(address asset, uint amount, bytes memory) public virtual override {
        _repayFlashLoan(asset, amount);
    }
}