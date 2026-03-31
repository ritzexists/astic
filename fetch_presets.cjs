const https = require('https');

https.get('https://www.web3d.org/x3d/content/Basic/Vrml97Specification/index.html', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex = /href="([^"]+\.wrl)"/g;
    let match;
    const links = new Set();
    while ((match = regex.exec(data)) !== null) {
      links.add(match[1]);
    }
    console.log("VRML97 Links:");
    console.log(Array.from(links).join('\n'));
  });
});

https.get('https://cs.lmu.edu/~ray/notes/vrmlexamples/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Extract pre code blocks
    const regex = /<pre>([\s\S]*?)<\/pre>/g;
    let match;
    const blocks = [];
    while ((match = regex.exec(data)) !== null) {
      if (match[1].includes('#VRML V2.0 utf8')) {
        blocks.push(match[1]);
      }
    }
    console.log("LMU Blocks found:", blocks.length);
    // Let's just output the first few lines of each to see
    blocks.forEach((b, i) => console.log(`Block ${i}:`, b.substring(0, 50).replace(/\n/g, ' ')));
  });
});
