interface PreferenceState {
  swap: {
    tokens: {
      [network: string]: {
        token1Address: string;
        token2Address: string;
      };
    };
    slippage: number;
  };
  pool: {
    tokens: {
      [network: string]: {
        token1Address: string;
        token2Address: string;
      };
    };
  };
  liquidity: {
    slippage: number;
  };
}

export default PreferenceState;
