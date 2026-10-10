module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,

  // Arrow functions
  arrowParens: 'avoid',

  // JSX
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // End of line
  endOfLine: 'lf',

  // Prose wrap
  proseWrap: 'preserve',

  // HTML whitespace
  htmlWhitespaceSensitivity: 'css',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // Overrides for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
  ],
};
