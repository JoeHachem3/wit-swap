import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { ethers } from 'hardhat';
import {
  ClaimableToken,
  ClaimableToken__factory,
  WITSwap,
  WITSwap__factory,
} from '../typechain';
import { toEther, toWei, zeroAddress } from '../utils';

import chaiAsPromised from 'chai-as-promised';
import chaiSpies from 'chai-spies';

chai.use(chaiAsPromised);
chai.use(chaiSpies);

const { expect } = chai;

describe('WITSwap', function () {
  let owner: SignerWithAddress;
  let contract: WITSwap;
  let token1: ClaimableToken;
  let token2: ClaimableToken;

  beforeEach(async () => {
    const [tmp] = await ethers.getSigners();
    owner = tmp;

    const Contract = (await ethers.getContractFactory(
      'WITSwap'
    )) as WITSwap__factory;
    contract = await Contract.deploy();
    await contract.deployed();

    const ClaimableToken = (await ethers.getContractFactory(
      'ClaimableToken'
    )) as ClaimableToken__factory;
    token1 = await ClaimableToken.deploy('name1', 'T1', toWei(100), 50, 5);
    token2 = await ClaimableToken.deploy('name2', 'T2', toWei(100), 50, 5);
    await token1.deployed();
    await token2.deployed();
  });

  it('Contract: should create', () => {
    return expect(contract).to.exist;
  });

  it('#createPool 1: should reject', () => {
    return expect(
      contract.createPool(zeroAddress, toWei(10), token2.address, toWei(10))
    ).to.be.rejected;
  });

  it('#createPool 2: should reject', () => {
    return expect(
      contract.createPool(token1.address, toWei(10), zeroAddress, toWei(10))
    ).to.be.rejected;
  });

  it('#createPool 3: should reject', () => {
    return expect(contract.createPool(token1.address, 0, token2.address, 0)).to
      .be.rejected;
  });

  it('#createPool 4: should reject', async () => {
    await token1.transfer(token2.address, toWei(40));
    return expect(
      contract.createPool(token1.address, toWei(20), token2.address, toWei(20))
    ).to.eventually.be.rejected;
  });

  it('#createPool 5: should reject', async () => {
    await token2.transfer(token1.address, toWei(40));
    return expect(
      contract.createPool(token1.address, toWei(20), token2.address, toWei(20))
    ).to.eventually.be.rejected;
  });

  it('#createPool 6: should reject with POOL_EXISTS', async () => {
    await token1.approve(contract.address, toWei(50));
    await token2.approve(contract.address, toWei(50));

    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );
    return expect(
      contract.createPool(token1.address, toWei(20), token2.address, toWei(20))
    ).to.eventually.be.rejectedWith('POOL_EXISTS');
  });

  it('#createPool 7: should emit #PoolCreate, set #pools[token1.address][token2.address] and #pools[token2.address][token1.address], and transfer the right amount to the right addresses', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));

    await expect(
      contract.createPool(token1.address, toWei(30), token2.address, toWei(30))
    ).to.emit(contract, 'PoolCreated');

    const poolAddress = await contract.pools(token1.address, token2.address);

    expect(poolAddress).not.to.equal(zeroAddress);
    expect(poolAddress).to.equal(
      await contract.pools(token2.address, token1.address)
    );

    expect(await token1.balanceOf(poolAddress)).to.equal(toWei(30));
    expect(await token2.balanceOf(poolAddress)).to.equal(toWei(30));
    expect(await token1.balanceOf(owner.address)).to.equal(toWei(20));
    expect(await token2.balanceOf(owner.address)).to.equal(toWei(20));
  });

  it('#getTokenReturnedAmount 1: should reject', async () => {
    return expect(
      contract.getTokenReturnedAmount(token1.address, token2.address, toWei(20))
    ).to.eventually.be.rejected;
  });

  it('#getTokenReturnedAmount 2: should return a valid amount', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    expect(
      await contract.getTokenReturnedAmount(
        token1.address,
        token2.address,
        toWei(20)
      )
    ).not.to.equal(0);

    expect(
      await contract.getTokenReturnedAmount(
        token2.address,
        token1.address,
        toWei(20)
      )
    ).not.to.equal(0);
  });

  it('#getTokenPrice 1: should reject', () => {
    return expect(
      contract.getTokenPrice(token1.address, token2.address, toWei(20))
    ).to.eventually.be.rejected;
  });

  it('#getTokenPrice 2: should return a valid amount', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    expect(
      await contract.getTokenPrice(token1.address, token2.address, toWei(20))
    ).not.to.equal(0);

    expect(
      await contract.getTokenPrice(token2.address, token1.address, toWei(20))
    ).not.to.equal(0);
  });

  it('#getLiquidity 1: should reject', () => {
    return expect(
      contract.getLiquidity(token1.address, token2.address, toWei(20))
    ).to.eventually.be.rejected;
  });

  it('#getLiquidity 2: should return a valid amount', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    let result = await contract.getLiquidity(
      token1.address,
      token2.address,
      toWei(20)
    );
    expect(result[0]).not.to.equal(0);
    expect(result[1]).not.to.equal(0);

    result = await contract.getLiquidity(
      token2.address,
      token1.address,
      toWei(20)
    );
    expect(result[0]).not.to.equal(0);
    expect(result[1]).not.to.equal(0);
  });

  it('#sellToken 1: should reject', () => {
    return expect(
      contract.sellToken(token1.address, token2.address, toWei(20), toWei(5))
    ).to.eventually.be.rejected;
  });

  it('#sellToken 2: should sell token1', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    const pool = await contract.pools(token1.address, token2.address);

    await token1.approve(pool, toWei(50));
    await (
      await contract.sellToken(
        token1.address,
        token2.address,
        toWei(20),
        toWei(5)
      )
    ).wait();

    expect(await token1.balanceOf(owner.address)).to.equal('0');
    expect(
      +toEther((await token2.balanceOf(owner.address)).toString())
    ).to.be.greaterThan(20);
  });

  it('#sellToken 3: should sell token2', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    const pool = await contract.pools(token1.address, token2.address);

    await token2.approve(pool, toWei(50));
    await (
      await contract.sellToken(
        token2.address,
        token1.address,
        toWei(20),
        toWei(5)
      )
    ).wait();

    expect(await token2.balanceOf(owner.address)).to.equal('0');
    expect(
      +toEther((await token1.balanceOf(owner.address)).toString())
    ).to.be.greaterThan(20);
  });

  it('#sellToken 4: should emit Swapped', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    const pool = await contract.pools(token1.address, token2.address);

    await token1.approve(pool, toWei(50));

    await expect(
      contract.sellToken(token1.address, token2.address, toWei(20), toWei(5))
    ).to.emit(contract, 'Swapped');
  });

  it('#buyToken 1: should reject', () => {
    return expect(
      contract.buyToken(token1.address, token2.address, toWei(20), toWei(50))
    ).to.eventually.be.rejected;
  });

  it('#buyToken 2: should buy token2', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    const pool = await contract.pools(token1.address, token2.address);

    await token1.approve(pool, toWei(50));

    await (
      await contract.buyToken(
        token1.address,
        token2.address,
        toWei(10),
        toWei(50)
      )
    ).wait();

    expect(await token2.balanceOf(owner.address)).to.equal(toWei(30));

    expect(
      +toEther((await token1.balanceOf(owner.address)).toString())
    ).to.be.lessThan(30);
  });

  it('#buyToken 3: should buy token1', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    const pool = await contract.pools(token1.address, token2.address);

    await token2.approve(pool, toWei(50));

    await (
      await contract.buyToken(
        token2.address,
        token1.address,
        toWei(10),
        toWei(50)
      )
    ).wait();

    expect(await token1.balanceOf(owner.address)).to.equal(toWei(30));

    expect(
      +toEther((await token2.balanceOf(owner.address)).toString())
    ).to.be.lessThan(30);
  });

  it('#buyToken 4: should emit Swapped', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    const pool = await contract.pools(token1.address, token2.address);

    await token1.approve(pool, toWei(50));
    await token2.approve(pool, toWei(50));

    await expect(
      contract.buyToken(token1.address, token2.address, toWei(5), toWei(10))
    ).to.emit(contract, 'Swapped');
  });

  it('#provideLiquidity 1: should reject', () => {
    return expect(
      contract.provideLiquidity(
        token1.address,
        toWei(50),
        token2.address,
        toWei(50)
      )
    ).to.eventually.rejected;
  });

  it('#provideLiquidity 2: should emit LiquidityProvided', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    const pool = await contract.pools(token1.address, token2.address);

    await token1.approve(pool, toWei(20));
    await token2.approve(pool, toWei(20));

    await expect(
      contract.provideLiquidity(
        token1.address,
        toWei(10),
        token2.address,
        toWei(10)
      )
    ).to.emit(contract, 'LiquidityProvided');

    await expect(
      contract.provideLiquidity(
        token2.address,
        toWei(10),
        token1.address,
        toWei(10)
      )
    ).to.emit(contract, 'LiquidityProvided');
  });

  it('#withdrawLiquidity 1: should reject', () => {
    return expect(
      contract.withdrawLiquidity(
        token1.address,
        toWei(1),
        token2.address,
        toWei(1),
        toWei(1)
      )
    ).to.eventually.rejected;
  });

  it('#withdrawLiquidity 2: should witdhraw liquidity', async () => {
    await token1.approve(contract.address, toWei(10));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(10),
      token2.address,
      toWei(30)
    );

    await (
      await contract.withdrawLiquidity(
        token1.address,
        toWei(10),
        token2.address,
        toWei(30),
        toWei(1)
      )
    ).wait();

    expect(await token1.balanceOf(owner.address)).to.equal(toWei(50));
    expect(await token2.balanceOf(owner.address)).to.equal(toWei(50));

    expect(await contract.pools(token1.address, token2.address)).to.equal(
      zeroAddress
    );
    expect(await contract.pools(token2.address, token1.address)).to.equal(
      zeroAddress
    );
  });

  it('#withdrawLiquidity 3: should witdhraw liquidity', async () => {
    await token1.approve(contract.address, toWei(10));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(10),
      token2.address,
      toWei(30)
    );

    await (
      await contract.withdrawLiquidity(
        token2.address,
        toWei(15),
        token1.address,
        toWei(5),
        toWei(0.5)
      )
    ).wait();

    expect(await token1.balanceOf(owner.address)).to.equal(toWei(45));
    expect(await token2.balanceOf(owner.address)).to.equal(toWei(35));
  });

  it('#withdrawLiquidity 4: should emit LiquidityWithdrawn', async () => {
    await token1.approve(contract.address, toWei(30));
    await token2.approve(contract.address, toWei(30));
    await contract.createPool(
      token1.address,
      toWei(30),
      token2.address,
      toWei(30)
    );

    await expect(
      contract.withdrawLiquidity(
        token1.address,
        toWei(30),
        token2.address,
        toWei(30),
        toWei(1)
      )
    ).to.emit(contract, 'LiquidityWithdrawn');
  });
});
