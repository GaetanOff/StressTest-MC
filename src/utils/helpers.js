/**
 * Convertit une chaîne de temps ("2s", "500ms") en millisecondes.
 * @param {string} timeStr - Temps sous forme de string (ex: "2s", "500ms").
 * @returns {number} - Temps en millisecondes.
 */
export function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)(ms|s)$/);
    if (!match) return 0;
    const [_, value, unit] = match;
    return unit === "s" ? parseInt(value) * 1000 : parseInt(value);
}

/**
 * Attendre un certain temps (Promise).
 * @param {number} ms - Durée en millisecondes.
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
