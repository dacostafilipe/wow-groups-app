# wow-groups — Product Specification

## 1. Overview

**wow-groups** is a single-page web application that helps a World of Warcraft guild organize and redistribute players across multiple Mythic+ dungeon groups in a single evening session.

- ~20 players per night
- Groups of 5: 1 Tank / 1 Healer / 3 DPS (hard constraint)
- Multiple runs per night with reshuffles between each run
- All state is ephemeral and stored in browser localStorage only
- No authentication, no backend database — purely client-side

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + React |
| Styling | Tailwind CSS |
| State management | React state + localStorage |
| Deployment | Vercel (free tier) |
| Package manager | npm or bun |

All assets (class icons, spec icons) must be stored locally — no external resource URLs at runtime.

---

## 3. Player Data Model

Each player has the following fields:

```ts
type Role = 'tank' | 'healer' | 'dps';

interface Player {
  id: string;              // UUID generated on import
  name: string;            // Character name
  class: WowClass;         // e.g. "Warrior", "Druid"
  spec: string;            // e.g. "Arms", "Balance"
  role: Role;              // Derived from spec (see spec→role map)
  fallbackRole?: Role;     // Optional secondary role the player can fill
  ilvl: number;            // Equipped item level
  rating: number;          // Overall M+ rating (highest across all specs)
}
```

The `role` field is automatically derived from the spec. The `fallbackRole` can be set manually in the UI after import.

---

## 4. Roster Input — Custom Addon Text Format

The input is a block of plain text pasted from a WoW addon output. Each line represents one player.

### Format (one player per line)

```
<Name>|<Class>|<Spec>|<ilvl>|<rating>
```

**Example:**

```
Arthas|DeathKnight|Frost|623|2840
Thrall|Shaman|Restoration|618|2210
Sylvanas|Hunter|Marksmanship|620|3100
```

**Rules:**
- Pipe `|` as delimiter
- ilvl is an integer
- rating is an integer (0 if unrated)
- Class and Spec names use PascalCase with no spaces (e.g. `DeathKnight`, `HolyPaladin`)
- Blank lines and lines starting with `#` are ignored (comments)

After pasting, the app parses the text and displays a preview table where the organizer can make corrections before confirming the roster.

---

## 5. Grouping Algorithm

### 5.1 Hard Constraints

- Each group must have exactly: 1 Tank, 1 Healer, 3 DPS
- Total groups = `floor(playerCount / 5)`
- Remaining players go to the Bench (see Section 8)

### 5.2 Soft Scoring

Each candidate group assignment is scored. Higher score = better group. The algorithm maximises the minimum group score (equalise groups, not stack one group).

**Score components (equal weight, each 0–1 normalised):**

1. **ilvl balance** — how close each group's average ilvl is to the roster average ilvl
2. **M+ rating balance** — how close each group's average rating is to the roster average rating
3. **History penalty** — for each pair of players in a group who have already played together this session, subtract a penalty (soft constraint — balance can override it)
4. **Buff coverage bonus** — groups that contain a Bloodlust provider get a small bonus

### 5.3 Buff Awareness

Tracked raid buffs and their provider classes:

| Buff | Provider Classes/Specs |
|---|---|
| Bloodlust / Heroism | Shaman, Mage (Arcane/Fire/Frost), Hunter (Beast Mastery) |
| Combat Resurrection | Druid, Death Knight, Warlock |
| Battle Shout | Warrior |
| Power Infusion | Priest (Discipline/Holy) |

**Bloodlust rule:** The algorithm assigns the Bloodlust provider to the highest-priority group first (group 1 by default). If there is only one BL provider and multiple groups, the uncovered groups receive a warning indicator in the UI. Other buffs are treated as scoring bonuses only.

### 5.4 Multi-Role Players

A player can have a preferred role and an optional fallback role. The algorithm will:
1. Try to fill the player's preferred role first
2. If the group composition requires it, the player can be placed in their fallback role

The organizer sets fallback roles manually in the roster editor after import.

### 5.5 Reshuffle

- On each reshuffle, the algorithm runs fresh from scratch (does not perform minimal swaps)
- History from previous runs this session is fed in as a soft penalty
- Role balance and gear/rating balance always take priority over history

---

## 6. Session & History

- The entire session lives in `localStorage`
- History = a log of every (playerA, playerB) pair that shared a group this session
- On "Start Run", the current group compositions are recorded to history
- On "Reshuffle", history is used as a penalty input to the new grouping
- **Reset session**: shows a confirmation dialog, then clears all localStorage and reloads the app
- There is no cross-session persistence — closing the browser or resetting wipes everything

---

## 7. UI Layout

### Main Screens

1. **Roster Import screen** — paste addon text, preview parsed roster, set fallback roles
2. **Groups screen** — main view showing all groups + bench
3. *(No separate settings screen — configuration is inline)*

### Groups Screen Layout

```
[Reshuffle] [Start Run] [Reset Session]     Session: Run #2

 Group 1          Group 2          Group 3          Group 4
 avg ilvl: 621    avg ilvl: 619    avg ilvl: 622    avg ilvl: 620
 avg rating: 2800 avg rating: 2750 avg rating: 2820 avg rating: 2710
 [BL] [CR]        [CR]             [BL]             [BS]
 ┌──────────┐    ┌──────────┐    ...
 │ Arthas   │    │ Thrall   │
 │ DK·Frost │    │ Sham·Res │
 │ 623 ilvl │    │ 618 ilvl │
 │ 2840 M+  │    │ 2210 M+  │
 └──────────┘    └──────────┘
 ...

                                              BENCH
                                              ┌──────────┐
                                              │ Jaina    │
                                              │ Mage·Arc │
                                              └──────────┘
```

### Player Card

Each card displays at a glance (no hover required):
- Class color (card border or background tint using official WoW class colors)
- Class icon + Spec icon
- Character name
- Spec label (e.g. "Frost", "Restoration")
- ilvl
- M+ Rating

Role is indicated by a small icon (sword = tank, shield = healer, flame = DPS).

### Drag and Drop

- Players can be dragged between groups and to/from the bench
- **Validation is real-time and non-blocking**: if a drag creates an invalid composition (e.g. group loses its only healer), the affected group shows a warning badge (e.g. `⚠ No Healer`) but the drag is not prevented
- Swap behavior: dragging a player onto another player swaps their positions

---

## 8. Bench

- Players that don't fit into full groups of 5 are placed in a Bench pool
- Bench is displayed as a sidebar panel on the Groups screen
- Bench players can be dragged into any group (replacing someone, who moves to bench)
- The organizer can manually swap bench players in before starting a run

---

## 9. WoW Classes & Specs Reference

### Class → Color (official WoW class colors)

| Class | Hex Color |
|---|---|
| Death Knight | #C41E3A |
| Demon Hunter | #A330C9 |
| Druid | #FF7C0A |
| Evoker | #33937F |
| Hunter | #AAD372 |
| Mage | #3FC7EB |
| Monk | #00FF98 |
| Paladin | #F48CBA |
| Priest | #FFFFFF |
| Rogue | #FFF468 |
| Shaman | #0070DD |
| Warlock | #8788EE |
| Warrior | #C69B3A |

### Spec → Role mapping (key examples)

| Class | Spec | Role |
|---|---|---|
| Warrior | Arms, Fury | DPS |
| Warrior | Protection | Tank |
| Paladin | Retribution | DPS |
| Paladin | Holy | Healer |
| Paladin | Protection | Tank |
| Death Knight | Frost, Unholy | DPS |
| Death Knight | Blood | Tank |
| Druid | Balance, Feral | DPS |
| Druid | Guardian | Tank |
| Druid | Restoration | Healer |
| Shaman | Enhancement, Elemental | DPS |
| Shaman | Restoration | Healer |
| Monk | Windwalker | DPS |
| Monk | Brewmaster | Tank |
| Monk | Mistweaver | Healer |
| Priest | Shadow | DPS |
| Priest | Holy, Discipline | Healer |
| Demon Hunter | Havoc | DPS |
| Demon Hunter | Vengeance | Tank |
| Evoker | Devastation, Augmentation | DPS |
| Evoker | Preservation | Healer |
| *(all Hunter specs)* | — | DPS |
| *(all Mage specs)* | — | DPS |
| *(all Warlock specs)* | — | DPS |
| *(all Rogue specs)* | — | DPS |

---

## 10. Asset Pipeline

All icons must be stored locally — no external resource URLs at runtime. Icons are downloaded once via a setup script and committed to the repository.

### Source: Blizzard Game Data API

The official source for class and spec icons is the Battle.net Game Data API.

**Setup required (one-time):**
1. Register at `develop.battle.net` and create a client application
2. Copy the `client_id` and `client_secret` into a local `.env` file (never committed)

**.env format:**
```
BNET_CLIENT_ID=your_client_id
BNET_CLIENT_SECRET=your_client_secret
BNET_REGION=eu
```

### Download Script: `scripts/download-assets.js`

A Node.js script that runs once at project setup (`node scripts/download-assets.js`). Steps:

1. **Authenticate** — POST to `https://<region>.battle.net/oauth/token` with client credentials to get a bearer token
2. **Fetch class list** — `GET /data/wow/playable-class/index?namespace=static-<region>&locale=en_US`
3. **Fetch class icon** — `GET /data/wow/playable-class/{classId}/media?namespace=static-<region>` → extract asset URL → download `.jpg`
4. **Fetch spec list** — `GET /data/wow/playable-specialization/index?namespace=static-<region>&locale=en_US`
5. **Fetch spec icon** — `GET /data/wow/playable-specialization/{specId}/media?namespace=static-<region>` → extract asset URL → download `.jpg`
6. Save all icons as `.jpg` (original format from Blizzard CDN — no conversion needed)

### Output File Structure

```
public/
  icons/
    classes/
      warrior.jpg
      paladin.jpg
      deathknight.jpg
      ...
    specs/
      arms.jpg
      fury.jpg
      protection-warrior.jpg   # spec slugs prefixed with class if ambiguous
      holy-paladin.jpg
      ...
  textures/
    bg-stone.webp              # background texture (sourced separately)
```

Spec icon filenames are slugified from the API response name. Where spec names collide across classes (e.g. "Protection" exists for both Warrior and Paladin), the class name is prepended: `protection-warrior.jpg`, `protection-paladin.jpg`.

### Runtime Icon Lookup

The app maintains a static map in `src/data/icons.ts`:

```ts
export const classIcon = (className: string) =>
  `/icons/classes/${slugify(className)}.jpg`;

export const specIcon = (className: string, specName: string) =>
  `/icons/specs/${slugify(specName)}-${slugify(className)}.jpg`;
```

The script is documented in the README and is not part of the Next.js build or client bundle.

---

## 11. Group Validation Rules

| Condition | Severity | Message |
|---|---|---|
| Group has 0 tanks | Error | "No Tank" |
| Group has 0 healers | Error | "No Healer" |
| Group has > 3 DPS | Error | "Too many DPS" |
| Group has < 3 DPS | Warning | "Missing DPS" |
| Group has > 1 tank | Error | "Too many Tanks" |
| Group has > 1 healer | Error | "Too many Healers" |
| No Bloodlust in group | Info | "No Bloodlust" |
| Group size < 5 | Warning | "Incomplete group" |

Error-level groups are highlighted with a red border. Warning-level with yellow. Info-level with a subtle icon only.

---

## 12. Run Flow

```
1. Organizer pastes addon text → Roster Import screen
2. Preview parsed roster, fix fallback roles if needed → Confirm Roster
3. Algorithm generates initial groups → Groups screen
4. Organizer adjusts via drag-and-drop
5. Click "Start Run" → compositions saved to history, run counter increments
6. After dungeon completes, click "Reshuffle"
7. Algorithm generates new groups using history penalty → repeat from step 4
8. At end of night, click "Reset Session" → confirmation dialog → wipe localStorage
```

---

## 13. Design System

### Visual Reference
Inspired by the official World of Warcraft website character page — dark, atmospheric, and data-dense without feeling cluttered.

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#0a0b0d` | Page background |
| `--bg-surface` | `#111318` | Panel / card background |
| `--bg-elevated` | `#1a1d24` | Hover states, dropdowns |
| `--border-subtle` | `#2a2d35` | Card borders, dividers |
| `--gold-primary` | `#c8a84b` | Headings, accents, icons |
| `--gold-dim` | `#8a6f2e` | Secondary gold, inactive |
| `--text-primary` | `#e8dcc8` | Body text (warm off-white) |
| `--text-muted` | `#6b7280` | Labels, secondary data |
| `--error` | `#c41e3a` | Error validation state |
| `--warning` | `#f59e0b` | Warning validation state |
| `--info` | `#3b82f6` | Info indicators |

WoW class colors are applied as-is from Section 9.

### Background

A seamless dark stone/rock texture is used as the full-page background, layered under a near-opaque dark overlay so it is subtle and doesn't compete with content. The texture tile should be stored locally under `public/textures/bg-stone.webp`.

### Typography

| Usage | Font | Weight | Size |
|---|---|---|---|
| App title, group headings | Cinzel (Google Fonts, self-hosted) | 600 | 1.25–2rem |
| Section labels | Cinzel | 400 | 0.85rem |
| Player names | Cinzel | 500 | 0.9rem |
| Stats (ilvl, rating) | Inter or system-ui | 400 | 0.8rem |
| Buttons | Cinzel | 600 | 0.85rem |

Cinzel is a free serif font that closely matches the WoW heading aesthetic. It must be self-hosted (downloaded at build time) — no Google Fonts CDN calls at runtime.

### Panel & Card Style

- **Background:** `--bg-surface` with `1px` border in `--border-subtle`
- **No ornate corner decorations** — clean rectangular panels
- **Group panel header:** gold bottom border (`--gold-dim`), Cinzel font
- **Subtle inner shadow** on panels: `inset 0 1px 0 rgba(200,168,75,0.08)`
- **Hover state:** border lightens to `--gold-dim`, background lifts to `--bg-elevated`
- **Border radius:** `6px` — restrained, not fully rounded

### Player Card

```
┌─ [class color bar 3px] ──────────────────────┐
│  [class icon 24px] [spec icon 20px]  [role icon tinted with class color]  │
│  Arthas                                       │
│  Death Knight · Frost                         │
│  623 ilvl          2840 M+                    │
└───────────────────────────────────────────────┘
```

- Left border: `3px solid <class color>` — primary class color indicator
- Role icon (tank/healer/dps) tinted with the player's class color
- Player name rendered in `--text-primary` (not class color — reserved for border/icon only)
- Dragging: card lifts with `box-shadow`, opacity reduces to 0.85, cursor becomes `grabbing`

### Buttons

- **Primary** (Start Run, Confirm Roster): gold gradient background (`#c8a84b` → `#8a6f2e`), dark text, Cinzel font
- **Secondary** (Reshuffle): dark background, gold border and text
- **Destructive** (Reset Session): dark background, muted red border, becomes fully red on hover
- All buttons have a subtle inner highlight on the top edge (`inset 0 1px 0 rgba(255,255,255,0.1)`)

### Validation States

- **Error** (e.g. no healer): group panel border turns `--error` red; badge shown in group header
- **Warning** (e.g. missing DPS): border turns `--warning` amber
- **Info** (e.g. no Bloodlust): small icon indicator in group header only, no border change

### Layout & Spacing

- Groups screen: CSS Grid, 4 columns on wide screens, 2 on medium, 1 on narrow
- Bench sidebar: fixed right panel, `280px` wide, scrollable
- Base spacing unit: `8px`
- Page max-width: `1600px`, centered

### Drag and Drop Visual Feedback

- Drop target group: border pulses gold while a card is being dragged over it
- Invalid drop zone (would exceed role limit): border turns red during hover
- Bench accepts all cards with no validation at drop time

---

## 14. Out of Scope (v1)

- Authentication / access control
- Multi-guild / multi-tenant support
- Cross-session history persistence
- Automatic WoW API integration (armory, raider.io live data)
- Mobile layout optimization
- Real-time sync between multiple browser windows
- Dungeon-specific considerations (keystone level, affixes)
