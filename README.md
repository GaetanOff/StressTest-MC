# **Stress-Test-MC** 🚀  
🛠️ **A load testing tool for Minecraft servers** based on **Mineflayer** and YAML scenarios.

## **📌 Features**
✅ **Simulates Minecraft bots** (joining, movement, chat, interactions...)  
✅ **Easy configuration using YAML scenarios**  
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

### **Example configuration:**  
```json
{
  "botJoinDelay": 500,
  "defaultServer": {
    "host": "play.example.com",
    "port": 25565,
    "version": "1.20.1"
  },
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

### **2️⃣ Enable proxies**
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
│   │   ├── botManager.js       # 🎮 Bot management
│   │   ├── botFactory.js       # 🏗️ Bot creation
│   │   ├── botActions.js       # 🔧 Bot actions
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

Example:
```
[2025-01-30T07:57:39.999Z] [INFO] 🚀 Launching 60 bots...
[2025-01-30T07:57:40.000Z] [INFO] 🤖 Creating bot: Bot_1
[2025-01-30T07:57:40.001Z] [INFO] ✅ Bot_1 has connected!
[2025-01-30T07:57:42.005Z] [INFO] 💬 Bot_1 says: "Hello everyone!"
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
