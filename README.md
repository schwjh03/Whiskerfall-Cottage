# Whiskerfall Cottage

A browser RPG connecting a quiet cottage, woodland encounters, an overgrown city,
and changing bullet-dodge battles. Built with JavaScript, HTML, CSS, and Canvas.

## Play

[Play Whiskerfall in your browser](https://schwjh03.github.io/Whiskerfall-Cottage/).

The game needs a modern browser. There is no account, installer, or backend.
Progress and personal bests stay in the browser used to play.

To run the source locally, start a static web server in this folder. For example,
with Python installed:

```sh
python -m http.server 4175 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4175/`. Serve the project root, rather than the assets
folder. Moving to a different website origin creates a separate browser save.

## What's in the game

- A cottage, basement, Cedar Path, Briarway, and Verdant Crossing.
- Duchess Nyx and Briarhart in the story, plus Orrery in separate practice.
- 48 named guardian attacks, including 27 sequences that change movement rules.
- Free dodging, platform jumping, and orbital steering with matching controls.
- Four difficulty settings and individual attack or movement practice.
- Woodland encounters with XP and equipment; fighting and sparing give equal rewards.
- A quest journal with one-time rewards and a Trailwarden Charm.
- Walking and idle animations, dialogue, local saves, and a connected return route.

## Counterplay

Near misses earn resonance. Spend **40 resonance** on a timed **Q parry**, or save
**100 resonance** for an **E pulse** that clears nearby threats. The parry window
lasts 0.55 seconds and has a cooldown; a missed parry still spends its resonance.

A successful parry prevents that hit and earns a counter charge, up to three.
The next FIGHT gains 15% damage per charge, or the next ACT gains 4 additional
mercy per charge. The charge is spent by either action. These are two different
ways to turn defense into progress, including on the mercy route.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Move or select a menu action |
| Z / Enter | Interact, confirm, or time a strike |
| X | Back |
| Shift | Precision movement |
| Space | Dash; jump when the arena uses gravity |
| Q | Timed parry |
| E | Resonance pulse |
| P | Pause |
| R | Retry after defeat; confirm a new adventure elsewhere |

Touch controls are included. Controls update when an attack changes movement.
Pausing freezes combat simulation. Boss practice keeps story progression and
restores story resources afterward.

## Development and tests

Use a recent Node.js release to run the tests; no package installation is needed:

```sh
node --test tests/*.test.mjs
```

Tests cover attack lifecycles, movement changes, collision warnings, parries,
counter charges, quest rewards, save validation, practice isolation, and room
transitions. Browser checks are also needed to verify the live visual presentation.

### Source map

- `game.js`: input, rooms, interaction, and frame loop.
- `battle.js`: encounter state, actions, damage, and battle presentation.
- `combat-dynamics.js`: timed parry, counters, and quest journal.
- `bosses.js`, `attack-director.js`, `choreography.js`: guardian definitions and attack selection.
- `movement-modes.js`, `sustained-attacks.js`: arena modes and sustained pressure.
- `woodland-journey.js`, `city-chapter.js`: encounters, travel, and story progression.
- `adventure-progress.js`: XP, equipment, and validated browser saves.
- `world-art.js`, `idle-animation.js`, `organic-effects.js`: presentation and animation.

The project was developed iteratively with AI-assisted implementation. Painted
environments and character art were created for this project with AI assistance;
runtime movement, interface elements, and effects are drawn in Canvas.

This is an evolving prototype with two story guardians. Saves are local to the
current browser and website origin; there is no cloud synchronization.

## Readability update

The default interface uses 18px system text with larger controls and brighter contrast. Canvas text has a 16px minimum at its original resolution, and dialogue uses 22px text. A separate Story text panel displays the full current line at normal browser text size, so it remains readable on a phone or with browser zoom. Continue advances the current line; gameplay and saved adventures remain compatible.
