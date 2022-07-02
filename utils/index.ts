export const zeroAddress = '0x0000000000000000000000000000000000000000';

export const toWei = (amount: number | string, decimals = 18): string => {
  amount = amount.toString();
  const numbers = amount.split('.');
  if (numbers.length === 1) return amount + '000000000000000000';
  let addedZeros = '';
  for (let i = 0; i < Math.max(0, decimals - numbers[1].length); i++)
    addedZeros += '0';
  return numbers[0] + numbers[1] + addedZeros;
};

export const toEther = (amount: string, decimals = 18): string =>
  (+amount.toString() / Math.pow(10, decimals)).toString();
