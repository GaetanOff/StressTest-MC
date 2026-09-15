import { logger } from "../src/utils/logger.js";
import { afterAll, describe, expect, jest, test } from "@jest/globals";

describe("Logger", () => {
    afterAll(async () => {
        await logger.close();
    });

    test("should log info messages to console", () => {
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        logger.info("Test log message");
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("[INFO] Test log message"));
        logSpy.mockRestore();
    });

    test("should log error messages to console.error", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        logger.error("Test error message");
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("[ERROR] Test error message"));
        errorSpy.mockRestore();
    });

    test("should log warn messages to console.warn", () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        logger.warn("Test warn message");
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("[WARN] Test warn message"));
        warnSpy.mockRestore();
    });

    test("should support configuration changes", () => {
        logger.configure({ enabled: false });
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        logger.info("Should not appear");
        expect(logSpy).not.toHaveBeenCalled();
        logSpy.mockRestore();
        logger.configure({ enabled: true, toConsole: true });
    });
});

