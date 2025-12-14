// components/kegiatan/FilterSection.js
const FilterSection = ({
    showFilter,
    filterStatus,
    setFilterStatus,
    filterDateFrom,
    setFilterDateFrom,
    filterDateTo,
    setFilterDateTo,
    filterMak,
    setFilterMak,
    filterLokasi,
    setFilterLokasi,
    resetFilter,
    filteredKegiatan,
    kegiatanList
}) => {
    if (!showFilter) return null;

    return (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filter Data</h3>
                <button
                    onClick={resetFilter}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
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
                        <option value="diketahui">Diketahui</option>
                        <option value="selesai">Selesai</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal ST Dari
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
                        Tanggal ST Sampai
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
                        placeholder="Cari berdasarkan MAK"
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
                        placeholder="Cari berdasarkan lokasi"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
                Menampilkan {filteredKegiatan.length} dari {kegiatanList.length} kegiatan
            </div>
        </div>
    );
};

export default FilterSection;