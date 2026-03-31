import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const content = await fetchUrl('https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent('https://cs.lmu.edu/~ray/notes/vrmlexamples/'));
  console.log(content.substring(0, 5000));
}

run();
