import mineflayer from "mineflayer";
import { SocksClient } from "socks";
import { logger } from "../utils/logger.js";
import fs from "fs";

// Load configuration
const configPath = "./config/config.json";
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, "utf8")) : { proxy: { enabled: false, list: [] } };

/**
 * Selects a random working proxy from the list.
 * @returns {Promise<Object|null>} - A valid proxy or null if none are available
 */
async function getValidProxy() {
    if (!config.proxy.enabled || config.proxy.list.length === 0) return null;

    let proxies = [...config.proxy.list]; // Copy the list to avoid modifying the original
    let retries = 0;

    while (proxies.length > 0 && retries < config.proxy.maxRetries) {
        const index = Math.floor(Math.random() * proxies.length);
        const proxy = proxies.splice(index, 1)[0]; // Remove the selected proxy from the list

        if (await testProxy(proxy)) {
            return proxy;
        }

        retries++;
    }

    logger.warn("⚠️ No valid proxy found, bots will connect without a proxy.");
    return null;
}

/**
 * Tests if a proxy is working.
 * @param {Object} proxy - Object containing { host, port }
 * @returns {Promise<boolean>} - True if the proxy works, otherwise False
 */
function testProxy(proxy) {
    return new Promise((resolve) => {
        SocksClient.createConnection(
            {
                proxy: {
                    host: proxy.host,
                    port: proxy.port,
                    type: 5 // SOCKS5
                },
                command: "connect",
                destination: {
                    host: "play.example.com",
                    port: 25565
                },
                timeout: 3000
            },
            (err) => {
                if (err) {
                    logger.warn(`❌ Proxy OFF (${proxy.host}:${proxy.port})`);
                    resolve(false);
                } else {
                    logger.info(`✅ Proxy OK (${proxy.host}:${proxy.port})`);
                    resolve(true);
                }
            }
        );
    });
}

/**
 * Creates a Mineflayer bot instance with or without a proxy.
 * @param {string} botName - Name of the bot
 * @param {Object} serverConfig - Server configuration (host, port)
 * @returns {import("mineflayer").Bot} - The bot instance
 */
export async function createBotInstance(botName, serverConfig) {
    const botOptions = {
        host: serverConfig.host,
        port: serverConfig.port,
        username: botName,
        version: serverConfig.version || false
    };

    const proxy = await getValidProxy();

    if (proxy) {
        botOptions.auth = "microsoft"; // If using a proxy, Microsoft accounts are required
        botOptions.connect = (client) => {
            SocksClient.createConnection(
                {
                    proxy: {
                        host: proxy.host,
                        port: proxy.port,
                        type: 5
                    },
                    command: "connect",
                    destination: {
                        host: serverConfig.host,
                        port: serverConfig.port
                    }
                },
                (err, info) => {
                    if (err) {
                        logger.error(`❌ Unable to use proxy (${proxy.host}:${proxy.port}): ${err.message}`);
                        return;
                    }
                    client.setSocket(info.socket);
                    client.emit("connect");
                }
            );
        };

        logger.info(`🌐 ${botName} is connecting via proxy ${proxy.host}:${proxy.port}`);
    } else {
        logger.info(`🚀 ${botName} is connecting WITHOUT a proxy.`);
    }

    // Create the Mineflayer bot
    const bot = mineflayer.createBot(botOptions);

    bot.on("login", () => logger.info(`✅ ${bot.username} has connected!`));
    bot.on("error", (err) => logger.error(`❌ Error for ${bot.username}: ${err.message}`));
    bot.on("end", () => logger.warn(`🔴 ${bot.username} has disconnected`));

    return bot;
}
