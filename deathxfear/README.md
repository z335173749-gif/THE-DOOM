# DEATHXFEAR — cinematic 3D site

Static site: Three.js + GSAP ScrollTrigger from CDNs. No build step, no backend.

```
deathxfear/
├── index.html   structure, copy, links
├── style.css    typography, glass cards, responsive rules
├── script.js    3D scene, scroll-driven camera, audio, quality scaling
├── assets/audio/  put your own mp3 files here (see Audio)
└── README.md
```

## Deploy on GitHub Pages
1. Create a repository and upload these four files to the root.
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. Open `https://<user>.github.io/<repo>/`.

To test locally, serve the folder (ES modules need http, not `file://`): `python -m http.server`.

## Edit your content
- **Websites:** add an object to the `websites` array at the top of `script.js` (`name`, `description`, `url`; optional `status`, `button`). Cards are generated automatically.
- **Discord:** shown as a copy-to-clipboard username button in the contact section of `index.html` (no invite link).
- **Selected Work:** the `selectedWork` array at the top of `script.js` (empty = "NO PROJECTS YET").
- **Colours:** `--red` in `style.css`; `CONFIG.red` / `CONFIG.bg` at the top of `script.js`.
- **Scroll length:** `#scroll { height: 850vh }` in `style.css`.
- **Text timing:** each section's `data-a` / `data-b` (scroll progress 0–1).
- **Camera route:** the `CatmullRomCurve3` points in `script.js`.

## Performance
Phones and low-core devices get fewer particles and objects and a capped pixel ratio. If frames stay slow, resolution drops automatically. Particle/object counts are in the `Q` object in `script.js`.

## Audio
Files go in `assets/audio/` with these exact names (all optional):

| File | Used for |
|---|---|
| `ambient.mp3` | looping background music (use a seamless-loop file; browsers can leave a tiny gap otherwise) |
| `enter.mp3` | once, on the first interaction |
| `transition.mp3` | when entering each major section (once per crossing) |
| `hover.mp3` | when the cursor enters a card |
| `click.mp3` | when clicking a button or link |

- Volumes and paths: `AUDIO_CONFIG` at the top of `script.js`.
- Use only music/sounds you made or are licensed to use. Compressed mp3, ~128 kbps; keep effects tiny.
- Browsers block audio until the visitor interacts; the site retries on each interaction. The SOUND button saves its state in `localStorage`.
- Missing files are skipped silently. The browser console may still show a 404 line for a file you haven't added yet; that is harmless.

## How to edit (all in `script.js`, top of file)
- **Add a project:** find `const selectedWork = [` and add  
  `{ title: "Name", category: "WEB EXPERIENCE", description: "Text.", url: "https://...", status: "ONLINE", featured: false, image: null, model: null, year: "2026" },`  
  Required: title, category, description, url. `image` can be a path like `"./assets/images/pic.jpg"`. `model` is accepted but not rendered yet.
- **Add a website:** find `const websites = [` and add `{ name: "Name", description: "Text.", url: "https://...", status: "Live", button: "VISIT WEBSITE" },`
- **Volume:** `AUDIO_CONFIG` → each `volume` (0 to 1).
- **Sound off by default:** `const SOUND_DEFAULT_ON = false;` (a visitor's saved choice still wins).
- **Test audio:** open the site, open DevTools → Console, click anywhere, look for `[DXF AUDIO]` messages. Set `AUDIO_DEBUG = false` to silence them. To reset the saved choice: Console → `localStorage.removeItem('dxf-sound')`.
