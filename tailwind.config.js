/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          slate: '#5B6770',
          teal: '#14B8A6',
          'teal-light': '#2DD4BF',
          'slate-dark': '#475569',
        },
        // Tool colors
        claude: '#D97706',
        cursor: '#1F2937',
        copilot: '#6366F1',
        windsurf: '#0EA5E9',
        openai: '#10B981',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
