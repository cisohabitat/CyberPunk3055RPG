import { reviewedDeliveryHash } from "../qa/production/delivery-history";
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { GUIDE_LORE, GUIDE_CONTACTS, guideCheck } from './guide';
import guideMedia from '../qa/media/guide.json';
import { OPENING_ART } from './art';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

it('teaches difficulty and critical results using the real resolver without creating campaign outcomes',()=>{
  assert.equal(guideCheck(4).total,7);assert.equal(guideCheck(4).success,false);
  assert.equal(guideCheck(5).total,8);assert.equal(guideCheck(5).success,true);
  assert.equal(guideCheck(10).crit,'success');assert.equal(guideCheck(1).crit,'fail');
  assert.deepEqual(guideCheck(4),guideCheck(4));
  for(const bad of [0,11,1.5])assert.throws(()=>guideCheck(bad),/Bad roll/);
});
it('keeps initial lore spoiler-safe and reuses the original city plate with explicit provenance',()=>{
  const lore=JSON.stringify([GUIDE_LORE,GUIDE_CONTACTS]);
  assert.match(lore,/3055/);assert.match(lore,/sliver of glass/);assert.match(lore,/have not accepted/);
  assert.doesNotMatch(lore,/coolant dump|three hundred|issuing key|paid to forget|Ivo Pell|Junie Calder/);
  assert.equal(guideMedia.art.route,'/guide');assert.equal(guideMedia.art.src,OPENING_ART.src);assert.equal(guideMedia.art.small,OPENING_ART.small);
  for(const file of guideMedia.preservedMedia){assert.equal(reviewedDeliveryHash(file.path,file.sha256),file.sha256,file.path);}
});
