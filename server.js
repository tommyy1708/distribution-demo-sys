import mysql from 'mysql2';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();


// MySQL connection setup
const db = mysql
  .createPool({
    host: process.env.NODE_APP_MYSQL_HOST,
    port: process.env.NODE_APP_MYSQL_PORT,
    database: process.env.NODE_APP_MYSQL_DATABASE,
    user: process.env.NODE_APP_MYSQL_USER,
    password: process.env.NODE_APP_MYSQL_PASSWORD,
  })
  .promise();

async function getUsers() {
  const resUsers = await db.query(`SELECT * FROM user_data`);
  return resUsers[0];

  }

  async function getSupplierUsers(email) {
    const rows = await db.query(
      `
  SELECT id, admin,first_name, last_name, passWord, phone,address,email, shipping_address, mobile_number
  FROM user_data
  WHERE email=?
  `,
      [email]
    );
    //return Object {}
    return rows[0][0];
  }


async function checkSupplierPause(userEmail) {
  const response = await db.query(
    `SELECT pause FROM user_data WHERE email=?`,
    [userEmail]
  );
  if (response && response.length > 0) {
    return response[0];
  } else {
    return false;
  }
}

async function updateTokenHairSupplier(token, email) {
  let sql = `UPDATE user_data SET token="${token}" WHERE email="${email}"`;
  let getUserInfo = `SELECT * FROM user_data WHERE email="${email}"`;
  await db.query(sql);
  let aUserInfo = await db.query(getUserInfo);

  //return the object{} of user info after login
  return aUserInfo[0][0];
}


export {
  getSupplierUsers,
  checkSupplierPause,
  getUsers,
  updateTokenHairSupplier,
};