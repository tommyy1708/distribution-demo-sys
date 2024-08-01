// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from './mongodb.js';
import mysqlConnection from './mysql.js';


const app = express();

dotenv.config();

app.use(express.json());

const firebaseConfig = {
  apiKey: process.env.NODE_APP_APIKEY,
  authDomain: process.env.NODE_APP_AUTHDOMAIN,
  projectId: process.env.NODE_APP_PROJECTID,
  storageBucket: process.env.NODE_APP_STORAGEBUKET,
  messagingSenderId: process.env.NODE_APP_MESSAGESENDID,
  appId: process.env.NODE_APP_APPID,
  measurementId: process.env.NODE_APP_MESUREMENTID,
};

// Load service account credentials
const admin = initializeApp(firebaseConfig);

const PORT = process.env.NODE_APP_PORT || 3000;

// app.get('/', (req, res) => res.send('Express on Vercel'));
app.get('/mysql', (req, res) => {
  mysqlConnection.query(
    'SELECT * FROM users',
    (error, results, fields) => {
      if (error) {
        res.status(500).send('Error querying MySQL database');
        return;
      }
      res.send(results);
    }
  );
});


app.post('/api/user', async (req, res) => {
  try {
    console.log(req.body);
    const User = mongoose.model('Users');
    const newUser = await Users.create(req.body);
    console.log('User saved:', newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default app;
