/*
	intruder! intruder! someone breached into the core files!
	nah just kidding, just poke around responsibly and try not to break stuff
*/
const {app,BrowserWindow,screen,ipcMain,dialog,shell}=require('electron');
const path=require('path');
const fs=require('fs');
const AdmZip=require('adm-zip');
let greenworks;
let greenworksLaunched=false;

let DEV=1;//display menu and js console
let BETA=0;//save and load using different save slot

let saveFile=(BETA?`saveBeta`:`save`)+`.cki`;
let saveFileCloud=saveFile.replace('.cki','.txt');

let quit=false;
//app.disableHardwareAcceleration();//unfortunately breaks steam overlay


function launch(){
	let discordClient=0;//require('discord-rich-presence')('894730407050870835');
	
	let timeStarted=Date.now();
	let updateDiscordPresence=(arr)=>
	{
		if (!discordClient) return false;
		discordClient.updatePresence({
			state:arr[1]||'',
			details:arr[0]||'',
			startTimestamp:timeStarted,
			largeImageKey:'icon1024',
			instance:true,
		});
	}
	
	let win=new BrowserWindow({
		width:1280,
		height:720,
		minWidth:300,
		minHeight:200,
		resizable:true,
		show:false,
		backgroundColor:'#000',
		//icon:path.join(__dirname,'icon.png'),
		webPreferences:{
			preload:path.join(__dirname,'preload.js'),
			nodeIntegration:true,
			contextIsolation:true,
			affinity:'Cookie Clicker',
		}
	});
	
	let send=(id,data,callback)=>{
		if (quit) return false;
		callback=callback||0;
		if (win) win.webContents.send('fromMain',{id,data,callback});
		return true;
	}
	
	win.on('focus',()=>{send('window focus');});
	win.on('blur',()=>{send('window blur');});
	
	
	let timesLoaded=0;
	
	let achievs=[];
	let grantedAchievs=[];
	let isGrantingAchievs=false;
	
	let getMessage=(e,args)=>{
		if (quit) return false;
		//can fake receiving messages with getMessage(0,'data');
		if (typeof args==='string') args={id:args};
		let req=args.id||'';
		let callback=args.callback||0;
		
		try{
			if (req=='ping') send('ping',args,callback);
			else if (req=='init bridge')
			{
				timesLoaded++;
				try{
					if (!greenworksLaunched)
					{
						greenworksLaunched=true;
						process.activateUvLoop();
						greenworks=require(path.join(__dirname,'/greenworks/greenworks'));
						if (greenworks) greenworks=greenworks.init()?greenworks:false;
						if (greenworks)
						{
							achievs=greenworks.getAchievementNames();
							greenworks.on('game-overlay-activated',(active)=>{
								send('overlay',active);
							});
						}
					}
					if (greenworks)
					{
						send('greenworks loaded',{DEV,BETA,timesLoaded},callback);
					}
					else {{send('couldn\'t load greenworks, might be offline',{DEV,BETA,timesLoaded},callback);}}
				} catch(e) {send('error loading greenworks:',{DEV,BETA,timesLoaded},callback);send('error',String(e));}
			}
			else if (req=='wipe save') grantedAchievs=[];
			else if (req=='quit') {quit=true;app.quit();if (win){win.close();}}
			//else if (req=='reload') {if (win){win.reload();}}
			else if (req=='reload')
			{
				if (win)
				{
					//win.loadFile(path.join(__dirname,'/src/index.html'),BETA?{query:{'beta':'1'}}:{});
					let query={};
					if (BETA) query.beta='1';
					if (args.modless) query.modless='1';
					win.loadFile(path.join(__dirname,'/src/index.html'),{query:query});
				}
			}
			else if (req=='get playersN')
			{
				if (!greenworks) {return send('data',{'playersN':1},callback);console.log('error getting playersN:','no greenworks');}
				greenworks.getNumberOfPlayers((n)=>{
					send('data',{'playersN':n},callback);
				},(e)=>{send('data',{'playersN':1},callback);console.log('error getting playersN:',e);});
			}
			else if (req=='get achiev')
			{
				if (DEV || BETA) return false;
				if (greenworks && args.achiev && grantedAchievs.indexOf(String(args.achiev))==-1) greenworks.activateAchievement(String(args.achiev),()=>{grantedAchievs.push(String(args.achiev));},(err)=>{});
			}
			else if (req=='get achievs')
			{
				//we call this on save load
				//runs through every achiev in the list, and grants them at a 1-second interval
				if (DEV || BETA) return false;
				if (!greenworks) return false;
				let list=args.list;
				list=list.filter(it=>{return achievs.indexOf(String(it))!=-1;});
				list=list.filter(it=>{return grantedAchievs.indexOf(String(it))==-1;});
				list=[...new Set(list)];
				if (list.length>0 && !isGrantingAchievs)
				{
					isGrantingAchievs=true;
					let grantAchievs=()=>
					{
						let it=list.shift();
						getMessage(0,{id:'get achiev',achiev:it});
						if (list.length>0) setTimeout(grantAchievs,1000);
						else isGrantingAchievs=false;
					}
					grantAchievs();
				}
			}
			else if (req=='reset achievs')
			{
				if (DEV || BETA) return false;
				if (!greenworks) return false;
				for (let i in achievs)
				{
					greenworks.clearAchievement(achievs[i],()=>{});
				}
				grantedAchievs=[];
			}
			else if (req=='save' && args.data)
			{
				try {
					if (!fs.existsSync(path.join(__dirname,'/save'))) fs.mkdirSync(path.join(__dirname,'/save'),{recursive:true});
					fs.writeFileSync(path.join(__dirname,'/save/'+saveFile),String(args.data),'utf-8');
					send('saved',0,callback);
				}
				catch(e){send('saved',0,callback);}
			}
			else if (req=='backup')
			{
				try {
					if (fs.existsSync(path.join(__dirname,'/save/'+saveFile))) fs.copyFileSync(path.join(__dirname,'/save/'+saveFile),path.join(__dirname,'/save/OLD'+saveFile))
				}
				catch(e){}
			}
			else if (req=='load')
			{
				try {
					let fileName=saveFile;
					if (args.backup) fileName='OLD'+saveFile;
					if (!fs.existsSync(path.join(__dirname,'/save'))) fs.mkdirSync(path.join(__dirname,'/save'),{recursive:true});
					let data=fs.readFileSync(path.join(__dirname,'/save/'+fileName),'utf-8');
					send('load',data||0,callback);
				}
				catch(e){send('load',0,callback);}
			}
			else if (req=='cloud check')
			{
				if (!greenworks) return send('cloud off');
				if (greenworks.isCloudEnabledForUser())
				{
					send('cloud on');
					greenworks.getCloudQuota(
						(total,available)=>{send('cloud quota',[total,available]);},
						()=>{send('cloud off');},
					);
				}
				else send('cloud off');
			}
			else if (req=='cloud save' /*&& args.name */&& args.data)
			{
				if (!greenworks) {send('cloud save failed',0,callback);return false;}
				if (/*typeof args.name==='string' && args.name.trim().length>0 && !(/[^a-z0-9_ ]/gi).test(args.name) && */greenworks.isCloudEnabledForUser())
				{
					let doSave=()=>{
						greenworks.saveTextToFile(saveFileCloud,String(args.data),
							()=>{send('cloud on');send('cloud saved',0,callback);},
							(err)=>{send('cloud save failed',0,callback);}
						);
						getMessage(0,'cloud check');
					};
					/*if (greenworks.getFileCount()>0) greenworks.deleteFile(greenworks.getFileNameAndSize(0).name,()=>{doSave();});
					else */doSave();
				}
				else send('cloud save failed',0,callback);
			}
			else if (req=='cloud read'/* && args.name*/)
			{
				if (!greenworks) return send('cloud read',0,callback);
				if (/*typeof args.name==='string' && args.name.trim().length>0 && !(/[^a-z0-9_ ]/gi).test(args.name) && */greenworks.isCloudEnabledForUser())
				{
					greenworks.readTextFromFile(saveFileCloud,
						(data)=>{send('cloud on');send('cloud read',data||0,callback);},
						(err)=>{send('cloud read',0,callback);}
					);
				}
				else send('cloud read',0,callback);
			}
			else if (req=='cloud purge')
			{
				if (!greenworks) return false;
				/*let files=[];
				let n=greenworks.getFileCount();
				let waitForEnd=()=>
				{
					n--;
					if (n<=0)
					{
						getMessage(0,'cloud check');
						send('cloud purge ok');
					}
				}
				for (let i=0;i<n;i++)
				{
					files.push(greenworks.getFileNameAndSize(i).name);
				}
				for (let i=0;i<n;i++)
				{
					greenworks.deleteFile(files[i],waitForEnd);
				}*/
				greenworks.deleteFile(saveFileCloud,()=>{getMessage(0,'cloud check');send('cloud purge ok');});
			}
			else if (req=='url' && args.url)
			{
				args.url=args.url.replace('file://','https://');
				if (args.url.indexOf('http://')!=0 && args.url.indexOf('https://')!=0) return false;
				shell.openExternal(args.url);
			}
			else if (req=='open workshop')
			{
				if (greenworks && args.loc) greenworks.ugcShowOverlay(args.loc);
				else if (!args.loc) shell.openExternal('steam://url/SteamWorkshopPage/1454400');
			}
			else if (req=='open folder' && args.loc)
			{
				if (args.loc.indexOf('DIR')==0) {args.loc=path.join(__dirname,args.loc.replace('DIR',''));}
				shell.openPath(args.loc);
			}
			else if (req=='select folder' && args.loc)
			{
				if (args.loc.indexOf('DIR')==0) {args.loc=path.join(__dirname,args.loc.replace('DIR',''));}
				send('selected folder',dialog.showOpenDialogSync({properties:['openDirectory'],defaultPath:args.loc}),callback);
			}
			else if (req=='select mod' && args.loc)
			{
				var infoFile=args.loc+'/info.txt';
				if (!fs.existsSync(infoFile)) send('selected mod',{error:`No info.txt file found.`},callback);
				else
				{
					var info=fs.readFileSync(infoFile,'utf8');
					try{info=JSON.parse(info);}catch(e){info=0;}
					var mod={};
					if (info && info.Name && info.ID)
					{
						mod.path=args.loc;
						mod.info=info;
						mod.name=info.Name||'';
						mod.desc=info.Description||'';
						info.ID=info.ID.replace(/\W+/g,' ');
						mod.id=info.ID;
						mod.disabled=info.Disabled?true:false;
						mod.dependencies=info.Dependencies||[];
						var imgPath=args.loc+'/thumbnail.png';
						if (fs.existsSync(imgPath))
						{
							var imgSize=fs.statSync(imgPath).size/(1024*1024);
							if (imgSize<1) mod.img=imgPath;
							mod.imgSize=imgSize;
						}
						send('selected mod',mod,callback);
					}
					else send('selected mod',{error:`Invalid info.txt file.`},callback);
				}
			}
			else if (req=='publish mod')
			{
				let errorCallback=(str)=>{send('published mod',{error:str},callback);}
				
				if (!greenworks) {errorCallback(`No Steam connection.`);return false;}
				if (!args.mod) {errorCallback(`No mod selected.`);return false;}
				
				let mod=args.mod;
				let zipPath=path.join(__dirname,'/mods/'+path.basename(mod.path)+'_'+greenworks.getSteamId().steamId+'.zip');
				let cleanup=()=>{
					if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
				}
				
				console.log(`Publishing mod at ${zipPath}.`);
				
				let zip=new AdmZip();
				zip.addLocalFolder(mod.path);
				zip.writeZip(zipPath);
				
				let imgPath=mod.path+'/thumbnail.png';
				if (fs.existsSync(imgPath))
				{
					var imgSize=fs.statSync(imgPath).size/(1024*1024);
					if (imgSize>=1) imgPath=0;
				}
				else imgPath=0;
				
				if (args.update)
				{
					greenworks.ugcPublishUpdate(
						args.update,
						zipPath,
						'',
						'',
						imgPath||'',
						(out)=>{console.log('updated mod');cleanup();send('published mod',{success:true,out:out},callback);},
						(out)=>{console.log('error:',out);cleanup();send('published mod',{error:true,out:out},callback);},
						(out)=>{console.log('progress:',out);},
					);
				}
				else
				{
					greenworks.ugcPublish(
						zipPath,
						mod.name,
						mod.desc,
						imgPath||'',
						(out)=>{console.log('published mod');cleanup();send('published mod',{success:true,out:out},callback);},
						(out)=>{console.log('error:',out);cleanup();send('published mod',{error:true,out:out},callback);},
						(out)=>{console.log('progress:',out);},
					);
				}
				
				return false;
				
			}
			else if (req=='get published mods')
			{
				if (!greenworks) return false;
				greenworks.ugcGetUserItems(greenworks.UGCMatchingType.Items,greenworks.UserUGCListSortOrder.CreationOrderDesc,greenworks.UserUGCList.Published,
					(out)=>{send('published mods list',{list:out},callback);},
					(out)=>{},
				);
			}
			else if (req=='load mods')
			{
				let modDirs=['/mods/local','/mods/workshop'];
				let mods=[];
				for (var i in modDirs)
				{
					let dir=path.join(__dirname,modDirs[i]);
					if (!fs.existsSync(dir)){fs.mkdirSync(dir,{recursive:true});}
					let folders=fs.readdirSync(dir,{withFileTypes:true})
					.filter(dirent=>(dirent.isDirectory() || dirent.isSymbolicLink()))
					.filter(dirent=>(dirent.name!='_zipped'))
					.map(dirent=>dirent.name);
					for (var ii in folders){
						if (fs.existsSync(dir+'/'+folders[ii]+'/info.txt'))
						{
							let mod={
								local:modDirs[i]=='/mods/local'?true:false,//note: unused - we instead decide a mod isn't local if it has a workshop id
								dir:dir+'/'+folders[ii],
								path:folders[ii],
								infoFile:dir+'/'+folders[ii]+'/info.txt',
								jsFile:fs.existsSync(dir+'/'+folders[ii]+'/main.js')?(dir+'/'+folders[ii]+'/main.js'):0,
								info:'',
							};
							mods.push(mod);
						}
					}
				}
				
				let loadedFiles=[];
				let onLoadFile=(mod,err,data)=>
				{
					loadedFiles.push(data.toString());
					if (err) console.log('error loading file:',err);
					else console.log('loaded file for mod:',mod,' - ',data);
				}
				let modIDs=[];
				for (var i in mods)
				{
					var info=fs.readFileSync(mods[i].infoFile,'utf8');
					try{info=JSON.parse(info);}catch(e){console.log('error parsing info file:',e);info=0;}
					if (info && info.Name && info.ID)
					{
						mods[i].info=info;
						info.ID=info.ID.replace(/\W+/g,' ');
						if (modIDs.indexOf(info.ID)!=-1) {console.log('mod "'+info.ID+'" already loaded');mods[i].info=0;mods[i]=0;continue;}
						modIDs.push(info.ID);
						mods[i].id=info.ID;
						mods[i].disabled=info.Disabled?true:false;
						mods[i].dependencies=info.Dependencies||[];
						mods[i].workshop=info.Workshop||false;
					}
					else mods[i].info=0;
				}
				
				mods=mods.filter(Boolean);//remove empty
				
				send('mods loaded',mods,callback);
			}
			else if (req=='sync mods')
			{
				if (!greenworks) {send('mods synced','failed to sync mods.',callback);return false;}
				console.log(`Synchronizing mods...`);
				let zippedFolder=path.join(__dirname,'/mods/workshop/_zipped');
				let outFolder=path.join(__dirname,'/mods/workshop');
				
				if (!fs.existsSync(zippedFolder)) fs.mkdirSync(zippedFolder,{recursive:true});
				
				greenworks.ugcSynchronizeItems(zippedFolder,(mods)=>{
					let modsUpdated=[];
					for (let i=0;i<mods.length;i++)
					{
						let mod=mods[i];
						if (!mod.isUpdated) continue;
						try{
							let zipPath=zippedFolder+'/'+mod.fileName;
							let newPath=outFolder+'/'+mod.fileName.substr(0,mod.fileName.lastIndexOf('_')).replace(/\.\/\\/g,'');
							if (!fs.existsSync(newPath)) fs.mkdirSync(newPath,{recursive:true});
							
							let zip=new AdmZip(zipPath);
							zip.extractAllTo(newPath,true);
							
							if (fs.existsSync(newPath+'/info.txt'))
							{
								let info=fs.readFileSync(newPath+'/info.txt','utf8');
								try{info=JSON.parse(info);}catch(e){console.log('error parsing info file:',e);info=0;}
								if (info)
								{
									info.Workshop=mod.publishedFileId;
									fs.writeFileSync(newPath+'/info.txt',JSON.stringify(info,null,' '),'utf8');
								}
							}
							console.log(`Extracted mod "${mod.title}".`);
							modsUpdated.push(mod);
						}catch(e){
							console.log(`Failed to extract mod "${mod.title}".`,e);
						}
					}
					console.log(`Synchronized!`);
					send('mods synced',modsUpdated,callback);
					
				},(err)=>{console.log(`Failed to sync mods.`,err);send('mods synced','failed to sync mods.',callback);});
			}
			else if (req=='unsubscribe workshop' && args.loc)
			{
				if (!greenworks) return false;
				
				greenworks.ugcUnsubscribe(args.loc,()=>{
					if (args.dir && fs.existsSync(args.dir) && path.relative(args.dir,path.join(__dirname,'/mods/workshop'))=='..')
					{
						//remove mod folder and matching zip file
						let archives=fs.readdirSync(path.join(__dirname,'/mods/workshop/_zipped'),{withFileTypes:true})
						.filter(dirent=>(path.extname(dirent.name)=='.zip'))
						.map(dirent=>dirent.name);
						for (var i in archives){
							if (path.basename(args.dir)===archives[i].substr(0,archives[i].lastIndexOf('_'))) fs.unlinkSync(path.join(__dirname,'/mods/workshop/_zipped/'+archives[i]));
						}
						fs.rmdirSync(args.dir,{recursive:true});
					}
					send('unsubscribed workshop',true,callback);
				},()=>{send('unsubscribed workshop',false,callback);});
			}
			else if (req=='get server image' && args.handle)
			{
				//missing: sadly, greenworks does not implement GetQueryUGCPreviewURL
				if (!greenworks) return false;
				return false;
			}
			else if (req=='fullscreen')
			{
				win.setFullScreen(args.on?true:false);
			}
			else if (req=='update presence' && args.arr)
			{
				if (discordClient) updateDiscordPresence(args.arr);
				if (greenworks) greenworks.setRichPresence('gamestatus',args.arr[0]);
			}
			else if (req=='toggle presence')
			{
				if (!args.val)
				{
					if (discordClient) discordClient.disconnect();
					discordClient=0;
				}
				else
				{
					/*
						note: disabled in march 2023.
						the discord-rich-presence module ultimately depends on register-scheme which is causing us problems on build.
						try re-adding "discord-rich-presence": "^0.0.8" to package.json's dependencies later; if doing so, also uncomment the relevant pref button in steam.js.
					*/
					//if (!discordClient) discordClient=require('discord-rich-presence')('894730407050870835');
				}
			}
		}catch(e){
			send('electron error','['+req+'] - '+e.toString());
			console.log('electron error:',e);
		}
	}
	
	win.on('close',(e)=>{
		quit=true;
		e.preventDefault();
		if (win) win.destroy();
		if (win) win=null;
	});
	
	let splashDur=DEV?0:2.5;
	
	ipcMain.on('toMain',(e,args)=>{
		getMessage(e,args);
	});
	
	if (!DEV) win.setMenu(null);
	win.setBackgroundColor('#111111');
	//these commands are to both fix the Steam overlay being white when starting in non-fullscreen, and to prevent a white flash on startup
	win.unmaximize();
	win.show();
	win.loadFile(path.join(__dirname,'/splash.html'));
	setTimeout(()=>{
		win.maximize();
		win.loadFile(path.join(__dirname,'/src/index.html'),BETA?{query:{'beta':'1'}}:{});
		if (DEV) win.webContents.openDevTools();
	},1000*splashDur);
}

app.whenReady().then(launch);



app.on('activate',()=>{
	if (BrowserWindow.getAllWindows().length===0) {launch();}
});

app.on('window-all-closed',()=>{
	quit=true;
	if (process.platform!=='darwin') app.quit();
});
