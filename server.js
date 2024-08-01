const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room ${roomId}`);

        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        rooms[roomId].push(socket.id);

        socket.on('offer', (offer) => {
            socket.to(roomId).emit('offer', offer);
        });

        socket.on('answer', (answer) => {
            socket.to(roomId).emit('answer', answer);
        });

        socket.on('ice-candidate', (candidate) => {
            socket.to(roomId).emit('ice-candidate', candidate);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
            rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            }
        });
    });
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
