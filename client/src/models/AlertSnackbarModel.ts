import { AlertColor } from '@mui/material';

class AlertSnackbarModel {
  isOpen: boolean;
  onClose: () => void;
  severity: AlertColor;
  message: string;
  link?: { href: string; label: string };

  constructor(props: Partial<AlertSnackbarModel>) {
    this.isOpen = !!props.isOpen;
    this.onClose =
      props.onClose ||
      (() => {
        return;
      });
    this.severity = props.severity || 'success';
    this.message =
      props.message ||
      (this.severity === 'error'
        ? 'Something Went Wrong'
        : this.severity === 'info'
        ? 'Did You Know That This is My First Blockchain Project?'
        : this.severity === 'warning'
        ? 'You are Limiting Yourself... Stop it'
        : 'Action Completed Successfully');
    this.link = props.link;
  }
}

export default AlertSnackbarModel;
