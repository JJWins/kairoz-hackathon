# WorkflowCanvas Component

A Cytoscape-based workflow visualization component that displays the lifecycle of records with interactive graph capabilities.

## Overview

This component uses Cytoscape.js with the Dagre layout algorithm and HTML node labels to create an interactive workflow graph matching the Figma design specifications.

## Features

- **Interactive Graph**: Pan, zoom, and click nodes to interact with the workflow
- **HTML Node Rendering**: Uses WorkflowNodeHtml component to render beautiful node cards
- **Dagre Layout**: Horizontal left-to-right layout with configurable spacing
- **Edge Types**: 
  - Solid blue edges for actual history
  - Dashed gray edges for possible transitions
- **Zoom Controls**: Zoom in, zoom out, and reset view
- **Node Selection**: Click nodes to zoom and center on them with smooth animation
- **Responsive**: Adapts to container size with dotted canvas background

## Usage

### Basic Usage

```typescript
import { WorkflowCanvas } from './components/workflow-canvas/workflow-canvas';

@Component({
  imports: [WorkflowCanvas],
  template: `
    <app-workflow-canvas [recordId]="'REC-2025-001847'"></app-workflow-canvas>
  `
})
export class MyComponent {}
```

### With Custom Record ID

```html
<app-workflow-canvas [recordId]="currentRecordId"></app-workflow-canvas>
```

## Input Properties

### `@Input() recordId: string`

The ID of the record to load lifecycle data for. Default: `'REC-2025-001847'`

```typescript
<app-workflow-canvas [recordId]="'REC-2025-001847'"></app-workflow-canvas>
```

## Public Methods

The component exposes three public methods that can be called programmatically:

### `zoomIn(): void`

Zooms in on the canvas by 20%.

```typescript
@ViewChild(WorkflowCanvas) canvas!: WorkflowCanvas;

zoomInGraph() {
  this.canvas.zoomIn();
}
```

### `zoomOut(): void`

Zooms out on the canvas by 20%.

```typescript
@ViewChild(WorkflowCanvas) canvas!: WorkflowCanvas;

zoomOutGraph() {
  this.canvas.zoomOut();
}
```

### `resetZoom(): void`

Resets the zoom to fit all nodes in view with 50px padding.

```typescript
@ViewChild(WorkflowCanvas) canvas!: WorkflowCanvas;

fitGraph() {
  this.canvas.resetZoom();
}
```

## Dependencies

### Required npm packages:

```json
{
  "cytoscape": "^3.33.1",
  "cytoscape-dagre": "^2.5.0",
  "cytoscape-node-html-label": "^1.2.2",
  "dagre": "^0.8.5"
}
```

### Component Dependencies:

- `Controls` component - Provides zoom controls UI
- `WorkflowNodeHtml` component - Generates HTML for node cards
- `Lifecycle` service - Fetches lifecycle data

## Cytoscape Configuration

### Layout Configuration

```typescript
layout: {
  name: 'dagre',
  rankDir: 'LR',      // Left to right
  nodeSep: 80,        // Horizontal spacing between nodes
  rankSep: 120,       // Vertical spacing between ranks
  animate: false
}
```

### Node Styling

Nodes are rendered using HTML labels (not Cytoscape's default rendering):

- Width: 220px
- Height: 110px
- Background: Transparent (HTML label provides styling)
- Shape: Rectangle

### Edge Styling

**Actual History Edges:**
- Color: #42A5F5 (blue)
- Width: 2px
- Style: Solid
- Arrow: Triangle
- Type: Bezier curve

**Possible Transition Edges:**
- Color: #CBD5E1 (gray)
- Width: 2px
- Style: Dashed [6, 4]
- Arrow: Triangle
- Type: Bezier curve

## Interactions

### Pan & Zoom

- **Pan**: Click and drag on the canvas background
- **Zoom**: Use mouse wheel or trackpad pinch
- **Zoom Range**: 0.3x to 2x

### Node Click

Clicking a node will:
1. Zoom to fit the node with 100px padding
2. Center the node in view
3. Animate the transition over 500ms with ease-in-out easing

### Control Buttons

Three control buttons in the top-right corner:

1. **Zoom In** (➕): Increases zoom by 20%
2. **Zoom Out** (➖): Decreases zoom by 20%
3. **Fit to View** (⛶): Resets zoom to show all nodes

## Data Structure

### LifecycleData Interface

```typescript
interface LifecycleData {
  nodes: NodeData[];
  edges: EdgeData[];
}
```

### NodeData Interface

```typescript
interface NodeData {
  id: string;           // Unique node identifier
  label: string;        // Display label
  actor: string;        // Person responsible
  date: string;         // Date string
  ribbonColor: string;  // Hex color for top ribbon
  state: string;        // Status name
}
```

### EdgeData Interface

```typescript
interface EdgeData {
  source: string;              // Source node ID
  target: string;              // Target node ID
  type: 'actual' | 'possible'; // Edge type
}
```

## Styling

### Canvas Container

- Height: 600px
- Border: 1px solid #e5e7eb
- Border radius: 12px
- Background: Dotted pattern (via `canvas-bg` class)

### Background Pattern

The canvas uses a dotted pattern background defined in `styles.scss`:

```scss
.canvas-bg {
  background-image: radial-gradient(#e6e9ef 1px, transparent 1px);
  background-size: 20px 20px;
  background-color: #F6F8FA;
}
```

## Lifecycle Service Integration

The component automatically loads data from the `Lifecycle` service when initialized:

```typescript
ngAfterViewInit() {
  this.lifecycleService.getLifecycleData(this.recordId).subscribe({
    next: (data) => this.initializeCytoscape(data)
  });
}
```

## Example: Full Integration

```typescript
import { Component } from '@angular/core';
import { WorkflowCanvas } from './components/workflow-canvas/workflow-canvas';

@Component({
  selector: 'app-record-view',
  imports: [WorkflowCanvas],
  template: `
    <div class="container">
      <h2>Record Lifecycle</h2>
      <app-workflow-canvas [recordId]="recordId"></app-workflow-canvas>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
  `]
})
export class RecordView {
  recordId = 'REC-2025-001847';
}
```

## Troubleshooting

### Graph not rendering

1. Ensure Cytoscape container has explicit dimensions
2. Check that all extensions are properly registered
3. Verify lifecycle service is returning data

### Nodes not displaying

1. Check WorkflowNodeHtml component is generating valid HTML
2. Verify node-html-label extension is loaded
3. Check browser console for errors

### Layout issues

1. Adjust `nodeSep` and `rankSep` values for spacing
2. Ensure container has sufficient width
3. Call `resetZoom()` after initialization

## Performance Notes

- The component automatically destroys the Cytoscape instance on component destruction
- Layout calculations are performed once on initialization (animate: false)
- Node HTML labels are cached by Cytoscape

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Pan/zoom gestures supported

## Design Specifications

Based on Figma design:

- **Canvas Height**: 600px
- **Node Spacing**: 80px horizontal, 120px vertical
- **Edge Color (Actual)**: #42A5F5
- **Edge Color (Possible)**: #CBD5E1
- **Border Radius**: 12px
- **Background**: Dotted pattern (#e6e9ef on #F6F8FA)
- **Animation Duration**: 300-500ms
- **Zoom Range**: 0.3x - 2.0x
