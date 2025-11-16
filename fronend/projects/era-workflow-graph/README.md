# @era/workflow-graph

> Angular 14+ compatible workflow visualization library with interactive node expansion, cycle detection, and customizable styling.

[![npm version](https://img.shields.io/npm/v/@era/workflow-graph.svg)](https://www.npmjs.com/package/@era/workflow-graph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **Angular 14+ Compatible** - NgModule-based architecture, no standalone components
- 🎨 **Interactive Visualization** - Click nodes to expand and view details
- 🔄 **Cycle Detection** - Handles looping workflows and repeated transitions
- 📊 **Dagre Layout** - Automatic graph layout with customizable spacing
- 🎭 **Smooth Animations** - Fluid zoom, pan, and expansion transitions
- 🎯 **TypeScript** - Fully typed API with comprehensive interfaces
- 🎨 **Customizable** - No Tailwind dependency, pure CSS styling
- 📦 **Zero Runtime Dependencies** - Only peer dependencies

## Installation

```bash
npm install @era/workflow-graph
# or
yarn add @era/workflow-graph
# or
pnpm add @era/workflow-graph
```

## Peer Dependencies

Ensure you have the following peer dependencies installed:

```bash
npm install cytoscape cytoscape-dagre cytoscape-node-html-label lucide-angular tippy.js @popperjs/core
```

**Required versions:**
- `@angular/core`: >=14.0.0
- `@angular/common`: >=14.0.0
- `cytoscape`: ^3.0.0
- `cytoscape-dagre`: ^2.0.0
- `cytoscape-node-html-label`: ^1.0.0
- `lucide-angular`: >=0.0.1
- `tippy.js`: *
- `@popperjs/core`: *
- `rxjs`: ^6.0.0 || ^7.0.0

## Quick Start (Angular 14)

### 1. Import the Module

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { WorkflowGraphModule } from '@era/workflow-graph';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    WorkflowGraphModule // Import the workflow graph module
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### 2. Use in Component Template

```html
<!-- app.component.html -->
<era-workflow-graph
  [recordId]="'REC-2025-001847'"
  [mock]="true"
  [config]="graphConfig"
  (nodeSelected)="onNodeSelected($event)"
></era-workflow-graph>
```

### 3. Handle Events in Component

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { NodeSelectEvent, WorkflowGraphConfig } from '@era/workflow-graph';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  graphConfig: WorkflowGraphConfig = {
    enableNodeExpansion: true,
    enableZoomControls: true,
    showLegend: true,
    initialZoom: 1.0,
    padding: 80,
    enableAnimations: true
  };

  onNodeSelected(event: NodeSelectEvent): void {
    console.log('Node selected:', event.nodeId, event.node);
    console.log('Is expanded:', event.expanded);
    
    // Handle node selection
    // e.g., show details panel, make API call, etc.
  }
}
```

## Advanced Usage

### Providing Custom Data

```typescript
import { Component, OnInit } from '@angular/core';
import { LifecycleGraphModel } from '@era/workflow-graph';

@Component({
  selector: 'app-workflow',
  template: `
    <era-workflow-graph
      [recordId]="recordId"
      [lifecycleGraph]="customData"
      [mock]="false"
      (nodeSelected)="onNodeSelected($event)"
    ></era-workflow-graph>
  `
})
export class WorkflowComponent implements OnInit {
  recordId = 'REC-2025-001847';
  customData?: LifecycleGraphModel;

  ngOnInit(): void {
    // Load data from your API
    this.loadWorkflowData();
  }

  loadWorkflowData(): void {
    // Example: fetch from your backend
    this.customData = {
      id: this.recordId,
      currentState: 'in-progress',
      nodes: [
        {
          id: 'draft',
          label: 'Draft',
          state: 'Draft',
          actor: 'John Doe',
          date: 'Jan 15, 2025',
          ribbonColor: '#B0BEC5'
        },
        // ... more nodes
      ],
      edges: [
        {
          source: 'draft',
          target: 'submitted',
          type: 'actual'
        },
        // ... more edges
      ],
      history: [],
      possibleTransitions: []
    };
  }

  onNodeSelected(event: NodeSelectEvent): void {
    // Handle selection
  }
}
```

### Custom Status Colors

```typescript
import { Component, OnInit } from '@angular/core';
import { WorkflowNodeHtmlService } from '@era/workflow-graph';

@Component({
  selector: 'app-custom-colors',
  template: `<era-workflow-graph [recordId]="'REC-123'" [mock]="true"></era-workflow-graph>`
})
export class CustomColorsComponent implements OnInit {
  constructor(private nodeHtmlService: WorkflowNodeHtmlService) {}

  ngOnInit(): void {
    // Set custom status colors
    this.nodeHtmlService.setStatusColors({
      'Draft': '#9E9E9E',
      'Submitted': '#2196F3',
      'Approved': '#4CAF50',
      'Rejected': '#F44336',
      // ... more custom colors
    });
  }
}
```

## API Reference

### Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `recordId` | `string` | Required | Unique identifier for the workflow record |
| `mock` | `boolean` | `false` | Enable mock data mode for testing |
| `lifecycleGraph` | `LifecycleGraphModel` | `undefined` | Custom graph data (overrides mock) |
| `config` | `WorkflowGraphConfig` | `{}` | Configuration options |

### Output Events

| Event | Type | Description |
|-------|------|-------------|
| `nodeSelected` | `NodeSelectEvent` | Emitted when a node is clicked/selected |

### Interfaces

#### LifecycleGraphModel
```typescript
interface LifecycleGraphModel {
  id: string;
  currentState: string;
  nodes: NodeData[];
  edges: EdgeData[];
  history: Transition[];
  possibleTransitions: Transition[];
}
```

#### NodeData
```typescript
interface NodeData {
  id: string;
  label: string;
  state: string;
  actor: string;
  date: string;
  ribbonColor?: string;
  isFuture?: boolean;
}
```

#### WorkflowGraphConfig
```typescript
interface WorkflowGraphConfig {
  enableNodeExpansion?: boolean;    // Default: true
  enableZoomControls?: boolean;     // Default: true
  showLegend?: boolean;              // Default: true
  initialZoom?: number;              // Default: 1.0
  padding?: number;                  // Default: 80
  enableAnimations?: boolean;        // Default: true
}
```

#### NodeSelectEvent
```typescript
interface NodeSelectEvent {
  nodeId: string;
  node: NodeData;
  expanded: boolean;
}
```

## Styling

The library uses CSS-only styling (no Tailwind). All classes are prefixed with `era-` to avoid conflicts.

### Global Styles

Add to your `styles.css` or `styles.scss`:

```css
/* Optional: Customize workflow graph appearance */
.era-workflow-node-card {
  /* Customize node cards */
}

.era-node-ribbon {
  /* Customize status ribbons */
}

.era-controls-btn {
  /* Customize zoom control buttons */
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+

## Troubleshooting

### Module Not Found

If you see errors about missing modules:
```bash
npm install --save cytoscape cytoscape-dagre cytoscape-node-html-label
```

### TypeScript Errors

Ensure your `tsconfig.json` includes:
```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Styling Not Applied

Import the library styles in your `angular.json`:
```json
{
  "styles": [
    "node_modules/@era/workflow-graph/styles.css",
    "src/styles.css"
  ]
}
```

## Examples

Check the `/examples` folder for complete Angular 14 examples:
- Basic workflow visualization
- Custom data integration
- Styled components
- Event handling
- Looping workflows

## License

MIT © ERA Team

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

- 📧 Email: support@era.com
- 🐛 Issues: [GitHub Issues](https://github.com/era/workflow-graph/issues)
- 📖 Docs: [Full Documentation](https://era.com/docs/workflow-graph)
