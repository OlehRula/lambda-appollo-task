/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const dotenv = require("dotenv");

module.exports = async () => {
    dotenv.config({
        path: path.resolve(__dirname, "../../.env.test")
    });
};