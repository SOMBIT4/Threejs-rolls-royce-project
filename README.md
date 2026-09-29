# Rolls-Royce Three.js Showcase — Final Desktop Version

This is the simplified **desktop-only** version of the project. There are no mobile media queries, mobile camera branches, safe-area rules or separate mobile controls.

## Run

```bash
npm install
npm start
```

Open: `http://127.0.0.1:5173/`

## Controls

- Click car or **Cruise**: start / stop cruise
- **W / S**: forward / reverse
- **A / D**: steer left / right
- **Arrow keys**: camera angle / height
- Mouse drag: orbit camera
- Mouse wheel: zoom
- **Space**: start / stop cruise
- **M**: music on / off
- **R**: reset car lane + camera
- **Night / Day**: change lighting; headlights turn on automatically at night
- **Details**: stop the car and show clickable detail points

## Where to edit things

- `main.js` — creates the project and contains the animation loop + day/night connection
- `car.js` — car model, paint material, wheel rotation and automatic headlights
- `road.js` — road mesh and road movement
- `shaders.js` — custom road shader
- `environment.js` — grass, sky/background colors, trees, posts and stars
- `lighting.js` — day/night lights and rotating light
- `camera.js` — perspective camera, mouse orbit, arrow camera controls and zoom
- `interactions.js` — driving state and mouse input
- `keyboard.js` — W/S/A/D and arrow-key mapping
- `controls.js` — right-side Cruise, Night, Music, Color, Details and Reset buttons
- `partDetails.js` — **edit detail point positions and detail text here**
- `audio.js` — background music
- `style.css` — all UI styles; change `--point-size` to resize detail dots
- `textures.js` — road texture loading
- `loadingScreen.js` — loading progress only
- `renderer.js` / `scene.js` — basic Three.js renderer and scene setup

## Editing detail points

Open `partDetails.js` and edit `DETAIL_POINTS` at the top:

```js
{
  key: 'front-wheel',
  title: 'Front Wheel',
  text: 'Your detail text here.',
  position: [1.63, 0.54, 1.05],
  mirrorToCamera: true
}
```

`position: [X, Y, Z]`

- `+X` = front
- `-X` = rear
- `Y` = height
- `+/-Z` = left/right side

To make the dots smaller/larger, open `style.css` and change:

```css
--point-size: 12px;
```

## Model attribution

The bundled vehicle is based on **Rolls-Royce Silver Shadow 1965 1980** by ig.ghazigfx, licensed under CC-BY-4.0. See `model/rolls-royce_silver_shadow_1965_1980/license.txt`.
