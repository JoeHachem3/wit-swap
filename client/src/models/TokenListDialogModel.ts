class TokenListDialogModel {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelected: (address: string) => void;

  constructor(props: Partial<TokenListDialogModel>) {
    this.isOpen = !!props.isOpen;
    this.onClose =
      props.onClose ||
      (() => {
        return;
      });
    this.onTokenSelected =
      props.onTokenSelected ||
      (() => {
        return;
      });
  }
}

export default TokenListDialogModel;
