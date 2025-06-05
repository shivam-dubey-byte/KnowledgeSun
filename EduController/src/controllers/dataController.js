const {
  addCarousel,
  addCourses,
  getLastCourses,
  getCoursesByTitle,
  getLastImages,
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  purchaseSingleCourse,
  purchaseCart,
  getMyCourses,
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  clearWishlist
} = require('../models/dataModel');

const crypto = require('crypto');

const { MongoClient } = require('mongodb');
const connectDB = require('../connectDB');

const axios = require("axios");
const { response } = require('express');

require('dotenv').config();



// 32-byte AES key
const key = Buffer.from('7c3932af93b283dae0c5173b9adffa299a87e33b92e13a9119e120d8249e199e', 'hex'); // 32-byte key for AES-256

// AES-GCM encryption function
function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString('base64');
}

// AES-GCM decryption function
function decrypt(data) {
  const dataBuffer = Buffer.from(data, 'base64');
  
  if (dataBuffer.length < 28) {
    throw new Error('Invalid encrypted data');
  }

  const iv = dataBuffer.slice(0, 12);
  const tag = dataBuffer.slice(dataBuffer.length - 16);
  const encrypted = dataBuffer.slice(12, dataBuffer.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  try {
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Decryption failed. Possible integrity issue.');
  }
}
// AES-GCM encryption function


// --------------------------
// Data (Carousel & Courses) Handlers
// --------------------------

// Add a new carousel image
const carouselAdd = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { image, url } = JSON.parse(decryptedResponse);;
    const insertedId = await addCarousel(image, url);
    const responseData = { message: 'Carousel image added', id: insertedId };
    //res.status(201).json({ message: 'Carousel image added', id: insertedId });

    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Add a new course
const coursesAdd = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { title, image, url } = JSON.parse(decryptedResponse);
    const insertedId = await addCourses(title, image, url);
    //res.status(201).json({ message: 'Course added', id: insertedId });
    const responseData = { message: 'Course added', id: insertedId };
    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);
    // Send encrypted data as the response
    res.status(200).send(encryptedData);

  } catch (error) {
    res.status(500).send(encryptedData);
  }
};

// Retrieve the last 6 inserted courses
const getLastCoursesController = async (req, res) => {
  try {
    const courses = await getLastCourses();
    //res.status(200).json(courses);

    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(courses));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Retrieve courses by a given title (e.g., using a URL parameter)
const getCoursesByTitleController = async (req, res) => {
  try {
    const { title } = req.params; // Pass title as a URL parameter
    const courses = await getCoursesByTitle(title);
    console.log(courses);
    //res.status(200).json(courses);
    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(courses));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Retrieve the last 5 images from the images collection
const getLastImagesController = async (req, res) => {
  try {
    const images = await getLastImages();
    //res.status(200).json(images);
    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(images));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Add course to cart
const addToCartController = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { title, image, price } = JSON.parse(decryptedResponse);
    const email = req.email; // Extract email from token

    const response = await addToCart(email, title, image, price);
    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(response));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

    //res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Get user cart
const getCartController = async (req, res) => {
  try {
    const email = req.email; // Extract email from token
    const cart = await getCart(email);
    //res.status(200).json(cart);
    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(cart));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Remove a course from cart using title
const removeFromCartController = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { title } = JSON.parse(decryptedResponse);
    const email = req.email; // Extract email from token

    const response = await removeFromCart(email, title);
    //res.status(200).json(response);
    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(response));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Clear entire cart
const clearCartController = async (req, res) => {
  try {
    const email = req.email; // Extract email from token
    const response = await clearCart(email);
    //res.status(200).json(response);
    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

const purchaseSingleController = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { title, image, price } = JSON.parse(decryptedResponse);
    const email = req.email;

    if (!title || !image || !price) {
      return res.status(400).json({ error: "Missing course details" });
    }

    const course = {
      title,
      image,
      price,
      purchasedAt: new Date()
    };

    const result = await purchaseSingleCourse(email, course);
    // Encrypt the response data before sending it back to the frontend
    const responseData = {
      success: true,
      message: result.message,
      alreadyPurchased: result.alreadyPurchased
    };
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );
    
    /**res.status(200).json({
      success: true,
      message: result.message,
      alreadyPurchased: result.alreadyPurchased
    });**/

  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
};

const purchaseCartController = async (req, res) => {
  try {
    const email = req.email;
    const result = await purchaseCart(email);
    const responseData = {
      success: true,
      message: result.message,
      newPurchases: result.newPurchases,
      existingCourses: result.existingCourses
    };
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );
/**
    res.status(200).json({
      success: true,
      message: result.message,
      newPurchases: result.newPurchases,
      existingCourses: result.existingCourses
    });**/
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getMyCoursesController = async (req, res) => {
  try {
    const email = req.email;
    const courses = await getMyCourses(email);
    /*res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });*/
    const responseData ={
      success: true,
      count: courses.length,
      courses
    };
    console.log(responseData);
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
};


// --------------------------
// Wishlist Handlers
// --------------------------

// Add course to wishlist
const addToWishlistController = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { title, image, price } = JSON.parse(decryptedResponse);
    const email = req.email; // Extract email from token

    const response = await addToWishlist(email, title, image, price);
    //res.status(200).json(response);
    const encryptedData = encrypt(JSON.stringify(response));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Get user wishlist
const getWishlistController = async (req, res) => {
  try {
    const email = req.email; // Extract email from token
    const wishlist = await getWishlist(email);
    //res.status(200).json(wishlist);
    const encryptedData = encrypt(JSON.stringify(wishlist));
    console.log("Encrypted Response Data:", encryptedData);
    // Send encrypted data as the response
    res.status(200).send( encryptedData );
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Remove a course from wishlist using title
const removeFromWishlistController = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { title } = JSON.parse(decryptedResponse);
    const email = req.email;

    const response = await removeFromWishlist(email, title);
    const encryptedData = encrypt(JSON.stringify(response));
    console.log("Encrypted Response Data:", encryptedData);
    // Send encrypted data as the response
    res.status(200).send( encryptedData );
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Clear entire wishlist
const clearWishlistController = async (req, res) => {
  try {
    const email = req.email;
    const response = await clearWishlist(email);
    //res.status(200).json(response);
    const encryptedData = encrypt(JSON.stringify(response));
    console.log("Encrypted Response Data:", encryptedData);
    // Send encrypted data as the response
    res.status(200).send( encryptedData );
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};


// ✅ FastAPI endpoint
const FASTAPI_URL = "https://1ce7-47-247-75-228.ngrok-free.app/search";//"https://3bae-115-245-115-222.ngrok-free.app/search";

const searchSmartCoursesController = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { query } = JSON.parse(decryptedResponse);
    const email = req.email;

    if (!query) {
      return res.status(400).json({ error: "Missing search query" });
    }

    // 1. Connect to MongoDB
    const db = await connectDB("userdata");

    // 2. Save search query to `searchhistory`
    await db.collection("searchhistory").updateOne(
      { email },
      { $addToSet: { queries: query } },
      { upsert: true }
    );

    // 3. Get all courses from `courses` collection
    const allCourses = await db.collection("courses").find({}).toArray();

    // 4. Format data to send to FastAPI
    const fastApiCourses = allCourses.map(course => ({
      id: course._id.toString(),
      title: course.title,
      tags: course.tags || []
    }));

    const payload = {
      query,
      courses: fastApiCourses
    };

    // 5. Send query + courses to FastAPI
    const response = await axios.post(FASTAPI_URL, payload);

    // 6. Filter by score > 0.1
    const filteredIds = response.data.results
      .filter(result => result.score > 0.1)
      .map(result => result.id);

    // 7. Return full course details for matching results
    const matchedCourses = allCourses.filter(course =>
      filteredIds.includes(course._id.toString())
    );

    //res.status(200).json({ results: matchedCourses });
    const responseData ={ results: matchedCourses };
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);
    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (err) {
    console.error("Smart search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
};


const RECOMMENDATION_API = "https://cc06-47-247-75-228.ngrok-free.app/api/recommend";//"https://fba6-115-245-115-222.ngrok-free.app/api/recommend";

const recommendCoursesController = async (req, res) => {
  try {
    const email = req.email;

    // 1. Connect to DB
    const db = await connectDB("userdata");

    // 2. Get all courses from DB
    const allCourses = await db.collection("courses").find({}).toArray();

    const formattedCourses = allCourses.map(course => ({
      title: course.title,
      description: course.description || "",
      tags: course.tags || []
    }));

    // 3. Get user's purchased courses
    const myCoursesDoc = await db.collection("mycourses").findOne({ email });
    const purchasedTitles = (myCoursesDoc?.courses || []).map(c => c.title);

    // 4. Get user’s search history
    const historyDoc = await db.collection("searchhistory").findOne({ email });
    const searchTerms = historyDoc?.queries || [];

    // 5. Prepare payload for FastAPI
    const payload = {
      purchasedCourses: purchasedTitles,
      searchHistory: searchTerms,
      allCourses: formattedCourses
    };

    // 6. Call FastAPI
    const response = await axios.post(RECOMMENDATION_API, payload);

    // 7. Extract recommended titles
    const recommendedTitles = response.data.map(c => c.title);

    // 8. Filter original courses using title and reattach image & full info
    const enrichedResults = allCourses
      .filter(course => recommendedTitles.includes(course.title))
      .map(course => ({
        title: course.title,
        description: course.description || "",
        tags: course.tags || [],
        image: course.image || ""
      }));

    // 9. Return to frontend
    //res.status(200).json({ results: enrichedResults });
    const responseData ={ results: enrichedResults };
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);
    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (err) {
    console.error("Recommendation error:", err.message);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
};


module.exports = {
  carouselAdd,
  coursesAdd,
  getLastCoursesController,
  getCoursesByTitleController,
  getLastImagesController,
  addToCartController,
  getCartController,
  removeFromCartController,
  clearCartController,
  purchaseSingleController,
  purchaseCartController,
  getMyCoursesController,
  // ... existing exports ...
  addToWishlistController,
  getWishlistController,
  removeFromWishlistController,
  clearWishlistController,
  // ... other exports ...
  searchSmartCoursesController,
  recommendCoursesController
};
