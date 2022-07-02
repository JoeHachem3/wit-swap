// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LPToken} from './LPToken.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract LiquidityPool is Ownable {
  ERC20 public immutable token1Address;
  ERC20 public immutable token2Address;
  uint256 public token1Balance;
  uint256 public token2Balance;
  LPToken public lpToken;
  uint256 private _ammConstant;
  uint256 private constant _FEE = 0.003 ether;

  constructor(
    address account_,
    ERC20 token1Address_,
    uint256 token1Amount_,
    ERC20 token2Address_,
    uint256 token2Amount_
  )
    Ownable()
    validAddress(account_)
    validAddress(address(token1Address_))
    validAddress(address(token2Address_))
  {
    require(address(token1Address_) != address(token2Address_), 'SAME_TOKEN');

    token1Address = token1Address_;
    token2Address = token2Address_;

    token1Balance += token1Amount_;
    token2Balance += token2Amount_;

    _ammConstant = token1Balance * token2Balance;

    token1Address_.transferFrom(msg.sender, address(this), token1Amount_);
    token2Address_.transferFrom(msg.sender, address(this), token2Amount_);

    string memory name = string(
      bytes.concat(
        bytes(token1Address_.symbol()),
        '-LP-',
        bytes(token2Address_.symbol())
      )
    );
    lpToken = new LPToken(name, name);

    lpToken.mint(account_, 1 ether);
  }

  // Modifiers
  modifier validAddress(address account) {
    require(account != address(0), 'INVALID_ADDRESS');
    _;
  }

  // Functions
  function updateAmmConstant() private {
    _ammConstant = token1Balance * token2Balance;
  }

  function getToken1ReturnedAmount(uint256 token2Amount_)
    public
    view
    returns (uint256 amount)
  {
    amount =
      token1Balance -
      (_ammConstant /
        (token2Balance + ((token2Amount_ * (1 ether - _FEE)) / 1 ether)));

    require(amount != token1Balance, 'INSUFFICIENT_FUNDS');
  }

  function getToken2ReturnedAmount(uint256 token1Amount_)
    public
    view
    returns (uint256 amount)
  {
    amount =
      token2Balance -
      (_ammConstant /
        (token1Balance + ((token1Amount_ * (1 ether - _FEE)) / 1 ether)));

    require(amount != token2Balance, 'INSUFFICIENT_FUNDS');
  }

  function getToken1Price(uint256 token1Amount_)
    public
    view
    returns (uint256 price)
  {
    require(token1Balance >= token1Amount_, 'INSUFFICIENT_FUNDS');

    price = _ammConstant / (token1Balance - token1Amount_) - token2Balance;
    price += (_FEE * price) / 1 ether;
  }

  function getToken2Price(uint256 token2Amount_)
    public
    view
    returns (uint256 price)
  {
    require(token2Balance >= token2Amount_, 'INSUFFICIENT_FUNDS');

    price = _ammConstant / (token2Balance - token2Amount_) - token1Balance;
    price += (_FEE * price) / 1 ether;
  }

  function getLiquidity(uint256 lpTokenAmount_)
    public
    view
    returns (uint256 token1Amount, uint256 token2Amount)
  {
    if (lpTokenAmount_ == 0) {
      token1Amount = 0;
      token2Amount = 0;
    } else {
      uint256 liquidityInversePercentage = (lpToken.totalSupply() * 1 ether) /
        lpTokenAmount_;
      token1Amount = (token1Balance * 1 ether) / liquidityInversePercentage;
      token2Amount = (token2Balance * 1 ether) / liquidityInversePercentage;
    }
  }

  function sellToken1(
    address account_,
    uint256 token1Amount_,
    uint256 minAmountReturned_
  ) public onlyOwner returns (uint256 amount) {
    amount = getToken2ReturnedAmount(token1Amount_);

    require(amount >= minAmountReturned_, 'SLIPPAGE');

    uint256 accountBalance = token1Address.balanceOf(account_);

    require(accountBalance >= token1Amount_, 'INSUFFICIENT_FUNDS');

    token1Balance += token1Amount_;
    token2Balance -= amount;

    updateAmmConstant();

    token2Address.transfer(account_, amount);
    token1Address.transferFrom(account_, address(this), token1Amount_);
  }

  function sellToken2(
    address account_,
    uint256 token2Amount_,
    uint256 minAmountReturned_
  ) public onlyOwner returns (uint256 amount) {
    amount = getToken1ReturnedAmount(token2Amount_);

    require(amount >= minAmountReturned_, 'SLIPPAGE');

    uint256 accountBalance = token2Address.balanceOf(account_);

    require(accountBalance >= token2Amount_, 'INSUFFICIENT_FUNDS');

    token1Balance -= amount;
    token2Balance += token2Amount_;

    updateAmmConstant();

    token1Address.transfer(account_, amount);
    token2Address.transferFrom(account_, address(this), token2Amount_);
  }

  function buyToken1(
    address account_,
    uint256 token1Amount_,
    uint256 maxPrice_
  ) public onlyOwner returns (uint256 amount) {
    amount = getToken1Price(token1Amount_);

    require(amount <= maxPrice_, 'SLIPPAGE');

    uint256 accountBalance = token2Address.balanceOf(account_);

    require(accountBalance >= amount, 'INSUFFICIENT_FUNDS');

    token1Balance -= token1Amount_;
    token2Balance += amount;

    updateAmmConstant();

    token1Address.transfer(account_, token1Amount_);
    token2Address.transferFrom(account_, address(this), amount);
  }

  function buyToken2(
    address account_,
    uint256 token2Amount_,
    uint256 maxPrice_
  ) public onlyOwner returns (uint256 amount) {
    amount = getToken2Price(token2Amount_);

    require(amount <= maxPrice_, 'SLIPPAGE');

    uint256 accountBalance = token1Address.balanceOf(account_);

    require(accountBalance >= amount, 'INSUFFICIENT_FUNDS');

    token1Balance += amount;
    token2Balance -= token2Amount_;

    updateAmmConstant();

    token2Address.transfer(account_, token2Amount_);
    token1Address.transferFrom(account_, address(this), amount);
  }

  function provideLiquidity(
    address account_,
    uint256 token1Amount_,
    uint256 token2Amount_
  ) external onlyOwner {
    uint256 accountToken1Balance = token1Address.balanceOf(account_);
    uint256 accountToken2Balance = token2Address.balanceOf(account_);

    require(accountToken1Balance >= token1Amount_, 'INSUFFICIENT_FUNDS');
    require(accountToken2Balance >= token2Amount_, 'INSUFFICIENT_FUNDS');

    uint256 token1ExpectedBalance = token1Balance + token1Amount_;
    uint256 token2ExpectedBalance = token2Balance + token2Amount_;

    uint256 token1LiquidityInversePercentage = (token1ExpectedBalance *
      1 ether) / token1Amount_;
    uint256 token2LiquidityInversePercentage = (token2ExpectedBalance *
      1 ether) / token2Amount_;
    uint256 liquidityInversePercentage = token1LiquidityInversePercentage;

    if (token2LiquidityInversePercentage < token1LiquidityInversePercentage) {
      token2Amount_ =
        (token2Balance * 1 ether) /
        (token1LiquidityInversePercentage - 1 ether);
    } else if (
      token2LiquidityInversePercentage > token1LiquidityInversePercentage
    ) {
      token1Amount_ =
        (token1Balance * 1 ether) /
        (token2LiquidityInversePercentage - 1 ether);
      liquidityInversePercentage = token2LiquidityInversePercentage;
    }

    token1Balance += token1Amount_;
    token2Balance += token2Amount_;

    updateAmmConstant();

    token1Address.transferFrom(account_, address(this), token1Amount_);
    token2Address.transferFrom(account_, address(this), token2Amount_);

    lpToken.mint(
      account_,
      (lpToken.totalSupply() * 1 ether) / liquidityInversePercentage
    );
  }

  function withdrawLiquidity(
    address account_,
    uint256 lpTokenAmount_,
    uint256 minToken1AmountReturned_,
    uint256 minToken2AmountReturned_
  ) external onlyOwner returns (bool isPoolEmpty) {
    uint256 accountBalance = lpToken.balanceOf(account_);
    require(accountBalance >= lpTokenAmount_, 'INSUFFICIENT_FUNDS');

    (
      uint256 accountToken1Liquidity,
      uint256 accountToken2Liquidity
    ) = getLiquidity(lpTokenAmount_);

    require(accountToken1Liquidity >= minToken1AmountReturned_, 'SLIPPAGE');
    require(accountToken2Liquidity >= minToken2AmountReturned_, 'SLIPPAGE');

    token1Balance -= accountToken1Liquidity;
    token2Balance -= accountToken2Liquidity;

    updateAmmConstant();

    token1Address.transfer(account_, accountToken1Liquidity);
    token2Address.transfer(account_, accountToken2Liquidity);

    lpToken.burn(account_, lpTokenAmount_);

    isPoolEmpty = lpToken.totalSupply() == 0;
  }
}
