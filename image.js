import { registerFont, createCanvas, loadImage } from 'canvas'
import * as fs from 'fs';

const headerHeight = 55
const headerWidth = 47
const headerMargin = 10
const horizontalMargin = 40
const fontHeight = 18
const lineHeight = 20
const nameOffset = 2
const nameFontHeight = 24
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
  normal: '#ac8c8c8',
  magic: '#8888ff',
  rare: '#ffff77',
  unique: '#af6025',
  uniqueName: '#ee681d',
  quest: '#4ae63a',
}

const state = {
  y: 0,
}

function isBaseValueIncreased(item, name) {
  if (name !== 'Reduced Attribute Requirements' && name !== 'Block Chance' && item.quality && item.quality > 0) {
    return true
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
  const context = canvas.getContext('2d');

  // Save the current canvas content as an image
  const savedContent = context.getImageData(0, 0, canvas.width, canvas.height);

  // Resize the canvas
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Restore the saved content
  context.putImageData(savedContent, 0, 0);
}

export async function renderItem(item) {
  registerFont('assets/fontin-smallcaps-webfont.ttf', { family: 'FontinSmallCaps' })
  const separator = await loadImage(`assets/separator-${item.itemRarity}.png`)

  const canvas = createCanvas(1200, 1200)
  const ctx = canvas.getContext('2d')

  state.y = headerHeight + headerMargin

  // measure width
  let linesMaxWidth = 0

  ctx.font = `${fontHeight}px FontinSmallCaps`

  const flavorSplit = item.flavorText?.split('\n') ?? []

  const measureLines = [
    ...item.affixes,
    ...item.runes,
    ...item.implicits,
    ...item.enchants,
    ...flavorSplit,
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

  canvas.width = linesMaxWidth + horizontalMargin

  // draw background
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // prepare font
  ctx.font = `${fontHeight}px FontinSmallCaps`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // draw item class
  ctx.fillStyle = color.grey

  ctx.fillText(item.itemClass, canvas.width/2, state.y)
  state.y += lineHeight

  // draw quality
  if (item.quality && item.quality > 0) {
    const catalystQuality = item.qualityType ? ` (${item.qualityType})` : ''
    const mainText = `Quality${catalystQuality}: `
    const qualityText = `+${item.quality}%`
    const mainTextWidth = ctx.measureText(mainText).width;
    const qualityTextWidth = ctx.measureText(qualityText).width;

    ctx.fillText(mainText, (canvas.width/2)-(qualityTextWidth/2), state.y)
    ctx.fillStyle = color.affix
    ctx.fillText(qualityText, (canvas.width/2)+(mainTextWidth/2), state.y)

    state.y += lineHeight
  }

  // draw base stats
  ctx.fillStyle = color.grey

  for (const line of [
    { name: 'Block Chance', value: item.blockChance ? item.blockChance + '%' : undefined },
    { name: 'Armour', value: item.stats.armour },
    { name: 'Evasion Rating', alt: 'Evasion', value: item.stats.evasionRating },
    { name: 'Energy Shield', value: item.stats.energyShield },
    { name: 'Spirit', value: item.stats.spirit },
    { name: 'Physical Damage', value: item.physicalDamage },
    // TODO: handle elemental damage
    { name: 'Critical Hit Chance', value: item.criticalHitChance ? item.criticalHitChance.toFixed(2) + '%' : undefined },
    { name: 'Attacks Per Second', alt: 'Attack Speed', value: item.attacksPerSecond },
    // TODO: handle reload time
    { name: 'Charm Slots', value: item.charmSlots },
  ]) {
    if (line.value) {
      const name = `${line.name}: `
      const value = Array.isArray(line.value) ? `${line.value[0].min} - ${line.value[0].max}` : line.value
      const nameWidth = ctx.measureText(name).width
      const valueWidth = ctx.measureText(value).width
      const increaseTest = line.alt ?? line.name

      ctx.fillText(name, (canvas.width/2)-(valueWidth/2), state.y)
      ctx.fillStyle = isBaseValueIncreased(item, increaseTest) ? color.affix : color.white
      ctx.fillText(value, (canvas.width/2)+(nameWidth/2), state.y)
      ctx.fillStyle = color.grey

      state.y += lineHeight
    }
  }

  // separator
  state.y = state.y + separatorMarginTop
  ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), state.y)
  state.y = state.y + separatorMarginBottom

  // requirements
  ctx.fillStyle = color.white
  ctx.fillText(`Item Level: ${item.itemLevel ?? 1}`, canvas.width/2, state.y)
  state.y += lineHeight

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

    ctx.fillText(base, (canvas.width/2)-(levelWidth/2)-(strWidth/2)-(dexWidth/2)-(intWidth/2), state.y)

    if (item.requirements.level) {
      ctx.fillStyle = color.white
      ctx.fillText(level, (canvas.width/2)+(baseWidth/2)-(strWidth/2)-(dexWidth/2)-(intWidth/2), state.y)
    }

    if (item.requirements.strength) {
      ctx.fillStyle = isBaseValueIncreased(item, 'Reduced Attribute Requirements') ? color.affix : color.white
      ctx.fillText(str, (canvas.width/2)+(baseWidth/2)+(levelWidth/2)-(dexWidth/2)-(intWidth/2), state.y)
    }

    if (item.requirements.dexterity) {
      ctx.fillStyle = isBaseValueIncreased(item, 'Reduced Attribute Requirements') ? color.affix : color.white
      ctx.fillText(dex, (canvas.width/2)+(baseWidth/2)+(levelWidth/2)+(strWidth/2)-(intWidth/2), state.y)
    }

    if (item.requirements.intelligence) {
      ctx.fillStyle = isBaseValueIncreased(item, 'Reduced Attribute Requirements') ? color.affix : color.white
      ctx.fillText(int, (canvas.width/2)+(baseWidth/2)+(levelWidth/2)+(strWidth/2)+(dexWidth/2), state.y)
    }

    state.y += lineHeight
  }

  // separator
  state.y = state.y + separatorMarginTop
  ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), state.y)
  state.y = state.y + separatorMarginBottom

  // enchants
  if (item.enchants.length) {
    ctx.fillStyle = color.enchant
    for (const line of item.enchants) {
      ctx.fillText(line, canvas.width/2, state.y)
      state.y += lineHeight
    }

    // separator
    state.y = state.y + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), state.y)
    state.y = state.y + separatorMarginBottom
  }

  // runes
  if (item.runes.length) {
    ctx.fillStyle = color.enchant
    for (const line of item.runes) {
      ctx.fillText(line, canvas.width/2, state.y)
      state.y += lineHeight
    }

    // separator
    state.y = state.y + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), state.y)
    state.y = state.y + separatorMarginBottom
  }

  // implicits
  if (item.implicits.length) {
    ctx.fillStyle = color.affix
    for (const line of item.implicits) {
      ctx.fillText(line, canvas.width/2, state.y)
      state.y += lineHeight
    }

    // separator
    state.y = state.y + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), state.y)
    state.y = state.y + separatorMarginBottom
  }

  // draw affixes
  ctx.fillStyle = color.affix

  for (const line of item.affixes) {
    ctx.fillText(line, canvas.width/2, state.y)
    state.y += lineHeight
  }

  // corrupted
  if (item.corrupted) {
    // separator
    state.y = state.y + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), state.y)
    state.y = state.y + separatorMarginBottom

    ctx.fillStyle = color.corrupted
    ctx.fillText('Corrupted', canvas.width/2, state.y)
    state.y += lineHeight
  }

  if (item.flavorText) {
    // separator
    state.y = state.y + separatorMarginTop
    ctx.drawImage(separator, (canvas.width/2)-(separatorWidth/2), state.y)
    state.y = state.y + separatorMarginBottom

    ctx.fillStyle = color.unique
    for (const line of item.flavorText.split('\n')) {
      const skewAngle = -0.3;
      ctx.save()
      ctx.transform(1, 0, skewAngle, 1, 0, 0);
      const adjustedX = ((canvas.width/2) - skewAngle * (state.y - lineHeight / 2)) + 5;
      ctx.fillText(line, adjustedX, state.y)
      state.y += lineHeight
      ctx.restore()
    }
  }

  // draw header
  const headerMiddle = await loadImage(`assets/header-${item.itemRarity}-middle.png`)
  const headerLeft = await loadImage(`assets/header-${item.itemRarity}-left.png`)
  const headerRight = await loadImage(`assets/header-${item.itemRarity}-right.png`)

  // draw headerMiddle repeatingly until it doesn't fit anymore
  let headerMiddleX = 0
  while (headerMiddleX < canvas.width) {
    ctx.drawImage(headerMiddle, headerMiddleX, 0)
    headerMiddleX += headerWidth
  }

  ctx.drawImage(headerLeft, 0, 0)
  ctx.drawImage(headerRight, canvas.width-headerWidth, 0)

  // item name
  const nameColor = item.itemRarity === 'Unique' ? color.uniqueName : color[item.itemRarity.toLowerCase()]
  ctx.fillStyle = nameColor
  ctx.font = `${nameFontHeight}px FontinSmallCaps`
  ctx.fillText(item.itemName.lines[0], canvas.width/2, nameOffset)
  ctx.fillText(item.itemName.lines[1], canvas.width/2, nameFontHeight-nameOffset)


  resizeCanvasWithoutClearing(canvas, canvas.width, state.y + headerMargin)

  const out = fs.createWriteStream(`out/${item.itemName.name}.png`)
  const stream = canvas.createPNGStream()
  stream.pipe(out)
  // out.on('finish', () => console.log('The PNG file was created.'))
}