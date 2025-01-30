import { createBotInstance } from "./botFactory.js";
import { moveBot, sendMessages, interactWithBlock, executeCommand } from "./botActions.js";
import { logger } from "../utils/logger.js";
import { parseTime } from "../utils/helpers.js";

/**
 * Starts and manages multiple bots based on the scenario.
 * @param {Object} scenario - The scenario loaded in JSON
 * @param {Object} config - The general project configuration
 */
export async function startBots(scenario, config) {
    const bots = [];

    for (let i = 0; i < scenario.numberOfBots; i++) {
        const botName = `Bot_${i + 1}`;
        logger.info(`🤖 Creating bot: ${botName}`);

        const bot = await createBotInstance(botName, scenario.server);
        bots.push(bot);

        // Manage bot events
        bot.on("spawn", () => handleBotJoin(bot, scenario));
        bot.on("error", (err) => logger.error(`❌ Error for ${botName}: ${err.message}`));
        bot.on("end", () => logger.warn(`🔴 ${botName} has disconnected`));

        // Wait a short delay between connections to avoid overloading the server
        await new Promise((resolve) => setTimeout(resolve, config.botJoinDelay || 500));
    }

    logger.info(`✅ All ${scenario.numberOfBots} bots have been launched!`);
}

/**
 * Handles actions when a bot joins the server.
 * @param {import("mineflayer").Bot} bot - The Mineflayer bot instance
 * @param {Object} scenario - The current scenario
 */
function handleBotJoin(bot, scenario) {
    logger.info(`🎮 ${bot.username} has joined the server!`);

    if (scenario.event && scenario.event.onJoin) {
        const { execute, wait } = scenario.event.onJoin;
        setTimeout(() => {
            if (execute) {
                executeCommand(bot, execute);
            }
            executeScenarioActions(bot, scenario.actions);
        }, parseTime(wait || "0s"));
    } else {
        executeScenarioActions(bot, scenario.actions);
    }
}

/**
 * Executes the actions defined in the scenario.
 * @param {import("mineflayer").Bot} bot - The Mineflayer bot instance
 * @param {Object} actions - List of actions from the scenario
 */
function executeScenarioActions(bot, actions) {
    for (const actionName in actions) {
        const action = actions[actionName];

        setTimeout(() => {
            switch (action.type) {
                case "move":
                    logger.info(`🚶‍♂️ ${bot.username} is moving to ${JSON.stringify(action.position)} at ${action.speed} speed`);
                    moveBot(bot, action.position, action.speed);
                    break;
                case "chat":
                    logger.info(`💬 ${bot.username} is about to send messages`);
                    sendMessages(bot, action.messages, parseTime(action.interval || "10s"));
                    break;
                case "interact":
                    logger.info(`🖱️ ${bot.username} will interact with a block at ${JSON.stringify(action.target)} using ${action.action}`);
                    interactWithBlock(bot, action.target, action.action);
                    break;
                case "command":
                    logger.info(`⌨️ ${bot.username} executes command: ${action.command}`);
                    executeCommand(bot, action.command);
                    break;
                default:
                    logger.warn(`⚠️ Unknown action: ${action.type}`);
            }
        }, parseTime(action.waitAfter || "0s"));
    }
}
