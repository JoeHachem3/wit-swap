import * as redux from 'react-redux';
import type { AppState, AppDispatch } from './store';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useDispatch = () => redux.useDispatch<AppDispatch>();
export const useSelector: redux.TypedUseSelectorHook<AppState> =
  redux.useSelector;
