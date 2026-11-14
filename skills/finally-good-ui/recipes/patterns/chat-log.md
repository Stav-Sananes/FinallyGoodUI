# Pattern: chat-log

**Intent:** a conversation (support chat, team thread, AI assistant) follows new messages only while the reader is at the end, keeps their place when they scroll back, offers a way back to the latest, and has a composer that behaves the way people expect from chat apps.

**Cards:** usability.system-status · usability.user-control-undo · states.loading-perceived · states.error-recovery · a11y.keyboard-complete · motion.frequency-budget

**When NOT to use:** an activity feed newest-first at the top (a list, no pinning); a comment thread under a document (ordinary page flow); a log viewer with thousands of lines per minute (virtualise, and follow only on request).

**Tokens:** `--duration-short` (150, message in) · `--ease-enter` · `--space-*` · `--color-muted` (others' bubbles) · `--color-primary` (own bubbles, sparingly)

## Structure
```html
<section class="chat" aria-label="Conversation with Support">
  <div class="chat-log" role="log" aria-live="polite" aria-relevant="additions">
    <article class="msg" data-from="them" aria-labelledby="m1-who">…</article>
  </div>
  <button class="chat-jump" hidden>Jump to latest <span class="chat-jump-count"></span></button>
  <form class="chat-composer">
    <label for="composer" class="visually-hidden">Message</label>
    <textarea id="composer" rows="1" enterkeyhint="send"></textarea>
    <button type="submit">Send</button>
  </form>
</section>
```
```css
.chat { display: grid; grid-template-rows: 1fr auto; height: 100dvh; }
.chat-log { overflow: auto; overscroll-behavior: contain; padding: var(--space-4); }
.msg { animation: msg-in var(--duration-short) var(--ease-enter); }
@keyframes msg-in { from { opacity: 0; translate: 0 8px; } }
.msg[data-history] { animation: none; }               /* loaded history appears, it doesn't arrive */
.chat-composer textarea { field-sizing: content; max-height: 40dvh; resize: none; } /* grows with the text where supported */
@media (prefers-reduced-motion: reduce) { .msg { animation: none; } }
```
Add `interactive-widget=resizes-content` to the viewport meta tag so the on-screen keyboard shrinks the layout and the composer stays above it (Chromium); in Safari, listen to `visualViewport` `resize` and set the chat's height from `visualViewport.height`.

## Follow only at the end
```js
const AT_END_PX = 48; // "close enough" to the bottom to keep following
export function stickToBottom(log, jump) {
  let following = true, unseen = 0;
  const atEnd = () => log.scrollHeight - log.scrollTop - log.clientHeight <= AT_END_PX;
  const toEnd = () => { log.scrollTop = log.scrollHeight; unseen = 0; jump.hidden = true; };
  log.addEventListener("scroll", () => { following = atEnd(); if (following) { unseen = 0; jump.hidden = true; } });
  jump.addEventListener("click", () => { toEnd(); log.lastElementChild?.focus?.(); });
  new MutationObserver((records) => {
    const added = records.reduce((n, r) => n + [...r.addedNodes].filter((x) => x.nodeType === 1).length, 0);
    if (following) return toEnd();
    unseen += added;
    if (added) { jump.hidden = false; jump.querySelector(".chat-jump-count").textContent = `(${unseen} new)`; }
  }).observe(log, { childList: true, subtree: true, characterData: true });
  toEnd();
}
```
- Streaming replies (AI) grow the last message in place: the observer's `characterData` keeps following while the reader is at the end, and stops the moment they scroll up.
- Loading older messages at the top: note `scrollHeight` before inserting, then add the difference to `scrollTop`, so the message they were reading doesn't move. Mark those messages `data-history`.

## Composer keys
| Key | Does |
|---|---|
| Enter | send (ignored while `event.isComposing`, so IME users can confirm characters) |
| Shift+Enter | new line |
| ↑ in an empty composer | edit or recall your last message |
| Escape while editing | cancel the edit |
On a touch keyboard Enter inserts a new line and the Send button sends; `enterkeyhint="send"` labels the key.

## States
| State | Shows |
|---|---|
| sending | own message at once, faded, "Sending…" (states.optimistic-feedback) |
| failed | message stays, "Not sent. Retry" with the text kept |
| AI reply streaming | a "Stop" button replaces Send; `aria-busy="true"` on the last message until it finishes, so screen readers read it once, complete |
| empty conversation | what to ask, with two or three example prompts as buttons |
| other side typing | a quiet indicator, not announced |

## A11y
- `role="log"` announces new messages politely; don't also announce each streamed token.
- Each message has its author and time in text, not only by bubble side or colour.
- The jump button is a real button; after jumping, focus moves to the latest message (give messages `tabindex="-1"`).

## Upgrade trigger
Thousands of messages: virtualise the log (TanStack Virtual) and keep the follow logic on the scroller. Mentions with `@` and `/` commands in the composer need a combobox at the caret (menu-select-combobox).
