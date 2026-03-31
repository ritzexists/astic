const https = require('https');

https.get('https://www.web3d.org/x3d/content/Basic/Vrml97Specification/index.html', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const regex1 = /href="([^"]+)Index\.html"/g;
    let match1;
    const links1 = new Set();
    while ((match1 = regex1.exec(data)) !== null) {
      links1.add(match1[1] + '.wrl');
    }
    
    const regex2 = /href="([^"]+\.wrl)"/g;
    let match2;
    const links2 = new Set();
    while ((match2 = regex2.exec(data)) !== null) {
      links2.add(match2[1]);
    }
    
    console.log("Links from Index.html:", links1.size);
    console.log("Direct .wrl links:", links2.size);
    
    const allLinks = new Set([...links1, ...links2]);
    console.log("All unique links:", allLinks.size);
    console.log(Array.from(allLinks).join('\n'));
  });
});
