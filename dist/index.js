var __webpack_modules__={711:function(e,t,r){const n=("undefined"!=typeof window?window:r.g)||this,o=Symbol.for("@@deadbeefRefMap"),i=Symbol.for("@@deadbeefUniqueID"),s=n[o]?n[o]:new WeakMap,a=[];n[o]||(n[o]=s);let c=0n;function anythingToID(e,t){let r=e;(r instanceof Number||r instanceof String||r instanceof Boolean)&&(r=r.valueOf());let n=typeof r;if("number"===n&&0===r)return Object.is(r,-0)?"number:-0":"number:+0";if("symbol"===n)return`symbol:${r.toString()}`;if(null==r||"number"===n||"boolean"===n||"string"===n||"bigint"===n)return"number"===n?r<0?`number:${r}`:`number:+${r}`:"bigint"===n&&0n===r?"bigint:+0":`${n}:${r}`;let o=a.length>0&&function getHelperForValue(e){for(let t=0,r=a.length;t<r;t++){let{helper:r,generator:n}=a[t];if(r(e))return n}}(r);if(o)return anythingToID(o(r));if(i in r&&"function"==typeof r[i]&&(!t||!t.has(r))){let e=t||new Set;return e.add(r),anythingToID(r[i](),e)}if(!s.has(r)){let e=`${typeof r}:${++c}`;return s.set(r,e),e}return s.get(r)}function deadbeef(){let e=[arguments.length];for(let t=0,r=arguments.length;t<r;t++)e.push(anythingToID(arguments[t]));return e.join(":")}Object.defineProperties(deadbeef,{idSym:{writable:!0,enumerable:!1,configurable:!0,value:i},sorted:{writable:!0,enumerable:!1,configurable:!0,value:function deadbeefSorted(){let e=[arguments.length];for(let t=0,r=arguments.length;t<r;t++)e.push(anythingToID(arguments[t]));return e.sort().join(":")}},generateIDFor:{writable:!0,enumerable:!1,configurable:!0,value:function generateIDFor(e,t){a.push({helper:e,generator:t})}},removeIDGenerator:{writable:!0,enumerable:!1,configurable:!0,value:function removeIDGenerator(e){let t=a.findIndex((t=>t.helper===e));t<0||a.splice(t,1)}}}),e.exports=deadbeef},810:(__unused_webpack___webpack_module__,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{$:()=>__webpack_exports__$,El:()=>__webpack_exports__Jibs,cQ:()=>__webpack_exports__Utils,d5:()=>__webpack_exports__factory,pv:()=>__webpack_exports__Renderers,wA:()=>__webpack_exports__Component,z8:()=>__webpack_exports__Components,zD:()=>__webpack_exports__load});var __webpack_modules__={187:e=>{var t,r="object"==typeof Reflect?Reflect:null,n=r&&"function"==typeof r.apply?r.apply:function ReflectApply(e,t,r){return Function.prototype.apply.call(e,t,r)};t=r&&"function"==typeof r.ownKeys?r.ownKeys:Object.getOwnPropertySymbols?function ReflectOwnKeys(e){return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e))}:function ReflectOwnKeys(e){return Object.getOwnPropertyNames(e)};var o=Number.isNaN||function NumberIsNaN(e){return e!=e};function EventEmitter(){EventEmitter.init.call(this)}e.exports=EventEmitter,e.exports.once=function once(e,t){return new Promise((function(r,n){function errorListener(r){e.removeListener(t,resolver),n(r)}function resolver(){"function"==typeof e.removeListener&&e.removeListener("error",errorListener),r([].slice.call(arguments))}eventTargetAgnosticAddListener(e,t,resolver,{once:!0}),"error"!==t&&function addErrorHandlerIfEventEmitter(e,t,r){"function"==typeof e.on&&eventTargetAgnosticAddListener(e,"error",t,r)}(e,errorListener,{once:!0})}))},EventEmitter.EventEmitter=EventEmitter,EventEmitter.prototype._events=void 0,EventEmitter.prototype._eventsCount=0,EventEmitter.prototype._maxListeners=void 0;var i=10;function checkListener(e){if("function"!=typeof e)throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof e)}function _getMaxListeners(e){return void 0===e._maxListeners?EventEmitter.defaultMaxListeners:e._maxListeners}function _addListener(e,t,r,n){var o,i,s;if(checkListener(r),void 0===(i=e._events)?(i=e._events=Object.create(null),e._eventsCount=0):(void 0!==i.newListener&&(e.emit("newListener",t,r.listener?r.listener:r),i=e._events),s=i[t]),void 0===s)s=i[t]=r,++e._eventsCount;else if("function"==typeof s?s=i[t]=n?[r,s]:[s,r]:n?s.unshift(r):s.push(r),(o=_getMaxListeners(e))>0&&s.length>o&&!s.warned){s.warned=!0;var a=new Error("Possible EventEmitter memory leak detected. "+s.length+" "+String(t)+" listeners added. Use emitter.setMaxListeners() to increase limit");a.name="MaxListenersExceededWarning",a.emitter=e,a.type=t,a.count=s.length,function ProcessEmitWarning(e){console&&console.warn&&console.warn(e)}(a)}return e}function onceWrapper(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,0===arguments.length?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function _onceWrap(e,t,r){var n={fired:!1,wrapFn:void 0,target:e,type:t,listener:r},o=onceWrapper.bind(n);return o.listener=r,n.wrapFn=o,o}function _listeners(e,t,r){var n=e._events;if(void 0===n)return[];var o=n[t];return void 0===o?[]:"function"==typeof o?r?[o.listener||o]:[o]:r?function unwrapListeners(e){for(var t=new Array(e.length),r=0;r<t.length;++r)t[r]=e[r].listener||e[r];return t}(o):arrayClone(o,o.length)}function listenerCount(e){var t=this._events;if(void 0!==t){var r=t[e];if("function"==typeof r)return 1;if(void 0!==r)return r.length}return 0}function arrayClone(e,t){for(var r=new Array(t),n=0;n<t;++n)r[n]=e[n];return r}function eventTargetAgnosticAddListener(e,t,r,n){if("function"==typeof e.on)n.once?e.once(t,r):e.on(t,r);else{if("function"!=typeof e.addEventListener)throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type '+typeof e);e.addEventListener(t,(function wrapListener(o){n.once&&e.removeEventListener(t,wrapListener),r(o)}))}}Object.defineProperty(EventEmitter,"defaultMaxListeners",{enumerable:!0,get:function(){return i},set:function(e){if("number"!=typeof e||e<0||o(e))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+e+".");i=e}}),EventEmitter.init=function(){void 0!==this._events&&this._events!==Object.getPrototypeOf(this)._events||(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},EventEmitter.prototype.setMaxListeners=function setMaxListeners(e){if("number"!=typeof e||e<0||o(e))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+e+".");return this._maxListeners=e,this},EventEmitter.prototype.getMaxListeners=function getMaxListeners(){return _getMaxListeners(this)},EventEmitter.prototype.emit=function emit(e){for(var t=[],r=1;r<arguments.length;r++)t.push(arguments[r]);var o="error"===e,i=this._events;if(void 0!==i)o=o&&void 0===i.error;else if(!o)return!1;if(o){var s;if(t.length>0&&(s=t[0]),s instanceof Error)throw s;var a=new Error("Unhandled error."+(s?" ("+s.message+")":""));throw a.context=s,a}var c=i[e];if(void 0===c)return!1;if("function"==typeof c)n(c,this,t);else{var l=c.length,u=arrayClone(c,l);for(r=0;r<l;++r)n(u[r],this,t)}return!0},EventEmitter.prototype.addListener=function addListener(e,t){return _addListener(this,e,t,!1)},EventEmitter.prototype.on=EventEmitter.prototype.addListener,EventEmitter.prototype.prependListener=function prependListener(e,t){return _addListener(this,e,t,!0)},EventEmitter.prototype.once=function once(e,t){return checkListener(t),this.on(e,_onceWrap(this,e,t)),this},EventEmitter.prototype.prependOnceListener=function prependOnceListener(e,t){return checkListener(t),this.prependListener(e,_onceWrap(this,e,t)),this},EventEmitter.prototype.removeListener=function removeListener(e,t){var r,n,o,i,s;if(checkListener(t),void 0===(n=this._events))return this;if(void 0===(r=n[e]))return this;if(r===t||r.listener===t)0==--this._eventsCount?this._events=Object.create(null):(delete n[e],n.removeListener&&this.emit("removeListener",e,r.listener||t));else if("function"!=typeof r){for(o=-1,i=r.length-1;i>=0;i--)if(r[i]===t||r[i].listener===t){s=r[i].listener,o=i;break}if(o<0)return this;0===o?r.shift():function spliceOne(e,t){for(;t+1<e.length;t++)e[t]=e[t+1];e.pop()}(r,o),1===r.length&&(n[e]=r[0]),void 0!==n.removeListener&&this.emit("removeListener",e,s||t)}return this},EventEmitter.prototype.off=EventEmitter.prototype.removeListener,EventEmitter.prototype.removeAllListeners=function removeAllListeners(e){var t,r,n;if(void 0===(r=this._events))return this;if(void 0===r.removeListener)return 0===arguments.length?(this._events=Object.create(null),this._eventsCount=0):void 0!==r[e]&&(0==--this._eventsCount?this._events=Object.create(null):delete r[e]),this;if(0===arguments.length){var o,i=Object.keys(r);for(n=0;n<i.length;++n)"removeListener"!==(o=i[n])&&this.removeAllListeners(o);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if("function"==typeof(t=r[e]))this.removeListener(e,t);else if(void 0!==t)for(n=t.length-1;n>=0;n--)this.removeListener(e,t[n]);return this},EventEmitter.prototype.listeners=function listeners(e){return _listeners(this,e,!0)},EventEmitter.prototype.rawListeners=function rawListeners(e){return _listeners(this,e,!1)},EventEmitter.listenerCount=function(e,t){return"function"==typeof e.listenerCount?e.listenerCount(t):listenerCount.call(e,t)},EventEmitter.prototype.listenerCount=listenerCount,EventEmitter.prototype.eventNames=function eventNames(){return this._eventsCount>0?t(this._events):[]}},711:function(e,t,r){const n=("undefined"!=typeof window?window:r.g)||this,o=Symbol.for("@@deadbeefRefMap"),i=Symbol.for("@@deadbeefUniqueID"),s=n[o]?n[o]:new WeakMap,a=[];n[o]||(n[o]=s);let c=0n;function anythingToID(e,t){let r=e;(r instanceof Number||r instanceof String||r instanceof Boolean)&&(r=r.valueOf());let n=typeof r;if("number"===n&&0===r)return Object.is(r,-0)?"number:-0":"number:+0";if("symbol"===n)return`symbol:${r.toString()}`;if(null==r||"number"===n||"boolean"===n||"string"===n||"bigint"===n)return"number"===n?r<0?`number:${r}`:`number:+${r}`:"bigint"===n&&0n===r?"bigint:+0":`${n}:${r}`;let o=a.length>0&&function getHelperForValue(e){for(let t=0,r=a.length;t<r;t++){let{helper:r,generator:n}=a[t];if(r(e))return n}}(r);if(o)return anythingToID(o(r));if(i in r&&"function"==typeof r[i]&&(!t||!t.has(r))){let e=t||new Set;return e.add(r),anythingToID(r[i](),e)}if(!s.has(r)){let e=`${typeof r}:${++c}`;return s.set(r,e),e}return s.get(r)}function deadbeef(){let e=[arguments.length];for(let t=0,r=arguments.length;t<r;t++)e.push(anythingToID(arguments[t]));return e.join(":")}Object.defineProperties(deadbeef,{idSym:{writable:!0,enumerable:!1,configurable:!0,value:i},sorted:{writable:!0,enumerable:!1,configurable:!0,value:function deadbeefSorted(){let e=[arguments.length];for(let t=0,r=arguments.length;t<r;t++)e.push(anythingToID(arguments[t]));return e.sort().join(":")}},generateIDFor:{writable:!0,enumerable:!1,configurable:!0,value:function generateIDFor(e,t){a.push({helper:e,generator:t})}},removeIDGenerator:{writable:!0,enumerable:!1,configurable:!0,value:function removeIDGenerator(e){let t=a.findIndex((t=>t.helper===e));t<0||a.splice(t,1)}}}),e.exports=deadbeef},515:(__unused_webpack___webpack_module__,__webpack_exports__,__nested_webpack_require_8851__)=>{__nested_webpack_require_8851__.d(__webpack_exports__,{zD:()=>load});const cacheMap=new Map,resourceResolvers=new Set;function addResourceResolver(e){resourceResolvers.add(e)}function removeResourceResolver(e){resourceResolvers.delete(e)}function resolveResourcePath(e){let t=e;for(let e of resourceResolvers)t=e(t);return t}function load(_resourcePath){let resourcePath=resolveResourcePath(_resourcePath),cache=cacheMap.get(resourcePath);if(cache)return cache;let promise=eval(`(import('${resourcePath.replace(/'/g,"\\'")}'))`).then((e=>{let t=e;return t&&t.default&&(t=t.default),cacheMap.set(resourcePath,t),t}));return cacheMap.set(resourcePath,promise),promise}Object.defineProperties(load,{addResolver:{writable:!0,enumerable:!1,configurable:!0,value:addResourceResolver},removeResolver:{writable:!0,enumerable:!1,configurable:!0,value:removeResourceResolver},resolve:{writable:!0,enumerable:!1,configurable:!0,value:resolveResourcePath}})}},__webpack_module_cache__={};function __nested_webpack_require_9838__(e){var t=__webpack_module_cache__[e];if(void 0!==t)return t.exports;var r=__webpack_module_cache__[e]={exports:{}};return __webpack_modules__[e].call(r.exports,r,r.exports,__nested_webpack_require_9838__),r.exports}__nested_webpack_require_9838__.d=(e,t)=>{for(var r in t)__nested_webpack_require_9838__.o(t,r)&&!__nested_webpack_require_9838__.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},__nested_webpack_require_9838__.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),__nested_webpack_require_9838__.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),__nested_webpack_require_9838__.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var __webpack_exports__={};(()=>{__nested_webpack_require_9838__.d(__webpack_exports__,{$:()=>s,wA:()=>Component,z8:()=>g,El:()=>w,pv:()=>x,cQ:()=>e,d5:()=>factory,zD:()=>v.zD});var e={};__nested_webpack_require_9838__.r(e),__nested_webpack_require_9838__.d(e,{bindMethods:()=>bindMethods,childrenDiffer:()=>childrenDiffer,fetchDeepProperty:()=>fetchDeepProperty,instanceOf:()=>instanceOf,isEmpty:()=>isEmpty,isNotEmpty:()=>isNotEmpty,iterateAsync:()=>iterateAsync,propsDiffer:()=>propsDiffer,sizeOf:()=>sizeOf});var t=__nested_webpack_require_9838__(711);const r="undefined"!=typeof global?global:"undefined"!=typeof window?window:void 0;function instanceOf(e){function testType(e,t){let n=t,o=typeof e;return n===r.String?n="string":n===r.Number?n="number":n===r.Boolean?n="boolean":n===r.Function?n="function":n===r.Array?n="array":n===r.Object?n="object":n===r.Promise?n="promise":n===r.BigInt?n="bigint":n===r.Map?n="map":n===r.WeakMap?n="weakmap":n===r.Set?n="set":n===r.Symbol?n="symbol":n===r.Buffer&&(n="buffer"),!("buffer"!==n||!r.Buffer||!r.Buffer.isBuffer(e))||("number"===n&&("number"===o||e instanceof Number||e.constructor&&"Number"===e.constructor.name)?!!isFinite(e):"object"!==n&&n===o||("object"===n?!!(e.constructor===Object.prototype.constructor||e.constructor&&"Object"===e.constructor.name)||"object"===o&&!e.constructor:!("array"!==n||!(Array.isArray(e)||e instanceof Array||e.constructor&&"Array"===e.constructor.name))||!("promise"!==n&&"deferred"!==n||!function isDeferredType(e){return!!(e instanceof Promise||e.constructor&&"Promise"===e.constructor.name)||"function"==typeof e.then&&"function"==typeof e.catch}(e))||!("string"!==n||!(e instanceof r.String||e.constructor&&"String"===e.constructor.name))||!("boolean"!==n||!(e instanceof r.Boolean||e.constructor&&"Boolean"===e.constructor.name))||!("map"!==n||!(e instanceof r.Map||e.constructor&&"Map"===e.constructor.name))||!("weakmap"!==n||!(e instanceof r.WeakMap||e.constructor&&"WeakMap"===e.constructor.name))||!("set"!==n||!(e instanceof r.Set||e.constructor&&"Set"===e.constructor.name))||"function"===n&&"function"===o||"function"==typeof n&&e instanceof n||!("string"!=typeof n||!e.constructor||e.constructor.name!==n)))}if(null==e)return!1;for(var t=1,n=arguments.length;t<n;t++)if(!0===testType(e,arguments[t]))return!0;return!1}function propsDiffer(e,t,r){if(e===t)return!1;if(typeof e!=typeof t)return!0;if(!e&&t)return!0;if(e&&!t)return!0;if(!e&&!t&&e!=e)return!0;let n=Object.keys(e).concat(Object.getOwnPropertySymbols(e)),o=Object.keys(t).concat(Object.getOwnPropertySymbols(t));if(n.length!==o.length)return!0;for(let i=0,s=n.length;i<s;i++){let s=n[i];if(r&&r.indexOf(s))continue;if(e[s]!==t[s])return!0;let a=o[i];if(!(r&&r.indexOf(a)||s===a||e[a]===t[a]))return!0}return!1}function sizeOf(e){return e?Object.is(1/0)?0:"number"==typeof e.length?e.length:Object.keys(e).length:0}async function iterateAsync(e,t){if(!e||Object.is(1/0))return;let r,n=[],o=!1,STOP=()=>(o=!0,STOP),i={collection:e,STOP};if(Array.isArray(e)){i.type="Array";for(let s=0,a=e.length;s<a&&(i.value=e[s],i.index=i.key=s,r=await t.call(this,i),r!==STOP&&!o);s++)n.push(r)}else if("function"==typeof e.entries)if(e instanceof Set||"Set"===e.constructor.name){i.type="Set";let s=0;for(let a of e.values()){if(i.value=a,i.key=a,i.index=s++,r=await t.call(this,i),r===STOP||o)break;n.push(r)}}else{i.type=e.constructor.name;let s=0;for(let[a,c]of e.entries()){if(i.value=c,i.key=a,i.index=s++,r=await t.call(this,i),r===STOP||o)break;n.push(r)}}else{if(instanceOf(e,"boolean","number","bigint","function"))return;i.type=e.constructor?e.constructor.name:"Object";let s=Object.keys(e);for(let a=0,c=s.length;a<c;a++){let c=s[a],l=e[c];if(i.value=l,i.key=c,i.index=a,r=await t.call(this,i),r===STOP||o)break;n.push(r)}}return n}function childrenDiffer(e,r){let n=Array.isArray(e)?e:[e],o=Array.isArray(r)?r:[r];return t(...n)!==t(...o)}function fetchDeepProperty(e,t,r,n){if(null==e||Object.is(NaN,e)||Object.is(1/0,e))return n?[r,null]:r;if(null==t||Object.is(NaN,t)||Object.is(1/0,t))return n?[r,null]:r;let o;if(Array.isArray(t))o=t;else if("symbol"==typeof t)o=[t];else{let e=""+t,r=0,n=0;for(o=[];;){let t=e.indexOf(".",r);if(t<0){o.push(e.substring(n));break}"\\"!==e.charAt(t-1)?(o.push(e.substring(n,t)),n=r=t+1):r=t+1}}let i=o[o.length-1];if(0===o.length)return n?[r,i]:r;let s=e;for(let e=0,t=o.length;e<t;e++)if(s=s[o[e]],null==s)return n?[r,i]:r;return n?[s,i]:s}function bindMethods(e,t){let r=e,n=new Set;for(;r;){let e=Object.getOwnPropertyDescriptors(r),o=Object.keys(e).concat(Object.getOwnPropertySymbols(e));for(let e=0,t=o.length;e<t;e++){let t=o[e];if("constructor"===t)continue;if(n.has(t))continue;n.add(t);let i=r[t];Object.prototype.hasOwnProperty(t)&&Object.prototype[t]===i||"function"==typeof i&&(this[t]=i.bind(this))}if(r=Object.getPrototypeOf(r),r===Object.prototype)break;if(t&&t.indexOf(r)>=0)break}}function isEmpty(e){return!(null!=e&&(Object.is(e,1/0)||!Object.is(e,NaN)&&(instanceOf(e,"string")?/\S/.test(e):instanceOf(e,"number")&&isFinite(e)||instanceOf(e,"boolean","bigint","function")||0!==sizeOf(e))))}function isNotEmpty(e){return!isEmpty.call(this,e)}class Jib{constructor(e,t,r){Object.defineProperties(this,{Type:{writable:!0,enumerable:!0,configurable:!0,value:e},props:{writable:!0,enumerable:!0,configurable:!0,value:t},children:{writable:!0,enumerable:!0,configurable:!0,value:r}})}}const n=Symbol.for("@jibs.barren"),o=Symbol.for("@jibs.proxy"),i=Symbol.for("@jibs.jib");function factory(e){return function $(r,s={}){if(isJibish(r))throw new TypeError("Received a jib but expected a component.");let a=null==r?o:r;function barren(...r){let n=r;function jib(){return instanceOf(a,"promise")||n.some((e=>instanceOf(e,"promise")))?Promise.all([a].concat(n)).then((t=>(a=t[0],n=t.slice(1),new e(a,s,n)))):new e(a,s,n)}return Object.defineProperties(jib,{[i]:{writable:!1,enumerable:!1,configurable:!1,value:!0},[t.idSym]:{writable:!1,enumerable:!1,configurable:!1,value:()=>a}}),jib}return Object.defineProperties(barren,{[n]:{writable:!1,enumerable:!1,configurable:!1,value:!0},[t.idSym]:{writable:!1,enumerable:!1,configurable:!1,value:()=>a}}),barren}}const s=factory(Jib);function isJibish(e){return!("function"!=typeof e||!e[n]&&!e[i])}var a=__nested_webpack_require_9838__(187);const c="@jibs/component/event/update",l=Symbol.for("@jibs/component/queueUpdate"),u=Symbol.for("@jibs/component/flushUpdate"),_=Symbol.for("@jibs/component/__init"),p=Symbol.for("@jibs/component/skipStateUpdates"),f=Symbol.for("@jibs/component/pendingStateUpdate"),b=Symbol.for("@jibs/component/lastRenderTime"),d=Symbol.for("@jibs/component/previousState"),h=Symbol.for("@jibs/component/previousState");function isValidStateObject(e){if(null==e)return!1;if(Object.is(e,NaN))return!1;if(Object.is(e,1/0))return!1;if(e instanceof Boolean||e instanceof Number||e instanceof String)return!1;let t=typeof e;return"string"!==t&&"number"!==t&&"boolean"!==t&&!Array.isArray(e)&&!Buffer.isBuffer(e)}class Component extends a{static UPDATE_EVENT=c;[l](){this[f]||(this[f]=Promise.resolve(),this[f].then(this[u].bind(this)))}[u](){this[f]&&(this.emit(c),this[f]=null)}[_](){this[p]=!1}constructor(e){super(),this.setMaxListeners(1/0),bindMethods.call(this,this.constructor.prototype,[a.prototype]);let t=e||{},r=t.props||{},n=(()=>{let e=Object.create(null);return new Proxy(e,{get:(e,t)=>e[t],set:(e,t,r)=>{let n=e[t];return n===r||(this[p]||this[l](),this.onStateUpdated(t,r,n),e[t]=r),!0}})})();Object.defineProperties(this,{[p]:{writable:!0,enumerable:!1,configurable:!0,value:!0},[f]:{writable:!0,enumerable:!1,configurable:!0,value:null},[b]:{writable:!0,enumerable:!1,configurable:!0,value:Date.now()},[h]:{writable:!0,enumerable:!1,configurable:!0,value:{}},props:{writable:!0,enumerable:!1,configurable:!0,value:r},children:{writable:!0,enumerable:!1,configurable:!0,value:t.children||[]},context:{writable:!0,enumerable:!1,configurable:!0,value:t.context||Object.create(null)},state:{enumerable:!1,configurable:!0,get:()=>n,set:e=>{if(!isValidStateObject(e))throw new TypeError(`Invalid value for "this.state": "${e}". Provided "state" must be an iterable object.`);Object.assign(n,e)}}})}isJib(e){return isJibish(e)}onPropUpdated(e,t,r){}onStateUpdated(e,t,r){}captureReference(e,t){let r=this[h][e];return r||(r=r=>{let n=r;"function"==typeof t&&(n=t.call(this,n)),Object.defineProperties(this,{[e]:{writable:!0,enumerable:!1,configurable:!0,value:n}})},"function"!=typeof t&&(this[h]=r),r)}forceUpdate(){this[l]()}getState(e,t){let r=this.state;if(0===arguments.length)return r;if(instanceOf(e,"object")){let t=Object.keys(e).concat(Object.getOwnPropertySymbols(e)),n={};for(let o=0,i=t.length;o<i;o++){let i=t[o],[s,a]=fetchDeepProperty(r,i,e[i],!0);null!=a&&(n[a]=s)}return n}return fetchDeepProperty(r,e,t)}setState(e){if(!isValidStateObject(e))throw new TypeError(`Invalid value for "this.setState": "${e}". Provided "state" must be an iterable object.`);Object.assign(this.state,e)}setStatePassive(e){if(!isValidStateObject(e))throw new TypeError(`Invalid value for "this.setStatePassive": "${e}". Provided "state" must be an iterable object.`);try{this[p]=!0,Object.assign(this.state,e)}finally{this[p]=!1}}shouldUpdate(){return!0}destroy(){}render(e){return e}updated(){}combineWith(e,...t){let r=new Set;for(let n=0,o=t.length;n<o;n++){let o=t[n];if(o)if(instanceOf(o,"string")){let t=o.split(e).filter(isNotEmpty);for(let e=0,n=t.length;e<n;e++){let n=t[e];r.add(n)}}else if(Array.isArray(o)){let e=o.filter((e=>!!e&&!!instanceOf(e,"string")&&isNotEmpty(e)));for(let t=0,n=e.length;t<n;t++){let n=e[t];r.add(n)}}else if(instanceOf(o,"object")){let e=Object.keys(o);for(let t=0,n=e.length;t<n;t++){let n=e[t];o[n]?r.add(n):r.delete(n)}}}return Array.from(r).join(e||"")}combine(...e){return this.combineWith(" ",...e)}}const m=Symbol.for("@jibs/node/contextID");class RootNode{static CONTEXT_ID=m;constructor(e,t,r){let n=e.createContext(r,this.onContextUpdate?this.onContextUpdate.bind(this):void 0);Object.defineProperties(this,{renderer:{writable:!0,enumerable:!1,configurable:!0,value:e},parent:{writable:!0,enumerable:!1,configurable:!0,value:t},context:{enumerable:!1,configurable:!0,get:()=>n,set:()=>{}},currentChildIndex:{writable:!0,enumerable:!1,configurable:!0,value:0},_renderPromise:{writable:!0,enumerable:!1,configurable:!0,value:null}})}destroy(){this.context=null}isValidChild(e){return null!=e&&"boolean"!=typeof e&&!Object.is(e,1/0)&&!Object.is(e,NaN)}isIterableChild(e){return null!=e&&!Object.is(e,NaN)&&!Object.is(e,1/0)&&(Array.isArray(e)||"object"==typeof e&&!instanceOf(e,"boolean","number","string"))}propsDiffer(e,t,r){return propsDiffer(e,t,r)}childrenDiffer(e,t){return childrenDiffer(e,t)}render(e,t){return this._renderPromise||(this._renderPromise=this._render(e,t).then((e=>(this._renderPromise=null,e))).catch((e=>{throw this._renderPromise=null,e}))),this._renderPromise}}let y=0n;var v=__nested_webpack_require_9838__(515);const w={JIB_BARREN:n,JIB_PROXY:o,JIB:i,Jib,isJibish,constructJib:function constructJib(e){if("function"==typeof e){if(e[n])return e()();if(e[i])return e()}throw new TypeError("constructJib: Provided value is not a Jib.")}},g={UPDATE_EVENT:c,QUEUE_UPDATE_METHOD:l,FLUSH_UPDATE_METHOD:u,INIT_METHOD:_,SKIP_STATE_UPDATES:p,PENDING_STATE_UPDATE:f,LAST_RENDER_TIME:b,PREVIOUS_STATE:d},x={CONTEXT_ID:RootNode.CONTEXT_ID,RootNode,Renderer:class Renderer extends a{static RootNode=RootNode;constructor(){super(),this.setMaxListeners(1/0),Object.defineProperties(this,{context:{writable:!0,enumerable:!1,configurable:!0,value:this.createContext()},currentChildIndex:{writable:!0,enumerable:!1,configurable:!0,value:0}})}createContext(e,t){let r=Object.create(null),n=e?e[m]:1n;return new Proxy(r,{get:(t,r)=>{if(r===m){let t=e?e[m]:1n;return t>n?t:n}return Object.prototype.hasOwnProperty.call(t,r)?t[r]:e?e[r]:void 0},set:(e,r,o)=>(r===m||e[r]===o||(n=++y,e[r]=o,"function"==typeof t&&t()),!0)})}}}})();var __webpack_exports__$=__webpack_exports__.$,__webpack_exports__Component=__webpack_exports__.wA,__webpack_exports__Components=__webpack_exports__.z8,__webpack_exports__Jibs=__webpack_exports__.El,__webpack_exports__Renderers=__webpack_exports__.pv,__webpack_exports__Utils=__webpack_exports__.cQ,__webpack_exports__factory=__webpack_exports__.d5,__webpack_exports__load=__webpack_exports__.zD}},__webpack_module_cache__={};function __webpack_require__(e){var t=__webpack_module_cache__[e];if(void 0!==t)return t.exports;var r=__webpack_module_cache__[e]={exports:{}};return __webpack_modules__[e].call(r.exports,r,r.exports,__webpack_require__),r.exports}__webpack_require__.d=(e,t)=>{for(var r in t)__webpack_require__.o(t,r)&&!__webpack_require__.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},__webpack_require__.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),__webpack_require__.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t);var __webpack_exports__={};(()=>{__webpack_require__.d(__webpack_exports__,{$:()=>e.$,wA:()=>e.wA,z8:()=>e.z8,q$:()=>DOMRenderer,El:()=>e.El,pv:()=>e.pv,cQ:()=>e.cQ,d5:()=>e.d5,zD:()=>e.zD});var e=__webpack_require__(810),t=__webpack_require__(711);const{isJibish:r,constructJib:n,JIB_PROXY:o}=e.El,{RootNode:i}=e.pv,s=Symbol.for("@jib/textNode"),a=Symbol.for("@jib/fragmentNode");class FragmentNode extends i{constructor(...e){super(...e),Object.defineProperties(this,{_nodeCache:{writable:!0,enumerable:!1,configurable:!0,value:new Map}})}async destroy(){if(!this._nodeCache)return;let e=[];for(let t of this._nodeCache.values())e.push(t.destroy());return await Promise.all(e),this._nodeCache.clear(),this._nodeCache=null,await super.destroy()}async _render(i,c){let l,u=new Map,_=new Map;this.isIterableChild(i)?l=i:(r(i)||this.isValidChild(i))&&(l=[i]),e.cQ.instanceOf(l,"promise")&&(l=await l);const getIndexForType=e=>{let t=(u.get(e)||0)+1;return u.set(e,t),t};await e.cQ.iterateAsync(l,(async({value:e,key:i,index:u})=>{let p,f=await e;if(r(f)){let e,r=await n(f),{Type:s,props:a}=r;a||(a={}),e=u!==i?i:null==a.key||Object.is(a.key,NaN)||Object.is(a.key,1/0)?`@jib/internal_key_${getIndexForType(s)}`:a.key,p=t(s,e);let l=this._nodeCache.get(p);return l||(l=this.renderer.constructNodeFromJib(r,this.parent,this.context)),_.set(p,l),s===o?await l.render(r.children,c):await l.render(r,c)}if(this.isIterableChild(f)){p=t(`@jib/internal_fragment_${getIndexForType(a)}`);let e=this._nodeCache.get(p);return e||(e=this.renderer.constructNodeFromJib(o,this.parent,this.context)),_.set(p,e),await e.render(l,c)}if(this.isValidChild(f)){f="function"==typeof f.valueOf?f.valueOf():f,p=t(`@jib/internal_text_${getIndexForType(s)}`);let e=this._nodeCache.get(p);return e||(e=new this.renderer.constructor.TextNode(this.renderer,this.parent,this.context)),_.set(p,e),await e.render(f,c)}}));let p=[];for(let[e,t]of this._nodeCache){(_?_.get(e):null)||p.push(t.destroy())}return await Promise.all(p),this._nodeCache=_,_}}const{RootNode:c}=e.pv;class TextNode extends c{constructor(...e){super(...e),Object.defineProperties(this,{nativeElement:{writable:!0,enumerable:!1,configurable:!0,value:null}})}async destroy(){return this.nativeElement&&(await this.renderer.destroyTextElement(this.nativeElement)&&this.renderer.emit("updated",{action:"deleted",type:"text",target:this.nativeElement}),this.nativeElement=null),await super.destroy()}getNativeElement(){return this.nativeElement}async _render(e,t){let r=this.parent&&await this.parent.getNativeElement();if(!r)return;let n=this.nativeElement;if(n){t.index++;let r=await this.renderer.updateTextElement(n,e);r&&this.renderer.emit("updated",{action:"updated",type:"text",target:n,text:r})}else{n=this.nativeElement=await this.renderer.createTextElement(e);let o=r.childNodes;o.length>t.index?await r.replaceChild(n,o[t.index]):await r.appendChild(n),t.index++,this.renderer.emit("updated",{action:"created",type:"text",target:n})}}}const{JIB_PROXY:l}=e.El,{RootNode:u}=e.pv;class NativeNode extends u{constructor(...e){super(...e),Object.defineProperties(this,{nativeElement:{writable:!0,enumerable:!1,configurable:!0,value:null},rootNode:{writable:!0,enumerable:!1,configurable:!0,value:null},_currentJib:{writable:!0,enumerable:!1,configurable:!0,value:null}})}async destroy(){this.rootNode&&(await this.rootNode.destroy(),this.rootNode=null);let e=this.nativeElement;return e&&(await this.renderer.destroyNativeElement(e)&&(this._currentJib&&"function"==typeof this._currentJib.props.ref&&this._currentJib.props.ref.call(e,null,e),this.renderer.emit("updated",{action:"deleted",type:"element",target:e})),this.nativeElement=null),await super.destroy()}getNativeElement(){return this.nativeElement}async _render(t,r){let{Type:n,props:o,children:i}=this._currentJib=t;if(!n)return;let s=this.parent&&await this.parent.getNativeElement();if(!s)return;let a=await this.getNativeElement();if(a){r.index++;let t=await this.renderer.updateElementAttributes(a,o);e.cQ.sizeOf(t)>0&&this.renderer.emit("updated",{action:"updated",type:"element",target:a,props:t})}else{a=this.nativeElement=await this.renderer.createNativeElement(n),await this.renderer.updateElementAttributes(a,o);let e=s.childNodes;e.length>r.index?await s.replaceChild(a,e[r.index]):await s.appendChild(a),r.index++,o&&"function"==typeof o.ref&&o.ref.call(a,a,null),this.renderer.emit("updated",{action:"created",type:"element",target:a,props:Object.keys(o).reduce(((e,t)=>(e[t]={previous:void 0,current:o[t]},e)),{})})}let c=this.rootNode;c||(c=this.rootNode=this.renderer.constructNodeFromJib(l,this,this.context));let u=Object.create(r);return u.index=0,await c.render(i,u)}}const{JIB_PROXY:_}=e.El,{RootNode:p}=e.pv;class PortalNode extends p{constructor(...e){super(...e),Object.defineProperties(this,{rootNode:{writable:!0,enumerable:!1,configurable:!0,value:null},_currentJib:{writable:!0,enumerable:!1,configurable:!0,value:null}})}async destroy(){return this.rootNode&&(await this.rootNode.destroy(),this.rootNode=null),await super.destroy()}async getNativeElement(){let{Type:e}=this._currentJib||{};if(e)return await this.renderer.findNativeElement(e)}async _render(e,t){this._currentJib=e;let{children:r}=e||{},n=this.rootNode;n||(n=this.rootNode=this.renderer.constructNodeFromJib(_,this,this.context));let o=Object.create(t);return o.index=0,await n.render(r,o)}}const{JIB_PROXY:f}=e.El,{CONTEXT_ID:b,RootNode:d}=e.pv,{INIT_METHOD:h,UPDATE_EVENT:m,PENDING_STATE_UPDATE:y,LAST_RENDER_TIME:v,SKIP_STATE_UPDATES:w}=e.z8;class ComponentNode extends d{constructor(...e){super(...e),Object.defineProperties(this,{rootNode:{writable:!0,enumerable:!1,configurable:!0,value:null},component:{writable:!0,enumerable:!1,configurable:!0,value:null},_cachedRenderResult:{writable:!0,enumerable:!1,configurable:!0,value:null},_cachedRenderContext:{writable:!0,enumerable:!1,configurable:!0,value:null},_previousState:{writable:!0,enumerable:!1,configurable:!0,value:{}},_currentJib:{writable:!0,enumerable:!1,configurable:!0,value:null},_lastContextID:{writable:!0,enumerable:!1,configurable:!0,value:this.context[b]||1n}})}createComponentProps(e){let t=Object.create(e||null);return Object.defineProperties(t,{ref:{writable:!0,enumerable:!1,configurable:!0,value:void 0},key:{writable:!0,enumerable:!1,configurable:!0,value:void 0}}),t}firePropUpdates(e,t){let r=e||{},n=new Set(Object.keys(r).concat(Object.getOwnPropertySymbols(r))),o=t||{},i=Object.keys(o).concat(Object.getOwnPropertySymbols(o));for(let e=0,t=i.length;e<t;e++)n.add(i[e]);for(let e of n){let t=o[e],n=r[e];t!==n&&this.component.onPropUpdated(e,n,t)}}shouldRender(e,t){let r=this.component;if(!r)return!0;if(this._lastContextID<this.context[b]){this._previousState=Object.assign({},r.state);let t=this.createComponentProps(e);return this.firePropUpdates(e,t),r.props=t,!0}if(this.childrenDiffer(r.children,t)){this._previousState=Object.assign({},r.state);let t=this.createComponentProps(e);return this.firePropUpdates(e,t),r.props=t,!0}let n=this._previousState||{};if(this.propsDiffer(r.props,e,["ref","key"])&&r.shouldUpdate(e,n)){this._previousState=Object.assign({},r.state);let t=this.createComponentProps(e);return this.firePropUpdates(e,t),r.props=t,!0}return!(!this.propsDiffer(n,r.state)||!r.shouldUpdate(e,n))&&(this._previousState=Object.assign({},r.state),!0)}async destroy(){return await this._renderPromise,this.component&&(this._currentJib&&"function"==typeof this._currentJib.props.ref&&this._currentJib.props.ref.call(this.component,null,this.component),await this.component.destroy(),this.component=null),this.rootNode&&(await this.rootNode.destroy(),this.rootNode=null),this._cachedRenderResult=null,this._previousState=null,this._currentJib=null,await super.destroy()}onContextUpdate(){return!this.component||this.component[w]||this.component[y]?Promise.resolve():this.render(this._currentJib,this._cachedRenderContext||{index:0})}async _render(e,t){let r,n=!1;e!==this._currentJib&&(this._currentJib=e),this._cachedRenderContext=t;try{if(this.shouldRender(e.props,e.children)){let t=this.component;if(!t){let{Type:r,props:n}=e;t=this.component=new r({...e,props:this.createComponentProps(n),context:this.context}),"function"==typeof t[h]&&t[h](),t.on(m,(()=>{this.render(this._currentJib,this._cachedRenderContext||{index:0})})),n&&"function"==typeof n.ref&&n.ref.call(t,t,null)}this.component[y]&&(this.component[y]=null),r=await this.component.render(e.children),this.component[v]=Date.now(),n=!0}else r=this._cachedRenderResult}catch(e){try{r=this.component?this.component.renderErrorState(e):[`${e.message}\n${e.stack}`]}catch(t){r=[`${e.message}\n${e.stack}`]}n=!0}r!==this._cachedRenderResult&&(this._cachedRenderResult=r);let o=this.rootNode;if(o||(o=this.rootNode=this.renderer.constructNodeFromJib(f,this.parent,this.context)),await o.render(r,t),n&&this.component)try{this.component.updated()}catch(e){console.error('Error in "updated" call: ',e)}}}const{Renderer:g}=e.pv,{JIB_PROXY:x}=e.El;class DOMRenderer extends g{static FragmentNode=FragmentNode;static TextNode=TextNode;static NativeNode=NativeNode;static PortalNode=PortalNode;static ComponentNode=ComponentNode;constructor(e){super(),Object.defineProperties(this,{rootElement:{writable:!1,enumerable:!1,configurable:!1,value:e},rootNode:{writable:!0,enumerable:!1,configurable:!0,value:null}})}getNativeElement(){return this.rootElement}isPortalNode(e){return/[^a-zA-Z0-9:]/.test(e)}constructNodeFromJib(e,t,r){if(e===x)return new this.constructor.FragmentNode(this,t,r);let{Type:n}=e;return"function"==typeof n?new this.constructor.ComponentNode(this,t,r):"string"==typeof n?this.isPortalNode(n)?new this.constructor.PortalNode(this,t,r):new this.constructor.NativeNode(this,t,r):null==n||n===x?new this.constructor.FragmentNode(this,t,r):void 0}async render(e){let t=this.rootNode;return t||(t=this.rootNode=this.constructNodeFromJib(x,this,this.context)),await t.render(e,{index:0})}}})();var __webpack_exports__$=__webpack_exports__.$,__webpack_exports__Component=__webpack_exports__.wA,__webpack_exports__Components=__webpack_exports__.z8,__webpack_exports__DOMRenderer=__webpack_exports__.q$,__webpack_exports__Jibs=__webpack_exports__.El,__webpack_exports__Renderers=__webpack_exports__.pv,__webpack_exports__Utils=__webpack_exports__.cQ,__webpack_exports__factory=__webpack_exports__.d5,__webpack_exports__load=__webpack_exports__.zD;export{__webpack_exports__$ as $,__webpack_exports__Component as Component,__webpack_exports__Components as Components,__webpack_exports__DOMRenderer as DOMRenderer,__webpack_exports__Jibs as Jibs,__webpack_exports__Renderers as Renderers,__webpack_exports__Utils as Utils,__webpack_exports__factory as factory,__webpack_exports__load as load};
//# sourceMappingURL=index.js.map