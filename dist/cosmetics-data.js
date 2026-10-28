const OPTIONS={helmet:['helmet'],accessory:['wings'],look:['aurora','ranger'],trail:['trail'],effect:['sparkles'],victory:['victory']};
export function normalizeCosmetics(c={}){if(!c||typeof c!=='object'||Array.isArray(c))return {};return Object.fromEntries(Object.entries(OPTIONS).filter(([k,values])=>Object.hasOwn(c,k)&&values.includes(c[k])).map(([k])=>[k,c[k]]));}
