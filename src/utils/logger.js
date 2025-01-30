import fs from "fs";
import path from "path";

// Load config to check if logging is enabled
const configPath = "./config/config.json";
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : { logging: { enabled: true, level: "info" } };

// Define log levels
const LOG_LEVELS = ["debug", "info", "warn", "error"];
const currentLogLevel = LOG_LEVELS.indexOf(config.logging.level || "info");

// Check and create the logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true }); // Recursively create the directory
}

/**
 * Displays a formatted log message if the level is enabled and writes it to a file.
 * @param {"debug" | "info" | "warn" | "error"} level - Log level.
 * @param {string} message - Message to display.
 */
export function log(level, message) {
    if (!config.logging.enabled) return;
    if (LOG_LEVELS.indexOf(level) < currentLogLevel) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Display in the console
    console[level === "error" ? "error" : "log"](formattedMessage);

    // Save to a log file
    fs.appendFileSync(path.join(logsDir, "bot.log"), formattedMessage + "\n");
}

// Aliases to avoid writing `log("info", "message")`
export const logger = {
    debug: (msg) => log("debug", msg),
    info: (msg) => log("info", msg),
    warn: (msg) => log("warn", msg),
    error: (msg) => log("error", msg),
};
