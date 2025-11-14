import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import type { Core } from 'cytoscape';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { WorkflowNodeHtmlComponent, NodeData } from '../workflow-node-html/workflow-node-html.component';
import { LifecycleGraphService, LifecycleGraphModel } from '../../services/lifecycle-graph.service';
// @ts-ignore
import * as nodeHtmlLabelModule from 'cytoscape-node-html-label';

// Handle both default and named exports
const nodeHtmlLabel = (nodeHtmlLabelModule as any).default || nodeHtmlLabelModule;

cytoscape.use(dagre);
if (typeof nodeHtmlLabel === 'function') {
  cytoscape.use(nodeHtmlLabel);
}

@Component({
  selector: 'lv-workflow-canvas',
  templateUrl: './workflow-canvas.component.html',
  styleUrls: ['./workflow-canvas.component.scss']
})
export class WorkflowCanvasComponent implements OnInit {
  private cy!: Core;
  private selectedNodeId: string | null = null;

  @Input() model?: LifecycleGraphModel;
  @Output() nodeSelected = new EventEmitter<any>();

  @ViewChild('cyContainer', { static: true })
  cyContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private nodeHtml: WorkflowNodeHtmlComponent,
    private graphService: LifecycleGraphService
  ) {}

  ngOnInit(): void {
    this.initializeGraph();
  }

  private initializeGraph(): void {
    this.cy = cytoscape({
      container: this.cyContainer.nativeElement,
      style: [
        {
          selector: 'node',
          style: {
            'background-opacity': 0,
            'background-color': 'transparent',
            'border-width': 0,
            'label': 'data(label)',
            'text-opacity': 0
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#9ca3af',
            'target-arrow-color': '#9ca3af',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
          selector: 'edge[isPossible = "true"]',
          style: {
            'width': 2,
            'line-color': '#d1d5db',
            'target-arrow-color': '#d1d5db',
            'target-arrow-shape': 'triangle',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3]
          }
        },
        {
          selector: 'edge[loopback = "true"]',
          style: {
            'width': 2,
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'unbundled-bezier',
            'control-point-distances': [40, -40, 40],
            'control-point-weights': [0.1, 0.5, 0.9]
          }
        }
      ],
      layout: {
        name: 'dagre',
        rankDir: 'LR',
        padding: 50,
        nodeSep: 80,
        rankSep: 120,
        avoidOverlap: true
      } as any
    });

    const model = this.model || this.graphService.getMockGraph();
    const elements = this.graphService.buildCytoscapeElements(model);

    this.cy.add(elements);

    this.cy.layout({ name: 'dagre', rankDir: 'LR', avoidOverlap: true } as any).run();

    this.initializeNodeHtmlLabels();
    this.setupInteractions();
  }

  private initializeNodeHtmlLabels(): void {
    // Call nodeHtmlLabel as a method on the cy instance after it's been registered
    (this.cy as any).nodeHtmlLabel([
      {
        query: 'node',
        tpl: (data: any) => {
          if (data.id === this.selectedNodeId) {
            return this.nodeHtml.getExpandedNodeHtml(data.raw);
          }
          return this.nodeHtml.getSmallNodeHtml(data.raw);
        }
      }
    ]);
  }

  private setupInteractions(): void {
    // Node click handler
    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const id = node.id();
      this.handleNodeClick(node, id);
    });

    // Background click resets selection
    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.resetSelection();
      }
    });
  }

  private handleNodeClick(node: any, id: string): void {
    // If clicking the same node, do nothing
    if (this.selectedNodeId === id) {
      return;
    }

    // Revert previous selection
    if (this.selectedNodeId) {
      const oldNode = this.cy.getElementById(this.selectedNodeId);
      if (oldNode) {
        oldNode.removeClass('lv-expanded-node');
      }
    }

    // Apply expanded state to clicked node
    this.selectedNodeId = id;
    node.addClass('lv-expanded-node');

    // Refresh node HTML labels
    this.initializeNodeHtmlLabels();

    // Zoom and center on node
    this.cy.animate({
      center: { eles: node },
      zoom: 1.25,
      duration: 350,
      easing: 'ease-out'
    } as any);

    // Emit node selected event
    this.nodeSelected.emit({
      id: id,
      data: node.data().raw
    });
  }

  private resetSelection(): void {
    if (!this.selectedNodeId) {
      return;
    }

    // Find and revert old node
    const oldNode = this.cy.getElementById(this.selectedNodeId);
    if (oldNode) {
      oldNode.removeClass('lv-expanded-node');
    }

    // Clear selection
    this.selectedNodeId = null;

    // Refresh node HTML labels
    this.initializeNodeHtmlLabels();

    // Zoom out
    this.cy.animate({
      zoom: 1.0,
      duration: 300,
      easing: 'ease-out'
    } as any);
  }
}
