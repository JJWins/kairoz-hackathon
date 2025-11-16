import { Injectable } from '@angular/core';
import { NodeData, StatusColors } from '../../models/lifecycle-graph.model';

@Injectable({
  providedIn: 'root'
})
export class WorkflowNodeHtmlService {
  /**
   * Status color mapping based on common workflow states
   */
  private statusColors: StatusColors = {
    'Draft': '#B0BEC5',
    'Submitted': '#42A5F5',
    'Review': '#AB47BC',
    'In Progress': '#FFB300',
    'Approved': '#66BB6A',
    'Rejected': '#EF5350',
    'Closed': '#78909C',
  };

  /**
   * Generates HTML string for a workflow node card
   * @param data Node data containing state, actor, and date
   * @param expanded Whether to show expanded version with more details
   * @returns HTML string for the node
   */
  getNodeHtml(data: NodeData, expanded: boolean = false): string {
    const color = data.ribbonColor || this.statusColors[data.state] || '#B0BEC5';
    
    if (expanded) {
      return this.getExpandedNodeHtml(data, color);
    }
    
    return `
      <div class="era-workflow-node-card" data-node-id="${data.id}">
        <div class="era-node-ribbon" style="background-color: ${color};"></div>
        <div class="era-node-content">
          <div class="era-node-state">${data.state}</div>
          <div class="era-node-actor">${data.actor}</div>
          <div class="era-node-date">${data.date}</div>
        </div>
      </div>
    `;
  }

  /**
   * Generates expanded HTML string for a workflow node card with more details
   * @param data Node data containing state, actor, and date
   * @param color Ribbon color
   * @returns HTML string for the expanded node
   */
  private getExpandedNodeHtml(data: NodeData, color: string): string {
    return `
      <div class="era-workflow-node-card era-workflow-node-card-expanded" data-node-id="${data.id}">
        <div class="era-node-ribbon" style="background-color: ${color};"></div>
        <div class="era-node-content era-node-content-expanded">
          <div class="era-node-state-expanded">${data.state}</div>
          <div class="era-node-metadata">
            <div class="era-metadata-row">
              <span class="era-metadata-label">Owner:</span>
              <span class="era-metadata-value">${data.actor}</span>
            </div>
            <div class="era-metadata-row">
              <span class="era-metadata-label">Date:</span>
              <span class="era-metadata-value">${data.date}</span>
            </div>
            <div class="era-metadata-row">
              <span class="era-metadata-label">ID:</span>
              <span class="era-metadata-value">${data.id}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gets the color for a specific status
   */
  getStatusColor(status: string): string {
    return this.statusColors[status] || '#B0BEC5';
  }

  /**
   * Sets custom status colors
   */
  setStatusColors(colors: StatusColors): void {
    this.statusColors = { ...this.statusColors, ...colors };
  }
}
