import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { ethers } from 'hardhat';
import { LPToken, LPToken__factory } from '../typechain';
import { toWei, zeroAddress } from '../utils';

import chaiAsPromised from 'chai-as-promised';
import chaiSpies from 'chai-spies';

chai.use(chaiAsPromised);
chai.use(chaiSpies);

const { expect } = chai;

describe('LPToken', function () {
  let owner1: SignerWithAddress;
  let owner2: SignerWithAddress;
  let contract: LPToken;

  beforeEach(async () => {
    const [tmp1, tmp2] = await ethers.getSigners();
    owner1 = tmp1;
    owner2 = tmp2;

    const Contract = (await ethers.getContractFactory(
      'LPToken'
    )) as LPToken__factory;
    contract = await Contract.deploy('name', 'W-LP-T');
    await contract.deployed();
  });

  it('Contract: should create', () => {
    return expect(contract).to.exist;
  });

  it('#mint 1: should reject', () => {
    return expect(contract.connect(owner2).mint(owner1.address, toWei(1))).to
      .eventually.rejected;
  });

  it('#mint 2: should reject', () => {
    return expect(contract.mint(zeroAddress, toWei(1))).to.eventually.rejected;
  });

  it('#mint 3: should add to #totalSupply and owner2 balance', async () => {
    const newTokens = toWei(1);
    await contract.mint(owner2.address, newTokens);
    expect(await contract.totalSupply()).to.equal(newTokens);
    expect(await contract.balanceOf(owner2.address)).to.equal(newTokens);
  });

  it('#burn 1: should reject', () => {
    return expect(contract.connect(owner2).burn(owner1.address, toWei(1))).to
      .eventually.rejected;
  });

  it('#burn 2: should reject', () => {
    return expect(contract.burn(zeroAddress, toWei(1))).to.eventually.rejected;
  });

  it('#burn 3: should reject', () => {
    return expect(contract.burn(owner2.address, toWei(1))).to.eventually
      .rejected;
  });

  it('#burn 4: should subtract from #totalSupply and owner2 balance', async () => {
    const remainingTokens = toWei(1);
    await contract.mint(owner2.address, toWei(2));
    await contract.burn(owner2.address, remainingTokens);
    expect(await contract.totalSupply()).to.equal(remainingTokens);
    expect(await contract.balanceOf(owner2.address)).to.equal(remainingTokens);
  });
});
