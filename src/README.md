# Socket.IO NestJS Public Chatroom

A real-time chatroom backend built with NestJS and Socket.IO.

## Installation

```bash
npm install



Running the server

npm run start:dev


WebSocket Events
Client → Server
Event	Payload
user-join	username: string
send-message	{ message: string }
typing-start	(empty)
typing-stop	(empty)
Server → Client
Event	Payload
welcome	{ message, users: [] }
user-joined	{ username, message, time }
user-left	{ username, message, time }
new-message	{ username, message, time, id }
user-typing	{ username, isTyping }
online-users	[username1, username2]


