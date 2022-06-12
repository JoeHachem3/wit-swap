import { AppState } from './store';
import { getNetworkId } from '../utils/blockchain';

// Selectors
export const userAddressSelector = (state: AppState) =>
  state.userReducer.address;
export const userBalancesSelector = (state: AppState) =>
  state.userReducer.balances[getNetworkId()] || {};

export const tokensSelector = (state: AppState) => ({
  defaultTokens: state.tokensReducer.defaultTokens[getNetworkId()] || [],
  importedTokens: state.tokensReducer.importedTokens[getNetworkId()] || [],
});
export const importedTokensSelector = (state: AppState) =>
  state.tokensReducer.importedTokens[getNetworkId()] || [];
export const defaultTokensSelector = (state: AppState) =>
  state.tokensReducer.defaultTokens[getNetworkId()] || [];

export const poolTokensSelector = (state: AppState) =>
  state.preferenceReducer.pool.tokens[getNetworkId()] || [];
export const swapTokensSelector = (state: AppState) =>
  state.preferenceReducer.swap.tokens[getNetworkId()] || [];

export const swapSlippageSelector = (state: AppState) =>
  state.preferenceReducer.swap.slippage;
export const liquiditySlippageSelector = (state: AppState) =>
  state.preferenceReducer.liquidity.slippage;

export const snackbarSelector = (state: AppState) => state.uiReducer.snackbar;

// Wrappers
export const userBalanceSelectorWrapper = (address: string) => {
  return (state: AppState) =>
    state.userReducer.balances[getNetworkId()]?.[address] || '';
};
