import { Injectable } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

/**
 * API Response Interfaces matching the backend schema
 */
export interface ApiNodeMetadata {
  durationInState: string | null;
  comments: string | null;
  revisionNumber: string | null;
  changeSummary: string | null;
  submissionMethod: string | null;
  assignedReviewer: string | null;
  notes: string | null;
  approvalLevel: string | null;
}

export interface ApiNode {
  id: string;
  statusCode: number;
  label: string;
  status: string;
  owner: string | null;
  timestamp: string;
  metadata?: ApiNodeMetadata;
}

export interface ApiEdge {
  id: string;
  source: string;
  target: string;
}

export interface ApiLifecycleResponse {
  recordId: number;
  title: string;
  currentState: string | null;
  createTimeStamp: string;
  updateTimeStamp: string;
  updateUser: string;
  createUser: string;
  priority: string;
  category: string;
  unitNumber: string;
  unitName: string;
  nodes: ApiNode[];
  edges: ApiEdge[];
}

/**
 * Available Actions API Response
 */
export interface ApiAvailableAction {
  actionCode: string;
  actionName: string;
  nextStatus?: string;
}

export interface ApiAvailableActionsResponse {
  status: string;
  actions: ApiAvailableAction[];
}

/**
 * Possible Paths API Response
 */
export interface ApiPossiblePathStatus {
  status: string;
  label: string;
}

export interface ApiPossiblePathsResponse {
  actionCode: number;
  actionName: string;
  paths: {
    statusCode: number;
    statusName: string;
  };
}

/**
 * Route Log API Response
 */
export interface ApiRouteLogApprover {
  approverPersonId: string;
  approverName: string;
  approvalStatusCode: string;
  approvalStatus: string;
}

export interface ApiRouteLogStop {
  mapNumber: number;
  mapName: string;
  approvers: ApiRouteLogApprover[];
}

export interface ApiRouteLogResponse {
  workflowId: number;
  workflowStartDate: string;
  workflowEndDate: string;
  stops: ApiRouteLogStop[];
}

/**
 * Status Code Details API Response
 */
export interface ApiStatusCodeDetail {
  actionStartTime: string;
  actionEndTime: string | null;
  updatedByName: string;
}

export interface ApiStatusCodeDetailsResponse {
  headerId: string;
  statusCode: number;
  statusDescription: string;
  details: ApiStatusCodeDetail[];
}

/**
 * Internal interfaces for the component
 */
export interface NodeData {
  id: string;
  label: string;
  actor: string;
  date: string;
  ribbonColor: string;
  state: string; // Display name (e.g., "Draft", "Submitted")
  stateId: number; // Numeric state ID from API (e.g., 1, 4, 5)
  statusCode?: number;
  timestamp?: string;
  owner?: string | null;
}

export interface EdgeData { 
  source: string;
  target: string;
  type: 'actual' | 'possible';
  loopback?: boolean;
  transitionDate?: string;
}

export interface HistoryEntry {
  state: string;
  actor: string;
  timestamp: string;
}

export interface LifecycleData {
  nodes: NodeData[];
  edges: EdgeData[];
}

@Injectable({
  providedIn: 'root',
})
export class Lifecycle {
  private readonly API_BASE_URL = 'http://10.199.100.192:4000/lifecycle/workflows';
  
  private statusColors: { [key: string]: string } = {
    'Draft': '#B0BEC5',
    'Submitted': '#42A5F5',
    'Review': '#AB47BC',
    'Review In Progress': '#AB47BC',
    'Revisions Required': '#FF7043',
    'Revision Requested': '#FF7043',
    'In Progress': '#FFB300',
    'Approved': '#66BB6A',
    'Rejected': '#EF5350',
    'Closed': '#78909C',
    'Inactive': '#78909C',
    'Resolved': '#66BB6A',
    'Recalled': '#FFB300',
  };

  // Map status strings to numeric state IDs
  private statusToStateId: { [key: string]: number } = {
    'Draft': 1,
    'Submitted': 4,
    'Resolved': 5,
    'Inactive': 13,
    'Revision Requested': 14,
    'Review In Progress': 15,
    'Approved': 6,
    'Rejected': 7,
    'Closed': 8,
  };

  constructor(private http: HttpClient) {}

  /**
   * Get lifecycle data for a specific record
   * Fetches from API, falls back to dummy data on error
   */
  getLifecycleData(recordId: string): Observable<LifecycleData> {
    return this.fetchFromApi(recordId).pipe(
      catchError((error: HttpErrorResponse) => {
        console.warn('API call failed, using dummy data:', error.message);
        return of(this.getDummyData(recordId));
      })
    );
  }

  /**
   * Get available actions for a specific state
   * @param state The numeric state ID to get actions for
   * @returns Observable of available actions
   */
  getAvailableActions(state: number): Observable<ApiAvailableAction[]> {
    const url = `${this.API_BASE_URL}/available-actions/${state}`;
    return this.http.get<ApiAvailableActionsResponse>(url).pipe(
      map(response => response.actions),
      catchError((error: HttpErrorResponse) => {
        console.warn('Available actions API failed:', error.message);
        // Return mock data for testing
        return of(this.getMockAvailableActions(state));
      })
    );
  }

  /**
   * Get possible paths for a specific action
   * @param actionCode The action code to get paths for
   * @returns Observable of possible path statuses
   */
  getPossiblePaths(actionCode: string): Observable<ApiPossiblePathStatus[]> {
    const url = `${this.API_BASE_URL}/possible-paths/${actionCode}`;
    return this.http.get<ApiPossiblePathsResponse>(url).pipe(
      map(response => {
        // Transform the API response to match our internal format
        if (response.paths) {
          return [{
            status: response.paths.statusName,
            label: response.paths.statusName
          }];
        }
        return [];
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('Possible paths API failed:', error.message);
        // Return mock data for testing
        return of(this.getMockPossiblePaths(actionCode));
      })
    );
  }

  /**
   * Get route log data for a record
   * @param recordId The record ID
   * @returns Observable of route log data
   */
  getRouteLog(recordId: string): Observable<ApiRouteLogResponse> {
    const url = `${this.API_BASE_URL}/route-log/${recordId}`;
    return this.http.get<ApiRouteLogResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Route log API failed:', error.message);
        throw error;
      })
    );
  }

  /**
   * Get status code details for a specific workflow state
   * @param moduleItemKey The module item key (record ID)
   * @param statusCode The status code
   * @returns Observable of status code details
   */
  getStatusCodeDetails(moduleItemKey: string, statusCode: number): Observable<ApiStatusCodeDetailsResponse> {
    const url = `${this.API_BASE_URL}/get-status-code-details/${moduleItemKey}/${statusCode}`;
    return this.http.get<ApiStatusCodeDetailsResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Status code details API failed:', error.message);
        throw error;
      })
    );
  }

  /**
   * Get numeric state ID from status string
   * @param status The status string
   * @returns Numeric state ID, or 0 if not found
   */
  getStateIdFromStatus(status: string): number {
    return this.statusToStateId[status] || 0;
  }

  /**
   * Fetch lifecycle data from API
   * @param recordId The record ID to fetch
   * @returns Observable of lifecycle data from API
   */
  private fetchFromApi(recordId: string): Observable<LifecycleData> {
    return this.http.get<any>(`${this.API_BASE_URL}/details/${recordId}`).pipe(
      map(response => this.transformApiResponse(response))
    );
  }

  /**
   * Transform API response to LifecycleData format
   */
  private transformApiResponse(response: any): LifecycleData {
    // Handle new API schema
    if (response.nodes && response.edges && Array.isArray(response.nodes)) {
      return this.transformNewApiSchema(response as ApiLifecycleResponse);
    }
    
    // Handle legacy chronological history format
    if (response.history && Array.isArray(response.history)) {
      return this.processHistoryToLifecycleData(response.history);
    }
    
    // Default: use as-is
    return response as LifecycleData;
  }

  /**
   * Transform new API schema to internal LifecycleData format
   */
  private transformNewApiSchema(apiResponse: ApiLifecycleResponse): LifecycleData {
    const nodeMap = new Map<string, NodeData>();
    const actualEdges: EdgeData[] = [];
    const stateOrder = new Map<string, number>();

    // Sort nodes by timestamp to maintain chronological order
    const sortedNodes = [...apiResponse.nodes].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Create unique nodes (deduplicate by status)
    sortedNodes.forEach((apiNode, index) => {
      const stateId = this.stateToId(apiNode.status);
      
      // Track first occurrence order
      if (!stateOrder.has(stateId)) {
        stateOrder.set(stateId, stateOrder.size);
      }

      // Only create node if it doesn't exist yet
      if (!nodeMap.has(stateId)) {
        nodeMap.set(stateId, {
          id: stateId,
          label: apiNode.label,
          state: apiNode.status,
          stateId: apiNode.statusCode,
          statusCode: apiNode.statusCode, // Add statusCode for API calls
          actor: apiNode.owner || apiResponse.updateUser || 'System',
          date: this.formatDate(apiNode.timestamp),
          ribbonColor: this.getColorForStatus(apiNode.status),
          timestamp: apiNode.timestamp,
          owner: apiNode.owner
        });
      }
    });

    // Process actual edges from the edges array
    apiResponse.edges.forEach((apiEdge, index) => {
      const sourceId = this.stateToId(apiEdge.source);
      const targetId = this.stateToId(apiEdge.target);

      // Skip if source and target are the same
      if (sourceId === targetId) return;

      // Determine if this is a loopback
      const sourceOrder = stateOrder.get(sourceId) || 0;
      const targetOrder = stateOrder.get(targetId) || 0;
      const isLoopback = targetOrder < sourceOrder;

      // Find the corresponding node for timestamp
      const targetNode = sortedNodes.find(n => this.stateToId(n.status) === targetId);

      actualEdges.push({
        source: sourceId,
        target: targetId,
        type: 'actual',
        loopback: isLoopback,
        transitionDate: targetNode ? this.formatDate(targetNode.timestamp) : undefined
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: actualEdges
    };
  }

  /**
   * Format ISO date string to readable format
   */
  private formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Get color for a specific status
   */
  private getColorForStatus(status: string): string {
    // Try exact match first
    if (this.statusColors[status]) {
      return this.statusColors[status];
    }
    
    // Try partial match for similar statuses
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('draft')) return this.statusColors['Draft'];
    if (lowerStatus.includes('submit')) return this.statusColors['Submitted'];
    if (lowerStatus.includes('review')) return this.statusColors['Review'];
    if (lowerStatus.includes('revision')) return this.statusColors['Revisions Required'];
    if (lowerStatus.includes('progress')) return this.statusColors['In Progress'];
    if (lowerStatus.includes('approv')) return this.statusColors['Approved'];
    if (lowerStatus.includes('reject')) return this.statusColors['Rejected'];
    if (lowerStatus.includes('closed') || lowerStatus.includes('inactive')) return this.statusColors['Closed'];
    
    // Default color
    return '#B0BEC5';
  }

  /**
   * Process chronological history into deduplicated nodes and edges
   * @param history Array of history entries
   * @returns Processed lifecycle data
   */
  private processHistoryToLifecycleData(history: HistoryEntry[]): LifecycleData {
    const nodeMap = new Map<string, NodeData>();
    const edges: EdgeData[] = [];
    const stateOrder = new Map<string, number>();
    
    // Create unique nodes from history
    history.forEach((entry, index) => {
      const stateId = this.stateToId(entry.state);
      
      // Track first occurrence order
      if (!stateOrder.has(stateId)) {
        stateOrder.set(stateId, stateOrder.size);
      }
      
      // Only create node if it doesn't exist
      if (!nodeMap.has(stateId)) {
        nodeMap.set(stateId, {
          id: stateId,
          label: entry.state,
          state: entry.state,
          stateId: 0, // Legacy format doesn't have numeric state IDs
          actor: entry.actor,
          date: entry.timestamp,
          ribbonColor: this.statusColors[entry.state] || '#B0BEC5'
        });
      }
    });
    
    // Create edges from chronological sequence
    for (let i = 1; i < history.length; i++) {
      const sourceId = this.stateToId(history[i - 1].state);
      const targetId = this.stateToId(history[i].state);
      
      // Skip self-loops
      if (sourceId === targetId) continue;
      
      // Determine if this is a loopback (going back to an earlier node)
      const sourceOrder = stateOrder.get(sourceId) || 0;
      const targetOrder = stateOrder.get(targetId) || 0;
      const isLoopback = targetOrder < sourceOrder;
      
      edges.push({
        source: sourceId,
        target: targetId,
        type: 'actual',
        loopback: isLoopback,
        transitionDate: history[i].timestamp
      });
    }
    
    return {
      nodes: Array.from(nodeMap.values()),
      edges
    };
  }

  /**
   * Convert state name to node ID
   * @param state State name
   * @returns Node ID
   */
  private stateToId(state: string): string {
    return state.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * Get dummy lifecycle data for testing
   * @param recordId The record ID (not used in dummy data)
   * @returns Dummy lifecycle data
   */
  private getDummyData(recordId: string): LifecycleData {
    // Real API response structure for testing
    const apiResponse: ApiLifecycleResponse = {
      recordId: 52,
      title: "qwe",
      currentState: null,
      createTimeStamp: "2025-11-15T00:33:57.324Z",
      updateTimeStamp: "2025-11-15T00:40:00.262Z",
      updateUser: "admin",
      createUser: "admin",
      priority: "Normal",
      category: "Award",
      unitNumber: "000001",
      unitName: "Polus Solutions",
      nodes: [
        {
          id: "121",
          statusCode: 1,
          label: "Draft",
          status: "Draft",
          owner: null,
          timestamp: "2025-11-15T00:34:29.234Z",
          metadata: {
            durationInState: null,
            comments: null,
            revisionNumber: null,
            changeSummary: null,
            submissionMethod: null,
            assignedReviewer: null,
            notes: null,
            approvalLevel: null
          }
        },
        {
          id: "122",
          statusCode: 4,
          label: "Submitted",
          status: "Submitted",
          owner: null,
          timestamp: "2025-11-15T00:38:46.803Z",
          metadata: {
            durationInState: null,
            comments: null,
            revisionNumber: null,
            changeSummary: null,
            submissionMethod: null,
            assignedReviewer: null,
            notes: null,
            approvalLevel: null
          }
        },
        {
          id: "123",
          statusCode: 15,
          label: "Review In Progress",
          status: "Review In Progress",
          owner: null,
          timestamp: "2025-11-15T00:38:58.487Z",
          metadata: {
            durationInState: null,
            comments: null,
            revisionNumber: null,
            changeSummary: null,
            submissionMethod: null,
            assignedReviewer: null,
            notes: null,
            approvalLevel: null
          }
        },
        {
          id: "124",
          statusCode: 14,
          label: "Revision Requested",
          status: "Revision Requested",
          owner: null,
          timestamp: "2025-11-15T00:40:00.131Z",
          metadata: {
            durationInState: null,
            comments: null,
            revisionNumber: null,
            changeSummary: null,
            submissionMethod: null,
            assignedReviewer: null,
            notes: null,
            approvalLevel: null
          }
        },
        {
          id: "125",
          statusCode: 13,
          label: "Inactive",
          status: "Inactive",
          owner: null,
          timestamp: "2025-11-15T00:40:00.135Z",
          metadata: {
            durationInState: null,
            comments: null,
            revisionNumber: null,
            changeSummary: null,
            submissionMethod: null,
            assignedReviewer: null,
            notes: null,
            approvalLevel: null
          }
        },
        {
          id: "126",
          statusCode: 5,
          label: "Resolved",
          status: "Resolved",
          owner: null,
          timestamp: "2025-11-15T00:45:00.000Z",
          metadata: {
            durationInState: null,
            comments: null,
            revisionNumber: null,
            changeSummary: null,
            submissionMethod: null,
            assignedReviewer: null,
            notes: null,
            approvalLevel: null
          }
        }
      ],
      edges: [
        {
          id: "121",
          source: "Draft",
          target: "Submitted"
        },
        {
          id: "122",
          source: "Submitted",
          target: "Review In Progress"
        },
        {
          id: "123",
          source: "Review In Progress",
          target: "Revision Requested"
        },
        {
          id: "124",
          source: "Revision Requested",
          target: "Inactive"
        },
        {
          id: "125",
          source: "Inactive",
          target: "Resolved"
        }
      ]
    };

    // Transform the API response using the same logic as the real API call
    return this.transformNewApiSchema(apiResponse);
  }

  /**
   * Get mock available actions for testing
   */
  private getMockAvailableActions(state: number): ApiAvailableAction[] {
    // Map numeric state IDs to mock actions
    const mockActions: { [key: number]: ApiAvailableAction[] } = {
      5: [ // Resolved
        { actionCode: 'close', actionName: 'Close', nextStatus: 'Closed' },
        { actionCode: 'reopen', actionName: 'Reopen', nextStatus: 'Draft' }
      ],
      13: [ // Inactive
        { actionCode: 'reopen', actionName: 'Reopen', nextStatus: 'Draft' },
        { actionCode: 'archive', actionName: 'Archive' }
      ],
      14: [ // Revision Requested
        { actionCode: 'revise', actionName: 'Submit Revision', nextStatus: 'Submitted' },
        { actionCode: 'withdraw', actionName: 'Withdraw', nextStatus: 'Inactive' }
      ],
      15: [ // Review In Progress
        { actionCode: 'approve', actionName: 'Approve', nextStatus: 'Approved' },
        { actionCode: 'reject', actionName: 'Reject', nextStatus: 'Rejected' },
        { actionCode: 'request-revision', actionName: 'Request Revision', nextStatus: 'Revision Requested' }
      ],
      4: [ // Submitted
        { actionCode: 'start-review', actionName: 'Start Review', nextStatus: 'Review In Progress' },
        { actionCode: 'recall', actionName: 'Recall', nextStatus: 'Draft' }
      ],
      1: [ // Draft
        { actionCode: 'submit', actionName: 'Submit', nextStatus: 'Submitted' },
        { actionCode: 'cancel', actionName: 'Cancel', nextStatus: 'Inactive' }
      ]
    };

    return mockActions[state] || [];
  }

  /**
   * Get mock possible paths for testing
   */
  private getMockPossiblePaths(actionCode: string): ApiPossiblePathStatus[] {
    // Convert to string if it's a number
    const actionCodeStr = String(actionCode);
    
    const mockPaths: { [key: string]: ApiPossiblePathStatus[] } = {
      // String action codes
      'reopen': [
        { status: 'Draft', label: 'Draft' }
      ],
      'revise': [
        { status: 'Submitted', label: 'Submitted' }
      ],
      'withdraw': [
        { status: 'Inactive', label: 'Inactive' }
      ],
      'approve': [
        { status: 'Approved', label: 'Approved' }
      ],
      'reject': [
        { status: 'Rejected', label: 'Rejected' }
      ],
      'request-revision': [
        { status: 'Revision Requested', label: 'Revision Requested' }
      ],
      'start-review': [
        { status: 'Review In Progress', label: 'Review In Progress' }
      ],
      'recall': [
        { status: 'Draft', label: 'Draft' }
      ],
      'submit': [
        { status: 'Submitted', label: 'Submitted' }
      ],
      'cancel': [
        { status: 'Inactive', label: 'Inactive' }
      ],
      // Numeric action codes (examples - add more as needed)
      '24': [
        { status: 'Rejected', label: 'Rejected' }
      ],
      '25': [
        { status: 'Approved', label: 'Approved' }
      ],
      '26': [
        { status: 'Revision Requested', label: 'Revision Requested' }
      ],
      '27': [
        { status: 'Draft', label: 'Draft' }
      ]
    };

    return mockPaths[actionCodeStr] || [];
  }
}