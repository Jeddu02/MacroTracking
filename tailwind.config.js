/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12161A',
        paper: '#EEF1EC',
        surface: {
          light: '#FFFFFF',
          dark: '#191E23'
        },
        edge: {
          light: '#DDE2DC',
          dark: '#262C32'
        },
        volt: '#C6F135',
        navy: '#132140',
        coral: '#FF5C72',
        protein: '#3D8BFF',
        carbs: '#FFB020',
        fat: '#FF6B6B',
        fiber: '#4BBF8C'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '14px'
      }
    }
  },
  plugins: []
};
