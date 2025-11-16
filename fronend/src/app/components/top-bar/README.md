# TopBar Component

Angular component for the Record Lifecycle Visualization application top bar, matching the Figma design.

## Features

- **Left Section**: Circular logo icon with app title "Record Lifecycle Visualization"
- **Center Section**: Record ID, title, and status badge with amber (#FFB300) color
- **Right Section**: Search input, filter button, and refresh button with Lucide icons

## Usage

### Import the component

```typescript
import { TopBar } from './components/top-bar/top-bar';

@Component({
  // ...
  imports: [TopBar],
})
export class App {}
```

### Add to template

```html
<app-top-bar></app-top-bar>
```

## Component Properties

The component exposes these data properties that can be customized:

```typescript
recordId = 'REC-2025-001847';
recordTitle = 'Machine Learning for Cancer Detection Research Proposal';
status = 'In Progress';
statusColor = '#FFB300'; // Amber color
```

## Event Handlers

The component includes placeholder event handlers:

- `onSearch(event)` - Triggered when typing in search input
- `onFilter()` - Triggered when clicking filter button
- `onRefresh()` - Triggered when clicking refresh button

These can be extended with actual functionality as needed.

## Styling

Uses Tailwind CSS classes with minimal SCSS overrides. The component is fully responsive and matches the Figma design specifications.

## Dependencies

- `lucide-angular` - For icons (Search, Filter, RefreshCw)
- Tailwind CSS - For utility classes
