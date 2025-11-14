import { 
  Component, 
  AfterViewInit, 
  OnDestroy, 
  Input, 
  ViewChild, 
  ElementRef 
} from '@angular/core';
import { Controls } from '../controls/controls';
import { WorkflowNodeHtml } from '../workflow-node-html/workflow-node-html';
import { Lifecycle, LifecycleData, NodeData } from '../../services/lifecycle';
import cytoscape, { Core, EdgeSingular, NodeSingular } from 'cytoscape';
// @ts-ignore - cytoscape-dagre doesn't have complete types
import dagre from 'cytoscape-dagre';
// @ts-ignore - cytoscape-node-html-label doesn't have types
import nodeHtmlLabel from 'cytoscape-node-html-label';

// Register Cytoscape extensions
cytoscape.use(dagre);
// @ts-ignore
cytoscape.use(nodeHtmlLabel);

@Component({
  selector: 'app-workflow-canvas',
  imports: [Controls],
  templateUrl: './workflow-canvas.html',
  styleUrl: './workflow-canvas.scss',
  standalone: true,
  providers: [WorkflowNodeHtml]
})
export class WorkflowCanvas implements AfterViewInit, OnDestroy {
  @Input() recordId: string = 'REC-2025-001847';
  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef<HTMLDivElement>;

  private cy?: Core;
  private selectedNodeId: string | null = null;
  private lifecycleData?: LifecycleData;

  constructor(
    private lifecycleService: Lifecycle,
    private nodeHtml: WorkflowNodeHtml
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
    this.lifecycleService.getLifecycleData(this.recordId).subscribe({
      next: (data: LifecycleData) => {
        this.lifecycleData = data;
        this.initializeCytoscape(data);
      },
      error: (error) => {
        console.error('Failed to load lifecycle data:', error);
      }
    });
  }

  private initializeCytoscape(data: LifecycleData): void {
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

    // Prepare edges for Cytoscape with loopback detection
    // Track edge counts to handle duplicate edges
    const edgeCounter = new Map<string, number>();
    
    const cytoscapeEdges = data.edges.map((edge, index) => {
      const edgeKey = `${edge.source}-${edge.target}-${edge.type}`;
      const count = edgeCounter.get(edgeKey) || 0;
      edgeCounter.set(edgeKey, count + 1);
      
      return {
        data: {
          id: `${edge.source}-${edge.target}-${edge.type}-${count}`, // Unique ID for duplicate edges
          source: edge.source,
          target: edge.target,
          edgeType: edge.type,
          loopback: edge.loopback || false,
          transitionDate: edge.transitionDate
        }
      };
    });

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
          selector: 'edge[edgeType="actual"][!loopback]',
          style: {
            'width': 2,
            'line-color': '#42A5F5',
            'target-arrow-color': '#42A5F5',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2
          }
        },
        // Loopback edges - curved with distinct styling
        {
          selector: 'edge[edgeType="actual"][loopback]',
          style: {
            'width': 2.5,
            'line-color': '#FF9800',
            'target-arrow-color': '#FF9800',
            'target-arrow-shape': 'triangle',
            'curve-style': 'unbundled-bezier',
            'control-point-distances': [60, -60],
            'control-point-weights': [0.25, 0.75],
            'arrow-scale': 1.3,
            'line-style': 'solid'
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
        nodeSep: 100, // Increased spacing for better loopback visibility
        rankSep: 150, // Increased spacing for better loopback visibility
        animate: false,
        // @ts-ignore - acyclic is valid for dagre layout
        acyclic: false, // Allow cyclic graphs - critical for loops and backtracks
        // @ts-ignore - ranker is valid for dagre layout
        ranker: 'network-simplex' // Better handling of complex graphs
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
          return this.nodeHtml.getNodeHtml({
            id: data.id,
            state: data.state,
            actor: data.actor,
            date: data.date,
            color: data.ribbonColor
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
   * Zoom and center to a specific node with animation
   */
  private zoomToNode(node: NodeSingular): void {
    if (!this.cy) return;

    this.cy.animate({
      fit: {
        eles: node,
        padding: 100
      },
      duration: 500,
      easing: 'ease-in-out'
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
          return this.nodeHtml.getNodeHtml({
            id: nodeData.id,
            state: nodeData.state,
            actor: nodeData.actor,
            date: nodeData.date,
            color: nodeData.ribbonColor
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

