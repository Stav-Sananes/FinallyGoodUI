# Blueprint: Tailwag Grooming booking
status: approved (self-approved, autonomous) · 2026-11-22

## IA
Objects: Dog (name, breed, size S/M/L), Service (10; price and minutes per size), Slot (day, start, minutes), Visit (dog, service, slot, status upcoming/past/cancelled).
Tasks: 1 book (weekly-ish), 2 rebook, 3 view/cancel.
Mental model: "Juno needs a full groom; how long will it take and when can I drop her off?" So price and length follow the dog's size and show before the time is picked.

## Navigation (D1)
2 destinations, phone-first, linear flow: tab bar `Book | Visits` on phone (≥768px: top bar). Inside steps 2-3 the tab bar hides and a back + progress header shows (flows-forms.one-thing-per-page).

## Key flow: book
1. Who and what (`#/book`): pick dog, pick service. Price and length update live. Primary: "Choose a time".
2. When (`#/book/when`): 7-day strip (Sunday closed), slot grid for the day, sized to the service length. Primary: "Review".
3. Review (`#/book/review`): owner name, mobile, notes, nervous-with-clippers, text reminder, price. Primary: "Book Juno in".
4. Done (`#/book/done`): ticket with the booking; "Add to calendar" is not offered (no honest implementation); "See my visits".
Error paths: slot taken at confirm (back to step 2, slot removed, message), slot load failure (retry), field validation, offline.
Rebook: from a past visit prefill dog + service, land on step 2.

## Screens and state matrix
| Screen | empty | loading | error | partial / other | full |
|---|---|---|---|---|---|
| book-who | no dogs: add dog form (inline) | n/a (local data) | n/a | no service picked: primary disabled with reason | dogs + 10 services |
| book-when | Sunday closed; no slot fits (suggest next day) | skeleton grid 700ms | Saturday load fails once, retry button; offline banner | day has few slots | grid |
| book-review | n/a | button busy while booking | field errors; slot-taken conflict | | summary + form |
| book-done | n/a | n/a | n/a | | ticket |
| visits | no upcoming (offer to book), no past | skeleton cards | cannot load once? (n/a local) | | upcoming + past tabs |
Cancel: confirm dialog (D2: confirm not undo, because late cancellation has a fee), toast after.

## Motion spatial map
Steps move forward (enter from trailing edge, 12px, opacity), back reverses; tabs cross-fade; dialog from centre lift; toast from bottom. Expressive moments (max 3): 1 stamp on the confirmation ticket, 2 tennis-ball selected slot pop (≤150ms feedback), 3 ticket tear-off when cancelling is NOT animated (consequential).
Reduced motion: opacity only.
