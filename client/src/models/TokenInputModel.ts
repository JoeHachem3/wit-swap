class TokenInputModel {
  tokenAddress: string;
  value: string;
  onChange: (value: string) => void;
  onTokenChange: (address: string) => void;

  constructor(props: Partial<TokenInputModel>) {
    this.tokenAddress = props.tokenAddress || '';
    this.value = props.value || '';
    this.onChange =
      props.onChange ||
      (() => {
        return;
      });
    this.onTokenChange =
      props.onTokenChange ||
      (() => {
        return;
      });
  }
}

export default TokenInputModel;
