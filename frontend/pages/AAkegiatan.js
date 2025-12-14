import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getSession } from 'next-auth/react';

const ITEMS_PER_PAGE = 10;
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export default function KegiatanPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [kegiatanList, setKegiatanList] = useState([]);
    const [filteredKegiatan, setFilteredKegiatan] = useState([]);
    const [editId, setEditId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deletingId, setDeletingId] = useState(null); 
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const idleTimer = useState(null);
    const [detailShown, setDetailShown] = useState({});
    const [detailData, setDetailData] = useState({});
    const [pegawaiDetailShown, setPegawaiDetailShown] = useState({});
    
    // State untuk form
    const [showForm, setShowForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        no_st: '',
        tgl_st: '',
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
    
    // State untuk pegawai
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
    
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    
    // State untuk data daerah
    const [provinsiList, setProvinsiList] = useState([]);
    const [kabupatenList, setKabupatenList] = useState([]);
    const [kecamatanList, setKecamatanList] = useState([]);
    const [selectedProvinsi, setSelectedProvinsi] = useState('');
    const [selectedKabupaten, setSelectedKabupaten] = useState('');
    const [selectedKecamatan, setSelectedKecamatan] = useState('');
    const [loadingDaerah, setLoadingDaerah] = useState(false);

    // State untuk fitur Kirim ke PPK
    const [showKirimPPKModal, setShowKirimPPKModal] = useState(false);
    const [selectedKegiatanId, setSelectedKegiatanId] = useState(null);
    const [ppkList, setPpkList] = useState([]);
    const [selectedPpkId, setSelectedPpkId] = useState('');
    const [selectedPpkNama, setSelectedPpkNama] = useState('');
    const [catatanKirim, setCatatanKirim] = useState('');
    const [loadingPpkList, setLoadingPpkList] = useState(false);
    const [loadingKirim, setLoadingKirim] = useState(false);

    // State untuk fitur Persetujuan PPK
    const [showPersetujuanModal, setShowPersetujuanModal] = useState(false);
    const [selectedKegiatanForApproval, setSelectedKegiatanForApproval] = useState(null);
    const [catatanPersetujuan, setCatatanPersetujuan] = useState('');
    const [loadingPersetujuan, setLoadingPersetujuan] = useState(false);

    // ========== STATE BARU UNTUK FITUR MENGETAHUI KABALAI ==========
    const [showMengetahuiModal, setShowMengetahuiModal] = useState(false);
    const [selectedKegiatanForMengetahui, setSelectedKegiatanForMengetahui] = useState(null);
    const [formMengetahui, setFormMengetahui] = useState({
        nama_kabalai: '',
        nip_kabalai: '',
        jabatan_kabalai: '',
        catatan_kabalai: '',
        tanggal_mengetahui: ''
    });
    const [loadingMengetahui, setLoadingMengetahui] = useState(false);
    // ========== END STATE BARU ==========

    // State untuk filter
    const [showFilter, setShowFilter] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterMak, setFilterMak] = useState('');
    const [filterLokasi, setFilterLokasi] = useState('');

    // State untuk user info dan role
    const [userRole, setUserRole] = useState('');
    const [userType, setUserType] = useState({
        isAdmin: false,
        isPPK: false,
        isKabalai: false,
        isRegularUser: false
    });

    const formatRupiah = (v) => Number(v || 0).toLocaleString("id-ID");

    // Handle logout dengan NextAuth
    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: '/login' });
        } catch (error) {
            console.error('Logout error:', error);
            router.push('/login');
        }
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
            
            // Jika user adalah kabalai, set nilai default untuk form mengetahui
            if (isKabalai) {
                setFormMengetahui(prev => ({
                    ...prev,
                    nama_kabalai: userData.name || '',
                    jabatan_kabalai: 'Kepala Balai'
                }));
            }
        }
    }, [session]);

    // Load data provinsi saat komponen mount
    useEffect(() => {
        fetchProvinsi();
        
        resetIdleTimer();
        
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => {
            window.addEventListener(event, resetIdleTimer);
        });

        return () => {
            clearTimeout(idleTimer.current);
            events.forEach(event => {
                window.removeEventListener(event, resetIdleTimer);
            });
        };
    }, []);

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

    // Filter data berdasarkan search term dan filter lainnya
    useEffect(() => {
        const filtered = kegiatanList.filter(item => {
            const matchesSearch = 
                item.kegiatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.no_st?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        setTotalItems(filtered.length);
        setCurrentPage(1);
    }, [searchTerm, kegiatanList, filterStatus, filterDateFrom, filterDateTo, filterMak, filterLokasi]);

    // Fungsi untuk fetch data provinsi
    const fetchProvinsi = async () => {
        try {
            setLoadingDaerah(true);
            const response = await axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
            setProvinsiList(response.data);
        } catch (error) {
            console.error('Error fetching provinsi:', error);
            setProvinsiList([
                { id: '62', name: 'KALIMANTAN TENGAH' },
                { id: '63', name: 'KALIMANTAN SELATAN' },
                { id: '64', name: 'KALIMANTAN TIMUR' },
                { id: '65', name: 'KALIMANTAN UTARA' },
                { id: '66', name: 'KALIMANTAN BARAT' }
            ]);
        } finally {
            setLoadingDaerah(false);
        }
    };

    // Fungsi untuk fetch kabupaten berdasarkan provinsi
    const fetchKabupaten = async (provinsiId) => {
        try {
            setLoadingDaerah(true);
            setKabupatenList([]);
            setKecamatanList([]);
            setSelectedKabupaten('');
            setSelectedKecamatan('');
            
            const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinsiId}.json`);
            setKabupatenList(response.data);
        } catch (error) {
            console.error('Error fetching kabupaten:', error);
        } finally {
            setLoadingDaerah(false);
        }
    };

    // Fungsi untuk fetch kecamatan berdasarkan kabupaten
    const fetchKecamatan = async (kabupatenId) => {
        try {
            setLoadingDaerah(true);
            setKecamatanList([]);
            setSelectedKecamatan('');
            
            const response = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kabupatenId}.json`);
            setKecamatanList(response.data);
        } catch (error) {
            console.error('Error fetching kecamatan:', error);
        } finally {
            setLoadingDaerah(false);
        }
    };

    // Fetch data kegiatan
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
            
            console.log('Kegiatan response:', res.data);
            
            if (res.data.success && Array.isArray(res.data.data)) {
                const sortedData = [...res.data.data].sort((a, b) => {
                    return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
                });
                
                setKegiatanList(sortedData);
                setFilteredKegiatan(sortedData);
                setTotalItems(sortedData.length);
                setCurrentPage(1);
                setDetailData({});
                setDetailShown({});
                setPegawaiDetailShown({});
            } else {
                setKegiatanList([]);
                setFilteredKegiatan([]);
                setTotalItems(0);
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
            setTotalItems(0);
        } finally {
            if (showLoading) {
                setFormLoading(false);
            }
        }
    };

    // Handler untuk perubahan provinsi
    const handleProvinsiChange = (e) => {
        const provinsiId = e.target.value;
        const provinsiName = e.target.options[e.target.selectedIndex].text;
        
        setSelectedProvinsi(provinsiId);
        
        setFormData(prev => ({
            ...prev,
            provinsi: provinsiName
        }));
        
        setKabupatenList([]);
        setKecamatanList([]);
        setSelectedKabupaten('');
        setSelectedKecamatan('');
        
        if (provinsiId) {
            fetchKabupaten(provinsiId);
        }
    };

    // Handler untuk perubahan kabupaten
    const handleKabupatenChange = (e) => {
        const kabupatenId = e.target.value;
        const kabupatenName = e.target.options[e.target.selectedIndex].text;
        
        setSelectedKabupaten(kabupatenId);
        
        setFormData(prev => ({
            ...prev,
            kabupaten_tujuan: kabupatenName,
            kota_kab_kecamatan: kabupatenName
        }));
        
        setKecamatanList([]);
        setSelectedKecamatan('');
        
        if (kabupatenId) {
            fetchKecamatan(kabupatenId);
        }
    };

    // Handler untuk perubahan kecamatan
    const handleKecamatanChange = (e) => {
        const kecamatanName = e.target.options[e.target.selectedIndex].text;
        
        setSelectedKecamatan(e.target.value);
        
        setFormData(prev => ({
            ...prev,
            kota_kab_kecamatan: `${kecamatanName}, ${prev.kabupaten_tujuan}`
        }));
    };

    // Form handlers untuk kegiatan
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setFormError('');
    };

    // Handle perubahan data pegawai
    const handlePegawaiChange = (index, field, value) => {
        const newList = [...pegawaiList];
        newList[index][field] = value;
        setPegawaiList(newList);
    };

    // Handle perubahan biaya detail dengan auto-calculate total
    const handleBiayaChange = (pIndex, bIndex, type, dIndex, field, value) => {
        const newList = [...pegawaiList];
        
        if (!newList[pIndex].biaya || !newList[pIndex].biaya[bIndex]) {
            return;
        }
        
        if (!newList[pIndex].biaya[bIndex][type]) {
            newList[pIndex].biaya[bIndex][type] = [];
        }
        
        if (!newList[pIndex].biaya[bIndex][type][dIndex]) {
            if (type === 'transportasi') {
                newList[pIndex].biaya[bIndex][type][dIndex] = { trans: '', harga: '', total: '' };
            } else {
                newList[pIndex].biaya[bIndex][type][dIndex] = { jenis: '', qty: '', harga: '', total: '' };
            }
        }
        
        newList[pIndex].biaya[bIndex][type][dIndex][field] = value;
        
        if (field === 'harga' || field === 'qty') {
            const item = newList[pIndex].biaya[bIndex][type][dIndex];
            
            if (type === 'transportasi') {
                const harga = Number(item.harga) || 0;
                newList[pIndex].biaya[bIndex][type][dIndex].total = harga;
            } else {
                const qty = Number(item.qty) || 0;
                const harga = Number(item.harga) || 0;
                newList[pIndex].biaya[bIndex][type][dIndex].total = qty * harga;
            }
        }
        
        setPegawaiList(newList);
        calculateTotalBiaya(pIndex);
    };

    // Hitung total biaya per pegawai
    const calculateTotalBiaya = (pIndex) => {
        const newList = [...pegawaiList];
        const pegawai = newList[pIndex];
        
        let total = 0;
        
        if (pegawai.biaya && Array.isArray(pegawai.biaya)) {
            pegawai.biaya.forEach(biaya => {
                if (biaya.transportasi && Array.isArray(biaya.transportasi)) {
                    total += biaya.transportasi.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
                }
                
                if (biaya.uang_harian_items && Array.isArray(biaya.uang_harian_items)) {
                    total += biaya.uang_harian_items.reduce((sum, u) => sum + (Number(u.total) || 0), 0);
                }
                
                if (biaya.penginapan_items && Array.isArray(biaya.penginapan_items)) {
                    total += biaya.penginapan_items.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
                }
            });
        }
        
        newList[pIndex].total_biaya = total;
        setPegawaiList(newList);
    };
    

    // Tambah pegawai baru
    const addPegawai = () => {
        setPegawaiList([
            ...pegawaiList,
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
    };

    // Hapus pegawai
    const removePegawai = (index) => {
        if (pegawaiList.length > 1) {
            const newList = [...pegawaiList];
            newList.splice(index, 1);
            setPegawaiList(newList);
        }
    };

    // Tambah item biaya
    const addBiayaItem = (pIndex, bIndex, type) => {
        const newList = [...pegawaiList];
        
        if (!newList[pIndex].biaya) {
            newList[pIndex].biaya = [];
        }
        
        if (!newList[pIndex].biaya[bIndex]) {
            newList[pIndex].biaya[bIndex] = {
                transportasi: [],
                uang_harian_items: [],
                penginapan_items: []
            };
        }
        
        if (type === 'transportasi') {
            newList[pIndex].biaya[bIndex][type].push({ trans: '', harga: '', total: '' });
        } else {
            newList[pIndex].biaya[bIndex][type].push({ jenis: '', qty: '', harga: '', total: '' });
        }
        
        setPegawaiList(newList);
        calculateTotalBiaya(pIndex);
    };

    // Hapus item biaya
    const removeBiayaItem = (pIndex, bIndex, type, dIndex) => {
        const newList = [...pegawaiList];
        
        if (newList[pIndex].biaya && 
            newList[pIndex].biaya[bIndex] && 
            newList[pIndex].biaya[bIndex][type] && 
            newList[pIndex].biaya[bIndex][type].length > 1) {
            
            newList[pIndex].biaya[bIndex][type].splice(dIndex, 1);
            setPegawaiList(newList);
            calculateTotalBiaya(pIndex);
        }
    };

    // Hitung grand total semua biaya
    const grandTotal = pegawaiList.reduce((sum, pegawai) => sum + (pegawai.total_biaya || 0), 0);

    // Format tanggal untuk input type="date"
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateString;
        }
        
        let date;
        if (dateString instanceof Date) {
            date = dateString;
        } else if (typeof dateString === 'string') {
            date = new Date(dateString);
            
            if (isNaN(date.getTime())) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                } else {
                    const isoDate = dateString.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
                    date = new Date(isoDate);
                }
            }
        } else {
            return '';
        }
        
        if (isNaN(date.getTime())) {
            return '';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    };

    // Fungsi untuk load data untuk edit
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
                
                setSelectedProvinsi('');
                setSelectedKabupaten('');
                setSelectedKecamatan('');
                setKabupatenList([]);
                setKecamatanList([]);
                
                setFormData({
                    no_st: data.no_st || '',
                    tgl_st: formatDateForInput(data.tgl_st),
                    kegiatan: data.kegiatan || '',
                    mak: data.mak || '',
                    realisasi_anggaran_sebelumnya: data.realisasi_anggaran_sebelumnya || '',
                    target_output_tahun: data.target_output_tahun || '',
                    realisasi_output_sebelumnya: data.realisasi_output_sebelumnya || '',
                    target_output_yg_akan_dicapai: data.target_output_yg_akan_dicapai || '',
                    kota_kab_kecamatan: data.kota_kab_kecamatan || '',
                    rencana_tanggal_pelaksanaan: formatDateForInput(data.rencana_tanggal_pelaksanaan),
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

    // Fungsi untuk cancel edit
    const cancelEdit = () => {
        resetForm();
    };

    // Handle submit form untuk edit
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

            const formatDateForBackend = (dateString) => {
                if (!dateString) return null;
                
                if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return dateString;
                }
                
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return null;
                }
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                
                return `${year}-${month}-${day}`;
            };

            // Persiapkan payload
            const payload = {
                ...formData,
                tgl_st: formatDateForBackend(formData.tgl_st) || null,
                rencana_tanggal_pelaksanaan: formatDateForBackend(formData.rencana_tanggal_pelaksanaan) || null,
                pegawai: pegawaiList.map(pegawai => {
                    const pegawaiPayload = {
                        nama: pegawai.nama || '',
                        nip: pegawai.nip || '',
                        jabatan: pegawai.jabatan || '',
                        total_biaya: pegawai.total_biaya || 0
                    };

                    if (pegawai.id) {
                        pegawaiPayload.id = pegawai.id;
                    }

                    if (pegawai.biaya && pegawai.biaya.length > 0) {
                        pegawaiPayload.biaya = pegawai.biaya.map(biaya => ({
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
                        }));
                    }

                    return pegawaiPayload;
                })
            };

            console.log('Payload yang dikirim:', JSON.stringify(payload, null, 2));

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

    const handleEdit = (id) => {
        loadDataForEdit(id);
    };

    // Fungsi untuk delete kegiatan
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
            
            if (error.response?.status === 400 || error.response?.status === 500) {
                try {
                    const simpleResponse = await axios.delete(`http://localhost:5000/api/kegiatan/${itemToDelete}`, {
                        headers: { 
                            Authorization: `Bearer ${session.accessToken}` 
                        },
                    });
                    
                    if (simpleResponse.data.success) {
                        setNotificationMessage(simpleResponse.data.message);
                        setConfirmDeleteModalOpen(false);
                        fetchKegiatan();
                        return;
                    }
                } catch (simpleError) {
                    errorMessage = simpleError.response?.data?.message || errorMessage;
                }
            } else if (error.response?.data?.message) {
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

    const resetIdleTimer = () => {
        clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(async () => {
            await signOut({ callbackUrl: '/login' });
            setNotificationMessage('Anda telah logout karena tidak ada aktivitas selama 10 menit.');
            setModalOpen(true);
        }, IDLE_TIMEOUT);
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

    // Fungsi untuk toggle detail
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

    const togglePegawaiDetail = (id) => {
        setPegawaiDetailShown(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Fungsi untuk hitung total nominatif
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

    // Fungsi untuk reset form
    const resetForm = () => {
        setFormData({
            no_st: '',
            tgl_st: '',
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
        
        setSelectedProvinsi('');
        setSelectedKabupaten('');
        setSelectedKecamatan('');
        setKabupatenList([]);
        setKecamatanList([]);
        
        setShowForm(false);
        setIsEditMode(false);
        setEditId(null);
        setFormError('');
    };

    // Handler untuk input MAK dengan auto-format
    const handleMakChange = (e) => {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9.]/g, '');
        
        if (value.length > 29) {
            value = value.substring(0, 29);
        }
        
        const rawValue = value.replace(/\./g, '');
        let formatted = '';
        
        for (let i = 0; i < rawValue.length; i++) {
            if (i === 4 || i === 7 || i === 10 || i === 13 || i === 19) {
                formatted += '.';
            }
            formatted += rawValue[i];
        }
        
        setFormData(prev => ({
            ...prev,
            mak: formatted
        }));
    };

    // Validasi format MAK
    const validateMakFormat = (mak) => {
        if (!mak) return false;
        
        const parts = mak.split('.');
        if (parts.length !== 6) return false;
        
        const [part1, part2, part3, part4, part5, part6] = parts;
        
        return (
            part1.length === 4 && /^[A-Z0-9]{4}$/.test(part1) &&
            part2.length === 3 && /^[A-Z0-9]{3}$/.test(part2) &&
            part3.length === 3 && /^[A-Z0-9]{3}$/.test(part3) &&
            part4.length === 3 && /^[A-Z0-9]{3}$/.test(part4) &&
            part5.length === 6 && /^[0-9]{6}$/.test(part5) &&
            part6.length === 1 && /^[A-Z]$/.test(part6)
        );
    };

    // Fungsi untuk placeholder yang bergerak
    const getMakPlaceholder = () => {
        const positions = [4, 7, 10, 13, 19, 20];
        let placeholder = '';
        
        for (let i = 0; i < 20; i++) {
            if (positions.includes(i)) {
                placeholder += '.';
            } else {
                placeholder += 'X';
            }
        }
        return placeholder + 'X';
    };
    
    // Format date ISO ke DD-MM-YYYY
    const formatDateISOToDDMMYYYY = (isoString) => {
        if (!isoString) return '';
        
        try {
            const date = new Date(isoString);
            
            if (isNaN(date.getTime())) {
                return isoString;
            }
            
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day}-${month}-${year}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return isoString;
        }
    };
    
    // Fungsi untuk format display tanggal
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        
        if (dateString.includes('T') && dateString.includes('Z')) {
            return formatDateISOToDDMMYYYY(dateString);
        }
        
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${day}-${month}-${year}`;
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (error) {
            return dateString;
        }
    };

    // ========== FUNGSI UNTUK FITUR KIRIM KE PPK ==========

    const handleOpenKirimPPKModal = async (kegiatanId) => {
        if (!userType.isRegularUser) {
            setNotificationMessage('Hanya user biasa yang dapat mengirim kegiatan ke PPK');
            setModalOpen(true);
            return;
        }
        
        setSelectedKegiatanId(kegiatanId);
        setSelectedPpkId('');
        setSelectedPpkNama('');
        setCatatanKirim('');
        
        try {
            setLoadingPpkList(true);
            
            const response = await axios.get('http://localhost:5000/api/kegiatan/ppk/list', {
                headers: { 
                    Authorization: `Bearer ${session.accessToken}` 
                }
            });
            
            if (response.data.success) {
                setPpkList(response.data.data);
            } else {
                throw new Error('Gagal mengambil daftar PPK');
            }
        } catch (error) {
            console.error('Error fetching PPK list:', error);
            setNotificationMessage('Gagal mengambil daftar PPK: ' + error.message);
            setModalOpen(true);
        } finally {
            setLoadingPpkList(false);
            setShowKirimPPKModal(true);
        }
    };

    const handleCloseKirimPPKModal = () => {
        setShowKirimPPKModal(false);
        setSelectedKegiatanId(null);
        setSelectedPpkId('');
        setSelectedPpkNama('');
        setCatatanKirim('');
        setLoadingKirim(false);
    };

    const handleSelectPpk = (e) => {
        const ppkId = e.target.value;
        const selected = ppkList.find(p => p.user_id === ppkId);
        
        if (selected) {
            setSelectedPpkId(ppkId);
            setSelectedPpkNama(selected.nama);
        } else {
            setSelectedPpkId('');
            setSelectedPpkNama('');
        }
    };

    const handleKirimKePPK = async () => {
        if (!selectedKegiatanId || !selectedPpkId || !selectedPpkNama) {
            setNotificationMessage('Pilih PPK terlebih dahulu');
            setModalOpen(true);
            return;
        }

        setLoadingKirim(true);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/kegiatan/${selectedKegiatanId}/kirim-ke-ppk`,
                {
                    ppk_id: selectedPpkId,
                    ppk_nama: selectedPpkNama,
                    catatan: catatanKirim
                },
                {
                    headers: { 
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setNotificationMessage(response.data.message || 'Kegiatan berhasil dikirim ke PPK');
                setModalOpen(true);
                
                fetchKegiatan();
                
                handleCloseKirimPPKModal();
            } else {
                throw new Error(response.data.message || 'Gagal mengirim ke PPK');
            }
        } catch (error) {
            console.error('Error sending to PPK:', error);
            setNotificationMessage(error.response?.data?.message || error.message || 'Gagal mengirim ke PPK');
            setModalOpen(true);
        } finally {
            setLoadingKirim(false);
        }
    };

    // ========== FUNGSI UNTUK FITUR PERSETUJUAN PPK ==========

    const handleOpenPersetujuanModal = (kegiatanId, kegiatanData) => {
        if (!userType.isPPK) {
            setNotificationMessage('Hanya PPK yang dapat melakukan persetujuan');
            setModalOpen(true);
            return;
        }
        
        setSelectedKegiatanForApproval({
            id: kegiatanId,
            ...kegiatanData
        });
        setCatatanPersetujuan('');
        setShowPersetujuanModal(true);
    };

    const handleClosePersetujuanModal = () => {
        setShowPersetujuanModal(false);
        setSelectedKegiatanForApproval(null);
        setCatatanPersetujuan('');
        setLoadingPersetujuan(false);
    };

    const handleApproveKegiatan = async () => {
        if (!selectedKegiatanForApproval || !session?.accessToken) {
            return;
        }

        setLoadingPersetujuan(true);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/kegiatan/${selectedKegiatanForApproval.id}/approve`,
                {
                    catatan: catatanPersetujuan,
                    approved_by: session.user?.name || 'PPK',
                    approved_by_id: session.user?.id || 'ppk'
                },
                {
                    headers: { 
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setNotificationMessage(response.data.message || 'Kegiatan berhasil disetujui');
                setModalOpen(true);
                
                fetchKegiatan();
                
                handleClosePersetujuanModal();
            } else {
                throw new Error(response.data.message || 'Gagal menyetujui kegiatan');
            }
        } catch (error) {
            console.error('Error approving kegiatan:', error);
            setNotificationMessage(error.response?.data?.message || error.message || 'Gagal menyetujui kegiatan');
            setModalOpen(true);
        } finally {
            setLoadingPersetujuan(false);
        }
    };

    const handleRejectKegiatan = async () => {
        if (!selectedKegiatanForApproval || !session?.accessToken) {
            return;
        }

        setLoadingPersetujuan(true);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/kegiatan/${selectedKegiatanForApproval.id}/reject`,
                {
                    catatan: catatanPersetujuan,
                    rejected_by: session.user?.name || 'PPK',
                    rejected_by_id: session.user?.id || 'ppk'
                },
                {
                    headers: { 
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setNotificationMessage(response.data.message || 'Kegiatan berhasil dikembalikan');
                setModalOpen(true);
                
                fetchKegiatan();
                
                handleClosePersetujuanModal();
            } else {
                throw new Error(response.data.message || 'Gagal mengembalikan kegiatan');
            }
        } catch (error) {
            console.error('Error rejecting kegiatan:', error);
            setNotificationMessage(error.response?.data?.message || error.message || 'Gagal mengembalikan kegiatan');
            setModalOpen(true);
        } finally {
            setLoadingPersetujuan(false);
        }
    };

    // ========== FUNGSI BARU UNTUK FITUR MENGETAHUI KABALAI ==========

    // Fungsi untuk membuka modal mengetahui
    const handleOpenMengetahuiModal = (kegiatanId, kegiatanData) => {
        if (!userType.isKabalai) {
            setNotificationMessage('Hanya Kabalai yang dapat mengisi form Mengetahui');
            setModalOpen(true);
            return;
        }
        
        // Validasi: Hanya kegiatan dengan status 'disetujui' oleh PPK yang bisa diketahui Kabalai
        if (kegiatanData.status !== 'disetujui') {
            setNotificationMessage('Hanya kegiatan yang sudah disetujui PPK yang dapat diketahui oleh Kabalai');
            setModalOpen(true);
            return;
        }
        
        setSelectedKegiatanForMengetahui({
            id: kegiatanId,
            ...kegiatanData
        });
        
        // Set nilai default dari session user
        setFormMengetahui({
            nama_kabalai: session.user?.name || '',
            nip_kabalai: session.user?.nip || '',
            jabatan_kabalai: 'Kepala Balai',
            catatan_kabalai: '',
            tanggal_mengetahui: new Date().toISOString().split('T')[0]
        });
        
        setShowMengetahuiModal(true);
    };

    // Fungsi untuk menutup modal mengetahui
    const handleCloseMengetahuiModal = () => {
        setShowMengetahuiModal(false);
        setSelectedKegiatanForMengetahui(null);
        setFormMengetahui({
            nama_kabalai: '',
            nip_kabalai: '',
            jabatan_kabalai: '',
            catatan_kabalai: '',
            tanggal_mengetahui: ''
        });
        setLoadingMengetahui(false);
    };

    // Handler untuk perubahan form mengetahui
    const handleMengetahuiChange = (e) => {
        const { name, value } = e.target;
        setFormMengetahui(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Fungsi untuk submit form mengetahui
    const handleSubmitMengetahui = async () => {
        if (!selectedKegiatanForMengetahui || !session?.accessToken) {
            return;
        }

        // Validasi
        if (!formMengetahui.nama_kabalai.trim()) {
            setNotificationMessage('Nama Kabalai wajib diisi');
            setModalOpen(true);
            return;
        }

        if (!formMengetahui.nip_kabalai.trim()) {
            setNotificationMessage('NIP Kabalai wajib diisi');
            setModalOpen(true);
            return;
        }

        setLoadingMengetahui(true);

        try {
            const response = await axios.post(
                `http://localhost:5000/api/kegiatan/${selectedKegiatanForMengetahui.id}/mengetahui`,
                {
                    nama_kabalai: formMengetahui.nama_kabalai,
                    nip_kabalai: formMengetahui.nip_kabalai,
                    jabatan_kabalai: formMengetahui.jabatan_kabalai,
                    catatan_kabalai: formMengetahui.catatan_kabalai,
                    tanggal_mengetahui: formMengetahui.tanggal_mengetahui,
                    diketahui_oleh: session.user?.name || 'Kabalai',
                    diketahui_oleh_id: session.user?.id || 'kabalai'
                },
                {
                    headers: { 
                        Authorization: `Bearer ${session.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setNotificationMessage(response.data.message || 'Kegiatan berhasil diketahui oleh Kabalai');
                setModalOpen(true);
                
                // Refresh data
                fetchKegiatan();
                
                // Tutup modal
                handleCloseMengetahuiModal();
            } else {
                throw new Error(response.data.message || 'Gagal menyimpan data Mengetahui');
            }
        } catch (error) {
            console.error('Error submitting mengetahui:', error);
            setNotificationMessage(error.response?.data?.message || error.message || 'Gagal menyimpan data Mengetahui');
            setModalOpen(true);
        } finally {
            setLoadingMengetahui(false);
        }
    };

    // ========== END FUNGSI BARU ==========

    // Fungsi untuk reset filter
    const resetFilter = () => {
        setFilterStatus('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterMak('');
        setFilterLokasi('');
    };

    // ========== RENDER FUNCTIONS ==========

    // Fungsi untuk render status badge
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'draft':
                return <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded-full">Draft</span>;
            case 'diajukan':
                return <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">Diajukan</span>;
            case 'disetujui':
                return <span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded-full">Disetujui</span>;
            case 'dikembalikan':
                return <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-medium rounded-full">Dikembalikan</span>;
            case 'diketahui':
                return <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full">Diketahui Kabalai</span>;
            default:
                return <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded-full">Unknown</span>;
        }
    };

    // Jika session masih loading
    if (status === 'loading') {
        return (
            <DashboardLayout onLogout={handleLogout}>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Memuat...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Jika tidak ada session, component akan redirect (di useEffect)
    if (!session) {
        return null;
    }

    const paginatedItems = filteredKegiatan.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <DashboardLayout onLogout={handleLogout}>
            <div className="max-w-5xxl mx-auto p-6 shadow-md rounded-lg">
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
                                        cancelEdit();
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
                {showFilter && (
                    <div className="mb-6 bg-white p-6 rounded-lg shadow border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-800">Filter Data Kegiatan</h3>
                            <button
                                onClick={resetFilter}
                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                            >
                                Reset Filter
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="diajukan">Diajukan</option>
                                    <option value="disetujui">Disetujui</option>
                                    <option value="dikembalikan">Dikembalikan</option>
                                    <option value="diketahui">Diketahui Kabalai</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Dari
                                </label>
                                <input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Sampai
                                </label>
                                <input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    MAK
                                </label>
                                <input
                                    type="text"
                                    value={filterMak}
                                    onChange={(e) => setFilterMak(e.target.value)}
                                    placeholder="Filter by MAK"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lokasi
                                </label>
                                <input
                                    type="text"
                                    value={filterLokasi}
                                    onChange={(e) => setFilterLokasi(e.target.value)}
                                    placeholder="Filter by Lokasi"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="h-5 w-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Menampilkan {filteredKegiatan.length} dari {kegiatanList.length} data</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Create/Edit Kegiatan + Pegawai (hanya untuk regular user) */}
                {showForm && userType.isRegularUser && (
                    <div className="mb-8 bg-white p-6 rounded-lg shadow border border-gray-200">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">
                            {isEditMode ? `Edit Kegiatan (ID: ${editId})` : 'Form Tambah Kegiatan + Pegawai'}
                        </h3>
                        
                        {formError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200">
                                {formError}
                            </div>
                        )}

                        {/* Total Biaya Keseluruhan */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-blue-700">Total Biaya Keseluruhan</div>
                                    <div className="text-2xl font-bold text-blue-800">Rp {formatRupiah(grandTotal)}</div>
                                </div>
                                <div className="text-sm text-blue-700">
                                    {pegawaiList.length} Pegawai
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Bagian 1: Data Kegiatan */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-medium text-gray-800 border-b pb-2">Data Kegiatan</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            No Surat Tugas *
                                        </label>
                                        <input
                                            type="text"
                                            name="no_st"
                                            value={formData.no_st}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                           Tanggal Surat Tugas
                                        </label>
                                        <input
                                            type="date"
                                            name="tgl_st"
                                            value={formData.tgl_st}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Kegiatan *
                                        </label>
                                        <input
                                            type="text"
                                            name="kegiatan"
                                            value={formData.kegiatan}
                                            onChange={handleFormChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Contoh: Pengambilan sampling pangan segar"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            MAK *
                                            <span className="text-xs text-gray-500 ml-2">
                                                Format: XXXX.XXX.XXX.XXX.XXXXXX.X
                                            </span>
                                        </label>
                                        
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="mak"
                                                value={formData.mak}
                                                onChange={handleMakChange}
                                                placeholder={getMakPlaceholder()}
                                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-lg"
                                                required
                                                maxLength={29}
                                            />
                                            
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            
                                            {formData.mak && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, mak: '' }))}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                            
                                            {formData.mak && (
                                                <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                                    {validateMakFormat(formData.mak) ? (
                                                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-xs text-gray-500">
                                                    Panjang: <span className="font-medium">{formData.mak.replace(/\./g, '').length}</span>/20 karakter
                                                </div>
                                                <div className="text-xs font-mono text-gray-600">
                                                    {formData.mak ? formData.mak : 'XXXX.XXX.XXX.XXX.XXXXXX.X'}
                                                </div>
                                            </div>
                                            
                                            {formData.mak && !validateMakFormat(formData.mak) && (
                                                <div className="mt-2 text-xs text-red-600">
                                                    Format tidak valid. Pastikan sesuai pola: <span className="font-mono">XXXX.XXX.XXX.XXX.XXXXXX.X</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Realisasi Anggaran Sebelumnya
                                        </label>
                                        <input
                                            type="number"
                                            name="realisasi_anggaran_sebelumnya"
                                            value={formData.realisasi_anggaran_sebelumnya}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Target Output Tahun
                                        </label>
                                        <input
                                            type="number"
                                            name="target_output_tahun"
                                            value={formData.target_output_tahun}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Realisasi Output Sebelumnya
                                        </label>
                                        <input
                                            type="number"
                                            name="realisasi_output_sebelumnya"
                                            value={formData.realisasi_output_sebelumnya}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Target Output Dicapai
                                        </label>
                                        <input
                                            type="text"
                                            name="target_output_yg_akan_dicapai"
                                            value={formData.target_output_yg_akan_dicapai}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    
                                    {/* Form Lokasi Bertingkat */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lokasi Kegiatan
                                        </label>
                                        {/* Pilih Provinsi */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Provinsi
                                            </label>
                                            <select
                                                value={selectedProvinsi}
                                                onChange={handleProvinsiChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={loadingDaerah}
                                            >
                                                <option value="">Pilih Provinsi</option>
                                                {provinsiList.map(provinsi => (
                                                    <option key={provinsi.id} value={provinsi.id}>
                                                        {provinsi.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Pilih Kabupaten/Kota */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Kabupaten/Kota *
                                            </label>
                                            <select
                                                value={selectedKabupaten}
                                                onChange={handleKabupatenChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={!selectedProvinsi || loadingDaerah}
                                                required
                                            >
                                                <option value="">Pilih Kabupaten/Kota</option>
                                                {kabupatenList.map(kabupaten => (
                                                    <option key={kabupaten.id} value={kabupaten.id}>
                                                        {kabupaten.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Pilih Kecamatan (Opsional) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Kecamatan (Opsional)
                                            </label>
                                            <select
                                                value={selectedKecamatan}
                                                onChange={handleKecamatanChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                disabled={!selectedKabupaten || loadingDaerah}
                                            >
                                                <option value="">Pilih Kecamatan</option>
                                                {kecamatanList.map(kecamatan => (
                                                    <option key={kecamatan.id} value={kecamatan.id}>
                                                        {kecamatan.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Preview Lokasi yang Akan Disimpan */}
                                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                            <div className="text-sm font-medium text-gray-700 mb-1">Lokasi yang akan disimpan:</div>
                                            <div className="text-gray-900">
                                                {formData.kota_kab_kecamatan ? (
                                                    <div className="flex items-center">
                                                        <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="font-medium">{formData.kota_kab_kecamatan}</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 italic">Belum memilih lokasi</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Input Manual untuk Override (Opsional) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Edit Manual Lokasi (jika perlu)
                                            </label>
                                            <input
                                                type="text"
                                                name="kota_kab_kecamatan"
                                                value={formData.kota_kab_kecamatan}
                                                onChange={handleFormChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Contoh: Kecamatan Jekan Raya, Kota Palangka Raya"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Lokasi yang disimpan ke database: <span className="font-medium">{formData.kota_kab_kecamatan || '-'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rencana Tanggal Pelaksanaan
                                        </label>
                                        <input
                                            type="date"
                                            name="rencana_tanggal_pelaksanaan"
                                            value={formData.rencana_tanggal_pelaksanaan}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            User ID
                                        </label>
                                        <input
                                            type="text"
                                            name="user_id"
                                            value={formData.user_id}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bagian 2: Data Pegawai */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-medium text-gray-800">Data Pegawai</h4>
                                    <button
                                        type="button"
                                        onClick={addPegawai}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                    >
                                        + Tambah Pegawai
                                    </button>
                                </div>

                                {pegawaiList.map((pegawai, pIndex) => (
                                    <div key={pIndex} className="p-4 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center mb-4">
                                            <h5 className="font-medium text-gray-700">
                                                Pegawai {pIndex + 1} - Total: Rp {formatRupiah(pegawai.total_biaya)}
                                            </h5>
                                            {pegawaiList.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePegawai(pIndex)}
                                                    className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
                                                >
                                                    Hapus Pegawai
                                                </button>
                                            )}
                                        </div>

                                        {/* Data Diri Pegawai */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nama
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pegawai.nama}
                                                    onChange={(e) => handlePegawaiChange(pIndex, 'nama', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    NIP
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pegawai.nip}
                                                    onChange={(e) => handlePegawaiChange(pIndex, 'nip', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Jabatan
                                                </label>
                                                <input
                                                    type="text"
                                                    value={pegawai.jabatan}
                                                    onChange={(e) => handlePegawaiChange(pIndex, 'jabatan', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                        </div>

                                        {/* Rincian Biaya */}
                                        <div className="space-y-4">
                                            {/* Transportasi */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h6 className="font-medium text-gray-700">Transportasi</h6>
                                                    <button
                                                        type="button"
                                                        onClick={() => addBiayaItem(pIndex, 0, 'transportasi')}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        + Tambah Transportasi
                                                    </button>
                                                </div>
                                                {pegawai.biaya[0].transportasi.map((transport, tIndex) => (
                                                    <div key={tIndex} className="grid grid-cols-3 gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Jenis (Berangkat/Pulang)"
                                                            value={transport.trans}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'transportasi', tIndex, 'trans', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Harga"
                                                            value={transport.harga}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'transportasi', tIndex, 'harga', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <div className="flex items-center">
                                                            <div className="flex-1 px-3 py-2 bg-gray-100 rounded">
                                                                Rp {formatRupiah(transport.total)}
                                                            </div>
                                                            {pegawai.biaya[0].transportasi.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeBiayaItem(pIndex, 0, 'transportasi', tIndex)}
                                                                    className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Uang Harian */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h6 className="font-medium text-gray-700">Uang Harian</h6>
                                                    <button
                                                        type="button"
                                                        onClick={() => addBiayaItem(pIndex, 0, 'uang_harian_items')}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        + Tambah Uang Harian
                                                    </button>
                                                </div>
                                                {pegawai.biaya[0].uang_harian_items.map((uh, uIndex) => (
                                                    <div key={uIndex} className="grid grid-cols-4 gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Jenis"
                                                            value={uh.jenis}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'uang_harian_items', uIndex, 'jenis', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Qty"
                                                            value={uh.qty}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'uang_harian_items', uIndex, 'qty', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Harga"
                                                            value={uh.harga}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'uang_harian_items', uIndex, 'harga', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <div className="flex items-center">
                                                            <div className="flex-1 px-3 py-2 bg-gray-100 rounded">
                                                                Rp {formatRupiah(uh.total)}
                                                            </div>
                                                            {pegawai.biaya[0].uang_harian_items.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeBiayaItem(pIndex, 0, 'uang_harian_items', uIndex)}
                                                                    className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Penginapan */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <h6 className="font-medium text-gray-700">Penginapan</h6>
                                                    <button
                                                        type="button"
                                                        onClick={() => addBiayaItem(pIndex, 0, 'penginapan_items')}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        + Tambah Penginapan
                                                    </button>
                                                </div>
                                                {pegawai.biaya[0].penginapan_items.map((penginapan, pIdx) => (
                                                    <div key={pIdx} className="grid grid-cols-4 gap-2 mb-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Jenis"
                                                            value={penginapan.jenis}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'penginapan_items', pIdx, 'jenis', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Qty"
                                                            value={penginapan.qty}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'penginapan_items', pIdx, 'qty', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Harga"
                                                            value={penginapan.harga}
                                                            onChange={(e) => handleBiayaChange(pIndex, 0, 'penginapan_items', pIdx, 'harga', e.target.value)}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <div className="flex items-center">
                                                            <div className="flex-1 px-3 py-2 bg-gray-100 rounded">
                                                                Rp {formatRupiah(penginapan.total)}
                                                            </div>
                                                            {pegawai.biaya[0].penginapan_items.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeBiayaItem(pIndex, 0, 'penginapan_items', pIdx)}
                                                                    className="ml-2 px-3 py-2 bg-red-100 text-red-600 rounded"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (isEditMode) {
                                            cancelEdit();
                                        } else {
                                            setShowForm(false);
                                        }
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                                    disabled={formLoading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    disabled={formLoading}
                                >
                                    {formLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {isEditMode ? 'Memperbarui...' : 'Menyimpan...'}
                                        </>
                                    ) : isEditMode ? 'Perbarui Data' : 'Simpan Kegiatan & Pegawai'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Pesan untuk non-regular user yang mencoba akses form */}
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
                            <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('no_st')}>No & Tanggal ST</th>
                            <th className="px-6 py-3 text-left cursor-pointer" onClick={() => handleSort('mak')}>Kegiatan & MAK</th>
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
                                                {renderStatusBadge(item.status)}
                                                {/* Tampilkan informasi mengetahui jika ada */}
                                                {item.nama_kabalai && (
                                                    <div className="mt-1 text-xs text-blue-600">
                                                        Diketahui oleh: {item.nama_kabalai}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900">
                                                        {item.no_st || '-'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatDateForDisplay(item.tgl_st)}
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
                                                    
                                                    {/* ========== TOMBOL BARU UNTUK KABALAI ========== */}
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
                                                    {/* ========== END TOMBOL BARU ========== */}
                                                    
                                                    {/* Informasi PPK jika sudah dikirim */}
                                                    {(item.status === 'diajukan' || item.status === 'disetujui' || item.status === 'diketahui') && item.ppk_nama && (
                                                        <div className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                                                            <div className="font-medium">PPK: {item.ppk_nama}</div>
                                                            <div className="text-gray-500">
                                                                {item.status === 'diajukan' ? 'Diajukan' : 
                                                                 item.status === 'disetujui' ? 'Disetujui' : 
                                                                 item.status === 'diketahui' ? 'Diketahui Kabalai' : ''} 
                                                                pada {formatDateForDisplay(item.tanggal_diajukan || item.tanggal_disahkan || item.tanggal_diketahui)}
                                                            </div>
                                                            {item.catatan && (
                                                                <div className="mt-1 text-gray-500 italic">
                                                                    Catatan: {item.catatan}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                  
                                                    {/* Informasi Kabalai jika sudah mengetahui */}
                                                    {item.nama_kabalai && (
                                                        <div className="text-xs text-blue-600 mt-1 p-2 bg-blue-50 rounded">
                                                            <div className="font-medium">Diketahui oleh Kabalai: {item.nama_kabalai}</div>
                                                            <div className="text-blue-500">
                                                                Pada {formatDateForDisplay(item.tanggal_diketahui)}
                                                            </div>
                                                            {item.catatan_kabalai && (
                                                                <div className="mt-1 text-blue-500 italic">
                                                                    Catatan Kabalai: {item.catatan_kabalai}
                                                                </div>
                                                            )}
                                                        </div>
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
                                                                                            <table className="min-w-full border border-gray-400 text-sm mb-3">
                                                                                                <thead className="bg-gray-200">
                                                                                                    <tr>
                                                                                                        <th colSpan="2" className="border border-gray-700 px-2 py-1 text-center">Transportasi</th>
                                                                                                        <th colSpan="3" className="border border-gray-700 px-2 py-1 text-center">Uang Harian</th>
                                                                                                        <th colSpan="3" className="border border-gray-700 px-2 py-1 text-center">Penginapan</th>
                                                                                                    </tr>
                                                                                                    <tr>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Jenis</th>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Harga</th>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Jenis</th>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Qty</th>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Harga</th>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Jenis</th>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Qty</th>
                                                                                                        <th className="border border-gray-700 px-2 py-1">Harga</th>
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
                                                                                                            <tr key={i}>
                                                                                                                <td className="border px-2 py-1">
                                                                                                                    {b.transportasi[i]?.trans || ""}
                                                                                                                </td>
                                                                                                                <td className="border px-2 py-1 text-right">
                                                                                                                    {b.transportasi[i] ? formatRupiah(b.transportasi[i].harga) : ""}
                                                                                                                </td>
                                                                                                                <td className="border px-2 py-1">
                                                                                                                    {b.uang_harian[i]?.jenis || ""}
                                                                                                                </td>
                                                                                                                <td className="border px-2 py-1 text-center">
                                                                                                                    {b.uang_harian[i]?.qty || ""}
                                                                                                                </td>
                                                                                                                <td className="border px-2 py-1 text-right">
                                                                                                                    {b.uang_harian[i]
                                                                                                                        ? formatRupiah(b.uang_harian[i].harga)
                                                                                                                        : ""}
                                                                                                                </td>
                                                                                                                <td className="border px-2 py-1">
                                                                                                                    {b.penginapan[i]?.jenis || ""}
                                                                                                                </td>
                                                                                                                <td className="border px-2 py-1 text-center">
                                                                                                                    {b.penginapan[i]?.qty || ""}
                                                                                                                </td>
                                                                                                                <td className="border px-2 py-1 text-right">
                                                                                                                    {b.penginapan[i]
                                                                                                                        ? formatRupiah(b.penginapan[i].harga)
                                                                                                                        : ""}
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        ));
                                                                                                    })()}
                                                                                                </tbody>
                                                                                            </table>
                                                                                            <div className="text-right font-bold text-lg text-green-800">
                                                                                                Subtotal: Rp {formatRupiah(grandTotal)}
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

                {/* Modal Kirim ke PPK */}
                {showKirimPPKModal && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Kirim ke PPK</h3>
                                    <button
                                        onClick={handleCloseKirimPPKModal}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pilih PPK *
                                        </label>
                                        {loadingPpkList ? (
                                            <div className="flex items-center justify-center py-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedPpkId}
                                                onChange={handleSelectPpk}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">-- Pilih PPK --</option>
                                                {ppkList.map(ppk => (
                                                    <option key={ppk.user_id} value={ppk.user_id}>
                                                        {ppk.nama} - {ppk.jabatan}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            PPK yang dipilih
                                        </label>
                                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                            {selectedPpkNama ? (
                                                <div className="font-medium text-gray-900">{selectedPpkNama}</div>
                                            ) : (
                                                <div className="text-gray-500 italic">Belum memilih PPK</div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Catatan (Opsional)
                                        </label>
                                        <textarea
                                            value={catatanKirim}
                                            onChange={(e) => setCatatanKirim(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Tambahkan catatan untuk PPK..."
                                        />
                                    </div>
                                    
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                        <div className="flex items-start">
                                            <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <div className="text-sm text-yellow-700">
                                                <p className="font-medium">Perhatian!</p>
                                                <p>Setelah dikirim ke PPK, data tidak dapat diubah atau dihapus.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        onClick={handleCloseKirimPPKModal}
                                        disabled={loadingKirim}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleKirimKePPK}
                                        disabled={!selectedPpkId || loadingKirim}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {loadingKirim ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Mengirim...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Kirim ke PPK
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Persetujuan PPK */}
                {showPersetujuanModal && selectedKegiatanForApproval && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div 
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                                onClick={handleClosePersetujuanModal}
                            />
                            
                            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="rounded-lg bg-white/20 p-1.5">
                                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">Persetujuan Kegiatan</h3>
                                                <p className="text-sm text-blue-100">Tinjau dan berikan keputusan</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleClosePersetujuanModal}
                                            className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-5">
                                    {/* Kegiatan Info */}
                                    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">{selectedKegiatanForApproval.kegiatan}</h4>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    No. ST: {selectedKegiatanForApproval.no_st}
                                                </span>
                                                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    MAK: {selectedKegiatanForApproval.mak}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="space-y-1">
                                                <div className="text-gray-500">Total Biaya</div>
                                                <div className="font-semibold text-lg text-green-700">
                                                    Rp {formatRupiah(selectedKegiatanForApproval.total_nominatif || 0)}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-gray-500">Status Saat Ini</div>
                                                <div className="font-semibold text-yellow-700">Diajukan</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Catatan Input */}
                                    <div className="mb-6">
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Catatan Persetujuan
                                            <span className="ml-1 text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={catatanPersetujuan}
                                            onChange={(e) => setCatatanPersetujuan(e.target.value)}
                                            rows={4}
                                            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                            placeholder="Berikan catatan atau instruksi untuk pengaju..."
                                            required
                                        />
                                        <p className="mt-1.5 text-sm text-gray-500">
                                            Catatan akan ditampilkan kepada pengaju kegiatan
                                        </p>
                                    </div>
                                    
                                    {/* Informasi */}
                                    <div className="mb-6 rounded-lg bg-blue-50 p-4">
                                        <div className="flex">
                                            <svg className="h-5 w-5 flex-shrink-0 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div className="ml-3">
                                                <h4 className="text-sm font-medium text-blue-800">Informasi Penting</h4>
                                                <div className="mt-1 text-sm text-blue-700 space-y-1">
                                                    <p>• <span className="font-semibold">Setujui:</span> Status menjadi "Disetujui" dan tidak dapat diubah lagi</p>
                                                    <p>• <span className="font-semibold">Kembalikan:</span> Status menjadi "Draft" untuk diperbaiki pengaju</p>
                                                    <p>• Catatan wajib diisi untuk memberi tahu pengaju</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Footer / Actions */}
                                <div className="bg-gray-50 px-6 py-4">
                                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleClosePersetujuanModal}
                                            disabled={loadingPersetujuan}
                                            className="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                        >
                                            Batal
                                        </button>
                                        
                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => handleRejectKegiatan()}
                                                disabled={loadingPersetujuan || !catatanPersetujuan.trim()}
                                                className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
                                            >
                                                {loadingPersetujuan ? (
                                                    <>
                                                        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Memproses...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Kembalikan
                                                    </>
                                                )}
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={() => handleApproveKegiatan()}
                                                disabled={loadingPersetujuan}
                                                className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
                                            >
                                                {loadingPersetujuan ? (
                                                    <>
                                                        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Memproses...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Setujui
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== MODAL BARU UNTUK FITUR MENGETAHUI KABALAI ========== */}
                {showMengetahuiModal && selectedKegiatanForMengetahui && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div 
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                                onClick={handleCloseMengetahuiModal}
                            />
                            
                            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                                <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="rounded-lg bg-white/20 p-1.5">
                                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">Form Mengetahui Kegiatan</h3>
                                                <p className="text-sm text-teal-100">Sebagai Kepala Balai</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCloseMengetahuiModal}
                                            className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-5">
                                    {/* Kegiatan Info */}
                                    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3">
                                            <h4 className="text-lg font-semibold text-gray-900">{selectedKegiatanForMengetahui.kegiatan}</h4>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                    No. ST: {selectedKegiatanForMengetahui.no_st}
                                                </span>
                                                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    MAK: {selectedKegiatanForMengetahui.mak}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="space-y-1">
                                                <div className="text-gray-500">Total Biaya</div>
                                                <div className="font-semibold text-lg text-green-700">
                                                    Rp {formatRupiah(selectedKegiatanForMengetahui.total_nominatif || 0)}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-gray-500">Disetujui PPK</div>
                                                <div className="font-semibold text-green-700">
                                                    {selectedKegiatanForMengetahui.ppk_nama || 'PPK'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Form Mengetahui */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nama Kabalai *
                                            </label>
                                            <input
                                                type="text"
                                                name="nama_kabalai"
                                                value={formMengetahui.nama_kabalai}
                                                onChange={handleMengetahuiChange}
                                                required
                                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                                                placeholder="Nama Lengkap Kabalai"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                NIP Kabalai *
                                            </label>
                                            <input
                                                type="text"
                                                name="nip_kabalai"
                                                value={formMengetahui.nip_kabalai}
                                                onChange={handleMengetahuiChange}
                                                required
                                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                                                placeholder="NIP Kabalai"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Jabatan
                                            </label>
                                            <input
                                                type="text"
                                                name="jabatan_kabalai"
                                                value={formMengetahui.jabatan_kabalai}
                                                onChange={handleMengetahuiChange}
                                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                                                placeholder="Jabatan Kabalai"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tanggal Mengetahui
                                            </label>
                                            <input
                                                type="date"
                                                name="tanggal_mengetahui"
                                                value={formMengetahui.tanggal_mengetahui}
                                                onChange={handleMengetahuiChange}
                                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Catatan (Opsional)
                                            </label>
                                            <textarea
                                                name="catatan_kabalai"
                                                value={formMengetahui.catatan_kabalai}
                                                onChange={handleMengetahuiChange}
                                                rows={3}
                                                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
                                                placeholder="Tambahkan catatan jika diperlukan..."
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Informasi */}
                                    <div className="mt-6 rounded-lg bg-teal-50 p-4">
                                        <div className="flex">
                                            <svg className="h-5 w-5 flex-shrink-0 text-teal-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div className="ml-3">
                                                <h4 className="text-sm font-medium text-teal-800">Informasi Penting</h4>
                                                <div className="mt-1 text-sm text-teal-700 space-y-1">
                                                    <p>• Dengan mengisi form ini, Anda menyatakan telah mengetahui kegiatan ini</p>
                                                    <p>• Status kegiatan akan berubah menjadi "Diketahui Kabalai"</p>
                                                    <p>• Data yang sudah disimpan tidak dapat diubah</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Footer / Actions */}
                                <div className="bg-gray-50 px-6 py-4">
                                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleCloseMengetahuiModal}
                                            disabled={loadingMengetahui}
                                            className="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                        >
                                            Batal
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={handleSubmitMengetahui}
                                            disabled={loadingMengetahui || !formMengetahui.nama_kabalai.trim() || !formMengetahui.nip_kabalai.trim()}
                                            className="inline-flex w-full items-center justify-center rounded-lg border border-transparent bg-teal-600 px-4 py-2.5 text-base font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-sm"
                                        >
                                            {loadingMengetahui ? (
                                                <>
                                                    <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Memproses...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                    Simpan Mengetahui
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* ========== END MODAL BARU ========== */}

                {/* Notification Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div 
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                                onClick={closeModal}
                            />
                            
                            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle">
                                <div className="bg-white px-6 py-5">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                                {notificationMessage}
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    {notificationMessage.includes('berhasil') 
                                                        ? 'Tindakan telah berhasil diproses.' 
                                                        : 'Silakan coba lagi.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeModal();
                                            if (notificationMessage.includes('berhasil')) {
                                                fetchKegiatan();
                                            }
                                        }}
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                {confirmDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div 
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                                onClick={closeModal}
                            />
                            
                            <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                                <div className="bg-white px-6 py-5">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                                Konfirmasi Hapus Kegiatan
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Apakah Anda yakin ingin menghapus kegiatan ini? 
                                                    <span className="mt-1 block font-medium text-red-600">
                                                        Data yang sudah dihapus tidak dapat dipulihkan.
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        onClick={confirmDelete}
                                        disabled={deletingId === itemToDelete}
                                        className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {deletingId === itemToDelete ? (
                                            <>
                                                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Menghapus...
                                            </>
                                        ) : 'Ya, Hapus'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={deletingId === itemToDelete}
                                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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