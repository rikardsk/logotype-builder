# Implementation Plan: Web-Based Logotype Builder (Shape Builder Tool MVP)

## Goal Description
Build a web-based **Logotype Builder** inspired by the **Shape Builder Tool in Adobe Illustrator**. 
Brand designers and typographers frequently craft iconic marks (e.g. geometric monograms, modern tech emblems, animal silhouettes) by overlaying geometric scaffolds (concentric circles, isometric grids, tangent lines) and using the Shape Builder tool to sculpt the mark by merging and subtracting overlapping atomic regions. 

Currently, Figma lacks a true Shape Builder, and Adobe Illustrator is bloated and expensive. This MVP will deliver a high-performance, focused web tool that lets users construct vector logotypes from geometric scaffolds using intuitive click-and-drag planar face merging/cutting, with clean SVG export.

---

## Technical Architecture: How the Shape Builder Works

```mermaid
flowchart TD
    A["Guide Geometry (Circles, Lines, Grids)"] --> B["Planar Face Decomposer (Paper.js Engine)"]
    B --> C["Atomic Disjoint Faces (Planar Graph Regions)"]
    C --> D["Shape Builder Interactive Canvas"]
    
    subgraph Interaction Loop
        D -->|Hover| E["Mesh / Hatch Highlight"]
        D -->|Drag Path Across Cells| F["Active Face Selection Set"]
        F -->|Release Mouse (Merge Mode)| G["Boolean Union: path.unite()"]
        F -->|Release Mouse (Alt/Erase Mode)| H["Subtract / Clear Faces"]
    end

    G --> I["Active Logotype Shapes Layer"]
    H --> I
    I --> J["Clean SVG Export & Blueprint Showcase"]
```

### The Planar Face Decomposition Algorithm
1. **Input Scaffolds**: Closed geometric primitives (concentric circles, intersecting rings, isometric polygon grids, modular rectangles).
2. **Atomic Partitioning (Venn / Boolean Slicing)**:
   - For an ordered list of primitives $[S_1, S_2, \dots, S_n]$:
   - Maintain a collection of pairwise disjoint atomic faces $\mathcal{F}$, initialized with $[S_1]$.
   - For each subsequent shape $S_k$:
     - For each existing face $F_i \in \mathcal{F}$:
       - $F_i^{\text{inside}} = F_i \cap S_k$
       - $F_i^{\text{outside}} = F_i \setminus S_k$
       - Replace $F_i$ with the non-empty slices.
     - Add the remainder of $S_k$ not covered by previous faces: $S_k \setminus \bigcup F_i$.
   - This partitions the overlapping vector geometry into atomic, non-overlapping planar faces (minimal enclosed regions).
3. **Interactive Region Scrubbing**:
   - As the pointer hovers over an atomic face, it is hit-tested using `path.contains(point)`.
   - On `mousedown` + `drag`, a dynamic sweep line tracks mouse movements.
   - Any atomic face intersecting the drag sweep is added to the active selection cluster.
   - On `mouseup`:
     - **Merge Mode (Default)**: Selected faces are combined into a single compound path using `paper.Path.unite()`.
     - **Subtract Mode (Alt held or Toggle)**: Selected faces are deleted from the active logo shapes.
4. **Clean SVG Export & Blueprint Showcase**:
   - The resulting shapes are rendered cleanly into standalone SVG elements with no hidden internal overlap lines or ghost vertices.
   - Users can toggle between clean logotype SVG and the iconic geometric blueprint view (with cyan construction guides).

---

## Architectural Decisions & Confirmed Scope

> [!IMPORTANT]
> **Geometry Engine Choice: Paper.js Core**
> We use `paper` (or `paper-core`) as the underlying 2D geometry engine because it provides exact Bezier curve intersections and boolean operations (`unite`, `subtract`, `intersect`, `divide`). Pure polygon libraries (like Clipper) discretize circles into segmented polygons; Paper.js retains true mathematical curves, which is critical for logotype fidelity.

> [!NOTE]
> **Scaffold Presets & Construction Scaffolds**
> To ensure rock-solid numerical stability, zero curve artifacts, and immediate creative satisfaction, the MVP focuses on geometric scaffolds plus snapping primitive placement:
> 1. **Overlapping Circles (Venn / Mastercard / Olympics style)**
> 2. **Concentric Golden Circles (Apple / Twitter / Emblem style)**
> 3. **Isometric 3D Grid (Monogram & Hexagon letterforms)**
> 4. **Modular Typographic 5x5 Grid (Geometric display letters)**
> 5. **Custom Primitive Tool (Add custom circles & rectangles with snapping)**

> [!NOTE]
> **Blueprint Showcase Export (Approved)**
> In addition to the production-ready clean SVG output, the export modal includes a "Blueprint / Construction Grid" export option, displaying the crafted mark alongside its faint cyan geometric construction circles—the signature aesthetic brand designers showcase in their portfolios.

---

## Proposed Changes

### 1. Project Initialization & Dependencies
Set up modern Vite + React 19 + TypeScript + Tailwind CSS with Lucide icons.

#### [NEW] `package.json`
- Dependencies: `react`, `react-dom`, `lucide-react`, `paper`, `canvas-confetti` (for delight)
- DevDependencies: `typescript`, `@types/react`, `@types/node`, `@types/paper`, `vite`, `tailwindcss`, `@tailwindcss/vite`, `vitest`

#### [NEW] `vite.config.ts`
- Vite configuration with React plugin, Tailwind CSS, and Vitest test config.

#### [NEW] `tsconfig.json` & `tsconfig.app.json`
- Strict TypeScript configuration adhering to workspace standards.

---

### 2. Geometry Core Engine (`src/geometry/`)

All functions kept under 30 lines with early returns and pure TypeScript types.

#### [NEW] `src/geometry/types.ts`
```typescript
export interface Point2D {
  x: number;
  y: number;
}

export interface AtomicFace {
  id: string;
  pathData: string; // SVG path d-string
  bounds: { x: number; y: number; width: number; height: number };
  center: Point2D;
}

export interface ConstructedShape {
  id: string;
  pathData: string;
  fillColor: string;
  createdAt: number;
}

export type BuilderMode = 'merge' | 'subtract';
```

#### [NEW] `src/geometry/planarDecomposer.ts`
- Functions to initialize headless Paper.js scope.
- Recursive Venn / Boolean decomposition of overlapping closed paths into non-overlapping `AtomicFace` objects.
- Functions kept under 30 lines with early returns.

#### [NEW] `src/geometry/shapeMerger.ts`
- `mergeFaces(facePaths: string[]): string`: Unions selected SVG paths using `paper.Path.unite()` and returns a clean unified SVG path `d` string.
- `subtractFace(baseShapePath: string, faceToSubtract: string): string`: Carves out regions using `paper.Path.subtract()`.

#### [NEW] `src/geometry/scaffolds.ts`
- Preset generator functions:
  - `generateConcentricCirclesScaffold(cx, cy, radii: number[])`
  - `generateOverlappingCirclesScaffold(cx, cy, count, radius, overlap)`
  - `generateIsometricGridScaffold(width, height, cellSize)`
  - `generateModularGridScaffold(rows, cols, cellSize)`

---

### 3. Canvas & Interactive Shape Builder (`src/components/canvas/`)

#### [NEW] `src/components/canvas/ShapeBuilderCanvas.tsx`
- Interactive SVG / Canvas rendering layer.
- **Layers**:
  1. Background grid & Artboard boundary
  2. Construction Scaffold Guides (subtle cyan/slate strokes)
  3. Atomic Faces (hover highlights with diagonal SVG pattern or dot stipple)
  4. Active Drag Trail (red/blue glowing sweep line showing the user's cursor drag)
  5. Built Logotype Shapes (solid fills with customizable colors)
- Smooth Pan & Zoom (mouse wheel & spacebar drag).
- Touch and mouse pointer tracking with hit detection.

#### [NEW] `src/components/canvas/HatchPatterns.tsx`
- SVG `<defs>` providing the iconic Illustrator Shape Builder dot mesh and diagonal hatch pattern fills for hovered/selected cells.

---

### 4. UI Shell & Control Panels (`src/components/ui/`)

Following Emil Kowalski's design engineering principles (instant feedback, dark-mode elegance, tactile button states, no unnecessary animations on frequent actions).

#### [NEW] `src/components/ui/Toolbar.tsx`
- Tool buttons:
  - Select / Move Mode (`V`)
  - Shape Builder Mode (`M`)
  - Mode Switcher: Merge (`+`) vs Subtract (`-` / Alt)
  - Clear / Reset
  - Undo (`Ctrl+Z`) / Redo (`Ctrl+Y`)

#### [NEW] `src/components/ui/ScaffoldSelector.tsx`
- Visual preset cards for instantly loading classic geometric logo scaffolds (Concentric Circles, Isometric 3D, Overlapping Circles, 5x5 Modular Letterform).

#### [NEW] `src/components/ui/ColorPaletteBar.tsx`
- Curated designer palettes (Minimal Monochrome, Bauhaus Primary, Electric Cyber, Nordic Warmth).
- Custom hex color picker.

#### [NEW] `src/components/ui/ExportModal.tsx`
- Preview tabs: Clean SVG, SVG Blueprint (with guide lines), High-res PNG.
- Copy SVG to Clipboard button with visual confirmation.
- Direct file download buttons (`.svg`, `.png`).

#### [NEW] `src/App.tsx`
- Root layout coordinating state, keyboard shortcut listeners, toolbar, canvas, and export modals.

---

## Verification Plan

### Automated Tests
Run Vitest unit tests to ensure computational geometry correctness:
```powershell
npx vitest run
```
Test suites will cover:
1. `src/geometry/__tests__/planarDecomposer.test.ts`:
   - Decomposing two intersecting circles yields 3 disjoint atomic faces.
   - Decomposing concentric rings yields separate annular regions.
2. `src/geometry/__tests__/shapeMerger.test.ts`:
   - Union of two adjacent faces produces a valid single closed path with correct bounding box.
   - Subtracting a face from a shape correctly removes the region.
3. `src/geometry/__tests__/scaffolds.test.ts`:
   - Preset generators output valid, non-empty geometric paths.

### Manual Verification Checklist
1. **Load Presets**: Click each preset (Concentric Circles, Overlapping Circles, Isometric Grid) and verify guides render cleanly.
2. **Hover Feedback**: Move cursor across cells in Shape Builder mode; confirm instant stipple/mesh highlight.
3. **Drag Merge**: Click and drag across 3 adjacent cells; confirm trail line appears and cells unite into a single solid shape upon release.
4. **Alt Subtract**: Hold Alt/Option and click/drag across a cell; confirm it erases/subtracts from the shape.
5. **Toggle Guides**: Click "Hide Guides" and verify the canvas cleanly displays only the constructed logo.
6. **Export**:
   - Click "Copy SVG" and paste into an SVG viewer or text editor to verify clean XML with no ghost nodes.
   - Download SVG and open in browser/Illustrator/Figma.
   - Test "Blueprint" export mode to confirm cyan construction circles render properly.
7. **Undo / Redo**: Test `Ctrl+Z` and `Ctrl+Shift+Z` / `Ctrl+Y` to undo and redo shape build steps.
