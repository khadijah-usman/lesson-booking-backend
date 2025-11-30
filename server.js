// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;

// ====== MIDDLEWARE ======
app.use(cors());            // allow frontend (different port) to call this API
app.use(express.json());    // parse JSON bodies
app.use(morgan('dev'));     // log requests in the terminal

// ====== TEST ROUTE ======
app.get('/', (req, res) => {
  res.json({ message: 'CST3144 Lessons API is running 🎓' });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});