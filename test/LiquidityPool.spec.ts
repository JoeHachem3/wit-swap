import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { ethers } from 'hardhat';
import {
  LiquidityPool,
  ClaimableToken,
  ClaimableToken__factory,
  LiquidityPool__factory,
} from '../typechain';
import { toWei } from '../utils';
import { getContractAddress } from '@ethersproject/address';

import chaiAsPromised from 'chai-as-promised';
import chaiSpies from 'chai-spies';

chai.use(chaiAsPromised);
chai.use(chaiSpies);

const { expect } = chai;

describe('LiquidityPool', function () {
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let contract: LiquidityPool;
  let token1: ClaimableToken;
  let token2: ClaimableToken;

  beforeEach(async () => {
    const [tmp1, tmp2] = await ethers.getSigners();
    owner1 = tmp1;
    owner2 = tmp2;

    const ClaimableToken = (await ethers.getContractFactory(
      'ClaimableToken'
    )) as ClaimableToken__factory;
    token1 = await ClaimableToken.deploy('name1', 'T1', toWei(500), 50, 5);
    token2 = await ClaimableToken.deploy('name2', 'T2', toWei(500), 50, 5);

    const transactionCoung = await owner1.getTransactionCount();

    const contractAddress = getContractAddress({
      from: owner1.address,
      nonce: transactionCoung + 2,
    });

    await token1.approve(contractAddress, toWei(500));
    await token2.approve(contractAddress, toWei(500));

    const Contract = (await ethers.getContractFactory(
      'LiquidityPool'
    )) as LiquidityPool__factory;
    contract = await Contract.deploy(
      owner1.address,
      token1.address,
      toWei(100),
      token2.address,
      toWei(100)
    );
    await contract.deployed();
  });

  it('Contract: should create', () => {
    return expect(contract).to.exist;
  });

  it('#getToken1ReturnedAmount: should return the right amount', async () => {
    expect(await contract.getToken1ReturnedAmount(toWei(25))).to.equal(
      toWei('19.951971182709625776')
    );
  });

  it('#getToken2ReturnedAmount: should return the right amount', async () => {
    expect(await contract.getToken2ReturnedAmount(toWei(25))).to.equal(
      toWei('19.951971182709625776')
    );
  });

  it('#getToken1Price 1: should reject', () => {
    return expect(contract.getToken1Price(toWei(1000))).to.eventually.be
      .rejected;
  });

  it('#getToken1Price 2: should return the right amount', async () => {
    expect(await contract.getToken1Price(toWei(20))).to.equal(
      toWei('25.075000000000000000')
    );
  });

  it('#getToken2Price 1: should reject', () => {
    return expect(contract.getToken2Price(toWei(1000))).to.eventually.be
      .rejected;
  });

  it('#getToken2Price 2: should return the right amount', async () => {
    expect(await contract.getToken2Price(toWei(20))).to.equal(
      toWei('25.075000000000000000')
    );
  });

  it('#getLiquidity 1: should return the right amount', async () => {
    const [token1Amount, token2Amount] = await contract.getLiquidity(
      toWei(0.5)
    );
    expect(token1Amount).to.equal(toWei(50));
    expect(token2Amount).to.equal(toWei(50));
  });

  it('#getLiquidity 2: should return 0', async () => {
    const [token1Amount, token2Amount] = await contract.getLiquidity(toWei(0));
    expect(token1Amount).to.equal(0);
    expect(token2Amount).to.equal(0);
  });

  it('#sellToken1 1: should reject', () => {
    return expect(
      contract.connect(owner2).sellToken1(owner1.address, toWei(25), toWei(20))
    ).to.eventually.be.rejected;
  });

  it('#sellToken1 2: should reject with SLIPPAGE', () => {
    return expect(
      contract.sellToken1(owner1.address, toWei(25), toWei(21))
    ).to.eventually.be.rejectedWith('SLIPPAGE');
  });

  it('#sellToken1 3: should reject with INSUFFICIENT_FUNDS', () => {
    return expect(
      contract.sellToken1(owner2.address, toWei(25), toWei(5))
    ).to.eventually.be.rejectedWith('INSUFFICIENT_FUNDS');
  });

  it('#sellToken1 4: should transfer tokens successfully', async () => {
    await contract.sellToken1(owner1.address, toWei(25), toWei(5));

    expect(await contract.token1Balance()).to.equal(toWei(125));
    expect(await contract.token2Balance()).to.equal(
      toWei('80.048028817290374224')
    );

    expect(await token1.balanceOf(owner1.address)).to.equal(toWei(125));
    expect(await token2.balanceOf(owner1.address)).to.equal(
      toWei('169.951971182709625776')
    );
  });

  it('#sellToken2 1: should reject', () => {
    return expect(
      contract.connect(owner2).sellToken2(owner1.address, toWei(25), toWei(20))
    ).to.eventually.be.rejected;
  });

  it('#sellToken2 2: should reject with SLIPPAGE', () => {
    return expect(
      contract.sellToken2(owner1.address, toWei(25), toWei(25))
    ).to.eventually.be.rejectedWith('SLIPPAGE');
  });

  it('#sellToken2 3: should reject with INSUFFICIENT_FUNDS', () => {
    return expect(
      contract.sellToken2(owner2.address, toWei(25), toWei(5))
    ).to.eventually.be.rejectedWith('INSUFFICIENT_FUNDS');
  });

  it('#sellToken2 4: should transfer tokens successfully', async () => {
    await contract.sellToken2(owner1.address, toWei(25), toWei(5));

    expect(await contract.token2Balance()).to.equal(toWei(125));
    expect(await contract.token1Balance()).to.equal(
      toWei('80.048028817290374224')
    );

    expect(await token2.balanceOf(owner1.address)).to.equal(toWei(125));
    expect(await token1.balanceOf(owner1.address)).to.equal(
      toWei('169.951971182709625776')
    );
  });

  it('#buyToken1 1: should reject', () => {
    return expect(
      contract.connect(owner2).buyToken1(owner1.address, toWei(20), toWei(25))
    ).to.eventually.be.rejected;
  });

  it('#buyToken1 2: should reject with SLIPPAGE', () => {
    return expect(
      contract.buyToken1(owner1.address, toWei(20), toWei(20))
    ).to.eventually.be.rejectedWith('SLIPPAGE');
  });

  it('#buyToken1 3: should reject with INSUFFICIENT_FUNDS', () => {
    return expect(
      contract.buyToken1(owner2.address, toWei(20), toWei(30))
    ).to.eventually.be.rejectedWith('INSUFFICIENT_FUNDS');
  });

  it('#buyToken1 4: should transfer tokens successfully', async () => {
    await contract.buyToken1(owner1.address, toWei(20), toWei(30));

    expect(await contract.token1Balance()).to.equal(toWei(80));
    expect(await contract.token2Balance()).to.equal(
      toWei('125.075000000000000000')
    );

    expect(await token1.balanceOf(owner1.address)).to.equal(toWei(170));
    expect(await token2.balanceOf(owner1.address)).to.equal(
      toWei('124.925000000000000000')
    );
  });

  it('#buyToken2 1: should reject', () => {
    return expect(
      contract.connect(owner2).buyToken2(owner1.address, toWei(20), toWei(25))
    ).to.eventually.be.rejected;
  });

  it('#buyToken2 2: should reject with SLIPPAGE', () => {
    return expect(
      contract.buyToken2(owner1.address, toWei(20), toWei(24))
    ).to.eventually.be.rejectedWith('SLIPPAGE');
  });

  it('#buyToken2 3: should reject with INSUFFICIENT_FUNDS', () => {
    return expect(
      contract.buyToken2(owner2.address, toWei(20), toWei(30))
    ).to.eventually.be.rejectedWith('INSUFFICIENT_FUNDS');
  });

  it('#buyToken2 4: should transfer tokens successfully', async () => {
    await contract.buyToken2(owner1.address, toWei(20), toWei(30));

    expect(await contract.token2Balance()).to.equal(toWei(80));
    expect(await contract.token1Balance()).to.equal(
      toWei('125.075000000000000000')
    );

    expect(await token2.balanceOf(owner1.address)).to.equal(toWei(170));
    expect(await token1.balanceOf(owner1.address)).to.equal(
      toWei('124.925000000000000000')
    );
  });

  it('#provideLiquidity 1: should reject', () => {
    return expect(
      contract
        .connect(owner2)
        .provideLiquidity(owner1.address, toWei(10), toWei(10))
    ).to.eventually.be.rejected;
  });

  it('#provideLiquidity 2: should reject with INSUFFICIENT_FUNDS', () => {
    return expect(
      contract.provideLiquidity(owner2.address, toWei(10), toWei(10))
    ).to.eventually.be.rejectedWith('INSUFFICIENT_FUNDS');
  });

  it('#provideLiquidity 3: should reject with INSUFFICIENT_FUNDS', async () => {
    await token1.transfer(owner2.address, toWei(10));

    return expect(
      contract.provideLiquidity(owner2.address, toWei(10), toWei(10))
    ).to.eventually.be.rejectedWith('INSUFFICIENT_FUNDS');
  });

  it('#provideLiquidity 4: should provide liquidity successfully', async () => {
    await token1.approve(contract.address, toWei(10));
    await token2.approve(contract.address, toWei(10));
    await contract.provideLiquidity(owner1.address, toWei(10), toWei(12));

    expect(await token1.balanceOf(owner1.address)).to.equal(toWei(140));
    expect(await token2.balanceOf(owner1.address)).to.equal(toWei(140));

    expect(await token1.balanceOf(contract.address)).to.equal(toWei(110));
    expect(await token2.balanceOf(contract.address)).to.equal(toWei(110));

    expect(await contract.token1Balance()).to.equal(toWei(110));
    expect(await contract.token2Balance()).to.equal(toWei(110));

    await token1.approve(contract.address, toWei(10));
    await token2.approve(contract.address, toWei(10));
    await contract.provideLiquidity(owner1.address, toWei(12), toWei(10));

    expect(await token1.balanceOf(owner1.address)).to.equal(toWei(130));
    expect(await token2.balanceOf(owner1.address)).to.equal(toWei(130));

    expect(await token1.balanceOf(contract.address)).to.equal(toWei(120));
    expect(await token2.balanceOf(contract.address)).to.equal(toWei(120));

    expect(await contract.token1Balance()).to.equal(toWei(120));
    expect(await contract.token2Balance()).to.equal(toWei(120));
  });

  it('#withdrawLiquidity 1: should reject', () => {
    return expect(
      contract
        .connect(owner2)
        .withdrawLiquidity(owner1.address, toWei(1), toWei(1), toWei(1))
    ).to.eventually.be.rejected;
  });

  it('#withdrawLiquidity 2: should reject with INSUFFICIENT_FUNDS', () => {
    return expect(
      contract.withdrawLiquidity(owner1.address, toWei(10), toWei(1), toWei(1))
    ).to.eventually.be.rejectedWith('INSUFFICIENT_FUNDS');
  });

  it('#withdrawLiquidity 3: should reject with SLIPPAGE', () => {
    return expect(
      contract.withdrawLiquidity(
        owner1.address,
        toWei(1),
        toWei(1000),
        toWei(1)
      )
    ).to.eventually.be.rejectedWith('SLIPPAGE');
  });

  it('#withdrawLiquidity 4: should reject with SLIPPAGE', () => {
    return expect(
      contract.withdrawLiquidity(
        owner1.address,
        toWei(1),
        toWei(1),
        toWei(1000)
      )
    ).to.eventually.be.rejectedWith('SLIPPAGE');
  });

  it('#withdrawLiquidity 5: should withdraw liquidity successfully', async () => {
    await contract.withdrawLiquidity(
      owner1.address,
      toWei(0.5),
      toWei(1),
      toWei(1)
    );

    expect(await contract.token1Balance()).to.equal(toWei(50));
    expect(await contract.token2Balance()).to.equal(toWei(50));

    expect(await token1.balanceOf(contract.address)).to.equal(toWei(50));
    expect(await token2.balanceOf(contract.address)).to.equal(toWei(50));

    expect(await token1.balanceOf(owner1.address)).to.equal(toWei(200));
    expect(await token2.balanceOf(owner1.address)).to.equal(toWei(200));
  });
});
