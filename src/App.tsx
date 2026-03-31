import React, { useEffect, useRef, useState } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, SceneLoader, MeshBuilder, Color4, WebXRSessionManager, WebXRState, StandardMaterial, Texture, Color3, Mesh } from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, Button, TextBlock } from '@babylonjs/gui';
import { Upload, Box, Info, Glasses } from 'lucide-react';
import * as THREE from 'three';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xrSupported, setXrSupported] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPresets, setShowPresets] = useState(true);
  const [hasUploadedModel, setHasUploadedModel] = useState(false);
  const [isDefaultModel, setIsDefaultModel] = useState(true);
  const [presetModels, setPresetModels] = useState<{name: string, url?: string, content?: string}[]>([]);
  const instructionsRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'default' | 'cyberpunk' | 'vaporwave' | 'geocities'>('default');
  const [groundPlacement, setGroundPlacement] = useState<'underneath' | 'middle'>('underneath');
  const [modelMinY, setModelMinY] = useState(0);
  const groundRef = useRef<any>(null);
  const skyboxRef = useRef<any>(null);
  const themeElementsRef = useRef<any[]>([]);
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    if (!scene) return;
    const ground = scene.getMeshByName("ground");
    if (ground) {
      ground.position.y = groundPlacement === 'underneath' ? modelMinY : 0;
    }
  }, [groundPlacement, modelMinY, scene]);

  const handleLogoDown = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setGroundPlacement(prev => {
        const next = prev === 'underneath' ? 'middle' : 'underneath';
        setError(`Ground mode: ${next.toUpperCase()}`);
        setTimeout(() => setError(null), 2000);
        return next;
      });
    }, 600);
  };

  const handleLogoUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const applyTheme = (currentTheme: string, currentScene: Scene) => {
    // Cleanup old theme elements
    themeElementsRef.current.forEach(el => el.dispose());
    themeElementsRef.current = [];

    const ground = currentScene.getMeshByName("ground");
    if (!ground) return;

    switch (currentTheme) {
      case 'cyberpunk':
        currentScene.clearColor = new Color4(0.02, 0.01, 0.05, 1);
        currentScene.fogMode = Scene.FOGMODE_EXP;
        currentScene.fogDensity = 0.02;
        currentScene.fogColor = new Color3(0.1, 0, 0.2);
        
        const cpMat = new StandardMaterial("cpMat", currentScene);
        cpMat.diffuseColor = new Color3(0, 0, 0);
        cpMat.emissiveColor = new Color3(0, 0.8, 1);
        const cpTex = new Texture("https://www.babylonjs-playground.com/textures/grid.jpg", currentScene);
        cpTex.uScale = 20;
        cpTex.vScale = 20;
        cpMat.emissiveTexture = cpTex;
        ground.material = cpMat;
        break;

      case 'vaporwave':
        currentScene.clearColor = new Color4(1, 0.2, 0.7, 1);
        currentScene.fogMode = Scene.FOGMODE_EXP;
        currentScene.fogDensity = 0.03;
        currentScene.fogColor = new Color3(0.5, 0, 0.5);

        const vwMat = new StandardMaterial("vwMat", currentScene);
        vwMat.diffuseColor = new Color3(0.2, 0, 0.4);
        vwMat.emissiveColor = new Color3(1, 0, 1);
        const vwTex = new Texture("https://www.babylonjs-playground.com/textures/grid.jpg", currentScene);
        vwTex.uScale = 30;
        vwTex.vScale = 30;
        vwMat.emissiveTexture = vwTex;
        ground.material = vwMat;

        // Add some "palm trees" (planes)
        for (let i = 0; i < 10; i++) {
          const palm = MeshBuilder.CreatePlane("palm", { size: 5 }, currentScene);
          palm.position = new Vector3(Math.random() * 40 - 20, 2.5, Math.random() * 40 + 10);
          palm.billboardMode = Mesh.BILLBOARDMODE_ALL;
          const pMat = new StandardMaterial("pMat", currentScene);
          const pTex = new Texture("https://picsum.photos/seed/palm/200/400", currentScene);
          pMat.diffuseTexture = pTex;
          pTex.hasAlpha = true;
          palm.material = pMat;
          themeElementsRef.current.push(palm);
        }
        break;

      case 'geocities':
        currentScene.clearColor = new Color4(0, 0, 0.2, 1);
        currentScene.fogMode = Scene.FOGMODE_NONE;
        
        const gcMat = new StandardMaterial("gcMat", currentScene);
        const gcTex = new Texture("https://picsum.photos/seed/stars/256/256", currentScene);
        gcTex.uScale = 50;
        gcTex.vScale = 50;
        gcMat.diffuseTexture = gcTex;
        ground.material = gcMat;

        // Floating "Under Construction" signs
        for (let i = 0; i < 5; i++) {
          const sign = MeshBuilder.CreatePlane("sign", { size: 2 }, currentScene);
          sign.position = new Vector3(Math.random() * 10 - 5, 2 + Math.random() * 2, Math.random() * 10 - 5);
          sign.billboardMode = Mesh.BILLBOARDMODE_ALL;
          const sMat = new StandardMaterial("sMat", currentScene);
          sMat.diffuseTexture = new Texture("https://picsum.photos/seed/construction/200/100", currentScene);
          sign.material = sMat;
          themeElementsRef.current.push(sign);
        }
        break;

      default:
        currentScene.clearColor = new Color4(0.1, 0.1, 0.1, 1);
        currentScene.fogMode = Scene.FOGMODE_NONE;
        const defMat = new StandardMaterial("defMat", currentScene);
        defMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
        ground.material = defMat;
        break;
    }
  };

  const cycleTheme = () => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    const themes: ('default' | 'cyberpunk' | 'vaporwave' | 'geocities')[] = ['default', 'cyberpunk', 'vaporwave', 'geocities'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    if (scene) applyTheme(nextTheme, scene);
  };

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const newPresets: {name: string, url?: string, content?: string}[] = [];
        
        // 1. Fetch Web3D VRML97 Specification Models
        const web3dUrl = 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent('https://www.web3d.org/x3d/content/Basic/Vrml97Specification/index.html');
        const web3dRes = await fetch(web3dUrl);
        if (web3dRes.ok) {
          const web3dHtml = await web3dRes.text();
          const links = new Set<string>();
          
          // Match Index.html links
          const regex1 = /href="([^"]+)Index\.html"/g;
          let match1;
          while ((match1 = regex1.exec(web3dHtml)) !== null) {
            links.add(match1[1] + '.wrl');
          }
          
          // Match direct .wrl links
          const regex2 = /href="([^"]+\.wrl)"/g;
          let match2;
          while ((match2 = regex2.exec(web3dHtml)) !== null) {
            links.add(match2[1]);
          }
          
          const excludedWeb3D = [
            'Example04', 'Example05', 'Example07', 'Example14', 'Example15', 'Example16', 'Example19',
            '6', '10', '11', '12', '13_3', 'RefractiveMaterial', 'Rotor', 'exampleD_5'
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

        // 2. Fetch LMU VRML Examples
        const lmuUrl = 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent('https://cs.lmu.edu/~ray/notes/vrmlexamples/');
        const lmuRes = await fetch(lmuUrl);
        if (lmuRes.ok) {
          const lmuHtml = await lmuRes.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(lmuHtml, 'text/html');
          const preElements = doc.querySelectorAll('pre code');
          preElements.forEach(code => {
            const text = code.textContent || '';
            if (text.includes('#VRML V2.0 utf8')) {
              let name = 'LMU Example';
              
              // Try to find the filename in the preceding .filename div
              const pre = code.parentElement;
              if (pre) {
                const filenameDiv = pre.previousElementSibling;
                if (filenameDiv && filenameDiv.classList.contains('filename')) {
                  name = filenameDiv.textContent?.trim() || name;
                } else {
                  // Fallback to searching for headers if .filename is missing
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

              const excludedLMU = ['boxandsphere', 'axesthree'];
              if (excludedLMU.some(ex => name.toLowerCase().includes(ex.toLowerCase()))) return;

              newPresets.push({
                name: `LMU: ${name}`,
                content: text
              });
            }
          });
        }

        setPresetModels(newPresets);
      } catch (err) {
        console.error("Failed to fetch presets:", err);
      }
    };

    fetchPresets();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const newEngine = new Engine(canvasRef.current, true);
    const newScene = new Scene(newEngine);
    newScene.clearColor = new Color4(0.1, 0.1, 0.1, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 10, Vector3.Zero(), newScene);
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.1;

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), newScene);
    light.intensity = 0.7;

    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, newScene);
    const defMat = new StandardMaterial("defMat", newScene);
    defMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    ground.material = defMat;

    // Default box
    const box = MeshBuilder.CreateBox("defaultBox", { size: 2 }, newScene);
    box.position.y = 1;

    // Setup WebXR gracefully
    const initXR = async () => {
      try {
        const isSupported = await WebXRSessionManager.IsSessionSupportedAsync('immersive-vr');
        if (isSupported) {
          const xr = await newScene.createDefaultXRExperienceAsync({
            floorMeshes: [ground]
          });
          setXrSupported(true);

          let xrUI: any = null;

          xr.baseExperience.onStateChangedObservable.add((state) => {
            if (state === WebXRState.IN_XR) {
              // Create 3D UI at user's feet
              const plane = MeshBuilder.CreatePlane("xrUploadUI", { size: 0.6 }, newScene);
              
              // Position at user's feet
              const camera = xr.baseExperience.camera;
              const pos = camera.position.clone();
              pos.y = 0.05; // Slightly above ground to avoid z-fighting
              
              // Move it a bit forward so it's not directly under the head
              const forward = camera.getForwardRay().direction;
              forward.y = 0;
              forward.normalize();
              pos.addInPlace(forward.scale(0.5));
              
              plane.position = pos;
              
              // Face up towards the user
              plane.rotation.x = Math.PI / 3; // Angled up
              plane.lookAt(camera.position, Math.PI, Math.PI / 2, 0);
              // Ensure it's still mostly horizontal but facing user
              plane.rotation.x = Math.PI / 2.5; 

              const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
              
              const button = Button.CreateSimpleButton("xrUploadBtn", "UPLOAD MODEL");
              button.width = "0.8";
              button.height = "0.3";
              button.color = "white";
              button.fontSize = 48;
              button.background = "#2563eb"; // blue-600
              button.cornerRadius = 20;
              button.thickness = 4;
              button.onPointerUpObservable.add(() => {
                fileInputRef.current?.click();
              });
              advancedTexture.addControl(button);

              const text = new TextBlock();
              text.text = "astic 3D Viewer";
              text.color = "white";
              text.fontSize = 24;
              text.top = "-35%";
              advancedTexture.addControl(text);

              xrUI = plane;
            } else if (state === WebXRState.NOT_IN_XR || state === WebXRState.EXITING_XR) {
              if (xrUI) {
                xrUI.dispose();
                xrUI = null;
              }
            }
          });
        }
      } catch (err) {
        // Silently fail if XR is not supported or fails, as it's an optional feature
        console.debug("WebXR initialization skipped or failed:", err);
      }
    };
    initXR();

    newEngine.runRenderLoop(() => {
      newScene.render();
    });

    const handleResize = () => {
      newEngine.resize();
    };

    window.addEventListener('resize', handleResize);

    setEngine(newEngine);
    setScene(newScene);

    return () => {
      window.removeEventListener('resize', handleResize);
      newEngine.dispose();
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scene) return;

    loadModel(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !scene) return;

    loadModel(file);
  };

  const stringifyError = (err: any): string => {
    if (!err) return "Unknown error";
    if (typeof err === 'string') return err;
    
    // Handle Array or Array-like objects (e.g. lexer error lists)
    if (err && typeof err.length === 'number' && typeof err !== 'function' && !err.nodeType) {
      try {
        const arr = Array.from(err);
        if (arr.length > 0) {
          return arr.map(e => stringifyError(e)).join(' | ');
        }
      } catch (e) {
        // Fall through if Array.from fails
      }
    }

    if (err instanceof Error) {
      return stringifyError(err.message || err.name || "Error");
    }

    if (typeof err === 'object') {
      // Common error properties
      const msg = err.message || err.error || err.reason || err.statusText || err.description;
      if (msg) return stringifyError(msg);

      // Handle nested errors array
      if (err.errors && Array.isArray(err.errors)) {
        return err.errors.map((e: any) => stringifyError(e)).join(' | ');
      }

      try {
        const cache = new Set();
        const json = JSON.stringify(err, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
          }
          return value;
        }, 2);
        
        if (json === '{}') {
          const props = [];
          for (const key in err) {
            try {
              props.push(`${key}: ${stringifyError(err[key])}`);
            } catch (e) {
              props.push(`${key}: [Unprintable]`);
            }
          }
          if (props.length > 0) return `{ ${props.join(', ')} }`;
          return String(err);
        }
        return json;
      } catch (e) {
        return "Unserializable error: " + String(err);
      }
    }
    return String(err);
  };

  const loadBabylonModel = (fileToLoad: File, ext: string, isUpload: boolean = false) => {
    // Capture existing meshes to dispose them ONLY after successful load
    const oldMeshes = scene!.meshes.filter(mesh => 
      mesh.name !== "camera" && mesh.name !== "light" && mesh.name !== "ground" && mesh.name !== "xrUploadUI"
    );

    SceneLoader.AppendAsync("", fileToLoad, scene, undefined, "." + ext)
      .then(() => {
        // Successfully loaded new model, now dispose old meshes
        oldMeshes.forEach(mesh => mesh.dispose());
        
        setIsLoading(false);
        setIsDefaultModel(false);
        setShowInstructions(false);
        setShowPresets(false);
        if (isUpload) {
          setHasUploadedModel(true);
        }
        
        // Focus camera on the new model
        if (scene!.activeCamera && scene!.meshes.length > 0) {
          const camera = scene!.activeCamera as ArcRotateCamera;
          
          let min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
          let max = new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
          
          let hasMeshes = false;
          scene!.meshes.forEach(mesh => {
            if (mesh.name !== "camera" && mesh.name !== "light" && mesh.name !== "ground" && mesh.name !== "xrUploadUI") {
              mesh.computeWorldMatrix(true);
              const boundingInfo = mesh.getBoundingInfo();
              min = Vector3.Minimize(min, boundingInfo.boundingBox.minimumWorld);
              max = Vector3.Maximize(max, boundingInfo.boundingBox.maximumWorld);
              hasMeshes = true;
            }
          });
          
          if (hasMeshes) {
            setModelMinY(min.y);
            const center = min.add(max).scale(0.5);
            const size = max.subtract(min).length();
            
            camera.setTarget(center);
            camera.radius = size === 0 ? 10 : size * 1.5;
          }
        }
      })
      .catch(err => {
        console.error("Babylon Load Error:", err);
        setError(`Failed to load model: ${stringifyError(err)}`);
        setIsLoading(false);
      });
  };

  const loadModel = (file: File) => {
    if (!scene) return;
    
    setIsLoading(true);
    setError(null);

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'wrl') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const trimmedText = text.trim();
          
          // Basic VRML 2.0 check
          if (!trimmedText.startsWith('#VRML V2.0 utf8')) {
            console.warn("File does not start with '#VRML V2.0 utf8'. VRML 1.0 is not supported by this loader.");
            if (trimmedText.startsWith('#VRML V1.0')) {
              throw new Error("This file appears to be VRML 1.0, which is not supported. Please use a VRML 2.0 (UTF-8) file.");
            }
          }

          const vrmlLoader = new VRMLLoader();
          
          // VRMLLoader might log lexing errors to console. 
          // We try to detect if it failed to produce a valid scene.
          const vrmlScene = vrmlLoader.parse(text, '');
          
          if (!vrmlScene || vrmlScene.children.length === 0) {
            throw new Error("VRML parsing failed or produced an empty scene. Ensure the file is a valid VRML 2.0 (UTF-8) file.");
          }
          
          const exporter = new GLTFExporter();
          exporter.parse(
            vrmlScene,
            (gltf) => {
              const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
              const glbFile = new File([blob], "converted.glb", { type: 'model/gltf-binary' });
              
              loadBabylonModel(glbFile, 'glb', true);
            },
            (err) => {
              console.error("GLTF Export Error:", err);
              setError(`Failed to convert VRML to GLB: ${stringifyError(err)}`);
              setIsLoading(false);
            },
            { binary: true }
          );
        } catch (err: any) {
          console.error("VRML Processing Error:", err);
          setError(`Error processing VRML: ${stringifyError(err)}`);
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read VRML file");
        setIsLoading(false);
      };
      reader.readAsText(file);
    } else {
      loadBabylonModel(file, extension, true);
    }
  };

  const loadPresetModel = async (preset: {name: string, url?: string, content?: string}) => {
    if (!scene) return;
    setIsLoading(true);
    setError(null);

    try {
      let text = '';
      if (preset.content) {
        text = preset.content;
      } else if (preset.url) {
        // Use a CORS proxy to fetch the VRML file from web3d.org
        const proxyUrl = 'https://api.codetabs.com/v1/proxy/?quest=' + encodeURIComponent(preset.url);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Failed to fetch preset: ${response.statusText}`);
        text = await response.text();
      } else {
        throw new Error("Invalid preset configuration");
      }

      const trimmedText = text.trim();
      if (!trimmedText.startsWith('#VRML V2.0 utf8')) {
        console.warn("File does not start with '#VRML V2.0 utf8'.");
        if (trimmedText.startsWith('#VRML V1.0')) {
          throw new Error("This file appears to be VRML 1.0, which is not supported.");
        }
      }

      const vrmlLoader = new VRMLLoader();
      const vrmlScene = vrmlLoader.parse(text, '');
      
      if (!vrmlScene || vrmlScene.children.length === 0) {
        throw new Error("VRML parsing failed or produced an empty scene.");
      }
      
      const exporter = new GLTFExporter();
      exporter.parse(
        vrmlScene,
        (gltf) => {
          const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' });
          const glbFile = new File([blob], "converted.glb", { type: 'model/gltf-binary' });
          loadBabylonModel(glbFile, 'glb', false);
        },
        (err) => {
          console.error("GLTF Export Error:", err);
          setError(`Failed to convert VRML to GLB: ${stringifyError(err)}`);
          setIsLoading(false);
        },
        { binary: true }
      );
    } catch (err: any) {
      console.error("Preset Load Error:", err);
      setError(`Error loading preset: ${stringifyError(err)}`);
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="w-full h-screen flex flex-col bg-black text-white relative overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
        <button 
          onClick={cycleTheme}
          onPointerDown={handleLogoDown}
          onPointerUp={handleLogoUp}
          onPointerLeave={handleLogoUp}
          className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border-2 border-dashed border-fuchsia-500 pointer-events-auto shadow-[0_0_15px_rgba(255,0,255,0.5)] hover:scale-105 transition-transform active:scale-95 group select-none"
          title="Click to cycle theme, Long press to toggle ground placement"
        >
          <div className="bg-fuchsia-500/20 p-2 rounded-lg group-hover:bg-fuchsia-500/40 transition-colors">
            <Box className="w-6 h-6 text-fuchsia-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h1 
              className="text-3xl font-bold tracking-widest"
              style={{ 
                fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                color: '#00FF00',
                textShadow: '2px 2px #FF00FF, -2px -2px #00FFFF',
                textTransform: 'uppercase'
              }}
            >
              astic
            </h1>
          </div>
        </button>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <label className="flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 border-2 border-cyan-400 transition-all px-5 py-2.5 rounded-none cursor-pointer font-bold shadow-[4px_4px_0px_#00FFFF] active:translate-y-1 active:translate-x-1 active:shadow-none uppercase tracking-wider text-yellow-300 w-48">
            <Upload className="w-4 h-4" />
            <span>Upload Model</span>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".glb,.gltf,.obj,.stl,.wrl" 
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-6 pointer-events-auto">
      {!hasUploadedModel && (
        showPresets ? (
          <div className="absolute bottom-6 right-6 z-10 w-64 bg-black/80 backdrop-blur-md rounded-none border-2 border-dashed border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.5)] overflow-hidden flex flex-col max-h-[calc(100vh-180px)] pointer-events-auto">
            <div className="bg-fuchsia-600/30 px-3 py-2 text-xs font-bold text-yellow-300 uppercase tracking-widest border-b-2 border-dashed border-cyan-400 text-center shrink-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Box className="w-3 h-3 text-cyan-400" />
                <span>VRML97 Presets</span>
              </div>
              <button 
                onClick={() => setShowPresets(false)}
                className="text-cyan-400 hover:text-yellow-300 transition-colors font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col overflow-y-auto flex-1">
              {presetModels.length === 0 ? (
                <div className="px-3 py-4 text-sm text-cyan-300/50 text-center shrink-0 animate-pulse">Scanning for models...</div>
              ) : (
                presetModels.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPresetModel(preset)}
                    className="text-left px-3 py-2 text-xs font-mono text-cyan-300 hover:bg-fuchsia-600/50 hover:text-yellow-300 transition-colors border-b border-cyan-400/30 last:border-0 truncate shrink-0"
                    title={preset.name}
                  >
                    {preset.name}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowPresets(true)}
            className="absolute bottom-6 right-6 z-10 bg-black/80 backdrop-blur-md p-3 rounded-none border-2 border-dashed border-cyan-400 text-cyan-400 hover:text-yellow-300 hover:border-yellow-300 transition-all shadow-[0_0_15px_rgba(0,255,255,0.5)] pointer-events-auto active:translate-y-1 active:translate-x-1 active:shadow-none"
            title="Show Presets"
          >
            <Box className="w-6 h-6" />
          </button>
        )
      )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-black p-8 rounded-none border-2 border-dashed border-fuchsia-500 shadow-[0_0_15px_rgba(255,0,255,0.5)]">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p 
              className="font-bold text-xl tracking-widest uppercase"
              style={{ 
                fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                color: '#00FF00',
                textShadow: '1px 1px #FF00FF, -1px -1px #00FFFF'
              }}
            >
              Loading model...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-red-900/90 text-yellow-300 px-6 py-4 rounded-none border-2 border-dashed border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.8)] backdrop-blur-md max-w-xl w-full">
          <Info className="w-6 h-6 shrink-0" />
          <p className="font-bold text-sm flex-1 tracking-wider">{error}</p>
          <button onClick={() => setError(null)} className="shrink-0 hover:bg-red-500/50 p-1.5 rounded-none transition-colors border border-transparent hover:border-yellow-300">
            ✕
          </button>
        </div>
      )}

      {showInstructions && (
        <div 
          ref={instructionsRef}
          className="absolute bottom-6 left-6 z-10 bg-black/80 backdrop-blur-md p-5 rounded-none border-2 border-dashed border-green-500 text-sm text-cyan-300 max-w-sm pointer-events-auto shadow-[0_0_15px_rgba(0,255,0,0.5)]"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 
              className="font-bold text-lg flex items-center gap-2 tracking-widest uppercase"
              style={{ 
                fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                color: '#00FF00',
                textShadow: '1px 1px #FF00FF, -1px -1px #00FFFF'
              }}
            >
              <Info className="w-5 h-5 text-fuchsia-400" /> The vintage model viewer!
            </h3>
            <button 
              onClick={() => setShowInstructions(false)}
              className="text-green-500 hover:text-yellow-300 transition-colors font-bold text-lg"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-2 list-disc list-inside text-cyan-300">
            <li><span className="text-yellow-300 font-bold">Drag & drop</span> a 3D model file anywhere</li>
            <li><span className="text-yellow-300 font-bold">Supported:</span> .glb, .gltf, .obj, .stl, .wrl</li>
            <li><span className="text-yellow-300 font-bold">Left click + drag</span> to rotate</li>
            <li><span className="text-yellow-300 font-bold">Right click + drag</span> to pan</li>
            <li><span className="text-yellow-300 font-bold">Scroll</span> to zoom</li>
          </ul>
          
          <div className="mt-4 pt-4 border-t-2 border-dashed border-green-500/50">
            <div className="flex items-center gap-2 mb-2">
              <Glasses className={`w-4 h-4 ${xrSupported ? 'text-green-400' : 'text-red-500'}`} />
              <span className={`font-bold tracking-wider uppercase text-xs ${xrSupported ? 'text-green-400' : 'text-red-500'}`}>
                {xrSupported ? 'WebXR Ready' : 'WebXR Not Detected'}
              </span>
            </div>
            <p className="text-xs text-cyan-400/80 leading-relaxed">
              Click the VR icon (bottom right) to enter immersive mode if you have a compatible headset.
            </p>
            <p className="mt-3 text-xs text-fuchsia-300 leading-relaxed bg-fuchsia-900/30 p-2 border border-dashed border-fuchsia-500/50">
              Note: VRML (.wrl) files are automatically converted to GLB using Three.js before being displayed in Babylon.js.
            </p>
          </div>
        </div>
      )}

      {!showInstructions && (
        <button 
          onClick={() => setShowInstructions(true)}
          className="absolute bottom-6 left-6 z-10 bg-black/80 backdrop-blur-md p-3 rounded-none border-2 border-dashed border-green-500 text-green-400 hover:text-yellow-300 hover:border-yellow-300 transition-all shadow-[0_0_15px_rgba(0,255,0,0.5)] pointer-events-auto active:translate-y-1 active:translate-x-1 active:shadow-none"
          title="Show Instructions"
        >
          <Info className="w-6 h-6" />
        </button>
      )}

      <canvas 
        ref={canvasRef} 
        className="w-full h-full outline-none touch-none"
        onPointerDown={(e) => {
          // If instructions are visible and click is on the canvas (not on instructions)
          if (showInstructions) {
            setShowInstructions(false);
          }
        }}
      />
    </div>
  );
}
