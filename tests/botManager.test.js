import { startBots } from "../src/bots/botManager.js";
import { createBotInstance } from "../src/bots/botFactory.js";
import { logger } from "../src/utils/logger.js";
import { moveBot, sendMessages, interactWithBlock, executeCommand } from "../src/bots/botActions.js";

import {beforeEach, describe, expect, jest, test} from "@jest/globals";

jest.mock("../src/bots/botFactory.js", () => ({
    createBotInstance: jest.fn(),
}));

jest.mock("../src/utils/logger.js", () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

jest.mock("../src/bots/botActions.js", () => ({
    moveBot: jest.fn(),
    sendMessages: jest.fn(),
    interactWithBlock: jest.fn(),
    executeCommand: jest.fn(),
}));

describe("Bot Manager", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should start the correct number of bots", async () => {
        // Mock bot creation
        const mockBot = { on: jest.fn() };
        createBotInstance.mockResolvedValue(mockBot);

        const scenario = {
            numberOfBots: 3,
            server: { host: "localhost", port: 25565 },
        };
        const config = { botJoinDelay: 100 };

        await startBots(scenario, config);

        expect(createBotInstance).toHaveBeenCalledTimes(3);
        expect(mockBot.on).toHaveBeenCalledWith("spawn", expect.any(Function));
        expect(mockBot.on).toHaveBeenCalledWith("error", expect.any(Function));
        expect(mockBot.on).toHaveBeenCalledWith("end", expect.any(Function));
    });

    test("should log when bots start", async () => {
        createBotInstance.mockResolvedValue({ on: jest.fn() });

        const scenario = { numberOfBots: 2, server: { host: "localhost", port: 25565 } };
        const config = { botJoinDelay: 50 };

        await startBots(scenario, config);

        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("🤖 Creating bot"));
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("✅ All 2 bots have been launched!"));
    });

    test("should execute actions when bot joins", async () => {
        createBotInstance.mockResolvedValue({
            username: "TestBot",
            on: (event, callback) => event === "spawn" && callback()
        });

        const scenario = {
            numberOfBots: 1,
            server: { host: "localhost", port: 25565 },
            event: { onJoin: { execute: "/help", wait: "1s" } },
            actions: {
                move: { type: "move", position: { x: 100, y: 65, z: 200 }, speed: "fast" },
            },
        };
        const config = { botJoinDelay: 100 };

        await startBots(scenario, config);

        expect(executeCommand).toHaveBeenCalledWith(expect.any(Object), "/help");
        expect(moveBot).toHaveBeenCalledWith(expect.any(Object), scenario.actions.move.position, "fast");
    });
});
