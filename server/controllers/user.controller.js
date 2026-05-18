import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSupervisor = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }
    
    const user = await User.create({ name, email, password, role: 'supervisor', isVerified: true });
    

    try {
      console.log(`[DEBUG] Attempting to send welcome email to new supervisor: ${user.email}`);
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'CARMS - Supervisor Account Created',
        message: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h1 style="color: #0f172a; margin-top: 0;">Welcome to CARMS!</h1>
            <p style="font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px;">An administrator has created a supervisor account for you in the Certificate Automation and Repository Management System (CARMS).</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Your Account Information:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Email: <strong>${user.email}</strong></li>
                <li>Password: <strong>${password}</strong></li>
              </ul>
            </div>
            <p style="font-size: 16px;">Please log in to CARMS using your credentials above. We recommend changing your password after your first login.</p>
          </div>
        `
      });
      console.log('[DEBUG] sendEmail completed successfully.');
    } catch (err) {
      console.error('[DEBUG] Error caught in createSupervisor when sending email:', err);
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ success: false, message: 'Failed to send welcome email. Please check your email configuration and try again.' });
    }

    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
