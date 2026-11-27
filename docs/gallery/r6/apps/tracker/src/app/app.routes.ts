import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'triage' },
  { path: 'triage', title: 'Triage · Pigeonhole', loadComponent: () => import('./triage').then((m) => m.TriagePage) },
  { path: 'issues', title: 'Issues · Pigeonhole', loadComponent: () => import('./issues').then((m) => m.IssuesPage) },
  { path: 'issues/:num', title: 'Issue · Pigeonhole', loadComponent: () => import('./issue').then((m) => m.IssuePage) },
  { path: '**', redirectTo: 'triage' },
];
