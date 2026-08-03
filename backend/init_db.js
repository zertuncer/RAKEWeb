require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDb() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    });

    try {
        const dbName = process.env.DB_NAME || 'rake_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`Database '${dbName}' ensured.`);

        await connection.query(`USE \`${dbName}\`;`);

        // Create applications table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS applications (
                id VARCHAR(50) PRIMARY KEY,
                fullName VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(50),
                team VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Bekliyor',
                notes TEXT,
                data JSON,
                createdAt DATETIME
            );
        `;
        await connection.query(createTableQuery);
        console.log("Table 'applications' ensured.");
    } catch (err) {
        console.error("Error initializing database:", err);
    } finally {
        await connection.end();
    }
}

initDb();
