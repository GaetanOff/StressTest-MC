import { loadScenario } from "./scenario/scenarioManager.js";
import { startBots } from "./bots/botManager.js";
import { logger } from "./utils/logger.js";
import fs from "fs";

const configPath = "./config/config.json";
if (!fs.existsSync(configPath)) {
    logger.error("❌ The main configuration file is missing!");
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const scenarioName = process.argv[2] || "scenario-1.yml";
const scenarioPath = `./config/scenarios/${scenarioName}`;
if (!fs.existsSync(scenarioPath)) {
    logger.error(`❌ Scenario file "${scenarioName}" not found!`);
    process.exit(1);
}

logger.info(`📜 Loading scenario: ${scenarioName}...`);
const scenario = await loadScenario(scenarioPath);

logger.info(`🚀 Launching ${scenario.numberOfBots} bots...`);
await startBots(scenario, config);
