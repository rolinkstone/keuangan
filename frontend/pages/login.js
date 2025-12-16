// pages/login.js
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { error: queryError } = router.query;

  useEffect(() => {
    // Handle authentication errors from callback
    if (queryError) {
      switch (queryError) {
        case 'AccessDenied':
          setError('Akses ditolak. Periksa kredensial Anda atau hubungi administrator.');
          break;
        case 'Configuration':
          setError('Terdapat masalah dengan konfigurasi server.');
          break;
        case 'Verification':
          setError('Link verifikasi tidak valid atau telah kadaluarsa.');
          break;
        default:
          setError('Terjadi kesalahan saat autentikasi. Silakan coba lagi.');
      }
    }
  }, [queryError]);

  const handleKeycloakLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signIn('keycloak', {
        callbackUrl: '/',
        redirect: true
      });
    } catch (err) {
      setError('Gagal memulai login SSO. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Talawang</title>
        <meta name="description" content="Login ke Sistem Pengelolaan Perjalanan Dinas BBPOM di Palangka Raya" />
      </Head>

      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Background dengan Overlay Gelap */}
        <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/business-travel-bg.jpg')",
              backgroundBlendMode: 'overlay',
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-indigo-900/70" />
        </div>

        <div className="relative z-10 max-w-md w-full">
          {/* Header dengan Logo Perusahaan */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl mb-4 transform hover:scale-105 transition-transform">
                <div className="relative">
                  <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                TALAWANG<span className="text-blue-300"></span>
              </h1>
              <p className="text-blue-100 font-medium">
               Perjalanan dinas dilaksanakan secara tertib, sah secara hukum, hemat anggaran, dapat dipertanggungjawabkan, dan memberikan manfaat nyata bagi organisasi.
              </p>
            </div>
            
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-white text-sm">Login Aman dengan SSO </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50/90 backdrop-blur-sm p-4 rounded-xl border border-red-200 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8">
              {/* Welcome Message */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Selamat Datang
                </h2>
               
              </div>

              {/* SSO Login Button */}
              <div className="mb-8">
                <button
                  onClick={handleKeycloakLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-3 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-lg">Mengarahkan ke Portal SSO BBPOM di Palangka Raya</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-7 h-7 mr-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-lg">Login dengan SSO</div>
                        <div className="text-sm font-normal opacity-90">Gunakan akun SSO BBPOM di Palangka Raya</div>
                      </div>
                    </>
                  )}
                </button>
              </div>

             

              {/* Security Info */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Sistem Terenkripsi</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Single Sign-On</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50/80 px-8 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between text-sm">
                <div className="flex items-center text-gray-600 mb-2 sm:mb-0">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Sistem Perjalanan Dinas v1.0</span>
                </div>
                <div className="flex items-center space-x-4">
                  
                  <span className="text-gray-400">•</span>
                  <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-sm">
                    Kebijakan Privasi
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright & Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-white/80">
              &copy; {new Date().getFullYear()} Talawang. Hak cipta dilindungi.
            </p>
            <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-white/60">
             
             
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;