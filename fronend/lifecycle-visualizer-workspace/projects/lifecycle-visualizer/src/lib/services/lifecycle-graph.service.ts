import { Injectable } from '@angular/core';

export interface Transition {
  from: string;
  to: string;
  timestamp?: string;
  actor?: string;
  description?: string;
}

export interface LifecycleGraphModel {
  states: {
    id: string;
    label: string;
    statusColor: string;
  }[];
  
  history: Transition[];

  possibleTransitions?: {
    from: string;
    to: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class LifecycleGraphService {

  getMockGraph(): LifecycleGraphModel {
    return {
      states: [
        { id: 'draft', label: 'Draft', statusColor: '#B0BEC5' },
        { id: 'submitted', label: 'Submitted', statusColor: '#42A5F5' },
        { id: 'review', label: 'Review', statusColor: '#AB47BC' },
        { id: 'inprogress', label: 'In Progress', statusColor: '#FFA726' },
        { id: 'approved', label: 'Approved', statusColor: '#66BB6A' },
        { id: 'rejected', label: 'Rejected', statusColor: '#EF5350' }
      ],
      history: [
        { from: 'draft', to: 'submitted', timestamp: 'Jan 15, 2025', actor: 'Dr. Sarah Chen' },
        { from: 'submitted', to: 'review', timestamp: 'Jan 18, 2025', actor: 'System' },
        { from: 'review', to: 'draft', timestamp: 'Jan 19, 2025', actor: 'Prof. Michael Brown', description: 'Requires revisions' },
        { from: 'draft', to: 'submitted', timestamp: 'Jan 20, 2025', actor: 'Dr. Sarah Chen' },
        { from: 'submitted', to: 'review', timestamp: 'Jan 21, 2025', actor: 'System' },
        { from: 'review', to: 'inprogress', timestamp: 'Jan 24, 2025', actor: 'Review Committee' },
        { from: 'inprogress', to: 'review', timestamp: 'Jan 26, 2025', actor: 'Review Committee', description: 'Additional review needed' },
        { from: 'review', to: 'approved', timestamp: 'Jan 28, 2025', actor: 'Review Committee' }
      ],
      possibleTransitions: [
        { from: 'approved', to: 'inprogress' },
        { from: 'review', to: 'rejected' }
      ]
    };
  }

  buildCytoscapeElements(model: LifecycleGraphModel): any[] {
    const elements: any[] = [];
    const visitedNodes = new Set<string>();

    // Add nodes
    model.states.forEach(state => {
      elements.push({
        group: 'nodes',
        data: {
          id: state.id,
          label: state.label,
          raw: {
            id: state.id,
            label: state.label,
            statusColor: state.statusColor
          }
        }
      });
    });

    // Add history edges with loopback detection
    model.history.forEach((transition, index) => {
      const isLoopback = visitedNodes.has(transition.to);
      
      visitedNodes.add(transition.from);
      visitedNodes.add(transition.to);

      elements.push({
        group: 'edges',
        data: {
          id: `e-history-${index}`,
          source: transition.from,
          target: transition.to,
          loopback: isLoopback ? 'true' : 'false',
          isPossible: 'false',
          timestamp: transition.timestamp,
          actor: transition.actor,
          description: transition.description
        }
      });
    });

    // Add possible transition edges (dashed)
    if (model.possibleTransitions) {
      model.possibleTransitions.forEach((transition, index) => {
        elements.push({
          group: 'edges',
          data: {
            id: `e-possible-${index}`,
            source: transition.from,
            target: transition.to,
            loopback: 'false',
            isPossible: 'true'
          }
        });
      });
    }

    return elements;
  }
}
