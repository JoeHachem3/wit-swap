import React from 'react';
import { ArrowRightAltRounded } from '@mui/icons-material';
import TokenDisplayModel from '../../models/TokenDisplayModel';
import TokenListItemModel from '../../models/TokenListItemModel';
import TokenDisplay from '../TokenDisplay/TokenDisplay';
import classes from './TokenListItem.module.css';

const TokenListItem: React.FC<TokenListItemModel> = (
  props = new TokenListItemModel({})
) => {
  const tokenDisplayProps = new TokenDisplayModel(
    props.liquidity === undefined
      ? {
          tokenAddress: props.tokenAddress,
          isImported: props.isImported,
          showAddress: true,
          showBalance: true,
          className: classes.token,
        }
      : {
          tokenAddress: props.tokenAddress,
          isImported: props.isImported,
          showAddress: true,
          showBalance: false,
          className: classes.token,
          customBalance: { label: 'Liquidity', balance: props.liquidity },
        }
  );
  return (
    <button
      type="button"
      tabIndex={props.isClickable ? 0 : -1}
      onClick={() => {
        if (props.isClickable) props.onClick();
      }}
      className={`${classes.TokenListItem} ${
        props.isClickable ? 'clickable ' + classes.clickable : ''
      }`}
    >
      <TokenDisplay {...tokenDisplayProps} />
      {props.withArrow && (
        <ArrowRightAltRounded className={`${classes.arrow}`} />
      )}
    </button>
  );
};

export default TokenListItem;
