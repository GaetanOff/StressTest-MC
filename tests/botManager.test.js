import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../src/bots/botFactory.js");
jest.mock("../src/utils/logger.js");
jest.mock("../src/bots/botActions.js");

import { startBots, stopAllBots } from "../src/bots/botManager.js";
import { createBotInstance } from "../src/bots/botFactory.js";
import { logger } from "../src/utils/logger.js";
import { moveBot, sendMessages, interactWithBlock, executeCommand } from "../src/bots/botActions.js";

describe("Bot Manager", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should start the correct number of bots in single-thread mode", async () => {
        const mockBot = { on: jest.fn(), once: jest.fn() };
        createBotInstance.mockResolvedValue(mockBot);

        const scenario = {
            numberOfBots: 3,
            server: { host: "localhost", port: 25565 },
        };
        const config = { botJoinDelay: 10, threads: 1 };

        const result = await startBots(scenario, config);

        expect(createBotInstance).toHaveBeenCalledTimes(3);
        expect(mockBot.once).toHaveBeenCalledWith("spawn", expect.any(Function));
        expect(mockBot.on).toHaveBeenCalledWith("error", expect.any(Function));
        expect(mockBot.on).toHaveBeenCalledWith("end", expect.any(Function));
        expect(result.bots).toHaveLength(3);

        await stopAllBots();
    });

    test("should log when bots start", async () => {
        createBotInstance.mockResolvedValue({ on: jest.fn(), once: jest.fn() });

        const scenario = { numberOfBots: 2, server: { host: "localhost", port: 25565 } };
        const config = { botJoinDelay: 10, threads: 1 };

        await startBots(scenario, config);

        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("🤖 Creating bot"));
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("bots created and initiated!"));

        await stopAllBots();
    });

    test("should execute actions when bot joins", async () => {
        createBotInstance.mockResolvedValue({
            username: "TestBot",
            on: jest.fn(),
            once: (event, callback) => {
                if (event === "spawn") callback();
            }
        });

        const scenario = {
            numberOfBots: 1,
            server: { host: "localhost", port: 25565 },
            event: { onJoin: { execute: "/help", wait: "0s" } },
            actions: {
                move: { type: "move", position: { x: 100, y: 65, z: 200 }, speed: "fast", delay: "0s" },
            },
        };
        const config = { botJoinDelay: 10, threads: 1 };

        await startBots(scenario, config);

        // Wait a microtick for the setTimeout(0) in actions
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(executeCommand).toHaveBeenCalledWith(expect.any(Object), "/help");
        expect(moveBot).toHaveBeenCalledWith(expect.any(Object), scenario.actions.move.position, "fast");

        await stopAllBots();
    });
});

