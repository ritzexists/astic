import https from 'https';
import fs from 'fs';

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
    const html = await fetchHtml('https://cs.lmu.edu/~ray/notes/vrmlexamples/');
    const examples = [];
    
    // The HTML has <div class='filename'><span>filename.wrl</span></div><pre><code class=''>...</code></pre>
    const regex = /<div class='filename'><span>([^<]+)<\/span><\/div>\s*<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      examples.push({
        name: match[1],
        code: match[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      });
    }
    
    fs.writeFileSync('lmu_examples.json', JSON.stringify(examples, null, 2));
    console.log(`Extracted ${examples.length} examples from LMU`);
  } catch (e) {
    console.error(e);
  }
}
run();
