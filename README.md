# Remember Their Names

Source code for [Remember Their Names](https://visualizingpalestine.org/gaza-names/en.html) by [Visualizing Palestine](https://visualizingpalestine.org/) built using [Svelte](https://svelte.dev/).

## Developing

Once you've installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Scripts

A previous version of this platform used SVG files for the figures. The following Node.js script was used to create `.svg` files from the path information contained in `data/people.js`.

```bash
node ./src/scripts/create-svg.js
```

These were then converted into the `static/img/figures.png` file.