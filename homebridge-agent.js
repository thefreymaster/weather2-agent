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

app.post("/api/temperature/add", (req, res) => {
  const { name } = req.body;
  console.log({ name });

  sendMessage({
    topic: "add",
    payload: { name, service: "TemperatureSensor" },
  });
  res.send("Temperature device created");
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

app.post("/api/humidity/add", (req, res) => {
  const { name } = req.body;

  sendMessage({
    topic: "add",
    payload: { name, service: "HumiditySensor" },
  });
  res.send("Humidity device created");
});

app.get("/api/status", () => ({
  status: "working",
  version: "0.0.1",
}));

app.get("/api", () => {
  return {
    "/temperature": {
      method: "POST",
      description: "Post the temperature data to a sensor",
      payload: {
        name: "name of sensor in Homebridge",
        value: "current temperature",
      },
      "/add": {
        method: "GET",
        description: "Add a new temperature sensor",
        payload: {
          name: "name of sensor in Homebridge",
        },
      },
    },
    "/humidity": {
      method: "POST",
      description: "Post the humidity data to a sensor",
      payload: {
        name: "name of sensor in Homebridge",
        value: "current humidity",
      },
      "/add": {
        method: "GET",
        description: "Add a new humidity sensor",
        payload: {
          name: "name of sensor in Homebridge",
        },
      },
    },
  };
});
