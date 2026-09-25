module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/api-live\\.test\\.js$'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/db.js',
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
};
