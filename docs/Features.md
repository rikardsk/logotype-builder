# Logotype Builder - Feature Roadmap & Proposals

This document outlines high-impact feature proposals and enhancements to elevate **Logotype Builder** into a studio-grade, professional identity design suite.

---

## 1. Direct Manipulation & Geometry Polish

### 1.1 Rotation Stem for Built Shapes
- **Description**: Add a top rotation handle with a stem extending above the selection bounding box (similar to the existing rectangle guide rotation stem).
- **Behavior**:
  - Dragging the rotation handle rotates all selected shapes smoothly around their bounding center.
  - Holding **`Shift`** snaps rotation to 15°, 45°, and 90° increments.
  - Interactive degree readout tooltip (`0°` to `360°`) while rotating.
- **Value**: Allows designers to orient marks (e.g. tilted badges, italicized letterforms, dynamic emblems) without rotating individual scaffold guides.

### 1.2 Corner Rounding / Vertex Fillets
- **Description**: Provide corner smoothing on sharp geometric corners created by the shape builder.
- **Behavior**:
  - Global corner radius slider in the shapes panel or draggable circular handles at shape vertices.
  - Uses Paper.js or quadratic/cubic Bézier fillets to round sharp angles into smooth arcs.
- **Value**: Gives logos a friendly, polished, organic tech aesthetic (similar to Spotify, Airbnb, or modern icon systems).

### 1.3 Smart Guides & Canvas Alignment
- **Description**: Visual snapping guides that appear when moving or scaling shapes.
- **Behavior**:
  - Faint magenta dashed lines indicating canvas center (`X: 400`, `Y: 400`), edge alignment, and equal spacing between elements.
  - Automatic snapping with subtle magnetic threshold (can be toggled with a shortcut or button).
- **Value**: Guarantees perfect centering and optical balance for final export.

---

## 2. Symmetry & Pattern Generation

### 2.1 Bilateral Mirroring (Flip & Duplicate)
- **Description**: One-click horizontal or vertical symmetry mirroring.
- **Behavior**:
  - Select one or more shapes and click **Mirror Horizontal** or **Mirror Vertical**.
  - Creates a perfectly mirrored duplicate across the canvas center or selection boundary.
- **Value**: Dramatically speeds up the creation of heraldic badges, shields, wings, symmetrical monograms, and crests.

### 2.2 Radial Array / Rotational Duplication
- **Description**: Clone selected shapes in a circular pattern around the canvas center.
- **Behavior**:
  - Configurable copy count: 3×, 4×, 5×, 6×, 8×, 12×.
  - Live rotation angle step (`360° / N`).
- **Value**: Enables instant creation of floral motifs, gears, turbines, starbursts, and sacred geometry emblems.

---

## 3. Styling & Aesthetics

### 3.1 Linear & Radial Gradients
- **Description**: Expand beyond solid hex colors to support modern vector gradients.
- **Behavior**:
  - Gradient editor with 2-3 color stops.
  - Adjustable gradient angle and radial center.
  - Preset designer gradients (e.g., sunset violet, deep ocean cyan, neon amber, warm gold).
- **Value**: Essential for contemporary digital branding (Stripe, Instagram, Figma).

### 3.2 Dual-Tone & Outline / Offset Stroke Modes
- **Description**: Generate an offset path (contour expansion/inset) or concentric stroke outline around built shapes.
- **Value**: Perfect for athletic emblems, sticker cuts, and multi-layered sports branding.

---

## 4. Presentation & Real-World Mockups

### 4.1 Live Brand Mockup Modal
- **Description**: A dedicated preview modal demonstrating how the mark performs in real-world brand contexts.
- **Templates**:
  - **Mobile App Icon**: Rendered inside an iOS squircle and Android circle with dynamic background contrast.
  - **Embroidered Apparel**: Rendered with subtle fabric texture on a cap or tote bag.
  - **Stationery**: Rendered on a minimalist business card or letterhead.
  - **Browser Tab**: Rendered at 16×16 and 32×32 favicon resolutions to test readability at micro scales.
- **Value**: Instantly validates whether a logo works across varied scales and mediums before client presentation.

---

## 5. File Management & Project State

### 5.1 JSON Project Save & Load
- **Description**: Export and import complete workspace state as `.logotype` or `.json` files.
- **Contents**: Preserves reference image, active scaffold, custom guides, built shapes, typography, colors, and artboard background.
- **Value**: Enables saving work-in-progress, versioning, and client template sharing.

### 5.2 SVG Vector Import as Construction Guides
- **Description**: Allow dragging and dropping an existing `.svg` file onto the canvas to convert its vector paths directly into construction guides.
- **Value**: Lets designers refine existing vector logos or CAD blueprints directly inside LogoBuilder.
