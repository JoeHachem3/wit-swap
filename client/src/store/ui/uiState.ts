import { AlertColor } from '@mui/material';

interface uiState {
  snackbar?: {
    severity: AlertColor;
    message: string;
    link?: { href: string; label: string };
  };
}

export default uiState;
