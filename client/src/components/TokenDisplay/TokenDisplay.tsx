import React, { useRef } from 'react';
import TokenDisplayModel from '../../models/TokenDisplayModel';
import { minimizeAddress } from '../../utils';
import { ArrowDropDown, CopyAllRounded } from '@mui/icons-material';
import { Chip, Tooltip } from '@mui/material';
import classes from './TokenDisplay.module.css';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  userAddressSelector,
  userBalancesSelector,
} from '../../store/selectors';
import bc from '../../utils/blockchain';
import { useDispatch } from '../../store/hooks';
import { userActions } from '../../store/user/userReducer';

const TokenDisplay = (props: TokenDisplayModel) => {
  const tooltipTimeout = useRef<NodeJS.Timeout>();

  const balances = useSelector(userBalancesSelector);
  const userAddress = useSelector(userAddressSelector);

  const dispatch = useDispatch();
  const setBalance = useCallback(
    (tokenAddress: string, balance: string) =>
      dispatch(userActions.setBalance({ tokenAddress, balance })),
    []
  );

  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [isAddressCopied, setIsAddressCopied] = useState<boolean>(false);

  useEffect(() => {
    if (props.tokenAddress) {
      bc.getTokenSymbol(props.tokenAddress).then((result) => {
        if (result) setTokenSymbol(result);
      });
      if (userAddress && props.showBalance) {
        if (balances[props.tokenAddress] === undefined)
          bc.getTokenBalance(props.tokenAddress, userAddress).then((result) => {
            if (!result) return;
            setBalance(props.tokenAddress, result);
          });
      }
    }
  }, [props.showBalance, props.tokenAddress, userAddress]);

  const copyAddress = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(props.tokenAddress);
    setIsAddressCopied(true);
    tooltipTimeout.current && clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => {
      setIsAddressCopied(false);
    }, 2000);
  };

  return (
    <div className={`${classes['TokenDisplay']} ${props.className}`}>
      <div
        tabIndex={props.isClickable ? 0 : -1}
        className={`${classes['token']} ${
          props.isClickable
            ? 'clickable ' + (tokenSymbol ? classes['clickable'] : '')
            : ''
        } ${props.isImported ? classes['imported'] : ''}`}
        onClick={() => {
          if (props.isClickable) props.onClick();
        }}
        onKeyDown={(e) => {
          if (props.isClickable && [' ', 'Enter'].includes(e.key))
            props.onClick();
        }}
      >
        {tokenSymbol ? <span>{tokenSymbol}</span> : <ArrowDropDown />}
      </div>
      <div className={classes['info']}>
        {props.tokenAddress && props.showAddress && (
          <Tooltip
            title={'Token Address Copied!'}
            disableFocusListener
            disableHoverListener
            disableTouchListener
            disableInteractive
            open={isAddressCopied}
            onClose={() => setIsAddressCopied(false)}
          >
            <Chip
              size="small"
              icon={<CopyAllRounded />}
              label={minimizeAddress(props.tokenAddress)}
              onClick={(e) => copyAddress(e)}
            />
          </Tooltip>
        )}
        {props.showBalance ? (
          <span className={classes['balance']}>
            Balance: {balances[props.tokenAddress]}
          </span>
        ) : props.customBalance ? (
          <span className={classes['balance']}>
            {props.customBalance.label}: {props.customBalance.balance}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default TokenDisplay;
