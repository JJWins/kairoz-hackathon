import { Component, EventEmitter, Output } from '@angular/core';
import { LucideAngularModule, ZoomIn, ZoomOut, Maximize2 } from 'lucide-angular';

@Component({
  selector: 'app-controls',
  imports: [LucideAngularModule],
  templateUrl: './controls.html',
  styleUrl: './controls.scss',
  standalone: true,
})
export class Controls {
  // Icons
  readonly ZoomIn = ZoomIn;
  readonly ZoomOut = ZoomOut;
  readonly Maximize2 = Maximize2;

  // Outputs for control actions
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

