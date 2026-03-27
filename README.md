<div align="center">

# 🎮 LILA Games - Full Stack Assignment (Frontend)

### **React Native Web Client for Server-Authoritative Tic-Tac-Toe**

[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](#)
[![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?style=for-the-badge&logo=react)](https://expo.dev/)
[![Nakama](https://img.shields.io/badge/Nakama-JS_SDK-00ADD8?style=for-the-badge&logo=go)](https://heroiclabs.com/)

This repository contains the **Frontend Client** for the LILA Games multiplayer assignment. It is built with React Native (Expo) and connects to a custom Nakama game server deployed on Render to ensure 100% server-authoritative gameplay.

**[🔴 PLAY THE LIVE DEMO HERE](https://lila-multiplayer-tic-tac-toe.vercel.app/)** *(Note: To test matchmaking, please open the link in two separate browser windows/tabs to pair with yourself!)*

</div>

---

## 🎯 Architecture & Client Role

In adherence to LILA's engineering principles, this client is designed as a **"Dumb Renderer."** It contains zero game logic, win-checking algorithms, or state-saving mechanisms. 

<table>
<tr>
<td width="50%">

### 🔒 **Secure Gameplay**
The client cannot force a win or manipulate the board. It simply sends user input (grid index) to the server and waits for validation.

</td>
<td width="50%">

### 🌐 **Cloud Connectivity**
Configured to communicate with the Render backend securely over `WSS` (Port 443) with SSL enabled.

</td>
</tr>
<tr>
<td width="50%">

### 📱 **Cross-Platform**
Built using Expo, meaning the exact same UI codebase compiles natively to Web, iOS, and Android.

</td>
<td width="50%">

### ⚡ **Real-Time Sync**
Uses the `@heroiclabs/nakama-js` SDK to listen for high-speed socket events and update the React state instantly.

</td>
</tr>
</table>

---

## 🛠 Tech Stack

* **UI Framework:** React Native / Expo (React Native Web)
* **Networking:** Nakama JavaScript SDK (`@heroiclabs/nakama-js`)
* **Deployment:** Vercel (Serverless Edge Network)
* **Backend:** Nakama Game Server on Render *(See Backend Repo)*

---

## 🚀 Local Development Setup

If you wish to run the client locally:

### **1. Install Dependencies**
```bash
npm install
```

### **2. Start the Expo Server**
```bash
npx expo start
```

Press `w` in the terminal to launch the web version, or scan the QR code with the Expo Go app to view on mobile.

**Note:** By default, the code is configured to point to the live cloud server (`lila-tic-tac-toe-backend.onrender.com`). If you are running a local backend, update the `CLOUD_HOST` variable in the code to `127.0.0.1`.

---

## 📡 Client-Server API Design (OpCodes)

The client uses a streamlined Socket connection to communicate with the Match state:

<div align="center">

| OpCode | Action | Flow | Payload Format |
|--------|--------|------|----------------|
| 1 | Move Request | `Client → Server` | `JSON.stringify({ index: number })` |
| 2 | State Update | `Server → Client` | `{ board: string[], nextTurn: string, winner: string, isDraw: bool }` |

</div>

### Matchmaking Flow:
1. Client authenticates via `DeviceID`.
2. Client requests a match: `socket.addMatchmaker("*", 2, 2)`.
3. Server pairs two clients and returns a `match_id`.
4. Client joins the match and begins listening for `OpCode 2` broadcasts.

---

## 🔗 Related Repositories

This architecture is decoupled into two repositories for clean deployment pipelines:

* **Frontend (This Repo):** React Native UI.
* **Backend Repo:** [https://github.com/ANANDSUNNY0899/Tictoe_Backend] - Contains the Dockerized Nakama engine and Go/JS authoritative logic.

---

<div align="center">

## 👨‍💻 Developer

**Developed by:** Sunny Anand  
**Role:** Full Stack Engineer Assignment - LILA Games

</div>
