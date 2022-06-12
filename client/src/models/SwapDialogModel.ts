class SwapDialogModel {
  tokens: {
    amount: string;
    symbol?: string;
  }[];
  isSellingToken: boolean;
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => Promise<void> | void;

  constructor(props: Partial<SwapDialogModel>) {
    this.tokens = props.tokens || [{ amount: '0', symbol: '' }];
    this.isSellingToken = !!props.isSellingToken;
    this.isOpen = !!props.isOpen;
    this.onClose =
      props.onClose ||
      (() => {
        return;
      });
    this.onProceed =
      props.onProceed ||
      (() => {
        return;
      });
  }
}

export default SwapDialogModel;
