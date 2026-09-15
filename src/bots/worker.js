import { parentPort, workerData } from "worker_threads";
import { createBotInstance } from "./botFactory.js";
import { startBotsInRange } from "./botLifecycle.js";
import { cleanupBotActions } from "./botActions.js";
import { logger } from "../utils/logger.js";

const { botRange, scenario, config, threadId } = workerData;
let activeBots = [];

/**
 * Starts bots assigned to this worker thread.
 */
async function startBotsInThread() {
    try {
        const [startIndex, endIndex] = botRange;
        activeBots = await startBotsInRange(startIndex, endIndex, scenario, config, createBotInstance, threadId);
        parentPort.postMessage({ success: true, threadId, botCount: activeBots.length });
    } catch (error) {
        logger.error(`❌ [Thread ${threadId}] Error starting bots: ${error.message}`);
        parentPort.postMessage({ success: false, threadId, error: error.message });
    }
}

// Listen for commands from the parent thread
if (parentPort) {
    parentPort.on("message", (msg) => {
        if (msg?.command === "stop") {
            logger.info(`[Thread ${threadId}] Stopping ${activeBots.length} bots...`);
            for (const bot of activeBots) {
                try {
                    bot._isStopping = true;
                    cleanupBotActions(bot);
                    if (typeof bot.quit === "function") {
                        bot.quit();
                    }
                } catch (e) {
                    // Ignore disconnect errors during teardown
                }
            }
            activeBots = [];
            process.exit(0);
        }
    });
}

// Start the bots when the worker receives data
startBotsInThread().catch((error) => {
    logger.error(`❌ [Thread ${threadId}] Unhandled error in worker: ${error.message}`);
    if (parentPort) {
        parentPort.postMessage({ success: false, threadId, error: error.message });
    }
    process.exit(1);
});


