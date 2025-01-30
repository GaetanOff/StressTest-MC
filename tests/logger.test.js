import { logger } from "../src/utils/logger.js";
import {describe, expect, test} from "@jest/globals";
import fs from "fs";

describe("Logger", () => {
    test("should log messages correctly", () => {
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        logger.info("Test log message");
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO] Test log message"));
        logSpy.mockRestore();
    });

    test("should write to log file", () => {
        const logFile = "./logs/bot.log";
        logger.info("File log test");
        expect(fs.existsSync(logFile)).toBeTruthy();
    });
});
