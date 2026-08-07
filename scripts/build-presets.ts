import fs from 'fs';
import path from 'path';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { JSDOM } from 'jsdom';

// We might need a DOM for VRMLLoader if it uses document or window
const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window as any;

async function buildPresets() {
  console.log('Building presets statically...');
  const newPresets: {name: string, url?: string, content?: string}[] = [];

  // 1. Fetch Web3D VRML97 Specification Models
  try {
    const web3dBaseUrl = 'https://www.web3d.org/x3d/content/examples/basic/Vrml97Specification/';
    const requestedWeb3D = [
      'ChopperBody', 'ChopperRotor', 'Example02', 'Example03', 'Example04',
      'Example05', 'Example06', 'Example07', 'Example08', 'Example09',
      'Example10', 'Example11', 'Example12', 'Example13_2', 'Example13_3',
      'Example14', 'Example15', 'Example16', 'Example17', 'Example18',
      'Example19', 'RefractiveMaterial', 'Rotor'
    ];

    const links = new Set<string>(requestedWeb3D.map(m => `${m}.wrl`));

    try {
      const web3dRes = await fetch(web3dBaseUrl);
      if (web3dRes.ok) {
        const html = await web3dRes.text();
        const regex = /href="([^"]+Index\.html)"/gi;
        let m;
        while ((m = regex.exec(html)) !== null) {
          const baseName = m[1].replace(/Index\.html$/i, '');
          if (baseName && !baseName.includes('/')) {
            links.add(`${baseName}.wrl`);
          }
        }
      }
    } catch (e) {
      console.warn('Directory scan warning:', e);
    }

    for (const fileName of Array.from(links)) {
      const fileUrl = `${web3dBaseUrl}${fileName}`;
      try {
        const fileRes = await fetch(fileUrl);
        if (fileRes.ok) {
          const text = await fileRes.text();
          if (text.trim().startsWith('#VRML')) {
            newPresets.push({
              name: `Web3D: ${fileName}`,
              url: fileUrl,
              content: text
            });
          }
        }
      } catch (e) {
        console.error(`Failed to fetch ${fileUrl}:`, e);
      }
    }
  } catch (err) {
    console.error('Failed to fetch Web3D presets:', err);
  }

  // 2. Fetch LMU VRML Examples
  try {
    const lmuUrl = 'https://cs.lmu.edu/~ray/notes/vrmlexamples/';
    const lmuRes = await fetch(lmuUrl);
    if (lmuRes.ok) {
      const lmuHtml = await lmuRes.text();
      const doc = new JSDOM(lmuHtml).window.document;
      const preElements = doc.querySelectorAll('pre code');
      preElements.forEach(code => {
        const text = code.textContent || '';
        if (text.includes('#VRML V2.0 utf8')) {
          let name = 'LMU Example';
          const pre = code.parentElement;
          if (pre) {
            const filenameDiv = pre.previousElementSibling;
            if (filenameDiv && filenameDiv.classList.contains('filename')) {
              name = filenameDiv.textContent?.trim() || name;
            } else {
              let prev = pre.previousElementSibling;
              while (prev) {
                if (prev.tagName.match(/^H[1-6]$/)) {
                  name = prev.textContent?.trim() || name;
                  break;
                }
                prev = prev.previousElementSibling;
              }
            }
          }

          const excludedLMU = ['boxandsphere', 'axesthree', 'axes3'];
          if (excludedLMU.some(ex => name.toLowerCase().includes(ex.toLowerCase()))) return;

          newPresets.push({
            name: `LMU: ${name}`,
            content: text
          });
        }
      });
    }
  } catch (err) {
    console.error('Failed to fetch LMU presets:', err);
  }

  const vrmlLoader = new VRMLLoader();

  // 3. Fetch SIG-GRAPH VRML Examples from SourceForge / Web3D Siggraph98Course
  try {
    const sigGraphBaseUrlSF = 'https://sourceforge.net/p/x3d/code/HEAD/tree/www.web3d.org/x3d/content/examples/Vrml2Sourcebook/Siggraph98Course/originals/';
    const web3dCourseUrl = 'https://www.web3d.org/x3d/content/examples/Vrml2Sourcebook/Siggraph98Course/';

    const modelMap = new Map<string, { sfUrl: string, web3dUrl: string }>();

    // Try fetching catalog from Web3D first (100% reliable, no 429s)
    try {
      const courseRes = await fetch(web3dCourseUrl);
      if (courseRes.ok) {
        const html = await courseRes.text();
        const regex = /href="([^"/]+)Index\.html"/gi;
        let m;
        while ((m = regex.exec(html)) !== null) {
          const name = m[1];
          const lowerName = name.toLowerCase() + '.wrl';
          modelMap.set(lowerName, {
            sfUrl: `${sigGraphBaseUrlSF}${lowerName}?format=raw`,
            web3dUrl: `${web3dCourseUrl}${name}.wrl`
          });
        }
      }
    } catch (e) {
      console.warn('Web3D course index scan failed:', e);
    }

    // Try fetching catalog from SourceForge as backup/supplement
    try {
      const sfRes = await fetch(sigGraphBaseUrlSF);
      if (sfRes.ok) {
        const html = await sfRes.text();
        const regex = /href="([^"]+\.wrl)"/gi;
        let m;
        while ((m = regex.exec(html)) !== null) {
          const fileName = m[1];
          const lowerName = fileName.toLowerCase();
          if (!modelMap.has(lowerName)) {
            const baseName = fileName.replace(/\.wrl$/i, '');
            modelMap.set(lowerName, {
              sfUrl: `${sigGraphBaseUrlSF}${fileName}?format=raw`,
              web3dUrl: `${web3dCourseUrl}${baseName}.wrl`
            });
          }
        }
      }
    } catch (e) {
      console.warn('SourceForge directory scan failed:', e);
    }

    const items = Array.from(modelMap.entries());
    console.log(`Discovered ${items.length} SIG-GRAPH models.`);

    const chunkSize = 15;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const promises = chunk.map(async ([fileName, urls]) => {
        try {
          let text = '';
          // Prefer web3dUrl for fetching content (fast, no rate limits)
          try {
            const res = await fetch(urls.web3dUrl);
            if (res.ok) {
              const fetchedText = await res.text();
              if (fetchedText.trim().startsWith('#VRML')) {
                text = fetchedText;
              }
            }
          } catch (e) {}

          // Fallback to SF raw url if web3d failed
          if (!text) {
            try {
              const res = await fetch(urls.sfUrl);
              if (res.ok) {
                const fetchedText = await res.text();
                if (fetchedText.trim().startsWith('#VRML')) {
                  text = fetchedText;
                }
              }
            } catch (e) {}
          }

          if (!text) return null;

          // Validate parsing
          try {
            const vrmlScene = vrmlLoader.parse(text, '');
            if (vrmlScene && vrmlScene.children.length > 0) {
              return {
                name: `SIG-GRAPH: ${fileName}`,
                url: urls.sfUrl,
                content: text
              };
            }
          } catch (e) {
            // Include valid #VRML content even if Three.js parser warns
            return {
              name: `SIG-GRAPH: ${fileName}`,
              url: urls.sfUrl,
              content: text
            };
          }
        } catch (e) {
          console.error(`Error processing SIG-GRAPH model ${fileName}:`, e);
        }
        return null;
      });

      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res) newPresets.push(res);
      });
    }
  } catch (err) {
    console.error('Failed to fetch SIG-GRAPH presets:', err);
  }

  // 4. Fetch NASA COBE VRML Models
  try {
    const nasaUrl = 'https://lambda.gsfc.nasa.gov/product/cobe/vrml_models.html';
    const nasaRes = await fetch(nasaUrl);
    if (nasaRes.ok) {
      const nasaHtml = await nasaRes.text();
      const regex = /href="([^"]+\.wrl)"/gi;
      let match;
      const nasaLinks = new Set<string>();
      while ((match = regex.exec(nasaHtml)) !== null) {
        nasaLinks.add(match[1]);
      }
      
      const nasaLinksArray = Array.from(nasaLinks);
      const chunkSize = 5;
      for (let i = 0; i < nasaLinksArray.length; i += chunkSize) {
        const chunk = nasaLinksArray.slice(i, i + chunkSize);
        const nasaPromises = chunk.map(async (link) => {
          try {
            let fileUrl = link;
            if (!fileUrl.startsWith('http')) {
              if (fileUrl.startsWith('/')) {
                fileUrl = `https://lambda.gsfc.nasa.gov${fileUrl}`;
              } else {
                fileUrl = `https://lambda.gsfc.nasa.gov/product/cobe/${fileUrl}`;
              }
            }
            const fileRes = await fetch(fileUrl);
            if (!fileRes.ok) return null;
            const text = await fileRes.text();
            
            if (!text.trim().startsWith('#VRML V2.0 utf8')) return null;
            
            const vrmlScene = vrmlLoader.parse(text, '');
            if (vrmlScene && vrmlScene.children.length > 0) {
              return {
                name: `NASA: ${link.split('/').pop() || link}`,
                url: fileUrl
              };
            }
          } catch (e) {
            // Parsing failed
          }
          return null;
        });

        const nasaResults = await Promise.all(nasaPromises);
        nasaResults.forEach(res => {
          if (res) newPresets.push(res);
        });
      }
    }
  } catch (err) {
    console.error('Failed to fetch NASA presets:', err);
  }

  const outputPath = path.join(process.cwd(), 'src', 'presets.json');
  fs.writeFileSync(outputPath, JSON.stringify(newPresets, null, 2));
  console.log(`Successfully built ${newPresets.length} presets to ${outputPath}`);
}

buildPresets().catch(console.error);
