import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "../utils/logger.js";
import { createBotInstance } from "./botFactory.js";
import { startBotsInRange } from "./botLifecycle.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Starts and manages multiple bots based on the scenario.
 * Uses worker threads if threading is enabled in config.
 * @param {Object} scenario - The scenario loaded in JSON
 * @param {Object} config - The general project configuration
 */
export async function startBots(scenario, config) {
    const numThreads = config.threads || 1;

    // If threading is disabled (1 thread), use the original single-threaded approach
    if (numThreads === 1) {
        await startBotsSingleThreaded(scenario, config);
        return;
    }

    // Use multi-threading
    const numberOfBots = scenario.numberOfBots;
    const botsPerThread = Math.ceil(numberOfBots / numThreads);
    const workers = [];
    const workerPromises = [];

    logger.info(`🧵 Starting ${numberOfBots} bots across ${numThreads} threads (≈${botsPerThread} bots per thread)`);

    for (let threadId = 0; threadId < numThreads; threadId++) {
        const startIndex = threadId * botsPerThread;
        const endIndex = Math.min(startIndex + botsPerThread, numberOfBots);

        // Skip threads with no bots assigned
        if (startIndex >= numberOfBots) break;

        const worker = new Worker(join(__dirname, "worker.js"), {
            workerData: {
                botRange: [startIndex, endIndex],
                scenario,
                config,
                threadId: threadId + 1
            }
        });

        workers.push(worker);

        const workerPromise = new Promise((resolve, reject) => {
            worker.on("message", (message) => {
                if (message.success) {
                    logger.info(`✅ Thread ${message.threadId} completed: ${message.botCount} bots launched`);
                    resolve(message);
                } else {
                    logger.error(`❌ Thread ${message.threadId} failed: ${message.error}`);
                    reject(new Error(message.error));
                }
            });

            worker.on("error", (error) => {
                logger.error(`❌ Thread ${threadId + 1} error: ${error.message}`);
                reject(error);
            });

            worker.on("exit", (code) => {
                if (code !== 0) {
                    logger.error(`❌ Thread ${threadId + 1} exited with code ${code}`);
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });

        workerPromises.push(workerPromise);
    }

    // Wait for all threads to complete
    try {
        await Promise.all(workerPromises);
        logger.info(`✅ All ${numberOfBots} bots have been launched across ${numThreads} threads!`);
    } catch (error) {
        logger.error(`❌ Error in multi-threading: ${error.message}`);
        // Terminate all workers on error
        workers.forEach((worker) => worker.terminate());
        throw error;
    }
}

/**
 * Starts bots in a single thread (original behavior).
 * @param {Object} scenario - The scenario loaded in JSON
 * @param {Object} config - The general project configuration
 */
async function startBotsSingleThreaded(scenario, config) {
    await startBotsInRange(0, scenario.numberOfBots, scenario, config, createBotInstance);
}
