/**
 * Simple connectivity test
 * Run with: node test-env.js
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://zainazhar457_db_user:zYXbC8xv1tHD3VvR@cluster0.ezjmnyu.mongodb.net/agrisense?retryWrites=true&w=majority&appName=Cluster0';

console.log('🧪 Testing MongoDB Connection\n');

async function testMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!\n');
    
    const db = client.db('agrisense');
    const collections = await db.listCollections().toArray();
    console.log('📊 Collections:', collections.map(c => c.name).join(', ') || 'None yet (will be created on first write)');
    
    // Test write
    console.log('\n🔬 Testing write access...');
    await db.collection('_test').insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Write access confirmed');
    
    await db.collection('_test').deleteOne({ test: true });
    console.log('✅ Cleanup successful\n');
    
    await client.close();
    console.log('✅ Connection closed\n');
    console.log('🎉 All tests passed! MongoDB is working correctly.\n');
    console.log('💡 Next step: Restart your Next.js dev server');
    console.log('   Ctrl+C then: npm run dev\n');
  } catch (error) {
    console.log('❌ MongoDB Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check internet connection');
    console.log('2. Verify MongoDB credentials');
    console.log('3. Check if IP is whitelisted in MongoDB Atlas\n');
  }
}

testMongoDB().then(() => process.exit(0));

