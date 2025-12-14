// components/kegiatan/KegiatanTable.js
import React from 'react';
import StatusBadge from '../common/StatusBadge';

const KegiatanTable = ({
    kegiatanList,
    detailShown,
    detailData,
    pegawaiDetailShown,
    userType,
    onToggleDetail,
    onTogglePegawaiDetail,
    onEdit,
    onDelete,
    sortConfig,
    onSort,
    formLoading
}) => {
    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? '↑' : '↓';
        }
        return '↕';
    };

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => onSort('id')}
                        >
                            ID {getSortIcon('id')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => onSort('no_st')}
                        >
                            No & Tanggal ST {getSortIcon('no_st')}
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => onSort('kegiatan')}
                        >
                            Kegiatan & MAK {getSortIcon('kegiatan')}
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => onSort('kota_kab_kecamatan')}
                        >
                            Lokasi {getSortIcon('kota_kab_kecamatan')}
                        </th>
                        <th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => onSort('total_nominatif')}
                        >
                            Total Nominatif {getSortIcon('total_nominatif')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {kegiatanList.length > 0 ? (
                        kegiatanList.map(item => (
                            <React.Fragment key={item.id}>
                                {/* Row utama */}
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={item.status} />
                                    </td>
                                  
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="font-medium text-gray-900">{item.kegiatan || '-'}</div>
                                            <div className="text-sm text-gray-500">{item.mak || '-'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.kota_kab_kecamatan || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                                        Rp {Number(item.total_nominatif || 0).toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex space-x-2">
                                            {userType.isRegularUser && 
                                             (item.status === 'dikembalikan') && (
                                                <>
                                                    <button
                                                        onClick={() => onEdit(item.id)}
                                                        className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-xs"
                                                        disabled={formLoading}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(item.id)}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-xs"
                                                        disabled={formLoading}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => onToggleDetail(item.id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs"
                                            >
                                                {detailShown[item.id] ? 'Sembunyikan Detail' : 'Lihat Detail'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Row detail yang bisa toggle */}
                                {detailShown[item.id] && (
                                    <tr className="bg-blue-50">
                                        <td colSpan="7" className="px-6 py-4">
                                            <div className="space-y-4">
                                                {/* Informasi dasar kegiatan */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-lg shadow">
                                                        <h4 className="font-semibold text-gray-700 mb-2">Informasi Kegiatan</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex">
                                                                <span className="w-1/3 text-sm text-gray-600">Realisasi Anggaran Sebelumnya:</span>
                                                                <span className="w-2/3 text-sm font-medium">
                                                                    {detailData[item.id]?.realisasi_anggaran_sebelumnya || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex">
                                                                <span className="w-1/3 text-sm text-gray-600">Target Output Tahun:</span>
                                                                <span className="w-2/3 text-sm font-medium">
                                                                    {detailData[item.id]?.target_output_tahun || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex">
                                                                <span className="w-1/3 text-sm text-gray-600">Realisasi Output Sebelumnya:</span>
                                                                <span className="w-2/3 text-sm font-medium">
                                                                    {detailData[item.id]?.realisasi_output_sebelumnya || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex">
                                                                <span className="w-1/3 text-sm text-gray-600">Target Output Yang Dicapai:</span>
                                                                <span className="w-2/3 text-sm font-medium">
                                                                    {detailData[item.id]?.target_output_yg_akan_dicapai || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-white p-4 rounded-lg shadow">
                                                        <h4 className="font-semibold text-gray-700 mb-2">Informasi Pelaksanaan</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex">
                                                                <span className="w-1/3 text-sm text-gray-600">Rencana Tanggal Pelaksanaan:</span>
                                                                <span className="w-2/3 text-sm font-medium">
                                                                    {detailData[item.id]?.rencana_tanggal_pelaksanaan || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex">
                                                                <span className="w-1/3 text-sm text-gray-600">Dibuat oleh:</span>
                                                                <span className="w-2/3 text-sm font-medium">
                                                                    {detailData[item.id]?.user?.name || detailData[item.id]?.user?.email || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex">
                                                                <span className="w-1/3 text-sm text-gray-600">Tanggal Dibuat:</span>
                                                                <span className="w-2/3 text-sm font-medium">
                                                                    {detailData[item.id]?.created_at ? new Date(detailData[item.id].created_at).toLocaleDateString('id-ID') : '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Daftar pegawai */}
                                                {detailData[item.id]?.pegawai && detailData[item.id].pegawai.length > 0 && (
                                                    <div className="bg-white p-4 rounded-lg shadow">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="font-semibold text-gray-700">Daftar Pegawai</h4>
                                                            <button
                                                                onClick={() => onTogglePegawaiDetail(item.id)}
                                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition text-xs"
                                                            >
                                                                {pegawaiDetailShown[item.id] ? 'Sembunyikan Pegawai' : 'Tampilkan Pegawai'}
                                                            </button>
                                                        </div>
                                                        
                                                        {pegawaiDetailShown[item.id] && (
                                                            <div className="space-y-3">
                                                                {detailData[item.id].pegawai.map((pegawai, index) => (
                                                                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div>
                                                                                <h5 className="font-medium text-gray-800">{pegawai.nama || 'Nama tidak tersedia'}</h5>
                                                                                <p className="text-sm text-gray-600">NIP: {pegawai.nip || '-'} | Jabatan: {pegawai.jabatan || '-'}</p>
                                                                            </div>
                                                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                                                                Total Biaya: Rp {Number(pegawai.total_biaya || 0).toLocaleString('id-ID')}
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        {/* Detail biaya per pegawai */}
                                                                        {pegawai.biaya && pegawai.biaya.length > 0 && (
                                                                            <div className="ml-4 mt-2 space-y-2">
                                                                                {/* Transportasi */}
                                                                                {pegawai.biaya[0]?.transportasi && pegawai.biaya[0].transportasi.length > 0 && (
                                                                                    <div>
                                                                                        <h6 className="text-sm font-medium text-gray-700 mb-1">Transportasi:</h6>
                                                                                        <div className="overflow-x-auto">
                                                                                            <table className="min-w-full text-xs">
                                                                                                <thead>
                                                                                                    <tr>
                                                                                                        <th className="px-2 py-1 text-left">Jenis</th>
                                                                                                        <th className="px-2 py-1 text-left">Harga</th>
                                                                                                        <th className="px-2 py-1 text-left">Total</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {pegawai.biaya[0].transportasi.map((t, i) => (
                                                                                                        t.trans && (
                                                                                                            <tr key={i}>
                                                                                                                <td className="px-2 py-1">{t.trans}</td>
                                                                                                                <td className="px-2 py-1">Rp {Number(t.harga || 0).toLocaleString('id-ID')}</td>
                                                                                                                <td className="px-2 py-1">Rp {Number(t.total || 0).toLocaleString('id-ID')}</td>
                                                                                                            </tr>
                                                                                                        )
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                
                                                                                {/* Uang Harian */}
                                                                                {pegawai.biaya[0]?.uang_harian_items && pegawai.biaya[0].uang_harian_items.length > 0 && (
                                                                                    <div>
                                                                                        <h6 className="text-sm font-medium text-gray-700 mb-1">Uang Harian:</h6>
                                                                                        <div className="overflow-x-auto">
                                                                                            <table className="min-w-full text-xs">
                                                                                                <thead>
                                                                                                    <tr>
                                                                                                        <th className="px-2 py-1 text-left">Jenis</th>
                                                                                                        <th className="px-2 py-1 text-left">Qty</th>
                                                                                                        <th className="px-2 py-1 text-left">Harga</th>
                                                                                                        <th className="px-2 py-1 text-left">Total</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {pegawai.biaya[0].uang_harian_items.map((u, i) => (
                                                                                                        u.jenis && (
                                                                                                            <tr key={i}>
                                                                                                                <td className="px-2 py-1">{u.jenis}</td>
                                                                                                                <td className="px-2 py-1">{u.qty}</td>
                                                                                                                <td className="px-2 py-1">Rp {Number(u.harga || 0).toLocaleString('id-ID')}</td>
                                                                                                                <td className="px-2 py-1">Rp {Number(u.total || 0).toLocaleString('id-ID')}</td>
                                                                                                            </tr>
                                                                                                        )
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                
                                                                                {/* Penginapan */}
                                                                                {pegawai.biaya[0]?.penginapan_items && pegawai.biaya[0].penginapan_items.length > 0 && (
                                                                                    <div>
                                                                                        <h6 className="text-sm font-medium text-gray-700 mb-1">Penginapan:</h6>
                                                                                        <div className="overflow-x-auto">
                                                                                            <table className="min-w-full text-xs">
                                                                                                <thead>
                                                                                                    <tr>
                                                                                                        <th className="px-2 py-1 text-left">Jenis</th>
                                                                                                        <th className="px-2 py-1 text-left">Qty</th>
                                                                                                        <th className="px-2 py-1 text-left">Harga</th>
                                                                                                        <th className="px-2 py-1 text-left">Total</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {pegawai.biaya[0].penginapan_items.map((p, i) => (
                                                                                                        p.jenis && (
                                                                                                            <tr key={i}>
                                                                                                                <td className="px-2 py-1">{p.jenis}</td>
                                                                                                                <td className="px-2 py-1">{p.qty}</td>
                                                                                                                <td className="px-2 py-1">Rp {Number(p.harga || 0).toLocaleString('id-ID')}</td>
                                                                                                                <td className="px-2 py-1">Rp {Number(p.total || 0).toLocaleString('id-ID')}</td>
                                                                                                            </tr>
                                                                                                        )
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="px-6 py-8 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg">Tidak ada data kegiatan ditemukan</p>
                                    <p className="text-sm mt-1">Coba ubah filter atau buat kegiatan baru</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default KegiatanTable;