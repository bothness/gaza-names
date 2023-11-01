import { csvParse, autoType } from "d3-dsv";
import makePoints from "$lib/js/make-points";

export const prerender = true;
export const trailingSlash = "always";

const database = "https://docs.google.com/spreadsheets/d/1PqAxz42cbTNnPijSzAcY83aZzjqKbOXivR4iO9LKGno/gviz/tq?tqx=out:csv";

function getPath(age, sex) {
  const i = Math.floor(Math.random() * 6);
  if (age < 4) return ["baby", i];
  if (age < 13) return ["child", i];
  if (age < 20 && sex === "Female") return ["fteen", i];
  if (age < 20) return ["mteen", i];
  if (sex === "Female") return ["fadult", i];
  return ["madult", i];
}

export async function load({ fetch }) {
  const content_raw = csvParse(await (await fetch(`${database}&sheet=content`)).text(), autoType);
  const texts = {};
  const meta = {};
  for (const c of content_raw) {
    if (c.value) meta[c.key] = c.value;
    else texts[c.key] = {en: c.en, ar: c.ar};
  }
  const people_raw = csvParse(await (await fetch(`${database}&sheet=data`)).text(), autoType);
  const points = makePoints(people_raw.length);
  let min = 0, max = 0;
  const people = people_raw.map((d, i) => {
    if (!d["Age"]) d["Age"] = 0;
    if (d["Age"] === 1823) d["Age"] = 23;
    max = Math.max(max, d["Age"]);
    return {
      ...d,
      x: points[i][0], y: points[i][1],
      path: getPath(d["Age"], d["Sex in English"]),
      flip: Math.round(Math.random())
    };
  });
  return { meta, texts, people, min, max };
}