import connectDB from '@/lib/mongodb';
import { successResponse, errorResponse } from '@/lib/api-response';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Attempt database connection initialization
    await connectDB();

    // Verify Mongoose connection state (1 = connected)
    if (mongoose.connection.readyState === 1) {
      return successResponse(
        { db: 'connected' },
        'Database connection successful',
        200
      );
    } else {
      throw new Error(`Database connection readyState is: ${mongoose.connection.readyState}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database connection error';
    return errorResponse(
      'Database connection failed',
      'DATABASE_CONNECTION_ERROR',
      errorMessage,
      500
    );
  }
}
