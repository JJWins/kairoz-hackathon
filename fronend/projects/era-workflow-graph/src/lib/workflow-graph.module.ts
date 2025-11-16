import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ZoomIn, ZoomOut, Maximize2 } from 'lucide-angular';

// Components
import { EraWorkflowGraphComponent } from './era-workflow-graph.component';
import { WorkflowCanvasComponent } from './components/workflow-canvas/workflow-canvas.component';
import { ControlsComponent } from './components/controls/controls.component';
import { LegendComponent } from './components/legend/legend.component';

// Services
import { LifecycleGraphService } from './services/lifecycle-graph.service';
import { WorkflowNodeHtmlService } from './components/workflow-node-html/workflow-node-html.service';

@NgModule({
  declarations: [
    EraWorkflowGraphComponent,
    WorkflowCanvasComponent,
    ControlsComponent,
    LegendComponent
  ],
  imports: [
    CommonModule,
    LucideAngularModule.pick({ ZoomIn, ZoomOut, Maximize2 })
  ],
  exports: [
    EraWorkflowGraphComponent
  ],
  providers: [
    LifecycleGraphService,
    WorkflowNodeHtmlService
  ]
})
export class WorkflowGraphModule { }
