import mineflayer from "mineflayer";
import { SocksClient } from "socks";
import { pathfinder } from "mineflayer-pathfinder";
import { logger } from "../utils/logger.js";
import fs from "fs";
import path from "path";

/**
 * Loads configuration safely from disk.
 * @returns {Object}
 */
export function loadDefaultConfig() {
    const configPath = path.resolve(process.cwd(), "config", "config.json");
    if (fs.existsSync(configPath)) {
        try {
            return JSON.parse(fs.readFileSync(configPath, "utf8"));
        } catch {
            return { proxy: { enabled: false, list: [] } };
        }
    }
    return { proxy: { enabled: false, list: [] } };
}

/**
 * Selects a random working proxy from the list.
 * @param {Object} proxyConfig - Proxy configuration
 * @param {Object} destination - Target server { host, port }
 * @returns {Promise<Object|null>} - A valid proxy or null if none are available
 */
export async function getValidProxy(proxyConfig, destination = { host: "127.0.0.1", port: 25565 }) {
    if (!proxyConfig || !proxyConfig.enabled || !Array.isArray(proxyConfig.list) || proxyConfig.list.length === 0) {
        return null;
    }

    const proxies = [...proxyConfig.list];
    const maxRetries = Math.min(proxyConfig.maxRetries || 3, proxies.length);
    let retries = 0;

    while (proxies.length > 0 && retries < maxRetries) {
        const index = Math.floor(Math.random() * proxies.length);
        const proxy = proxies.splice(index, 1)[0];

        const isWorking = await testProxy(proxy, destination);
        if (isWorking) {
            return proxy;
        }

        retries++;
    }

    logger.warn("⚠️ No valid proxy found, bots will connect without a proxy.");
    return null;
}

/**
 * Tests if a proxy is working against the destination.
 * @param {Object} proxy - Object containing { host, port, username, password }
 * @param {Object} destination - Target server { host, port }
 * @returns {Promise<boolean>} - True if the proxy works, otherwise False
 */
export function testProxy(proxy, destination = { host: "127.0.0.1", port: 25565 }) {
    return new Promise((resolve) => {
        const options = {
            proxy: {
                host: proxy.host,
                port: Number(proxy.port),
                type: 5 // SOCKS5
            },
            command: "connect",
            destination: {
                host: destination.host,
                port: Number(destination.port)
            },
            timeout: proxy.timeout || 4000
        };

        if (proxy.username && proxy.password) {
            options.proxy.userId = proxy.username;
            options.proxy.password = proxy.password;
        }

        SocksClient.createConnection(options, (err) => {
            if (err) {
                logger.warn(`❌ Proxy OFF (${proxy.host}:${proxy.port}): ${err.message}`);
                resolve(false);
            } else {
                logger.info(`✅ Proxy OK (${proxy.host}:${proxy.port})`);
                resolve(true);
            }
        });
    });
}

/**
 * Creates a Mineflayer bot instance with or without a proxy.
 * Loads pathfinder plugin automatically.
 * @param {string} botName - Name of the bot
 * @param {Object} serverConfig - Server configuration (host, port, version, auth)
 * @param {Object} [config] - Optional general configuration
 * @returns {Promise<import("mineflayer").Bot>} - The bot instance
 */
export async function createBotInstance(botName, serverConfig, config = null) {
    const activeConfig = config || loadDefaultConfig();
    const serverDestination = {
        host: serverConfig.host,
        port: Number(serverConfig.port) || 25565
    };

    const botOptions = {
        host: serverDestination.host,
        port: serverDestination.port,
        username: botName,
        version: serverConfig.version || false,
        auth: serverConfig.auth || activeConfig.auth || "offline"
    };

    const proxy = await getValidProxy(activeConfig.proxy, serverDestination);

    if (proxy) {
        botOptions.connect = (client) => {
            const proxyOptions = {
                proxy: {
                    host: proxy.host,
                    port: Number(proxy.port),
                    type: 5
                },
                command: "connect",
                destination: {
                    host: serverDestination.host,
                    port: serverDestination.port
                },
                timeout: proxy.timeout || 6000
            };

            if (proxy.username && proxy.password) {
                proxyOptions.proxy.userId = proxy.username;
                proxyOptions.proxy.password = proxy.password;
            }

            SocksClient.createConnection(proxyOptions, (err, info) => {
                if (err) {
                    logger.error(`❌ Unable to connect via proxy (${proxy.host}:${proxy.port}): ${err.message}`);
                    client.emit("error", err);
                    return;
                }
                client.setSocket(info.socket);
                client.emit("connect");
            });
        };

        logger.info(`🌐 ${botName} is connecting via proxy ${proxy.host}:${proxy.port}`);
    } else {
        logger.info(`🚀 ${botName} is connecting WITHOUT a proxy.`);
    }

    // Create the Mineflayer bot
    const bot = mineflayer.createBot(botOptions);

    // Automatically load pathfinder plugin for navigation
    try {
        if (pathfinder) {
            bot.loadPlugin(pathfinder);
        }
    } catch (err) {
        logger.warn(`⚠️ Could not load pathfinder on ${botName}: ${err.message}`);
    }

    return bot;
}

