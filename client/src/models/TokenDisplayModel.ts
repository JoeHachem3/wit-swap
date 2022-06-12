class TokenDisplayModel {
  tokenAddress: string;
  className: string;
  showAddress: boolean;
  showBalance: boolean;
  customBalance?: { label: 'Liquidity'; balance: string };
  isClickable: boolean;
  isImported: boolean;
  onClick: () => void;

  constructor(props: Partial<TokenDisplayModel>) {
    this.tokenAddress = props.tokenAddress || '';
    this.className = props.className || '';
    this.showAddress = !!props.showAddress;
    this.showBalance = !!props.showBalance;
    this.customBalance = props.customBalance;
    this.isClickable = !!props.isClickable;
    this.isImported = !!props.isImported;
    this.onClick =
      props.onClick ||
      (() => {
        return;
      });
  }
}

export default TokenDisplayModel;
