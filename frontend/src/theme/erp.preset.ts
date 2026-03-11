// src/theme/erp.preset.ts
// ================================================================
// Single source of truth (SSoT) for the design system.
// All visual customization lives here — minimal external CSS.
//
// Hierarchy:
//   1. primitive  → raw value palette
//   2. semantic   → contextual meaning, references to primitives
//   3. components → component tokens, references to semantics
// ================================================================

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const ErpPreset = definePreset(Aura, {

  // ── 1. PRIMITIVE — raw palette ───────────────────────────────
  // Color values without semantic meaning.
  // All higher layers reference these values via {neutral.X}.
  // If a color changes, update only here.
  primitive: {
    neutral: {
      50: '#f8fafc',      // lightest gray
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',     // dark bluish gray
      950: '#0a1120',     // almost black
    },
    blue: {
      50: '#eff6ff',     // lightest blue
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#60a5fa',    // light blue
      400: '#3b82f6',
      500: '#2563eb',    // corporate blue
      600: '#1d4ed8',
      700: '#1e40af',    // deep blue
      800: '#1e3a8a',
      900: '#1e3163',
      950: '#172554',    // almost navy
    },
    green: {
      500: '#22c55e',    // success green
      600: '#16a34a',
      700: '#166534',
    },
    red: {
      500: '#ef4444',    // error red
      600: '#dc2626',
      700: '#991b1b',
    },
    gold: {
      500: '#fbbf24',    // warning gold
      600: '#f59e0b',
      700: '#b45309',
    },
    accent: {
      500: '#38bdf8',    // accent blue
      600: '#0ea5e9',
      700: '#0369a1',
    },
  },

  // ── 2. SEMANTIC — significado contextual ─────────────────────
  semantic: {
    // Primary = corporate blue
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}',
    },

    colorScheme: {
      light: {
        primary: {
          color: '{blue.700}',
          inverseColor: '#ffffff',
          hoverColor: '{blue.500}',
          activeColor: '{blue.700}',
          contrastColor: '#ffffff',
        },
        highlight: {
          background: '{accent.500}',
          focusBackground: '{accent.600}',
          color: '{blue.700}',
          focusColor: '{blue.700}',
        },
        surface: {
          0: '#ffffff',
          50: '{neutral.50}',
          100: '{neutral.100}',
          200: '{neutral.200}',
          300: '{neutral.300}',
          400: '{neutral.400}',
          500: '{neutral.500}',
          600: '{neutral.600}',
          700: '{neutral.700}',
          800: '{neutral.800}',
          900: '{neutral.900}',
          950: '{neutral.950}',
        },
      },

      // No dark mode — same values as light
      dark: {
        primary: {
          color: '{neutral.900}',
          inverseColor: '#ffffff',
          hoverColor: '{neutral.800}',
          activeColor: '{neutral.950}',
          contrastColor: '#ffffff',
        },
        highlight: {
          background: '{neutral.100}',
          focusBackground: '{neutral.200}',
          color: '{neutral.900}',
          focusColor: '{neutral.950}',
        },
        surface: {
          0: '#ffffff',
          50: '{neutral.50}',
          100: '{neutral.100}',
          200: '{neutral.200}',
          300: '{neutral.300}',
          400: '{neutral.400}',
          500: '{neutral.500}',
          600: '{neutral.600}',
          700: '{neutral.700}',
          800: '{neutral.800}',
          900: '{neutral.900}',
          950: '{neutral.950}',
        },
      },
    },
  },

  // ── 3. COMPONENTS — tokens por componente ────────────────────
  // Recommended way to customize PrimeNG components.
  // Avoid external CSS overrides — all color logic lives here.
  // The `root` wrapper is mandatory in PrimeNG v19+.
  components: {

    button: {
      root: {
        borderRadius: '0.375rem',
        gap: '0.375rem',
        paddingX: '1rem',
        paddingY: '0.5rem',
        sm: {
          fontSize: '0.75rem',
          paddingX: '0.75rem',
          paddingY: '0.375rem',
        },
        lg: {
          fontSize: '1rem',
          paddingX: '1.25rem',
          paddingY: '0.625rem',
        },
      },
      colorScheme: {
        light: {
          root: {
            // Primary — corporate blue
            primary: {
              background: '{blue.500}',
              hoverBackground: '{blue.600}',
              activeBackground: '{blue.700}',
              borderColor: '{blue.500}',
              hoverBorderColor: '{blue.600}',
              activeBorderColor: '{blue.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
            // Secondary — dark gray
            secondary: {
              background: '{neutral.700}',
              hoverBackground: '{neutral.800}',
              activeBackground: '{neutral.900}',
              borderColor: '{neutral.700}',
              hoverBorderColor: '{neutral.800}',
              activeBorderColor: '{neutral.900}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
            // Danger — rojo
            danger: {
              background: '{red.500}',
              hoverBackground: '{red.600}',
              activeBackground: '{red.700}',
              borderColor: '{red.500}',
              hoverBorderColor: '{red.600}',
              activeBorderColor: '{red.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
            // Success — green
            success: {
              background: '{green.500}',
              hoverBackground: '{green.600}',
              activeBackground: '{green.700}',
              borderColor: '{green.500}',
              hoverBorderColor: '{green.600}',
              activeBorderColor: '{green.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
            // Warn — gold
            warn: {
              background: '{gold.500}',
              hoverBackground: '{gold.600}',
              activeBackground: '{gold.700}',
              borderColor: '{gold.500}',
              hoverBorderColor: '{gold.600}',
              activeBorderColor: '{gold.700}',
              color: '{neutral.900}',
              hoverColor: '{neutral.900}',
              activeColor: '{neutral.900}',
            },
            // Info — accent blue
            info: {
              background: '{accent.500}',
              hoverBackground: '{accent.600}',
              activeBackground: '{accent.700}',
              borderColor: '{accent.500}',
              hoverBorderColor: '{accent.600}',
              activeBorderColor: '{accent.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
            // Contrast — white
            contrast: {
              background: '#ffffff',
              hoverBackground: '{neutral.100}',
              activeBackground: '{neutral.200}',
              borderColor: '#ffffff',
              hoverBorderColor: '{neutral.100}',
              activeBorderColor: '{neutral.200}',
              color: '{blue.700}',
              hoverColor: '{blue.700}',
              activeColor: '{blue.700}',
            },
          },
        },
        dark: {
          root: {
            secondary: {
              background: '{neutral.700}',
              hoverBackground: '{neutral.800}',
              activeBackground: '{neutral.900}',
              borderColor: '{neutral.700}',
              hoverBorderColor: '{neutral.800}',
              activeBorderColor: '{neutral.900}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
          },
        },
      },
    },

    inputtext: {
      root: {
        borderRadius: '0.375rem',
        paddingX: '0.75rem',
        paddingY: '0.5rem',
      },
    },

    select: {
      root: {
        borderRadius: '0.375rem',
        paddingX: '0.75rem',
        paddingY: '0.5rem',
      },
    },

    toggleswitch: {
      colorScheme: {
        light: {
          root: {
            checkedBackground: '{neutral.900}',
            checkedHoverBackground: '{neutral.800}',
          },
          handle: {
            background: '#ffffff',
            checkedBackground: '#ffffff',
          },
        },
      },
    },

    checkbox: {
      colorScheme: {
        light: {
          root: {
            checkedBackground: '{neutral.900}',
            checkedHoverBackground: '{neutral.800}',
            checkedBorderColor: '{neutral.900}',
            checkedHoverBorderColor: '{neutral.800}',
          },
        },
      },
    },

    datatable: {
      root: {
        borderColor: '{neutral.200}',
      },
    },
  },
});