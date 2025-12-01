// server.js
// CST3144 Lesson Booking Backend (Node + Express + MongoDB)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'lesson-booking';

let db;
let lessonsCollection;
let ordersCollection;

// Basic check for MongoDB connection string
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing from .env');
  process.exit(1);
}

// ====== MIDDLEWARE ======
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files from /images if needed
app.use('/images', express.static(path.join(__dirname, 'images')));

// ====== BASIC / HEALTH ROUTES ======

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'CST3144 Lessons API is running' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    dbConnected: !!db
  });
});

// ====== LESSON ROUTES ======

// Return all lessons
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await lessonsCollection.find({}).toArray();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Update a lesson (e.g. spaces)
app.put('/lessons/:id', async (req, res) => {
  try {
    const lessonId = req.params.id;
    const updateData = req.body;

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

// ====== ORDER ROUTES ======

// View all orders (useful for debugging/demo)
app.get('/orders', async (req, res) => {
  try {
    const orders = await ordersCollection.find({}).toArray();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create a new order (called from Vue checkout)
app.post('/orders', async (req, res) => {
  try {
    const order = req.body;

    // Simple validation
    if (!order.name || !order.phone || !Array.isArray(order.lessons)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    order.createdAt = new Date();

    const result = await ordersCollection.insertOne(order);

    res.status(201).json({
      message: 'Order created',
      orderId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ====== STARTUP (CONNECT + LISTEN) ======

async function start() {
  try {
    console.log('Starting server...');
    console.log('Connecting to MongoDB...');

    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    db = client.db(DB_NAME);
    console.log('Connected to MongoDB database:', DB_NAME);

    lessonsCollection = db.collection('lessons');
    ordersCollection = db.collection('orders');

    app.listen(PORT, () => {
      console.log('Server listening on http://localhost:' + PORT);
    });
  } catch (error) {
    console.error('Failed to start server');
    console.error(error);
    process.exit(1);
  }
}

start();