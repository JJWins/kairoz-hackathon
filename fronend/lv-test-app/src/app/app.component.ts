import { Component } from '@angular/core';
import { LifecycleGraphModel } from 'lifecycle-visualizer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'lv-test-app';

  // Option 1: Use mock data
  useMock = true;

  // Option 2: Provide real data
  lifecycleData: LifecycleGraphModel = {
    states: [
      { id: 'draft', label: 'Draft', statusColor: '#94a3b8' },
      { id: 'review', label: 'Under Review', statusColor: '#3b82f6' },
      { id: 'approved', label: 'Approved', statusColor: '#10b981' }
    ],
    history: [
      {
        from: 'draft',
        to: 'review',
        timestamp: '2025-11-14T10:00:00Z',
        actor: 'John Doe',
        description: 'Submitted for review'
      },
      {
        from: 'review',
        to: 'approved',
        timestamp: '2025-11-14T11:00:00Z',
        actor: 'Jane Smith',
        description: 'Approved after review'
      }
    ],
    possibleTransitions: [
      { from: 'draft', to: 'review' },
      { from: 'review', to: 'approved' },
      { from: 'review', to: 'draft' }
    ]
  };

  onNodeSelected(event: any): void {
    console.log('Node clicked:', event);
    console.log('Node ID:', event.id);
    console.log('Node data:', event.data);
  }
}
