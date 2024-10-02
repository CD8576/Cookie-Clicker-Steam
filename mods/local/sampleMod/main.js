Game.registerMod("sample mod",{//this string needs to match the ID provided in your info.txt
	init:function(){
		//this function is called as soon as the mod is registered
		//declare hooks here
		
		//note: this mod does nothing but show a notification at the bottom of the screen once it's loaded
		Game.Notify(`Example mod loaded!`,'',[16,5]);
	},
	save:function(){
		//use this to store persistent data associated with your mod
	},
	load:function(str){
		//do stuff with the string data you saved previously
	},
});