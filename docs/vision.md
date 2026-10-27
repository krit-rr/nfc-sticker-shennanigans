# Vision

Physical stickers as external cues for brains that don't keep cues internally. Every feature should
answer: _what does the sticker's location make easier?_

## Principles

- **The cue lives in the world, not in the phone.** An alarm that ends at the bathroom mirror gets you to
  the mirror. A routine step anchored to the meds box gets you to the meds box.
- **Friction where you want it, none where you don't.** Stopping the alarm is hard on purpose. Starting a
  focus session is a single tap, no menus.
- **No shame loops.** Missed a step? The routine shows what's next, not what you failed. Nag mode is
  persistent, not punitive: it rings again, it does not lecture.
- **Visible progress.** "3/4 done · next: keys" beats a wall of checkboxes.
- **Works without the app for other people.** A business card sticker opens a web page on any phone.

## Feature map

| Feature                                                                                               | Sticker action  | Status                                                                                              |
| ----------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Get-out-of-bed alarm (must tap the sticker to stop; nag chain until then)                             | `alarm.dismiss` | domain done; AlarmKit scheduler wired; device validation TODO ([alarm strategy](alarm-strategy.md)) |
| Sleep-cycle times (sleepyti.me math): wake options when going to bed now, and bedtimes for each alarm | `alarm.dismiss` | domain done; Alarms screen shows both; bedtime nudge notification TODO                              |
| Routines: ordered or any-order steps, each bound to a sticker or manual                               | `routine.step`  | domain done; runs persist on device (expo-sqlite); routine editing TODO                             |
| Focus mode (Brick-style app blocking toggled at the desk sticker)                                     | `focus.toggle`  | action defined; Screen Time / Android blocking TODO                                                 |
| Timers ("just 10 minutes", pomodoro, body-doubling)                                                   | `timer.start`   | action defined                                                                                      |
| Event log (water, meds taken — with a double-dose guard)                                              | `log.event`     | action defined                                                                                      |
| Business cards: sticker on a paper card or on its own                                                 | `card.open`     | card page + vCard done; editing TODO                                                                |
| Write and register stickers from the phone                                                            | —               | in-app writer done (needs device); registry persists (expo-sqlite)                                  |

## Backlog of ideas

- "Leaving the house" sticker on the door: shows a checklist (keys, wallet, meds, charger) and logs the
  time you left; optional "did you lock it?" note.
- Meds box sticker: logs a dose, warns if the last one was under N hours ago, reminds if none by noon.
- Laptop sticker: starts a focus block and a visible countdown; tapping again ends it and logs what got done.
- Fridge "brain dump" sticker: opens a capture box that files into tomorrow's list.
- Shared household routines: the same sticker works for two phones (registry sync).
- Event badges: one sticker per attendee → card page; tap-to-exchange on the app.
- Kids' routine mode with big buttons and sounds.
