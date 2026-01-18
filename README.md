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

## Core Features
*   **End-to-End Encryption (E2EE)**: Messages are encrypted and decrypted locally on your machine. The server only broadcasts encrypted data and has no access to your plain text conversations.
*   **Room Partitioning**: Support for multiple isolated chat rooms on a single server.
*   **Interactive Interface**: A clean terminal experience featuring easy navigation and clear status updates.
*   **Lightweight Design**: Built with native Node.js modules for high performance and minimal dependencies.

## Available Commands
*   `/exit` - Securely leave the chat session and close the connection.
*   `/cls` - Clear the terminal screen and refresh the header display.

---
**Developed by BUGZX**
