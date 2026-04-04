const http = require('http');
http.get('http://localhost:5000/api/blogs', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    require('fs').writeFileSync('C:/dev/organization-member-management/backend/err.log', data);
  });
});
