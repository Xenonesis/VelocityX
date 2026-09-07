"use strict";(()=>{function d(o){return!Number.isFinite(o)||Number.isNaN(o)?1:Math.round((o+Number.EPSILON)*100)/100}function B(o){return d(o).toFixed(2)}var N=[{id:"speed.decrease",action:{type:"speed.decrease"},code:"KeyS",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"speed.increase",action:{type:"speed.increase"},code:"KeyD",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"speed.reset",action:{type:"speed.reset"},code:"KeyR",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"seek.rewind",action:{type:"seek.relative",seconds:-10},code:"KeyZ",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"seek.advance",action:{type:"seek.relative",seconds:10},code:"KeyX",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"speed.preferred.toggle",action:{type:"speed.preferred.toggle"},code:"KeyG",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"overlay.toggle",action:{type:"overlay.toggle"},code:"KeyV",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"marker.set",action:{type:"marker.set"},code:"KeyM",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0},{id:"marker.jump",action:{type:"marker.jump"},code:"KeyJ",ctrl:!1,alt:!1,shift:!1,meta:!1,enabled:!0}];function X(o){if(!o||!(o instanceof HTMLElement))return!1;let e=o.tagName.toLowerCase();if(e==="input"||e==="textarea"||e==="select"||o.isContentEditable||o.contentEditable==="true"||o.getAttribute("contenteditable")==="true"||o.getAttribute("contenteditable")===""||o.closest?.("[contenteditable='true'], [contenteditable=''], [contenteditable]"))return!0;let t=o.getAttribute("role");return t==="textbox"||t==="searchbox"||t==="combobox"}var R=class{actionHandler;shortcuts;abortController=null;enabled=!0;constructor(e,t=N){this.actionHandler=e,this.shortcuts=[...t]}setShortcuts(e){this.shortcuts=[...e]}getShortcuts(){return[...this.shortcuts]}attach(e=window){this.detach(),this.abortController=new AbortController;let{signal:t}=this.abortController;e.addEventListener("keydown",r=>{this.enabled&&r instanceof KeyboardEvent&&(r.isComposing||X(r.target)||this.handleKeyDown(r))},{capture:!0,signal:t})}handleKeyDown(e){for(let t of this.shortcuts){if(!t.enabled)continue;let r=t.code===e.code,i=t.ctrl===(e.ctrlKey||e.metaKey),n=t.alt===e.altKey,s=t.shift===e.shiftKey;if(r&&i&&n&&s){e.preventDefault(),e.stopPropagation(),this.actionHandler.execute(t.action);return}}}detach(){this.abortController&&(this.abortController.abort(),this.abortController=null)}};var I={schemaVersion:1,enabled:!0,defaultSpeed:1,preferredSpeed:1.8,speedStep:.1,rewindSeconds:10,advanceSeconds:10,rememberPlaybackSpeed:!1,audioBoolean:!0,startHidden:!1,lastSpeed:1,overlay:{enabled:!0,position:{xRatio:.02,yRatio:.02},opacity:.3,customCss:""},shortcuts:N,siteRules:[{id:"rule-meet",match:"meet.google.com",enabled:!1},{id:"rule-teams",match:"teams.microsoft.com",enabled:!1},{id:"rule-imgur",match:"imgur.com",enabled:!1}],compatibility:{fightAutomaticRateReset:!0}};function F(o){try{if(typeof o=="object"&&o!==null&&"hostname"in o)return(o.hostname||"").toLowerCase().trim();let e=String(o).trim();if(!e)return"";let t=e.includes("://")?e:`https://${e}`;return(new URL(t).hostname||"").toLowerCase().trim()}catch{return""}}function V(o,e){let t=o.toLowerCase().trim(),r=e.toLowerCase().trim();if(!t||!r)return!1;if(t===r||r===`www.${t}`||`www.${r}`===t)return!0;if(t.startsWith("*.")){let i=t.slice(2);if(r===i||r.endsWith(`.${i}`))return!0}return!1}function a(o,e,t){return Number.isNaN(o)?e:Math.min(Math.max(o,e),t)}var M=class{settings;constructor(e){this.settings=e}updateSettings(e){this.settings=e}getMatchingRule(e){let t=e.toLowerCase().trim();for(let r of this.settings.siteRules)if(V(r.match,t))return r}resolveSiteConfig(e){let t=F(e),r=this.getMatchingRule(t);if(!this.settings.enabled)return{enabled:!1,overlayEnabled:!1,initialSpeed:1,preferredSpeed:this.settings.preferredSpeed,rememberSpeed:!1,matchingRule:r};if(r&&!r.enabled)return{enabled:!1,overlayEnabled:!1,initialSpeed:1,preferredSpeed:this.settings.preferredSpeed,rememberSpeed:!1,matchingRule:r};let i=this.settings.overlay.enabled;r&&typeof r.overlayEnabled=="boolean"&&(i=r.overlayEnabled);let n=this.settings.rememberPlaybackSpeed;r&&typeof r.rememberSpeed=="boolean"&&(n=r.rememberSpeed);let s=this.settings.defaultSpeed;n&&typeof this.settings.lastSpeed=="number"&&(s=this.settings.lastSpeed),r&&typeof r.defaultSpeed=="number"&&(s=r.defaultSpeed);let l=this.settings.preferredSpeed;return r&&typeof r.preferredSpeed=="number"&&(l=r.preferredSpeed),{enabled:!0,overlayEnabled:i,initialSpeed:a(d(s),.07,16),preferredSpeed:a(d(l),.07,16),rememberSpeed:n,matchingRule:r}}};function v(o){return o instanceof HTMLMediaElement}function U(o){return!Number.isFinite(o.duration)||o.duration===1/0}var C=class{media;abortController=new AbortController;events;desiredRate;observedRate;lastSource="initial";markerTime=null;positionBeforeJump=null;previousRateBeforeReset=null;previousRateBeforePreferred=null;lastInteractionAt=Date.now();destroyed=!1;constructor(e,t=1,r={}){this.media=e,this.events=r;let i=a(d(t),.07,16);if(this.desiredRate=i,this.observedRate=e.playbackRate,e.playbackRate!==i)try{e.playbackRate=i}catch{}this.bindEvents()}bindEvents(){let{signal:e}=this.abortController;this.media.addEventListener("ratechange",()=>{this.observedRate=this.media.playbackRate,this.events.onRateChange?.(this,this.observedRate,this.lastSource)},{signal:e});let t=["play","pause","timeupdate","loadedmetadata","emptied"];for(let r of t)this.media.addEventListener(r,()=>{this.events.onStateChange?.(this)},{signal:e})}setRate(e,t="extension"){if(this.destroyed)return;let r=a(d(e),.07,16);this.desiredRate=r,this.lastSource=t,this.lastInteractionAt=Date.now();try{this.media.playbackRate!==r&&(this.media.playbackRate=r)}catch(i){console.warn("[Velocity] Failed to set playbackRate on media:",i)}}increaseRate(e=.1){this.setRate(this.desiredRate+e,"extension")}decreaseRate(e=.1){this.setRate(this.desiredRate-e,"extension")}resetRate(e=1){let t=a(d(e),.07,16);if(this.desiredRate===t){if(this.previousRateBeforeReset!==null){let r=this.previousRateBeforeReset;this.previousRateBeforeReset=null,this.setRate(r,"extension");return}}else this.previousRateBeforeReset=this.desiredRate;this.setRate(t,"extension")}seekBy(e){if(this.destroyed||!Number.isFinite(e)||U(this.media))return;this.lastInteractionAt=Date.now();let t=Number.isFinite(this.media.duration)?this.media.duration:1/0,r=a(this.media.currentTime+e,0,t);try{this.media.currentTime=r}catch(i){console.warn("[Velocity] Failed to seek media:",i)}}setMarker(){this.destroyed||(this.markerTime=this.media.currentTime,this.lastInteractionAt=Date.now())}jumpToMarker(){if(this.destroyed||this.markerTime===null)return;this.lastInteractionAt=Date.now();let e=this.media.currentTime;if(this.positionBeforeJump!==null&&Math.abs(e-this.markerTime)<.5){let t=this.positionBeforeJump;this.positionBeforeJump=null;try{this.media.currentTime=t}catch(r){console.warn("[Velocity] Failed to return from marker:",r)}return}this.positionBeforeJump=e;try{this.media.currentTime=this.markerTime}catch(t){console.warn("[Velocity] Failed to jump to marker:",t)}}togglePreferredRate(e=1.8){if(this.destroyed)return;let t=a(d(e),.07,16);if(this.desiredRate===t){let r=this.previousRateBeforePreferred??1;this.previousRateBeforePreferred=null,this.setRate(r,"extension")}else this.previousRateBeforePreferred=this.desiredRate,this.setRate(t,"extension")}destroy(){this.destroyed||(this.destroyed=!0,this.abortController.abort(),this.events.onDestroy?.(this))}};var S=class{mediaMap=new WeakMap;controllers=new Set;events;constructor(e={}){this.events=e}register(e,t=1,r={}){let i=this.mediaMap.get(e);if(i&&!i.destroyed)return i;let n=new C(e,t,{...r,onDestroy:s=>{this.controllers.delete(s),r.onDestroy?.(s),this.events.onUnregistered?.(s)}});return this.mediaMap.set(e,n),this.controllers.add(n),this.events.onRegistered?.(n),n}get(e){let t=this.mediaMap.get(e);if(t?.destroyed){this.controllers.delete(t);return}return t}unregister(e){let t=this.mediaMap.get(e);t&&(t.destroy(),this.controllers.delete(t))}getAll(){let e=[];for(let t of this.controllers)t.destroyed?this.controllers.delete(t):e.push(t);return e}clear(){for(let e of this.controllers)e.destroy();this.controllers.clear()}};var w=class{registry;constructor(e){this.registry=e}getActiveController(){let e=this.registry.getAll();if(e.length===0)return null;if(e.length===1)return e[0];let t=null,r=-1/0,i=Date.now();for(let n of e){if(n.destroyed)continue;let s=n.media,l=0;s.isConnected||(l-=1e4),!s.paused&&!s.ended&&s.readyState>1&&(l+=1e3);let g=i-n.lastInteractionAt;g<5e3&&(l+=2e3-Math.floor(g/5));try{let h=s.getBoundingClientRect();if(h.width>0&&h.height>0){let u=h.width*h.height,y=Math.min(500,Math.floor(u/1e3));l+=y}}catch{}(s.muted||s.volume===0)&&(l-=100),l>r&&(r=l,t=n)}return t??e[0]??null}};var x=class{selectionManager;callbacks;constructor(e,t={}){this.selectionManager=e,this.callbacks=t}execute(e){if(e.type==="overlay.toggle")return this.callbacks.onOverlayToggle?.(),this.callbacks.onActionExecuted?.(e,null),!0;let t=this.selectionManager.getActiveController();if(!t||t.destroyed)return!1;switch(e.type){case"speed.increase":t.increaseRate(e.step??.1);break;case"speed.decrease":t.decreaseRate(e.step??.1);break;case"speed.set":t.setRate(e.value,"extension");break;case"speed.reset":t.resetRate(e.target??1);break;case"speed.preferred.toggle":t.togglePreferredRate(e.preferred??1.8);break;case"seek.relative":t.seekBy(e.seconds);break;case"marker.set":t.setMarker();break;case"marker.jump":t.jumpToMarker();break;default:return!1}return this.callbacks.onActionExecuted?.(e,t),!0}};var D=class{lastTrustedInteractionAt=0;abortController=null;constructor(){this.attach()}attach(e=document){this.detach(),this.abortController=new AbortController;let{signal:t}=this.abortController,r=["pointerdown","click","touchstart","keydown"];for(let i of r)try{e.addEventListener(i,n=>{n.isTrusted&&this.recordInteraction()},{capture:!0,passive:!0,signal:t})}catch{}}recordInteraction(){this.lastTrustedInteractionAt=Date.now()}isRecentInteraction(e=500){return Date.now()-this.lastTrustedInteractionAt<=e}getLastInteractionTime(){return this.lastTrustedInteractionAt}detach(){this.abortController&&(this.abortController.abort(),this.abortController=null)}};var A=class{observer=null;callbacks;isObserving=!1;constructor(e){this.callbacks=e}observe(e=document){if(!this.isObserving){this.isObserving=!0,this.discoverMediaInSubtree(e),this.observer=new MutationObserver(t=>{for(let r of t){for(let i=0;i<r.addedNodes.length;i++){let n=r.addedNodes[i];this.discoverMediaInSubtree(n)}if(this.callbacks.onMediaRemoved)for(let i=0;i<r.removedNodes.length;i++){let n=r.removedNodes[i];this.handleRemovedSubtree(n)}}});try{this.observer.observe(e,{childList:!0,subtree:!0})}catch(t){console.warn("[Velocity] MutationObserver failed to attach:",t)}}}discoverMediaInSubtree(e){if(v(e)&&this.callbacks.onMediaFound(e),e instanceof Element||e instanceof Document||e instanceof DocumentFragment){let t=e.querySelectorAll("video, audio");for(let r=0;r<t.length;r++){let i=t[r];v(i)&&this.callbacks.onMediaFound(i)}}}handleRemovedSubtree(e){if(v(e)&&this.callbacks.onMediaRemoved?.(e),e instanceof Element||e instanceof DocumentFragment){let t=e.querySelectorAll("video, audio");for(let r=0;r<t.length;r++){let i=t[r];v(i)&&this.callbacks.onMediaRemoved?.(i)}}}disconnect(){this.isObserving&&(this.isObserving=!1,this.observer?.disconnect(),this.observer=null)}};var T=class{desiredRate;fightAutomaticResets;consecutiveCorrections=0;windowStart=0;circuitBreakerTripped=!1;constructor(e=1,t=!0){this.desiredRate=d(e),this.fightAutomaticResets=t}setDesiredRate(e){this.desiredRate=d(e),this.consecutiveCorrections=0,this.circuitBreakerTripped=!1}observeRateChange(e,t,r=!1){let i=d(e);if(r)return this.desiredRate=i,this.consecutiveCorrections=0,this.circuitBreakerTripped=!1,{type:"accept",rate:this.desiredRate,source:"extension"};if(i===this.desiredRate)return this.consecutiveCorrections=0,{type:"accept",rate:this.desiredRate,source:"extension"};if(t)return this.desiredRate=i,this.consecutiveCorrections=0,this.circuitBreakerTripped=!1,{type:"accept",rate:this.desiredRate,source:"site-user"};if(!this.fightAutomaticResets)return{type:"accept",rate:i,source:"site-automatic"};let n=Date.now();return n-this.windowStart>1e3&&(this.windowStart=n,this.consecutiveCorrections=0,this.circuitBreakerTripped=!1),this.consecutiveCorrections++,this.consecutiveCorrections>=6?(this.circuitBreakerTripped=!0,console.warn(`[Velocity] Speed oscillation circuit breaker tripped (${this.consecutiveCorrections} corrections in window).`),{type:"ignore"}):{type:"restore",rate:this.desiredRate,source:"restored"}}resetCircuitBreaker(){this.consecutiveCorrections=0,this.circuitBreakerTripped=!1,this.windowStart=0}};var k=class{element;getContainer;callbacks;abortController=new AbortController;isDragging=!1;startPointerX=0;startPointerY=0;startElemX=0;startElemY=0;currentPos;constructor(e,t,r={xRatio:.02,yRatio:.02},i={}){this.element=e,this.getContainer=t,this.currentPos={xRatio:a(r.xRatio,0,.95),yRatio:a(r.yRatio,0,.95)},this.callbacks=i,this.bindEvents()}getPosition(){return{...this.currentPos}}setPosition(e){this.currentPos={xRatio:a(e.xRatio,0,.95),yRatio:a(e.yRatio,0,.95)}}bindEvents(){let{signal:e}=this.abortController;this.element.addEventListener("pointerdown",r=>{if(r.button!==0)return;let i=r.target;if(i&&(i.tagName.toLowerCase()==="button"||i.closest("button")))return;let n=this.getContainer();if(!n)return;this.isDragging=!0,this.startPointerX=r.clientX,this.startPointerY=r.clientY;let s=n.getBoundingClientRect(),l=this.element.getBoundingClientRect();this.startElemX=l.left-s.left,this.startElemY=l.top-s.top;try{this.element.setPointerCapture(r.pointerId)}catch{}r.preventDefault(),r.stopPropagation(),this.callbacks.onDragStart?.()},{signal:e}),this.element.addEventListener("pointermove",r=>{if(!this.isDragging)return;let i=this.getContainer();if(!i)return;let n=i.getBoundingClientRect(),s=this.element.getBoundingClientRect(),l=Math.max(n.width-s.width,1),g=Math.max(n.height-s.height,1),h=r.clientX-this.startPointerX,u=r.clientY-this.startPointerY,y=this.startElemX+h,W=this.startElemY+u,z=a(y,0,l),Y=a(W,0,g);this.currentPos={xRatio:a(z/n.width,0,.95),yRatio:a(Y/n.height,0,.95)},this.callbacks.onDrag?.(this.currentPos)},{signal:e});let t=r=>{if(this.isDragging){this.isDragging=!1;try{this.element.hasPointerCapture(r.pointerId)&&this.element.releasePointerCapture(r.pointerId)}catch{}this.callbacks.onDragEnd?.(this.currentPos)}};this.element.addEventListener("pointerup",t,{signal:e}),this.element.addEventListener("pointercancel",t,{signal:e})}destroy(){this.abortController.abort(),this.isDragging=!1}};var j=`
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
`,E=class extends HTMLElement{shadow;pillElem;rateBadge;controlsGroup;dragHandler=null;controller=null;resizeObserver=null;currentPosition={xRatio:.02,yRatio:.02};highlightTimer=null;hoverStart=0;constructor(){super(),this.shadow=this.attachShadow({mode:"closed"}),this.render()}render(){let e=document.createElement("style");e.textContent=j,this.pillElem=document.createElement("div"),this.pillElem.id="controller",this.pillElem.className="velocity-controller",this.rateBadge=document.createElement("span"),this.rateBadge.className="draggable rate-badge",this.rateBadge.setAttribute("data-action","drag"),this.rateBadge.setAttribute("aria-label","Playback speed. Double click to reset to 1.00"),this.rateBadge.textContent="1.00",this.controlsGroup=document.createElement("span"),this.controlsGroup.id="controls",this.controlsGroup.className="controls-group";let t=document.createElement("button");t.className="ctrl-btn rw",t.setAttribute("data-action","rewind"),t.setAttribute("aria-label","Rewind 10 seconds"),t.textContent="\xAB";let r=document.createElement("button");r.className="ctrl-btn",r.setAttribute("data-action","slower"),r.setAttribute("aria-label","Decrease playback speed"),r.textContent="\u2212";let i=document.createElement("button");i.className="ctrl-btn",i.setAttribute("data-action","faster"),i.setAttribute("aria-label","Increase playback speed"),i.textContent="+";let n=document.createElement("button");n.className="ctrl-btn rw",n.setAttribute("data-action","advance"),n.setAttribute("aria-label","Advance 10 seconds"),n.textContent="\xBB";let s=document.createElement("button");s.className="ctrl-btn close-btn",s.setAttribute("data-action","close"),s.setAttribute("aria-label","Hide controller (Press V to toggle)"),s.textContent="\xD7",this.controlsGroup.appendChild(t),this.controlsGroup.appendChild(r),this.controlsGroup.appendChild(i),this.controlsGroup.appendChild(n),this.controlsGroup.appendChild(s),this.pillElem.appendChild(this.rateBadge),this.pillElem.appendChild(this.controlsGroup),this.shadow.appendChild(e),this.shadow.appendChild(this.pillElem),this.setupInteractions()}setupInteractions(){this.pillElem.addEventListener("click",r=>{r.stopPropagation();let i=r.target;if(!i||!this.controller)return;let n=i.getAttribute("data-action");if(!(!n||n==="drag"))switch(r.preventDefault(),n){case"rewind":this.controller.seekBy(-10);break;case"slower":this.controller.decreaseRate();break;case"faster":this.controller.increaseRate();break;case"advance":this.controller.seekBy(10);break;case"close":this.setVisible(!1);break}}),this.pillElem.addEventListener("mousedown",r=>{r.stopPropagation()}),this.rateBadge.addEventListener("dblclick",r=>{r.stopPropagation(),r.preventDefault(),this.controller?.resetRate()});let e=300,t=50;this.pillElem.addEventListener("mouseenter",()=>{this.hoverStart=performance.now()}),this.pillElem.addEventListener("mouseleave",()=>{this.hoverStart=0}),this.pillElem.addEventListener("wheel",r=>{r.ctrlKey||performance.now()-this.hoverStart<e||r.deltaMode===WheelEvent.DOM_DELTA_PIXEL&&Math.abs(r.deltaY)<t||(r.preventDefault(),r.stopPropagation(),this.controller&&(r.deltaY<0?this.controller.increaseRate():this.controller.decreaseRate()))},{passive:!1})}attachController(e,t,r={xRatio:.02,yRatio:.02}){this.controller=e,this.currentPosition=r,this.updateRateDisplay(e.desiredRate),this.dragHandler?.destroy(),this.dragHandler=new k(this.pillElem,()=>t,r,{onDragStart:()=>{this.pillElem.classList.add("dragging")},onDrag:i=>{this.currentPosition=i,this.updatePositionStyles(t)},onDragEnd:i=>{this.pillElem.classList.remove("dragging"),this.currentPosition=i,this.updatePositionStyles(t)}}),this.updatePositionStyles(t);try{this.resizeObserver?.disconnect(),this.resizeObserver=new ResizeObserver(()=>{this.updatePositionStyles(t)}),this.resizeObserver.observe(t)}catch{}}updateRateDisplay(e){this.rateBadge&&(this.rateBadge.textContent=B(e),this.rateBadge.classList.add("highlight"),clearTimeout(this.highlightTimer??void 0),this.highlightTimer=window.setTimeout(()=>{this.rateBadge.classList.remove("highlight")},500))}updatePositionStyles(e){let t=e.getBoundingClientRect();if(t.width<=0||t.height<=0)return;let r=Math.round(this.currentPosition.xRatio*t.width),i=Math.round(this.currentPosition.yRatio*t.height);this.style.left=`${r}px`,this.style.top=`${i}px`}setVisible(e){e?this.removeAttribute("data-hidden"):this.setAttribute("data-hidden","true")}destroy(){clearTimeout(this.highlightTimer??void 0),this.dragHandler?.destroy(),this.dragHandler=null,this.resizeObserver?.disconnect(),this.resizeObserver=null,this.controller=null,this.remove()}};function O(){let o=typeof window<"u"?window.customElements:typeof customElements<"u"?customElements:null;o&&!o.get("velocity-controller")&&o.define("velocity-controller",E)}O();var L=class{callback;abortController=new AbortController;constructor(e){this.callback=e,this.bindEvents()}bindEvents(){let{signal:e}=this.abortController,t=()=>{let r=null;if(document.fullscreenElement instanceof Element)r=document.fullscreenElement;else if("webkitFullscreenElement"in document){let n=document.webkitFullscreenElement;n instanceof Element&&(r=n)}let i=r!==null;this.callback(i,r)};document.addEventListener("fullscreenchange",t,{signal:e}),document.addEventListener("webkitfullscreenchange",t,{signal:e})}destroy(){this.abortController.abort()}};var _=class{settings=I;siteRuleEngine=new M(this.settings);mediaRegistry=new S;selectionManager=new w(this.mediaRegistry);intentClassifier=new D;actionHandler;shortcutManager;mediaObserver;fullscreenObserver;arbiters=new WeakMap;overlays=new WeakMap;constructor(){O(),this.actionHandler=new x(this.selectionManager,{onOverlayToggle:()=>this.toggleAllOverlays()}),this.shortcutManager=new R(this.actionHandler,this.settings.shortcuts),this.mediaObserver=new A({onMediaFound:e=>this.handleMediaFound(e),onMediaRemoved:e=>this.handleMediaRemoved(e)}),this.fullscreenObserver=new L((e,t)=>{this.handleFullscreenChange(e,t)})}init(){this.bindBridgeListeners(),this.shortcutManager.attach(window),this.mediaObserver.observe(document),window.dispatchEvent(new CustomEvent("velocity:main:ready"))}bindBridgeListeners(){window.addEventListener("velocity:settings:init",e=>{let t=e;t.detail&&this.applySettings(t.detail)}),window.addEventListener("velocity:settings:update",e=>{let t=e;t.detail&&this.applySettings(t.detail)}),window.addEventListener("velocity:action:execute",e=>{let t=e;t.detail&&this.actionHandler.execute(t.detail)}),window.addEventListener("velocity:status:query",e=>{let r=e.detail?.nonce;if(!r)return;let i=this.selectionManager.getActiveController(),n=this.mediaRegistry.getAll(),s=this.siteRuleEngine.resolveSiteConfig(window.location);window.dispatchEvent(new CustomEvent(`velocity:status:reply:${r}`,{detail:{hasMedia:n.length>0,activeRate:i?i.desiredRate:s.initialSpeed,mediaCount:n.length,siteEnabled:s.enabled}}))})}applySettings(e){this.settings=e,this.siteRuleEngine.updateSettings(e),this.shortcutManager.setShortcuts(e.shortcuts),this.shortcutManager.enabled=e.enabled;let t=this.siteRuleEngine.resolveSiteConfig(window.location);for(let r of this.mediaRegistry.getAll()){let i=this.arbiters.get(r.media);i&&(i.fightAutomaticResets=e.compatibility.fightAutomaticRateReset);let n=this.overlays.get(r.media);n&&n.setVisible(t.enabled&&t.overlayEnabled)}}handleMediaFound(e){if(this.mediaRegistry.get(e)||e.tagName.toLowerCase()==="audio"&&this.settings.audioBoolean===!1)return;let t=this.siteRuleEngine.resolveSiteConfig(window.location);if(!t.enabled)return;let r=new T(t.initialSpeed,this.settings.compatibility.fightAutomaticRateReset);this.arbiters.set(e,r);let i=this.mediaRegistry.register(e,t.initialSpeed,{onRateChange:(n,s,l)=>{let g=this.intentClassifier.isRecentInteraction(),h=l==="extension",u=r.observeRateChange(s,g,h);u.type==="restore"?n.setRate(u.rate,"restored"):u.type==="accept"&&t.rememberSpeed&&u.source!=="site-automatic"&&window.dispatchEvent(new CustomEvent("velocity:storage:save-last-speed",{detail:{speed:u.rate}})),this.overlays.get(e)?.updateRateDisplay(n.desiredRate)},onDestroy:n=>{this.overlays.get(n.media)?.destroy(),this.overlays.delete(n.media),this.arbiters.delete(n.media)}});if(t.overlayEnabled&&this.isEligibleForOverlay(e)){let n=this.mountOverlay(e,i);this.settings.startHidden&&n&&n.setVisible(!1)}}handleMediaRemoved(e){let t=this.mediaRegistry.get(e);t&&t.destroy()}isEligibleForOverlay(e){if(e.tagName.toLowerCase()==="audio")return!1;let t=e.getBoundingClientRect();return!(t.width>0&&t.width<160&&t.height>0&&t.height<90)}mountOverlay(e,t){if(this.overlays.has(e))return this.overlays.get(e)??null;let r=e.parentElement||e.parentNode;if(!r)return null;window.getComputedStyle(r).position==="static"&&(r.style.position="relative");let n=new E;return r.appendChild(n),n.attachController(t,r,this.settings.overlay.position),this.overlays.set(e,n),n}toggleAllOverlays(){for(let e of this.mediaRegistry.getAll()){let t=this.overlays.get(e.media);if(t){let r=t.getAttribute("data-hidden")==="true";t.setVisible(r)}}}handleFullscreenChange(e,t){if(t)for(let r of this.mediaRegistry.getAll()){let i=this.overlays.get(r.media);i&&r.media.parentElement&&i.updatePositionStyles(r.media.parentElement)}}},Z=new _;Z.init();})();
