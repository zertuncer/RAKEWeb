require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');

async function migrateData() {
    const dataFile = path.join(__dirname, 'applications.json');
    
    try {
        const data = await fs.readFile(dataFile, 'utf8');
        const applications = JSON.parse(data);
        
        if (applications.length === 0) {
            console.log("No data to migrate.");
            return;
        }

        const dbPool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'rake_db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log(`Starting migration of ${applications.length} applications...`);

        for (const app of applications) {
            const { id, fullName, email, phone, team, status, notes, createdAt, ...otherData } = app;
            
            // Reformat Date string if it is in ISO standard so MySQL doesn't complain
            let formattedDate = createdAt;
            if (formattedDate && formattedDate.includes('T')) {
                formattedDate = new Date(createdAt).toISOString().slice(0, 19).replace('T', ' ');
            }

            const newApp = {
                id: id || Date.now().toString(),
                fullName: fullName || '',
                email: email || '',
                phone: phone || '',
                team: team || '',
                status: status || 'Bekliyor',
                notes: notes || '',
                data: JSON.stringify(otherData),
                createdAt: formattedDate || new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            await dbPool.query(
                'INSERT IGNORE INTO applications (id, fullName, email, phone, team, status, notes, data, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newApp.id, newApp.fullName, newApp.email, newApp.phone, newApp.team, newApp.status, newApp.notes, newApp.data, newApp.createdAt]
            );
        }

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log("No applications.json found. Nothing to migrate.");
        } else {
            console.error("Migration error:", err);
        }
        process.exit(1);
    }
}

migrateData();
