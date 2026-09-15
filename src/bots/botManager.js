import { Worker } from "worker_threads";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger.js";
import { createBotInstance } from "./botFactory.js";
import { startBotsInRange } from "./botLifecycle.js";
import { cleanupBotActions } from "./botActions.js";

function getWorkerPath() {
    const cwdWorker = path.resolve(process.cwd(), "src", "bots", "worker.js");
    if (fs.existsSync(cwdWorker)) {
        return cwdWorker;
    }
    if (typeof __dirname !== "undefined") {
        return path.join(__dirname, "worker.js");
    }
    return cwdWorker;
}

let globalActiveBots = [];
let globalActiveWorkers = [];


/**
 * Stops all currently active bots and workers cleanly.
 */
export async function stopAllBots() {
    if (globalActiveBots.length === 0 && globalActiveWorkers.length === 0) {
        return;
    }

    logger.info(`🛑 Stopping all bots (${globalActiveBots.length} single-thread bots, ${globalActiveWorkers.length} worker threads)...`);

    // Stop single-threaded bots
    for (const bot of globalActiveBots) {
        try {
            bot._isStopping = true;
            cleanupBotActions(bot);
            if (typeof bot.quit === "function") {
                bot.quit();
            }
        } catch (e) {
            // Ignore quit errors during teardown
        }
    }
    globalActiveBots = [];

    // Stop worker threads
    for (const worker of globalActiveWorkers) {
        try {
            worker.postMessage({ command: "stop" });
        } catch (e) {
            try {
                worker.terminate();
            } catch {}
        }
    }
    globalActiveWorkers = [];
}

/**
 * Starts and manages multiple bots based on the scenario.
 * Uses worker threads if threading is enabled in config.
 * @param {Object} scenario - The scenario loaded in JSON
 * @param {Object} config - The general project configuration
 * @returns {Promise<{bots: Array, workers: Array, stop: Function}>}
 */
export async function startBots(scenario, config = {}) {
    const numThreads = Math.max(1, Number(config.threads) || 1);
    const numberOfBots = scenario.numberOfBots;

    // If threading is disabled (1 thread), use the single-threaded approach
    if (numThreads === 1) {
        const bots = await startBotsSingleThreaded(scenario, config);
        globalActiveBots = bots;
        return { bots, workers: [], stop: stopAllBots };
    }

    // Use multi-threading
    const botsPerThread = Math.ceil(numberOfBots / numThreads);
    const workers = [];
    const workerPromises = [];

    logger.info(`🧵 Starting ${numberOfBots} bots across ${numThreads} threads (≈${botsPerThread} bots per thread)`);

    for (let threadId = 0; threadId < numThreads; threadId++) {
        const startIndex = threadId * botsPerThread;
        const endIndex = Math.min(startIndex + botsPerThread, numberOfBots);

        // Skip threads with no bots assigned
        if (startIndex >= numberOfBots) break;

        const worker = new Worker(getWorkerPath(), {
            workerData: {
                botRange: [startIndex, endIndex],
                scenario,
                config,
                threadId: threadId + 1
            }
        });

        workers.push(worker);
        globalActiveWorkers.push(worker);

        const workerPromise = new Promise((resolve, reject) => {
            worker.on("message", (message) => {
                if (message.success) {
                    logger.info(`✅ Thread ${message.threadId} initialized: ${message.botCount} bots launched`);
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
                    logger.warn(`Thread ${threadId + 1} exited with code ${code}`);
                }
            });
        });

        workerPromises.push(workerPromise);
    }

    // Wait for all threads to complete initial connection phase
    try {
        await Promise.all(workerPromises);
        logger.info(`✅ All ${numberOfBots} bots have been launched across ${numThreads} threads!`);
        return { bots: [], workers, stop: stopAllBots };
    } catch (error) {
        logger.error(`❌ Error in multi-threading: ${error.message}`);
        await stopAllBots();
        throw error;
    }
}

/**
 * Starts bots in a single thread.
 * @param {Object} scenario - The scenario loaded in JSON
 * @param {Object} config - The general project configuration
 * @returns {Promise<Array>} - Created bots
 */
async function startBotsSingleThreaded(scenario, config) {
    return await startBotsInRange(0, scenario.numberOfBots, scenario, config, createBotInstance);
}

