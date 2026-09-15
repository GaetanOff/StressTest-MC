import { loadScenario } from "./scenario/scenarioManager.js";
import { startBots, stopAllBots } from "./bots/botManager.js";
import { logger } from "./utils/logger.js";
import fs from "fs";
import path from "path";

// Locate and load main configuration
const configPath = path.resolve(process.cwd(), "config", "config.json");
if (!fs.existsSync(configPath)) {
    logger.error(`❌ The main configuration file is missing at: ${configPath}`);
    process.exit(1);
}

let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
} catch (err) {
    logger.error(`❌ Failed to parse config file: ${err.message}`);
    process.exit(1);
}

// Locate scenario file flexibly
const rawScenarioArg = process.argv[2] || "scenario-1.yml";
let resolvedScenarioPath = null;

const candidatePaths = [
    path.resolve(rawScenarioArg),
    path.resolve(process.cwd(), "config", "scenarios", rawScenarioArg),
    path.resolve(process.cwd(), "config", "scenarios", `${rawScenarioArg}.yml`)
];

for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        resolvedScenarioPath = candidate;
        break;
    }
}

if (!resolvedScenarioPath) {
    logger.error(`❌ Scenario file "${rawScenarioArg}" not found! Looked in:\n  - ${candidatePaths.join("\n  - ")}`);
    process.exit(1);
}

// Handle graceful shutdown on Ctrl+C or kill signals
let isShuttingDown = false;
async function handleShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`\n🛑 Received ${signal}. Shutting down bots gracefully...`);
    try {
        await stopAllBots();
        await logger.close();
    } catch (e) {
        // Ignore teardown errors
    }
    process.exit(0);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// Main execution
try {
    logger.info(`📜 Loading scenario: ${path.basename(resolvedScenarioPath)}...`);
    const scenario = await loadScenario(resolvedScenarioPath);

    logger.info(`🚀 Launching ${scenario.numberOfBots} bots...`);
    await startBots(scenario, config);
} catch (error) {
    logger.error(`❌ Execution failed: ${error.message}`);
    await stopAllBots();
    await logger.close();
    process.exit(1);
}

