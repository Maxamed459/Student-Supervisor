/**
 * Bootstraps the first Admin account so the system can be used from a clean
 * database (Admin accounts can otherwise only be created by another Admin).
 *
 * Usage:
 *   node src/scripts/seedAdmin.js
 *
 * Reads ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME from .env, or falls back to
 * sane defaults printed to the console.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const run = async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@studentsupervisor.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const fullName = process.env.ADMIN_NAME || 'System Administrator';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    fullName,
    email,
    passwordHash,
    role: 'admin',
    isActive: true,
    mustChangePassword: true,
  });

  console.log('Admin account created:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('Please log in and change this password immediately.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
