/*
	You can use language files like this one to modify and augment localization strings for any supported language, including English.
	Valid language codes are EN (English), FR (French), DE (German), NL (Dutch), CS (Czech), PL (Polish), IT (Italian), ES (Spanish), PT-BR (Portuguese), JA (Japanese), ZH-CN (Chinese), and RU (Russian).
	You can also use the language code "*" to apply to any language.
	You may call ModLanguage multiple times in a single file to augment multiple languages. The game will only load what it needs for the current language.
	You may also use this to add flavor text to upgrades and achievements, which is omitted in non-English languages. This is done via the syntax "[Upgrade quote ID]upgrade's original English name":"your custom flavor text". See below for examples.
	Note that the game has various hard-coded exceptions for English which may not be easy to change through localization files alone.
	The special "REPLACE ALL" key is provided as a utility for replacing every single instance of a string in the game's language files with another. At the moment this does not apply to default english flavor text.
	Please refer to the /loc directory for the default localization files, which you may use for reference.
*/
ModLanguage('EN',{
	
	"REPLACE ALL": {
		"cookie":"biscuit",
		"grandmapocalypse":"nanageddon",
		"grandma":"nana",
		"wrinklers":"chappies",
		"wrinkler":"chappy",
	},
	
	//we're already changing "cookie" and "grandma" in the REPLACE ALL so some of the following is redundant and mostly just for the sake of example
	
	"cookie": "biscuit",
	
	"%1 cookie": [
		"%1 biscuit",
		"%1 biscuits"
	],
	
	"Grandma": "Nana",
	"Grandma (short)": "Nana",//this is displayed in the building section! this lets you shorten the name if it doesn't need
	"grandma": "nana",
	"grandmas": "nanas",
	"%1 grandma": [
		"%1 nana",
		"%1 nanas"
	],
	"[Grandma quote]A nice grandma to bake more cookies.": "The source of all earthly evil.",
	"awoken": "bit ticked off",
	"displeased": "well bothered",
	"angered": "right chuffed",
	
	"[Upgrade name 0]Reinforced index finger": "Extra hand, innit",
	"[Upgrade desc 0]Reinforced index finger": "You grow a third hand, allowing you to click about <b>twice as much</b>.",
	"[Upgrade quote 0]Reinforced index finger": "Also increases your mittens budget by 50%.",
	
	"[Achievement name 0]Wake and bake": "Blimey! A cookie!",
	"[Achievement desc 0]Wake and bake": "Somehow produce <b>one whole cookie</b> with your own two hands.",
	"[Achievement quote 0]Wake and bake": "Wait, where'd it go? [*chewing noises*]",
	
});