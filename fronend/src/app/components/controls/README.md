# Controls Component

A reusable control panel component with three icon buttons for zoom controls, designed to match the Figma UI specifications.

## Overview

This component provides a vertical stack of three round icon buttons for controlling zoom and view operations. It's designed to be positioned in the top-right corner of a canvas or visualization area.

## Features

- **Three Icon Buttons**: Zoom In, Zoom Out, Fit to View
- **Round Design**: Circular white buttons with subtle shadows
- **Lucide Icons**: Using ZoomIn, ZoomOut, and Maximize2 icons
- **Event Emitters**: Each button emits a specific event
- **Hover Effects**: Smooth transitions with enhanced shadows
- **Accessible**: Proper aria-labels and keyboard focus states

## Usage

### Basic Usage

```typescript
import { Controls } from './components/controls/controls';

@Component({
  imports: [Controls],
  template: `
    <app-controls
      (zoomIn)="handleZoomIn()"
      (zoomOut)="handleZoomOut()"
      (fit)="handleFit()"
    ></app-controls>
  `
})
export class MyComponent {
  handleZoomIn() {
    console.log('Zoom in clicked');
  }
  
  handleZoomOut() {
    console.log('Zoom out clicked');
  }
  
  handleFit() {
    console.log('Fit to view clicked');
  }
}
```

### Positioned in Corner

```html
<div class="relative">
  <!-- Your canvas or content -->
  <div class="canvas-area">
    <!-- Content here -->
  </div>
  
  <!-- Controls in top-right -->
  <div class="absolute top-4 right-4">
    <app-controls
      (zoomIn)="zoomIn()"
      (zoomOut)="zoomOut()"
      (fit)="resetView()"
    ></app-controls>
  </div>
</div>
```

## Output Events

### `@Output() zoomIn: EventEmitter<void>`

Emitted when the zoom in button (➕) is clicked.

```typescript
<app-controls (zoomIn)="onZoomIn()"></app-controls>
```

### `@Output() zoomOut: EventEmitter<void>`

Emitted when the zoom out button (➖) is clicked.

```typescript
<app-controls (zoomOut)="onZoomOut()"></app-controls>
```

### `@Output() fit: EventEmitter<void>`

Emitted when the fit to view button (⛶) is clicked.

```typescript
<app-controls (fit)="onFit()"></app-controls>
```

## Styling

### Button Specifications

- **Size**: 40px × 40px (w-10 h-10)
- **Shape**: Perfect circle (rounded-full)
- **Background**: White
- **Text Color**: Gray-700 (hover: Gray-900)
- **Shadow**: Multi-layer subtle shadow
- **Gap**: 8px between buttons (gap-2)

### Shadow Hierarchy

**Default State:**
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 
            0 1px 3px rgba(0, 0, 0, 0.06);
```

**Hover State:**
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 
            0 2px 6px rgba(0, 0, 0, 0.08);
```

**Active State:**
```css
box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
```

**Focus State:**
```css
ring: 2px solid #3B82F6 (blue-500)
ring-offset: 2px
```

## Icons

Uses Lucide Angular icons:

- **ZoomIn**: Magnifying glass with plus sign
- **ZoomOut**: Magnifying glass with minus sign
- **Maximize2**: Expand/maximize icon

Icon size: 20px

## Accessibility

### ARIA Labels

Each button includes proper aria-label attributes:

- Zoom In button: `aria-label="Zoom In"`
- Zoom Out button: `aria-label="Zoom Out"`
- Fit button: `aria-label="Fit to View"`

### Titles

Tooltips are provided via title attributes:

- "Zoom In"
- "Zoom Out"
- "Fit to View"

### Keyboard Support

- ✅ Focusable with Tab key
- ✅ Activatable with Enter/Space
- ✅ Visible focus ring (blue ring)

## Example: Integration with Cytoscape

```typescript
import { Component, ViewChild } from '@angular/core';
import { Controls } from './components/controls/controls';
import cytoscape, { Core } from 'cytoscape';

@Component({
  selector: 'app-graph-view',
  imports: [Controls],
  template: `
    <div class="relative">
      <div #cyContainer class="w-full h-[600px]"></div>
      <div class="absolute top-4 right-4">
        <app-controls
          (zoomIn)="zoomIn()"
          (zoomOut)="zoomOut()"
          (fit)="fit()"
        ></app-controls>
      </div>
    </div>
  `
})
export class GraphView {
  private cy?: Core;
  
  zoomIn() {
    if (!this.cy) return;
    const zoom = this.cy.zoom();
    this.cy.zoom(zoom * 1.2);
  }
  
  zoomOut() {
    if (!this.cy) return;
    const zoom = this.cy.zoom();
    this.cy.zoom(zoom / 1.2);
  }
  
  fit() {
    if (!this.cy) return;
    this.cy.fit();
  }
}
```

## Customization

### Custom Styling

You can override the default styles using CSS:

```scss
app-controls {
  ::ng-deep .control-btn {
    width: 48px;
    height: 48px;
    background-color: #f3f4f6;
  }
}
```

### Custom Icons

To use different icons, modify the component:

```typescript
import { Plus, Minus, Maximize } from 'lucide-angular';

export class Controls {
  readonly ZoomIn = Plus;      // Different icon
  readonly ZoomOut = Minus;    // Different icon
  readonly Maximize2 = Maximize;
}
```

## Layout

The controls are arranged vertically with flexbox:

```scss
.controls-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem; // 8px
}
```

## Dependencies

- **Lucide Angular**: ^0.553.0
- **Tailwind CSS**: For utility classes

## Browser Support

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile: Touch-friendly 40px buttons

## Design Specifications

Based on Figma design:

- **Button Size**: 40px diameter
- **Button Shape**: Perfect circle
- **Button Color**: White (#FFFFFF)
- **Icon Color**: Gray-700 (#374151)
- **Icon Size**: 20px
- **Button Gap**: 8px vertical spacing
- **Shadow**: Layered subtle shadows
- **Hover**: Enhanced shadow + darker icon
- **Active**: Reduced shadow (pressed effect)
- **Focus**: Blue ring with offset

## Best Practices

1. **Positioning**: Always use absolute/fixed positioning to overlay on content
2. **Z-Index**: Ensure controls are above canvas content
3. **Pointer Events**: Set `pointer-events: auto` on controls if canvas captures events
4. **Spacing**: Maintain 16px margin from edges (top-4 right-4)

## Complete Example

```typescript
import { Component } from '@angular/core';
import { Controls } from './components/controls/controls';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [Controls],
  template: `
    <div class="viewer-container relative h-screen">
      <!-- Main content area -->
      <div class="content-area">
        <canvas #canvas></canvas>
      </div>
      
      <!-- Controls overlay -->
      <div class="absolute top-4 right-4 z-10">
        <app-controls
          (zoomIn)="handleZoomIn()"
          (zoomOut)="handleZoomOut()"
          (fit)="handleFit()"
        ></app-controls>
      </div>
    </div>
  `,
  styles: [`
    .content-area {
      width: 100%;
      height: 100%;
    }
  `]
})
export class ViewerComponent {
  private zoomLevel = 1;
  
  handleZoomIn(): void {
    this.zoomLevel *= 1.2;
    this.applyZoom();
  }
  
  handleZoomOut(): void {
    this.zoomLevel /= 1.2;
    this.applyZoom();
  }
  
  handleFit(): void {
    this.zoomLevel = 1;
    this.applyZoom();
  }
  
  private applyZoom(): void {
    console.log('Applying zoom:', this.zoomLevel);
    // Apply zoom transformation to your content
  }
}
```

## Testing

### Unit Test Example

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Controls } from './controls';

describe('Controls', () => {
  let component: Controls;
  let fixture: ComponentFixture<Controls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Controls]
    }).compileComponents();

    fixture = TestBed.createComponent(Controls);
    component = fixture.componentInstance;
  });

  it('should emit zoomIn event', () => {
    spyOn(component.zoomIn, 'emit');
    component.onZoomIn();
    expect(component.zoomIn.emit).toHaveBeenCalled();
  });

  it('should emit zoomOut event', () => {
    spyOn(component.zoomOut, 'emit');
    component.onZoomOut();
    expect(component.zoomOut.emit).toHaveBeenCalled();
  });

  it('should emit fit event', () => {
    spyOn(component.fit, 'emit');
    component.onFit();
    expect(component.fit.emit).toHaveBeenCalled();
  });
});
```
