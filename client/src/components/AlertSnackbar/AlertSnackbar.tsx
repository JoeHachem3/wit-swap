import React from 'react';
import { Alert, Snackbar, SnackbarCloseReason } from '@mui/material';
import AlertSnackbarModel from '../../models/AlertSnackbarModel';
import classes from './AlertSnackbar.module.css';

const AlertSnackbar = (
  props: AlertSnackbarModel = new AlertSnackbarModel({})
) => {
  const onClose = (
    e: Event | React.SyntheticEvent<any, Event>,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') return;
    props.onClose();
  };
  return (
    <Snackbar open={props.isOpen} onClose={onClose}>
      <Alert severity={props.severity} onClose={onClose} sx={{ width: '100%' }}>
        {props.message}
        {props.link && (
          <a
            className={classes['anchor']}
            href={props.link.href}
            target="_blank"
          >
            {props.link.label}
          </a>
        )}
      </Alert>
    </Snackbar>
  );
};

export default AlertSnackbar;
