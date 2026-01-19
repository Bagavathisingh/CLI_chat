#!/usr/bin/env node
const http = require('http');
const WebSocket = require('ws');
const chalk = require('chalk');

const pkg = require('./package.json');
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.green.bold('Bugzx Chat Server'));
    console.log(`Version: ${pkg.version}`);
    console.log('\nUsage: bugzx-chat-server [options]');
    console.log('\nOptions:');
    console.log('  -p, --port <number>  Set port to listen on');
    console.log('  -v, --version        Show version');
    console.log('  -h, --help           Show help');
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    console.log(pkg.version);
    process.exit(0);
}

let customPort = null;
for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
        customPort = args[i + 1];
    }
}

const PORT = customPort || process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(' Secure Chat Server is Online');
});


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
                console.log(chalk.yellow(`[SERVER] User joined room: ${chalk.bold(clientRoom)} (${rooms.get(clientRoom).size} users)`));

                const clientsInRoom = rooms.get(clientRoom);
                clientsInRoom.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'system', message: 'A new user joined the room!' }));
                    }
                });

            } else if (payload.type === 'chat' && clientRoom) {
                const clientsInRoom = rooms.get(clientRoom);
                if (clientsInRoom) {
                    clientsInRoom.forEach((client) => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'chat', message: payload.message }));
                        }
                    });
                }
            } else if (payload.type === 'getUserCount' && clientRoom) {
                const count = rooms.has(clientRoom) ? rooms.get(clientRoom).size : 0;
                ws.send(JSON.stringify({ type: 'userCount', count: count }));
            }
        } catch (e) { }
    });

    ws.on('close', () => {
        if (clientRoom && rooms.has(clientRoom)) {
            const roomUsers = rooms.get(clientRoom);
            roomUsers.delete(ws);

            roomUsers.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'system', message: 'A user left the room.' }));
                }
            });

            if (roomUsers.size === 0) {
                rooms.delete(clientRoom);
            }
        }
        console.log(chalk.red(`[SERVER] Client disconnected.`));
    });
});

server.listen(PORT, () => {
    console.clear();
    console.log(chalk.yellow(`CLI_CHAT (Hybrid WebSocket/HTTP Mode)`));
    console.log(chalk.green.bold(`   SERVER RUNNING ON PORT: ${PORT}   `));
    console.log(chalk.gray(`   Health Checks Active & Secure broadcasting ready...\n`));
    console.log(chalk.yellow.bold(`   Created by BUGZX\n`));
});
