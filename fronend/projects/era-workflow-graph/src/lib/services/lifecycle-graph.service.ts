import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LifecycleGraphModel, NodeData, EdgeData } from '../models/lifecycle-graph.model';

@Injectable({
  providedIn: 'root'
})
export class LifecycleGraphService {

  /**
   * Get lifecycle data for a given record ID
   * @param recordId The record identifier
   * @param useMockData Whether to return mock data
   */
  getLifecycleData(recordId: string, useMockData: boolean = false): Observable<LifecycleGraphModel> {
    if (useMockData) {
      return of(this.generateMockData(recordId));
    }
    
    // In production, this would call an API
    // return this.http.get<LifecycleGraphModel>(`/api/lifecycle/${recordId}`);
    
    return of(this.generateMockData(recordId));
  }

  /**
   * Generate mock lifecycle data for demonstration
   */
  private generateMockData(recordId: string): LifecycleGraphModel {
    const nodes: NodeData[] = [
      {
        id: 'draft',
        label: 'Draft',
        state: 'Draft',
        actor: 'Dr. Sarah Chen',
        date: 'Jan 15, 2025',
        ribbonColor: '#B0BEC5',
        isFuture: false
      },
      {
        id: 'submitted',
        label: 'Submitted',
        state: 'Submitted',
        actor: 'Dr. Sarah Chen',
        date: 'Jan 18, 2025',
        ribbonColor: '#42A5F5',
        isFuture: false
      },
      {
        id: 'review',
        label: 'Review',
        state: 'Review',
        actor: 'Prof. Michael Brown',
        date: 'Jan 20, 2025',
        ribbonColor: '#AB47BC',
        isFuture: false
      },
      {
        id: 'in-progress',
        label: 'In Progress',
        state: 'In Progress',
        actor: 'Review Committee',
        date: 'Jan 24, 2025',
        ribbonColor: '#FFB300',
        isFuture: false
      },
      {
        id: 'approved',
        label: 'Approved',
        state: 'Approved',
        actor: 'Review Committee',
        date: 'Pending',
        ribbonColor: '#66BB6A',
        isFuture: true
      },
      {
        id: 'rejected',
        label: 'Rejected',
        state: 'Rejected',
        actor: 'Review Committee',
        date: 'Pending',
        ribbonColor: '#EF5350',
        isFuture: true
      }
    ];

    const edges: EdgeData[] = [
      { source: 'draft', target: 'submitted', type: 'actual' },
      { source: 'submitted', target: 'review', type: 'actual' },
      { source: 'review', target: 'in-progress', type: 'actual' },
      { source: 'in-progress', target: 'approved', type: 'possible' },
      { source: 'in-progress', target: 'rejected', type: 'possible' }
    ];

    return {
      id: recordId,
      currentState: 'in-progress',
      nodes,
      edges,
      history: [
        {
          id: 'trans-1',
          source: 'draft',
          target: 'submitted',
          type: 'actual',
          timestamp: '2025-01-18T10:00:00Z',
          actor: 'Dr. Sarah Chen'
        },
        {
          id: 'trans-2',
          source: 'submitted',
          target: 'review',
          type: 'actual',
          timestamp: '2025-01-20T14:30:00Z',
          actor: 'Prof. Michael Brown'
        },
        {
          id: 'trans-3',
          source: 'review',
          target: 'in-progress',
          type: 'actual',
          timestamp: '2025-01-24T09:15:00Z',
          actor: 'Review Committee'
        }
      ],
      possibleTransitions: [
        {
          id: 'poss-1',
          source: 'in-progress',
          target: 'approved',
          type: 'possible'
        },
        {
          id: 'poss-2',
          source: 'in-progress',
          target: 'rejected',
          type: 'possible'
        }
      ]
    };
  }
}
