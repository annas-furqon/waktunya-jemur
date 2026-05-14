const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/wilayah.db');
const sqlFilePath = path.join(__dirname, '../data/wilayah.sql');

console.log('='.repeat(80));
console.log('WILAYAH DATABASE SETUP SCRIPT');
console.log('='.repeat(80));
console.log();

try {
  // Step 1: Import data from wilayah.sql
  console.log('Step 1: Importing data from wilayah.sql...');
  console.log('-'.repeat(80));
  
  const db = new Database(dbPath);
  
  // Create table
  db.exec(`
    DROP TABLE IF EXISTS wilayah;
    CREATE TABLE wilayah (
      kode TEXT PRIMARY KEY,
      nama TEXT NOT NULL
    );
    CREATE INDEX idx_nama ON wilayah(nama);
  `);
  
  // Read SQL file
  let sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
  
  // Extract only the VALUES section
  const valuesStart = sqlContent.indexOf('VALUES');
  if (valuesStart === -1) {
    console.error('❌ Could not find VALUES in SQL file');
    process.exit(1);
  }
  
  sqlContent = sqlContent.substring(valuesStart + 6);
  
  // Parse all ('code', 'name') pairs
  const pairRegex = /\('([^']+)','([^']*(?:''[^']*)*)'\)/g;
  let match;
  let count = 0;
  
  const insertStmt = db.prepare('INSERT INTO wilayah (kode, nama) VALUES (?, ?)');
  
  db.exec('BEGIN TRANSACTION');
  
  while ((match = pairRegex.exec(sqlContent)) !== null) {
    const kode = match[1];
    let nama = match[2].replace(/''/g, "'"); // Handle escaped quotes
    
    try {
      insertStmt.run(kode, nama);
      count++;
      
      if (count % 10000 === 0) {
        console.log(`  ✓ Imported ${count} records...`);
      }
    } catch (err) {
      console.error(`  ✗ Error importing: ${kode}, ${nama}`, err.message);
    }
  }
  
  db.exec('COMMIT');
  
  console.log(`✅ Successfully imported ${count} records to ${dbPath}\n`);
  
  // Step 2: Enhance database with hierarchical columns
  console.log('Step 2: Enhancing database with hierarchical columns...');
  console.log('-'.repeat(80));
  
  // Check if columns already exist
  const tableInfo = db.pragma('table_info(wilayah)');
  const hasProvinceCode = tableInfo.some(col => col.name === 'province_code');
  
  if (hasProvinceCode) {
    console.log('✅ Database already enhanced with province/district/sub_district columns');
  } else {
    // Add new columns
    console.log('➕ Adding new columns...');
    db.exec(`
      ALTER TABLE wilayah ADD COLUMN province_code TEXT;
      ALTER TABLE wilayah ADD COLUMN province_name TEXT;
      ALTER TABLE wilayah ADD COLUMN district_code TEXT;
      ALTER TABLE wilayah ADD COLUMN district_name TEXT;
      ALTER TABLE wilayah ADD COLUMN sub_district_code TEXT;
      ALTER TABLE wilayah ADD COLUMN sub_district_name TEXT;
    `);
    console.log('✅ New columns added successfully\n');
    
    // Get all records and build a lookup map for names
    console.log('📖 Building lookup map...');
    const allRecords = db.prepare('SELECT kode, nama FROM wilayah').all();
    const lookupMap = {};
    allRecords.forEach(row => {
      lookupMap[row.kode] = row.nama;
    });
    
    // Update each record with hierarchical data
    console.log('🔍 Parsing hierarchical data...');
    let processed = 0;
    const updateStmt = db.prepare(`
      UPDATE wilayah 
      SET province_code = ?, province_name = ?, 
          district_code = ?, district_name = ?,
          sub_district_code = ?, sub_district_name = ?
      WHERE kode = ?
    `);
    
    const transaction = db.transaction((records) => {
      records.forEach((record) => {
        const parts = record.kode.split('.');
        
        // Province (2 digits: 11)
        const provinceCode = parts[0];
        const provinceName = lookupMap[provinceCode] || '';
        
        // District (4 digits: 11.01)
        const districtCode = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : '';
        const districtName = districtCode ? lookupMap[districtCode] || '' : '';
        
        // Sub-district (6 digits: 11.01.01)
        const subDistrictCode = parts.length >= 3 ? `${parts[0]}.${parts[1]}.${parts[2]}` : '';
        const subDistrictName = subDistrictCode ? lookupMap[subDistrictCode] || '' : '';
        
        updateStmt.run(
          provinceCode,
          provinceName,
          districtCode,
          districtName,
          subDistrictCode,
          subDistrictName,
          record.kode
        );
        
        processed++;
        if (processed % 10000 === 0) {
          console.log(`  ✓ Processed ${processed}/${allRecords.length} records`);
        }
      });
    });
    
    transaction(allRecords);
    
    console.log(`\n✅ Successfully processed ${processed} records\n`);
  }
  
  // Step 3: Update keyword column
  console.log('Step 3: Updating keyword column...');
  console.log('-'.repeat(80));
  
  // Check if keyword column exists
  const keywordExists = tableInfo.some(col => col.name === 'keyword');
  
  if (!keywordExists) {
    console.log('➕ Adding keyword column...');
    db.exec('ALTER TABLE wilayah ADD COLUMN keyword TEXT');
    console.log('✅ Keyword column added successfully\n');
  }
  
  // Get all records
  console.log('📖 Building keyword strings...');
  const allRecords = db.prepare('SELECT kode, nama, province_name, district_name, sub_district_name FROM wilayah').all();
  
  let processed = 0;
  const updateStmt = db.prepare(`
    UPDATE wilayah 
    SET keyword = ?
    WHERE kode = ?
  `);
  
  const transaction = db.transaction((records) => {
    records.forEach((record) => {
      // Combine all hierarchical data into a single keyword string
      // Format: village sub_district district province (reversed order)
      const parts = [
        record.nama,           // village (first)
        record.sub_district_name,
        record.district_name,
        record.province_name   // province (last)
      ].filter(Boolean); // Remove empty strings
      
      const keyword = parts.join(' ').toLowerCase();
      
      updateStmt.run(keyword, record.kode);
      
      processed++;
      if (processed % 10000 === 0) {
        console.log(`  ✓ Processed ${processed}/${allRecords.length} records`);
      }
    });
  });
  
  transaction(allRecords);
  
  console.log(`\n✅ Successfully updated ${processed} records\n`);
  
  // Show summary
  console.log('='.repeat(80));
  console.log('DATABASE SETUP COMPLETE!');
  console.log('='.repeat(80));
  console.log();
  console.log('📊 Database Summary:');
  console.log(`   - Total records: ${allRecords.length}`);
  console.log(`   - Database path: ${dbPath}`);
  console.log();
  console.log('📋 Sample Data:');
  console.log('   Kode\t\t\tNama\t\t\t\t\tProvince\t\t\tDistrict\t\t\tSub-District');
  console.log('   ' + '─'.repeat(150));
  
  const samples = db.prepare(`
    SELECT kode, nama, province_name, district_name, sub_district_name 
    FROM wilayah 
    WHERE kode IN ('11', '11.01', '11.01.01', '11.01.01.2001', '11.01.02.2001')
  `).all();
  
  samples.forEach(row => {
    console.log(
      `${row.kode.padEnd(15)}\t${(row.nama || '').substring(0, 25).padEnd(25)}\t${(row.province_name || '').substring(0, 20).padEnd(20)}\t${(row.district_name || '').substring(0, 20).padEnd(20)}\t${(row.sub_district_name || '').substring(0, 20)}`
    );
  });
  
  console.log();
  console.log('✨ Keyword Sample:');
  console.log('   Kode\t\t\tNama\t\t\t\t\tKeyword');
  console.log('   ' + '─'.repeat(120));
  
  const keywordSamples = db.prepare(`
    SELECT kode, nama, keyword 
    FROM wilayah 
    WHERE kode IN ('11', '11.01', '11.01.01', '11.01.01.2001', '11.01.02.2001')
  `).all();
  
  keywordSamples.forEach(row => {
    console.log(
      `${row.kode.padEnd(15)}\t${(row.nama || '').substring(0, 25).padEnd(25)}\t${(row.keyword || '').substring(0, 70)}`
    );
  });
  
  console.log();
  console.log('✅ All steps completed successfully!');
  console.log();
  
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
