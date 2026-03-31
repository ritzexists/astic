const https = require('https');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html1 = await fetchHtml('https://www.web3d.org/x3d/content/examples/Basic/Vrml97Specification/index.html');
    const matches1 = [...html1.matchAll(/href="([^"]+\.wrl)"/gi)].map(m => m[1]);
    
    const html2 = await fetchHtml('https://cs.lmu.edu/~ray/notes/vrmlexamples/');
    const matches2 = [...html2.matchAll(/href="([^"]+\.wrl)"/gi)].map(m => m[1]);

    console.log("WEB3D:", JSON.stringify([...new Set(matches1)]));
    console.log("LMU:", JSON.stringify([...new Set(matches2)]));
    
    if (matches2.length === 0) {
      console.log("LMU HTML:", html2.substring(0, 1000));
    }
  } catch (e) {
    console.error(e);
  }
}
run();
