const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');

// Load environment variables from the backend directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_DATABASE:', process.env.DB_NAME || process.env.DB_DATABASE);
console.log('DB_PORT:', process.env.DB_PORT);

// Create MySQL connection pool
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const app = express();
const PORT = process.env.PORT || 3015;

// Database configuration
const tableName = process.env.DB_TABLE || 'fast2025_mobie_cross';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost port
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
      // Allow specific origins
    const allowedOrigins = [
      'http://localhost:3010',
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:3000',
      'http://127.0.0.1:3010',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connection status endpoint for map indicator
app.get('/api/connection-status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
      // Get database information
    const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version');
    const [tableCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [process.env.DB_NAME || process.env.DB_DATABASE, tableName]
    );
    
    connection.release();
    
    const tableExists = tableCheck[0].count > 0;
    
    res.json({
      status: 'connected',
      message: tableExists ? 'Database connection successful' : `Table '${tableName}' not found`,
      timestamp: new Date(),
      database: {
        name: dbInfo[0].current_db,
        version: dbInfo[0].version,
        table: tableName,
        tableExists: tableExists,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      timestamp: new Date(),
      error: error.message,
      database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_DATABASE
      }
    });
  }
});

// Test database connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const startTime = Date.now();
    const connection = await pool.getConnection();
    
    // Perform multiple checks
    const [basicTest] = await connection.execute('SELECT 1 as test, NOW() as server_time');
    const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version, @@version_comment as comment');
    const [tableCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
      [process.env.DB_DATABASE, tableName]
    );
    
    // Check if we can query the main table
    let recordCount = 0;
    if (tableCheck[0].count > 0) {
      const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName} LIMIT 1`);
      recordCount = countResult[0].total;
    }
    
    const responseTime = Date.now() - startTime;
    connection.release();
    
    const tableExists = tableCheck[0].count > 0;
    
    res.json({
      status: 'connected',
      message: `Connection test successful (${responseTime}ms)`,
      timestamp: new Date(),
      database: {
        name: dbInfo[0].current_db,
        version: dbInfo[0].version,
        comment: dbInfo[0].comment,
        table: tableName,
        tableExists: tableExists,
        recordCount: recordCount,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        responseTime: responseTime
      },
      serverTime: basicTest[0].server_time
    });
  } catch (error) {
    console.error('Database connection test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection test failed',
      timestamp: new Date(),
      error: error.message,
      database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_DATABASE,
        table: tableName
      }
    });
  }
});

// Get chargers within map bounds (visible area) - NO LIMITS, REAL DATA ONLY
app.get('/api/chargers/bounds', async (req, res) => {
  try {
    const { north, south, east, west } = req.query;
    
    if (!north || !south || !east || !west) {
      return res.status(400).json({ 
        error: 'Missing required parameters: north, south, east, west' 
      });
    }
    
    const bounds = {
      north: parseFloat(north),
      south: parseFloat(south),
      east: parseFloat(east),
      west: parseFloat(west)
    };
      console.log(`🗺️ Fetching ALL unique chargers (DISTINCT Posto_ID) in bounds:`, bounds);
      const [rows] = await pool.execute(`
      SELECT DISTINCT 
        Posto_ID,
        Latitude, 
        Longitude, 
        Localizacao, 
        desc_loja, 
        Municipio, 
        MORADA, 
        OPERADOR, 
        Tipo, 
        Pontos, 
        Estado, 
        POTENCIA_TOMADA,
        TIPO_POSTO,
        TIPO_TOMADA,
        FORMATO_TOMADA,
        Link_MIIO,
        Link_Gmap
      FROM ${tableName}
      WHERE Latitude BETWEEN ? AND ?
      AND Longitude BETWEEN ? AND ?
      AND Latitude IS NOT NULL 
      AND Longitude IS NOT NULL
      AND Posto_ID IS NOT NULL
    `, [bounds.south, bounds.north, bounds.west, bounds.east]);
    
    console.log(`✅ Found ${rows.length} UNIQUE chargers (DISTINCT Posto_ID) in bounds (NO LIMITS)`);
      res.json({
      data: rows,
      count: rows.length,
      bounds,
      message: 'All unique chargers (DISTINCT Posto_ID) in bounds retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching chargers in bounds:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chargers in bounds',
      message: error.message
    });
  }
});

// --- Portuguese Highway Exits API ---
// Setup endpoint removed as requested
// Only keeping regular query endpoints

// 2. Query nearby highway exits - NO LIMITS
app.get('/api/highway-exits/nearby', async (req, res) => {
  // Query: /api/highway-exits/nearby?lat=...&lng=...&radius_km=...
  const { lat, lng, radius_km = 5 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const connection = await pool.getConnection();
    // Haversine formula for distance in SQL - NO LIMIT
    const [rows] = await connection.execute(`
      SELECT *,
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance_km
      FROM pt_highway_exits
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
    `, [lat, lng, lat, radius_km]);
    connection.release();
    res.json({ exits: rows, count: rows.length });
  } catch (error) {
    console.error('Error fetching nearby exits:', error);
    res.status(500).json({ error: 'Failed to fetch nearby exits', message: error.message });
  }
});

// 3. Identify current highway (nearest highway to position)
app.get('/api/highway-exits/current-highway', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT highway, COUNT(*) as exit_count,
        MIN((6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))) as min_distance
      FROM pt_highway_exits
      GROUP BY highway
      ORDER BY min_distance ASC
      LIMIT 1
    `, [lat, lng, lat]);
    connection.release();
    if (rows.length === 0) return res.status(404).json({ error: 'No highways found' });
    res.json({ highway: rows[0].highway, min_distance_km: rows[0].min_distance });
  } catch (error) {
    console.error('Error identifying current highway:', error);
    res.status(500).json({ error: 'Failed to identify current highway', message: error.message });
  }
});

// 4. Find next highway exit - NO LIMITS, ALL EXITS
app.get('/api/highway-exits/next', async (req, res) => {
  // Query: /api/highway-exits/next?lat=...&lng=...&heading=...&highway=...&direction=...
  const { lat, lng, heading, highway, direction } = req.query;
  if (!lat || !lng || !highway) return res.status(400).json({ error: 'lat, lng, and highway required' });
  try {
    const connection = await pool.getConnection();
    // Find all exits for the highway ordered by distance - NO LIMIT
    let query = `SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance_km FROM pt_highway_exits WHERE highway = ?`;
    const params = [lat, lng, lat, highway];
    if (direction) {
      query += ' AND direction = ?';
      params.push(direction);
    }
    query += ' ORDER BY distance_km ASC';
    const [rows] = await connection.execute(query, params);
    connection.release();
    if (rows.length === 0) return res.status(404).json({ error: 'No exits found for this highway' });
    // Return all exits for the highway
    res.json({ next_exits: rows });
  } catch (error) {
    console.error('Error finding next exit:', error);
    res.status(500).json({ error: 'Failed to find next exit', message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Connection status: http://localhost:${PORT}/api/connection-status`);
});
