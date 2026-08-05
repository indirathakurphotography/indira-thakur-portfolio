import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export async function ensureAdminExists(): Promise<void> {
  try {
    const adminEmail = 'admin@indirathakur.com';
    const defaultPassword = 'admin123';

    const existingAdmin = await mongoose.models.User.findOne({ email: adminEmail });
    if (existingAdmin) return;

    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    await mongoose.models.User.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });
    console.log(`[Auth] Default admin created: ${adminEmail}`);
  } catch (error) {
    console.error('[Auth] Failed to ensure admin exists:', error);
  }
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
