import { Component } from '@angular/core';

export interface StatusItem {
  label: string;
  color: string;
  code: string;
}

@Component({
  selector: 'era-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css']
})
export class LegendComponent {
  statusItems: StatusItem[] = [
    { label: 'Draft', color: '#B0BEC5', code: '#B0BEC5' },
    { label: 'Submitted', color: '#42A5F5', code: '#42A5F5' },
    { label: 'Review', color: '#AB47BC', code: '#AB47BC' },
    { label: 'In Progress', color: '#FFB300', code: '#FFB300' },
    { label: 'Approved', color: '#66BB6A', code: '#66BB6A' },
    { label: 'Rejected', color: '#EF5350', code: '#EF5350' },
    { label: 'Closed', color: '#78909C', code: '#78909C' }
  ];
}
