# WorkflowNodeHtml Component

A utility component that generates HTML strings for workflow node cards matching the Figma design specifications.

## Overview

This component provides a `getNodeHtml(data)` method that returns formatted HTML strings for workflow node cards. These cards feature:

- White rounded rectangle (220px × 110px)
- Subtle shadow with hover effect
- Top colored ribbon (8px height)
- Bold state label (16px, 700 weight)
- Actor name in gray text (13px, 400 weight)
- Date in muted gray text (11px, 400 weight)

## Usage

### Basic Usage

```typescript
import { WorkflowNodeHtml, NodeData } from './components/workflow-node-html/workflow-node-html';

// Inject or create instance
constructor(private nodeHtmlGenerator: WorkflowNodeHtml) {}

// Generate HTML for a single node
const nodeData: NodeData = {
  id: 'node-1',
  state: 'Draft',
  actor: 'Dr. Sarah Chen',
  date: 'Jan 15, 2025'
};

const htmlString = this.nodeHtmlGenerator.getNodeHtml(nodeData);
```

### With Cytoscape.js

This component is designed to work with Cytoscape.js and the node-html-label extension:

```typescript
import cytoscape from 'cytoscape';
import nodeHtmlLabel from 'cytoscape-node-html-label';

cytoscape.use(nodeHtmlLabel);

const cy = cytoscape({
  container: document.getElementById('cy'),
  // ... other config
});

// Apply HTML labels to nodes
cy.nodeHtmlLabel([
  {
    query: 'node',
    tpl: (data: any) => {
      return this.nodeHtmlGenerator.getNodeHtml({
        id: data.id,
        state: data.state,
        actor: data.actor,
        date: data.date
      });
    }
  }
]);
```

### Multiple Nodes

```typescript
const nodes: NodeData[] = [
  { id: 'node-1', state: 'Draft', actor: 'Dr. Sarah Chen', date: 'Jan 15, 2025' },
  { id: 'node-2', state: 'Submitted', actor: 'Dr. Sarah Chen', date: 'Jan 18, 2025' },
  { id: 'node-3', state: 'Review', actor: 'Prof. Michael Brown', date: 'Jan 19, 2025' },
];

const allNodesHtml = this.nodeHtmlGenerator.getNodesHtml(nodes);
```

## NodeData Interface

```typescript
interface NodeData {
  id: string;          // Unique node identifier
  state: string;       // Status label (Draft, Submitted, Review, etc.)
  actor: string;       // Person responsible for the node
  date: string;        // Date string (e.g., "Jan 15, 2025")
  color?: string;      // Optional: Override default status color
}
```

## Status Colors

The component includes predefined colors for common statuses:

| Status | Color | Hex |
|--------|-------|-----|
| Draft | Gray | #B0BEC5 |
| Submitted | Blue | #42A5F5 |
| Review | Purple | #AB47BC |
| In Progress | Amber | #FFB300 |
| Approved | Green | #66BB6A |
| Rejected | Red | #EF5350 |
| Closed | Dark Gray | #78909C |

### Custom Colors

You can override the default color for any node:

```typescript
const nodeData: NodeData = {
  id: 'node-1',
  state: 'Custom State',
  actor: 'John Doe',
  date: 'Nov 13, 2025',
  color: '#FF6B6B' // Custom color
};
```

## API Methods

### `getNodeHtml(data: NodeData): string`

Generates HTML string for a single workflow node card.

**Parameters:**
- `data`: NodeData object containing node information

**Returns:** HTML string

### `getStatusColor(status: string): string`

Gets the color hex code for a specific status.

**Parameters:**
- `status`: Status name (e.g., "Draft", "Submitted")

**Returns:** Hex color string (e.g., "#B0BEC5")

### `getNodesHtml(nodes: NodeData[]): string`

Generates HTML for multiple nodes at once.

**Parameters:**
- `nodes`: Array of NodeData objects

**Returns:** Concatenated HTML string of all nodes

## Styling

The component includes global styles in `src/styles.scss` that apply to all generated node cards. The styles include:

- Card dimensions: 220px × 110px
- Border radius: 12px
- Shadow: Multi-layer subtle shadow
- Hover effect: Slight lift with enhanced shadow
- Responsive padding and spacing

## Example Output

The generated HTML structure:

```html
<div class="workflow-node-card" data-node-id="node-1">
  <div class="node-ribbon" style="background-color: #B0BEC5;"></div>
  <div class="node-content">
    <div class="node-state">Draft</div>
    <div class="node-actor">Dr. Sarah Chen</div>
    <div class="node-date">Jan 15, 2025</div>
  </div>
</div>
```

## Design Specifications

Based on the Figma design:

- **Card Width:** 220px
- **Card Height:** 110px
- **Ribbon Height:** 8px
- **Content Padding:** 16px
- **Border Radius:** 12px
- **State Font:** 16px / Bold (700)
- **Actor Font:** 13px / Regular (400) / Gray (#666)
- **Date Font:** 11px / Regular (400) / Muted Gray (#999)
- **Shadow:** `0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)`
- **Hover Shadow:** `0 4px 12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)`

## Integration with Workflow Canvas

This component is designed to work with the `WorkflowCanvas` component for visualizing research record lifecycle states.

```typescript
// In WorkflowCanvas component
import { WorkflowNodeHtml } from '../workflow-node-html/workflow-node-html';

@Component({
  // ...
  providers: [WorkflowNodeHtml]
})
export class WorkflowCanvas {
  constructor(private nodeHtml: WorkflowNodeHtml) {}
  
  initializeGraph() {
    // Use nodeHtml.getNodeHtml() to generate node labels
  }
}
```
