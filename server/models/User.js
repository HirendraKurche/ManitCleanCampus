const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Counter Schema (for auto-incrementing employeeCode) ──────────────────────
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // e.g. "employeeCode"
  seq:  { type: Number, default: 1000 },
});
const Counter = mongoose.model('Counter', counterSchema);

// ─── User Schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // Human-readable ID shown in all UI (Admin and Worker views)
    employeeCode: {
      type:   String,
      unique: true,
      index:  true,
    },

    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
    },

    // Workers log in with phone; admins may use email
    phone: {
      type:   String,
      unique: true,
      sparse: true,
      trim:   true,
    },
    email: {
      type:   String,
      unique: true,
      sparse: true,
      trim:   true,
      lowercase: true,
    },

    password: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: 6,
      select:   false, // never returned in queries by default
    },

    role: {
      type:    String,
      enum:    ['Worker', 'Admin'],
      default: 'Worker',
    },

    // Areas / zones this worker is assigned to
    assignedAreas: [{ type: String, trim: true }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Pre-save: generate employeeCode + hash password ─────────────────────────
userSchema.pre('save', async function (next) {
  // Auto-generate employeeCode only on first save
  if (this.isNew && !this.employeeCode) {
    const counter = await Counter.findByIdAndUpdate(
      'employeeCode',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.employeeCode = `EMP-${counter.seq}`;
  }

  // Hash password only if it was modified
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare passwords ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePwd) {
  return bcrypt.compare(candidatePwd, this.password);
};

module.exports = mongoose.model('User', userSchema);
