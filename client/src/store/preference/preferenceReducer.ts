import { CaseReducer, createSlice, PayloadAction } from '@reduxjs/toolkit';
import PreferenceState from './preferenceState';
import { getNetworkId } from '../../utils/blockchain';

const initialState: PreferenceState = {
  swap: {
    tokens: {
      '3': {
        token1Address: '',
        token2Address: '',
      },
      '1337': {
        token1Address: '',
        token2Address: '',
      },
    },
    slippage: 0.5,
  },
  pool: {
    tokens: {
      '3': {
        token1Address: '',
        token2Address: '',
      },
      '1337': {
        token1Address: '',
        token2Address: '',
      },
    },
  },
  liquidity: {
    slippage: 0.5,
  },
};

const setToken1: CaseReducer<
  PreferenceState,
  PayloadAction<{ page: 'swap' | 'pool'; address: string }>
> = (state, action) => {
  state[action.payload.page].tokens[getNetworkId()] &&
    (state[action.payload.page].tokens[getNetworkId()].token1Address =
      action.payload.address);
};

const setToken2: CaseReducer<
  PreferenceState,
  PayloadAction<{ page: 'swap' | 'pool'; address: string }>
> = (state, action) => {
  state[action.payload.page].tokens[getNetworkId()] &&
    (state[action.payload.page].tokens[getNetworkId()].token2Address =
      action.payload.address);
};

const setSlippage: CaseReducer<
  PreferenceState,
  PayloadAction<{ page: 'swap' | 'liquidity'; slippage: number }>
> = (state, action) => {
  state[action.payload.page].slippage = action.payload.slippage;
};

const preferenceSlice = createSlice({
  name: 'preferenceReducer',
  initialState,
  reducers: {
    setToken1,
    setToken2,
    setSlippage,
  },
});

export const preferenceActions = preferenceSlice.actions;
export const preferenceReducer = preferenceSlice.reducer;
