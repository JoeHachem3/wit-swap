import { TokenModel } from '../../models/TokenModel';

interface TokensState {
  defaultTokens: { [network: string]: TokenModel[] };
  importedTokens: { [network: string]: TokenModel[] };
}

export default TokensState;
