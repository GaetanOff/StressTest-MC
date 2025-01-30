import fs from "fs";
import yaml from "js-yaml";
import { logger } from "../utils/logger.js";

/**
 * Parses a YAML file into JSON.
 * @param {string} filePath - Path to the YAML file
 * @returns {Object} - JSON object representing the scenario
 */
export function parseScenarioFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Scenario file "${filePath}" does not exist.`);
        }

        const fileContent = fs.readFileSync(filePath, "utf8");
        const scenario = yaml.load(fileContent);

        if (!scenario) {
            throw new Error(`Failed to parse scenario file "${filePath}".`);
        }

        logger.info(`📜 Scenario "${filePath}" successfully parsed.`);
        return scenario;
    } catch (error) {
        logger.error(`❌ Error parsing the YAML file: ${error.message}`);
        throw error;
    }
}
