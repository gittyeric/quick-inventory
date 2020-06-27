# Quick Inventory

This CLI tool lets you enter and search for any generic inventory with an extreme bias toward data entry speed.  Super handy for tracking lots of your junk.

# Installing

After cloning this repository and having Node.js version 10 or greater installed, cd into the root of this repository and run:

`npm install`

# CLI

The CLI supports 2 commands: add and search.  

# Searching Inventory

Search your inventory based on keyword matching or location.  You can then select matching hits to get the current locations and quantities.

## Running Search

Run search.(sh/bat) depending on your OS and follow prompts.  Search for `exit` to quit the program.

# Add Inventory

Adding inventory is intended for speed over extreme precision, so only a (long, keyword-based) name, location and quantity is recorded for each item.  When naming the item, think about what keywords you'd search for when finding it later.

## Running Add

Run add.(sh/bat) depending on your OS and follow prompts.  Typing `exit` for an item name will quit the program.

# Pro Tips

### Tip 1: Use Nested Locations

Every item must be in a location, but your location can also be an item.  For example, let's say you have a `hammer` located in bin `B1`, so you add the hammer item as such.  If you then add `B1` as an item itself, you can specify _it's_ location in the `Attic`.  Adopting your own nested location scheme will allow you to find anything globally in a consistent way.  Future versions of this tool will figure out the entire location hierarchy so this nesting pattern is highly encouraged.

### Tip 2: Enter in similar batches to go faster with autocomplete

If certain patterns reoccur across multiple item entires (such as locations `B1`, then `B2`), you may get pre-filled name and location suggestions (such as `B3`).  Press nothing but enter when appropriate to accept suggestions and zoom through data entry.

## Tip 3: Backup your inventory record

All of your inventory is stored in the `inventory.json` file next to this Readme.  Backup this file on occassion to ensure you don't lose valuable time.

# Removing Inventory

While strict deletion isn't supported, you can always add an existing item by exact name and set it's quantity to zero.