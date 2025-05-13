import { csvParse, autoType } from "d3-dsv";

export const FIGURE_WIDTH = 75
export const FIGURE_HEIGHT = 150

export const getDataChunk = async (chunk) => {
  return csvParse(await (await fetch(chunk)).text(), autoType);
}