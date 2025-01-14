import { PoE2ItemParser } from 'poe-item-parser'
import { renderItem } from './image.js'

renderItem

const wand = `
Item Class: Wands
Rarity: Rare
Spirit Call
Siphoning Wand
--------
Quality: +20% (augmented)
--------
Requirements:
Level: 78
Int: 178
--------
Item Level: 81
--------
Gain 27% of Damage as Extra Cold Damage
81% increased Spell Damage
77% increased Lightning Damage
+5 to Level of all Lightning Spell Skills
53% increased Mana Regeneration Rate
70% increased chance to Shock
`

const body = `
Item Class: Body Armours
Rarity: Rare
Golem Hide
Expert Hexer's Robe
--------
Quality: +20% (augmented)
Energy Shield: 820 (augmented)
--------
Requirements:
Level: 65
Int: 157
--------
Sockets: S S S
--------
Item Level: 80
--------
60% increased Armour, Evasion and Energy Shield (rune)
--------
+86 to maximum Energy Shield
93% increased Energy Shield
+193 to maximum Life
+35% to Fire Resistance
+40% to Cold Resistance
+64 to Stun Threshold
--------
Corrupted
`

const shield = `
Item Class: Shields
Rarity: Unique
Mahuxotl's Machination
Omen Crest Shield
--------
Quality: +20% (augmented)
Block chance: 25%
Armour: 400 (augmented)
Energy Shield: 152 (augmented)
--------
Requirements:
Level: 48
Str: 37
Int: 37
--------
Sockets: S S S
--------
Item Level: 82
--------
30% increased Rarity of Items found (rune)
--------
566% increased Armour and Energy Shield
627% increased effect of Socketed Soul Cores
--------
The Banished Architect sought to employ the darkest secrets of the Vaal.
--------
Corrupted
`

const stave1 = `
Item Class: Quarterstaves
Rarity: Rare
Gale Call
Expert Crackling Quarterstaff
--------
Physical Damage: 43-51 (augmented)
Lightning Damage: 46-224 (augmented)
Critical Hit Chance: 10.00%
Attacks per Second: 1.40
--------
Requirements:
Level: 78
Dex: 165 (unmet)
Int: 64
--------
Item Level: 78
--------
Adds 43 to 51 Physical Damage
Adds 3 to 52 Lightning Damage
+153 to Accuracy Rating
Causes 55% increased Stun Buildup
`

const belt = `
Item Class: Belts
Rarity: Unique
Zerphi's Genesis
Heavy Belt
--------
Charm Slots: 3 (augmented)
--------
Requirements:
Level: 56
--------
Item Level: 82
--------
23% increased Stun Threshold (implicit)
--------
+2 Charm Slots
+26 to Strength
Corrupted Blood cannot be inflicted on you
50% of charges used by Charms granted to your Life Flasks
27% increased Charm Charges used
--------
The most horrifying ideas often begin with a simple innovation.
`

const helmet = `
Item Class: Helmets
Rarity: Unique
Atziri's Disdain
Gold Circlet
--------
Quality: +20% (augmented)
Energy Shield: 70 (augmented)
--------
Requirements:
Level: 40
Int: 74
--------
Sockets: S
--------
Item Level: 79
--------
+24 to Spirit (enchant)
--------
2% increased maximum Mana (rune)
--------
+57 to maximum Mana
18% increased Rarity of Items found
24% of Damage taken bypasses Energy Shield
Gain 30% of Maximum Life as Extra Maximum Energy Shield
--------
They screamed her name in adulation as they gave
their very lives. She looked on with impatience.
--------
Corrupted
`

const body2 = `
Item Class: Body Armours
Rarity: Unique
Foxshade
Quilted Vest
--------
Quality: +20% (augmented)
Evasion Rating: 127 (augmented)
--------
Requirements:
Dexterity: 10
--------
Sockets: S S S
--------
Item Level: 7
--------
+12% to Fire Resistance (rune)
+12% to Cold Resistance (rune)
+12% to Lightning Resistance (rune)
--------
+62 to Evasion Rating
+30 to Dexterity
10% increased Movement Speed when on Full Life
100% increased Evasion Rating when on Full Life
--------
To catch an animal, think like an animal.
--------
Corrupted
`

const body3 = `
Item Class: Body Armours
Rarity: Unique
Temporalis
Silk Robe
--------
Quality: +20% (augmented)
Energy Shield: 244 (augmented)
--------
Requirements:
Level: 64
Int: 47
--------
Sockets: S S
--------
Item Level: 82
--------
+142 to maximum Energy Shield
+14% to all Elemental Resistances
15% of Damage taken Recouped as Life
27% of Damage taken Recouped as Mana
Skills have -2.96 seconds to Cooldown
--------
The final element the tale-women
mastered was Time itself.
`

for (const item of [ wand, body, belt, helmet, stave1, body2, shield, body3 ]) {
  const i = new PoE2ItemParser(item)

  console.log(i.getItem())
  await renderItem(i.getItem())
}