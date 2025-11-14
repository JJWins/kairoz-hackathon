/**
 * Represents a single workflow transition/state change
 */
export interface Transition {
  /** Unique identifier for the transition */
  id: string;
  /** Source state/node ID */
  source: string;
  /** Target state/node ID */
  target: string;
  /** Type of transition: 'actual' (completed) or 'possible' (future option) */
  type: 'actual' | 'possible';
  /** Timestamp when the transition occurred (for actual transitions) */
  timestamp?: string;
  /** Actor who performed the transition */
  actor?: string;
}

/**
 * Represents a node in the workflow graph
 */
export interface NodeData {
  /** Unique identifier for the node */
  id: string;
  /** Display label/title for the node state */
  label: string;
  /** Current state name */
  state: string;
  /** Actor responsible for this state */
  actor: string;
  /** Date when this state was reached */
  date: string;
  /** Color code for the node ribbon */
  ribbonColor?: string;
  /** Whether this is a future/possible state */
  isFuture?: boolean;
}

/**
 * Represents an edge/connection in the workflow graph
 */
export interface EdgeData {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Type of edge: 'actual' or 'possible' */
  type: 'actual' | 'possible';
  /** Label to display on the edge */
  label?: string;
}

/**
 * Complete lifecycle graph model
 */
export interface LifecycleGraphModel {
  /** Unique identifier for this workflow/record */
  id: string;
  /** Current state of the workflow */
  currentState: string;
  /** List of all nodes in the graph */
  nodes: NodeData[];
  /** List of all edges/connections in the graph */
  edges: EdgeData[];
  /** Complete history of transitions */
  history: Transition[];
  /** Possible future transitions from current state */
  possibleTransitions: Transition[];
}

/**
 * Configuration options for the workflow graph
 */
export interface WorkflowGraphConfig {
  /** Whether to enable node expansion on click */
  enableNodeExpansion?: boolean;
  /** Whether to enable zoom controls */
  enableZoomControls?: boolean;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Initial zoom level (0.3 - 2.0) */
  initialZoom?: number;
  /** Padding around the graph */
  padding?: number;
  /** Whether to enable animations */
  enableAnimations?: boolean;
}

/**
 * Event emitted when a node is selected
 */
export interface NodeSelectEvent {
  /** Selected node ID */
  nodeId: string;
  /** Node data */
  node: NodeData;
  /** Whether the node is expanded */
  expanded: boolean;
}

/**
 * Status color mapping
 */
export interface StatusColors {
  [status: string]: string;
}
