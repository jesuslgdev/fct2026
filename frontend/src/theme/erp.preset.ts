

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const ErpPreset = definePreset(Aura, {

  primitive: {

    neutral: {
      50:  '#fafafa',
      100: '#f5f5f5',
      200: '#e8e8e8',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#2d2d2d',
      900: '#1c1c1c',
      950: '#111111',
    },
  },

  semantic: {
    primary: {
      50:  '#fafafa',
      100: '#f5f5f5',
      200: '#e8e8e8',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#2d2d2d',
      900: '#1c1c1c',
      950: '#111111',
    },
    colorScheme: {
      light: {
        primary: {
          color:        '#1c1c1c',
          inverseColor: '#ffffff',
          hoverColor:   '#2d2d2d',
          activeColor:  '#111111',
        },
        highlight: {
          background:      '#f5f5f5',
          focusBackground: '#e8e8e8',
          color:           '#1c1c1c',
          focusColor:      '#111111',
        },
        surface: {
          0:   '#ffffff',
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#2d2d2d',
          900: '#1c1c1c',
          950: '#111111',
        },
      },
      dark: {
        primary: {
          color:        '#1c1c1c',
          inverseColor: '#ffffff',
          hoverColor:   '#2d2d2d',
          activeColor:  '#111111',
        },
        highlight: {
          background:      '#f5f5f5',
          focusBackground: '#e8e8e8',
          color:           '#1c1c1c',
          focusColor:      '#111111',
        },
        surface: {
          0:   '#ffffff',
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#2d2d2d',
          900: '#1c1c1c',
          950: '#111111',
        },
      },
    },
  },
});