/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      "light",
      "dark", 
      "cupcake",
      "bumblebee", 
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel", 
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      {
        "winter": {
          "primary": "#047AFF",
          "primary-focus": "#0369A1", 
          "primary-content": "#FFFFFF",
          
          "secondary": "#463AA1", 
          "secondary-focus": "#3C2E8A",
          "secondary-content": "#FFFFFF",
          
          "accent": "#C148AC",
          "accent-focus": "#9F359B",
          "accent-content": "#FFFFFF",
          
          "neutral": "#2A2E37",
          "neutral-focus": "#16181D",
          "neutral-content": "#FFFFFF",
          
          "base-100": "#3A3D47", // Cinzento metalizado escuro
          "base-200": "#2E3139", // Mais escuro
          "base-300": "#24262C", // Ainda mais escuro
          "base-content": "#E5E7EB", // Texto claro
          
          "info": "#0CA5E9",
          "info-content": "#FFFFFF",
          
          "success": "#2DD4BF", 
          "success-content": "#FFFFFF",
          
          "warning": "#F4BF50",
          "warning-content": "#FFFFFF",
          
          "error": "#FB7085",
          "error-content": "#FFFFFF",
        },
      },
      "dim",
      "nord",
      "sunset",
    ],
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: ":root", // The element that receives theme color CSS variables
  },
}