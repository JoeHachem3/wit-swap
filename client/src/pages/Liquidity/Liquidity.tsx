import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TokenListItem from '../../components/TokenListItem/TokenListItem';
import TokenListItemModel from '../../models/TokenListItemModel';
import { SwapVert } from '@mui/icons-material';
import bc from '../../utils/blockchain';
import classes from './Liquidy.module.css';
import { LoadingButton } from '@mui/lab';
import { useDispatch, useSelector } from '../../store/hooks';
import { liquiditySlippageSelector } from '../../store/selectors';
import { preferenceActions } from '../../store/preference/preferenceReducer';
import SwapDialog from '../../components/SwapDialog/SwapDialog';
import SwapDialogModel from '../../models/SwapDialogModel';
import { getMinReturnedAmount } from '../../utils';

const Liquidity = () => {
  const { token1Address, token2Address } = (useLocation().state || {}) as {
    token1Address?: string;
    token2Address?: string;
  };
  const navigate = useNavigate();

  const slippage = useSelector(liquiditySlippageSelector);

  const dispatch = useDispatch();
  const setSlippage = useCallback(
    (slippage: number) =>
      dispatch(preferenceActions.setSlippage({ page: 'swap', slippage })),
    []
  );

  const [lpTokenAddress, setLpTokenAddress] = useState<string>('');
  const [tokenBalances, setTokenBalances] = useState<{
    token1Amount: string;
    token2Amount: string;
  }>({ token1Amount: '', token2Amount: '' });
  const [token1Symbol, setToken1Symbol] = useState<string>('');
  const [token2Symbol, setToken2Symbol] = useState<string>('');
  const [lpTokenBalance, setLpTokenBalance] = useState<string>('');
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!token1Address || !token2Address) navigate('/pool', { replace: true });
    else {
      bc.getTokenSymbol(token1Address).then((symbol) =>
        setToken1Symbol(symbol || '')
      );
      bc.getTokenSymbol(token2Address).then((symbol) =>
        setToken2Symbol(symbol || '')
      );
      bc.getLpTokenContract(token1Address, token2Address).then(
        async (tokenContract) => {
          if (tokenContract) {
            setLpTokenAddress(tokenContract.address);
            bc.getTokenBalance(tokenContract.address).then((balance) => {
              if (balance !== undefined) {
                setLpTokenBalance(balance);
                bc.getLiquidity(token1Address, token2Address, balance).then(
                  (res) => {
                    if (res) setTokenBalances(res);
                  }
                );
              }
            });
          }
        }
      );
    }
  }, []);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSwapDialogOpen(true);
  };

  const proceed = async () => {
    await bc.withdrawLiquidity(
      token1Address!,
      getMinReturnedAmount(slippage, +tokenBalances.token1Amount),
      token2Address!,
      getMinReturnedAmount(slippage, +tokenBalances.token2Amount),
      lpTokenBalance
    );
    navigate('swap', { replace: true });
  };

  return (
    <>
      <form className={classes['Liquidity']} onSubmit={(e) => submit(e)}>
        <div className={classes['header']}>
          <h1>Swap</h1>
        </div>
        <div className={classes['tokens']}>
          <TokenListItem
            {...new TokenListItemModel({
              tokenAddress: lpTokenAddress,
            })}
          />
          <SwapVert />
          <div className={classes['returned-tokens']}>
            <TokenListItem
              {...new TokenListItemModel({
                tokenAddress: token1Address,
                liquidity: tokenBalances.token1Amount,
              })}
            />
            <TokenListItem
              {...new TokenListItemModel({
                tokenAddress: token2Address,
                liquidity: tokenBalances.token2Amount,
              })}
            />
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
          <LoadingButton type="submit">Withdraw Liquidity</LoadingButton>
        </div>
      </form>
      <SwapDialog
        {...new SwapDialogModel({
          isSellingToken: true,
          isOpen: isSwapDialogOpen,
          onClose: () => setIsSwapDialogOpen(false),
          tokens: [
            {
              amount: getMinReturnedAmount(
                slippage,
                +tokenBalances.token1Amount
              ),
              symbol: token1Symbol,
            },
            {
              amount: getMinReturnedAmount(
                slippage,
                +tokenBalances.token2Amount
              ),
              symbol: token2Symbol,
            },
          ],
          onProceed: proceed,
        })}
      />
    </>
  );
};

export default Liquidity;
