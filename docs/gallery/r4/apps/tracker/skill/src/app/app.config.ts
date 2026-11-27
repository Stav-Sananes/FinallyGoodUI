import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { IssueGateway, InMemoryIssueGateway } from './data/issue-gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: IssueGateway, useClass: InMemoryIssueGateway },
  ],
};
