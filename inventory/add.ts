import { readFileSync, writeFile, existsSync, writeFileSync } from 'fs'
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

// Ensure inventory file exists
const inventoryFile = "../inventory.json"
if (!existsSync(inventoryFile)) {
    writeFileSync(inventoryFile, "{}")
}

const inventoryIndex = <InventoryIndex>JSON.parse(readFileSync(inventoryFile).toString())
const searchIndex: InventoryReverseIndex = {}

function addToInventory(name: string, location: string, quantity: number): InventoryItem {
    const id = nameToId(name)
    const existing = inventoryIndex[id]
    const inventoryLocation = {
        location, quantity
    }
    if (existing === undefined) {
        const item: InventoryItem = {
            name,
            locations: {
                [location]: inventoryLocation,
            }
        }
        inventoryIndex[id] = item
        return item
    }
    else {
        const item = {
            ...existing, locations: {
                ...existing.locations,
                [location]: inventoryLocation,
            }
        }
        inventoryIndex[id] = item
        return item
    }
}

function addToSearchIndex(item: InventoryItem) {
    const keywords = nameToId(item.name).split(' ')
        .map(kw => kw.toLowerCase())

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

let pendingSave = Promise.resolve(true)
const saveInventory = () => {
    pendingSave.then(() => {
        pendingSave = new Promise<boolean>((resolve, reject) => {
            writeFile(inventoryFile,
                JSON.stringify(inventoryIndex, null, 2),
                (err) =>
                    (!!err) ? reject(err) : resolve(true)
            )
        })
    })
}

function nameToId(name: string) {
    if (!name) {
        console.log("Exiting...")
        process.exit()
    }
    return name.trim().replace(/\s+/g, ' ')
}

function promptId() {
    const prompt = prompts<string>({
        type: 'text',
        name: 'val',
        message: `Enter thing name: `,
        validate: (value: string) =>
            nameToId(value).length > 1 ? true : 'Please enter a name with > 1 character'
    })

    prompt.then((answers: prompts.Answers<string>) => {
        const name = answers['val']
        const newId = nameToId(name)

        // Exit on save
        if (newId === 'exit') {
            pendingSave.then(() => process.exit(0))
            return
        }

        // If this is just a synonym of another code, point it there
        const existing = inventoryIndex[newId]
        if (existing !== undefined) {
            console.log("Found in " + Object.keys(existing.locations).join(', '))
            promptLocation(name, Object.keys(existing.locations)[0])
        }
        else {
            promptLocation(name)
        }
    })
}

const linearLocationMatcher = new RegExp(/(.*)(\d+)$/ig)
var lastLocations = ['', '']
function getSuggestedLocation(): string {
    if (lastLocations[0] == lastLocations[1]) {
        return lastLocations[1];
    }

    const regexMatches1 = linearLocationMatcher.exec(lastLocations[0])
    const regexMatches2 = linearLocationMatcher.exec(lastLocations[1])
    return (regexMatches1 && regexMatches2 &&
        regexMatches1.length === 3 && regexMatches2.length === 3 &&
        regexMatches1[1] === regexMatches2[1] &&
        (parseInt(regexMatches1[3]) + 1) === parseInt(regexMatches2[3])) ?
        (regexMatches2[1] + (parseInt(regexMatches2[2]) + 1)) :
        lastLocations[1]
}

function promptLocation(name: string, initialLocation: string = '') {
    const suggested = getSuggestedLocation()

    const prompt = prompts<string>({
        type: 'text',
        name: 'val',
        message: `Set Location`,
        initial: initialLocation === '' ? suggested : initialLocation,
        validate: (value: string) =>
            value.length > 1 ? true : 'Please enter a location'
    })

    prompt.then((answers: prompts.Answers<string>) => {
        const location = answers["val"]
        lastLocations.push(location)
        lastLocations.splice(0, 1)
        promptQuantity(name, location)
    })
}

function promptQuantity(name: string, location: string = '') {
    const existing = inventoryIndex[nameToId(name)]
    const curQuantity = (existing === undefined || existing.locations[location] === undefined)
        ? 0 : (existing.locations[location].quantity)
    const initValue = curQuantity + 1
    const prompt = prompts<string>({
        type: 'number',
        name: 'val',
        message: `Set Quantity in ` + location + " (currently " + curQuantity + ")",
        initial: initValue,
        validate: (value: string) =>
            isNumber(parseInt(value)) ? true : 'Please enter a number'
    })

    prompt.then((answers: prompts.Answers<string>) => {
        const quantity = parseInt(answers["val"])
        const item = addToInventory(name, location, quantity)
        addToSearchIndex(item)
        promptId()
        saveInventory()
    })
}

promptId()
