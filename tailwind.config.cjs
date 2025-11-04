/**
 * tailwind.config.cjs
 * Versão limpa e com tipografia simplificada para Agenda SaaS
 */
module.exports = {
  darkMode: 'class',

  content: [
    './public/**/*.html',
    './public/**/*.js',
    './src/**/*.js',
    './components/**/*.{html,js}',
    './styles/**/*.css'
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        lg: '2rem',
        xl: '3rem'
      }
    },

    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },

    extend: {
      colors: { //dps troco as cores
        primary: '#10b981',
        secondary: '#f59e0b',
        tertiary: '#60a5fa',
        neutral: '#6b7280',
        success: '#10b981',
        danger: '#ef4444'
      },

        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif']
        },

      spacing: {
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem'
      },

      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },

      boxShadow: {
        subtle: '0 4px 10px rgba(2,6,23,0.06)',
        card: '0 10px 30px rgba(2,6,23,0.08)'
      },

      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 240ms ease-out both'
      }
    }
  },

  plugins: [
  ],
};
