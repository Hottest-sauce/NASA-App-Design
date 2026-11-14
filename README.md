# Hold the Fort: Mars Hab (a GUI learning project)

A tiny game that shows **how to put visuals into a GUI** with plain HTML, CSS and JavaScript. No installs, no frameworks.

## Run it (2 minutes)
1. Open this folder in VS Code (**File > Open Folder**).
2. Install the recommended **Live Server** extension (VS Code will offer it).
3. Right-click `index.html` > **Open with Live Server**. Edit a file, save, and the page refreshes itself.

## The files
| File | Job |
|---|---|
| `index.html` | Structure: the empty containers (HUD bar, scene, dialogue box) |
| `style.css` | Looks: colors, sizes, positions |
| `game.js` | Behavior: data, drawing, clicks, minigames |
| `assets/rooms/` | Background pictures (one per room) |
| `assets/icons/` | Icon pictures for hotspots |

## The tour: press Ctrl+Shift+F and search `LESSON`
| # | Idea | Where |
|---|---|---|
| 0 | Three files, three jobs | `index.html` |
| 1 | A GUI is **layers**: background, clickable objects, then menus on top | `game.js` `show()` |
| 2 | **Hotspots**: absolute-positioned boxes sized in `%` so they scale with the picture | `style.css`, `ROOMS` |
| 3 | **Swap emoji for real art**: add `img:'path'` to a room or hotspot | `ROOMS`, `.ic-img` |
| 4 | **HUD**: numbers in `R` drawn as bars; change data, call `hud()` | `game.js` `hud()` |
| 5 | **Canvas**: draw and **rotate** shapes; score by alignment with cos() | `game.js` `draw()` |
| 6 | **Animation loop**: update, draw, repeat with `requestAnimationFrame` | `game.js` `loop()` |

## Try these (easiest first)
1. Change `ic:'🔋'` on another hotspot to `img:'assets/icons/generator.svg'`. See it swap.
2. Drop your own `.png` into `assets/rooms/` and point a room's `img` at it.
3. Move a hotspot: change its `x` and `y` numbers.
4. Add a new resource to `R` and watch a new bar appear.
5. In the solar game, change `sunAng` so the sun moves faster. Can you still keep up?
6. Make the storm last longer (search `G.storm`).

## Tips
- Percent coordinates: `x:5, y:38` means 5% from the left, 38% from the top of the picture.
- Pictures that are **16:9** (like 1600x900) fit the scene without cropping.
- Use **PNG with transparent background** for icons so only the object shows.
- Press **F12** in the browser to open DevTools. Errors show up in the Console tab.
- NASA data: `sunAng()` in `game.js` is where a real API call would go.
