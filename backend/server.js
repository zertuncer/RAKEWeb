const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const {
    APPLICATION_COLUMNS,
    splitApplicationPayload,
    formatMysqlDate
} = require('./schema');

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rake_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+03:00',
    charset: 'utf8mb4'
});

app.set('trust proxy', 1);

app.use(cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Basic Auth Middleware (dashboard API)
const auth = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const decoded = Buffer.from(b64auth, 'base64').toString();
    const colon = decoded.indexOf(':');
    const login = (colon === -1 ? decoded : decoded.slice(0, colon)).trim();
    const password = (colon === -1 ? '' : decoded.slice(colon + 1)).trim();

    if (login === String(ADMIN_USER).trim() && password === String(ADMIN_PASSWORD).trim()) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Yetkisiz erişim. Lütfen giriş yapınız.');
};

// Health check (cPanel / monitoring)
app.get('/api/health', async (req, res) => {
    try {
        await dbPool.query('SELECT 1');
        res.json({ ok: true, db: true });
    } catch (error) {
        console.error('Health check DB error:', error.message);
        res.status(503).json({ ok: false, db: false, error: 'Veritabanı bağlantısı yok' });
    }
});

// Serve dashboard explicitly (auth handled via custom UI)
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dashboard.html'));
});

// Static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// POST: Submit a new application
app.post('/api/apply', async (req, res) => {
    try {
        const id = Date.now().toString();
        const { row, extra } = splitApplicationPayload(req.body);
        const createdAt = formatMysqlDate(new Date().toISOString());

        const record = {
            id,
            ...row,
            status: 'Bekliyor',
            notes: '',
            data: JSON.stringify(extra),
            createdAt
        };

        const placeholders = APPLICATION_COLUMNS.map(() => '?').join(', ');
        const values = APPLICATION_COLUMNS.map((col) => record[col] ?? '');

        await dbPool.query(
            `INSERT INTO applications (${APPLICATION_COLUMNS.join(', ')}) VALUES (${placeholders})`,
            values
        );

        res.status(201).json({
            success: true,
            message: 'Başvuru alındı',
            data: { ...record, ...extra, data: undefined }
        });
    } catch (error) {
        console.error('Error saving application to MySQL:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// GET: Retrieve all applications
app.get('/api/applications', auth, async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT * FROM applications ORDER BY createdAt DESC');
        const applications = rows.map((row) => {
            const dataObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
            const { data: _data, ...fields } = row;
            return {
                ...fields,
                ...dataObj
            };
        });
        res.json(applications);
    } catch (error) {
        console.error('Error reading applications from MySQL:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// PUT: Update an application's status or notes
app.put('/api/applications/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

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
        console.error('Error updating application in MySQL:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// Catch-all for SPA / unknown routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

function startServer() {
    // cPanel Passenger (Setup Node.js App)
    if (typeof PhusionPassenger !== 'undefined') {
        PhusionPassenger.configure({ autoInstall: false });
        app.listen('passenger', () => {
            console.log('Server is running on Passenger (cPanel)');
        });
        return;
    }

    app.listen(PORT, HOST, () => {
        console.log(`Server is running on http://${HOST}:${PORT}`);
    });
}

startServer();
