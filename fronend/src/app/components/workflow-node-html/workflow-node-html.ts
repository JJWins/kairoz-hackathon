import { Component } from '@angular/core';

export interface NodeData {
  id: string;
  state: string;
  actor: string;
  date: string;
  color?: string;
}

@Component({
  selector: 'app-workflow-node-html',
  imports: [],
  templateUrl: './workflow-node-html.html',
  styleUrl: './workflow-node-html.scss',
  standalone: true,
})
export class WorkflowNodeHtml {
  /**
   * Status color mapping based on the Figma design
   */
  private statusColors: { [key: string]: string } = {
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
   * @returns HTML string for the node
   */
  getNodeHtml(data: NodeData, expanded: boolean = false): string {
    const color = data.color || this.statusColors[data.state] || '#B0BEC5';
    
    if (expanded) {
      return this.getExpandedNodeHtml(data, color);
    }
    
    return `
      <div class="workflow-node-card" data-node-id="${data.id}">
        <div class="node-ribbon" style="background-color: ${color};"></div>
        <div class="node-content">
          <div class="node-state">${data.state}</div>
          <div class="node-actor">${data.actor}</div>
          <div class="node-date">${data.date}</div>
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
      <div class="workflow-node-card workflow-node-card-expanded" data-node-id="${data.id}">
        <div class="node-ribbon" style="background-color: ${color};"></div>
        <div class="node-content node-content-expanded">
          <div class="node-state-expanded">${data.state}</div>
          <div class="node-metadata">
            <div class="metadata-row">
              <span class="metadata-label">Owner:</span>
              <span class="metadata-value">${data.actor}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Date:</span>
              <span class="metadata-value">${data.date}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">ID:</span>
              <span class="metadata-value">${data.id}</span>
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
   * Generates HTML for multiple nodes
   */
  getNodesHtml(nodes: NodeData[]): string {
    return nodes.map(node => this.getNodeHtml(node)).join('');
  }
}

