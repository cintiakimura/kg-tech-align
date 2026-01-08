export const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
        console.warn("No data to export");
        return;
    }

    // Helper to flatten objects if needed or just take top level
    const flattenObject = (obj, prefix = '') => {
        return Object.keys(obj).reduce((acc, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k]) && !(obj[k] instanceof Date)) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    };

    // Flatten data for CSV
    const flatData = data.map(item => flattenObject(item));
    
    // Get all unique headers
    const headers = Array.from(new Set(flatData.reduce((acc, item) => [...acc, ...Object.keys(item)], [])));

    const csvContent = [
        headers.join(','),
        ...flatData.map(row => headers.map(fieldName => {
            let cell = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
            cell = cell.toString().replace(/"/g, '""'); // Escape quotes
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; // Quote if needed
            return cell;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};