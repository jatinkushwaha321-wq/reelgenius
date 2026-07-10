const authConfig = {
  providers: [], // Populated only inside the server-side auth.js configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days session token expiry
  },
  callbacks: {
    // Forward user ID into the JWT token payload using explicit userId field
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    // Expose the user ID from the JWT token to the browser session payload
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
};

export default authConfig;
