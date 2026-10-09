# NestJS + Socket.IO Chat Backend

A small real-time public-chat backend built with NestJS, its WebSocket gateway abstraction, and Socket.IO. The implementation keeps chat events in a gateway, validates untrusted payloads, and exposes origin configuration for local or deployed clients.

## Features

- Socket.IO events for joining, welcome messages, chat messages, presence, join/leave notices, and typing indicators.
- Server-side validation for display names and message text.
- Unique message IDs per published message.
- A client must join before it can publish messages or typing status.
- Duplicate join requests for the same socket and display name do not produce duplicate presence announcements.
- CORS allow-list and port can be configured with environment variables.

## Requirements

- Node.js 20 or later
- npm

## Run locally

```bash
npm ci
npm run start:dev
```

The service listens on port `5000` by default. Set `PORT` to use another port.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | HTTP and Socket.IO listener port |
| `CHAT_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated list of browser origins |

Example:

```bash
CHAT_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 npm run start:dev
```

Only configure trusted origins in a deployed environment. CORS is not authentication; this sample does not implement identity, authorization, persistence, or rate limiting.

## Event contract

| Direction | Event | Payload |
| --- | --- | --- |
| Client → server | `user-join` | `string username` |
| Client → server | `send-message` | `{ message: string }` |
| Client → server | `typing-start` | no payload |
| Client → server | `typing-stop` | no payload |
| Server → client | `welcome` | `{ message, users: string[] }` |
| Server → client | `user-joined` | `{ username, message, time }` |
| Server → client | `user-left` | `{ username, message, time }` |
| Server → client | `new-message` | `{ username, message, time, id }` |
| Server → client | `online-users` | `string[]` |
| Server → client | `user-typing` | `{ username, isTyping }` |
| Server → client | `chat-error` | `{ code, message }` |

Display names are trimmed and limited to 32 characters; messages are trimmed and limited to 2,000 characters. Empty strings, control characters, non-string values, and messages sent before joining are rejected with `chat-error`.

## Example client

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");
socket.emit("user-join", "Ada");
socket.on("welcome", console.log);
socket.emit("send-message", { message: "Hello from Socket.IO" });
socket.on("new-message", console.log);
socket.on("chat-error", console.error);
```

## Validation

```bash
npm run build
npm test
```

The current automated tests cover validation boundaries. GitHub Actions compiles the NestJS application and runs those tests on pushes and pull requests.

## Limitations

Presence is held in process memory and is lost on restart. Multiple instances do not share presence; configure a compatible Socket.IO adapter before horizontal scaling. This project is a portfolio sample, not a secured production messaging service.
