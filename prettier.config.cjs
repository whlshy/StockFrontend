/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  singleAttributePerLine: false,
  singleQuote: true,
  printWidth: 120,
};

module.exports = config;
