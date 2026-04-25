module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  setupFiles: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};