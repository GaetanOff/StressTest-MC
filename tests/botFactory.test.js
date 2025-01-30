import {describe, expect, jest, test} from "@jest/globals";

jest.unstable_mockModule("mineflayer", () => ({
    createBot: jest.fn(() => ({
        on: jest.fn(),
    })),
}));

const mineflayer = import("mineflayer");

import { createBotInstance } from "../src/bots/botFactory.js";

jest.mock("../src/utils/logger.js"); // Prevents console pollution

describe("Bot Factory", () => {
    test("should create a bot instance", async () => {
        const bot = await createBotInstance("TestBot", { host: "localhost", port: 25565 });

        expect(bot).toBeDefined();
        expect(bot.on).toBeDefined();
        expect(mineflayer.createBot).toHaveBeenCalledWith(
            expect.objectContaining({ host: "localhost", port: 25565, username: "TestBot" })
        );
    });
});
