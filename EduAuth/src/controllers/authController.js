const {
  createUser,
  findUserByEmail,
  comparePassword,
  findUserById,
  updatePassword
} = require('../models/userModel');

const crypto = require('crypto');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sendResetEmail } = require('../mail/resetMail');
const { ObjectId } = require('mongodb');

console.log("JWT_SECRET:", process.env.JWT_SECRET); // Debugging to ensure it's loaded

// Profile image mapping based on the first letter of email
const profileImageLinks = {
    a: "https://i.imgur.com/829pqfV.jpg",
    b: "https://i.imgur.com/rnpqVhK.jpg",
    c: "https://i.imgur.com/KDmboxg.jpg",
    d: "https://i.imgur.com/6oTdEsH.jpg",
    e: "https://i.imgur.com/mC8nIrj.jpg",
    f: "https://i.imgur.com/wuL54zd.jpg",
    g: "https://i.imgur.com/6Bc7L3h.jpg",
    h: "https://i.imgur.com/dzGGWtD.jpg",
    i: "https://i.imgur.com/bfgkLdm.jpg",
    j: "https://i.imgur.com/UNwFW7J.jpg",
    k: "https://i.imgur.com/p250FFA.jpg",
    l: "https://i.imgur.com/undefined.jpg",
    m: "https://i.imgur.com/7z2t4m5.jpg",
    n: "https://i.imgur.com/E1FqdIT.jpg",
    o: "https://i.imgur.com/lTdf4pZ.jpg",
    p: "https://i.imgur.com/YWIpqnV.jpg",
    q: "https://i.imgur.com/OwyQilG.jpg",
    r: "https://i.imgur.com/d7C0di.jpg",
    s: "https://i.imgur.com/undefin.jpged",
    t: "https://i.imgur.com/MKzutOv.jpg",
    u: "https://i.imgur.com/jZ0zoqK.jpg",
    v: "https://i.imgur.com/H6og9ez.jpg",
    w: "https://i.imgur.com/lpC7Ghr.jpg",
    x: "https://i.imgur.com/lWZMLyq.jpg",
    y: "https://i.imgur.com/undefined.jpg",
    z: "https://i.imgur.com/undefined.jpg"
};

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


// **User Signup**
const signup = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted signup data from the frontend
    console.log("Encrypted Signup Data:", data);

    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Signup Data:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { email, password } = JSON.parse(decryptedResponse);

    // Check if user already exists
    let user = await findUserByEmail(email);
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Get first letter of email & assign profile image
    const firstLetter = email.charAt(0).toLowerCase();
    const profileImage = profileImageLinks[firstLetter] || "https://i.imgur.com/default.jpg";

    // Create new user
    await createUser(email, password, profileImage);

    // Fetch newly created user
    const newUser = await findUserByEmail(email);

    // Generate token
    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, "shivam", { expiresIn: "15d" });

    // Prepare response data
    const responseData = {
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        profile: newUser.profile
      }
    };

    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(201).send(encryptedData);

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// **User Login**
const login = async (req, res) => {
  try {
    const { data } = req.body; // Encrypted login data from the frontend
    console.log("Encrypted Response:", data);
    console.log(data);
    // Decrypt the entire payload
    const decryptedResponse = decrypt(data); // Decrypt the data received from the frontend
    console.log("Decrypted Response:", decryptedResponse);

    // Parse the decrypted response into a JavaScript object
    const { email, password } = JSON.parse(decryptedResponse);

    // Find user in DB
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id, email: user.email }, 'shivam', { expiresIn: "15d" });

    // Prepare response data
    const responseData = {
      message: "Login successful",
      token,
      user: {
        profile: user.profile,
      },
    };

    // Encrypt the response data before sending it back to the frontend
    const encryptedData = encrypt(JSON.stringify(responseData));
    console.log("Encrypted Response Data:", encryptedData);

    // Send encrypted data as the response
    res.status(200).send( encryptedData );

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Forgot Password Controller**
const forgotPassword = async (req, res) => {
  const { data } = req.body; // Encrypted email data from the frontend
  console.log(data);
  try {
    // Decrypt the email data received from the frontend
    const decryptedEmail = decrypt(data);
    console.log("Decrypted Email:", decryptedEmail);

    // Check if user exists
    const user = await findUserByEmail(decryptedEmail);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token with 15-day expiration
    const resetToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15d" });

    // Prepare reset URL (you can customize the URL or make it encrypted if needed)
    const resetUrl = `https://knowledgesun.quantumsoftdev.in/reset-password/${resetToken}`;

    // Send reset email (you can pass encrypted data if required)
    await sendResetEmail(user.email, resetUrl);

    // Encrypt the response message before sending it back
    const encryptedResponse = encrypt("Password reset email sent");
    console.log("Encrypted Response:", encryptedResponse);
    res.status(200).json({ message: encryptedResponse });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// **Reset Password Controller**
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { data } = req.body; // Encrypted new password

  try {
    console.log("Received Token:", token);

    // Decrypt the new password
    const decryptedPassword = decrypt(data);
    console.log("Decrypted New Password:", decryptedPassword);

    // Verify the token and decode user information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded);

    const { email } = decoded;

    // Find the user in DB
    const user = await findUserByEmail(email);
    console.log("User Found:", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash and update the new password
    const hashedPassword = await bcrypt.hash(decryptedPassword, 10);
    await updatePassword(user._id, hashedPassword);

    // Encrypt the response message before sending it back
    const encryptedResponse = encrypt("Password reset successful");
    res.status(200).json({ message: encryptedResponse });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };