const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rake_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.use(cors());
app.use(express.json());

// Basic Auth Middleware
const auth = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    // Default admin credentials
    if (login === 'admin' && password === 'admin123') {
        return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Yetkisiz erişim. Lütfen giriş yapınız.');
};

// Serve dashboard explicitly (without native auth, handled via custom UI)
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dashboard.html'));
});

// Serve static files from the root directory so the dashboard and index can be loaded
app.use(express.static(path.join(__dirname, '../frontend')));

// POST: Submit a new application
app.post('/api/apply', async (req, res) => {
    try {
        const id = Date.now().toString();
        const { fullName, email, phone, team, ...otherData } = req.body;
        
        const newApp = {
            id,
            fullName: fullName || '',
            email: email || '',
            phone: phone || '',
            team: team || '',
            status: 'Bekliyor',
            notes: '',
            data: JSON.stringify(otherData),
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        
        await dbPool.query(
            'INSERT INTO applications (id, fullName, email, phone, team, status, notes, data, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [newApp.id, newApp.fullName, newApp.email, newApp.phone, newApp.team, newApp.status, newApp.notes, newApp.data, newApp.createdAt]
        );

        res.status(201).json({ success: true, message: 'Başvuru alındı', data: { ...newApp, ...otherData } });
    } catch (error) {
        console.error("Error saving application to MySQL:", error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// GET: Retrieve all applications
app.get('/api/applications', auth, async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT * FROM applications ORDER BY createdAt DESC');
        // Parse the 'data' JSON string back to object properties
        const applications = rows.map(row => {
            const dataObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
            return {
                id: row.id,
                fullName: row.fullName,
                email: row.email,
                phone: row.phone,
                team: row.team,
                status: row.status,
                notes: row.notes,
                createdAt: row.createdAt,
                ...dataObj
            };
        });
        res.json(applications);
    } catch (error) {
        console.error("Error reading applications from MySQL:", error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// PUT: Update an application's status or notes
app.put('/api/applications/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        // Update fields if provided
        const updates = [];
        const values = [];
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }

        if (updates.length > 0) {
            values.push(id);
            await dbPool.query(`UPDATE applications SET ${updates.join(', ')} WHERE id = ?`, values);
        }
        
        const [rows] = await dbPool.query('SELECT * FROM applications WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Başvuru bulunamadı' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error updating application in MySQL:", error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Catch-all for SPA routing (must be after all other routes and static files)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
