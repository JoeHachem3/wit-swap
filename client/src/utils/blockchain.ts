// eslint-disable-next-line node/no-unpublished-import
import { ethers } from 'ethers';
import witSwapJSON from '../../../artifacts/contracts/WITSwap.sol/WITSwap.json';
import ClaimableTokenJSON from '../../../artifacts/contracts/ClaimableToken.sol/ClaimableToken.json';
import ERC20JSON from '../../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import LiquidityPoolJSON from '../../../artifacts/contracts/LiquidityPool.sol/LiquidityPool.json';
// eslint-disable-next-line node/no-missing-import
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
  static networkId = '';
  private _provider?: ethers.providers.Web3Provider;
  private _witSwapContract?: WITSwap;
  private _signer?: ethers.providers.JsonRpcSigner;
  private _userAddress = '';
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
      witSwap: '0xF44c9C99229673c870b2C0863F5c5604b3514a36',
      claimableTokens: [
        '0x18CF51357E713Cd961e833424855816f6FC9F5f0',
        '0x9DD2B38Ebff691790A0c6c7cAAfE96EB2A06340A',
        '0xC7C922BB886AF14dd4EB2C730042358c4F65a99D',
      ],
    },
  };
  private _networksMapping: { [key: string]: { name: string; url: string } } = {
    '1337': { name: '', url: '' },
    '3': { name: 'Ropsten', url: 'https://ropsten.etherscan.io/tx/' },
  };
  private _isNetworkSupported?: boolean;
  private errorMessages: { [key: string]: string } = {
    NOT_ELIGIBLE: 'Action is not Eligible for This Wallet',
    SAME_TOKEN: 'Cannot Use the Same Token',
    INVALID_ADDRESS: 'Invalid Address',
    INSUFFICIENT_FUNDS: 'Insufficient Funds',
    SLIPPAGE: 'Slippage too High',
    POOL_EXISTS: 'Pool Already Exists',
    POOL_DOES_NOT_EXIST: 'Pool Does not Exist',
    NO_LIQUIDITY_PROVIDED: 'No Liquidity Provided',
    NO_ERC20: 'No ERC20 Token at This Address',
    NO_LP_TOKEN: 'No LP Token at This Address',
    NO_CLAIMABLE_TOKEN: 'No Claimable Token at This Address',
    WRONG_NETWORK:
      'Wrong Network, please switch to one of the following: ' +
      Object.values(this._networksMapping)
        .map((network) => network.name)
        .filter((name) => name)
        .join(', '),
    NO_WALLET_CONNECTED: 'No Wallet Connected',
    NO_METAMASK: 'Install the Metamask Extension to Use the App',
    '': 'Something Went Wrong...',
  };

  constructor() {
    if (!window.ethereum) {
      this.handleError('NO_METAMASK');
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
      this.handleError('WRONG_NETWORK');
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
      this.handleError('NO_METAMASK');
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

  handleError = (errorMessage: string) => {
    const key =
      Object.keys(this.errorMessages).find((key) =>
        errorMessage.includes(key)
      ) || '';

    store.dispatch(
      uiActions.openSnackbar({
        severity: 'error',
        message: this.errorMessages[key],
      })
    );
  };

  handleTransaction = (tx: ethers.ContractTransaction) => {
    const baseUrl = this._networksMapping[Blockchain.networkId].url;
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
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }

    if (this._userAddress) return this._userAddress;

    try {
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          token1Amount: string,
          token2Address: string,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          token2Amount: string
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

      witSwapContract.on(
        'LiquidityWithdrawn',
        (
          account: string,
          token1Address: string,
          token2Address: string,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  getContractAddresses = () => {
    return this._contractAddresses[Blockchain.networkId];
  };

  getTokenContract = async (address: string) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
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
        this.handleError('NO_ERC20');
        return;
      }
    }
    return this._tokenContracts[address];
  };

  getClaimableTokenContract = async (address: string) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
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
        this.handleError('NO_ERC20');
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
        this.handleError('NO_METAMASK');
        return '0';
      }
      if (!(await this.isNetworkSupported())) {
        this.handleError('WRONG_NETWORK');
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
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
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
      try {
        const pool = new ethers.Contract(
          poolAddress,
          LiquidityPoolJSON.abi,
          this._provider
        ) as LiquidityPool;
        this._liquidityPoolContracts[token1Address][token2Address] = pool;
        this._liquidityPoolContracts[token2Address][token1Address] = pool;
      } catch (e) {
        this.handleError('POOL_DOES_NOT_EXIST');
        return;
      }
    }

    return this._liquidityPoolContracts[token1Address][token2Address];
  };

  getLpTokenContract = async (token1Address: string, token2Address: string) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    const pool = await this.getLiquidityPoolContract(
      token1Address,
      token2Address
    );
    if (!pool) return;

    if (!this._lpTokenContracts[pool.address]) {
      try {
        this._lpTokenContracts[pool.address] = new ethers.Contract(
          await pool.lpToken(),
          LpTokenJSON.abi,
          this._provider
        ) as LPToken;

        this._tokenContracts[this._lpTokenContracts[pool.address].address] =
          this._lpTokenContracts[pool.address];
      } catch (e) {
        this.handleError('NO_LP_TOKEN');
        return;
      }
    }

    return this._lpTokenContracts[pool.address];
  };

  getLpTokenBalance = async (
    token1Address: string,
    token2Address: string,
    userAddress: string = this._userAddress
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
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
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }

    try {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  getTokenPrice = async (
    ttsAddress: string,
    ttbAddress: string,
    ttbAmount: string
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }
    try {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  sellToken = async (
    ttsAddress: string,
    ttbAddress: string,
    ttsAmount: string,
    minAmountReturned: string
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }

    try {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  buyToken = async (
    ttsAddress: string,
    ttbAddress: string,
    ttbAmount: string,
    maxPrice: string
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }

    try {
      const witSwapContract = await this._getWitSwap();
      if (!witSwapContract || !this._signer) return;
      const poolAddress = await witSwapContract.pools(ttsAddress, ttbAddress);
      if (!poolAddress || poolAddress === zeroAddress) return;

      const [ttsContract, ttbContract] = await Promise.all([
        this.getTokenContract(ttsAddress),
        this.getTokenContract(ttbAddress),
      ]);

      if (!ttsContract || !ttbContract) return;

      console.log(await ttsContract?.symbol(), await ttbContract?.symbol());

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
      console.log({ maxPrice });
      console.log(
        (
          await witSwapContract.getTokenPrice(ttsAddress, ttbAddress, ttbAmount)
        ).toString()
      );
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  createPool = async (
    token1Address: string,
    token1Amount: string,
    token2Address: string,
    token2Amount: string
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }

    try {
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
        await token1Contract.allowance(
          this._userAddress,
          witSwapContract.address
        )
      ).toString();
      let allowed2 = (
        await token2Contract.allowance(
          this._userAddress,
          witSwapContract.address
        )
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  getLiquidity = async (
    token1Address: string,
    token2Address: string,
    lpTokenAmount: string
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    const witSwap = await this._getWitSwap();
    if (!witSwap) return { token1Amount: '0', token2Amount: '0' };

    try {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
      return { token1Amount: '0', token2Amount: '0' };
    }
  };

  provideLiquidity = async (
    token1Address: string,
    token1Amount: string,
    token2Address: string,
    token2Amount: string
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }
    if (!this._signer) {
      this.handleError('NO_WALLET_CONNECTED');
      return;
    }

    try {
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
      console.log(
        token1Amount,
        (await token1Contract.balanceOf(this._userAddress)).toString()
      );
      console.log(
        token2Amount,
        (await token2Contract.balanceOf(this._userAddress)).toString()
      );

      const approvePromises = [];

      if (shouldApprove1)
        approvePromises.push(
          token1Contract
            .connect(this._signer)
            .approve(poolAddress, token1Amount)
        );

      if (shouldApprove2)
        approvePromises.push(
          token2Contract
            .connect(this._signer)
            .approve(poolAddress, token2Amount)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  withdrawLiquidity = async (
    token1Address: string,
    minToken1AmountReturned: string,
    token2Address: string,
    minToken2AmountReturned: string,
    lpTokenAmount: string
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!this._signer) {
      this.handleError('NO_WALLET_CONNECTED');
      return;
    }
    const witSwap = await this._getWitSwap();
    if (!witSwap) return;

    try {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };

  checkTokenEligibility = async (
    address: string,
    userAddress: string = this._userAddress
  ) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return false;
    }
    if (!this._signer) {
      this.handleError('NO_WALLET_CONNECTED');
      return false;
    }

    if (!this.getContractAddresses().claimableTokens.includes(address))
      return false;

    const claimableTokenContract = await this.getClaimableTokenContract(
      address
    );

    if (!claimableTokenContract) return false;
    try {
      return await claimableTokenContract.checkClaimEligibility(userAddress);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
      return false;
    }
  };

  claimToken = async (address: string) => {
    if (!this._provider) {
      this.handleError('NO_METAMASK');
      return;
    }
    if (!(await this.isNetworkSupported())) {
      this.handleError('WRONG_NETWORK');
      return;
    }
    if (!this._signer) {
      this.handleError('NO_WALLET_CONNECTED');
      return;
    }
    if (!this.getContractAddresses().claimableTokens.includes(address)) return;

    const claimableTokenContract = await this.getClaimableTokenContract(
      address
    );

    if (!claimableTokenContract) {
      this.handleError('NO_CLAIMABLE_TOKEN');
      return;
    }

    try {
      const tx = await claimableTokenContract.connect(this._signer).claim();

      this.handleTransaction(tx);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      this.handleError(e.message);
    }
  };
}

const bc = new Blockchain();

export default bc;

export const getNetworkId = (): string => Blockchain.networkId;
