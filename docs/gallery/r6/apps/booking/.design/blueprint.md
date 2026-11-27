# Blueprint: Pawprint
status: approved (self-approved, autonomous)

## IA and navigation
3 destinations: Book (landing), Services, Visits. Phone: bottom tab bar (ia-nav.nav-model-by-count, visible-destinations). Desktop: same three as a top row inside the column header. State in URL hash (#/book?day=...&service=...) (ia-nav.url-as-state).

## Key flows
F1 Book a groom: Book -> pick service/dog (select) -> pick day (tabs) -> tap an opening on the tape (towel slides there) -> "Book 10:30" -> details (owner, phone, notes, nervous toggle) -> confirm -> ticket (record-card) + toast.
F2 See / cancel a visit: Visits -> record-row -> "Cancel visit" -> dialog -> toast with Undo.
F3 Compare services: Services -> record-row list -> "Book this" sets service and goes to Book.

## Screens
S1 book (landing) · S2 details (step 2 of 2 of the booking) · S3 ticket (confirmation) · S4 services · S5 visits

## State matrix
| Screen | empty | loading | error | partial | full | no-permission |
|---|---|---|---|---|---|---|
| book | no openings that day: says next opening, button jumps there | skeleton tape, 3 lanes of grey bars | "Couldn't load openings" + Retry, keeps picks | n/a | tape with openings | n/a |
| details | n/a | button busy while saving | save failed inline + retry, typed input kept | n/a | form | n/a |
| ticket | n/a | n/a | n/a | n/a | ticket | n/a |
| services | n/a (static) | skeleton rows | error + retry | n/a | 8 rows | n/a |
| visits | "No visits yet" + button to Book | skeleton rows | error + retry | n/a | upcoming + past | n/a |
Forced via ?state=empty|loading|error on #/book, #/visits, #/services.
