import http from 'http';

http.get('http://localhost:5000/api/dashboard/stats', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response:', JSON.parse(data));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
