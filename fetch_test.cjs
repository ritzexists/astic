const https = require('https');

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
  const baseUrl = 'https://www.web3d.org/x3d/content/Basic/Vrml97Specification/';
  const files = ['Example03.wrl', 'Example04.wrl', 'ChopperBody.wrl'];
  
  for (const file of files) {
    try {
      const content = await fetchUrl(baseUrl + file);
      console.log(`\n--- ${file} ---`);
      console.log(content.split('\n').filter(l => !l.startsWith('#')).join('\n').substring(0, 1000));
    } catch (e) {
      console.error(e);
    }
  }
}

run();
