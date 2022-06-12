class BottomDrawerModel {
  open: boolean;
  onClose: () => void;

  constructor(props: Partial<BottomDrawerModel>) {
    this.open = !!props.open;
    this.onClose =
      props.onClose ||
      (() => {
        return;
      });
  }
}

export default BottomDrawerModel;
