#!/usr/bin/env node
const net = require('net');
const readline = require('readline');
const chalk = require('chalk');
const crypto = require('crypto');

const PORT_DEFAULT = 3000;
const DEFAULT_HOST = 'localhost'; // Change this to your deployed server URL later!
let HOST = DEFAULT_HOST;
const ALGORITHM = 'aes-256-cbc';

let username = '';
let roomName = '';
let secretKey = '';

const getDerivedKey = (secret) => {
    return crypto.scryptSync(secret, 'salt', 32);
};

const encrypt = (text, key) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (text, key) => {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null;
    }
};

const renderHeader = () => {
    console.clear();
    console.log(chalk.green(`
  ██████╗██╗     ██╗    ██████╗██╗  ██╗ █████╗ ████████╗
 ██╔════╝██║     ██║   ██╔════╝██║  ██║██╔══██╗╚══██╔══╝
 ██║     ██║     ██║   ██║     ███████║███████║   ██║   
 ██║     ██║     ██║   ██║     ██╔══██║██╔══██╗   ██║   
 ╚██████╗███████╗██║   ╚██████╗██║  ██║██║  ██║   ██║   
  ╚═════╝╚══════╝╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
    `));
    console.log(chalk.green.bold('      WELCOME TO THE SECURE CLI CHAT BOX       '));
    console.log(chalk.yellow.bold('              Created by BUGZX                 \n'));
};

const showMenu = (options, callback) => {
    let selectedIndex = 0;

    const render = () => {
        renderHeader();
        console.log(chalk.cyan('Select an option (Use arrow keys & Enter):\n'));
        options.forEach((opt, idx) => {
            if (idx === selectedIndex) {
                console.log(chalk.green.bold(`  > [ ${opt} ]`));
            } else {
                console.log(chalk.white(`    [ ${opt} ]`));
            }
        });
    };

    render();

    const onKeypress = (str, key) => {
        if (!key) return;
        if (key.name === 'up') {
            selectedIndex = (selectedIndex - 1 + options.length) % options.length;
            render();
        } else if (key.name === 'down') {
            selectedIndex = (selectedIndex + 1) % options.length;
            render();
        } else if (key.name === 'return') {
            process.stdin.removeListener('keypress', onKeypress);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            callback(selectedIndex);
        } else if (key.ctrl && key.name === 'c') {
            process.exit();
        }
    };

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', onKeypress);
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green.bold('> ')
});

renderHeader();

rl.question(chalk.cyan('Enter your username: '), (user) => {
    username = user.trim() || 'Anonymous';

    rl.question(chalk.cyan(`Enter Server IP (press Enter for ${DEFAULT_HOST}): `), (ip) => {
        HOST = ip.trim() || DEFAULT_HOST;

        rl.question(chalk.cyan('Enter Server Port (press Enter for 3000): '), (portInput) => {
            const TARGET_PORT = parseInt(portInput.trim()) || PORT_DEFAULT;

            showMenu(['Create a Room', 'Join a Room'], (choiceIdx) => {
                renderHeader();
                const action = choiceIdx === 0 ? 'Create' : 'Join';
                console.log(chalk.yellow(`Action: ${action} Room\n`));

                rl.question(chalk.cyan(`Enter Room Name to ${action}: `), (room) => {
                    roomName = room.trim() || 'general';

                    rl.question(chalk.cyan('Enter Secret Room Key: '), (key) => {
                        secretKey = getDerivedKey(key || 'default-secret');

                        const client = net.createConnection({ port: TARGET_PORT, host: HOST }, () => {
                            renderHeader();
                            console.log(chalk.green.bold(`[CONNECTED] Room: ${roomName}`));
                            console.log(chalk.gray('Messages are end-to-end encrypted.\n'));

                            client.write(JSON.stringify({ type: 'join', room: roomName }) + '\n');
                            rl.prompt();
                        });

                        client.setEncoding('utf8');

                        let incomingBuffer = '';
                        client.on('data', (data) => {
                            incomingBuffer += data;
                            let lines = incomingBuffer.split('\n');
                            incomingBuffer = lines.pop();

                            for (let line of lines) {
                                const message = line.trim();
                                if (!message) continue;

                                const decryptedMessage = decrypt(message, secretKey);
                                if (decryptedMessage) {
                                    readline.cursorTo(process.stdout, 0);
                                    readline.clearLine(process.stdout, 0);
                                    const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}] `);
                                    process.stdout.write(`${timestamp}${decryptedMessage}\n`);
                                    rl.prompt(true);
                                } else {
                                    readline.cursorTo(process.stdout, 0);
                                    readline.clearLine(process.stdout, 0);
                                    console.log(chalk.red('[SYSTEM] Received encrypted message but failed to decrypt. Check your Secret Key!'));
                                    rl.prompt(true);
                                }
                            }
                        });

                        client.on('end', () => {
                            console.log(chalk.red('\n[DISCONNECTED] Server connection closed.'));
                            process.exit();
                        });

                        client.on('error', (err) => {
                            readline.cursorTo(process.stdout, 0);
                            readline.clearLine(process.stdout, 0);
                            if (err.code === 'ECONNRESET') {
                                console.log(chalk.red('\n[LOST CONNECTION] The server was restarted or the connection was lost.'));
                            } else {
                                console.error(chalk.red(`\n[ERROR] ${err.message}`));
                            }
                            process.exit();
                        });

                        rl.on('line', (line) => {
                            const message = line.trim();
                            process.stdout.write('\x1B[1A\x1B[2K');

                            if (message.toLowerCase() === '/exit') {
                                client.end();
                                return;
                            }
                            if (message.toLowerCase() === '/cls') {
                                renderHeader();
                                console.log(chalk.green.bold(`[CONNECTED] Room: ${roomName}`));
                                rl.prompt();
                                return;
                            }
                            if (message) {
                                const formattedMessage = `${chalk.green.bold(username)}: ${message}`;
                                const encryptedMessage = encrypt(formattedMessage, secretKey);
                                client.write(JSON.stringify({ type: 'chat', message: encryptedMessage }) + '\n');
                            }
                            rl.prompt();
                        });
                    });
                });
            });
        });
    });
});
