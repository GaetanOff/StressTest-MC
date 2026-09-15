import { parseTime, sleep } from "../src/utils/helpers.js";
import { describe, expect, test } from "@jest/globals";

describe("Helpers", () => {
    test("parseTime should convert time strings correctly", () => {
        expect(parseTime("2s")).toBe(2000);
        expect(parseTime("500ms")).toBe(500);
        expect(parseTime("1.5s")).toBe(1500);
        expect(parseTime("0.5s")).toBe(500);
        expect(parseTime("2m")).toBe(120000);
        expect(parseTime("1h")).toBe(3600000);
        expect(parseTime(3000)).toBe(3000);
        expect(parseTime(0)).toBe(0);
        expect(parseTime("invalid")).toBe(0);
        expect(parseTime(null)).toBe(0);
        expect(parseTime(undefined)).toBe(0);
        expect(parseTime("")).toBe(0);
    });

    test("sleep should delay execution", async () => {
        const start = Date.now();
        await sleep(50);
        const end = Date.now();
        expect(end - start).toBeGreaterThanOrEqual(40);
    });
});

