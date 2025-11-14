import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LifecycleGraphModel, LifecycleGraphService } from '../../services/lifecycle-graph.service';

@Component({
  selector: 'lifecycle-visualizer',
  templateUrl: './lifecycle-visualizer.component.html',
  styleUrls: ['./lifecycle-visualizer.component.scss']
})
export class LifecycleVisualizerComponent implements OnInit {
  @Input() lifecycleGraph?: LifecycleGraphModel;
  @Input() mock: boolean = false;
  @Input() recordId?: string;

  @Output() nodeSelected = new EventEmitter<any>();

  graph: LifecycleGraphModel | null = null;

  constructor(private graphService: LifecycleGraphService) {}

  ngOnInit(): void {
    if (this.mock) {
      this.graph = this.graphService.getMockGraph();
    } else if (this.lifecycleGraph) {
      this.graph = this.lifecycleGraph;
    } else {
      this.graph = null;
    }
  }

  handleNodeSelected(evt: any): void {
    this.nodeSelected.emit(evt);
  }
}
