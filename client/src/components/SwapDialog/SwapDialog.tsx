import React, { useEffect } from 'react';
import { LoadingButton } from '@mui/lab';
import { Chip, Dialog, DialogContent, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import SwapDialogModel from '../../models/SwapDialogModel';
import classes from './SwapDialog.module.css';
import { smallMediaQuery } from '../../utils';
import BottomDrawer from '../BottomDrawer/BottomDrawer';
import { useSelector } from '../../store/hooks';
import { userAddressSelector } from '../../store/selectors';

const SwapDialog = (props: SwapDialogModel = new SwapDialogModel({})) => {
  const isSmallScreen = useMediaQuery(smallMediaQuery);

  const userAddress = useSelector(userAddressSelector);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (props.isOpen) {
      props.onClose();
    }
  }, [userAddress]);

  const onProceed = async () => {
    setIsLoading(true);
    try {
      await props.onProceed();
      setIsLoading(false);
      props.onClose();
    } catch (e) {
      setIsLoading(false);
      props.onClose();
    }
  };

  const content = (
    <>
      <span className={classes['message']}>
        {props.isSellingToken
          ? 'The Minimum You Will Get is'
          : 'The Maximum You Will Pay is'}{' '}
        {props.tokens.map((token, index) => (
          <Chip
            key={index}
            clickable
            className={classes['amount']}
            label={`${token.amount} ${token.symbol}`}
          />
        ))}
      </span>

      <LoadingButton loading={isLoading} onClick={onProceed}>
        Proceed
      </LoadingButton>
    </>
  );

  return (
    <>
      {isSmallScreen ? (
        <BottomDrawer open={props.isOpen} onClose={props.onClose}>
          {content}
        </BottomDrawer>
      ) : (
        <Dialog
          className="swap-dialog"
          open={props.isOpen}
          onClose={props.onClose}
        >
          <DialogContent className={classes['dialog-content']}>
            {content}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SwapDialog;
