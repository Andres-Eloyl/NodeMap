const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use("/shared", express.static(path.join(__dirname, "../shared")));
app.use("/client", express.static(path.join(__dirname, "../client")));
app.use(express.static(path.join(__dirname)));

const peers = new Map();

io.on("connection", (socket) => {
  const nombre = socket.handshake.query.nombre || "Anonimo";
  const id = socket.id;

  const peerList = [];
  for (const [pid, p] of peers) {
    peerList.push({ id: pid, nombre: p.nombre });
  }
  socket.emit("peer-list", { peers: peerList });

  peers.set(id, { id, socket, nombre });

  socket.broadcast.emit("peer-join", { id, nombre });
  console.log(`+ ${nombre} (${id}) | total: ${peers.size}`);

  socket.on("offer", (data) => {
    const dest = peers.get(data.destino);
    if (dest) dest.socket.emit("offer", { ...data, origen: id });
  });

  socket.on("answer", (data) => {
    const dest = peers.get(data.destino);
    if (dest) dest.socket.emit("answer", { ...data, origen: id });
  });

  socket.on("ice-candidate", (data) => {
    const dest = peers.get(data.destino);
    if (dest) dest.socket.emit("ice-candidate", { ...data, origen: id });
  });

  socket.on("peer-exit", () => {
    peers.delete(id);
    socket.broadcast.emit("peer-exit", { id, nombre });
    console.log(`x ${nombre} salio | total: ${peers.size}`);
    socket.disconnect(true);
  });

  socket.on("disconnect", () => {
    if (!peers.has(id)) return;
    peers.delete(id);
    socket.broadcast.emit("peer-leave", { id });
    console.log(`- ${nombre} desconectado | total: ${peers.size}`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Test server en http://localhost:${PORT}`);
});
