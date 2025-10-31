import { moveBot, sendMessages, interactWithBlock, executeCommand } from "./botActions.js";
import { logger } from "../utils/logger.js";
import { parseTime } from "../utils/helpers.js";

/**
 * Creates and configures a bot instance with event handlers.
 * @param {string} botName - Name of the bot
 * @param {Object} serverConfig - Server configuration
 * @param {Object} scenario - The scenario configuration
 * @param {Object} config - General configuration
 * @param {Function} createBotInstance - Function to create bot instance
 * @param {number|string|null} threadId - Optional thread ID for logging prefix
 * @returns {Promise<import("mineflayer").Bot>} - The configured bot instance
 */
export async function createAndConfigureBot(botName, serverConfig, scenario, config, createBotInstance, threadId = null) {
    const logPrefix = threadId ? `[Thread ${threadId}] ` : "";
    logger.info(`${logPrefix}🤖 Creating bot: ${botName}`);

    const bot = await createBotInstance(botName, serverConfig);

    // Manage bot events
    bot.on("login", () => logger.info(`${logPrefix}✅ ${botName} has connected!`));
    bot.on("spawn", () => handleBotJoin(bot, scenario, threadId));
    bot.on("error", (err) => logger.error(`${logPrefix}❌ Error for ${botName}: ${err.message}`));
    bot.on("end", () => logger.warn(`${logPrefix}🔴 ${botName} has disconnected`));

    return bot;
}

/**
 * Handles actions when a bot joins the server.
 * @param {import("mineflayer").Bot} bot - The Mineflayer bot instance
 * @param {Object} scenario - The current scenario
 * @param {number|string|null} threadId - Optional thread ID for logging prefix
 */
export function handleBotJoin(bot, scenario, threadId = null) {
    const logPrefix = threadId ? `[Thread ${threadId}] ` : "";
    logger.info(`${logPrefix}🎮 ${bot.username} has joined the server!`);

    if (scenario.event && scenario.event.onJoin) {
        const { execute, wait } = scenario.event.onJoin;
        setTimeout(async () => {
            if (execute) {
                executeCommand(bot, execute);
            }
            executeScenarioActions(bot, scenario.actions, threadId);
        }, parseTime(wait || "0s"));
    } else {
        executeScenarioActions(bot, scenario.actions, threadId);
    }
}

/**
 * Executes the actions defined in the scenario.
 * @param {import("mineflayer").Bot} bot - The Mineflayer bot instance
 * @param {Object} actions - List of actions from the scenario
 * @param {number|string|null} threadId - Optional thread ID for logging prefix
 */
export function executeScenarioActions(bot, actions, threadId = null) {
    const logPrefix = threadId ? `[Thread ${threadId}] ` : "";

    for (const actionName in actions) {
        const action = actions[actionName];

        setTimeout(async () => {
            switch (action.type) {
                case "move":
                    logger.info(`${logPrefix}🚶‍♂️ ${bot.username} is moving to ${JSON.stringify(action.position)} at ${action.speed} speed`);
                    moveBot(bot, action.position, action.speed);
                    break;
                case "chat":
                    logger.info(`${logPrefix}💬 ${bot.username} is about to send messages`);
                    sendMessages(bot, action.messages, parseTime(action.interval || "10s"));
                    break;
                case "interact":
                    logger.info(`${logPrefix}🖱️ ${bot.username} will interact with a block at ${JSON.stringify(action.target)} using ${action.action}`);
                    await interactWithBlock(bot, action.target, action.action);
                    break;
                case "command":
                    logger.info(`${logPrefix}⌨️ ${bot.username} executes command: ${action.command}`);
                    executeCommand(bot, action.command);
                    break;
                default:
                    logger.warn(`${logPrefix}⚠️ Unknown action: ${action.type}`);
            }
        }, parseTime(action.waitAfter || "0s"));
    }
}

/**
 * Starts bots in the specified range.
 * @param {number} startIndex - Starting bot index (inclusive)
 * @param {number} endIndex - Ending bot index (exclusive)
 * @param {Object} scenario - The scenario configuration
 * @param {Object} config - General configuration
 * @param {Function} createBotInstance - Function to create bot instance
 * @param {number|string|null} threadId - Optional thread ID for logging prefix
 * @returns {Promise<Array>} - Array of created bots
 */
export async function startBotsInRange(startIndex, endIndex, scenario, config, createBotInstance, threadId = null) {
    const bots = [];
    const logPrefix = threadId ? `[Thread ${threadId}] ` : "";

    for (let i = startIndex; i < endIndex; i++) {
        // Generate bot name: Bot-ThreadNumber-LocalNumber or Bot_GlobalNumber for single thread
        const botName = threadId 
            ? `Bot-${threadId}-${i - startIndex + 1}` 
            : `Bot_${i + 1}`;
        const bot = await createAndConfigureBot(botName, scenario.server, scenario, config, createBotInstance, threadId);
        bots.push(bot);

        // Wait a short delay between connections to avoid overloading the server
        await new Promise((resolve) => setTimeout(resolve, config.botJoinDelay || 500));
    }

    const botCount = endIndex - startIndex;
    logger.info(`${logPrefix}✅ All ${botCount} bots have been launched!`);
    return bots;
}

