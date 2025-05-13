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

The script `src/scripts/generate-csv.js` will split the list of names into chunks and save them into `static/data`. It will also update the file at `src/lib/data/config.js` with the total killed and the list of chunk filenames.

This will happen automatically when running `npm run build`. To run it manually during development, run `node ./src/scripts/generate-csv.js`.
