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
  private statusCodeDetails: Map<string, any> = new Map(); // Store status code details by node ID
  private loadingStatusDetails: Set<string> = new Set(); // Track nodes currently loading details

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
   * If status is "Approval in Progress", also render route log node
   */
  private loadAvailableActionsForFinalState(data: LifecycleData): void {
    if (data.nodes.length === 0) return;
    
    const finalNode = data.nodes[data.nodes.length - 1];
    const isApprovalInProgress = finalNode.state.toLowerCase().includes('approval') && 
                                  finalNode.state.toLowerCase().includes('progress');
    
    this.lifecycleService.getAvailableActions(finalNode.stateId).subscribe({
      next: (actions) => {
        this.renderAvailableActions(finalNode.id, actions, isApprovalInProgress);
        
        // If status is "Approval in Progress", also add route log node
        if (isApprovalInProgress) {
          this.renderRouteLogNode(finalNode.id);
        }
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
          statusCode: node.statusCode, // Add statusCode for API calls
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
        // Route log node styles  
        {
          selector: 'node[type = "route-log"]',
          style: {
            'width': '150px',
            'height': '50px',
            'shape': 'rectangle',
            'background-opacity': 0,
            'border-width': 0
          }
        },
        // Route log stop node styles
        {
          selector: 'node[type = "route-log-stop"]',
          style: {
            'width': '280px',
            'height': '140px',
            'shape': 'rectangle',
            'background-opacity': 0,
            'border-width': 0
          }
        },
        // Expanded route log stop node
        {
          selector: 'node[type = "route-log-stop"].expanded',
          style: {
            'width': '400px',
            'height': '300px',
            'z-index': 999
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
          const details = this.statusCodeDetails.get(data.id);
          const isLoading = this.loadingStatusDetails.has(data.id);
          
          console.log(`Rendering node: ${data.id} isExpanded: ${isExpanded} hasDetails: ${!!details} isLoading: ${isLoading}`);
          
          if (isExpanded && isLoading) {
            // Show loading state
            console.log('Showing loading state for:', data.id);
            return this.getLoadingStateNode(data);
          }
          
          if (isExpanded && details) {
            // Show expanded view with status code details
            console.log('Showing details view for:', data.id);
            return this.getExpandedStateNodeWithDetails(data, details);
          }
          
          console.log('Showing normal view for:', data.id);
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
        query: 'node[type = "route-log"]',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl: (data: any) => {
          return `
            <div class="route-log-pill" style="
              padding: 8px 16px;
              background: #7C3AED;
              color: white;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
              white-space: nowrap;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(124,58,237,0.3);
            ">
              ${data.label}
            </div>
          `;
        }
      },
      {
        query: 'node[type = "route-log-stop"]',
        halign: 'center',
        valign: 'center',
        halignBox: 'center',
        valignBox: 'center',
        tpl: (data: any) => {
          const isExpanded = this.selectedNodeId === data.id;
          
          const getStatusBadge = (count: number, label: string, color: string) => {
            if (count === 0) return '';
            return `<span style="
              display: inline-block;
              padding: 2px 8px;
              background: ${color};
              color: white;
              border-radius: 12px;
              font-size: 11px;
              margin: 0 4px;
            ">${count} ${label}</span>`;
          };

          if (isExpanded) {
            // Expanded view with full approver details
            const approversList = data.approvers.map((approver: any) => {
              const statusColor = 
                approver.approvalStatusCode === 'A' ? '#10B981' : 
                approver.approvalStatusCode === 'W' ? '#F59E0B' : '#6B7280';
              return `
                <div style="
                  padding: 8px;
                  margin: 4px 0;
                  background: #F9FAFB;
                  border-left: 3px solid ${statusColor};
                  border-radius: 4px;
                ">
                  <div style="
                    font-weight: 600;
                    font-size: 13px;
                    color: #1F2937;
                    margin-bottom: 2px;
                  ">${approver.approverName}</div>
                  <div style="
                    font-size: 11px;
                    color: ${statusColor};
                    font-weight: 500;
                  ">${approver.approvalStatus}</div>
                  <div style="
                    font-size: 10px;
                    color: #9CA3AF;
                    margin-top: 2px;
                  ">ID: ${approver.approverPersonId}</div>
                </div>
              `;
            }).join('');

            return `
              <div style="
                width: 400px;
                max-height: 400px;
                background: white;
                border: 3px solid #7C3AED;
                border-radius: 8px;
                padding: 16px;
                box-shadow: 0 4px 12px rgba(124,58,237,0.3);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                overflow: hidden;
              ">
                <div style="
                  height: 4px;
                  background-color: #7C3AED;
                  border-radius: 2px;
                  margin-bottom: 12px;
                  flex-shrink: 0;
                "></div>
                <div style="
                  font-weight: 700;
                  font-size: 16px;
                  color: #1F2937;
                  margin-bottom: 4px;
                  flex-shrink: 0;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">
                  ${data.mapNumber}. ${data.label}
                </div>
                <div style="
                  font-size: 12px;
                  color: #6B7280;
                  margin-bottom: 12px;
                  flex-shrink: 0;
                ">
                  ${data.totalApprovers} Approver(s)
                </div>
                <div style="
                  flex: 1;
                  overflow-y: auto;
                  min-height: 0;
                ">
                  ${approversList}
                </div>
              </div>
            `;
          } else {
            // Compact view with status badges
            return `
              <div style="
                width: 280px;
                min-height: 140px;
                background: white;
                border: 2px solid #7C3AED;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 2px 8px rgba(124,58,237,0.2);
                cursor: pointer;
              ">
                <div style="
                  height: 4px;
                  background-color: #7C3AED;
                  border-radius: 2px;
                  margin-bottom: 8px;
                "></div>
                <div style="
                  font-weight: 600;
                  font-size: 14px;
                  color: #1F2937;
                  margin-bottom: 8px;
                ">
                  ${data.mapNumber}. ${data.label}
                </div>
                <div style="
                  font-size: 12px;
                  color: #6B7280;
                  margin-bottom: 8px;
                ">
                  ${data.totalApprovers} Approver(s)
                </div>
                <div style="
                  display: flex;
                  flex-wrap: wrap;
                  gap: 4px;
                  margin-top: 8px;
                ">
                  ${getStatusBadge(data.waitingCount, 'Waiting', '#F59E0B')}
                  ${getStatusBadge(data.toBeSubmittedCount, 'Pending', '#6B7280')}
                  ${getStatusBadge(data.approvedCount, 'Approved', '#10B981')}
                </div>
              </div>
            `;
          }
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
      
      // Clear route log stops when clicking on state nodes
      this.clearRouteLogStops();
      
      // Load status code details for this node
      const statusCode = node.data('statusCode');
      if (statusCode && this.recordId) {
        // Set loading state before API call
        this.loadingStatusDetails.add(node.id());
        this.loadStatusCodeDetails(node.id(), this.recordId, statusCode);
      }
      
      this.expandNode(node);
    });

    // Add click handler for action nodes (load possible paths)
    this.cy.on('tap', 'node[type = "action"]', (event) => {
      const node = event.target as NodeSingular;
      const actionCode = node.data('actionCode');
      console.log('Action node clicked:', node.id(), 'actionCode:', actionCode, 'position:', node.position());
      
      // Clear route log stops when opening action paths
      this.clearRouteLogStops();
      
      if (actionCode) {
        this.loadPossiblePaths(node.id(), actionCode);
      }
    });

    // Add click handler for future state nodes (load available actions)
    this.cy.on('tap', 'node[type = "future-state"]', (event) => {
      const node = event.target as NodeSingular;
      const stateId = node.data('stateId');
      console.log('Future-state node clicked:', node.id(), 'stateId:', stateId, 'position:', node.position());
      
      // Clear route log stops when opening available actions
      this.clearRouteLogStops();
      
      if (stateId) {
        this.loadAvailableActionsForNode(node.id(), stateId);
      } else {
        console.warn('Future-state node has no stateId:', node.id());
      }
    });

    // Add click handler for route log node (load route log data)
    this.cy.on('tap', 'node[type = "route-log"]', (event) => {
      const node = event.target as NodeSingular;
      const recordId = node.data('recordId');
      console.log('Route-log node clicked:', node.id(), 'recordId:', recordId);
      
      // Clear available actions when opening route log
      this.clearAvailableActions();
      
      if (recordId) {
        this.loadRouteLogData(recordId);
      } else {
        console.warn('Route-log node has no recordId:', node.id());
      }
    });

    // Add click handler for route log stop nodes (expand to show approver details)
    this.cy.on('tap', 'node[type = "route-log-stop"]', (event) => {
      const node = event.target as NodeSingular;
      
      // Toggle expansion just like state nodes
      if (this.selectedNodeId === node.id()) {
        this.collapseNode();
      } else {
        this.expandNode(node);
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
          
          // Get all connected nodes (actions, future states, route log) for these 3 nodes
          const lastThreeWithActions = lastThreeNodes.reduce((collection: any, node: any) => {
            return collection.union(node.closedNeighborhood());
          }, this.cy.collection());
          
          // Also include route-log and route-log-stop nodes if they exist
          const routeLogNodes = this.cy.nodes('[type = "route-log"], [type = "route-log-stop"]');
          const allNodesToFit = lastThreeWithActions.union(routeLogNodes);
          
          // Fit to show all nodes with generous padding to ensure nothing is cut off
          this.cy.fit(allNodesToFit, 150);
          
          // Zoom out more to ensure all action nodes and route log are visible
          const currentZoom = this.cy.zoom();
          this.cy.zoom(currentZoom * 0.75);
        } else {
          // Fallback: fit all content if no state nodes
          this.cy.fit(undefined, 100);
          this.cy.center();
        }
      }
    }, 100);
  }

  /**
   * Render available actions for a given source node
   */
  private renderAvailableActions(sourceNodeId: string, actions: any[], includeRouteLog: boolean = false, isInitialActions: boolean = true): void {
    if (!this.cy) return;
    
    console.log('Rendering available actions from node:', sourceNodeId, 'actions count:', actions.length, 'includeRouteLog:', includeRouteLog, 'isInitialActions:', isInitialActions);
    
    const sourceNode = this.cy.$(`#${sourceNodeId}`);
    if (!sourceNode.length) {
      console.error('Source node not found:', sourceNodeId);
      return;
    }
    
    const sourcePos = sourceNode.position();
    console.log('Source node position:', sourcePos);
    
    // If including route log, adjust spacing to accommodate it
    const itemSpacing = includeRouteLog ? 120 : 150;
    const totalItems = includeRouteLog ? actions.length + 1 : actions.length;
    
    // Center the actions vertically around the source node
    const totalHeight = (totalItems - 1) * itemSpacing;
    const startY = sourcePos.y - (totalHeight / 2);
    
    this.cy.startBatch();
    
    const newElements: any[] = [];
    
    actions.forEach((action, index) => {
      const actionNodeId = `action-${action.actionCode}-${Date.now()}-${index}`;
      const yPos = startY + (index * itemSpacing);
      
      console.log('Creating action node:', actionNodeId, 'at position:', { x: sourcePos.x + 300, y: yPos });
      
      // Create action node
      newElements.push({
        group: 'nodes',
        data: {
          id: actionNodeId,
          label: action.actionName,
          type: 'action',
          actionCode: action.actionCode,
          isInitial: isInitialActions // Mark if this is from initial workflow or expansion
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
   * Render route log node for approval in progress state
   */
  private renderRouteLogNode(sourceNodeId: string): void {
    if (!this.cy) return;
    
    console.log('Rendering route log node from:', sourceNodeId);
    
    const sourceNode = this.cy.$(`#${sourceNodeId}`);
    if (!sourceNode.length) {
      console.error('Source node not found:', sourceNodeId);
      return;
    }
    
    const sourcePos = sourceNode.position();
    
    // Get existing action nodes to position route log below them
    const actionNodes = this.cy.nodes('[type = "action"]');
    let routeLogY = sourcePos.y;
    
    if (actionNodes.length > 0) {
      // Find the lowest action node
      let maxY = sourcePos.y;
      actionNodes.forEach((node: any) => {
        const pos = node.position();
        if (pos.y > maxY) maxY = pos.y;
      });
      routeLogY = maxY + 120;
    }
    
    const routeLogNodeId = `route-log-${Date.now()}`;
    
    this.cy.startBatch();
    
    const newElements: any[] = [];
    
    // Create route log node
    newElements.push({
      group: 'nodes',
      data: {
        id: routeLogNodeId,
        label: 'Route Log',
        type: 'route-log',
        recordId: this.recordId
      },
      position: {
        x: sourcePos.x + 300,
        y: routeLogY
      }
    });
    
    // Create edge from source to route log
    newElements.push({
      group: 'edges',
      data: {
        id: `${sourceNodeId}-${routeLogNodeId}`,
        source: sourceNodeId,
        target: routeLogNodeId,
        type: 'dynamic'
      }
    });
    
    this.cy.add(newElements);
    console.log('Added route log node');
    this.cy.endBatch();
  }

  /**
   * Load and display route log data
   */
  private loadRouteLogData(recordId: string): void {
    console.log('Loading route log for record:', recordId);
    
    this.lifecycleService.getRouteLog(recordId).subscribe({
      next: (routeLog) => {
        console.log('Route log data received:', routeLog);
        this.renderRouteLogStops(routeLog);
      },
      error: (err) => {
        console.error('Failed to load route log:', err);
        alert('Failed to load route log. Please try again.');
      }
    });
  }

  /**
   * Render route log stops as branch nodes (horizontally)
   */
  private renderRouteLogStops(routeLog: any): void {
    if (!this.cy) return;

    // Find the route log node
    const routeLogNodes = this.cy.nodes('[type = "route-log"]');
    if (!routeLogNodes.length) return;

    const routeLogNode = routeLogNodes[0];
    const routeLogPos = routeLogNode.position();

    // Remove any existing route log stop nodes
    this.cy.nodes('[type = "route-log-stop"]').remove();

    this.cy.startBatch();
    const newElements: any[] = [];

    // Create nodes for each stop horizontally
    routeLog.stops.forEach((stop: any, index: number) => {
      const stopNodeId = `route-log-stop-${stop.mapNumber}`;
      
      // Position stops horizontally to the right of the route log node
      const xOffset = 350 + (index * 350); // Space stops horizontally (350px apart)
      
      // Create approvers summary text
      const approversSummary = stop.approvers.map((a: any) => 
        `${a.approverName}: ${a.approvalStatus}`
      ).join('\n');
      
      // Count approvers by status
      const waitingCount = stop.approvers.filter((a: any) => 
        a.approvalStatusCode === 'W'
      ).length;
      const toBeSubmittedCount = stop.approvers.filter((a: any) => 
        a.approvalStatusCode === 'T'
      ).length;
      const approvedCount = stop.approvers.filter((a: any) => 
        a.approvalStatusCode === 'A'
      ).length;

      newElements.push({
        group: 'nodes',
        data: {
          id: stopNodeId,
          label: stop.mapName,
          mapNumber: stop.mapNumber,
          type: 'route-log-stop',
          approvers: stop.approvers,
          approversSummary: approversSummary,
          waitingCount: waitingCount,
          toBeSubmittedCount: toBeSubmittedCount,
          approvedCount: approvedCount,
          totalApprovers: stop.approvers.length
        },
        position: {
          x: routeLogPos.x + xOffset,
          y: routeLogPos.y // Same Y position as route log button
        }
      });

      // Create edge from route log to stop (or from previous stop)
      const sourceId = index === 0 ? routeLogNode.id() : `route-log-stop-${routeLog.stops[index - 1].mapNumber}`;
      newElements.push({
        group: 'edges',
        data: {
          id: `${sourceId}-${stopNodeId}`,
          source: sourceId,
          target: stopNodeId,
          type: 'dynamic'
        }
      });
    });

    this.cy.add(newElements);
    console.log(`Added ${routeLog.stops.length} route log stop nodes`);
    this.cy.endBatch();
    
    // Pan to show the route log stops with smooth animation
    setTimeout(() => {
      if (this.cy) {
        const routeLogStopNodes = this.cy.nodes('[type = "route-log-stop"]');
        if (routeLogStopNodes.length) {
          // Fit to show route log button and all its stops
          const allRouteLogNodes = routeLogNode.union(routeLogStopNodes);
          this.cy.animate({
            fit: {
              eles: allRouteLogNodes,
              padding: 100
            },
            duration: 400,
            easing: 'ease-out'
          });
        }
      }
    }, 50);
  }

  /**
   * Load status code details for a state node
   */
  private loadStatusCodeDetails(nodeId: string, recordId: string, statusCode: number): void {
    console.log('Loading status code details for node:', nodeId, 'statusCode:', statusCode);
    
    this.lifecycleService.getStatusCodeDetails(recordId, statusCode).subscribe({
      next: (details) => {
        console.log('Status code details received:', details);
        
        // Clear loading state FIRST
        this.loadingStatusDetails.delete(nodeId);
        console.log('Clearing loading state for node:', nodeId);
        console.log('Loading state after delete:', this.loadingStatusDetails.has(nodeId));
        
        // Set the details
        this.statusCodeDetails.set(nodeId, details);
        console.log('Details stored for node:', nodeId);
        
        // Force node to re-render by updating a dummy data property
        if (this.cy) {
          const node = this.cy.getElementById(nodeId);
          if (node && node.length > 0) {
            // Trigger re-render by updating node data
            node.data('_forceUpdate', Date.now());
          }
        }
      },
      error: (err) => {
        console.error('Failed to load status code details:', err);
        this.loadingStatusDetails.delete(nodeId);
        
        // Force node to re-render
        if (this.cy) {
          const node = this.cy.getElementById(nodeId);
          if (node && node.length > 0) {
            node.data('_forceUpdate', Date.now());
          }
        }
      }
    });
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
   * Clear all route log stop nodes
   */
  private clearRouteLogStops(): void {
    if (!this.cy) return;
    
    console.log('Clearing route log stops');
    
    // Remove all route log stop nodes (edges will be removed automatically)
    const routeLogStopNodes = this.cy.nodes('[type = "route-log-stop"]');
    if (routeLogStopNodes.length > 0) {
      console.log('Removing', routeLogStopNodes.length, 'route log stop nodes');
      this.cy.remove(routeLogStopNodes);
    }
  }

  /**
   * Clear all available action nodes (only non-initial ones from future-state expansions)
   */
  private clearAvailableActions(): void {
    if (!this.cy) return;
    
    console.log('Clearing available action nodes from future-state expansions');
    
    // Clear any expanded action paths
    if (this.expandedActionsByParent.size > 0) {
      this.expandedActionsByParent.forEach((actionId, parentId) => {
        this.clearActionPaths(actionId);
      });
      this.expandedActionsByParent.clear();
    }
    
    // Remove only non-initial action nodes (from future-state expansions)
    const actionNodes = this.cy.nodes('[type = "action"]').filter((node: any) => {
      return node.data('isInitial') !== true;
    });
    
    if (actionNodes.length > 0) {
      console.log('Removing', actionNodes.length, 'non-initial action nodes');
      this.cy.remove(actionNodes);
    }
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
          this.renderAvailableActions(nodeId, actions, false, false); // false = not initial actions
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

    // Calculate zoom level based on node type and dimensions
    const nodeType = node.data('type');
    let targetZoom = 1.2; // Default zoom for state nodes
    
    if (nodeType === 'route-log-stop') {
      // Route log stops are larger (400x300), so zoom less
      // Calculate zoom to fit the expanded node comfortably in view
      const canvasHeight = this.cy.height();
      const expandedHeight = 400; // max-height of expanded stop node
      const desiredViewHeight = expandedHeight + 200; // Add padding
      targetZoom = Math.min(canvasHeight / desiredViewHeight, 0.9); // Cap at 0.9
    } else if (nodeType === 'state') {
      // Check if node has details or is loading (expanded state node is 400px wide vs normal 220px)
      const hasDetails = this.statusCodeDetails.has(nodeId);
      const isLoading = this.loadingStatusDetails.has(nodeId);
      
      if (hasDetails || isLoading) {
        // For expanded state nodes, just zoom out to show more context
        // Don't move the node - let it expand in place
        targetZoom = 0.7;
      }
    }

    // Animate to center and zoom to the node
    this.cy.animate({
      center: {
        eles: node
      },
      zoom: targetZoom,
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

    const node = this.cy.getElementById(nodeId);
    if (!node || node.length === 0) return;

    console.log('Refreshing node HTML for:', nodeId);
    
    // Simply update node data to trigger nodeHtmlLabel re-render
    // The nodeHtmlLabel plugin watches for data changes
    node.data('_forceUpdate', Date.now());
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

  /**
   * Generate loading state node HTML
   */
  private getLoadingStateNode(data: any): string {
    const color = data.ribbonColor || '#B0BEC5';
    
    return `
      <div style="
        width: 400px;
        height: 300px;
        background: white;
        border: 3px solid ${color};
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          height: 4px;
          width: 100%;
          background-color: ${color};
          border-radius: 2px;
          margin-bottom: 20px;
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          width: calc(100% - 32px);
        "></div>
        <div style="
          width: 50px;
          height: 50px;
          border: 4px solid #E5E7EB;
          border-top-color: ${color};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <div style="
          font-size: 14px;
          color: #6B7280;
          margin-top: 16px;
          font-weight: 500;
        ">Loading details...</div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }

  /**
   * Generate expanded state node HTML with status code details
   */
  private getExpandedStateNodeWithDetails(data: any, details: any): string {
    const color = data.ribbonColor || '#B0BEC5';
    
    // Format the action start time
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // Generate details list HTML
    const detailsHtml = details.details.map((detail: any) => {
      return `
        <div style="
          padding: 8px;
          margin: 4px 0;
          background: #F9FAFB;
          border-left: 3px solid ${color};
          border-radius: 4px;
        ">
          <div style="
            font-weight: 600;
            font-size: 12px;
            color: #1F2937;
            margin-bottom: 4px;
          ">${detail.updatedByName}</div>
          <div style="
            font-size: 11px;
            color: #6B7280;
          ">Started: ${formatDate(detail.actionStartTime)}</div>
          ${detail.actionEndTime ? `
          <div style="
            font-size: 11px;
            color: #6B7280;
          ">Ended: ${formatDate(detail.actionEndTime)}</div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    return `
      <div style="
        width: 400px;
        max-height: 400px;
        background: white;
        border: 3px solid ${color};
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      ">
        <div style="
          height: 4px;
          background-color: ${color};
          border-radius: 2px;
          margin-bottom: 12px;
          flex-shrink: 0;
        "></div>
        <div style="
          font-weight: 700;
          font-size: 18px;
          color: #1F2937;
          margin-bottom: 8px;
          flex-shrink: 0;
        ">${details.statusDescription}</div>
        <div style="
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 4px;
          flex-shrink: 0;
        ">Status Code: ${details.statusCode}</div>
        <div style="
          font-size: 12px;
          color: #6B7280;
          margin-bottom: 12px;
          flex-shrink: 0;
        ">Actor: ${data.actor}</div>
        <div style="
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          flex-shrink: 0;
        ">History (${details.details.length} action(s))</div>
        <div style="
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        ">
          ${detailsHtml}
        </div>
      </div>
    `;
  }
}

