class TokenListItemModel {
  tokenAddress: string;
  withArrow: boolean;
  liquidity?: string;
  isClickable: boolean;
  isImported: boolean;
  onClick: () => void;

  constructor(props: Partial<TokenListItemModel>) {
    this.tokenAddress = props.tokenAddress || '';
    this.withArrow = !!props.withArrow;
    this.liquidity = props.liquidity;
    this.isClickable = !!props.isClickable;
    this.isImported = !!props.isImported;
    this.onClick =
      props.onClick ||
      (() => {
        return;
      });
  }
}

export default TokenListItemModel;
