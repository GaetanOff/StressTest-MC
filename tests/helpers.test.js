import {parseTime, sleep} from "../src/utils/helpers.js";
import {describe, expect, test} from "@jest/globals";

describe("Helpers", () => {
    test("parseTime should convert time strings correctly", () => {
        expect(parseTime("2s")).toBe(2000);
        expect(parseTime("500ms")).toBe(500);
        expect(parseTime("invalid")).toBe(0);
    });

    test("sleep should delay execution", async () => {
        const start = Date.now();
        await sleep(100);
        const end = Date.now();
        expect(end - start).toBeGreaterThanOrEqual(100);
    });
});
