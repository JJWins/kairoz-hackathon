import { Component } from '@angular/core';

export interface NodeData {
  id: string;
  label: string;
  actor?: string;
  timestamp?: string;
  statusColor?: string;
  description?: string;
}

@Component({
  selector: 'lv-workflow-node-html',
  templateUrl: './workflow-node-html.component.html',
  styleUrls: ['./workflow-node-html.component.scss']
})
export class WorkflowNodeHtmlComponent {
  
  getSmallNodeHtml(data: NodeData): string {
    const statusColor = data.statusColor || '#e5e7eb';
    const label = this.escapeHtml(data.label || '');
    const actor = this.escapeHtml(data.actor || '—');
    const timestamp = this.escapeHtml(data.timestamp || '');

    return `
      <div class="lv-node-card">
        <div class="lv-ribbon" style="background-color: ${statusColor};"></div>
        <div class="lv-node-content">
          <div class="lv-node-title">${label}</div>
          <div class="lv-node-meta">${actor}</div>
          <div class="lv-node-date">${timestamp}</div>
        </div>
      </div>
    `;
  }

  getExpandedNodeHtml(data: NodeData): string {
    const statusColor = data.statusColor || '#e5e7eb';
    const label = this.escapeHtml(data.label || '');
    const actor = this.escapeHtml(data.actor || '—');
    const timestamp = this.escapeHtml(data.timestamp || '');
    const description = this.escapeHtml(data.description || 'No additional details');

    return `
      <div class="lv-node-card lv-expanded">
        <div class="lv-ribbon" style="background-color: ${statusColor};"></div>
        <div class="lv-node-content">
          <div class="lv-node-title">${label}</div>
          <div class="lv-node-meta">Owner: ${actor}</div>
          <div class="lv-node-date">Updated: ${timestamp}</div>
          <div class="lv-expanded-section">
            ${description}
          </div>
        </div>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
