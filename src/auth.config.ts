import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isBoardRoute = nextUrl.pathname.startsWith('/board');
      
      if (isBoardRoute) {
        return isLoggedIn;
      }
      
      // If user is logged in and navigates to login/register, redirect to /board
      if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
        return Response.redirect(new URL('/board', nextUrl));
      }
      
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [],
  session: { strategy: 'jwt' },
} satisfies NextAuthConfig;
