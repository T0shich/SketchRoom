import express from 'express';
import cors from 'cors';
import {Server} from 'socket.io'
import {createServer} from 'http'

const app = express();
const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
})

// Хранение активных комнат
const rooms = new Map<string, { users: Set<string>, createdAt: Date }>();

// REST API для комнат
app.post('/rooms', (req, res) => {
  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ error: 'Необходим ключ комнаты' });
  }
  
  if (rooms.has(key)) {
    return res.status(409).json({ error: 'Комната уже существует' });
  }
  
  rooms.set(key, { users: new Set(), createdAt: new Date() });
  console.log(`Комната ${key} создана через REST API`);
  
  res.status(201).json({ 
    success: true, 
    roomKey: key,
    message: 'Комната создана' 
  });
});

app.get('/rooms/:key', (req, res) => {
  const { key } = req.params;
  
  if (!rooms.has(key)) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  
  const room = rooms.get(key);
  res.json({ 
    success: true,
    roomKey: key,
    usersCount: room?.users.size || 0,
    exists: true
  });
});

app.get('/rooms', (req, res) => {
  const roomsList = Array.from(rooms.entries()).map(([key, data]) => ({
    roomKey: key,
    usersCount: data.users.size,
    createdAt: data.createdAt
  }));
  
  res.json({ rooms: roomsList });
});

io.on('connection', (socket) =>{
  console.log('Подключился' , socket.id);

  // Присоединение к комнате через Socket.IO
  socket.on('joinRoom', (data: { roomKey: string }) => {
    const { roomKey } = data;
    if (rooms.has(roomKey)) {
      const room = rooms.get(roomKey);
      room?.users.add(socket.id);
      socket.join(roomKey);
      
      io.to(roomKey).emit('userJoined', {
        roomKey,
        userId: socket.id,
        usersCount: room?.users.size || 0
      });
      
      console.log(`Пользователь ${socket.id} присоединился к комнате ${roomKey}`);
    } else {
      socket.emit('roomError', { message: 'Комната не найдена' });
      console.log(`Комната ${roomKey} не существует`);
    }
  });

  // Рисование внутри комнаты
  socket.on('startDrawing', data => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('startDrawing', data);
    }
  });

  socket.on('drawing', data => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('drawing', data);
    }
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log('Отключился', socket.id);
    
    // Удаление пользователя из всех комнат
    rooms.forEach((roomData, roomKey) => {
      if (roomData.users.has(socket.id)) {
        roomData.users.delete(socket.id);
        io.to(roomKey).emit('userLeft', {
          userId: socket.id,
          usersCount: roomData.users.size
        });
        
        // Удаление пустой комнаты
        if (roomData.users.size === 0) {
          rooms.delete(roomKey);
          console.log(`Комната ${roomKey} удалена (пустая)`);
        }
      }
    });
  });
})

httpServer.listen(PORT,() =>{
 console.log(`Сервер на порту ${PORT}`)})