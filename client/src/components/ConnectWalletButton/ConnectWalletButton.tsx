import React, { useCallback } from 'react';
import { useDispatch, useSelector } from '../../store/hooks';
import { userAddressSelector } from '../../store/selectors';
import bc from '../../utils/blockchain';
import { Button } from '@mui/material';
import { minimizeAddress } from '../../utils';
import classes from './ConnectWalletButton.module.css';
import { userActions } from '../../store/user/userReducer';

const ConnectWalletButton: React.FC<{
  size?: 'small' | 'large';
}> = ({ size = 'large' }) => {
  const userAddress = useSelector(userAddressSelector);

  const dispatch = useDispatch();

  const setUserAddress = useCallback(
    (address: string) => dispatch(userActions.setUserAddress({ address })),
    []
  );

  const connectWallet = () => {
    if (userAddress) return;
    bc.connectWallet().then((address) => {
      if (address) setUserAddress(address);
    });
  };

  return (
    <Button onClick={connectWallet} className={classes[size]}>
      {userAddress ? minimizeAddress(userAddress) : 'Connect Wallet'}
    </Button>
  );
};

export default ConnectWalletButton;
