const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost', 'https://turbokarts.freeddns.org'] }
});

app.get('/health', (req, res) => res.json({ ok: true }));

io.on('connection', socket => {
  io.emit('online', io.engine.clientsCount);

  socket.on('chat', data => {
    const name = String(data?.name || 'Anonyme').slice(0, 20);
    const text = String(data?.text || '').slice(0, 200);
    if (text.trim()) io.emit('chat', { name, text });
  });

  socket.on('disconnect', () => io.emit('online', io.engine.clientsCount));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Serveur Node sur le port ' + PORT));