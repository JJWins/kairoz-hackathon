import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifecycleVisualizerComponent } from './components/lifecycle-visualizer/lifecycle-visualizer.component';
import { WorkflowCanvasComponent } from './components/workflow-canvas/workflow-canvas.component';
import { WorkflowNodeHtmlComponent } from './components/workflow-node-html/workflow-node-html.component';
import { ControlsComponent } from './components/controls/controls.component';
import { LegendComponent } from './components/legend/legend.component';
import { LifecycleGraphService } from './services/lifecycle-graph.service';

@NgModule({
  declarations: [
    LifecycleVisualizerComponent,
    WorkflowCanvasComponent,
    WorkflowNodeHtmlComponent,
    ControlsComponent,
    LegendComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [
    LifecycleGraphService,
    WorkflowNodeHtmlComponent
  ],
  exports: [
    LifecycleVisualizerComponent
  ]
})
export class LifecycleVisualizerModule { }
