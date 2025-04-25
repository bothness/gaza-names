import fs from 'fs'
import people from '../lib/data/people.js'

const OUTPUT_PATH = './static/img'

Object.keys(people)
  .forEach(type => {
    people[type].forEach((path, i) => {
      const svg = `
<svg viewBox="0 0 75 150">
  <path
    d="${path}"
    fill="black"
  />
</svg>
`
      fs.writeFileSync(`${OUTPUT_PATH}/${type}-${i + 1}.svg`, svg)
    })
  })