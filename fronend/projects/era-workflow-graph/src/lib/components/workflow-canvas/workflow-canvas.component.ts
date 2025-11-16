import { 
  Component, 
  AfterViewInit, 
  OnDestroy, 
  Input, 
  Output,
  EventEmitter,
  ViewChild, 
  ElementRef 
} from '@angular/core';
import { LifecycleGraphModel, NodeData, NodeSelectEvent } from '../../models/lifecycle-graph.model';
import { LifecycleGraphService } from '../../services/lifecycle-graph.service';
import { WorkflowNodeHtmlService } from '../workflow-node-html/workflow-node-html.service';
import cytoscape, { Core, NodeSingular } from 'cytoscape';
// @ts-ignore - cytoscape-dagre doesn't have complete types
import dagre from 'cytoscape-dagre';
// @ts-ignore - cytoscape-node-html-label doesn't have types
import nodeHtmlLabel from 'cytoscape-node-html-label';

// Register Cytoscape extensions
cytoscape.use(dagre);
// @ts-ignore
cytoscape.use(nodeHtmlLabel);

@Component({
  selector: 'era-workflow-canvas',
  templateUrl: './workflow-canvas.component.html',
  styleUrls: ['./workflow-canvas.component.css']
})
export class WorkflowCanvasComponent implements AfterViewInit, OnDestroy {
  @Input() recordId: string = 'REC-2025-001847';
  @Input() lifecycleGraph?: LifecycleGraphModel;
  @Input() mock: boolean = false;
  
  @Output() nodeSelected = new EventEmitter<NodeSelectEvent>();
  
  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef<HTMLDivElement>;

  private cy?: Core;
  private selectedNodeId: string | null = null;
  private lifecycleData?: LifecycleGraphModel;

  constructor(
    private lifecycleService: LifecycleGraphService,
    private nodeHtmlService: WorkflowNodeHtmlService
  ) {}

  ngAfterViewInit(): void {
    this.loadLifecycleData();
  }

  ngOnDestroy(): void {
    if (this.cy) {
      this.cy.destroy();
    }
  }

  private loadLifecycleData(): void {
    // Use provided data or fetch from service
    if (this.lifecycleGraph) {
      this.lifecycleData = this.lifecycleGraph;
      this.initializeCytoscape(this.lifecycleGraph);
    } else {
      this.lifecycleService.getLifecycleData(this.recordId, this.mock).subscribe({
        next: (data: LifecycleGraphModel) => {
          this.lifecycleData = data;
          this.initializeCytoscape(data);
        },
        error: (error) => {
          console.error('Failed to load lifecycle data:', error);
        }
      });
    }
  }

  private initializeCytoscape(data: LifecycleGraphModel): void {
    if (!this.cyContainer) {
      console.error('Cytoscape container not found');
      return;
    }

    // Prepare nodes for Cytoscape
    const cytoscapeNodes = data.nodes.map(node => ({
      data: {
        id: node.id,
        label: node.label,
        state: node.state,
        actor: node.actor,
        date: node.date,
        ribbonColor: node.ribbonColor
      }
    }));

    // Prepare edges for Cytoscape
    const cytoscapeEdges = data.edges.map(edge => ({
      data: {
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        edgeType: edge.type
      }
    }));

    // Initialize Cytoscape
    this.cy = cytoscape({
      container: this.cyContainer.nativeElement,
      elements: {
        nodes: cytoscapeNodes,
        edges: cytoscapeEdges
      },
      style: [
        // Node styles - hide default node rendering since we use HTML labels
        {
          selector: 'node',
          style: {
            'width': '220px',
            'height': '110px',
            'shape': 'rectangle',
            'background-opacity': 0,
            'border-width': 0,
          }
        },
        // Actual history edges - solid blue with arrow
        {
          selector: 'edge[edgeType="actual"]',
          style: {
            'width': 2,
            'line-color': '#42A5F5',
            'target-arrow-color': '#42A5F5',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2
          }
        },
        // Possible transition edges - dashed gray with arrow
        {
          selector: 'edge[edgeType="possible"]',
          style: {
            'width': 2,
            'line-color': '#CBD5E1',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'target-arrow-color': '#CBD5E1',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2
          }
        }
      ],
      layout: {
        name: 'dagre',
        // @ts-ignore - rankDir is valid for dagre layout
        rankDir: 'LR', // Left to right horizontal layout
        nodeSep: 80,
        rankSep: 120,
        animate: false
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      minZoom: 0.3,
      maxZoom: 2
    });

    // Apply HTML labels to nodes
    // @ts-ignore
    this.cy.nodeHtmlLabel([
      {
        query: 'node',
        tpl: (data: any) => {
          const isExpanded = this.selectedNodeId === data.id;
          return this.nodeHtmlService.getNodeHtml({
            id: data.id,
            label: data.label,
            state: data.state,
            actor: data.actor,
            date: data.date,
            ribbonColor: data.ribbonColor
          }, isExpanded);
        }
      }
    ]);

    // Add click handler for nodes
    this.cy.on('tap', 'node', (event) => {
      const node = event.target as NodeSingular;
      this.expandNode(node);
    });

    // Add click handler for background to collapse nodes
    this.cy.on('tap', (event) => {
      // If clicking on background (not a node or edge)
      if (event.target === this.cy) {
        this.collapseNode();
      }
    });

    // Center and fit the graph initially with vertical centering
    setTimeout(() => {
      if (this.cy) {
        this.cy.fit(undefined, 80); // Fit with padding
        this.cy.center(); // Center the graph in viewport
      }
    }, 100);
  }

  /**
   * Zoom in on the canvas
   */
  zoomIn(): void {
    if (!this.cy) return;
    
    const currentZoom = this.cy.zoom();
    const newZoom = currentZoom * 1.2;
    
    this.cy.animate({
      zoom: Math.min(newZoom, this.cy.maxZoom()),
      duration: 300,
      easing: 'ease-out'
    });
  }

  /**
   * Zoom out on the canvas
   */
  zoomOut(): void {
    if (!this.cy) return;
    
    const currentZoom = this.cy.zoom();
    const newZoom = currentZoom / 1.2;
    
    this.cy.animate({
      zoom: Math.max(newZoom, this.cy.minZoom()),
      duration: 300,
      easing: 'ease-out'
    });
  }

  /**
   * Reset zoom to fit all nodes
   */
  resetZoom(): void {
    if (!this.cy) return;
    
    this.cy.fit(undefined, 80); // Fit with 80px padding
    this.cy.center(); // Center the graph
    this.cy.animate({
      zoom: this.cy.zoom(),
      pan: this.cy.pan(),
      duration: 300,
      easing: 'ease-out'
    });
  }

  /**
   * Expand a node to show more details
   */
  private expandNode(node: NodeSingular): void {
    if (!this.cy) return;

    const nodeId = node.id();
    
    // If clicking the same node, toggle collapse
    if (this.selectedNodeId === nodeId) {
      this.collapseNode();
      return;
    }

    // Collapse previously selected node if any
    if (this.selectedNodeId) {
      this.collapseNode();
    }

    // Set new selected node
    this.selectedNodeId = nodeId;

    // Refresh node HTML to show expanded version
    this.refreshNodeHtml(nodeId);

    // Animate to center and slightly zoom to the node
    this.cy.animate({
      center: {
        eles: node
      },
      zoom: 1.2, // Subtle zoom level
      duration: 400,
      easing: 'ease-out'
    });

    // Emit node selected event
    if (this.lifecycleData) {
      const nodeData = this.lifecycleData.nodes.find(n => n.id === nodeId);
      if (nodeData) {
        this.nodeSelected.emit({
          nodeId,
          node: nodeData,
          expanded: true
        });
      }
    }
  }

  /**
   * Collapse the currently expanded node
   */
  private collapseNode(): void {
    if (!this.cy || !this.selectedNodeId) return;

    const previousNodeId = this.selectedNodeId;
    this.selectedNodeId = null;

    // Refresh node HTML to show collapsed version
    this.refreshNodeHtml(previousNodeId);

    // Emit node deselected event
    if (this.lifecycleData) {
      const nodeData = this.lifecycleData.nodes.find(n => n.id === previousNodeId);
      if (nodeData) {
        this.nodeSelected.emit({
          nodeId: previousNodeId,
          node: nodeData,
          expanded: false
        });
      }
    }
  }

  /**
   * Refresh the HTML label for a specific node
   */
  private refreshNodeHtml(nodeId: string): void {
    if (!this.cy || !this.lifecycleData) return;

    const nodeData = this.lifecycleData.nodes.find(n => n.id === nodeId);
    if (!nodeData) return;

    const node = this.cy.getElementById(nodeId);
    if (!node || node.length === 0) return;

    const isExpanded = this.selectedNodeId === nodeId;

    // Update the HTML label by re-initializing node-html-label for this node
    // @ts-ignore
    this.cy.nodeHtmlLabel([
      {
        query: `#${nodeId}`,
        tpl: () => {
          return this.nodeHtmlService.getNodeHtml({
            id: nodeData.id,
            label: nodeData.label,
            state: nodeData.state,
            actor: nodeData.actor,
            date: nodeData.date,
            ribbonColor: nodeData.ribbonColor
          }, isExpanded);
        }
      }
    ]);
  }

  /**
   * Control panel event handlers
   */
  onZoomIn(): void {
    this.zoomIn();
  }

  onZoomOut(): void {
    this.zoomOut();
  }

  onResetZoom(): void {
    this.resetZoom();
  }
}
