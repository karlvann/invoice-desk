/** @type {import('tailwindcss').Config} */
module.exports = {
  // Optimize content paths for production purging
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Be specific to avoid scanning unnecessary files
    '!./src/**/*.test.{js,ts,jsx,tsx}',
    '!./src/**/*.spec.{js,ts,jsx,tsx}',
  ],
  
  // Safe list classes that might be dynamically generated
  safelist: [
    // Payment status colors that might be generated dynamically
    'bg-green-100',
    'text-green-800',
    'bg-yellow-100',
    'text-yellow-800',
    'bg-red-100',
    'text-red-800',
    'bg-gray-100',
    'text-gray-800',
  ],
  
  theme: {
    extend: {
      // Custom colors used in the app
      colors: {
        // Keeping your brand colors
        'brand-pink': '#FFE5F5',
        'brand-purple': '#E5E5FF',
        'brand-green': '#E5FFE5',
        'brand-mauve': '#FFE5E5',
        'brand-gray': '#F5F5F5',
      },
      // Optimize font loading
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  
  plugins: [],
  
  // Production optimizations
  future: {
    hoverOnlyWhenSupported: true, // Better mobile performance
  },
  
  // Reduce specificity for smaller CSS
  corePlugins: {
    preflight: true, // Keep the reset styles
  },
}
