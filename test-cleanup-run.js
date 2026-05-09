import { default as cleanupHandler } from './api/admin/apikeys/cleanup.js';

async function run() {
  const req = {
    method: 'GET',
    headers: {
      authorization: 'Bearer TEST_SECRET'
    }
  };
  
  process.env.CRON_SECRET = 'TEST_SECRET';
  
  const res = {
    status: (code) => {
      return {
        json: (data) => {
          console.log(`Status: ${code}`);
          console.log(JSON.stringify(data, null, 2));
        }
      }
    },
    headersSent: false
  };
  
  await cleanupHandler(req, res);
}

run();