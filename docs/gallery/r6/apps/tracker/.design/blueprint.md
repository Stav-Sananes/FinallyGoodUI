# Blueprint: Pigeonhole
Self-approved (autonomous). Navigation model default: left spine (3 destinations) + bottom nav on phone. Amended by the direction Skeleton (see decisions D-2).

## Screens
| Id | Route | Purpose |
|---|---|---|
| S1 Triage (landing, key screen) | /triage | queue of unassigned issues + the Desk (slip + case of six pigeonholes) |
| S2 Issues | /issues?q=&status=&owner= | every issue in a table; search, filter, sort in the URL |
| S3 Issue | /issues/:id | one issue in full: assign, priority, status, activity |
| S4 New issue | dialog on any screen (c) | title, details, area, priority |
| S5 Keys | dialog on any screen (?) | the keyboard map |

## Key flows
- F1 Triage the inbox: S1 -> j/k pick -> 1-6 assign (p to change priority) -> next slip arrives -> toast with undo (z) -> inbox clear.
- F2 Find and fix one issue: S2 search/filter -> open S3 -> change owner/priority/status.
- F3 Report an issue: c -> S4 -> lands first in the S1 queue.

## State matrix
| Screen | empty | loading | error | partial | full | no-permission |
|---|---|---|---|---|---|---|
| S1 | "Case sorted" stamp, case stays | skeleton rows + blank slip, case dimmed | "Can't reach Harbor" + Retry, case disabled | queue of 1 (last slip) | 7 unsorted | n/a (single team, no roles) |
| S2 | "No issues match" + clear filters | table loading row | error row + Retry | filtered subset | 13 rows | n/a |
| S3 | unknown id: "No such issue" + back | skeleton slip | error + Retry | n/a | slip + activity | n/a |
Forced by `?state=empty|loading|error` on S1, S2, S3 (S3 error also on an unknown id).
