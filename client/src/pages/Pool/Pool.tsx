import React, { useCallback, useEffect, useState } from 'react';
import TokenInput from '../../components/TokenInput/TokenInput';
import TokenInputModel from '../../models/TokenInputModel';
import classes from './Pool.module.css';
import ConnectWalletButton from '../../components/ConnectWalletButton/ConnectWalletButton';
import { useDispatch, useSelector } from '../../store/hooks';
import {
  poolTokensSelector,
  tokensSelector,
  userAddressSelector,
  userBalancesSelector,
} from '../../store/selectors';
import { preferenceActions } from '../../store/preference/preferenceReducer';
import bc from '../../utils/blockchain';
import TokenListItem from '../../components/TokenListItem/TokenListItem';
import TokenListItemModel from '../../models/TokenListItemModel';
import { useNavigate } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';

const Pool: React.FC = () => {
  const userAddress = useSelector(userAddressSelector);
  const tokens = useSelector(tokensSelector);
  const poolTokens = useSelector(poolTokensSelector);
  const balances = useSelector(userBalancesSelector);

  const dispatch = useDispatch();
  const setToken1Address = useCallback(
    (address: string) =>
      dispatch(preferenceActions.setToken1({ page: 'pool', address })),
    []
  );
  const setToken2Address = useCallback(
    (address: string) =>
      dispatch(preferenceActions.setToken2({ page: 'pool', address })),
    []
  );

  const navigate = useNavigate();

  const [token1Amount, setToken1Amount] = useState<string>('');
  const [token2Amount, setToken2Amount] = useState<string>('');
  const [lpTokenAddress, setLpTokenAddress] = useState<string>('');
  const [lpTokenBalance, setLpTokenBalance] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!poolTokens.token1Address && tokens.defaultTokens.length) {
      setToken1Address(tokens.defaultTokens[0].address);
    }
  }, [tokens.defaultTokens]);

  useEffect(() => {
    if (userAddress && poolTokens.token1Address && poolTokens.token2Address) {
      bc.getLpTokenContract(
        poolTokens.token1Address,
        poolTokens.token2Address
      ).then((contract) => {
        const address = contract?.address || '';
        setLpTokenAddress(address);
        bc.getTokenBalance(address, userAddress).then((balance) =>
          setLpTokenBalance(balance || '')
        );
      });
    }
  }, [poolTokens, userAddress, balances[lpTokenAddress]]);

  const switchTokens = () => {
    setToken1Address(poolTokens.token2Address);
    setToken2Address(poolTokens.token1Address);
    setToken1Amount(token2Amount);
    setToken2Amount(token1Amount);
  };

  const onTokenChange = (address: string, tokenNumber: number) => {
    if (tokenNumber === 1) {
      if (address === poolTokens.token2Address) switchTokens();
      else {
        setToken1Address(address);
        setToken1Amount('');
      }
    } else if (tokenNumber === 2) {
      if (address === poolTokens.token1Address) switchTokens();
      else {
        setToken2Address(address);
        setToken2Amount('');
      }
    }
  };

  const sufficientBalance =
    +balances[poolTokens.token1Address] - +token1Amount >= 0 &&
    +balances[poolTokens.token2Address] - +token2Amount >= 0;

  const bothAddresses = !!(
    poolTokens.token1Address && poolTokens.token2Address
  );

  const disabled =
    !(bothAddresses && +token1Amount && +token2Amount) ||
    isLoading ||
    !sufficientBalance;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    setIsLoading(true);
    let callInitializer;
    if (lpTokenAddress) callInitializer = bc.provideLiquidity;
    else callInitializer = bc.createPool;
    callInitializer(
      poolTokens.token1Address,
      token1Amount,
      poolTokens.token2Address,
      token2Amount
    ).finally(() => {
      setIsLoading(false);
      setToken1Amount('');
      setToken2Amount('');
    });
  };

  return (
    <form className={classes.Pool} onSubmit={(e) => submit(e)}>
      <div className={classes.header}>
        <h1>Pool</h1>
      </div>
      <div className={classes.inputs}>
        <TokenInput
          {...new TokenInputModel({
            value: token1Amount,
            tokenAddress: poolTokens.token1Address,
            onChange: (value) => setToken1Amount(value),
            onTokenChange: (address) => onTokenChange(address, 1),
          })}
        />
        <TokenInput
          {...new TokenInputModel({
            value: token2Amount,
            tokenAddress: poolTokens.token2Address,
            onChange: (value) => setToken2Amount(value),
            onTokenChange: (address) => onTokenChange(address, 2),
          })}
        />
      </div>
      <div className={classes['bottom-card']}>
        {lpTokenAddress && (
          <TokenListItem
            {...new TokenListItemModel({
              tokenAddress: lpTokenAddress,
              isClickable: !!lpTokenBalance && lpTokenBalance !== '0',
              withArrow: !!lpTokenBalance && lpTokenBalance !== '0',
              onClick: () => navigate('/liquidity', { state: poolTokens }),
            })}
          />
        )}
        {userAddress ? (
          <LoadingButton loading={isLoading} disabled={disabled} type="submit">
            {bothAddresses
              ? sufficientBalance
                ? lpTokenAddress
                  ? 'Provide Liquidity'
                  : 'Create Pool'
                : 'Insufficient Balance'
              : 'Select Token'}
          </LoadingButton>
        ) : (
          <ConnectWalletButton />
        )}
      </div>
    </form>
  );
};

export default Pool;
