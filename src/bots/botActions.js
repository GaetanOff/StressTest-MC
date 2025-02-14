import { logger } from "../utils/logger.js";
import { Vec3 } from "vec3";

/**
 * Moves the bot to a given position.
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {Object} position - Coordinates {x, y, z}
 * @param {string} speed - "slow", "normal", "fast"
 */
export function moveBot(bot, position, speed = "normal") {
    if (!bot.pathfinder) {
        logger.warn(`🚧 ${bot.username} cannot move: pathfinder is not loaded.`);
        return;
    }

    const speeds = { slow: 0.1, normal: 0.3, fast: 0.6 };
    const moveSpeed = speeds[speed] || speeds.normal;

    bot.pathfinder.setGoal(new bot.pathfinder.goals.GoalBlock(position.x, position.y, position.z), true);
    logger.info(`🚶‍♂️ ${bot.username} is moving to ${position.x}, ${position.y}, ${position.z} at ${speed} speed.`);
}

/**
 * Sends a message in the chat.
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {string[]} messages - List of messages to send
 * @param {number} interval - Interval between messages (in ms)
 */
export function sendMessages(bot, messages, interval = 10000) {
    let index = 0;

    const chatInterval = setInterval(() => {
        if (index >= messages.length) {
            clearInterval(chatInterval);
            return;
        }

        bot.chat(messages[index]);
        logger.info(`💬 ${bot.username} says: ${messages[index]}`);
        index++;
    }, interval);
}

/**
 * Interacts with a given block (right-click/left-click).
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {Object} target - Block coordinates {x, y, z}
 * @param {string} action - "right_click" or "left_click"
 */
export function interactWithBlock(bot, target, action = "right_click") {
    const block = bot.blockAt(new Vec3(target.x, target.y, target.z));

    if (!block) {
        logger.error(`❌ ${bot.username} could not find a block at ${target.x}, ${target.y}, ${target.z}`);
        return;
    }

    if (action === "right_click") {
        bot.activateBlock(block);
        logger.info(`🖱️ ${bot.username} right-clicked on ${block.name}`);
    } else if (action === "left_click") {
        bot.dig(block);
        logger.info(`⛏️ ${bot.username} broke ${block.name}`);
    }
}

/**
 * Executes a command via chat.
 * @param {import("mineflayer").Bot} bot - Mineflayer bot instance
 * @param {string} command - Command to execute
 */
export function executeCommand(bot, command) {
    bot.chat(command);
    logger.info(`⌨️ ${bot.username} executed the command: ${command}`);
}
