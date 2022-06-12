import { AlertColor } from '@mui/material';
import { CaseReducer, createSlice, PayloadAction } from '@reduxjs/toolkit';
import uiState from './uiState';

const initialState: uiState = {
  snackbar: undefined,
};

const openSnackbar: CaseReducer<
  uiState,
  PayloadAction<{
    severity: AlertColor;
    message: string;
    link?: { href: string; label: string };
  }>
> = (state, action) => {
  state.snackbar = action.payload;
};

const uiSlice = createSlice({
  name: 'uiReducer',
  initialState,
  reducers: {
    openSnackbar,
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
