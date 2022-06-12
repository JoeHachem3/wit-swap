import bc from '../utils/blockchain';

export interface TokenModel {
  symbol: string;
  address: string;
}

export const createTokenModel = async (
  address: string
): Promise<TokenModel | undefined> => {
  const symbol = (await bc.getTokenSymbol(address)) || '';
  return { address, symbol };
};
