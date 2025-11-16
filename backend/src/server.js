import os from "os";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import setupSocketHandlers from "./gameManager.js";   // ← đúng

function getLocalIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

const HOST = getLocalIP();
const PORT = 3000;

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

// API optional
app.get("/server-info", (req, res) => {
  res.json({ host: HOST, port: PORT });
});

// Kích hoạt Socket IO
setupSocketHandlers(io);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend chạy tại: http://${HOST}:${PORT}`);
});
