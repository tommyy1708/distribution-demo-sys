
import mysql from 'mysql';
import app from './index.js';
import dotenv from 'dotenv';

dotenv.config();


const connection = mysql.createConnection({
  host: process.env.NODE_APP_MYSQL_HOST,
  user: process.env.NODE_APP_MYSQL_USER,
  password: process.env.NODE_APP_MYSQL_PASSWORD,
  database: process.env.NODE_APP_MYSQL_DATABASE,
});

connection.connect((err) => {
  if (err) {
    console.error('An error occurred while connecting to the DB');
    throw err;
  }
  console.log('Connected to the MySQL server');
});

app.get('/', (req, res) => {
  connection.query('SELECT * FROM users', (err, rows) => {
    if (err) throw err;
    console.log('Data received from Db:');
    console.log(rows);
    res.send(rows);
  });
});