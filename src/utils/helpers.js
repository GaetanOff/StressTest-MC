/**
 * Converts a time string ("2s", "500ms", "1.5s", "1m") or number to milliseconds.
 * @param {string|number} timeStr - Time value (e.g., "2s", "500ms", "1.5s", "2m", 1000).
 * @returns {number} - Time in milliseconds.
 */
export function parseTime(timeStr) {
    if (typeof timeStr === "number") {
        return Math.max(0, Math.round(timeStr));
    }
    if (!timeStr || typeof timeStr !== "string") {
        return 0;
    }

    const trimmed = timeStr.trim().toLowerCase();
    const match = trimmed.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2] || "ms";

    switch (unit) {
        case "h":
            return Math.round(value * 3600 * 1000);
        case "m":
            return Math.round(value * 60 * 1000);
        case "s":
            return Math.round(value * 1000);
        case "ms":
        default:
            return Math.round(value);
    }
}

/**
 * Delay execution for a given number of milliseconds.
 * @param {number} ms - Duration in milliseconds.
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

