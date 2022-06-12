import { ethers } from 'hardhat';
import { ClaimableToken__factory, WITSwap__factory } from '../typechain';
import { toWei } from '../utils';

async function main() {
  const WITSwap = (await ethers.getContractFactory(
    'WITSwap'
  )) as WITSwap__factory;
  const witSwap = await WITSwap.deploy();
  await witSwap.deployed();
  console.log('WITSwap deployed to:', witSwap.address);

  const ClaimableToken = (await ethers.getContractFactory(
    'ClaimableToken'
  )) as ClaimableToken__factory;
  const claimableTokens = [
    await ClaimableToken.deploy('Token 1', 'T1', toWei(1000000), 50, 400),
    await ClaimableToken.deploy('Token 2', 'T2', toWei(10000), 40, 200),
    await ClaimableToken.deploy('Token 3', 'T3', toWei(100), 80, 10),
  ];
  await Promise.all(claimableTokens.map((token) => token.deployed()));
  claimableTokens.forEach((token, index) => {
    console.log(`Token ${index} deployed to: ${token.address}`);
  });

  await (
    await claimableTokens[0].approve(witSwap.address, toWei(500000))
  ).wait();
  await (await claimableTokens[1].approve(witSwap.address, toWei(6000))).wait();
  await (await claimableTokens[2].approve(witSwap.address, toWei(20))).wait();
  await witSwap.createPool(
    claimableTokens[0].address,
    toWei(250000),
    claimableTokens[1].address,
    toWei(3000)
  );

  await witSwap.createPool(
    claimableTokens[1].address,
    toWei(3000),
    claimableTokens[2].address,
    toWei(10)
  );

  await witSwap.createPool(
    claimableTokens[2].address,
    toWei(10),
    claimableTokens[0].address,
    toWei(250000)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
