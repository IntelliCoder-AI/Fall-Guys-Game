export const CHARACTERS=[
 {id:'dash',name:'Dash',description:'Man · lean build',shoulder:.43,hip:.18,head:.43,face:0},
 {id:'nova',name:'Nova',description:'Woman · athletic build',shoulder:.37,hip:.21,head:.40,face:1},
 {id:'ace',name:'Ace',description:'Man · broad build',shoulder:.50,hip:.22,head:.46,face:2},
 {id:'ari',name:'Ari',description:'Nonbinary · compact build',shoulder:.39,hip:.19,head:.42,face:3}
];
export const COLORS=['#ff725e','#9279ff','#44c9b4','#ffcb66','#263d59','#f1ede2','#e569a5','#558fe8'];
export const HAIR_COLORS=['#281f24','#50382e','#956244','#f2d18b','#9279ff','#e569a5'];
export const SKINS=['#f1be94','#e6b18b','#c88e66','#ae785b','#80513c','#50382e'];
export const APPEARANCE_OPTIONS={character:CHARACTERS.map(c=>[c.id,c.name+' — '+c.description]),top:[['hoodie','Hoodie'],['tee','T-shirt'],['jacket','Varsity jacket']],bottom:[['jeans','Jeans'],['shorts','Shorts'],['skirt','Skirt + leggings']],hair:[['short','Short crop'],['ponytail','Ponytail'],['curly','Curls'],['bob','Bob']],hat:[['none','No hat'],['cap','Baseball cap'],['beanie','Beanie']],accessory:[['none','No accessory'],['backpack','Backpack'],['glasses','Glasses']]};
export const DEFAULT_APPEARANCE={character:'dash',top:'hoodie',bottom:'jeans',hair:'short',hat:'cap',accessory:'backpack',shirtColor:'#ff725e',hatColor:'#ff725e',hairColor:'#281f24',pantsColor:'#263d59',shoeColor:'#f1ede2',skin:'#f1be94'};
export function normalizeAppearance(value={}){const a={...DEFAULT_APPEARANCE};if(!value||typeof value!=='object')return a;for(const [key,options]of Object.entries(APPEARANCE_OPTIONS))if(options.some(([id])=>id===value[key]))a[key]=value[key];for(const key of['shirtColor','hatColor','pantsColor','shoeColor'])if(COLORS.includes(value[key]))a[key]=value[key];if(HAIR_COLORS.includes(value.hairColor))a.hairColor=value.hairColor;if(SKINS.includes(value.skin))a.skin=value.skin;return a}
export function legacyAppearance(outfit){return normalizeAppearance(outfit==='nova'?{character:'nova',hair:'ponytail',hat:'none',shirtColor:'#9279ff'}:outfit==='ace'?{character:'ace',top:'jacket',shirtColor:'#44c9b4'}:outfit==='gold'?{shirtColor:'#ffcb66'}:{})}
