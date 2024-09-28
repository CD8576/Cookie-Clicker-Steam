Welcome! This is a quick guide to making mods for Cookie Clicker on Steam.

Each mod consists of a folder containing at least a properly-formatted "info.txt" file.

Breakdown of an example info.txt:
	"Name": "Sample Mod",
		-the visibly displayed name of your mod
	"ID": "sample mod",
		-the text id of your mod (alphanumeric characters and spaces only), used as its key when saving or loading data
		-also used as identifiers in other mods' dependencies
		-this id must be the same as the first parameter used in your Game.registerMod(id,hooks)
		-two mods with the same id will be treated as one and the same, so make sure yours is unique!
	"Author": "Orteil",
		-your name here! only displayed in the game; the Steam Workshop uses your Steam name in the mods you publish
	"Description": "A bare-bones sample mod.",
		-a description of your mod
	"ModVersion": 1,
		-a number value for your mod's version; increment it with each update
	"GameVersion": 2.031,
		-the last version of Cookie Clicker this mod was confirmed to run on; Cookie Clicker may choose to disable mods below its version on any content-heavy update
	"Date": "01/09/2021",
		-the date your mod was released or last updated (day/month/year)
	"Dependencies": [],
		-optional; an array of IDs of other mods that must be loaded before this one, ie. ["cool mod preloader","extra stuff"]
	"LanguagePacks": ["lang.js"],
		-optional; an array of files in your mod's folder containing localization data (ie. changing game text, adding translations etc)
	"Disabled": 1,
		-optional; if set to 1, this mod will be disabled by default
	"AllowSteamAchievs":1,
		-optional; by default, mods (unless they only consist of language files) block the unlocking of Steam achievements while enabled; set this to 1 if this is a good honest mod that does not incredibly unbalance the game

Mods also tend to include either language files or a "main.js" file to actually *do* stuff. See the example mods for more information.

You can also include a thumbnail picture for your mod. This must be a png file named "thumbnail.png" located in your mod's root folder.
Thumbnails must be under 1mb.

The folder /mods/workshop is for mods automatically downloaded from the Steam Workshop on game launch if you're subscribed to them.
You can place your mods in /mods/local to test them out. You may also place there any mods you've obtained through other means than the workshop.
There are 3 example mods already included in /mods/local. Make sure to check out their source files to see some of the things you can do!

Once your mod is ready, you may publish it to the Steam Workshop in-game via Options > Publish mods > New mod. Other players will then be able to subscribe to it.
The Publish mods screen also provides options for updating your existing mods.
You can also access your published mods in the workshop to add more images, view user comments, or edit certain things.

Good luck!
	-Orteil