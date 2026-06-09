const http = require('http');

http.get('http://localhost:3000/api/test-ads', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log("Status Code:", res.statusCode);
        console.log("Headers:", res.headers);
        console.log("Body:", data);
    });
}).on('error', (err) => {
    console.error("HTTP GET Error:", err);
});
