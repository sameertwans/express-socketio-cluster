const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const redis = require('redis');
const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;

// PostgreSQL setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Redis setup
const redisClient = redis.createClient();

// if (cluster.isMaster) {
//   console.log(`Master ${process.pid} is running`);

//   // Fork workers
//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     cluster.fork(); // Replace the dead worker
//   });
// } else {
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store data in PostgreSQL
const storeLocation = async (data) => {
  const server_datetime = new Date().toISOString();
  const query = 'INSERT INTO locations(device_id, latitude, longitude, server_datetime) VALUES($1, $2, $3, $4)';
  const values = [data.device_id, data.lat, data.lng, server_datetime];

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error('Error storing location data', err);
  }
};

// Function to calculate distance between two points using Haversine formula
const calculateDistance = async (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('locationUpdate', async (data) => {
    // console.log('Received locationUpdate:', data);
    
    // Specific point (center of Kathmandu as an example)
    const centerLat = 27.68534594572206;
    const centerLon = 85.34885581000817

    // Calculate distance from the specific point
    const distance = await calculateDistance(centerLat, centerLon, data.lat, data.lng);
    if (distance <= 5) {
      // If within 5km, store the location and emit
      await storeLocation(data);
      io.emit('locations', data);
    } else {
      console.log(`Location outside 5km radius. Distance: ${distance.toFixed(2)} km`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Reconnection attempt #${attemptNumber}`);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected to server after ${attemptNumber} attempts`);
  });

  socket.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error);
  });

  socket.on('reconnect_failed', () => {
    console.error('Reconnection failed');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Worker ${process.pid} started, Server is running on port ${PORT}`);
});
// }
