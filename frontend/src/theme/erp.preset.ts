// src/theme/erp.preset.ts
// ================================================================
// Fuente única de verdad (SSoT) del design system.
// Toda customización visual va aquí — mínimo CSS externo.
//
// Jerarquía:
//   1. primitive  → paleta de valores raw
//   2. semantic   → significado contextual, referencias a primitivos
//   3. components → tokens por componente, referencias a semánticos
// ================================================================

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const ErpPreset = definePreset(Aura, {

  // ── 1. PRIMITIVE — paleta raw ────────────────────────────────
  // Valores de color sin significado semántico.
  // Todos los niveles superiores referencian estos valores con {neutral.X}.
  // Si cambia un color, solo se cambia aquí.
  primitive: {
    neutral: {
      50: '#f8fafc',      // gris más claro
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',     // azul grisáceo oscuro
      950: '#0a1120',     // casi negro
    },
    blue: {
      50: '#eff6ff',     // lightest blue
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#60a5fa',    // azul claro
      400: '#3b82f6',
      500: '#2563eb',    // azul corporativo
      600: '#1d4ed8',
      700: '#1e40af',    // azul profundo
      800: '#1e3a8a',
      900: '#1e3163',
      950: '#172554',    // casi negro azulado
    },
    green: {
      500: '#22c55e',    // verde éxito
      600: '#16a34a',
      700: '#166534',
    },
    red: {
      500: '#ef4444',    // rojo error
      600: '#dc2626',
      700: '#991b1b',
    },
    gold: {
      500: '#fbbf24',    // dorado advertencia
      600: '#f59e0b',
      700: '#b45309',
    },
    accent: {
      500: '#38bdf8',    // azul acento
      600: '#0ea5e9',
      700: '#0369a1',
    },
  },

  // ── 2. SEMANTIC — significado contextual ─────────────────────
  semantic: {
    // Primary = azul corporativo
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

      // Sin dark mode — mismos valores que light
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
  // Método recomendado para customizar componentes de PrimeNG.
  // Evita overrides CSS externos — toda la lógica de color vive aquí.
  // El wrapper `root` es obligatorio en PrimeNG v19+.
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
            // Primary — azul corporativo
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
            // Secondary — gris oscuro
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
            // Success — verde
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
            // Warn — dorado
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
            // Info — azul acento
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
            // Contrast — blanco
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