import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Chart, registerables } from 'chart.js';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
  Chart.register(...registerables);