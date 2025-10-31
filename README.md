# **Stress-Test-MC** 🚀  
🛠️ **A load testing tool for Minecraft servers** based on **Mineflayer** and YAML scenarios.

## **📌 Features**
✅ **Simulates Minecraft bots** (joining, movement, chat, interactions...)  
✅ **Easy configuration using YAML scenarios**  
✅ **Multi-threading support** (configurable number of threads for better performance)  
✅ **Supports SOCKS5 proxies** (optional activation)  
✅ **Advanced logging system** (`logs/bot.log`)  
✅ **Automatic reconnection** (to be implemented if needed)  
✅ **Ability to load custom scenarios**  

---

## **📦 Installation**
### **1️⃣ Clone the project**
```sh
git clone https://github.com/GaetanOff/StressTest-MC.git
cd Stress-Test-MC
```

### **2️⃣ Install dependencies**
If you're using **pnpm**:  
```sh
pnpm install
```
Otherwise, with **npm**:  
```sh
npm install
```

---

## **⚙️ Configuration**
The **`config/config.json`** file allows you to adjust project settings.

### **Configuration options:**  
- **`botJoinDelay`** (number): Delay in milliseconds between bot connections (default: 500ms)
- **`threads`** (number): Number of worker threads to use for bot management (default: 1)
  - Use `1` for single-threaded execution (original behavior)
  - Use `> 1` to enable multi-threading and improve performance with many bots
- **`proxy`**: Proxy configuration for SOCKS5 proxies
- **`logging`**: Logging configuration (enable/disable and log level)

### **Example configuration:**  
```json
{
  "botJoinDelay": 500,
  "threads": 3,
  "proxy": {
    "enabled": false,
    "list": [
      { "host": "proxy1.com", "port": 1080 },
      { "host": "proxy2.com", "port": 1080 }
    ],
    "maxRetries": 3
  },
  "logging": {
    "enabled": true,
    "level": "info"
  }
}
```

**📌 Note:** The server configuration (host, port, version) is defined in each scenario YAML file, not in `config.json`.

---

## **📜 Creating a scenario**
Scenarios are defined in **`config/scenarios/`** using **YAML**.

### **Example scenario (`scenario-1.yml`)**
```yaml
name: "Stress Test - Exploration and Chat"
numberOfBots: 60  # Total number of bots to spawn

server:
  host: "play.example.com"
  port: 25565

event:
  onJoin:
    execute: "/help"  # Command executed as soon as the bot joins
    wait: 2s          # Wait 2 seconds before executing the next actions

actions:
  move-group:
    type: move
    position:
      x: 100
      y: 65
      z: 200
    speed: normal  # slow, normal, fast
    waitAfter: 5s  # Waiting time after reaching the destination

  send-messages:
    type: chat
    messages:
      - "Hello everyone!"
      - "Anyone up for a game?"
      - "I'm a bot, but a friendly one 🤖"
    interval: 10s  # Time between each message

  interact-block:
    type: interact
    target:
      x: 105
      y: 65
      z: 205
    action: "right_click"  # Can be "left_click" or "right_click"
    delay: 3s  # Time before interaction
```

---

## **🚀 Usage**
### **1️⃣ Launch a scenario**
```sh
node src/index.js scenario-1.yml
```
📌 If no scenario is specified, **`scenario-1.yml`** will be used by default.

### **2️⃣ Configure multi-threading**
To improve performance when launching many bots, you can configure multiple threads in **`config.json`**:
```json
{
  "threads": 4  // Launch bots across 4 threads
}
```
The bots will be automatically distributed across the specified number of threads. Each bot will be named `Bot-ThreadNumber-LocalNumber` (e.g., `Bot-1-1`, `Bot-1-2`, `Bot-2-1`, etc.).

### **3️⃣ Enable proxies**
In **`config.json`**, set `"enabled": true` under `"proxy"`:
```json
"proxy": {
  "enabled": true,
  "list": [
    { "host": "proxy1.com", "port": 1080 },
    { "host": "proxy2.com", "port": 1080 }
  ],
  "maxRetries": 3
}
```

---

## **🚀 Running the Project with Docker**
This project includes **a Docker setup** to easily run Minecraft bot stress tests **without installing dependencies manually**.

### **1️⃣ Build the Docker Image**
```sh
docker build -t stress-test-mc .
```

### **2️⃣ Run the Container**
To start the project inside a Docker container:
```sh
docker run --rm -it stress-test-mc
```
This will launch the bots as defined in the default scenario.

### **3️⃣ Run a Custom Scenario**
To run a specific scenario:
```sh
docker run --rm -it stress-test-mc node src/index.js scenario-2.yml
```

### **4️⃣ Mount Local Files (For Development)**
If you want to **modify files without rebuilding the image**, mount the current directory:
```sh
docker run --rm -it -v $(pwd):/app stress-test-mc
```
This allows you to edit code locally, and it will reflect inside the container.

---

## **📂 Project structure**
```
mc-load-tester/
│── config/
│   ├── scenarios/              # 📂 YAML scenarios
│   │   ├── scenario-1.yml
│   │   ├── scenario-2.yml
│   ├── config.json             # ⚙️ Main configuration
│
│── src/
│   ├── bots/
│   │   ├── botManager.js       # 🎮 Bot management & multi-threading
│   │   ├── botFactory.js       # 🏗️ Bot creation
│   │   ├── botActions.js       # 🔧 Bot actions
│   │   ├── botLifecycle.js     # 🔄 Shared bot lifecycle functions
│   │   ├── worker.js           # 🧵 Worker thread handler
│   ├── scenario/
│   │   ├── scenarioManager.js  # 📜 Scenario execution
│   │   ├── scenarioParser.js   # 📝 YAML parsing
│   ├── utils/
│   │   ├── logger.js           # 🖊️ Logging system
│   │   ├── helpers.js          # ⚡ Utility functions
│
│── logs/                       # 📂 Log files (auto-created)
│── index.js                    # 🚀 Main entry point
│── package.json                 # 📦 Dependencies and scripts
│── README.md                    # 📖 Documentation
```

---

## **📄 Logs**
Logs are recorded in **`logs/bot.log`**.  

Example (single-threaded):
```
[2025-01-30T07:57:39.999Z] [INFO] 🚀 Launching 60 bots...
[2025-01-30T07:57:40.000Z] [INFO] 🤖 Creating bot: Bot_1
[2025-01-30T07:57:40.001Z] [INFO] ✅ Bot_1 has connected!
[2025-01-30T07:57:42.005Z] [INFO] 💬 Bot_1 says: "Hello everyone!"
```

Example (multi-threaded):
```
[2025-01-30T07:57:39.999Z] [INFO] 🚀 Launching 60 bots...
[2025-01-30T07:57:39.999Z] [INFO] 🧵 Starting 60 bots across 3 threads (≈20 bots per thread)
[2025-01-30T07:57:40.000Z] [INFO] [Thread 1] 🤖 Creating bot: Bot-1-1
[2025-01-30T07:57:40.000Z] [INFO] [Thread 2] 🤖 Creating bot: Bot-2-1
[2025-01-30T07:57:40.000Z] [INFO] [Thread 3] 🤖 Creating bot: Bot-3-1
[2025-01-30T07:57:40.001Z] [INFO] [Thread 1] ✅ Bot-1-1 has connected!
```

---

## **📝 License**
All the code is licensed under GPL v3.     
Feel free to modify and improve it! 😃  

---

## **🙌 Contributing**
💡 **Ideas, suggestions, or bugs?**  
Open an **issue** or submit a **pull request**!  

---

## **📬 Contact**
📧 **contact@gaetandev.fr**  
🌍 **[Website](https://gaetandev.fr)**  
💬 **Discord: GaetanDev**  

---

## **🎉 Thank you for using Stress-Test-MC!**
If you have any questions or suggestions, let me know! 🚀😃
