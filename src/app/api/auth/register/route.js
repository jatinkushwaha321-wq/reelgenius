import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';
import { logActivity } from '@/lib/activity-logger';
import { successResponse, errorResponse } from '@/lib/api-response';
import { registerSchema } from '@/lib/validations/auth';

/**
 * Handle POST request for user registration.
 *
 * @param {Request} request - Next.js incoming request object
 * @returns {Promise<Response>} Next.js standard API response
 */
export async function POST(request) {
  try {
    // 1. Parse request JSON body safely
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body in request', 'BAD_REQUEST', null, 400);
    }

    // 2. Zod schema validation
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.format(),
        400
      );
    }

    const { name, email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 3. Establish database connection after input checks succeed
    await connectDB();

    // 4. Verify user uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(
        'An account with this email address already exists',
        'EMAIL_ALREADY_EXISTS',
        null,
        409
      );
    }

    // 5. Cryptographically secure password hash
    const passwordHash = await hashPassword(password);

    // 6. Persist user document
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    const userIdStr = newUser._id.toString();

    // 7. Log registration event exactly once
    await logActivity(userIdStr, 'user_registered', 'user', userIdStr);

    // 8. Return sanitized payload
    const safeUser = {
      id: userIdStr,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    return successResponse(
      { user: safeUser },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Unhandled registration error:', error);
    return errorResponse(
      'Internal server error during registration',
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error.message : null,
      500
    );
  }
}
