import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }
    // Only block users who registered themselves and haven't verified yet.
    // Existing users and admin-created supervisors are not blocked.
    if (user.isVerified === false && user.verificationToken) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }
    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, message: 'Email already registered.' });
      } else {
        // Delete unverified user to allow re-registration
        await User.findByIdAndDelete(existingUser._id);
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpires = new Date();
    tokenExpires.setMinutes(tokenExpires.getMinutes() + 15); // 15 mins expiry

    const user = await User.create({
      name, email, password, role: role || 'supervisor',
      isVerified: false,
      verificationToken: otp,
      verificationTokenExpires: tokenExpires
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'CARMS - Verify Your Account',
        message: `<h1>Account Verification</h1>
          <p>Hi ${user.name},</p>
          <p>Thank you for registering. Please use the following OTP to verify your account:</p>
          <h2 style="background: #f4f4f5; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>`
      });
    } catch (err) {
      console.error('Error sending email:', err);
      // Rollback user creation
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again later.' });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }
    if (user.verificationToken !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (new Date() > user.verificationTokenExpires) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
