// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LiquidityPool} from './LiquidityPool.sol';
import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';

struct DualTokens {
  ERC20 token1Address;
  uint256 token1Balance;
  ERC20 token2Address;
  uint256 token2Balance;
}

contract WITSwap {
  mapping(address => mapping(address => LiquidityPool)) public pools;

  // Events
  event PoolCreated(
    address indexed account,
    address indexed token1Address,
    address indexed token2Address,
    address liquidityPoolAddress
  );
  event Swapped(
    address indexed account,
    address indexed token1Address,
    uint256 token1Amount,
    address indexed token2Address,
    uint256 token2Amount
  );
  event LiquidityProvided(
    address indexed account,
    address indexed token1Address,
    uint256 token1Amount,
    address indexed token2Address,
    uint256 token2Amount
  );
  event LiquidityWithdrawn(
    address indexed account,
    address indexed token1Address,
    address indexed token2Address,
    uint256 lpTokenAmount
  );

  // Modifiers
  modifier poolShouldNotExist(address token1Address, address token2Address) {
    require(
      address(pools[token1Address][token2Address]) == address(0),
      'POOL_EXISTS'
    );
    _;
  }

  modifier poolShouldExist(address token1Address, address token2Address) {
    require(
      address(pools[token1Address][token2Address]) != address(0),
      'POOL_DOES_NOT_EXIST'
    );
    _;
  }

  modifier validAddress(address account) {
    require(account != address(0), 'INVALID_ADDRESS');
    _;
  }

  // Functions
  receive() external payable {}

  fallback() external payable {}

  function _getLiquidityPoolAddress(
    address _account,
    ERC20 _token1Address,
    uint256 _token1Amount,
    ERC20 _token2Address,
    uint256 _token2Amount,
    bytes32 _salt
  ) private view returns (address poolAddress) {
    bytes memory bytecode = abi.encodePacked(
      type(LiquidityPool).creationCode,
      abi.encode(
        _account,
        _token1Address,
        _token1Amount,
        _token2Address,
        _token2Amount
      )
    );

    bytes32 hash = keccak256(
      abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
    );

    poolAddress = address(uint160(uint256(hash)));
  }

  function createPool(
    address token1Address_,
    uint256 token1Amount_,
    address token2Address_,
    uint256 token2Amount_
  )
    external
    poolShouldNotExist(token1Address_, token2Address_)
    validAddress(token1Address_)
    validAddress(token2Address_)
  {
    require(token1Amount_ != 0 && token2Amount_ != 0, 'NO_LIQUIDITY_PROVIDED');

    DualTokens memory tokens;
    tokens.token1Address = ERC20(token1Address_);
    tokens.token1Balance = tokens.token1Address.balanceOf(msg.sender);
    tokens.token2Address = ERC20(token2Address_);
    tokens.token2Balance = tokens.token2Address.balanceOf(msg.sender);

    require(tokens.token1Balance >= token1Amount_, 'INSUFFICIENT_FUNDS');
    require(tokens.token2Balance >= token2Amount_, 'INSUFFICIENT_FUNDS');

    bytes32 salt_ = bytes32(block.timestamp);

    tokens.token1Address.transferFrom(msg.sender, address(this), token1Amount_);
    tokens.token2Address.transferFrom(msg.sender, address(this), token2Amount_);

    address liquidityPoolAddress = _getLiquidityPoolAddress(
      msg.sender,
      tokens.token1Address,
      token1Amount_,
      tokens.token2Address,
      token2Amount_,
      salt_
    );

    tokens.token1Address.approve(liquidityPoolAddress, token1Amount_);
    tokens.token2Address.approve(liquidityPoolAddress, token2Amount_);

    LiquidityPool liquidityPool = new LiquidityPool{salt: salt_}(
      msg.sender,
      tokens.token1Address,
      token1Amount_,
      tokens.token2Address,
      token2Amount_
    );

    pools[token1Address_][token2Address_] = liquidityPool;
    pools[token2Address_][token1Address_] = liquidityPool;

    emit PoolCreated(
      msg.sender,
      token1Address_,
      token2Address_,
      liquidityPoolAddress
    );
  }

  function getTokenReturnedAmount(
    address ttsAddress_,
    address ttbAddress_,
    uint256 ttsAmount_
  )
    external
    view
    poolShouldExist(ttsAddress_, ttbAddress_)
    returns (uint256 amount)
  {
    LiquidityPool pool = pools[ttbAddress_][ttsAddress_];

    if (ttsAddress_ == address(pool.token1Address()))
      amount = pool.getToken2ReturnedAmount(ttsAmount_);
    else amount = pool.getToken1ReturnedAmount(ttsAmount_);
  }

  function getTokenPrice(
    address ttsAddress_,
    address ttbAddress_,
    uint256 ttbAmount_
  )
    external
    view
    poolShouldExist(ttsAddress_, ttbAddress_)
    returns (uint256 amount)
  {
    LiquidityPool pool = pools[ttbAddress_][ttsAddress_];

    if (ttsAddress_ == address(pool.token1Address()))
      amount = pool.getToken2Price(ttbAmount_);
    else amount = pool.getToken1Price(ttbAmount_);
  }

  function getLiquidity(
    address token1Address_,
    address token2Address_,
    uint256 lpTokenAmount_
  )
    external
    view
    poolShouldExist(token1Address_, token2Address_)
    returns (uint256 token1Amount, uint256 token2Amount)
  {
    LiquidityPool pool = pools[token1Address_][token2Address_];
    if (token1Address_ == address(pool.token1Address()))
      (token1Amount, token2Amount) = pool.getLiquidity(lpTokenAmount_);
    else (token2Amount, token1Amount) = pool.getLiquidity(lpTokenAmount_);
  }

  function sellToken(
    address ttsAddress_,
    address ttbAddress_,
    uint256 ttsAmount_,
    uint256 minAmountReturned_
  ) external poolShouldExist(ttsAddress_, ttbAddress_) {
    LiquidityPool pool = pools[ttbAddress_][ttsAddress_];

    uint256 amount;
    if (ttsAddress_ == address(pool.token1Address()))
      amount = pool.sellToken1(msg.sender, ttsAmount_, minAmountReturned_);
    else amount = pool.sellToken2(msg.sender, ttsAmount_, minAmountReturned_);

    emit Swapped(msg.sender, ttsAddress_, ttsAmount_, ttbAddress_, amount);
  }

  function buyToken(
    address ttsAddress_,
    address ttbAddress_,
    uint256 ttbAmount_,
    uint256 maxPrice_
  ) external poolShouldExist(ttsAddress_, ttbAddress_) {
    LiquidityPool pool = pools[ttbAddress_][ttsAddress_];

    uint256 amount;
    if (ttsAddress_ == address(pool.token1Address()))
      amount = pool.buyToken2(msg.sender, ttbAmount_, maxPrice_);
    else amount = pool.buyToken1(msg.sender, ttbAmount_, maxPrice_);

    emit Swapped(msg.sender, ttsAddress_, amount, ttbAddress_, ttbAmount_);
  }

  function provideLiquidity(
    address token1Address_,
    uint256 token1Amount_,
    address token2Address_,
    uint256 token2Amount_
  ) external poolShouldExist(token1Address_, token2Address_) {
    LiquidityPool pool = pools[token1Address_][token2Address_];

    if (token1Address_ == address(pool.token1Address()))
      pool.provideLiquidity(msg.sender, token1Amount_, token2Amount_);
    else pool.provideLiquidity(msg.sender, token2Amount_, token1Amount_);

    emit LiquidityProvided(
      msg.sender,
      token1Address_,
      token1Amount_,
      token2Address_,
      token2Amount_
    );
  }

  function withdrawLiquidity(
    address token1Address_,
    uint256 minToken1AmountReturned_,
    address token2Address_,
    uint256 minToken2AmountReturned_,
    uint256 lpTokenAmount_
  ) external poolShouldExist(token1Address_, token2Address_) {
    LiquidityPool pool = pools[token1Address_][token2Address_];

    bool isPoolEmpty;
    if (token1Address_ == address(pool.token1Address()))
      isPoolEmpty = pool.withdrawLiquidity(
        msg.sender,
        lpTokenAmount_,
        minToken1AmountReturned_,
        minToken2AmountReturned_
      );
    else
      isPoolEmpty = pool.withdrawLiquidity(
        msg.sender,
        lpTokenAmount_,
        minToken2AmountReturned_,
        minToken1AmountReturned_
      );

    if (isPoolEmpty) {
      delete pools[token1Address_][token2Address_];
      delete pools[token2Address_][token1Address_];
    }

    emit LiquidityWithdrawn(
      msg.sender,
      token1Address_,
      token2Address_,
      lpTokenAmount_
    );
  }
}
