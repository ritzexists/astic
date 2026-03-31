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

async function scrape() {
  try {
    const lmuHtml = await fetchUrl('https://cs.lmu.edu/~ray/notes/vrmlexamples/');
    console.log("LMU HTML snippet:", lmuHtml.substring(0, 2000));
    
    const web3dHtml = await fetchUrl('https://www.web3d.org/x3d/content/examples/Basic/Vrml97Specification/index.html');
    console.log("Web3D HTML snippet:", web3dHtml.substring(0, 2000));

  } catch (e) {
    console.error(e);
  }
}

scrape();
