"use strict";(()=>{function c(n){return!Number.isFinite(n)||Number.isNaN(n)?1:Math.round((n+Number.EPSILON)*100)/100}function M(n){return c(n).toFixed(2)}var _=[{id:"speed.decrease",action:{type:"speed.decrease"},code:"KeyS",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"speed.increase",action:{type:"speed.increase"},code:"KeyD",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"speed.reset",action:{type:"speed.reset"},code:"KeyR",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"seek.rewind",action:{type:"seek.relative",seconds:-10},code:"KeyZ",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"seek.advance",action:{type:"seek.relative",seconds:10},code:"KeyX",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"speed.preferred.toggle",action:{type:"speed.preferred.toggle"},code:"KeyG",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"overlay.toggle",action:{type:"overlay.toggle"},code:"KeyV",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"marker.set",action:{type:"marker.set"},code:"KeyM",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"marker.jump",action:{type:"marker.jump"},code:"KeyJ",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"pip.toggle",action:{type:"pip.toggle"},code:"KeyP",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"silence.skip.toggle",action:{type:"silence.skip.toggle"},code:"KeyK",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0}];function q(n){if(!n||!(n instanceof HTMLElement))return!1;let e=n.tagName.toLowerCase();if(e==="input"||e==="textarea"||e==="select"||n.isContentEditable||n.contentEditable==="true"||n.getAttribute("contenteditable")==="true"||n.getAttribute("contenteditable")===""||n.closest?.("[contenteditable='true'], [contenteditable=''], [contenteditable]"))return!0;let t=n.getAttribute("role");return t==="textbox"||t==="searchbox"||t==="combobox"}var R=class{actionHandler;shortcuts;abortController=null;enabled=!0;constructor(e,t=_){this.actionHandler=e,this.shortcuts=[...t]}setShortcuts(e){this.shortcuts=[...e]}getShortcuts(){return[...this.shortcuts]}attach(e=window){this.detach(),this.abortController=new AbortController;let{signal:t}=this.abortController;e.addEventListener("keydown",i=>{this.enabled&&i instanceof KeyboardEvent&&(i.isComposing||q(i.target)||this.handleKeyDown(i))},{capture:!0,signal:t})}handleKeyDown(e){for(let t of this.shortcuts){if(!t.enabled)continue;let i=t.code===e.code,r=t.ctrl===(e.ctrlKey||e.metaKey),o=t.alt===e.altKey,s=t.shift===e.shiftKey;if(i&&r&&o&&s){e.preventDefault(),e.stopPropagation(),this.actionHandler.execute(t.action);return}}}detach(){this.abortController&&(this.abortController.abort(),this.abortController=null)}};var W={schemaVersion:1,enabled:!0,defaultSpeed:1,preferredSpeed:1.8,speedStep:.1,rewindSeconds:10,advanceSeconds:10,rememberPlaybackSpeed:!1,audioBoolean:!0,startHidden:!1,lastSpeed:1,domainSpeeds:{},overlay:{enabled:!0,position:{xRatio:.02,yRatio:.02},opacity:.3,customCss:""},shortcuts:_,siteRules:[{id:"rule-meet",match:"meet.google.com",enabled:!1},{id:"rule-teams",match:"teams.microsoft.com",enabled:!1},{id:"rule-imgur",match:"imgur.com",enabled:!1}],compatibility:{fightAutomaticRateReset:!0}};function z(n){try{if(typeof n=="object"&&n!==null&&"hostname"in n)return(n.hostname||"").toLowerCase().trim();let e=String(n).trim();if(!e)return"";let t=e.includes("://")?e:`https://${e}`;return(new URL(t).hostname||"").toLowerCase().trim()}catch{return""}}function U(n,e){let t=n.toLowerCase().trim(),i=e.toLowerCase().trim();if(!t||!i)return!1;if(t===i||i===`www.${t}`||`www.${i}`===t)return!0;if(t.startsWith("*.")){let r=t.slice(2);if(i===r||i.endsWith(`.${r}`))return!0}return!1}function l(n,e,t){return Number.isNaN(n)?e:Math.min(Math.max(n,e),t)}var w=class{settings;constructor(e){this.settings=e}updateSettings(e){this.settings=e}getMatchingRule(e){let t=e.toLowerCase().trim();for(let i of this.settings.siteRules)if(U(i.match,t))return i}resolveSiteConfig(e){let t=z(e),i=this.getMatchingRule(t);if(!this.settings.enabled)return{enabled:!1,overlayEnabled:!1,initialSpeed:1,preferredSpeed:this.settings.preferredSpeed,rememberSpeed:!1,matchingRule:i};if(i&&!i.enabled)return{enabled:!1,overlayEnabled:!1,initialSpeed:1,preferredSpeed:this.settings.preferredSpeed,rememberSpeed:!1,matchingRule:i};let r=this.settings.overlay.enabled;i&&typeof i.overlayEnabled=="boolean"&&(r=i.overlayEnabled);let o=this.settings.rememberPlaybackSpeed;i&&typeof i.rememberSpeed=="boolean"&&(o=i.rememberSpeed);let s=this.settings.defaultSpeed;o&&(this.settings.domainSpeeds&&typeof this.settings.domainSpeeds[t]=="number"?s=this.settings.domainSpeeds[t]:typeof this.settings.lastSpeed=="number"&&(s=this.settings.lastSpeed)),i&&typeof i.defaultSpeed=="number"&&(s=i.defaultSpeed);let a=this.settings.preferredSpeed;return i&&typeof i.preferredSpeed=="number"&&(a=i.preferredSpeed),{enabled:!0,overlayEnabled:r,initialSpeed:l(c(s),.07,16),preferredSpeed:l(c(a),.07,16),rememberSpeed:o,matchingRule:i}}};function v(n){return n instanceof HTMLMediaElement}function K(n){return!Number.isFinite(n.duration)||n.duration===1/0}var C=class{audioCtx=null;sourceNode=null;gainNode=null;currentGain=1;media;constructor(e){this.media=e}setGain(e){let t=Math.max(1,Math.min(5,e));this.currentGain=t,!(t<=1&&!this.audioCtx)&&(this.ensureGraph(),this.gainNode&&(this.gainNode.gain.value=t),this.audioCtx&&this.audioCtx.state==="suspended"&&this.audioCtx.resume().catch(()=>{}))}getGain(){return this.currentGain}ensureGraph(){if(!(this.audioCtx&&this.gainNode))try{let e=window,t=e.AudioContext||e.webkitAudioContext;if(!t)return;this.audioCtx=new t,this.sourceNode=this.audioCtx.createMediaElementSource(this.media),this.gainNode=this.audioCtx.createGain(),this.gainNode.gain.value=this.currentGain,this.sourceNode.connect(this.gainNode),this.gainNode.connect(this.audioCtx.destination)}catch(e){console.warn("[Velocity] AudioBooster Web Audio init warning:",e)}}destroy(){try{this.gainNode?.disconnect(),this.sourceNode?.disconnect(),this.audioCtx&&this.audioCtx.state!=="closed"&&this.audioCtx.close().catch(()=>{})}catch{}this.audioCtx=null,this.sourceNode=null,this.gainNode=null}};function F(n,e){try{n.preservesPitch=e}catch{}let t=n;"mozPreservesPitch"in t&&(t.mozPreservesPitch=e),"webkitPreservesPitch"in t&&(t.webkitPreservesPitch=e)}var x=class{media;options;audioCtx=null;sourceNode=null;analyserNode=null;timerId=null;silentSince=null;currentlySilent=!1;destroyed=!1;constructor(e,t){this.media=e,this.options={thresholdDb:t.thresholdDb??-45,minSilenceMs:t.minSilenceMs??500,checkIntervalMs:t.checkIntervalMs??50,onSilenceChange:t.onSilenceChange}}start(){this.destroyed||this.timerId!==null||(this.ensureGraph(),this.timerId=window.setInterval(()=>this.checkAudioLevel(),this.options.checkIntervalMs))}stop(){this.timerId!==null&&(window.clearInterval(this.timerId),this.timerId=null),this.silentSince=null,this.currentlySilent&&(this.currentlySilent=!1,this.options.onSilenceChange(!1))}ensureGraph(){if(!(this.audioCtx&&this.analyserNode))try{let e=window,t=e.AudioContext||e.webkitAudioContext;if(!t)return;this.audioCtx=new t,this.sourceNode=this.audioCtx.createMediaElementSource(this.media),this.analyserNode=this.audioCtx.createAnalyser(),this.analyserNode.fftSize=256,this.sourceNode.connect(this.analyserNode),this.analyserNode.connect(this.audioCtx.destination)}catch(e){console.warn("[Velocity] SilenceDetector audio graph setup warning:",e)}}checkAudioLevel(){if(this.destroyed||!this.analyserNode||this.media.paused)return;if(this.audioCtx&&this.audioCtx.state==="suspended"){this.audioCtx.resume().catch(()=>{});return}let e=new Float32Array(this.analyserNode.fftSize);this.analyserNode.getFloatTimeDomainData(e);let t=0;for(let a=0;a<e.length;a++){let u=e[a];t+=u*u}let i=Math.sqrt(t/e.length),o=(i>1e-5?20*Math.log10(i):-100)<this.options.thresholdDb,s=Date.now();o?this.silentSince===null?this.silentSince=s:!this.currentlySilent&&s-this.silentSince>=this.options.minSilenceMs&&(this.currentlySilent=!0,this.options.onSilenceChange(!0)):(this.silentSince=null,this.currentlySilent&&(this.currentlySilent=!1,this.options.onSilenceChange(!1)))}destroy(){this.destroyed=!0,this.stop();try{this.analyserNode?.disconnect(),this.sourceNode?.disconnect(),this.audioCtx&&this.audioCtx.state!=="closed"&&this.audioCtx.close().catch(()=>{})}catch{}this.audioCtx=null,this.sourceNode=null,this.analyserNode=null}};var k=class{media;abortController=new AbortController;events;audioBooster;preservesPitch=!0;silenceSkipEnabled=!1;silenceDetector=null;rateBeforeSilence=null;desiredRate;observedRate;lastSource="initial";markerTime=null;positionBeforeJump=null;previousRateBeforeReset=null;previousRateBeforePreferred=null;lastInteractionAt=Date.now();destroyed=!1;constructor(e,t=1,i={}){this.media=e,this.events=i,this.audioBooster=new C(e),F(e,!0);let r=l(c(t),.07,16);if(this.desiredRate=r,this.observedRate=e.playbackRate,e.playbackRate!==r)try{e.playbackRate=r}catch{}this.bindEvents()}bindEvents(){let{signal:e}=this.abortController;this.media.addEventListener("ratechange",()=>{this.observedRate=this.media.playbackRate,this.events.onRateChange?.(this,this.observedRate,this.lastSource)},{signal:e});let t=["play","pause","timeupdate","loadedmetadata","emptied"];for(let i of t)this.media.addEventListener(i,()=>{this.events.onStateChange?.(this)},{signal:e})}setRate(e,t="extension"){if(this.destroyed)return;let i=l(c(e),.07,16);this.desiredRate=i,this.lastSource=t,this.lastInteractionAt=Date.now();try{this.media.playbackRate!==i&&(this.media.playbackRate=i)}catch(r){console.warn("[Velocity] Failed to set playbackRate on media:",r)}}increaseRate(e=.1){this.setRate(this.desiredRate+e,"extension")}decreaseRate(e=.1){this.setRate(this.desiredRate-e,"extension")}resetRate(e=1){let t=l(c(e),.07,16);if(this.desiredRate===t){if(this.previousRateBeforeReset!==null){let i=this.previousRateBeforeReset;this.previousRateBeforeReset=null,this.setRate(i,"extension");return}}else this.previousRateBeforeReset=this.desiredRate;this.setRate(t,"extension")}seekBy(e){if(this.destroyed||!Number.isFinite(e)||K(this.media))return;this.lastInteractionAt=Date.now();let t=Number.isFinite(this.media.duration)?this.media.duration:1/0,i=l(this.media.currentTime+e,0,t);try{this.media.currentTime=i}catch(r){console.warn("[Velocity] Failed to seek media:",r)}}setMarker(){this.destroyed||(this.markerTime=this.media.currentTime,this.lastInteractionAt=Date.now())}jumpToMarker(){if(this.destroyed||this.markerTime===null)return;this.lastInteractionAt=Date.now();let e=this.media.currentTime;if(this.positionBeforeJump!==null&&Math.abs(e-this.markerTime)<.5){let t=this.positionBeforeJump;this.positionBeforeJump=null;try{this.media.currentTime=t}catch(i){console.warn("[Velocity] Failed to return from marker:",i)}return}this.positionBeforeJump=e;try{this.media.currentTime=this.markerTime}catch(t){console.warn("[Velocity] Failed to jump to marker:",t)}}togglePreferredRate(e=1.8){if(this.destroyed)return;let t=l(c(e),.07,16);if(this.desiredRate===t){let i=this.previousRateBeforePreferred??1;this.previousRateBeforePreferred=null,this.setRate(i,"extension")}else this.previousRateBeforePreferred=this.desiredRate,this.setRate(t,"extension")}getAudioGain(){return this.audioBooster.getGain()}setAudioGain(e){this.destroyed||(this.lastInteractionAt=Date.now(),this.audioBooster.setGain(e))}increaseAudioGain(e=.2){this.setAudioGain(this.audioBooster.getGain()+e)}decreaseAudioGain(e=.2){this.setAudioGain(this.audioBooster.getGain()-e)}togglePitch(){return this.destroyed?this.preservesPitch:(this.lastInteractionAt=Date.now(),this.preservesPitch=!this.preservesPitch,F(this.media,this.preservesPitch),this.preservesPitch)}async togglePictureInPicture(){if(this.destroyed||(this.lastInteractionAt=Date.now(),!(this.media instanceof HTMLVideoElement)))return!1;try{return document.pictureInPictureElement===this.media?(await document.exitPictureInPicture(),!1):(await this.media.requestPictureInPicture(),!0)}catch(e){return console.warn("[Velocity] PiP request failed:",e),!1}}toggleSilenceSkip(e){if(this.destroyed)return this.silenceSkipEnabled;if(this.lastInteractionAt=Date.now(),this.silenceSkipEnabled=e??!this.silenceSkipEnabled,this.silenceSkipEnabled)this.silenceDetector||(this.silenceDetector=new x(this.media,{onSilenceChange:t=>{if(!(this.destroyed||!this.silenceSkipEnabled)){if(t)this.rateBeforeSilence===null&&(this.rateBeforeSilence=this.desiredRate),this.setRate(Math.max(this.desiredRate,3),"extension");else if(this.rateBeforeSilence!==null){let i=this.rateBeforeSilence;this.rateBeforeSilence=null,this.setRate(i,"extension")}}}})),this.silenceDetector.start();else if(this.silenceDetector?.stop(),this.rateBeforeSilence!==null){let t=this.rateBeforeSilence;this.rateBeforeSilence=null,this.setRate(t,"extension")}return this.silenceSkipEnabled}destroy(){this.destroyed||(this.destroyed=!0,this.abortController.abort(),this.audioBooster.destroy(),this.silenceDetector?.destroy(),this.events.onDestroy?.(this))}};var A=class{mediaMap=new WeakMap;controllers=new Set;events;constructor(e={}){this.events=e}register(e,t=1,i={}){let r=this.mediaMap.get(e);if(r&&!r.destroyed)return r;let o=new k(e,t,{...i,onDestroy:s=>{this.controllers.delete(s),i.onDestroy?.(s),this.events.onUnregistered?.(s)}});return this.mediaMap.set(e,o),this.controllers.add(o),this.events.onRegistered?.(o),o}get(e){let t=this.mediaMap.get(e);if(t?.destroyed){this.controllers.delete(t);return}return t}unregister(e){let t=this.mediaMap.get(e);t&&(t.destroy(),this.controllers.delete(t))}getAll(){let e=[];for(let t of this.controllers)t.destroyed?this.controllers.delete(t):e.push(t);return e}clear(){for(let e of this.controllers)e.destroy();this.controllers.clear()}};var T=class{registry;constructor(e){this.registry=e}getActiveController(){let e=this.registry.getAll();if(e.length===0)return null;if(e.length===1)return e[0];let t=null,i=-1/0,r=Date.now();for(let o of e){if(o.destroyed)continue;let s=o.media,a=0;s.isConnected||(a-=1e4),!s.paused&&!s.ended&&s.readyState>1&&(a+=1e3);let u=r-o.lastInteractionAt;u<5e3&&(a+=2e3-Math.floor(u/5));try{let p=s.getBoundingClientRect();if(p.width>0&&p.height>0){let h=p.width*p.height,S=Math.min(500,Math.floor(h/1e3));a+=S}}catch{}(s.muted||s.volume===0)&&(a-=100),a>i&&(i=a,t=o)}return t??e[0]??null}};var D=class{selectionManager;callbacks;constructor(e,t={}){this.selectionManager=e,this.callbacks=t}execute(e){if(e.type==="overlay.toggle")return this.callbacks.onOverlayToggle?.(),this.callbacks.onActionExecuted?.(e,null),!0;let t=this.selectionManager.getActiveController();if(!t||t.destroyed)return!1;switch(e.type){case"speed.increase":t.increaseRate(e.step??.1);break;case"speed.decrease":t.decreaseRate(e.step??.1);break;case"speed.set":t.setRate(e.value,"extension");break;case"speed.reset":t.resetRate(e.target??1);break;case"speed.preferred.toggle":t.togglePreferredRate(e.preferred??1.8);break;case"seek.relative":t.seekBy(e.seconds);break;case"marker.set":t.setMarker();break;case"marker.jump":t.jumpToMarker();break;case"audio.boost.increase":t.increaseAudioGain(e.step??.2);break;case"audio.boost.decrease":t.decreaseAudioGain(e.step??.2);break;case"audio.boost.set":t.setAudioGain(e.value);break;case"pitch.toggle":t.togglePitch();break;case"pip.toggle":t.togglePictureInPicture().catch(()=>{});break;case"silence.skip.toggle":t.toggleSilenceSkip(e.enabled);break;default:return!1}return this.callbacks.onActionExecuted?.(e,t),!0}};var P=class{lastTrustedInteractionAt=0;abortController=null;constructor(){this.attach()}attach(e=document){this.detach(),this.abortController=new AbortController;let{signal:t}=this.abortController,i=["pointerdown","click","touchstart","keydown"];for(let r of i)try{e.addEventListener(r,o=>{o.isTrusted&&this.recordInteraction()},{capture:!0,passive:!0,signal:t})}catch{}}recordInteraction(){this.lastTrustedInteractionAt=Date.now()}isRecentInteraction(e=500){return Date.now()-this.lastTrustedInteractionAt<=e}getLastInteractionTime(){return this.lastTrustedInteractionAt}detach(){this.abortController&&(this.abortController.abort(),this.abortController=null)}};var L=class{observer=null;callbacks;isObserving=!1;constructor(e){this.callbacks=e}observe(e=document){if(!this.isObserving){this.isObserving=!0,this.discoverMediaInSubtree(e),this.observer=new MutationObserver(t=>{for(let i of t){for(let r=0;r<i.addedNodes.length;r++){let o=i.addedNodes[r];this.discoverMediaInSubtree(o)}if(this.callbacks.onMediaRemoved)for(let r=0;r<i.removedNodes.length;r++){let o=i.removedNodes[r];this.handleRemovedSubtree(o)}}});try{this.observer.observe(e,{childList:!0,subtree:!0})}catch(t){console.warn("[Velocity] MutationObserver failed to attach:",t)}}}discoverMediaInSubtree(e){if(v(e)&&this.callbacks.onMediaFound(e),e instanceof Element||e instanceof Document||e instanceof DocumentFragment){let t=e.querySelectorAll("video, audio");for(let r=0;r<t.length;r++){let o=t[r];v(o)&&this.callbacks.onMediaFound(o)}let i=e.querySelectorAll("*");for(let r=0;r<i.length;r++){let o=i[r];o.shadowRoot&&this.discoverMediaInSubtree(o.shadowRoot)}}e instanceof Element&&e.shadowRoot&&this.discoverMediaInSubtree(e.shadowRoot)}handleRemovedSubtree(e){if(v(e)&&this.callbacks.onMediaRemoved?.(e),e instanceof Element||e instanceof DocumentFragment){let t=e.querySelectorAll("video, audio");for(let i=0;i<t.length;i++){let r=t[i];v(r)&&this.callbacks.onMediaRemoved?.(r)}}e instanceof Element&&e.shadowRoot&&this.handleRemovedSubtree(e.shadowRoot)}disconnect(){this.isObserving&&(this.isObserving=!1,this.observer?.disconnect(),this.observer=null)}};var N=class{desiredRate;fightAutomaticResets;consecutiveCorrections=0;windowStart=0;circuitBreakerTripped=!1;constructor(e=1,t=!0){this.desiredRate=c(e),this.fightAutomaticResets=t}setDesiredRate(e){this.desiredRate=c(e),this.consecutiveCorrections=0,this.circuitBreakerTripped=!1}observeRateChange(e,t,i=!1){let r=c(e);if(i)return this.desiredRate=r,this.consecutiveCorrections=0,this.circuitBreakerTripped=!1,{type:"accept",rate:this.desiredRate,source:"extension"};if(r===this.desiredRate)return this.consecutiveCorrections=0,{type:"accept",rate:this.desiredRate,source:"extension"};if(t)return this.desiredRate=r,this.consecutiveCorrections=0,this.circuitBreakerTripped=!1,{type:"accept",rate:this.desiredRate,source:"site-user"};if(!this.fightAutomaticResets)return{type:"accept",rate:r,source:"site-automatic"};let o=Date.now();return o-this.windowStart>1e3&&(this.windowStart=o,this.consecutiveCorrections=0,this.circuitBreakerTripped=!1),this.consecutiveCorrections++,this.consecutiveCorrections>=6?(this.circuitBreakerTripped=!0,console.warn(`[Velocity] Speed oscillation circuit breaker tripped (${this.consecutiveCorrections} corrections in window).`),{type:"ignore"}):{type:"restore",rate:this.desiredRate,source:"restored"}}resetCircuitBreaker(){this.consecutiveCorrections=0,this.circuitBreakerTripped=!1,this.windowStart=0}};var H=class{element;getContainer;callbacks;abortController=new AbortController;isDragging=!1;startPointerX=0;startPointerY=0;startElemX=0;startElemY=0;currentPos;constructor(e,t,i={xRatio:.02,yRatio:.02},r={}){this.element=e,this.getContainer=t,this.currentPos={xRatio:l(i.xRatio,0,.95),yRatio:l(i.yRatio,0,.95)},this.callbacks=r,this.bindEvents()}getPosition(){return{...this.currentPos}}setPosition(e){this.currentPos={xRatio:l(e.xRatio,0,.95),yRatio:l(e.yRatio,0,.95)}}bindEvents(){let{signal:e}=this.abortController;this.element.addEventListener("pointerdown",i=>{if(i.button!==0)return;let r=i.target;if(r&&(r.tagName.toLowerCase()==="button"||r.closest("button")))return;let o=this.getContainer();if(!o)return;this.isDragging=!0,this.startPointerX=i.clientX,this.startPointerY=i.clientY;let s=o.getBoundingClientRect(),a=this.element.getBoundingClientRect();this.startElemX=a.left-s.left,this.startElemY=a.top-s.top;try{this.element.setPointerCapture(i.pointerId)}catch{}i.preventDefault(),i.stopPropagation(),this.callbacks.onDragStart?.()},{signal:e}),this.element.addEventListener("pointermove",i=>{if(!this.isDragging)return;let r=this.getContainer();if(!r)return;let o=r.getBoundingClientRect(),s=this.element.getBoundingClientRect(),a=Math.max(o.width-s.width,1),u=Math.max(o.height-s.height,1),p=i.clientX-this.startPointerX,h=i.clientY-this.startPointerY,S=this.startElemX+p,X=this.startElemY+h,$=l(S,0,a),j=l(X,0,u);this.currentPos={xRatio:l($/o.width,0,.95),yRatio:l(j/o.height,0,.95)},this.callbacks.onDrag?.(this.currentPos)},{signal:e});let t=i=>{if(this.isDragging){this.isDragging=!1;try{this.element.hasPointerCapture(i.pointerId)&&this.element.releasePointerCapture(i.pointerId)}catch{}this.callbacks.onDragEnd?.(this.currentPos)}};this.element.addEventListener("pointerup",t,{signal:e}),this.element.addEventListener("pointercancel",t,{signal:e})}destroy(){this.abortController.abort(),this.isDragging=!1}};var ee=`
:host {
  all: initial !important;
  display: block !important;
  position: absolute !important;
  z-index: 2147483647 !important;
  font-family: sans-serif !important;
  font-size: 13px !important;
  line-height: 1.8em !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  pointer-events: auto !important;
  touch-action: none !important;
}

:host([data-hidden="true"]) {
  display: none !important;
}

#controller {
  display: inline-flex;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  background: black;
  color: white;
  border-radius: 6px;
  padding: 4px;
  margin: 10px 10px 10px 15px;
  cursor: default;
  white-space: nowrap;
  opacity: 0.3;
  box-sizing: border-box;
  transition: opacity 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

#controller:hover,
#controller.expanded,
#controller.dragging {
  opacity: 0.7 !important;
}

#controller.dragging {
  cursor: grabbing;
}

.draggable {
  cursor: grab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.8em;
  height: 1.4em;
  text-align: center;
  vertical-align: middle;
  box-sizing: border-box;
  touch-action: none;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  padding: 0 2px;
  transition: margin-right 0.2s ease;
}

.draggable:active {
  cursor: grabbing;
}

#controller:hover > .draggable,
#controller.expanded > .draggable {
  margin-right: 0.5em;
}

#controls {
  display: none;
  vertical-align: middle;
  align-items: center;
  gap: 2px;
}

#controller:hover #controls,
#controller.expanded #controls,
#controller.dragging #controls {
  display: inline-flex;
}

button.ctrl-btn {
  opacity: 1;
  cursor: pointer;
  color: black;
  background: white;
  font-weight: normal;
  border-radius: 5px;
  padding: 1px 5px 2px 5px;
  font-size: 13px;
  line-height: 16px;
  border: 0px solid white;
  font-family: "Lucida Console", Monaco, monospace;
  margin: 0px 2px;
  transition: background 0.15s ease, color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

button.ctrl-btn:focus {
  outline: 0;
}

button.ctrl-btn:hover {
  opacity: 1;
  background: #2196f3;
  color: #ffffff;
}

button.ctrl-btn:active {
  background: #1976d2;
  color: #ffffff;
  font-weight: bold;
}

button.ctrl-btn.rw {
  opacity: 0.65;
}

button.ctrl-btn.rw:hover {
  opacity: 1;
}

button.ctrl-btn.close-btn {
  font-size: 14px;
  padding: 1px 6px;
  opacity: 0.75;
}

button.ctrl-btn.close-btn:hover {
  background: #e53935;
  color: #ffffff;
  opacity: 1;
}

.rate-badge.highlight {
  color: #64b5f6 !important;
  text-shadow: 0 0 8px rgba(100, 181, 246, 0.9) !important;
}
`,y=class extends HTMLElement{shadow;pillElem;rateBadge;controlsGroup;dragHandler=null;controller=null;resizeObserver=null;currentPosition={xRatio:.02,yRatio:.02};highlightTimer=null;hoverStart=0;constructor(){super(),this.shadow=this.attachShadow({mode:"closed"}),this.render()}render(){let e=document.createElement("style");e.textContent=ee,this.pillElem=document.createElement("div"),this.pillElem.id="controller",this.pillElem.className="velocity-controller",this.rateBadge=document.createElement("span"),this.rateBadge.className="draggable rate-badge",this.rateBadge.setAttribute("data-action","drag"),this.rateBadge.setAttribute("aria-label","Playback speed. Double click to reset to 1.00"),this.rateBadge.textContent="1.00",this.controlsGroup=document.createElement("span"),this.controlsGroup.id="controls",this.controlsGroup.className="controls-group";let t=document.createElement("button");t.className="ctrl-btn rw",t.setAttribute("data-action","rewind"),t.setAttribute("aria-label","Rewind 10 seconds"),t.textContent="\xAB";let i=document.createElement("button");i.className="ctrl-btn",i.setAttribute("data-action","slower"),i.setAttribute("aria-label","Decrease playback speed"),i.textContent="\u2212";let r=document.createElement("button");r.className="ctrl-btn",r.setAttribute("data-action","faster"),r.setAttribute("aria-label","Increase playback speed"),r.textContent="+";let o=document.createElement("button");o.className="ctrl-btn rw",o.setAttribute("data-action","advance"),o.setAttribute("aria-label","Advance 10 seconds"),o.textContent="\xBB";let s=document.createElement("button");s.className="ctrl-btn close-btn",s.setAttribute("data-action","close"),s.setAttribute("aria-label","Hide controller (Press V to toggle)"),s.textContent="\xD7",this.controlsGroup.appendChild(t),this.controlsGroup.appendChild(i),this.controlsGroup.appendChild(r),this.controlsGroup.appendChild(o),this.controlsGroup.appendChild(s),this.pillElem.appendChild(this.rateBadge),this.pillElem.appendChild(this.controlsGroup),this.shadow.appendChild(e),this.shadow.appendChild(this.pillElem),this.setupInteractions()}setupInteractions(){this.pillElem.addEventListener("click",i=>{i.stopPropagation();let r=i.target;if(!r||!this.controller)return;let o=r.getAttribute("data-action");if(!(!o||o==="drag"))switch(i.preventDefault(),o){case"rewind":this.controller.seekBy(-10);break;case"slower":this.controller.decreaseRate();break;case"faster":this.controller.increaseRate();break;case"advance":this.controller.seekBy(10);break;case"close":this.setVisible(!1);break}}),this.pillElem.addEventListener("mousedown",i=>{i.stopPropagation()}),this.rateBadge.addEventListener("dblclick",i=>{i.stopPropagation(),i.preventDefault(),this.controller?.resetRate()});let e=300,t=50;this.pillElem.addEventListener("mouseenter",()=>{this.hoverStart=performance.now()}),this.pillElem.addEventListener("mouseleave",()=>{this.hoverStart=0}),this.pillElem.addEventListener("wheel",i=>{i.ctrlKey||performance.now()-this.hoverStart<e||i.deltaMode===WheelEvent.DOM_DELTA_PIXEL&&Math.abs(i.deltaY)<t||(i.preventDefault(),i.stopPropagation(),this.controller&&(i.deltaY<0?this.controller.increaseRate():this.controller.decreaseRate()))},{passive:!1})}attachController(e,t,i={xRatio:.02,yRatio:.02}){this.controller=e,this.currentPosition=i,this.updateRateDisplay(e.desiredRate),this.dragHandler?.destroy(),this.dragHandler=new H(this.pillElem,()=>t,i,{onDragStart:()=>{this.pillElem.classList.add("dragging")},onDrag:r=>{this.currentPosition=r,this.updatePositionStyles(t)},onDragEnd:r=>{this.pillElem.classList.remove("dragging"),this.currentPosition=r,this.updatePositionStyles(t)}}),this.updatePositionStyles(t);try{this.resizeObserver?.disconnect(),this.resizeObserver=new ResizeObserver(()=>{this.updatePositionStyles(t)}),this.resizeObserver.observe(t)}catch{}}updateRateDisplay(e){this.rateBadge&&(this.rateBadge.textContent=M(e),this.rateBadge.classList.add("highlight"),clearTimeout(this.highlightTimer??void 0),this.highlightTimer=window.setTimeout(()=>{this.rateBadge.classList.remove("highlight")},500))}updatePositionStyles(e){let t=e.getBoundingClientRect();if(t.width<=0||t.height<=0)return;let i=Math.round(this.currentPosition.xRatio*t.width),r=Math.round(this.currentPosition.yRatio*t.height);this.style.left=`${i}px`,this.style.top=`${r}px`}setVisible(e){e?this.removeAttribute("data-hidden"):this.setAttribute("data-hidden","true")}destroy(){clearTimeout(this.highlightTimer??void 0),this.dragHandler?.destroy(),this.dragHandler=null,this.resizeObserver?.disconnect(),this.resizeObserver=null,this.controller=null,this.remove()}};function V(){let n=typeof window<"u"?window.customElements:typeof customElements<"u"?customElements:null;n&&!n.get("velocity-controller")&&n.define("velocity-controller",y)}V();var te=`
:host {
  all: initial !important;
  position: absolute !important;
  top: 12% !important;
  left: 50% !important;
  transform: translate(-50%, -10px) !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  display: block !important;
  visibility: hidden !important;
  opacity: 0 !important;
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.18s !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}
:host(.visible) {
  visibility: visible !important;
  opacity: 1 !important;
  transform: translate(-50%, 0) !important;
}
.toast-badge {
  background: rgba(10, 12, 16, 0.88) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  color: #f8fafc !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
  padding: 8px 18px !important;
  border-radius: 9999px !important;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.14) !important;
  letter-spacing: 0.2px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px !important;
  white-space: nowrap !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}
.toast-icon {
  font-size: 14px !important;
  color: #38e1ff !important;
  display: inline-block !important;
  text-shadow: 0 0 8px rgba(56, 225, 255, 0.4) !important;
}
`,E=class extends HTMLElement{shadow;badge;iconElem;textElem;hideTimer=null;constructor(){super(),this.shadow=this.attachShadow({mode:"closed"});let e=document.createElement("style");e.textContent=te,this.badge=document.createElement("div"),this.badge.className="toast-badge",this.iconElem=document.createElement("span"),this.iconElem.className="toast-icon",this.textElem=document.createElement("span"),this.badge.appendChild(this.iconElem),this.badge.appendChild(this.textElem),this.shadow.appendChild(e),this.shadow.appendChild(this.badge)}show(e,t="\u26A1",i=900){this.hideTimer!==null&&(window.clearTimeout(this.hideTimer),this.hideTimer=null),this.iconElem.textContent=t,this.textElem.textContent=e,this.classList.add("visible"),this.hideTimer=window.setTimeout(()=>{this.classList.remove("visible"),this.hideTimer=null},i)}destroy(){this.hideTimer!==null&&(window.clearTimeout(this.hideTimer),this.hideTimer=null),this.remove()}};function Y(){let n=window.customElements;n&&!n.get("velocity-hud-toast")&&n.define("velocity-hud-toast",E)}var B=class{callback;abortController=new AbortController;constructor(e){this.callback=e,this.bindEvents()}bindEvents(){let{signal:e}=this.abortController,t=()=>{let i=null;if(document.fullscreenElement instanceof Element)i=document.fullscreenElement;else if("webkitFullscreenElement"in document){let o=document.webkitFullscreenElement;o instanceof Element&&(i=o)}let r=i!==null;this.callback(r,i)};document.addEventListener("fullscreenchange",t,{signal:e}),document.addEventListener("webkitfullscreenchange",t,{signal:e})}destroy(){this.abortController.abort()}};var G=class{settings=W;siteRuleEngine=new w(this.settings);mediaRegistry=new A;selectionManager=new T(this.mediaRegistry);intentClassifier=new P;actionHandler;shortcutManager;mediaObserver;fullscreenObserver;arbiters=new WeakMap;overlays=new WeakMap;toasts=new WeakMap;constructor(){V(),Y(),this.actionHandler=new D(this.selectionManager,{onOverlayToggle:()=>this.toggleAllOverlays(),onActionExecuted:(e,t)=>this.handleActionExecuted(e,t)}),this.shortcutManager=new R(this.actionHandler,this.settings.shortcuts),this.mediaObserver=new L({onMediaFound:e=>this.handleMediaFound(e),onMediaRemoved:e=>this.handleMediaRemoved(e)}),this.fullscreenObserver=new B((e,t)=>{this.handleFullscreenChange(e,t)})}init(){this.bindBridgeListeners(),this.shortcutManager.attach(window),this.mediaObserver.observe(document),window.dispatchEvent(new CustomEvent("velocity:main:ready"))}bindBridgeListeners(){window.addEventListener("velocity:settings:init",e=>{let t=e;t.detail&&this.applySettings(t.detail)}),window.addEventListener("velocity:settings:update",e=>{let t=e;t.detail&&this.applySettings(t.detail)}),window.addEventListener("velocity:action:execute",e=>{let t=e;t.detail&&this.actionHandler.execute(t.detail)}),window.addEventListener("velocity:status:query",e=>{let i=e.detail?.nonce;if(!i)return;let r=this.selectionManager.getActiveController(),o=this.mediaRegistry.getAll(),s=this.siteRuleEngine.resolveSiteConfig(window.location);window.dispatchEvent(new CustomEvent(`velocity:status:reply:${i}`,{detail:{hasMedia:o.length>0,activeRate:r?r.desiredRate:s.initialSpeed,mediaCount:o.length,siteEnabled:s.enabled}}))})}applySettings(e){this.settings=e,this.siteRuleEngine.updateSettings(e),this.shortcutManager.setShortcuts(e.shortcuts),this.shortcutManager.enabled=e.enabled;let t=this.siteRuleEngine.resolveSiteConfig(window.location);for(let i of this.mediaRegistry.getAll()){let r=this.arbiters.get(i.media);r&&(r.fightAutomaticResets=e.compatibility.fightAutomaticRateReset);let o=this.overlays.get(i.media);o&&o.setVisible(t.enabled&&t.overlayEnabled)}}handleActionExecuted(e,t){let i=t?.media||this.selectionManager.getActiveController()?.media;if(!i)return;let r=this.toasts.get(i);if(r)switch(e.type){case"speed.increase":case"speed.decrease":case"speed.set":case"speed.reset":case"speed.preferred.toggle":r.show(`${M(t?t.desiredRate:1)}x`,"\u26A1");break;case"seek.relative":r.show(`${e.seconds>0?"+":""}${e.seconds}s`,e.seconds>0?"\u23E9":"\u23EA");break;case"marker.set":r.show(`Marker set (${Math.round(i.currentTime)}s)`,"\u{1F4CD}");break;case"marker.jump":r.show("Jumped to marker","\u{1F3AF}");break;case"overlay.toggle":{let s=this.overlays.get(i)?.getAttribute("data-hidden")==="true";r.show(s?"Controller Hidden":"Controller Visible","\u{1F441}\uFE0F");break}case"audio.boost.increase":case"audio.boost.decrease":case"audio.boost.set":{let o=t?Math.round(t.getAudioGain()*100):100;r.show(`Volume ${o}%`,o>100?"\u{1F50A}":"\u{1F509}");break}case"pitch.toggle":{let o=t?t.preservesPitch:!0;r.show(o?"Pitch Preserved":"Natural Pitch","\u{1F3B5}");break}case"pip.toggle":r.show("Picture-in-Picture","\u{1F5BC}\uFE0F");break;case"silence.skip.toggle":{let o=t?t.silenceSkipEnabled:!1;r.show(o?"Silence Skip On":"Silence Skip Off","\u23E9");break}}}handleMediaFound(e){if(this.mediaRegistry.get(e)||e.tagName.toLowerCase()==="audio"&&this.settings.audioBoolean===!1)return;let t=this.siteRuleEngine.resolveSiteConfig(window.location);if(!t.enabled)return;let i=new N(t.initialSpeed,this.settings.compatibility.fightAutomaticRateReset);this.arbiters.set(e,i);let r=this.mediaRegistry.register(e,t.initialSpeed,{onRateChange:(o,s,a)=>{let u=this.intentClassifier.isRecentInteraction(),p=a==="extension",h=i.observeRateChange(s,u,p);h.type==="restore"?o.setRate(h.rate,"restored"):h.type==="accept"&&t.rememberSpeed&&h.source!=="site-automatic"&&window.dispatchEvent(new CustomEvent("velocity:storage:save-last-speed",{detail:{speed:h.rate,domain:window.location.hostname}})),this.overlays.get(e)?.updateRateDisplay(o.desiredRate)},onDestroy:o=>{this.overlays.get(o.media)?.destroy(),this.toasts.get(o.media)?.destroy(),this.overlays.delete(o.media),this.toasts.delete(o.media),this.arbiters.delete(o.media)}});if(this.mountToast(e),t.overlayEnabled&&this.isEligibleForOverlay(e)){let o=this.mountOverlay(e,r);this.settings.startHidden&&o&&o.setVisible(!1)}}handleMediaRemoved(e){let t=this.mediaRegistry.get(e);t&&t.destroy()}isEligibleForOverlay(e){if(e.tagName.toLowerCase()==="audio")return!1;let t=e.getBoundingClientRect();return!(t.width>0&&t.width<160&&t.height>0&&t.height<90)}mountOverlay(e,t){if(this.overlays.has(e))return this.overlays.get(e)??null;let i=e.parentElement||e.parentNode;if(!i)return null;window.getComputedStyle(i).position==="static"&&(i.style.position="relative");let o=new y;return i.appendChild(o),o.attachController(t,i,this.settings.overlay.position),this.overlays.set(e,o),o}mountToast(e){if(this.toasts.has(e))return this.toasts.get(e)??null;let t=e.parentElement||e.parentNode;if(!t)return null;let i=new E;return t.appendChild(i),this.toasts.set(e,i),i}toggleAllOverlays(){for(let e of this.mediaRegistry.getAll()){let t=this.overlays.get(e.media);if(t){let i=t.getAttribute("data-hidden")==="true";t.setVisible(i)}}}handleFullscreenChange(e,t){if(t)for(let i of this.mediaRegistry.getAll()){let r=this.overlays.get(i.media);r&&i.media.parentElement&&r.updatePositionStyles(i.media.parentElement)}}},oe=new G;oe.init();})();
