// import { Injectable, signal } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class ThemeService {
//   theme = signal<'light' | 'dark'>(this.detectTheme());

//   constructor() {
//     this.applyTheme();
//   }

//   setTheme(theme: 'light' | 'dark') {
//     this.theme.set(theme);
//     document.documentElement.setAttribute('data-theme', theme);
//     localStorage.setItem('theme', theme);
//   }

//   toggleTheme() {
//     const newTheme = this.theme() === 'light' ? 'dark' : 'light';
//     this.setTheme(newTheme);
//   }

//   private detectTheme(): 'light' | 'dark' {
//     const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
//     if (savedTheme) return savedTheme;

//     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//     return prefersDark ? 'dark' : 'light';
//   }

//   private applyTheme() {
//     document.documentElement.setAttribute('data-theme', this.theme());
//   }
// }
