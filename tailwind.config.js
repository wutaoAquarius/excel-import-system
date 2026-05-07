/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
