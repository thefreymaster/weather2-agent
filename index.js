const express = require("express");
const app = express();
const port = 6800;
const imu = require("node-sense-hat").Imu;
const IMU = new imu.IMU();
const matrix = require("node-sense-hat").Leds;

const { initializeApp } = require("firebase-admin/app");
const admin = require("firebase-admin");
const config = require("./config.json");

initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: config?.db_url,
});

const { getDatabase } = require("firebase-admin/database");
const db = getDatabase();
const dbRef = db.ref(`/${config?.room_id}`);

matrix.clear();

app.use(express.json());

const server = require("http").Server(app);

const setNewData = (temperature, humidity, pressure) => {
  const now = new Date();
  db.ref(`/${config?.room_id}/temperature`).push({
    x: now.toISOString(),
    y: temperature,
  });
  db.ref(`/${config?.room_id}/humidity`).push({
    x: now.toISOString(),
    y: humidity,
  });
  db.ref(`/${config?.room_id}/pressure`).push({
    x: now.toISOString(),
    y: pressure,
  });
};

const convertToF = (celsius) => {
  return celsius * (9 / 5) + 32;
};

const getNewWeatherData = () => {
  IMU.getValue((err, data) => {
    if (err !== null) {
      console.error("Could not read sensor data: ", err);
      return;
    }
    setNewData(convertToF(data?.temperature), data.humidity, data.pressure);
  });
};

const run = () => {
  setTimeout(() => {
    getNewWeatherData();
    run();
  }, 300000);
};

server.listen(port, () => {
  if (!config?.room_id) {
    return console.error(
      "Error! room_id is undefined in config.json.  Add a new key to the config.json named 'room_id', and restart the server."
    );
  }
  console.log("Weather Station running on :6700");
  getNewWeatherData();

  return run();
});
