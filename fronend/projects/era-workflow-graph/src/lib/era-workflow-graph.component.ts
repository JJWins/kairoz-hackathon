import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { LifecycleGraphModel, NodeSelectEvent, WorkflowGraphConfig } from './models/lifecycle-graph.model';

@Component({
  selector: 'era-workflow-graph',
  templateUrl: './era-workflow-graph.component.html',
  styleUrls: ['./era-workflow-graph.component.css']
})
export class EraWorkflowGraphComponent implements OnInit {
  @Input() recordId: string = '';
  @Input() lifecycleGraph?: LifecycleGraphModel;
  @Input() mock: boolean = false;
  @Input() config: WorkflowGraphConfig = {
    enableNodeExpansion: true,
    enableZoomControls: true,
    showLegend: true,
    initialZoom: 1.0,
    padding: 80,
    enableAnimations: true
  };
  
  @Output() nodeSelected = new EventEmitter<NodeSelectEvent>();

  ngOnInit(): void {
    if (!this.recordId && !this.lifecycleGraph) {
      console.warn('[@era/workflow-graph] Either recordId or lifecycleGraph must be provided');
    }
    
    // Merge default config with provided config
    this.config = {
      enableNodeExpansion: true,
      enableZoomControls: true,
      showLegend: true,
      initialZoom: 1.0,
      padding: 80,
      enableAnimations: true,
      ...this.config
    };
  }

  onNodeSelected(event: NodeSelectEvent): void {
    this.nodeSelected.emit(event);
  }
}
