// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
      
      // Konfigurasi yang lebih spesifik
      authorization: {
        params: {
          scope: "openid profile email", // Tambahkan scope untuk mendapatkan lebih banyak info
        },
      },
      
      // Profile handler dengan parsing roles
      profile(profile) {
        console.log("📋 Keycloak Profile Received:", JSON.stringify(profile, null, 2));
        
        // Parse JWT token untuk mendapatkan roles
        let roles = [];
        let user_id = profile.sub;
        
        // Coba parse dari token jika tersedia
        if (profile.id_token) {
          try {
            // Parse JWT token bagian payload
            const payload = JSON.parse(
              Buffer.from(profile.id_token.split('.')[1], 'base64').toString()
            );
            
            console.log("🔐 Parsed JWT payload:", JSON.stringify(payload, null, 2));
            
            // Ambil roles dari berbagai lokasi yang mungkin
            if (payload.realm_access && payload.realm_access.roles) {
              roles = payload.realm_access.roles;
            } else if (payload.resource_access && payload.resource_access.account) {
              roles = payload.resource_access.account.roles || [];
            }
            
            // Ambil user_id dari berbagai kemungkinan
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
          // Tambahkan roles dan user_id
          roles: roles,
          user_id: user_id,
          // Include semua claim untuk debugging
          ...profile,
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
    async signIn({ user, account, profile, email, credentials }) {
      console.log("🔐 SIGN IN CALLBACK FIRED");
      console.log("User:", JSON.stringify(user, null, 2));
      console.log("Account:", account ? "Present" : "Missing");
      console.log("Profile:", JSON.stringify(profile, null, 2));
      
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
    
    async jwt({ token, account, profile, trigger, session }) {
      console.log("🔄 JWT CALLBACK - trigger:", trigger);
      
      // Initial sign in
      if (account && profile) {
        console.log("✅ NEW SIGN IN - Creating JWT with roles");
        console.log("Profile roles:", profile.roles);
        
        // Dekode access token untuk mendapatkan roles
        let roles = [];
        let user_id = profile.sub;
        
        if (account.access_token) {
          try {
            const payload = JSON.parse(
              Buffer.from(account.access_token.split('.')[1], 'base64').toString()
            );
            
            console.log("🔐 Access Token Payload:", JSON.stringify(payload, null, 2));
            
            // Ambil roles dari berbagai lokasi
            if (payload.realm_access && payload.realm_access.roles) {
              roles = payload.realm_access.roles;
              console.log("📋 Roles from realm_access:", roles);
            } else if (payload.resource_access) {
              // Cari di semua resource_access
              Object.keys(payload.resource_access).forEach(resource => {
                if (payload.resource_access[resource].roles) {
                  roles = [...roles, ...payload.resource_access[resource].roles];
                }
              });
              console.log("📋 Roles from resource_access:", roles);
            }
            
            // Ambil user_id dari berbagai kemungkinan
            user_id = payload.preferred_username || payload.sub || profile.id;
            
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
            id: profile.id || profile.sub,
            name: profile.name || profile.preferred_username,
            email: profile.email,
            preferred_username: profile.preferred_username,
            user_id: user_id,
            roles: roles.length > 0 ? roles : (profile.roles || []),
          },
        };
      }
      
      // Token refresh logic
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
            
            // Parse roles dari access token baru
            let roles = [];
            if (refreshedTokens.access_token) {
              try {
                const payload = JSON.parse(
                  Buffer.from(refreshedTokens.access_token.split('.')[1], 'base64').toString()
                );
                
                if (payload.realm_access && payload.realm_access.roles) {
                  roles = payload.realm_access.roles;
                }
              } catch (error) {
                console.error("❌ Error parsing refreshed token:", error);
              }
            }
            
            return {
              ...token,
              accessToken: refreshedTokens.access_token,
              refreshToken: refreshedTokens.refresh_token,
              expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
              idToken: refreshedTokens.id_token,
              user: {
                ...token.user,
                roles: roles.length > 0 ? roles : token.user?.roles || [],
              },
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

    async session({ session, token }) {
      console.log("💼 SESSION CALLBACK");
      console.log("Token user:", JSON.stringify(token.user, null, 2));
      
      if (!token) {
        console.log("❌ No token in session callback");
        return null;
      }
      
      // Build session dengan semua informasi termasuk roles
      session.user = token.user || {
        id: token.sub,
        name: token.name,
        email: token.email,
        preferred_username: token.preferred_username,
        user_id: token.user_id || token.sub,
        roles: token.roles || [],
      };
      
      // Pastikan roles ada
      if (!session.user.roles || session.user.roles.length === 0) {
        session.user.roles = token.user?.roles || [];
      }
      
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.idToken = token.idToken;
      session.expires = token.expiresAt 
        ? new Date(token.expiresAt * 1000).toISOString()
        : null;
      
      console.log("✅ Session created for:", session.user.name);
      console.log("📋 User roles:", session.user.roles);
      console.log("📋 User ID:", session.user.user_id);
      
      return session;
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("🎉 USER SIGNED IN SUCCESSFULLY");
      console.log("User:", JSON.stringify(user, null, 2));
      console.log("Roles:", user.roles);
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
        domain: process.env.NODE_ENV === 'production' ? '.bbpompky.id' : 'localhost',
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