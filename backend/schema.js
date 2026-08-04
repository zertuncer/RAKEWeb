/**
 * applications tablosu kolonları — form alanları ile senkron
 * init_db / migrate_data / server / rake_db.sql bunu kullanır
 */

const APPLICATION_COLUMNS = [
    'id',
    'fullName',
    'email',
    'phone',
    'department',
    'team',
    'status',
    'notes',
    'qReason',
    'qCareer',
    'qProgram',
    'qClubs',
    'qTime',
    'qWeekend',
    'qMekanikTasarim',
    'qMekanikCad',
    'qMekanikUretim',
    'qYazilimDiller',
    'qYazilimLinux',
    'qYazilimRos',
    'qYazilimGithub',
    'qElektronikGomulu',
    'qElektronikPcb',
    'qElektronikDonanim',
    'qOrgDeneyim',
    'qOrgNeden',
    'data',
    'createdAt'
];

/** JSON body / applications.json içinden kolonlara map edilen alanlar (id/status/notes/data/createdAt hariç) */
const FORM_FIELD_COLUMNS = [
    'fullName',
    'email',
    'phone',
    'department',
    'team',
    'qReason',
    'qCareer',
    'qProgram',
    'qClubs',
    'qTime',
    'qWeekend',
    'qMekanikTasarim',
    'qMekanikCad',
    'qMekanikUretim',
    'qYazilimDiller',
    'qYazilimLinux',
    'qYazilimRos',
    'qYazilimGithub',
    'qElektronikGomulu',
    'qElektronikPcb',
    'qElektronikDonanim',
    'qOrgDeneyim',
    'qOrgNeden'
];

const CREATE_APPLICATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(50) NOT NULL,
    fullName VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    department VARCHAR(255) DEFAULT NULL,
    team VARCHAR(100) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'Bekliyor',
    notes TEXT,
    qReason TEXT,
    qCareer TEXT,
    qProgram VARCHAR(255) DEFAULT NULL,
    qClubs TEXT,
    qTime VARCHAR(50) DEFAULT NULL,
    qWeekend TEXT,
    qMekanikTasarim TEXT,
    qMekanikCad TEXT,
    qMekanikUretim TEXT,
    qYazilimDiller TEXT,
    qYazilimLinux TEXT,
    qYazilimRos TEXT,
    qYazilimGithub VARCHAR(500) DEFAULT NULL,
    qElektronikGomulu TEXT,
    qElektronikPcb TEXT,
    qElektronikDonanim TEXT,
    qOrgDeneyim TEXT,
    qOrgNeden TEXT,
    data JSON DEFAULT NULL,
    createdAt DATETIME DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

/**
 * Gelen kayıttan kolon değerlerini ve bilinmeyen alanları ayırır.
 */
function splitApplicationPayload(source = {}) {
    const row = {};
    const extra = {};

    for (const key of FORM_FIELD_COLUMNS) {
        const value = source[key];
        row[key] = value === undefined || value === null ? '' : String(value);
    }

    const reserved = new Set([
        ...FORM_FIELD_COLUMNS,
        'id',
        'status',
        'notes',
        'data',
        'createdAt'
    ]);

    for (const [key, value] of Object.entries(source)) {
        if (!reserved.has(key)) {
            extra[key] = value;
        }
    }

    return { row, extra };
}

function formatMysqlDate(value) {
    if (!value) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
    if (typeof value === 'string' && value.includes('T')) {
        return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
    }
    return value;
}

/** Kolon adı → ADD COLUMN DDL parçası (eski tabloları yükseltmek için) */
const COLUMN_DEFINITIONS = {
    fullName: 'VARCHAR(255) DEFAULT NULL',
    email: 'VARCHAR(255) DEFAULT NULL',
    phone: 'VARCHAR(50) DEFAULT NULL',
    department: 'VARCHAR(255) DEFAULT NULL',
    team: 'VARCHAR(100) DEFAULT NULL',
    status: "VARCHAR(50) DEFAULT 'Bekliyor'",
    notes: 'TEXT',
    qReason: 'TEXT',
    qCareer: 'TEXT',
    qProgram: 'VARCHAR(255) DEFAULT NULL',
    qClubs: 'TEXT',
    qTime: 'VARCHAR(50) DEFAULT NULL',
    qWeekend: 'TEXT',
    qMekanikTasarim: 'TEXT',
    qMekanikCad: 'TEXT',
    qMekanikUretim: 'TEXT',
    qYazilimDiller: 'TEXT',
    qYazilimLinux: 'TEXT',
    qYazilimRos: 'TEXT',
    qYazilimGithub: 'VARCHAR(500) DEFAULT NULL',
    qElektronikGomulu: 'TEXT',
    qElektronikPcb: 'TEXT',
    qElektronikDonanim: 'TEXT',
    qOrgDeneyim: 'TEXT',
    qOrgNeden: 'TEXT',
    data: 'JSON DEFAULT NULL',
    createdAt: 'DATETIME DEFAULT NULL'
};

/**
 * Tabloyu oluşturur ve eksik kolonları ekler (eski şema yükseltmesi).
 */
async function ensureApplicationsSchema(connection) {
    await connection.query(CREATE_APPLICATIONS_TABLE_SQL);

    const [cols] = await connection.query(
        `SELECT COLUMN_NAME AS name
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'applications'`
    );
    const existing = new Set(cols.map((c) => c.name));

    for (const col of APPLICATION_COLUMNS) {
        if (col === 'id' || existing.has(col)) continue;
        const def = COLUMN_DEFINITIONS[col];
        if (!def) continue;
        await connection.query(`ALTER TABLE applications ADD COLUMN \`${col}\` ${def}`);
        console.log(`Added missing column: ${col}`);
    }
}

module.exports = {
    APPLICATION_COLUMNS,
    FORM_FIELD_COLUMNS,
    CREATE_APPLICATIONS_TABLE_SQL,
    COLUMN_DEFINITIONS,
    splitApplicationPayload,
    formatMysqlDate,
    ensureApplicationsSchema
};
