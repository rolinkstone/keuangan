// pages/kegiatan/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { getSession } from 'next-auth/react';
import { handlePrint } from '../../utils/printUtils';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import KegiatanForm from '../../components/kegiatan/KegiatanForm';
import FilterSection from '../../components/kegiatan/FilterSection';
import NotificationModal from '../../components/kegiatan/NotificationModal';
import ConfirmDeleteModal from '../../components/kegiatan/ConfirmDeleteModal';
import KirimPPKModal from '../../components/kegiatan/KirimPPKModal';
import PersetujuanModal from '../../components/kegiatan/PersetujuanModal';
import MengetahuiModal from '../../components/kegiatan/MengetahuiModal';
import HistoriModal from '../../components/kegiatan/HistoriModal';
import SuratTugasModal from '../../components/kegiatan/SuratTugasModal';

import axios from 'axios';

const ITEMS_PER_PAGE = 10;



export default function KegiatanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    // State utama
    const [kegiatanList, setKegiatanList] = useState([]);
    const [filteredKegiatan, setFilteredKegiatan] = useState([]);
    const [detailShown, setDetailShown] = useState({});
    const [detailData, setDetailData] = useState({});
    const [pegawaiDetailShown, setPegawaiDetailShown] = useState({});
    
    // State form
    const [showForm, setShowForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        kegiatan: '',
        mak: '',
        realisasi_anggaran_sebelumnya: '',
        target_output_tahun: '',
        realisasi_output_sebelumnya: '',
        target_output_yg_akan_dicapai: '',
        kota_kab_kecamatan: '',
        rencana_tanggal_pelaksanaan: '',
        user_id: ''
    });
    
    const [pegawaiList, setPegawaiList] = useState([
        {
            nama: '',
            nip: '',
            jabatan: '',
            total_biaya: 0,
            biaya: [{
                transportasi: [{ trans: '', harga: '', total: '' }],
                uang_harian_items: [{ jenis: '', qty: '', harga: '', total: '' }],
                penginapan_items: [{ jenis: '', qty: '', harga: '', total: '' }]
            }]
        }
    ]);
    
    // State UI
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    
    // State filter
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterMak, setFilterMak] = useState('');
    const [filterLokasi, setFilterLokasi] = useState('');
    
    // State modal
    const [modalOpen, setModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    
    // State untuk modals tambahan
    const [showKirimPPKModal, setShowKirimPPKModal] = useState(false);
    const [selectedKegiatanForPPK, setSelectedKegiatanForPPK] = useState(null);
    const [showPersetujuanModal, setShowPersetujuanModal] = useState(false);
    const [selectedKegiatanForPersetujuan, setSelectedKegiatanForPersetujuan] = useState(null);
    const [showMengetahuiModal, setShowMengetahuiModal] = useState(false);
    const [selectedKegiatanForMengetahui, setSelectedKegiatanForMengetahui] = useState(null);
    
    // State untuk Surat Tugas Modal
    const [showSuratTugasModal, setShowSuratTugasModal] = useState(false);
    const [selectedKegiatanForST, setSelectedKegiatanForST] = useState(null);
    
    // State untuk HistoriModal
    const [showHistoriModal, setShowHistoriModal] = useState(false);
    const [selectedHistoriItem, setSelectedHistoriItem] = useState(null);
    
    // State user info
    const [userRole, setUserRole] = useState('');
    const [userType, setUserType] = useState({
        isAdmin: false,
        isPPK: false,
        isKabalai: false,
        isRegularUser: false
    });

    // Helper functions
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const formatRupiah = (number) => {
        if (number === undefined || number === null) return '0';
        return Number(number).toLocaleString('id-ID');
    };

    // PERBAIKAN: Fungsi renderStatusBadge yang sesuai dengan backend
    const renderStatusBadge = (status, no_st = null, tgl_st = null) => {
        let bgColor = '';
        let textColor = '';
        let displayText = '';
        let icon = null;
        
        // LOGIKA UTAMA SESUAI BACKEND:
        // Jika ada no_st DAN tgl_st, maka status SELESAI (warna hijau)
        // PERHATIKAN: Backend hanya mengubah status menjadi 'selesai' ketika kedua field terisi
        const hasNoST = no_st && String(no_st).trim().length > 0;
        const hasTglST = tgl_st && String(tgl_st).trim().length > 0;
        const isSuratTugasComplete = hasNoST && hasTglST;
        
        // PERBAIKAN: Jika surat tugas lengkap (ada no_st dan tgl_st), tampilkan "Selesai"
        // Meskipun di database status masih 'diketahui' atau lainnya
        if (isSuratTugasComplete) {
            bgColor = 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300';
            textColor = 'text-green-800';
            displayText = 'Selesai';
            icon = (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            );
        } else {
            // Jika surat tugas belum lengkap, tampilkan status normal
            switch (status) {
                case 'draft':
                    bgColor = 'bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300';
                    textColor = 'text-gray-700';
                    displayText = 'Draft';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    );
                    break;
                case 'diajukan':
                    bgColor = 'bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300';
                    textColor = 'text-amber-800';
                    displayText = 'Diajukan';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5.586L4.707 4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L11 9.586V4a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    );
                    break;
                case 'disetujui':
                    bgColor = 'bg-gradient-to-r from-blue-100 to-sky-100 border border-blue-300';
                    textColor = 'text-blue-800';
                    displayText = 'Disetujui';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    );
                    break;
                case 'diketahui':
                    bgColor = 'bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-300';
                    textColor = 'text-indigo-800';
                    displayText = 'Diketahui';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    );
                    break;
                case 'dikembalikan':
                    bgColor = 'bg-gradient-to-r from-rose-100 to-red-100 border border-rose-300';
                    textColor = 'text-rose-800';
                    displayText = 'Dikembalikan';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                    );
                    break;
                case 'selesai':
                    // Case ini untuk konsistensi jika backend sudah update status ke 'selesai'
                    bgColor = 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300';
                    textColor = 'text-green-800';
                    displayText = 'Selesai';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    );
                    break;
                case 'dibatalkan':
                    bgColor = 'bg-gradient-to-r from-gray-300 to-gray-400 border border-gray-400';
                    textColor = 'text-gray-900';
                    displayText = 'Dibatalkan';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    );
                    break;
                default:
                    bgColor = 'bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300';
                    textColor = 'text-gray-700';
                    displayText = status || 'Draft';
                    icon = (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                    );
            }
        }
        
        return (
            <span className={`px-3 py-1.5 text-xs font-medium rounded-full flex items-center ${bgColor} ${textColor} shadow-sm`}>
                {icon}
                {displayText}
            </span>
        );
    };

    // Handler untuk HistoriModal
    const handleOpenHistoriModal = (item) => {
        console.log('Opening historial modal for item:', {
            id: item.id,
            status: item.status,
            no_st: item.no_st,
            tgl_st: item.tgl_st,
            semuaProperti: Object.keys(item)
        });
        
        // Tambahkan log semua properti untuk debugging
        console.log('All item properties:');
        Object.keys(item).forEach(key => {
            console.log(`${key}:`, item[key]);
        });
        
        setSelectedHistoriItem(item);
        setShowHistoriModal(true);
    };

    const handleCloseHistoriModal = () => {
        setShowHistoriModal(false);
        setSelectedHistoriItem(null);
    };

    // Calculate total nominatif
    const calculateTotalNominatif = async (id) => {
        try {
            let data = detailData[id];
            if (!data) {
                const res = await axios.get(`http://localhost:5000/api/kegiatan/${id}/detail`, {
                    headers: { 
                        Authorization: `Bearer ${session?.accessToken}` 
                    },
                });
                if (res.data.success) {
                    data = res.data.data;
                    setDetailData(prev => ({ ...prev, [id]: data }));
                }
            }

            if (data && data.pegawai) {
                let total = 0;
                data.pegawai.forEach(p => {
                    if (p.biaya_list) {
                        p.biaya_list.forEach(b => {
                            const totalTransport = b.transportasi.reduce((sum, t) => sum + Number(t.total || 0), 0);
                            const totalUH = b.uang_harian.reduce((sum, u) => sum + Number(u.total || 0), 0);
                            const totalPenginapan = b.penginapan.reduce((sum, p) => sum + Number(p.total || 0), 0);
                            total += totalTransport + totalUH + totalPenginapan;
                        });
                    }
                });

                setKegiatanList(prev =>
                    prev.map(k => (k.id === id ? { ...k, total_nominatif: total } : k))
                );
                setFilteredKegiatan(prev =>
                    prev.map(k => (k.id === id ? { ...k, total_nominatif: total } : k))
                );
            }
        } catch (error) {
            console.error('Error calculating total nominatif:', error);
            setNotificationMessage('Gagal menghitung total nominatif!');
            setModalOpen(true);
        }
    };

    // Modal handlers
    const handleOpenKirimPPKModal = (id) => {
        setSelectedKegiatanForPPK(id);
        setShowKirimPPKModal(true);
    };

    const handleOpenPersetujuanModal = (id, kegiatanData) => {
        setSelectedKegiatanForPersetujuan({ id, ...kegiatanData });
        setShowPersetujuanModal(true);
    };

    const handleOpenMengetahuiModal = (id, kegiatanData) => {
        setSelectedKegiatanForMengetahui({ id, ...kegiatanData });
        setShowMengetahuiModal(true);
    };

    // Handler untuk Surat Tugas Modal - PERBAIKAN LOGIKA
    const handleOpenSuratTugasModal = (item) => {
        // Sesuai backend: hanya untuk regular user
        if (!userType.isRegularUser) {
            setNotificationMessage('Hanya user biasa yang dapat merekam surat tugas');
            setModalOpen(true);
            return;
        }
        
        // PERBAIKAN: Sesuai backend, hanya status 'diketahui' yang bisa rekam ST
        if (item.status !== 'diketahui') {
            setNotificationMessage(`Kegiatan dengan status "${item.status}" tidak dapat direkam surat tugas. Hanya kegiatan dengan status "diketahui" yang dapat direkam surat tugas.`);
            setModalOpen(true);
            return;
        }
        
        // PERBAIKAN: Cek apakah sudah ada no_st (jika ada, tidak perlu tombol muncul)
        if (item.no_st && item.no_st.trim().length > 0) {
            setNotificationMessage('Surat Tugas sudah direkam sebelumnya');
            setModalOpen(true);
            return;
        }
        
        setSelectedKegiatanForST(item);
        setShowSuratTugasModal(true);
    };

    // Extract user info dari session
    useEffect(() => {
        if (session) {
            const userData = session.user || {};
            
            let roles = [];
            if (userData.role) {
                roles = Array.isArray(userData.role) ? userData.role : [userData.role];
            } else if (userData.roles && Array.isArray(userData.roles)) {
                roles = userData.roles;
            }
            
            if (roles.length > 0) {
                setUserRole(roles[0]);
            }
            
            const isAdmin = roles.some(role => role.toLowerCase() === 'admin');
            const isPPK = roles.some(role => role.toLowerCase() === 'ppk');
            const isKabalai = roles.some(role => role.toLowerCase().includes('kabalai'));
            const isRegularUser = !isAdmin && !isPPK && !isKabalai;
            
            setUserType({
                isAdmin,
                isPPK,
                isKabalai,
                isRegularUser
            });
        }
    }, [session]);

    // Auth check dan fetch data kegiatan
    useEffect(() => {
        const checkAuthAndFetch = async () => {
            if (status === 'loading') {
                return;
            }
            
            if (!session) {
                router.push('/login');
            } else {
                await fetchKegiatan();
            }
        };

        checkAuthAndFetch();
    }, [session, status, router]);

    // PERBAIKAN: Fetch data kegiatan dengan logika status yang benar
    const fetchKegiatan = async (showLoading = false) => {
        if (!session?.accessToken) {
            console.error('No access token available');
            setNotificationMessage('Token tidak ditemukan. Silakan login kembali.');
            setModalOpen(true);
            router.push('/login');
            return;
        }

        if (showLoading) {
            setFormLoading(true);
        }

        try {
            const res = await axios.get('http://localhost:5000/api/kegiatan', {
                headers: { 
                    Authorization: `Bearer ${session.accessToken}` 
                },
                timeout: 10000
            });
            
            console.log('Kegiatan response:', {
                success: res.data.success,
                count: res.data.data?.length,
                sampleItem: res.data.data?.[0] ? {
                    id: res.data.data[0].id,
                    no_st: res.data.data[0].no_st,
                    tgl_st: res.data.data[0].tgl_st,
                    status: res.data.data[0].status,
                    semuaField: Object.keys(res.data.data[0])
                } : 'no data'
            });
            
            if (res.data.success && Array.isArray(res.data.data)) {
                // PERBAIKAN: Tidak perlu manipulasi status di frontend
                // Biarkan backend yang menentukan status
                // Frontend hanya menampilkan sesuai data dari backend
                const sortedData = [...res.data.data].sort((a, b) => {
                    return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
                });
                
                setKegiatanList(sortedData);
                setFilteredKegiatan(sortedData);
                setDetailData({});
                setDetailShown({});
                setPegawaiDetailShown({});
            } else {
                setKegiatanList([]);
                setFilteredKegiatan([]);
            }
        } catch (error) {
            console.error('Error fetching kegiatan:', error);
            
            if (error.response?.status === 401) {
                setNotificationMessage('Session expired. Silakan login kembali.');
                setModalOpen(true);
                await signOut({ callbackUrl: '/login' });
            } else {
                setNotificationMessage('Gagal memuat data kegiatan. Silakan coba lagi.');
                setModalOpen(true);
            }
            
            setKegiatanList([]);
            setFilteredKegiatan([]);
        } finally {
            if (showLoading) {
                setFormLoading(false);
            }
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            kegiatan: '',
            mak: '',
            realisasi_anggaran_sebelumnya: '',
            target_output_tahun: '',
            realisasi_output_sebelumnya: '',
            target_output_yg_akan_dicapai: '',
            kota_kab_kecamatan: '',
            rencana_tanggal_pelaksanaan: '',
            user_id: ''
        });
        
        setPegawaiList([
            {
                nama: '',
                nip: '',
                jabatan: '',
                total_biaya: 0,
                biaya: [{
                    transportasi: [{ trans: '', harga: '', total: '' }],
                    uang_harian_items: [{ jenis: '', qty: '', harga: '', total: '' }],
                    penginapan_items: [{ jenis: '', qty: '', harga: '', total: '' }]
                }]
            }
        ]);
        
        setShowForm(false);
        setIsEditMode(false);
        setEditId(null);
        setFormError('');
    };

    // Handle submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        try {
            if (!session?.accessToken) {
                console.error('No access token available');
                setNotificationMessage('Token tidak ditemukan. Silakan login kembali.');
                setModalOpen(true);
                router.push('/login');
                return;
            }

            // Validasi
            if (!formData.kegiatan.trim()) {
                setFormError('Nama Kegiatan wajib diisi');
                setFormLoading(false);
                return;
            }

            if (!formData.mak.trim()) {
                setFormError('MAK wajib diisi');
                setFormLoading(false);
                return;
            }

            // Persiapkan payload
            const payload = {
                ...formData,
                pegawai: pegawaiList.map(pegawai => ({
                    nama: pegawai.nama || '',
                    nip: pegawai.nip || '',
                    jabatan: pegawai.jabatan || '',
                    total_biaya: pegawai.total_biaya || 0,
                    biaya: pegawai.biaya.map(biaya => ({
                        transportasi: biaya.transportasi
                            .filter(t => t.trans || t.harga || t.total)
                            .map(t => ({
                                trans: t.trans || '',
                                harga: Number(t.harga) || 0,
                                total: Number(t.total) || 0
                            })),
                        uang_harian_items: biaya.uang_harian_items
                            .filter(u => u.jenis || u.qty || u.harga || u.total)
                            .map(u => ({
                                jenis: u.jenis || '',
                                qty: Number(u.qty) || 0,
                                harga: Number(u.harga) || 0,
                                total: Number(u.total) || 0
                            })),
                        penginapan_items: biaya.penginapan_items
                            .filter(p => p.jenis || p.qty || p.harga || p.total)
                            .map(p => ({
                                jenis: p.jenis || '',
                                qty: Number(p.qty) || 0,
                                harga: Number(p.harga) || 0,
                                total: Number(p.total) || 0
                            }))
                    }))
                }))
            };

            let response;
            
            if (isEditMode && editId) {
                response = await axios.put(`http://localhost:5000/api/kegiatan/${editId}`, payload, {
                    headers: { 
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                response = await axios.post('http://localhost:5000/api/kegiatan', payload, {
                    headers: { 
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            const successMessage = isEditMode 
                ? 'Data kegiatan berhasil diperbarui!' 
                : 'Kegiatan baru berhasil ditambahkan!';
            
            setNotificationMessage(response.data.message || successMessage);
            setModalOpen(true);
            resetForm();
            
            setTimeout(() => {
                fetchKegiatan(true);
            }, 500);

        } catch (error) {
            console.error('Error saving kegiatan:', error);
            console.error('Error response:', error.response?.data);
            
            const errorMsg = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Terjadi kesalahan saat menyimpan data';
            setFormError(errorMsg);
        } finally {
            setFormLoading(false);
        }
    };

    // Load data untuk edit
    const loadDataForEdit = async (id) => {
        try {
            setFormLoading(true);
            setFormError('');
            
            if (!session?.accessToken) {
                console.error('No access token available');
                setNotificationMessage('Token tidak ditemukan. Silakan login kembali.');
                setModalOpen(true);
                router.push('/login');
                return;
            }

            const response = await axios.get(`http://localhost:5000/api/kegiatan/${id}/edit`, {
                headers: { 
                    Authorization: `Bearer ${session.accessToken}` 
                }
            });

            if (response.data.success) {
                const data = response.data.data;
                
                setEditId(id);
                setIsEditMode(true);
                setShowForm(true);
                
                setFormData({
                    kegiatan: data.kegiatan || '',
                    mak: data.mak || '',
                    realisasi_anggaran_sebelumnya: data.realisasi_anggaran_sebelumnya || '',
                    target_output_tahun: data.target_output_tahun || '',
                    realisasi_output_sebelumnya: data.realisasi_output_sebelumnya || '',
                    target_output_yg_akan_dicapai: data.target_output_yg_akan_dicapai || '',
                    kota_kab_kecamatan: data.kota_kab_kecamatan || '',
                    rencana_tanggal_pelaksanaan: data.rencana_tanggal_pelaksanaan || '',
                    user_id: data.user_id || '',
                });

                if (data.pegawai && data.pegawai.length > 0) {
                    const formattedPegawai = data.pegawai.map(p => ({
                        id: p.id,
                        nama: p.nama || '',
                        nip: p.nip || '',
                        jabatan: p.jabatan || '',
                        total_biaya: p.total_biaya || 0,
                        biaya: p.biaya && p.biaya.length > 0 ? p.biaya.map(b => {
                            return {
                                transportasi: b.transportasi && b.transportasi.length > 0 
                                    ? b.transportasi.map(t => ({
                                        trans: t.trans || '',
                                        harga: t.harga || 0,
                                        total: t.total || 0
                                    }))
                                    : [{ trans: '', harga: '', total: '' }],
                                uang_harian_items: b.uang_harian_items && b.uang_harian_items.length > 0
                                    ? b.uang_harian_items.map(u => ({
                                        jenis: u.jenis || '',
                                        qty: u.qty || 0,
                                        harga: u.harga || 0,
                                        total: u.total || 0
                                    }))
                                    : [{ jenis: '', qty: '', harga: '', total: '' }],
                                penginapan_items: b.penginapan_items && b.penginapan_items.length > 0
                                    ? b.penginapan_items.map(pg => ({
                                        jenis: pg.jenis || '',
                                        qty: pg.qty || 0,
                                        harga: pg.harga || 0,
                                        total: pg.total || 0
                                    }))
                                    : [{ jenis: '', qty: '', harga: '', total: '' }]
                            };
                        }) 
                        : [{
                            transportasi: [{ trans: '', harga: '', total: '' }],
                            uang_harian_items: [{ jenis: '', qty: '', harga: '', total: '' }],
                            penginapan_items: [{ jenis: '', qty: '', harga: '', total: '' }]
                        }]
                    }));
                    setPegawaiList(formattedPegawai);
                } else {
                    setPegawaiList([{
                        nama: '',
                        nip: '',
                        jabatan: '',
                        total_biaya: 0,
                        biaya: [{
                            transportasi: [{ trans: '', harga: '', total: '' }],
                            uang_harian_items: [{ jenis: '', qty: '', harga: '', total: '' }],
                            penginapan_items: [{ jenis: '', qty: '', harga: '', total: '' }]
                        }]
                    }]);
                }
            }
        } catch (error) {
            console.error('Error loading data for edit:', error);
            setFormError('Gagal memuat data untuk edit: ' + (error.response?.data?.message || error.message || 'Unknown error'));
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = (id) => {
        loadDataForEdit(id);
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setConfirmDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete || !session?.accessToken) return;
        
        setDeletingId(itemToDelete);
        
        try {
            const response = await axios.delete(`http://localhost:5000/api/kegiatan/${itemToDelete}`, {
                headers: { 
                    Authorization: `Bearer ${session.accessToken}` 
                },
            });
            
            if (response.data.success) {
                setNotificationMessage(response.data.message || 'Kegiatan berhasil dihapus!');
                setConfirmDeleteModalOpen(false);
                fetchKegiatan();
            } else {
                throw new Error(response.data.message || 'Gagal menghapus kegiatan');
            }
            
        } catch (error) {
            console.error('Error deleting kegiatan:', error);
            
            let errorMessage = 'Terjadi kesalahan saat menghapus kegiatan!';
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            setNotificationMessage(errorMessage);
            setConfirmDeleteModalOpen(false);
        } finally {
            setDeletingId(null);
            setItemToDelete(null);
        }
        
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
        setDeletingId(null);
        setItemToDelete(null);
    };

    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: '/login' });
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/login');
        }
    };

    // Toggle detail kegiatan
    const toggleDetail = async (id) => {
        const newDetailShown = { ...detailShown, [id]: !detailShown[id] };
        setDetailShown(newDetailShown);

        if (newDetailShown[id] && !detailData[id]) {
            try {
                const res = await axios.get(`http://localhost:5000/api/kegiatan/${id}/detail`, {
                    headers: { 
                        Authorization: `Bearer ${session?.accessToken}` 
                    }
                });
                if (res.data.success) {
                    setDetailData(prev => ({ ...prev, [id]: res.data.data }));
                }
            } catch (error) {
                console.error('Error fetching detail:', error);
                setNotificationMessage('Gagal memuat detail kegiatan');
                setModalOpen(true);
            }
        }
    };

    // Toggle detail pegawai
    const togglePegawaiDetail = (id) => {
        setPegawaiDetailShown(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filter data berdasarkan search term dan filter lainnya
    useEffect(() => {
        const filtered = kegiatanList.filter(item => {
            const matchesSearch = 
                item.kegiatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.mak?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = !filterStatus || item.status === filterStatus;
            
            const matchesMak = !filterMak || item.mak?.toLowerCase().includes(filterMak.toLowerCase());
            
            const matchesLokasi = !filterLokasi || item.kota_kab_kecamatan?.toLowerCase().includes(filterLokasi.toLowerCase());
            
            let matchesDate = true;
            if (filterDateFrom || filterDateTo) {
                const itemDate = new Date(item.tgl_st);
                const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
                const toDate = filterDateTo ? new Date(filterDateTo) : null;
                
                if (fromDate && toDate) {
                    matchesDate = itemDate >= fromDate && itemDate <= toDate;
                } else if (fromDate) {
                    matchesDate = itemDate >= fromDate;
                } else if (toDate) {
                    matchesDate = itemDate <= toDate;
                }
            }
            
            return matchesSearch && matchesStatus && matchesMak && matchesLokasi && matchesDate;
        });
        
        setFilteredKegiatan(filtered);
        setCurrentPage(1);
    }, [searchTerm, kegiatanList, filterStatus, filterDateFrom, filterDateTo, filterMak, filterLokasi]);

    const resetFilter = () => {
        setFilterStatus('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterMak('');
        setFilterLokasi('');
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        const sorted = [...filteredKegiatan].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setFilteredKegiatan(sorted);
    };

    // Jika session masih loading
    if (status === 'loading') {
        return (
            <DashboardLayout onLogout={handleLogout}>
                <LoadingSpinner />
            </DashboardLayout>
        );
    }

    // Jika tidak ada session
    if (!session) {
        return null;
    }

   
   const handlePrintItem = async (item) => {
  try {
    // 1. Hitung total nominatif terlebih dahulu
    await calculateTotalNominatif(item.id);
    
    // 2. Tunggu sebentar untuk memastikan state sudah terupdate
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. Ambil data yang sudah diperbarui dari state
    const updatedItem = kegiatanList.find(k => k.id === item.id) || item;
    
    // 4. Ambil data detail untuk print
    let data = detailData[item.id];
    if (!data) {
      try {
        const res = await axios.get(`http://localhost:5000/api/kegiatan/${item.id}/detail`, {
          headers: { 
            Authorization: `Bearer ${session?.accessToken}` 
          },
        });
        if (res.data.success) {
          data = res.data.data;
          setDetailData(prev => ({ ...prev, [item.id]: data }));
        }
      } catch (error) {
        console.error('Error mengambil detail data:', error);
      }
    }
    
    // 5. Gunakan data pegawai untuk print
    const pegawaiList = data?.pegawai || [];
    
    // 6. Panggil fungsi print
    handlePrint(updatedItem, pegawaiList);
    
  } catch (error) {
    console.error('Error dalam proses print:', error);
    
    // Fallback: print dengan data yang ada
    handlePrint(item, []);
    setNotificationMessage('Print berhasil, namun mungkin ada data yang belum terupdate');
    setModalOpen(true);
  }
};

    const totalItems = filteredKegiatan.length;
    const paginatedItems = filteredKegiatan.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    

    return (
        <DashboardLayout onLogout={handleLogout}>
            <div className="max-w-[95vw] mx-auto p-6 shadow-md rounded-lg overflow-x-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Nominatif Kegiatan</h2>
                        <p className="text-gray-600 mt-1">
                            User: {session.user?.name || session.user?.email || 'Unknown User'} | 
                            Role: {userRole || 'User'} | 
                            Type: {userType.isAdmin ? 'Admin' : userType.isPPK ? 'PPK' : userType.isKabalai ? 'Kabalai' : 'Regular User'}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filter
                        </button>
                        <button
                            onClick={() => fetchKegiatan(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                            disabled={formLoading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                        {userType.isRegularUser && (
                            <button
                                onClick={() => {
                                    if (isEditMode) {
                                        resetForm();
                                    } else {
                                        setShowForm(!showForm);
                                    }
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
                            >
                                {showForm ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Tutup Form
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Tambah Kegiatan Baru
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Section */}
                <FilterSection
                    showFilter={showFilter}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterDateFrom={filterDateFrom}
                    setFilterDateFrom={setFilterDateFrom}
                    filterDateTo={filterDateTo}
                    setFilterDateTo={setFilterDateTo}
                    filterMak={filterMak}
                    setFilterMak={setFilterMak}
                    filterLokasi={filterLokasi}
                    setFilterLokasi={setFilterLokasi}
                    resetFilter={resetFilter}
                    filteredKegiatan={filteredKegiatan}
                    kegiatanList={kegiatanList}
                />

                {/* Form Create/Edit Kegiatan */}
                {showForm && userType.isRegularUser && (
                    <KegiatanForm
                        editId={editId}
                        isEditMode={isEditMode}
                        formData={formData}
                        setFormData={setFormData}
                        pegawaiList={pegawaiList}
                        setPegawaiList={setPegawaiList}
                        session={session}
                        onCancel={resetForm}
                        onSubmit={handleSubmit}
                        formError={formError}
                        setFormError={setFormError}
                        formLoading={formLoading}
                        setFormLoading={setFormLoading}
                    />
                )}

                {/* Pesan untuk non-regular user */}
                {showForm && !userType.isRegularUser && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-700">
                                Hanya user biasa (regular user) yang dapat membuat atau mengedit kegiatan. 
                                {userType.isAdmin && ' Anda adalah Admin.'}
                                {userType.isPPK && ' Anda adalah PPK.'}
                                {userType.isKabalai && ' Anda adalah Kabalai.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Search Box */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by Kegiatan, No ST, atau MAK"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Informasi role user */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center text-sm">
                        <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <span className="font-medium">Akses saat ini:</span> 
                            {userType.isAdmin && ' Anda dapat melihat semua data sebagai Admin.'}
                            {userType.isPPK && ' Anda dapat melihat pengajuan yang ditujukan kepada PPK Anda.'}
                            {userType.isKabalai && ' Anda dapat mengisi form "Mengetahui" untuk kegiatan yang sudah disetujui PPK.'}
                            {userType.isRegularUser && ' Anda hanya dapat melihat dan mengelola data yang Anda buat sendiri.'}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('id')}>ID</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('status')}>Status</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('mak')}>Kegiatan & MAK & No ST</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('realisasi_anggaran_sebelumnya')}>Realisasi Anggaran Sebelumnya</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('target_output_tahun')}>Target Output 1 Tahun</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('realisasi_output_sebelumnya')}>Realisasi Output Sebelumnya</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('target_output_yg_akan_dicapai')}>Target Output Dicapai</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('kota_kab_kecamatan')}>Kota/Kabupaten/Kecamatan Kabupaten tujuan</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('rencana_tanggal_pelaksanaan')}>Rencana Tanggal Pelaksanaan</th>
                                <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('total_nominatif')}>Total Nominatif</th>
                                <th className="px-6 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
  {paginatedItems.length > 0 ? (
    paginatedItems.map(item => (
      <React.Fragment key={item.id}>
        <tr>
          <td className="px-6 py-4">{item.id}</td>
          <td className="px-6 py-4">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleOpenHistoriModal(item)}
                  className="text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2 py-1.5 rounded-md transition-colors duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 border border-blue-200 hover:border-blue-300 bg-blue-50/50"
                  title="Lihat catatan dan riwayat perubahan"
                >
                  <svg 
                    className="w-3.5 h-3.5 mr-1.5 text-blue-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  {renderStatusBadge(item.status, item.no_st, item.tgl_st)}
                </button>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="space-y-1">
              <div className="font-medium text-gray-900">
                {item.kegiatan || '-'}
              </div>
              <div className="font-medium text-gray-900">
                {item.mak || '-'}
              </div>
              <div className="font-medium text-gray-900">
                {item.no_st || '-'}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">{item.realisasi_anggaran_sebelumnya}</td>
          <td className="px-6 py-4">{item.target_output_tahun}</td>
          <td className="px-6 py-4">{item.realisasi_output_sebelumnya}</td>
          <td className="px-6 py-4">{item.target_output_yg_akan_dicapai}</td>
          <td className="px-6 py-4">{item.kota_kab_kecamatan}</td>
          <td className="px-6 py-4">{formatDateForDisplay(item.rencana_tanggal_pelaksanaan)}</td>
          <td className="px-6 py-4 font-semibold text-green-700">
            {item.total_nominatif !== undefined ? (
              <>Rp {formatRupiah(item.total_nominatif)}</>
            ) : (
              <button
                onClick={() => calculateTotalNominatif(item.id)}
                className="px-2 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500 transition"
              >
                Hitung
              </button>
            )}
          </td>
          <td className="px-6 py-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* Edit Button - hanya untuk regular user dan status draft/dikembalikan */}
                {userType.isRegularUser && 
                 (item.status === 'draft' || item.status === 'dikembalikan') && (
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M9 11l6-6 3.536 3.536L12 14H9v-3z" />
                    </svg>
                    Edit
                  </button>
                )}
                
                {/* Delete Button - hanya untuk regular user dan status draft/dikembalikan */}
                {userType.isRegularUser && 
                 (item.status === 'draft' || item.status === 'dikembalikan') && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3m-9 0h12" />
                    </svg>
                    Delete
                  </button>
                )}
                
                {/* TOMBOL PRINT - DITAMBAHKAN DISINI */}
                <button
                    onClick={() => handlePrintItem(item)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                    title="Cetak Dokumen"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                    </button>
                
                <button
                  onClick={() => toggleDetail(item.id)}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  {detailShown[item.id] ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4-10-7s4.477-7 10-7c1.15 0 2.262.183 3.315.525M9.88 9.88a3 3 0 104.24 4.24" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                  {detailShown[item.id] ? "Hide" : "Show"}
                </button>
              </div>
              
              {/* Tombol Kirim ke PPK - hanya untuk regular user dan status draft/dikembalikan */}
              {userType.isRegularUser && 
               (item.status === 'draft' || item.status === 'dikembalikan') && (
                <button
                  onClick={() => handleOpenKirimPPKModal(item.id)}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Kirim ke PPK
                </button>
              )}
              
              {/* Tombol Persetujuan - hanya untuk role PPK dan status diajukan */}
              {userType.isPPK && item.status === 'diajukan' && (
                <button
                  onClick={() => handleOpenPersetujuanModal(item.id, item)}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Persetujuan
                </button>
              )}
              
              {/* Tombol Mengetahui - hanya untuk role Kabalai dan status disetujui */}
              {userType.isKabalai && item.status === 'disetujui' && !item.nama_kabalai && (
                <button
                  onClick={() => handleOpenMengetahuiModal(item.id, item)}
                  className="flex items-center gap-2 px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Mengetahui
                </button>
              )}

              {/* PERBAIKAN: Tombol Surat Tugas - sesuai dengan logika backend */}
              {/* Hanya untuk regular user, status diketahui, dan belum ada no_st */}
              {userType.isRegularUser && 
               item.status === 'diketahui' && 
               (!item.no_st || item.no_st.trim().length === 0) && (
                <button
                  onClick={() => handleOpenSuratTugasModal(item)}
                  className="flex items-center justify-center gap-2 px-4 py-2 w-full min-w-[120px] bg-orange-600 text-white rounded-md hover:bg-orange-700 transition mt-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="whitespace-nowrap">Surat Tugas</span>
                </button>
              )}
            </div>
          </td>
        </tr>

        {detailShown[item.id] && detailData[item.id]?.pegawai?.length > 0 && (
          <tr className="bg-gray-100">
            <td colSpan={12} className="px-6 py-4">
              <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Nama</th>
                    <th className="px-4 py-2 text-left">NIP</th>
                    <th className="px-4 py-2 text-left">Jabatan</th>
                    <th className="px-4 py-2 text-left">Total Biaya</th>
                    <th className="px-4 py-2 text-left">Rincian Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData[item.id].pegawai.map(p => (
                    <React.Fragment key={p.id}>
                      <tr>
                        <td className="px-4 py-2">{p.id}</td>
                        <td className="px-4 py-2">{p.nama}</td>
                        <td className="px-4 py-2">{p.nip}</td>
                        <td className="px-4 py-2">{p.jabatan}</td>
                        <td className="px-4 py-2 font-semibold text-green-700">
                          Rp {formatRupiah(p.total_biaya)}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => togglePegawaiDetail(p.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                          >
                            {pegawaiDetailShown[p.id] ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      </tr>

                      {pegawaiDetailShown[p.id] && p.biaya_list && p.biaya_list.length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-2">
                          {p.biaya_list.map((b, idx) => {
                            const totalTransport = b.transportasi.reduce(
                              (sum, t) => sum + Number(t.total || 0),
                              0
                            );
                            const totalUH = b.uang_harian.reduce(
                              (sum, u) => sum + Number(u.total || 0),
                              0
                            );
                            const totalPenginapan = b.penginapan.reduce(
                              (sum, p) => sum + Number(p.total || 0),
                              0
                            );
                            const grandTotal = totalTransport + totalUH + totalPenginapan;

                            return (
                              <div key={idx} className="mb-4 p-4 border border-gray-400 rounded-md">
                                <h6 className="font-medium text-gray-800 mb-3">Rincian</h6>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full border border-gray-400 text-sm mb-3">
                                    <thead className="bg-gray-200">
                                      <tr>
                                        <th colSpan="3" className="border border-gray-700 px-2 py-1 text-center">Transportasi</th>
                                        <th colSpan="4" className="border border-gray-700 px-2 py-1 text-center">Uang Harian</th>
                                        <th colSpan="4" className="border border-gray-700 px-2 py-1 text-center">Penginapan</th>
                                      </tr>
                                      <tr>
                                        {/* Transportasi Header */}
                                        <th className="border border-gray-700 px-2 py-1">Jenis</th>
                                        <th className="border border-gray-700 px-2 py-1">Harga</th>
                                        <th className="border border-gray-700 px-2 py-1">Total</th>
                                        
                                        {/* Uang Harian Header */}
                                        <th className="border border-gray-700 px-2 py-1">Jenis</th>
                                        <th className="border border-gray-700 px-2 py-1">Qty</th>
                                        <th className="border border-gray-700 px-2 py-1">Harga</th>
                                        <th className="border border-gray-700 px-2 py-1">Total</th>
                                        
                                        {/* Penginapan Header */}
                                        <th className="border border-gray-700 px-2 py-1">Jenis</th>
                                        <th className="border border-gray-700 px-2 py-1">Qty</th>
                                        <th className="border border-gray-700 px-2 py-1">Harga</th>
                                        <th className="border border-gray-700 px-2 py-1">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(() => {
                                        const maxRows = Math.max(
                                          b.transportasi.length,
                                          b.uang_harian.length,
                                          b.penginapan.length
                                        );

                                        return Array.from({ length: maxRows }).map((_, i) => (
                                          <tr key={i} className="hover:bg-gray-50">
                                            {/* Transportasi Data */}
                                            <td className="border px-2 py-1">
                                              {b.transportasi[i]?.trans || ""}
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              {b.transportasi[i] ? formatRupiah(b.transportasi[i].harga) : ""}
                                            </td>
                                            <td className="border px-2 py-1 text-right font-medium">
                                              {b.transportasi[i] ? formatRupiah(b.transportasi[i].total) : ""}
                                            </td>
                                            
                                            {/* Uang Harian Data */}
                                            <td className="border px-2 py-1">
                                              {b.uang_harian[i]?.jenis || ""}
                                            </td>
                                            <td className="border px-2 py-1 text-center">
                                              {b.uang_harian[i]?.qty || ""}
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              {b.uang_harian[i] ? formatRupiah(b.uang_harian[i].harga) : ""}
                                            </td>
                                            <td className="border px-2 py-1 text-right font-medium">
                                              {b.uang_harian[i] ? formatRupiah(b.uang_harian[i].total) : ""}
                                            </td>
                                            
                                            {/* Penginapan Data */}
                                            <td className="border px-2 py-1">
                                              {b.penginapan[i]?.jenis || ""}
                                            </td>
                                            <td className="border px-2 py-1 text-center">
                                              {b.penginapan[i]?.qty || ""}
                                            </td>
                                            <td className="border px-2 py-1 text-right">
                                              {b.penginapan[i] ? formatRupiah(b.penginapan[i].harga) : ""}
                                            </td>
                                            <td className="border px-2 py-1 text-right font-medium">
                                              {b.penginapan[i] ? formatRupiah(b.penginapan[i].total) : ""}
                                            </td>
                                          </tr>
                                        ));
                                      })()}
                                      
                                      {/* Total Row */}
                                      <tr className="bg-gray-100 font-medium">
                                        <td colSpan="2" className="border px-2 py-1 text-right">Total Transportasi:</td>
                                        <td className="border px-2 py-1 text-right text-green-700">
                                          Rp {formatRupiah(totalTransport)}
                                        </td>
                                        
                                        <td colSpan="3" className="border px-2 py-1 text-right">Total Uang Harian:</td>
                                        <td className="border px-2 py-1 text-right text-green-700">
                                          Rp {formatRupiah(totalUH)}
                                        </td>
                                        
                                        <td colSpan="3" className="border px-2 py-1 text-right">Total Penginapan:</td>
                                        <td className="border px-2 py-1 text-right text-green-700">
                                          Rp {formatRupiah(totalPenginapan)}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Total Rincian Ini:</span>
                                    <span className="text-xl font-bold text-green-800">
                                      Rp {formatRupiah(grandTotal)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        )}
      </React.Fragment>
    ))
  ) : (
    <tr>
      <td colSpan={12} className="px-6 py-4 text-center text-gray-500">
        Tidak ada data kegiatan
      </td>
    </tr>
  )}
</tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} dari {totalItems} kegiatan
                        </div>
                        <div className="space-x-2">
                            <button 
                                onClick={() => setCurrentPage(currentPage - 1)} 
                                disabled={currentPage === 1} 
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-2">
                                Halaman {currentPage} dari {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(currentPage + 1)} 
                                disabled={currentPage * ITEMS_PER_PAGE >= totalItems} 
                                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Modals */}
                <NotificationModal
                    show={modalOpen}
                    message={notificationMessage}
                    onClose={closeModal}
                />

                <ConfirmDeleteModal
                    show={confirmDeleteModalOpen}
                    deletingId={deletingId}
                    itemToDelete={itemToDelete}
                    onClose={closeModal}
                    onConfirm={confirmDelete}
                />

                {/* Modal Histori */}
                <HistoriModal
                    show={showHistoriModal}
                    onClose={handleCloseHistoriModal}
                    item={selectedHistoriItem}
                    formatDateForDisplay={formatDateForDisplay}
                />

                {/* Modal Kirim ke PPK */}
                {showKirimPPKModal && (
                    <KirimPPKModal
                        show={showKirimPPKModal}
                        kegiatanId={selectedKegiatanForPPK}
                        onClose={() => setShowKirimPPKModal(false)}
                        onSuccess={() => {
                            setShowKirimPPKModal(false);
                            fetchKegiatan();
                            setNotificationMessage('Kegiatan berhasil dikirim ke PPK');
                            setModalOpen(true);
                        }}
                    />
                )}

                {/* Modal Persetujuan PPK */}
                {showPersetujuanModal && (
                    <PersetujuanModal
                        show={showPersetujuanModal}
                        kegiatan={selectedKegiatanForPersetujuan}
                        onClose={() => setShowPersetujuanModal(false)}
                        onSuccess={(customMessage) => {
                            setShowPersetujuanModal(false);
                            fetchKegiatan();
                            setNotificationMessage(customMessage || 'Persetujuan berhasil diproses');
                            setModalOpen(true);
                        }}
                    />
                )}

                {/* Modal Mengetahui Kabalai */}
                {showMengetahuiModal && (
                    <MengetahuiModal
                        show={showMengetahuiModal}
                        kegiatan={selectedKegiatanForMengetahui}
                        onClose={() => setShowMengetahuiModal(false)}
                        onSuccess={() => {
                            setShowMengetahuiModal(false);
                            fetchKegiatan();
                            setNotificationMessage('Mengetahui Kabalai berhasil diproses');
                            setModalOpen(true);
                        }}
                    />
                )}

                {/* Modal Surat Tugas */}
                {showSuratTugasModal && (
                    <SuratTugasModal
                        show={showSuratTugasModal}
                        kegiatan={selectedKegiatanForST}
                        onClose={() => {
                            setShowSuratTugasModal(false);
                            setSelectedKegiatanForST(null);
                        }}
                        onSuccess={() => {
                            setShowSuratTugasModal(false);
                            setSelectedKegiatanForST(null);
                            fetchKegiatan();
                            setNotificationMessage('Data surat tugas berhasil disimpan dan status berubah menjadi Selesai');
                            setModalOpen(true);
                        }}
                    />
                )}
            </div>

            
        </DashboardLayout>
    );
}

// Server-side protection
export async function getServerSideProps(context) {
    const session = await getSession(context);

    if (!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    return {
        props: { session },
    };
}