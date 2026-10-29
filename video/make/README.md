# make/

Source for the promo in the parent folder. Run `bash build.sh` to regenerate `../main.mp4` and `../cover.png`; intermediates land in `../tmp` and can be deleted afterwards.

| File | Role |
| --- | --- |
| `stage.html` / `stage.js` | the 1080×1920 scene and its deterministic timeline; every UI on screen is the repo's real `index.html` in an iframe |
| `capture.js` | steps the timeline frame by frame and screenshots it (`full`, or `preview <seconds…>` for stills) |
| `audio.py` | synthesizes the soundtrack, with clicks timed to the cursor clicks (`sfx.json` from capture) |
| `cover.html` / `cover.js` | the cover |
| `serve.js` | static server rooted at the repo, so the stage can embed `/index.html` |
| `build.sh` | runs all of the above and encodes with ffmpeg |

`../publish.md` is hand-written.
