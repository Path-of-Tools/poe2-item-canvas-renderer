import { promises as fsa } from 'fs'
import * as fs from 'fs'
import path from 'path'

import { PoE2ItemParser } from 'poe-item-parser'
import { renderItem } from './renderer.js'

async function readTxtFiles(folderPath) {
  const filesArray = []

  try {
    const files = await fsa.readdir(folderPath)

    for (const file of files) {
      const filePath = path.join(folderPath, file)

      if (path.extname(file) === '.txt') {
        const content = await fsa.readFile(filePath, 'utf-8')
        filesArray.push({ fileName: path.basename(file, '.txt'), content: content })
      }
    }
  } catch (error) {
    console.error('Error reading files:', error)
  }

  return filesArray
}

async function main() {
  const items = await readTxtFiles('./items')

  for (const item of items) {
    const parsedItem = new PoE2ItemParser(item.content)
    const canvas = await renderItem(parsedItem.getItem())

    await fsa.writeFile(`./out_parsed/${item.fileName}.json`, JSON.stringify(parsedItem.getItem(), null, 2))

    const out = fs.createWriteStream(`./out/${item.fileName}.png`)
    const stream = canvas.createPNGStream()
    stream.pipe(out)
    out.on('finish', () => console.log(`out/${item.fileName}.png created`))
  }
}

main()