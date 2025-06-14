const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function checkDatabaseSchema() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      connectionLimit: 1
    });
    
    console.log('=== DATABASE SCHEMA ANALYSIS ===');
    console.log(`Database: ${process.env.DB_DATABASE}`);
    console.log(`Table: ${process.env.DB_TABLE}`);
    console.log('');
    
    // Get table structure
    const [columns] = await pool.execute(`DESCRIBE ${process.env.DB_TABLE}`);
    console.log('=== AVAILABLE FIELDS ===');
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(20)} | ${col.Type.padEnd(15)} | ${col.Null} | ${col.Key} | ${col.Default || 'NULL'}`);
    });
    
    console.log('\n=== SAMPLE DATA ===');
    const [sample] = await pool.execute(`SELECT * FROM ${process.env.DB_TABLE} LIMIT 3`);
    if (sample.length > 0) {
      console.log('Field values from first record:');
      Object.keys(sample[0]).forEach(key => {
        const value = sample[0][key];
        console.log(`${key.padEnd(20)} | ${String(value).substring(0, 50)}`);
      });
      
      console.log('\n=== FIELD USAGE ANALYSIS ===');
      const fieldAnalysis = {};
      
      // Check which fields have data
      Object.keys(sample[0]).forEach(key => {
        const nonNullCount = sample.filter(row => row[key] !== null && row[key] !== '').length;
        fieldAnalysis[key] = {
          hasData: nonNullCount > 0,
          sampleValue: sample[0][key],
          nonNullCount: `${nonNullCount}/${sample.length}`
        };
      });
      
      console.log('Field Name           | Has Data | Sample Value                      | Non-null');
      console.log('-------------------- | -------- | --------------------------------- | --------');
      Object.keys(fieldAnalysis).forEach(key => {
        const analysis = fieldAnalysis[key];
        console.log(`${key.padEnd(20)} | ${(analysis.hasData ? 'YES' : 'NO').padEnd(8)} | ${String(analysis.sampleValue || '').substring(0, 33).padEnd(33)} | ${analysis.nonNullCount}`);
      });
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabaseSchema();
