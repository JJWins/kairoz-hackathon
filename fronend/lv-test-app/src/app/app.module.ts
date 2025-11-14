import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LifecycleVisualizerModule } from 'lifecycle-visualizer';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LifecycleVisualizerModule  // ✅ Import the library module
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }