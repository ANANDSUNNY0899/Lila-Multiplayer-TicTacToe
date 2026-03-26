<div align="center">

# 🎮 LILA Games - Full Stack Assignment

### **Multiplayer Server-Authoritative Tic-Tac-Toe**

[![Nakama](https://img.shields.io/badge/Nakama-Server-00ADD8?style=for-the-badge&logo=go)](https://heroiclabs.com/)
[![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react)](https://expo.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

A production-ready, real-time multiplayer Tic-Tac-Toe game built with a **Server-Authoritative architecture** using **Nakama** and **React Native (Expo)**. This implementation ensures game integrity by validating all moves server-side, preventing client-side manipulation.

</div>

---

## 🎯 Architecture & Quality Decisions

Unlike traditional Tic-Tac-Toe implementations where game logic runs on the client, this project follows LILA's core engineering principles:

<table>
<tr>
<td width="50%">

### ⚡ **Authoritative Logic**
The 3x3 grid, turn management, and winning algorithms live entirely on the Nakama server.

</td>
<td width="50%">

### 🔒 **Integrity**
The client is a "dumb renderer." It sends move requests (OpCode 1) which are validated by the server before any state change is broadcasted.

</td>
</tr>
<tr>
<td width="50%">

### 🌐 **Real-time Sync**
Uses WebSockets for sub-100ms state updates (OpCode 2) across different platforms.

</td>
<td width="50%">

### 📱 **Cross-Platform**
The same codebase runs on Android, iOS, and Web browsers.

</td>
</tr>
</table>

---

## 🛠 Tech Stack

```text
┌─────────────────────────────────────────────────────────┐
│  Backend     │  Nakama Server (Go-based) + JS Runtime  │
│  Frontend    │  React Native (Expo) + Nakama JS SDK    │
│  Database    │  CockroachDB (SQL-compliant)            │
│  Infra       │  Docker & Docker Compose                │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```text
LILA_FullStack_Assignment/
│
├── 📂 backend/
│   ├── docker-compose.yml     # Infrastructure orchestration
│   ├── local.yml              # Nakama server configuration
│   └── modules/
│       └── index.js           # Server-Authoritative Game Logic
│
├── 📂 frontend/
│   ├── app/(tabs)/
│   │   └── index.tsx          # Main Game UI & Socket Logic
│   ├── package.json           # Frontend Dependencies
│   └── app.json               # Expo Configuration
│
└── 📄 README.md               # This file
```

---

## 🚀 Installation & Setup

### **1️⃣ Backend Setup (Docker)**

Ensure Docker Desktop is running.

```bash
cd backend
docker-compose up -d
```

> 💡 *The Nakama Console is available at `http://localhost:7351` (admin/password).*

<br>

### **2️⃣ Frontend Setup**

```bash
cd frontend
npm install
```

<br>

### **3️⃣ Networking Configuration**

For the app to work on a physical mobile device, the IP address in `frontend/app/(tabs)/index.tsx` must match your laptop's IPv4 address.

```typescript
const SERVER_IP = Platform.OS === 'web' ? "127.0.0.1" : "YOUR_LAPTOP_IP";
```

---

## 🎮 Running the Application

| Step | Action | Description |
|:----:|:-------|:------------|
| **1** | **Start the Frontend** | `npx expo start` |
| **2** | **Open Player 1 (Mobile)** | Scan the QR code with the **Expo Go** app |
| **3** | **Open Player 2 (Web)** | Press `w` in the terminal to launch the browser version |
| **4** | **Play** | Nakama's Matchmaker will automatically pair the two devices. **X goes first.** |

---

## 📡 API Design (OpCodes)

<div align="center">

| OpCode | Name | Direction | Payload |
|:------:|:-----|:---------:|:--------|
| **1** | **Move Request** | Client → Server | `{ "index": number }` |
| **2** | **State Update** | Server → Client | `{ "board": array, "nextTurn": string, "winner": string\|null, "isDraw": bool }` |

</div>

---

## 🧪 Implementation Details

### 🏆 **Winning Algorithm**

The server iterates through 8 predefined winning patterns (Rows, Columns, Diagonals) after every move:

```javascript
var WIN_PATTERNS = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
```

If a match is found, the server sets the `winner` ID and broadcasts a final state, locking the board for both players.

<br>

### 🔗 **Matchmaking Hook**

Used `initializer.registerMatchmakerMatched` to ensure that as soon as two players enter the pool, an authoritative match instance is spawned automatically.

---

## 🐛 Troubleshooting

<table>
<tr>
<th>Issue</th>
<th>Solution</th>
</tr>
<tr>
<td>❌ <b>"Offline" Status on Mobile</b></td>
<td>Ensure Windows Firewall allows inbound traffic on ports <b>7350</b> and <b>7351</b>.</td>
</tr>
<tr>
<td>⏳ <b>Stuck on "Finding Opponent"</b></td>
<td>Ensure you have two separate instances running (Web + Mobile). The Matchmaker requires exactly 2 players to start.</td>
</tr>
<tr>
<td>💥 <b>Docker Crash</b></td>
<td>Run <code>docker logs lilaassignment-nakama-1</code> to check for JavaScript syntax errors in the server module.</td>
</tr>
</table>

---

<div align="center">

## 👨‍💻 Developer

**Developed by:** SUNNY ANAND
**Role:** Full Stack Engineer Assignment - LILA Games

---

### ⭐ If you found this project interesting, please give it a star!

</div>
