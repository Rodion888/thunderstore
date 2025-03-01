import { provideAppInitializer } from '@angular/core';

export async function configInitializer(): Promise<void> {
  try {
    const response = await fetch('/assets/env.js');
    const script = await response.text();
    eval(script);
  } catch {
    console.warn('Failed to load env.js, using default config.');
  }
}

export const CONFIG_INITIALIZER = provideAppInitializer(configInitializer);
