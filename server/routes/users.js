const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');


function isValidEmail(email) {

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  
  if (!email || typeof email !== 'string') return false;
  
 
  if (email.length > 254) return false; 
  if (email.split('@')[0]?.length > 64) return false; 
  
  
  if (email.includes('..')) return false; 
  if (email.startsWith('.') || email.endsWith('.')) return false; 
  if (email.startsWith('@') || email.endsWith('@')) return false; 
  
  return emailRegex.test(email);
}


router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
   
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email, and password are required.' });
    }
    
 
    if (name.trim().length < 2) {
      return res.status(400).json({ msg: 'Name must be at least 2 characters long.' });
    }
    
   
    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: 'Please enter a valid email address.' });
    }
    
 
    const normalizedEmail = email.toLowerCase().trim();
    
   
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
    }
    
   
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ msg: 'User with this email already exists.' });
    }
    
    
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name: name.trim(), email: normalizedEmail, password: hashed });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'User with this email already exists.' });
    }
    res.status(500).json({ msg: 'Server error', err: err.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
   
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required.' });
    }
    

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: 'Please enter a valid email address.' });
    }
    
   
    const normalizedEmail = email.toLowerCase().trim();
    
 
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password.' });
    }
    
   
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password.' });
    }
    
  
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', err: err.message });
  }
});


router.put('/profile', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    
    if (!name) {
      return res.status(400).json({ msg: 'Name is required.' });
    }
    
   
    if (name.trim().length < 2) {
      return res.status(400).json({ msg: 'Name must be at least 2 characters long.' });
    }
    
    
    const user = await User.findByIdAndUpdate(
      req.user,
      { name: name.trim() },
      { new: true, select: '-password' }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }
    
    res.json({ user, msg: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', err: err.message });
  }
});

module.exports = router;
