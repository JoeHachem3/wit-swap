import { CaseReducer, createSlice, PayloadAction } from '@reduxjs/toolkit';
import UserState from './userState';
import { getNetworkId } from '../../utils/blockchain';

const initialState: UserState = {
  address: '',
  balances: { '3': {}, '1337': {} },
};

const setUserAddress: CaseReducer<
  UserState,
  PayloadAction<{ address: string }>
> = (state, action) => {
  state.address = action.payload.address;
};

const setBalance: CaseReducer<
  UserState,
  PayloadAction<{ tokenAddress: string; balance: string }>
> = (state, action) => {
  state.balances[getNetworkId()] &&
    (state.balances[getNetworkId()][action.payload.tokenAddress] =
      action.payload.balance);
};

const resetBalances: CaseReducer<UserState> = (state) => {
  state.balances = {};
};

const userSlice = createSlice({
  name: 'userReducer',
  initialState,
  reducers: {
    setUserAddress,
    setBalance,
    resetBalances,
  },
});

export const userActions = userSlice.actions;
export const userReducer = userSlice.reducer;
