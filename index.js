const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['Mula Bot', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('ESCANEIA O QR CODE ABAIXO:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Desconectado, reconectando...', shouldReconnect);
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('MULA BOT CONECTADO COM SUCESSO!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    console.log('Mensagem:', text);
    if (text.toLowerCase() === '!ping') {
      await sock.sendMessage(from, { text: 'Pong! Mula Bot online ✅' });
    }
    if (text.toLowerCase() === '!menu') {
      await sock.sendMessage(from, { text: '🤖 MULA BOT\n\n!ping - testar bot\n!menu - ver menu' });
    }
  });
}

start();
