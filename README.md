# 🔐 Bugzx Secure Chat (NPM)

A premium, end-to-end encrypted (E2EE) CLI chat application that allows users to communicate securely across terminals using a room-based system.

## 🚀 Installation

You can install it globally via npm:

```bash
npm install -g bugzx-secure-chat
```

## 🎮 How to Use

### 1. Start a Server
One person needs to host the server. If you are on a local network, others can join your local IP. If you are on a public server, others can join your public IP.

```bash
bugzx-chat-server
```

### 2. Join the Chat
Everyone else (and the host) runs the chat client:

```bash
bugzx-chat
```

### 🛠️ Setup Steps:
1.  **Username**: Choose your display name.
2.  **Server IP**: Enter the IP address of the person running the server (defaults to `localhost`).
3.  **Choose Action**: Select either "Create a Room" or "Join a Room" using arrow keys.
4.  **Room Name**: Enter a name for your private space.
5.  **Secret Key**: Enter a passphrase. **Only users with the same Room Name AND the same Secret Key can decrypt the messages.**

## ✨ Features
*   **E2EE Security**: Messages are encrypted locally on your machine. The server never sees your plain text.
*   **Room System**: Create unlimited isolated rooms on a single server.
*   **Interactive UI**: Sleek terminal interface with ASCII art and arrow-key selection.
*   **Lightweight**: Zero bloat, built with Node.js.

## ⌨️ Commands
*   `/exit` - Leave the chat.
*   `/cls` - Clear the screen and redraw the header.

---
**Created by BUGZX**
