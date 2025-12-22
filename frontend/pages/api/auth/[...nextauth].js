// pages/api/auth/[...nextauth].js - FIXED VERSION
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
      
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
      
      // PERBAIKAN: Simplify profile handler - HAPUS data besar
      profile(profile) {
        console.log("📋 Keycloak Profile Received (Simplified)");
        
        // Hanya ambil data yang BENAR-BENAR diperlukan
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          // HAPUS: preferred_username, given_name, family_name, roles, user_id, dll
        };
      },
      
      client: {
        token_endpoint_auth_method: "client_secret_post",
        id_token_signed_response_alg: "RS256",
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log("🔐 SIGN IN CALLBACK FIRED");
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      console.log(`🔀 REDIRECT CALLBACK - url: ${url}, baseUrl: ${baseUrl}`);
      
      if (url.includes('/api/auth/error')) {
        console.log('⚠️ OAuth error detected, redirecting to login');
        return `${baseUrl}/login?error=OAuthCallback`;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      return baseUrl;
    },
    
    // PERBAIKAN UTAMA: Simplify JWT callback - HAPUS data besar
    async jwt({ token, account, profile, trigger, session }) {
      console.log("🔄 JWT CALLBACK - trigger:", trigger);
      
      // Initial sign in
      if (account && profile) {
        console.log("✅ NEW SIGN IN - Creating MINIMAL JWT");
        
        // PERBAIKAN: Hanya simpan data yang ESSENTIAL
        return {
          // Simpan data yang benar-benar diperlukan
          sub: token.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          // Token data
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          // HAPUS: idToken, roles, user_id, dan data besar lainnya
        };
      }
      
      // Token refresh logic - simplified
      if (Date.now() > (token.expiresAt * 1000 - 60000)) {
        console.log("🔄 Token expiring soon, attempting refresh...");
        try {
          const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.KEYCLOAK_CLIENT_ID,
              client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken,
            }),
          });
          
          const refreshedTokens = await response.json();
          
          if (response.ok) {
            console.log("✅ Token refreshed successfully");
            
            return {
              ...token,
              accessToken: refreshedTokens.access_token,
              refreshToken: refreshedTokens.refresh_token,
              expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
              // HAPUS: idToken dan parsing roles
            };
          } else {
            console.error("❌ Token refresh failed:", refreshedTokens);
            throw new Error('Token refresh failed');
          }
        } catch (error) {
          console.error("❌ Error refreshing token:", error);
          return null;
        }
      }
      
      return token;
    },

    // PERBAIKAN UTAMA: Simplify session callback - HAPUS data besar
    async session({ session, token }) {
      console.log("💼 SESSION CALLBACK (Minimal)");
      
      if (!token) {
        console.log("❌ No token in session callback");
        return null;
      }
      
      // PERBAIKAN: Build session dengan data MINIMAL
      session.user = {
        id: token.sub,
        name: token.name,
        email: token.email,
        // HAPUS: roles, user_id, preferred_username, dll
      };
      
      // PERBAIKAN: Hanya simpan accessToken yang diperlukan
      session.accessToken = token.accessToken;
      session.expires = token.expiresAt 
        ? new Date(token.expiresAt * 1000).toISOString()
        : null;
      
      // PERBAIKAN PENTING: HAPUS data yang tidak diperlukan
      // JANGAN simpan refreshToken, idToken, roles, dll di session
      delete session.refreshToken;
      delete session.idToken;
      
      // Debug ukuran session
      const sessionSize = JSON.stringify(session).length;
      console.log("✅ Session created for:", session.user.name);
      console.log("📏 Session size:", sessionSize, "bytes");
      
      if (sessionSize > 3000) {
        console.warn("⚠️ WARNING: Session size is getting large!");
      }
      
      return session;
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("🎉 USER SIGNED IN SUCCESSFULLY");
    },
    
    async signOut({ token, session }) {
      console.log("👋 USER SIGNED OUT");
    },
    
    async error({ error }) {
      console.error("❌ AUTH ERROR:", error);
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/login',
    newUser: null,
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // PERBAIKAN: Hapus domain untuk mengurangi ukuran cookie
        // domain: process.env.NODE_ENV === 'production' ? '.bbpompky.id' : 'localhost',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error(`🔴 NextAuth Error [${code}]:`, metadata);
    },
    warn(code) {
      console.warn(`🟡 NextAuth Warning [${code}]`);
    },
    debug(code, metadata) {
      console.log(`🔵 NextAuth Debug [${code}]:`, metadata);
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
};

export default NextAuth(authOptions);