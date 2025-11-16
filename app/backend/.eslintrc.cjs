module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'plugin:n/recommended', 'plugin:promise/recommended', 'prettier'],
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        alphabetize: { order: 'asc', caseInsensitive: true }
      }
    ]
  }
};
