import { Injectable } from '@angular/core';
import { Issue } from '../domain/issue';
import { SEED_ISSUES } from './seed';

/** The port the store talks to. A real backend replaces the in-memory one; the store does not change. */
export abstract class IssueGateway {
  abstract fetchAll(): Promise<Issue[]>;
  abstract save(issue: Issue): Promise<void>;
}

export class GatewayError extends Error {}

const LATENCY_MS = 650; // simulated network time, not animation

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * In-memory stand-in for the server. Failures are reachable for real: going offline makes every call fail.
 * `?state=loading|error|empty` forces a list state for review.
 */
@Injectable()
export class InMemoryIssueGateway extends IssueGateway {
  private rows: Issue[] = SEED_ISSUES.map((issue) => ({ ...issue }));

  private forcedState(): string | null {
    return new URLSearchParams(location.search).get('state');
  }

  async fetchAll(): Promise<Issue[]> {
    await sleep(LATENCY_MS);
    const forced = this.forcedState();
    if (forced === 'loading') return new Promise<Issue[]>(() => undefined);
    if (forced === 'error' || !navigator.onLine) throw new GatewayError('offline');
    if (forced === 'empty') return [];
    return this.rows.map((issue) => ({ ...issue }));
  }

  async save(issue: Issue): Promise<void> {
    await sleep(LATENCY_MS / 4);
    if (!navigator.onLine) throw new GatewayError('offline');
    const index = this.rows.findIndex((row) => row.id === issue.id);
    if (index === -1) this.rows = [...this.rows, issue];
    else this.rows = this.rows.map((row) => (row.id === issue.id ? issue : row));
  }
}
