import { parseScenarioFile } from "./scenarioParser.js";
import { logger } from "../utils/logger.js";

/**
 * Loads a scenario file and validates its content.
 * @param {string} filePath - Path to the YAML file
 * @returns {Promise<Object>} - Validated scenario
 */
export async function loadScenario(filePath) {
    const scenario = parseScenarioFile(filePath);
    validateScenario(scenario);
    logger.info(`✅ Scenario "${scenario.name}" loaded and validated.`);
    return scenario;
}

/**
 * Checks if the scenario contains all essential and valid information.
 * @param {Object} scenario - The JSON object of the scenario
 * @throws {Error} if scenario is invalid
 */
export function validateScenario(scenario) {
    if (!scenario || typeof scenario !== "object") {
        throw new Error("Scenario must be a valid object.");
    }
    if (!scenario.name || typeof scenario.name !== "string" || scenario.name.trim().length === 0) {
        throw new Error("The scenario must have a valid non-empty 'name' field.");
    }
    if (typeof scenario.numberOfBots !== "number" || scenario.numberOfBots <= 0 || !Number.isInteger(scenario.numberOfBots)) {
        throw new Error("The scenario must specify 'numberOfBots' as a positive integer.");
    }
    if (!scenario.server || typeof scenario.server !== "object") {
        throw new Error("The scenario must include a 'server' configuration object.");
    }
    if (!scenario.server.host || typeof scenario.server.host !== "string") {
        throw new Error("The scenario server must include a valid 'host' string.");
    }

    const port = Number(scenario.server.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("The scenario server must include a valid port (1-65535).");
    }
    scenario.server.port = port;

    if (scenario.actions !== undefined) {
        if (typeof scenario.actions !== "object" || scenario.actions === null || Array.isArray(scenario.actions)) {
            throw new Error("The scenario 'actions' must be a valid object map of actions.");
        }
    }

    logger.info(`✅ Validation successful for scenario "${scenario.name}".`);
}

