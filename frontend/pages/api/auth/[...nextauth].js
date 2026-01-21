// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// Auto-detect base URL
const getBaseUrl = () => {
  // Jika di production dan menggunakan subdomain
  if (process.env.NODE_ENV === 'production') {
    // Untuk talawang.bbpompky.id
    return 'https://talawang.bbpompky.id';
  }
  // Untuk local development
  return process.env.NEXTAUTH_URL || 'http://localhost:3001';
};

const baseUrl = getBaseUrl();
console.log("🌐 Base URL configured:", baseUrl);
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);
console.log("🔧 NEXTAUTH_URL from env:", process.env.NEXTAUTH_URL);

export const authOptions = {
  // 🔴 SET BASE URL SECARA MANUAL
  basePath: "/api/auth",
  baseUrl: baseUrl,
  
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
      
      // Konfigurasi yang lebih spesifik
      authorization: {
        params: {
          scope: "openid profile email",
          // 🔴 SET REDIRECT URI SECARA EKSPLISIT
          redirect_uri: `${baseUrl}/api/auth/callback/keycloak`
        },
      },
      
      // Profile handler dengan parsing roles
      profile(profile) {
        console.log("📋 Keycloak Profile Received for:", profile.email);
        
        let roles = [];
        let user_id = profile.sub;
        
        if (profile.id_token) {
          try {
            const payload = JSON.parse(
              Buffer.from(profile.id_token.split('.')[1], 'base64').toString()
            );
            
            if (payload.realm_access && payload.realm_access.roles) {
              roles = payload.realm_access.roles;
            } else if (payload.resource_access && payload.resource_access.account) {
              roles = payload.resource_access.account.roles || [];
            }
            
            user_id = payload.preferred_username || payload.sub;
            
          } catch (error) {
            console.error("❌ Error parsing JWT token:", error);
          }
        }
        
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          preferred_username: profile.preferred_username,
          given_name: profile.given_name,
          family_name: profile.family_name,
          roles: roles,
          user_id: user_id,
        };
      },
      
      // Client options
      client: {
        token_endpoint_auth_method: "client_secret_post",
        id_token_signed_response_alg: "RS256",
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔐 SIGN IN - User:", user?.email);
      console.log("🔐 SIGN IN - Redirect URI used:", account?.redirect_uri);
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      console.log(`🔀 REDIRECT - url: ${url}, baseUrl: ${baseUrl}`);
      
      // Redirect ke home setelah login
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/dashboard`;
      }
      
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      return baseUrl;
    },
    
    async jwt({ token, account, profile }) {
      console.log("🔄 JWT callback - Account exists:", !!account);
      
      if (account && profile) {
        console.log("✅ Creating JWT for:", profile.email);
        
        let roles = [];
        let user_id = profile.sub;
        
        if (account.access_token) {
          try {
            const payload = JSON.parse(
              Buffer.from(account.access_token.split('.')[1], 'base64').toString()
            );
            
            if (payload.realm_access && payload.realm_access.roles) {
              roles = payload.realm_access.roles;
            }
            
            user_id = payload.preferred_username || payload.sub;
            
          } catch (error) {
            console.error("❌ Error parsing access token:", error);
          }
        }
        
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          idToken: account.id_token,
          user: {
            id: profile.sub,
            name: profile.name || profile.preferred_username,
            email: profile.email,
            preferred_username: profile.preferred_username,
            user_id: user_id,
            roles: roles,
          },
        };
      }
      
      return token;
    },

    async session({ session, token }) {
      console.log("💼 SESSION callback - Token exists:", !!token);
      
      if (token) {
        session.user = token.user || {
          id: token.sub,
          name: token.name,
          email: token.email,
          preferred_username: token.preferred_username,
          user_id: token.user_id || token.sub,
          roles: token.roles || [],
        };
        
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.idToken = token.idToken;
        session.expires = token.expiresAt 
          ? new Date(token.expiresAt * 1000).toISOString()
          : null;
      }
      
      return session;
    },
  },

  events: {
    async signIn(message) {
      console.log("🎉 Sign in successful for:", message.user.email);
    },
    
    async error({ error }) {
      console.error("❌ Auth error:", error);
      console.error("❌ Error stack:", error?.stack);
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  
  // Cookie configuration yang sederhana
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // HAPUS domain untuk sekarang
      },
    },
  },

  debug: true,
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