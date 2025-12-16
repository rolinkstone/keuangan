// components/kegiatan/ActionButtons.js
const ActionButtons = ({ 
  item, 
  userType, 
  onEdit, 
  onDelete, 
  onPrint,
  onToggleDetail,
  onKirimPPK,
  onPersetujuan,
  onMengetahui,
  onSuratTugas,
  detailShown
}) => {
  const isEditable = userType.isRegularUser && 
    (item.status === 'draft' || item.status === 'dikembalikan');
  
  const canKirimPPK = userType.isRegularUser && 
    (item.status === 'draft' || item.status === 'dikembalikan');
  
  const canPersetujuan = userType.isPPK && item.status === 'diajukan';
  
  const canMengetahui = userType.isKabalai && 
    item.status === 'disetujui' && !item.nama_kabalai;
  
  const canSuratTugas = userType.isRegularUser && 
    item.status === 'diketahui' && 
    (!item.no_st || item.no_st.trim().length === 0);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isEditable && (
          <>
            <Button icon="✏️" color="indigo" onClick={() => onEdit(item.id)}>
              Edit
            </Button>
            <Button icon="🗑️" color="red" onClick={() => onDelete(item.id)}>
              Delete
            </Button>
          </>
        )}
        
        <Button 
          icon="🖨️" 
          color="gray" 
          onClick={() => onPrint(item)}
          title="Cetak Dokumen"
        >
          Print
        </Button>
        
        <Button 
          icon={detailShown ? '👁️' : '👁️‍🗨️'} 
          color="green" 
          onClick={() => onToggleDetail(item.id)}
        >
          {detailShown ? "Hide" : "Show"}
        </Button>
      </div>
      
      {canKirimPPK && (
        <Button 
          icon="📤" 
          color="purple" 
          onClick={() => onKirimPPK(item.id)}
          fullWidth
        >
          Kirim ke PPK
        </Button>
      )}
      
      {canPersetujuan && (
        <Button 
          icon="✓" 
          color="blue" 
          onClick={() => onPersetujuan(item.id, item)}
          fullWidth
        >
          Persetujuan
        </Button>
      )}
      
      {canMengetahui && (
        <Button 
          icon="👁️" 
          color="teal" 
          onClick={() => onMengetahui(item.id, item)}
          fullWidth
        >
          Mengetahui
        </Button>
      )}
      
      {canSuratTugas && (
        <Button 
          icon="📄" 
          color="orange" 
          onClick={() => onSuratTugas(item)}
          fullWidth
        >
          Surat Tugas
        </Button>
      )}
    </div>
  );
};

const Button = ({ icon, color, onClick, children, title, fullWidth = false }) => {
  const colorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    red: 'bg-red-600 hover:bg-red-700',
    gray: 'bg-gray-600 hover:bg-gray-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-3 py-1 text-white rounded-md transition ${colorClasses[color]} ${fullWidth ? 'w-full' : ''}`}
      title={title}
    >
      <span>{icon}</span>
      {children}
    </button>
  );
};

export default ActionButtons;