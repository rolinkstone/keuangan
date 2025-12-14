// utils/printUtils.js

// Fungsi terbilang untuk konversi angka ke kata
export const terbilang = (angka) => {
  if (angka === 0) return 'nol';
  
  const bilangan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  
  const convert = (number) => {
    if (number < 12) {
      return bilangan[number];
    } else if (number < 20) {
      return convert(number - 10) + ' belas';
    } else if (number < 100) {
      return convert(Math.floor(number / 10)) + ' puluh ' + convert(number % 10);
    } else if (number < 200) {
      return 'seratus ' + convert(number - 100);
    } else if (number < 1000) {
      return convert(Math.floor(number / 100)) + ' ratus ' + convert(number % 100);
    } else if (number < 2000) {
      return 'seribu ' + convert(number - 1000);
    } else if (number < 1000000) {
      return convert(Math.floor(number / 1000)) + ' ribu ' + convert(number % 1000);
    } else if (number < 1000000000) {
      return convert(Math.floor(number / 1000000)) + ' juta ' + convert(number % 1000000);
    }
    return 'angka terlalu besar';
  };
  
  return convert(angka).replace(/\s+/g, ' ').trim();
};

// Format Rupiah helper
export const formatRupiah = (number) => {
  if (number === undefined || number === null) return '0';
  return Number(number).toLocaleString('id-ID');
};

// Format Date helper
export const formatDateForDisplay = (dateString) => {
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

// Format Date range untuk pelaksanaan
export const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return '-';
  
  try {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start && end) {
      const startDay = start.getDate();
      const startMonth = start.toLocaleDateString('id-ID', { month: 'long' });
      const startYear = start.getFullYear();
      const endDay = end.getDate();
      const endMonth = end.toLocaleDateString('id-ID', { month: 'long' });
      const endYear = end.getFullYear();
      
      if (startMonth === endMonth && startYear === endYear) {
        return `${startDay} s.d. ${endDay} ${startMonth} ${startYear}`;
      }
      return `${startDay} ${startMonth} ${startYear} s.d. ${endDay} ${endMonth} ${endYear}`;
    } else if (start) {
      const day = start.getDate();
      const month = start.toLocaleDateString('id-ID', { month: 'long' });
      const year = start.getFullYear();
      return `${day} ${month} ${year}`;
    }
    return formatDateForDisplay(startDate) || '-';
  } catch (error) {
    return `${formatDateForDisplay(startDate)} s.d. ${formatDateForDisplay(endDate)}`;
  }
};

// Fungsi untuk menghitung total dari biaya_list
export const calculateTotalFromBiayaList = (biayaList) => {
  let total = 0;
  
  if (biayaList && biayaList.length > 0) {
    biayaList.forEach(biaya => {
      // Hitung transportasi
      if (biaya.transportasi && biaya.transportasi.length > 0) {
        biaya.transportasi.forEach(t => {
          total += Number(t.total) || 0;
        });
      }
      
      // Hitung uang harian
      if (biaya.uang_harian && biaya.uang_harian.length > 0) {
        biaya.uang_harian.forEach(u => {
          total += Number(u.total) || 0;
        });
      }
      
      // Hitung penginapan
      if (biaya.penginapan && biaya.penginapan.length > 0) {
        biaya.penginapan.forEach(p => {
          total += Number(p.total) || 0;
        });
      }
    });
  }
  
  return total;
};

// Fungsi utama untuk handle print (satu halaman) - langsung print
export const handlePrint = (item, pegawaiList = [], formatRupiahFn = formatRupiah, formatDateFn = formatDateForDisplay) => {
  const printWindow = window.open('', '_blank');
  
  // Generate print content satu halaman dengan detail
  const printContent = generateOnePagePrintContentWithDetail(item, pegawaiList, formatRupiahFn, formatDateFn);
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Set timeout untuk auto print setelah konten selesai dimuat
  setTimeout(() => {
    try {
      printWindow.focus();
      printWindow.print();
      
      // Optional: Tutup window setelah print selesai
      printWindow.onafterprint = function() {
        setTimeout(() => {
          printWindow.close();
        }, 500);
      };
    } catch (error) {
      console.error('Error saat print:', error);
      // Jika auto print gagal, tetap tampilkan window untuk manual print
      printWindow.focus();
    }
  }, 500);
};

// Generate HTML content untuk print satu halaman DENGAN DETAIL
export const generateOnePagePrintContentWithDetail = (item, pegawaiList = [], formatRupiahFn, formatDateFn) => {
  // Hitung total keseluruhan
  let totalNominatif = item.total_nominatif || 0;
  let totalPegawai = 0;
  
  // Buat array untuk tabel pelaksana SPD
  let pelaksanaRows = '';
  // Buat array untuk tabel rincian biaya
  let rincianBiayaRows = '';
  
  if (pegawaiList && pegawaiList.length > 0) {
    pegawaiList.forEach((pegawai, index) => {
      const totalPegawaiIndividu = Number(pegawai.total_biaya) || 0;
      totalPegawai += totalPegawaiIndividu;
      
      // Hitung subtotal per kategori
      let subtotalTransportasi = 0;
      let subtotalUangHarian = 0;
      let subtotalPenginapan = 0;
      
      if (pegawai.biaya_list && pegawai.biaya_list.length > 0) {
        pegawai.biaya_list.forEach(biaya => {
          // Transportasi
          if (biaya.transportasi && biaya.transportasi.length > 0) {
            biaya.transportasi.forEach(t => {
              subtotalTransportasi += Number(t.total) || 0;
            });
          }
          
          // Uang Harian
          if (biaya.uang_harian && biaya.uang_harian.length > 0) {
            biaya.uang_harian.forEach(u => {
              subtotalUangHarian += Number(u.total) || 0;
            });
          }
          
          // Penginapan
          if (biaya.penginapan && biaya.penginapan.length > 0) {
            biaya.penginapan.forEach(p => {
              subtotalPenginapan += Number(p.total) || 0;
            });
          }
        });
      }
      
      // Row untuk tabel Pelaksana SPD
      pelaksanaRows += `
        <tr>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #000; padding: 4px;">${pegawai.nama || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px;">${pegawai.nip || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px;">${pegawai.jabatan || '-'}</td>
        </tr>
      `;
      
      // Row untuk tabel Rincian Biaya
      rincianBiayaRows += `
        <tr>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #000; padding: 4px;">${pegawai.nama || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: right;">Rp ${formatRupiahFn(subtotalTransportasi)}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: right;">Rp ${formatRupiahFn(subtotalUangHarian)}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: right;">Rp ${formatRupiahFn(subtotalPenginapan)}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">Rp ${formatRupiahFn(totalPegawaiIndividu)}</td>
        </tr>
      `;
    });
    
    // Tambahkan row total di akhir tabel Rincian Biaya
    rincianBiayaRows += `
      <tr style="background-color: #f0f0f0;">
        <td colspan="2" style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">JUMLAH TOTAL</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">Rp ${formatRupiahFn(pegawaiList.reduce((sum, p) => {
          let transport = 0;
          if (p.biaya_list && p.biaya_list.length > 0) {
            p.biaya_list.forEach(b => {
              if (b.transportasi) {
                b.transportasi.forEach(t => transport += Number(t.total) || 0);
              }
            });
          }
          return sum + transport;
        }, 0))}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">Rp ${formatRupiahFn(pegawaiList.reduce((sum, p) => {
          let uangHarian = 0;
          if (p.biaya_list && p.biaya_list.length > 0) {
            p.biaya_list.forEach(b => {
              if (b.uang_harian) {
                b.uang_harian.forEach(u => uangHarian += Number(u.total) || 0);
              }
            });
          }
          return sum + uangHarian;
        }, 0))}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">Rp ${formatRupiahFn(pegawaiList.reduce((sum, p) => {
          let penginapan = 0;
          if (p.biaya_list && p.biaya_list.length > 0) {
            p.biaya_list.forEach(b => {
              if (b.penginapan) {
                b.penginapan.forEach(pg => penginapan += Number(pg.total) || 0);
              }
            });
          }
          return sum + penginapan;
        }, 0))}</td>
        <td style="border: 1px solid #000; padding: 4px; text-align: right; font-weight: bold;">Rp ${formatRupiahFn(totalPegawai)}</td>
      </tr>
    `;
  }
  
  // Gunakan total yang sudah dihitung
  if (totalNominatif === 0) {
    totalNominatif = totalPegawai;
  }
  
  const terbilangText = terbilang(totalNominatif);
  const dateRange =    formatDateFn(item.rencana_tanggal_pelaksanaan) || '-';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Nominatif - ${item.kegiatan || 'Kegiatan'}</title>
      <meta charset="UTF-8">
      <style>
        /* RESET DAN GLOBAL STYLES */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
        
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.3;
          color: #000;
          width: 100%;
        }
        
        .no-print {
          display: none !important;
        }
        
        /* PRINT CONTENT STYLES */
        .print-container {
          max-width: 100%;
          padding: 5mm;
        }
        
        .header {
          text-align: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 2px solid #000;
        }
        
        .header h1 {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 3px;
          text-transform: uppercase;
        }
        
        .header h2 {
          font-size: 12pt;
          font-weight: normal;
          margin-bottom: 2px;
        }
        
        .header p {
          font-size: 10pt;
          margin: 1px 0;
        }
        
        .info-section {
          margin-bottom: 10px;
        }
        
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          font-size: 10pt;
        }
        
        .info-table th {
          border: 1px solid #000;
          padding: 5px 6px;
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
          width: 35%;
        }
        
        .info-table td {
          border: 1px solid #000;
          padding: 5px 6px;
          vertical-align: top;
          width: 65%;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 11pt;
          margin: 15px 0 8px 0;
          padding-bottom: 3px;
          border-bottom: 1px solid #000;
        }
        
        .detail-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10pt;
        }
        
        .detail-table th {
          border: 1px solid #000;
          padding: 6px 8px;
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
        }
        
        .detail-table td {
          border: 1px solid #000;
          padding: 5px 6px;
          vertical-align: middle;
        }
        
        .center {
          text-align: center;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .italic {
          font-style: italic;
        }
        
        .small-text {
          font-size: 9pt;
        }
        
        /* Total box */
        .total-box {
          border: 2px solid #000;
          padding: 10px;
          margin: 15px 0;
          text-align: center;
          background-color: #f9f9f9;
          page-break-inside: avoid;
        }
        
        .total-box h3 {
          font-size: 11pt;
          margin-bottom: 5px;
        }
        
        .total-amount {
          font-size: 14pt;
          font-weight: bold;
          color: #006400;
          margin: 5px 0;
        }
        
        .terbilang {
          font-style: italic;
          font-size: 10pt;
          margin: 3px 0;
        }
        
        /* Signature section */
        .signature-section {
          margin-top: 15px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        
        .signature-box {
          text-align: center;
          width: 32%;
        }
        
        .signature-line {
          margin-top: 40px;
          padding-top: 5px;
          border-top: 1px solid #000;
        }
        
        .signature-name {
          font-weight: bold;
          margin-top: 5px;
          font-size: 10pt;
        }
        
        .signature-nip {
          font-size: 9pt;
          margin-top: 2px;
        }
        
        /* Print info */
        .print-info {
          text-align: center;
          margin-top: 15px;
          font-size: 8pt;
          color: #666;
          page-break-inside: avoid;
        }
        
        /* Utility classes */
        .text-right {
          text-align: right;
        }
        
        .text-left {
          text-align: left;
        }
        
        .text-center {
          text-align: center;
        }
        
        .mt-1 {
          margin-top: 4px;
        }
        
        .mb-1 {
          margin-bottom: 4px;
        }
        
        /* Force single page */
        .single-page {
          page-break-before: avoid;
          page-break-after: avoid;
        }
        
        /* Print controls - hanya untuk preview */
        @media screen {
          .print-controls {
            display: block;
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 6px;
          }
          
          .print-btn {
            margin: 0 8px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
          }
          
          .close-btn {
            background: #f44336;
          }
        }
        
        @media print {
          .print-controls {
            display: none !important;
          }
        }
      </style>
    </head>
    <body onload="window.print()">
      <div class="print-container">
        <!-- HEADER -->
        <div class="header">
          <h1>DAFTAR RENCANA PERJALANAN DINAS JABATAN</h1>
        
          <p>No. ST:</strong> ${item.no_st || '-'} | <strong>Tanggal ST:</strong> ${formatDateFn(item.tgl_st) || '-'}</p>
        </div>
        
        <!-- INFORMASI UMUM -->
        <style>
  .info-table th:nth-child(1),
  .info-table td:nth-child(1) {
    width: 8%;
  }
  
  .info-table th:nth-child(2),
  .info-table td:nth-child(2) {
    width: 50%;
  }
  
  .info-table th:nth-child(3),
  .info-table td:nth-child(3) {
    width: 42%;
  }
</style>

<div class="info-section">
  <table class="info-table">
   
    <tr>
      <td class="center">1</td>
      <td>Kegiatan yang akan dilaksanakan</td>
      <td>${item.kegiatan || '-'}</td>
    </tr>
    <tr>
      <td class="center">2</td>
      <td>MAK</td>
      <td>${item.mak || '-'}</td>
    </tr>
    <tr>
      <td class="center">3</td>
      <td>Realisasi anggaran sebelumnya</td>
      <td>${item.realisasi_anggaran_sebelumnya || '-'}</td>
    </tr>
    <tr>
      <td class="center">4</td>
      <td>Target output 1 tahun</td>
      <td>${item.target_output_tahun || '-'}</td>
    </tr>
    <tr>
      <td class="center">5</td>
      <td>Realisasi output sebelumnya</td>
      <td>${item.realisasi_output_sebelumnya || '-'}</td>
    </tr>
    <tr>
      <td class="center">6</td>
      <td>Target output yang akan dicapai</td>
      <td>${item.target_output_yg_akan_dicapai || '-'}</td>
    </tr>
    <tr>
      <td class="center">7</td>
      <td>Kota/Kabupaten/Kecamatan tujuan</td>
      <td>${item.kota_kab_kecamatan || '-'}</td>
    </tr>
    <tr>
      <td class="center">8</td>
      <td>Rencana tanggal pelaksanaan</td>
      <td>${dateRange}</td>
    </tr>
    <tr>
      <td class="center">9</td>
      <td>Status Kegiatan</td>
      <td><strong>${item.status ? item.status.toUpperCase() : 'DRAFT'}</strong></td>
    </tr>
  </table>
</div>
        
        <!-- B. PELAKSANA SPD -->
        <div class="section-title">B. Pelaksana SPD</div>
        <table class="detail-table">
          <thead>
            <tr>
              <th width="5%" style="text-align: center;">No</th>
              <th width="35%" style="text-align: center;">Nama</th>
              <th width="25%" style="text-align: center;">NIP</th>
              <th width="35%" style="text-align: center;">Jabatan</th>
            </tr>
          </thead>
          <tbody>
            ${pelaksanaRows || `
              <tr>
                <td colspan="4" style="text-align: center; padding: 15px; font-style: italic;">
                  Tidak ada data pelaksana
                </td>
              </tr>
            `}
          </tbody>
        </table>
        
        <!-- C. RINCIAN BIAYA -->
        <div class="section-title">C. Rincian Biaya</div>
        <table class="detail-table">
          <thead>
            <tr>
              <th width="5%" style="text-align: center;">No</th>
              <th width="25%" style="text-align: center;">Nama</th>
              <th width="15%" style="text-align: center;">Transport</th>
              <th width="15%" style="text-align: center;">Uang Harian</th>
              <th width="15%" style="text-align: center;">Penginapan</th>
              <th width="15%" style="text-align: center;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rincianBiayaRows || `
              <tr>
                <td colspan="6" style="text-align: center; padding: 15px; font-style: italic;">
                  Tidak ada data rincian biaya
                </td>
              </tr>
            `}
          </tbody>
        </table>
        
       
        
        <!-- SIGNATURE SECTION -->
        <div class="signature-section">
          
          
          <div class="signature-box">
            <div>Menyetujui PPK,</div>
            <div class="signature-line"></div>
            <div class="signature-name">${item.ppk_nama || item.nama_ppk || '____________________'}</div>
            <div class="signature-nip">NIP: ${item.nip_ppk || '_________________'}</div>
          </div>
          
          <div class="signature-box">
            <div>Mengetahui Kabalai,</div>
            <div class="signature-line"></div>
            <div class="signature-name">${item.nama_kabalai || '____________________'}</div>
            <div class="signature-nip">NIP: ${item.nip_kabalai || '_________________'}</div>
          </div>
        </div>
        
        <!-- PRINT INFO -->
        <div class="print-info">
          <div>Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
          <div>Halaman 1 dari 1</div>
        </div>
        
        <!-- PRINT CONTROLS (hanya tampil di screen) -->
        <div class="print-controls no-print">
          <button onclick="window.print()" class="print-btn">🖨️ Cetak Sekarang</button>
          <button onclick="window.close()" class="print-btn close-btn">✕ Tutup Preview</button>
        </div>
      </div>
      
      <script>
        // Auto print langsung ketika halaman load
        window.onload = function() {
          window.print();
          
          // Tutup window setelah print (opsional)
          window.onafterprint = function() {
            setTimeout(function() {
              window.close();
            }, 1000);
          };
          
          // Fallback jika onafterprint tidak support
          setTimeout(function() {
            window.close();
          }, 3000);
        };
        
        // Fallback untuk browser yang tidak support onafterprint
        window.onfocus = function() {
          setTimeout(function() {
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
};

// Fungsi untuk print dengan preview (tanpa auto print)
export const handlePrintWithPreview = (item, pegawaiList = [], formatRupiahFn = formatRupiah, formatDateFn = formatDateForDisplay) => {
  const printWindow = window.open('', '_blank');
  
  // Generate print content tanpa auto print
  const printContent = generateOnePagePrintContentWithDetail(item, pegawaiList, formatRupiahFn, formatDateFn).replace('onload="window.print()"', '');
  
  printWindow.document.write(printContent);
  printWindow.document.close();
};

// Fungsi untuk print detail (versi lama, tetap disimpan untuk kompatibilitas)
export const handlePrintWithDetail = (item, detailData, formatRupiahFn = formatRupiah, formatDateFn = formatDateForDisplay) => {
  const printWindow = window.open('', '_blank');
  
  // Gunakan fungsi satu halaman dengan detail
  const pegawaiList = detailData?.[item.id]?.pegawai || [];
  const printContent = generateOnePagePrintContentWithDetail(item, pegawaiList, formatRupiahFn, formatDateFn);
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Auto print
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Versi ringkas tanpa detail (untuk kebutuhan tertentu)
export const generateOnePagePrintContent = (item, pegawaiList = [], formatRupiahFn, formatDateFn) => {
  // Hitung total
  let totalNominatif = item.total_nominatif || 0;
  
  if (totalNominatif === 0 && pegawaiList && pegawaiList.length > 0) {
    pegawaiList.forEach(pegawai => {
      totalNominatif += Number(pegawai.total_biaya) || 0;
    });
  }
  
  const terbilangText = terbilang(totalNominatif);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Nominatif - ${item.kegiatan || 'Kegiatan'}</title>
      <meta charset="UTF-8">
      <style>
        /* Styles ringkas */
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Times New Roman'; font-size: 11pt; }
        .header { text-align: center; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #000; padding: 6px; }
        th { background: #f0f0f0; }
        .total { border: 2px solid #000; padding: 10px; text-align: center; margin: 15px 0; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="header">
        <h1>NOMINATIF KEGIATAN</h1>
        <h2>${item.kegiatan || '-'}</h2>
      </div>
      
      <table>
        <tr><th>Informasi</th><th>Detail</th></tr>
        <tr><td>Kegiatan</td><td>${item.kegiatan || '-'}</td></tr>
        <tr><td>MAK</td><td>${item.mak || '-'}</td></tr>
        <tr><td>No. ST</td><td>${item.no_st || '-'}</td></tr>
        <tr><td>Tanggal Pelaksanaan</td><td>${formatDateFn(item.rencana_tanggal_pelaksanaan) || '-'}</td></tr>
        <tr><td>Lokasi</td><td>${item.kota_kab_kecamatan || '-'}</td></tr>
      </table>
      
      <div class="total">
        <h2>TOTAL NOMINATIF</h2>
        <h1>Rp ${formatRupiahFn(totalNominatif)}</h1>
        <p><em>${terbilangText} Rupiah</em></p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
};

// Generate content untuk preview (tanpa auto print)
export const generatePreviewContent = (item, pegawaiList = [], formatRupiahFn, formatDateFn) => {
  const content = generateOnePagePrintContentWithDetail(item, pegawaiList, formatRupiahFn, formatDateFn);
  return content.replace('onload="window.print()"', '');
};

// Export semua fungsi
export default {
  handlePrint,                    // Langsung print dengan detail
  handlePrintWithPreview,         // Preview dulu dengan detail
  handlePrintWithDetail,          // Untuk kompatibilitas
  generateOnePagePrintContentWithDetail, // Generate dengan detail
  generateOnePagePrintContent,    // Generate ringkas
  generatePreviewContent,         // Generate preview
  terbilang,
  formatRupiah,
  formatDateForDisplay,
  formatDateRange,
  calculateTotalFromBiayaList     // Fungsi helper baru
};