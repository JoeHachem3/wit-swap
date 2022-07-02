import React, { useCallback, useEffect, useRef, useState } from 'react';
import TokenInput from '../../components/TokenInput/TokenInput';
import TokenInputModel from '../../models/TokenInputModel';
import classes from './Swap.module.css';
import { Button } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import ConnectWalletButton from '../../components/ConnectWalletButton/ConnectWalletButton';
import { useDispatch, useSelector } from '../../store/hooks';
import {
  swapSlippageSelector,
  swapTokensSelector,
  tokensSelector,
  userAddressSelector,
  userBalancesSelector,
} from '../../store/selectors';
import { preferenceActions } from '../../store/preference/preferenceReducer';
import bc from '../../utils/blockchain';
import SwapDialog from '../../components/SwapDialog/SwapDialog';
import SwapDialogModel from '../../models/SwapDialogModel';
import { useNavigate } from 'react-router-dom';
import * as utils from '../../utils';

const Swap: React.FC = () => {
  const updateTokenAmountInterval = useRef<NodeJS.Timeout>();
  const shouldUpdateTokenAmount = useRef<boolean>();

  const userAddress = useSelector(userAddressSelector);
  const tokens = useSelector(tokensSelector);
  const swapTokens = useSelector(swapTokensSelector);
  const slippage = useSelector(swapSlippageSelector);
  const balances = useSelector(userBalancesSelector);

  const navigate = useNavigate();

  const dispatch = useDispatch();
  const setToken1Address = useCallback(
    (page: 'swap' | 'pool', address: string) =>
      dispatch(preferenceActions.setToken1({ page, address })),
    []
  );
  const setToken2Address = useCallback(
    (page: 'swap' | 'pool', address: string) =>
      dispatch(preferenceActions.setToken2({ page, address })),
    []
  );
  const setSlippage = useCallback(
    (slippage: number) =>
      dispatch(preferenceActions.setSlippage({ page: 'swap', slippage })),
    []
  );

  const [token1Amount, setToken1Amount] = useState<string>('');
  const [token2Amount, setToken2Amount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSellingToken, setIsSellingToken] = useState<boolean>(true);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState<boolean>(false);
  const [doesPoolExist, setDoesPoolExist] = useState<boolean>(true);

  const bothAddresses = !!(
    swapTokens.token1Address && swapTokens.token2Address
  );

  const updateToken1Amount = async (amount: string) => {
    setIsLoading(true);
    await bc
      .getTokenPrice(swapTokens.token1Address, swapTokens.token2Address, amount)
      .then((res) => {
        if (res !== undefined) setToken1Amount(res);
        setDoesPoolExist(res !== undefined);
      })
      .catch(() => {
        setDoesPoolExist(false);
      })
      .finally(() => setIsLoading(false));
  };

  const updateToken2Amount = async (amount: string) => {
    setIsLoading(true);
    await bc
      .getTokenReturnedAmount(
        swapTokens.token1Address,
        swapTokens.token2Address,
        amount
      )
      .then((res) => {
        if (res !== undefined) setToken2Amount(res);
        setDoesPoolExist(res !== undefined);
      })
      .catch(() => {
        setDoesPoolExist(false);
      })
      .finally(() => setIsLoading(false));
  };

  const onAmountChange = (amount: string, tokenNumber: number) => {
    updateTokenAmountInterval.current &&
      clearInterval(updateTokenAmountInterval.current);

    if (!amount) {
      setToken1Amount('');
      setToken2Amount('');
      return;
    }

    if (tokenNumber === 1) {
      setIsSellingToken(true);
      setToken1Amount(amount);
      if (bothAddresses) {
        updateToken2Amount(amount);
        updateTokenAmountInterval.current = setInterval(
          () => updateToken2Amount(amount),
          10000
        );
      }
    }
    if (tokenNumber === 2) {
      setIsSellingToken(false);
      setToken2Amount(amount);
      if (bothAddresses) {
        updateToken1Amount(amount);
        updateTokenAmountInterval.current = setInterval(
          () => updateToken1Amount(amount),
          10000
        );
      }
    }
  };

  useEffect(() => {
    if (!swapTokens.token1Address && tokens.defaultTokens.length) {
      setToken1Address('swap', tokens.defaultTokens[0].address);
    }

    if (swapTokens.token1Address && swapTokens.token2Address) {
      bc.getLiquidityPoolContract(
        swapTokens.token1Address,
        swapTokens.token2Address
      )
        .then((res) => {
          setDoesPoolExist(!!res);
        })
        .catch(() => setDoesPoolExist(false));
    }
  }, [tokens.defaultTokens]);

  useEffect(() => {
    if (shouldUpdateTokenAmount.current) {
      shouldUpdateTokenAmount.current = false;
      onAmountChange(token1Amount, 1);
    }
  }, [token1Amount, token2Amount]);

  useEffect(() => {
    if (shouldUpdateTokenAmount.current) {
      shouldUpdateTokenAmount.current = false;
      onAmountChange(token2Amount, 2);
    }
  }, [swapTokens.token1Address]);

  useEffect(() => {
    if (shouldUpdateTokenAmount.current) {
      shouldUpdateTokenAmount.current = false;
      onAmountChange(token1Amount, 1);
    }
  }, [swapTokens.token2Address]);

  const switchTokens = () => {
    shouldUpdateTokenAmount.current = true;
    setToken1Address('swap', swapTokens.token2Address);
    setToken2Address('swap', swapTokens.token1Address);
    setToken1Amount(token2Amount);
    setToken2Amount(token1Amount);
  };

  const findToken = (address: string) => {
    return (
      tokens.importedTokens.find((token) => token.address === address) ||
      tokens.defaultTokens.find((token) => token.address === address)
    );
  };

  const onTokenChange = (address: string, tokenNumber: number) => {
    shouldUpdateTokenAmount.current = true;
    if (tokenNumber === 1) {
      address === swapTokens.token2Address
        ? switchTokens()
        : setToken1Address('swap', address);
    } else if (tokenNumber === 2) {
      address === swapTokens.token1Address
        ? switchTokens()
        : setToken2Address('swap', address);
    }
  };

  const sufficientBalance =
    +balances[swapTokens.token1Address] - +token1Amount >= 0;

  const disabled =
    (doesPoolExist && !(bothAddresses && +token1Amount && +token2Amount)) ||
    isLoading ||
    !sufficientBalance;

  const goToPool = () => {
    setToken1Address('pool', swapTokens.token1Address);
    setToken2Address('pool', swapTokens.token2Address);
    navigate('/pool');
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsSwapDialogOpen(true);
  };

  const getMinReturnedAmount = () =>
    utils.getMinReturnedAmount(slippage, +token2Amount);

  const getMaxPrice = () => utils.getMaxPrice(slippage, +token1Amount);

  const proceed = async () => {
    updateTokenAmountInterval.current &&
      clearInterval(updateTokenAmountInterval.current);

    if (isSellingToken)
      await bc.sellToken(
        swapTokens.token1Address,
        swapTokens.token2Address,
        token1Amount,
        getMinReturnedAmount()
      );
    else
      await bc.buyToken(
        swapTokens.token1Address,
        swapTokens.token2Address,
        token2Amount,
        getMaxPrice()
      );

    setToken1Amount('');
    setToken2Amount('');
  };

  const swapDialogProps = new SwapDialogModel(
    isSellingToken
      ? {
          isSellingToken,
          isOpen: isSwapDialogOpen,
          onClose: () => setIsSwapDialogOpen(false),
          tokens: [
            {
              amount: getMinReturnedAmount(),
              symbol: findToken(swapTokens.token2Address)?.symbol,
            },
          ],
          onProceed: proceed,
        }
      : {
          isSellingToken,
          isOpen: isSwapDialogOpen,
          onClose: () => setIsSwapDialogOpen(false),
          tokens: [
            {
              amount: getMaxPrice(),
              symbol: findToken(swapTokens.token1Address)?.symbol,
            },
          ],
          onProceed: proceed,
        }
  );

  return (
    <>
      <form className={classes.Swap} onSubmit={(e) => submit(e)}>
        <div className={classes.header}>
          <h1>Swap</h1>
        </div>
        <div className={classes['inputs-container']}>
          <div className={classes.inputs}>
            <TokenInput
              {...new TokenInputModel({
                value: token1Amount,
                tokenAddress: swapTokens.token1Address,
                onChange: (amount) => onAmountChange(amount, 1),
                onTokenChange: (address) => onTokenChange(address, 1),
              })}
            />
            <TokenInput
              {...new TokenInputModel({
                value: token2Amount,
                tokenAddress: swapTokens.token2Address,
                onChange: (amount) => onAmountChange(amount, 2),
                onTokenChange: (address) => onTokenChange(address, 2),
              })}
            />
          </div>
          <div className={classes.switch}>
            <Button onClick={switchTokens}>Switch</Button>
          </div>
        </div>
        <div className={classes['bottom-card']}>
          <label htmlFor="slippage">
            Slippage %:{' '}
            <input
              type="number"
              min={0}
              max={100}
              id="slippage"
              placeholder="0.5"
              value={slippage}
              onChange={(e) => setSlippage(+e.target.value)}
              step={0.1}
            />
          </label>
          {userAddress ? (
            doesPoolExist ? (
              <LoadingButton
                loading={isLoading}
                disabled={disabled}
                type="submit"
              >
                {bothAddresses
                  ? sufficientBalance
                    ? 'Swap'
                    : 'Insufficient Balance'
                  : 'Select Token'}
              </LoadingButton>
            ) : (
              <Button onClick={goToPool}>Create Pool</Button>
            )
          ) : (
            <ConnectWalletButton />
          )}
        </div>
      </form>
      <SwapDialog {...swapDialogProps} />
    </>
  );
};

export default Swap;
