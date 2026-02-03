// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// Helper untuk mendapatkan base URL
const getBaseUrl = () => {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  return 'http://localhost:3001'; // fallback development
};

const baseUrl = getBaseUrl();
console.log("🌐 Base URL:", baseUrl);
console.log("🔧 NODE_ENV:", process.env.NODE_ENV);
console.log("🔧 KEYCLOAK_ISSUER:", process.env.KEYCLOAK_ISSUER);

export const authOptions = {
  trustHost: true,

  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,

      // PERBAIKAN: Tambah scope untuk roles
      authorization: {
        params: {
          scope: "openid profile email roles"  // TAMBAH "roles" di sini
        }
      },

      profile(profile) {
        console.log("📋 ===== PROFILE CALLBACK =====");
        console.log("📋 Full Keycloak Profile:", JSON.stringify(profile, null, 2));

        let roles = [];

        // Ambil roles dari realm_access
        if (profile.realm_access?.roles) {
          console.log("📝 Realm Roles from profile:", profile.realm_access.roles);
          roles = roles.concat(profile.realm_access.roles);
        }

        // Ambil roles dari semua resource_access (client)
        if (profile.resource_access) {
          console.log("📝 Resource Access from profile:", profile.resource_access);
          
          Object.entries(profile.resource_access).forEach(([clientName, client]) => {
            console.log(`📝 Client "${clientName}" roles:`, client?.roles);
            if (client?.roles) {
              roles = roles.concat(client.roles);
            }
          });
        }

        console.log("📝 All roles from Keycloak profile:", roles);
        
        // PERBAIKAN: Jangan filter di sini, kirim semua roles
        // Biarkan filter dilakukan di jwt callback

        // Identifier user
        const user_id = profile.preferred_username || profile.username || profile.sub;

        // Nama lengkap
        const name = profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || profile.preferred_username;

        console.log("📋 User ID:", user_id);
        console.log("📋 Name:", name);
        console.log("📋 ==============================");

        return {
          id: profile.sub,
          name,
          email: profile.email || `${user_id}@placeholder.com`,
          preferred_username: profile.preferred_username,
          given_name: profile.given_name,
          family_name: profile.family_name,
          roles,  // KIRIM SEMUA ROLES
          user_id,
          _raw: profile,
        };
      },

      client: { token_endpoint_auth_method: "client_secret_post" },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔐 ===== SIGN IN CALLBACK =====");
      console.log("🔐 User:", user?.email, "Provider:", account?.provider);
      console.log("🔐 User roles from profile callback:", user?.roles);
      console.log("🔐 Raw profile from Keycloak:", profile);
      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) return url;
      if (url.includes('/api/auth/callback')) return `${baseUrl}/`;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return url.startsWith('http') ? url : baseUrl;
    },

    async jwt({ token, user, account, profile }) {
      console.log("🔄 ===== JWT CALLBACK =====");
      
      if (user && account) {
        console.log("🔄 Initial JWT - User roles:", user.roles);
        console.log("🔄 Initial JWT - Account provider:", account.provider);
        console.log("🔄 Profile from Keycloak:", profile);

        // Ambil roles dari user (yang sudah di-process di profile callback)
        let userRoles = user.roles || [];
        
        // FALLBACK: Jika roles kosong, coba ambil dari profile
        if (userRoles.length === 0 && profile) {
          console.log("🔄 No roles from user, checking profile...");
          
          // Realm roles
          if (profile.realm_access?.roles) {
            userRoles = userRoles.concat(profile.realm_access.roles);
          }
          
          // Client roles
          if (profile.resource_access) {
            Object.values(profile.resource_access).forEach(client => {
              if (client?.roles) userRoles = userRoles.concat(client.roles);
            });
          }
        }
        
        // FALLBACK 2: Jika masih kosong, coba ambil dari account
        if (userRoles.length === 0 && account.access_token) {
          console.log("🔄 Trying to extract roles from access token...");
          try {
            const payload = JSON.parse(atob(account.access_token.split('.')[1]));
            if (payload.realm_access?.roles) {
              userRoles = userRoles.concat(payload.realm_access.roles);
            }
            if (payload.resource_access) {
              Object.values(payload.resource_access).forEach(client => {
                if (client?.roles) userRoles = userRoles.concat(client.roles);
              });
            }
          } catch (e) {
            console.error("🔄 Failed to parse access token:", e);
          }
        }
        
        // Hapus duplikat
        userRoles = [...new Set(userRoles)];
        
        // Filter roles yang diizinkan (opsional, bisa dihapus)
        const allowedRoles = ["admin", "ppk", "user", "administrator", "create-realm", "default-roles-master", "uma_authorization"];
        const filteredRoles = userRoles.filter(r => allowedRoles.includes(r));
        
        console.log("🔄 All unique roles found:", userRoles);
        console.log("🔄 Filtered roles (allowed):", filteredRoles);
        
        // Tentukan flags berdasarkan roles
        const isAdmin = userRoles.includes("admin") || userRoles.includes("administrator");
        const isPPK = userRoles.includes("ppk");
        
        console.log("🔄 isAdmin:", isAdmin, "isPPK:", isPPK);

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? Math.floor(account.expires_at) : null,
          idToken: account.id_token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            preferred_username: user.preferred_username,
            given_name: user.given_name,
            family_name: user.family_name,
            roles: filteredRoles,  // Simpan filtered roles
            user_id: user.user_id,
            isAdmin,
            isPPK,
            _raw: user._raw,
          },
          provider: account.provider,
        };
      }

      // Jika token masih valid
      const now = Math.floor(Date.now() / 1000);
      if (token.expiresAt && token.expiresAt > now) {
        console.log("🔄 JWT still valid, returning existing token");
        console.log("🔄 Current token user roles:", token.user?.roles);
        return token;
      }

      console.log("🔄 JWT expired or refreshing");
      return token;
    },

    async session({ session, token }) {
      console.log("💼 ===== SESSION CALLBACK =====");
      console.log("💼 Token user object:", token?.user);
      
      if (token?.user) {
        // Pastikan roles ada
        const userRoles = token.user.roles || [];
        
        console.log("💼 Roles in token.user:", userRoles);
        console.log("💼 isAdmin in token.user:", token.user.isAdmin);
        console.log("💼 isPPK in token.user:", token.user.isPPK);
        
        // Update session dengan data dari token
        session.user = {
          ...session.user,
          id: token.user.id,
          name: token.user.name,
          email: token.user.email,
          preferred_username: token.user.preferred_username,
          given_name: token.user.given_name,
          family_name: token.user.family_name,
          roles: userRoles,  // PASTIKAN ROLES MASUK KE SESSION
          user_id: token.user.user_id,
          isAdmin: token.user.isAdmin,
          isPPK: token.user.isPPK,
          _raw: token.user._raw,
        };
        
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.idToken = token.idToken;
        session.expires = token.expiresAt ? new Date(token.expiresAt * 1000).toISOString() : null;
        session.provider = token.provider;
        
        // Debug log
        console.log("💼 Final Session User:", session.user);
        console.log("💼 Roles in session.user:", session.user.roles);
        console.log("💼 Session keys:", Object.keys(session));
        console.log("💼 ==============================");
      } else {
        console.warn("⚠️ No user data in token during session callback");
      }
      
      return session;
    },
  },

  events: {
    async signIn({ user, isNewUser }) { 
      console.log("🎉 ===== SIGN IN EVENT =====");
      console.log("🎉 User:", user?.email, "New:", isNewUser);
      console.log("🎉 User roles:", user?.roles);
    },
    async signOut() { 
      console.log("👋 ===== SIGN OUT EVENT =====");
    },
    async error({ error }) { 
      console.error("❌ ===== AUTH ERROR EVENT =====");
      console.error("❌ Error:", error);
    },
  },

  pages: { 
    signIn: '/auth/signin', 
    signOut: '/auth/signout', 
    error: '/auth/error' 
  },

  session: { 
    strategy: 'jwt', 
    maxAge: 8 * 60 * 60 
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: { 
        httpOnly: true, 
        sameSite: 'lax', 
        path: '/', 
        secure: process.env.NODE_ENV === 'production' 
      },
    },
  },

  debug: true,  // SELALU DEBUG
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  logger: {
    error(code, metadata) { 
      console.error(`🔴 [${code}]`, metadata); 
    },
    warn(code) { 
      console.warn(`🟡 [${code}]`); 
    },
    debug(code, metadata) { 
      console.log(`🔵 [${code}]`, metadata); 
    },
  },
};

export default NextAuth(authOptions);