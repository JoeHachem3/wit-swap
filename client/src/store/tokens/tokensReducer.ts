import { CaseReducer, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TokenModel } from '../../models/TokenModel';
import TokensState from './tokensState';
import { getNetworkId } from '../../utils/blockchain';

const initialState: TokensState = {
  defaultTokens: { '3': [], '1337': [] },
  importedTokens: { '3': [], '1337': [] },
};

const addToken: CaseReducer<
  TokensState,
  PayloadAction<{ token: TokenModel }>
> = (state, action) => {
  !state.importedTokens[getNetworkId()]?.find(
    (token) => token.address === action.payload.token.address
  ) &&
    !state.defaultTokens[getNetworkId()]?.find(
      (token) => token.address === action.payload.token.address
    ) &&
    state.importedTokens[getNetworkId()]?.push(action.payload.token as any);
};

const removeToken: CaseReducer<
  TokensState,
  PayloadAction<{ address: string }>
> = (state, action) => {
  state.importedTokens[getNetworkId()] &&
    (state.importedTokens[getNetworkId()] = state.importedTokens[
      getNetworkId()
    ].filter((token) => token.address !== action.payload.address));
};

const setImportedTokens: CaseReducer<
  TokensState,
  PayloadAction<{ importedTokens: TokenModel[] }>
> = (state, action) => {
  state.importedTokens[getNetworkId()] &&
    (state.importedTokens[getNetworkId()] = action.payload.importedTokens);
};

const setDefaultTokens: CaseReducer<
  TokensState,
  PayloadAction<{ defaultTokens: TokenModel[] }>
> = (state, action) => {
  state.defaultTokens[getNetworkId()] &&
    (state.defaultTokens[getNetworkId()] = action.payload.defaultTokens);
};

const tokensSlice = createSlice({
  name: 'tokensReducer',
  initialState,
  reducers: {
    addToken,
    removeToken,
    setImportedTokens,
    setDefaultTokens,
  },
});

export const tokensActions = tokensSlice.actions;
export const tokensReducer = tokensSlice.reducer;
