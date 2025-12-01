// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'lesson-booking';

let db;
let lessonsCollection;
let ordersCollection;

// ====== BASIC CHECKS ======
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing from .env');
  process.exit(1);
}

// ====== MIDDLEWARE ======
app.use(cors());            // allow frontend to call API
app.use(express.json());    // parse JSON bodies
app.use(morgan('dev'));     // log requests

// ====== TEST ROUTE ======
app.get('/', (req, res) => {
  res.json({ message: 'CST3144 Lessons API is running 🎓' });
});
// Simple health check route for debugging
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});
// ====== GET /lessons ======
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await lessonsCollection.find({}).toArray();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// ====== POST /orders ======
app.post('/orders', async (req, res) => {
  try {
    const { name, phone, email, lessons } = req.body;

    if (!name || !phone || !email || !Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderDoc = {
      name: String(name),
      phone: String(phone),
      email: String(email),
      lessons: lessons.map(l => ({
        lessonId: new ObjectId(l.lessonId),
        quantity: Number(l.quantity) || 0
      })),
      createdAt: new Date()
    };

    const result = await ordersCollection.insertOne(orderDoc);
    res.status(201).json({ message: 'Order created', orderId: result.insertedId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});
// ====== PUT /lessons/:id (update spaces or other fields) ======
app.put('/lessons/:id', async (req, res) => {
  try {
    const lessonId = req.params.id;
    const updateData = req.body; // e.g. { spaces: 3 }

    const result = await lessonsCollection.updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ message: 'Lesson updated' });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// ====== CONNECT TO MONGODB AND START SERVER ======
async function start() {
  try {
    console.log('Starting server.js...');
    console.log('MONGODB_URI:', MONGODB_URI ? 'present' : 'MISSING');
    console.log('Connecting to MongoDB (10s timeout)...');

    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000 // 10 seconds then throw error
    });

    console.log('✅ MongoClient.connect resolved');
    db = client.db(DB_NAME);
    console.log('✅ Connected to MongoDB Atlas, DB:', DB_NAME);

    lessonsCollection = db.collection('lessons');
    ordersCollection = db.collection('orders');

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server');
    console.error(error);
    process.exit(1);
  }
}

// IMPORTANT: actually start the server
start();