import { moveBot, sendMessages, interactWithBlock, executeCommand, cleanupBotActions } from "./botActions.js";
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

    const bot = await createBotInstance(botName, serverConfig, config);

    // Track state on the bot instance
    bot._isStopping = false;
    bot._activeTimers = bot._activeTimers || new Set();

    // Manage bot events
    bot.on("login", () => logger.info(`${logPrefix}✅ ${botName} has connected!`));

    // Use once to prevent re-executing entire scenario on respawn or dimension changes
    bot.once("spawn", () => handleBotJoin(bot, scenario, threadId));

    bot.on("error", (err) => {
        logger.error(`${logPrefix}❌ Error for ${botName}: ${err.message}`);
    });

    bot.on("kicked", (reason) => {
        logger.warn(`${logPrefix}👢 ${botName} was kicked: ${typeof reason === "string" ? reason : JSON.stringify(reason)}`);
    });

    bot.on("end", () => {
        cleanupBotActions(bot);
        logger.warn(`${logPrefix}🔴 ${botName} has disconnected`);

        // Handle auto-reconnect if enabled and bot is not intentionally stopped
        const autoReconnect = scenario.autoReconnect ?? config?.autoReconnect ?? false;
        if (autoReconnect && !bot._isStopping) {
            const reconnectDelay = parseTime(config?.reconnectDelay || "5s");
            logger.info(`${logPrefix}🔄 Reconnecting ${botName} in ${reconnectDelay}ms...`);
            const timer = setTimeout(async () => {
                try {
                    await createAndConfigureBot(botName, serverConfig, scenario, config, createBotInstance, threadId);
                } catch (err) {
                    logger.error(`${logPrefix}❌ Reconnection failed for ${botName}: ${err.message}`);
                }
            }, reconnectDelay);
            if (timer.unref) timer.unref();
        }
    });

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
        const waitMs = parseTime(wait || "0s");

        const timer = setTimeout(() => {
            if (bot?._activeTimers) bot._activeTimers.delete(timer);
            if (execute) {
                executeCommand(bot, execute);
            }
            executeScenarioActions(bot, scenario.actions, threadId);
        }, waitMs);

        bot._activeTimers = bot._activeTimers || new Set();
        bot._activeTimers.add(timer);
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
    if (!actions || typeof actions !== "object") return;
    const logPrefix = threadId ? `[Thread ${threadId}] ` : "";

    for (const actionName in actions) {
        const action = actions[actionName];
        if (!action || typeof action !== "object") continue;

        // Support 'delay', 'wait', or 'waitAfter'
        const delayMs = parseTime(action.delay || action.wait || action.waitAfter || "0s");

        const timer = setTimeout(async () => {
            if (bot?._activeTimers) bot._activeTimers.delete(timer);
            if (!bot || bot._isStopping) return;

            switch (action.type) {
                case "move":
                    if (action.position) {
                        logger.info(`${logPrefix}🚶‍♂️ ${bot.username} is moving to ${JSON.stringify(action.position)} at ${action.speed || "normal"} speed`);
                        moveBot(bot, action.position, action.speed);
                    }
                    break;
                case "chat":
                    logger.info(`${logPrefix}💬 ${bot.username} is about to send messages`);
                    sendMessages(bot, action.messages, parseTime(action.interval || "10s"));
                    break;
                case "interact":
                    if (action.target) {
                        logger.info(`${logPrefix}🖱️ ${bot.username} will interact with a block at ${JSON.stringify(action.target)} using ${action.action || "right_click"}`);
                        await interactWithBlock(bot, action.target, action.action);
                    }
                    break;
                case "command":
                    if (action.command) {
                        logger.info(`${logPrefix}⌨️ ${bot.username} executes command: ${action.command}`);
                        executeCommand(bot, action.command);
                    }
                    break;
                default:
                    logger.warn(`${logPrefix}⚠️ Unknown action type: ${action.type}`);
            }
        }, delayMs);

        bot._activeTimers = bot._activeTimers || new Set();
        bot._activeTimers.add(timer);
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
        // Generate valid Minecraft username: only alphanumeric and underscores, max 16 chars
        const botName = threadId 
            ? `Bot_${threadId}_${i - startIndex + 1}` 
            : `Bot_${i + 1}`;

        try {
            const bot = await createAndConfigureBot(botName, scenario.server, scenario, config, createBotInstance, threadId);
            bots.push(bot);
        } catch (err) {
            logger.error(`${logPrefix}❌ Failed to create bot ${botName}: ${err.message}`);
        }

        // Wait between connections to avoid server handshake throttle
        const joinDelay = parseTime(config?.botJoinDelay ?? 500);
        if (joinDelay > 0 && i + 1 < endIndex) {
            await new Promise((resolve) => setTimeout(resolve, joinDelay));
        }
    }

    const botCount = bots.length;
    logger.info(`${logPrefix}✅ ${botCount} bots created and initiated!`);
    return bots;
}


