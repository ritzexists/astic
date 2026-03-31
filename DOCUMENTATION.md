# astic Documentation

## Overview

**astic** is a 3D model viewer designed to bridge the gap between legacy VRML formats and modern WebXR-capable engines. It uses **Babylon.js** for its high-performance rendering and WebXR support, while leveraging **Three.js** as a background conversion engine for `.wrl` files.

## Architecture

### 1. Rendering Engine (Babylon.js)
The core of the application is a Babylon.js `Engine` and `Scene`.
- **Camera**: `ArcRotateCamera` allows for intuitive 3D navigation (orbit, pan, zoom).
- **Lighting**: A `HemisphericLight` provides basic ambient and directional lighting.
- **WebXR**: The `createDefaultXRExperienceAsync` method is used to enable immersive VR mode.

### 2. Conversion Pipeline (Three.js)
Since Babylon.js does not natively support the legacy VRML format, **astic** implements a client-side conversion pipeline:
1. **File Input**: User uploads or drops a `.wrl` file.
2. **FileReader**: The file is read as a text string.
3. **VRML Loader**: Three.js `VRMLLoader` parses the VRML 2.0 text into a Three.js scene.
4. **GLTF Exporter**: Three.js `GLTFExporter` converts the Three.js scene into a binary GLB blob.
5. **Babylon Loader**: The resulting GLB blob is then loaded into the Babylon.js scene using `SceneLoader.AppendAsync`.

### 3. User Interface (React + Tailwind CSS)
The UI is built with React and styled using Tailwind CSS.
- **State Management**: React hooks (`useState`, `useEffect`, `useRef`) manage the application state, including loading status, error messages, and UI visibility.
- **Lucide Icons**: Provides a clean, modern iconography set.
- **Responsive Design**: The interface adapts to different screen sizes and provides touch-friendly controls.

## Supported Formats

| Format | Support Level | Notes |
| --- | --- | --- |
| `.glb` | Native | Recommended for best performance and WebXR compatibility. |
| `.gltf` | Native | Standard JSON-based 3D format. |
| `.obj` | Native | Classic wavefront format. |
| `.stl` | Native | Common format for 3D printing. |
| `.wrl` | Conversion | Automatically converted to GLB using Three.js. Requires VRML 2.0 (UTF-8). |

## Troubleshooting

### VRML Conversion Fails
- **VRML 1.0**: Only VRML 2.0 is supported. VRML 1.0 files will fail to parse.
- **Complex Hierarchies**: Extremely complex VRML files with non-standard extensions may fail during conversion.
- **Corrupted Files**: Ensure the file starts with the correct header: `#VRML V2.0 utf8`.

### WebXR Not Available
- **Browser Support**: Ensure you are using a WebXR-compatible browser (e.g., Chrome, Edge, or the Oculus Browser).
- **Hardware**: A VR headset must be connected and recognized by the system.
- **Secure Context**: WebXR requires a secure (HTTPS) context to function.

## Development and Customization

The main application logic resides in `src/App.tsx`. You can customize the scene lighting, camera settings, or UI layout by modifying this file.

### Adding New Loaders
To support additional formats, you can add more loaders to the `loadModel` function in `src/App.tsx`. Babylon.js supports many formats through its `@babylonjs/loaders` package.
