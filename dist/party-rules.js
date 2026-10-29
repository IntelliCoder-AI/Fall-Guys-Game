// Shared public rules; the server owns votes, recovery, clocks and scoring.
export const PARTY = Object.freeze({capacity:8,seconds:180,recoverySeconds:1.2,intermissionSeconds:10,voteStarts:[12,65],voteSeconds:10,effectSeconds:30});
export const PARTY_COURSES = Object.freeze([1,2,3,4,5,6]);
export const REMIXES = Object.freeze({calm:{name:'Calm',hazards:.6,speed:.9,description:'Slower hazards. Steadier runners.'},wild:{name:'Wild',hazards:1.4,speed:1.18,description:'Faster hazards. Faster runners.'}});
export function partySettings({level=2,rounds=1}={}){return {level:PARTY_COURSES.includes(level)?level:2,rounds:rounds===3?3:1};}
