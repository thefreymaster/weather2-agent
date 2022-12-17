require("dotenv").config();
const express = require("express");
const app = express();
const port = 6800;
const os = require("os");
const networkInterfaces = os.networkInterfaces();
const WebSocket = require("ws");

const ws = new WebSocket(process.env.WEBSOCKET_SERVER_ADDRESS);

app.use(express.json());

const server = require("http").Server(app);

server.listen(port, () => {
  console.log(`Weather Agent running on ${networkInterfaces}:${port}`);
});

const sendMessage = (payload) => {
  ws.send(JSON.stringify(payload));
};

app.post("/api/temperature", (req, res) => {
  const { name, value } = req.body;
  console.log({ name, value });

  sendMessage({
    topic: "setValue",
    payload: {
      name,
      characteristic: "CurrentTemperature",
      value,
    },
  });
  res.send("Temperature set");
});

app.post("/api/humidity", (req, res) => {
    const { name, value } = req.body;
  
    sendMessage({
      topic: "setValue",
      payload: {
        name,
        characteristic: "CurrentHumidity",
        value,
      },
    });
    res.send("Working");
  });