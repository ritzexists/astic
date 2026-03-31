# astic

**astic** is a high-performance, WebXR-capable 3D model viewer built with Babylon.js. It features automatic VRML to GLB conversion using Three.js, allowing legacy 3D formats to be viewed in modern immersive environments.

## Features

- **Immersive WebXR**: Enter Virtual Reality directly from your browser with compatible hardware.
- **Automatic Conversion**: Seamlessly converts `.wrl` (VRML 2.0) files to `.glb` on the fly using Three.js.
- **Multi-format Support**: Natively supports `.glb`, `.gltf`, `.obj`, and `.stl`.
- **Intuitive Controls**: 
  - Drag and drop files to load.
  - Orbit, pan, and zoom with mouse or touch.
- **Modern UI**: Clean, dark-themed interface built with Tailwind CSS and Lucide icons.

## Getting Started

1. Open the application.
2. Drag a 3D model file (e.g., `model.glb` or `legacy.wrl`) into the browser window.
3. Use your mouse to navigate the 3D space.
4. If you have a VR headset, click the VR icon in the bottom right to enter immersive mode.

## Tech Stack

- **Frontend**: React 19, TypeScript
- **3D Engine**: Babylon.js
- **Conversion Engine**: Three.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

Apache-2.0
