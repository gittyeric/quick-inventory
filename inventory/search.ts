import { readFileSync } from 'fs'
import prompts = require('prompts');
import { isNumber } from 'util';

interface InventoryLocation {
    location: string,
    quantity: number,
}

interface InventoryLocations {
    [location: string]: InventoryLocation
}

interface InventoryItem {
    name: string,
    locations: InventoryLocations
}

interface InventoryIndex {
    [name: string]: InventoryItem
}

interface InventoryReverseIndex {
    [name: string]: InventoryItem[]
}

const inventoryIndex = <InventoryIndex>JSON.parse(readFileSync('../inventory.json').toString())
const allLocations = new Set<string>()
Object.values(inventoryIndex).map((inv) =>
    Object.values(inv.locations)
        .forEach((location) => allLocations.add(location.location))
)
const sortedLocations = Array.from(allLocations).sort()
const searchIndex: InventoryReverseIndex = {}

function nameToKeywords(name: string) {
    return nameToId(name).split(' ')
        .map(kw => kw.toLowerCase())
}

function addToSearchIndex(item: InventoryItem) {
    const keywords = nameToKeywords(item.name)

    keywords.forEach((kw) => {
        const curHits = searchIndex[kw]
        if (curHits === undefined) {
            searchIndex[kw] = [item]
        }
        else {
            searchIndex[kw] = [...curHits, item]
        }
    })
}

Object.keys(inventoryIndex).forEach((id) => {
    const item = inventoryIndex[id]
    addToSearchIndex(item)
})

function nameToId(name: string) {
    if (!name) {
        console.log("Exiting...")
        process.exit()
    }
    return name.trim().replace(/\s+/g, ' ')
}

function getItemIdToCount(keywords): Map<string, number> {
    const itemIdToCount = new Map<string, number>()
    keywords.forEach((kw) => {
        const hits = searchIndex[kw]
        if (hits !== undefined) {
            hits.forEach((hit) => {
                const hitId = nameToId(hit.name)
                const curCount = itemIdToCount[hitId]
                itemIdToCount.set(hitId, curCount === undefined ? 1 : (curCount + 1))
            })
        }
    })
    return itemIdToCount
}

function getTopIds(itemIdToCount: Map<string, number>): string[] {
    return [...itemIdToCount].slice().sort(function(a, b) {
        return a[1] - b[1];
    }).map(e => e[0]).reverse()
}

function showResult(item: InventoryItem) {
    console.log('===============================')
    console.log(item.name)
    console.log('')
    Object.keys(item.locations).forEach((location) => {
        const il = item.locations[location]
        console.log('Quantity of ' + il.quantity + ' @' + il.location)
    })
    console.log('===============================')
}

function promptSearch() {
    const prompt = prompts<string>({
        type: 'text',
        name: 'val',
        message: `Search thing name (or type "locations"): `,
        validate: (value: string) =>
            nameToId(value).length > 1 ? true : 'Please enter a name with > 1 character'
    })

    prompt.then((answers: prompts.Answers<string>) => {
        const name = answers['val']
        const keywords = nameToKeywords(name)

        if (name === 'exit') {
            process.exit(0)
        }
        if (name === 'locations') {
            console.log("All Locations:")
            sortedLocations.forEach((location) =>
                console.log(location))
            promptSearch()
            return;
        }

        const itemIdToCount = getItemIdToCount(keywords)
        const topMatchingIds = getTopIds(itemIdToCount)
        const topMatches = topMatchingIds.map((id) => inventoryIndex[id])

        if (topMatches.length === 0) {
            console.log("No matches found!\n")
            promptSearch()
            return;
        }

        if (topMatches.length === 1 || topMatches[topMatches.length - 1].name === name) {
            showResult(topMatches[topMatches.length - 1])
            promptSearch()
        }
        else {
            console.log("\nTop Matches:\n")
            topMatches.forEach((item, i) => {
                console.log((topMatches.length - i) + '). ' + item.name)
            })
            promptResult(topMatches)
        }
    })
}

function promptResult(topMatches: InventoryItem[]) {
    const prompt = prompts<string>({
        type: 'number',
        name: 'val',
        message: `Select a result`,
        initial: '1',
        validate: (value: string) => {
            const selection = parseInt(value)
            if (!isNumber(selection) || selection < 1 || selection > topMatches.length) {
                return "Please pick between 1 and " + topMatches.length
            }
            return true
        }
    })

    prompt.then((answers: prompts.Answers<string>) => {
        const matchNumber = parseInt(answers["val"])
        showResult(topMatches[topMatches.length - matchNumber])
        promptSearch()
    })
}

promptSearch()
