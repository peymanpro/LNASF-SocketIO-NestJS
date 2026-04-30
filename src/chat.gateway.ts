import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  io: Server;

  private users = new Map();

  handleConnection(socket: Socket) {
    console.log(`New user connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    const user = this.users.get(socket.id);
    if (user) {
      this.io.emit('user-left', {
        username: user.username,
        message: `${user.username} left the chat`,
        time: new Date().toLocaleTimeString('fa-IR')
      });
      this.users.delete(socket.id);
      this.sendOnlineUsers();
    }
  }

  @SubscribeMessage('user-join')
  handleUserJoin(@ConnectedSocket() socket: Socket, @MessageBody() username: string) {
    this.users.set(socket.id, {
      username: username,
      joinedAt: new Date()
    });

    socket.broadcast.emit('user-joined', {
      username: username,
      message: `${username} joined the chat`,
      time: new Date()
    });

    this.sendOnlineUsers();
    
    socket.emit('welcome', {
      message: `Welcome to the chatroom ${username}!`,
      users: Array.from(this.users.values()).map(u => u.username)
    });
  }

  @SubscribeMessage('send-message')
  handleSendMessage(@ConnectedSocket() socket: Socket, @MessageBody() data: { message: string }) {
    const user = this.users.get(socket.id);
    if (user) {
      this.io.emit('new-message', {
        username: user.username,
        message: data.message,
        time: new Date(),
        id: socket.id
      });
    }
  }

  @SubscribeMessage('typing-start')
  handleTypingStart(@ConnectedSocket() socket: Socket) {
    const user = this.users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', {
        username: user.username,
        isTyping: true
      });
    }
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(@ConnectedSocket() socket: Socket) {
    const user = this.users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', {
        username: user.username,
        isTyping: false
      });
    }
  }

  private sendOnlineUsers() {
    const onlineUsers = Array.from(this.users.values()).map(u => u.username);
    this.io.emit('online-users', onlineUsers);
  }
}