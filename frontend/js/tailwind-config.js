tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6df',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Teal
          600: '#0d9488', // Primary brand — deep teal
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        surface: {
          50:  '#f8fafb',
          100: '#f0f4f6',
          200: '#dde5ea',
          300: '#c2cfd8',
          400: '#8fa3b0',
          500: '#627889',
          600: '#475f6d',
          700: '#304452',
          800: '#1c2e3a',
          900: '#101e27',
          950: '#070e14', // Very dark navy-teal tint
        }
      }
    }
  }
}

