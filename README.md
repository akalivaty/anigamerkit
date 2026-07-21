A Tampermonkey script that makes it more convenient to watch anime on [ani.gamer.com.tw](https://ani.gamer.com.tw/).

## Features

![setting_panel](./img/setting_panel.png)
![danmuku_box](./img/danmuku_box.png)

- [x] Auto expand the menu for more anime on the homepage.
- [x] (Tab) Enable a floating danmuku input box. It allows you to focus on the anime while entering a danmuku. Suitable for both full and partial screen.
- [x] (`1`) Skip forward 89 seconds. OP and ED are usually 90 seconds.
- [x] (Shift + >/<) Enable the shortcut to speed up/down the anime.
- [x] Auto input payment info (assigned to phone barcode), and auto click all checkboxes.

## Build

Requires Node.js 18 or later. No package installation is needed.

```sh
npm run build
```

Import `dist/anigamer_kits.user.js` into Tampermonkey. The generated file contains all source modules and does not use local `@require` paths.

For local development, edit the source files and run `npm run build` again. Do not import `anigamer_kits.user.js` from the repository root into Tampermonkey; it is the bundle entry source, while `dist/anigamer_kits.user.js` is the installable userscript.

### Version

`package.json` is the version source of truth. Commit feature or fix changes first, then use one of these commands from a clean worktree:

```sh
npm run release:patch
npm run release:minor
npm run release:major
```

Each command updates `package.json`, synchronizes the userscript `@version`, runs all checks, rebuilds the output, creates a version commit, and creates a matching `vX.Y.Z` Git tag. It does not push anything.

For example, after finishing a feature:

```sh
npm run check
git add .
git commit -m "feat: describe the change"
npm run release:patch
git push origin main --follow-tags
```

Pushing the tag triggers `.github/workflows/release.yml`. GitHub Actions verifies that the tag matches `package.json`, builds the userscript, creates the GitHub Release, and uploads `dist/anigamer_kits.user.js` as a release asset.
