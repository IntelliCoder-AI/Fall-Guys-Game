import test from 'node:test';
import assert from 'node:assert/strict';
import {groundAt,segmentDistance,checkpointFor,resetPosition,progress} from '../dist/physics.js';
test('course has solid start and finish and real jump gaps',()=>{assert(groundAt(0,5));assert(groundAt(0,-127));assert(!groundAt(0,-38));assert(!groundAt(0,-73));assert(!groundAt(0,-85));assert(!groundAt(13,-55))});
test('all checkpoints return to safe platforms',()=>{for(let i=0;i<3;i++){let p=resetPosition(i);assert(groundAt(p.x,p.z))}assert.equal(checkpointFor(-45,0),1);assert.equal(checkpointFor(-100,1),2);assert.equal(checkpointFor(5,2),2)});
test('sweeper collision measures the whole bar and endpoints',()=>{assert.equal(segmentDistance(0,1,-5,0,5,0),1);assert.equal(segmentDistance(6,0,-5,0,5,0),1);assert.equal(segmentDistance(0,0,-5,0,5,0),0);assert.equal(segmentDistance(0,0,2,0,2,0),2)});
test('progress is bounded from start to finish',()=>{assert.equal(progress(5),0);assert.equal(progress(-127),1);assert.equal(progress(20),0);assert.equal(progress(-200),1)});
