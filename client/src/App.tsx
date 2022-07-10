import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { Card, CardContent } from '@mui/material';
import classes from './App.module.css';
import backgroundImage from './assets/background.png';
import bc from './utils/blockchain';
import { useDispatch, useSelector } from './store/hooks';
import { userActions } from './store/user/userReducer';
import { createTokenModel, TokenModel } from './models/TokenModel';
import { tokensActions } from './store/tokens/tokensReducer';
import { snackbarSelector } from './store/selectors';
import AlertSnackbar from './components/AlertSnackbar/AlertSnackbar';
import AlertSnackbarModel from './models/AlertSnackbarModel';

const App: React.FC = () => {
  const snackbar = useSelector(snackbarSelector);

  const dispatch = useDispatch();

  const [isSnackbarOpen, setIsSnackbarOpen] = useState<boolean>(false);

  useEffect(() => {
    bc.isNetworkSupported().then((res) => {
      if (!res) {
        bc.handleError('WRONG_NETWORK');
        return;
      }

      Promise.all(
        bc
          .getContractAddresses()
          .claimableTokens.map((address) => createTokenModel(address))
      ).then((res) => {
        const defaultTokens = res.filter((token) => token) as TokenModel[];
        dispatch(tokensActions.setDefaultTokens({ defaultTokens }));
      });

      bc.connectWallet().then((address) => {
        if (address) dispatch(userActions.setUserAddress({ address }));
      });
    });
  }, []);

  useEffect(() => {
    setIsSnackbarOpen(false);
    setTimeout(() => {
      setIsSnackbarOpen(true);
    }, 100);
  }, [snackbar]);

  return (
    <div className={classes.app}>
      <img className={classes.background} src={backgroundImage} alt="" />
      <main className={classes.main}>
        <Header />
        <Card className={classes.card}>
          <CardContent className={classes['card-content']}>
            <Outlet />
          </CardContent>
        </Card>
        <Footer />
        {snackbar && (
          <AlertSnackbar
            {...new AlertSnackbarModel({
              ...snackbar,
              isOpen: isSnackbarOpen,
              onClose: () => setIsSnackbarOpen(false),
            })}
          />
        )}
      </main>
    </div>
  );
};

export default App;
