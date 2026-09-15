import { describe, expect, jest, test } from "@jest/globals";

const mockCreateBot = jest.fn(() => ({
    on: jest.fn(),
    loadPlugin: jest.fn()
}));

jest.mock("mineflayer", () => ({
    __esModule: true,
    default: {
        createBot: (...args) => mockCreateBot(...args)
    },
    createBot: (...args) => mockCreateBot(...args)
}));

jest.mock("mineflayer-pathfinder", () => ({
    __esModule: true,
    default: {
        pathfinder: jest.fn(),
        Movements: jest.fn(),
        goals: { GoalBlock: jest.fn() }
    },
    pathfinder: jest.fn(),
    Movements: jest.fn(),
    goals: { GoalBlock: jest.fn() }
}));

jest.mock("../src/utils/logger.js", () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

import { createBotInstance, testProxy } from "../src/bots/botFactory.js";

describe("Bot Factory", () => {
    test("should create a bot instance with given parameters", async () => {
        const bot = await createBotInstance("TestBot", { host: "localhost", port: 25565 });

        expect(bot).toBeDefined();
        expect(bot.on).toBeDefined();
        expect(mockCreateBot).toHaveBeenCalledWith(
            expect.objectContaining({
                host: "localhost",
                port: 25565,
                username: "TestBot",
                auth: "offline"
            })
        );
        expect(bot.loadPlugin).toHaveBeenCalled();
    });

    test("should test proxy connection", async () => {
        const result = await testProxy({ host: "invalid.proxy", port: 1080, timeout: 50 }, { host: "127.0.0.1", port: 25565 });
        expect(typeof result).toBe("boolean");
    });
});

