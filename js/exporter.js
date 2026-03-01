/* js/exporter.js — all export formats: .json, entity.json, .sql, .sqlite */

const Exporter = (() => {

  function exportJSON() {
    const data = { headers: Table.getHeaders(), rows: Table.getRows(), _schema: State.colSchema };
    _download(JSON.stringify(data, null, 2), State.getTableName() + '.json', 'application/json');
    UI.toast('Exported .json', 'ok');
  }

  function exportEntityJSON() {
    const headers = Table.getHeaders();
    const rows    = Table.getRows();
    const entity  = { [State.getTableName()]: [headers, ...rows] };
    _download(JSON.stringify(entity, null, 2), State.getTableName() + '.entity.json', 'application/json');
    UI.toast('Exported entity JSON ✦', 'ok');
  }

  function exportSQL() {
    const name    = State.getTableName();
    const headers = Table.getHeaders();
    const rows    = Table.getRows();
    const lines   = [
      `-- Gnoke DataForge SQL Export`,
      `-- Table: ${name}\n`,
      `DROP TABLE IF EXISTS "${name}";`
    ];

    const colDefs = headers.map((h, i) => {
      const s = State.getSchema(i);
      let def = `  "${h}" ${s.type}`;
      if (s.pk)               def += ' PRIMARY KEY';
      if (s.notnull && !s.pk) def += ' NOT NULL';
      if (s.unique  && !s.pk) def += ' UNIQUE';
      return def;
    });
    lines.push(`CREATE TABLE "${name}" (\n${colDefs.join(',\n')}\n);\n`);

    rows.forEach(row => {
      const vals = row.map(v => `'${String(v).replace(/'/g, "''")}'`).join(', ');
      lines.push(`INSERT INTO "${name}" VALUES (${vals});`);
    });

    _download(lines.join('\n'), name + '.sql', 'text/plain');
    UI.toast('Exported .sql', 'ok');
  }

  async function exportSQLite() {
    if (!State.sqlModule) { UI.toast('sql.js not loaded', 'err'); return; }

    const name    = State.getTableName();
    const headers = Table.getHeaders();
    const rows    = Table.getRows();

    try {
      const db = new State.sqlModule.Database();

      const colDefs = headers.map((h, i) => {
        const s = State.getSchema(i);
        let def = `"${h}" ${s.type}`;
        if (s.pk)               def += ' PRIMARY KEY';
        if (s.notnull && !s.pk) def += ' NOT NULL';
        if (s.unique  && !s.pk) def += ' UNIQUE';
        return def;
      }).join(', ');

      db.run(`CREATE TABLE "${name}" (${colDefs})`);
      const placeholders = headers.map(() => '?').join(', ');
      rows.forEach(row => db.run(`INSERT INTO "${name}" VALUES (${placeholders})`, row));

      const binary = db.export();
      const blob   = new Blob([binary], { type: 'application/octet-stream' });
      _downloadBlob(blob, name + '.sqlite');
      UI.toast('Exported .sqlite', 'ok');
    } catch (e) {
      UI.toast('SQLite error: ' + e.message, 'err');
    }
  }

  function _download(text, filename, mime) {
    _downloadBlob(new Blob([text], { type: mime }), filename);
  }

  function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { exportJSON, exportEntityJSON, exportSQL, exportSQLite };
})();
