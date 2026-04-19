const mongoose = require("mongoose");
const dns = require("dns");

// Use Google DNS to resolve MongoDB Atlas SRV records
// (fixes ECONNREFUSED on networks where local DNS doesn't support SRV lookups)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        mongoose.connection.on('error', (err) => {
            console.error('❌ Mongoose Connection Error Event:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  Mongoose disconnected from MongoDB');
        });

        const conn = await mongoose.connect(process.env.DATABASE_URL, {
            serverSelectionTimeoutMS: 30000, // 30s timeout
            heartbeatFrequencyMS: 10000,   // 10s heartbeat
            socketTimeoutMS: 45000,        // 45s socket timeout
        });
        mongoose.set('strictQuery', false);
        console.log(`✅ MongoDB Connected via Mongoose: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectDB };
