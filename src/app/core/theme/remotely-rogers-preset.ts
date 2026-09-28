import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** PrimeNG preset — Ozark maison oxblood primary, editorial corners. */
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
      50: '#f9ecee',
      100: '#f0d4d8',
      200: '#e0a9b1',
      300: '#c96f7c',
      400: '#a84454',
      500: '#6c2029',
      600: '#882a34',
      700: '#561920',
      800: '#3d1218',
      900: '#2b1f17',
      950: '#1a0f12',
    },
  },
});
