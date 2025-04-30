import { csvParse, autoType } from "d3-dsv";
import makePoints from "./make-points";

const database = "https://docs.google.com/spreadsheets/d/1PqAxz42cbTNnPijSzAcY83aZzjqKbOXivR4iO9LKGno/export?format=csv";
// const NAMES = `./data/names-temp.csv`
const NAMES = `./data/names-2025-03-23.csv`

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

export const getData = async () => {
  const people_raw = csvParse(await (await fetch(NAMES)).text(), autoType);
  const points = makePoints(people_raw.length);
  let min = 0, max = 0;
  const people = people_raw.map((d, i) => {
    if (!d["age"] || typeof d["age"] === "string") d["age"] = 0;
    if (d["age"] === 1823) d["age"] = 23;
    max = Math.max(max, d["age"]);
    return {
      ...d,
      x: points[i][0], y: points[i][1],
      imageXY: imageXY(d["age"], d["sex"]),
      flip: Math.round(Math.random())
    };
  });
  return { people, min, max };
}