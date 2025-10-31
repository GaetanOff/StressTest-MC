import { parentPort, workerData } from "worker_threads";
import { createBotInstance } from "./botFactory.js";
import { startBotsInRange } from "./botLifecycle.js";
import { logger } from "../utils/logger.js";

const { botRange, scenario, config, threadId } = workerData;

/**
 * Starts bots assigned to this worker thread.
 */
async function startBotsInThread() {
    try {
        const [startIndex, endIndex] = botRange;
        await startBotsInRange(startIndex, endIndex, scenario, config, createBotInstance, threadId);
        parentPort.postMessage({ success: true, threadId, botCount: endIndex - startIndex });
    } catch (error) {
        logger.error(`❌ [Thread ${threadId}] Error starting bots: ${error.message}`);
        parentPort.postMessage({ success: false, threadId, error: error.message });
    }
}

// Start the bots when the worker receives the data
startBotsInThread().catch((error) => {
    logger.error(`❌ [Thread ${threadId}] Unhandled error in worker: ${error.message}`);
    parentPort.postMessage({ success: false, threadId, error: error.message });
    process.exit(1);
});

