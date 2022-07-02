module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:node/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [
      './tsconfig.json',
      './client/tsconfig.json',
      './client/tsconfig.node.json',
    ],
    ecmaVersion: 12,
  },
  rules: {
    camelcase: 'off',
    'lines-between-class-members': 'off',
    'no-useless-return': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'node/no-missing-import': [
      'error',
      {
        tryExtensions: ['.ts', '.tsx', '.js', '.json'],
      },
    ],
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['modules'] },
    ],
    quotes: [1, 'single'],
  },
  globals: {
    NodeJS: true,
  },
};
