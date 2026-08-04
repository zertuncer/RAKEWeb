const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const {
    APPLICATION_COLUMNS,
    ensureApplicationsSchema,
    splitApplicationPayload,
    formatMysqlDate
} = require('./schema');

async function migrateData() {
    const dataFile = path.join(__dirname, 'applications.json');

    try {
        const raw = await fs.readFile(dataFile, 'utf8');
        const applications = JSON.parse(raw);

        if (applications.length === 0) {
            console.log('No data to migrate.');
            return;
        }

        const dbPool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rake_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            charset: 'utf8mb4'
        });

        // Tablo yoksa oluştur, eksik kolonları ekle
        await ensureApplicationsSchema(dbPool);

        console.log(`Starting migration of ${applications.length} applications...`);

        const placeholders = APPLICATION_COLUMNS.map(() => '?').join(', ');
        const insertSql = `INSERT IGNORE INTO applications (${APPLICATION_COLUMNS.join(', ')}) VALUES (${placeholders})`;

        for (const app of applications) {
            const { row, extra } = splitApplicationPayload(app);

            const values = APPLICATION_COLUMNS.map((col) => {
                if (col === 'id') return app.id || Date.now().toString();
                if (col === 'status') return app.status || 'Bekliyor';
                if (col === 'notes') return app.notes || '';
                if (col === 'data') return JSON.stringify(extra);
                if (col === 'createdAt') return formatMysqlDate(app.createdAt);
                return row[col] ?? '';
            });

            await dbPool.query(insertSql, values);
        }

        console.log('Migration complete.');
        await dbPool.end();
        process.exit(0);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('No applications.json found. Nothing to migrate.');
            process.exit(0);
        } else {
            console.error('Migration error:', err);
            process.exit(1);
        }
    }
}

migrateData();
