# Logotype Builder

> A high-performance, web-based vector logotype design tool inspired by the **Adobe Illustrator Shape Builder** and modern geometric grid drafting techniques.

![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest&logoColor=white)

---

## Overview

Brand designers and typographers frequently craft iconic marks—geometric animal silhouettes, monograms, and tech emblems—by overlaying geometric scaffolds (concentric circles, isometric grids, tangent lines) and using a **Shape Builder** to sculpt final vectors by merging and subtracting overlapping atomic regions.

Figma lacks a native shape builder, while legacy vector suites can be heavy and complex. **Logotype Builder** delivers a focused, fluid web app dedicated specifically to geometric mark construction, planar face decomposition, and clean SVG export.

---

## Key Features

### 1. Geometric Scaffolds & Primitive Tools
- **Preset Scaffolds**:
  - **Concentric Golden Circles**: Apple / Twitter / emblem style circular grids.
  - **Flower of Life**: Sacred geometry and balanced floral lattices.
  - **Overlapping Venn**: Mastercard / Olympic style intersecting circles.
  - **Isometric 3D Grid**: Monograms, cube letters, and isometric emblems.
  - **Modular 5×5 Grid**: Geometric display typography and block marks.
- **Custom Geometry Tools**:
  - Draw arbitrary Lines (<kbd>L</kbd>), Parallel Lines (<kbd>P</kbd>), Circles (<kbd>C</kbd>), Concentric Circles (<kbd>O</kbd>), Ellipses (<kbd>E</kbd>), and Quads/Rectangles (<kbd>R</kbd>).
  - Direct manipulation: Drag endpoints, scale axes, and rotate guides with **Shift**-snapping (15°, 45°, 90°).

### 2. Planar Shape Builder Engine
- **Exact Boolean Topology**: Powered by [Paper.js](http://paperjs.org/) to compute true mathematical Bézier curve intersections (no segmented or faceted polygons).
- **Interactive Region Scrubbing**:
  - Hover over any atomic region to see dynamic hatch mesh highlighting.
  - Click and drag across multiple cells to create a selection path.
  - **Merge Mode (<kbd>M</kbd>)**: Combines swept regions into seamless compound vector paths (`unite`).
  - **Subtract / Erase Mode (<kbd>Alt</kbd>)**: Carves out regions from existing shapes.
- **Line Slicing**: Slices shapes cleanly with straight lines using half-plane boolean partitioning.

### 3. Typography & Wordmarks
- Integrated **Text Tool (<kbd>T</kbd>)** to pair vector marks with custom wordmarks and lockups.
- Live controls for font family (Inter, Playfair Display, Space Grotesk, JetBrains Mono, Syne, etc.), font size, font weight, and letter tracking.

### 4. Layer Stacking & Transformation
- **Live Bounding Box & Corner Scaling**: Drag handles with anchored opposite-corner scaling, or hold <kbd>Alt</kbd> to scale around center.
- **Layer Stacking Reorder**: Built Shapes panel lets you reorder layers using <kbd>▲</kbd> / <kbd>▼</kbd> buttons or <kbd>Ctrl + [</kbd> / <kbd>Ctrl + ]</kbd>.
- **Centering & Cropping**:
  - **Center Logo**: Translates marks directly to the artboard center.
  - **Crop Canvas**: Computes the exact bounding box with padding to tighten the artboard around your mark (with one-click reset).

### 5. Reference Image Tracing
- **Drag-and-Drop**: Drag any PNG, JPG, SVG, WebP, or GIF image directly onto the canvas.
- **Built-in Demo Samples**:
  - 🐿️ **Squirrel Sketch** (Clean geometric circular-curve sketch)
  - 🦖 **T-Rex Sketch** (Clean dinosaur logo outline)
  - 🛩️ **Airplane Sketch** (Hand-drawn Cessna banking sketch)
- Includes live opacity adjustment, visibility toggle, and automatic aspect-ratio fitting.

### 6. Production & Portfolio Export
- **Clean SVG Export**: Standalone production-ready SVG with no internal seams or overlapping ghost paths.
- **Blueprint Showcase Export**: The signature portfolio aesthetic displaying the finished mark alongside faint cyan construction guides and circular grids.
- **High-Resolution PNG**: 2× Retina PNG download.
- Customizable background fills (Transparent, Canvas Dark, Pure White, Pitch Black).

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- `npm`, `pnpm`, or `yarn`

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rikardsk/logotype-builder.git
   cd logotype-builder
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Run Unit Tests**:
   ```bash
   npm run test
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

*(On Windows, you can also double-click `Start.bat` to launch immediately).*

---

## Workflow: How to Build a Logo from Scratch

1. **Select or Draw a Scaffold**:
   - Choose a preset from the **Scaffolds** dropdown in the top bar (e.g. *Concentric Golden Circles*), or draw custom guides with <kbd>C</kbd> (Circles) and <kbd>L</kbd> (Lines).
2. **(Optional) Add a Reference Sketch**:
   - Drag an image onto the canvas or choose one from **Demo Samples ▾** in the top bar. Adjust opacity to trace over it.
3. **Sculpt with the Shape Builder Tool**:
   - Press <kbd>M</kbd> to enter **Shape Builder Mode**.
   - Hover over intersecting cells to preview them with a hatched highlight.
   - Click and drag across the cells that make up your desired shape. Release the mouse to merge them into a finished solid path.
   - Hold <kbd>Alt</kbd> while dragging to erase unwanted sections.
4. **Style & Position**:
   - Pick a brand color from the bottom palette bar.
   - Press <kbd>V</kbd> to switch to **Select Mode** to scale, move, or reorder shapes.
   - Click **Center Logo** or **Crop Canvas** to frame your mark.
5. **Export & Re-import (Full Project Continuity)**:
   - Click **Export Mark** in the top-right corner.
   - Choose **Clean SVG** for production or **Blueprint** for portfolio presentation.
   - Download as SVG or 2× PNG, or save as a dedicated **.logo** project file.
   - **Continue Working Anytime**: Exported SVGs automatically contain embedded project data. Drag & drop any exported SVG (or `.logo` file) directly onto the canvas, or click **Open** in the top bar to restore all guides, shapes, colors, and artboard configurations!

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>V</kbd> | Selection & Transform Tool |
| <kbd>M</kbd> | Shape Builder (Merge Mode) |
| <kbd>Alt</kbd> *(Hold)* | Subtract / Erase Mode |
| <kbd>L</kbd> | Draw Line Guide |
| <kbd>P</kbd> | Draw Parallel Lines Guide |
| <kbd>C</kbd> | Draw Circle Guide |
| <kbd>O</kbd> | Draw Concentric Circles Guide |
| <kbd>E</kbd> | Draw Ellipse Guide |
| <kbd>R</kbd> | Draw Rectangle / Quad Guide |
| <kbd>T</kbd> | Wordmark / Text Tool |
| <kbd>H</kbd> | Toggle Guide Visibility |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Cycle Forward / Backward Through Guides |
| <kbd>Space</kbd> + Drag | Pan Canvas |
| <kbd>[</kbd> / <kbd>]</kbd> | Scale Selected Shapes Down / Up (10%) |
| <kbd>Arrow Keys</kbd> | Nudge Selected Shape / Guide by 1px |
| <kbd>Shift</kbd> + <kbd>Arrow Keys</kbd> | Fast Nudge Selected Shape / Guide by 10px |
| <kbd>Ctrl</kbd> + <kbd>Arrow Keys</kbd> | Resize Shape or Resize / Lengthen / Shorten Guide (5%) |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Arrow Keys</kbd> | Fast Resize Shape or Guide (15%) |
| <kbd>Ctrl</kbd> + <kbd>[</kbd> / <kbd>]</kbd> | Move Layer Backward / Forward |
| <kbd>Ctrl</kbd> + <kbd>C</kbd> / <kbd>V</kbd> | Copy / Paste Selected Elements |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Duplicate Selection (with 20px offset) |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl+Shift+Z</kbd> | Redo |
| <kbd>Backspace</kbd> / <kbd>Delete</kbd> | Delete Selected Shapes or Guides |

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, async/await, modular functional architecture)
- **Geometry & Boolean Engine**: [Paper.js](http://paperjs.org/) (Core vector math & 2D topology)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/) (54 unit tests covering planar decomposition, guide transforms, and artboard math)

---

## License

MIT © [Rikard](https://github.com/rikardsk)
