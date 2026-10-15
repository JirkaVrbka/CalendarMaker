/**
 * MUI theme factory. Calm, neutral chrome per the design brief, with Nunito as
 * the UI font (loaded via a Google Fonts <link> in index.html — no font
 * dependency). Light and dark variants share the same neutral palette so the
 * calendar's own colors read true.
 */
import { createTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark'

const FONT_FAMILY = ['Nunito', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'].join(
  ', ',
)

export function createAppTheme(mode: ThemeMode): Theme {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      background: {
        default: isDark ? '#16171d' : '#f7f7f8',
        paper: isDark ? '#1f2028' : '#ffffff',
      },
      primary: {
        main: isDark ? '#9db2d6' : '#4c6ef5',
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: FONT_FAMILY,
      h6: { fontWeight: 700 },
    },
    components: {
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'default' },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: '1px solid',
            borderColor: isDark ? '#2e303a' : '#e5e4e7',
          },
        },
      },
    },
  })
}
