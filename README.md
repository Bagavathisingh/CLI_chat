# Bugzx Secure Chat

A professional, end-to-end encrypted command-line interface chat application. This tool allows users to communicate securely across terminals using a structured room system.

## Installation

You can install the package globally using npm:

```bash
npm install -g @chat_cli/bugzx-secure-chat
```
## Getting Started

### 1. Start a Server
One user must host the central relay server. If you are on a local network, other participants can join using your local IP. For global access, you can host this on a public server or use a tunnel service.

```bash
bugzx-chat-server
```

### 2. Join the Chatroom
All participants, including the host, can join the conversation by running the client application:

```bash
bugzx-chat
```

### Setup Process:
1.  **Username**: Choose your display name for the session.
2.  **Server IP**: Enter the IP address of the hosting server (defaults to localhost).
3.  **Server Port**: Enter the network port (defaults to 3000).
4.  **Select Action**: Choose between creating a new room or joining an existing one.
5.  **Room Name**: Specify the unique name for your private space.
6.  **Secret Key**: Enter your encryption passphrase. Only users with the exact same Room Name and Secret Key can decrypt and read the messages.

### LAN / Hotspot Mode (Offline) 
Perfect for hackathons, offices, or places without internet.
1.  **Host**: Select **LAN / Hotspot Mode** > **Host Room**. This automatically starts a server on your machine and generates a **Join Code**.
2.  **Join**: Select **LAN / Hotspot Mode** > **Join Room** and enter the **Join Code** shared by the host.

> **Note**: The **Join Code** (e.g., `SXXx-Xxxx-Xxxxx...`) securely contains the IP address and Port info. Share this with friends on the same WiFi/Hotspot to connect instantly!

## Core Features
*   **End-to-End Encryption (E2EE)**: Messages are encrypted and decrypted locally on your machine. The server only broadcasts encrypted data and has no access to your plain text conversations.
*   **Room Partitioning**: Support for multiple isolated chat rooms on a single server.
*   **Zero-Knowledge Privacy**: Room names are hashed (MD5) before sending to the server. The server admin cannot see your actual room topic.
*   **Interactive Interface**: A clean terminal experience featuring easy navigation and clear status updates.
*   **Lightweight Design**: Built with native Node.js modules for high performance and minimal dependencies.

## Available Commands
*   `/exit` - Securely leave the chat session and close the connection.
*   `/cls` - Clear the terminal screen and refresh the header display.
*   `/info` - **(Host Only)** Toggle the Host Panel to view/hide the Secret Key and Join Code.
*   `/users` - Check how many users are currently online in the room.

## Why Developers Love This 

As developers, moving your hand to the mouse to switch windows breaks flow. **BUGZX Secure Chat** keeps you in the zone.

### 1. Zero Context Switching
Alt-tabbing to Slack/Teams breaks your coding flow. With this tool, you chat right where you code. Keep a terminal tab open and communicate without ever leaving your IDE.

### 2. True "Air-Gapped" Communication
Working in a secure facility or a hackathon with bad WiFi? Use **LAN/Hotspot Mode**. No internet required. Chat completely offline over a local network or direct WiFi hotspot connection.

### 3. Share Secrets Securely
Need to send an `AWS_SECRET_KEY`? Pasting it in Slack saves it on their cloud forever. With our **End-to-End Encryption**, messages are encrypted *before* they leave your machine. Even the relay server sees only garbage text.

### 4. Instant Ephemeral Rooms
No admin permissions needed. Just run `bugzx-chat`, type a room name `debug-session-404`, share the key, and you have an instant war room. Close the terminal, and it's gone forever.

---
**Developed by BUGZX**
