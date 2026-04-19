const axios = require('axios');

async function test() {
    try {
        const id = '69cb0a9466a3596cac04b7ee'; // Example ID from logs
        console.log(`Testing PUT on /api/hospital-requests/blood/${id}`);
        const res = await axios.put(`http://localhost:5001/api/hospital-requests/blood/${id}`, {
            bloodType: 'A+',
            units: 99,
            priority: 'CRITICAL',
            description: 'API Test Update'
        });
        console.log("Response status:", res.status);
        console.log("Response data:", res.data);
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
    }
}

test();
