const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const clients = new Map();

//gera aleatoriamente uma cor hexadecimal
function colorGenerator() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

wss.on('connection', (ws) => {
    console.log('Cliente conectado!');
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        console.log(data);
        
        if (data.type === 'register') {
            //gera uma cor aleatória para o nickname
            const color = colorGenerator();
            //armazena o nickname e a cor no mapa
            clients.set(ws, { nickname: data.nickname, color: color });
            console.log(`Nickname registrado: ${data.nickname}`);
            broadcast({
                text: `${data.nickname} entrou no chat.`,
                nickname: 'System',
                color: 'black'
            });
            return;
        }

        if (data.type === 'message') {
            const user = clients.get(ws) || { nickname: 'Anônimo', color: 'black' };
            //cria mensagem com o nickname e cor para todos os clientes
            const messageData = {
                text: data.text,
                nickname: user.nickname,
                color: user.color
            };
            console.log(`${user.nickname} enviou uma mensagem: ${data.text}`);
            broadcast(messageData);
        }
    });

    ws.on('close', () => {
        const user = clients.get(ws);
        if (user) {
            clients.delete(ws);
            console.log(`Cliente desconectado: ${user.nickname}`);
            broadcast({
                text: `${user.nickname} saiu do chat.`,
                nickname: 'System',
                color: 'black'
            });
        }
    });

    function broadcast(messageData) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
            }
        });
    }

    ws.on('error', (err) => {
        console.error('Erro no WebSocket:', err);
    });
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

server.listen(3000, () => {
  console.log('Servidor WebSocket rodando em http://localhost:3000');
});
