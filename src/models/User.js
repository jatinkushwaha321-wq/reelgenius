import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent recompilation errors during hot reloading in dev
export default mongoose.models.User || mongoose.model('User', userSchema);
