import React, { useCallback, useEffect, useRef, useState } from 'react';
import classes from './TokenListDialog.module.css';
import {
  Dialog,
  DialogContent,
  Button,
  AlertColor,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { ArrowBackIosNew, Archive } from '@mui/icons-material';
import TokenListDialogModel from '../../models/TokenListDialogModel';
import { useSelector } from 'react-redux';
import { tokensSelector } from '../../store/selectors';
import { useDispatch } from '../../store/hooks';
import { tokensActions } from '../../store/tokens/tokensReducer';
import { createTokenModel, TokenModel } from '../../models/TokenModel';
import { LoadingButton } from '@mui/lab';
import { addressRegex, smallMediaQuery } from '../../utils';
import { uiActions } from '../../store/ui/uiReducer';
import BottomDrawer from '../BottomDrawer/BottomDrawer';
import TokenListItem from '../TokenListItem/TokenListItem';
import TokenListItemModel from '../../models/TokenListItemModel';

const TokenListDialog: React.FC<TokenListDialogModel> = (
  props = new TokenListDialogModel({})
) => {
  const isSmallScreen = useMediaQuery(smallMediaQuery);

  const inputTimeout = useRef<NodeJS.Timeout>();

  const tokens = useSelector(tokensSelector);

  const dispatch = useDispatch();
  const addToken = useCallback(
    (token: TokenModel) => dispatch(tokensActions.addToken({ token })),
    []
  );
  const openSnackbar = useCallback(
    (severity: AlertColor, message: string) =>
      dispatch(uiActions.openSnackbar({ severity, message })),
    []
  );

  const [defaultTokens, setDefaultTokens] = useState<TokenModel[]>(
    tokens.defaultTokens
  );
  const [importedTokens, setImportedTokens] = useState<TokenModel[]>(
    tokens.importedTokens
  );
  const [isImportMode, setIsImportMode] = useState<boolean>(false);
  const [tokenAddressInvalidityReason, setTokenAddressInvalidityReason] =
    useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [searchValue, setSearchValue] = useState<string>('');

  useEffect(() => {
    if (props.isOpen) {
      setIsImportMode(false);
      setIsLoading(false);
    }
  }, [props.isOpen]);

  useEffect(() => {
    inputTimeout.current && clearTimeout(inputTimeout.current);
    setIsLoading(true);

    inputTimeout.current = setTimeout(() => {
      if (!tokenAddress) setTokenAddressInvalidityReason('');
      else if (!addressRegex.test(tokenAddress))
        setTokenAddressInvalidityReason('Invalid Token Address');
      else if (
        tokens.defaultTokens.find((token) => token.address === tokenAddress) ||
        tokens.importedTokens.find((token) => token.address === tokenAddress)
      )
        setTokenAddressInvalidityReason('Token Already Exists');
      else setTokenAddressInvalidityReason('');
      setIsLoading(false);
    }, 500);
  }, [tokenAddress]);

  useEffect(() => {
    inputTimeout.current && clearTimeout(inputTimeout.current);

    inputTimeout.current = setTimeout(() => {
      if (!searchValue) {
        setDefaultTokens(tokens.defaultTokens);
        setImportedTokens(tokens.importedTokens);
      } else {
        setDefaultTokens(
          tokens.defaultTokens.filter((token) =>
            token.symbol.toLowerCase().includes(searchValue.toLowerCase())
          )
        );
        setImportedTokens(
          tokens.importedTokens.filter((token) =>
            token.symbol.toLowerCase().includes(searchValue.toLowerCase())
          )
        );
      }
    }, 500);
  }, [tokens, searchValue]);

  const disabled = !tokenAddress || isLoading || !!tokenAddressInvalidityReason;

  const importToken = (e: React.FormEvent<HTMLFormElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsLoading(true);
    createTokenModel(tokenAddress)
      .then((token) => {
        if (!token) return;
        addToken(token);
        setIsImportMode(false);
        props.onTokenSelected(tokenAddress);
      })
      .catch(() => {
        openSnackbar('error', 'Could not Find an ERC20 Token at This Address');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onClose = () => {
    setSearchValue('');
    setTokenAddress('');
    setTokenAddressInvalidityReason('');

    props.onClose();
  };

  const tokenListItemMapping =
    (isImported = false) =>
    (token: TokenModel) =>
      (
        <TokenListItem
          key={token.address}
          {...new TokenListItemModel({
            onClick: () => props.onTokenSelected(token.address),
            tokenAddress: token.address,
            withArrow: !isSmallScreen,
            isClickable: true,
            isImported,
          })}
        />
      );

  const content = isImportMode ? (
    <>
      <div className={classes.header}>
        <h1>Import Token</h1>
        <IconButton className="md" onClick={() => setIsImportMode(false)}>
          <ArrowBackIosNew />
        </IconButton>
        <Button
          onClick={() => setIsImportMode(false)}
          className={`${classes['import-button']} lg`}
        >
          Back
        </Button>
      </div>
      <form onSubmit={(e) => importToken(e)} className={classes['import-form']}>
        <input
          className={classes.input}
          placeholder="0x123..."
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />
        <LoadingButton loading={isLoading} type="submit" disabled={disabled}>
          {tokenAddressInvalidityReason || 'Import Token'}
        </LoadingButton>
      </form>
    </>
  ) : (
    <>
      <div className={classes.header}>
        <h1>Select Token</h1>
        <IconButton className="md" onClick={() => setIsImportMode(true)}>
          <Archive />
        </IconButton>
        <Button
          onClick={() => setIsImportMode(true)}
          className={`${classes['import-button']} lg`}
        >
          Import Token
        </Button>
        <input
          className={classes.input}
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>
      <div className={classes['tokens-section']}>
        {!defaultTokens.length && !importedTokens.length ? (
          <>
            <span>No Token Found</span>
            <Button
              onClick={() => setIsImportMode(true)}
              className={classes['import-button']}
            >
              Import Token
            </Button>
          </>
        ) : (
          <div className={classes['tokens-list']}>
            {defaultTokens.map(tokenListItemMapping())}
            {importedTokens.map(tokenListItemMapping(true))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {isSmallScreen ? (
        <BottomDrawer open={props.isOpen} onClose={onClose}>
          {content}
        </BottomDrawer>
      ) : (
        <Dialog open={props.isOpen} onClose={onClose}>
          <DialogContent>{content}</DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default TokenListDialog;
