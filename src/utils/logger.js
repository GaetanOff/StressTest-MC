import fs from "fs";
import path from "path";

// Define log levels with priority
const LOG_LEVELS = ["debug", "info", "warn", "error"];

// Default configuration
let loggingConfig = {
    enabled: true,
    level: "info",
    toFile: process.env.NODE_ENV !== "test",
    toConsole: true
};

// Load configuration if available
const configPath = path.resolve(process.cwd(), "config", "config.json");
if (fs.existsSync(configPath)) {
    try {
        const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (parsed.logging) {
            loggingConfig = { ...loggingConfig, ...parsed.logging };
        }
    } catch {
        // Fallback to default config on parse error
    }
}

let currentLogLevelIndex = LOG_LEVELS.indexOf(loggingConfig.level?.toLowerCase?.() || "info");
if (currentLogLevelIndex === -1) currentLogLevelIndex = 1; // Default to 'info'

let logStream = null;
const logsDir = path.resolve(process.cwd(), "logs");

function getLogStream() {
    if (logStream) return logStream;
    if (!loggingConfig.enabled || !loggingConfig.toFile) return null;

    try {
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        logStream = fs.createWriteStream(path.join(logsDir, "bot.log"), { flags: "a" });
        logStream.on("error", (err) => {
            console.error(`[LOGGER ERROR] Failed writing to log file: ${err.message}`);
        });
    } catch (err) {
        console.error(`[LOGGER ERROR] Could not initialize log file: ${err.message}`);
    }
    return logStream;
}

/**
 * Configure the logger dynamically.
 * @param {Object} options
 */
export function configureLogger(options = {}) {
    loggingConfig = { ...loggingConfig, ...options };
    if (options.level) {
        const idx = LOG_LEVELS.indexOf(options.level.toLowerCase());
        if (idx !== -1) currentLogLevelIndex = idx;
    }
    if (options.toFile === false && logStream) {
        logStream.end();
        logStream = null;
    }
}

/**
 * Displays a formatted log message if the level is enabled and writes it to a file asynchronously.
 * @param {"debug" | "info" | "warn" | "error"} level - Log level.
 * @param {string} message - Message to display.
 */
export function log(level, message) {
    if (!loggingConfig.enabled) return;

    const levelIndex = LOG_LEVELS.indexOf(level.toLowerCase());
    if (levelIndex < currentLogLevelIndex) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    // Display in the console
    if (loggingConfig.toConsole) {
        if (level === "error") {
            console.error(formattedMessage);
        } else if (level === "warn") {
            console.warn(formattedMessage);
        } else if (level === "debug") {
            console.debug ? console.debug(formattedMessage) : console.log(formattedMessage);
        } else {
            console.log(formattedMessage);
        }
    }

    // Write asynchronously to file without blocking event loop
    const stream = getLogStream();
    if (stream && stream.writable) {
        stream.write(formattedMessage + "\n");
    }
}

/**
 * Closes the log file stream gracefully.
 * @returns {Promise<void>}
 */
export function closeLogger() {
    return new Promise((resolve) => {
        if (logStream) {
            logStream.end(() => {
                logStream = null;
                resolve();
            });
        } else {
            resolve();
        }
    });
}

// Aliases
export const logger = {
    debug: (msg) => log("debug", msg),
    info: (msg) => log("info", msg),
    warn: (msg) => log("warn", msg),
    error: (msg) => log("error", msg),
    configure: configureLogger,
    close: closeLogger
};

