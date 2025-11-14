#!/bin/bash

# ERA Workflow Graph Library - Setup Script
# This script helps set up the library structure and copy/convert components

set -e

echo "🚀 Setting up @era/workflow-graph library..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LIB_ROOT="projects/era-workflow-graph/src/lib"
SRC_ROOT="src/app"

echo -e "${BLUE}Step 1: Installing ng-packagr${NC}"
pnpm add -D ng-packagr

echo -e "${BLUE}Step 2: Creating component directories${NC}"
mkdir -p "$LIB_ROOT/components/controls"
mkdir -p "$LIB_ROOT/components/legend"
mkdir -p "$LIB_ROOT/components/workflow-canvas"
mkdir -p "$LIB_ROOT/components/workflow-node-html"

echo -e "${GREEN}✓ Directory structure created${NC}"

echo -e "${BLUE}Step 3: Component conversion instructions${NC}"
echo -e "${YELLOW}"
cat << 'EOF'
Manual steps required to complete the library:

1. Convert Controls Component:
   - Copy src/app/components/controls/* to projects/era-workflow-graph/src/lib/components/controls/
   - Remove `standalone: true` and `imports` array
   - Remove @use "tailwindcss" from SCSS
   - Replace Tailwind classes with custom CSS
   - Change selector to 'era-controls'

2. Convert Legend Component:
   - Copy src/app/components/legend/* to projects/era-workflow-graph/src/lib/components/legend/
   - Remove `standalone: true` and `imports` array
   - Remove @use "tailwindcss" from SCSS
   - Replace Tailwind classes with custom CSS
   - Change selector to 'era-legend'

3. Convert WorkflowCanvas Component:
   - Copy src/app/components/workflow-canvas/* to projects/era-workflow-graph/src/lib/components/workflow-canvas/
   - Remove `standalone: true` and `imports` array
   - Remove @use "tailwindcss" from SCSS
   - Replace Tailwind classes with custom CSS
   - Change selector to 'era-workflow-canvas'
   - Update imports to use library models

4. Create WorkflowGraphModule:
   Create file: projects/era-workflow-graph/src/lib/workflow-graph.module.ts

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EraWorkflowGraphComponent } from './era-workflow-graph.component';
import { ControlsComponent } from './components/controls/controls.component';
import { LegendComponent } from './components/legend/legend.component';
import { WorkflowCanvasComponent } from './components/workflow-canvas/workflow-canvas.component';

@NgModule({
  declarations: [
    EraWorkflowGraphComponent,
    ControlsComponent,
    LegendComponent,
    WorkflowCanvasComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    EraWorkflowGraphComponent
  ]
})
export class WorkflowGraphModule { }
```

5. Create Main Wrapper Component:
   Create file: projects/era-workflow-graph/src/lib/era-workflow-graph.component.ts

```typescript
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { LifecycleGraphModel, WorkflowGraphConfig, NodeSelectEvent } from './models/lifecycle-graph.model';
import { LifecycleGraphService } from './services/lifecycle-graph.service';

@Component({
  selector: 'era-workflow-graph',
  template: `
    <div class="era-workflow-graph-container">
      <era-workflow-canvas
        [recordId]="recordId"
        [lifecycleGraph]="lifecycleGraph"
        [mock]="mock"
        [config]="config"
        (nodeSelected)="nodeSelected.emit($event)"
      ></era-workflow-canvas>
      
      <era-legend *ngIf="config?.showLegend !== false"></era-legend>
    </div>
  `,
  styles: [`
    .era-workflow-graph-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `]
})
export class EraWorkflowGraphComponent implements OnInit {
  @Input() recordId!: string;
  @Input() mock: boolean = false;
  @Input() lifecycleGraph?: LifecycleGraphModel;
  @Input() config: WorkflowGraphConfig = {};
  
  @Output() nodeSelected = new EventEmitter<NodeSelectEvent>();

  constructor(private lifecycleService: LifecycleGraphService) {}

  ngOnInit(): void {
    if (!this.recordId) {
      console.error('[@era/workflow-graph] recordId is required');
    }
  }
}
```

6. Update angular.json:
   Add the library project configuration (see IMPLEMENTATION_GUIDE.md)

7. Build the library:
   ```bash
   ng build era-workflow-graph
   ```

8. Test locally:
   ```bash
   cd dist/era-workflow-graph
   npm pack
   # Then install in another project:
   npm install /path/to/era-workflow-graph-1.0.0.tgz
   ```

EOF
echo -e "${NC}"

echo -e "${GREEN}✓ Setup script completed${NC}"
echo -e "${YELLOW}Please follow the manual steps above to complete the library setup${NC}"
