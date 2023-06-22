var e={d:(t,r)=>{for(var n in r)e.o(r,n)&&!e.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:r[n]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};e.d(t,{$:()=>o,wA:()=>s,z8:()=>a,q$:()=>DOMRenderer,El:()=>l,pv:()=>c,Rh:()=>u,cQ:()=>d,Be:()=>h,d5:()=>f});var r={711:function(e,t,r){const n=("undefined"!=typeof window?window:r.g)||this,i=Symbol.for("@@deadbeefRefMap"),o=Symbol.for("@@deadbeefUniqueID"),s=n[i]?n[i]:new WeakMap,a=[];n[i]||(n[i]=s);let l=0n;function anythingToID(e,t){let r=e;(r instanceof Number||r instanceof String||r instanceof Boolean)&&(r=r.valueOf());let n=typeof r;if("number"===n&&0===r)return Object.is(r,-0)?"number:-0":"number:+0";if("symbol"===n)return`symbol:${r.toString()}`;if(null==r||"number"===n||"boolean"===n||"string"===n||"bigint"===n)return"number"===n?r<0?`number:${r}`:`number:+${r}`:"bigint"===n&&0n===r?"bigint:+0":`${n}:${r}`;let i=a.length>0&&function getHelperForValue(e){for(let t=0,r=a.length;t<r;t++){let{helper:r,generator:n}=a[t];if(r(e))return n}}(r);if(i)return anythingToID(i(r));if(o in r&&"function"==typeof r[o]&&(!t||!t.has(r))){let e=t||new Set;return e.add(r),anythingToID(r[o](),e)}if(!s.has(r)){let e=`${typeof r}:${++l}`;return s.set(r,e),e}return s.get(r)}function deadbeef(){let e=[arguments.length];for(let t=0,r=arguments.length;t<r;t++)e.push(anythingToID(arguments[t]));return e.join(":")}Object.defineProperties(deadbeef,{idSym:{writable:!0,enumerable:!1,configurable:!0,value:o},sorted:{writable:!0,enumerable:!1,configurable:!0,value:function deadbeefSorted(){let e=[arguments.length];for(let t=0,r=arguments.length;t<r;t++)e.push(anythingToID(arguments[t]));return e.sort().join(":")}},generateIDFor:{writable:!0,enumerable:!1,configurable:!0,value:function generateIDFor(e,t){a.push({helper:e,generator:t})}},removeIDGenerator:{writable:!0,enumerable:!1,configurable:!0,value:function removeIDGenerator(e){let t=a.findIndex((t=>t.helper===e));t<0||a.splice(t,1)}}}),e.exports=deadbeef}},n={};function __nested_webpack_require_1712__(e){var t=n[e];if(void 0!==t)return t.exports;var i=n[e]={exports:{}};return r[e].call(i.exports,i,i.exports,__nested_webpack_require_1712__),i.exports}__nested_webpack_require_1712__.d=(e,t)=>{for(var r in t)__nested_webpack_require_1712__.o(t,r)&&!__nested_webpack_require_1712__.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},__nested_webpack_require_1712__.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),__nested_webpack_require_1712__.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),__nested_webpack_require_1712__.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var i={};(()=>{__nested_webpack_require_1712__.d(i,{$:()=>h,wA:()=>Component,z8:()=>D,El:()=>S,pv:()=>x,Rh:()=>Term,cQ:()=>e,Be:()=>t,d5:()=>factory});var e={};__nested_webpack_require_1712__.r(e),__nested_webpack_require_1712__.d(e,{bindMethods:()=>bindMethods,childrenDiffer:()=>childrenDiffer,fetchDeepProperty:()=>fetchDeepProperty,flattenArray:()=>flattenArray,generateUUID:()=>generateUUID,instanceOf:()=>instanceOf,isEmpty:()=>isEmpty,isIterableChild:()=>isIterableChild,isNotEmpty:()=>isNotEmpty,isValidChild:()=>isValidChild,iterate:()=>s,now:()=>now,propsDiffer:()=>propsDiffer,sizeOf:()=>sizeOf});var t=__nested_webpack_require_1712__(711);const r=Symbol.for("@jibsIterateStop"),n="undefined"!=typeof global?global:"undefined"!=typeof window?window:void 0;let o=1e6;function instanceOf(e){function testType(e,t){let r=t,i=typeof e;return r===n.String?r="string":r===n.Number?r="number":r===n.Boolean?r="boolean":r===n.Function?r="function":r===n.Array?r="array":r===n.Object?r="object":r===n.Promise?r="promise":r===n.BigInt?r="bigint":r===n.Map?r="map":r===n.WeakMap?r="weakmap":r===n.Set?r="set":r===n.Symbol?r="symbol":r===n.Buffer&&(r="buffer"),!("buffer"!==r||!n.Buffer||!n.Buffer.isBuffer(e))||("number"===r&&("number"===i||e instanceof Number||e.constructor&&"Number"===e.constructor.name)?!!isFinite(e):"object"!==r&&r===i||("object"===r?!!(e.constructor===Object.prototype.constructor||e.constructor&&"Object"===e.constructor.name)||"object"===i&&!e.constructor:!("array"!==r||!(Array.isArray(e)||e instanceof Array||e.constructor&&"Array"===e.constructor.name))||!("promise"!==r&&"deferred"!==r||!function isDeferredType(e){return!!(e instanceof Promise||e.constructor&&"Promise"===e.constructor.name)||"function"==typeof e.then&&"function"==typeof e.catch}(e))||!("string"!==r||!(e instanceof n.String||e.constructor&&"String"===e.constructor.name))||!("boolean"!==r||!(e instanceof n.Boolean||e.constructor&&"Boolean"===e.constructor.name))||!("map"!==r||!(e instanceof n.Map||e.constructor&&"Map"===e.constructor.name))||!("weakmap"!==r||!(e instanceof n.WeakMap||e.constructor&&"WeakMap"===e.constructor.name))||!("set"!==r||!(e instanceof n.Set||e.constructor&&"Set"===e.constructor.name))||"function"===r&&"function"===i||"function"==typeof r&&e instanceof r||!("string"!=typeof r||!e.constructor||e.constructor.name!==r)))}if(null==e)return!1;for(var t=1,r=arguments.length;t<r;t++)if(!0===testType(e,arguments[t]))return!0;return!1}function propsDiffer(e,t,r){if(e===t)return!1;if(typeof e!=typeof t)return!0;if(!e&&t)return!0;if(e&&!t)return!0;if(!e&&!t&&e!=e)return!0;let n=Object.keys(e).concat(Object.getOwnPropertySymbols(e)),i=Object.keys(t).concat(Object.getOwnPropertySymbols(t));if(n.length!==i.length)return!0;for(let o=0,s=n.length;o<s;o++){let s=n[o];if(r&&r.indexOf(s)>=0)continue;if(e[s]!==t[s])return!0;let a=i[o];if(!(r&&r.indexOf(a)||s===a||e[a]===t[a]))return!0}return!1}function sizeOf(e){return e?Object.is(1/0)?0:"number"==typeof e.length?e.length:Object.keys(e).length:0}function _iterate(e,t){if(!e||Object.is(1/0))return[];let n,i=[],o={collection:e,STOP:r};if(Array.isArray(e)){o.type="Array";for(let s=0,a=e.length;s<a&&(o.value=e[s],o.index=o.key=s,n=t.call(this,o),n!==r);s++)i.push(n)}else if("function"==typeof e.entries)if(e instanceof Set||"Set"===e.constructor.name){o.type="Set";let s=0;for(let a of e.values()){if(o.value=a,o.key=a,o.index=s++,n=t.call(this,o),n===r)break;i.push(n)}}else{o.type=e.constructor.name;let s=0;for(let[a,l]of e.entries()){if(o.value=l,o.key=a,o.index=s++,n=t.call(this,o),n===r)break;i.push(n)}}else{if(instanceOf(e,"boolean","number","bigint","function"))return;o.type=e.constructor?e.constructor.name:"Object";let s=Object.keys(e);for(let a=0,l=s.length;a<l;a++){let l=s[a],c=e[l];if(o.value=c,o.key=l,o.index=a,n=t.call(this,o),n===r)break;i.push(n)}}return i}Object.defineProperties(_iterate,{STOP:{writable:!1,enumerable:!1,configurable:!1,value:r}});const s=_iterate;function childrenDiffer(e,r){return e!==r&&(Array.isArray(e)?t(...e):t(e))!==(Array.isArray(r)?t(...r):t(r))}function fetchDeepProperty(e,t,r,n){if(null==e||Object.is(NaN,e)||Object.is(1/0,e))return n?[r,null]:r;if(null==t||Object.is(NaN,t)||Object.is(1/0,t))return n?[r,null]:r;let i;if(Array.isArray(t))i=t;else if("symbol"==typeof t)i=[t];else{let e=""+t,r=0,n=0;for(i=[];;){let t=e.indexOf(".",r);if(t<0){i.push(e.substring(n));break}"\\"!==e.charAt(t-1)?(i.push(e.substring(n,t)),n=r=t+1):r=t+1}}let o=i[i.length-1];if(0===i.length)return n?[r,o]:r;let s=e;for(let e=0,t=i.length;e<t;e++)if(s=s[i[e]],null==s)return n?[r,o]:r;return n?[s,o]:s}function bindMethods(e,t){let r=e,n=new Set;for(;r;){let e=Object.getOwnPropertyDescriptors(r),i=Object.keys(e).concat(Object.getOwnPropertySymbols(e));for(let e=0,t=i.length;e<t;e++){let t=i[e];if("constructor"===t)continue;if(n.has(t))continue;n.add(t);let o=r[t];Object.prototype.hasOwnProperty(t)&&Object.prototype[t]===o||"function"==typeof o&&(this[t]=o.bind(this))}if(r=Object.getPrototypeOf(r),r===Object.prototype)break;if(t&&t.indexOf(r)>=0)break}}function isEmpty(e){return!(null!=e&&(Object.is(e,1/0)||!Object.is(e,NaN)&&(instanceOf(e,"string")?/\S/.test(e):instanceOf(e,"number")&&isFinite(e)||instanceOf(e,"boolean","bigint","function")||0!==sizeOf(e))))}function isNotEmpty(e){return!isEmpty.call(this,e)}function flattenArray(e){if(!Array.isArray(e))return e;let t=[];for(let r=0,n=e.length;r<n;r++){let n=e[r];Array.isArray(n)?t=t.concat(flattenArray(n)):t.push(n)}return t}function isValidChild(e){return null!=e&&"boolean"!=typeof e&&!Object.is(e,1/0)&&!Object.is(e,NaN)}function isIterableChild(e){return null!=e&&!Object.is(e,NaN)&&!Object.is(e,1/0)&&(Array.isArray(e)||"object"==typeof e&&!instanceOf(e,"boolean","number","string"))}function now(){return"undefined"!=typeof performance&&"function"==typeof performance.now?performance.now():Date.now()}function generateUUID(){return o>9999999&&(o=1e6),`${Date.now()}.${o++}${Math.round(1e7*Math.random()).toString().padStart(20,"0")}`}class Jib{constructor(e,t,r){let n=e&&e.props?e.props:{};Object.defineProperties(this,{Type:{writable:!0,enumerable:!0,configurable:!0,value:e},props:{writable:!0,enumerable:!0,configurable:!0,value:{[d]:0,...n,...t||{}}},children:{writable:!0,enumerable:!0,configurable:!0,value:flattenArray(r)}})}}const a=Symbol.for("@jibs.barren"),l=Symbol.for("@jibs.proxy"),c=Symbol.for("@jibs.rawText"),u=Symbol.for("@jibs.jib"),d=Symbol.for("@jibs.childIndexProp");function factory(e){function $(r,n={}){if(isJibish(r))throw new TypeError("Received a jib but expected a component.");let i=null==r?l:r;function barren(...r){let o=r;function jib(){return instanceOf(i,"promise")||o.some((e=>instanceOf(e,"promise")))?Promise.all([i].concat(o)).then((t=>(i=t[0],o=t.slice(1),new e(i,n,o)))):new e(i,n,o)}return Object.defineProperties(jib,{[u]:{writable:!1,enumerable:!1,configurable:!1,value:!0},[t.idSym]:{writable:!1,enumerable:!1,configurable:!1,value:()=>i}}),jib}return Object.defineProperties(barren,{[a]:{writable:!1,enumerable:!1,configurable:!1,value:!0},[t.idSym]:{writable:!1,enumerable:!1,configurable:!1,value:()=>i}}),barren}return Object.defineProperties($,{remap:{writable:!1,enumerable:!1,configurable:!1,value:(e,t)=>{let r=e;if(null==r||Object.is(r,1/0)||Object.is(r,NaN))return r;isJibish(r)&&(r=constructJib(r));const finalizeMap=e=>{let t=e;return isJibish(t)?(t=constructJib(t),$(t.Type,t.props)(...t.children||[])):t};let n=t(r);return instanceOf(n,"promise")?n.then(finalizeMap):finalizeMap(n)}}}),$}const h=factory(Jib);function isJibish(e){return!("function"!=typeof e||!e[a]&&!e[u])||e instanceof Jib}function constructJib(e){if(e instanceof Jib)return e;if("function"==typeof e){if(e[a])return e()();if(e[u])return e()}throw new TypeError("constructJib: Provided value is not a Jib.")}async function resolveChildren(e){let t=e;instanceOf(t,"promise")&&(t=await t),(this.isIterableChild||isIterableChild).call(this,t)||!isJibish(t)&&!(this.isValidChild||isValidChild).call(this,t)||(t=[t]);let r=s(t,(async({value:e})=>{let t=instanceOf(e,"promise")?await e:e;return isJibish(t)?await constructJib(t):t}));return await Promise.all(r)}const f=Symbol.for("@jibs/events/listeners");class EventEmitter{constructor(){Object.defineProperties(this,{[f]:{writable:!1,enumerable:!1,configurable:!1,value:new Map}})}addListener(e,t){if("function"!=typeof t)throw new TypeError("Event listener must be a method");let r=this[f],n=r.get(e);return n||(n=[],r.set(e,n)),n.push(t),this}removeListener(e,t){if("function"!=typeof t)throw new TypeError("Event listener must be a method");let r=this[f].get(e);if(!r)return this;let n=r.indexOf(t);return n>=0&&r.splice(n,1),this}removeAllListeners(e){let t=this[f];return t.has(e)?(t.set(e,[]),this):this}emit(e,...t){let r=this[f].get(e);if(!r||0===r.length)return!1;for(let e=0,n=r.length;e<n;e++)r[e].apply(this,t);return!0}once(e,t){let func=(...r)=>(this.off(e,func),t(...r));return this.on(e,func)}on(e,t){return this.addListener(e,t)}off(e,t){return this.removeListener(e,t)}eventNames(){return Array.from(this[f].keys())}listenerCount(e){let t=this[f].get(e);return t?t.length:0}listeners(e){let t=this[f].get(e);return t?t.slice():[]}}const p="@jibs/component/event/update",b=Symbol.for("@jibs/component/queueUpdate"),m=Symbol.for("@jibs/component/flushUpdate"),y=Symbol.for("@jibs/component/__init"),g=Symbol.for("@jibs/component/skipStateUpdates"),w=Symbol.for("@jibs/component/pendingStateUpdate"),N=Symbol.for("@jibs/component/lastRenderTime"),O=Symbol.for("@jibs/component/previousState"),v=Symbol.for("@jibs/component/previousState"),T=new WeakMap;function isValidStateObject(e){if(null==e)return!1;if(Object.is(e,NaN))return!1;if(Object.is(e,1/0))return!1;if(e instanceof Boolean||e instanceof Number||e instanceof String)return!1;let t=typeof e;return!("string"===t||"number"===t||"boolean"===t||Array.isArray(e)||"undefined"!=typeof Buffer&&Buffer.isBuffer(e))}class Component extends EventEmitter{static UPDATE_EVENT=p;[b](){this[w]||(this[w]=Promise.resolve(),this[w].then(this[m].bind(this)))}[m](){this[w]&&(this.emit(p),this[w]=null)}[y](){this[g]=!1}constructor(e){super(),bindMethods.call(this,this.constructor.prototype);let t=e||{},r=Object.assign(Object.create(null),t.props||{}),n=(()=>{let e=Object.create(null);return new Proxy(e,{get:(e,t)=>e[t],set:(e,t,r)=>{let n=e[t];return n===r||(this[g]||this[b](),e[t]=r,this.onStateUpdated(t,r,n)),!0}})})();Object.defineProperties(this,{[g]:{writable:!0,enumerable:!1,configurable:!0,value:!0},[w]:{writable:!0,enumerable:!1,configurable:!0,value:Promise.resolve()},[N]:{writable:!0,enumerable:!1,configurable:!0,value:now()},[v]:{writable:!0,enumerable:!1,configurable:!0,value:{}},id:{writable:!1,enumerable:!1,configurable:!1,value:t.id},props:{writable:!0,enumerable:!1,configurable:!0,value:r},children:{writable:!0,enumerable:!1,configurable:!0,value:t.children||[]},context:{writable:!0,enumerable:!1,configurable:!0,value:t.context||Object.create(null)},state:{enumerable:!1,configurable:!0,get:()=>n,set:e=>{if(!isValidStateObject(e))throw new TypeError(`Invalid value for "this.state": "${e}". Provided "state" must be an iterable object.`);Object.assign(n,e)}}})}resolveChildren(e){return resolveChildren.call(this,e)}isJib(e){return isJibish(e)}constructJib(e){return constructJib(e)}pushRender(e){this.emit(p,e)}onPropUpdated(e,t,r){}onStateUpdated(e,t,r){}captureReference(e,t){let r=this[v][e];return r||(r=(r,n)=>{let i=r;"function"==typeof t&&(i=t.call(this,i,n)),Object.defineProperties(this,{[e]:{writable:!0,enumerable:!1,configurable:!0,value:i}})},"function"!=typeof t&&(this[v]=r),r)}forceUpdate(){this[b]()}getState(e,t){let r=this.state;if(0===arguments.length)return r;if(instanceOf(e,"object")){let t=Object.keys(e).concat(Object.getOwnPropertySymbols(e)),n={};for(let i=0,o=t.length;i<o;i++){let o=t[i],[s,a]=fetchDeepProperty(r,o,e[o],!0);null!=a&&(n[a]=s)}return n}return fetchDeepProperty(r,e,t)}setState(e){if(!isValidStateObject(e))throw new TypeError(`Invalid value for "this.setState": "${e}". Provided "state" must be an iterable object.`);Object.assign(this.state,e)}setStatePassive(e){if(!isValidStateObject(e))throw new TypeError(`Invalid value for "this.setStatePassive": "${e}". Provided "state" must be an iterable object.`);try{this[g]=!0,Object.assign(this.state,e)}finally{this[g]=!1}}shouldUpdate(){return!0}destroy(){delete this.state,delete this.props,delete this.context,delete this[v],this.clearAllDebounces()}renderWaiting(){}render(e){return e}updated(){}combineWith(e,...t){let r=new Set;for(let n=0,i=t.length;n<i;n++){let i=t[n];if(i)if(instanceOf(i,"string")){let t=i.split(e).filter(isNotEmpty);for(let e=0,n=t.length;e<n;e++){let n=t[e];r.add(n)}}else if(Array.isArray(i)){let e=i.filter((e=>!!e&&!!instanceOf(e,"string")&&isNotEmpty(e)));for(let t=0,n=e.length;t<n;t++){let n=e[t];r.add(n)}}else if(instanceOf(i,"object")){let e=Object.keys(i);for(let t=0,n=e.length;t<n;t++){let n=e[t];i[n]?r.add(n):r.delete(n)}}}return Array.from(r).join(e||"")}classes(...e){return this.combineWith(" ",...e)}extractChildren(e,t,r){let n=r||{},i={},o=e,s=Array.isArray(o);return i.remainingChildren=t.filter((e=>!(e=>{let t=e.Type;if(instanceOf(t,"string")&&(t=t.toLowerCase()),s)for(let r=0,s=o.length;r<s;r++){let s=o[r];if(instanceOf(s,"string")&&(s=s.toLowerCase()),t===s)return i[s]&&n.multiple?(Array.isArray(i[s])||(i[s]=[i[s]]),i[s].push(e)):i[s]=e,!0}else{let r=Object.keys(o);for(let s=0,a=r.length;s<a;s++){let a,l=r[s],c=o[l];if(a=instanceOf(c,RegExp)?c.test(t):instanceOf(c,"string")?c.toLowerCase()===t:c===t,a)return i[c]&&n.multiple?(Array.isArray(i[c])||(i[c]=[i[c]]),i[c].push(e)):i[c]=e,!0}}return!1})(e))),i}mapChildren(e,t){let r=Array.isArray(t)?t:[t];return r.map((t=>{if(!t)return t;let n=t.Type;if(!instanceOf(n,"string"))return t;n=n.toLowerCase();let i=Object.keys(e);for(let o=0,s=i.length;o<s;o++){let s=i[o];if(s.toLowerCase()!==n)continue;let a=e[s];if(a)return a.call(this,t,o,r)}return t}))}debounce(e,t,r){const clearPendingTimeout=()=>{i&&i.timeout&&(clearTimeout(i.timeout),i.timeout=null)};var n=r||""+e;this.debounceTimers||Object.defineProperty(this,"debounceTimers",{writable:!0,enumerable:!1,configurable:!0,value:{}});var i=this.debounceTimers[n];i||(i=this.debounceTimers[n]={}),i.func=e,clearPendingTimeout();var o=i.promise;if(!o||!o.isPending()){let e,t="pending";(o=i.promise=new Promise((t=>{e=t}))).resolve=()=>{if("pending"===t)if(t="fulfilled",clearPendingTimeout(),this.debounceTimers[n]=null,"function"==typeof i.func){var r=i.func.call(this);r instanceof Promise||r&&"function"==typeof r.then?r.then((t=>e(t))):e(r)}else e()},o.cancel=()=>{t="rejected",clearPendingTimeout(),this.debounceTimers[n]=null,o.resolve()},o.isPending=()=>"pending"===t}return i.timeout=setTimeout(o.resolve,null==t?250:t),o}clearDebounce(e){if(this.debounceTimers){var t=this.debounceTimers[e];null!=t&&(t.timeout&&clearTimeout(t.timeout),t.promise&&t.promise.cancel())}}clearAllDebounces(){let e=this.debounceTimers||{},t=Object.keys(e);for(let e=0,r=t.length;e<r;e++)this.clearDebounce(t[e])}getElementData(e){let t=T.get(e);return t||(t={},T.set(e,t)),t}memoize(e){let r,n;return function(...i){let o=t(...i);if(o!==r){let t=e.apply(this,i);r=o,n=t}return n}}toTerm(e){if(isJibish(e)){let t=constructJib(e);return t.Type===Term||t.Type&&t.Type[P]?e:h(Term,t.props)(...t.children)}return"string"==typeof e?h(Term)(e):e}}const P=Symbol.for("@jibs/isTerm");class Term extends Component{resolveTerm(e){let t=this.context._termResolver;if("function"==typeof t)return t.call(this,e);let r=e.children||[];return r[r.length-1]||""}render(e){let t=this.resolveTerm({children:e,props:this.props});return h("SPAN",this.props)(t)}}Term[P]=!0;const _=Symbol.for("@jibs/node/contextID");class RootNode{static CONTEXT_ID=_;constructor(e,t,r,n){let i=null;!1!==this.constructor.HAS_CONTEXT&&(e||this.createContext)&&(i=(e||this).createContext(r,this.onContextUpdate?this.onContextUpdate:void 0,this)),Object.defineProperties(this,{TYPE:{enumerable:!1,configurable:!1,get:()=>this.constructor.TYPE,set:()=>{}},id:{writable:!1,enumerable:!1,configurable:!1,value:generateUUID()},renderer:{writable:!0,enumerable:!1,configurable:!0,value:e},parentNode:{writable:!0,enumerable:!1,configurable:!0,value:t},childNodes:{writable:!0,enumerable:!1,configurable:!0,value:new Map},context:{enumerable:!1,configurable:!0,get:()=>i,set:()=>{}},destroying:{writable:!0,enumerable:!1,configurable:!0,value:!1},renderPromise:{writable:!0,enumerable:!1,configurable:!0,value:null},renderFrame:{writable:!0,enumerable:!1,configurable:!0,value:0},jib:{writable:!0,enumerable:!1,configurable:!0,value:n},nativeElement:{writable:!0,enumerable:!1,configurable:!0,value:null}})}resolveChildren(e){return resolveChildren.call(this,e)}isJib(e){return isJibish(e)}constructJib(e){return constructJib(e)}getCacheKey(){let{Type:e,props:r}=this.jib||{};return t(e,r.key)}updateJib(e){this.jib=e}clearChildren(){this.childNodes.clear()}removeChild(e){let t=e.getCacheKey();this.childNodes.delete(t)}addChild(e,t){let r=t||e.getCacheKey();this.childNodes.set(r,e)}getChild(e){return this.childNodes.get(e)}getChildren(){return this.childNodes}getThisNodeOrChildNodes(){return this}getChildrenNodes(){let e=[];for(let t of this.childNodes.values())e=e.concat(t.getThisNodeOrChildNodes());return e.filter(Boolean)}async destroy(e){if(!e&&this.destroying)return;this.destroying=!0,this.renderPromise&&await this.renderPromise,await this.destroyFromDOM(this.context,this);let t=[];for(let e of this.childNodes.values())t.push(e.destroy());this.childNodes.clear(),await Promise.all(t),this.nativeElement=null,this.parentNode=null,this.context=null,this.jib=null}isValidChild(e){return isValidChild(e)}isIterableChild(e){return isIterableChild(e)}propsDiffer(e,t,r){return propsDiffer(e,t,r)}childrenDiffer(e,t){return childrenDiffer(e,t)}async render(...e){if(this.destroying)return;this.renderFrame++;let t=this.renderFrame;return"function"==typeof this._render?this.renderPromise=this._render(...e).then((async e=>(t>=this.renderFrame&&await this.syncDOM(this.context,this),this.renderPromise=null,e))).catch((e=>{throw this.renderPromise=null,e})):await this.syncDOM(this.context,this),this.renderPromise}getParentID(){if(this.parentNode)return this.parentNode.id}async destroyFromDOM(e,t){if(this.renderer)return await this.renderer.destroyFromDOM(e,t)}async syncDOM(e,t){if(this.renderer)return await this.renderer.syncDOM(e,t)}}const j=1n;let E=j;const C=Symbol.for("@jibsForceReflow"),S={JIB_BARREN:a,JIB_PROXY:l,JIB_RAW_TEXT:c,JIB:u,JIB_CHILD_INDEX_PROP:d,Jib,isJibish,constructJib,resolveChildren},D={UPDATE_EVENT:p,QUEUE_UPDATE_METHOD:b,FLUSH_UPDATE_METHOD:m,INIT_METHOD:y,SKIP_STATE_UPDATES:g,PENDING_STATE_UPDATE:w,LAST_RENDER_TIME:N,PREVIOUS_STATE:O},x={CONTEXT_ID:RootNode.CONTEXT_ID,FORCE_REFLOW:C,RootNode,Renderer:class Renderer extends RootNode{static RootNode=RootNode;constructor(e){super(null,null,null),Object.defineProperties(this,{options:{writable:!1,enumerable:!1,configurable:!1,value:e||{}}}),this.renderer=this,"function"==typeof e.termResolver&&(this.context._termResolver=e.termResolver)}getOptions(){return this.options}resolveTerm(e){let{termResolver:t}=this.getOptions();if("function"==typeof t)return t.call(this,e);let r=e.children||[];return r[r.length-1]||""}createContext(e,t,r){let n=Object.create(null),i=e?e[_]:j;return new Proxy(n,{get:(t,r)=>{if(r===_){let t=e?e[_]:j;return t>i?t:i}return Object.prototype.hasOwnProperty.call(t,r)?t[r]:e?e[r]:void 0},set:(e,n,o)=>(n===_||e[n]===o||(i=++E,e[n]=o,"function"==typeof t&&t.call(r,r)),!0)})}}}})();var o=i.$,s=i.wA,a=i.z8,l=i.El,c=i.pv,u=i.Rh,d=i.cQ,h=i.Be,f=i.d5;const{isJibish:p,constructJib:b,JIB_PROXY:m,JIB_RAW_TEXT:y,JIB_CHILD_INDEX_PROP:g}=l,{RootNode:w}=c;class FragmentNode extends w{static TYPE=11;getThisNodeOrChildNodes(){return this.getChildrenNodes()}async _render(){let e=new Map,t=this.renderFrame,{children:r}=this.jib||{};if(d.instanceOf(r,"promise")&&(r=await r),this.destroying||t<this.renderFrame)return;this.isIterableChild(r)||!p(r)&&!this.isValidChild(r)||(r=[r]);const getIndexForType=t=>{let r=(e.get(t)||0)+1;return e.set(t,r),r};let n=!1,i=d.iterate(r,(({value:e,key:r,index:i,STOP:o})=>n||this.destroying||t<this.renderFrame?o:(async()=>{let o=d.instanceOf(e,"promise")?await e:e;if(d.isEmpty(o)||Object.is(o,NaN)||Object.is(o,1/0))return;if(this.destroying||t<this.renderFrame)return void(n=!0);let s,a,l=p(o);if(!l&&this.isIterableChild(o)?a={Type:m,children:o,props:{key:`@jib/internal_fragment_${getIndexForType(m)}`}}:!l&&this.isValidChild(o)?(o="function"==typeof o.valueOf?o.valueOf():o,a={Type:y,children:o,props:{key:`@jib/internal_text_${getIndexForType(y)}`}}):l&&(a=b(o),d.instanceOf(a,"promise")&&(a=await a)),this.destroying||t<this.renderFrame)return void(n=!0);let c,{Type:u,props:f}=a;c=i!==r?r:null==f.key||Object.is(f.key,NaN)||Object.is(f.key,1/0)?`@jib/internal_key_${getIndexForType(u)}`:f.key,f[g]=i,f.key=c,a.props=f;let w=h(u,f.key),N=this.getChild(w);return N?(s=!1,N.updateJib(a)):(s=!0,N=this.renderer.constructNodeFromJib(a,this,this.context)),await N.render(),{node:N,cacheKey:w,created:s}})())),o=await Promise.all(i);o=o.filter((e=>!!e));let s=[];if(this.destroying||t<this.renderFrame){for(let e=0,t=o.length;e<t;e++){let t=o[e],{node:r,created:n}=t;n&&r&&s.push(r.destroy())}return void(s.length>0&&await Promise.all(s))}let a=new Map;for(let e of o){let{cacheKey:t,node:r}=e;a.set(t,r)}let l=[];for(let[e,t]of this.getChildren()){a.has(e)||(l.push(t),this.removeChild(t))}this.clearChildren();for(let[e,t]of a)this.addChild(t,e);a.clear();for(let e=0,t=l.length;e<t;e++){let t=l[e];s.push(t.destroy())}s.length>0&&await Promise.all(s)}async destroyFromDOM(e,t){if(t!==this&&this.parentNode)return await this.parentNode.destroyFromDOM(e,t)}async syncDOM(e,t){if(!this.parentNode)return;let r=e,n=t;return n===this&&(r=this.parentNode.context,n=this.parentNode),await this.parentNode.syncDOM(r,n)}}const{RootNode:N}=c;class TextNode extends N{static TYPE=3;static HAS_CONTEXT=!1}const{JIB_PROXY:O}=l,{RootNode:v}=c;class NativeNode extends v{static TYPE=1;constructor(...e){super(...e),Object.defineProperties(this,{fragmentNode:{writable:!0,enumerable:!1,configurable:!0,value:null}})}async destroy(){if(!this.destroying)return this.destroying=!0,await this.destroyFragmentNode(),await super.destroy(!0)}async destroyFragmentNode(){this.fragmentNode&&(this.removeChild(this.fragmentNode),await this.fragmentNode.destroy(),this.fragmentNode=null)}async _render(){if(this.destroying)return;let{Type:e,props:t,children:r}=this.jib||{};if(e)if(Object.prototype.hasOwnProperty.call(t,"innerHTML"))await this.destroyFragmentNode();else{let e={Type:O,props:{},children:r},t=this.fragmentNode;t?this.fragmentNode.updateJib(e):(t=this.fragmentNode=this.renderer.constructNodeFromJib(e,this,this.context),this.addChild(t)),await t.render()}}}class PortalNode extends NativeNode{static TYPE=15}const{JIB_PROXY:T,JIB_CHILD_INDEX_PROP:P}=l,{CONTEXT_ID:_,RootNode:j}=c,{INIT_METHOD:E,UPDATE_EVENT:C,PENDING_STATE_UPDATE:S,LAST_RENDER_TIME:D,SKIP_STATE_UPDATES:x}=a;class ComponentNode extends j{static TYPE=20;constructor(...e){super(...e),Object.defineProperties(this,{fragmentNode:{writable:!0,enumerable:!1,configurable:!0,value:null},component:{writable:!0,enumerable:!1,configurable:!0,value:null},pendingContextUpdate:{writable:!0,enumerable:!1,configurable:!0,value:null},previousState:{writable:!0,enumerable:!1,configurable:!0,value:{}},lastContextID:{writable:!0,enumerable:!1,configurable:!0,value:this.context[_]||1n},cachedRenderResult:{writable:!0,enumerable:!1,configurable:!0,value:null}})}getThisNodeOrChildNodes(){if(this.fragmentNode)return this.fragmentNode.getChildrenNodes()}mergeComponentProps(e,t){return Object.assign(Object.create(null),e||{},t)}firePropUpdates(e,t){let r=t||{},n=new Set(Object.keys(r).concat(Object.getOwnPropertySymbols(r))),i=e||{},o=Object.keys(i).concat(Object.getOwnPropertySymbols(i));for(let e=0,t=o.length;e<t;e++)n.add(o[e]);for(let e of n){let t=i[e],n=r[e];t!==n&&this.component.onPropUpdated(e,n,t)}}shouldRender(e,t){let r=this.component;if(!r)return!0;if(this.lastContextID<this.context[_])return this.lastContextID=this.context[_],this.previousState=Object.assign({},r.state),this.firePropUpdates(r.props,e),r.props=this.mergeComponentProps(r.props,e),!0;if(this.childrenDiffer(r.children,t))return this.component.children=t.slice(),this.previousState=Object.assign({},r.state),this.firePropUpdates(r.props,e),r.props=this.mergeComponentProps(r.props,e),!0;let n=this.previousState||{};return this.propsDiffer(r.props,e,["ref","key",P],!0)&&r.shouldUpdate(e,n)?(this.previousState=Object.assign({},r.state),this.firePropUpdates(r.props,e),r.props=this.mergeComponentProps(r.props,e),!0):!(!this.propsDiffer(n,r.state)||!r.shouldUpdate(e,n))&&(this.previousState=Object.assign({},r.state),!0)}async destroy(){if(!this.destroying)return this.destroying=!0,this.component&&(this.jib&&this.jib.props&&"function"==typeof this.jib.props.ref&&this.jib.props.ref.call(this.component,null,this.component),await this.component.destroy(),this.component=null),this.fragmentNode&&(this.removeChild(this.fragmentNode),await this.fragmentNode.destroy(),this.fragmentNode=null),this.cachedRenderResult=null,this.previousState=null,await super.destroy(!0)}onContextUpdate(){if(this.component&&!this.component[S])return this.pendingContextUpdate||(this.pendingContextUpdate=Promise.resolve().then((()=>{this.destroying||!this.component||this.component[S]||(this.pendingContextUpdate=null,this.render())}))),this.pendingContextUpdate}async _render(e){let t=this.renderFrame,{Type:r,props:n,children:i}=this.jib||{};if(!r)return;i=this.jib.children=await this.resolveChildren(i);const finalizeRender=async(e,t)=>{if(this.destroying||t<this.renderFrame||!this.component)return;this.cachedRenderResult=e,this.component[D]=d.now();let r=this.fragmentNode,n={Type:T,props:{},children:e};r?r.updateJib(n):(r=this.fragmentNode=this.renderer.constructNodeFromJib(n,this,this.context),this.addChild(r)),await r.render()},handleRenderError=e=>{if(this.destroying||t<this.renderFrame)return;let r;console.error(e),this.component&&(this.component[D]=d.now());try{r=this.component&&"function"==typeof this.component.renderErrorState?this.component.renderErrorState(e):[`${e.message}\n${e.stack}`]}catch(t){r=[`${e.message}\n${e.stack}`]}return finalizeRender(r,t)};if(!(this.destroying||t<this.renderFrame))try{if(!0!==e&&this.component&&!this.shouldRender(n,i))return;let o=this.component;o||(o=this.component=new r({...this.jib||{},props:this.mergeComponentProps(null,n),context:this.context,id:this.id}),"function"==typeof o[E]&&o[E](),o.on(C,(e=>{e?(this.renderFrame++,finalizeRender(e,this.renderFrame)):this.render(!0)})),n&&"function"==typeof n.ref&&n.ref.call(o,o,null)),this.component[S]&&(this.component[S]=null);let s=this.component.render(i);if(d.instanceOf(s,"promise")){let e=this.component.renderWaiting(this.cachedRenderResult),r=!1,n=setTimeout((async()=>{n=null,d.instanceOf(e,"promise")&&(e=await e),r||await finalizeRender(e,t)}),5);try{s=await s,r=!0,n&&(clearTimeout(n),n=null),await finalizeRender(s,t)}catch(e){await handleRenderError(e)}}else await finalizeRender(s,t)}catch(e){await handleRenderError(e)}}async destroyFromDOM(e,t){if(!this.parentNode)return;let r=e,n=t;return n===this&&(r=this.parentNode.context,n=this.parentNode),await this.parentNode.destroyFromDOM(r,n)}async syncDOM(e,t){if(!this.parentNode)return;let r=e,n=t;return n===this&&(r=this.parentNode.context,n=this.parentNode),await this.parentNode.syncDOM(r,n)}}const{Renderer:A}=c,{JIB_PROXY:I,JIB_RAW_TEXT:R}=l;class DOMRenderer extends A{static TYPE=9;static FragmentNode=FragmentNode;static TextNode=TextNode;static NativeNode=NativeNode;static PortalNode=PortalNode;static ComponentNode=ComponentNode;constructor(e,t){super(t),Object.defineProperties(this,{rootNode:{writable:!0,enumerable:!1,configurable:!0,value:null},jib:{writable:!0,enumerable:!1,configurable:!0,value:{Type:e,props:{},children:[]}}})}isPortalNode(e){return/[^a-zA-Z0-9:]/.test(e)}constructNodeFromJib(e,t,r){let{Type:n}=e;return"function"==typeof n?new this.constructor.ComponentNode(this,t,r,e):"string"==typeof n?this.isPortalNode(n)?new this.constructor.PortalNode(this,t,r,e):new this.constructor.NativeNode(this,t,r,e):null==n||n===I?new this.constructor.FragmentNode(this,t,r,e):n===R?new this.constructor.TextNode(this,t,r,e):void 0}async destroy(){if(!this.destroying)return this.destroying=!0,this.rootNode&&(await this.rootNode.destroy(),this.rootNode=null),await super.destroy(!0)}async render(e){if(!e)throw new TypeError(`${this.constructor.name}::render: A jib must be provided.`);return this.updateJib({...this.jib,children:e}),super.render()}async _render(){if(this.destroying)return;let e=this.renderFrame,t=this.rootNode,r={Type:I,props:{},children:this.jib};t?t.updateJib(r):t=this.rootNode=this.constructNodeFromJib(this.jib,this,this.context),await t.render(),e>=this.renderFrame&&this.syncDOM(this.context,this.rootNode)}async destroyFromDOM(e,t){return!!t&&(t===this?!!this.rootNode&&await this.destroyNode(e,this.rootNode):await this.destroyNode(e,t))}async syncDOM(e,t){return!!t&&(t===this?!!this.rootNode&&await this.syncNode(e,this.rootNode):await this.syncNode(e,t))}async addNode(e,t){if(!t)return!1;await this.attachChildren(e,t,!1);let r=this.parentNode;return r&&await this.attachChildren(e,r,true),!0}async constructNativeElementFromNode(e,t){if(!t)return!1;if(t.TYPE===NativeNode.TYPE)return await this.createNativeElement(e,t);if(t.TYPE===TextNode.TYPE)return await this.createTextElement(e,t);if(t.TYPE===PortalNode.TYPE||t.TYPE===DOMRenderer.TYPE)return await this.createPortalElement(e,t);throw new TypeError(`${this.constructor.name}::constructNativeElementFromNode: Unsupported virtual element type detected: ${t.TYPE}`)}async updateNode(e,t){if(!t)return!1;let r;if(t.TYPE===NativeNode.TYPE)r=await this.updateNativeElement(e,t);else if(t.TYPE===TextNode.TYPE)r=await this.updateTextElement(e,t);else{if(t.TYPE!==PortalNode.TYPE&&t.TYPE!==DOMRenderer.TYPE)throw new TypeError(`${this.constructor.name}::syncNode: Unsupported virtual element type detected: ${t.TYPE}`);r=await this.updatePortalElement(e,t)}return await this.attachChildren(e,t,!0),r}async syncNode(e,t){if(!t)return!1;let r=t&&t.nativeElement;return r?t?await this.updateNode(e,t):void 0:(r=await this.constructNativeElementFromNode(e,t),t.nativeElement=r,t.jib&&t.jib.props&&"function"==typeof t.jib.props.ref&&t.jib.props.ref.call(t,r,null),await this.addNode(e,t))}async destroyNode(e,t){if(!t)return!1;let r=!1;return t&&t.nativeElement&&(t.TYPE===NativeNode.TYPE?r=await this.destroyNativeElement(e,t):t.TYPE===TextNode.TYPE?r=await this.destroyTextElement(e,t):t.TYPE===PortalNode.TYPE||t.TYPE===DOMRenderer.TYPE?r=await this.destroyPortalElement(e,t):new TypeError(`${this.constructor.name}::syncNode: Unsupported virtual element type detected: ${t.TYPE}`)),t&&await this.detachChildren(e,t),r}findNativeElement(e,t){}createNativeElement(e,t){return{type:"element",value:t.value}}updateNativeElement(e,t){}createTextElement(e,t){return{type:"text",value:t.value}}updateTextElement(e,t){return!1}createPortalElement(e,t){return{type:"portal",value:t.value}}updatePortalElement(e,t){return!1}destroyNativeElement(e,t){}destroyTextElement(e,t){}destroyPortalElement(e,t){}forceNativeElementReflow(e,t,r){}async attachChildren(e,t,r){let n=t&&t.nativeElement;if(!n)return!1;let i=Array.from(n.childNodes),o=0,s=!0;for(let a of t.getChildrenNodes()){let t=a.nativeElement;if(t){if(!0!==r&&await this.updateNode(e,a),s){if(i[o++]===t)continue;s=!1}await n.appendChild(t),this.forceNativeElementReflow(e,a,t)}}return!0}async detachChildren(e,t){if(!(t&&t.nativeElement))return!1;let r=[];for(let n of t.getChildrenNodes())r.push(this.destroyNode(e,n));return await Promise.all(r),!0}}var J=t.$,k=t.wA,F=t.z8,M=t.q$,U=t.El,Y=t.pv,B=t.Rh,L=t.cQ,V=t.Be,X=t.d5;export{J as $,k as Component,F as Components,M as DOMRenderer,U as Jibs,Y as Renderers,B as Term,L as Utils,V as deadbeef,X as factory};
//# sourceMappingURL=index.js.map