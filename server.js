#!/usr/bin/env node
const WebSocket = require('ws');
const chalk = require('chalk');

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

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
                console.log(chalk.gray(`[SERVER] Received message for room: ${clientRoom}`));
                const clientsInRoom = rooms.get(clientRoom);
                if (clientsInRoom) {
                    let broadcastCount = 0;
                    clientsInRoom.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'chat', message: payload.message }));
                            broadcastCount++;
                        }
                    });
                    console.log(chalk.gray(`[SERVER] Broadcasted to ${broadcastCount} other clients.`));
                }
            }
        } catch (e) {
        }
    });

    ws.on('close', () => {
        if (clientRoom && rooms.has(clientRoom)) {
            rooms.get(clientRoom).delete(ws);
            if (rooms.get(clientRoom).size === 0) {
                rooms.delete(clientRoom);
            }
        }
        console.log(chalk.red(`[SERVER] Client disconnected.`));
    });

    ws.on('error', (err) => {
        console.error(chalk.red(`[SERVER ERROR] ${err.message}`));
    });
});

console.clear();
console.log(chalk.yellow(`CLI_CHAT (WebSocket Mode)`));
console.log(chalk.yellow.bold(`   SERVER RUNNING ON PORT: ${PORT}   `));
console.log(chalk.gray(`   Room-based secure broadcasting active...\n`));
console.log(chalk.yellow.bold(`   Created by BUGZX\n`));
