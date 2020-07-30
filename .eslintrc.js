module.exports = {
  extends: [
    'alloy'
  ],
  env: {
    // 设置的环境变量（包含多个预定义的全局变量）
    // browser: true,
    // node: true,
    // mocha: true,
    // jest: true,
    // jquery: true
  },
  globals: {
    // 设置的全局变量（设置为 false 表示它不允许被重新赋值）
    // myGlobal: false
  },
  rules: {
    // 自定义规则
    'no-param-reassign': 'off',
    'no-return-assign': 'off',
    'guard-for-in': 'off',
    'no-async-promise-executor': 'off',
    'prefer-promise-reject-errors': 'off'
  }
};