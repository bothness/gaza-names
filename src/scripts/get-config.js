import fs from 'fs'
import { csvParse, autoType } from "d3-dsv";
import {domain, texts} from '../lib/data/config.js'

const database = "https://docs.google.com/spreadsheets/d/1PqAxz42cbTNnPijSzAcY83aZzjqKbOXivR4iO9LKGno/export?format=csv";

const content_raw = csvParse(await (await fetch(`${database}&gid=849504288`)).text(), autoType);
texts.female = {en: 'Female', ar: 'انثى'}
texts.male = {en: 'Male', ar: 'Male'}
const meta = {};
for (const c of content_raw) {
  if (c.value) meta[c.key] = c.value;
  else texts[c.key] = {en: c.en, ar: c.ar};
}

const config = {
  domain,
  meta,
  texts,
}

fs.writeFileSync('./src/lib/data/config-new.json', JSON.stringify(config))
