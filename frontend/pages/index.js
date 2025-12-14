// pages/index.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loading = status === 'loading';
  
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    role: '',
    userId: '',
    fullName: '',
    loginTime: ''
  });
  
  const [lineChartData, setLineChartData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Authentication effect
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  // Get user data from session
  useEffect(() => {
    if (session?.user) {
      console.log("📊 Session Data:", session);
      
      // Extract user information from session
      const username = session.user.preferred_username || 
                      session.user.name || 
                      session.user.email?.split('@')[0] || 
                      'User';
      
      const email = session.user.email || 'No email';
      const userId = session.user.id || session.user.sub || 'N/A';
      const fullName = session.user.name || session.user.preferred_username || username;
      
      // Determine role based on session data
      let role = 'User';
      const userRoles = session.user.roles || [];
      
      if (userRoles.includes('admin') || userRoles.includes('administrator')) {
        role = 'Admin';
      } else if (userRoles.includes('ppk')) {
        role = 'PPK';
      } else if (userRoles.includes('user')) {
        role = 'User';
      } else if (userRoles.length > 0) {
        role = userRoles[0];
      }
      
      const loginTime = new Date().toLocaleString('id-ID');
      
      setUserInfo({
        username,
        email,
        role,
        userId,
        fullName,
        loginTime,
        roles: userRoles
      });
    }
  }, [session]);

  // Initialize chart data
  useEffect(() => {
    if (session) {
      // Initialize chart data with default values
      const defaultLineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Earnings',
            data: [3000, 4000, 3500, 5000, 4500, 6000, 5500, 7000, 6500, 8000, 7500, 9000],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      };
      setLineChartData(defaultLineData);
    }
  }, [session]);

  // Chart data configurations
  const pieChartData = {
    labels: ['Earnings', 'Expense'],
    datasets: [
      {
        label: 'Revenue',
        data: [6000, 4000],
        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Earnings',
        data: [1000, 2000, 3000, 4000, 5000, 6000],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* User Info Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mr-6 border-4 border-white shadow">
                <span className="text-3xl font-bold text-blue-600">
                  {userInfo.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Selamat Datang, {userInfo.fullName}!
                </h1>
                <p className="text-blue-100 mb-2">
                  Anda login sebagai <span className="font-semibold">{userInfo.role}</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {userInfo.roles?.map((role, index) => (
                    <span 
                      key={index}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        role.toLowerCase().includes('ppk')
                          ? 'bg-yellow-100 text-yellow-800'
                          : role.toLowerCase().includes('admin')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-white/30 text-white'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-white mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-100">{userInfo.username}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-white mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-sm text-blue-100">{userInfo.email}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">User ID</div>
               
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    userInfo.role === 'PPK' 
                      ? 'bg-yellow-500 text-white'
                      : userInfo.role === 'Admin'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {userInfo.role} Access
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Details Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="text-xl font-bold">{userInfo.username}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-bold truncate">{userInfo.email}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className={`text-xl font-bold ${
                  userInfo.role === 'PPK' ? 'text-yellow-600' : 
                  userInfo.role === 'Admin' ? 'text-red-600' : 
                  'text-blue-600'
                }`}>
                  {userInfo.role}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Waktu Login</p>
                <p className="text-xl font-bold">{new Date().toLocaleTimeString('id-ID')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Updates Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Chart Section */}
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Revenue Updates</h2>
                <p className="text-gray-500">Overview of Profit</p>
              </div>
              <select 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="ml-4 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedYear}
              >
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </select>
            </div>
            
            {lineChartData && (
              <div className="h-64">
                <Line 
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                    },
                  }}
                />
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="text-2xl font-bold">$86,420</h3>
              <p className="text-gray-600">Total Revenue {selectedYear}</p>
              <div className="grid grid-cols-2 gap-4 my-4">
                <div>
                  <p className="text-gray-500">Earnings this month</p>
                  <p className="text-lg font-semibold">$48,820</p>
                </div>
                <div>
                  <p className="text-gray-500">Expense this month</p>
                  <p className="text-lg font-semibold">$26,498</p>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly and Monthly Breakup */}
          <div className="grid grid-rows-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold">Yearly Breakup</h2>
              <p className="text-gray-500">+$36,358</p>
              <div className="mt-4 h-48">
                <Pie 
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold">Monthly Earnings</h2>
              <p className="text-gray-500">$6,820</p>
              <div className="mt-4 h-48">
                <Bar 
                  data={barChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Akses Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/products" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 font-medium">📦 Produk</div>
              <p className="text-sm text-gray-600 mt-1">Kelola produk</p>
            </a>
            <a href="/sales" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-green-600 font-medium">🛒 Penjualan</div>
              <p className="text-sm text-gray-600 mt-1">Transaksi penjualan</p>
            </a>
            <a href="/customers" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 font-medium">👥 Pelanggan</div>
              <p className="text-sm text-gray-600 mt-1">Data pelanggan</p>
            </a>
            <a href="/suppliers" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <div className="text-yellow-600 font-medium">🚚 Supplier</div>
              <p className="text-sm text-gray-600 mt-1">Data supplier</p>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;