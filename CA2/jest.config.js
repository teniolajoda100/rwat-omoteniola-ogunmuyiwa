export default {
    testEnvironment: 'jsdom',
    transform: {},
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js'
    ],
    collectCoverageFrom: [
        'memorygame.js',
        '!node_modules/**'
    ],
    verbose: true
};