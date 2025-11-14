# Legend Component

A horizontal status legend component displaying color swatches and labels for workflow states, matching the Figma design.

## Overview

This component displays a horizontal list of status items with color swatches, labels, and hex codes. It's designed to be placed at the bottom of the workflow visualization area with a white background and top border.

## Features

- **7 Status Items**: Draft, Submitted, Review, Approved, Rejected, Closed, In Progress
- **Color Swatches**: 14px × 14px rounded squares with status colors
- **Hex Codes**: Display color codes in parentheses
- **Responsive**: Wraps on smaller screens
- **Centered Layout**: Horizontally centered content
- **Clean Design**: White background with subtle top border

## Usage

### Basic Usage

```typescript
import { Legend } from './components/legend/legend';

@Component({
  imports: [Legend],
  template: `
    <app-legend></app-legend>
  `
})
export class MyComponent {}
```

### Typical Layout

```html
<div class="page-container">
  <!-- Main content -->
  <div class="content-area">
    <app-workflow-canvas></app-workflow-canvas>
  </div>
  
  <!-- Legend at bottom -->
  <app-legend></app-legend>
</div>
```

## Status Colors

The component includes all standard workflow status colors:

| Status | Color | Hex Code | Usage |
|--------|-------|----------|-------|
| Draft | Gray | #B0BEC5 | Initial draft state |
| Submitted | Blue | #42A5F5 | Submitted for review |
| Review | Purple | #AB47BC | Under review |
| Approved | Green | #66BB6A | Approved/accepted |
| Rejected | Red | #EF5350 | Rejected/declined |
| Closed | Dark Gray | #78909C | Closed/archived |
| In Progress | Amber | #FFB300 | Currently in progress |

## Data Structure

### StatusItem Interface

```typescript
interface StatusItem {
  label: string;  // Display label (e.g., "Draft")
  color: string;  // Hex color code (e.g., "#B0BEC5")
  code: string;   // Code to display (e.g., "#B0BEC5")
}
```

## Styling

### Container

- **Background**: White (#FFFFFF)
- **Border**: Top border, 1px, gray-200 (#E5E7EB)
- **Padding**: 16px vertical, 24px horizontal
- **Min Height**: 60px
- **Layout**: Flexbox, centered, wrapped

### Legend Label

- **Text**: "Status Legend:"
- **Font Size**: 14px (text-sm)
- **Font Weight**: 500 (medium)
- **Color**: Gray-700 (#374151)
- **Spacing**: 24px gap after label

### Color Swatch

- **Size**: 14px × 14px
- **Shape**: Rounded square (2px border-radius)
- **Background**: Dynamic based on status color
- **Display**: Inline-block, flex-shrink: 0

### Status Label

- **Font Size**: 14px (text-sm)
- **Font Weight**: 400 (regular)
- **Color**: Gray-700 (#374151)

### Status Code

- **Font Size**: 12px (text-xs)
- **Font Weight**: 400 (regular)
- **Color**: Gray-500 (#6B7280)
- **Format**: Wrapped in parentheses

## Layout Specifications

### Spacing

- **Container Gap**: 24px between label and items
- **Items Gap**: 16px between status items
- **Item Internal Gap**: 8px between swatch, label, and code

### Alignment

- **Horizontal**: Center-aligned
- **Vertical**: Items aligned center
- **Wrap**: Items wrap on smaller screens

## Customization

### Adding Custom Status

To add a custom status item, modify the component:

```typescript
export class Legend {
  statusItems: StatusItem[] = [
    // ... existing items
    { label: 'On Hold', color: '#FFA726', code: '#FFA726' }
  ];
}
```

### Changing Colors

Update the color hex codes in the component:

```typescript
{ label: 'Draft', color: '#9E9E9E', code: '#9E9E9E' }
```

### Custom Styling

Override styles using CSS:

```scss
app-legend {
  ::ng-deep .legend-container {
    background-color: #f9fafb;
    border-top: 2px solid #e5e7eb;
  }
  
  ::ng-deep .color-swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
}
```

## Responsive Behavior

The legend automatically adapts to different screen sizes:

- **Large screens**: All items in a single row
- **Medium screens**: Items wrap to multiple rows
- **Small screens**: Vertical stacking with wrapping

## Accessibility

### Semantic HTML

- Uses semantic div structure
- Proper color contrast for text

### Screen Readers

While the component is primarily visual, consider adding:

```html
<div class="legend-item" role="listitem">
  <span 
    class="color-swatch" 
    [style.background-color]="item.color"
    [attr.aria-label]="item.label + ' status color'"
  ></span>
  <span class="status-label">{{ item.label }}</span>
  <span class="status-code">({{ item.code }})</span>
</div>
```

## Example: Complete Integration

```typescript
import { Component } from '@angular/core';
import { WorkflowCanvas } from './components/workflow-canvas/workflow-canvas';
import { Legend } from './components/legend/legend';

@Component({
  selector: 'app-workflow-view',
  standalone: true,
  imports: [WorkflowCanvas, Legend],
  template: `
    <div class="workflow-view">
      <!-- Top Bar -->
      <app-top-bar></app-top-bar>
      
      <!-- Sidebar -->
      <div class="layout">
        <app-sidebar></app-sidebar>
        
        <!-- Main Area -->
        <div class="main-content">
          <!-- Canvas -->
          <app-workflow-canvas></app-workflow-canvas>
          
          <!-- Legend at bottom -->
          <app-legend></app-legend>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workflow-view {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class WorkflowView {}
```

## Design Specifications

Based on Figma design:

- **Container Height**: Min 60px
- **Background**: White (#FFFFFF)
- **Border**: Top 1px solid #E5E7EB
- **Padding**: 16px vertical, 24px horizontal
- **Label Font**: 14px / 500 weight / #374151
- **Status Font**: 14px / 400 weight / #374151
- **Code Font**: 12px / 400 weight / #6B7280
- **Swatch Size**: 14px × 14px
- **Swatch Radius**: 2px
- **Item Gap**: 16px
- **Internal Gap**: 8px

## Browser Support

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile: Responsive wrapping

## Performance

- **Lightweight**: No complex computations
- **Static Data**: Status items are static
- **No External Dependencies**: Only uses Angular Common

## Testing

### Unit Test Example

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Legend } from './legend';

describe('Legend', () => {
  let component: Legend;
  let fixture: ComponentFixture<Legend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Legend]
    }).compileComponents();

    fixture = TestBed.createComponent(Legend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 7 status items', () => {
    expect(component.statusItems.length).toBe(7);
  });

  it('should have correct status colors', () => {
    const draft = component.statusItems.find(s => s.label === 'Draft');
    expect(draft?.color).toBe('#B0BEC5');
    
    const approved = component.statusItems.find(s => s.label === 'Approved');
    expect(approved?.color).toBe('#66BB6A');
  });

  it('should render all status items', () => {
    const compiled = fixture.nativeElement;
    const items = compiled.querySelectorAll('.legend-item');
    expect(items.length).toBe(7);
  });

  it('should display color swatches', () => {
    const compiled = fixture.nativeElement;
    const swatches = compiled.querySelectorAll('.color-swatch');
    expect(swatches.length).toBe(7);
  });
});
```

## Common Use Cases

### 1. Bottom of Workflow Canvas

```html
<div class="workflow-container">
  <app-workflow-canvas></app-workflow-canvas>
  <app-legend></app-legend>
</div>
```

### 2. In a Card

```html
<div class="card">
  <div class="card-header">Workflow Legend</div>
  <app-legend></app-legend>
</div>
```

### 3. Floating Panel

```html
<div class="floating-legend">
  <app-legend></app-legend>
</div>
```

### 4. Side Panel

```html
<div class="sidebar">
  <h3>Status Reference</h3>
  <app-legend></app-legend>
</div>
```

## Best Practices

1. **Placement**: Always place at bottom of workflow visualizations
2. **Visibility**: Ensure legend is always visible when status colors are used
3. **Consistency**: Use same colors throughout the application
4. **Accessibility**: Ensure sufficient color contrast
5. **Mobile**: Test wrapping behavior on small screens

## Related Components

- **WorkflowCanvas**: Uses these colors for node ribbons
- **WorkflowNodeHtml**: Renders nodes with these colors
- **Lifecycle Service**: Provides status data with these colors

## Color Consistency

To ensure color consistency across components, consider creating a shared constant:

```typescript
// shared/constants/status-colors.ts
export const STATUS_COLORS = {
  Draft: '#B0BEC5',
  Submitted: '#42A5F5',
  Review: '#AB47BC',
  Approved: '#66BB6A',
  Rejected: '#EF5350',
  Closed: '#78909C',
  'In Progress': '#FFB300'
} as const;
```

Then import in both Legend and other components:

```typescript
import { STATUS_COLORS } from '../../shared/constants/status-colors';

export class Legend {
  statusItems: StatusItem[] = Object.entries(STATUS_COLORS).map(
    ([label, color]) => ({ label, color, code: color })
  );
}
```
