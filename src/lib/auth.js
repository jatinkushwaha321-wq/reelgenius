import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import authConfig from './auth.config';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword } from '@/lib/password';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectDB();

        // Retrieve user including the passwordHash
        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        }).select('+passwordHash');

        // Return null for missing user to prevent user enumeration
        if (!user) {
          return null;
        }

        // Compare password via helper utility
        const isPasswordValid = await comparePassword(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        // Return only minimal user profile fields (never return passwordHash)
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
});
