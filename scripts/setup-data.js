
import { pool } from '../src/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function setupData() {
  console.log('🚀 Setting up database data...\n');
  
  try {

    console.log('📦 Setting up bases...');
    const existingBases = await pool.query('SELECT name FROM bases');
    const baseNames = existingBases.rows.map(b => b.name);
    
    const basesToInsert = [
      { name: 'Base Alpha', location: 'Northern Region' },
      { name: 'Base Beta', location: 'Southern Region' },
      { name: 'Base Gamma', location: 'Eastern Region' },
      { name: 'Base Delta', location: 'Western Region' }
    ];
    
    for (const base of basesToInsert) {
      if (!baseNames.includes(base.name)) {
        await pool.query(
          'INSERT INTO bases (name, location) VALUES ($1, $2)',
          [base.name, base.location]
        );
        console.log(`   ✅ Created: ${base.name}`);
      } else {
        console.log(`   ⏭️  Already exists: ${base.name}`);
      }
    }
    

    console.log('\n📦 Setting up equipment types...');
    const existingEq = await pool.query('SELECT name FROM equipment_types');
    const eqNames = existingEq.rows.map(e => e.name);
    
    const equipmentToInsert = [
      { name: 'M4 Carbine', category: 'WEAPON' },
      { name: 'M9 Pistol', category: 'WEAPON' },
      { name: 'Humvee', category: 'VEHICLE' },
      { name: 'Truck', category: 'VEHICLE' },
      { name: '5.56mm Ammunition', category: 'AMMUNITION' },
      { name: '9mm Ammunition', category: 'AMMUNITION' },
      { name: 'Grenade', category: 'AMMUNITION' }
    ];
    
    for (const eq of equipmentToInsert) {
      if (!eqNames.includes(eq.name)) {
        await pool.query(
          'INSERT INTO equipment_types (name, category) VALUES ($1, $2)',
          [eq.name, eq.category]
        );
        console.log(`   ✅ Created: ${eq.name}`);
      } else {
        console.log(`   ⏭️  Already exists: ${eq.name}`);
      }
    }
    

    const roles = await pool.query('SELECT id, name FROM roles ORDER BY id');
    const roleMap = {};
    roles.rows.forEach(r => roleMap[r.name] = r.id);
    console.log('\n📦 Roles found:', Object.keys(roleMap).join(', '));
    
 
    const bases = await pool.query('SELECT id, name FROM bases ORDER BY id');
    console.log(`📦 Bases found: ${bases.rowCount}`);
    
    if (bases.rowCount === 0) {
      console.error('❌ No bases found! Please insert bases first.');
      process.exit(1);
    }
    
    //password
    console.log('\n👤 Creating/updating users...');
    const passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // password: 'password'
    
    const users = [
      { username: 'admin', role: 'ADMIN', base_id: bases.rows[0]?.id },
      { username: 'commander1', role: 'BASE_COMMANDER', base_id: bases.rows[0]?.id },
      { username: 'logistics1', role: 'LOGISTICS_OFFICER', base_id: bases.rows[0]?.id },
    ];
    
    if (bases.rows.length > 1) {
      users.push(
        { username: 'commander2', role: 'BASE_COMMANDER', base_id: bases.rows[1]?.id },
        { username: 'logistics2', role: 'LOGISTICS_OFFICER', base_id: bases.rows[1]?.id }
      );
    }
    
    for (const user of users) {
      //  if user exists
      const existing = await pool.query('SELECT id FROM users WHERE username = $1', [user.username]);
      
      if (existing.rowCount > 0) {
   
        await pool.query(
          `UPDATE users 
           SET password_hash = $1, role_id = $2, base_id = $3 
           WHERE username = $4`,
          [passwordHash, roleMap[user.role], user.base_id, user.username]
        );
        console.log(`   ✅ Updated: ${user.username} (${user.role})`);
      } else {
        // insert new user
        await pool.query(
          `INSERT INTO users (username, password_hash, role_id, base_id)
           VALUES ($1, $2, $3, $4)`,
          [user.username, passwordHash, roleMap[user.role], user.base_id]
        );
        console.log(`   ✅ Created: ${user.username} (${user.role})`);
      }
    }
    
 
    console.log('\n📋 Verification:');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const baseCount = await pool.query('SELECT COUNT(*) as count FROM bases');
    const roleCount = await pool.query('SELECT COUNT(*) as count FROM roles');
    const eqCount = await pool.query('SELECT COUNT(*) as count FROM equipment_types');
    
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Bases: ${baseCount.rows[0].count}`);
    console.log(`   Roles: ${roleCount.rows[0].count}`);
    console.log(`   Equipment Types: ${eqCount.rows[0].count}`);
    
    // show users
    console.log('\n👥 Users:');
    const allUsers = await pool.query(`
      SELECT u.username, r.name as role, b.name as base
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN bases b ON u.base_id = b.id
      ORDER BY u.username
    `);
    
    allUsers.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) @ ${user.base || 'N/A'}`);
    });
    
    console.log('\n✅ Setup complete!');
    console.log('\n📝 Login credentials:');
    console.log('   admin / password');
    console.log('   commander1 / password');
    console.log('   logistics1 / password');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

setupData();
