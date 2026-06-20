/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        geist: ['Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        // Synthetica Light palette
        syn: {
          surface: '#f7f9fb',
          surfaceDim: '#d8dadc',
          surfaceBright: '#f7f9fb',
          surfaceContainerLowest: '#ffffff',
          surfaceContainerLow: '#f2f4f6',
          surfaceContainer: '#eceef0',
          surfaceContainerHigh: '#e6e8ea',
          surfaceContainerHighest: '#e0e3e5',
          onSurface: '#191c1e',
          onSurfaceVariant: '#424654',
          inverseSurface: '#2d3133',
          inverseOnSurface: '#eff1f3',
          outline: '#727786',
          outlineVariant: '#c2c6d7',
          surfaceTint: '#0058ca',
          primary: '#0056c5',
          onPrimary: '#ffffff',
          primaryContainer: '#146ef1',
          onPrimaryContainer: '#fefcff',
          inversePrimary: '#b0c6ff',
          secondary: '#505f76',
          onSecondary: '#ffffff',
          secondaryContainer: '#d0e1fb',
          onSecondaryContainer: '#54647a',
          tertiary: '#545c72',
          onTertiary: '#ffffff',
          tertiaryContainer: '#6c748b',
          onTertiaryContainer: '#fefcff',
          error: '#ba1a1a',
          onError: '#ffffff',
          errorContainer: '#ffdad6',
          onErrorContainer: '#93000a',
          primaryFixed: '#d9e2ff',
          primaryFixedDim: '#b0c6ff',
          onPrimaryFixed: '#001944',
          onPrimaryFixedVariant: '#00429b',
          secondaryFixed: '#d3e4fe',
          secondaryFixedDim: '#b7c8e1',
          onSecondaryFixed: '#0b1c30',
          onSecondaryFixedVariant: '#38485d',
          tertiaryFixed: '#dae2fd',
          tertiaryFixedDim: '#bec6e0',
          onTertiaryFixed: '#131b2e',
          onTertiaryFixedVariant: '#3f465c',
          background: '#f7f9fb',
          onBackground: '#191c1e',
          surfaceVariant: '#e0e3e5'
        }
      },
      borderRadius: {
        'soft-sm': '4px',
        'soft-md': '8px',
        'soft-lg': '12px'
      },
      boxShadow: {
        'syn-elevation': '0 10px 20px -5px rgba(15, 23, 42, 0.1)'
      }
    }
  },
  plugins: []
};
