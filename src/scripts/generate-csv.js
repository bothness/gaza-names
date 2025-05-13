import fs from 'fs'
import { quadtree } from "d3-quadtree";
import { parse } from 'csv-parse/sync';
import { stringify } from "csv-stringify/sync";
import config from '../lib/data/config.js'

const NAMES_CSV = './src/lib/data/names-2025-03-23.csv'
const OUTPUT_CSV_DIR = './static/data/'
const OUTPUT_CHUNKS = 10

const FIGURE_BABY_ROW = 0
const FIGURE_CHILD_ROW = 1
const FIGURE_MTEEN_ROW = 2
const FIGURE_FTEEN_ROW = 3
const FIGURE_MADULT_ROW = 4
const FIGURE_FADULT_ROW = 5
export const FIGURE_WIDTH = 75
export const FIGURE_HEIGHT = 150

function imageXY(age, sex) {
  const i = Math.floor(Math.random() * 6);
  if (age < 4) return {y: FIGURE_BABY_ROW * FIGURE_HEIGHT, x: FIGURE_WIDTH * i};
  if (age < 13) return {y: FIGURE_CHILD_ROW * FIGURE_HEIGHT, x: FIGURE_WIDTH * i};
  if (age < 20 && sex === "f") return {y: FIGURE_FTEEN_ROW * FIGURE_HEIGHT, x: FIGURE_WIDTH * i};
  if (age < 20) return {y: FIGURE_MTEEN_ROW * FIGURE_HEIGHT, x: FIGURE_WIDTH * i};
  if (sex === "f") return {y: FIGURE_FADULT_ROW * FIGURE_HEIGHT, x: FIGURE_WIDTH * i};
  return {y: FIGURE_MADULT_ROW * FIGURE_HEIGHT, x: FIGURE_WIDTH * i};
}

const makePoints = (count, numCandidates = 20) => {
  const pt = [Math.random(), Math.random()];
  const points = [pt];
  const qt = quadtree().extent([[0, 0], [1, 1]]).add(pt);

  while (points.length < count) {
    points.push(sample(qt, numCandidates));
  }
  return points;
}

function sample(qt, numCandidates) {
  var bestCandidate, bestDistance = 0;
  for (var i = 0; i < numCandidates; ++i) {
    var c = [Math.random(), Math.random()],
        d = distance(qt.find(...c), c);
    if (d > bestDistance) {
      bestDistance = d;
      bestCandidate = c;
    }
  }
  qt.add(bestCandidate);
  return bestCandidate;
}

function distance(a, b) {
  var dx = a[0] - b[0],
      dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

const names = parse(
  fs.readFileSync(NAMES_CSV),
  {
    bom: true,
    columns: true,
    skip_empty_lines: true,
  }
)
const points = makePoints(names.length)

let min = 0, max = 0;
const people = names.
  map((d, i) => {
    max = Math.max(max, d["age"]);
    const imageCoords = imageXY(d["age"], d["sex"])
    delete d.index
    delete d.dob
    delete d.id
    return {
      ...d,
      x: points[i][0],
      y: points[i][1],
      imageX: imageCoords.x,
      imageY: imageCoords.y,
    }
  })
  .sort((a, b) => a.y - b.y)

/**
 * We split the list into chunks, ordered by Y position
 * (above). This way, we can load and render the chunks one
 * by one, with the top figures visible first.
 */
const chunkSize = Math.ceil(people.length / OUTPUT_CHUNKS)
const chunkFiles = []
for (let i = 0; i < OUTPUT_CHUNKS; i++) {
  const start = i * chunkSize
  const end = Math.min(people.length, start + chunkSize)
  const filename = `data/names-2025-03-23-${i}.csv`
  chunkFiles.push(filename)
  fs.writeFileSync(`./static/${filename}`, stringify(people.slice(start, end), {header: true}))
}

const newConfig = {
  ...config,
  min,
  max,
}
newConfig.meta.total_killed = people.length
newConfig.meta.chunks = chunkFiles

fs.writeFileSync('./src/lib/data/config.js', `export default ${JSON.stringify(newConfig, null, 2)}`)