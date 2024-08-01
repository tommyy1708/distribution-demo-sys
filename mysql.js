
import mysql from 'mysql';
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


export default connection;