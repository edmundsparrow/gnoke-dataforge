/* js/csv.js — CSV import and export */

const CSV = (() => {

  function parse(text) {
    const lines  = [];
    let field    = '';
    let inQuotes = false;
    let row      = [];

    const push = () => { row.push(field); field = ''; };
    const next = () => { lines.push(row); row = []; };

    for (let i = 0; i < text.length; i++) {
      const ch   = text[i];
      const peek = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && peek === '"') { field += '"'; i++; }
        else if (ch === '"')            { inQuotes = false; }
        else                            { field += ch; }
      } else {
        if      (ch === '"')  { inQuotes = true; }
        else if (ch === ',')  { push(); }
        else if (ch === '\r' && peek === '\n') { push(); next(); i++; }
        else if (ch === '\n') { push(); next(); }
        else                  { field += ch; }
      }
    }
    push();
    if (row.some(f => f !== '')) next();
    return lines;
  }

  function serialize(headers, rows) {
    const escape = v => {
      const s = String(v ?? '');
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ];
    return lines.join('\r\n');
  }

  function importFromFile() {
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.csv,text/csv,text/plain';

    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const result = _loadParsed(e.target.result);
        if (result) {
          State.filename  = file.name.replace(/\.csv$/i, '');
          State.isDemoData = false;
          const banner = document.getElementById('demo-banner');
          if (banner) banner.style.display = 'none';
          UI.toast('Imported: ' + file.name, 'ok');
        }
      };
      reader.onerror = () => UI.toast('Error reading file', 'err');
      reader.readAsText(file);
    });
    input.click();
  }

  function importFromText(csvString) {
    return _loadParsed(csvString);
  }

  function _loadParsed(csvString) {
    if (!csvString || !csvString.trim()) { UI.toast('Empty CSV', 'err'); return null; }
    const lines = parse(csvString.trim());
    if (lines.length < 1) { UI.toast('Could not parse CSV', 'err'); return null; }
    const headers = lines[0];
    const rows    = lines.slice(1);
    if (!headers.length) { UI.toast('No headers found in CSV', 'err'); return null; }
    Table.render(headers, rows, null);
    return { headers, rows };
  }

  function exportCSV() {
    const csv  = serialize(Table.getHeaders(), Table.getRows());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = State.getTableName() + '.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast('Exported .csv', 'ok');
  }

  return { importFromFile, importFromText, exportCSV };
})();
