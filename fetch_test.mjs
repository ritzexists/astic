import https from 'https';
import * as THREE from 'three';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

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
  const content = await fetchUrl('https://www.web3d.org/x3d/content/Basic/Vrml97Specification/ChopperBody.wrl');
  const loader = new VRMLLoader();
  const scene = loader.parse(content, '');
  
  let meshCount = 0;
  scene.traverse((child) => {
    if (child.isMesh) meshCount++;
  });
  console.log("Meshes:", meshCount);
}

run();
