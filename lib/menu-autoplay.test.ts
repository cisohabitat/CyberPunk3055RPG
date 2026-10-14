import assert from 'node:assert/strict';
import { it } from 'node:test';
import { waitForRunningAudio } from './menu-autoplay';
class AudioPermission extends EventTarget {
  state:AudioContextState='suspended';calls=0;reject=false;
  resume(){this.calls++;return this.reject?Promise.reject(new Error('Gesture required')):new Promise<void>(()=>{});}
  running(){this.state='running';this.dispatchEvent(new Event('statechange'));}
}
it('requests an allowed running context once, without waiting or another resume',()=>{
  const audio=new AudioPermission();audio.state='running';let starts=0;
  const cancel=waitForRunningAudio(audio,()=>starts++);assert.equal(starts,1);assert.equal(audio.calls,0);
  audio.running();cancel();audio.running();assert.equal(starts,1);
});
it('blocked autoplay remains nonblocking and only a running state permits a start',()=>{
  const audio=new AudioPermission();let starts=0;
  const cancel=waitForRunningAudio(audio,()=>starts++);assert.equal(starts,0);assert.equal(audio.calls,1);
  audio.dispatchEvent(new Event('statechange'));assert.equal(starts,0);
  audio.running();audio.running();assert.equal(starts,1);cancel();
});
it('cancellation removes a pending start before a later gesture resumes the context',()=>{
  const audio=new AudioPermission();let starts=0;
  const cancel=waitForRunningAudio(audio,()=>starts++);cancel();audio.running();assert.equal(starts,0);
});
it('a rejected resume is handled and a subsequent gesture can still activate; closed audio stays silent',async()=>{
  const audio=new AudioPermission();audio.reject=true;let starts=0;
  const cancel=waitForRunningAudio(audio,()=>starts++);await Promise.resolve();assert.equal(starts,0);
  audio.running();assert.equal(starts,1);cancel();
  const closed=new AudioPermission();closed.state='closed';waitForRunningAudio(closed,()=>starts++);
  assert.equal(closed.calls,0);assert.equal(starts,1);
});
