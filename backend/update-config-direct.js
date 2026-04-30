const { MongoClient, ObjectId } = require('mongodb');

// Get the DB URL from the env if possible, or use the local default
const url = 'mongodb://127.0.0.1:27017/omms?replicaSet=rs0';
const client = new MongoClient(url);

async function run() {
  try {
    console.log('Connecting to MongoDB directly...');
    await client.connect();
    const db = client.db('omms');
    const collection = db.collection('system_configs');
    
    console.log('Updating SystemConfig in MongoDB...');
    const result = await collection.updateMany(
      {}, // update all
      { 
        $set: { 
          contactHours: 'Mon - Fri: 8:00 AM - 5:00 PM',
          telebirrPhone: '0911234567',
          cbeBirrPhone: '0911234568'
        } 
      }
    );
    
    console.log(`Success! Updated ${result.modifiedCount} documents.`);
  } catch (err) {
    console.error('Error updating MongoDB:', err.message);
  } finally {
    await client.close();
  }
}

run();
