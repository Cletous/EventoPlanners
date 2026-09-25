module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/api-live.test.js'],
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
        ],
      },
    ],
  },
  clearMocks: true,
};
