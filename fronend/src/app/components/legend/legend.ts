import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatusItem {
  label: string;
  color: string;
  code: string;
}

@Component({
  selector: 'app-legend',
  imports: [CommonModule],
  templateUrl: './legend.html',
  styleUrl: './legend.scss',
  standalone: true,
})
export class Legend {
  /**
   * Status legend items with colors matching the Figma design
   */
  statusItems: StatusItem[] = [
    { label: 'Draft', color: '#B0BEC5', code: '#B0BEC5' },
    { label: 'Submitted', color: '#42A5F5', code: '#42A5F5' },
    { label: 'Review', color: '#AB47BC', code: '#AB47BC' },
    { label: 'In Progress', color: '#FFB300', code: '#FFB300' },
    { label: 'Approved', color: '#66BB6A', code: '#66BB6A' },
    { label: 'Rejected', color: '#EF5350', code: '#EF5350' },
    { label: 'Revisions', color: '#FF7043', code: '#FF7043' },
    { label: 'Closed', color: '#78909C', code: '#78909C' }
  ];
}

