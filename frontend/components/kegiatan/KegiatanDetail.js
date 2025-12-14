// components/kegiatan/KegiatanDetail.js
import React from 'react';
import PegawaiDetail from './PegawaiDetail';
import { formatRupiah } from '../../utils/formatters';

const KegiatanDetail = ({ item, detailData, pegawaiDetailShown, onTogglePegawaiDetail }) => {
    if (!detailData?.pegawai?.length) return null;

    return (
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
                        {detailData.pegawai.map(p => (
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
                                            onClick={() => onTogglePegawaiDetail(p.id)}
                                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                                        >
                                            {pegawaiDetailShown[p.id] ? 'Hide' : 'Show'}
                                        </button>
                                    </td>
                                </tr>
                                
                                {pegawaiDetailShown[p.id] && p.biaya_list && p.biaya_list.length > 0 && (
                                    <PegawaiDetail biayaList={p.biaya_list} />
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </td>
        </tr>
    );
};

export default KegiatanDetail;