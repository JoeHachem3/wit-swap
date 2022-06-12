class TabLinkModel {
  to: string;
  label: string;
  menuOrientation: 'vertical' | 'horizontal';

  constructor(props: Partial<TabLinkModel>) {
    this.to = props.to || '';
    this.label = props.label || '';
    this.menuOrientation = props.menuOrientation || 'horizontal';
  }
}

export default TabLinkModel;
