export const minimizeAddress = (address: string) =>
  `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;

export const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export const smallMediaQuery = '(max-width:767px)';

export const getMinReturnedAmount = (slippage: number, amount: number) =>
  ((1 - slippage / 100) * amount).toFixed(8);

export const getMaxPrice = (slippage: number, amount: number) =>
  ((1 + slippage / 100) * +amount).toFixed(8);
