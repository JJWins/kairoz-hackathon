import { Component, ViewChild } from '@angular/core';
import { TopBar } from './components/top-bar/top-bar';
import { WorkflowCanvas } from './components/workflow-canvas/workflow-canvas';
import { Legend } from './components/legend/legend';

@Component({
  selector: 'app-root',
  imports: [TopBar, WorkflowCanvas, Legend],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App {
  // ViewChild to access WorkflowCanvas methods
  @ViewChild(WorkflowCanvas) workflowCanvas?: WorkflowCanvas;

  // Record ID for the current workflow
  recordId = '3186';

  /**
   * Zoom in on the canvas
   * Can be called from TopBar or other components
   */
  zoomIn(): void {
    if (this.workflowCanvas) {
      this.workflowCanvas.zoomIn();
    }
  }

  /**
   * Zoom out on the canvas
   * Can be called from TopBar or other components
   */
  zoomOut(): void {
    if (this.workflowCanvas) {
      this.workflowCanvas.zoomOut();
    }
  }

  /**
   * Reset zoom to fit all nodes
   * Can be called from TopBar or other components
   */
  resetZoom(): void {
    if (this.workflowCanvas) {
      this.workflowCanvas.resetZoom();
    }
  }
}
