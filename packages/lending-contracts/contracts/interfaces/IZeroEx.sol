// SPDX-License-Identifier:Apache-2.0
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IZeroEx {
    struct Transformation {
        // The deployment nonce for the transformer.
        // The address of the transformer contract will be derived from this
        // value.
        uint32 deploymentNonce;
        // Arbitrary data to pass to the transformer.
        bytes data;
    }

    /// @dev Executes a series of transformations to convert an ERC20 `inputToken`
    ///      to an ERC20 `outputToken`.
    /// @param inputToken The token being provided by the sender.
    ///        If `0xeee...`, ETH is implied and should be provided with the call.`
    /// @param outputToken The token to be acquired by the sender.
    ///        `0xeee...` implies ETH.
    /// @param inputTokenAmount The amount of `inputToken` to take from the sender.
    /// @param minOutputTokenAmount The minimum amount of `outputToken` the sender
    ///        must receive for the entire transformation to succeed.
    /// @param transformations The transformations to execute on the token balance(s)
    ///        in sequence.
    /// @return outputTokenAmount The amount of `outputToken` received by the sender.
    function transformERC20(
        IERC20 inputToken,
        IERC20 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] calldata transformations
    ) external payable returns (uint256 outputTokenAmount);
}