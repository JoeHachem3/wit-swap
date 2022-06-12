// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'hardhat/console.sol';

contract ClaimableToken is ERC20 {
  uint256 private _claimableAmount;
  uint256 private immutable _amountPerClaim;
  mapping(address => bool) private _claimers;

  constructor(
    string memory name_,
    string memory symbol_,
    uint256 totalSupply_,
    uint8 claimablePercentage_,
    uint256 numberOfClaimers_
  ) ERC20(name_, symbol_) {
    _claimableAmount = (totalSupply_ * claimablePercentage_) / 100;
    _amountPerClaim = _claimableAmount / numberOfClaimers_;
    _mint(address(this), totalSupply_);
    _transfer(address(this), msg.sender, totalSupply_ - _claimableAmount);
  }

  // Errors
  /// @notice Token Claim for this Wallet is not Eligible.
  error NotEligible(address account, address tokenAddress);

  // Functions
  function checkClaimEligibility(address account_) public view returns (bool) {
    return !_claimers[account_] && _claimableAmount != 0;
  }

  function claim() public {
    if (!checkClaimEligibility(msg.sender)) {
      revert NotEligible(msg.sender, address(this));
    }

    uint256 amountPerClaim = _amountPerClaim;

    _claimableAmount -= amountPerClaim;
    _claimers[msg.sender] = true;

    _transfer(address(this), msg.sender, amountPerClaim);
  }
}
