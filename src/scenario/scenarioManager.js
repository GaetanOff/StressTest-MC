import { parseScenarioFile } from "./scenarioParser.js";
import { logger } from "../utils/logger.js";

/**
 * Loads a scenario file and validates its content.
 * @param {string} filePath - Path to the YAML file
 * @returns {Object} - Validated scenario
 */
export async function loadScenario(filePath) {
    const scenario = parseScenarioFile(filePath);
    validateScenario(scenario);
    logger.info(`✅ Scenario "${scenario.name}" loaded and validated.`);
    return scenario;
}

/**
 * Checks if the scenario contains the essential information.
 * @param {Object} scenario - The JSON object of the scenario
 */
function validateScenario(scenario) {
    try {
        if (!scenario.name || typeof scenario.name !== "string") {
            throw new Error("The scenario must have a valid 'name' field.");
        }
        if (!scenario.numberOfBots || typeof scenario.numberOfBots !== "number") {
            throw new Error("The scenario must specify 'numberOfBots' (number of bots to create).");
        }
        if (!scenario.server || !scenario.server.host || !scenario.server.port) {
            throw new Error("The scenario must include server information (host & port).");
        }
        if (!scenario.actions || typeof scenario.actions !== "object") {
            throw new Error("The scenario must include 'actions'.");
        }

        logger.info(`✅ Validation successful for scenario "${scenario.name}".`);
    } catch (error) {
        logger.error(`❌ Scenario validation error: ${error.message}`);
        process.exit(1);
    }
}
