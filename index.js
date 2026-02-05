const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3001;

console.log('--- Startup Config ---');
if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL for connection');
} else {
    console.log('Remote Host:', process.env.PG_HOST);
    console.log('Remote DB:', process.env.PG_DATABASE);
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check for Coolify
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Explicitly serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to get all assets (activos) with pagination
app.get('/activos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // Get total count for pagination metadata
        const countResult = await db.query('SELECT COUNT(*) FROM activos');
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated data
        const result = await db.query('SELECT * FROM activos ORDER BY id LIMIT $1 OFFSET $2', [limit, offset]);

        res.json({
            data: result.rows,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error('Error executing query:', err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
