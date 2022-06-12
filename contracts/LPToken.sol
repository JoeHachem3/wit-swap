// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract LPToken is Ownable, ERC20 {
  constructor(string memory _name, string memory _symbol)
    Ownable()
    ERC20(_name, _symbol)
  {}

  // Functions
  function mint(address account_, uint256 amount_) external onlyOwner {
    _mint(account_, amount_);
  }

  function burn(address account_, uint256 amount_) external onlyOwner {
    _burn(account_, amount_);
  }
}
