import https from 'https';

function checkUrl(url) {
  return new Promise((resolve) => {
    https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(0)).end();
  });
}

async function run() {
  const code = await checkUrl('https://cs.lmu.edu/~ray/notes/vrmlexamples/yellowcone.wrl');
  console.log("Status:", code);
}
run();
