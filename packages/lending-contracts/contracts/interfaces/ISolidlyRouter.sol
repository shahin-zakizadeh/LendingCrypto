// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISolidlyRouter {
    
    struct route {
        address from;
        address to;
        bool stable;
    }

    function factory() external view returns(address);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        route[] calldata routes,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts); 
}

