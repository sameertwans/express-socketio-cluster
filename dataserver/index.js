const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// Function to generate random latitude and longitude
function generateRandomCoordinates() {

    const minLat = 27.65, maxLat = 27.75;
    const minLon = 85.25, maxLon = 85.35;

    const latitude = Math.random() * (maxLat - minLat) + minLat;
    const longitude = Math.random() * (maxLon - minLon) + minLon;

    return { latitude, longitude };
}

// Function to generate random device ID
function generateRandomDeviceId() {
    const devices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const randomIndex = Math.floor(Math.random() * devices.length);
    return devices[randomIndex];
}

// Function to send random data to SocketIO server
function sendDataOverSocketIO() {
  console.log('Emit location ');
  const devices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  devices.forEach(deviceId => {
      const { latitude, longitude } = generateRandomCoordinates();
      const data = { lat: latitude, lng: longitude, device_id: deviceId };
      // console.log('Emitting locationUpdate:', data);
      socket.emit('locationUpdate', data);
  });
}

setInterval(() => {
  sendDataOverSocketIO();
}, 10000);