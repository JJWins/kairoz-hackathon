import { Component } from '@angular/core';
import { LucideAngularModule, Search, Filter, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-top-bar',
  imports: [LucideAngularModule],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
  standalone: true,
})
export class TopBar {
  // Icons
  readonly Search = Search;
  readonly Filter = Filter;
  readonly RefreshCw = RefreshCw;

  // Data properties
  recordId = 'REC-2025-001847';
  recordTitle = 'Machine Learning for Cancer Detection Research Proposal';
  status = 'In Progress';
  statusColor = '#FFB300';

  // Event handlers
  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    console.log('Search:', target.value);
  }

  onFilter(): void {
    console.log('Filter clicked');
  }

  onRefresh(): void {
    console.log('Refresh clicked');
  }
}
