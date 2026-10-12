const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@127.0.0.1:5433/sentrang?schema=public'
});

client.connect()
  .then(() => {
    console.log('Connected to PG port 5433 successfully!');
    return client.query('SELECT version();');
  })
  .then(res => {
    console.log('PG Version:', res.rows[0]);
    return client.end();
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    process.exit(1);
  });
