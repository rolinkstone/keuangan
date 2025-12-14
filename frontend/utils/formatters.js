// utils/formatters.js

export const formatRupiah = (value) => {
    return Number(value || 0).toLocaleString("id-ID");
};

export const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
        let date;
        
        if (dateString.includes('T') && dateString.includes('Z')) {
            date = new Date(dateString);
        } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateString.split('-');
            return `${day}-${month}-${year}`;
        } else {
            date = new Date(dateString);
        }
        
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

export const formatDateForInput = (dateString) => {
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
    const month = String(date.getDate() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

export const formatDateForBackend = (dateString) => {
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