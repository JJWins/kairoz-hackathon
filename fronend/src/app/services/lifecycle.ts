import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface NodeData {
  id: string;
  label: string;
  actor: string;
  date: string;
  ribbonColor: string;
  state: string;
}

export interface EdgeData {
  source: string;
  target: string;
  type: 'actual' | 'possible';
  loopback?: boolean;
  transitionDate?: string;
}

export interface LifecycleData {
  nodes: NodeData[];
  edges: EdgeData[];
}

@Injectable({
  providedIn: 'root',
})
export class Lifecycle {
  /**
   * Get lifecycle data for a specific record
   * @param recordId The record ID to fetch lifecycle data for
   * @returns Observable of lifecycle data
   */
  getLifecycleData(recordId: string): Observable<LifecycleData> {
    // Complex mock data demonstrating loops, backtracks, and repeated transitions
    // Simulating a realistic research workflow with multiple review cycles
    
    const mockData: LifecycleData = {
      nodes: [
        {
          id: 'draft',
          label: 'Draft',
          state: 'Draft',
          actor: 'Dr. Sarah Chen',
          date: 'Jan 10, 2025',
          ribbonColor: '#B0BEC5'
        },
        {
          id: 'submitted',
          label: 'Submitted',
          state: 'Submitted',
          actor: 'Dr. Sarah Chen',
          date: 'Jan 12, 2025',
          ribbonColor: '#42A5F5'
        },
        {
          id: 'review',
          label: 'Review',
          state: 'Review',
          actor: 'Prof. Michael Brown',
          date: 'Jan 14, 2025',
          ribbonColor: '#AB47BC'
        },
        {
          id: 'in-progress',
          label: 'In Progress',
          state: 'In Progress',
          actor: 'Review Committee',
          date: 'Jan 22, 2025',
          ribbonColor: '#FFB300'
        },
        {
          id: 'approved',
          label: 'Approved',
          state: 'Approved',
          actor: 'Review Committee',
          date: 'Feb 2, 2025',
          ribbonColor: '#66BB6A'
        },
        {
          id: 'rejected',
          label: 'Rejected',
          state: 'Rejected',
          actor: 'Review Committee',
          date: 'Pending',
          ribbonColor: '#EF5350'
        },
        {
          id: 'revisions',
          label: 'Revisions Required',
          state: 'Revisions Required',
          actor: 'Review Committee',
          date: 'Pending',
          ribbonColor: '#FF7043'
        }
      ],
      edges: [
        // ACTUAL HISTORY with loops and backtracks
        // First submission cycle
        { 
          source: 'draft', 
          target: 'submitted', 
          type: 'actual',
          transitionDate: 'Jan 12, 2025'
        },
        { 
          source: 'submitted', 
          target: 'review', 
          type: 'actual',
          transitionDate: 'Jan 14, 2025'
        },
        
        // First loopback - Review sends back to Draft for revisions
        { 
          source: 'review', 
          target: 'draft', 
          type: 'actual',
          loopback: true,
          transitionDate: 'Jan 15, 2025'
        },
        
        // Second submission cycle (repeat)
        { 
          source: 'draft', 
          target: 'submitted', 
          type: 'actual',
          transitionDate: 'Jan 16, 2025'
        },
        { 
          source: 'submitted', 
          target: 'review', 
          type: 'actual',
          transitionDate: 'Jan 18, 2025'
        },
        
        // Moves to In Progress
        { 
          source: 'review', 
          target: 'in-progress', 
          type: 'actual',
          transitionDate: 'Jan 22, 2025'
        },
        
        // Second loopback - In Progress sends back to Review for clarification
        { 
          source: 'in-progress', 
          target: 'review', 
          type: 'actual',
          loopback: true,
          transitionDate: 'Jan 25, 2025'
        },
        
        // Third review cycle - back to In Progress
        { 
          source: 'review', 
          target: 'in-progress', 
          type: 'actual',
          transitionDate: 'Jan 28, 2025'
        },
        
        // Final approval
        { 
          source: 'in-progress', 
          target: 'approved', 
          type: 'actual',
          transitionDate: 'Feb 2, 2025'
        },
        
        // POSSIBLE TRANSITIONS showing alternative paths
        // From Review state
        { 
          source: 'review', 
          target: 'rejected', 
          type: 'possible'
        },
        { 
          source: 'review', 
          target: 'revisions', 
          type: 'possible'
        },
        
        // From Revisions back to workflow
        { 
          source: 'revisions', 
          target: 'draft', 
          type: 'possible'
        },
        { 
          source: 'revisions', 
          target: 'submitted', 
          type: 'possible'
        },
        
        // From In Progress
        { 
          source: 'in-progress', 
          target: 'rejected', 
          type: 'possible'
        }
      ]
    };

    return of(mockData);
  }
}

