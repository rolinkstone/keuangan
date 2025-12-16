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

// Mapping kode MAK ke nama lengkap
const MAK_DESCRIPTIONS = {
  'PDD': 'Pengembangan dan Pemberdayaan Masyarakat Perikanan',
  'QCD': 'Pengawasan Mutu dan Keamanan Hasil Perikanan',
  'QIC': 'Inspeksi dan Sertifikasi Perikanan',
  'BAH': 'Pengelolaan Sumber Daya Hayati Perikanan',
  'QCA': 'Pengawasan dan Audit Mutu',
  'PPK': 'Pelatihan dan Pengembangan Kapasitas',
  'RES': 'Penelitian dan Pengembangan',
  'MON': 'Monitoring dan Evaluasi',
  'ADM': 'Administrasi dan Manajemen'
};

// Warna untuk setiap kode MAK
const MAK_COLORS = {
  'PDD': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', fill: 'bg-blue-500' },
  'QCD': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', fill: 'bg-green-500' },
  'QIC': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', fill: 'bg-yellow-500' },
  'BAH': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', fill: 'bg-purple-500' },
  'QCA': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', fill: 'bg-red-500' },
  'PPK': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', fill: 'bg-indigo-500' },
  'RES': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', fill: 'bg-pink-500' },
  'MON': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', fill: 'bg-gray-500' },
  'ADM': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', fill: 'bg-orange-500' }
};

const getMAKColor = (kodeMak) => {
  return MAK_COLORS[kodeMak] || MAK_COLORS.ADM;
};

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

  // State untuk data realisasi MAK
  const [realisasiMAKData, setRealisasiMAKData] = useState([]);
  const [makRealisasiLoading, setMakRealisasiLoading] = useState(true);
  const [totalRealisasi, setTotalRealisasi] = useState({
    totalKegiatan: 0,
    totalBiaya: 0,
    totalPegawai: 0,
    totalOutput: 0,
    rataBiayaPerKegiatan: 0
  });

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
      // Fetch realisasi MAK data
      fetchRealisasiMAKData();
    }
  }, [session, selectedYear]);

  // Fetch data realisasi berdasarkan MAK dari API
  const fetchRealisasiMAKData = async () => {
    try {
      setMakRealisasiLoading(true);
      
      const response = await fetch(`/api/kegiatan/realisasi-mak?tahun=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch MAK data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRealisasiMAKData(data.data);
        setTotalRealisasi({
          totalKegiatan: data.summary.total_kegiatan,
          totalBiaya: data.summary.total_biaya,
          totalPegawai: data.summary.total_pegawai,
          totalOutput: data.summary.total_output,
          rataBiayaPerKegiatan: data.summary.rata_biaya_per_kegiatan
        });
      } else {
        // Fallback to mock data if API fails
        console.warn('API failed, using mock data:', data.message);
        fetchMockRealisasiData();
      }
      
    } catch (error) {
      console.error('Error fetching realisasi MAK data:', error);
      // Fallback to mock data
      fetchMockRealisasiData();
    } finally {
      setMakRealisasiLoading(false);
    }
  };

  // Mock data fallback
  const fetchMockRealisasiData = async () => {
    // Mock data based on SQL structure
    const mockData = [
      {
        mak: '3165.QCD.052.050.500204.V',
        kode_mak: 'QCD',
        jumlah_kegiatan: 1,
        total_biaya: 1400000,
        jumlah_pegawai: 2,
        realisasi_output: 1,
        kegiatan_ids: '150',
        tanggal_mulai: '2025-12-16',
        tanggal_selesai: '2025-12-16',
        detail: [
          {
            id: 150,
            kegiatan: 'Pengawasan Mutu Hasil Perikanan di Lamandau',
            mak: '3165.QCD.052.050.500204.V',
            nama_pegawai: 'John Doe',
            nip: '1980123456789101',
            realisasi_output: 1,
            biaya: 1400000,
            created_at: '2025-12-16 12:53:39',
            tanggal_disetujui: '2025-12-16 13:37:15',
            no_st: 'ST/BPPK/2025/001'
          }
        ]
      },
      {
        mak: '3165.QCD.001.056.524111.C',
        kode_mak: 'QCD',
        jumlah_kegiatan: 1,
        total_biaya: 1200000,
        jumlah_pegawai: 1,
        realisasi_output: 1,
        kegiatan_ids: '151',
        tanggal_mulai: '2025-12-16',
        tanggal_selesai: '2025-12-16',
        detail: [
          {
            id: 151,
            kegiatan: 'Pengawasan Keamanan Hasil Perikanan di Seruyan',
            mak: '3165.QCD.001.056.524111.C',
            nama_pegawai: 'Jane Smith',
            nip: '1985123456789102',
            realisasi_output: 1,
            biaya: 1200000,
            created_at: '2025-12-16 12:55:25',
            tanggal_disetujui: '2025-12-16 13:37:11',
            no_st: 'ST/BPPK/2025/001'
          }
        ]
      },
      {
        mak: '3165.QIC.052.050.500204.V',
        kode_mak: 'QIC',
        jumlah_kegiatan: 1,
        total_biaya: 1100000,
        jumlah_pegawai: 1,
        realisasi_output: 1,
        kegiatan_ids: '152',
        tanggal_mulai: '2025-12-16',
        tanggal_selesai: '2025-12-16',
        detail: [
          {
            id: 152,
            kegiatan: 'Inspeksi Sarana Perikanan di Lingga',
            mak: '3165.QIC.052.050.500204.V',
            nama_pegawai: 'Bob Wilson',
            nip: '1990123456789103',
            realisasi_output: 1,
            biaya: 1100000,
            created_at: '2025-12-16 13:30:12',
            tanggal_disetujui: '2025-12-16 13:37:03',
            no_st: 'ST/BPPK/2025/001'
          }
        ]
      },
      {
        mak: '3165.PDD.001.056.524111.C',
        kode_mak: 'PDD',
        jumlah_kegiatan: 1,
        total_biaya: 1300000,
        jumlah_pegawai: 2,
        realisasi_output: 1,
        kegiatan_ids: '153',
        tanggal_mulai: '2025-12-16',
        tanggal_selesai: '2025-12-16',
        detail: [
          {
            id: 153,
            kegiatan: 'Pemberdayaan Masyarakat Perikanan di Tanjung Pinang',
            mak: '3165.PDD.001.056.524111.C',
            nama_pegawai: 'Alice Johnson',
            nip: '1988123456789104',
            realisasi_output: 1,
            biaya: 1300000,
            created_at: '2025-12-16 13:38:56',
            tanggal_disetujui: '2025-12-16 14:19:39',
            no_st: 'ST/BPPK/2025/001'
          }
        ]
      }
    ];

    // Group by kode_mak
    const groupedData = {};
    mockData.forEach(item => {
      const kode = item.kode_mak;
      if (!groupedData[kode]) {
        groupedData[kode] = {
          mak: item.mak,
          kode_mak: kode,
          jumlah_kegiatan: 0,
          total_biaya: 0,
          jumlah_pegawai: 0,
          realisasi_output: 0,
          kegiatan_ids: [],
          detail: [],
          tanggal_mulai: null,
          tanggal_selesai: null
        };
      }
      
      groupedData[kode].jumlah_kegiatan += item.jumlah_kegiatan;
      groupedData[kode].total_biaya += item.total_biaya;
      groupedData[kode].jumlah_pegawai += item.jumlah_pegawai;
      groupedData[kode].realisasi_output += item.realisasi_output;
      groupedData[kode].kegiatan_ids.push(item.kegiatan_ids);
      groupedData[kode].detail.push(...item.detail);
      
      if (!groupedData[kode].tanggal_mulai || item.tanggal_mulai < groupedData[kode].tanggal_mulai) {
        groupedData[kode].tanggal_mulai = item.tanggal_mulai;
      }
      if (!groupedData[kode].tanggal_selesai || item.tanggal_selesai > groupedData[kode].tanggal_selesai) {
        groupedData[kode].tanggal_selesai = item.tanggal_selesai;
      }
    });

    const result = Object.values(groupedData);
    
    // Calculate totals
    const totalKegiatan = result.reduce((sum, item) => sum + item.jumlah_kegiatan, 0);
    const totalBiaya = result.reduce((sum, item) => sum + item.total_biaya, 0);
    const totalPegawai = result.reduce((sum, item) => sum + item.jumlah_pegawai, 0);
    const totalOutput = result.reduce((sum, item) => sum + item.realisasi_output, 0);

    setRealisasiMAKData(result);
    setTotalRealisasi({
      totalKegiatan,
      totalBiaya,
      totalPegawai,
      totalOutput,
      rataBiayaPerKegiatan: totalKegiatan > 0 ? Math.round(totalBiaya / totalKegiatan) : 0
    });
  };

  // Fetch dashboard statistics and recent kegiatan
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real data from API
      const response = await fetch('/api/kegiatan', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDashboardStats({
            totalKegiatan: data.count,
            kegiatanDraft: data.status_summary?.draft || 0,
            kegiatanDiajukan: data.status_summary?.diajukan || 0,
            kegiatanDisetujui: data.status_summary?.disetujui || 0,
            totalPegawai: 0, // You need to calculate this from detail
            totalBiaya: 0 // You need to calculate this from detail
          });
          
          // Take only recent 5 kegiatan
          setRecentKegiatan(data.data.slice(0, 5));
        }
      }
      
      // Chart data
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
        

        {/* Tabel Realisasi Berdasarkan MAK */}
        {/* Tabel Realisasi Berdasarkan MAK */}
<div className="bg-white rounded-lg shadow-md mb-8">
  <div className="p-6 border-b border-gray-200">
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Realisasi Kegiatan Berdasarkan MAK</h2>
        <p className="text-sm text-gray-600 mt-1">Data kegiatan yang telah selesai berdasarkan Mata Anggaran Kegiatan</p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Tahun:</span>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600 flex items-center">
          <span className="font-medium">Status:</span>
          <span className="ml-2 px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-medium">Selesai</span>
        </div>
        <button 
          onClick={fetchRealisasiMAKData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  </div>

  {/* Summary Cards */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-gray-200 bg-gray-50">
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Kegiatan Selesai</p>
          <p className="text-xl font-bold">{totalRealisasi.totalKegiatan}</p>
        </div>
      </div>
    </div>
    
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Biaya</p>
          <p className="text-xl font-bold">{formatCurrency(totalRealisasi.totalBiaya)}</p>
        </div>
      </div>
    </div>
    
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Pegawai</p>
          <p className="text-xl font-bold">{totalRealisasi.totalPegawai}</p>
        </div>
      </div>
    </div>
    
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">Rata-rata Biaya/Kegiatan</p>
          <p className="text-xl font-bold">{formatCurrency(totalRealisasi.rataBiayaPerKegiatan)}</p>
        </div>
      </div>
    </div>
  </div>

  {/* Tabel Realisasi MAK */}
  <div className="overflow-x-auto">
    {makRealisasiLoading ? (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Memuat data realisasi MAK...</p>
      </div>
    ) : realisasiMAKData.length === 0 ? (
      <div className="text-center p-8 text-gray-500">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Tidak ada data realisasi untuk tahun {selectedYear}</p>
        <p className="text-sm mt-2">Data akan muncul setelah ada kegiatan dengan status "Selesai"</p>
      </div>
    ) : (
      <>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                KODE MAK
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                NAMA MAK
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                JUMLAH KEGIATAN
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                TOTAL BIAYA
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                DETAIL
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {realisasiMAKData.map((item, index) => {
              const makColor = getMAKColor(item.kode_mak);
              const makDescription = MAK_DESCRIPTIONS[item.kode_mak] || item.kode_mak;
              
              return (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 transition-colors ${makColor.bg} ${makColor.border} border-l-4`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${makColor.fill}`}></div>
                      <div>
                        <span className="font-bold text-lg text-gray-900 block">{item.kode_mak}</span>
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {item.mak}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {makDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-xl font-bold text-gray-900">{item.jumlah_kegiatan}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.persen_kegiatan || 0}% dari total
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatCurrency(item.total_biaya || 0)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.persen_biaya || 0}% dari total
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Rata-rata: {formatCurrency(item.rata_biaya_per_kegiatan || 0)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        // Toggle detail view
                        const newData = [...realisasiMAKData];
                        newData[index].showDetail = !newData[index].showDetail;
                        setRealisasiMAKData(newData);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.showDetail ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                      </svg>
                      {item.showDetail ? 'Sembunyikan' : 'Lihat'} Detail
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {/* Total Row */}
            <tr className="bg-gray-50 font-medium border-t-2 border-gray-300">
              <td className="px-6 py-4 font-bold text-gray-900">TOTAL</td>
              <td className="px-6 py-4 text-gray-500">Semua MAK</td>
              <td className="px-6 py-4 font-bold text-gray-900 text-xl">{totalRealisasi.totalKegiatan}</td>
              <td className="px-6 py-4 font-bold text-gray-900 text-xl">{formatCurrency(totalRealisasi.totalBiaya)}</td>
              <td className="px-6 py-4"></td>
            </tr>
          </tbody>
        </table>

        {/* Detail Sections untuk setiap MAK */}
        {realisasiMAKData.map((item, index) => (
          item.showDetail && item.kegiatan_list && item.kegiatan_list.length > 0 && (
            <div key={`detail-${index}`} className="border-t border-gray-200 bg-gray-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Detail Kegiatan untuk MAK: {item.kode_mak} - {MAK_DESCRIPTIONS[item.kode_mak] || item.kode_mak}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {item.kegiatan_list.length} kegiatan ditemukan
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Total: {formatCurrency(item.total_biaya || 0)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kegiatan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. ST</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pegawai</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {item.kegiatan_list.map((kegiatan, kgIndex) => (
                        <tr key={kgIndex} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {kegiatan.id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {kegiatan.kegiatan}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Status: <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(kegiatan.status)}`}>
                                {formatStatus(kegiatan.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {kegiatan.no_st || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(kegiatan.tanggal_disetujui)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              {kegiatan.pegawai} orang
                            </div>
                            {kegiatan.detail_pegawai && kegiatan.detail_pegawai.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {kegiatan.detail_pegawai.slice(0, 2).map((p, idx) => (
                                  <div key={idx}>{p.nama_pegawai}</div>
                                ))}
                                {kegiatan.detail_pegawai.length > 2 && (
                                  <div>+{kegiatan.detail_pegawai.length - 2} lainnya</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(kegiatan.biaya || 0)}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Subtotal per MAK */}
                      <tr className="bg-gray-50 font-medium">
                        <td colSpan="4" className="px-4 py-3 text-right text-sm text-gray-700">
                          Subtotal {item.kode_mak}:
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.jumlah_pegawai} orang
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          {formatCurrency(item.total_biaya || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        ))}
      </>
    )}
  </div>

  {/* Legend */}
  {realisasiMAKData.length > 0 && (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-600">Keterangan MAK:</span>
        {realisasiMAKData.map((item) => {
          const makColor = getMAKColor(item.kode_mak);
          return (
            <div key={item.kode_mak} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${makColor.fill}`}></div>
              <span className="text-xs font-medium text-gray-600">{item.kode_mak}</span>
              <span className="text-xs text-gray-500 ml-1">
                ({MAK_DESCRIPTIONS[item.kode_mak]?.substring(0, 20)}...)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  )}
</div>

        {/* Recent Kegiatan and Biaya Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Kegiatan */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Kegiatan Terbaru</h2>
              <a href="/nominatif/list" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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
                        ID: {kegiatan.id} • MAK: {kegiatan.mak?.substring(0, 20)}...
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ml-2 ${getStatusColor(kegiatan.status)}`}>
                      {formatStatus(kegiatan.status)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-gray-600">
                      {kegiatan.tanggal_diajukan ? 'Diajukan' : 'Dibuat'}: 
                      <span className="font-medium ml-1">
                        {formatDate(kegiatan.tanggal_diajukan || kegiatan.created_at)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {kegiatan.ppk_nama ? `PPK: ${kegiatan.ppk_nama}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Statistik Kegiatan {selectedYear}</h2>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                {[2023, 2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {lineChartData && (
              <Line 
                data={lineChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Trend Kegiatan Bulanan'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Jumlah Kegiatan'
                      }
                    }
                  }
                }}
              />
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
            
            <a href="/laporan/realisasi-mak" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <div className="text-yellow-600 font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Laporan Realisasi
              </div>
              <p className="text-sm text-gray-600 mt-1">Laporan realisasi MAK</p>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;