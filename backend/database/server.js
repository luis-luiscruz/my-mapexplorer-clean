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
const PORT = process.env.PORT || 3010;

// Database configuration
const tableName = process.env.DB_TABLE || 'fast2025_mobie_cross';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    console.log(`[CORS] Request from origin: ${origin}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log(`[CORS] Allowing request with no origin`);
      return callback(null, true);
    }
    
    // Allow any localhost port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      console.log(`[CORS] Allowing localhost: ${origin}`);
      return callback(null, true);
    }
    
    // Allow any 127.0.0.1 port for development  
    if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      console.log(`[CORS] Allowing 127.0.0.1: ${origin}`);
      return callback(null, true);
    }
    
    // Allow specific production domains
    const allowedOrigins = [
      // Development origins
      'http://localhost:3010',
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:5175',
      'http://localhost:3000',
      'http://localhost:3015',
      'http://127.0.0.1:3010',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3015',
      // Production origins  
      'https://app2.lci9.com',
      'http://app2.lci9.com',
      'https://lci9.com',
      'http://lci9.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log(`[CORS] Allowing whitelisted origin: ${origin}`);
      return callback(null, true);
    }
    
    // Allow any *.lci9.com subdomain (wildcard CORS)
    if (origin && origin.match(/^https?:\/\/[a-zA-Z0-9.-]+\.lci9\.com(:\d+)?$/)) {
      console.log(`[CORS] Allowing *.lci9.com: ${origin}`);
      return callback(null, true);
    }
    
    // For debugging - log rejected origins
    console.error(`[CORS] REJECTED origin: ${origin}`);
    console.error(`[CORS] Allowed origins:`, allowedOrigins);
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Serve static files from the built frontend
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback: serve index.html para qualquer rota não-API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} from ${req.get('origin') || 'unknown origin'}`);
  console.log(`[${timestamp}] User-Agent: ${req.get('user-agent') || 'unknown'}`);
  console.log(`[${timestamp}] IP: ${req.ip || req.connection.remoteAddress || 'unknown'}`);
  if (req.method === 'POST' && req.body) {
    console.log(`[${timestamp}] Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

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
    };    console.log(`🗺️ Fetching ALL unique chargers (DISTINCT Posto_ID) in bounds:`, bounds);
    
    // First, let's check what columns are available
    const [columnInfo] = await pool.execute(`      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || process.env.DB_DATABASE, tableName]);
    
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
        Link_Gmap,
        Link_MIIO
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
    res.status(500).json({ error: 'Failed to find next exit', message: error.message });  }
});

// Charger details endpoint - executes Python script for elementos classificados
app.post('/api/charger-details/:id', async (req, res) => {
  const { id } = req.params;
  
  console.log(`[CHARGER-DETAILS] Received request for charger ID: ${id}`);
  
  if (!id) {
    return res.status(400).json({ 
      error: 'Missing charger ID',
      status: 'error' 
    });
  }
  
  try {
    const { spawn } = require('child_process');
    const scriptPath = path.join(__dirname, '..', 'scripts', 'extrair_paineis_tarifario.py');
    
    console.log(`[CHARGER-DETAILS] Executing Python script: ${scriptPath}`);
    console.log(`[CHARGER-DETAILS] Script arguments: ${id}`);
    
    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Python script not found at: ${scriptPath}`);
    }
    
    const startTime = Date.now();
    
    const pythonProcess = spawn('python', [scriptPath, id], {
      cwd: path.join(__dirname, '..', 'scripts'),
      env: { ...process.env }
    });
    
    let outputData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`[CHARGER-DETAILS] Python stderr: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`[CHARGER-DETAILS] Python process finished with code: ${code}`);
      console.log(`[CHARGER-DETAILS] Execution time: ${executionTime}s`);
      
      if (code === 0) {
        try {
          // Try to parse the JSON output
          const result = JSON.parse(outputData.trim());
          
          console.log(`[CHARGER-DETAILS] Successfully parsed JSON result`);
          console.log(`[CHARGER-DETAILS] Status: ${result.status}`);
          
          res.json({
            ...result,
            execution_time: executionTime,
            charger_id: id
          });
          
        } catch (parseError) {
          console.error(`[CHARGER-DETAILS] JSON parse error:`, parseError);
          console.error(`[CHARGER-DETAILS] Raw output:`, outputData);
          
          res.status(500).json({
            error: 'Failed to parse Python script output',
            status: 'error',
            raw_output: outputData,
            stderr: errorData,
            execution_time: executionTime,
            charger_id: id
          });
        }
      } else {
        console.error(`[CHARGER-DETAILS] Python script failed with code ${code}`);
        res.status(500).json({
          error: `Python script failed with exit code ${code}`,
          status: 'error',
          stderr: errorData,
          raw_output: outputData,
          execution_time: executionTime,
          charger_id: id
        });
      }
    });
    
    // Set timeout for the request (30 seconds)
    const timeout = setTimeout(() => {
      pythonProcess.kill('SIGTERM');
      res.status(504).json({
        error: 'Request timeout',
        status: 'timeout',
        message: 'Python script execution exceeded 30 seconds',
        charger_id: id
      });
    }, 30000);
    
    pythonProcess.on('close', () => {
      clearTimeout(timeout);
    });
    
  } catch (error) {
    console.error(`[CHARGER-DETAILS] Error executing Python script:`, error);
    res.status(500).json({
      error: 'Failed to execute charger details script',
      status: 'error',
      message: error.message,      charger_id: id
    });
  }
});

// POST endpoint to run Python scripts
app.post('/api/run-script', async (req, res) => {
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2, 10);
  try {
    console.log(`[RUN-SCRIPT][${requestId}] === NEW SCRIPT REQUEST ===`);
    console.log(`[RUN-SCRIPT][${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`[RUN-SCRIPT][${requestId}] Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[RUN-SCRIPT][${requestId}] User agent:`, req.get('User-Agent'));
    console.log(`[RUN-SCRIPT][${requestId}] Request IP:`, req.ip || req.connection.remoteAddress);
    
    const { script, charger_id, latitude, longitude, address } = req.body;
    
    console.log(`[RUN-SCRIPT][${requestId}] Parsed parameters:`);
    console.log(`[RUN-SCRIPT][${requestId}] - Script: ${script}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Charger ID: ${charger_id}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Coordinates: ${latitude}, ${longitude}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Address: ${address}`);
    
    if (!script) {
      console.error(`[RUN-SCRIPT][${requestId}] ERROR: Missing script name`);
      return res.status(400).json({ 
        error: 'Missing script name',
        status: 'error',
        request_id: requestId,
        received_body: req.body
      });    }
      console.log(`[RUN-SCRIPT][${requestId}] Environment check:`);
    console.log(`[RUN-SCRIPT][${requestId}] - Working directory: ${process.cwd()}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Node version: ${process.version}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Platform: ${process.platform}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Architecture: ${process.arch}`);
    console.log(`[RUN-SCRIPT][${requestId}] - User: ${process.getuid ? process.getuid() : 'N/A'}`);
    
    const { spawn } = require('child_process');
    const scriptPath = path.join(__dirname, '..', 'scripts', script);
    
    console.log(`[RUN-SCRIPT][${requestId}] Script path resolution:`);
    console.log(`[RUN-SCRIPT][${requestId}] - __dirname: ${__dirname}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Resolved script path: ${scriptPath}`);
    
    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`[RUN-SCRIPT][${requestId}] ERROR: Script not found at: ${scriptPath}`);
      // List available scripts for debugging
      const scriptsDir = path.join(__dirname, '..', 'scripts');
      console.log(`[RUN-SCRIPT][${requestId}] Scripts directory: ${scriptsDir}`);
      
      try {
        const availableScripts = fs.readdirSync(scriptsDir).filter(file => file.endsWith('.py'));
        console.log(`[RUN-SCRIPT][${requestId}] Available Python scripts:`, availableScripts);
        
        // Also list all files for debugging
        const allFiles = fs.readdirSync(scriptsDir);
        console.log(`[RUN-SCRIPT][${requestId}] All files in scripts directory:`, allFiles);
        
        throw new Error(`Python script not found: ${script}. Available scripts: ${availableScripts.join(', ')}`);
      } catch (dirError) {
        console.error(`[RUN-SCRIPT][${requestId}] ERROR: Cannot read scripts directory:`, dirError);
        throw new Error(`Cannot access scripts directory: ${scriptsDir}. Error: ${dirError.message}`);
      }
    }
    
    // Check script permissions and stats
    try {
      const stats = fs.statSync(scriptPath);
      console.log(`[RUN-SCRIPT][${requestId}] Script file stats:`);
      console.log(`[RUN-SCRIPT][${requestId}] - Size: ${stats.size} bytes`);
      console.log(`[RUN-SCRIPT][${requestId}] - Mode: ${stats.mode.toString(8)}`);
      console.log(`[RUN-SCRIPT][${requestId}] - Is file: ${stats.isFile()}`);
      console.log(`[RUN-SCRIPT][${requestId}] - Modified: ${stats.mtime}`);
    } catch (statError) {
      console.error(`[RUN-SCRIPT][${requestId}] ERROR: Cannot get script stats:`, statError);
    }
    
    const startTime = Date.now();
    console.log(`[RUN-SCRIPT][${requestId}] Script execution started at: ${new Date(startTime).toISOString()}`);    
    // Prepare script arguments
    const args = [scriptPath];
    if (charger_id) args.push(charger_id);
    if (latitude) args.push(latitude.toString());
    if (longitude) args.push(longitude.toString());
    if (address) args.push(address);
    
    // Test Python availability (try python3 first, then python for Windows)
    let pythonCommand = 'python3';
    try {
      const pythonVersion = require('child_process').execSync('python3 --version', { encoding: 'utf8' });
      console.log(`[RUN-SCRIPT][${requestId}] Python version check: ${pythonVersion.trim()}`);
    } catch (pythonError) {
      console.log(`[RUN-SCRIPT][${requestId}] Python3 not available, trying 'python'...`);
      try {
        const pythonVersion = require('child_process').execSync('python --version', { encoding: 'utf8' });
        console.log(`[RUN-SCRIPT][${requestId}] Python version check: ${pythonVersion.trim()}`);
        pythonCommand = 'python';
      } catch (python2Error) {
        console.error(`[RUN-SCRIPT][${requestId}] ERROR: Neither python3 nor python available:`, python2Error.message);
      }
    }
    
    console.log(`[RUN-SCRIPT][${requestId}] Python execution details:`);
    console.log(`[RUN-SCRIPT][${requestId}] - Command: ${pythonCommand}`);
    console.log(`[RUN-SCRIPT][${requestId}] - Arguments:`, args);
    console.log(`[RUN-SCRIPT][${requestId}] - Working directory: ${path.join(__dirname, '..', 'scripts')}`);
    
    try {
      const pythonProcess = spawn(pythonCommand, args, {
        cwd: path.join(__dirname, '..', 'scripts'),
        env: { ...process.env }
      });
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error(`[RUN-SCRIPT] Python stderr: ${data}`);
      });
      
      pythonProcess.on('close', (code) => {
        const executionTime = Date.now() - startTime;
        console.log(`[RUN-SCRIPT] Python script finished with code ${code}, execution time: ${executionTime}ms`);
        
        if (code === 0) {
          try {
            console.log(`[RUN-SCRIPT] Script output:`, outputData);
            
            // Try to parse as JSON
            let result;
            try {
              result = JSON.parse(outputData);
            } catch {
              // If not JSON, return as text
              result = { 
                output: outputData,
                type: 'text'
              };
            }
            
            res.json({
              ...result,
              execution_time: executionTime,
              script_name: script,
              status: 'success'
            });
          } catch (parseError) {
            console.error(`[RUN-SCRIPT] Parse error:`, parseError);
            res.status(500).json({
              error: 'Failed to parse script output',
              status: 'error',
              raw_output: outputData,
              stderr: errorData,
              execution_time: executionTime,
              script_name: script
            });
          }
        } else {
          console.error(`[RUN-SCRIPT] Script failed with code ${code}`);
          res.status(500).json({
            error: `Script failed with exit code ${code}`,
            status: 'error',
            stderr: errorData,
            raw_output: outputData,
            execution_time: executionTime,
            script_name: script
          });
        }
      });
      
      // Set timeout for the request (60 seconds for scripts)
      const timeout = setTimeout(() => {
        pythonProcess.kill('SIGTERM');
        res.status(504).json({
          error: 'Script execution timeout',
          status: 'timeout',
          message: 'Script execution exceeded 60 seconds',
          script_name: script
        });
      }, 60000);
      pythonProcess.on('close', () => {
        clearTimeout(timeout);
      });
    } catch (error) {
      const requestId = req.requestId || 'unknown';
      console.error(`[RUN-SCRIPT][${requestId}] === SCRIPT EXECUTION ERROR ===`);
      console.error(`[RUN-SCRIPT][${requestId}] Error type: ${error.constructor.name}`);
      console.error(`[RUN-SCRIPT][${requestId}] Error message: ${error.message}`);
      console.error(`[RUN-SCRIPT][${requestId}] Error stack:`, error.stack);
      console.error(`[RUN-SCRIPT][${requestId}] Script: ${script || 'undefined'}`);
      console.error(`[RUN-SCRIPT][${requestId}] Request body:`, JSON.stringify(req.body, null, 2));
      console.error(`[RUN-SCRIPT][${requestId}] Request headers:`, JSON.stringify(req.headers, null, 2));
      console.error(`[RUN-SCRIPT][${requestId}] Error occurred at: ${new Date().toISOString()}`);
      res.status(500).json({
        error: 'Failed to execute script',
        status: 'error',
        message: error.message,
        script_name: script || 'undefined',
        request_id: requestId,
        timestamp: new Date().toISOString(),
        error_type: error.constructor.name
      });
    }
  } catch (error) {
    // Top-level error handler for the endpoint
    console.error(`[RUN-SCRIPT][${requestId}] === TOP-LEVEL ERROR ===`);
    console.error(error);
    res.status(500).json({
      error: 'Internal server error',
      status: 'error',
      message: error.message,
      request_id: requestId,
      timestamp: new Date().toISOString(),
      error_type: error.constructor.name
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Connection status: http://localhost:${PORT}/api/connection-status`);
});
