import React from 'react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import TokenInputModel from '../../models/TokenInputModel';
import classes from './TokenInput.module.css';
import TokenDisplay from '../TokenDisplay/TokenDisplay';
import TokenDisplayModel from '../../models/TokenDisplayModel';
import bc from '../../utils/blockchain';
import { useDispatch, useSelector } from '../../store/hooks';
import {
  userAddressSelector,
  userBalancesSelector,
} from '../../store/selectors';
import { userActions } from '../../store/user/userReducer';
import { Button } from '@mui/material';
import TokenListDialog from '../TokenListDialog/TokenListDialog';
import TookensListDialogModel from '../../models/TokenListDialogModel';

const TokenInput: FC<TokenInputModel> = (props = new TokenInputModel({})) => {
  const balances = useSelector(userBalancesSelector);
  const userAddress = useSelector(userAddressSelector);

  const dispatch = useDispatch();
  const setBalance = useCallback(
    (tokenAddress: string, balance: string) =>
      dispatch(userActions.setBalance({ tokenAddress, balance })),
    []
  );

  const [value, setValue] = useState<string>(props.value);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const inputTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  useEffect(() => {
    if (userAddress && props.tokenAddress) {
      if (balances[props.tokenAddress] === undefined)
        bc.getTokenBalance(props.tokenAddress, userAddress).then((result) => {
          if (!result) return;
          setBalance(props.tokenAddress, result);
        });
    }
  }, [props.tokenAddress, userAddress]);

  const onChange = (value: string) => {
    setValue(value);
    inputTimeout.current && clearTimeout(inputTimeout.current);
    inputTimeout.current = setTimeout(() => {
      props.onChange(value);
    }, 500);
  };

  const onTokenChange = (address: string) => {
    props.onTokenChange(address);
    setIsDialogOpen(false);
  };

  return (
    <div className={classes['TokenInput']}>
      <input
        formNoValidate
        className={classes['amount-input']}
        type="number"
        step="any"
        min="0"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <TokenDisplay
        {...new TokenDisplayModel({
          tokenAddress: props.tokenAddress,
          className: classes['token'],
          onClick: () => setIsDialogOpen(true),
          isClickable: true,
        })}
      />
      {userAddress && !!+balances[props.tokenAddress] && (
        <Button
          onClick={() => onChange(balances[props.tokenAddress])}
          className={classes['max-button']}
          variant="outlined"
        >
          Max
        </Button>
      )}
      <TokenListDialog
        {...new TookensListDialogModel({
          isOpen: isDialogOpen,
          onClose: () => setIsDialogOpen(false),
          onTokenSelected: (address) => onTokenChange(address),
        })}
      />
    </div>
  );
};

export default TokenInput;
