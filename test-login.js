const http = require('http');

const data = JSON.stringify({
    email: 'raxit88@gmail.com',
    password: 'raxit2112',
    securityKey: '666666'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Testing login with:');
console.log(data);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', responseBody);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
