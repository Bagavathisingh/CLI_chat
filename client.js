#!/usr/bin/env node
const WebSocket = require('ws');
const readline = require('readline');
const chalk = require('chalk');
const crypto = require('crypto');
const os = require('os');
const pkg = require('./package.json');

const args = process.argv.slice(2);
let customServer = null;
let customUser = null;

if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.green.bold('Bugzx Secure Chat - CLI Tool'));
    console.log(`Version: ${pkg.version}\n`);
    console.log('Usage: bugzx-chat [options]\n');
    console.log('Options:');
    console.log('  -v, --version       Show version number');
    console.log('  -h, --help          Show this help message');
    console.log('  --server <url>      Set custom WebSocket server URL');
    console.log('  -u, --username <name> Set username immediately');
    console.log('\nExamples:');
    console.log('  bugzx-chat --server wss://my-chat.com');
    console.log('  bugzx-chat --username Alice');
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v') || args.includes('-version')) {
    console.log(pkg.version);
    process.exit(0);
}

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--server' && args[i + 1]) {
        customServer = args[i + 1];
    }
    if ((args[i] === '--username' || args[i] === '-u') && args[i + 1]) {
        customUser = args[i + 1];
    }
}

const PUBLIC_URL = customServer || 'wss://cli-chat-dsfi.onrender.com';
const LOCAL_URL = 'ws://localhost:3000';
const ALGORITHM = 'aes-128-cbc';

let username = '';
let roomName = '';
let secretKey = '';
let currentWs = null;

const ADJECTIVES = ['SWIFT', 'BRAVE', 'QUIET', 'HAPPY', 'LUCKY', 'SMART', 'NOBLE', 'RAPID', 'CALM', 'BOLD'];
const NOUNS = ['TIGER', 'EAGLE', 'WOLF', 'HAWK', 'BEAR', 'LION', 'FALCON', 'SHARK', 'DRAGON', 'PHOENIX'];

const generateRoomCode = (ip, port, room) => {
    const data = `${ip}:${port}:${room}`;
    const encoded = Buffer.from(data).toString('base64');
    const hash = crypto.createHash('md5').update(data).digest('hex').substring(0, 4).toUpperCase();
    const adj = ADJECTIVES[parseInt(hash.substring(0, 2), 16) % ADJECTIVES.length];
    const noun = NOUNS[parseInt(hash.substring(2, 4), 16) % NOUNS.length];
    return `${adj}-${noun}-${encoded}`;
};

const decodeRoomCode = (code) => {
    try {
        const parts = code.split('-');
        if (parts.length < 3) return null;
        const encoded = parts.slice(2).join('-');
        const decoded = Buffer.from(encoded, 'base64').toString('utf8');
        const [ip, port, room] = decoded.split(':');
        return { ip, port, room };
    } catch (e) {
        return null;
    }
};

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
};

const getDerivedKey = (secret) => {
    return crypto.createHash('md5').update(secret).digest();
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
 ██║     ██║     ██║   ██║     ██╔══██║██╔══██║   ██║   
 ╚██████╗███████╗██║   ╚██████╗██║  ██║██║  ██║   ██║   
  ╚═════╝╚══════╝╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
    `));
    console.log(chalk.green.bold('      WELCOME TO THE SECURE CLI CHAT BOX       '));
    console.log(chalk.yellow.bold('              Created by BUGZX                 \n'));
    if (username) console.log(chalk.cyan(`                 User: ${username}                 \n`));
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

const runMainApp = () => {

    showMenu(['Local Mode (localhost)', 'Public Mode (Online Server)', 'LAN / Hotspot Mode (WiFi Network)'], (modeIdx) => {

        if (modeIdx === 2) {
            const localIP = getLocalIP();
            renderHeader();
            console.log(chalk.yellow.bold('═══════════════════════════════════════════════'));
            console.log(chalk.cyan.bold('          LAN / HOTSPOT MODE SELECTED            '));
            console.log(chalk.yellow.bold('═══════════════════════════════════════════════\n'));
            console.log(chalk.white('Your Local IP: ') + chalk.green.bold(localIP));
            console.log(chalk.gray('\nMultiple users can join the same room!\n'));
            console.log(chalk.yellow('Options:'));
            console.log(chalk.white('  1. HOST  - Create a room & share code'));
            console.log(chalk.white('  2. JOIN  - Enter a room code to join\n'));

            showMenu(['Host Room (Generate Join Code)', 'Join Room (Enter Code)'], (hotspotChoice) => {
                if (hotspotChoice === 0) {
                    // HOST MODE
                    renderHeader();
                    console.log(chalk.green.bold('╔═══════════════════════════════════════════════╗'));
                    console.log(chalk.green.bold('║         CREATE A GROUP CHAT ROOM              ║'));
                    console.log(chalk.green.bold('╚═══════════════════════════════════════════════╝\n'));

                    rl.question(chalk.cyan('Enter Room Name: '), (room) => {
                        roomName = room.trim() || 'general';

                        rl.question(chalk.cyan('Enter Secret Key (for encryption): '), (key) => {
                            const rawKey = key || 'default-secret';
                            secretKey = getDerivedKey(rawKey);

                            const roomCode = generateRoomCode(localIP, '3000', roomName);

                            renderHeader();
                            console.log(chalk.green.bold('╔═══════════════════════════════════════════════╗'));
                            console.log(chalk.green.bold('║              ROOM CREATED!                    ║'));
                            console.log(chalk.green.bold('╚═══════════════════════════════════════════════╝\n'));

                            console.log(chalk.yellow.bold('Share this JOIN CODE with friends:\n'));
                            console.log(chalk.bgGreen.black.bold(`  ${roomCode}  `));
                            console.log(chalk.gray('\n(Friends also need the Secret Key to decrypt messages)\n'));
                            console.log(chalk.cyan('Starting server & connecting...\n'));

                            const { spawn } = require('child_process');
                            const serverPath = require('path').join(__dirname, 'server.js');
                            const serverProcess = spawn('node', [serverPath], {
                                detached: true,
                                stdio: 'ignore'
                            });
                            serverProcess.unref();

                            setTimeout(() => {

                                connectToRoom(LOCAL_URL, 'LAN Host', { code: roomCode, key: rawKey });
                            }, 1500);
                        });
                    });

                } else {
                    renderHeader();
                    console.log(chalk.cyan.bold('╔═══════════════════════════════════════════════╗'));
                    console.log(chalk.cyan.bold('║              JOIN A GROUP CHAT                ║'));
                    console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════╝\n'));

                    console.log(chalk.gray('Tip: Ask the host for the Join Code (e.g., SWIFT-TIGER-xxx)'));

                    rl.question(chalk.cyan('Enter JOIN CODE: '), (code) => {
                        const connectionInfo = decodeRoomCode(code.trim());

                        if (!connectionInfo) {
                            console.log(chalk.red('\n[ERROR] Invalid room code! Please check and try again.'));
                            process.exit();
                            return;
                        }

                        roomName = connectionInfo.room;
                        const targetUrl = `ws://${connectionInfo.ip}:${connectionInfo.port}`;

                        console.log(chalk.gray(`\nConnecting to: ${connectionInfo.ip}:${connectionInfo.port}`));
                        console.log(chalk.gray(`Room: ${roomName}\n`));

                        rl.question(chalk.cyan('Enter Secret Key (same as host): '), (key) => {
                            secretKey = getDerivedKey(key || 'default-secret');
                            connectToRoom(targetUrl, 'LAN Guest');
                        });
                    });
                }
            });
        } else {
            // Local or Public Mode
            const targetUrl = modeIdx === 0 ? LOCAL_URL : PUBLIC_URL;
            const modeName = modeIdx === 0 ? 'Local' : 'Public';

            showMenu(['Create a Room', 'Join a Room'], (choiceIdx) => {
                renderHeader();
                const action = choiceIdx === 0 ? 'Create' : 'Join';
                console.log(chalk.yellow(`Mode: ${modeName} | Action: ${action} Room\n`));

                rl.question(chalk.cyan(`Enter Room Name to ${action}: `), (room) => {
                    roomName = room.trim() || 'general';

                    rl.question(chalk.cyan('Enter Secret Room Key: '), (key) => {
                        const rawKey = key || 'default-secret';
                        secretKey = getDerivedKey(rawKey);
                        connectToRoom(targetUrl, modeName);
                    });
                });
            });
        }
    });
};

if (customUser) {
    username = customUser;
    runMainApp();
} else {
    rl.question(chalk.cyan('Enter your username: '), (user) => {
        username = user.trim() || 'Anonymous';
        runMainApp();
    });
}

function connectToRoom(targetUrl, modeName, hostDetails = null) {
    currentWs = new WebSocket(targetUrl);
    let chatHistory = [];
    let showHostPanel = false;

    const drawUI = () => {

        console.clear();
        renderHeader();

        console.log(chalk.green.bold(`[CONNECTED] Room: ${roomName} (${modeName})`));
        console.log(chalk.gray('Messages are end-to-end encrypted.\n'));


        if (hostDetails && showHostPanel) {
            console.log(chalk.cyan.bold('┌──────────────── HOST PANEL ────────────────┐'));
            console.log(chalk.cyan.bold('│') + chalk.white(` Join Code : ${chalk.bold(hostDetails.code.padEnd(28))} `) + chalk.cyan.bold('│'));
            console.log(chalk.cyan.bold('│') + chalk.white(` Secret Key: ${chalk.bold(hostDetails.key.padEnd(28))} `) + chalk.cyan.bold('│'));
            console.log(chalk.cyan.bold('└────────────────────────────────────────────┘'));
            console.log(chalk.gray(' (Type /info to hide this panel)\n'));
        } else if (hostDetails) {
            console.log(chalk.gray(' [Type /info to view Room Code & Key] \n'));
        }

        const maxHistory = 50;
        const visibleHistory = chatHistory.slice(-maxHistory);

        visibleHistory.forEach(msg => {
            process.stdout.write(msg + '\n');
        });

        rl.prompt(true);
    };

    const logMessage = (msg) => {
        chatHistory.push(msg);
        drawUI();
    };

    currentWs.on('open', () => {
        drawUI();
        currentWs.send(JSON.stringify({ type: 'join', room: roomName }));
    });

    currentWs.on('message', (data) => {
        try {
            const payload = JSON.parse(data);
            if (payload.type === 'chat') {
                const decryptedMessage = decrypt(payload.message, secretKey);
                if (decryptedMessage) {
                    const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}] `);

                    const prefix = `${username}:`;
                    let displayMsg = decryptedMessage;

                    if (decryptedMessage.startsWith(prefix)) {
                        displayMsg = decryptedMessage.replace(prefix, chalk.green.bold('You:'));
                    } else {
                    }

                    logMessage(`${timestamp}${displayMsg}`);
                } else {
                    logMessage(chalk.red.italic(`[SYSTEM] Decryption Failed: Incorrect Secret Key`));
                }
            } else if (payload.type === 'system') {
                logMessage(chalk.yellow(`[SYSTEM] ${payload.message}`));
            } else if (payload.type === 'userCount') {
                logMessage(chalk.cyan(`[ROOM] ${payload.count} user(s) online`));
            }
        } catch (e) { }
    });

    currentWs.on('close', () => {
        console.log(chalk.red('\n[DISCONNECTED] Server connection closed.'));
        process.exit();
    });

    currentWs.on('error', (err) => {
        console.error(chalk.red(`\n[CONNECTION ERROR] ${err.message}`));
        process.exit();
    });

    rl.on('line', (line) => {
        const message = line.trim();

        if (message.toLowerCase() === '/exit') {
            currentWs.close();
            return;
        }
        if (message.toLowerCase() === '/cls') {
            chatHistory = [];
            drawUI();
            return;
        }
        if (message.toLowerCase() === '/info' && hostDetails) {
            showHostPanel = !showHostPanel;
            drawUI();
            return;
        }
        if (message.toLowerCase() === '/users') {
            currentWs.send(JSON.stringify({ type: 'getUserCount' }));
            return;
        }

        if (message && currentWs.readyState === WebSocket.OPEN) {
            const formattedMessage = `${chalk.green.bold(username)}: ${message}`;
            const encryptedMessage = encrypt(formattedMessage, secretKey);

            // Send to server
            currentWs.send(JSON.stringify({ type: 'chat', message: encryptedMessage }));

            // Log locally (Echo)
            const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}] `);
            const myDisplayMsg = `${chalk.green.bold('You')}: ${message}`;
            logMessage(`${timestamp}${myDisplayMsg}`);
        } else {
            // refresh ui if empty line
            drawUI();
        }
    });
}
