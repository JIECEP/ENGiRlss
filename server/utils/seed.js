import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create Admin
    const adminExists = await User.findOne({ email: 'admin@carms.com' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@carms.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin created: admin@carms.com / admin123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Create Supervisor
    const supExists = await User.findOne({ email: 'supervisor@carms.com' });
    if (!supExists) {
      await User.create({
        name: 'Demo Supervisor',
        email: 'supervisor@carms.com',
        password: 'super123',
        role: 'supervisor',
      });
      console.log('✅ Supervisor created: supervisor@carms.com / super123');
    } else {
      console.log('ℹ️  Supervisor already exists');
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
