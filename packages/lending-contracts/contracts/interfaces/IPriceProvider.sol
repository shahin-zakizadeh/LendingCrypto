// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPriceProvider {
  function getSafePrice(address token) external view returns (uint256);

  function getCurrentPrice(address token) external view returns (uint256);

  function updateSafePrice(address token) external returns (uint256);

  function BASE_TOKEN() external view returns (address);

  function DECIMALS() external view returns (uint8);
  
}
