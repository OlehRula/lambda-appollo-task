// eslint-disable-next-line no-undef
module.exports = {
    roots: ["<rootDir>/src"],
    globalSetup: "<rootDir>/src/utils/setup-tests.js",
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.ts?$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
