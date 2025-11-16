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

// Try to import cytoscape-elk if available
let elk: any = null;
try {
  // @ts-ignore - cytoscape-elk may not be installed
  elk = require('cytoscape-elk');
} catch (e) {
  console.log('cytoscape-elk not available, using preset layout');
}

// Register Cytoscape extensions
cytoscape.use(dagre);
// @ts-ignore
cytoscape.use(nodeHtmlLabel);
if (elk) {
  cytoscape.use(elk);
}

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
  @Input() canvasHeight: number = 500; // Adjustable canvas height in pixels
  @ViewChild('cyContainer', { static: false }) cyContainer!: ElementRef<HTMLDivElement>;

  private cy?: Core;
  private selectedNodeId: string | null = null;
  private lifecycleData?: LifecycleData;
  private nextActionY: number = 0; // Track Y position for next action node
  private expandedActionsByParent: Map<string, string> = new Map(); // Track expanded action per parent node
  private nextFutureY: number = 0; // Track Y position for next future state

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
        // Auto-load available actions for the final state
        this.loadAvailableActionsForFinalState(data);
      },
      error: (error) => {
        console.error('Failed to load lifecycle data:', error);
      }
    });
  }

  /**
   * Load and render available actions for the final state
   */
  private loadAvailableActionsForFinalState(data: LifecycleData): void {
    if (data.nodes.length === 0) return;
    
    const finalNode = data.nodes[data.nodes.length - 1];
    this.lifecycleService.getAvailableActions(finalNode.stateId).subscribe({
      next: (actions) => {
        this.renderAvailableActions(finalNode.id, actions);
      },
      error: (error) => {
        console.error('Failed to load available actions:', error);
      }
    });
  }

  private initializeCytoscape(data: LifecycleData): void {
    if (!this.cyContainer) {
      console.error('Cytoscape container not found');
      return;
    }

    // Process nodes to handle repeated states (multi-lane layout)
    const nodePositions = this.calculateNodePositions(data.nodes);
    
    // Prepare nodes for Cytoscape with positioning
    const cytoscapeNodes = data.nodes.map((node, index) => {
      const position = nodePositions.get(node.id);
      return {
        data: {
          id: node.id,
          label: node.label,
          state: node.state,
          stateId: node.stateId,
          actor: node.actor,
          date: node.date,
          ribbonColor: node.ribbonColor,
          type: 'state'
        },
        position: position
      };
    });

    // Prepare edges with proper styling
    const edgeCounter = new Map<string, number>();
    const cytoscapeEdges = data.edges.map((edge) => {
      const edgeKey = `${edge.source}-${edge.target}`;
      const count = edgeCounter.get(edgeKey) || 0;
      edgeCounter.set(edgeKey, count + 1);
      
      const sourceNode = this.findNodeByStateId(data.nodes, edge.source);
      const targetNode = this.findNodeByStateId(data.nodes, edge.target);
      
      // Handle loopback detection
      const sourceIndex = sourceNode ? data.nodes.indexOf(sourceNode) : -1;
      const targetIndex = targetNode ? data.nodes.indexOf(targetNode) : -1;
      const isLoopback = sourceIndex > targetIndex && targetIndex >= 0;

      return {
        data: {
          id: `${edge.source}-${edge.target}-${count}`,
          source: sourceNode?.id || edge.source,
          target: targetNode?.id || edge.target,
          type: 'history',
          loopback: isLoopback,
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
        // State node styles (actual history)
        {
          selector: 'node[type = "state"]',
          style: {
            'width': '220px',
            'height': '110px',
            'shape': 'rectangle',
            'background-opacity': 0,
            'border-width': 0,
          }
        },
        // Future state node styles
        {
          selector: 'node[type = "future-state"]',
          style: {
            'width': '220px',
            'height': '110px',
            'shape': 'rectangle',
            'background-opacity': 0,
            'border-width': 0
          }
        },
        // Action node styles
        {
          selector: 'node[type = "action"]',
          style: {
            'width': '150px',
            'height': '50px',
            'shape': 'rectangle',
            'background-opacity': 0,
            'border-width': 0
          }
        },
        // Expanded node gets larger dimensions
        {
          selector: 'node.expanded',
          style: {
            'width': '280px',
            'height': '160px',
            'z-index': 999
          }
        },
        // History edges - solid straight orange
        {
          selector: 'edge[type = "history"]',
          style: {
            'width': 2.5,
            'line-color': '#FFA726',
            'target-arrow-color': '#FFA726',
            'target-arrow-shape': 'triangle',
            'curve-style': 'straight',
            'arrow-scale': 1.3
          }
        },
        // Dynamic edges - dashed gray with smooth curves
        {
          selector: 'edge[type = "dynamic"]',
          style: {
            'curve-style': 'bezier',
            'control-point-step-size': 60,
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'line-color': '#9CA3AF',
            'target-arrow-shape': 'vee',
            'target-arrow-color': '#9CA3AF',
            'width': 2,
            'arrow-scale': 1.2
          }
        }
      ],
      layout: {
        name: 'preset', // Use preset positions we calculated
        animate: false
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      minZoom: 0.3,
      maxZoom: 2
    });

    // Apply HTML labels to all node types
    // @ts-ignore
    this.cy.nodeHtmlLabel([
      {
        query: 'node[type = "state"]',
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
      },
      {
        query: 'node[type = "action"]',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl: (data: any) => {
          return `
            <div class="action-pill" style="
              padding: 8px 16px;
              background: #FFB300;
              color: white;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              white-space: nowrap;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
              ${data.label}
            </div>
          `;
        }
      },
      {
        query: 'node[type = "future-state"]',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl: (data: any) => {
          return `
            <div style="
              width: 220px;
              height: 110px;
              background: white;
              border: 2px dashed #9CA3AF;
              border-radius: 8px;
              padding: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.06);
              cursor: pointer;
              display: flex;
              flex-direction: column;
            ">
              <div style="
                height: 4px;
                background-color: #D1D5DB;
                border-radius: 2px;
                margin-bottom: 12px;
              "></div>
              <div style="
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 8px;
              ">${data.label}</div>
              <div style="
                font-size: 12px;
                color: #6B7280;
                font-weight: 500;
              ">Possible State</div>
            </div>
          `;
        }
      }
    ], { enablePointerEvents: false });

    // Add click handler for state nodes (expansion)
    this.cy.on('tap', 'node[type = "state"]', (event) => {
      const node = event.target as NodeSingular;
      
      // Clear any expanded action paths when clicking a new state node
      if (this.expandedActionsByParent.size > 0) {
        this.expandedActionsByParent.forEach((actionId, parentId) => {
          this.clearActionPaths(actionId);
        });
        this.expandedActionsByParent.clear();
      }
      
      this.expandNode(node);
    });

    // Add click handler for action nodes (load possible paths)
    this.cy.on('tap', 'node[type = "action"]', (event) => {
      const node = event.target as NodeSingular;
      const actionCode = node.data('actionCode');
      console.log('Action node clicked:', node.id(), 'actionCode:', actionCode, 'position:', node.position());
      if (actionCode) {
        this.loadPossiblePaths(node.id(), actionCode);
      }
    });

    // Add click handler for future state nodes (load available actions)
    this.cy.on('tap', 'node[type = "future-state"]', (event) => {
      const node = event.target as NodeSingular;
      const stateId = node.data('stateId');
      console.log('Future-state node clicked:', node.id(), 'stateId:', stateId, 'position:', node.position());
      if (stateId) {
        this.loadAvailableActionsForNode(node.id(), stateId);
      } else {
        console.warn('Future-state node has no stateId:', node.id());
      }
    });

    // Add click handler for background to collapse nodes
    this.cy.on('tap', (event) => {
      // If clicking on background (not a node or edge)
      if (event.target === this.cy) {
        this.collapseNode();
      }
    });

    // Focus on the last 3 state nodes and their actions initially
    setTimeout(() => {
      if (this.cy) {
        const stateNodes = this.cy.nodes('[type = "state"]');
        const nodeCount = stateNodes.length;
        
        if (nodeCount > 0) {
          // Get the last 3 state nodes
          const startIndex = Math.max(0, nodeCount - 3);
          const lastThreeNodes = stateNodes.slice(startIndex);
          
          // Get all connected nodes (actions, future states) for these 3 nodes
          const lastThreeWithActions = lastThreeNodes.reduce((collection: any, node: any) => {
            return collection.union(node.closedNeighborhood());
          }, this.cy.collection());
          
          // Fit to show these nodes and their actions with padding
          this.cy.fit(lastThreeWithActions, 120);
          
          // Zoom out slightly for better overview
          const currentZoom = this.cy.zoom();
          this.cy.zoom(currentZoom * 0.9);
        } else {
          // Fallback: fit all content if no state nodes
          this.cy.fit(undefined, 80);
          this.cy.center();
        }
      }
    }, 100);
  }

  /**
   * Render available actions for a given source node
   */
  private renderAvailableActions(sourceNodeId: string, actions: any[]): void {
    if (!this.cy) return;
    
    console.log('Rendering available actions from node:', sourceNodeId, 'actions count:', actions.length);
    
    const sourceNode = this.cy.$(`#${sourceNodeId}`);
    if (!sourceNode.length) {
      console.error('Source node not found:', sourceNodeId);
      return;
    }
    
    const sourcePos = sourceNode.position();
    console.log('Source node position:', sourcePos);
    
    // Center the actions vertically around the source node
    const totalHeight = (actions.length - 1) * 150;
    const startY = sourcePos.y - (totalHeight / 2);
    
    this.cy.startBatch();
    
    const newElements: any[] = [];
    
    actions.forEach((action, index) => {
      const actionNodeId = `action-${action.actionCode}-${Date.now()}-${index}`;
      const yPos = startY + (index * 150);
      
      console.log('Creating action node:', actionNodeId, 'at position:', { x: sourcePos.x + 300, y: yPos });
      
      // Create action node
      newElements.push({
        group: 'nodes',
        data: {
          id: actionNodeId,
          label: action.actionName,
          type: 'action',
          actionCode: action.actionCode
        },
        position: {
          x: sourcePos.x + 300,
          y: yPos
        }
      });
      
      // Create edge from source to action
      newElements.push({
        group: 'edges',
        data: {
          id: `${sourceNodeId}-${actionNodeId}`,
          source: sourceNodeId,
          target: actionNodeId,
          type: 'dynamic'
        }
      });
    });
    
    this.cy.add(newElements);
    console.log('Added', newElements.length, 'new elements (nodes + edges)');
    this.cy.endBatch();
  }

  /**
   * Load and render possible paths for an action
   */
  private loadPossiblePaths(actionNodeId: string, actionCode: string): void {
    console.log('Loading possible paths for action:', actionCode);
    
    if (!this.cy) return;
    
    // Get the parent node of this action
    const actionNode = this.cy.$id(actionNodeId);
    if (!actionNode.length) return;
    
    const parentNodes = actionNode.incomers('node');
    if (parentNodes.length === 0) return;
    
    const parentNodeId = parentNodes[0].id();
    console.log('Action parent node:', parentNodeId);
    
    // Check if a different sibling action was previously expanded from the same parent
    const previousExpandedActionId = this.expandedActionsByParent.get(parentNodeId);
    if (previousExpandedActionId && previousExpandedActionId !== actionNodeId) {
      console.log('Clearing sibling action paths:', previousExpandedActionId);
      this.clearActionPaths(previousExpandedActionId);
    }
    
    // Track this action as expanded for its parent
    this.expandedActionsByParent.set(parentNodeId, actionNodeId);
    
    this.lifecycleService.getPossiblePaths(actionCode).subscribe({
      next: (paths) => {
        console.log('Received paths:', paths);
        if (paths && Array.isArray(paths)) {
          this.renderPossiblePaths(actionNodeId, paths);
        } else {
          console.warn('No valid paths returned for action:', actionCode);
        }
      },
      error: (error) => {
        console.error('Failed to load possible paths:', error);
      }
    });
  }

  /**
   * Clear all paths (future state nodes and edges) for a given action node
   * This recursively removes all descendants (future states, actions, and their children)
   */
  private clearActionPaths(actionNodeId: string): void {
    if (!this.cy) return;
    
    console.log('Clearing paths for action:', actionNodeId);
    
    // Get the action node
    const actionNode = this.cy.$id(actionNodeId);
    if (!actionNode.length) return;
    
    // Find all descendants (future-state nodes, action nodes, and their children recursively)
    // Using successors() gets all nodes reachable from this action node
    const descendants = actionNode.successors();
    
    // Filter to get only action and future-state nodes (not edges)
    const nodesToRemove = descendants.filter('node[type="action"], node[type="future-state"]');
    
    // Remove all descendant nodes (this will also remove their edges automatically)
    if (nodesToRemove.length > 0) {
      console.log('Removing', nodesToRemove.length, 'descendant nodes (actions and future states)');
      this.cy.remove(nodesToRemove);
    }
    
    // Remove only the outgoing edges from the action node (not incoming edges)
    const outgoingEdges = actionNode.outgoers('edge');
    if (outgoingEdges.length > 0) {
      this.cy.remove(outgoingEdges);
    }
    
    // Clean up tracking: find parent nodes of removed descendants and remove them from the map
    nodesToRemove.forEach((node: any) => {
      if (node.data('type') === 'future-state') {
        const futureStateId = node.id();
        this.expandedActionsByParent.delete(futureStateId);
      }
    });
  }

  /**
   * Render possible path statuses for an action
   */
  private renderPossiblePaths(actionNodeId: string, paths: any[]): void {
    if (!this.cy) return;
    
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      console.warn('No paths to render for action node:', actionNodeId);
      return;
    }
    
    const actionNode = this.cy.$id(actionNodeId);
    if (!actionNode.length) {
      console.error('Action node not found:', actionNodeId);
      return;
    }
    
    const actionPos = actionNode.position();
    console.log('Rendering paths from action node:', actionNodeId, 'at position:', actionPos);
    
    // Center the future states vertically around the action node
    const totalHeight = (paths.length - 1) * 150;
    const startY = actionPos.y - (totalHeight / 2);
    
    this.cy.startBatch();
    
    const newElements: any[] = [];
    
    paths.forEach((path, index) => {
      // Sanitize the status string to create a valid node ID (remove spaces and special chars)
      const sanitizedStatus = path.status.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
      const futureNodeId = `future-${sanitizedStatus}-${Date.now()}-${index}`;
      const yPos = startY + (index * 150);
      const stateId = this.lifecycleService.getStateIdFromStatus(path.status);
      
      // Create future state node
      newElements.push({
        group: 'nodes',
        data: {
          id: futureNodeId,
          label: path.label,
          type: 'future-state',
          status: path.status,
          stateId: stateId
        },
        position: {
          x: actionPos.x + 300,
          y: yPos
        }
      });
      
      // Create edge from action to future state
      newElements.push({
        group: 'edges',
        data: {
          id: `${actionNodeId}-${futureNodeId}`,
          source: actionNodeId,
          target: futureNodeId,
          type: 'dynamic'
        }
      });
    });
    
    this.cy.add(newElements);
    this.cy.endBatch();
    
    // Center the action node with smooth animation
    setTimeout(() => {
      if (this.cy) {
        const actionNodeElement = this.cy.$id(actionNodeId);
        if (actionNodeElement.length) {
          this.cy.animate({
            center: {
              eles: actionNodeElement
            },
            duration: 400,
            easing: 'ease-out'
          });
        }
      }
    }, 50);
  }

  /**
   * Load and render available actions for a future state node
   */
  private loadAvailableActionsForNode(nodeId: string, stateId: number): void {
    console.log('Loading available actions for node:', nodeId, 'stateId:', stateId);
    this.lifecycleService.getAvailableActions(stateId).subscribe({
      next: (actions) => {
        console.log('Received actions for future-state node:', nodeId, 'actions:', actions);
        if (actions && actions.length > 0) {
          this.renderAvailableActions(nodeId, actions);
        } else {
          console.warn('No actions returned for future-state node:', nodeId);
        }
      },
      error: (error) => {
        console.error('Failed to load available actions for node:', error);
      }
    });
  }

  /**
   * Calculate node positions for multi-lane layout
   */
  private calculateNodePositions(nodes: NodeData[]): Map<string, { x: number, y: number }> {
    const positions = new Map<string, { x: number, y: number }>();
    const stateVisits = new Map<string, number>();
    const stateLanes = new Map<string, number[]>();
    
    const columnWidth = 300;
    const laneHeight = 200;
    const baseY = 300;

    nodes.forEach((node, index) => {
      const state = node.state;
      const visitCount = stateVisits.get(state) || 0;
      stateVisits.set(state, visitCount + 1);

      // Get or create lane assignments for this state
      if (!stateLanes.has(state)) {
        stateLanes.set(state, []);
      }
      const lanes = stateLanes.get(state)!;
      lanes.push(index);

      // Calculate position
      const laneIndex = visitCount;
      const x = index * columnWidth;
      const y = baseY + (laneIndex * laneHeight);

      positions.set(node.id, { x, y });
    });

    return positions;
  }

  /**
   * Find node by state ID (case-insensitive match)
   */
  private findNodeByStateId(nodes: NodeData[], stateId: string): NodeData | undefined {
    const normalizedId = stateId.toLowerCase().replace(/\s+/g, '-');
    return nodes.find(n => 
      n.id === stateId || 
      n.id === normalizedId ||
      n.state.toLowerCase().replace(/\s+/g, '-') === normalizedId
    );
  }

  /**
   * Format state label for display
   */
  private formatStateLabel(stateId: string): string {
    return stateId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
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
      const previousNode = this.cy.getElementById(this.selectedNodeId);
      if (previousNode && previousNode.length > 0) {
        previousNode.removeClass('expanded');
      }
    }

    // Set new selected node
    this.selectedNodeId = nodeId;
    
    // Add expanded class to the node
    node.addClass('expanded');

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
    const node = this.cy.getElementById(previousNodeId);
    
    if (node && node.length > 0) {
      node.removeClass('expanded');
    }
    
    this.selectedNodeId = null;

    // Clear any expanded action paths when collapsing
    if (this.expandedActionsByParent.size > 0) {
      this.expandedActionsByParent.forEach((actionId, parentId) => {
        this.clearActionPaths(actionId);
      });
      this.expandedActionsByParent.clear();
    }

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

    // Refresh all nodes to ensure proper rendering
    // The nodeHtmlLabel plugin needs to be re-initialized for all nodes
    // to properly update the HTML for the selected node
    // @ts-ignore
    this.cy.nodeHtmlLabel([
      {
        query: 'node[type = "state"]',
        tpl: (data: any) => {
          const expanded = this.selectedNodeId === data.id;
          return this.nodeHtml.getNodeHtml({
            id: data.id,
            state: data.state,
            actor: data.actor,
            date: data.date,
            color: data.ribbonColor
          }, expanded);
        }
      },
      {
        query: 'node[type = "action"]',
        halign: 'center',
        valign: 'center',
        tpl: (data: any) => {
          return `
            <div class="action-pill" style="
              padding: 8px 16px;
              background: #FFB300;
              color: white;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              white-space: nowrap;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
              ${data.label}
            </div>
          `;
        }
      },
      {
        query: 'node[type = "future-state"]',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl: (data: any) => {
          return `
            <div style="
              width: 220px;
              height: 110px;
              background: white;
              border: 2px dashed #9CA3AF;
              border-radius: 8px;
              padding: 12px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.06);
              cursor: pointer;
              display: flex;
              flex-direction: column;
            ">
              <div style="
                height: 4px;
                background-color: #D1D5DB;
                border-radius: 2px;
                margin-bottom: 12px;
              "></div>
              <div style="
                font-size: 16px;
                font-weight: 600;
                color: #111827;
                margin-bottom: 8px;
              ">${data.label}</div>
              <div style="
                font-size: 12px;
                color: #6B7280;
                font-weight: 500;
              ">Possible State</div>
            </div>
          `;
        }
      }
    ], { enablePointerEvents: false });
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

