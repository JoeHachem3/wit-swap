import { PaletteMode } from '@mui/material';
import { createTheme, Theme } from '@mui/material/styles';
import type {} from '@mui/lab/themeAugmentation';
import '@mui/lab/themeAugmentation';

const getTheme = (mode: PaletteMode): Theme =>
  createTheme({
    typography: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeightLight: 400,
      fontWeightRegular: 600,
      fontWeightMedium: 700,
      fontWeightBold: 900,
    },
    palette: {
      mode,
      primary: {
        main: '#20577BCC',
        contrastText: '#0099FF',
      },
      contrastThreshold: 3,
      tonalOffset: 0.2,
      ...(mode === 'light'
        ? {
            secondary: {
              main: '#F3F5F7',
              contrastText: '#303030',
            },
            text: {
              primary: '#303030',
            },
          }
        : {
            secondary: {
              main: '#303030',
              contrastText: '#F3F5F7',
            },
            text: {
              primary: '#F3F5F7',
            },
          }),
    },
    components: {
      MuiButton: {
        defaultProps: {
          variant: 'contained',
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '2px',
            fontSize: '1rem',
            borderRadius: 'var(--border-radius-full)',
            width: '100%',
            padding: '0.5rem 1rem',
          },
        },
      },
      MuiLoadingButton: {
        defaultProps: {
          variant: 'contained',
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '2px',
            fontSize: '1rem',
            borderRadius: 'var(--border-radius-full)',
            width: '100%',
            padding: '0.5rem 1rem',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: 'var(--color-text)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: 'unset',
            background: 'var(--gradient-card)',
            backdropFilter: 'blur(4px)',
            borderRadius: 'var(--border-radius-lg)',
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '2rem 1rem !important',
            height: '100%',
            width: '100%',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '2rem 1rem',
            backgroundColor: 'unset',
            background: 'var(--gradient-card)',
            backdropFilter: 'blur(4px)',
            borderRadius: 'var(--border-radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: '12px',
            height: 'min-content',
            padding: '0.25em 0.5em',
            borderRadius: 'var(--border-radius-full)',
          },
        },
      },
    },
  });

export default getTheme;
