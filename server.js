#!/usr/bin/env node
const http = require('http');
const WebSocket = require('ws');
const chalk = require('chalk');

const PORT = process.env.PORT || 3000;

// 1. Create a standard HTTP server to satisfy Render's health checks
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(' Secure Chat Server is Online');
});

// 2. Attach WebSocket server to the SAME port
const wss = new WebSocket.Server({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
    let clientRoom = null;

    ws.on('message', (data) => {
        try {
            const payload = JSON.parse(data);

            if (payload.type === 'join') {
                clientRoom = payload.room;
                if (!rooms.has(clientRoom)) {
                    rooms.set(clientRoom, new Set());
                }
                rooms.get(clientRoom).add(ws);
                console.log(chalk.yellow(`[SERVER] User joined room: ${chalk.bold(clientRoom)}`));
            } else if (payload.type === 'chat' && clientRoom) {
                const clientsInRoom = rooms.get(clientRoom);
                if (clientsInRoom) {
                    clientsInRoom.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'chat', message: payload.message }));
                        }
                    });
                }
            }
        } catch (e) { }
    });

    ws.on('close', () => {
        if (clientRoom && rooms.has(clientRoom)) {
            rooms.get(clientRoom).delete(ws);
        }
        console.log(chalk.red(`[SERVER] Client disconnected.`));
    });
});

// 3. Start listening
server.listen(PORT, () => {
    console.clear();
    console.log(chalk.yellow(`CLI_CHAT (Hybrid WebSocket/HTTP Mode)`));
    console.log(chalk.green.bold(`   SERVER RUNNING ON PORT: ${PORT}   `));
    console.log(chalk.gray(`   Health Checks Active & Secure broadcasting ready...\n`));
    console.log(chalk.yellow.bold(`   Created by BUGZX\n`));
});
