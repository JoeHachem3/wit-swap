import * as redux from 'react-redux';
import type { AppState, AppDispatch } from './store';

export const useDispatch = () => redux.useDispatch<AppDispatch>();
export const useSelector: redux.TypedUseSelectorHook<AppState> =
  redux.useSelector;
