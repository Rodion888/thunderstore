import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

fetch('/assets/env.js')
  .then(response => response.text())
  .then(text => {
    eval(text);
    bootstrapApplication(AppComponent, appConfig).catch(err => console.error('error to run app', err));
  })
  .catch(err => {
    console.error('error to run env.js:', err);
    bootstrapApplication(AppComponent, appConfig).catch(err => console.error('error to run app', err));
  });
