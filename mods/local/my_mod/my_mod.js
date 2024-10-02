Game.registerMod("10101",{
    init:function(){
        this.animTimer = 0;
 
        Game.Notify('Rainbow News Ticker','',[30,8]);
        Game.registerHook('draw',()=>{
            let e = document.getElementsByClassName('commentsText');
 
 
            // This method probably sucks but oh well
            for (let i = 0; i < e.length; i++) {
                e[i].style.color = 'hsl(' + this.animTimer + 'deg, 100%, 80%)'
            };
            this.animTimer++;
 
            // To avoid overflows, as people leave this game on for very long times
            if (this.animTimer >= 360) {
                this.animTimer -= 360;
            };
        });
    },
    save:function(){
    },
    load:function(str){
    },
});