// components/kegiatan/PegawaiDetail.js
import React from 'react';
import { formatRupiah } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext'; // Pastikan path ini sesuai

const PegawaiDetail = ({ biayaList }) => {
    const { user } = useAuth(); // Mengambil data user dari context auth
    
    // Debug: cek apakah user data tersedia
    console.log('User data:', user);
    
    return (
        <tr className="bg-gray-50">
            <td colSpan={8} className="px-4 py-2">
                {biayaList.map((b, idx) => {
                    // Menghitung total transportasi
                    const totalTransport = b.transportasi.reduce(
                        (sum, t) => sum + Number(t.total || 0),
                        0
                    );
                    
                    // Menghitung total uang harian
                    const totalUH = b.uang_harian.reduce(
                        (sum, u) => sum + Number(u.total || 0),
                        0
                    );
                    
                    // Menghitung total penginapan
                    const totalPenginapan = b.penginapan.reduce(
                        (sum, p) => sum + Number(p.total || 0),
                        0
                    );
                    
                    // Menghitung grand total
                    const grandTotal = totalTransport + totalUH + totalPenginapan;

                    return (
                        <div key={idx} className="mb-4 p-4 border border-gray-400 rounded-md bg-white">
                            {/* Header dengan informasi user */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                                <div>
                                    <h6 className="font-bold text-gray-800 text-lg mb-1">Rincian Biaya</h6>
                                    <p className="text-sm text-gray-600">Detail pengeluaran perjalanan dinas</p>
                                </div>
                                
                                {user && (
                                    <div className="mt-2 md:mt-0">
                                        <div className="inline-flex items-center bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                            <span className="text-sm font-medium text-gray-700 mr-2">User ID:</span>
                                            <span className="text-sm font-bold text-blue-600 mr-3">{user.id || user._id || 'N/A'}</span>
                                            <span className="text-gray-400 mx-1">•</span>
                                            <span className="text-sm font-medium text-gray-700 mr-2">Nama:</span>
                                            <span className="text-sm font-semibold text-gray-800">
                                                {user.name || user.username || user.email || 'User'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Tabel rincian biaya */}
                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full border border-gray-300 text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th colSpan="2" className="border border-gray-400 px-3 py-2 text-center bg-blue-100 font-semibold text-gray-800">
                                                Transportasi
                                            </th>
                                            <th colSpan="3" className="border border-gray-400 px-3 py-2 text-center bg-green-100 font-semibold text-gray-800">
                                                Uang Harian
                                            </th>
                                            <th colSpan="3" className="border border-gray-400 px-3 py-2 text-center bg-purple-100 font-semibold text-gray-800">
                                                Penginapan
                                            </th>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Jenis</th>
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Harga</th>
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Jenis</th>
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Qty</th>
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Harga</th>
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Jenis</th>
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Qty</th>
                                            <th className="border border-gray-400 px-2 py-2 text-left font-medium text-gray-700">Harga</th>
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
                                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="border border-gray-300 px-3 py-2">
                                                        {b.transportasi[i]?.trans || "-"}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                                                        {b.transportasi[i] ? formatRupiah(b.transportasi[i].harga) : "-"}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2">
                                                        {b.uang_harian[i]?.jenis || "-"}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2 text-center">
                                                        {b.uang_harian[i]?.qty || "-"}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                                                        {b.uang_harian[i]
                                                            ? formatRupiah(b.uang_harian[i].harga)
                                                            : "-"}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2">
                                                        {b.penginapan[i]?.jenis || "-"}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2 text-center">
                                                        {b.penginapan[i]?.qty || "-"}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                                                        {b.penginapan[i]
                                                            ? formatRupiah(b.penginapan[i].harga)
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Footer dengan subtotal dan info user */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="mb-3 md:mb-0">
                                    {user && (
                                        <div className="text-sm text-gray-600">
                                            <div className="flex items-center mb-1">
                                                <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                </svg>
                                                <span className="font-medium text-gray-700">Ditambahkan oleh: </span>
                                                <span className="ml-1 font-semibold text-gray-800">
                                                    {user.name || user.username} 
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-gray-600">User ID: </span>
                                                <span className="ml-1 font-bold text-blue-600">{user.id || user._id}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-3 rounded-lg border border-green-200 shadow-sm">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-600 mb-1">Subtotal</div>
                                        <div className="font-bold text-2xl text-green-700">
                                            Rp {formatRupiah(grandTotal)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Transport: Rp {formatRupiah(totalTransport)} • 
                                            Uang Harian: Rp {formatRupiah(totalUH)} • 
                                            Penginapan: Rp {formatRupiah(totalPenginapan)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </td>
        </tr>
    );
};

export default PegawaiDetail;