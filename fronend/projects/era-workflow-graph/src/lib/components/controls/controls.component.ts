import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'era-controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css']
})
export class ControlsComponent {
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() fit = new EventEmitter<void>();

  onZoomIn(): void {
    this.zoomIn.emit();
  }

  onZoomOut(): void {
    this.zoomOut.emit();
  }

  onFit(): void {
    this.fit.emit();
  }
}
