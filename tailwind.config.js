/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#00ADB5',
          'teal-bright': '#00D9E3',
          'teal-deep': '#008B92',
        },
        surface: {
          bg: '#222831',
          card: '#393E46',
          hover: '#4A5058',
          border: '#525961',
        },
        content: {
          primary: '#EEEEEE',
          secondary: '#B8BCC2',
          tertiary: '#7D8188',
        },
        light: {
          bg: '#FFFFFF',
          surface: '#F7F7F7',
          border: '#E0E0E0',
        },
        semantic: {
          success: '#00C896',
          warning: '#FFB347',
          error: '#FF6B6B',
          info: '#00ADB5',
        },
        ai: {
          DEFAULT: '#FFB347',
          light: '#FFD699',
          deep: '#E6952E',
        },
        // Tool colors
        claude: '#D97706',
        cursor: '#1F2937',
        copilot: '#6366F1',
        windsurf: '#0EA5E9',
        openai: '#10B981',
      },
      fontFamily: {
        sans: ['SF Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'SFMono-Regular', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
