// test RBAC by checking user roles and permissions
import { pool } from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRBAC() {
  console.log('🔍 Testing RBAC Configuration...\n');
  
  try {
    
    const users = await pool.query(`
      SELECT u.id, u.username, r.name as role, u.base_id, b.name as base_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN bases b ON u.base_id = b.id
      ORDER BY u.username
    `);
    
    console.log('👥 Users and Roles:');
    console.log('─'.repeat(60));
    users.rows.forEach(user => {
      console.log(`  ${user.username.padEnd(15)} | ${user.role.padEnd(18)} | Base: ${user.base_name || 'N/A'}`);
    });
    
    console.log('\n📋 Expected Permissions:\n');
    
    //  route permissions
    const routes = [
      { path: '/api/dashboard/metrics', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
      { path: 'POST /api/purchases', roles: ['ADMIN', 'LOGISTICS_OFFICER'] },
      { path: 'GET /api/purchases', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
      { path: 'POST /api/transfers', roles: ['ADMIN', 'LOGISTICS_OFFICER'] },
      { path: 'GET /api/transfers', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
      { path: 'POST /api/assignments', roles: ['ADMIN', 'BASE_COMMANDER'] },
      { path: 'GET /api/assignments', roles: ['ADMIN', 'BASE_COMMANDER'] },
    ];
    
    console.log('Route Permissions:');
    console.log('─'.repeat(60));
    routes.forEach(route => {
      console.log(`  ${route.path.padEnd(30)} | ${route.roles.join(', ')}`);
    });
    
    console.log('\n✅ RBAC Configuration Check Complete!');
    console.log('\n💡 To test:');
    console.log('   1. Login as different users');
    console.log('   2. Try accessing different pages');
    console.log('   3. Check browser console for 403 errors');
    console.log('   4. Verify data is filtered by base for non-admin users');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testRBAC();

