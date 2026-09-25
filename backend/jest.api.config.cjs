module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/api-live.test.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  clearMocks: true,
};
