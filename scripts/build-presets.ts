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
    const web3dUrl = 'https://www.web3d.org/x3d/content/Basic/Vrml97Specification/index.html';
    const web3dRes = await fetch(web3dUrl);
    if (web3dRes.ok) {
      const web3dHtml = await web3dRes.text();
      const links = new Set<string>();
      
      const regex1 = /href="([^"]+)Index\.html"/g;
      let match1;
      while ((match1 = regex1.exec(web3dHtml)) !== null) {
        links.add(match1[1] + '.wrl');
      }
      
      const regex2 = /href="([^"]+\.wrl)"/g;
      let match2;
      while ((match2 = regex2.exec(web3dHtml)) !== null) {
        links.add(match2[1]);
      }
      
      const excludedWeb3D = [
        'Example04', 'Example05', 'Example07', 'Example14', 'Example15', 'Example16', 'Example19',
        '6', '10', '11', '12', '13_3', 
        'Example6', 'Example10', 'Example11', 'Example12', 'Example13_3',
        'RefractiveMaterial', 'Rotor', 'exampleD_5'
      ];
      
      Array.from(links).forEach(link => {
        const fileName = link.split('/').pop() || link;
        const nameOnly = fileName.replace('.wrl', '');
        if (excludedWeb3D.includes(nameOnly)) return;
        
        newPresets.push({
          name: `Web3D: ${fileName}`,
          url: `https://www.web3d.org/x3d/content/Basic/Vrml97Specification/${link}`
        });
      });
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

  // 3. Fetch SIG-GRAPH VRML Examples
  try {
    const sigGraphUrl = 'https://tecfa.unige.ch/guides/vrml/sig-graph-tutorial/examples/';
    const sigGraphRes = await fetch(sigGraphUrl);
    if (sigGraphRes.ok) {
      const sigGraphHtml = await sigGraphRes.text();
      const regex = /href="([^"]+\.wrl)"/gi;
      let match;
      const sigGraphLinks = new Set<string>();
      while ((match = regex.exec(sigGraphHtml)) !== null) {
        sigGraphLinks.add(match[1]);
      }
      
      let sigGraphLinksArray = Array.from(sigGraphLinks);
      const torchesIndex = sigGraphLinksArray.findIndex(link => link.toLowerCase().includes('torches3'));
      if (torchesIndex !== -1) {
        sigGraphLinksArray = sigGraphLinksArray.slice(0, torchesIndex);
      }

      // Test links in chunks
      const chunkSize = 5;
      for (let i = 0; i < sigGraphLinksArray.length; i += chunkSize) {
        const chunk = sigGraphLinksArray.slice(i, i + chunkSize);
        const sigGraphPromises = chunk.map(async (link) => {
          try {
            const fileUrl = `https://tecfa.unige.ch/guides/vrml/sig-graph-tutorial/examples/${link}`;
            const fileRes = await fetch(fileUrl);
            if (!fileRes.ok) return null;
            const text = await fileRes.text();
            
            if (!text.trim().startsWith('#VRML V2.0 utf8')) return null;
            
            const vrmlScene = vrmlLoader.parse(text, '');
            if (vrmlScene && vrmlScene.children.length > 0) {
              return {
                name: `SIG-GRAPH: ${link}`,
                url: fileUrl
              };
            }
          } catch (e) {
            // Parsing failed
          }
          return null;
        });

        const sigGraphResults = await Promise.all(sigGraphPromises);
        sigGraphResults.forEach(res => {
          if (res) newPresets.push(res);
        });
      }
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
