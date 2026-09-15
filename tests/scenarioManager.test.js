import { loadScenario, validateScenario } from "../src/scenario/scenarioManager.js";
import fs from "fs";
import { describe, expect, jest, test } from "@jest/globals";

jest.mock("fs");

describe("Scenario Manager", () => {
    test("should throw an error if the scenario file is missing", async () => {
        fs.existsSync.mockReturnValue(false);
        await expect(loadScenario("missing.yml")).rejects.toThrow("Scenario file");
    });

    test("should throw an error if the scenario file is empty or invalid", async () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(""); // Simulate an empty file
        await expect(loadScenario("invalid.yml")).rejects.toThrow("Failed to parse scenario file");
    });

    test("should load and validate a scenario correctly", async () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(`
          name: "Test Scenario"
          numberOfBots: 5
          server:
            host: "localhost"
            port: 25565
          actions:
            chat:
              type: "chat"
              messages: ["Hello"]
        `);
        const scenario = await loadScenario("valid.yml");
        expect(scenario.name).toBe("Test Scenario");
        expect(scenario.numberOfBots).toBe(5);
        expect(scenario.server.port).toBe(25565);
    });

    test("should reject invalid scenarios in validateScenario", () => {
        expect(() => validateScenario(null)).toThrow("valid object");
        expect(() => validateScenario({ name: "" })).toThrow("name");
        expect(() => validateScenario({ name: "Valid", numberOfBots: -1 })).toThrow("numberOfBots");
        expect(() => validateScenario({ name: "Valid", numberOfBots: 5, server: { host: "localhost", port: 99999 } })).toThrow("port");
        expect(() => validateScenario({ name: "Valid", numberOfBots: 5, server: { host: "localhost", port: 25565 }, actions: "invalid" })).toThrow("actions");
    });
});

