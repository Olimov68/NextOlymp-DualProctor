module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'server/data',
    'coverage',
    'scripts',
    '*.config.js',
    '*.config.ts',
    'node_modules'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-useless-escape': 'off',
    'prefer-const': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
};
