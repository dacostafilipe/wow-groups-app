# wow-groups

WoW Mythic+ dungeon group organizer. Helps guild leaders distribute players into balanced groups of 5 (1 tank / 1 healer / 3 DPS) across multiple runs in a single evening session.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## WowGroups Addon

The addon lets the raid leader export the group roster directly from the game and paste it into the web app.

### Installation

1. Locate your WoW AddOns directory:

   | OS | Path |
   |---|---|
   | Windows | `C:\Program Files (x86)\World of Warcraft\_retail_\Interface\AddOns\` |
   | macOS | `/Applications/World of Warcraft/_retail_/Interface/AddOns/` |

2. Copy the addon folder into that directory:

   ```
   addon/WowGroups/  →  .../Interface/AddOns/WowGroups/
   ```

   The result should look like:

   ```
   AddOns/
     WowGroups/
       WowGroups.toc
       WowGroups.lua
   ```

3. Launch (or reload) the game and enable **WowGroups** in the AddOns list on the character selection screen.

### Usage

- Click the **minimap button** (upper-right area by default, draggable) or type `/wowgroups` / `/wg` in chat.
- The frame opens and automatically starts collecting data from all raid/party members.
- Wait for the status to show **Done** — inspection takes ~0.5 s per player.
- Click **Select All**, then **Ctrl+C** to copy the roster text.
- Paste it into the web app's Roster Import screen.

### Notes

- All players must be in the same **raid or party group** before exporting.
- Members out of inspect range will appear with `ilvl=0` and `rating=0`; these can be corrected in the web app after import.
- To refresh after a roster change, click the **Refresh** button inside the frame.

