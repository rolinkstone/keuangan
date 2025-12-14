// pages/home.js
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
    nip: '',
    role: '',
    userId: '',
    fullName: '',
    jabatan: '',
    loginTime: ''
  });

  const [dashboardStats, setDashboardStats] = useState({
    totalKegiatan: 0,
    kegiatanDraft: 0,
    kegiatanDiajukan: 0,
    kegiatanDisetujui: 0,
    totalPegawai: 0,
    totalBiaya: 0
  });

  const [recentKegiatan, setRecentKegiatan] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // Authentication effect
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  // Get user data from session and fetch dashboard data
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
      let jabatan = 'Pegawai';
      const userRoles = session.user.roles || [];
      
      if (userRoles.includes('admin') || userRoles.includes('administrator')) {
        role = 'Admin';
        jabatan = 'Administrator';
      } else if (userRoles.includes('ppk')) {
        role = 'PPK';
        jabatan = 'Pejabat Pembuat Komitmen';
      } else if (userRoles.includes('kabalai')) {
        role = 'Kabalai';
        jabatan = 'Kepala Balai';
      } else if (userRoles.includes('user')) {
        role = 'User';
        jabatan = 'Pegawai';
      } else if (userRoles.length > 0) {
        role = userRoles[0];
        jabatan = role;
      }
      
      // Extract NIP from session if available
      const nip = session.user.nip || session.user.employee_id || 'N/A';
      
      const loginTime = new Date().toLocaleString('id-ID');
      
      setUserInfo({
        username,
        email,
        role,
        userId,
        fullName,
        jabatan,
        nip,
        loginTime,
        roles: userRoles
      });

      // Fetch dashboard data
      fetchDashboardData();
    }
  }, [session]);

  // Fetch dashboard statistics and recent kegiatan
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // In a real application, you would fetch this from your API
      // For now, we'll use mock data based on your SQL structure
      
      // Mock data for demonstration
      const mockStats = {
        totalKegiatan: 7,
        kegiatanDraft: 1,
        kegiatanDiajukan: 3,
        kegiatanDisetujui: 2,
        totalPegawai: 10,
        totalBiaya: 14600000
      };

      const mockRecentKegiatan = [
        {
          id: 127,
          kegiatan: 'Melaksanakan peningkatan kompetensi petugas dalam melakukan Verifikasi Program Manajemen Risiko (PMR) Pangan Olahan di Banjarbaru Kalimantan Selatan',
          status: 'diajukan',
          tanggal_diajukan: '2025-12-14 22:13:52',
          jumlah_pegawai: 2,
          total_biaya: 3060000
        },
        {
          id: 126,
          kegiatan: 'fdasf',
          status: 'disetujui',
          tanggal_disetujui: '2025-12-14 20:55:01',
          jumlah_pegawai: 3,
          total_biaya: 4200000
        },
        {
          id: 122,
          kegiatan: 'Pagar Makan Tanaman',
          status: 'selesai',
          tanggal_disetujui: '2025-12-14 12:28:42',
          jumlah_pegawai: 1,
          total_biaya: 1400000
        },
        {
          id: 124,
          kegiatan: 'Pagar Makan Tanaman',
          status: 'diajukan',
          tanggal_diajukan: '2025-12-14 13:38:29',
          jumlah_pegawai: 1,
          total_biaya: 1400000
        },
        {
          id: 123,
          kegiatan: 'Pagar Makan Tanaman',
          status: 'diajukan',
          tanggal_diajukan: '2025-12-14 12:13:39',
          jumlah_pegawai: 1,
          total_biaya: 1400000
        }
      ];

      // Chart data based on kegiatan status
      const monthlyKegiatanData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Kegiatan Diajukan',
            data: [2, 3, 4, 5, 3, 4, 6, 7, 5, 4, 3, 7],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.4,
          },
          {
            label: 'Kegiatan Disetujui',
            data: [1, 2, 3, 4, 2, 3, 5, 6, 4, 3, 2, 2],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      };

      setDashboardStats(mockStats);
      setRecentKegiatan(mockRecentKegiatan);
      setLineChartData(monthlyKegiatanData);
      
      // Pie chart for status distribution
      setPieChartData({
        labels: ['Draft', 'Diajukan', 'Disetujui', 'Diketahui', 'Selesai', 'Dibatalkan'],
        datasets: [
          {
            label: 'Status Kegiatan',
            data: [1, 3, 2, 0, 1, 1],
            backgroundColor: [
              'rgba(255, 206, 86, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
              'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
              'rgba(255, 206, 86, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1,
          },
        ],
      });

      // Bar chart for biaya per kegiatan
      setBarChartData({
        labels: ['Kegiatan 127', 'Kegiatan 126', 'Kegiatan 122', 'Kegiatan 124', 'Kegiatan 123'],
        datasets: [
          {
            label: 'Total Biaya (Rp)',
            data: [3060000, 4200000, 1400000, 1400000, 1400000],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
          },
        ],
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [lineChartData, setLineChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [barChartData, setBarChartData] = useState(null);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'diajukan': return 'bg-blue-100 text-blue-800';
      case 'disetujui': return 'bg-green-100 text-green-800';
      case 'diketahui': return 'bg-purple-100 text-purple-800';
      case 'selesai': return 'bg-indigo-100 text-indigo-800';
      case 'dibatalkan': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
                  {userInfo.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Selamat Datang, {userInfo.fullName}!
                </h1>
                <p className="text-blue-100 mb-2">
                  Anda login sebagai <span className="font-semibold">{userInfo.jabatan}</span>
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {userInfo.roles?.map((role, index) => (
                    <span 
                      key={index}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        role.toLowerCase().includes('ppk')
                          ? 'bg-yellow-500 text-white'
                          : role.toLowerCase().includes('admin')
                          ? 'bg-red-500 text-white'
                          : role.toLowerCase().includes('kabalai')
                          ? 'bg-purple-500 text-white'
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
                    <span className="text-sm text-blue-100">NIP: {userInfo.nip}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-white mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-100">{userInfo.jabatan}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Sistem Nominatif</div>
                <div className="text-lg text-blue-100 mb-2">Kegiatan Perjalanan Dinas</div>
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    userInfo.role === 'PPK' 
                      ? 'bg-yellow-500 text-white'
                      : userInfo.role === 'Admin'
                      ? 'bg-red-500 text-white'
                      : userInfo.role === 'Kabalai'
                      ? 'bg-purple-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {userInfo.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Kegiatan</p>
                <p className="text-2xl font-bold">{dashboardStats.totalKegiatan}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kegiatan Disetujui</p>
                <p className="text-2xl font-bold">{dashboardStats.kegiatanDisetujui}</p>
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
                <p className="text-sm text-gray-500">Kegiatan Diajukan</p>
                <p className="text-2xl font-bold">{dashboardStats.kegiatanDiajukan}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Biaya</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardStats.totalBiaya)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Kegiatan Trends Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Trend Kegiatan {selectedYear}</h2>
                <p className="text-gray-500">Perkembangan kegiatan per bulan</p>
              </div>
              <select 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="ml-4 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedYear}
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
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
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value + ' kegiatan';
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Status Distribution Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Distribusi Status Kegiatan</h2>
            {pieChartData && (
              <div className="h-64">
                <Pie 
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Recent Kegiatan and Biaya Chart */}
        {/* Recent Kegiatan and Biaya Chart */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  {/* Recent Kegiatan */}
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">Kegiatan Terbaru</h2>
      <a href="/nominatif" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
        Lihat Semua →
      </a>
    </div>
    
    <div className="space-y-4">
      {recentKegiatan.map((kegiatan) => (
        <div key={kegiatan.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors group">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <h3 className="font-medium text-gray-900 truncate">
                  {kegiatan.kegiatan}
                </h3>
                {/* Tooltip untuk judul panjang */}
                {kegiatan.kegiatan.length > 60 && (
                  <div className="absolute z-10 invisible group-hover:visible bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-sm rounded-lg opacity-90 transition-opacity">
                    {kegiatan.kegiatan}
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                ID: {kegiatan.id} • {kegiatan.jumlah_pegawai} pegawai
              </p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(kegiatan.status)}`}>
              {formatStatus(kegiatan.status)}
            </span>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="text-sm text-gray-600">
              Biaya: <span className="font-medium">{formatCurrency(kegiatan.total_biaya)}</span>
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap">
              {kegiatan.tanggal_diajukan || kegiatan.tanggal_disetujui ? 
                new Date(kegiatan.tanggal_diajukan || kegiatan.tanggal_disetujui).toLocaleDateString('id-ID') : 
                '-'}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>

        {/* Biaya per Kegiatan Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Biaya per Kegiatan</h2>
          {barChartData && (
            <div className="h-64">
              <Bar 
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return 'Rp ' + (value / 1000000).toFixed(1) + ' jt';
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Akses Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/nominatif" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="text-blue-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Buat Nominatif
              </div>
              <p className="text-sm text-gray-600 mt-1">Buat pengajuan kegiatan baru</p>
            </a>
            
            <a href="/nominatif/list" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="text-green-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Daftar Kegiatan
              </div>
              <p className="text-sm text-gray-600 mt-1">Lihat semua kegiatan</p>
            </a>
            
            <a href="/pegawai" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="text-purple-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Data Pegawai
              </div>
              <p className="text-sm text-gray-600 mt-1">Kelola data pegawai</p>
            </a>
            
            <a href="/laporan" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <div className="text-yellow-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Laporan
              </div>
              <p className="text-sm text-gray-600 mt-1">Buat dan lihat laporan</p>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;