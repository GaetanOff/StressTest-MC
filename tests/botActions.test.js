import { moveBot, sendMessages, interactWithBlock, executeCommand, cleanupBotActions } from "../src/bots/botActions.js";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.useFakeTimers();
jest.mock("../src/utils/logger.js");

const createMockBot = () => ({
    username: "TestBot",
    entity: { id: 1 },
    chat: jest.fn(),
    pathfinder: { setGoal: jest.fn(), goals: { GoalBlock: jest.fn() } },
    setControlState: jest.fn(),
    blockAt: jest.fn(),
    activateBlock: jest.fn().mockResolvedValue(true),
    canDigBlock: jest.fn().mockReturnValue(true),
    dig: jest.fn().mockResolvedValue(true),
    _activeTimers: new Set()
});

describe("Bot Actions", () => {
    let botMock;

    beforeEach(() => {
        jest.clearAllMocks();
        botMock = createMockBot();
    });

    test("should move the bot to a position and set speed", () => {
        moveBot(botMock, { x: 100, y: 65, z: 200 }, "fast");
        expect(botMock.pathfinder.setGoal).toHaveBeenCalled();
        expect(botMock.setControlState).toHaveBeenCalledWith("sprint", true);
    });

    test("should send chat messages sequentially", () => {
        const timer = sendMessages(botMock, ["Hello", "World"], 1000);
        expect(timer).toBeDefined();

        jest.advanceTimersByTime(1000);
        expect(botMock.chat).toHaveBeenCalledWith("Hello");

        jest.advanceTimersByTime(1000);
        expect(botMock.chat).toHaveBeenCalledWith("World");

        cleanupBotActions(botMock);
    });

    test("should interact with a block (right click)", async () => {
        botMock.blockAt.mockReturnValue({ name: "Stone" });

        await interactWithBlock(botMock, { x: 50, y: 65, z: 50 }, "right_click");

        expect(botMock.activateBlock).toHaveBeenCalled();
    });

    test("should interact with a block (left click / dig)", async () => {
        botMock.blockAt.mockReturnValue({ name: "Dirt" });

        await interactWithBlock(botMock, { x: 50, y: 65, z: 50 }, "left_click");

        expect(botMock.dig).toHaveBeenCalled();
    });

    test("should execute a command", () => {
        executeCommand(botMock, "/help");
        expect(botMock.chat).toHaveBeenCalledWith("/help");
    });

    test("should clean up timers", () => {
        sendMessages(botMock, ["A", "B"], 5000);
        expect(botMock._activeTimers.size).toBe(1);
        cleanupBotActions(botMock);
        expect(botMock._activeTimers.size).toBe(0);
    });
});

