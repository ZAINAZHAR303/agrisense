const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Test server works!' });
});

const server = app.listen(5001, () => {
  console.log('Test server listening on port 5001');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

setTimeout(() => {
  console.log('Server still running after 10 seconds');
}, 10000);
