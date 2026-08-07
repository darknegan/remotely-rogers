import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** PrimeNG preset — forest primary, rounded corners matching Lodgify site. */
export const RemotelyRogersPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '20px',
    },
  },
  semantic: {
    primary: {
      50: '#eef3f1',
      100: '#d5e0db',
      200: '#aac1b7',
      300: '#7fa293',
      400: '#5a7d6a',
      500: '#2d4a3e',
      600: '#274036',
      700: '#1e3329',
      800: '#162720',
      900: '#0f1a16',
      950: '#080d0b',
    },
  },
});
