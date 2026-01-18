#!/usr/bin/env node
const net = require('net');
const chalk = require('chalk');

const clients = [];
const PORT = 3000;

const server = net.createServer((socket) => {
    socket.setEncoding('utf8');

    let clientInfo = { socket, room: null };
    clients.push(clientInfo);

    console.log(chalk.green(`[SERVER] New connection from ${socket.remoteAddress}:${socket.remotePort}`));

    let buffer = '';

    socket.on('data', (data) => {
        buffer += data;
        let lines = buffer.split('\n');
        buffer = lines.pop();

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            try {
                const payload = JSON.parse(line);

                if (payload.type === 'join') {
                    clientInfo.room = payload.room;
                    console.log(chalk.yellow(`[SERVER] User joined room: ${chalk.bold(payload.room)}`));
                } else if (payload.type === 'chat' && clientInfo.room) {
                    console.log(chalk.gray(`[SERVER] Received message for room: ${clientInfo.room}`));
                    let broadcastCount = 0;
                    clients.forEach((c) => {
                        if (c.socket !== socket && c.room === clientInfo.room && !c.socket.destroyed) {
                            c.socket.write(payload.message + '\n');
                            broadcastCount++;
                        }
                    });
                    console.log(chalk.gray(`[SERVER] Broadcasted to ${broadcastCount} other clients.`));
                }
            } catch (e) {
                console.error(chalk.red(`[SERVER ERROR] Failed to parse JSON: ${line.substring(0, 20)}...`));
            }
        }
    });

    socket.on('end', () => {
        const index = clients.findIndex(c => c.socket === socket);
        if (index !== -1) {
            clients.splice(index, 1);
        }
        console.log(chalk.red(`[SERVER] Client disconnected.`));
    });

    socket.on('error', (err) => {
        console.error(chalk.red(`[SERVER ERROR] ${err.message}`));
        const index = clients.findIndex(c => c.socket === socket);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });
});

server.listen(PORT, () => {
    console.clear();
    console.log(chalk.yellow(`CLI_CHAT`));
    console.log(chalk.yellow.bold(`   SERVER RUNNING ON PORT: ${PORT}   `));
    console.log(chalk.gray(`   Room-based secure broadcasting active...\n`));
    console.log(chalk.yellow.bold(`   Created by BUGZX\n`));
});
