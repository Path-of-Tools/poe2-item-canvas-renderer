import { registerFont, createCanvas, loadImage } from 'canvas'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const headerMargin = 10
const horizontalMargin = 40
const fontHeight = 18
const lineHeight = 20
const nameOffset = 3
const nameFontHeight = 23
const separatorWidth = 221
const separatorHeight = 8
const separatorMarginTop = 4
const separatorMarginBottom = 7

const color = {
  grey: '#7f7f7f',
  white: '#ffffff',
  enchant: '#b4b4ff',
  affix: '#8888ff',
  corrupted: '#d20000',
  currency: '#aa9e82',
  normal: '#c8c8c8',
  magic: '#8888ff',
  rare: '#ffff77',
  unique: '#af6025',
  uniqueName: '#ee681d',
  quest: '#4ae63a',
  boon: '#b5a890',
  affliction: '#a06dca',
}

function limitFlavorText(flavorText) {
  // nothing to do
  if (!flavorText || flavorText.flavorText.length <= 90 || flavorText.lines.length > 1) {
    return flavorText
  }

  const words = flavorText.flavorText.split(' ')
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length > 90) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return { flavorText: flavorText.flavorText, lines }
}

function limitText(array) {
  const result = []

  for (const text of array) {
    // nothing to do
    if (!text || text.length <= 88) {
      result.push(text)
      continue
    }

    const words = text.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      if (testLine.length > 88) {
        result.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      result.push(currentLine)
    }
  }

  return result
}

function isBaseValueIncreased(item, name) {
  const notScalingWithQuality = [
    'Reduced Attribute Requirements',
    'Block Chance',
    'Charges'
  ]

  if (!notScalingWithQuality.includes(name) && item.quality && item.quality > 0) {
    return true
  }

  // unscaleable value
  if (name === 'Radius') {
    return false
  }

  const toCheck = [
    ...item.affixes,
    ...item.runes,
    ...item.implicits,
    ...item.enchants,
  ]

  // check if any of the affixes contain the name
  if (toCheck.some(stat => stat.toLowerCase().includes(name.toLowerCase()))) {
    return true
  }

  return false
}

function resizeCanvasWithoutClearing(canvas, newWidth, newHeight) {
  const context = canvas.getContext('2d')

  // Save the current canvas content as an image
  const savedContent = context.getImageData(0, 0, canvas.width, canvas.height)

  // Resize the canvas
  canvas.width = newWidth
  canvas.height = newHeight

  // Restore the saved content
  context.putImageData(savedContent, 0, 0)
}

export async function renderItem(item) {
  registerFont(__dirname + '/assets/fontin-smallcaps-webfont.ttf', { family: 'FontinSmallCaps' })
  const separator = await loadImage(__dirname + `/assets/separator-${item.itemRarity}.png`)
  const headerMiddle = await loadImage(__dirname + `/assets/header-${item.itemRarity}-middle.png`)
  const headerLeft = await loadImage(__dirname + `/assets/header-${item.itemRarity}-left.png`)
  const headerRight = await loadImage(__dirname + `/assets/header-${item.itemRarity}-right.png`)

  let headerHeight = headerLeft.height
  let headerWidth = headerLeft.width

  if (![ 'Rare', 'Unique' ].includes(item.itemRarity)) {
    headerHeight = (headerHeight/1.5)
    headerWidth = (headerWidth/1.5)
  }

  const canvas = createCanvas(1200, 1200)
  const ctx = canvas.getContext('2d')

  let currentY = headerHeight + headerMargin

  // measure width
  let linesMaxWidth = 0

  ctx.font = `${fontHeight}px FontinSmallCaps`

  item.flavorText = limitFlavorText(item.flavorText)
  const flavorSplit = item.flavorText?.lines ?? []

  let sanctumStats = []
  if (item.sanctum?.minorBoons?.length) {
    sanctumStats.push('Minor Boons: ' + item.sanctum.minorBoons.join(', '))
  }
  if (item.sanctum?.majorBoons?.length) {
    sanctumStats.push('Major Boons: ' + item.sanctum.majorBoons.join(', '))
  }
  if (item.sanctum?.minorAfflictions?.length) {
    sanctumStats.push('Minor Afflictions: ' + item.sanctum.minorAfflictions.join(', '))
  }
  if (item.sanctum?.majorAfflictions?.length) {
    sanctumStats.push('Major Afflictions: ' + item.sanctum.majorAfflictions.join(', '))
  }

  const measureLines = [
    ...limitText(item.affixes),
    ...item.runes,
    ...item.implicits,
    ...item.enchants,
    ...flavorSplit,
    ...sanctumStats,
  ]

  for (const line of measureLines) {
    const metrics = ctx.measureText(line)

    if (linesMaxWidth < metrics.width) {
      linesMaxWidth = metrics.width
    }
  }

  ctx.font = `${nameFontHeight}px FontinSmallCaps`

  for (const line of item.itemName.lines) {
    const metrics = ctx.measureText(line)

    if (linesMaxWidth < metrics.width) {
      linesMaxWidth = metrics.width + headerWidth + headerMargin
    }
  }

  canvas.width = linesMaxWidth + (headerWidth*2)

  // draw background
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // prepare font
  ctx.font = `${fontHeight}px FontinSmallCaps`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // item class
  ctx.fillStyle = color.grey

  const singularClass = item.itemClass
    .replace(/staves$/, 'staff')
    .replace(/s$/, '')
  ctx.fillText(singularClass, canvas.width/2, currentY)
  currentY += lineHeight

  // stack size
  if (item.stackSize) {
    let maxSize = ''

    // don't show stack size if it's bigger than max
    if (item.stackSize.max && item.stackSize.max >= item.stackSize.current) {
      maxSize = `/${item.stackSize.max}`
    }

    const mainText = `Stack Size: `
    const stackText = item.stackSize.current + maxSize
    const mainTextWidth = ctx.measureText(mainText).width
    const qualityTextWidth = ctx.measureText(stackText).width

    ctx.fillText(mainText, (canvas.width/2)-(qualityTextWidth/2), currentY)
    ctx.fillStyle = color.white
    ctx.fillText(stackText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  // quality
  if (item.quality && item.quality > 0) {
    const catalystQuality = item.qualityType ? ` (${item.qualityType})` : ''
    const mainText = `Quality${catalystQuality}: `
    const qualityText = `+${item.quality}%`
    const mainTextWidth = ctx.measureText(mainText).width
    const qualityTextWidth = ctx.measureText(qualityText).width

    ctx.fillText(mainText, (canvas.width/2)-(qualityTextWidth/2), currentY)
    ctx.fillStyle = color.affix
    ctx.fillText(qualityText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  function drawElementalDamage(name) {
    if (item.elementalDamage?.length) {
      ctx.fillStyle = color.grey

      const base = `${name}: `
      const a = `${item.elementalDamage[0]?.min}-${item.elementalDamage[0]?.max}` + (item.elementalDamage.length > 1 ? ', ' : '')
      const b = `${item.elementalDamage[1]?.min}-${item.elementalDamage[1]?.max}` + (item.elementalDamage.length > 2 ? ', ' : '')
      const c = `${item.elementalDamage[2]?.min}-${item.elementalDamage[2]?.max}`
      const baseWidth = ctx.measureText(base).width
      const aWidth = (item.elementalDamage.length > 0) ? ctx.measureText(a).width : 0
      const bWidth = (item.elementalDamage.length > 1) ? ctx.measureText(b).width : 0
      const cWidth = (item.elementalDamage.length > 2) ? ctx.measureText(c).width : 0

      ctx.fillText(base, (canvas.width/2)-(aWidth/2)-(bWidth/2)-(cWidth/2), currentY)

      if (item.elementalDamage.length > 0) {
        ctx.fillStyle = color.affix
        ctx.fillText(a, (canvas.width/2)+(baseWidth/2)-(bWidth/2)-(cWidth/2), currentY)
      }

      if (item.elementalDamage.length > 1) {
        ctx.fillStyle = color.affix
        ctx.fillText(b, (canvas.width/2)+(baseWidth/2)+(aWidth/2)-(cWidth/2), currentY)
      }

      if (item.elementalDamage.length > 2) {
        ctx.fillStyle = color.affix
        ctx.fillText(c, (canvas.width/2)+(baseWidth/2)+(aWidth/2)+(bWidth/2), currentY)
      }

      currentY += lineHeight
    }
  }

  // base stats
  for (const line of [
    { name: 'Block Chance', value: item.blockChance ? item.blockChance + '%' : undefined },
    { name: 'Armour', value: item.stats.armour },
    { name: 'Evasion Rating', alt: 'Evasion', value: item.stats.evasionRating },
    { name: 'Energy Shield', value: item.stats.energyShield },
    { name: 'Spirit', value: item.stats.spirit },
    { name: 'Physical Damage', value: item.physicalDamage },
    { name: 'Lightning Damage', value: item.fireDamage },
    { name: 'Cold Damage', value: item.coldDamage },
    { name: 'Lightning Damage', value: item.lightningDamage },
    { name: 'Elemental Damage' },
    { name: 'Critical Hit Chance', value: item.criticalHitChance ? item.criticalHitChance.toFixed(2) + '%' : undefined },
    { name: 'Attacks Per Second', alt: 'Attack Speed', value: item.attacksPerSecond },
    { name: 'Reload Time', alt: 'Attack Speed', value: item.reloadTime },
    { name: 'Limited To', value: item.limitedTo },
    { name: 'Radius', value: item.radius },
    { name: 'Charm Slots', value: item.charmSlots },
  ]) {
    if (line.name === 'Elemental Damage') {
      drawElementalDamage(line.name)
      continue
    }

    ctx.fillStyle = color.grey

    if (line.value) {
      const name = `${line.name}: `
      const value = Array.isArray(line.value) ? `${line.value[0].min}-${line.value[0].max}` : line.value
      const nameWidth = ctx.measureText(name).width
      const valueWidth = ctx.measureText(value).width
      const increaseTest = line.alt ?? line.name

      ctx.fillText(name, (canvas.width/2)-(valueWidth/2), currentY)
      ctx.fillStyle = isBaseValueIncreased(item, increaseTest) ? color.affix : color.white
      ctx.fillText(value, (canvas.width/2)+(nameWidth/2), currentY)
      ctx.fillStyle = color.grey

      currentY += lineHeight
    }
  }

  // flask recovery
  if (item.flaskRecovery) {
    // Example line: "Recovers 372 Mana over 9,70 Seconds"
    let value1 = item.flaskRecovery.mana
    let value2 = item.flaskRecovery.over
    let tMiddle = ` Mana over `

    if (item.flaskRecovery.life) {
      value1 = item.flaskRecovery.life
      tMiddle = ` Life over `
    }
    if (item.flaskRecovery.energyShield) {
      value1 = item.flaskRecovery.energyShield
      tMiddle = ` Energy Shield over `
    }

    const tLeft = `Recovers `
    const tRight = ` Seconds`
    const tLeftWidth = ctx.measureText(tLeft).width
    const value1Width = ctx.measureText(value1).width
    const tMiddleWidth = ctx.measureText(tMiddle).width
    const value2Width = ctx.measureText(value2).width
    const tRightWidth = ctx.measureText(tRight).width

    // Recovers
    ctx.fillStyle = color.grey
    ctx.fillText(tLeft, (canvas.width/2)-(value1Width/2)-(tMiddleWidth/2)-(value2Width/2)-(tRightWidth/2), currentY)

    // value1
    ctx.fillStyle = isBaseValueIncreased(item, 'Recovery') ? color.affix : color.white
    ctx.fillText(value1, (canvas.width/2)+(tLeftWidth/2)-(tMiddleWidth/2)-(value2Width/2)-(tRightWidth/2), currentY)

    // mana/life/es over
    ctx.fillStyle = color.grey
    ctx.fillText(tMiddle, (canvas.width/2)+(tLeftWidth/2)+(value1Width/2)-(value2Width/2)-(tRightWidth/2), currentY)

    // value2
    ctx.fillStyle = isBaseValueIncreased(item, 'Duration') ? color.affix : color.white
    ctx.fillText(value2, (canvas.width/2)+(tLeftWidth/2)+(value1Width/2)+(tMiddleWidth/2)-(tRightWidth/2), currentY)

    // Seconds
    ctx.fillStyle = color.grey
    ctx.fillText(tRight, (canvas.width/2)+(tLeftWidth/2)+(value1Width/2)+(tMiddleWidth/2)+(value2Width/2), currentY)

    currentY += lineHeight
  }

  // flask charges
  if (item.charges) {
    // Example Line: Consumes 10 of 75 Charges on use
    const tLeft = `Consumes `
    const value1 = item.charges.consumes
    let tMiddle = ` of `
    const value2 = item.charges.max
    const tRight = ` Charges on use`
    const tLeftWidth = ctx.measureText(tLeft).width
    const value1Width = ctx.measureText(value1).width
    const tMiddleWidth = ctx.measureText(tMiddle).width
    const value2Width = ctx.measureText(value2).width
    const tRightWidth = ctx.measureText(tRight).width

    // Consumes
    ctx.fillStyle = color.grey
    ctx.fillText(tLeft, (canvas.width/2)-(value1Width/2)-(tMiddleWidth/2)-(value2Width/2)-(tRightWidth/2), currentY)

    // value1
    ctx.fillStyle = isBaseValueIncreased(item, 'Charges') ? color.affix : color.white
    ctx.fillText(value1, (canvas.width/2)+(tLeftWidth/2)-(tMiddleWidth/2)-(value2Width/2)-(tRightWidth/2), currentY)

    // of
    ctx.fillStyle = color.grey
    ctx.fillText(tMiddle, (canvas.width/2)+(tLeftWidth/2)+(value1Width/2)-(value2Width/2)-(tRightWidth/2), currentY)

    // value2 (not scaleable afaik)
    ctx.fillStyle = color.white
    ctx.fillText(value2, (canvas.width/2)+(tLeftWidth/2)+(value1Width/2)+(tMiddleWidth/2)-(tRightWidth/2), currentY)

    // Charges on use
    ctx.fillStyle = color.grey
    ctx.fillText(tRight, (canvas.width/2)+(tLeftWidth/2)+(value1Width/2)+(tMiddleWidth/2)+(value2Width/2), currentY)

    currentY += lineHeight
  }


  // item level
  if (item.itemLevel) {
    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom

    ctx.fillStyle = color.white
    ctx.fillText(`Item Level: ${item.itemLevel}`, canvas.width/2, currentY)
    currentY += lineHeight
  }

  // requirements
  if (item.requirements.level || item.requirements.intelligence || item.requirements.strength || item.requirements.dexterity) {
    ctx.fillStyle = color.grey

    const hasAttributeReq = item.requirements.intelligence || item.requirements.strength || item.requirements.dexterity
    const hasDexOrInt = item.requirements.dexterity || item.requirements.intelligence
    const hasInt = item.requirements.intelligence

    const base = `Requires: `
    const level = `Level ${item.requirements.level}` + (hasAttributeReq ? ', ' : '')
    const str = `${item.requirements.strength} Str` + (hasDexOrInt ? ', ' : '')
    const dex = `${item.requirements.dexterity} Dex` + (hasInt ? ', ' : '')
    const int = `${item.requirements.intelligence} Int`
    const baseWidth = ctx.measureText(base).width
    const levelWidth = item.requirements.level ? ctx.measureText(level).width : 0
    const strWidth = item.requirements.strength ? ctx.measureText(str).width : 0
    const dexWidth = item.requirements.dexterity ? ctx.measureText(dex).width : 0
    const intWidth = item.requirements.intelligence ? ctx.measureText(int).width : 0

    ctx.fillText(base, (canvas.width/2)-(levelWidth/2)-(strWidth/2)-(dexWidth/2)-(intWidth/2), currentY)

    if (item.requirements.level) {
      ctx.fillStyle = color.white
      ctx.fillText(level, (canvas.width/2)+(baseWidth/2)-(strWidth/2)-(dexWidth/2)-(intWidth/2), currentY)
    }

    if (item.requirements.strength) {
      ctx.fillStyle = isBaseValueIncreased(item, 'Reduced Attribute Requirements') ? color.affix : color.white
      ctx.fillText(str, (canvas.width/2)+(baseWidth/2)+(levelWidth/2)-(dexWidth/2)-(intWidth/2), currentY)
    }

    if (item.requirements.dexterity) {
      ctx.fillStyle = isBaseValueIncreased(item, 'Reduced Attribute Requirements') ? color.affix : color.white
      ctx.fillText(dex, (canvas.width/2)+(baseWidth/2)+(levelWidth/2)+(strWidth/2)-(intWidth/2), currentY)
    }

    if (item.requirements.intelligence) {
      ctx.fillStyle = isBaseValueIncreased(item, 'Reduced Attribute Requirements') ? color.affix : color.white
      ctx.fillText(int, (canvas.width/2)+(baseWidth/2)+(levelWidth/2)+(strWidth/2)+(dexWidth/2), currentY)
    }

    currentY += lineHeight
  }

  // separator
  currentY = currentY + separatorMarginTop
  ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
  currentY = currentY + separatorMarginBottom

  // area level
  if (item.areaLevel) {
    const mainText = 'Area Level: '
    const areaLevelText = item.areaLevel
    const mainTextWidth = ctx.measureText(mainText).width
    const areaLevelTextWidth = ctx.measureText(areaLevelText).width

    ctx.fillStyle = color.grey
    ctx.fillText(mainText, (canvas.width/2)-(areaLevelTextWidth/2), currentY)
    ctx.fillStyle = color.white
    ctx.fillText(areaLevelText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  // number of trials
  if (item.numberOfTrials) {
    const mainText = 'Number of Trials: '
    const trialCountText = item.numberOfTrials
    const mainTextWidth = ctx.measureText(mainText).width
    const trialCountTextWidth = ctx.measureText(trialCountText).width

    ctx.fillStyle = color.grey
    ctx.fillText(mainText, (canvas.width/2)-(trialCountTextWidth/2), currentY)
    ctx.fillStyle = color.white
    ctx.fillText(trialCountText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  // Minor Boons
  if (item.sanctum?.minorBoons?.length) {
    const mainText = 'Minor Boons: '
    const contentText = item.sanctum.minorBoons.join(', ')
    const mainTextWidth = ctx.measureText(mainText).width
    const contentTextWidth = ctx.measureText(contentText).width

    ctx.fillStyle = color.grey
    ctx.fillText(mainText, (canvas.width/2)-(contentTextWidth/2), currentY)
    ctx.fillStyle = color.boon
    ctx.fillText(contentText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  // Major Boons
  if (item.sanctum?.majorBoons?.length) {
    const mainText = 'Major Boons: '
    const contentText = item.sanctum.majorBoons.join(', ')
    const mainTextWidth = ctx.measureText(mainText).width
    const contentTextWidth = ctx.measureText(contentText).width

    ctx.fillStyle = color.grey
    ctx.fillText(mainText, (canvas.width/2)-(contentTextWidth/2), currentY)
    ctx.fillStyle = color.boon
    ctx.fillText(contentText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  // Minor Afflictions
  if (item.sanctum?.minorAfflictions?.length) {
    const mainText = 'Minor Afflictions: '
    const contentText = item.sanctum.minorAfflictions.join(', ')
    const mainTextWidth = ctx.measureText(mainText).width
    const contentTextWidth = ctx.measureText(contentText).width

    ctx.fillStyle = color.grey
    ctx.fillText(mainText, (canvas.width/2)-(contentTextWidth/2), currentY)
    ctx.fillStyle = color.affliction
    ctx.fillText(contentText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  // Major Afflictions
  if (item.sanctum?.majorAfflictions?.length) {
    const mainText = 'Major Afflictions: '
    const contentText = item.sanctum.majorBoons.join(', ')
    const mainTextWidth = ctx.measureText(mainText).width
    const contentTextWidth = ctx.measureText(contentText).width

    ctx.fillStyle = color.grey
    ctx.fillText(mainText, (canvas.width/2)-(contentTextWidth/2), currentY)
    ctx.fillStyle = color.affliction
    ctx.fillText(contentText, (canvas.width/2)+(mainTextWidth/2), currentY)

    currentY += lineHeight
  }

  // special case: magic ultimatum trials and normal started sanctum trials
  if ((item.areaLevel || item.numberOfTrials || Object.keys(item.sanctum).length) &&
    ['Normal', 'Magic'].includes(item.itemRarity)) {
    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom
  }

  // enchants
  if (item.enchants.length) {
    ctx.fillStyle = color.enchant
    for (const line of item.enchants) {
      ctx.fillText(line, canvas.width/2, currentY)
      currentY += lineHeight
    }

    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom
  }

  // runes
  if (item.runes.length) {
    ctx.fillStyle = color.enchant
    for (const line of item.runes) {
      ctx.fillText(line, canvas.width/2, currentY)
      currentY += lineHeight
    }

    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom
  }

  // implicits
  if (item.implicits.length) {
    ctx.fillStyle = color.affix
    for (const line of item.implicits) {
      ctx.fillText(line, canvas.width/2, currentY)
      currentY += lineHeight
    }

    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom
  }

  // explicits
  ctx.fillStyle = color.affix

  for (const line of limitText(item.affixes)) {
    ctx.fillText(line, canvas.width/2, currentY)
    currentY += lineHeight
  }

  // corrupted
  if (item.corrupted) {
    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom

    ctx.fillStyle = color.corrupted
    ctx.fillText('Corrupted', canvas.width/2, currentY)
    currentY += lineHeight
  }

  // mirrored
  if (item.mirrored) {
    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom

    ctx.fillStyle = color.magic
    ctx.fillText('Mirrored', canvas.width/2, currentY)
    currentY += lineHeight
  }

  // unmodifiable
  if (item.unmodifiable) {
    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom

    ctx.fillStyle = color.magic
    ctx.fillText('Unmodifiable', canvas.width/2, currentY)
    currentY += lineHeight
  }

  // unidentified
  if (!item.identified) {
    ctx.fillStyle = color.corrupted
    ctx.fillText('Unidentified', canvas.width/2, currentY)
    currentY += lineHeight
  }

  // flavor text
  if (item.flavorText) {
    // separator
    currentY = currentY + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), currentY)
    currentY = currentY + separatorMarginBottom

    ctx.fillStyle = color.unique
    for (const line of item.flavorText.lines) {
      const skewAngle = -0.3
      ctx.save()
      ctx.transform(1, 0, skewAngle, 1, 0, 0)
      const adjustedX = ((canvas.width/2) - skewAngle * (currentY - lineHeight / 2)) + 5
      ctx.fillText(line, adjustedX, currentY)
      currentY += lineHeight
      ctx.restore()
    }
  }

  // header
  let headerMiddleX = 0
  while (headerMiddleX < canvas.width) {
    ctx.drawImage(headerMiddle, headerMiddleX, 0, headerWidth, headerHeight)
    headerMiddleX += headerWidth-1
  }

  ctx.drawImage(headerLeft, 0, 0, headerWidth, headerHeight)
  ctx.drawImage(headerRight, canvas.width-headerWidth, 0, headerWidth, headerHeight)

  // item name
  const nameColor = item.itemRarity === 'Unique' ? color.uniqueName : color[item.itemRarity.toLowerCase()]
  ctx.fillStyle = nameColor
  ctx.font = `${nameFontHeight}px FontinSmallCaps`

  ctx.fillText(item.itemName.lines[0], canvas.width/2, nameOffset)
  item.itemName.lines[1] && ctx.fillText(item.itemName.lines[1], canvas.width/2, nameFontHeight-nameOffset)

  resizeCanvasWithoutClearing(canvas, canvas.width, currentY + headerMargin)

  return canvas
}