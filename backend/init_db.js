const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const { ensureApplicationsSchema } = require('./schema');

async function initDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        charset: 'utf8mb4'
    });

    try {
        const dbName = process.env.DB_NAME || 'rake_db';
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        console.log(`Database '${dbName}' ensured.`);

        await connection.query(`USE \`${dbName}\`;`);
        await ensureApplicationsSchema(connection);
        console.log("Table 'applications' ensured (form alanları dahil).");
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

initDb();
