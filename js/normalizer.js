/* js/normalizer.js — JSON shape normalizer */

const Normalizer = (() => {

  function normalize(data) {
    // Case 0: { entity: [["h1","h2"], ["v1","v2"], ...] }
    if (isObject(data) && singleKey(data)) {
      const k = Object.keys(data)[0];
      const v = data[k];
      if (Array.isArray(v) && Array.isArray(v[0]) && v.slice(1).every(r => Array.isArray(r))) {
        return { headers: v[0], rows: v.slice(1), schema: data._schema || null };
      }
      if (v && Array.isArray(v.header) && Array.isArray(v.row)) {
        return { headers: v.header, rows: v.row, schema: v._schema || null };
      }
    }

    // Case 2: { headers:[], rows:[[]], _schema:[] }
    if (data && Array.isArray(data.headers) && Array.isArray(data.rows)) {
      return { headers: data.headers, rows: data.rows, schema: data._schema || null };
    }

    // Case 3: Array of objects
    if (Array.isArray(data) && data.length && isObject(data[0])) {
      const headers = Object.keys(data[0]);
      const rows = data.map(o => headers.map(h => o[h] !== undefined ? String(o[h]) : ''));
      return { headers, rows, schema: null };
    }

    // Case 4: Single object
    if (isObject(data) && !Array.isArray(data)) {
      const headers = Object.keys(data);
      const rows = [Object.values(data).map(v => String(v ?? ''))];
      return { headers, rows, schema: null };
    }

    // Case 5: Array of primitives
    if (Array.isArray(data) && data.every(i => typeof i !== 'object' || i === null)) {
      return {
        headers: data.map((_, i) => `Column ${i + 1}`),
        rows: [data.map(v => String(v))],
        schema: null
      };
    }

    // Case 6: Mixed array
    if (Array.isArray(data)) {
      const allKeys = new Set();
      data.forEach(item => {
        if (isObject(item) && !Array.isArray(item)) Object.keys(item).forEach(k => allKeys.add(k));
      });
      const headers = allKeys.size > 0 ? [...allKeys] : data.map((_, i) => `Column ${i + 1}`);
      const rows = data.map(item => {
        if (isObject(item) && !Array.isArray(item)) return headers.map(h => item[h] !== undefined ? String(item[h]) : '');
        return [String(item)];
      });
      return { headers, rows, schema: null };
    }

    // Case 7: Fallback
    return { headers: ['Value'], rows: [[String(data)]], schema: null };
  }

  function isObject(v) { return typeof v === 'object' && v !== null; }
  function singleKey(o) { return Object.keys(o).length === 1; }

  return { normalize };
})();
