import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { ethers } from 'hardhat';
import { ClaimableToken, ClaimableToken__factory } from '../typechain';
import { toWei } from '../utils';

import chaiAsPromised from 'chai-as-promised';
import chaiSpies from 'chai-spies';

chai.use(chaiAsPromised);
chai.use(chaiSpies);

const { expect } = chai;

describe('ClaimableToken', function () {
  let owners: SignerWithAddress[];
  let contract: ClaimableToken;

  beforeEach(async () => {
    owners = await ethers.getSigners();

    const Contract = (await ethers.getContractFactory(
      'ClaimableToken'
    )) as ClaimableToken__factory;
    contract = await Contract.deploy('name', 'symbol', toWei(100), 50, 2);
    await contract.deployed();
  });

  it('Contract: should create', () => {
    return expect(contract).to.exist;
  });

  it('#checkClaimEligibility 1: should return the expected result', async () => {
    return expect(await contract.checkClaimEligibility(owners[1].address)).to.be
      .true;
  });

  it('#checkClaimEligibility 2: should return the expected result', async () => {
    await contract.connect(owners[2]).claim();
    await contract.connect(owners[3]).claim();
    return expect(await contract.checkClaimEligibility(owners[1].address)).to.be
      .false;
  });

  it('#checkClaimEligibility 3: should return the expected result', async () => {
    await contract.connect(owners[1]).claim();
    return expect(await contract.checkClaimEligibility(owners[1].address)).to.be
      .false;
  });

  it('#claim 1: should emit Transfer', async () => {
    await expect(contract.connect(owners[1]).claim())
      .to.emit(contract, 'Transfer')
      .withArgs(contract.address, owners[1].address, toWei(25));
  });

  it('#claim 2: should revert with NOT_ELIGIBLE', async () => {
    await contract.connect(owners[1]).claim();

    return expect(
      contract.connect(owners[1]).claim()
    ).to.eventually.be.rejectedWith('NOT_ELIGIBLE');
  });
});
