import { ethers } from 'ethers';
import witSwapJSON from '../../../artifacts/contracts/WITSwap.sol/WITSwap.json';
import ClaimableTokenJSON from '../../../artifacts/contracts/ClaimableToken.sol/ClaimableToken.json';
import ERC20JSON from '../../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import LiquidityPoolJSON from '../../../artifacts/contracts/LiquidityPool.sol/LiquidityPool.json';
import LpTokenJSON from '../../../artifacts/contracts/LpToken.sol/LpToken.json';
import {
  ClaimableToken,
  ERC20,
  LiquidityPool,
  LPToken,
  WITSwap,
} from '../../../typechain';
import { toEther, toWei, zeroAddress } from '../../../utils';
import store from '../store/store';
import { uiActions } from '../store/ui/uiReducer';
import { userActions } from '../store/user/userReducer';

class Blockchain {
  static networkId: string = '';
  private _provider?: ethers.providers.Web3Provider;
  private _witSwapContract?: WITSwap;
  private _signer?: ethers.providers.JsonRpcSigner;
  private _userAddress: string = '';
  private _tokenSymbols: { [key: string]: string } = {};
  private _tokenContracts: { [key: string]: ERC20 } = {};
  private _claimableTokenContracts: { [key: string]: ClaimableToken } = {};
  private _liquidityPoolContracts: {
    [key: string]: { [key: string]: LiquidityPool };
  } = {};

  private _lpTokenContracts: { [key: string]: LPToken } = {};
  private _contractAddresses: {
    [key: string]: { witSwap: string; claimableTokens: string[] };
  } = {
    '1337': {
      witSwap: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      claimableTokens: [
        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
        '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      ],
    },
    '3': {
      witSwap: '0x072Ce183d4A9047A2B537e7e877B68c0C33A9b96',
      claimableTokens: [
        '0xc71e51fF52Cd70427eF1EED68943384e42104373',
        '0x22edE1712cc91427Decd50EC60f7a158263361D0',
        '0x3FCf2D700613A7953B2469217C0a6085e46E1943',
      ],
    },
  };

  private _networksMapping: { [key: string]: string } = {
    '1337': '',
    '3': 'https://ropsten.etherscan.io/tx/',
  };

  private _isNetworkSupported?: boolean;

  constructor() {
    if (!window.ethereum) {
      this.emitProviderError();
      return;
    }
    this._provider = new ethers.providers.Web3Provider(window.ethereum, 'any');

    this._provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) window.location.reload();
    });

    this._getWitSwap();
  }

  private _getWitSwap = async () => {
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    if (!this._witSwapContract) {
      this._witSwapContract = new ethers.Contract(
        this.getContractAddresses().witSwap,
        witSwapJSON.abi,
        this._provider
      ) as WITSwap;
    }
    return this._witSwapContract;
  };

  isNetworkSupported = async () => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (this._isNetworkSupported === undefined) {
      Blockchain.networkId = '' + (await this._provider.getNetwork()).chainId;
      this._isNetworkSupported = Object.keys(this._networksMapping).includes(
        Blockchain.networkId
      );
    }
    return this._isNetworkSupported;
  };

  emitProviderError = () =>
    store.dispatch(
      uiActions.openSnackbar({
        severity: 'error',
        message: 'Install the Metamask Extension to Use the App',
      })
    );

  emitNetworkError = () =>
    store.dispatch(
      uiActions.openSnackbar({
        severity: 'error',
        message: 'Wrong Network',
      })
    );

  emitSignerError = () =>
    store.dispatch(
      uiActions.openSnackbar({
        severity: 'error',
        message: 'No Wallet Connected',
      })
    );

  emitTokenError = () =>
    store.dispatch(
      uiActions.openSnackbar({
        severity: 'error',
        message: 'Could not Find an ERC20 Token at This Address',
      })
    );

  emitError = () =>
    store.dispatch(
      uiActions.openSnackbar({
        severity: 'error',
        message: 'Something Went Wrong...',
      })
    );

  handleTransaction = (tx: ethers.ContractTransaction) => {
    const baseUrl = this._networksMapping[Blockchain.networkId];
    if (!baseUrl)
      store.dispatch(
        uiActions.openSnackbar({
          severity: 'success',
          message: 'Transaction Initiated Successfully',
        })
      );
    else
      store.dispatch(
        uiActions.openSnackbar({
          severity: 'success',
          message: 'You Can Track the Transaction ',
          link: { href: baseUrl + tx.hash, label: 'Here' },
        })
      );
  };

  connectWallet = async () => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }

    if (this._userAddress) return this._userAddress;

    await this._provider.send('eth_requestAccounts', []);
    this._signer = this._provider.getSigner();
    this._userAddress = await this._signer.getAddress();

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      store.dispatch(userActions.setUserAddress({ address: accounts[0] }));
      store.dispatch(userActions.resetBalances());
    });

    const updateBalance = (tokenAddress: string) => {
      this.getTokenBalance(tokenAddress).then((balance) => {
        if (!balance) return;
        store.dispatch(userActions.setBalance({ tokenAddress, balance }));
      });
    };

    this.getContractAddresses().claimableTokens.forEach(async (address) => {
      (await this.getClaimableTokenContract(address))?.on(
        'Transfer',
        (from: string, to: string, amount: number) => {
          if ([from, to].includes(this._userAddress)) {
            updateBalance(address);
          }
        }
      );
    });

    const witSwapContract = await this._getWitSwap();

    if (!witSwapContract) return;

    witSwapContract.on(
      'PoolCreated',
      (
        account: string,
        token1Address: string,
        token2Address: string,
        liquidityPoolAddress: string
      ) => {
        if (account === this._userAddress) {
          updateBalance(token1Address);
          updateBalance(token2Address);
        }
      }
    );

    witSwapContract.on(
      'Swapped',
      (
        account: string,
        token1Address: string,
        token1Amount: string,
        token2Address: string,
        token2Amount: string
      ) => {
        if (account === this._userAddress) {
          updateBalance(token1Address);
          updateBalance(token2Address);
        }
      }
    );

    witSwapContract.on(
      'LiquidityProvided',
      (
        account: string,
        token1Address: string,
        token1Amount: string,
        token2Address: string,
        token2Amount: string
      ) => {
        if (account === this._userAddress) {
          updateBalance(token1Address);
          updateBalance(token2Address);
        }
      }
    );

    witSwapContract.on(
      'LiquidityWithdrawn',
      (
        account: string,
        token1Address: string,
        token2Address: string,
        lpTokenAmount: string
      ) => {
        if (account === this._userAddress) {
          updateBalance(token1Address);
          updateBalance(token2Address);
          this.getLpTokenContract(token1Address, token2Address)
            .then((contract) => {
              contract && updateBalance(contract.address);
            })
            .catch();
        }
      }
    );

    return this._userAddress;
  };

  getContractAddresses = () => {
    return this._contractAddresses[Blockchain.networkId];
  };

  getTokenContract = async (address: string) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    if (!this._tokenContracts[address]) {
      try {
        this._tokenContracts[address] = new ethers.Contract(
          address,
          ERC20JSON.abi,
          this._provider
        ) as ERC20;
      } catch (e) {
        this.emitTokenError();
        return;
      }
    }
    return this._tokenContracts[address];
  };

  getClaimableTokenContract = async (address: string) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    if (!this._claimableTokenContracts[address]) {
      try {
        this._claimableTokenContracts[address] = new ethers.Contract(
          address,
          ClaimableTokenJSON.abi,
          this._provider
        ) as ClaimableToken;
        this._tokenContracts[address] = this._claimableTokenContracts[address];
      } catch (e) {
        this.emitTokenError();
        return;
      }
    }
    return this._claimableTokenContracts[address];
  };

  getTokenSymbol = async (tokenAddress: string) => {
    if (!this._tokenSymbols[tokenAddress]) {
      const contract = await this.getTokenContract(tokenAddress);
      if (!contract) return;
      const symbol = await contract.symbol();
      this._tokenSymbols[tokenAddress] = symbol;
    }

    return this._tokenSymbols[tokenAddress];
  };

  getTokenBalance = async (
    tokenAddress: string,
    userAddress: string = this._userAddress
  ) => {
    try {
      if (!this._provider) {
        this.emitProviderError();
        return '0';
      }
      if (!(await this.isNetworkSupported())) {
        this.emitNetworkError();
        return '0';
      }
      const contract = await this.getTokenContract(tokenAddress);
      if (!contract) return '0';
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals(),
      ]);

      return toEther(balance.toString(), decimals);
    } catch (e) {
      return '0';
    }
  };

  getLiquidityPoolContract = async (
    token1Address: string,
    token2Address: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }

    if (!this._liquidityPoolContracts[token1Address])
      this._liquidityPoolContracts[token1Address] = {};
    if (!this._liquidityPoolContracts[token2Address])
      this._liquidityPoolContracts[token2Address] = {};

    if (!this._liquidityPoolContracts[token1Address][token2Address]) {
      const witSwapContract = await this._getWitSwap();

      const poolAddress = await witSwapContract?.pools(
        token1Address,
        token2Address
      );
      if (!poolAddress || poolAddress === zeroAddress) return;
      const pool = new ethers.Contract(
        poolAddress,
        LiquidityPoolJSON.abi,
        this._provider
      ) as LiquidityPool;
      this._liquidityPoolContracts[token1Address][token2Address] = pool;
      this._liquidityPoolContracts[token2Address][token1Address] = pool;
    }

    return this._liquidityPoolContracts[token1Address][token2Address];
  };

  getLpTokenContract = async (token1Address: string, token2Address: string) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    const pool = await this.getLiquidityPoolContract(
      token1Address,
      token2Address
    );
    if (!pool) return;

    if (!this._lpTokenContracts[pool.address]) {
      this._lpTokenContracts[pool.address] = new ethers.Contract(
        await pool.lpToken(),
        LpTokenJSON.abi,
        this._provider
      ) as LPToken;

      this._tokenContracts[this._lpTokenContracts[pool.address].address] =
        this._lpTokenContracts[pool.address];
    }

    return this._lpTokenContracts[pool.address];
  };

  getLpTokenBalance = async (
    token1Address: string,
    token2Address: string,
    userAddress: string = this._userAddress
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    const lpToken = await this.getLpTokenContract(token1Address, token2Address);

    if (!lpToken) return '';

    return await this.getTokenBalance(lpToken.address, userAddress);
  };

  getTokenReturnedAmount = async (
    ttsAddress: string,
    ttbAddress: string,
    ttsAmount: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    const [ttsContract, ttbContract] = await Promise.all([
      this.getTokenContract(ttsAddress),
      this.getTokenContract(ttbAddress),
    ]);

    if (!ttsContract || !ttbContract) return;

    const [ttsDecimals, ttbDecimals] = await Promise.all([
      ttsContract.decimals(),
      ttbContract.decimals(),
    ]);

    ttsAmount = toWei(ttsAmount, ttsDecimals);

    const witSwapContract = await this._getWitSwap();

    const tokenReturnedAmount = await witSwapContract?.getTokenReturnedAmount(
      ttsAddress,
      ttbAddress,
      ttsAmount
    );
    return (
      tokenReturnedAmount &&
      toEther(tokenReturnedAmount.toString(), ttbDecimals)
    );
  };

  getTokenPrice = async (
    ttsAddress: string,
    ttbAddress: string,
    ttbAmount: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    const [ttsContract, ttbContract] = await Promise.all([
      this.getTokenContract(ttsAddress),
      this.getTokenContract(ttbAddress),
    ]);

    if (!ttsContract || !ttbContract) return;

    const [ttsDecimals, ttbDecimals] = await Promise.all([
      ttsContract.decimals(),
      ttbContract.decimals(),
    ]);

    ttbAmount = toWei(ttbAmount, ttbDecimals);

    const witSwapContract = await this._getWitSwap();

    const tokenPrice = await witSwapContract?.getTokenPrice(
      ttsAddress,
      ttbAddress,
      ttbAmount
    );
    return tokenPrice && toEther(tokenPrice.toString(), ttsDecimals);
  };

  sellToken = async (
    ttsAddress: string,
    ttbAddress: string,
    ttsAmount: string,
    minAmountReturned: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }

    const witSwapContract = await this._getWitSwap();
    if (!witSwapContract || !this._signer) return;
    const poolAddress = await witSwapContract.pools(ttsAddress, ttbAddress);
    if (!poolAddress || poolAddress === zeroAddress) return;

    const [ttsContract, ttbContract] = await Promise.all([
      this.getTokenContract(ttsAddress),
      this.getTokenContract(ttbAddress),
    ]);

    if (!ttsContract || !ttbContract) return;

    const [ttsDecimals, ttbDecimals] = await Promise.all([
      ttsContract.decimals(),
      ttbContract.decimals(),
    ]);

    let allowed = (
      await ttsContract.allowance(this._userAddress, poolAddress)
    ).toString();

    allowed = toEther(allowed, ttsDecimals);

    const shouldApprove = +allowed < +ttsAmount;

    ttsAmount = toWei(ttsAmount, ttsDecimals);
    minAmountReturned = toWei(minAmountReturned, ttbDecimals);

    if (shouldApprove) {
      const approval = await ttsContract
        .connect(this._signer)
        .approve(poolAddress, ttsAmount);
      await approval.wait();
    }

    const tx = await witSwapContract
      .connect(this._signer)
      .sellToken(ttsAddress, ttbAddress, ttsAmount, minAmountReturned);

    this.handleTransaction(tx);
  };

  buyToken = async (
    ttsAddress: string,
    ttbAddress: string,
    ttbAmount: string,
    maxPrice: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }

    const witSwapContract = await this._getWitSwap();
    if (!witSwapContract || !this._signer) return;
    const poolAddress = await witSwapContract.pools(ttsAddress, ttbAddress);
    if (!poolAddress || poolAddress === zeroAddress) return;

    const [ttsContract, ttbContract] = await Promise.all([
      this.getTokenContract(ttsAddress),
      this.getTokenContract(ttbAddress),
    ]);

    if (!ttsContract || !ttbContract) return;

    const [ttsDecimals, ttbDecimals] = await Promise.all([
      ttsContract.decimals(),
      ttbContract.decimals(),
    ]);

    let allowed = (
      await ttsContract.allowance(this._userAddress, poolAddress)
    ).toString();

    allowed = toEther(allowed, ttsDecimals);

    const shouldApprove = +allowed < +maxPrice;

    ttbAmount = toWei(ttbAmount, ttbDecimals);
    maxPrice = toWei(maxPrice, ttsDecimals);

    if (shouldApprove) {
      const approval = await ttsContract
        .connect(this._signer)
        .approve(poolAddress, maxPrice);
      await approval.wait();
    }

    const tx = await witSwapContract
      .connect(this._signer)
      .buyToken(ttsAddress, ttbAddress, ttbAmount, maxPrice);

    this.handleTransaction(tx);
  };

  createPool = async (
    token1Address: string,
    token1Amount: string,
    token2Address: string,
    token2Amount: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    const witSwapContract = await this._getWitSwap();
    if (!witSwapContract || !this._signer) return;
    const poolExists = await this.getLiquidityPoolContract(
      token1Address,
      token2Address
    );
    if (poolExists) return;

    const [token1Contract, token2Contract] = await Promise.all([
      this.getTokenContract(token1Address),
      this.getTokenContract(token2Address),
    ]);

    if (!token1Contract || !token2Contract) return;

    const [token1Decimals, token2Decimals] = await Promise.all([
      token1Contract.decimals(),
      token2Contract.decimals(),
    ]);

    let allowed1 = (
      await token1Contract.allowance(this._userAddress, witSwapContract.address)
    ).toString();
    let allowed2 = (
      await token2Contract.allowance(this._userAddress, witSwapContract.address)
    ).toString();

    allowed1 = toEther(allowed1, token1Decimals);
    allowed2 = toEther(allowed2, token2Decimals);

    const shouldApprove1 = +allowed1 < +token1Amount;
    const shouldApprove2 = +allowed2 < +token2Amount;

    token1Amount = toWei(token1Amount, token1Decimals);
    token2Amount = toWei(token2Amount, token2Decimals);

    const approvePromises = [];

    if (shouldApprove1)
      approvePromises.push(
        token1Contract
          .connect(this._signer)
          .approve(witSwapContract.address, token1Amount)
      );

    if (shouldApprove2)
      approvePromises.push(
        token2Contract
          .connect(this._signer)
          .approve(witSwapContract.address, token2Amount)
      );

    if (approvePromises.length) {
      const approvals = await Promise.all(approvePromises);
      await Promise.all(approvals.map((approval) => approval.wait()));
    }

    const tx = await witSwapContract
      .connect(this._signer)
      .createPool(token1Address, token1Amount, token2Address, token2Amount);

    this.handleTransaction(tx);
  };

  getLiquidity = async (
    token1Address: string,
    token2Address: string,
    lpTokenAmount: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    const witSwap = await this._getWitSwap();
    if (!witSwap) return { token1Amount: '0', token2Amount: '0' };

    const [token1Contract, token2Contract] = await Promise.all([
      this.getTokenContract(token1Address),
      this.getTokenContract(token2Address),
    ]);

    if (!token1Contract || !token2Contract) return;

    const [token1Decimals, token2Decimals] = await Promise.all([
      token1Contract.decimals(),
      token2Contract.decimals(),
    ]);

    lpTokenAmount = toWei(lpTokenAmount);

    const [token1Amount, token2Amount] = await witSwap.getLiquidity(
      token1Address,
      token2Address,
      lpTokenAmount
    );

    return {
      token1Amount: toEther(token1Amount.toString(), token1Decimals),
      token2Amount: toEther(token2Amount.toString(), token2Decimals),
    };
  };

  provideLiquidity = async (
    token1Address: string,
    token1Amount: string,
    token2Address: string,
    token2Amount: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    if (!this._signer) {
      this.emitSignerError();
      return;
    }

    const witSwapContract = await this._getWitSwap();
    if (!witSwapContract) return;
    const poolAddress = await witSwapContract.pools(
      token1Address,
      token2Address
    );
    if (!poolAddress || poolAddress === zeroAddress) return;

    const [token1Contract, token2Contract] = await Promise.all([
      this.getTokenContract(token1Address),
      this.getTokenContract(token2Address),
    ]);

    if (!token1Contract || !token2Contract) return;

    const [token1Decimals, token2Decimals] = await Promise.all([
      token1Contract.decimals(),
      token2Contract.decimals(),
    ]);
    let allowed1 = (
      await token1Contract.allowance(this._userAddress, poolAddress)
    ).toString();
    let allowed2 = (
      await token2Contract.allowance(this._userAddress, poolAddress)
    ).toString();

    allowed1 = toEther(allowed1, token1Decimals);
    allowed2 = toEther(allowed2, token2Decimals);

    const shouldApprove1 = +allowed1 < +token1Amount;
    const shouldApprove2 = +allowed2 < +token2Amount;

    token1Amount = toWei(token1Amount, token1Decimals);
    token2Amount = toWei(token2Amount, token2Decimals);

    const approvePromises = [];

    if (shouldApprove1)
      approvePromises.push(
        token1Contract.connect(this._signer).approve(poolAddress, token1Amount)
      );

    if (shouldApprove2)
      approvePromises.push(
        token2Contract.connect(this._signer).approve(poolAddress, token2Amount)
      );

    if (approvePromises.length) {
      const approvals = await Promise.all(approvePromises);
      await Promise.all(approvals.map((approval) => approval.wait()));
    }

    const tx = await witSwapContract
      .connect(this._signer)
      .provideLiquidity(
        token1Address,
        token1Amount,
        token2Address,
        token2Amount
      );

    this.handleTransaction(tx);
  };

  withdrawLiquidity = async (
    token1Address: string,
    minToken1AmountReturned: string,
    token2Address: string,
    minToken2AmountReturned: string,
    lpTokenAmount: string
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!this._signer) {
      this.emitSignerError();
      return;
    }
    const witSwap = await this._getWitSwap();
    if (!witSwap) return;

    const [token1Contract, token2Contract] = await Promise.all([
      this.getTokenContract(token1Address),
      this.getTokenContract(token2Address),
    ]);
    if (!token1Contract || !token2Contract) return;

    const [token1Decimals, token2Decimals] = await Promise.all([
      token1Contract.decimals(),
      token2Contract.decimals(),
    ]);

    lpTokenAmount = toWei(lpTokenAmount);
    minToken1AmountReturned = toWei(minToken1AmountReturned, token1Decimals);
    minToken2AmountReturned = toWei(minToken2AmountReturned, token2Decimals);

    const tx = await witSwap
      .connect(this._signer)
      .withdrawLiquidity(
        token1Address,
        minToken1AmountReturned,
        token2Address,
        minToken2AmountReturned,
        lpTokenAmount
      );

    this.handleTransaction(tx);
  };

  checkTokenEligibility = async (
    address: string,
    userAddress: string = this._userAddress
  ) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return false;
    }
    if (!this._signer) {
      this.emitSignerError();
      return false;
    }

    if (!this.getContractAddresses().claimableTokens.includes(address))
      return false;

    const claimableTokenContract = await this.getClaimableTokenContract(
      address
    );

    if (!claimableTokenContract) return false;

    return await claimableTokenContract.checkClaimEligibility(userAddress);
  };

  claimToken = async (address: string) => {
    if (!this._provider) {
      this.emitProviderError();
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.emitNetworkError();
      return;
    }
    if (!this._signer) {
      this.emitSignerError();
      return;
    }
    if (!this.getContractAddresses().claimableTokens.includes(address)) return;

    const claimableTokenContract = await this.getClaimableTokenContract(
      address
    );

    if (!claimableTokenContract) {
      this.emitSignerError();
      return;
    }

    const tx = await claimableTokenContract.connect(this._signer).claim();

    this.handleTransaction(tx);
  };
}

const bc = new Blockchain();

export default bc;

export const getNetworkId = (): string => Blockchain.networkId;
