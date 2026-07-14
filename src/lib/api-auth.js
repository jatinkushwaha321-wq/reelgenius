import { auth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-response';

/**
 * Extracts the authenticated user from the server session.
 * Returns { user } on success or { error: NextResponse } on failure.
 *
 * Usage in App Router route handlers:
 *   const { user, error } = await getAuthUser();
 *   if (error) return error;
 *   // user.id is now the trusted authenticated userId
 *
 * @returns {Promise<{ user?: { id: string, name: string, email: string }, error?: NextResponse }>}
 */
export async function getAuthUser() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return {
        error: errorResponse('Authentication required', 'UNAUTHORIZED', null, 401),
      };
    }

    return { user: session.user };
  } catch (err) {
    console.error('Session retrieval failed:', err);
    return {
      error: errorResponse('Authentication service unavailable', 'AUTH_ERROR', null, 500),
    };
  }
}
