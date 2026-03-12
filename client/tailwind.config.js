/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    fontFamily: {
      sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['Cascadia Code', 'Fira Code', 'Consolas', 'monospace'],
    },
    extend: {
      colors: {
        tz: {
          green: '#1EB53A',
          blue: '#00A3DD',
          yellow: '#FCD116',
          black: '#000000',
          'green-light': '#2ECC51',
          'blue-light': '#33B8E8',
          'yellow-light': '#FFE04A',
        },
        cyber: {
          dark: '#080C14',
          darker: '#050810',
          card: '#0D1117',
          'card-hover': '#131A24',
          border: '#1B2332',
          'border-light': '#2A3548',
          green: '#1EB53A',
          red: '#EF4444',
          blue: '#00A3DD',
          yellow: '#FCD116',
          muted: '#8899AA',
        },
      },
      backgroundImage: {
        'tz-stripe': 'linear-gradient(135deg, #1EB53A 0%, #00A3DD 50%, #1EB53A 100%)',
        'tz-glow': 'radial-gradient(ellipse at center, rgba(30,181,58,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(30,181,58,0.3)',
        'glow-blue': '0 0 20px rgba(0,163,221,0.3)',
        'glow-yellow': '0 0 20px rgba(252,209,22,0.3)',
      },
    },
  },
  plugins: [],
};
