import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** PrimeNG preset — Ozark maison: oxblood actions, sharp editorial corners. */
export const RemotelyRogersPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '0',
      sm: '0',
      md: '0',
      lg: '0',
      xl: '0',
    },
  },
  semantic: {
    primary: {
      50: '#f8eeee',
      100: '#edd8db',
      200: '#d7aeb3',
      300: '#b86d76',
      400: '#8e3944',
      500: '#6c2029',
      600: '#5c1b23',
      700: '#561920',
      800: '#3e1218',
      900: '#2b0c10',
      950: '#1a0709',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#6c2029',
          contrastColor: '#f7f2e7',
          hoverColor: '#882a34',
          activeColor: '#561920',
        },
        highlight: {
          background: '#6c2029',
          focusBackground: '#882a34',
          color: '#f7f2e7',
          focusColor: '#f7f2e7',
        },
      },
    },
  },
});
