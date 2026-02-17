module.exports = {
  printWidth: 100,
  tabWidth: 2,
  singleQuote: true,
  semi: true,
  bracketSameLine: true,
  trailingComma: 'all',
  importOrder: ['^@expo/(.*)$', '^expo-(.*)$', '^react$', '^react-native$', '^@/(.*)$', '^[./]'],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  overrides: [
    {
      files: '.env*',
      options: {
        parser: 'babel',
      },
    },
  ],
};
