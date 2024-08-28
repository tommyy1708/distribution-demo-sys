import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import cors from 'cors';
import {
  getSupplierProducts,
  getSupplierUsers,
  checkSupplierPause,
  updateTokenHairSupplier,
  getQuotesData,
  getOrderBetweenDate,
  getTotalCost,
  addingNewToInventory,
  getCategory,
  supplierVerifyJwt,
  getSupplierCategoryList,
  supplierGetUserInfo,
  addToSupplierOrder,
  getSupplierOrderList,
  getSupplierUserInfo,
  getSupplierOrderByDate,
  postUser,
  postProduct,
  getProduct,
  getSupplierAnnouncement,
  updateSupplierAnnouncement,
  DeleteSupplierAnnouncement,
  getSupplierUserList,
  deleteProduct,
  deleteCustomer,
  deleteCategory,
  postCategory,
  postBanner,
  adminChange,
  pauseChange,
  GetUserInfoById,
  updateSupplierOrderStatus,
  getBanner,
  updateCSV,
  checkDatabase,
  putProductUpdate,
  postSendNewMessage,
  getMessagesForUser,
  updateMessageStatus,
  postSelectMessages,
  deleteSelectedMessages,
  getCategoryDetail,
} from './server.js';
import bcrypt from "bcrypt";

dotenv.config();
const app = express();

app.use(cors());

app.use(express.json());


const verificationTokens = async function (req, res, next) {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({
      errCode: 1,
      message: 'No token provided',
    });
  }

  // Step 2: Validate the format of the Authorization header
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(400).json({
      errCode: 1,
      message:
        'Invalid token format. Expected format: Bearer <token>',
    });
  }

  // Step 3: Extract the token
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(400).json({
      errCode: 1,
      message: 'Token is missing',
    });
  }

  try {

    // Step 4: Verify the token using jwt.verify
    const decodeToken = jwt.verify(token, process.env.SECRET);
    next();

  } catch (error) {
    // Step 5: Handle errors related to token verification
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        errCode: 1,
        message: 'Token has expired',
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        errCode: 1,
        message: 'Invalid token',
      });
    } else {
      // Catch any other errors
      return res.status(500).json({
        errCode: 1,
        message: 'An error occurred while validating the token',
      });
    }
  }
};


app.post('/api/supplier-login', async (req, res) => {
  const { email, password } = req.body;

  const aAccountInfo = await getSupplierUsers(email);

  if (!aAccountInfo) {
    return res.send({
      errCode: 1,
      message: 'User not exists',
    });
  }

  const isPause = await checkSupplierPause(email);


  if ( isPause[0].pause && isPause[0].pause === 1) {
    return res.send({
      errCode: 2,
      message: 'Account is paused. Please contact support.',
    });
  }

  const sPassWord = aAccountInfo.passWord.toString();

    const isPasswordValid = await bcrypt.compare(password, sPassWord);


  if (isPasswordValid) {
    let token = jwt.sign(aAccountInfo, `${process.env.SECRET}`, {
      expiresIn: '24h',
    });

    //update token to account and return newest account info
    const updateLoginInfo = await updateTokenHairSupplier(
      token,
      email
    );

    if (!updateLoginInfo) {
      res.send({
        errCode: 1,
        message: 'Database error',
      });
    } else {
      res.send({
        errCode: 0,
        message: 'Success',
        userToken: updateLoginInfo.token.toString(),
      });
    }
  } else {
    res.send({
      errCode: 1,
      message: 'Wrong Password',
    });
  }
});

app.use('/assets/images', express.static('assets/images'));
// Function checkRole is part of role-based access control(RBAC)
const checkRole = (requiredRole) => (req, res, next) => {
  const userRoles = req.user.roles;
  if (userRoles.includes(requiredRole)) {
    next();
  } else {
    res.status(403).json({ message: 'Permission denied' });
  }
};

// Start Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assets/images'); // Set the destination folder for image uploads
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename); // Keep the original filename
  },
});

const upload = multer({ storage: storage });


app.post(
  `/api/upload-csv`,
  upload.single('file'),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      res.json({
        url: file.path,
        message: 'File uploaded',
      });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);


app.post(`/api/update-csv`, async (req, res) => {
  const url = req.body.fileUrl;
  const data = [];
  fs.createReadStream(url, { encoding: 'utf-8' })
    .pipe(
      csvParser({
        skipLines: 1,
        headers: [
          'item_code',
          'item',
          'stock',
          'price',
          'cost',
          'category',
        ],
      })
    )
    .on('data', (row) => {
      // Check for empty fields in each row
      Object.entries(row).forEach(([key, value]) => {
        if (!value || value.trim() === '') {
          console.log(`Empty value found in column '${key}'`);
        }
      });
      data.push(row);
    })
    .on('end', async () => {
      const response = await updateCSV(data);

      if (!response) {
        return res.send({
          errCode: 1,
          message: `update database failed`,
        });
      } else {
        cleanCache('category:*');
        // Respond with success message
        return res.json({
          errCode: 0,
          message: `update database success`,
        });
      }
    });
});

// hair-supplier upload API endpoint for image upload
app.post('/api/images', upload.single('file'), (req, res) => {
  try {
    // Assuming you want to return the uploaded image URL
    const imageUrl = `http://${ServerAddress}:${ServerPort}/public/assets/images/${req.file.filename}`;
    // const imageUrl = `https://orca-app-gcc6n.ondigitalocean.app/assets/images/${req.file.filename}`;
    const imageName = req.file.filename;
    const ogName = req.file.originalname;

    res.send({
      errCode: 0,
      message: 'Upload Success',
      data: {
        url: imageUrl,
        name: imageName,
        originName: ogName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

app.put(`/api/supplier-admin-change`, async (req, res) => {
  if (!req.header('Authorization')) {
    return 'token wrong';
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const params = req.body;
    const response = await adminChange(params);

    try {
      if (response) {
        res.send({
          errCode: 0,
          message: 'Change Success',
        });
      }
    } catch (error) {
      res.send({
        errCode: 1,
        message: error,
      });
    }
  }
});

app.put(`/api/supplier-pause-change`, async (req, res) => {
  if (!req.header('Authorization')) {
    return 'token wrong';
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const params = req.body;
    const response = await pauseChange(params);

    try {
      if (response) {
        res.send({
          errCode: 0,
          message: 'Change Success',
        });
      }
    } catch (error) {
      res.send({
        errCode: 1,
        message: error,
      });
    }
  }
});

//get total cost
app.get('/api/total-cost', async (req, res) => {
  try {
    let totalCost = await getTotalCost();
    res.send({
      errCode: 0,
      data: totalCost[0],
      message: 'Success',
    });
  } catch (error) {
    res.send({
      errCode: 1,
      message: error,
    });
  }
});
app.post('/api/add-new-product', async (req, res) => {
  const data = req.body;

  const response = await addingNewToInventory(data);

  let result = JSON.stringify(response);

  res.send({
    errCode: 0,
    message: 'Add new product Success',
  });
});

app.get('/api/get-reports', async (req, res) => {
  const params = req.query;
  const begin = params.begin;
  const end = params.end;
  const a_o_response = await getOrderBetweenDate(begin, end);
  if (a_o_response) {
    res.send({
      errCode: 0,
      message: 'Inquire Success',
      data: a_o_response,
    });
  } else {
    res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  }
});

app.get('/api/quote_history', async (req, res) => {
  const aQuotesData = await getQuotesData();
  if (!aQuotesData) {
    res.send({
      errCode: 1,
      message: 'Database wrong',
    });
  } else {
    res.send({
      errCode: 0,
      aQuotesData,
    });
  }
});



app.get('/api/supplier-category',verificationTokens, async (req, res) => {
  // if (!req.header('Authorization')) {
  //   return;
  // }
  // const token = req.header('Authorization').slice(7);
  // const check = await supplierVerifyJwt(token);
  // if (!check) {
  //   res.send({
  //     errCode: 1,
  //     message: 'Something wrong',
  //   });
  // } else {

    const category = await getCategory();

    res.send({
      errCode: 0,
      message: 'Success',
      data: category,
    });
  // }
});

app.get('/api/supplier-category/:id', async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const category = req.params.id;
    const aCategoryList = await getSupplierCategoryList(category);
    const categoryData = await getCategoryDetail(category);

    if (!aCategoryList) {
      res.send({
        errCode: 1,
        message: 'server wrong',
      });
    } else {
      // let cacheData = {
      //   errCode: 0,
      //   message: 'Success',
      //   data: aCategoryList,
      // };

      // redis.setex(
      //   `categoryList:${category}`,
      //   3600,
      //   JSON.stringify(cacheData)
      // );
      // res.send(cacheData);
      res.send({
        errCode: 0,
        message: 'Success',
        data: aCategoryList,
        categoryData: categoryData,
      });
    }
  }
});


app.put('/api/passwordUpdate', async (req, res) => {
  const params = req.body;
  const userInfo = await supplierGetUserInfo(params);
  if (!userInfo) {
    res.send({
      errCode: 1,
      message: 'server wrong',
    });
  } else {
    res.send({
      data: 'Success',
      errCode: 0,
      message: 'Success',
    });
  }
});

app.post(`/api/supplier-addNewOrder`, async (req, res) => {
  //verify token
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const category = req.params.id;
  }

  //processing order
  const { cartData, userId } = req.body;

  const result = await addToSupplierOrder(
    JSON.parse(cartData),
    userId
  );

  if (!result) {
    res.status(500).send({
      errCode: 1,
      message: 'Database error',
    });
  } else {
    res.status(200).send({
      errCode: 0,
      message: 'Order placed successfully',
    });
  }
});


app.get(`/api/supplier-orders`, async (req, res) => {
  console.log('supplier-orders called');
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const aOrderList = await getSupplierOrderList();
    if (!aOrderList) {
      return res.send({
        errCode: 1,
        message: 'Error from server',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Success',
        data: JSON.stringify(aOrderList),
      });
    }
  }
});

app.get(`/api/supplier-user`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const id = req.query.userId;
    const response = await getSupplierUserInfo(id);
    let userInfo = {
      email: response[0].email,
      address: response[0].address,
      passWord: response[0].passWord,
      phone: response[0].phone,
      shipping_address: response[0].shipping_address,
      mobile_number: response[0].mobile_number,
    };
    return res.send({
      errCode: 0,
      message: 'Success',
      data: userInfo,
    });
  }
});

app.post(`/api/supplier-user`,verificationTokens, async (req, res) => {
  const { params } = req.body;

    const response = await postUser(params);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'Add new failed',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Customer added successfully!',
      });
    }
});

app.post(`/api/supplier-product`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { params } = req.body;
    const response = await postProduct(params);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'Add new product failed',
      });
    } else {
      // Clean the cache for the specific category
      cleanCache(`category:${params.category}`);
      return res.send({
        errCode: 0,
        message: 'New Product add successfully!',
      });
    }
  }
});

app.get(`/api/supplier-product`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const itemCode = req.query.keyWord;

    const response = await getProduct(itemCode);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'No Data about this item',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Get Product Success',
        data: response,
      });
    }
  }
});

app.put('/api/supplier-product', async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const params = req.body;

    const response = await putProductUpdate(params);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'Something wrong',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Update Product Success',
      });
    }
  }
});

app.delete(`/api/supplier-product/:itemCode`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const itemCode = req.params.itemCode;

    const response = await deleteProduct(itemCode);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'Something wrong',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Delete Product Success',
      });
    }
  }
});

app.delete(`/api/supplier-user/:id`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const id = req.params.id;

    const response = await deleteCustomer(id);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'Something wrong',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Delete Customer Success',
      });
    }
  }
});
app.delete(
  `/api/supplier-category/:categoryName`,
  async (req, res) => {
    if (!req.header('Authorization')) {
      return;
    }
    const token = req.header('Authorization').slice(7);
    const check = await supplierVerifyJwt(token);

    if (!check) {
      return res.send({
        errCode: 1,
        message: 'Something wrong',
      });
    } else {
      const categoryName = req.params.categoryName;

      const response = await deleteCategory(categoryName);

      if (!response) {
        return res.send({
          errCode: 1,
          message: 'Something wrong',
        });
      } else {
        return res.send({
          errCode: 0,
          message: 'Delete Category Success',
        });
      }
    }
  }
);

app.get(`/api/supplier-ordersbydate`, async (req, res) => {
  if (!req.header('Authorization')) {
    return 'token wrong';
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { begin, end } = req.query;

    const response = await getSupplierOrderByDate(begin, end);
    return res.send({
      errCode: 0,
      message: 'Success',
      data: response,
    });
  }
});

app.get(`/api/supplier-announcement`, async (req, res) => {
  const response = await getSupplierAnnouncement();

  return res.send({
    errCode: 0,
    message: 'Success',
    data: response,
  });
});


app.post(`/api/supplier-announcement`, async (req, res) => {
  // if (!req.header('Authorization')) {
  //   return 'token wrong';
  // }
  // const token = req.header('Authorization').slice(7);
  // const check = await supplierVerifyJwt(token);

  // if (!check) {
  //   return res.send({
  //     errCode: 1,
  //     message: 'Something wrong',
  //   });
  // } else {
  const { content } = req.body;

  const response = await updateSupplierAnnouncement(content);

  if (!response) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  }
  return res.send({
    errCode: 0,
    message: 'Success',
  });
  // }
});

app.post(`/api/supplier-delete-announcement`, async (req, res) => {
  if (!req.header('Authorization')) {
    return 'token wrong';
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { content } = req.body;

    const response = await DeleteSupplierAnnouncement(content);
    if (!response) {
      res.send({
        errCode: 1,
        message: 'Something wrong',
      });
    }
    const announces = await getSupplierAnnouncement();
    return res.send({
      errCode: 0,
      message: 'Success',
      data: announces,
    });
  }
});

app.get(`/api/supplier-user-list`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const response = await getSupplierUserList();

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'no response on database!',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Success',
        data: response,
      });
    }
  }
});

app.post(`/api/supplier-category`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { params } = req.body;

    const response = await postCategory(params);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'Add new failed',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Category add successfully!',
      });
    }
  }
});

app.post(`/api/supplier-banner`, async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);

  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { params } = req.body;

    const response = await postBanner(params);

    if (!response) {
      return res.send({
        errCode: 1,
        message: 'Add banner failed',
      });
    } else {
      return res.send({
        errCode: 0,
        message: 'Banner add successfully!',
      });
    }
  }
});

app.get(`/api/supplier-verify-token`, async (req, res) => {
  if (!req.header('Authorization')) {
    return false;
  }
  const token = req.header('Authorization').slice(7);
  if (!token) {
    return false;
  }

  return supplierVerifyJwt(token);
});

app.get(`/api/supplier-get-banner`, async (req, res) => {
  const response = await getBanner();
  if (response.length > 0) {
    return res.send({
      errCode: 0,
      message: 'success',
      data: response[0].url,
    });
  } else {
    return res.send({
      errCode: 1,
      message: 'something went wrong',
    });
  }
});

app.get('/api/check-database', async (req, res) => {
  const response = await checkDatabase();
  if (response) {
    res.send({
      errCode: 0,
      message: 'Database connected',
    });
  } else {
    res.send({
      errCode: 1,
      message: 'Database not connected',
    });
  }
});

// Endpoint to send a message
app.post('/api/supplier-message', async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { params } = req.body;
    const response = await postSendNewMessage(params);

    if (response.error && response.error.length > 0) {
      return res.send({
        errCode: 1,
        message: response.error,
      });
    }
    return res.send({
      errCode: 0,
      message: response.message,
    });
  }
});

// Endpoint to get messages for user

// Endpoint to fetch messages
app.get('/api/supplier-messages', async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { receiver_id } = req.query;

    try {
      const messages = await getMessagesForUser(receiver_id);
      return res.status(200).send({
        errCode: 0,
        message: 'Query success',
        data: messages,
      });
    } catch (error) {
      return res.status(500).send({
        errCode: 1,
        message: 'Database error',
      });
    }
  }
});

// Endpoint to delete messages which selected
app.delete('/api/supplier-select-messages', async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { message_ids } = req.body;

    if (!message_ids || message_ids.length === 0) {
      return res
        .status(400)
        .send({ error: 'No message IDs provided' });
    }

    const result = await deleteSelectedMessages(message_ids);

    console.log('result', result);

    if (result.error) {
      return res.send({
        errCode: 1,
        error: result.error,
      });
    }
    return res.send({ errCode: 0, message: result.message });
  }
});

// Endpoint to update is_read status
app.put('/api/supplier-messages/read/:id', async (req, res) => {
  const messageId = req.params.id;

  const result = await updateMessageStatus(messageId);
  if (result.error && result.error.length > 0) {
    console.log('message status update failed');
    return res.status(404).json({ error: 'Message not found' });
  }
  console.log('message status update success');
  res.status(200).json({ message: result.message });
});

app.post('/api/supplier-select-message', async (req, res) => {
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const { params } = req.body;

    const response = await postSelectMessages(params);
    if (response.error && response.error.length > 0) {
      return res.send({
        errCode: 1,
        error: response.error,
      });
    } else {
      return res.send({
        errCode: 0,
        message: response.message,
      });
    }
  }
});

app.get('/api/supplier-all-product', async (req, res) => {
  const response = await getSupplierProducts();
  if (response) {
    return res.send({
      errCode: 0,
      message: 'Success',
      data: response,
    });
  } else {
    return res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  }
});



app.put(`/api/supplier-received`, async (req, res) => {
  //verify token
  if (!req.header('Authorization')) {
    return;
  }
  const token = req.header('Authorization').slice(7);
  const check = await supplierVerifyJwt(token);
  if (!check) {
    res.send({
      errCode: 1,
      message: 'Something wrong',
    });
  } else {
    const params = req.body;
    const order_number = params.orderNumber;
    const userId = params.userId;

    const userInfo = await GetUserInfoById(userId);

    const result = await updateSupplierOrderStatus(order_number);

    if (!result) {
      res.send({
        errCode: 1,
        message: 'Database wrong',
      });
    } else {
      res.send({
        errCode: 0,
        message: 'Success',
      });
    }
  }
});


const PORT = process.env.NODE_APP_PORT || 8001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
