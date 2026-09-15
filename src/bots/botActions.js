import { logger } from "../utils/logger.js";
import { Vec3 } from "vec3";
import pkg from "mineflayer-pathfinder";

const { goals, Movements } = pkg;

/**
 * Moves the bot to a given position.
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {Object} position - Coordinates {x, y, z}
 * @param {string} speed - "slow", "normal", "fast"
 */
export function moveBot(bot, position, speed = "normal") {
    if (!bot || !bot.pathfinder) {
        logger.warn(`🚧 ${bot?.username || "Bot"} cannot move: pathfinder is not loaded.`);
        return;
    }

    if (!position || typeof position.x !== "number" || typeof position.y !== "number" || typeof position.z !== "number") {
        logger.warn(`🚧 ${bot.username} invalid move position: ${JSON.stringify(position)}`);
        return;
    }

    // Initialize movements if not already loaded
    try {
        if (!bot.pathfinder.movements && Movements) {
            bot.pathfinder.setMovements(new Movements(bot));
        }
    } catch (e) {
        // Fallback if movements initialization fails
    }

    // Configure speed / sprinting
    if (typeof bot.setControlState === "function") {
        if (speed === "fast") {
            bot.setControlState("sprint", true);
            bot.setControlState("sneak", false);
        } else if (speed === "slow") {
            bot.setControlState("sprint", false);
            bot.setControlState("sneak", true);
        } else {
            bot.setControlState("sprint", false);
            bot.setControlState("sneak", false);
        }
    }

    const GoalClass = goals?.GoalBlock || bot.pathfinder?.goals?.GoalBlock;
    const goal = GoalClass ? new GoalClass(position.x, position.y, position.z) : position;

    bot.pathfinder.setGoal(goal, true);
    logger.info(`🚶‍♂️ ${bot.username} is moving to ${position.x}, ${position.y}, ${position.z} at ${speed} speed.`);
}

/**
 * Sends a list of messages in the chat sequentially with an interval.
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {string[]} messages - List of messages to send
 * @param {number} interval - Interval between messages (in ms)
 * @returns {NodeJS.Timeout|null}
 */
export function sendMessages(bot, messages, interval = 10000) {
    if (!Array.isArray(messages) || messages.length === 0) {
        logger.warn(`⚠️ ${bot?.username || "Bot"} has no messages to send.`);
        return null;
    }

    let index = 0;

    const chatInterval = setInterval(() => {
        // Stop if bot disconnected or all messages sent
        if (!bot || !bot.entity || index >= messages.length) {
            clearInterval(chatInterval);
            if (bot?._activeTimers) {
                bot._activeTimers.delete(chatInterval);
            }
            return;
        }

        try {
            bot.chat(messages[index]);
            logger.info(`💬 ${bot.username} says: ${messages[index]}`);
        } catch (err) {
            logger.error(`❌ ${bot.username} failed to chat: ${err.message}`);
        }
        index++;
    }, interval);

    // Track interval for clean cancellation
    if (bot) {
        bot._activeTimers = bot._activeTimers || new Set();
        bot._activeTimers.add(chatInterval);
    }

    return chatInterval;
}

/**
 * Interacts with a given block (right-click/left-click).
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {Object} target - Block coordinates {x, y, z}
 * @param {string} action - "right_click" or "left_click"
 */
export async function interactWithBlock(bot, target, action = "right_click") {
    if (!bot || !target) return;

    const targetPos = new Vec3(target.x, target.y, target.z);
    const block = bot.blockAt ? bot.blockAt(targetPos) : null;

    if (!block) {
        logger.error(`❌ ${bot.username} could not find a block at ${target.x}, ${target.y}, ${target.z}`);
        return;
    }

    if (action === "right_click") {
        try {
            if (typeof bot.activateBlock === "function") {
                await bot.activateBlock(block);
            }
            logger.info(`🖱️ ${bot.username} right-clicked on ${block.name || "block"}`);
        } catch (error) {
            logger.error(`❌ ${bot.username} failed to activate block: ${error.message}`);
        }
    } else if (action === "left_click") {
        try {
            if (typeof bot.dig === "function") {
                if (typeof bot.canDigBlock === "function" && !bot.canDigBlock(block)) {
                    logger.warn(`⚠️ ${bot.username} cannot dig block ${block.name || "block"}`);
                    return;
                }
                await bot.dig(block);
                logger.info(`⛏️ ${bot.username} broke ${block.name || "block"}`);
            }
        } catch (error) {
            logger.error(`❌ ${bot.username} failed to dig block: ${error.message}`);
        }
    }
}

/**
 * Executes a command via chat.
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {string} command - Command to execute
 */
export function executeCommand(bot, command) {
    if (!bot || !command) return;
    try {
        bot.chat(command);
        logger.info(`⌨️ ${bot.username} executed the command: ${command}`);
    } catch (err) {
        logger.error(`❌ ${bot.username} failed to execute command: ${err.message}`);
    }
}

/**
 * Cleans up all active timers and listeners attached to the bot.
 * @param {import("mineflayer").Bot} bot
 */
export function cleanupBotActions(bot) {
    if (!bot) return;
    if (bot._activeTimers) {
        for (const timer of bot._activeTimers) {
            clearInterval(timer);
            clearTimeout(timer);
        }
        bot._activeTimers.clear();
    }
}

