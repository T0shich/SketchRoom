import express from 'express';
import cors from 'cors';
import {Server} from 'socket.io'
import {createServer} from 'http'
import { Socket } from 'dgram';

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

io.on('connection', (socket) =>{
  console.log('Подключился' , socket.id);

  socket.on('disconnect' , () =>{
      console.log('Отключился', socket.id)
  })
  
})


httpServer.listen(PORT,() =>{
 console.log(`Сервер на порту ${PORT}`)})