import { moveBot, sendMessages, interactWithBlock, executeCommand } from "../src/bots/botActions.js";
import { describe, expect, jest, test } from "@jest/globals";

jest.useFakeTimers();
jest.mock("../src/utils/logger.js");

const botMock = {
    username: "TestBot",
    chat: jest.fn(),
    pathfinder: { setGoal: jest.fn(), goals: { GoalBlock: jest.fn() } },
    blockAt: jest.fn(),
    activateBlock: jest.fn(),
    dig: jest.fn(),
    vec3: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
};

describe("Bot Actions", () => {
    test("should move the bot to a position", () => {
        moveBot(botMock, { x: 100, y: 65, z: 200 }, "fast");
        expect(botMock.pathfinder.setGoal).toHaveBeenCalled();
    });

    test("should send chat messages", () => {
        sendMessages(botMock, ["Hello", "World"], 1000);

        jest.advanceTimersByTime(1000); // Simulate message delay
        expect(botMock.chat).toHaveBeenCalledWith("Hello");

        jest.advanceTimersByTime(1000);
        expect(botMock.chat).toHaveBeenCalledWith("World");
    });

    test("should interact with a block (right click)", () => {
        botMock.blockAt.mockReturnValue({ name: "Stone" });

        interactWithBlock(botMock, { x: 50, y: 65, z: 50 }, "right_click");

        expect(botMock.activateBlock).toHaveBeenCalled();
    });

    test("should execute a command", () => {
        executeCommand(botMock, "/help");
        expect(botMock.chat).toHaveBeenCalledWith("/help");
    });
});
