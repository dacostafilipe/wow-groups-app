We want to create a single page web application (named "wow-groups") that will help use organize World of Warcraft dungeon runs in my guild. We normally are a group of multiple players (+- 20 players) that want to run dungeons together, but because you can be maximum 5 players per dungeon group and each group needs 1 tank, 1 healer and 3 dps, it takes time to correctly organize the runs. The application should help us manage and randomize the dungeon groups. 

The input will be a list of characters with classes/specs/etc that we will get from WoW, via a new addon we will create in the future or from an existing addon that outputs the needed information.

The web app should allow:
- create multiple dungeon groups with 3 dps, 1 tank and 1 healer
- reshufle groups and redistribute players to allows evereybody to play with everybody
- log activity in the app (use browser localstorage only) so that we know who play with who over the night
- track raid buffs ( bloodlust, battle rezz, ...) so that each group has one if possible
- equlibrated groups based on gear level
- allow manual dragging of player to other groups before "starting" to play
- Display classes and specs with their color in-game and icon

We should find an official resource to get all the needed class icons, write a script to download those assets and store it locally. The app should not use external resources, everything needs to be local.

Interview me in detail using the AskUserQuestionTool about literally    
anything: technical implementation, UI & UX, concerns, tradeoffs, etc. but make sure the questions are not obvious. Be very in-depth and continue interviewing me continually until it's complete, then write a SPEC.md with all the details.
