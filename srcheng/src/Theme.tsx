import { createTheme, hexToRgb } from '@mui/material/styles';
import indigo from '@mui/material/colors/indigo';

const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: {
      main: hexToRgb('#dc004e)'), // Change this to your desired secondary color
    },
    background: {
      default: hexToRgb('#2d5069'), // Change this to your desired background color
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

export default theme;