import React, { useEffect, useRef, useState } from 'react';
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, PointLight, SceneLoader, MeshBuilder, Color4, WebXRSessionManager, WebXRState, StandardMaterial, Texture, Color3, Mesh } from '@babylonjs/core';
import '@babylonjs/loaders';
import { AdvancedDynamicTexture, Button, TextBlock } from '@babylonjs/gui';
import { Upload, Box, Info, Glasses } from 'lucide-react';
import * as THREE from 'three';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import presetsData from './presets.json';

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
  const [theme, setTheme] = useState<'default' | 'cyberpunk' | 'vaporwave' | 'geocities' | 'void'>('void');
  const [groundPlacement, setGroundPlacement] = useState<'underneath' | 'middle'>('underneath');
  const [modelMinY, setModelMinY] = useState(0);
  const groundRef = useRef<any>(null);
  const skyboxRef = useRef<any>(null);
  const themeElementsRef = useRef<any[]>([]);
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);
  const userInteractedRef = useRef(false);

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

    const mainLight = currentScene.getLightByName("light");

    ground.isVisible = currentTheme !== 'void';

    switch (currentTheme) {
      case 'void': {
        if (mainLight) mainLight.intensity = 0.7;
        currentScene.clearColor = new Color4(0.05, 0.05, 0.05, 1);
        currentScene.fogMode = Scene.FOGMODE_NONE;
        break;
      }

      case 'cyberpunk': {
        if (mainLight) mainLight.intensity = 0;
        currentScene.clearColor = new Color4(0.01, 0.005, 0.02, 1);
        currentScene.fogMode = Scene.FOGMODE_EXP;
        currentScene.fogDensity = 0.01;
        currentScene.fogColor = new Color3(0.02, 0, 0.05);
        
        const cpMat = new StandardMaterial("cpMat", currentScene);
        const cpTex = new Texture("https://picsum.photos/seed/citystreet/512/512", currentScene);
        cpTex.uScale = 20;
        cpTex.vScale = 20;
        cpMat.diffuseTexture = cpTex;
        cpMat.specularColor = new Color3(0.1, 0.1, 0.1);
        ground.material = cpMat;

        // Night Sky Backdrop
        const sky = MeshBuilder.CreateSphere("sky", { diameter: 500, segments: 32 }, currentScene);
        const skyMat = new StandardMaterial("skyMat", currentScene);
        skyMat.backFaceCulling = false;
        skyMat.diffuseColor = new Color3(0, 0, 0);
        skyMat.emissiveColor = new Color3(0.05, 0.02, 0.1);
        const skyTex = new Texture("https://picsum.photos/seed/nightstars/512/512", currentScene);
        skyTex.uScale = 5;
        skyTex.vScale = 5;
        skyMat.emissiveTexture = skyTex;
        sky.material = skyMat;
        themeElementsRef.current.push(sky);

        // Large Full Moon
        const moonPos = new Vector3(-80, 100, 150);
        const moon = MeshBuilder.CreateSphere("moon", { diameter: 40, segments: 32 }, currentScene);
        moon.position = moonPos;
        moon.rotation.y = Math.PI; // Rotate to face the center
        const moonMat = new StandardMaterial("moonMat", currentScene);
        moonMat.emissiveColor = new Color3(0.9, 0.9, 1);
        const moonTex = new Texture("https://www.babylonjs-playground.com/textures/moon.jpg", currentScene);
        moonMat.emissiveTexture = moonTex;
        moonMat.diffuseTexture = moonTex;
        moon.material = moonMat;
        themeElementsRef.current.push(moon);

        // Moon Light (Blue)
        const moonLight = new PointLight("moonLight", moonPos, currentScene);
        moonLight.diffuse = new Color3(0, 0.5, 1);
        moonLight.intensity = 2.0;
        moonLight.range = 300;
        themeElementsRef.current.push(moonLight);

        // Default Lighting for Theme (Pink)
        const pinkLight = new HemisphericLight("pinkLight", new Vector3(1, 1, 0), currentScene);
        pinkLight.diffuse = new Color3(1, 0, 0.5); // Pink/Magenta
        pinkLight.intensity = 1.0;
        themeElementsRef.current.push(pinkLight);

        // Distant Skyscrapers
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 40 + Math.random() * 60;
          const w = 3 + Math.random() * 6;
          const h = 20 + Math.random() * 50;
          const d = 3 + Math.random() * 6;
          
          const building = MeshBuilder.CreateBox("building", { width: w, height: h, depth: d }, currentScene);
          building.position = new Vector3(Math.cos(angle) * dist, h / 2 + (groundPlacement === 'underneath' ? modelMinY : 0) - 2, Math.sin(angle) * dist);
          
          const bMat = new StandardMaterial("bMat", currentScene);
          bMat.diffuseColor = new Color3(0.02, 0.02, 0.05);
          const bTex = new Texture("https://www.babylonjs-playground.com/textures/grid.jpg", currentScene);
          bTex.uScale = 2;
          bTex.vScale = h / 5;
          bMat.emissiveTexture = bTex;
          bMat.emissiveColor = Math.random() > 0.5 ? new Color3(1, 0, 0.5) : new Color3(0, 0.5, 1);
          building.material = bMat;
          themeElementsRef.current.push(building);
        }
        break;
      }

      case 'vaporwave': {
        if (mainLight) mainLight.intensity = 0;
        currentScene.clearColor = new Color4(1, 0.4, 0.6, 1); // Pinkish horizon
        currentScene.fogMode = Scene.FOGMODE_EXP;
        currentScene.fogDensity = 0.01;
        currentScene.fogColor = new Color3(1, 0.4, 0.6);

        const vwMat = new StandardMaterial("vwMat", currentScene);
        const grassTex = new Texture("https://picsum.photos/seed/green-grass/512/512", currentScene);
        grassTex.uScale = 20;
        grassTex.vScale = 20;
        vwMat.diffuseTexture = grassTex;
        vwMat.specularColor = new Color3(0, 0, 0);
        ground.material = vwMat;

        // Orange/Pink Gradient Sky (Orange at top, Pink at horizon)
        const vwSky = MeshBuilder.CreateSphere("vwSky", { diameter: 500, segments: 32 }, currentScene);
        const vwSkyMat = new StandardMaterial("vwSkyMat", currentScene);
        vwSkyMat.backFaceCulling = false;
        // We simulate the gradient using a texture and emissive color
        const skyGradTex = new Texture("https://picsum.photos/seed/orange-pink-sky/512/512", currentScene);
        vwSkyMat.emissiveTexture = skyGradTex;
        vwSkyMat.emissiveColor = new Color3(1, 0.6, 0.8); 
        vwSky.material = vwSkyMat;
        themeElementsRef.current.push(vwSky);

        // Massive Red-Orange Half-Set Sun
        const sunsetPos = new Vector3(0, groundPlacement === 'underneath' ? modelMinY : 0, 200);
        const sunset = MeshBuilder.CreatePlane("sunset", { size: 120 }, currentScene);
        sunset.position = sunsetPos; // Half-set at ground level
        sunset.billboardMode = Mesh.BILLBOARDMODE_ALL;
        const sunsetMat = new StandardMaterial("sunsetMat", currentScene);
        sunsetMat.emissiveColor = new Color3(1, 0.2, 0); // Red-Orange
        sunsetMat.diffuseColor = new Color3(1, 0.2, 0);
        const sunsetTex = new Texture("https://picsum.photos/seed/red-orange-sun/512/512", currentScene);
        sunsetMat.emissiveTexture = sunsetTex;
        sunsetMat.opacityTexture = sunsetTex;
        sunset.material = sunsetMat;
        themeElementsRef.current.push(sunset);

        // Sun Light (Orange)
        const sunLight = new PointLight("sunLight", sunsetPos, currentScene);
        sunLight.diffuse = new Color3(1, 0.5, 0);
        sunLight.intensity = 2.0;
        sunLight.range = 400;
        themeElementsRef.current.push(sunLight);

        // Ambient Fill for Vaporwave
        const ambientVw = new HemisphericLight("ambientVw", new Vector3(0, 1, 0), currentScene);
        ambientVw.diffuse = new Color3(0.5, 0.2, 0.5);
        ambientVw.intensity = 0.5;
        themeElementsRef.current.push(ambientVw);

        // Distant Palm Trees
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 35 + Math.random() * 40;
          const palm = MeshBuilder.CreatePlane("palm", { size: 12 }, currentScene);
          palm.position = new Vector3(Math.cos(angle) * dist, 6 + (groundPlacement === 'underneath' ? modelMinY : 0) - 1, Math.sin(angle) * dist);
          palm.billboardMode = Mesh.BILLBOARDMODE_ALL;
          const pMat = new StandardMaterial("pMat", currentScene);
          const pTex = new Texture("https://picsum.photos/seed/palm-tree-silhouette/200/400", currentScene);
          pMat.diffuseTexture = pTex;
          pTex.hasAlpha = true;
          palm.material = pMat;
          themeElementsRef.current.push(palm);
        }
        break;
      }

      case 'geocities': {
        if (mainLight) mainLight.intensity = 0;
        currentScene.clearColor = new Color4(0, 0, 0.1, 1);
        currentScene.fogMode = Scene.FOGMODE_NONE;
        
        // Ground Texture
        const gcMat = new StandardMaterial("gcMat", currentScene);
        const gcTex = new Texture("https://picsum.photos/seed/90s-tiled-bg/256/256", currentScene);
        gcTex.uScale = 40;
        gcTex.vScale = 40;
        gcMat.diffuseTexture = gcTex;
        ground.material = gcMat;

        // Sky Texture
        const gcSky = MeshBuilder.CreateSphere("gcSky", { diameter: 500, segments: 32 }, currentScene);
        const gcSkyMat = new StandardMaterial("gcSkyMat", currentScene);
        gcSkyMat.backFaceCulling = false;
        const skyTex = new Texture("https://picsum.photos/seed/vintage-space/512/512", currentScene);
        skyTex.uScale = 10;
        skyTex.vScale = 10;
        gcSkyMat.emissiveTexture = skyTex;
        gcSkyMat.diffuseColor = new Color3(0, 0, 0);
        gcSky.material = gcSkyMat;
        themeElementsRef.current.push(gcSky);

        // Default Lighting for Theme (White)
        const gcLight = new HemisphericLight("gcLight", new Vector3(0, 1, 0), currentScene);
        gcLight.intensity = 0.8;
        themeElementsRef.current.push(gcLight);

        // Floating "Under Construction" signs and random 90s stuff (further away)
        const items = ["construction", "skull", "fire", "cool", "web", "new", "hot"];
        for (let i = 0; i < 25; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 25 + Math.random() * 25;
          const sign = MeshBuilder.CreatePlane("sign", { size: 3 + Math.random() * 2 }, currentScene);
          sign.position = new Vector3(
            Math.cos(angle) * dist, 
            1 + Math.random() * 8 + (groundPlacement === 'underneath' ? modelMinY : 0), 
            Math.sin(angle) * dist
          );
          sign.billboardMode = Mesh.BILLBOARDMODE_ALL;
          const sMat = new StandardMaterial("sMat", currentScene);
          sMat.diffuseTexture = new Texture(`https://picsum.photos/seed/${items[i % items.length]}/200/200`, currentScene);
          sign.material = sMat;
          themeElementsRef.current.push(sign);
        }
        break;
      }

      default:
        if (mainLight) mainLight.intensity = 0.7;
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
    const themes: ('default' | 'cyberpunk' | 'vaporwave' | 'geocities' | 'void')[] = ['default', 'cyberpunk', 'vaporwave', 'geocities', 'void'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    setTheme(nextTheme);
    if (scene) applyTheme(nextTheme, scene);
  };

  useEffect(() => {
    setPresetModels(presetsData);
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

    // Detect user interaction to stop auto-orbit
    newScene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === 0x01) { // PointerDown
        userInteractedRef.current = true;
      }
    });

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
              
              const button = Button.CreateSimpleButton("xrUploadBtn", "UPLOAD WORLD");
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
      if (newScene.activeCamera && !userInteractedRef.current) {
        const arcCamera = newScene.activeCamera as ArcRotateCamera;
        if (arcCamera.alpha !== undefined) {
          arcCamera.alpha += 0.005;
        }
      }
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
    userInteractedRef.current = false;
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
    
    userInteractedRef.current = false;
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
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 z-10 flex justify-between items-start pointer-events-none">
        <button 
          onClick={cycleTheme}
          onPointerDown={handleLogoDown}
          onPointerUp={handleLogoUp}
          onPointerLeave={handleLogoUp}
          className="flex items-center gap-2 md:gap-3 bg-black/60 backdrop-blur-md px-2 py-1.5 md:px-4 md:py-3 rounded-xl border-2 border-dashed border-fuchsia-500 pointer-events-auto shadow-[0_0_15px_rgba(255,0,255,0.5)] hover:scale-105 transition-transform active:scale-95 group select-none"
          title="Click to cycle theme, Long press to toggle ground placement"
        >
          <div className="bg-fuchsia-500/20 p-1.5 md:p-2 rounded-lg group-hover:bg-fuchsia-500/40 transition-colors">
            <Box className="w-4 h-4 md:w-6 md:h-6 text-fuchsia-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h1 
              className="text-xl md:text-3xl font-bold tracking-widest"
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
          <label className="flex items-center justify-center gap-1.5 md:gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 border-2 border-cyan-400 transition-all px-3 py-1.5 md:px-5 md:py-2.5 rounded-none cursor-pointer font-bold shadow-[4px_4px_0px_#00FFFF] active:translate-y-1 active:translate-x-1 active:shadow-none uppercase tracking-wider text-yellow-300 w-36 md:w-48 text-xs md:text-base">
            <Upload className="w-3 h-3 md:w-4 md:h-4" />
            <span>Upload World</span>
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

      <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-6 pointer-events-none">
      {!hasUploadedModel && (
        showPresets ? (
          <div className="w-64 bg-black/80 backdrop-blur-md rounded-none border-2 border-dashed border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.5)] overflow-hidden flex flex-col max-h-[calc(100vh-180px)] pointer-events-auto">
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
                presetModels.map((preset, idx) => {
                  const isWeb3D = preset.name.startsWith('Web3D:');
                  const isLMU = preset.name.startsWith('LMU:');
                  const isSigGraph = preset.name.startsWith('SIG-GRAPH:');
                  const isNASA = preset.name.startsWith('NASA:');
                  const displayName = preset.name.replace(/^(Web3D|LMU|SIG-GRAPH|NASA):\s*/, '');
                  const originUrl = isWeb3D 
                    ? 'https://www.web3d.org/x3d/content/Basic/Vrml97Specification/' 
                    : isLMU 
                      ? 'https://cs.lmu.edu/~ray/notes/vrmlexamples/' 
                      : isSigGraph
                        ? 'https://tecfa.unige.ch/guides/vrml/sig-graph-tutorial/examples/'
                        : isNASA
                          ? 'https://lambda.gsfc.nasa.gov/product/cobe/vrml_models.html'
                          : '#';
                  const originName = isWeb3D ? 'Web3D' : isLMU ? 'LMU' : isSigGraph ? 'SIG-GRAPH' : isNASA ? 'NASA' : 'Origin';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 border-b border-cyan-400/30 last:border-0 hover:bg-fuchsia-600/50 transition-colors group shrink-0 cursor-pointer"
                      onClick={() => loadPresetModel(preset)}
                    >
                      <div
                        className="text-left text-xs font-mono text-cyan-300 group-hover:text-yellow-300 truncate flex-1"
                        title={displayName}
                      >
                        {displayName}
                      </div>
                      {(isWeb3D || isLMU || isSigGraph || isNASA) && (
                        <a 
                          href={originUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-fuchsia-400 hover:text-cyan-200 ml-2 uppercase font-bold tracking-wider px-1 py-0.5 rounded bg-black/50"
                          onClick={(e) => e.stopPropagation()}
                          title={`Go to ${originName} source`}
                        >
                          {originName}
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setShowPresets(true)}
            className="bg-black/80 backdrop-blur-md p-3 rounded-none border-2 border-dashed border-cyan-400 text-cyan-400 hover:text-yellow-300 hover:border-yellow-300 transition-all shadow-[0_0_15px_rgba(0,255,255,0.5)] pointer-events-auto active:translate-y-1 active:translate-x-1 active:shadow-none"
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
              <Info className="w-5 h-5 text-fuchsia-400" /> The vintage world viewer!
            </h3>
            <button 
              onClick={() => setShowInstructions(false)}
              className="text-green-500 hover:text-yellow-300 transition-colors font-bold text-lg"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-2 list-disc list-inside text-cyan-300">
            <li><span className="text-yellow-300 font-bold">Drag & drop</span> a 3D world/model file anywhere</li>
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
