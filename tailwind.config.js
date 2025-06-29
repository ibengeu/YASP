/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: ({
        theme
      }) => ({
        DEFAULT: {
          css: {
            table: {
              width: '100%',
              'border-collapse': 'collapse',
              'margin-top': theme('spacing.6'),
              'margin-bottom': theme('spacing.6'),
            },
            thead: {
              'border-bottom': '1px solid ' + theme('colors.gray.300'),
            },
            th: {
              'text-align': 'left',
              'padding-right': theme('spacing.2'),
              'padding-bottom': theme('spacing.2'),
              'padding-left': theme('spacing.2'),
              'font-weight': theme('fontWeight.semibold'),
              'font-size': theme('fontSize.sm')[0],
              'color': theme('colors.gray.900'),
            },
            tbody: {
              tr: {
                'border-bottom': '1px solid ' + theme('colors.gray.200'),
              },
              'tr:last-child': {
                'border-bottom': 'none',
              },
            },
            td: {
              'padding-top': theme('spacing.2'),
              'padding-right': theme('spacing.2'),
              'padding-bottom': theme('spacing.2'),
              'padding-left': theme('spacing.2'),
              'font-size': theme('fontSize.sm')[0],
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
