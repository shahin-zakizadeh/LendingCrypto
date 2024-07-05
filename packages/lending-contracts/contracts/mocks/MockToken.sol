// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    uint8 dec;

    constructor(uint8 _decimals, string memory _name, string memory _symbol) ERC20(_name, _symbol) {
        dec = _decimals;
    }

    function decimals() public view virtual override returns (uint8) {
        return dec;
    }

    function mint(address _account, uint256 _amount) external {
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _amount) external {
        _burn(_account, _amount);
    }
}
