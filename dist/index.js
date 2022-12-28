/******/ var __webpack_modules__ = ({

/***/ "./lib/component-node.js":
/*!*******************************!*\
  !*** ./lib/component-node.js ***!
  \*******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ComponentNode": () => (/* binding */ ComponentNode)
/* harmony export */ });
/* harmony import */ var jibs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jibs */ "../jibs/dist/index.js");


const {
  JIB_PROXY,
  resolveChildren,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Jibs;

const {
  CONTEXT_ID,
  RootNode,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

const {
  INIT_METHOD,
  UPDATE_EVENT,
  PENDING_STATE_UPDATE,
  LAST_RENDER_TIME,
  SKIP_STATE_UPDATES,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Components;

class ComponentNode extends RootNode {
  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'rootNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      'component': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_pendingContextUpdate': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_cachedRenderResult': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_cachedRenderContext': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_cachedWaitingRenderResult': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_previousState': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        {},
      },
      '_currentJib': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_lastContextID': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        this.context[CONTEXT_ID] || 1n,
      },
    });
  }

  mergeComponentProps(oldProps, newProps) {
    let props = Object.assign(Object.create(null), oldProps || {}, newProps);
    return props;
  }

  firePropUpdates(_oldProps, _newProps) {
    let newProps    = _newProps || {};
    let allPropKeys = new Set(Object.keys(newProps).concat(Object.getOwnPropertySymbols(newProps)));

    let oldProps    = _oldProps || {};
    let oldPropKeys = Object.keys(oldProps).concat(Object.getOwnPropertySymbols(oldProps));
    for (let i = 0, il = oldPropKeys.length; i < il; i++)
      allPropKeys.add(oldPropKeys[i]);

    for (let key of allPropKeys) {
      let oldValue  = oldProps[key];
      let newValue  = newProps[key];

      if (oldValue !== newValue)
        this.component.onPropUpdated(key, newValue, oldValue);
    }
  }

  shouldRender(newProps, newChildren) {
    let component = this.component;
    if (!component)
      return true;

    if (this._lastContextID < this.context[CONTEXT_ID]) {
      this._lastContextID = this.context[CONTEXT_ID];
      this._previousState = Object.assign({}, component.state);

      this.firePropUpdates(component.props, newProps);
      component.props = this.mergeComponentProps(component.props, newProps);

      return true;
    }

    if (this.childrenDiffer(component.children, newChildren)) {
      this._previousState = Object.assign({}, component.state);

      this.firePropUpdates(component.props, newProps);
      component.props = this.mergeComponentProps(component.props, newProps);

      return true;
    }

    let previousState = this._previousState || {};
    let propsDiffer   = this.propsDiffer(component.props, newProps, [ 'ref', 'key' ], true);
    if (propsDiffer && component.shouldUpdate(newProps, previousState)) {
      this._previousState = Object.assign({}, component.state);

      this.firePropUpdates(component.props, newProps);
      component.props = this.mergeComponentProps(component.props, newProps);

      return true;
    }

    let stateDiffers = this.propsDiffer(previousState, component.state);
    if (stateDiffers && component.shouldUpdate(newProps, previousState)) {
      this._previousState = Object.assign({}, component.state);
      return true;
    }

    return false;
  }

  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    await this.renderPromise;

    if (this.component) {
      if (this._currentJib && typeof this._currentJib.props.ref === 'function')
        this._currentJib.props.ref.call(this.component, null, this.component);

      await this.component.destroy();
      this.component = null;
    }

    if (this.rootNode) {
      await this.rootNode.destroy();
      this.rootNode = null;
    }

    this._cachedRenderResult = null;
    this._previousState = null;
    this._currentJib = null;

    return await super.destroy();
  }

  onContextUpdate() {
    if (!this.component || this.component[SKIP_STATE_UPDATES] || this.component[PENDING_STATE_UPDATE])
      return Promise.resolve();

    return Promise.resolve().then(async () => {
      await this.render(this._currentJib, this._cachedRenderContext || { index: 0 });
    });
  }

  resolveChildren(children) {
    return resolveChildren.call(this, children);
  }

  async syncElementsWithRenderer(node, renderResult, renderFrame) {
    if (!this.parent)
      return;

    let result = await this.parent.syncElementsWithRenderer(node, renderResult, renderFrame);
    if (this.component)
      this.component.updated();

    return result;
  }

  // eslint-disable-next-line no-unused-vars
  async _render(jib, renderContext) {
    if (jib !== this._currentJib)
      this._currentJib = jib;

    this._cachedRenderContext = renderContext;

    if (!jib)
      return;

    let renderFrame = this.renderFrame;

    let { Type: ComponentClass, props, children } = jib;
    jib.children = await this.resolveChildren(children);

    const finalizeRender = async (renderResult, renderFrame) => {
      if (this.destroying || renderFrame < this.renderFrame || !this.component)
        return;

      this.component[LAST_RENDER_TIME] = jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.now();

      let rootNode = this.rootNode;
      if (!rootNode)
        rootNode = this.rootNode = this.renderer.constructNodeFromJib(JIB_PROXY, this, this.context);

      let fragmentResult = this._cachedRenderResult = await rootNode.render(renderResult, renderContext);
      await this.syncElementsWithRenderer(this, fragmentResult, renderFrame);

      return fragmentResult;
    };

    const handleRenderError = (error) => {
      if (this.destroying || renderFrame < this.renderFrame)
        return;

      console.error(error);

      if (this.component)
        this.component[LAST_RENDER_TIME] = jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.now();

      let renderResult;

      try {
        if (this.component && typeof this.component.renderErrorState === 'function')
          renderResult = this.component.renderErrorState(error);
        else
          renderResult = [ `${error.message}\n${error.stack}` ];
      } catch (error2) {
        renderResult = [ `${error.message}\n${error.stack}` ];
      }

      return finalizeRender(renderResult, renderFrame);
    };

    try {
      if (this.component && !this.shouldRender(jib.props, jib.children)) {
        return this._cachedRenderResult;
      } else {
        let component = this.component;
        if (!component) {
          if (this.destroying || renderFrame < this.renderFrame)
            return;

          component = this.component = new ComponentClass({ ...jib, props: this.mergeComponentProps(null, props), context: this.context, id: this.id });
          if (typeof component[INIT_METHOD] === 'function')
            component[INIT_METHOD]();

          component.on(UPDATE_EVENT, async (pushedRenderResult) => {
            if (pushedRenderResult) {
              this.renderFrame++;
              await finalizeRender(pushedRenderResult, this.renderFrame);
            } else {
              await this.render(this._currentJib, this._cachedRenderContext || { index: 0 });
            }
          });

          if (props && typeof props.ref === 'function')
            props.ref.call(component, component, null);
        }

        // Cancel any pending state updates
        if (this.component[PENDING_STATE_UPDATE])
          this.component[PENDING_STATE_UPDATE] = null;

        let renderResult = this.component.render(jib.children);
        if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(renderResult, 'promise')) {
          let waitingRenderResult = this.component.renderWaiting(this._cachedRenderResult);
          let renderCompleted = false;

          let loadingTimer = setTimeout(async () => {
            loadingTimer = null;

            if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(waitingRenderResult, 'promise'))
              waitingRenderResult = await waitingRenderResult;

            if (renderCompleted)
              return;

            await finalizeRender(waitingRenderResult, renderFrame);
          }, 5);

          return await renderResult.then(async (renderResult) => {
            renderCompleted = true;

            if (loadingTimer) {
              clearTimeout(loadingTimer);
              loadingTimer = null;
            }

            return await finalizeRender(renderResult, renderFrame);
          }).catch(handleRenderError);
        } else {
          return await finalizeRender(renderResult, renderFrame);
        }
      }
    } catch (error) {
      return await handleRenderError(error);
    }
  }
}


/***/ }),

/***/ "./lib/dom-renderer.js":
/*!*****************************!*\
  !*** ./lib/dom-renderer.js ***!
  \*****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DOMRenderer": () => (/* binding */ DOMRenderer)
/* harmony export */ });
/* harmony import */ var jibs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jibs */ "../jibs/dist/index.js");
/* harmony import */ var _fragment_node_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./fragment-node.js */ "./lib/fragment-node.js");
/* harmony import */ var _text_node_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./text-node.js */ "./lib/text-node.js");
/* harmony import */ var _native_node_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./native-node.js */ "./lib/native-node.js");
/* harmony import */ var _portal_node_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./portal-node.js */ "./lib/portal-node.js");
/* harmony import */ var _component_node_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./component-node.js */ "./lib/component-node.js");








const { Renderer } = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

const {
  JIB_PROXY,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Jibs;

class DOMRenderer extends Renderer {
  static FragmentNode = _fragment_node_js__WEBPACK_IMPORTED_MODULE_1__.FragmentNode;

  static TextNode = _text_node_js__WEBPACK_IMPORTED_MODULE_2__.TextNode;

  static NativeNode = _native_node_js__WEBPACK_IMPORTED_MODULE_3__.NativeNode;

  static PortalNode = _portal_node_js__WEBPACK_IMPORTED_MODULE_4__.PortalNode;

  static ComponentNode = _component_node_js__WEBPACK_IMPORTED_MODULE_5__.ComponentNode;

  constructor(rootElement) {
    super();

    Object.defineProperties(this, {
      'rootElement': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        rootElement,
      },
      'rootNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  isPortalNode(type) {
    return (/[^a-zA-Z0-9:]/).test(type);
  }

  constructNodeFromJib(jib, parent, context) {
    if (jib === JIB_PROXY)
      return new this.constructor.FragmentNode(this, parent, context);

    let { Type } = jib;
    if (typeof Type === 'function') {
      return new this.constructor.ComponentNode(this, parent, context);
    } else if (typeof Type === 'string') {
      if (this.isPortalNode(Type))
        return new this.constructor.PortalNode(this, parent, context);
      else
        return new this.constructor.NativeNode(this, parent, context);
    } else if (Type == null || Type === JIB_PROXY) {
      return new this.constructor.FragmentNode(this, parent, context);
    }
  }

  async syncElementsWithRenderer(node, renderResult, renderFrame) {
    if (this.destroying || renderFrame < this.renderFrame)
      return;

    await this.updateElementChildren(
      this.context,
      this.rootElement,
      renderResult,
      renderFrame,
    );
  }

  async render(jib) {
    this.renderFrame++;
    let renderFrame = this.renderFrame;

    let rootNode = this.rootNode;
    if (!rootNode)
      rootNode = this.rootNode = this.constructNodeFromJib(JIB_PROXY, this, this.context);

    let renderResult = await rootNode.render(jib, { index: 0 });
    await this.syncElementsWithRenderer(
      this,
      renderResult,
      renderFrame,
    );

    return renderResult;
  }
}


/***/ }),

/***/ "./lib/fragment-node.js":
/*!******************************!*\
  !*** ./lib/fragment-node.js ***!
  \******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FragmentNode": () => (/* binding */ FragmentNode)
/* harmony export */ });
/* harmony import */ var jibs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jibs */ "../jibs/dist/index.js");


const {
  isJibish,
  constructJib,
  JIB_PROXY,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Jibs;

const {
  RootNode,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

const TEXT_TYPE     = Symbol.for('@jib/textNode');
const FRAGMENT_TYPE = Symbol.for('@jib/fragmentNode');

class FragmentNode extends RootNode {
  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      '_nodeCache': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        new Map(),
      },
      '_renderCache': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    if (this._nodeCache) {
      let destroyPromises = [];
      let nodeCache       = this._nodeCache;

      this._nodeCache = null;

      for (let cachedResult of nodeCache.values()) {
        if (cachedResult && cachedResult.node && cachedResult.node.destroy)
          destroyPromises.push(cachedResult.node.destroy());
      }

      nodeCache.clear();

      await Promise.all(destroyPromises);
    }

    return await super.destroy();
  }

  async syncElementsWithRenderer(node, renderResult, renderFrame) {
    if (!this.parent || this.renderPromise || renderFrame < this.renderFrame)
      return;

    if (!this._nodeCache)
      return await this.parent.syncElementsWithRenderer(node, renderResult, renderFrame);

    let renderResults = [];
    for (let [ cacheKey, cachedResult ] of this._nodeCache) {
      if (cachedResult.node === node) {
        this._nodeCache.set(cacheKey, { ...cachedResult, renderResult });
        renderResults.push(renderResult);
      } else {
        renderResults.push(cachedResult.renderResult);
      }
    }

    return await this.parent.syncElementsWithRenderer(node, renderResults, renderFrame);
  }

  async _render(_children, renderContext) {
    let indexMap    = new Map();
    let children    = _children;
    let renderFrame = this.renderFrame;

    if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(children, 'promise'))
      children = await children;

    if (this.destroying || renderFrame < this.renderFrame)
      return this._renderCache;

    if (!this.isIterableChild(children) && (isJibish(children) || this.isValidChild(children)))
      children = [ children ];

    const getIndexForType = (Type) => {
      let index = (indexMap.get(Type) || 0) + 1;
      indexMap.set(Type, index);

      return index;
    };

    let loopStopped = false;
    let promises = jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.iterate(children, ({ value: _child, key, index, STOP }) => {
      if (loopStopped || this.destroying || renderFrame < this.renderFrame)
        return STOP;

      return (async () => {
        let child = (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(_child, 'promise')) ? await _child : _child;
        let created;
        let cacheKey;
        let node;
        let renderResult;

        if (isJibish(child)) {
          let jib = constructJib(child);
          if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(jib, 'promise'))
            jib = await jib;

          if (this.destroying || renderFrame < this.renderFrame) {
            loopStopped = true;
            return;
          }

          let { Type, props } = jib;
          if (!props)
            props = {};

          let localKey;
          if (index !== key) // Index is an integer, and key is a string, meaning this is an object
            localKey = key;
          else
            localKey = (props.key == null || Object.is(props.key, NaN) || Object.is(props.key, Infinity)) ? `@jib/internal_key_${getIndexForType(Type)}` : props.key;

          cacheKey = (0,jibs__WEBPACK_IMPORTED_MODULE_0__.deadbeef)(Type, localKey);

          let cachedResult = this._nodeCache.get(cacheKey);
          if (!cachedResult) {
            created = true;
            node = this.renderer.constructNodeFromJib(jib, this, this.context);
          } else {
            created = false;
            node = cachedResult.node;
          }

          if (Type === JIB_PROXY)
            renderResult = await node.render(jib.children, renderContext);
          else
            renderResult = await node.render(jib, renderContext);
        } else if (this.isIterableChild(child)) {
          if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.isEmpty(child))
            return;

          cacheKey = (0,jibs__WEBPACK_IMPORTED_MODULE_0__.deadbeef)(`@jib/internal_fragment_${getIndexForType(FRAGMENT_TYPE)}`);

          let cachedResult = this._nodeCache.get(cacheKey);
          if (!cachedResult) {
            created = true;
            node = this.renderer.constructNodeFromJib(JIB_PROXY, this, this.context);
          } else {
            created = false;
            node = cachedResult.node;
          }

          renderResult = await node.render(child, renderContext);
        } else if (this.isValidChild(child)) {
          child = (typeof child.valueOf === 'function') ? child.valueOf() : child;
          cacheKey = (0,jibs__WEBPACK_IMPORTED_MODULE_0__.deadbeef)(`@jib/internal_text_${getIndexForType(TEXT_TYPE)}`);

          let cachedResult = this._nodeCache.get(cacheKey);
          if (!cachedResult) {
            created = true;
            node = new this.renderer.constructor.TextNode(this.renderer, this, this.context);
          } else {
            created = false;
            node = cachedResult.node;
          }

          renderResult = await node.render(child, renderContext);
        }

        return { node, cacheKey, renderResult, created };
      })();
    });

    let renderResults = await Promise.all(promises);
    renderResults = renderResults.filter((result) => !!result);

    let destroyPromises = [];
    if (this.destroying || renderFrame < this.renderFrame) {
      for (let i = 0, il = renderResults.length; i < il; i++) {
        let result = renderResults[i];
        let { node, created } = result;

        if (created && node) {
          // Destroy nodes since this render was rejected.
          // But only nodes that were just created...
          // as existing nodes might still need to exist.
          destroyPromises.push(node.destroy());
        }
      }

      if (destroyPromises.length > 0)
        await Promise.all(destroyPromises);

      return this._renderCache;
    }

    let nodeMap = new Map();
    for (let i = 0, il = renderResults.length; i < il; i++) {
      let renderResult = renderResults[i];
      nodeMap.set(renderResult.cacheKey, renderResult);
    }

    if (this._nodeCache) {
      // Cleanup
      for (let [ cacheKey, renderResult ] of this._nodeCache) {
        let hasChild = nodeMap.has(cacheKey);
        if (!hasChild) {
          // This node was destroyed
          destroyPromises.push(renderResult.node.destroy());
        }
      }

      this._nodeCache = nodeMap;

      if (destroyPromises.length > 0)
        await Promise.all(destroyPromises);
    } else {
      this._nodeCache = nodeMap;
    }

    let renderResult = this._renderCache = renderResults.map((renderResult) => renderResult.renderResult).filter((result) => (result != null && !Object.is(result, NaN) && !Object.is(result, Infinity)));
    return renderResult;
  }
}


/***/ }),

/***/ "./lib/native-node.js":
/*!****************************!*\
  !*** ./lib/native-node.js ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NativeNode": () => (/* binding */ NativeNode)
/* harmony export */ });
/* harmony import */ var jibs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jibs */ "../jibs/dist/index.js");


const {
  JIB_PROXY,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Jibs;

const {
  RootNode,
  NativeElement,
  TextElement,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

class NativeNode extends RootNode {
  static ELEMENT_CLASS = NativeElement;

  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'rootNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_currentJib': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_cachedRenderResult': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        { id: this.id },
      },
    });
  }

  async syncElementsWithRenderer(node, renderResult, renderFrame) {
    if (!this.renderer || this.destroying || renderFrame < this.renderFrame)
      return;

    await this.renderer.updateElementChildren(
      this.context,
      this._cachedRenderResult,
      renderResult,
      renderFrame,
    );
  }

  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    if (this.rootNode) {
      await this.rootNode.destroy();
      this.rootNode = null;
    }

    return await super.destroy();
  }

  async _render(jib, renderContext) {
    let {
      Type,
      props,
      children,
    } = this._currentJib = (jib || {});

    if (!Type)
      return;

    let renderFrame = this.renderFrame;

    if (!Object.prototype.hasOwnProperty.call(props, 'innerHTML')) {
      let rootNode = this.rootNode;
      if (!rootNode)
        rootNode = this.rootNode = this.renderer.constructNodeFromJib(JIB_PROXY, this, this.context);

      let newContext = Object.create(renderContext);
      newContext.index = 0;

      rootNode.render(children, newContext).then((fragmentResult) => {
        return this.syncElementsWithRenderer(this, fragmentResult, renderFrame);
      }).catch((_error) => {
        let error = _error;
        if (!(error instanceof Error))
          error = new Error(error);

        return this.syncElementsWithRenderer(this, [ new TextElement(null, error, props) ], renderFrame);
      });
    } else {
      if (this.rootNode) {
        await this.rootNode.destroy();
        this.rootNode = null;
      }
    }

    let renderResult = this._cachedRenderResult = new this.constructor.ELEMENT_CLASS(
      this.id,
      Type,
      props,
    );

    return renderResult;
  }
}


/***/ }),

/***/ "./lib/portal-node.js":
/*!****************************!*\
  !*** ./lib/portal-node.js ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PortalNode": () => (/* binding */ PortalNode)
/* harmony export */ });
/* harmony import */ var jibs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jibs */ "../jibs/dist/index.js");
/* harmony import */ var _native_node_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./native-node.js */ "./lib/native-node.js");




const {
  PortalElement,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

class PortalNode extends _native_node_js__WEBPACK_IMPORTED_MODULE_1__.NativeNode {
  static ELEMENT_CLASS = PortalElement;
}


/***/ }),

/***/ "./lib/text-node.js":
/*!**************************!*\
  !*** ./lib/text-node.js ***!
  \**************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TextNode": () => (/* binding */ TextNode)
/* harmony export */ });
/* harmony import */ var jibs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jibs */ "../jibs/dist/index.js");


const {
  RootNode,
  TextElement,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

class TextNode extends RootNode {
  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    return await super.destroy();
  }

  async _render(text) {
    return new TextElement(this.id, text);
  }
}


/***/ }),

/***/ "../jibs/dist/index.js":
/*!*****************************!*\
  !*** ../jibs/dist/index.js ***!
  \*****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* binding */ __webpack_exports__$),
/* harmony export */   "Component": () => (/* binding */ __webpack_exports__Component),
/* harmony export */   "Components": () => (/* binding */ __webpack_exports__Components),
/* harmony export */   "Jibs": () => (/* binding */ __webpack_exports__Jibs),
/* harmony export */   "Renderers": () => (/* binding */ __webpack_exports__Renderers),
/* harmony export */   "Utils": () => (/* binding */ __webpack_exports__Utils),
/* harmony export */   "deadbeef": () => (/* binding */ __webpack_exports__deadbeef),
/* harmony export */   "factory": () => (/* binding */ __webpack_exports__factory)
/* harmony export */ });
/******/ var __webpack_modules__ = ({

/***/ "./node_modules/deadbeef/lib/index.js":
/*!********************************************!*\
  !*** ./node_modules/deadbeef/lib/index.js ***!
  \********************************************/
/***/ (function(module, __unused_webpack_exports, __nested_webpack_require_284__) {

// Copyright 2022 Wyatt Greenway



const thisGlobal = ((typeof window !== 'undefined') ? window : __nested_webpack_require_284__.g) || this;
const DEADBEEF_REF_MAP_KEY = Symbol.for('@@deadbeefRefMap');
const UNIQUE_ID_SYMBOL = Symbol.for('@@deadbeefUniqueID');
const refMap = (thisGlobal[DEADBEEF_REF_MAP_KEY]) ? thisGlobal[DEADBEEF_REF_MAP_KEY] : new WeakMap();
const idHelpers = [];

if (!thisGlobal[DEADBEEF_REF_MAP_KEY])
  thisGlobal[DEADBEEF_REF_MAP_KEY] = refMap;

let uuidCounter = 0n;

function getHelperForValue(value) {
  for (let i = 0, il = idHelpers.length; i < il; i++) {
    let { helper, generator } = idHelpers[i];
    if (helper(value))
      return generator;
  }
}

function anythingToID(_arg, _alreadyVisited) {
  let arg = _arg;
  if (arg instanceof Number || arg instanceof String || arg instanceof Boolean)
    arg = arg.valueOf();

  let typeOf = typeof arg;

  if (typeOf === 'number' && arg === 0) {
    if (Object.is(arg, -0))
      return 'number:-0';

    return 'number:+0';
  }

  if (typeOf === 'symbol')
    return `symbol:${arg.toString()}`;

  if (arg == null || typeOf === 'number' || typeOf === 'boolean' || typeOf === 'string' || typeOf === 'bigint') {
    if (typeOf === 'number')
      return (arg < 0) ? `number:${arg}` : `number:+${arg}`;

    if (typeOf === 'bigint' && arg === 0n)
      return 'bigint:+0';

    return `${typeOf}:${arg}`;
  }

  let idHelper = (idHelpers.length > 0 && getHelperForValue(arg));
  if (idHelper)
    return anythingToID(idHelper(arg));

  if (UNIQUE_ID_SYMBOL in arg && typeof arg[UNIQUE_ID_SYMBOL] === 'function') {
    // Prevent infinite recursion
    if (!_alreadyVisited || !_alreadyVisited.has(arg)) {
      let alreadyVisited = _alreadyVisited || new Set();
      alreadyVisited.add(arg);
      return anythingToID(arg[UNIQUE_ID_SYMBOL](), alreadyVisited);
    }
  }

  if (!refMap.has(arg)) {
    let key = `${typeof arg}:${++uuidCounter}`;
    refMap.set(arg, key);
    return key;
  }

  return refMap.get(arg);
}

function deadbeef() {
  let parts = [ arguments.length ];
  for (let i = 0, il = arguments.length; i < il; i++)
    parts.push(anythingToID(arguments[i]));

  return parts.join(':');
}

function deadbeefSorted() {
  let parts = [ arguments.length ];
  for (let i = 0, il = arguments.length; i < il; i++)
    parts.push(anythingToID(arguments[i]));

  return parts.sort().join(':');
}

function generateIDFor(helper, generator) {
  idHelpers.push({ helper, generator });
}

function removeIDGenerator(helper) {
  let index = idHelpers.findIndex((item) => (item.helper === helper));
  if (index < 0)
    return;

  idHelpers.splice(index, 1);
}

Object.defineProperties(deadbeef, {
  'idSym': {
    writable:     true,
    enumerable:   false,
    configurable: true,
    value:        UNIQUE_ID_SYMBOL,
  },
  'sorted': {
    writable:     true,
    enumerable:   false,
    configurable: true,
    value:        deadbeefSorted,
  },
  'generateIDFor': {
    writable:     true,
    enumerable:   false,
    configurable: true,
    value:        generateIDFor,
  },
  'removeIDGenerator': {
    writable:     true,
    enumerable:   false,
    configurable: true,
    value:        removeIDGenerator,
  },
});

module.exports = deadbeef;


/***/ }),

/***/ "./lib/component.js":
/*!**************************!*\
  !*** ./lib/component.js ***!
  \**************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_3738__) => {

__nested_webpack_require_3738__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_3738__.d(__webpack_exports__, {
/* harmony export */   "CAPTURE_REFERENCE_METHODS": () => (/* binding */ CAPTURE_REFERENCE_METHODS),
/* harmony export */   "Component": () => (/* binding */ Component),
/* harmony export */   "FLUSH_UPDATE_METHOD": () => (/* binding */ FLUSH_UPDATE_METHOD),
/* harmony export */   "INIT_METHOD": () => (/* binding */ INIT_METHOD),
/* harmony export */   "LAST_RENDER_TIME": () => (/* binding */ LAST_RENDER_TIME),
/* harmony export */   "PENDING_STATE_UPDATE": () => (/* binding */ PENDING_STATE_UPDATE),
/* harmony export */   "PREVIOUS_STATE": () => (/* binding */ PREVIOUS_STATE),
/* harmony export */   "QUEUE_UPDATE_METHOD": () => (/* binding */ QUEUE_UPDATE_METHOD),
/* harmony export */   "SKIP_STATE_UPDATES": () => (/* binding */ SKIP_STATE_UPDATES),
/* harmony export */   "UPDATE_EVENT": () => (/* binding */ UPDATE_EVENT)
/* harmony export */ });
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_3738__(/*! ./events.js */ "./lib/events.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_3738__(/*! ./utils.js */ "./lib/utils.js");
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_3738__(/*! ./jib.js */ "./lib/jib.js");
/* global Buffer */





const UPDATE_EVENT              = '@jibs/component/event/update';
const QUEUE_UPDATE_METHOD       = Symbol.for('@jibs/component/queueUpdate');
const FLUSH_UPDATE_METHOD       = Symbol.for('@jibs/component/flushUpdate');
const INIT_METHOD               = Symbol.for('@jibs/component/__init');
const SKIP_STATE_UPDATES        = Symbol.for('@jibs/component/skipStateUpdates');
const PENDING_STATE_UPDATE      = Symbol.for('@jibs/component/pendingStateUpdate');
const LAST_RENDER_TIME          = Symbol.for('@jibs/component/lastRenderTime');
const PREVIOUS_STATE            = Symbol.for('@jibs/component/previousState');
const CAPTURE_REFERENCE_METHODS = Symbol.for('@jibs/component/previousState');

const elementDataCache = new WeakMap();

function isValidStateObject(value) {
  if (value == null)
    return false;

  if (Object.is(value, NaN))
    return false;

  if (Object.is(value, Infinity))
    return false;

  if (value instanceof Boolean || value instanceof Number || value instanceof String)
    return false;

  let typeOf = typeof value;
  if (typeOf === 'string' || typeOf === 'number' || typeOf === 'boolean')
    return false;

  if (Array.isArray(value))
    return false;

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value))
    return false;

  return true;
}

class Component extends _events_js__WEBPACK_IMPORTED_MODULE_0__.EventEmitter {
  static UPDATE_EVENT = UPDATE_EVENT;

  [QUEUE_UPDATE_METHOD]() {
    if (this[PENDING_STATE_UPDATE])
      return;

    this[PENDING_STATE_UPDATE] = Promise.resolve();
    this[PENDING_STATE_UPDATE].then(this[FLUSH_UPDATE_METHOD].bind(this));
  }

  [FLUSH_UPDATE_METHOD]() {
    // Was the state update cancelled?
    if (!this[PENDING_STATE_UPDATE])
      return;

    this.emit(UPDATE_EVENT);

    this[PENDING_STATE_UPDATE] = null;
  }

  [INIT_METHOD]() {
    this[SKIP_STATE_UPDATES] = false;
  }

  constructor(_jib) {
    super();

    // Bind all class methods to "this"
    _utils_js__WEBPACK_IMPORTED_MODULE_1__.bindMethods.call(this, this.constructor.prototype);

    let jib = _jib || {};

    const createNewState = () => {
      let localState = Object.create(null);

      return new Proxy(localState, {
        get: (target, propName) => {
          return target[propName];
        },
        set: (target, propName, value) => {
          let currentValue = target[propName];
          if (currentValue === value)
            return true;

          if (!this[SKIP_STATE_UPDATES])
            this[QUEUE_UPDATE_METHOD]();

          target[propName] = value;
          this.onStateUpdated(propName, value, currentValue);

          return true;
        },
      });
    };

    let props       = Object.assign(Object.create(null), jib.props || {});
    let _localState = createNewState();

    Object.defineProperties(this, {
      [SKIP_STATE_UPDATES]: {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        true,
      },
      [PENDING_STATE_UPDATE]: {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      [LAST_RENDER_TIME]: {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        _utils_js__WEBPACK_IMPORTED_MODULE_1__.now(),
      },
      [CAPTURE_REFERENCE_METHODS]: {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        {},
      },
      'id': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        jib.id,
      },
      'props': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        props,
      },
      'children': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        jib.children || [],
      },
      'context': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        jib.context || Object.create(null),
      },
      'state': {
        enumerable:   false,
        configurable: true,
        get:          () => {
          return _localState;
        },
        set:          (value) => {
          if (!isValidStateObject(value))
            throw new TypeError(`Invalid value for "this.state": "${value}". Provided "state" must be an iterable object.`);

          Object.assign(_localState, value);
        },
      },
    });
  }

  resolveChildren(children) {
    return _jib_js__WEBPACK_IMPORTED_MODULE_2__.resolveChildren.call(this, children);
  }

  isJib(value) {
    return (0,_jib_js__WEBPACK_IMPORTED_MODULE_2__.isJibish)(value);
  }

  constructJib(value) {
    return (0,_jib_js__WEBPACK_IMPORTED_MODULE_2__.constructJib)(value);
  }

  pushRender(renderResult) {
    this.emit(UPDATE_EVENT, renderResult);
  }

  // eslint-disable-next-line no-unused-vars
  onPropUpdated(propName, newValue, oldValue) {
  }

  // eslint-disable-next-line no-unused-vars
  onStateUpdated(propName, newValue, oldValue) {
  }

  captureReference(name, interceptorCallback) {
    let method = this[CAPTURE_REFERENCE_METHODS][name];
    if (method)
      return method;

    method = (_ref, previousRef) => {
      let ref = _ref;

      if (typeof interceptorCallback === 'function')
        ref = interceptorCallback.call(this, ref, previousRef);

      Object.defineProperties(this, {
        [name]: {
          writable:     true,
          enumerable:   false,
          configurable: true,
          value:        ref,
        },
      });
    };

    if (typeof interceptorCallback !== 'function')
      this[CAPTURE_REFERENCE_METHODS] = method;

    return method;
  }

  forceUpdate() {
    this[QUEUE_UPDATE_METHOD]();
  }

  getState(propertyPath, defaultValue) {
    let state = this.state;
    if (arguments.length === 0)
      return state;

    if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(propertyPath, 'object')) {
      let keys        = Object.keys(propertyPath).concat(Object.getOwnPropertySymbols(propertyPath));
      let finalState  = {};

      for (let i = 0, il = keys.length; i < il; i++) {
        let key = keys[i];
        let [ value, lastPart ] = _utils_js__WEBPACK_IMPORTED_MODULE_1__.fetchDeepProperty(state, key, propertyPath[key], true);
        if (lastPart == null)
          continue;

        finalState[lastPart] = value;
      }

      return finalState;
    } else {
      return _utils_js__WEBPACK_IMPORTED_MODULE_1__.fetchDeepProperty(state, propertyPath, defaultValue);
    }
  }

  setState(value) {
    if (!isValidStateObject(value))
      throw new TypeError(`Invalid value for "this.setState": "${value}". Provided "state" must be an iterable object.`);

    Object.assign(this.state, value);
  }

  setStatePassive(value) {
    if (!isValidStateObject(value))
      throw new TypeError(`Invalid value for "this.setStatePassive": "${value}". Provided "state" must be an iterable object.`);

    try {
      this[SKIP_STATE_UPDATES] = true;
      Object.assign(this.state, value);
    } finally {
      this[SKIP_STATE_UPDATES] = false;
    }
  }

  shouldUpdate() {
    return true;
  }

  destroy() {
    delete this.state;
    delete this.props;
    delete this.context;
    delete this[CAPTURE_REFERENCE_METHODS];
    this.clearAllDebounces();
  }

  renderWaiting() {
  }

  render(children) {
    return children;
  }

  updated() {
  }

  combineWith(sep, ...args) {
    let finalArgs = new Set();
    for (let i = 0, il = args.length; i < il; i++) {
      let arg = args[i];
      if (!arg)
        continue;

      if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(arg, 'string')) {
        let values = arg.split(sep).filter(_utils_js__WEBPACK_IMPORTED_MODULE_1__.isNotEmpty);
        for (let i = 0, il = values.length; i < il; i++) {
          let value = values[i];
          finalArgs.add(value);
        }
      } else if (Array.isArray(arg)) {
        let values = arg.filter((value) => {
          if (!value)
            return false;

          if (!_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(value, 'string'))
            return false;

          return _utils_js__WEBPACK_IMPORTED_MODULE_1__.isNotEmpty(value);
        });

        for (let i = 0, il = values.length; i < il; i++) {
          let value = values[i];
          finalArgs.add(value);
        }
      } else if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(arg, 'object')) {
        let keys = Object.keys(arg);
        for (let i = 0, il = keys.length; i < il; i++) {
          let key   = keys[i];
          let value = arg[key];

          if (!value) {
            finalArgs.delete(key);
            continue;
          }

          finalArgs.add(key);
        }
      }
    }

    return Array.from(finalArgs).join(sep || '');
  }

  classes(...args) {
    return this.combineWith(' ', ...args);
  }

  extractChildren(_patterns, children) {
    let extracted = {};
    let patterns  = _patterns;
    let isArray   = Array.isArray(patterns);

    const isMatch = (jib) => {
      let jibType = jib.Type;
      if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(jibType, 'string'))
        jibType = jibType.toLowerCase();

      if (isArray) {
        for (let i = 0, il = patterns.length; i < il; i++) {
          let pattern = patterns[i];
          if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(pattern, 'string'))
            pattern = pattern.toLowerCase();

          if (jibType === pattern) {
            extracted[pattern] = jib;
            return true;
          }
        }
      } else {
        let keys = Object.keys(patterns);
        for (let i = 0, il = keys.length; i < il; i++) {
          let key     = keys[i];
          let pattern = patterns[key];
          let result;

          if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(pattern, RegExp))
            result = pattern.test(jibType);
          else if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(pattern, 'string'))
            result = (pattern.toLowerCase() === jibType);
          else
            result = (pattern === jibType);

          if (result) {
            extracted[key] = jib;
            return true;
          }
        }
      }

      return false;
    };

    extracted.remainingChildren = children.filter((jib) => !isMatch(jib));
    return extracted;
  }

  debounce(func, time, _id) {
    const clearPendingTimeout = () => {
      if (pendingTimer && pendingTimer.timeout) {
        clearTimeout(pendingTimer.timeout);
        pendingTimer.timeout = null;
      }
    };

    var id = (!_id) ? ('' + func) : _id;
    if (!this.debounceTimers) {
      Object.defineProperty(this, 'debounceTimers', {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        {},
      });
    }

    var pendingTimer = this.debounceTimers[id];
    if (!pendingTimer)
      pendingTimer = this.debounceTimers[id] = {};

    pendingTimer.func = func;
    clearPendingTimeout();

    var promise = pendingTimer.promise;
    if (!promise || !promise.pending()) {
      let status = 'pending';
      let resolve;

      promise = pendingTimer.promise = new Promise((_resolve) => {
        resolve = _resolve;
      });

      promise.resolve = () => {
        if (status !== 'pending')
          return;

        status = 'fulfilled';
        clearPendingTimeout();
        this.debounceTimers[id] = null;

        if (typeof pendingTimer.func === 'function') {
          var ret = pendingTimer.func.call(this);
          if (ret instanceof Promise || (ret && typeof ret.then === 'function'))
            ret.then((value) => resolve(value));
          else
            resolve(ret);
        } else {
          resolve();
        }
      };

      promise.cancel = () => {
        status = 'rejected';
        clearPendingTimeout();
        this.debounceTimers[id] = null;

        promise.resolve();
      };

      promise.isPending = () => {
        return (status === 'pending');
      };
    }

    pendingTimer.timeout = setTimeout(promise.resolve, (time == null) ? 250 : time);

    return promise;
  }

  clearDebounce(id) {
    var pendingTimer = this.debounceTimers[id];
    if (pendingTimer == null)
      return;

    if (pendingTimer.timeout)
      clearTimeout(pendingTimer.timeout);

    if (pendingTimer.promise)
      pendingTimer.promise.cancel();
  }

  clearAllDebounces() {
    let debounceTimers  = this.debounceTimers || {};
    let ids             = Object.keys(debounceTimers);

    for (let i = 0, il = ids.length; i < il; i++)
      this.clearDebounce(ids[i]);
  }

  getElementData(element) {
    let data = elementDataCache.get(element);
    if (!data) {
      data = {};
      elementDataCache.set(element, data);
    }

    return data;
  }
}


/***/ }),

/***/ "./lib/events.js":
/*!***********************!*\
  !*** ./lib/events.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_18168__) => {

__nested_webpack_require_18168__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_18168__.d(__webpack_exports__, {
/* harmony export */   "EventEmitter": () => (/* binding */ EventEmitter)
/* harmony export */ });
const EVENT_LISTENERS = Symbol.for('@jibs/events/listeners');

class EventEmitter {
  constructor() {
    Object.defineProperties(this, {
      [EVENT_LISTENERS]: {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        new Map(),
      },
    });
  }

  addListener(eventName, listener) {
    if (typeof listener !== 'function')
      throw new TypeError('Event listener must be a method');

    let eventMap  = this[EVENT_LISTENERS];
    let scope     = eventMap.get(eventName);

    if (!scope) {
      scope = [];
      eventMap.set(eventName, scope);
    }

    scope.push(listener);

    return this;
  }

  removeListener(eventName, listener) {
    if (typeof listener !== 'function')
      throw new TypeError('Event listener must be a method');

    let eventMap  = this[EVENT_LISTENERS];
    let scope     = eventMap.get(eventName);
    if (!scope)
      return this;

    let index = scope.indexOf(listener);
    if (index >= 0)
      scope.splice(index, 1);

    return this;
  }

  removeAllListeners(eventName) {
    let eventMap  = this[EVENT_LISTENERS];
    if (!eventMap.has(eventName))
      return this;

    eventMap.set(eventName, []);

    return this;
  }

  emit(eventName, ...args) {
    let eventMap  = this[EVENT_LISTENERS];
    let scope     = eventMap.get(eventName);
    if (!scope || scope.length === 0)
      return false;

    for (let i = 0, il = scope.length; i < il; i++) {
      let eventCallback = scope[i];
      eventCallback.apply(this, args);
    }

    return true;
  }

  once(eventName, listener) {
    let func = (...args) => {
      this.off(eventName, func);
      return listener(...args);
    };

    return this.on(eventName, func);
  }

  on(eventName, listener) {
    return this.addListener(eventName, listener);
  }

  off(eventName, listener) {
    return this.removeListener(eventName, listener);
  }

  eventNames() {
    return Array.from(this[EVENT_LISTENERS].keys());
  }

  listenerCount(eventName) {
    let eventMap  = this[EVENT_LISTENERS];
    let scope     = eventMap.get(eventName);
    if (!scope)
      return 0;

    return scope.length;
  }

  listeners(eventName) {
    let eventMap  = this[EVENT_LISTENERS];
    let scope     = eventMap.get(eventName);
    if (!scope)
      return [];

    return scope.slice();
  }
}


/***/ }),

/***/ "./lib/jib.js":
/*!********************!*\
  !*** ./lib/jib.js ***!
  \********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_20929__) => {

__nested_webpack_require_20929__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_20929__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* binding */ $),
/* harmony export */   "JIB": () => (/* binding */ JIB),
/* harmony export */   "JIB_BARREN": () => (/* binding */ JIB_BARREN),
/* harmony export */   "JIB_PROXY": () => (/* binding */ JIB_PROXY),
/* harmony export */   "Jib": () => (/* binding */ Jib),
/* harmony export */   "constructJib": () => (/* binding */ constructJib),
/* harmony export */   "factory": () => (/* binding */ factory),
/* harmony export */   "isJibish": () => (/* binding */ isJibish),
/* harmony export */   "resolveChildren": () => (/* binding */ resolveChildren)
/* harmony export */ });
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_20929__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_20929__(/*! ./utils.js */ "./lib/utils.js");



class Jib {
  constructor(Type, props, children) {
    let defaultProps = (Type && Type.props) ? Type.props : {};

    Object.defineProperties(this, {
      'Type': {
        writable:     true,
        enumerable:   true,
        configurable: true,
        value:        Type,
      },
      'props': {
        writable:     true,
        enumerable:   true,
        configurable: true,
        value:        { ...defaultProps, ...(props || {}) },
      },
      'children': {
        writable:     true,
        enumerable:   true,
        configurable: true,
        value:        _utils_js__WEBPACK_IMPORTED_MODULE_1__.flattenArray(children),
      },
    });
  }
}

const JIB_BARREN  = Symbol.for('@jibs.barren');
const JIB_PROXY   = Symbol.for('@jibs.proxy');
const JIB         = Symbol.for('@jibs.jib');

function factory(JibClass) {
  return function $(_type, props = {}) {
    if (isJibish(_type))
      throw new TypeError('Received a jib but expected a component.');

    let Type = (_type == null) ? JIB_PROXY : _type;

    function barren(..._children) {
      let children = _children;

      function jib() {
        if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(Type, 'promise') || children.some((child) => _utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(child, 'promise'))) {
          return Promise.all([ Type ].concat(children)).then((all) => {
            Type = all[0];
            children = all.slice(1);

            return new JibClass(
              Type,
              props,
              children,
            );
          });
        }

        return new JibClass(
          Type,
          props,
          children,
        );
      }

      Object.defineProperties(jib, {
        [JIB]: {
          writable:     false,
          enumerable:   false,
          configurable: false,
          value:        true,
        },
        [deadbeef__WEBPACK_IMPORTED_MODULE_0__.idSym]: {
          writable:     false,
          enumerable:   false,
          configurable: false,
          value:        () => Type,
        },
      });

      return jib;
    }

    Object.defineProperties(barren, {
      [JIB_BARREN]: {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        true,
      },
      [deadbeef__WEBPACK_IMPORTED_MODULE_0__.idSym]: {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        () => Type,
      },
    });

    return barren;
  };
}

const $ = factory(Jib);

function isJibish(value) {
  if (typeof value === 'function' && (value[JIB_BARREN] || value[JIB]))
    return true;

  if (value instanceof Jib)
    return true;

  return false;
}

function constructJib(value) {
  if (value instanceof Jib)
    return value;

  if (typeof value === 'function') {
    if (value[JIB_BARREN])
      return value()();
    else if (value[JIB])
      return value();
  }

  throw new TypeError('constructJib: Provided value is not a Jib.');
}

async function resolveChildren(_children) {
  let children = _children;

  if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(children, 'promise'))
    children = await children;

  if (!((this.isIterableChild || _utils_js__WEBPACK_IMPORTED_MODULE_1__.isIterableChild).call(this, children)) && (isJibish(children) || ((this.isValidChild || _utils_js__WEBPACK_IMPORTED_MODULE_1__.isValidChild).call(this, children))))
    children = [ children ];

  let promises = _utils_js__WEBPACK_IMPORTED_MODULE_1__.iterate(children, async ({ value: _child }) => {
    let child = (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(_child, 'promise')) ? await _child : _child;

    if (isJibish(child))
      return await constructJib(child);
    else
      return child;
  });

  return await Promise.all(promises);
}


/***/ }),

/***/ "./lib/renderers/comment-element.js":
/*!******************************************!*\
  !*** ./lib/renderers/comment-element.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_26032__) => {

__nested_webpack_require_26032__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_26032__.d(__webpack_exports__, {
/* harmony export */   "CommentElement": () => (/* binding */ CommentElement)
/* harmony export */ });
/* harmony import */ var _root_element_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_26032__(/*! ./root-element.js */ "./lib/renderers/root-element.js");


class CommentElement extends _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement {
  static TYPE = _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_COMMENT;

  constructor(id, value, props) {
    super(_root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_COMMENT, id, value, props);
  }
}


/***/ }),

/***/ "./lib/renderers/index.js":
/*!********************************!*\
  !*** ./lib/renderers/index.js ***!
  \********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_26973__) => {

__nested_webpack_require_26973__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_26973__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID),
/* harmony export */   "CommentElement": () => (/* reexport safe */ _comment_element_js__WEBPACK_IMPORTED_MODULE_3__.CommentElement),
/* harmony export */   "FORCE_REFLOW": () => (/* binding */ FORCE_REFLOW),
/* harmony export */   "NativeElement": () => (/* reexport safe */ _native_element_js__WEBPACK_IMPORTED_MODULE_4__.NativeElement),
/* harmony export */   "PortalElement": () => (/* reexport safe */ _portal_element_js__WEBPACK_IMPORTED_MODULE_5__.PortalElement),
/* harmony export */   "Renderer": () => (/* reexport safe */ _renderer_js__WEBPACK_IMPORTED_MODULE_1__.Renderer),
/* harmony export */   "RootElement": () => (/* reexport safe */ _root_element_js__WEBPACK_IMPORTED_MODULE_2__.RootElement),
/* harmony export */   "RootNode": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode),
/* harmony export */   "TextElement": () => (/* reexport safe */ _text_element_js__WEBPACK_IMPORTED_MODULE_6__.TextElement)
/* harmony export */ });
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_26973__(/*! ./root-node.js */ "./lib/renderers/root-node.js");
/* harmony import */ var _renderer_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_26973__(/*! ./renderer.js */ "./lib/renderers/renderer.js");
/* harmony import */ var _root_element_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_26973__(/*! ./root-element.js */ "./lib/renderers/root-element.js");
/* harmony import */ var _comment_element_js__WEBPACK_IMPORTED_MODULE_3__ = __nested_webpack_require_26973__(/*! ./comment-element.js */ "./lib/renderers/comment-element.js");
/* harmony import */ var _native_element_js__WEBPACK_IMPORTED_MODULE_4__ = __nested_webpack_require_26973__(/*! ./native-element.js */ "./lib/renderers/native-element.js");
/* harmony import */ var _portal_element_js__WEBPACK_IMPORTED_MODULE_5__ = __nested_webpack_require_26973__(/*! ./portal-element.js */ "./lib/renderers/portal-element.js");
/* harmony import */ var _text_element_js__WEBPACK_IMPORTED_MODULE_6__ = __nested_webpack_require_26973__(/*! ./text-element.js */ "./lib/renderers/text-element.js");


const FORCE_REFLOW = Symbol.for('@jibsForceReflow');










/***/ }),

/***/ "./lib/renderers/native-element.js":
/*!*****************************************!*\
  !*** ./lib/renderers/native-element.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_29609__) => {

__nested_webpack_require_29609__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_29609__.d(__webpack_exports__, {
/* harmony export */   "NativeElement": () => (/* binding */ NativeElement)
/* harmony export */ });
/* harmony import */ var _root_element_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_29609__(/*! ./root-element.js */ "./lib/renderers/root-element.js");


class NativeElement extends _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement {
  static TYPE = _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_ELEMENT;

  constructor(id, value, props) {
    super(_root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_ELEMENT, id, value, props);
  }
}


/***/ }),

/***/ "./lib/renderers/portal-element.js":
/*!*****************************************!*\
  !*** ./lib/renderers/portal-element.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_30583__) => {

__nested_webpack_require_30583__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_30583__.d(__webpack_exports__, {
/* harmony export */   "PortalElement": () => (/* binding */ PortalElement)
/* harmony export */ });
/* harmony import */ var _root_element_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_30583__(/*! ./root-element.js */ "./lib/renderers/root-element.js");


class PortalElement extends _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement {
  static TYPE = _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_PORTAL;

  constructor(id, value, props) {
    super(_root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_PORTAL, id, value, props);
  }
}


/***/ }),

/***/ "./lib/renderers/renderer.js":
/*!***********************************!*\
  !*** ./lib/renderers/renderer.js ***!
  \***********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_31531__) => {

__nested_webpack_require_31531__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_31531__.d(__webpack_exports__, {
/* harmony export */   "Renderer": () => (/* binding */ Renderer)
/* harmony export */ });
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_31531__(/*! ../events.js */ "./lib/events.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_31531__(/*! ../utils.js */ "./lib/utils.js");
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_31531__(/*! ./root-node.js */ "./lib/renderers/root-node.js");




let _contextIDCounter = 0n;

class Renderer extends _events_js__WEBPACK_IMPORTED_MODULE_0__.EventEmitter {
  static RootNode = _root_node_js__WEBPACK_IMPORTED_MODULE_2__.RootNode;

  constructor() {
    super();

    Object.defineProperties(this, {
      'context': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        this.createContext(),
      },
      'destroying': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        false,
      },
      'renderFrame': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        0,
      },
    });
  }

  createContext(rootContext, onUpdate, onUpdateThis) {
    let context     = Object.create(null);
    let myContextID = (rootContext) ? rootContext[_root_node_js__WEBPACK_IMPORTED_MODULE_2__.CONTEXT_ID] : 1n;

    return new Proxy(context, {
      get: (target, propName) => {
        if (propName === _root_node_js__WEBPACK_IMPORTED_MODULE_2__.CONTEXT_ID) {
          let parentID = (rootContext) ? rootContext[_root_node_js__WEBPACK_IMPORTED_MODULE_2__.CONTEXT_ID] : 1n;
          return (parentID > myContextID) ? parentID : myContextID;
        }

        if (!Object.prototype.hasOwnProperty.call(target, propName))
          return (rootContext) ? rootContext[propName] : undefined;

        return target[propName];
      },
      set: (target, propName, value) => {
        if (propName === _root_node_js__WEBPACK_IMPORTED_MODULE_2__.CONTEXT_ID)
          return true;

        if (target[propName] === value)
          return true;

        myContextID = ++_contextIDCounter;
        target[propName] = value;

        if (typeof onUpdate === 'function')
          onUpdate.call(onUpdateThis, onUpdateThis);

        return true;
      },
    });
  }
}


/***/ }),

/***/ "./lib/renderers/root-element.js":
/*!***************************************!*\
  !*** ./lib/renderers/root-element.js ***!
  \***************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_34281__) => {

__nested_webpack_require_34281__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_34281__.d(__webpack_exports__, {
/* harmony export */   "RootElement": () => (/* binding */ RootElement)
/* harmony export */ });

const TYPE_ELEMENT  = 1;
const TYPE_TEXT     = 3;
const TYPE_COMMENT  = 8;
const TYPE_PORTAL   = 15;

class RootElement {
  static TYPE_ELEMENT  = TYPE_ELEMENT;

  static TYPE_TEXT     = TYPE_TEXT;

  static TYPE_COMMENT  = TYPE_COMMENT;

  static TYPE_PORTAL   = TYPE_PORTAL;

  constructor(type, id, value, props) {
    this.isJibsVirtualElement = true;
    this.type   = type;
    this.id     = id;
    this.value  = value;
    this.props  = props || {};
  }
}


/***/ }),

/***/ "./lib/renderers/root-node.js":
/*!************************************!*\
  !*** ./lib/renderers/root-node.js ***!
  \************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_35222__) => {

__nested_webpack_require_35222__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_35222__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* binding */ CONTEXT_ID),
/* harmony export */   "RootNode": () => (/* binding */ RootNode)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_35222__(/*! ../utils.js */ "./lib/utils.js");


const CONTEXT_ID = Symbol.for('@jibs/node/contextID');

let uuid = 1;

class RootNode {
  static CONTEXT_ID = CONTEXT_ID;

  constructor(renderer, parent, _context) {
    let context = renderer.createContext(
      _context,
      (this.onContextUpdate) ? this.onContextUpdate : undefined,
      this,
    );

    Object.defineProperties(this, {
      'id': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        uuid++,
      },
      'renderer': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        renderer,
      },
      'parent': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        parent,
      },
      'context': {
        enumerable:   false,
        configurable: true,
        get:          () => {
          return context;
        },
        set:          () => {},
      },
      'renderPromise': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      'destroying': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        false,
      },
      'renderFrame': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        0,
      },
    });
  }

  destroy() {
    this.destroying = true;
    this.context = null;
  }

  isValidChild(child) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_0__.isValidChild(child);
  }

  isIterableChild(child) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_0__.isIterableChild(child);
  }

  propsDiffer(oldProps, newProps, skipKeys) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_0__.propsDiffer(oldProps, newProps, skipKeys);
  }

  childrenDiffer(oldChildren, newChildren) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_0__.childrenDiffer(oldChildren, newChildren);
  }

  async render(jib, renderContext) {
    if (this.destroying)
      return;

    this.renderFrame++;

    return this._render(jib, renderContext)
      .then((result) => {
        this.renderPromise = null;
        return result;
      })
      .catch((error) => {
        this.renderPromise = null;
        throw error;
      });
  }
}


/***/ }),

/***/ "./lib/renderers/text-element.js":
/*!***************************************!*\
  !*** ./lib/renderers/text-element.js ***!
  \***************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_38207__) => {

__nested_webpack_require_38207__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_38207__.d(__webpack_exports__, {
/* harmony export */   "TextElement": () => (/* binding */ TextElement)
/* harmony export */ });
/* harmony import */ var _root_element_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_38207__(/*! ./root-element.js */ "./lib/renderers/root-element.js");


class TextElement extends _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement {
  static TYPE = _root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_TEXT;

  constructor(id, value, props) {
    super(_root_element_js__WEBPACK_IMPORTED_MODULE_0__.RootElement.TYPE_TEXT, id, value, props);
  }
}


/***/ }),

/***/ "./lib/utils.js":
/*!**********************!*\
  !*** ./lib/utils.js ***!
  \**********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_39093__) => {

__nested_webpack_require_39093__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_39093__.d(__webpack_exports__, {
/* harmony export */   "bindMethods": () => (/* binding */ bindMethods),
/* harmony export */   "childrenDiffer": () => (/* binding */ childrenDiffer),
/* harmony export */   "fetchDeepProperty": () => (/* binding */ fetchDeepProperty),
/* harmony export */   "flattenArray": () => (/* binding */ flattenArray),
/* harmony export */   "instanceOf": () => (/* binding */ instanceOf),
/* harmony export */   "isEmpty": () => (/* binding */ isEmpty),
/* harmony export */   "isIterableChild": () => (/* binding */ isIterableChild),
/* harmony export */   "isNotEmpty": () => (/* binding */ isNotEmpty),
/* harmony export */   "isValidChild": () => (/* binding */ isValidChild),
/* harmony export */   "iterate": () => (/* binding */ iterate),
/* harmony export */   "now": () => (/* binding */ now),
/* harmony export */   "propsDiffer": () => (/* binding */ propsDiffer),
/* harmony export */   "sizeOf": () => (/* binding */ sizeOf)
/* harmony export */ });
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_39093__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");


const STOP = Symbol.for('@jibsIterateStop');

// eslint-disable-next-line no-nested-ternary
const globalScope = (typeof global !== 'undefined') ? global : (typeof window !== 'undefined') ? window : undefined;

function instanceOf(obj) {
  function testType(obj, _val) {
    function isDeferredType(obj) {
      if (obj instanceof Promise || (obj.constructor && obj.constructor.name === 'Promise'))
        return true;

      // Quack quack...
      if (typeof obj.then === 'function' && typeof obj.catch === 'function')
        return true;

      return false;
    }

    let val     = _val;
    let typeOf  = (typeof obj);

    if (val === globalScope.String)
      val = 'string';
    else if (val === globalScope.Number)
      val = 'number';
    else if (val === globalScope.Boolean)
      val = 'boolean';
    else if (val === globalScope.Function)
      val = 'function';
    else if (val === globalScope.Array)
      val = 'array';
    else if (val === globalScope.Object)
      val = 'object';
    else if (val === globalScope.Promise)
      val = 'promise';
    else if (val === globalScope.BigInt)
      val = 'bigint';
    else if (val === globalScope.Map)
      val = 'map';
    else if (val === globalScope.WeakMap)
      val = 'weakmap';
    else if (val === globalScope.Set)
      val = 'set';
    else if (val === globalScope.Symbol)
      val = 'symbol';
    else if (val === globalScope.Buffer)
      val = 'buffer';

    if (val === 'buffer' && globalScope.Buffer && globalScope.Buffer.isBuffer(obj))
      return true;

    if (val === 'number' && (typeOf === 'number' || obj instanceof Number || (obj.constructor && obj.constructor.name === 'Number'))) {
      if (!isFinite(obj))
        return false;

      return true;
    }

    if (val !== 'object' && val === typeOf)
      return true;

    if (val === 'object') {
      if ((obj.constructor === Object.prototype.constructor || (obj.constructor && obj.constructor.name === 'Object')))
        return true;

      // Null prototype on object
      if (typeOf === 'object' && !obj.constructor)
        return true;

      return false;
    }

    if (val === 'array' && (Array.isArray(obj) || obj instanceof Array || (obj.constructor && obj.constructor.name === 'Array')))
      return true;

    if ((val === 'promise' || val === 'deferred') && isDeferredType(obj))
      return true;

    if (val === 'string' && (obj instanceof globalScope.String || (obj.constructor && obj.constructor.name === 'String')))
      return true;

    if (val === 'boolean' && (obj instanceof globalScope.Boolean || (obj.constructor && obj.constructor.name === 'Boolean')))
      return true;

    if (val === 'map' && (obj instanceof globalScope.Map || (obj.constructor && obj.constructor.name === 'Map')))
      return true;

    if (val === 'weakmap' && (obj instanceof globalScope.WeakMap || (obj.constructor && obj.constructor.name === 'WeakMap')))
      return true;

    if (val === 'set' && (obj instanceof globalScope.Set || (obj.constructor && obj.constructor.name === 'Set')))
      return true;

    if (val === 'function' && typeOf === 'function')
      return true;

    if (typeof val === 'function' && obj instanceof val)
      return true;

    if (typeof val === 'string' && obj.constructor && obj.constructor.name === val)
      return true;

    return false;
  }

  if (obj == null)
    return false;

  for (var i = 1, len = arguments.length; i < len; i++) {
    if (testType(obj, arguments[i]) === true)
      return true;
  }

  return false;
}

function propsDiffer(oldProps, newProps, skipKeys) {
  if (oldProps === newProps)
    return false;

  if (typeof oldProps !== typeof newProps)
    return true;

  if (!oldProps && newProps)
    return true;

  if (oldProps && !newProps)
    return true;

  // eslint-disable-next-line eqeqeq
  if (!oldProps && !newProps && oldProps != oldProps)
    return true;

  let aKeys = Object.keys(oldProps).concat(Object.getOwnPropertySymbols(oldProps));
  let bKeys = Object.keys(newProps).concat(Object.getOwnPropertySymbols(newProps));

  if (aKeys.length !== bKeys.length)
    return true;

  for (let i = 0, il = aKeys.length; i < il; i++) {
    let aKey = aKeys[i];
    if (skipKeys && skipKeys.indexOf(aKey) >= 0)
      continue;

    if (oldProps[aKey] !== newProps[aKey])
      return true;

    let bKey = bKeys[i];
    if (skipKeys && skipKeys.indexOf(bKey))
      continue;

    if (aKey === bKey)
      continue;

    if (oldProps[bKey] !== newProps[bKey])
      return true;
  }

  return false;
}

function sizeOf(value) {
  if (!value)
    return 0;

  if (Object.is(Infinity))
    return 0;

  if (typeof value.length === 'number')
    return value.length;

  return Object.keys(value).length;
}

function _iterate(obj, callback) {
  if (!obj || Object.is(Infinity))
    return [];

  let results   = [];
  let scope     = { collection: obj, STOP };
  let result;

  if (Array.isArray(obj)) {
    scope.type = 'Array';

    for (let i = 0, il = obj.length; i < il; i++) {
      scope.value = obj[i];
      scope.index = scope.key = i;

      result = callback.call(this, scope);
      if (result === STOP)
        break;

      results.push(result);
    }
  } else if (typeof obj.entries === 'function') {
    if (obj instanceof Set || obj.constructor.name === 'Set') {
      scope.type = 'Set';

      let index = 0;
      for (let item of obj.values()) {
        scope.value = item;
        scope.key = item;
        scope.index = index++;

        result = callback.call(this, scope);
        if (result === STOP)
          break;

        results.push(result);
      }
    } else {
      scope.type = obj.constructor.name;

      let index = 0;
      for (let [ key, value ] of obj.entries()) {
        scope.value = value;
        scope.key = key;
        scope.index = index++;

        result = callback.call(this, scope);
        if (result === STOP)
          break;

        results.push(result);
      }
    }
  } else {
    if (instanceOf(obj, 'boolean', 'number', 'bigint', 'function'))
      return;

    scope.type = (obj.constructor) ? obj.constructor.name : 'Object';

    let keys = Object.keys(obj);
    for (let i = 0, il = keys.length; i < il; i++) {
      let key   = keys[i];
      let value = obj[key];

      scope.value = value;
      scope.key = key;
      scope.index = i;

      result = callback.call(this, scope);
      if (result === STOP)
        break;

      results.push(result);
    }
  }

  return results;
}

Object.defineProperties(_iterate, {
  'STOP': {
    writable:     false,
    enumerable:   false,
    configurable: false,
    value:        STOP,
  },
});

const iterate = _iterate;

function childrenDiffer(_children1, _children2) {
  let children1 = (!Array.isArray(_children1)) ? [ _children1 ] : _children1;
  let children2 = (!Array.isArray(_children2)) ? [ _children2 ] : _children2;

  return (deadbeef__WEBPACK_IMPORTED_MODULE_0__(...children1) !== deadbeef__WEBPACK_IMPORTED_MODULE_0__(...children2));
}

function fetchDeepProperty(obj, _key, defaultValue, lastPart) {
  if (obj == null || Object.is(NaN, obj) || Object.is(Infinity, obj))
    return (lastPart) ? [ defaultValue, null ] : defaultValue;

  if (_key == null || Object.is(NaN, _key) || Object.is(Infinity, _key))
    return (lastPart) ? [ defaultValue, null ] : defaultValue;

  let parts;

  if (Array.isArray(_key)) {
    parts = _key;
  } else if (typeof _key === 'symbol') {
    parts = [ _key ];
  } else {
    let key         = ('' + _key);
    let lastIndex   = 0;
    let lastCursor  = 0;

    parts = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let index = key.indexOf('.', lastIndex);
      if (index < 0) {
        parts.push(key.substring(lastCursor));
        break;
      }

      if (key.charAt(index - 1) === '\\') {
        lastIndex = index + 1;
        continue;
      }

      parts.push(key.substring(lastCursor, index));
      lastCursor = lastIndex = index + 1;
    }
  }

  let partN = parts[parts.length - 1];
  if (parts.length === 0)
    return (lastPart) ? [ defaultValue, partN ] : defaultValue;

  let currentValue = obj;
  for (let i = 0, il = parts.length; i < il; i++) {
    let key = parts[i];

    currentValue = currentValue[key];
    if (currentValue == null)
      return (lastPart) ? [ defaultValue, partN ] : defaultValue;
  }

  return (lastPart) ? [ currentValue, partN ] : currentValue;
}

function bindMethods(_proto, skipProtos) {
  let proto           = _proto;
  let alreadyVisited  = new Set();

  while (proto) {
    let descriptors = Object.getOwnPropertyDescriptors(proto);
    let keys        = Object.keys(descriptors).concat(Object.getOwnPropertySymbols(descriptors));

    for (let i = 0, il = keys.length; i < il; i++) {
      let key = keys[i];
      if (key === 'constructor')
        continue;

      if (alreadyVisited.has(key))
        continue;

      alreadyVisited.add(key);

      let value = proto[key];

      // Skip prototype of Object
      // eslint-disable-next-line no-prototype-builtins
      if (Object.prototype.hasOwnProperty(key) && Object.prototype[key] === value)
        continue;

      if (typeof value !== 'function')
        continue;

      this[key] = value.bind(this);
    }

    proto = Object.getPrototypeOf(proto);
    if (proto === Object.prototype)
      break;

    if (skipProtos && skipProtos.indexOf(proto) >= 0)
      break;
  }
}

function isEmpty(value) {
  if (value == null)
    return true;

  if (Object.is(value, Infinity))
    return false;

  if (Object.is(value, NaN))
    return true;

  if (instanceOf(value, 'string'))
    return !(/\S/).test(value);
  else if (instanceOf(value, 'number') && isFinite(value))
    return false;
  else if (!instanceOf(value, 'boolean', 'bigint', 'function') && sizeOf(value) === 0)
    return true;

  return false;
}

function isNotEmpty(value) {
  return !isEmpty.call(this, value);
}

function flattenArray(value) {
  if (!Array.isArray(value))
    return value;

  let newArray = [];
  for (let i = 0, il = value.length; i < il; i++) {
    let item = value[i];
    if (Array.isArray(item))
      newArray = newArray.concat(flattenArray(item));
    else
      newArray.push(item);
  }

  return newArray;
}

function isValidChild(child) {
  if (child == null)
    return false;

  if (typeof child === 'boolean')
    return false;

  if (Object.is(child, Infinity))
    return false;

  if (Object.is(child, NaN))
    return false;

  return true;
}

function isIterableChild(child) {
  if (child == null || Object.is(child, NaN) || Object.is(child, Infinity))
    return false;

  return (Array.isArray(child) || typeof child === 'object' && !instanceOf(child, 'boolean', 'number', 'string'));
}

function now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function')
    return performance.now();
  else
    return Date.now();
}


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nested_webpack_require_51464__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nested_webpack_require_51464__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nested_webpack_require_51464__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nested_webpack_require_51464__.o(definition, key) && !__nested_webpack_require_51464__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/global */
/******/ (() => {
/******/ 	__nested_webpack_require_51464__.g = (function() {
/******/ 		if (typeof globalThis === 'object') return globalThis;
/******/ 		try {
/******/ 			return this || new Function('return this')();
/******/ 		} catch (e) {
/******/ 			if (typeof window === 'object') return window;
/******/ 		}
/******/ 	})();
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nested_webpack_require_51464__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__nested_webpack_require_51464__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
__nested_webpack_require_51464__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_51464__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* reexport safe */ _jib_js__WEBPACK_IMPORTED_MODULE_0__.$),
/* harmony export */   "Component": () => (/* reexport safe */ _component_js__WEBPACK_IMPORTED_MODULE_1__.Component),
/* harmony export */   "Components": () => (/* binding */ Components),
/* harmony export */   "Jibs": () => (/* binding */ Jibs),
/* harmony export */   "Renderers": () => (/* binding */ Renderers),
/* harmony export */   "Utils": () => (/* reexport module object */ _utils_js__WEBPACK_IMPORTED_MODULE_3__),
/* harmony export */   "deadbeef": () => (/* reexport default export from named module */ deadbeef__WEBPACK_IMPORTED_MODULE_4__),
/* harmony export */   "factory": () => (/* reexport safe */ _jib_js__WEBPACK_IMPORTED_MODULE_0__.factory)
/* harmony export */ });
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_51464__(/*! ./jib.js */ "./lib/jib.js");
/* harmony import */ var _component_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_51464__(/*! ./component.js */ "./lib/component.js");
/* harmony import */ var _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_51464__(/*! ./renderers/index.js */ "./lib/renderers/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __nested_webpack_require_51464__(/*! ./utils.js */ "./lib/utils.js");
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_4__ = __nested_webpack_require_51464__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");


const Jibs = {
  JIB_BARREN: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_BARREN,
  JIB_PROXY: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_PROXY,
  JIB: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB,
  Jib: _jib_js__WEBPACK_IMPORTED_MODULE_0__.Jib,
  isJibish: _jib_js__WEBPACK_IMPORTED_MODULE_0__.isJibish,
  constructJib: _jib_js__WEBPACK_IMPORTED_MODULE_0__.constructJib,
  resolveChildren: _jib_js__WEBPACK_IMPORTED_MODULE_0__.resolveChildren,
};



const Components = {
  UPDATE_EVENT: _component_js__WEBPACK_IMPORTED_MODULE_1__.UPDATE_EVENT,
  QUEUE_UPDATE_METHOD: _component_js__WEBPACK_IMPORTED_MODULE_1__.QUEUE_UPDATE_METHOD,
  FLUSH_UPDATE_METHOD: _component_js__WEBPACK_IMPORTED_MODULE_1__.FLUSH_UPDATE_METHOD,
  INIT_METHOD: _component_js__WEBPACK_IMPORTED_MODULE_1__.INIT_METHOD,
  SKIP_STATE_UPDATES: _component_js__WEBPACK_IMPORTED_MODULE_1__.SKIP_STATE_UPDATES,
  PENDING_STATE_UPDATE: _component_js__WEBPACK_IMPORTED_MODULE_1__.PENDING_STATE_UPDATE,
  LAST_RENDER_TIME: _component_js__WEBPACK_IMPORTED_MODULE_1__.LAST_RENDER_TIME,
  PREVIOUS_STATE: _component_js__WEBPACK_IMPORTED_MODULE_1__.PREVIOUS_STATE,
};



const Renderers = {
  CONTEXT_ID: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.RootNode.CONTEXT_ID,
  FORCE_REFLOW: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.FORCE_REFLOW,
  RootNode: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.RootNode,
  Renderer: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.Renderer,
  RootElement: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.RootElement,
  CommentElement: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.CommentElement,
  NativeElement: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.NativeElement,
  PortalElement: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.PortalElement,
  TextElement: _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__.TextElement,
};






})();

var __webpack_exports__$ = __webpack_exports__.$;
var __webpack_exports__Component = __webpack_exports__.Component;
var __webpack_exports__Components = __webpack_exports__.Components;
var __webpack_exports__Jibs = __webpack_exports__.Jibs;
var __webpack_exports__Renderers = __webpack_exports__.Renderers;
var __webpack_exports__Utils = __webpack_exports__.Utils;
var __webpack_exports__deadbeef = __webpack_exports__.deadbeef;
var __webpack_exports__factory = __webpack_exports__.factory;


//# sourceMappingURL=data:application/json;charset=utf-8;base64,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OztBQUVBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOztBQUVNOztBQUVBO0FBQ1A7QUFDQTs7QUFFQSxVQUFVLHFDQUFRLG1CQUFtQixxQ0FBUTtBQUM3Qzs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxxQ0FBcUMsUUFBUTtBQUM3Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQSxxQ0FBcUMsUUFBUTtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7U0NuYkE7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTs7U0FFQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTs7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTtVQUNBO1VBQ0E7VUFDQTtVQUNBLEdBQUc7VUFDSDtVQUNBO1VBQ0EsQ0FBQzs7Ozs7VUNQRDs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDSWtCOztBQUVYO0FBQ1AsWUFBWTtBQUNaLFdBQVc7QUFDWCxLQUFLO0FBQ0wsS0FBSztBQUNMLFVBQVU7QUFDVixjQUFjO0FBQ2QsaUJBQWlCO0FBQ2pCOztBQWF3Qjs7QUFFakI7QUFDUCxjQUFjO0FBQ2QscUJBQXFCO0FBQ3JCLHFCQUFxQjtBQUNyQixhQUFhO0FBQ2Isb0JBQW9CO0FBQ3BCLHNCQUFzQjtBQUN0QixrQkFBa0I7QUFDbEIsZ0JBQWdCO0FBQ2hCOztBQVc4Qjs7QUFFdkI7QUFDUCxjQUFjLG9FQUFtQjtBQUNqQyxjQUFjO0FBQ2QsVUFBVTtBQUNWLFVBQVU7QUFDVixhQUFhO0FBQ2IsZ0JBQWdCO0FBQ2hCLGVBQWU7QUFDZixlQUFlO0FBQ2YsYUFBYTtBQUNiOztBQUVvQztBQUNXOztBQU03QyIsInNvdXJjZXMiOlsid2VicGFjazovL2ppYnMvLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvY29tcG9uZW50LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvZXZlbnRzLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvamliLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL2NvbW1lbnQtZWxlbWVudC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9pbmRleC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9uYXRpdmUtZWxlbWVudC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9wb3J0YWwtZWxlbWVudC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9yZW5kZXJlci5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9yb290LWVsZW1lbnQuanMiLCJ3ZWJwYWNrOi8vamlicy8uL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL3RleHQtZWxlbWVudC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3V0aWxzLmpzIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vamlicy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vamlicy93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9qaWJzL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vamlicy8uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMiBXeWF0dCBHcmVlbndheVxuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IHRoaXNHbG9iYWwgPSAoKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IGdsb2JhbCkgfHwgdGhpcztcbmNvbnN0IERFQURCRUVGX1JFRl9NQVBfS0VZID0gU3ltYm9sLmZvcignQEBkZWFkYmVlZlJlZk1hcCcpO1xuY29uc3QgVU5JUVVFX0lEX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZVbmlxdWVJRCcpO1xuY29uc3QgcmVmTWFwID0gKHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKSA/IHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldIDogbmV3IFdlYWtNYXAoKTtcbmNvbnN0IGlkSGVscGVycyA9IFtdO1xuXG5pZiAoIXRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKVxuICB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA9IHJlZk1hcDtcblxubGV0IHV1aWRDb3VudGVyID0gMG47XG5cbmZ1bmN0aW9uIGdldEhlbHBlckZvclZhbHVlKHZhbHVlKSB7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkSGVscGVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IHsgaGVscGVyLCBnZW5lcmF0b3IgfSA9IGlkSGVscGVyc1tpXTtcbiAgICBpZiAoaGVscGVyKHZhbHVlKSlcbiAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gYW55dGhpbmdUb0lEKF9hcmcsIF9hbHJlYWR5VmlzaXRlZCkge1xuICBsZXQgYXJnID0gX2FyZztcbiAgaWYgKGFyZyBpbnN0YW5jZW9mIE51bWJlciB8fCBhcmcgaW5zdGFuY2VvZiBTdHJpbmcgfHwgYXJnIGluc3RhbmNlb2YgQm9vbGVhbilcbiAgICBhcmcgPSBhcmcudmFsdWVPZigpO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgYXJnO1xuXG4gIGlmICh0eXBlT2YgPT09ICdudW1iZXInICYmIGFyZyA9PT0gMCkge1xuICAgIGlmIChPYmplY3QuaXMoYXJnLCAtMCkpXG4gICAgICByZXR1cm4gJ251bWJlcjotMCc7XG5cbiAgICByZXR1cm4gJ251bWJlcjorMCc7XG4gIH1cblxuICBpZiAodHlwZU9mID09PSAnc3ltYm9sJylcbiAgICByZXR1cm4gYHN5bWJvbDoke2FyZy50b1N0cmluZygpfWA7XG5cbiAgaWYgKGFyZyA9PSBudWxsIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicgfHwgdHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdiaWdpbnQnKSB7XG4gICAgaWYgKHR5cGVPZiA9PT0gJ251bWJlcicpXG4gICAgICByZXR1cm4gKGFyZyA8IDApID8gYG51bWJlcjoke2FyZ31gIDogYG51bWJlcjorJHthcmd9YDtcblxuICAgIGlmICh0eXBlT2YgPT09ICdiaWdpbnQnICYmIGFyZyA9PT0gMG4pXG4gICAgICByZXR1cm4gJ2JpZ2ludDorMCc7XG5cbiAgICByZXR1cm4gYCR7dHlwZU9mfToke2FyZ31gO1xuICB9XG5cbiAgbGV0IGlkSGVscGVyID0gKGlkSGVscGVycy5sZW5ndGggPiAwICYmIGdldEhlbHBlckZvclZhbHVlKGFyZykpO1xuICBpZiAoaWRIZWxwZXIpXG4gICAgcmV0dXJuIGFueXRoaW5nVG9JRChpZEhlbHBlcihhcmcpKTtcblxuICBpZiAoVU5JUVVFX0lEX1NZTUJPTCBpbiBhcmcgJiYgdHlwZW9mIGFyZ1tVTklRVUVfSURfU1lNQk9MXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uXG4gICAgaWYgKCFfYWxyZWFkeVZpc2l0ZWQgfHwgIV9hbHJlYWR5VmlzaXRlZC5oYXMoYXJnKSkge1xuICAgICAgbGV0IGFscmVhZHlWaXNpdGVkID0gX2FscmVhZHlWaXNpdGVkIHx8IG5ldyBTZXQoKTtcbiAgICAgIGFscmVhZHlWaXNpdGVkLmFkZChhcmcpO1xuICAgICAgcmV0dXJuIGFueXRoaW5nVG9JRChhcmdbVU5JUVVFX0lEX1NZTUJPTF0oKSwgYWxyZWFkeVZpc2l0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghcmVmTWFwLmhhcyhhcmcpKSB7XG4gICAgbGV0IGtleSA9IGAke3R5cGVvZiBhcmd9OiR7Kyt1dWlkQ291bnRlcn1gO1xuICAgIHJlZk1hcC5zZXQoYXJnLCBrZXkpO1xuICAgIHJldHVybiBrZXk7XG4gIH1cblxuICByZXR1cm4gcmVmTWFwLmdldChhcmcpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZigpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGRlYWRiZWVmU29ydGVkKCkge1xuICBsZXQgcGFydHMgPSBbIGFyZ3VtZW50cy5sZW5ndGggXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgcGFydHMucHVzaChhbnl0aGluZ1RvSUQoYXJndW1lbnRzW2ldKSk7XG5cbiAgcmV0dXJuIHBhcnRzLnNvcnQoKS5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSURGb3IoaGVscGVyLCBnZW5lcmF0b3IpIHtcbiAgaWRIZWxwZXJzLnB1c2goeyBoZWxwZXIsIGdlbmVyYXRvciB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSURHZW5lcmF0b3IoaGVscGVyKSB7XG4gIGxldCBpbmRleCA9IGlkSGVscGVycy5maW5kSW5kZXgoKGl0ZW0pID0+IChpdGVtLmhlbHBlciA9PT0gaGVscGVyKSk7XG4gIGlmIChpbmRleCA8IDApXG4gICAgcmV0dXJuO1xuXG4gIGlkSGVscGVycy5zcGxpY2UoaW5kZXgsIDEpO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhkZWFkYmVlZiwge1xuICAnaWRTeW0nOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgVU5JUVVFX0lEX1NZTUJPTCxcbiAgfSxcbiAgJ3NvcnRlZCc6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICBkZWFkYmVlZlNvcnRlZCxcbiAgfSxcbiAgJ2dlbmVyYXRlSURGb3InOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZ2VuZXJhdGVJREZvcixcbiAgfSxcbiAgJ3JlbW92ZUlER2VuZXJhdG9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIHJlbW92ZUlER2VuZXJhdG9yLFxuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGVhZGJlZWY7XG4iLCIvKiBnbG9iYWwgQnVmZmVyICovXG5cbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJy4vZXZlbnRzLmpzJztcbmltcG9ydCAqIGFzIFV0aWxzICAgICAgIGZyb20gJy4vdXRpbHMuanMnO1xuaW1wb3J0IHtcbiAgaXNKaWJpc2gsXG4gIHJlc29sdmVDaGlsZHJlbixcbiAgY29uc3RydWN0SmliLFxufSBmcm9tICcuL2ppYi5qcyc7XG5cbmV4cG9ydCBjb25zdCBVUERBVEVfRVZFTlQgICAgICAgICAgICAgID0gJ0BqaWJzL2NvbXBvbmVudC9ldmVudC91cGRhdGUnO1xuZXhwb3J0IGNvbnN0IFFVRVVFX1VQREFURV9NRVRIT0QgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcXVldWVVcGRhdGUnKTtcbmV4cG9ydCBjb25zdCBGTFVTSF9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2ZsdXNoVXBkYXRlJyk7XG5leHBvcnQgY29uc3QgSU5JVF9NRVRIT0QgICAgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9fX2luaXQnKTtcbmV4cG9ydCBjb25zdCBTS0lQX1NUQVRFX1VQREFURVMgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3NraXBTdGF0ZVVwZGF0ZXMnKTtcbmV4cG9ydCBjb25zdCBQRU5ESU5HX1NUQVRFX1VQREFURSAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3BlbmRpbmdTdGF0ZVVwZGF0ZScpO1xuZXhwb3J0IGNvbnN0IExBU1RfUkVOREVSX1RJTUUgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvbGFzdFJlbmRlclRpbWUnKTtcbmV4cG9ydCBjb25zdCBQUkVWSU9VU19TVEFURSAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3ByZXZpb3VzU3RhdGUnKTtcbmV4cG9ydCBjb25zdCBDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3ByZXZpb3VzU3RhdGUnKTtcblxuY29uc3QgZWxlbWVudERhdGFDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgTmFOKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCb29sZWFuIHx8IHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBsZXQgdHlwZU9mID0gdHlwZW9mIHZhbHVlO1xuICBpZiAodHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdudW1iZXInIHx8IHR5cGVPZiA9PT0gJ2Jvb2xlYW4nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgQnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiBCdWZmZXIuaXNCdWZmZXIodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIHN0YXRpYyBVUERBVEVfRVZFTlQgPSBVUERBVEVfRVZFTlQ7XG5cbiAgW1FVRVVFX1VQREFURV9NRVRIT0RdKCkge1xuICAgIGlmICh0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0udGhlbih0aGlzW0ZMVVNIX1VQREFURV9NRVRIT0RdLmJpbmQodGhpcykpO1xuICB9XG5cbiAgW0ZMVVNIX1VQREFURV9NRVRIT0RdKCkge1xuICAgIC8vIFdhcyB0aGUgc3RhdGUgdXBkYXRlIGNhbmNlbGxlZD9cbiAgICBpZiAoIXRoaXNbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5lbWl0KFVQREFURV9FVkVOVCk7XG5cbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSA9IG51bGw7XG4gIH1cblxuICBbSU5JVF9NRVRIT0RdKCkge1xuICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IGZhbHNlO1xuICB9XG5cbiAgY29uc3RydWN0b3IoX2ppYikge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvLyBCaW5kIGFsbCBjbGFzcyBtZXRob2RzIHRvIFwidGhpc1wiXG4gICAgVXRpbHMuYmluZE1ldGhvZHMuY2FsbCh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG5cbiAgICBsZXQgamliID0gX2ppYiB8fCB7fTtcblxuICAgIGNvbnN0IGNyZWF0ZU5ld1N0YXRlID0gKCkgPT4ge1xuICAgICAgbGV0IGxvY2FsU3RhdGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgICByZXR1cm4gbmV3IFByb3h5KGxvY2FsU3RhdGUsIHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBwcm9wTmFtZSkgPT4ge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgIGxldCBjdXJyZW50VmFsdWUgPSB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUgPT09IHZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICBpZiAoIXRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSlcbiAgICAgICAgICAgIHRoaXNbUVVFVUVfVVBEQVRFX01FVEhPRF0oKTtcblxuICAgICAgICAgIHRhcmdldFtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLm9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCB2YWx1ZSwgY3VycmVudFZhbHVlKTtcblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxldCBwcm9wcyAgICAgICA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSwgamliLnByb3BzIHx8IHt9KTtcbiAgICBsZXQgX2xvY2FsU3RhdGUgPSBjcmVhdGVOZXdTdGF0ZSgpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW1NLSVBfU1RBVEVfVVBEQVRFU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBbUEVORElOR19TVEFURV9VUERBVEVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgW0xBU1RfUkVOREVSX1RJTUVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFV0aWxzLm5vdygpLFxuICAgICAgfSxcbiAgICAgIFtDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0sXG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmlkLFxuICAgICAgfSxcbiAgICAgICdwcm9wcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcHJvcHMsXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuY2hpbGRyZW4gfHwgW10sXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5jb250ZXh0IHx8IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgICB9LFxuICAgICAgJ3N0YXRlJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBfbG9jYWxTdGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduKF9sb2NhbFN0YXRlLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIHJlc29sdmVDaGlsZHJlbi5jYWxsKHRoaXMsIGNoaWxkcmVuKTtcbiAgfVxuXG4gIGlzSmliKHZhbHVlKSB7XG4gICAgcmV0dXJuIGlzSmliaXNoKHZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICAgIHJldHVybiBjb25zdHJ1Y3RKaWIodmFsdWUpO1xuICB9XG5cbiAgcHVzaFJlbmRlcihyZW5kZXJSZXN1bHQpIHtcbiAgICB0aGlzLmVtaXQoVVBEQVRFX0VWRU5ULCByZW5kZXJSZXN1bHQpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uUHJvcFVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCBuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgfVxuXG4gIGNhcHR1cmVSZWZlcmVuY2UobmFtZSwgaW50ZXJjZXB0b3JDYWxsYmFjaykge1xuICAgIGxldCBtZXRob2QgPSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdW25hbWVdO1xuICAgIGlmIChtZXRob2QpXG4gICAgICByZXR1cm4gbWV0aG9kO1xuXG4gICAgbWV0aG9kID0gKF9yZWYsIHByZXZpb3VzUmVmKSA9PiB7XG4gICAgICBsZXQgcmVmID0gX3JlZjtcblxuICAgICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZWYgPSBpbnRlcmNlcHRvckNhbGxiYWNrLmNhbGwodGhpcywgcmVmLCBwcmV2aW91c1JlZik7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICAgW25hbWVdOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgcmVmLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgaW50ZXJjZXB0b3JDYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU10gPSBtZXRob2Q7XG5cbiAgICByZXR1cm4gbWV0aG9kO1xuICB9XG5cbiAgZm9yY2VVcGRhdGUoKSB7XG4gICAgdGhpc1tRVUVVRV9VUERBVEVfTUVUSE9EXSgpO1xuICB9XG5cbiAgZ2V0U3RhdGUocHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIHN0YXRlO1xuXG4gICAgaWYgKFV0aWxzLmluc3RhbmNlT2YocHJvcGVydHlQYXRoLCAnb2JqZWN0JykpIHtcbiAgICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKHByb3BlcnR5UGF0aCkuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocHJvcGVydHlQYXRoKSk7XG4gICAgICBsZXQgZmluYWxTdGF0ZSAgPSB7fTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIGxldCBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBsZXQgWyB2YWx1ZSwgbGFzdFBhcnQgXSA9IFV0aWxzLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBrZXksIHByb3BlcnR5UGF0aFtrZXldLCB0cnVlKTtcbiAgICAgICAgaWYgKGxhc3RQYXJ0ID09IG51bGwpXG4gICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgZmluYWxTdGF0ZVtsYXN0UGFydF0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpbmFsU3RhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBVdGlscy5mZXRjaERlZXBQcm9wZXJ0eShzdGF0ZSwgcHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHNldFN0YXRlKHZhbHVlKSB7XG4gICAgaWYgKCFpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgXCJ0aGlzLnNldFN0YXRlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnN0YXRlLCB2YWx1ZSk7XG4gIH1cblxuICBzZXRTdGF0ZVBhc3NpdmUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVQYXNzaXZlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IHRydWU7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBkZWxldGUgdGhpcy5zdGF0ZTtcbiAgICBkZWxldGUgdGhpcy5wcm9wcztcbiAgICBkZWxldGUgdGhpcy5jb250ZXh0O1xuICAgIGRlbGV0ZSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdO1xuICAgIHRoaXMuY2xlYXJBbGxEZWJvdW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcldhaXRpbmcoKSB7XG4gIH1cblxuICByZW5kZXIoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICB1cGRhdGVkKCkge1xuICB9XG5cbiAgY29tYmluZVdpdGgoc2VwLCAuLi5hcmdzKSB7XG4gICAgbGV0IGZpbmFsQXJncyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmdzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xuICAgICAgaWYgKCFhcmcpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihhcmcsICdzdHJpbmcnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLnNwbGl0KHNlcCkuZmlsdGVyKFV0aWxzLmlzTm90RW1wdHkpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgbGV0IHZhbHVlcyA9IGFyZy5maWx0ZXIoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgIGlmICghVXRpbHMuaW5zdGFuY2VPZih2YWx1ZSwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgcmV0dXJuIFV0aWxzLmlzTm90RW1wdHkodmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChVdGlscy5pbnN0YW5jZU9mKGFyZywgJ29iamVjdCcpKSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMoYXJnKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IGtleSAgID0ga2V5c1tpXTtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBhcmdba2V5XTtcblxuICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIGZpbmFsQXJncy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZpbmFsQXJncy5hZGQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKGZpbmFsQXJncykuam9pbihzZXAgfHwgJycpO1xuICB9XG5cbiAgY2xhc3NlcyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tYmluZVdpdGgoJyAnLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGV4dHJhY3RDaGlsZHJlbihfcGF0dGVybnMsIGNoaWxkcmVuKSB7XG4gICAgbGV0IGV4dHJhY3RlZCA9IHt9O1xuICAgIGxldCBwYXR0ZXJucyAgPSBfcGF0dGVybnM7XG4gICAgbGV0IGlzQXJyYXkgICA9IEFycmF5LmlzQXJyYXkocGF0dGVybnMpO1xuXG4gICAgY29uc3QgaXNNYXRjaCA9IChqaWIpID0+IHtcbiAgICAgIGxldCBqaWJUeXBlID0gamliLlR5cGU7XG4gICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihqaWJUeXBlLCAnc3RyaW5nJykpXG4gICAgICAgIGppYlR5cGUgPSBqaWJUeXBlLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgIGlmIChpc0FycmF5KSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHBhdHRlcm5zLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQgcGF0dGVybiA9IHBhdHRlcm5zW2ldO1xuICAgICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKHBhdHRlcm4sICdzdHJpbmcnKSlcbiAgICAgICAgICAgIHBhdHRlcm4gPSBwYXR0ZXJuLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICBpZiAoamliVHlwZSA9PT0gcGF0dGVybikge1xuICAgICAgICAgICAgZXh0cmFjdGVkW3BhdHRlcm5dID0gamliO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhdHRlcm5zKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IGtleSAgICAgPSBrZXlzW2ldO1xuICAgICAgICAgIGxldCBwYXR0ZXJuID0gcGF0dGVybnNba2V5XTtcbiAgICAgICAgICBsZXQgcmVzdWx0O1xuXG4gICAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2YocGF0dGVybiwgUmVnRXhwKSlcbiAgICAgICAgICAgIHJlc3VsdCA9IHBhdHRlcm4udGVzdChqaWJUeXBlKTtcbiAgICAgICAgICBlbHNlIGlmIChVdGlscy5pbnN0YW5jZU9mKHBhdHRlcm4sICdzdHJpbmcnKSlcbiAgICAgICAgICAgIHJlc3VsdCA9IChwYXR0ZXJuLnRvTG93ZXJDYXNlKCkgPT09IGppYlR5cGUpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc3VsdCA9IChwYXR0ZXJuID09PSBqaWJUeXBlKTtcblxuICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZFtrZXldID0gamliO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgZXh0cmFjdGVkLnJlbWFpbmluZ0NoaWxkcmVuID0gY2hpbGRyZW4uZmlsdGVyKChqaWIpID0+ICFpc01hdGNoKGppYikpO1xuICAgIHJldHVybiBleHRyYWN0ZWQ7XG4gIH1cblxuICBkZWJvdW5jZShmdW5jLCB0aW1lLCBfaWQpIHtcbiAgICBjb25zdCBjbGVhclBlbmRpbmdUaW1lb3V0ID0gKCkgPT4ge1xuICAgICAgaWYgKHBlbmRpbmdUaW1lciAmJiBwZW5kaW5nVGltZXIudGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVyLnRpbWVvdXQpO1xuICAgICAgICBwZW5kaW5nVGltZXIudGltZW91dCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBpZCA9ICghX2lkKSA/ICgnJyArIGZ1bmMpIDogX2lkO1xuICAgIGlmICghdGhpcy5kZWJvdW5jZVRpbWVycykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdkZWJvdW5jZVRpbWVycycsIHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF07XG4gICAgaWYgKCFwZW5kaW5nVGltZXIpXG4gICAgICBwZW5kaW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzW2lkXSA9IHt9O1xuXG4gICAgcGVuZGluZ1RpbWVyLmZ1bmMgPSBmdW5jO1xuICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcblxuICAgIHZhciBwcm9taXNlID0gcGVuZGluZ1RpbWVyLnByb21pc2U7XG4gICAgaWYgKCFwcm9taXNlIHx8ICFwcm9taXNlLnBlbmRpbmcoKSkge1xuICAgICAgbGV0IHN0YXR1cyA9ICdwZW5kaW5nJztcbiAgICAgIGxldCByZXNvbHZlO1xuXG4gICAgICBwcm9taXNlID0gcGVuZGluZ1RpbWVyLnByb21pc2UgPSBuZXcgUHJvbWlzZSgoX3Jlc29sdmUpID0+IHtcbiAgICAgICAgcmVzb2x2ZSA9IF9yZXNvbHZlO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UucmVzb2x2ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gJ3BlbmRpbmcnKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBzdGF0dXMgPSAnZnVsZmlsbGVkJztcbiAgICAgICAgY2xlYXJQZW5kaW5nVGltZW91dCgpO1xuICAgICAgICB0aGlzLmRlYm91bmNlVGltZXJzW2lkXSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBwZW5kaW5nVGltZXIuZnVuYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHZhciByZXQgPSBwZW5kaW5nVGltZXIuZnVuYy5jYWxsKHRoaXMpO1xuICAgICAgICAgIGlmIChyZXQgaW5zdGFuY2VvZiBQcm9taXNlIHx8IChyZXQgJiYgdHlwZW9mIHJldC50aGVuID09PSAnZnVuY3Rpb24nKSlcbiAgICAgICAgICAgIHJldC50aGVuKCh2YWx1ZSkgPT4gcmVzb2x2ZSh2YWx1ZSkpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc29sdmUocmV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICBzdGF0dXMgPSAncmVqZWN0ZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBwcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuaXNQZW5kaW5nID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gKHN0YXR1cyA9PT0gJ3BlbmRpbmcnKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcGVuZGluZ1RpbWVyLnRpbWVvdXQgPSBzZXRUaW1lb3V0KHByb21pc2UucmVzb2x2ZSwgKHRpbWUgPT0gbnVsbCkgPyAyNTAgOiB0aW1lKTtcblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgY2xlYXJEZWJvdW5jZShpZCkge1xuICAgIHZhciBwZW5kaW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzW2lkXTtcbiAgICBpZiAocGVuZGluZ1RpbWVyID09IG51bGwpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAocGVuZGluZ1RpbWVyLnRpbWVvdXQpXG4gICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVyLnRpbWVvdXQpO1xuXG4gICAgaWYgKHBlbmRpbmdUaW1lci5wcm9taXNlKVxuICAgICAgcGVuZGluZ1RpbWVyLnByb21pc2UuY2FuY2VsKCk7XG4gIH1cblxuICBjbGVhckFsbERlYm91bmNlcygpIHtcbiAgICBsZXQgZGVib3VuY2VUaW1lcnMgID0gdGhpcy5kZWJvdW5jZVRpbWVycyB8fCB7fTtcbiAgICBsZXQgaWRzICAgICAgICAgICAgID0gT2JqZWN0LmtleXMoZGVib3VuY2VUaW1lcnMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gaWRzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgICB0aGlzLmNsZWFyRGVib3VuY2UoaWRzW2ldKTtcbiAgfVxuXG4gIGdldEVsZW1lbnREYXRhKGVsZW1lbnQpIHtcbiAgICBsZXQgZGF0YSA9IGVsZW1lbnREYXRhQ2FjaGUuZ2V0KGVsZW1lbnQpO1xuICAgIGlmICghZGF0YSkge1xuICAgICAgZGF0YSA9IHt9O1xuICAgICAgZWxlbWVudERhdGFDYWNoZS5zZXQoZWxlbWVudCwgZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cbn1cbiIsImNvbnN0IEVWRU5UX0xJU1RFTkVSUyA9IFN5bWJvbC5mb3IoJ0BqaWJzL2V2ZW50cy9saXN0ZW5lcnMnKTtcblxuZXhwb3J0IGNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgIFtFVkVOVF9MSVNURU5FUlNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbmV3IE1hcCgpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXZlbnQgbGlzdGVuZXIgbXVzdCBiZSBhIG1ldGhvZCcpO1xuXG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG5cbiAgICBpZiAoIXNjb3BlKSB7XG4gICAgICBzY29wZSA9IFtdO1xuICAgICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgc2NvcGUpO1xuICAgIH1cblxuICAgIHNjb3BlLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V2ZW50IGxpc3RlbmVyIG11c3QgYmUgYSBtZXRob2QnKTtcblxuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGxldCBpbmRleCA9IHNjb3BlLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKVxuICAgICAgc2NvcGUuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgaWYgKCFldmVudE1hcC5oYXMoZXZlbnROYW1lKSlcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgW10pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBlbWl0KGV2ZW50TmFtZSwgLi4uYXJncykge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUgfHwgc2NvcGUubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gc2NvcGUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGV2ZW50Q2FsbGJhY2sgPSBzY29wZVtpXTtcbiAgICAgIGV2ZW50Q2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvbmNlKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBsZXQgZnVuYyA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLm9mZihldmVudE5hbWUsIGZ1bmMpO1xuICAgICAgcmV0dXJuIGxpc3RlbmVyKC4uLmFyZ3MpO1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5vbihldmVudE5hbWUsIGZ1bmMpO1xuICB9XG5cbiAgb24oZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgb2ZmKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIGV2ZW50TmFtZXMoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpc1tFVkVOVF9MSVNURU5FUlNdLmtleXMoKSk7XG4gIH1cblxuICBsaXN0ZW5lckNvdW50KGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gMDtcblxuICAgIHJldHVybiBzY29wZS5sZW5ndGg7XG4gIH1cblxuICBsaXN0ZW5lcnMoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiBbXTtcblxuICAgIHJldHVybiBzY29wZS5zbGljZSgpO1xuICB9XG59XG4iLCJpbXBvcnQgZGVhZGJlZWYgZnJvbSAnZGVhZGJlZWYnO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi91dGlscy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBKaWIge1xuICBjb25zdHJ1Y3RvcihUeXBlLCBwcm9wcywgY2hpbGRyZW4pIHtcbiAgICBsZXQgZGVmYXVsdFByb3BzID0gKFR5cGUgJiYgVHlwZS5wcm9wcykgPyBUeXBlLnByb3BzIDoge307XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnVHlwZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBUeXBlLFxuICAgICAgfSxcbiAgICAgICdwcm9wcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7IC4uLmRlZmF1bHRQcm9wcywgLi4uKHByb3BzIHx8IHt9KSB9LFxuICAgICAgfSxcbiAgICAgICdjaGlsZHJlbic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBVdGlscy5mbGF0dGVuQXJyYXkoY2hpbGRyZW4pLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgSklCX0JBUlJFTiAgPSBTeW1ib2wuZm9yKCdAamlicy5iYXJyZW4nKTtcbmV4cG9ydCBjb25zdCBKSUJfUFJPWFkgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLnByb3h5Jyk7XG5leHBvcnQgY29uc3QgSklCICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy5qaWInKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGZhY3RvcnkoSmliQ2xhc3MpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICQoX3R5cGUsIHByb3BzID0ge30pIHtcbiAgICBpZiAoaXNKaWJpc2goX3R5cGUpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVjZWl2ZWQgYSBqaWIgYnV0IGV4cGVjdGVkIGEgY29tcG9uZW50LicpO1xuXG4gICAgbGV0IFR5cGUgPSAoX3R5cGUgPT0gbnVsbCkgPyBKSUJfUFJPWFkgOiBfdHlwZTtcblxuICAgIGZ1bmN0aW9uIGJhcnJlbiguLi5fY2hpbGRyZW4pIHtcbiAgICAgIGxldCBjaGlsZHJlbiA9IF9jaGlsZHJlbjtcblxuICAgICAgZnVuY3Rpb24gamliKCkge1xuICAgICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihUeXBlLCAncHJvbWlzZScpIHx8IGNoaWxkcmVuLnNvbWUoKGNoaWxkKSA9PiBVdGlscy5pbnN0YW5jZU9mKGNoaWxkLCAncHJvbWlzZScpKSkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbIFR5cGUgXS5jb25jYXQoY2hpbGRyZW4pKS50aGVuKChhbGwpID0+IHtcbiAgICAgICAgICAgIFR5cGUgPSBhbGxbMF07XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGFsbC5zbGljZSgxKTtcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBKaWJDbGFzcyhcbiAgICAgICAgICAgICAgVHlwZSxcbiAgICAgICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgSmliQ2xhc3MoXG4gICAgICAgICAgVHlwZSxcbiAgICAgICAgICBwcm9wcyxcbiAgICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoamliLCB7XG4gICAgICAgIFtKSUJdOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBbZGVhZGJlZWYuaWRTeW1dOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICAoKSA9PiBUeXBlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBqaWI7XG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoYmFycmVuLCB7XG4gICAgICBbSklCX0JBUlJFTl06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgfSxcbiAgICAgIFtkZWFkYmVlZi5pZFN5bV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICAoKSA9PiBUeXBlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBiYXJyZW47XG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCAkID0gZmFjdG9yeShKaWIpO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNKaWJpc2godmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiAodmFsdWVbSklCX0JBUlJFTl0gfHwgdmFsdWVbSklCXSkpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSmliKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBKaWIpXG4gICAgcmV0dXJuIHZhbHVlO1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAodmFsdWVbSklCX0JBUlJFTl0pXG4gICAgICByZXR1cm4gdmFsdWUoKSgpO1xuICAgIGVsc2UgaWYgKHZhbHVlW0pJQl0pXG4gICAgICByZXR1cm4gdmFsdWUoKTtcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ2NvbnN0cnVjdEppYjogUHJvdmlkZWQgdmFsdWUgaXMgbm90IGEgSmliLicpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUNoaWxkcmVuKF9jaGlsZHJlbikge1xuICBsZXQgY2hpbGRyZW4gPSBfY2hpbGRyZW47XG5cbiAgaWYgKFV0aWxzLmluc3RhbmNlT2YoY2hpbGRyZW4sICdwcm9taXNlJykpXG4gICAgY2hpbGRyZW4gPSBhd2FpdCBjaGlsZHJlbjtcblxuICBpZiAoISgodGhpcy5pc0l0ZXJhYmxlQ2hpbGQgfHwgVXRpbHMuaXNJdGVyYWJsZUNoaWxkKS5jYWxsKHRoaXMsIGNoaWxkcmVuKSkgJiYgKGlzSmliaXNoKGNoaWxkcmVuKSB8fCAoKHRoaXMuaXNWYWxpZENoaWxkIHx8IFV0aWxzLmlzVmFsaWRDaGlsZCkuY2FsbCh0aGlzLCBjaGlsZHJlbikpKSlcbiAgICBjaGlsZHJlbiA9IFsgY2hpbGRyZW4gXTtcblxuICBsZXQgcHJvbWlzZXMgPSBVdGlscy5pdGVyYXRlKGNoaWxkcmVuLCBhc3luYyAoeyB2YWx1ZTogX2NoaWxkIH0pID0+IHtcbiAgICBsZXQgY2hpbGQgPSAoVXRpbHMuaW5zdGFuY2VPZihfY2hpbGQsICdwcm9taXNlJykpID8gYXdhaXQgX2NoaWxkIDogX2NoaWxkO1xuXG4gICAgaWYgKGlzSmliaXNoKGNoaWxkKSlcbiAgICAgIHJldHVybiBhd2FpdCBjb25zdHJ1Y3RKaWIoY2hpbGQpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBjaGlsZDtcbiAgfSk7XG5cbiAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbn1cbiIsImltcG9ydCB7IFJvb3RFbGVtZW50IH0gZnJvbSAnLi9yb290LWVsZW1lbnQuanMnO1xuXG5leHBvcnQgY2xhc3MgQ29tbWVudEVsZW1lbnQgZXh0ZW5kcyBSb290RWxlbWVudCB7XG4gIHN0YXRpYyBUWVBFID0gUm9vdEVsZW1lbnQuVFlQRV9DT01NRU5UO1xuXG4gIGNvbnN0cnVjdG9yKGlkLCB2YWx1ZSwgcHJvcHMpIHtcbiAgICBzdXBlcihSb290RWxlbWVudC5UWVBFX0NPTU1FTlQsIGlkLCB2YWx1ZSwgcHJvcHMpO1xuICB9XG59XG4iLCJleHBvcnQge1xuICBDT05URVhUX0lELFxuICBSb290Tm9kZSxcbn0gZnJvbSAnLi9yb290LW5vZGUuanMnO1xuXG5leHBvcnQgY29uc3QgRk9SQ0VfUkVGTE9XID0gU3ltYm9sLmZvcignQGppYnNGb3JjZVJlZmxvdycpO1xuXG5leHBvcnQgeyBSZW5kZXJlciB9IGZyb20gJy4vcmVuZGVyZXIuanMnO1xuXG5leHBvcnQgeyBSb290RWxlbWVudCB9IGZyb20gJy4vcm9vdC1lbGVtZW50LmpzJztcbmV4cG9ydCB7IENvbW1lbnRFbGVtZW50IH0gZnJvbSAnLi9jb21tZW50LWVsZW1lbnQuanMnO1xuZXhwb3J0IHsgTmF0aXZlRWxlbWVudCB9IGZyb20gJy4vbmF0aXZlLWVsZW1lbnQuanMnO1xuZXhwb3J0IHsgUG9ydGFsRWxlbWVudCB9IGZyb20gJy4vcG9ydGFsLWVsZW1lbnQuanMnO1xuZXhwb3J0IHsgVGV4dEVsZW1lbnQgfSBmcm9tICcuL3RleHQtZWxlbWVudC5qcyc7XG4iLCJpbXBvcnQgeyBSb290RWxlbWVudCB9IGZyb20gJy4vcm9vdC1lbGVtZW50LmpzJztcblxuZXhwb3J0IGNsYXNzIE5hdGl2ZUVsZW1lbnQgZXh0ZW5kcyBSb290RWxlbWVudCB7XG4gIHN0YXRpYyBUWVBFID0gUm9vdEVsZW1lbnQuVFlQRV9FTEVNRU5UO1xuXG4gIGNvbnN0cnVjdG9yKGlkLCB2YWx1ZSwgcHJvcHMpIHtcbiAgICBzdXBlcihSb290RWxlbWVudC5UWVBFX0VMRU1FTlQsIGlkLCB2YWx1ZSwgcHJvcHMpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBSb290RWxlbWVudCB9IGZyb20gJy4vcm9vdC1lbGVtZW50LmpzJztcblxuZXhwb3J0IGNsYXNzIFBvcnRhbEVsZW1lbnQgZXh0ZW5kcyBSb290RWxlbWVudCB7XG4gIHN0YXRpYyBUWVBFID0gUm9vdEVsZW1lbnQuVFlQRV9QT1JUQUw7XG5cbiAgY29uc3RydWN0b3IoaWQsIHZhbHVlLCBwcm9wcykge1xuICAgIHN1cGVyKFJvb3RFbGVtZW50LlRZUEVfUE9SVEFMLCBpZCwgdmFsdWUsIHByb3BzKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi4vZXZlbnRzLmpzJztcbmltcG9ydCAqIGFzIFV0aWxzICAgICAgIGZyb20gJy4uL3V0aWxzLmpzJztcbmltcG9ydCB7XG4gIENPTlRFWFRfSUQsXG4gIFJvb3ROb2RlLFxufSBmcm9tICcuL3Jvb3Qtbm9kZS5qcyc7XG5cbmxldCBfY29udGV4dElEQ291bnRlciA9IDBuO1xuXG5leHBvcnQgY2xhc3MgUmVuZGVyZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBzdGF0aWMgUm9vdE5vZGUgPSBSb290Tm9kZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHRoaXMuY3JlYXRlQ29udGV4dCgpLFxuICAgICAgfSxcbiAgICAgICdkZXN0cm95aW5nJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBmYWxzZSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyRnJhbWUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIDAsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgY3JlYXRlQ29udGV4dChyb290Q29udGV4dCwgb25VcGRhdGUsIG9uVXBkYXRlVGhpcykge1xuICAgIGxldCBjb250ZXh0ICAgICA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IG15Q29udGV4dElEID0gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W0NPTlRFWFRfSURdIDogMW47XG5cbiAgICByZXR1cm4gbmV3IFByb3h5KGNvbnRleHQsIHtcbiAgICAgIGdldDogKHRhcmdldCwgcHJvcE5hbWUpID0+IHtcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSBDT05URVhUX0lEKSB7XG4gICAgICAgICAgbGV0IHBhcmVudElEID0gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W0NPTlRFWFRfSURdIDogMW47XG4gICAgICAgICAgcmV0dXJuIChwYXJlbnRJRCA+IG15Q29udGV4dElEKSA/IHBhcmVudElEIDogbXlDb250ZXh0SUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIHByb3BOYW1lKSlcbiAgICAgICAgICByZXR1cm4gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W3Byb3BOYW1lXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgIH0sXG4gICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAocHJvcE5hbWUgPT09IENPTlRFWFRfSUQpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgaWYgKHRhcmdldFtwcm9wTmFtZV0gPT09IHZhbHVlKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIG15Q29udGV4dElEID0gKytfY29udGV4dElEQ291bnRlcjtcbiAgICAgICAgdGFyZ2V0W3Byb3BOYW1lXSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb25VcGRhdGUgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgb25VcGRhdGUuY2FsbChvblVwZGF0ZVRoaXMsIG9uVXBkYXRlVGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iLCJcbmNvbnN0IFRZUEVfRUxFTUVOVCAgPSAxO1xuY29uc3QgVFlQRV9URVhUICAgICA9IDM7XG5jb25zdCBUWVBFX0NPTU1FTlQgID0gODtcbmNvbnN0IFRZUEVfUE9SVEFMICAgPSAxNTtcblxuZXhwb3J0IGNsYXNzIFJvb3RFbGVtZW50IHtcbiAgc3RhdGljIFRZUEVfRUxFTUVOVCAgPSBUWVBFX0VMRU1FTlQ7XG5cbiAgc3RhdGljIFRZUEVfVEVYVCAgICAgPSBUWVBFX1RFWFQ7XG5cbiAgc3RhdGljIFRZUEVfQ09NTUVOVCAgPSBUWVBFX0NPTU1FTlQ7XG5cbiAgc3RhdGljIFRZUEVfUE9SVEFMICAgPSBUWVBFX1BPUlRBTDtcblxuICBjb25zdHJ1Y3Rvcih0eXBlLCBpZCwgdmFsdWUsIHByb3BzKSB7XG4gICAgdGhpcy5pc0ppYnNWaXJ0dWFsRWxlbWVudCA9IHRydWU7XG4gICAgdGhpcy50eXBlICAgPSB0eXBlO1xuICAgIHRoaXMuaWQgICAgID0gaWQ7XG4gICAgdGhpcy52YWx1ZSAgPSB2YWx1ZTtcbiAgICB0aGlzLnByb3BzICA9IHByb3BzIHx8IHt9O1xuICB9XG59XG4iLCJpbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi91dGlscy5qcyc7XG5cbmV4cG9ydCBjb25zdCBDT05URVhUX0lEID0gU3ltYm9sLmZvcignQGppYnMvbm9kZS9jb250ZXh0SUQnKTtcblxubGV0IHV1aWQgPSAxO1xuXG5leHBvcnQgY2xhc3MgUm9vdE5vZGUge1xuICBzdGF0aWMgQ09OVEVYVF9JRCA9IENPTlRFWFRfSUQ7XG5cbiAgY29uc3RydWN0b3IocmVuZGVyZXIsIHBhcmVudCwgX2NvbnRleHQpIHtcbiAgICBsZXQgY29udGV4dCA9IHJlbmRlcmVyLmNyZWF0ZUNvbnRleHQoXG4gICAgICBfY29udGV4dCxcbiAgICAgICh0aGlzLm9uQ29udGV4dFVwZGF0ZSkgPyB0aGlzLm9uQ29udGV4dFVwZGF0ZSA6IHVuZGVmaW5lZCxcbiAgICAgIHRoaXMsXG4gICAgKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdpZCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB1dWlkKyssXG4gICAgICB9LFxuICAgICAgJ3JlbmRlcmVyJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICByZW5kZXJlcixcbiAgICAgIH0sXG4gICAgICAncGFyZW50Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBwYXJlbnQsXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogICAgICAgICAgKCkgPT4ge30sXG4gICAgICB9LFxuICAgICAgJ3JlbmRlclByb21pc2UnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ2Rlc3Ryb3lpbmcnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGZhbHNlLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJGcmFtZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgMCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgfVxuXG4gIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICAgIHJldHVybiBVdGlscy5pc1ZhbGlkQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gICAgcmV0dXJuIFV0aWxzLmlzSXRlcmFibGVDaGlsZChjaGlsZCk7XG4gIH1cblxuICBwcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKSB7XG4gICAgcmV0dXJuIFV0aWxzLnByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpO1xuICB9XG5cbiAgY2hpbGRyZW5EaWZmZXIob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKSB7XG4gICAgcmV0dXJuIFV0aWxzLmNoaWxkcmVuRGlmZmVyKG9sZENoaWxkcmVuLCBuZXdDaGlsZHJlbik7XG4gIH1cblxuICBhc3luYyByZW5kZXIoamliLCByZW5kZXJDb250ZXh0KSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMucmVuZGVyRnJhbWUrKztcblxuICAgIHJldHVybiB0aGlzLl9yZW5kZXIoamliLCByZW5kZXJDb250ZXh0KVxuICAgICAgLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJQcm9taXNlID0gbnVsbDtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgUm9vdEVsZW1lbnQgfSBmcm9tICcuL3Jvb3QtZWxlbWVudC5qcyc7XG5cbmV4cG9ydCBjbGFzcyBUZXh0RWxlbWVudCBleHRlbmRzIFJvb3RFbGVtZW50IHtcbiAgc3RhdGljIFRZUEUgPSBSb290RWxlbWVudC5UWVBFX1RFWFQ7XG5cbiAgY29uc3RydWN0b3IoaWQsIHZhbHVlLCBwcm9wcykge1xuICAgIHN1cGVyKFJvb3RFbGVtZW50LlRZUEVfVEVYVCwgaWQsIHZhbHVlLCBwcm9wcyk7XG4gIH1cbn1cbiIsImltcG9ydCBkZWFkYmVlZiBmcm9tICdkZWFkYmVlZic7XG5cbmNvbnN0IFNUT1AgPSBTeW1ib2wuZm9yKCdAamlic0l0ZXJhdGVTdG9wJyk7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXN0ZWQtdGVybmFyeVxuY29uc3QgZ2xvYmFsU2NvcGUgPSAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpID8gZ2xvYmFsIDogKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHRoaXM7XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW5jZU9mKG9iaikge1xuICBmdW5jdGlvbiB0ZXN0VHlwZShvYmosIF92YWwpIHtcbiAgICBmdW5jdGlvbiBpc0RlZmVycmVkVHlwZShvYmopIHtcbiAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBQcm9taXNlIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdQcm9taXNlJykpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAvLyBRdWFjayBxdWFjay4uLlxuICAgICAgaWYgKHR5cGVvZiBvYmoudGhlbiA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLmNhdGNoID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCB2YWwgICAgID0gX3ZhbDtcbiAgICBsZXQgdHlwZU9mICA9ICh0eXBlb2Ygb2JqKTtcblxuICAgIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlN0cmluZylcbiAgICAgIHZhbCA9ICdzdHJpbmcnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuTnVtYmVyKVxuICAgICAgdmFsID0gJ251bWJlcic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5Cb29sZWFuKVxuICAgICAgdmFsID0gJ2Jvb2xlYW4nO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuRnVuY3Rpb24pXG4gICAgICB2YWwgPSAnZnVuY3Rpb24nO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQXJyYXkpXG4gICAgICB2YWwgPSAnYXJyYXknO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuT2JqZWN0KVxuICAgICAgdmFsID0gJ29iamVjdCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5Qcm9taXNlKVxuICAgICAgdmFsID0gJ3Byb21pc2UnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQmlnSW50KVxuICAgICAgdmFsID0gJ2JpZ2ludCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5NYXApXG4gICAgICB2YWwgPSAnbWFwJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLldlYWtNYXApXG4gICAgICB2YWwgPSAnd2Vha21hcCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TZXQpXG4gICAgICB2YWwgPSAnc2V0JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlN5bWJvbClcbiAgICAgIHZhbCA9ICdzeW1ib2wnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQnVmZmVyKVxuICAgICAgdmFsID0gJ2J1ZmZlcic7XG5cbiAgICBpZiAodmFsID09PSAnYnVmZmVyJyAmJiBnbG9iYWxTY29wZS5CdWZmZXIgJiYgZ2xvYmFsU2NvcGUuQnVmZmVyLmlzQnVmZmVyKG9iaikpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdudW1iZXInICYmICh0eXBlT2YgPT09ICdudW1iZXInIHx8IG9iaiBpbnN0YW5jZW9mIE51bWJlciB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnTnVtYmVyJykpKSB7XG4gICAgICBpZiAoIWlzRmluaXRlKG9iaikpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHZhbCAhPT0gJ29iamVjdCcgJiYgdmFsID09PSB0eXBlT2YpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoKG9iai5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JykpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gTnVsbCBwcm90b3R5cGUgb24gb2JqZWN0XG4gICAgICBpZiAodHlwZU9mID09PSAnb2JqZWN0JyAmJiAhb2JqLmNvbnN0cnVjdG9yKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh2YWwgPT09ICdhcnJheScgJiYgKEFycmF5LmlzQXJyYXkob2JqKSB8fCBvYmogaW5zdGFuY2VvZiBBcnJheSB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQXJyYXknKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICgodmFsID09PSAncHJvbWlzZScgfHwgdmFsID09PSAnZGVmZXJyZWQnKSAmJiBpc0RlZmVycmVkVHlwZShvYmopKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnc3RyaW5nJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuU3RyaW5nIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTdHJpbmcnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdib29sZWFuJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuQm9vbGVhbiB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQm9vbGVhbicpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ21hcCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLk1hcCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnTWFwJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnd2Vha21hcCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLldlYWtNYXAgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1dlYWtNYXAnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdzZXQnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5TZXQgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1NldCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlT2YgPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nICYmIG9iaiBpbnN0YW5jZW9mIHZhbClcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdmFsKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAob2JqID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSAxLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAodGVzdFR5cGUob2JqLCBhcmd1bWVudHNbaV0pID09PSB0cnVlKVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKSB7XG4gIGlmIChvbGRQcm9wcyA9PT0gbmV3UHJvcHMpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2Ygb2xkUHJvcHMgIT09IHR5cGVvZiBuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoIW9sZFByb3BzICYmIG5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChvbGRQcm9wcyAmJiAhbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuICBpZiAoIW9sZFByb3BzICYmICFuZXdQcm9wcyAmJiBvbGRQcm9wcyAhPSBvbGRQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBsZXQgYUtleXMgPSBPYmplY3Qua2V5cyhvbGRQcm9wcykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2xkUHJvcHMpKTtcbiAgbGV0IGJLZXlzID0gT2JqZWN0LmtleXMobmV3UHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG5ld1Byb3BzKSk7XG5cbiAgaWYgKGFLZXlzLmxlbmd0aCAhPT0gYktleXMubGVuZ3RoKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFLZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQgYUtleSA9IGFLZXlzW2ldO1xuICAgIGlmIChza2lwS2V5cyAmJiBza2lwS2V5cy5pbmRleE9mKGFLZXkpID49IDApXG4gICAgICBjb250aW51ZTtcblxuICAgIGlmIChvbGRQcm9wc1thS2V5XSAhPT0gbmV3UHJvcHNbYUtleV0pXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGxldCBiS2V5ID0gYktleXNbaV07XG4gICAgaWYgKHNraXBLZXlzICYmIHNraXBLZXlzLmluZGV4T2YoYktleSkpXG4gICAgICBjb250aW51ZTtcblxuICAgIGlmIChhS2V5ID09PSBiS2V5KVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAob2xkUHJvcHNbYktleV0gIT09IG5ld1Byb3BzW2JLZXldKVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaXplT2YodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSlcbiAgICByZXR1cm4gMDtcblxuICBpZiAoT2JqZWN0LmlzKEluZmluaXR5KSlcbiAgICByZXR1cm4gMDtcblxuICBpZiAodHlwZW9mIHZhbHVlLmxlbmd0aCA9PT0gJ251bWJlcicpXG4gICAgcmV0dXJuIHZhbHVlLmxlbmd0aDtcblxuICByZXR1cm4gT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gX2l0ZXJhdGUob2JqLCBjYWxsYmFjaykge1xuICBpZiAoIW9iaiB8fCBPYmplY3QuaXMoSW5maW5pdHkpKVxuICAgIHJldHVybiBbXTtcblxuICBsZXQgcmVzdWx0cyAgID0gW107XG4gIGxldCBzY29wZSAgICAgPSB7IGNvbGxlY3Rpb246IG9iaiwgU1RPUCB9O1xuICBsZXQgcmVzdWx0O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBzY29wZS50eXBlID0gJ0FycmF5JztcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IG9iai5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBzY29wZS52YWx1ZSA9IG9ialtpXTtcbiAgICAgIHNjb3BlLmluZGV4ID0gc2NvcGUua2V5ID0gaTtcblxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICBicmVhaztcblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmouZW50cmllcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBTZXQgfHwgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTZXQnKSB7XG4gICAgICBzY29wZS50eXBlID0gJ1NldCc7XG5cbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIG9iai52YWx1ZXMoKSkge1xuICAgICAgICBzY29wZS52YWx1ZSA9IGl0ZW07XG4gICAgICAgIHNjb3BlLmtleSA9IGl0ZW07XG4gICAgICAgIHNjb3BlLmluZGV4ID0gaW5kZXgrKztcblxuICAgICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2NvcGUudHlwZSA9IG9iai5jb25zdHJ1Y3Rvci5uYW1lO1xuXG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIChsZXQgWyBrZXksIHZhbHVlIF0gb2Ygb2JqLmVudHJpZXMoKSkge1xuICAgICAgICBzY29wZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBzY29wZS5rZXkgPSBrZXk7XG4gICAgICAgIHNjb3BlLmluZGV4ID0gaW5kZXgrKztcblxuICAgICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGluc3RhbmNlT2Yob2JqLCAnYm9vbGVhbicsICdudW1iZXInLCAnYmlnaW50JywgJ2Z1bmN0aW9uJykpXG4gICAgICByZXR1cm47XG5cbiAgICBzY29wZS50eXBlID0gKG9iai5jb25zdHJ1Y3RvcikgPyBvYmouY29uc3RydWN0b3IubmFtZSA6ICdPYmplY3QnO1xuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGtleSAgID0ga2V5c1tpXTtcbiAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuXG4gICAgICBzY29wZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgc2NvcGUua2V5ID0ga2V5O1xuICAgICAgc2NvcGUuaW5kZXggPSBpO1xuXG4gICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoX2l0ZXJhdGUsIHtcbiAgJ1NUT1AnOiB7XG4gICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgdmFsdWU6ICAgICAgICBTVE9QLFxuICB9LFxufSk7XG5cbmV4cG9ydCBjb25zdCBpdGVyYXRlID0gX2l0ZXJhdGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGlsZHJlbkRpZmZlcihfY2hpbGRyZW4xLCBfY2hpbGRyZW4yKSB7XG4gIGxldCBjaGlsZHJlbjEgPSAoIUFycmF5LmlzQXJyYXkoX2NoaWxkcmVuMSkpID8gWyBfY2hpbGRyZW4xIF0gOiBfY2hpbGRyZW4xO1xuICBsZXQgY2hpbGRyZW4yID0gKCFBcnJheS5pc0FycmF5KF9jaGlsZHJlbjIpKSA/IFsgX2NoaWxkcmVuMiBdIDogX2NoaWxkcmVuMjtcblxuICByZXR1cm4gKGRlYWRiZWVmKC4uLmNoaWxkcmVuMSkgIT09IGRlYWRiZWVmKC4uLmNoaWxkcmVuMikpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hEZWVwUHJvcGVydHkob2JqLCBfa2V5LCBkZWZhdWx0VmFsdWUsIGxhc3RQYXJ0KSB7XG4gIGlmIChvYmogPT0gbnVsbCB8fCBPYmplY3QuaXMoTmFOLCBvYmopIHx8IE9iamVjdC5pcyhJbmZpbml0eSwgb2JqKSlcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBudWxsIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgaWYgKF9rZXkgPT0gbnVsbCB8fCBPYmplY3QuaXMoTmFOLCBfa2V5KSB8fCBPYmplY3QuaXMoSW5maW5pdHksIF9rZXkpKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIG51bGwgXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBsZXQgcGFydHM7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoX2tleSkpIHtcbiAgICBwYXJ0cyA9IF9rZXk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIF9rZXkgPT09ICdzeW1ib2wnKSB7XG4gICAgcGFydHMgPSBbIF9rZXkgXTtcbiAgfSBlbHNlIHtcbiAgICBsZXQga2V5ICAgICAgICAgPSAoJycgKyBfa2V5KTtcbiAgICBsZXQgbGFzdEluZGV4ICAgPSAwO1xuICAgIGxldCBsYXN0Q3Vyc29yICA9IDA7XG5cbiAgICBwYXJ0cyA9IFtdO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBsZXQgaW5kZXggPSBrZXkuaW5kZXhPZignLicsIGxhc3RJbmRleCk7XG4gICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIHBhcnRzLnB1c2goa2V5LnN1YnN0cmluZyhsYXN0Q3Vyc29yKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoa2V5LmNoYXJBdChpbmRleCAtIDEpID09PSAnXFxcXCcpIHtcbiAgICAgICAgbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcGFydHMucHVzaChrZXkuc3Vic3RyaW5nKGxhc3RDdXJzb3IsIGluZGV4KSk7XG4gICAgICBsYXN0Q3Vyc29yID0gbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgIH1cbiAgfVxuXG4gIGxldCBwYXJ0TiA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuICBpZiAocGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIHBhcnROIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgbGV0IGN1cnJlbnRWYWx1ZSA9IG9iajtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGFydHMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1tpXTtcblxuICAgIGN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZVtrZXldO1xuICAgIGlmIChjdXJyZW50VmFsdWUgPT0gbnVsbClcbiAgICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIHBhcnROIF0gOiBkZWZhdWx0VmFsdWU7XG4gIH1cblxuICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgY3VycmVudFZhbHVlLCBwYXJ0TiBdIDogY3VycmVudFZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmluZE1ldGhvZHMoX3Byb3RvLCBza2lwUHJvdG9zKSB7XG4gIGxldCBwcm90byAgICAgICAgICAgPSBfcHJvdG87XG4gIGxldCBhbHJlYWR5VmlzaXRlZCAgPSBuZXcgU2V0KCk7XG5cbiAgd2hpbGUgKHByb3RvKSB7XG4gICAgbGV0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMocHJvdG8pO1xuICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKGRlc2NyaXB0b3JzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhkZXNjcmlwdG9ycykpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChrZXkgPT09ICdjb25zdHJ1Y3RvcicpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoYWxyZWFkeVZpc2l0ZWQuaGFzKGtleSkpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBhbHJlYWR5VmlzaXRlZC5hZGQoa2V5KTtcblxuICAgICAgbGV0IHZhbHVlID0gcHJvdG9ba2V5XTtcblxuICAgICAgLy8gU2tpcCBwcm90b3R5cGUgb2YgT2JqZWN0XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIE9iamVjdC5wcm90b3R5cGVba2V5XSA9PT0gdmFsdWUpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgdGhpc1trZXldID0gdmFsdWUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgaWYgKHByb3RvID09PSBPYmplY3QucHJvdG90eXBlKVxuICAgICAgYnJlYWs7XG5cbiAgICBpZiAoc2tpcFByb3RvcyAmJiBza2lwUHJvdG9zLmluZGV4T2YocHJvdG8pID49IDApXG4gICAgICBicmVhaztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIE5hTikpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKGluc3RhbmNlT2YodmFsdWUsICdzdHJpbmcnKSlcbiAgICByZXR1cm4gISgvXFxTLykudGVzdCh2YWx1ZSk7XG4gIGVsc2UgaWYgKGluc3RhbmNlT2YodmFsdWUsICdudW1iZXInKSAmJiBpc0Zpbml0ZSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBlbHNlIGlmICghaW5zdGFuY2VPZih2YWx1ZSwgJ2Jvb2xlYW4nLCAnYmlnaW50JywgJ2Z1bmN0aW9uJykgJiYgc2l6ZU9mKHZhbHVlKSA9PT0gMClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vdEVtcHR5KHZhbHVlKSB7XG4gIHJldHVybiAhaXNFbXB0eS5jYWxsKHRoaXMsIHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW5BcnJheSh2YWx1ZSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgIHJldHVybiB2YWx1ZTtcblxuICBsZXQgbmV3QXJyYXkgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gdmFsdWUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBpdGVtID0gdmFsdWVbaV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpXG4gICAgICBuZXdBcnJheSA9IG5ld0FycmF5LmNvbmNhdChmbGF0dGVuQXJyYXkoaXRlbSkpO1xuICAgIGVsc2VcbiAgICAgIG5ld0FycmF5LnB1c2goaXRlbSk7XG4gIH1cblxuICByZXR1cm4gbmV3QXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQ2hpbGQoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgY2hpbGQgPT09ICdib29sZWFuJylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKGNoaWxkLCBOYU4pKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSXRlcmFibGVDaGlsZChjaGlsZCkge1xuICBpZiAoY2hpbGQgPT0gbnVsbCB8fCBPYmplY3QuaXMoY2hpbGQsIE5hTikgfHwgT2JqZWN0LmlzKGNoaWxkLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiAoQXJyYXkuaXNBcnJheShjaGlsZCkgfHwgdHlwZW9mIGNoaWxkID09PSAnb2JqZWN0JyAmJiAhaW5zdGFuY2VPZihjaGlsZCwgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ3N0cmluZycpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vdygpIHtcbiAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIGVsc2VcbiAgICByZXR1cm4gRGF0ZS5ub3coKTtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQge1xuICBKSUJfQkFSUkVOLFxuICBKSUJfUFJPWFksXG4gIEpJQixcbiAgSmliLFxuICBmYWN0b3J5LFxuICAkLFxuICBpc0ppYmlzaCxcbiAgY29uc3RydWN0SmliLFxuICByZXNvbHZlQ2hpbGRyZW4sXG59IGZyb20gJy4vamliLmpzJztcblxuZXhwb3J0IGNvbnN0IEppYnMgPSB7XG4gIEpJQl9CQVJSRU4sXG4gIEpJQl9QUk9YWSxcbiAgSklCLFxuICBKaWIsXG4gIGlzSmliaXNoLFxuICBjb25zdHJ1Y3RKaWIsXG4gIHJlc29sdmVDaGlsZHJlbixcbn07XG5cbmltcG9ydCB7XG4gIFVQREFURV9FVkVOVCxcbiAgUVVFVUVfVVBEQVRFX01FVEhPRCxcbiAgRkxVU0hfVVBEQVRFX01FVEhPRCxcbiAgSU5JVF9NRVRIT0QsXG4gIFNLSVBfU1RBVEVfVVBEQVRFUyxcbiAgUEVORElOR19TVEFURV9VUERBVEUsXG4gIExBU1RfUkVOREVSX1RJTUUsXG4gIFBSRVZJT1VTX1NUQVRFLFxuXG4gIENvbXBvbmVudCxcbn0gZnJvbSAnLi9jb21wb25lbnQuanMnO1xuXG5leHBvcnQgY29uc3QgQ29tcG9uZW50cyA9IHtcbiAgVVBEQVRFX0VWRU5ULFxuICBRVUVVRV9VUERBVEVfTUVUSE9ELFxuICBGTFVTSF9VUERBVEVfTUVUSE9ELFxuICBJTklUX01FVEhPRCxcbiAgU0tJUF9TVEFURV9VUERBVEVTLFxuICBQRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRSxcbiAgUFJFVklPVVNfU1RBVEUsXG59O1xuXG5pbXBvcnQge1xuICBGT1JDRV9SRUZMT1csXG4gIFJvb3ROb2RlLFxuICBSZW5kZXJlcixcbiAgUm9vdEVsZW1lbnQsXG4gIENvbW1lbnRFbGVtZW50LFxuICBOYXRpdmVFbGVtZW50LFxuICBQb3J0YWxFbGVtZW50LFxuICBUZXh0RWxlbWVudCxcbn0gZnJvbSAnLi9yZW5kZXJlcnMvaW5kZXguanMnO1xuXG5leHBvcnQgY29uc3QgUmVuZGVyZXJzID0ge1xuICBDT05URVhUX0lEOiBSb290Tm9kZS5DT05URVhUX0lELFxuICBGT1JDRV9SRUZMT1csXG4gIFJvb3ROb2RlLFxuICBSZW5kZXJlcixcbiAgUm9vdEVsZW1lbnQsXG4gIENvbW1lbnRFbGVtZW50LFxuICBOYXRpdmVFbGVtZW50LFxuICBQb3J0YWxFbGVtZW50LFxuICBUZXh0RWxlbWVudCxcbn07XG5cbmV4cG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vdXRpbHMuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBkZWFkYmVlZiB9IGZyb20gJ2RlYWRiZWVmJztcblxuZXhwb3J0IHtcbiAgZmFjdG9yeSxcbiAgJCxcbiAgQ29tcG9uZW50LFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.$),
/* harmony export */   "Component": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.Component),
/* harmony export */   "Components": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.Components),
/* harmony export */   "DOMRenderer": () => (/* reexport safe */ _dom_renderer_js__WEBPACK_IMPORTED_MODULE_0__.DOMRenderer),
/* harmony export */   "Jibs": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.Jibs),
/* harmony export */   "Renderers": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.Renderers),
/* harmony export */   "Utils": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.Utils),
/* harmony export */   "deadbeef": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.deadbeef),
/* harmony export */   "factory": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.factory)
/* harmony export */ });
/* harmony import */ var _dom_renderer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./dom-renderer.js */ "./lib/dom-renderer.js");
/* harmony import */ var jibs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! jibs */ "../jibs/dist/index.js");



})();

var __webpack_exports__$ = __webpack_exports__.$;
var __webpack_exports__Component = __webpack_exports__.Component;
var __webpack_exports__Components = __webpack_exports__.Components;
var __webpack_exports__DOMRenderer = __webpack_exports__.DOMRenderer;
var __webpack_exports__Jibs = __webpack_exports__.Jibs;
var __webpack_exports__Renderers = __webpack_exports__.Renderers;
var __webpack_exports__Utils = __webpack_exports__.Utils;
var __webpack_exports__deadbeef = __webpack_exports__.deadbeef;
var __webpack_exports__factory = __webpack_exports__.factory;
export { __webpack_exports__$ as $, __webpack_exports__Component as Component, __webpack_exports__Components as Components, __webpack_exports__DOMRenderer as DOMRenderer, __webpack_exports__Jibs as Jibs, __webpack_exports__Renderers as Renderers, __webpack_exports__Utils as Utils, __webpack_exports__deadbeef as deadbeef, __webpack_exports__factory as factory };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHdDQUF3QyxRQUFRO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxpRUFBaUUsTUFBTTs7QUFFdkU7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esd0VBQXdFLE1BQU07O0FBRTlFO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHNDQUFzQyxRQUFRO0FBQzlDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsU0FBUzs7QUFFVCw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSwwQ0FBMEMsUUFBUTtBQUNsRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOENBQThDLFFBQVE7QUFDdEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHFDQUFxQyxRQUFRO0FBQzdDOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxzQ0FBc0MsUUFBUTtBQUM5QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0EsT0FBTzs7QUFFUCxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixnQ0FBbUI7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRkFBcUYsZ0NBQW1CO0FBQ3hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVUsZ0NBQW1CO0FBQzdCO0FBQ0EsZUFBZSxnQ0FBbUIsd0JBQXdCLGdDQUFtQjtBQUM3RSxtREFBbUQsd0NBQXdDO0FBQzNGO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxVQUFVLGdDQUFtQjtBQUM3QjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFdBQVc7QUFDWCxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0EsVUFBVSxnQ0FBbUI7QUFDN0IsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSxnQ0FBbUI7QUFDN0I7QUFDQSxpRUFBaUUsaUJBQWlCO0FBQ2xGO0FBQ0EsMERBQTBELGFBQWE7QUFDdkU7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFtQjtBQUNuQixxQkFBcUIsZ0NBQW1CO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEIsZ0VBQWdFLGdDQUFtQjtBQUNuRixzRUFBc0UsZ0NBQW1CO0FBQ3pGLDRFQUE0RSxnQ0FBbUI7QUFDL0Ysa0VBQWtFLGdDQUFtQjtBQUNyRixpRUFBaUUsZ0NBQW1COzs7QUFHcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FBT0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQzRUOztBQUU1VCwyQ0FBMkMsY0FBYzs7Ozs7O1NDaDVEekQ7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTs7U0FFQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTs7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ05nRDtBQUMzQiIsInNvdXJjZXMiOlsid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL2NvbXBvbmVudC1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL2RvbS1yZW5kZXJlci5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9mcmFnbWVudC1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL25hdGl2ZS1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL3BvcnRhbC1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL3RleHQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uLi9qaWJzL2Rpc3QvaW5kZXguanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBKaWJzLFxuICBDb21wb25lbnRzLFxuICBSZW5kZXJlcnMsXG4gIFV0aWxzLFxufSBmcm9tICdqaWJzJztcblxuY29uc3Qge1xuICBKSUJfUFJPWFksXG4gIHJlc29sdmVDaGlsZHJlbixcbn0gPSBKaWJzO1xuXG5jb25zdCB7XG4gIENPTlRFWFRfSUQsXG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuY29uc3Qge1xuICBJTklUX01FVEhPRCxcbiAgVVBEQVRFX0VWRU5ULFxuICBQRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRSxcbiAgU0tJUF9TVEFURV9VUERBVEVTLFxufSA9IENvbXBvbmVudHM7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAncm9vdE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ2NvbXBvbmVudCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAnX3BlbmRpbmdDb250ZXh0VXBkYXRlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdfY2FjaGVkUmVuZGVyUmVzdWx0Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdfY2FjaGVkUmVuZGVyQ29udGV4dCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAnX2NhY2hlZFdhaXRpbmdSZW5kZXJSZXN1bHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ19wcmV2aW91c1N0YXRlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0sXG4gICAgICAnX2N1cnJlbnRKaWInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ19sYXN0Q29udGV4dElEJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB0aGlzLmNvbnRleHRbQ09OVEVYVF9JRF0gfHwgMW4sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgbWVyZ2VDb21wb25lbnRQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIG9sZFByb3BzIHx8IHt9LCBuZXdQcm9wcyk7XG4gICAgcmV0dXJuIHByb3BzO1xuICB9XG5cbiAgZmlyZVByb3BVcGRhdGVzKF9vbGRQcm9wcywgX25ld1Byb3BzKSB7XG4gICAgbGV0IG5ld1Byb3BzICAgID0gX25ld1Byb3BzIHx8IHt9O1xuICAgIGxldCBhbGxQcm9wS2V5cyA9IG5ldyBTZXQoT2JqZWN0LmtleXMobmV3UHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG5ld1Byb3BzKSkpO1xuXG4gICAgbGV0IG9sZFByb3BzICAgID0gX29sZFByb3BzIHx8IHt9O1xuICAgIGxldCBvbGRQcm9wS2V5cyA9IE9iamVjdC5rZXlzKG9sZFByb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvbGRQcm9wcykpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IG9sZFByb3BLZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgICBhbGxQcm9wS2V5cy5hZGQob2xkUHJvcEtleXNbaV0pO1xuXG4gICAgZm9yIChsZXQga2V5IG9mIGFsbFByb3BLZXlzKSB7XG4gICAgICBsZXQgb2xkVmFsdWUgID0gb2xkUHJvcHNba2V5XTtcbiAgICAgIGxldCBuZXdWYWx1ZSAgPSBuZXdQcm9wc1trZXldO1xuXG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKVxuICAgICAgICB0aGlzLmNvbXBvbmVudC5vblByb3BVcGRhdGVkKGtleSwgbmV3VmFsdWUsIG9sZFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRSZW5kZXIobmV3UHJvcHMsIG5ld0NoaWxkcmVuKSB7XG4gICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50O1xuICAgIGlmICghY29tcG9uZW50KVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodGhpcy5fbGFzdENvbnRleHRJRCA8IHRoaXMuY29udGV4dFtDT05URVhUX0lEXSkge1xuICAgICAgdGhpcy5fbGFzdENvbnRleHRJRCA9IHRoaXMuY29udGV4dFtDT05URVhUX0lEXTtcbiAgICAgIHRoaXMuX3ByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2hpbGRyZW5EaWZmZXIoY29tcG9uZW50LmNoaWxkcmVuLCBuZXdDaGlsZHJlbikpIHtcbiAgICAgIHRoaXMuX3ByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzU3RhdGUgPSB0aGlzLl9wcmV2aW91c1N0YXRlIHx8IHt9O1xuICAgIGxldCBwcm9wc0RpZmZlciAgID0gdGhpcy5wcm9wc0RpZmZlcihjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzLCBbICdyZWYnLCAna2V5JyBdLCB0cnVlKTtcbiAgICBpZiAocHJvcHNEaWZmZXIgJiYgY29tcG9uZW50LnNob3VsZFVwZGF0ZShuZXdQcm9wcywgcHJldmlvdXNTdGF0ZSkpIHtcbiAgICAgIHRoaXMuX3ByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgbGV0IHN0YXRlRGlmZmVycyA9IHRoaXMucHJvcHNEaWZmZXIocHJldmlvdXNTdGF0ZSwgY29tcG9uZW50LnN0YXRlKTtcbiAgICBpZiAoc3RhdGVEaWZmZXJzICYmIGNvbXBvbmVudC5zaG91bGRVcGRhdGUobmV3UHJvcHMsIHByZXZpb3VzU3RhdGUpKSB7XG4gICAgICB0aGlzLl9wcmV2aW91c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgY29tcG9uZW50LnN0YXRlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG5cbiAgICBhd2FpdCB0aGlzLnJlbmRlclByb21pc2U7XG5cbiAgICBpZiAodGhpcy5jb21wb25lbnQpIHtcbiAgICAgIGlmICh0aGlzLl9jdXJyZW50SmliICYmIHR5cGVvZiB0aGlzLl9jdXJyZW50SmliLnByb3BzLnJlZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhpcy5fY3VycmVudEppYi5wcm9wcy5yZWYuY2FsbCh0aGlzLmNvbXBvbmVudCwgbnVsbCwgdGhpcy5jb21wb25lbnQpO1xuXG4gICAgICBhd2FpdCB0aGlzLmNvbXBvbmVudC5kZXN0cm95KCk7XG4gICAgICB0aGlzLmNvbXBvbmVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucm9vdE5vZGUpIHtcbiAgICAgIGF3YWl0IHRoaXMucm9vdE5vZGUuZGVzdHJveSgpO1xuICAgICAgdGhpcy5yb290Tm9kZSA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVkUmVuZGVyUmVzdWx0ID0gbnVsbDtcbiAgICB0aGlzLl9wcmV2aW91c1N0YXRlID0gbnVsbDtcbiAgICB0aGlzLl9jdXJyZW50SmliID0gbnVsbDtcblxuICAgIHJldHVybiBhd2FpdCBzdXBlci5kZXN0cm95KCk7XG4gIH1cblxuICBvbkNvbnRleHRVcGRhdGUoKSB7XG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudCB8fCB0aGlzLmNvbXBvbmVudFtTS0lQX1NUQVRFX1VQREFURVNdIHx8IHRoaXMuY29tcG9uZW50W1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMucmVuZGVyKHRoaXMuX2N1cnJlbnRKaWIsIHRoaXMuX2NhY2hlZFJlbmRlckNvbnRleHQgfHwgeyBpbmRleDogMCB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlc29sdmVDaGlsZHJlbihjaGlsZHJlbikge1xuICAgIHJldHVybiByZXNvbHZlQ2hpbGRyZW4uY2FsbCh0aGlzLCBjaGlsZHJlbik7XG4gIH1cblxuICBhc3luYyBzeW5jRWxlbWVudHNXaXRoUmVuZGVyZXIobm9kZSwgcmVuZGVyUmVzdWx0LCByZW5kZXJGcmFtZSkge1xuICAgIGlmICghdGhpcy5wYXJlbnQpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgdGhpcy5wYXJlbnQuc3luY0VsZW1lbnRzV2l0aFJlbmRlcmVyKG5vZGUsIHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgIGlmICh0aGlzLmNvbXBvbmVudClcbiAgICAgIHRoaXMuY29tcG9uZW50LnVwZGF0ZWQoKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgYXN5bmMgX3JlbmRlcihqaWIsIHJlbmRlckNvbnRleHQpIHtcbiAgICBpZiAoamliICE9PSB0aGlzLl9jdXJyZW50SmliKVxuICAgICAgdGhpcy5fY3VycmVudEppYiA9IGppYjtcblxuICAgIHRoaXMuX2NhY2hlZFJlbmRlckNvbnRleHQgPSByZW5kZXJDb250ZXh0O1xuXG4gICAgaWYgKCFqaWIpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgbGV0IHsgVHlwZTogQ29tcG9uZW50Q2xhc3MsIHByb3BzLCBjaGlsZHJlbiB9ID0gamliO1xuICAgIGppYi5jaGlsZHJlbiA9IGF3YWl0IHRoaXMucmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKTtcblxuICAgIGNvbnN0IGZpbmFsaXplUmVuZGVyID0gYXN5bmMgKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lIHx8ICF0aGlzLmNvbXBvbmVudClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLmNvbXBvbmVudFtMQVNUX1JFTkRFUl9USU1FXSA9IFV0aWxzLm5vdygpO1xuXG4gICAgICBsZXQgcm9vdE5vZGUgPSB0aGlzLnJvb3ROb2RlO1xuICAgICAgaWYgKCFyb290Tm9kZSlcbiAgICAgICAgcm9vdE5vZGUgPSB0aGlzLnJvb3ROb2RlID0gdGhpcy5yZW5kZXJlci5jb25zdHJ1Y3ROb2RlRnJvbUppYihKSUJfUFJPWFksIHRoaXMsIHRoaXMuY29udGV4dCk7XG5cbiAgICAgIGxldCBmcmFnbWVudFJlc3VsdCA9IHRoaXMuX2NhY2hlZFJlbmRlclJlc3VsdCA9IGF3YWl0IHJvb3ROb2RlLnJlbmRlcihyZW5kZXJSZXN1bHQsIHJlbmRlckNvbnRleHQpO1xuICAgICAgYXdhaXQgdGhpcy5zeW5jRWxlbWVudHNXaXRoUmVuZGVyZXIodGhpcywgZnJhZ21lbnRSZXN1bHQsIHJlbmRlckZyYW1lKTtcblxuICAgICAgcmV0dXJuIGZyYWdtZW50UmVzdWx0O1xuICAgIH07XG5cbiAgICBjb25zdCBoYW5kbGVSZW5kZXJFcnJvciA9IChlcnJvcikgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudClcbiAgICAgICAgdGhpcy5jb21wb25lbnRbTEFTVF9SRU5ERVJfVElNRV0gPSBVdGlscy5ub3coKTtcblxuICAgICAgbGV0IHJlbmRlclJlc3VsdDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50ICYmIHR5cGVvZiB0aGlzLmNvbXBvbmVudC5yZW5kZXJFcnJvclN0YXRlID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgIHJlbmRlclJlc3VsdCA9IHRoaXMuY29tcG9uZW50LnJlbmRlckVycm9yU3RhdGUoZXJyb3IpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVuZGVyUmVzdWx0ID0gWyBgJHtlcnJvci5tZXNzYWdlfVxcbiR7ZXJyb3Iuc3RhY2t9YCBdO1xuICAgICAgfSBjYXRjaCAoZXJyb3IyKSB7XG4gICAgICAgIHJlbmRlclJlc3VsdCA9IFsgYCR7ZXJyb3IubWVzc2FnZX1cXG4ke2Vycm9yLnN0YWNrfWAgXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpbmFsaXplUmVuZGVyKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50ICYmICF0aGlzLnNob3VsZFJlbmRlcihqaWIucHJvcHMsIGppYi5jaGlsZHJlbikpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlZFJlbmRlclJlc3VsdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudDtcbiAgICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50ID0gbmV3IENvbXBvbmVudENsYXNzKHsgLi4uamliLCBwcm9wczogdGhpcy5tZXJnZUNvbXBvbmVudFByb3BzKG51bGwsIHByb3BzKSwgY29udGV4dDogdGhpcy5jb250ZXh0LCBpZDogdGhpcy5pZCB9KTtcbiAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudFtJTklUX01FVEhPRF0gPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgICBjb21wb25lbnRbSU5JVF9NRVRIT0RdKCk7XG5cbiAgICAgICAgICBjb21wb25lbnQub24oVVBEQVRFX0VWRU5ULCBhc3luYyAocHVzaGVkUmVuZGVyUmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAocHVzaGVkUmVuZGVyUmVzdWx0KSB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICAgICAgICAgICAgYXdhaXQgZmluYWxpemVSZW5kZXIocHVzaGVkUmVuZGVyUmVzdWx0LCB0aGlzLnJlbmRlckZyYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVuZGVyKHRoaXMuX2N1cnJlbnRKaWIsIHRoaXMuX2NhY2hlZFJlbmRlckNvbnRleHQgfHwgeyBpbmRleDogMCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChwcm9wcyAmJiB0eXBlb2YgcHJvcHMucmVmID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgICAgcHJvcHMucmVmLmNhbGwoY29tcG9uZW50LCBjb21wb25lbnQsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIGFueSBwZW5kaW5nIHN0YXRlIHVwZGF0ZXNcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50W1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFtQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBudWxsO1xuXG4gICAgICAgIGxldCByZW5kZXJSZXN1bHQgPSB0aGlzLmNvbXBvbmVudC5yZW5kZXIoamliLmNoaWxkcmVuKTtcbiAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2YocmVuZGVyUmVzdWx0LCAncHJvbWlzZScpKSB7XG4gICAgICAgICAgbGV0IHdhaXRpbmdSZW5kZXJSZXN1bHQgPSB0aGlzLmNvbXBvbmVudC5yZW5kZXJXYWl0aW5nKHRoaXMuX2NhY2hlZFJlbmRlclJlc3VsdCk7XG4gICAgICAgICAgbGV0IHJlbmRlckNvbXBsZXRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgbGV0IGxvYWRpbmdUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgbG9hZGluZ1RpbWVyID0gbnVsbDtcblxuICAgICAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2Yod2FpdGluZ1JlbmRlclJlc3VsdCwgJ3Byb21pc2UnKSlcbiAgICAgICAgICAgICAgd2FpdGluZ1JlbmRlclJlc3VsdCA9IGF3YWl0IHdhaXRpbmdSZW5kZXJSZXN1bHQ7XG5cbiAgICAgICAgICAgIGlmIChyZW5kZXJDb21wbGV0ZWQpXG4gICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgYXdhaXQgZmluYWxpemVSZW5kZXIod2FpdGluZ1JlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgICAgIH0sIDUpO1xuXG4gICAgICAgICAgcmV0dXJuIGF3YWl0IHJlbmRlclJlc3VsdC50aGVuKGFzeW5jIChyZW5kZXJSZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHJlbmRlckNvbXBsZXRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIGlmIChsb2FkaW5nVGltZXIpIHtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGxvYWRpbmdUaW1lcik7XG4gICAgICAgICAgICAgIGxvYWRpbmdUaW1lciA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBmaW5hbGl6ZVJlbmRlcihyZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKTtcbiAgICAgICAgICB9KS5jYXRjaChoYW5kbGVSZW5kZXJFcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGF3YWl0IGZpbmFsaXplUmVuZGVyKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVSZW5kZXJFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQge1xuICBKaWJzLFxuICBSZW5kZXJlcnMsXG59IGZyb20gJ2ppYnMnO1xuXG5pbXBvcnQgeyBGcmFnbWVudE5vZGUgfSAgZnJvbSAnLi9mcmFnbWVudC1ub2RlLmpzJztcbmltcG9ydCB7IFRleHROb2RlIH0gICAgICBmcm9tICcuL3RleHQtbm9kZS5qcyc7XG5pbXBvcnQgeyBOYXRpdmVOb2RlIH0gICAgZnJvbSAnLi9uYXRpdmUtbm9kZS5qcyc7XG5pbXBvcnQgeyBQb3J0YWxOb2RlIH0gICAgZnJvbSAnLi9wb3J0YWwtbm9kZS5qcyc7XG5pbXBvcnQgeyBDb21wb25lbnROb2RlIH0gZnJvbSAnLi9jb21wb25lbnQtbm9kZS5qcyc7XG5cbmNvbnN0IHsgUmVuZGVyZXIgfSA9IFJlbmRlcmVycztcblxuY29uc3Qge1xuICBKSUJfUFJPWFksXG59ID0gSmlicztcblxuZXhwb3J0IGNsYXNzIERPTVJlbmRlcmVyIGV4dGVuZHMgUmVuZGVyZXIge1xuICBzdGF0aWMgRnJhZ21lbnROb2RlID0gRnJhZ21lbnROb2RlO1xuXG4gIHN0YXRpYyBUZXh0Tm9kZSA9IFRleHROb2RlO1xuXG4gIHN0YXRpYyBOYXRpdmVOb2RlID0gTmF0aXZlTm9kZTtcblxuICBzdGF0aWMgUG9ydGFsTm9kZSA9IFBvcnRhbE5vZGU7XG5cbiAgc3RhdGljIENvbXBvbmVudE5vZGUgPSBDb21wb25lbnROb2RlO1xuXG4gIGNvbnN0cnVjdG9yKHJvb3RFbGVtZW50KSB7XG4gICAgc3VwZXIoKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdyb290RWxlbWVudCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICByb290RWxlbWVudCxcbiAgICAgIH0sXG4gICAgICAncm9vdE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgaXNQb3J0YWxOb2RlKHR5cGUpIHtcbiAgICByZXR1cm4gKC9bXmEtekEtWjAtOTpdLykudGVzdCh0eXBlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdE5vZGVGcm9tSmliKGppYiwgcGFyZW50LCBjb250ZXh0KSB7XG4gICAgaWYgKGppYiA9PT0gSklCX1BST1hZKVxuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yLkZyYWdtZW50Tm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQpO1xuXG4gICAgbGV0IHsgVHlwZSB9ID0gamliO1xuICAgIGlmICh0eXBlb2YgVHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yLkNvbXBvbmVudE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKHRoaXMuaXNQb3J0YWxOb2RlKFR5cGUpKVxuICAgICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuUG9ydGFsTm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuTmF0aXZlTm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAoVHlwZSA9PSBudWxsIHx8IFR5cGUgPT09IEpJQl9QUk9YWSkge1xuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yLkZyYWdtZW50Tm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHN5bmNFbGVtZW50c1dpdGhSZW5kZXJlcihub2RlLCByZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICByZXR1cm47XG5cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZUVsZW1lbnRDaGlsZHJlbihcbiAgICAgIHRoaXMuY29udGV4dCxcbiAgICAgIHRoaXMucm9vdEVsZW1lbnQsXG4gICAgICByZW5kZXJSZXN1bHQsXG4gICAgICByZW5kZXJGcmFtZSxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKGppYikge1xuICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgbGV0IHJvb3ROb2RlID0gdGhpcy5yb290Tm9kZTtcbiAgICBpZiAoIXJvb3ROb2RlKVxuICAgICAgcm9vdE5vZGUgPSB0aGlzLnJvb3ROb2RlID0gdGhpcy5jb25zdHJ1Y3ROb2RlRnJvbUppYihKSUJfUFJPWFksIHRoaXMsIHRoaXMuY29udGV4dCk7XG5cbiAgICBsZXQgcmVuZGVyUmVzdWx0ID0gYXdhaXQgcm9vdE5vZGUucmVuZGVyKGppYiwgeyBpbmRleDogMCB9KTtcbiAgICBhd2FpdCB0aGlzLnN5bmNFbGVtZW50c1dpdGhSZW5kZXJlcihcbiAgICAgIHRoaXMsXG4gICAgICByZW5kZXJSZXN1bHQsXG4gICAgICByZW5kZXJGcmFtZSxcbiAgICApO1xuXG4gICAgcmV0dXJuIHJlbmRlclJlc3VsdDtcbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgSmlicyxcbiAgUmVuZGVyZXJzLFxuICBVdGlscyxcbiAgZGVhZGJlZWYsXG59IGZyb20gJ2ppYnMnO1xuXG5jb25zdCB7XG4gIGlzSmliaXNoLFxuICBjb25zdHJ1Y3RKaWIsXG4gIEpJQl9QUk9YWSxcbn0gPSBKaWJzO1xuXG5jb25zdCB7XG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuY29uc3QgVEVYVF9UWVBFICAgICA9IFN5bWJvbC5mb3IoJ0BqaWIvdGV4dE5vZGUnKTtcbmNvbnN0IEZSQUdNRU5UX1RZUEUgPSBTeW1ib2wuZm9yKCdAamliL2ZyYWdtZW50Tm9kZScpO1xuXG5leHBvcnQgY2xhc3MgRnJhZ21lbnROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnX25vZGVDYWNoZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbmV3IE1hcCgpLFxuICAgICAgfSxcbiAgICAgICdfcmVuZGVyQ2FjaGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5kZXN0cm95aW5nID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLl9ub2RlQ2FjaGUpIHtcbiAgICAgIGxldCBkZXN0cm95UHJvbWlzZXMgPSBbXTtcbiAgICAgIGxldCBub2RlQ2FjaGUgICAgICAgPSB0aGlzLl9ub2RlQ2FjaGU7XG5cbiAgICAgIHRoaXMuX25vZGVDYWNoZSA9IG51bGw7XG5cbiAgICAgIGZvciAobGV0IGNhY2hlZFJlc3VsdCBvZiBub2RlQ2FjaGUudmFsdWVzKCkpIHtcbiAgICAgICAgaWYgKGNhY2hlZFJlc3VsdCAmJiBjYWNoZWRSZXN1bHQubm9kZSAmJiBjYWNoZWRSZXN1bHQubm9kZS5kZXN0cm95KVxuICAgICAgICAgIGRlc3Ryb3lQcm9taXNlcy5wdXNoKGNhY2hlZFJlc3VsdC5ub2RlLmRlc3Ryb3koKSk7XG4gICAgICB9XG5cbiAgICAgIG5vZGVDYWNoZS5jbGVhcigpO1xuXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChkZXN0cm95UHJvbWlzZXMpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBzdXBlci5kZXN0cm95KCk7XG4gIH1cblxuICBhc3luYyBzeW5jRWxlbWVudHNXaXRoUmVuZGVyZXIobm9kZSwgcmVuZGVyUmVzdWx0LCByZW5kZXJGcmFtZSkge1xuICAgIGlmICghdGhpcy5wYXJlbnQgfHwgdGhpcy5yZW5kZXJQcm9taXNlIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgIHJldHVybjtcblxuICAgIGlmICghdGhpcy5fbm9kZUNhY2hlKVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyZW50LnN5bmNFbGVtZW50c1dpdGhSZW5kZXJlcihub2RlLCByZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKTtcblxuICAgIGxldCByZW5kZXJSZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgWyBjYWNoZUtleSwgY2FjaGVkUmVzdWx0IF0gb2YgdGhpcy5fbm9kZUNhY2hlKSB7XG4gICAgICBpZiAoY2FjaGVkUmVzdWx0Lm5vZGUgPT09IG5vZGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZUNhY2hlLnNldChjYWNoZUtleSwgeyAuLi5jYWNoZWRSZXN1bHQsIHJlbmRlclJlc3VsdCB9KTtcbiAgICAgICAgcmVuZGVyUmVzdWx0cy5wdXNoKHJlbmRlclJlc3VsdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZW5kZXJSZXN1bHRzLnB1c2goY2FjaGVkUmVzdWx0LnJlbmRlclJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyZW50LnN5bmNFbGVtZW50c1dpdGhSZW5kZXJlcihub2RlLCByZW5kZXJSZXN1bHRzLCByZW5kZXJGcmFtZSk7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKF9jaGlsZHJlbiwgcmVuZGVyQ29udGV4dCkge1xuICAgIGxldCBpbmRleE1hcCAgICA9IG5ldyBNYXAoKTtcbiAgICBsZXQgY2hpbGRyZW4gICAgPSBfY2hpbGRyZW47XG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcblxuICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGNoaWxkcmVuLCAncHJvbWlzZScpKVxuICAgICAgY2hpbGRyZW4gPSBhd2FpdCBjaGlsZHJlbjtcblxuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgcmV0dXJuIHRoaXMuX3JlbmRlckNhY2hlO1xuXG4gICAgaWYgKCF0aGlzLmlzSXRlcmFibGVDaGlsZChjaGlsZHJlbikgJiYgKGlzSmliaXNoKGNoaWxkcmVuKSB8fCB0aGlzLmlzVmFsaWRDaGlsZChjaGlsZHJlbikpKVxuICAgICAgY2hpbGRyZW4gPSBbIGNoaWxkcmVuIF07XG5cbiAgICBjb25zdCBnZXRJbmRleEZvclR5cGUgPSAoVHlwZSkgPT4ge1xuICAgICAgbGV0IGluZGV4ID0gKGluZGV4TWFwLmdldChUeXBlKSB8fCAwKSArIDE7XG4gICAgICBpbmRleE1hcC5zZXQoVHlwZSwgaW5kZXgpO1xuXG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfTtcblxuICAgIGxldCBsb29wU3RvcHBlZCA9IGZhbHNlO1xuICAgIGxldCBwcm9taXNlcyA9IFV0aWxzLml0ZXJhdGUoY2hpbGRyZW4sICh7IHZhbHVlOiBfY2hpbGQsIGtleSwgaW5kZXgsIFNUT1AgfSkgPT4ge1xuICAgICAgaWYgKGxvb3BTdG9wcGVkIHx8IHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgIHJldHVybiBTVE9QO1xuXG4gICAgICByZXR1cm4gKGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGNoaWxkID0gKFV0aWxzLmluc3RhbmNlT2YoX2NoaWxkLCAncHJvbWlzZScpKSA/IGF3YWl0IF9jaGlsZCA6IF9jaGlsZDtcbiAgICAgICAgbGV0IGNyZWF0ZWQ7XG4gICAgICAgIGxldCBjYWNoZUtleTtcbiAgICAgICAgbGV0IG5vZGU7XG4gICAgICAgIGxldCByZW5kZXJSZXN1bHQ7XG5cbiAgICAgICAgaWYgKGlzSmliaXNoKGNoaWxkKSkge1xuICAgICAgICAgIGxldCBqaWIgPSBjb25zdHJ1Y3RKaWIoY2hpbGQpO1xuICAgICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGppYiwgJ3Byb21pc2UnKSlcbiAgICAgICAgICAgIGppYiA9IGF3YWl0IGppYjtcblxuICAgICAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKSB7XG4gICAgICAgICAgICBsb29wU3RvcHBlZCA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHsgVHlwZSwgcHJvcHMgfSA9IGppYjtcbiAgICAgICAgICBpZiAoIXByb3BzKVxuICAgICAgICAgICAgcHJvcHMgPSB7fTtcblxuICAgICAgICAgIGxldCBsb2NhbEtleTtcbiAgICAgICAgICBpZiAoaW5kZXggIT09IGtleSkgLy8gSW5kZXggaXMgYW4gaW50ZWdlciwgYW5kIGtleSBpcyBhIHN0cmluZywgbWVhbmluZyB0aGlzIGlzIGFuIG9iamVjdFxuICAgICAgICAgICAgbG9jYWxLZXkgPSBrZXk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgbG9jYWxLZXkgPSAocHJvcHMua2V5ID09IG51bGwgfHwgT2JqZWN0LmlzKHByb3BzLmtleSwgTmFOKSB8fCBPYmplY3QuaXMocHJvcHMua2V5LCBJbmZpbml0eSkpID8gYEBqaWIvaW50ZXJuYWxfa2V5XyR7Z2V0SW5kZXhGb3JUeXBlKFR5cGUpfWAgOiBwcm9wcy5rZXk7XG5cbiAgICAgICAgICBjYWNoZUtleSA9IGRlYWRiZWVmKFR5cGUsIGxvY2FsS2V5KTtcblxuICAgICAgICAgIGxldCBjYWNoZWRSZXN1bHQgPSB0aGlzLl9ub2RlQ2FjaGUuZ2V0KGNhY2hlS2V5KTtcbiAgICAgICAgICBpZiAoIWNhY2hlZFJlc3VsdCkge1xuICAgICAgICAgICAgY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICBub2RlID0gdGhpcy5yZW5kZXJlci5jb25zdHJ1Y3ROb2RlRnJvbUppYihqaWIsIHRoaXMsIHRoaXMuY29udGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIG5vZGUgPSBjYWNoZWRSZXN1bHQubm9kZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoVHlwZSA9PT0gSklCX1BST1hZKVxuICAgICAgICAgICAgcmVuZGVyUmVzdWx0ID0gYXdhaXQgbm9kZS5yZW5kZXIoamliLmNoaWxkcmVuLCByZW5kZXJDb250ZXh0KTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZW5kZXJSZXN1bHQgPSBhd2FpdCBub2RlLnJlbmRlcihqaWIsIHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSkge1xuICAgICAgICAgIGlmIChVdGlscy5pc0VtcHR5KGNoaWxkKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgIGNhY2hlS2V5ID0gZGVhZGJlZWYoYEBqaWIvaW50ZXJuYWxfZnJhZ21lbnRfJHtnZXRJbmRleEZvclR5cGUoRlJBR01FTlRfVFlQRSl9YCk7XG5cbiAgICAgICAgICBsZXQgY2FjaGVkUmVzdWx0ID0gdGhpcy5fbm9kZUNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgICAgICAgaWYgKCFjYWNoZWRSZXN1bHQpIHtcbiAgICAgICAgICAgIGNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgbm9kZSA9IHRoaXMucmVuZGVyZXIuY29uc3RydWN0Tm9kZUZyb21KaWIoSklCX1BST1hZLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBub2RlID0gY2FjaGVkUmVzdWx0Lm5vZGU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVuZGVyUmVzdWx0ID0gYXdhaXQgbm9kZS5yZW5kZXIoY2hpbGQsIHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNWYWxpZENoaWxkKGNoaWxkKSkge1xuICAgICAgICAgIGNoaWxkID0gKHR5cGVvZiBjaGlsZC52YWx1ZU9mID09PSAnZnVuY3Rpb24nKSA/IGNoaWxkLnZhbHVlT2YoKSA6IGNoaWxkO1xuICAgICAgICAgIGNhY2hlS2V5ID0gZGVhZGJlZWYoYEBqaWIvaW50ZXJuYWxfdGV4dF8ke2dldEluZGV4Rm9yVHlwZShURVhUX1RZUEUpfWApO1xuXG4gICAgICAgICAgbGV0IGNhY2hlZFJlc3VsdCA9IHRoaXMuX25vZGVDYWNoZS5nZXQoY2FjaGVLZXkpO1xuICAgICAgICAgIGlmICghY2FjaGVkUmVzdWx0KSB7XG4gICAgICAgICAgICBjcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgdGhpcy5yZW5kZXJlci5jb25zdHJ1Y3Rvci5UZXh0Tm9kZSh0aGlzLnJlbmRlcmVyLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICBub2RlID0gY2FjaGVkUmVzdWx0Lm5vZGU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVuZGVyUmVzdWx0ID0gYXdhaXQgbm9kZS5yZW5kZXIoY2hpbGQsIHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgbm9kZSwgY2FjaGVLZXksIHJlbmRlclJlc3VsdCwgY3JlYXRlZCB9O1xuICAgICAgfSkoKTtcbiAgICB9KTtcblxuICAgIGxldCByZW5kZXJSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIHJlbmRlclJlc3VsdHMgPSByZW5kZXJSZXN1bHRzLmZpbHRlcigocmVzdWx0KSA9PiAhIXJlc3VsdCk7XG5cbiAgICBsZXQgZGVzdHJveVByb21pc2VzID0gW107XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHJlbmRlclJlc3VsdHMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICBsZXQgcmVzdWx0ID0gcmVuZGVyUmVzdWx0c1tpXTtcbiAgICAgICAgbGV0IHsgbm9kZSwgY3JlYXRlZCB9ID0gcmVzdWx0O1xuXG4gICAgICAgIGlmIChjcmVhdGVkICYmIG5vZGUpIHtcbiAgICAgICAgICAvLyBEZXN0cm95IG5vZGVzIHNpbmNlIHRoaXMgcmVuZGVyIHdhcyByZWplY3RlZC5cbiAgICAgICAgICAvLyBCdXQgb25seSBub2RlcyB0aGF0IHdlcmUganVzdCBjcmVhdGVkLi4uXG4gICAgICAgICAgLy8gYXMgZXhpc3Rpbmcgbm9kZXMgbWlnaHQgc3RpbGwgbmVlZCB0byBleGlzdC5cbiAgICAgICAgICBkZXN0cm95UHJvbWlzZXMucHVzaChub2RlLmRlc3Ryb3koKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGRlc3Ryb3lQcm9taXNlcy5sZW5ndGggPiAwKVxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChkZXN0cm95UHJvbWlzZXMpO1xuXG4gICAgICByZXR1cm4gdGhpcy5fcmVuZGVyQ2FjaGU7XG4gICAgfVxuXG4gICAgbGV0IG5vZGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcmVuZGVyUmVzdWx0cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgcmVuZGVyUmVzdWx0ID0gcmVuZGVyUmVzdWx0c1tpXTtcbiAgICAgIG5vZGVNYXAuc2V0KHJlbmRlclJlc3VsdC5jYWNoZUtleSwgcmVuZGVyUmVzdWx0KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fbm9kZUNhY2hlKSB7XG4gICAgICAvLyBDbGVhbnVwXG4gICAgICBmb3IgKGxldCBbIGNhY2hlS2V5LCByZW5kZXJSZXN1bHQgXSBvZiB0aGlzLl9ub2RlQ2FjaGUpIHtcbiAgICAgICAgbGV0IGhhc0NoaWxkID0gbm9kZU1hcC5oYXMoY2FjaGVLZXkpO1xuICAgICAgICBpZiAoIWhhc0NoaWxkKSB7XG4gICAgICAgICAgLy8gVGhpcyBub2RlIHdhcyBkZXN0cm95ZWRcbiAgICAgICAgICBkZXN0cm95UHJvbWlzZXMucHVzaChyZW5kZXJSZXN1bHQubm9kZS5kZXN0cm95KCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX25vZGVDYWNoZSA9IG5vZGVNYXA7XG5cbiAgICAgIGlmIChkZXN0cm95UHJvbWlzZXMubGVuZ3RoID4gMClcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbm9kZUNhY2hlID0gbm9kZU1hcDtcbiAgICB9XG5cbiAgICBsZXQgcmVuZGVyUmVzdWx0ID0gdGhpcy5fcmVuZGVyQ2FjaGUgPSByZW5kZXJSZXN1bHRzLm1hcCgocmVuZGVyUmVzdWx0KSA9PiByZW5kZXJSZXN1bHQucmVuZGVyUmVzdWx0KS5maWx0ZXIoKHJlc3VsdCkgPT4gKHJlc3VsdCAhPSBudWxsICYmICFPYmplY3QuaXMocmVzdWx0LCBOYU4pICYmICFPYmplY3QuaXMocmVzdWx0LCBJbmZpbml0eSkpKTtcbiAgICByZXR1cm4gcmVuZGVyUmVzdWx0O1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBKaWJzLFxuICBSZW5kZXJlcnMsXG4gIFV0aWxzLFxufSBmcm9tICdqaWJzJztcblxuY29uc3Qge1xuICBKSUJfUFJPWFksXG59ID0gSmlicztcblxuY29uc3Qge1xuICBSb290Tm9kZSxcbiAgTmF0aXZlRWxlbWVudCxcbiAgVGV4dEVsZW1lbnQsXG59ID0gUmVuZGVyZXJzO1xuXG5leHBvcnQgY2xhc3MgTmF0aXZlTm9kZSBleHRlbmRzIFJvb3ROb2RlIHtcbiAgc3RhdGljIEVMRU1FTlRfQ0xBU1MgPSBOYXRpdmVFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICBzdXBlciguLi5hcmdzKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdyb290Tm9kZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAnX2N1cnJlbnRKaWInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ19jYWNoZWRSZW5kZXJSZXN1bHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHsgaWQ6IHRoaXMuaWQgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzeW5jRWxlbWVudHNXaXRoUmVuZGVyZXIobm9kZSwgcmVuZGVyUmVzdWx0LCByZW5kZXJGcmFtZSkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlciB8fCB0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgcmV0dXJuO1xuXG4gICAgYXdhaXQgdGhpcy5yZW5kZXJlci51cGRhdGVFbGVtZW50Q2hpbGRyZW4oXG4gICAgICB0aGlzLmNvbnRleHQsXG4gICAgICB0aGlzLl9jYWNoZWRSZW5kZXJSZXN1bHQsXG4gICAgICByZW5kZXJSZXN1bHQsXG4gICAgICByZW5kZXJGcmFtZSxcbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5kZXN0cm95aW5nID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLnJvb3ROb2RlKSB7XG4gICAgICBhd2FpdCB0aGlzLnJvb3ROb2RlLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMucm9vdE5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCBzdXBlci5kZXN0cm95KCk7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKGppYiwgcmVuZGVyQ29udGV4dCkge1xuICAgIGxldCB7XG4gICAgICBUeXBlLFxuICAgICAgcHJvcHMsXG4gICAgICBjaGlsZHJlbixcbiAgICB9ID0gdGhpcy5fY3VycmVudEppYiA9IChqaWIgfHwge30pO1xuXG4gICAgaWYgKCFUeXBlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcblxuICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3BzLCAnaW5uZXJIVE1MJykpIHtcbiAgICAgIGxldCByb290Tm9kZSA9IHRoaXMucm9vdE5vZGU7XG4gICAgICBpZiAoIXJvb3ROb2RlKVxuICAgICAgICByb290Tm9kZSA9IHRoaXMucm9vdE5vZGUgPSB0aGlzLnJlbmRlcmVyLmNvbnN0cnVjdE5vZGVGcm9tSmliKEpJQl9QUk9YWSwgdGhpcywgdGhpcy5jb250ZXh0KTtcblxuICAgICAgbGV0IG5ld0NvbnRleHQgPSBPYmplY3QuY3JlYXRlKHJlbmRlckNvbnRleHQpO1xuICAgICAgbmV3Q29udGV4dC5pbmRleCA9IDA7XG5cbiAgICAgIHJvb3ROb2RlLnJlbmRlcihjaGlsZHJlbiwgbmV3Q29udGV4dCkudGhlbigoZnJhZ21lbnRSZXN1bHQpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3luY0VsZW1lbnRzV2l0aFJlbmRlcmVyKHRoaXMsIGZyYWdtZW50UmVzdWx0LCByZW5kZXJGcmFtZSk7XG4gICAgICB9KS5jYXRjaCgoX2Vycm9yKSA9PiB7XG4gICAgICAgIGxldCBlcnJvciA9IF9lcnJvcjtcbiAgICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikpXG4gICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZXJyb3IpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnN5bmNFbGVtZW50c1dpdGhSZW5kZXJlcih0aGlzLCBbIG5ldyBUZXh0RWxlbWVudChudWxsLCBlcnJvciwgcHJvcHMpIF0sIHJlbmRlckZyYW1lKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodGhpcy5yb290Tm9kZSkge1xuICAgICAgICBhd2FpdCB0aGlzLnJvb3ROb2RlLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5yb290Tm9kZSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHJlbmRlclJlc3VsdCA9IHRoaXMuX2NhY2hlZFJlbmRlclJlc3VsdCA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yLkVMRU1FTlRfQ0xBU1MoXG4gICAgICB0aGlzLmlkLFxuICAgICAgVHlwZSxcbiAgICAgIHByb3BzLFxuICAgICk7XG5cbiAgICByZXR1cm4gcmVuZGVyUmVzdWx0O1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBSZW5kZXJlcnMsXG59IGZyb20gJ2ppYnMnO1xuXG5pbXBvcnQgeyBOYXRpdmVOb2RlIH0gZnJvbSAnLi9uYXRpdmUtbm9kZS5qcyc7XG5cbmNvbnN0IHtcbiAgUG9ydGFsRWxlbWVudCxcbn0gPSBSZW5kZXJlcnM7XG5cbmV4cG9ydCBjbGFzcyBQb3J0YWxOb2RlIGV4dGVuZHMgTmF0aXZlTm9kZSB7XG4gIHN0YXRpYyBFTEVNRU5UX0NMQVNTID0gUG9ydGFsRWxlbWVudDtcbn1cbiIsImltcG9ydCB7XG4gIFJlbmRlcmVycyxcbn0gZnJvbSAnamlicyc7XG5cbmNvbnN0IHtcbiAgUm9vdE5vZGUsXG4gIFRleHRFbGVtZW50LFxufSA9IFJlbmRlcmVycztcblxuZXhwb3J0IGNsYXNzIFRleHROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICBhc3luYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuXG4gICAgcmV0dXJuIGF3YWl0IHN1cGVyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIGFzeW5jIF9yZW5kZXIodGV4dCkge1xuICAgIHJldHVybiBuZXcgVGV4dEVsZW1lbnQodGhpcy5pZCwgdGV4dCk7XG4gIH1cbn1cbiIsIi8qKioqKiovIHZhciBfX3dlYnBhY2tfbW9kdWxlc19fID0gKHtcblxuLyoqKi8gXCIuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3VudXNlZF93ZWJwYWNrX2V4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuLy8gQ29weXJpZ2h0IDIwMjIgV3lhdHQgR3JlZW53YXlcblxuXG5cbmNvbnN0IHRoaXNHbG9iYWwgPSAoKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IF9fd2VicGFja19yZXF1aXJlX18uZykgfHwgdGhpcztcbmNvbnN0IERFQURCRUVGX1JFRl9NQVBfS0VZID0gU3ltYm9sLmZvcignQEBkZWFkYmVlZlJlZk1hcCcpO1xuY29uc3QgVU5JUVVFX0lEX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZVbmlxdWVJRCcpO1xuY29uc3QgcmVmTWFwID0gKHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKSA/IHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldIDogbmV3IFdlYWtNYXAoKTtcbmNvbnN0IGlkSGVscGVycyA9IFtdO1xuXG5pZiAoIXRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKVxuICB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA9IHJlZk1hcDtcblxubGV0IHV1aWRDb3VudGVyID0gMG47XG5cbmZ1bmN0aW9uIGdldEhlbHBlckZvclZhbHVlKHZhbHVlKSB7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkSGVscGVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IHsgaGVscGVyLCBnZW5lcmF0b3IgfSA9IGlkSGVscGVyc1tpXTtcbiAgICBpZiAoaGVscGVyKHZhbHVlKSlcbiAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gYW55dGhpbmdUb0lEKF9hcmcsIF9hbHJlYWR5VmlzaXRlZCkge1xuICBsZXQgYXJnID0gX2FyZztcbiAgaWYgKGFyZyBpbnN0YW5jZW9mIE51bWJlciB8fCBhcmcgaW5zdGFuY2VvZiBTdHJpbmcgfHwgYXJnIGluc3RhbmNlb2YgQm9vbGVhbilcbiAgICBhcmcgPSBhcmcudmFsdWVPZigpO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgYXJnO1xuXG4gIGlmICh0eXBlT2YgPT09ICdudW1iZXInICYmIGFyZyA9PT0gMCkge1xuICAgIGlmIChPYmplY3QuaXMoYXJnLCAtMCkpXG4gICAgICByZXR1cm4gJ251bWJlcjotMCc7XG5cbiAgICByZXR1cm4gJ251bWJlcjorMCc7XG4gIH1cblxuICBpZiAodHlwZU9mID09PSAnc3ltYm9sJylcbiAgICByZXR1cm4gYHN5bWJvbDoke2FyZy50b1N0cmluZygpfWA7XG5cbiAgaWYgKGFyZyA9PSBudWxsIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicgfHwgdHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdiaWdpbnQnKSB7XG4gICAgaWYgKHR5cGVPZiA9PT0gJ251bWJlcicpXG4gICAgICByZXR1cm4gKGFyZyA8IDApID8gYG51bWJlcjoke2FyZ31gIDogYG51bWJlcjorJHthcmd9YDtcblxuICAgIGlmICh0eXBlT2YgPT09ICdiaWdpbnQnICYmIGFyZyA9PT0gMG4pXG4gICAgICByZXR1cm4gJ2JpZ2ludDorMCc7XG5cbiAgICByZXR1cm4gYCR7dHlwZU9mfToke2FyZ31gO1xuICB9XG5cbiAgbGV0IGlkSGVscGVyID0gKGlkSGVscGVycy5sZW5ndGggPiAwICYmIGdldEhlbHBlckZvclZhbHVlKGFyZykpO1xuICBpZiAoaWRIZWxwZXIpXG4gICAgcmV0dXJuIGFueXRoaW5nVG9JRChpZEhlbHBlcihhcmcpKTtcblxuICBpZiAoVU5JUVVFX0lEX1NZTUJPTCBpbiBhcmcgJiYgdHlwZW9mIGFyZ1tVTklRVUVfSURfU1lNQk9MXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uXG4gICAgaWYgKCFfYWxyZWFkeVZpc2l0ZWQgfHwgIV9hbHJlYWR5VmlzaXRlZC5oYXMoYXJnKSkge1xuICAgICAgbGV0IGFscmVhZHlWaXNpdGVkID0gX2FscmVhZHlWaXNpdGVkIHx8IG5ldyBTZXQoKTtcbiAgICAgIGFscmVhZHlWaXNpdGVkLmFkZChhcmcpO1xuICAgICAgcmV0dXJuIGFueXRoaW5nVG9JRChhcmdbVU5JUVVFX0lEX1NZTUJPTF0oKSwgYWxyZWFkeVZpc2l0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghcmVmTWFwLmhhcyhhcmcpKSB7XG4gICAgbGV0IGtleSA9IGAke3R5cGVvZiBhcmd9OiR7Kyt1dWlkQ291bnRlcn1gO1xuICAgIHJlZk1hcC5zZXQoYXJnLCBrZXkpO1xuICAgIHJldHVybiBrZXk7XG4gIH1cblxuICByZXR1cm4gcmVmTWFwLmdldChhcmcpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZigpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGRlYWRiZWVmU29ydGVkKCkge1xuICBsZXQgcGFydHMgPSBbIGFyZ3VtZW50cy5sZW5ndGggXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgcGFydHMucHVzaChhbnl0aGluZ1RvSUQoYXJndW1lbnRzW2ldKSk7XG5cbiAgcmV0dXJuIHBhcnRzLnNvcnQoKS5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSURGb3IoaGVscGVyLCBnZW5lcmF0b3IpIHtcbiAgaWRIZWxwZXJzLnB1c2goeyBoZWxwZXIsIGdlbmVyYXRvciB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSURHZW5lcmF0b3IoaGVscGVyKSB7XG4gIGxldCBpbmRleCA9IGlkSGVscGVycy5maW5kSW5kZXgoKGl0ZW0pID0+IChpdGVtLmhlbHBlciA9PT0gaGVscGVyKSk7XG4gIGlmIChpbmRleCA8IDApXG4gICAgcmV0dXJuO1xuXG4gIGlkSGVscGVycy5zcGxpY2UoaW5kZXgsIDEpO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhkZWFkYmVlZiwge1xuICAnaWRTeW0nOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgVU5JUVVFX0lEX1NZTUJPTCxcbiAgfSxcbiAgJ3NvcnRlZCc6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICBkZWFkYmVlZlNvcnRlZCxcbiAgfSxcbiAgJ2dlbmVyYXRlSURGb3InOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZ2VuZXJhdGVJREZvcixcbiAgfSxcbiAgJ3JlbW92ZUlER2VuZXJhdG9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIHJlbW92ZUlER2VuZXJhdG9yLFxuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGVhZGJlZWY7XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvY29tcG9uZW50LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9jb21wb25lbnQuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EUyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ29tcG9uZW50XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENvbXBvbmVudCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiRkxVU0hfVVBEQVRFX01FVEhPRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBGTFVTSF9VUERBVEVfTUVUSE9EKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJJTklUX01FVEhPRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBJTklUX01FVEhPRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiTEFTVF9SRU5ERVJfVElNRVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBMQVNUX1JFTkRFUl9USU1FKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJQRU5ESU5HX1NUQVRFX1VQREFURVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBQRU5ESU5HX1NUQVRFX1VQREFURSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUFJFVklPVVNfU1RBVEVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUFJFVklPVVNfU1RBVEUpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlFVRVVFX1VQREFURV9NRVRIT0RcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUVVFVUVfVVBEQVRFX01FVEhPRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiU0tJUF9TVEFURV9VUERBVEVTXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFNLSVBfU1RBVEVfVVBEQVRFUyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiVVBEQVRFX0VWRU5UXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFVQREFURV9FVkVOVClcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9ldmVudHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXZlbnRzLmpzICovIFwiLi9saWIvZXZlbnRzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vamliLmpzICovIFwiLi9saWIvamliLmpzXCIpO1xuLyogZ2xvYmFsIEJ1ZmZlciAqL1xuXG5cblxuXG5cbmNvbnN0IFVQREFURV9FVkVOVCAgICAgICAgICAgICAgPSAnQGppYnMvY29tcG9uZW50L2V2ZW50L3VwZGF0ZSc7XG5jb25zdCBRVUVVRV9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3F1ZXVlVXBkYXRlJyk7XG5jb25zdCBGTFVTSF9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2ZsdXNoVXBkYXRlJyk7XG5jb25zdCBJTklUX01FVEhPRCAgICAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L19faW5pdCcpO1xuY29uc3QgU0tJUF9TVEFURV9VUERBVEVTICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9za2lwU3RhdGVVcGRhdGVzJyk7XG5jb25zdCBQRU5ESU5HX1NUQVRFX1VQREFURSAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3BlbmRpbmdTdGF0ZVVwZGF0ZScpO1xuY29uc3QgTEFTVF9SRU5ERVJfVElNRSAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9sYXN0UmVuZGVyVGltZScpO1xuY29uc3QgUFJFVklPVVNfU1RBVEUgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wcmV2aW91c1N0YXRlJyk7XG5jb25zdCBDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3ByZXZpb3VzU3RhdGUnKTtcblxuY29uc3QgZWxlbWVudERhdGFDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgTmFOKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCb29sZWFuIHx8IHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBsZXQgdHlwZU9mID0gdHlwZW9mIHZhbHVlO1xuICBpZiAodHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdudW1iZXInIHx8IHR5cGVPZiA9PT0gJ2Jvb2xlYW4nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgQnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiBCdWZmZXIuaXNCdWZmZXIodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgX2V2ZW50c19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkV2ZW50RW1pdHRlciB7XG4gIHN0YXRpYyBVUERBVEVfRVZFTlQgPSBVUERBVEVfRVZFTlQ7XG5cbiAgW1FVRVVFX1VQREFURV9NRVRIT0RdKCkge1xuICAgIGlmICh0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0udGhlbih0aGlzW0ZMVVNIX1VQREFURV9NRVRIT0RdLmJpbmQodGhpcykpO1xuICB9XG5cbiAgW0ZMVVNIX1VQREFURV9NRVRIT0RdKCkge1xuICAgIC8vIFdhcyB0aGUgc3RhdGUgdXBkYXRlIGNhbmNlbGxlZD9cbiAgICBpZiAoIXRoaXNbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5lbWl0KFVQREFURV9FVkVOVCk7XG5cbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSA9IG51bGw7XG4gIH1cblxuICBbSU5JVF9NRVRIT0RdKCkge1xuICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IGZhbHNlO1xuICB9XG5cbiAgY29uc3RydWN0b3IoX2ppYikge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvLyBCaW5kIGFsbCBjbGFzcyBtZXRob2RzIHRvIFwidGhpc1wiXG4gICAgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uYmluZE1ldGhvZHMuY2FsbCh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG5cbiAgICBsZXQgamliID0gX2ppYiB8fCB7fTtcblxuICAgIGNvbnN0IGNyZWF0ZU5ld1N0YXRlID0gKCkgPT4ge1xuICAgICAgbGV0IGxvY2FsU3RhdGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgICByZXR1cm4gbmV3IFByb3h5KGxvY2FsU3RhdGUsIHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBwcm9wTmFtZSkgPT4ge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgIGxldCBjdXJyZW50VmFsdWUgPSB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUgPT09IHZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICBpZiAoIXRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSlcbiAgICAgICAgICAgIHRoaXNbUVVFVUVfVVBEQVRFX01FVEhPRF0oKTtcblxuICAgICAgICAgIHRhcmdldFtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLm9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCB2YWx1ZSwgY3VycmVudFZhbHVlKTtcblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxldCBwcm9wcyAgICAgICA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSwgamliLnByb3BzIHx8IHt9KTtcbiAgICBsZXQgX2xvY2FsU3RhdGUgPSBjcmVhdGVOZXdTdGF0ZSgpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW1NLSVBfU1RBVEVfVVBEQVRFU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBbUEVORElOR19TVEFURV9VUERBVEVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgW0xBU1RfUkVOREVSX1RJTUVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLm5vdygpLFxuICAgICAgfSxcbiAgICAgIFtDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0sXG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmlkLFxuICAgICAgfSxcbiAgICAgICdwcm9wcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcHJvcHMsXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuY2hpbGRyZW4gfHwgW10sXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5jb250ZXh0IHx8IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgICB9LFxuICAgICAgJ3N0YXRlJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBfbG9jYWxTdGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduKF9sb2NhbFN0YXRlLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5yZXNvbHZlQ2hpbGRyZW4uY2FsbCh0aGlzLCBjaGlsZHJlbik7XG4gIH1cblxuICBpc0ppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaXNKaWJpc2gpKHZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uY29uc3RydWN0SmliKSh2YWx1ZSk7XG4gIH1cblxuICBwdXNoUmVuZGVyKHJlbmRlclJlc3VsdCkge1xuICAgIHRoaXMuZW1pdChVUERBVEVfRVZFTlQsIHJlbmRlclJlc3VsdCk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25Qcm9wVXBkYXRlZChwcm9wTmFtZSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgY2FwdHVyZVJlZmVyZW5jZShuYW1lLCBpbnRlcmNlcHRvckNhbGxiYWNrKSB7XG4gICAgbGV0IG1ldGhvZCA9IHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU11bbmFtZV07XG4gICAgaWYgKG1ldGhvZClcbiAgICAgIHJldHVybiBtZXRob2Q7XG5cbiAgICBtZXRob2QgPSAoX3JlZiwgcHJldmlvdXNSZWYpID0+IHtcbiAgICAgIGxldCByZWYgPSBfcmVmO1xuXG4gICAgICBpZiAodHlwZW9mIGludGVyY2VwdG9yQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJlZiA9IGludGVyY2VwdG9yQ2FsbGJhY2suY2FsbCh0aGlzLCByZWYsIHByZXZpb3VzUmVmKTtcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgICBbbmFtZV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICByZWYsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhpc1tDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXSA9IG1ldGhvZDtcblxuICAgIHJldHVybiBtZXRob2Q7XG4gIH1cblxuICBmb3JjZVVwZGF0ZSgpIHtcbiAgICB0aGlzW1FVRVVFX1VQREFURV9NRVRIT0RdKCk7XG4gIH1cblxuICBnZXRTdGF0ZShwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gc3RhdGU7XG5cbiAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihwcm9wZXJ0eVBhdGgsICdvYmplY3QnKSkge1xuICAgICAgbGV0IGtleXMgICAgICAgID0gT2JqZWN0LmtleXMocHJvcGVydHlQYXRoKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhwcm9wZXJ0eVBhdGgpKTtcbiAgICAgIGxldCBmaW5hbFN0YXRlICA9IHt9O1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGxldCBbIHZhbHVlLCBsYXN0UGFydCBdID0gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uZmV0Y2hEZWVwUHJvcGVydHkoc3RhdGUsIGtleSwgcHJvcGVydHlQYXRoW2tleV0sIHRydWUpO1xuICAgICAgICBpZiAobGFzdFBhcnQgPT0gbnVsbClcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBmaW5hbFN0YXRlW2xhc3RQYXJ0XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmluYWxTdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgc2V0U3RhdGUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgfVxuXG4gIHNldFN0YXRlUGFzc2l2ZSh2YWx1ZSkge1xuICAgIGlmICghaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWUgZm9yIFwidGhpcy5zZXRTdGF0ZVBhc3NpdmVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwgdmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGRlbGV0ZSB0aGlzLnN0YXRlO1xuICAgIGRlbGV0ZSB0aGlzLnByb3BzO1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRleHQ7XG4gICAgZGVsZXRlIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU107XG4gICAgdGhpcy5jbGVhckFsbERlYm91bmNlcygpO1xuICB9XG5cbiAgcmVuZGVyV2FpdGluZygpIHtcbiAgfVxuXG4gIHJlbmRlcihjaGlsZHJlbikge1xuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHVwZGF0ZWQoKSB7XG4gIH1cblxuICBjb21iaW5lV2l0aChzZXAsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZmluYWxBcmdzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3MubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGFyZyA9IGFyZ3NbaV07XG4gICAgICBpZiAoIWFyZylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKGFyZywgJ3N0cmluZycpKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSBhcmcuc3BsaXQoc2VwKS5maWx0ZXIoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXNOb3RFbXB0eSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLmZpbHRlcigodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgaWYgKCFfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKHZhbHVlLCAnc3RyaW5nJykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXNOb3RFbXB0eSh2YWx1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoYXJnLCAnb2JqZWN0JykpIHtcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhhcmcpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgPSBrZXlzW2ldO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IGFyZ1trZXldO1xuXG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgZmluYWxBcmdzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmluYWxBcmdzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZmluYWxBcmdzKS5qb2luKHNlcCB8fCAnJyk7XG4gIH1cblxuICBjbGFzc2VzKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5jb21iaW5lV2l0aCgnICcsIC4uLmFyZ3MpO1xuICB9XG5cbiAgZXh0cmFjdENoaWxkcmVuKF9wYXR0ZXJucywgY2hpbGRyZW4pIHtcbiAgICBsZXQgZXh0cmFjdGVkID0ge307XG4gICAgbGV0IHBhdHRlcm5zICA9IF9wYXR0ZXJucztcbiAgICBsZXQgaXNBcnJheSAgID0gQXJyYXkuaXNBcnJheShwYXR0ZXJucyk7XG5cbiAgICBjb25zdCBpc01hdGNoID0gKGppYikgPT4ge1xuICAgICAgbGV0IGppYlR5cGUgPSBqaWIuVHlwZTtcbiAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGF0dGVybnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBwYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgIGlmIChqaWJUeXBlID09PSBwYXR0ZXJuKSB7XG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBqaWI7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGF0dGVybnMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgICA9IGtleXNbaV07XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICAgIGxldCByZXN1bHQ7XG5cbiAgICAgICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihwYXR0ZXJuLCBSZWdFeHApKVxuICAgICAgICAgICAgcmVzdWx0ID0gcGF0dGVybi50ZXN0KGppYlR5cGUpO1xuICAgICAgICAgIGVsc2UgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4udG9Mb3dlckNhc2UoKSA9PT0gamliVHlwZSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4gPT09IGppYlR5cGUpO1xuXG4gICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgZXh0cmFjdGVkW2tleV0gPSBqaWI7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBleHRyYWN0ZWQucmVtYWluaW5nQ2hpbGRyZW4gPSBjaGlsZHJlbi5maWx0ZXIoKGppYikgPT4gIWlzTWF0Y2goamliKSk7XG4gICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgfVxuXG4gIGRlYm91bmNlKGZ1bmMsIHRpbWUsIF9pZCkge1xuICAgIGNvbnN0IGNsZWFyUGVuZGluZ1RpbWVvdXQgPSAoKSA9PiB7XG4gICAgICBpZiAocGVuZGluZ1RpbWVyICYmIHBlbmRpbmdUaW1lci50aW1lb3V0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZXIudGltZW91dCk7XG4gICAgICAgIHBlbmRpbmdUaW1lci50aW1lb3V0ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGlkID0gKCFfaWQpID8gKCcnICsgZnVuYykgOiBfaWQ7XG4gICAgaWYgKCF0aGlzLmRlYm91bmNlVGltZXJzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2RlYm91bmNlVGltZXJzJywge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBwZW5kaW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzW2lkXTtcbiAgICBpZiAoIXBlbmRpbmdUaW1lcilcbiAgICAgIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0ge307XG5cbiAgICBwZW5kaW5nVGltZXIuZnVuYyA9IGZ1bmM7XG4gICAgY2xlYXJQZW5kaW5nVGltZW91dCgpO1xuXG4gICAgdmFyIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZTtcbiAgICBpZiAoIXByb21pc2UgfHwgIXByb21pc2UucGVuZGluZygpKSB7XG4gICAgICBsZXQgc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgbGV0IHJlc29sdmU7XG5cbiAgICAgIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSkgPT4ge1xuICAgICAgICByZXNvbHZlID0gX3Jlc29sdmU7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5yZXNvbHZlID0gKCkgPT4ge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAncGVuZGluZycpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHN0YXR1cyA9ICdmdWxmaWxsZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lci5mdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdmFyIHJldCA9IHBlbmRpbmdUaW1lci5mdW5jLmNhbGwodGhpcyk7XG4gICAgICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHJldCAmJiB0eXBlb2YgcmV0LnRoZW4gPT09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgcmV0LnRoZW4oKHZhbHVlKSA9PiByZXNvbHZlKHZhbHVlKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb2x2ZShyZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgIHN0YXR1cyA9ICdyZWplY3RlZCc7XG4gICAgICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSBudWxsO1xuXG4gICAgICAgIHByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5pc1BlbmRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiAoc3RhdHVzID09PSAncGVuZGluZycpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBwZW5kaW5nVGltZXIudGltZW91dCA9IHNldFRpbWVvdXQocHJvbWlzZS5yZXNvbHZlLCAodGltZSA9PSBudWxsKSA/IDI1MCA6IHRpbWUpO1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBjbGVhckRlYm91bmNlKGlkKSB7XG4gICAgdmFyIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdO1xuICAgIGlmIChwZW5kaW5nVGltZXIgPT0gbnVsbClcbiAgICAgIHJldHVybjtcblxuICAgIGlmIChwZW5kaW5nVGltZXIudGltZW91dClcbiAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZXIudGltZW91dCk7XG5cbiAgICBpZiAocGVuZGluZ1RpbWVyLnByb21pc2UpXG4gICAgICBwZW5kaW5nVGltZXIucHJvbWlzZS5jYW5jZWwoKTtcbiAgfVxuXG4gIGNsZWFyQWxsRGVib3VuY2VzKCkge1xuICAgIGxldCBkZWJvdW5jZVRpbWVycyAgPSB0aGlzLmRlYm91bmNlVGltZXJzIHx8IHt9O1xuICAgIGxldCBpZHMgICAgICAgICAgICAgPSBPYmplY3Qua2V5cyhkZWJvdW5jZVRpbWVycyk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBpZHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICAgIHRoaXMuY2xlYXJEZWJvdW5jZShpZHNbaV0pO1xuICB9XG5cbiAgZ2V0RWxlbWVudERhdGEoZWxlbWVudCkge1xuICAgIGxldCBkYXRhID0gZWxlbWVudERhdGFDYWNoZS5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICBkYXRhID0ge307XG4gICAgICBlbGVtZW50RGF0YUNhY2hlLnNldChlbGVtZW50LCBkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL2V2ZW50cy5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvZXZlbnRzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJFdmVudEVtaXR0ZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gRXZlbnRFbWl0dGVyKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG5jb25zdCBFVkVOVF9MSVNURU5FUlMgPSBTeW1ib2wuZm9yKCdAamlicy9ldmVudHMvbGlzdGVuZXJzJyk7XG5cbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgIFtFVkVOVF9MSVNURU5FUlNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbmV3IE1hcCgpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXZlbnQgbGlzdGVuZXIgbXVzdCBiZSBhIG1ldGhvZCcpO1xuXG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG5cbiAgICBpZiAoIXNjb3BlKSB7XG4gICAgICBzY29wZSA9IFtdO1xuICAgICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgc2NvcGUpO1xuICAgIH1cblxuICAgIHNjb3BlLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V2ZW50IGxpc3RlbmVyIG11c3QgYmUgYSBtZXRob2QnKTtcblxuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGxldCBpbmRleCA9IHNjb3BlLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKVxuICAgICAgc2NvcGUuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgaWYgKCFldmVudE1hcC5oYXMoZXZlbnROYW1lKSlcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgW10pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBlbWl0KGV2ZW50TmFtZSwgLi4uYXJncykge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUgfHwgc2NvcGUubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gc2NvcGUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGV2ZW50Q2FsbGJhY2sgPSBzY29wZVtpXTtcbiAgICAgIGV2ZW50Q2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvbmNlKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBsZXQgZnVuYyA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLm9mZihldmVudE5hbWUsIGZ1bmMpO1xuICAgICAgcmV0dXJuIGxpc3RlbmVyKC4uLmFyZ3MpO1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5vbihldmVudE5hbWUsIGZ1bmMpO1xuICB9XG5cbiAgb24oZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgb2ZmKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIGV2ZW50TmFtZXMoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpc1tFVkVOVF9MSVNURU5FUlNdLmtleXMoKSk7XG4gIH1cblxuICBsaXN0ZW5lckNvdW50KGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gMDtcblxuICAgIHJldHVybiBzY29wZS5sZW5ndGg7XG4gIH1cblxuICBsaXN0ZW5lcnMoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiBbXTtcblxuICAgIHJldHVybiBzY29wZS5zbGljZSgpO1xuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvamliLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9qaWIuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIiRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gJCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX0JBUlJFTlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBKSUJfQkFSUkVOKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKSUJfUFJPWFlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSklCX1BST1hZKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKaWJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSmliKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJjb25zdHJ1Y3RKaWJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gY29uc3RydWN0SmliKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJmYWN0b3J5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGZhY3RvcnkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzSmliaXNoXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzSmliaXNoKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJyZXNvbHZlQ2hpbGRyZW5cIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gcmVzb2x2ZUNoaWxkcmVuKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuXG5cblxuY2xhc3MgSmliIHtcbiAgY29uc3RydWN0b3IoVHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgbGV0IGRlZmF1bHRQcm9wcyA9IChUeXBlICYmIFR5cGUucHJvcHMpID8gVHlwZS5wcm9wcyA6IHt9O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ1R5cGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVHlwZSxcbiAgICAgIH0sXG4gICAgICAncHJvcHMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgeyAuLi5kZWZhdWx0UHJvcHMsIC4uLihwcm9wcyB8fCB7fSkgfSxcbiAgICAgIH0sXG4gICAgICAnY2hpbGRyZW4nOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uZmxhdHRlbkFycmF5KGNoaWxkcmVuKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgSklCX0JBUlJFTiAgPSBTeW1ib2wuZm9yKCdAamlicy5iYXJyZW4nKTtcbmNvbnN0IEpJQl9QUk9YWSAgID0gU3ltYm9sLmZvcignQGppYnMucHJveHknKTtcbmNvbnN0IEpJQiAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMuamliJyk7XG5cbmZ1bmN0aW9uIGZhY3RvcnkoSmliQ2xhc3MpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICQoX3R5cGUsIHByb3BzID0ge30pIHtcbiAgICBpZiAoaXNKaWJpc2goX3R5cGUpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUmVjZWl2ZWQgYSBqaWIgYnV0IGV4cGVjdGVkIGEgY29tcG9uZW50LicpO1xuXG4gICAgbGV0IFR5cGUgPSAoX3R5cGUgPT0gbnVsbCkgPyBKSUJfUFJPWFkgOiBfdHlwZTtcblxuICAgIGZ1bmN0aW9uIGJhcnJlbiguLi5fY2hpbGRyZW4pIHtcbiAgICAgIGxldCBjaGlsZHJlbiA9IF9jaGlsZHJlbjtcblxuICAgICAgZnVuY3Rpb24gamliKCkge1xuICAgICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihUeXBlLCAncHJvbWlzZScpIHx8IGNoaWxkcmVuLnNvbWUoKGNoaWxkKSA9PiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKGNoaWxkLCAncHJvbWlzZScpKSkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbIFR5cGUgXS5jb25jYXQoY2hpbGRyZW4pKS50aGVuKChhbGwpID0+IHtcbiAgICAgICAgICAgIFR5cGUgPSBhbGxbMF07XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGFsbC5zbGljZSgxKTtcblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBKaWJDbGFzcyhcbiAgICAgICAgICAgICAgVHlwZSxcbiAgICAgICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgSmliQ2xhc3MoXG4gICAgICAgICAgVHlwZSxcbiAgICAgICAgICBwcm9wcyxcbiAgICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoamliLCB7XG4gICAgICAgIFtKSUJdOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBbZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5pZFN5bV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogICAgICAgICgpID0+IFR5cGUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGppYjtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhiYXJyZW4sIHtcbiAgICAgIFtKSUJfQkFSUkVOXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICB9LFxuICAgICAgW2RlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uaWRTeW1dOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgKCkgPT4gVHlwZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gYmFycmVuO1xuICB9O1xufVxuXG5jb25zdCAkID0gZmFjdG9yeShKaWIpO1xuXG5mdW5jdGlvbiBpc0ppYmlzaCh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmICh2YWx1ZVtKSUJfQkFSUkVOXSB8fCB2YWx1ZVtKSUJdKSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBKaWIpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RKaWIodmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSmliKVxuICAgIHJldHVybiB2YWx1ZTtcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKHZhbHVlW0pJQl9CQVJSRU5dKVxuICAgICAgcmV0dXJuIHZhbHVlKCkoKTtcbiAgICBlbHNlIGlmICh2YWx1ZVtKSUJdKVxuICAgICAgcmV0dXJuIHZhbHVlKCk7XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdjb25zdHJ1Y3RKaWI6IFByb3ZpZGVkIHZhbHVlIGlzIG5vdCBhIEppYi4nKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUNoaWxkcmVuKF9jaGlsZHJlbikge1xuICBsZXQgY2hpbGRyZW4gPSBfY2hpbGRyZW47XG5cbiAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoY2hpbGRyZW4sICdwcm9taXNlJykpXG4gICAgY2hpbGRyZW4gPSBhd2FpdCBjaGlsZHJlbjtcblxuICBpZiAoISgodGhpcy5pc0l0ZXJhYmxlQ2hpbGQgfHwgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXNJdGVyYWJsZUNoaWxkKS5jYWxsKHRoaXMsIGNoaWxkcmVuKSkgJiYgKGlzSmliaXNoKGNoaWxkcmVuKSB8fCAoKHRoaXMuaXNWYWxpZENoaWxkIHx8IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmlzVmFsaWRDaGlsZCkuY2FsbCh0aGlzLCBjaGlsZHJlbikpKSlcbiAgICBjaGlsZHJlbiA9IFsgY2hpbGRyZW4gXTtcblxuICBsZXQgcHJvbWlzZXMgPSBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pdGVyYXRlKGNoaWxkcmVuLCBhc3luYyAoeyB2YWx1ZTogX2NoaWxkIH0pID0+IHtcbiAgICBsZXQgY2hpbGQgPSAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihfY2hpbGQsICdwcm9taXNlJykpID8gYXdhaXQgX2NoaWxkIDogX2NoaWxkO1xuXG4gICAgaWYgKGlzSmliaXNoKGNoaWxkKSlcbiAgICAgIHJldHVybiBhd2FpdCBjb25zdHJ1Y3RKaWIoY2hpbGQpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBjaGlsZDtcbiAgfSk7XG5cbiAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9yZW5kZXJlcnMvY29tbWVudC1lbGVtZW50LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL2NvbW1lbnQtZWxlbWVudC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNvbW1lbnRFbGVtZW50XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENvbW1lbnRFbGVtZW50KVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LWVsZW1lbnQuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1lbGVtZW50LmpzXCIpO1xuXG5cbmNsYXNzIENvbW1lbnRFbGVtZW50IGV4dGVuZHMgX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3RFbGVtZW50IHtcbiAgc3RhdGljIFRZUEUgPSBfcm9vdF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdEVsZW1lbnQuVFlQRV9DT01NRU5UO1xuXG4gIGNvbnN0cnVjdG9yKGlkLCB2YWx1ZSwgcHJvcHMpIHtcbiAgICBzdXBlcihfcm9vdF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdEVsZW1lbnQuVFlQRV9DT01NRU5ULCBpZCwgdmFsdWUsIHByb3BzKTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3JlbmRlcmVycy9pbmRleC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDT05URVhUX0lEXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5DT05URVhUX0lEKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDb21tZW50RWxlbWVudFwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfY29tbWVudF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uQ29tbWVudEVsZW1lbnQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkZPUkNFX1JFRkxPV1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBGT1JDRV9SRUZMT1cpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIk5hdGl2ZUVsZW1lbnRcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX25hdGl2ZV9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV80X18uTmF0aXZlRWxlbWVudCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUG9ydGFsRWxlbWVudFwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfcG9ydGFsX2VsZW1lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzVfXy5Qb3J0YWxFbGVtZW50KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSZW5kZXJlclwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfcmVuZGVyZXJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5SZW5kZXJlciksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUm9vdEVsZW1lbnRcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJvb3RFbGVtZW50KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSb290Tm9kZVwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdE5vZGUpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlRleHRFbGVtZW50XCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF90ZXh0X2VsZW1lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzZfXy5UZXh0RWxlbWVudClcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcm9vdC1ub2RlLmpzICovIFwiLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfcmVuZGVyZXJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcmVuZGVyZXIuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcmVuZGVyZXIuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LWVsZW1lbnQuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1lbGVtZW50LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9jb21tZW50X2VsZW1lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vY29tbWVudC1lbGVtZW50LmpzICovIFwiLi9saWIvcmVuZGVyZXJzL2NvbW1lbnQtZWxlbWVudC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfbmF0aXZlX2VsZW1lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzRfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vbmF0aXZlLWVsZW1lbnQuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvbmF0aXZlLWVsZW1lbnQuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3BvcnRhbF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV81X18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3BvcnRhbC1lbGVtZW50LmpzICovIFwiLi9saWIvcmVuZGVyZXJzL3BvcnRhbC1lbGVtZW50LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF90ZXh0X2VsZW1lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzZfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdGV4dC1lbGVtZW50LmpzICovIFwiLi9saWIvcmVuZGVyZXJzL3RleHQtZWxlbWVudC5qc1wiKTtcblxuXG5jb25zdCBGT1JDRV9SRUZMT1cgPSBTeW1ib2wuZm9yKCdAamlic0ZvcmNlUmVmbG93Jyk7XG5cblxuXG5cblxuXG5cblxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3JlbmRlcmVycy9uYXRpdmUtZWxlbWVudC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL25hdGl2ZS1lbGVtZW50LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJOYXRpdmVFbGVtZW50XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIE5hdGl2ZUVsZW1lbnQpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfcm9vdF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3Jvb3QtZWxlbWVudC5qcyAqLyBcIi4vbGliL3JlbmRlcmVycy9yb290LWVsZW1lbnQuanNcIik7XG5cblxuY2xhc3MgTmF0aXZlRWxlbWVudCBleHRlbmRzIF9yb290X2VsZW1lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5Sb290RWxlbWVudCB7XG4gIHN0YXRpYyBUWVBFID0gX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3RFbGVtZW50LlRZUEVfRUxFTUVOVDtcblxuICBjb25zdHJ1Y3RvcihpZCwgdmFsdWUsIHByb3BzKSB7XG4gICAgc3VwZXIoX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3RFbGVtZW50LlRZUEVfRUxFTUVOVCwgaWQsIHZhbHVlLCBwcm9wcyk7XG4gIH1cbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9yZW5kZXJlcnMvcG9ydGFsLWVsZW1lbnQuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3JlbmRlcmVycy9wb3J0YWwtZWxlbWVudC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUG9ydGFsRWxlbWVudFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBQb3J0YWxFbGVtZW50KVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LWVsZW1lbnQuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1lbGVtZW50LmpzXCIpO1xuXG5cbmNsYXNzIFBvcnRhbEVsZW1lbnQgZXh0ZW5kcyBfcm9vdF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdEVsZW1lbnQge1xuICBzdGF0aWMgVFlQRSA9IF9yb290X2VsZW1lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5Sb290RWxlbWVudC5UWVBFX1BPUlRBTDtcblxuICBjb25zdHJ1Y3RvcihpZCwgdmFsdWUsIHByb3BzKSB7XG4gICAgc3VwZXIoX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3RFbGVtZW50LlRZUEVfUE9SVEFMLCBpZCwgdmFsdWUsIHByb3BzKTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3JlbmRlcmVycy9yZW5kZXJlci5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSZW5kZXJlclwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBSZW5kZXJlcilcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9ldmVudHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4uL2V2ZW50cy5qcyAqLyBcIi4vbGliL2V2ZW50cy5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4uL3V0aWxzLmpzICovIFwiLi9saWIvdXRpbHMuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LW5vZGUuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzXCIpO1xuXG5cblxuXG5sZXQgX2NvbnRleHRJRENvdW50ZXIgPSAwbjtcblxuY2xhc3MgUmVuZGVyZXIgZXh0ZW5kcyBfZXZlbnRzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uRXZlbnRFbWl0dGVyIHtcbiAgc3RhdGljIFJvb3ROb2RlID0gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJvb3ROb2RlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnY29udGV4dCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdGhpcy5jcmVhdGVDb250ZXh0KCksXG4gICAgICB9LFxuICAgICAgJ2Rlc3Ryb3lpbmcnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGZhbHNlLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJGcmFtZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgMCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVDb250ZXh0KHJvb3RDb250ZXh0LCBvblVwZGF0ZSwgb25VcGRhdGVUaGlzKSB7XG4gICAgbGV0IGNvbnRleHQgICAgID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgbXlDb250ZXh0SUQgPSAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLkNPTlRFWFRfSURdIDogMW47XG5cbiAgICByZXR1cm4gbmV3IFByb3h5KGNvbnRleHQsIHtcbiAgICAgIGdldDogKHRhcmdldCwgcHJvcE5hbWUpID0+IHtcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uQ09OVEVYVF9JRCkge1xuICAgICAgICAgIGxldCBwYXJlbnRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uQ09OVEVYVF9JRF0gOiAxbjtcbiAgICAgICAgICByZXR1cm4gKHBhcmVudElEID4gbXlDb250ZXh0SUQpID8gcGFyZW50SUQgOiBteUNvbnRleHRJRDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCwgcHJvcE5hbWUpKVxuICAgICAgICAgIHJldHVybiAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbcHJvcE5hbWVdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgfSxcbiAgICAgIHNldDogKHRhcmdldCwgcHJvcE5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmIChwcm9wTmFtZSA9PT0gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLkNPTlRFWFRfSUQpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgaWYgKHRhcmdldFtwcm9wTmFtZV0gPT09IHZhbHVlKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIG15Q29udGV4dElEID0gKytfY29udGV4dElEQ291bnRlcjtcbiAgICAgICAgdGFyZ2V0W3Byb3BOYW1lXSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb25VcGRhdGUgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgb25VcGRhdGUuY2FsbChvblVwZGF0ZVRoaXMsIG9uVXBkYXRlVGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvcmVuZGVyZXJzL3Jvb3QtZWxlbWVudC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3JlbmRlcmVycy9yb290LWVsZW1lbnQuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSb290RWxlbWVudFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBSb290RWxlbWVudClcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuXG5jb25zdCBUWVBFX0VMRU1FTlQgID0gMTtcbmNvbnN0IFRZUEVfVEVYVCAgICAgPSAzO1xuY29uc3QgVFlQRV9DT01NRU5UICA9IDg7XG5jb25zdCBUWVBFX1BPUlRBTCAgID0gMTU7XG5cbmNsYXNzIFJvb3RFbGVtZW50IHtcbiAgc3RhdGljIFRZUEVfRUxFTUVOVCAgPSBUWVBFX0VMRU1FTlQ7XG5cbiAgc3RhdGljIFRZUEVfVEVYVCAgICAgPSBUWVBFX1RFWFQ7XG5cbiAgc3RhdGljIFRZUEVfQ09NTUVOVCAgPSBUWVBFX0NPTU1FTlQ7XG5cbiAgc3RhdGljIFRZUEVfUE9SVEFMICAgPSBUWVBFX1BPUlRBTDtcblxuICBjb25zdHJ1Y3Rvcih0eXBlLCBpZCwgdmFsdWUsIHByb3BzKSB7XG4gICAgdGhpcy5pc0ppYnNWaXJ0dWFsRWxlbWVudCA9IHRydWU7XG4gICAgdGhpcy50eXBlICAgPSB0eXBlO1xuICAgIHRoaXMuaWQgICAgID0gaWQ7XG4gICAgdGhpcy52YWx1ZSAgPSB2YWx1ZTtcbiAgICB0aGlzLnByb3BzICA9IHByb3BzIHx8IHt9O1xuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDT05URVhUX0lEXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENPTlRFWFRfSUQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJvb3ROb2RlXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFJvb3ROb2RlKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuXG5cbmNvbnN0IENPTlRFWFRfSUQgPSBTeW1ib2wuZm9yKCdAamlicy9ub2RlL2NvbnRleHRJRCcpO1xuXG5sZXQgdXVpZCA9IDE7XG5cbmNsYXNzIFJvb3ROb2RlIHtcbiAgc3RhdGljIENPTlRFWFRfSUQgPSBDT05URVhUX0lEO1xuXG4gIGNvbnN0cnVjdG9yKHJlbmRlcmVyLCBwYXJlbnQsIF9jb250ZXh0KSB7XG4gICAgbGV0IGNvbnRleHQgPSByZW5kZXJlci5jcmVhdGVDb250ZXh0KFxuICAgICAgX2NvbnRleHQsXG4gICAgICAodGhpcy5vbkNvbnRleHRVcGRhdGUpID8gdGhpcy5vbkNvbnRleHRVcGRhdGUgOiB1bmRlZmluZWQsXG4gICAgICB0aGlzLFxuICAgICk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdXVpZCsrLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJlcic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcmVuZGVyZXIsXG4gICAgICB9LFxuICAgICAgJ3BhcmVudCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcGFyZW50LFxuICAgICAgfSxcbiAgICAgICdjb250ZXh0Jzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICAgICAgICAgICgpID0+IHt9LFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJQcm9taXNlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdkZXN0cm95aW5nJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBmYWxzZSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyRnJhbWUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIDAsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gIH1cblxuICBpc1ZhbGlkQ2hpbGQoY2hpbGQpIHtcbiAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uaXNWYWxpZENoaWxkKGNoaWxkKTtcbiAgfVxuXG4gIGlzSXRlcmFibGVDaGlsZChjaGlsZCkge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5pc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgcHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cykge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5wcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKTtcbiAgfVxuXG4gIGNoaWxkcmVuRGlmZmVyKG9sZENoaWxkcmVuLCBuZXdDaGlsZHJlbikge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5jaGlsZHJlbkRpZmZlcihvbGRDaGlsZHJlbiwgbmV3Q2hpbGRyZW4pO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKGppYiwgcmVuZGVyQ29udGV4dCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLnJlbmRlckZyYW1lKys7XG5cbiAgICByZXR1cm4gdGhpcy5fcmVuZGVyKGppYiwgcmVuZGVyQ29udGV4dClcbiAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJQcm9taXNlID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IG51bGw7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfSk7XG4gIH1cbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9yZW5kZXJlcnMvdGV4dC1lbGVtZW50LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL3RleHQtZWxlbWVudC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlRleHRFbGVtZW50XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFRleHRFbGVtZW50KVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LWVsZW1lbnQuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1lbGVtZW50LmpzXCIpO1xuXG5cbmNsYXNzIFRleHRFbGVtZW50IGV4dGVuZHMgX3Jvb3RfZWxlbWVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3RFbGVtZW50IHtcbiAgc3RhdGljIFRZUEUgPSBfcm9vdF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdEVsZW1lbnQuVFlQRV9URVhUO1xuXG4gIGNvbnN0cnVjdG9yKGlkLCB2YWx1ZSwgcHJvcHMpIHtcbiAgICBzdXBlcihfcm9vdF9lbGVtZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdEVsZW1lbnQuVFlQRV9URVhULCBpZCwgdmFsdWUsIHByb3BzKTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3V0aWxzLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3V0aWxzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImJpbmRNZXRob2RzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGJpbmRNZXRob2RzKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJjaGlsZHJlbkRpZmZlclwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBjaGlsZHJlbkRpZmZlciksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmV0Y2hEZWVwUHJvcGVydHlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gZmV0Y2hEZWVwUHJvcGVydHkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImZsYXR0ZW5BcnJheVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBmbGF0dGVuQXJyYXkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImluc3RhbmNlT2ZcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaW5zdGFuY2VPZiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaXNFbXB0eVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc0VtcHR5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc0l0ZXJhYmxlQ2hpbGRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXNJdGVyYWJsZUNoaWxkKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc05vdEVtcHR5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzTm90RW1wdHkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzVmFsaWRDaGlsZFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc1ZhbGlkQ2hpbGQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIml0ZXJhdGVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXRlcmF0ZSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwibm93XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIG5vdyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwicHJvcHNEaWZmZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gcHJvcHNEaWZmZXIpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcInNpemVPZlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBzaXplT2YpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgZGVhZGJlZWYgKi8gXCIuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanNcIik7XG5cblxuY29uc3QgU1RPUCA9IFN5bWJvbC5mb3IoJ0BqaWJzSXRlcmF0ZVN0b3AnKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5lc3RlZC10ZXJuYXJ5XG5jb25zdCBnbG9iYWxTY29wZSA9ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgPyBnbG9iYWwgOiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpbnN0YW5jZU9mKG9iaikge1xuICBmdW5jdGlvbiB0ZXN0VHlwZShvYmosIF92YWwpIHtcbiAgICBmdW5jdGlvbiBpc0RlZmVycmVkVHlwZShvYmopIHtcbiAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBQcm9taXNlIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdQcm9taXNlJykpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAvLyBRdWFjayBxdWFjay4uLlxuICAgICAgaWYgKHR5cGVvZiBvYmoudGhlbiA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLmNhdGNoID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCB2YWwgICAgID0gX3ZhbDtcbiAgICBsZXQgdHlwZU9mICA9ICh0eXBlb2Ygb2JqKTtcblxuICAgIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlN0cmluZylcbiAgICAgIHZhbCA9ICdzdHJpbmcnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuTnVtYmVyKVxuICAgICAgdmFsID0gJ251bWJlcic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5Cb29sZWFuKVxuICAgICAgdmFsID0gJ2Jvb2xlYW4nO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuRnVuY3Rpb24pXG4gICAgICB2YWwgPSAnZnVuY3Rpb24nO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQXJyYXkpXG4gICAgICB2YWwgPSAnYXJyYXknO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuT2JqZWN0KVxuICAgICAgdmFsID0gJ29iamVjdCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5Qcm9taXNlKVxuICAgICAgdmFsID0gJ3Byb21pc2UnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQmlnSW50KVxuICAgICAgdmFsID0gJ2JpZ2ludCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5NYXApXG4gICAgICB2YWwgPSAnbWFwJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLldlYWtNYXApXG4gICAgICB2YWwgPSAnd2Vha21hcCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TZXQpXG4gICAgICB2YWwgPSAnc2V0JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlN5bWJvbClcbiAgICAgIHZhbCA9ICdzeW1ib2wnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQnVmZmVyKVxuICAgICAgdmFsID0gJ2J1ZmZlcic7XG5cbiAgICBpZiAodmFsID09PSAnYnVmZmVyJyAmJiBnbG9iYWxTY29wZS5CdWZmZXIgJiYgZ2xvYmFsU2NvcGUuQnVmZmVyLmlzQnVmZmVyKG9iaikpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdudW1iZXInICYmICh0eXBlT2YgPT09ICdudW1iZXInIHx8IG9iaiBpbnN0YW5jZW9mIE51bWJlciB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnTnVtYmVyJykpKSB7XG4gICAgICBpZiAoIWlzRmluaXRlKG9iaikpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHZhbCAhPT0gJ29iamVjdCcgJiYgdmFsID09PSB0eXBlT2YpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoKG9iai5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JykpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gTnVsbCBwcm90b3R5cGUgb24gb2JqZWN0XG4gICAgICBpZiAodHlwZU9mID09PSAnb2JqZWN0JyAmJiAhb2JqLmNvbnN0cnVjdG9yKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh2YWwgPT09ICdhcnJheScgJiYgKEFycmF5LmlzQXJyYXkob2JqKSB8fCBvYmogaW5zdGFuY2VvZiBBcnJheSB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQXJyYXknKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICgodmFsID09PSAncHJvbWlzZScgfHwgdmFsID09PSAnZGVmZXJyZWQnKSAmJiBpc0RlZmVycmVkVHlwZShvYmopKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnc3RyaW5nJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuU3RyaW5nIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTdHJpbmcnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdib29sZWFuJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuQm9vbGVhbiB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQm9vbGVhbicpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ21hcCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLk1hcCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnTWFwJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnd2Vha21hcCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLldlYWtNYXAgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1dlYWtNYXAnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdzZXQnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5TZXQgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1NldCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlT2YgPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nICYmIG9iaiBpbnN0YW5jZW9mIHZhbClcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdmFsKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAob2JqID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSAxLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAodGVzdFR5cGUob2JqLCBhcmd1bWVudHNbaV0pID09PSB0cnVlKVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpIHtcbiAgaWYgKG9sZFByb3BzID09PSBuZXdQcm9wcylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBvbGRQcm9wcyAhPT0gdHlwZW9mIG5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmICghb2xkUHJvcHMgJiYgbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKG9sZFByb3BzICYmICFuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZXFlcWVxXG4gIGlmICghb2xkUHJvcHMgJiYgIW5ld1Byb3BzICYmIG9sZFByb3BzICE9IG9sZFByb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGxldCBhS2V5cyA9IE9iamVjdC5rZXlzKG9sZFByb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvbGRQcm9wcykpO1xuICBsZXQgYktleXMgPSBPYmplY3Qua2V5cyhuZXdQcm9wcykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMobmV3UHJvcHMpKTtcblxuICBpZiAoYUtleXMubGVuZ3RoICE9PSBiS2V5cy5sZW5ndGgpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYUtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBhS2V5ID0gYUtleXNbaV07XG4gICAgaWYgKHNraXBLZXlzICYmIHNraXBLZXlzLmluZGV4T2YoYUtleSkgPj0gMClcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKG9sZFByb3BzW2FLZXldICE9PSBuZXdQcm9wc1thS2V5XSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgbGV0IGJLZXkgPSBiS2V5c1tpXTtcbiAgICBpZiAoc2tpcEtleXMgJiYgc2tpcEtleXMuaW5kZXhPZihiS2V5KSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKGFLZXkgPT09IGJLZXkpXG4gICAgICBjb250aW51ZTtcblxuICAgIGlmIChvbGRQcm9wc1tiS2V5XSAhPT0gbmV3UHJvcHNbYktleV0pXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc2l6ZU9mKHZhbHVlKSB7XG4gIGlmICghdmFsdWUpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKE9iamVjdC5pcyhJbmZpbml0eSkpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInKVxuICAgIHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIF9pdGVyYXRlKG9iaiwgY2FsbGJhY2spIHtcbiAgaWYgKCFvYmogfHwgT2JqZWN0LmlzKEluZmluaXR5KSlcbiAgICByZXR1cm4gW107XG5cbiAgbGV0IHJlc3VsdHMgICA9IFtdO1xuICBsZXQgc2NvcGUgICAgID0geyBjb2xsZWN0aW9uOiBvYmosIFNUT1AgfTtcbiAgbGV0IHJlc3VsdDtcblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgc2NvcGUudHlwZSA9ICdBcnJheSc7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBvYmoubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgc2NvcGUudmFsdWUgPSBvYmpbaV07XG4gICAgICBzY29wZS5pbmRleCA9IHNjb3BlLmtleSA9IGk7XG5cbiAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmVudHJpZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgU2V0IHx8IG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2V0Jykge1xuICAgICAgc2NvcGUudHlwZSA9ICdTZXQnO1xuXG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBvYmoudmFsdWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSBpdGVtO1xuICAgICAgICBzY29wZS5rZXkgPSBpdGVtO1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3BlLnR5cGUgPSBvYmouY29uc3RydWN0b3IubmFtZTtcblxuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IFsga2V5LCB2YWx1ZSBdIG9mIG9iai5lbnRyaWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgc2NvcGUua2V5ID0ga2V5O1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChpbnN0YW5jZU9mKG9iaiwgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ2JpZ2ludCcsICdmdW5jdGlvbicpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgc2NvcGUudHlwZSA9IChvYmouY29uc3RydWN0b3IpID8gb2JqLmNvbnN0cnVjdG9yLm5hbWUgOiAnT2JqZWN0JztcblxuICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBrZXkgICA9IGtleXNbaV07XG4gICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgIHNjb3BlLmtleSA9IGtleTtcbiAgICAgIHNjb3BlLmluZGV4ID0gaTtcblxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICBicmVhaztcblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKF9pdGVyYXRlLCB7XG4gICdTVE9QJzoge1xuICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHZhbHVlOiAgICAgICAgU1RPUCxcbiAgfSxcbn0pO1xuXG5jb25zdCBpdGVyYXRlID0gX2l0ZXJhdGU7XG5cbmZ1bmN0aW9uIGNoaWxkcmVuRGlmZmVyKF9jaGlsZHJlbjEsIF9jaGlsZHJlbjIpIHtcbiAgbGV0IGNoaWxkcmVuMSA9ICghQXJyYXkuaXNBcnJheShfY2hpbGRyZW4xKSkgPyBbIF9jaGlsZHJlbjEgXSA6IF9jaGlsZHJlbjE7XG4gIGxldCBjaGlsZHJlbjIgPSAoIUFycmF5LmlzQXJyYXkoX2NoaWxkcmVuMikpID8gWyBfY2hpbGRyZW4yIF0gOiBfY2hpbGRyZW4yO1xuXG4gIHJldHVybiAoZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyguLi5jaGlsZHJlbjEpICE9PSBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKC4uLmNoaWxkcmVuMikpO1xufVxuXG5mdW5jdGlvbiBmZXRjaERlZXBQcm9wZXJ0eShvYmosIF9rZXksIGRlZmF1bHRWYWx1ZSwgbGFzdFBhcnQpIHtcbiAgaWYgKG9iaiA9PSBudWxsIHx8IE9iamVjdC5pcyhOYU4sIG9iaikgfHwgT2JqZWN0LmlzKEluZmluaXR5LCBvYmopKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIG51bGwgXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBpZiAoX2tleSA9PSBudWxsIHx8IE9iamVjdC5pcyhOYU4sIF9rZXkpIHx8IE9iamVjdC5pcyhJbmZpbml0eSwgX2tleSkpXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgbnVsbCBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGxldCBwYXJ0cztcblxuICBpZiAoQXJyYXkuaXNBcnJheShfa2V5KSkge1xuICAgIHBhcnRzID0gX2tleTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgX2tleSA9PT0gJ3N5bWJvbCcpIHtcbiAgICBwYXJ0cyA9IFsgX2tleSBdO1xuICB9IGVsc2Uge1xuICAgIGxldCBrZXkgICAgICAgICA9ICgnJyArIF9rZXkpO1xuICAgIGxldCBsYXN0SW5kZXggICA9IDA7XG4gICAgbGV0IGxhc3RDdXJzb3IgID0gMDtcblxuICAgIHBhcnRzID0gW107XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc3RhbnQtY29uZGl0aW9uXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGxldCBpbmRleCA9IGtleS5pbmRleE9mKCcuJywgbGFzdEluZGV4KTtcbiAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgcGFydHMucHVzaChrZXkuc3Vic3RyaW5nKGxhc3RDdXJzb3IpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXkuY2hhckF0KGluZGV4IC0gMSkgPT09ICdcXFxcJykge1xuICAgICAgICBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGtleS5zdWJzdHJpbmcobGFzdEN1cnNvciwgaW5kZXgpKTtcbiAgICAgIGxhc3RDdXJzb3IgPSBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgfVxuICB9XG5cbiAgbGV0IHBhcnROID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gIGlmIChwYXJ0cy5sZW5ndGggPT09IDApXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgcGFydE4gXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBsZXQgY3VycmVudFZhbHVlID0gb2JqO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBwYXJ0cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGtleSA9IHBhcnRzW2ldO1xuXG4gICAgY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlW2tleV07XG4gICAgaWYgKGN1cnJlbnRWYWx1ZSA9PSBudWxsKVxuICAgICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgcGFydE4gXSA6IGRlZmF1bHRWYWx1ZTtcbiAgfVxuXG4gIHJldHVybiAobGFzdFBhcnQpID8gWyBjdXJyZW50VmFsdWUsIHBhcnROIF0gOiBjdXJyZW50VmFsdWU7XG59XG5cbmZ1bmN0aW9uIGJpbmRNZXRob2RzKF9wcm90bywgc2tpcFByb3Rvcykge1xuICBsZXQgcHJvdG8gICAgICAgICAgID0gX3Byb3RvO1xuICBsZXQgYWxyZWFkeVZpc2l0ZWQgID0gbmV3IFNldCgpO1xuXG4gIHdoaWxlIChwcm90bykge1xuICAgIGxldCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHByb3RvKTtcbiAgICBsZXQga2V5cyAgICAgICAgPSBPYmplY3Qua2V5cyhkZXNjcmlwdG9ycykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZGVzY3JpcHRvcnMpKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICBpZiAoa2V5ID09PSAnY29uc3RydWN0b3InKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKGFscmVhZHlWaXNpdGVkLmhhcyhrZXkpKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgYWxyZWFkeVZpc2l0ZWQuYWRkKGtleSk7XG5cbiAgICAgIGxldCB2YWx1ZSA9IHByb3RvW2tleV07XG5cbiAgICAgIC8vIFNraXAgcHJvdG90eXBlIG9mIE9iamVjdFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvdHlwZS1idWlsdGluc1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBPYmplY3QucHJvdG90eXBlW2tleV0gPT09IHZhbHVlKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHRoaXNba2V5XSA9IHZhbHVlLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgIGlmIChwcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSlcbiAgICAgIGJyZWFrO1xuXG4gICAgaWYgKHNraXBQcm90b3MgJiYgc2tpcFByb3Rvcy5pbmRleE9mKHByb3RvKSA+PSAwKVxuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIE5hTikpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKGluc3RhbmNlT2YodmFsdWUsICdzdHJpbmcnKSlcbiAgICByZXR1cm4gISgvXFxTLykudGVzdCh2YWx1ZSk7XG4gIGVsc2UgaWYgKGluc3RhbmNlT2YodmFsdWUsICdudW1iZXInKSAmJiBpc0Zpbml0ZSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBlbHNlIGlmICghaW5zdGFuY2VPZih2YWx1ZSwgJ2Jvb2xlYW4nLCAnYmlnaW50JywgJ2Z1bmN0aW9uJykgJiYgc2l6ZU9mKHZhbHVlKSA9PT0gMClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzTm90RW1wdHkodmFsdWUpIHtcbiAgcmV0dXJuICFpc0VtcHR5LmNhbGwodGhpcywgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuQXJyYXkodmFsdWUpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICByZXR1cm4gdmFsdWU7XG5cbiAgbGV0IG5ld0FycmF5ID0gW107XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQgaXRlbSA9IHZhbHVlW2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKVxuICAgICAgbmV3QXJyYXkgPSBuZXdBcnJheS5jb25jYXQoZmxhdHRlbkFycmF5KGl0ZW0pKTtcbiAgICBlbHNlXG4gICAgICBuZXdBcnJheS5wdXNoKGl0ZW0pO1xuICB9XG5cbiAgcmV0dXJuIG5ld0FycmF5O1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkQ2hpbGQoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgY2hpbGQgPT09ICdib29sZWFuJylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKGNoaWxkLCBOYU4pKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gIGlmIChjaGlsZCA9PSBudWxsIHx8IE9iamVjdC5pcyhjaGlsZCwgTmFOKSB8fCBPYmplY3QuaXMoY2hpbGQsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIChBcnJheS5pc0FycmF5KGNoaWxkKSB8fCB0eXBlb2YgY2hpbGQgPT09ICdvYmplY3QnICYmICFpbnN0YW5jZU9mKGNoaWxkLCAnYm9vbGVhbicsICdudW1iZXInLCAnc3RyaW5nJykpO1xufVxuXG5mdW5jdGlvbiBub3coKSB7XG4gIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICBlbHNlXG4gICAgcmV0dXJuIERhdGUubm93KCk7XG59XG5cblxuLyoqKi8gfSlcblxuLyoqKioqKi8gfSk7XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gLy8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gdmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuLyoqKioqKi8gXG4vKioqKioqLyAvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuLyoqKioqKi8gZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuLyoqKioqKi8gXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbi8qKioqKiovIFx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG4vKioqKioqLyBcdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuLyoqKioqKi8gXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIFx0fVxuLyoqKioqKi8gXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG4vKioqKioqLyBcdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcbi8qKioqKiovIFx0XHRleHBvcnRzOiB7fVxuLyoqKioqKi8gXHR9O1xuLyoqKioqKi8gXG4vKioqKioqLyBcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuLyoqKioqKi8gXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcbi8qKioqKiovIFxuLyoqKioqKi8gXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuLyoqKioqKi8gXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyB9XG4vKioqKioqLyBcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcbi8qKioqKiovIFx0XHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG4vKioqKioqLyBcdFx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcbi8qKioqKiovIFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdH07XG4vKioqKioqLyB9KSgpO1xuLyoqKioqKi8gXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsICovXG4vKioqKioqLyAoKCkgPT4ge1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG4vKioqKioqLyBcdFx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG4vKioqKioqLyBcdFx0dHJ5IHtcbi8qKioqKiovIFx0XHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuLyoqKioqKi8gXHRcdH0gY2F0Y2ggKGUpIHtcbi8qKioqKiovIFx0XHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyB9KSgpO1xuLyoqKioqKi8gXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kICovXG4vKioqKioqLyAoKCkgPT4ge1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpXG4vKioqKioqLyB9KSgpO1xuLyoqKioqKi8gXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0ICovXG4vKioqKioqLyAoKCkgPT4ge1xuLyoqKioqKi8gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG4vKioqKioqLyBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4vKioqKioqLyBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKioqKiovIFx0fTtcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IHt9O1xuLy8gVGhpcyBlbnRyeSBuZWVkIHRvIGJlIHdyYXBwZWQgaW4gYW4gSUlGRSBiZWNhdXNlIGl0IG5lZWQgdG8gYmUgaXNvbGF0ZWQgYWdhaW5zdCBvdGhlciBtb2R1bGVzIGluIHRoZSBjaHVuay5cbigoKSA9PiB7XG4vKiEqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL2luZGV4LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqL1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCIkXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy4kKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDb21wb25lbnRcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkNvbXBvbmVudCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ29tcG9uZW50c1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBDb21wb25lbnRzKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKaWJzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEppYnMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJlbmRlcmVyc1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBSZW5kZXJlcnMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlV0aWxzXCI6ICgpID0+ICgvKiByZWV4cG9ydCBtb2R1bGUgb2JqZWN0ICovIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJkZWFkYmVlZlwiOiAoKSA9PiAoLyogcmVleHBvcnQgZGVmYXVsdCBleHBvcnQgZnJvbSBuYW1lZCBtb2R1bGUgKi8gZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzRfXyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmFjdG9yeVwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uZmFjdG9yeSlcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vamliLmpzICovIFwiLi9saWIvamliLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vY29tcG9uZW50LmpzICovIFwiLi9saWIvY29tcG9uZW50LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcmVuZGVyZXJzL2luZGV4LmpzICovIFwiLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV80X18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcblxuXG5jb25zdCBKaWJzID0ge1xuICBKSUJfQkFSUkVOOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCX0JBUlJFTixcbiAgSklCX1BST1hZOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCX1BST1hZLFxuICBKSUI6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUIsXG4gIEppYjogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkppYixcbiAgaXNKaWJpc2g6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5pc0ppYmlzaCxcbiAgY29uc3RydWN0SmliOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uY29uc3RydWN0SmliLFxuICByZXNvbHZlQ2hpbGRyZW46IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5yZXNvbHZlQ2hpbGRyZW4sXG59O1xuXG5cblxuY29uc3QgQ29tcG9uZW50cyA9IHtcbiAgVVBEQVRFX0VWRU5UOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uVVBEQVRFX0VWRU5ULFxuICBRVUVVRV9VUERBVEVfTUVUSE9EOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uUVVFVUVfVVBEQVRFX01FVEhPRCxcbiAgRkxVU0hfVVBEQVRFX01FVEhPRDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkZMVVNIX1VQREFURV9NRVRIT0QsXG4gIElOSVRfTUVUSE9EOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uSU5JVF9NRVRIT0QsXG4gIFNLSVBfU1RBVEVfVVBEQVRFUzogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlNLSVBfU1RBVEVfVVBEQVRFUyxcbiAgUEVORElOR19TVEFURV9VUERBVEU6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5QRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRTogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkxBU1RfUkVOREVSX1RJTUUsXG4gIFBSRVZJT1VTX1NUQVRFOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uUFJFVklPVVNfU1RBVEUsXG59O1xuXG5cblxuY29uc3QgUmVuZGVyZXJzID0ge1xuICBDT05URVhUX0lEOiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uUm9vdE5vZGUuQ09OVEVYVF9JRCxcbiAgRk9SQ0VfUkVGTE9XOiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uRk9SQ0VfUkVGTE9XLFxuICBSb290Tm9kZTogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJvb3ROb2RlLFxuICBSZW5kZXJlcjogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJlbmRlcmVyLFxuICBSb290RWxlbWVudDogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJvb3RFbGVtZW50LFxuICBDb21tZW50RWxlbWVudDogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLkNvbW1lbnRFbGVtZW50LFxuICBOYXRpdmVFbGVtZW50OiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uTmF0aXZlRWxlbWVudCxcbiAgUG9ydGFsRWxlbWVudDogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlBvcnRhbEVsZW1lbnQsXG4gIFRleHRFbGVtZW50OiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uVGV4dEVsZW1lbnQsXG59O1xuXG5cblxuXG5cblxufSkoKTtcblxudmFyIF9fd2VicGFja19leHBvcnRzX18kID0gX193ZWJwYWNrX2V4cG9ydHNfXy4kO1xudmFyIF9fd2VicGFja19leHBvcnRzX19Db21wb25lbnQgPSBfX3dlYnBhY2tfZXhwb3J0c19fLkNvbXBvbmVudDtcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fQ29tcG9uZW50cyA9IF9fd2VicGFja19leHBvcnRzX18uQ29tcG9uZW50cztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fSmlicyA9IF9fd2VicGFja19leHBvcnRzX18uSmlicztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fUmVuZGVyZXJzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5SZW5kZXJlcnM7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX1V0aWxzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5VdGlscztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fZGVhZGJlZWYgPSBfX3dlYnBhY2tfZXhwb3J0c19fLmRlYWRiZWVmO1xudmFyIF9fd2VicGFja19leHBvcnRzX19mYWN0b3J5ID0gX193ZWJwYWNrX2V4cG9ydHNfXy5mYWN0b3J5O1xuZXhwb3J0IHsgX193ZWJwYWNrX2V4cG9ydHNfXyQgYXMgJCwgX193ZWJwYWNrX2V4cG9ydHNfX0NvbXBvbmVudCBhcyBDb21wb25lbnQsIF9fd2VicGFja19leHBvcnRzX19Db21wb25lbnRzIGFzIENvbXBvbmVudHMsIF9fd2VicGFja19leHBvcnRzX19KaWJzIGFzIEppYnMsIF9fd2VicGFja19leHBvcnRzX19SZW5kZXJlcnMgYXMgUmVuZGVyZXJzLCBfX3dlYnBhY2tfZXhwb3J0c19fVXRpbHMgYXMgVXRpbHMsIF9fd2VicGFja19leHBvcnRzX19kZWFkYmVlZiBhcyBkZWFkYmVlZiwgX193ZWJwYWNrX2V4cG9ydHNfX2ZhY3RvcnkgYXMgZmFjdG9yeSB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWFXNWtaWGd1YW5NaUxDSnRZWEJ3YVc1bmN5STZJanM3T3pzN096czdRVUZCUVRzN1FVRkZZVHM3UVVGRllpd3JSRUZCSzBRc2NVSkJRVTA3UVVGRGNrVTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVRzN1FVRkZRVHRCUVVOQkxIbERRVUY1UXl4UlFVRlJPMEZCUTJwRUxGVkJRVlVzYjBKQlFXOUNPMEZCUXpsQ08wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFc2NVSkJRWEZDTEdWQlFXVTdPMEZCUlhCRE8wRkJRMEU3UVVGRFFTeHRRMEZCYlVNc1NVRkJTU3hsUVVGbExFbEJRVWs3TzBGQlJURkVPMEZCUTBFN08wRkJSVUVzWTBGQll5eFBRVUZQTEVkQlFVY3NTVUZCU1R0QlFVTTFRanM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxHbENRVUZwUWl4WFFVRlhMRWRCUVVjc1kwRkJZenRCUVVNM1F6dEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRXNlVU5CUVhsRExGRkJRVkU3UVVGRGFrUTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRXNlVU5CUVhsRExGRkJRVkU3UVVGRGFrUTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEcxQ1FVRnRRaXh0UWtGQmJVSTdRVUZEZEVNN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hIUVVGSE8wRkJRMGc3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRWRCUVVjN1FVRkRTRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNSMEZCUnp0QlFVTklPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeEhRVUZITzBGQlEwZ3NRMEZCUXpzN1FVRkZSRHM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZETDBoQk96dEJRVVV5UXp0QlFVTkVPMEZCUzNoQ096dEJRVVZZTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGVURzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBMSGRDUVVGM1FpeHZSRUZCV1R0QlFVTXpRenM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3hKUVVGSkxIVkVRVUZ6UWpzN1FVRkZNVUk3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFRRVUZUTzBGQlExUTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzVTBGQlV6dEJRVU5VTEU5QlFVODdRVUZEVURzN1FVRkZRU3gzUlVGQmQwVTdRVUZEZUVVN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeHpRa0ZCYzBJc01FTkJRVk03UVVGREwwSXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzZDBKQlFYZENPMEZCUTNoQ0xFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hUUVVGVE8wRkJRMVE3UVVGRFFUdEJRVU5CTEc5RlFVRnZSU3hOUVVGTk96dEJRVVV4UlR0QlFVTkJMRk5CUVZNN1FVRkRWQ3hQUVVGUE8wRkJRMUFzUzBGQlN6dEJRVU5NT3p0QlFVVkJPMEZCUTBFc1YwRkJWeXg1UkVGQmIwSTdRVUZETDBJN08wRkJSVUU3UVVGRFFTeFhRVUZYTEdsRVFVRlJPMEZCUTI1Q096dEJRVVZCTzBGQlEwRXNWMEZCVnl4eFJFRkJXVHRCUVVOMlFqczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNVMEZCVXp0QlFVTlVMRTlCUVU4N1FVRkRVRHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTEZGQlFWRXNhVVJCUVdkQ08wRkJRM2hDTzBGQlEwRTdPMEZCUlVFc2QwTkJRWGRETEZGQlFWRTdRVUZEYUVRN1FVRkRRU3hyUTBGQmEwTXNkMFJCUVhWQ08wRkJRM3BFTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEUxQlFVMDdRVUZEVGl4aFFVRmhMSGRFUVVGMVFqdEJRVU53UXp0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeHBSVUZCYVVVc1RVRkJUVHM3UVVGRmRrVTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzZDBWQlFYZEZMRTFCUVUwN08wRkJSVGxGTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTFCUVUwN1FVRkRUanRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJMSE5EUVVGelF5eFJRVUZSTzBGQlF6bERPMEZCUTBFN1FVRkRRVHM3UVVGRlFTeFZRVUZWTEdsRVFVRm5RanRCUVVNeFFpd3lRMEZCTWtNc2FVUkJRV2RDTzBGQlF6TkVMRFJEUVVFMFF5eFJRVUZSTzBGQlEzQkVPMEZCUTBFN1FVRkRRVHRCUVVOQkxGRkJRVkU3UVVGRFVqdEJRVU5CTzBGQlEwRTdPMEZCUlVFc1pVRkJaU3hwUkVGQlowSTdRVUZETDBJN08wRkJSVUVzYVVKQlFXbENMR2xFUVVGblFqdEJRVU5xUXl4VFFVRlRPenRCUVVWVUxEUkRRVUUwUXl4UlFVRlJPMEZCUTNCRU8wRkJRMEU3UVVGRFFUdEJRVU5CTEZGQlFWRXNVMEZCVXl4cFJFRkJaMEk3UVVGRGFrTTdRVUZEUVN3d1EwRkJNRU1zVVVGQlVUdEJRVU5zUkR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeFZRVUZWTEdsRVFVRm5RanRCUVVNeFFqczdRVUZGUVR0QlFVTkJMRGhEUVVFNFF5eFJRVUZSTzBGQlEzUkVPMEZCUTBFc1kwRkJZeXhwUkVGQlowSTdRVUZET1VJN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRkZCUVZFN1FVRkRVanRCUVVOQkxEQkRRVUV3UXl4UlFVRlJPMEZCUTJ4RU8wRkJRMEU3UVVGRFFUczdRVUZGUVN4alFVRmpMR2xFUVVGblFqdEJRVU01UWp0QlFVTkJMRzFDUVVGdFFpeHBSRUZCWjBJN1FVRkRia003UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeDNRa0ZCZDBJN1FVRkRlRUlzVDBGQlR6dEJRVU5RT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVN4UFFVRlBPenRCUVVWUU8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1ZVRkJWVHRCUVVOV08wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTEhGRFFVRnhReXhSUVVGUk8wRkJRemRETzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3T3pzN096czdPenM3T3pzN08wRkROV1ZCT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBc1MwRkJTenRCUVVOTU96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFTeDFRMEZCZFVNc1VVRkJVVHRCUVVNdlF6dEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZETjBkblF6dEJRVU5KT3p0QlFVVTNRanRCUVVOUU8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc2QwSkJRWGRDTEdkRFFVRm5ReXhIUVVGSE8wRkJRek5FTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxITkNRVUZ6UWl4dFJFRkJhMEk3UVVGRGVFTXNUMEZCVHp0QlFVTlFMRXRCUVVzN1FVRkRURHRCUVVOQk96dEJRVVZQTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOUUxIRkRRVUZ4UXp0QlFVTnlRenRCUVVOQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeFpRVUZaTEdsRVFVRm5RaXc0UTBGQk9FTXNhVVJCUVdkQ08wRkJRekZHTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNWMEZCVnp0QlFVTllPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4VFFVRlRPMEZCUTFRc1UwRkJVeXd5UTBGQll6dEJRVU4yUWp0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxGTkJRVk03UVVGRFZDeFBRVUZQT3p0QlFVVlFPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUUxFOUJRVThzTWtOQlFXTTdRVUZEY2tJN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQXNTMEZCU3pzN1FVRkZURHRCUVVOQk8wRkJRMEU3TzBGQlJVODdPMEZCUlVFN1FVRkRVRHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlR6dEJRVU5RTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVTg3UVVGRFVEczdRVUZGUVN4TlFVRk5MR2xFUVVGblFqdEJRVU4wUWpzN1FVRkZRU3hwUTBGQmFVTXNjMFJCUVhGQ0xIbEZRVUY1UlN4dFJFRkJhMEk3UVVGRGFrbzdPMEZCUlVFc2FVSkJRV2xDTERoRFFVRmhMRzlDUVVGdlFpeGxRVUZsTzBGQlEycEZMR2xDUVVGcFFpeHBSRUZCWjBJN08wRkJSV3BETzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1IwRkJSenM3UVVGRlNEdEJRVU5CT3pzN096czdPenM3T3pzN096czdPMEZEYmtwblJEczdRVUZGZWtNc05rSkJRVFpDTEhsRVFVRlhPMEZCUXk5RExHZENRVUZuUWl4elJVRkJkMEk3TzBGQlJYaERPMEZCUTBFc1ZVRkJWU3h6UlVGQmQwSTdRVUZEYkVNN1FVRkRRVHM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3TzBGRFRIZENPenRCUVVWcVFqczdRVUZGYTBNN08wRkJSVTg3UVVGRFRUdEJRVU5HTzBGQlEwRTdRVUZEU2pzN096czdPenM3T3pzN096czdPenRCUTJKQk96dEJRVVY2UXl3MFFrRkJORUlzZVVSQlFWYzdRVUZET1VNc1owSkJRV2RDTEhORlFVRjNRanM3UVVGRmVFTTdRVUZEUVN4VlFVRlZMSE5GUVVGM1FqdEJRVU5zUXp0QlFVTkJPenM3T3pzN096czdPenM3T3pzN08wRkRVbWRFT3p0QlFVVjZReXcwUWtGQk5FSXNlVVJCUVZjN1FVRkRPVU1zWjBKQlFXZENMSEZGUVVGMVFqczdRVUZGZGtNN1FVRkRRU3hWUVVGVkxIRkZRVUYxUWp0QlFVTnFRenRCUVVOQk96czdPenM3T3pzN096czdPenM3T3pzN1FVTlNORU03UVVGRFJEdEJRVWx1UWpzN1FVRkZlRUk3TzBGQlJVOHNkVUpCUVhWQ0xHOUVRVUZaTzBGQlF6RkRMRzlDUVVGdlFpeHRSRUZCVVRzN1FVRkZOVUk3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUUxFdEJRVXM3UVVGRFREczdRVUZGUVR0QlFVTkJPMEZCUTBFc2EwUkJRV3RFTEhGRVFVRlZPenRCUVVVMVJEdEJRVU5CTzBGQlEwRXNlVUpCUVhsQ0xIRkVRVUZWTzBGQlEyNURMSEZFUVVGeFJDeHhSRUZCVlR0QlFVTXZSRHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3hQUVVGUE8wRkJRMUE3UVVGRFFTeDVRa0ZCZVVJc2NVUkJRVlU3UVVGRGJrTTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeFBRVUZQTzBGQlExQXNTMEZCU3p0QlFVTk1PMEZCUTBFN096czdPenM3T3pzN096czdPenM3UVVOeVJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVTg3UVVGRFVEczdRVUZGUVRzN1FVRkZRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3pzN096czdPenM3T3pzN096czdPenRCUTNSQ2NVTTdPMEZCUlRsQ096dEJRVVZRT3p0QlFVVlBPMEZCUTFBN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxGTkJRVk03UVVGRFZDdzRRa0ZCT0VJN1FVRkRPVUlzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFMRXRCUVVzN1FVRkRURHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxGZEJRVmNzYlVSQlFXdENPMEZCUXpkQ096dEJRVVZCTzBGQlEwRXNWMEZCVnl4elJFRkJjVUk3UVVGRGFFTTdPMEZCUlVFN1FVRkRRU3hYUVVGWExHdEVRVUZwUWp0QlFVTTFRanM3UVVGRlFUdEJRVU5CTEZkQlFWY3NjVVJCUVc5Q08wRkJReTlDT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHM3T3pzN096czdPenM3T3pzN096dEJRM0pIWjBRN08wRkJSWHBETERCQ1FVRXdRaXg1UkVGQlZ6dEJRVU0xUXl4blFrRkJaMElzYlVWQlFYRkNPenRCUVVWeVF6dEJRVU5CTEZWQlFWVXNiVVZCUVhGQ08wRkJReTlDTzBGQlEwRTdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdRVU5TWjBNN08wRkJSV2hET3p0QlFVVkJPMEZCUTBFc01FZEJRVEJITEZOQlFVazdPMEZCUlhaSE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUVzTUVOQlFUQkRMRk5CUVZNN1FVRkRia1E3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVTg3UVVGRFVEdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRXNjVU5CUVhGRExGRkJRVkU3UVVGRE4wTTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVODdRVUZEVUR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxHOUNRVUZ2UWp0QlFVTndRanM3UVVGRlFUdEJRVU5CT3p0QlFVVkJMSEZEUVVGeFF5eFJRVUZSTzBGQlF6ZERPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hKUVVGSk8wRkJRMG83UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzVFVGQlRUdEJRVU5PT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEVsQlFVazdRVUZEU2p0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRXNjME5CUVhORExGRkJRVkU3UVVGRE9VTTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRWRCUVVjN1FVRkRTQ3hEUVVGRE96dEJRVVZOT3p0QlFVVkJPMEZCUTFBN1FVRkRRVHM3UVVGRlFTeFZRVUZWTEhGRFFVRlJMRzFDUVVGdFFpeHhRMEZCVVR0QlFVTTNRenM3UVVGRlR6dEJRVU5RTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc1NVRkJTVHRCUVVOS08wRkJRMEVzU1VGQlNUdEJRVU5LTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeHhRMEZCY1VNc1VVRkJVVHRCUVVNM1F6czdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFc2MwTkJRWE5ETEZGQlFWRTdRVUZET1VNN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN08wRkJSVUU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlR6dEJRVU5RTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGVHp0QlFVTlFPMEZCUTBFN08wRkJSVUU3UVVGRFFTeHhRMEZCY1VNc1VVRkJVVHRCUVVNM1F6dEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGVHp0QlFVTlFPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPenM3T3pzN1UwTnVZa0U3VTBGRFFUczdVMEZGUVR0VFFVTkJPMU5CUTBFN1UwRkRRVHRUUVVOQk8xTkJRMEU3VTBGRFFUdFRRVU5CTzFOQlEwRTdVMEZEUVR0VFFVTkJPMU5CUTBFN1UwRkRRVHM3VTBGRlFUdFRRVU5CT3p0VFFVVkJPMU5CUTBFN1UwRkRRVHM3T3pzN1ZVTjBRa0U3VlVGRFFUdFZRVU5CTzFWQlEwRTdWVUZEUVN4NVEwRkJlVU1zZDBOQlFYZERPMVZCUTJwR08xVkJRMEU3VlVGRFFUczdPenM3VlVOUVFUdFZRVU5CTzFWQlEwRTdWVUZEUVR0VlFVTkJMRWRCUVVjN1ZVRkRTRHRWUVVOQk8xVkJRMEVzUTBGQlF6czdPenM3VlVOUVJEczdPenM3VlVOQlFUdFZRVU5CTzFWQlEwRTdWVUZEUVN4MVJFRkJkVVFzYVVKQlFXbENPMVZCUTNoRk8xVkJRMEVzWjBSQlFXZEVMR0ZCUVdFN1ZVRkROMFE3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZEU1d0Q096dEJRVVZZTzBGQlExQXNXVUZCV1R0QlFVTmFMRmRCUVZjN1FVRkRXQ3hMUVVGTE8wRkJRMHdzUzBGQlN6dEJRVU5NTEZWQlFWVTdRVUZEVml4alFVRmpPMEZCUTJRc2FVSkJRV2xDTzBGQlEycENPenRCUVdGM1FqczdRVUZGYWtJN1FVRkRVQ3hqUVVGak8wRkJRMlFzY1VKQlFYRkNPMEZCUTNKQ0xIRkNRVUZ4UWp0QlFVTnlRaXhoUVVGaE8wRkJRMklzYjBKQlFXOUNPMEZCUTNCQ0xITkNRVUZ6UWp0QlFVTjBRaXhyUWtGQmEwSTdRVUZEYkVJc1owSkJRV2RDTzBGQlEyaENPenRCUVZjNFFqczdRVUZGZGtJN1FVRkRVQ3hqUVVGakxHOUZRVUZ0UWp0QlFVTnFReXhqUVVGak8wRkJRMlFzVlVGQlZUdEJRVU5XTEZWQlFWVTdRVUZEVml4aFFVRmhPMEZCUTJJc1owSkJRV2RDTzBGQlEyaENMR1ZCUVdVN1FVRkRaaXhsUVVGbE8wRkJRMllzWVVGQllUdEJRVU5pT3p0QlFVVnZRenRCUVVOWE96dEJRVTAzUXlJc0luTnZkWEpqWlhNaU9sc2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXViMlJsWDIxdlpIVnNaWE12WkdWaFpHSmxaV1l2YkdsaUwybHVaR1Y0TG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2WTI5dGNHOXVaVzUwTG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2WlhabGJuUnpMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZhbWxpTG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2Y21WdVpHVnlaWEp6TDJOdmJXMWxiblF0Wld4bGJXVnVkQzVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMM0psYm1SbGNtVnljeTlwYm1SbGVDNXFjeUlzSW5kbFluQmhZMnM2THk5cWFXSnpMeTR2YkdsaUwzSmxibVJsY21WeWN5OXVZWFJwZG1VdFpXeGxiV1Z1ZEM1cWN5SXNJbmRsWW5CaFkyczZMeTlxYVdKekx5NHZiR2xpTDNKbGJtUmxjbVZ5Y3k5d2IzSjBZV3d0Wld4bGJXVnVkQzVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMM0psYm1SbGNtVnljeTl5Wlc1a1pYSmxjaTVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMM0psYm1SbGNtVnljeTl5YjI5MExXVnNaVzFsYm5RdWFuTWlMQ0ozWldKd1lXTnJPaTh2YW1saWN5OHVMMnhwWWk5eVpXNWtaWEpsY25NdmNtOXZkQzF1YjJSbExtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZMaTlzYVdJdmNtVnVaR1Z5WlhKekwzUmxlSFF0Wld4bGJXVnVkQzVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMM1YwYVd4ekxtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZkMlZpY0dGamF5OWliMjkwYzNSeVlYQWlMQ0ozWldKd1lXTnJPaTh2YW1saWN5OTNaV0p3WVdOckwzSjFiblJwYldVdlpHVm1hVzVsSUhCeWIzQmxjblI1SUdkbGRIUmxjbk1pTENKM1pXSndZV05yT2k4dmFtbGljeTkzWldKd1lXTnJMM0oxYm5ScGJXVXZaMnh2WW1Gc0lpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdmQyVmljR0ZqYXk5eWRXNTBhVzFsTDJoaGMwOTNibEJ5YjNCbGNuUjVJSE5vYjNKMGFHRnVaQ0lzSW5kbFluQmhZMnM2THk5cWFXSnpMM2RsWW5CaFkyc3ZjblZ1ZEdsdFpTOXRZV3RsSUc1aGJXVnpjR0ZqWlNCdlltcGxZM1FpTENKM1pXSndZV05yT2k4dmFtbGljeTh1TDJ4cFlpOXBibVJsZUM1cWN5SmRMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUl2THlCRGIzQjVjbWxuYUhRZ01qQXlNaUJYZVdGMGRDQkhjbVZsYm5kaGVWeHVYRzRuZFhObElITjBjbWxqZENjN1hHNWNibU52Ym5OMElIUm9hWE5IYkc5aVlXd2dQU0FvS0hSNWNHVnZaaUIzYVc1a2IzY2dJVDA5SUNkMWJtUmxabWx1WldRbktTQS9JSGRwYm1SdmR5QTZJR2RzYjJKaGJDa2dmSHdnZEdocGN6dGNibU52Ym5OMElFUkZRVVJDUlVWR1gxSkZSbDlOUVZCZlMwVlpJRDBnVTNsdFltOXNMbVp2Y2lnblFFQmtaV0ZrWW1WbFpsSmxaazFoY0NjcE8xeHVZMjl1YzNRZ1ZVNUpVVlZGWDBsRVgxTlpUVUpQVENBOUlGTjViV0p2YkM1bWIzSW9KMEJBWkdWaFpHSmxaV1pWYm1seGRXVkpSQ2NwTzF4dVkyOXVjM1FnY21WbVRXRndJRDBnS0hSb2FYTkhiRzlpWVd4YlJFVkJSRUpGUlVaZlVrVkdYMDFCVUY5TFJWbGRLU0EvSUhSb2FYTkhiRzlpWVd4YlJFVkJSRUpGUlVaZlVrVkdYMDFCVUY5TFJWbGRJRG9nYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElHbGtTR1ZzY0dWeWN5QTlJRnRkTzF4dVhHNXBaaUFvSVhSb2FYTkhiRzlpWVd4YlJFVkJSRUpGUlVaZlVrVkdYMDFCVUY5TFJWbGRLVnh1SUNCMGFHbHpSMnh2WW1Gc1cwUkZRVVJDUlVWR1gxSkZSbDlOUVZCZlMwVlpYU0E5SUhKbFprMWhjRHRjYmx4dWJHVjBJSFYxYVdSRGIzVnVkR1Z5SUQwZ01HNDdYRzVjYm1aMWJtTjBhVzl1SUdkbGRFaGxiSEJsY2tadmNsWmhiSFZsS0haaGJIVmxLU0I3WEc0Z0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJR2xrU0dWc2NHVnljeTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1NCN1hHNGdJQ0FnYkdWMElIc2dhR1ZzY0dWeUxDQm5aVzVsY21GMGIzSWdmU0E5SUdsa1NHVnNjR1Z5YzF0cFhUdGNiaUFnSUNCcFppQW9hR1ZzY0dWeUtIWmhiSFZsS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUJuWlc1bGNtRjBiM0k3WEc0Z0lIMWNibjFjYmx4dVpuVnVZM1JwYjI0Z1lXNTVkR2hwYm1kVWIwbEVLRjloY21jc0lGOWhiSEpsWVdSNVZtbHphWFJsWkNrZ2UxeHVJQ0JzWlhRZ1lYSm5JRDBnWDJGeVp6dGNiaUFnYVdZZ0tHRnlaeUJwYm5OMFlXNWpaVzltSUU1MWJXSmxjaUI4ZkNCaGNtY2dhVzV6ZEdGdVkyVnZaaUJUZEhKcGJtY2dmSHdnWVhKbklHbHVjM1JoYm1ObGIyWWdRbTl2YkdWaGJpbGNiaUFnSUNCaGNtY2dQU0JoY21jdWRtRnNkV1ZQWmlncE8xeHVYRzRnSUd4bGRDQjBlWEJsVDJZZ1BTQjBlWEJsYjJZZ1lYSm5PMXh1WEc0Z0lHbG1JQ2gwZVhCbFQyWWdQVDA5SUNkdWRXMWlaWEluSUNZbUlHRnlaeUE5UFQwZ01Da2dlMXh1SUNBZ0lHbG1JQ2hQWW1wbFkzUXVhWE1vWVhKbkxDQXRNQ2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdKMjUxYldKbGNqb3RNQ2M3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdKMjUxYldKbGNqb3JNQ2M3WEc0Z0lIMWNibHh1SUNCcFppQW9kSGx3WlU5bUlEMDlQU0FuYzNsdFltOXNKeWxjYmlBZ0lDQnlaWFIxY200Z1lITjViV0p2YkRva2UyRnlaeTUwYjFOMGNtbHVaeWdwZldBN1hHNWNiaUFnYVdZZ0tHRnlaeUE5UFNCdWRXeHNJSHg4SUhSNWNHVlBaaUE5UFQwZ0oyNTFiV0psY2ljZ2ZId2dkSGx3WlU5bUlEMDlQU0FuWW05dmJHVmhiaWNnZkh3Z2RIbHdaVTltSUQwOVBTQW5jM1J5YVc1bkp5QjhmQ0IwZVhCbFQyWWdQVDA5SUNkaWFXZHBiblFuS1NCN1hHNGdJQ0FnYVdZZ0tIUjVjR1ZQWmlBOVBUMGdKMjUxYldKbGNpY3BYRzRnSUNBZ0lDQnlaWFIxY200Z0tHRnlaeUE4SURBcElEOGdZRzUxYldKbGNqb2tlMkZ5WjMxZ0lEb2dZRzUxYldKbGNqb3JKSHRoY21kOVlEdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbFQyWWdQVDA5SUNkaWFXZHBiblFuSUNZbUlHRnlaeUE5UFQwZ01HNHBYRzRnSUNBZ0lDQnlaWFIxY200Z0oySnBaMmx1ZERvck1DYzdYRzVjYmlBZ0lDQnlaWFIxY200Z1lDUjdkSGx3WlU5bWZUb2tlMkZ5WjMxZ08xeHVJQ0I5WEc1Y2JpQWdiR1YwSUdsa1NHVnNjR1Z5SUQwZ0tHbGtTR1ZzY0dWeWN5NXNaVzVuZEdnZ1BpQXdJQ1ltSUdkbGRFaGxiSEJsY2tadmNsWmhiSFZsS0dGeVp5a3BPMXh1SUNCcFppQW9hV1JJWld4d1pYSXBYRzRnSUNBZ2NtVjBkWEp1SUdGdWVYUm9hVzVuVkc5SlJDaHBaRWhsYkhCbGNpaGhjbWNwS1R0Y2JseHVJQ0JwWmlBb1ZVNUpVVlZGWDBsRVgxTlpUVUpQVENCcGJpQmhjbWNnSmlZZ2RIbHdaVzltSUdGeVoxdFZUa2xSVlVWZlNVUmZVMWxOUWs5TVhTQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUM4dklGQnlaWFpsYm5RZ2FXNW1hVzVwZEdVZ2NtVmpkWEp6YVc5dVhHNGdJQ0FnYVdZZ0tDRmZZV3h5WldGa2VWWnBjMmwwWldRZ2ZId2dJVjloYkhKbFlXUjVWbWx6YVhSbFpDNW9ZWE1vWVhKbktTa2dlMXh1SUNBZ0lDQWdiR1YwSUdGc2NtVmhaSGxXYVhOcGRHVmtJRDBnWDJGc2NtVmhaSGxXYVhOcGRHVmtJSHg4SUc1bGR5QlRaWFFvS1R0Y2JpQWdJQ0FnSUdGc2NtVmhaSGxXYVhOcGRHVmtMbUZrWkNoaGNtY3BPMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRnVlWFJvYVc1blZHOUpSQ2hoY21kYlZVNUpVVlZGWDBsRVgxTlpUVUpQVEYwb0tTd2dZV3h5WldGa2VWWnBjMmwwWldRcE8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lHbG1JQ2doY21WbVRXRndMbWhoY3loaGNtY3BLU0I3WEc0Z0lDQWdiR1YwSUd0bGVTQTlJR0FrZTNSNWNHVnZaaUJoY21kOU9pUjdLeXQxZFdsa1EyOTFiblJsY24xZ08xeHVJQ0FnSUhKbFprMWhjQzV6WlhRb1lYSm5MQ0JyWlhrcE8xeHVJQ0FnSUhKbGRIVnliaUJyWlhrN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2NtVm1UV0Z3TG1kbGRDaGhjbWNwTzF4dWZWeHVYRzVtZFc1amRHbHZiaUJrWldGa1ltVmxaaWdwSUh0Y2JpQWdiR1YwSUhCaGNuUnpJRDBnV3lCaGNtZDFiV1Z1ZEhNdWJHVnVaM1JvSUYwN1hHNGdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUdGeVozVnRaVzUwY3k1c1pXNW5kR2c3SUdrZ1BDQnBiRHNnYVNzcktWeHVJQ0FnSUhCaGNuUnpMbkIxYzJnb1lXNTVkR2hwYm1kVWIwbEVLR0Z5WjNWdFpXNTBjMXRwWFNrcE8xeHVYRzRnSUhKbGRIVnliaUJ3WVhKMGN5NXFiMmx1S0NjNkp5azdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHUmxZV1JpWldWbVUyOXlkR1ZrS0NrZ2UxeHVJQ0JzWlhRZ2NHRnlkSE1nUFNCYklHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1hUdGNiaUFnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ1lYSm5kVzFsYm5SekxteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BYRzRnSUNBZ2NHRnlkSE11Y0hWemFDaGhibmwwYUdsdVoxUnZTVVFvWVhKbmRXMWxiblJ6VzJsZEtTazdYRzVjYmlBZ2NtVjBkWEp1SUhCaGNuUnpMbk52Y25Rb0tTNXFiMmx1S0NjNkp5azdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHZGxibVZ5WVhSbFNVUkdiM0lvYUdWc2NHVnlMQ0JuWlc1bGNtRjBiM0lwSUh0Y2JpQWdhV1JJWld4d1pYSnpMbkIxYzJnb2V5Qm9aV3h3WlhJc0lHZGxibVZ5WVhSdmNpQjlLVHRjYm4xY2JseHVablZ1WTNScGIyNGdjbVZ0YjNabFNVUkhaVzVsY21GMGIzSW9hR1ZzY0dWeUtTQjdYRzRnSUd4bGRDQnBibVJsZUNBOUlHbGtTR1ZzY0dWeWN5NW1hVzVrU1c1a1pYZ29LR2wwWlcwcElEMCtJQ2hwZEdWdExtaGxiSEJsY2lBOVBUMGdhR1ZzY0dWeUtTazdYRzRnSUdsbUlDaHBibVJsZUNBOElEQXBYRzRnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJR2xrU0dWc2NHVnljeTV6Y0d4cFkyVW9hVzVrWlhnc0lERXBPMXh1ZlZ4dVhHNVBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkR2xsY3loa1pXRmtZbVZsWml3Z2UxeHVJQ0FuYVdSVGVXMG5PaUI3WEc0Z0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdWVTVKVVZWRlgwbEVYMU5aVFVKUFRDeGNiaUFnZlN4Y2JpQWdKM052Y25SbFpDYzZJSHRjYmlBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQmtaV0ZrWW1WbFpsTnZjblJsWkN4Y2JpQWdmU3hjYmlBZ0oyZGxibVZ5WVhSbFNVUkdiM0luT2lCN1hHNGdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQjBjblZsTEZ4dUlDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnWjJWdVpYSmhkR1ZKUkVadmNpeGNiaUFnZlN4Y2JpQWdKM0psYlc5MlpVbEVSMlZ1WlhKaGRHOXlKem9nZTF4dUlDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNCMllXeDFaVG9nSUNBZ0lDQWdJSEpsYlc5MlpVbEVSMlZ1WlhKaGRHOXlMRnh1SUNCOUxGeHVmU2s3WEc1Y2JtMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ1pHVmhaR0psWldZN1hHNGlMQ0l2S2lCbmJHOWlZV3dnUW5WbVptVnlJQ292WEc1Y2JtbHRjRzl5ZENCN0lFVjJaVzUwUlcxcGRIUmxjaUI5SUdaeWIyMGdKeTR2WlhabGJuUnpMbXB6Snp0Y2JtbHRjRzl5ZENBcUlHRnpJRlYwYVd4eklDQWdJQ0FnSUdaeWIyMGdKeTR2ZFhScGJITXVhbk1uTzF4dWFXMXdiM0owSUh0Y2JpQWdhWE5LYVdKcGMyZ3NYRzRnSUhKbGMyOXNkbVZEYUdsc1pISmxiaXhjYmlBZ1kyOXVjM1J5ZFdOMFNtbGlMRnh1ZlNCbWNtOXRJQ2N1TDJwcFlpNXFjeWM3WEc1Y2JtVjRjRzl5ZENCamIyNXpkQ0JWVUVSQlZFVmZSVlpGVGxRZ0lDQWdJQ0FnSUNBZ0lDQWdJRDBnSjBCcWFXSnpMMk52YlhCdmJtVnVkQzlsZG1WdWRDOTFjR1JoZEdVbk8xeHVaWGh3YjNKMElHTnZibk4wSUZGVlJWVkZYMVZRUkVGVVJWOU5SVlJJVDBRZ0lDQWdJQ0FnUFNCVGVXMWliMnd1Wm05eUtDZEFhbWxpY3k5amIyMXdiMjVsYm5RdmNYVmxkV1ZWY0dSaGRHVW5LVHRjYm1WNGNHOXlkQ0JqYjI1emRDQkdURlZUU0Y5VlVFUkJWRVZmVFVWVVNFOUVJQ0FnSUNBZ0lEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTXZZMjl0Y0c5dVpXNTBMMlpzZFhOb1ZYQmtZWFJsSnlrN1hHNWxlSEJ2Y25RZ1kyOXVjM1FnU1U1SlZGOU5SVlJJVDBRZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TDJOdmJYQnZibVZ1ZEM5ZlgybHVhWFFuS1R0Y2JtVjRjRzl5ZENCamIyNXpkQ0JUUzBsUVgxTlVRVlJGWDFWUVJFRlVSVk1nSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk12WTI5dGNHOXVaVzUwTDNOcmFYQlRkR0YwWlZWd1pHRjBaWE1uS1R0Y2JtVjRjRzl5ZENCamIyNXpkQ0JRUlU1RVNVNUhYMU5VUVZSRlgxVlFSRUZVUlNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk12WTI5dGNHOXVaVzUwTDNCbGJtUnBibWRUZEdGMFpWVndaR0YwWlNjcE8xeHVaWGh3YjNKMElHTnZibk4wSUV4QlUxUmZVa1ZPUkVWU1gxUkpUVVVnSUNBZ0lDQWdJQ0FnUFNCVGVXMWliMnd1Wm05eUtDZEFhbWxpY3k5amIyMXdiMjVsYm5RdmJHRnpkRkpsYm1SbGNsUnBiV1VuS1R0Y2JtVjRjRzl5ZENCamIyNXpkQ0JRVWtWV1NVOVZVMTlUVkVGVVJTQWdJQ0FnSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk12WTI5dGNHOXVaVzUwTDNCeVpYWnBiM1Z6VTNSaGRHVW5LVHRjYm1WNGNHOXlkQ0JqYjI1emRDQkRRVkJVVlZKRlgxSkZSa1ZTUlU1RFJWOU5SVlJJVDBSVElEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTXZZMjl0Y0c5dVpXNTBMM0J5WlhacGIzVnpVM1JoZEdVbktUdGNibHh1WTI5dWMzUWdaV3hsYldWdWRFUmhkR0ZEWVdOb1pTQTlJRzVsZHlCWFpXRnJUV0Z3S0NrN1hHNWNibVoxYm1OMGFXOXVJR2x6Vm1Gc2FXUlRkR0YwWlU5aWFtVmpkQ2gyWVd4MVpTa2dlMXh1SUNCcFppQW9kbUZzZFdVZ1BUMGdiblZzYkNsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnYVdZZ0tFOWlhbVZqZEM1cGN5aDJZV3gxWlN3Z1RtRk9LU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0U5aWFtVmpkQzVwY3loMllXeDFaU3dnU1c1bWFXNXBkSGtwS1Z4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0JwWmlBb2RtRnNkV1VnYVc1emRHRnVZMlZ2WmlCQ2IyOXNaV0Z1SUh4OElIWmhiSFZsSUdsdWMzUmhibU5sYjJZZ1RuVnRZbVZ5SUh4OElIWmhiSFZsSUdsdWMzUmhibU5sYjJZZ1UzUnlhVzVuS1Z4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0JzWlhRZ2RIbHdaVTltSUQwZ2RIbHdaVzltSUhaaGJIVmxPMXh1SUNCcFppQW9kSGx3WlU5bUlEMDlQU0FuYzNSeWFXNW5KeUI4ZkNCMGVYQmxUMllnUFQwOUlDZHVkVzFpWlhJbklIeDhJSFI1Y0dWUFppQTlQVDBnSjJKdmIyeGxZVzRuS1Z4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0JwWmlBb1FYSnlZWGt1YVhOQmNuSmhlU2gyWVd4MVpTa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2gwZVhCbGIyWWdRblZtWm1WeUlDRTlQU0FuZFc1a1pXWnBibVZrSnlBbUppQkNkV1ptWlhJdWFYTkNkV1ptWlhJb2RtRnNkV1VwS1Z4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JuMWNibHh1Wlhod2IzSjBJR05zWVhOeklFTnZiWEJ2Ym1WdWRDQmxlSFJsYm1SeklFVjJaVzUwUlcxcGRIUmxjaUI3WEc0Z0lITjBZWFJwWXlCVlVFUkJWRVZmUlZaRlRsUWdQU0JWVUVSQlZFVmZSVlpGVGxRN1hHNWNiaUFnVzFGVlJWVkZYMVZRUkVGVVJWOU5SVlJJVDBSZEtDa2dlMXh1SUNBZ0lHbG1JQ2gwYUdselcxQkZUa1JKVGtkZlUxUkJWRVZmVlZCRVFWUkZYU2xjYmlBZ0lDQWdJSEpsZEhWeWJqdGNibHh1SUNBZ0lIUm9hWE5iVUVWT1JFbE9SMTlUVkVGVVJWOVZVRVJCVkVWZElEMGdVSEp2YldselpTNXlaWE52YkhabEtDazdYRzRnSUNBZ2RHaHBjMXRRUlU1RVNVNUhYMU5VUVZSRlgxVlFSRUZVUlYwdWRHaGxiaWgwYUdselcwWk1WVk5JWDFWUVJFRlVSVjlOUlZSSVQwUmRMbUpwYm1Rb2RHaHBjeWtwTzF4dUlDQjlYRzVjYmlBZ1cwWk1WVk5JWDFWUVJFRlVSVjlOUlZSSVQwUmRLQ2tnZTF4dUlDQWdJQzh2SUZkaGN5QjBhR1VnYzNSaGRHVWdkWEJrWVhSbElHTmhibU5sYkd4bFpEOWNiaUFnSUNCcFppQW9JWFJvYVhOYlVFVk9SRWxPUjE5VFZFRlVSVjlWVUVSQlZFVmRLVnh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVYRzRnSUNBZ2RHaHBjeTVsYldsMEtGVlFSRUZVUlY5RlZrVk9WQ2s3WEc1Y2JpQWdJQ0IwYUdselcxQkZUa1JKVGtkZlUxUkJWRVZmVlZCRVFWUkZYU0E5SUc1MWJHdzdYRzRnSUgxY2JseHVJQ0JiU1U1SlZGOU5SVlJJVDBSZEtDa2dlMXh1SUNBZ0lIUm9hWE5iVTB0SlVGOVRWRUZVUlY5VlVFUkJWRVZUWFNBOUlHWmhiSE5sTzF4dUlDQjlYRzVjYmlBZ1kyOXVjM1J5ZFdOMGIzSW9YMnBwWWlrZ2UxeHVJQ0FnSUhOMWNHVnlLQ2s3WEc1Y2JpQWdJQ0F2THlCQ2FXNWtJR0ZzYkNCamJHRnpjeUJ0WlhSb2IyUnpJSFJ2SUZ3aWRHaHBjMXdpWEc0Z0lDQWdWWFJwYkhNdVltbHVaRTFsZEdodlpITXVZMkZzYkNoMGFHbHpMQ0IwYUdsekxtTnZibk4wY25WamRHOXlMbkJ5YjNSdmRIbHdaU2s3WEc1Y2JpQWdJQ0JzWlhRZ2FtbGlJRDBnWDJwcFlpQjhmQ0I3ZlR0Y2JseHVJQ0FnSUdOdmJuTjBJR055WldGMFpVNWxkMU4wWVhSbElEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ2JHVjBJR3h2WTJGc1UzUmhkR1VnUFNCUFltcGxZM1F1WTNKbFlYUmxLRzUxYkd3cE8xeHVYRzRnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRkJ5YjNoNUtHeHZZMkZzVTNSaGRHVXNJSHRjYmlBZ0lDQWdJQ0FnWjJWME9pQW9kR0Z5WjJWMExDQndjbTl3VG1GdFpTa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMFlYSm5aWFJiY0hKdmNFNWhiV1ZkTzF4dUlDQWdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0lDQnpaWFE2SUNoMFlYSm5aWFFzSUhCeWIzQk9ZVzFsTENCMllXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJR3hsZENCamRYSnlaVzUwVm1Gc2RXVWdQU0IwWVhKblpYUmJjSEp2Y0U1aGJXVmRPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaGpkWEp5Wlc1MFZtRnNkV1VnUFQwOUlIWmhiSFZsS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvSVhSb2FYTmJVMHRKVUY5VFZFRlVSVjlWVUVSQlZFVlRYU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lIUm9hWE5iVVZWRlZVVmZWVkJFUVZSRlgwMUZWRWhQUkYwb0tUdGNibHh1SUNBZ0lDQWdJQ0FnSUhSaGNtZGxkRnR3Y205d1RtRnRaVjBnUFNCMllXeDFaVHRjYmlBZ0lDQWdJQ0FnSUNCMGFHbHpMbTl1VTNSaGRHVlZjR1JoZEdWa0tIQnliM0JPWVcxbExDQjJZV3gxWlN3Z1kzVnljbVZ1ZEZaaGJIVmxLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnZlNrN1hHNGdJQ0FnZlR0Y2JseHVJQ0FnSUd4bGRDQndjbTl3Y3lBZ0lDQWdJQ0E5SUU5aWFtVmpkQzVoYzNOcFoyNG9UMkpxWldOMExtTnlaV0YwWlNodWRXeHNLU3dnYW1saUxuQnliM0J6SUh4OElIdDlLVHRjYmlBZ0lDQnNaWFFnWDJ4dlkyRnNVM1JoZEdVZ1BTQmpjbVZoZEdWT1pYZFRkR0YwWlNncE8xeHVYRzRnSUNBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUnBaWE1vZEdocGN5d2dlMXh1SUNBZ0lDQWdXMU5MU1ZCZlUxUkJWRVZmVlZCRVFWUkZVMTA2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCYlVFVk9SRWxPUjE5VFZFRlVSVjlWVUVSQlZFVmRPaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lHNTFiR3dzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnVzB4QlUxUmZVa1ZPUkVWU1gxUkpUVVZkT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJRlYwYVd4ekxtNXZkeWdwTEZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUZ0RFFWQlVWVkpGWDFKRlJrVlNSVTVEUlY5TlJWUklUMFJUWFRvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0I3ZlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmFXUW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdhbWxpTG1sa0xGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHdjbTl3Y3ljNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnY0hKdmNITXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMk5vYVd4a2NtVnVKem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQnFhV0l1WTJocGJHUnlaVzRnZkh3Z1cxMHNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMk52Ym5SbGVIUW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lHcHBZaTVqYjI1MFpYaDBJSHg4SUU5aWFtVmpkQzVqY21WaGRHVW9iblZzYkNrc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0ozTjBZWFJsSnpvZ2UxeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdkbGREb2dJQ0FnSUNBZ0lDQWdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQmZiRzlqWVd4VGRHRjBaVHRjYmlBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNBZ2MyVjBPaUFnSUNBZ0lDQWdJQ0FvZG1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvSVdselZtRnNhV1JUZEdGMFpVOWlhbVZqZENoMllXeDFaU2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dWSGx3WlVWeWNtOXlLR0JKYm5aaGJHbGtJSFpoYkhWbElHWnZjaUJjSW5Sb2FYTXVjM1JoZEdWY0lqb2dYQ0lrZTNaaGJIVmxmVndpTGlCUWNtOTJhV1JsWkNCY0luTjBZWFJsWENJZ2JYVnpkQ0JpWlNCaGJpQnBkR1Z5WVdKc1pTQnZZbXBsWTNRdVlDazdYRzVjYmlBZ0lDQWdJQ0FnSUNCUFltcGxZM1F1WVhOemFXZHVLRjlzYjJOaGJGTjBZWFJsTENCMllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUgwcE8xeHVJQ0I5WEc1Y2JpQWdjbVZ6YjJ4MlpVTm9hV3hrY21WdUtHTm9hV3hrY21WdUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUhKbGMyOXNkbVZEYUdsc1pISmxiaTVqWVd4c0tIUm9hWE1zSUdOb2FXeGtjbVZ1S1R0Y2JpQWdmVnh1WEc0Z0lHbHpTbWxpS0haaGJIVmxLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHbHpTbWxpYVhOb0tIWmhiSFZsS1R0Y2JpQWdmVnh1WEc0Z0lHTnZibk4wY25WamRFcHBZaWgyWVd4MVpTa2dlMXh1SUNBZ0lISmxkSFZ5YmlCamIyNXpkSEoxWTNSS2FXSW9kbUZzZFdVcE8xeHVJQ0I5WEc1Y2JpQWdjSFZ6YUZKbGJtUmxjaWh5Wlc1a1pYSlNaWE4xYkhRcElIdGNiaUFnSUNCMGFHbHpMbVZ0YVhRb1ZWQkVRVlJGWDBWV1JVNVVMQ0J5Wlc1a1pYSlNaWE4xYkhRcE8xeHVJQ0I5WEc1Y2JpQWdMeThnWlhOc2FXNTBMV1JwYzJGaWJHVXRibVY0ZEMxc2FXNWxJRzV2TFhWdWRYTmxaQzEyWVhKelhHNGdJRzl1VUhKdmNGVndaR0YwWldRb2NISnZjRTVoYldVc0lHNWxkMVpoYkhWbExDQnZiR1JXWVd4MVpTa2dlMXh1SUNCOVhHNWNiaUFnTHk4Z1pYTnNhVzUwTFdScGMyRmliR1V0Ym1WNGRDMXNhVzVsSUc1dkxYVnVkWE5sWkMxMllYSnpYRzRnSUc5dVUzUmhkR1ZWY0dSaGRHVmtLSEJ5YjNCT1lXMWxMQ0J1WlhkV1lXeDFaU3dnYjJ4a1ZtRnNkV1VwSUh0Y2JpQWdmVnh1WEc0Z0lHTmhjSFIxY21WU1pXWmxjbVZ1WTJVb2JtRnRaU3dnYVc1MFpYSmpaWEIwYjNKRFlXeHNZbUZqYXlrZ2UxeHVJQ0FnSUd4bGRDQnRaWFJvYjJRZ1BTQjBhR2x6VzBOQlVGUlZVa1ZmVWtWR1JWSkZUa05GWDAxRlZFaFBSRk5kVzI1aGJXVmRPMXh1SUNBZ0lHbG1JQ2h0WlhSb2IyUXBYRzRnSUNBZ0lDQnlaWFIxY200Z2JXVjBhRzlrTzF4dVhHNGdJQ0FnYldWMGFHOWtJRDBnS0Y5eVpXWXNJSEJ5WlhacGIzVnpVbVZtS1NBOVBpQjdYRzRnSUNBZ0lDQnNaWFFnY21WbUlEMGdYM0psWmp0Y2JseHVJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQnBiblJsY21ObGNIUnZja05oYkd4aVlXTnJJRDA5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ0lDQnlaV1lnUFNCcGJuUmxjbU5sY0hSdmNrTmhiR3hpWVdOckxtTmhiR3dvZEdocGN5d2djbVZtTENCd2NtVjJhVzkxYzFKbFppazdYRzVjYmlBZ0lDQWdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowYVdWektIUm9hWE1zSUh0Y2JpQWdJQ0FnSUNBZ1cyNWhiV1ZkT2lCN1hHNGdJQ0FnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdjbVZtTEZ4dUlDQWdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdhVzUwWlhKalpYQjBiM0pEWVd4c1ltRmpheUFoUFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNBZ0lIUm9hWE5iUTBGUVZGVlNSVjlTUlVaRlVrVk9RMFZmVFVWVVNFOUVVMTBnUFNCdFpYUm9iMlE3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdiV1YwYUc5a08xeHVJQ0I5WEc1Y2JpQWdabTl5WTJWVmNHUmhkR1VvS1NCN1hHNGdJQ0FnZEdocGMxdFJWVVZWUlY5VlVFUkJWRVZmVFVWVVNFOUVYU2dwTzF4dUlDQjlYRzVjYmlBZ1oyVjBVM1JoZEdVb2NISnZjR1Z5ZEhsUVlYUm9MQ0JrWldaaGRXeDBWbUZzZFdVcElIdGNiaUFnSUNCc1pYUWdjM1JoZEdVZ1BTQjBhR2x6TG5OMFlYUmxPMXh1SUNBZ0lHbG1JQ2hoY21kMWJXVnVkSE11YkdWdVozUm9JRDA5UFNBd0tWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhOMFlYUmxPMXh1WEc0Z0lDQWdhV1lnS0ZWMGFXeHpMbWx1YzNSaGJtTmxUMllvY0hKdmNHVnlkSGxRWVhSb0xDQW5iMkpxWldOMEp5a3BJSHRjYmlBZ0lDQWdJR3hsZENCclpYbHpJQ0FnSUNBZ0lDQTlJRTlpYW1WamRDNXJaWGx6S0hCeWIzQmxjblI1VUdGMGFDa3VZMjl1WTJGMEtFOWlhbVZqZEM1blpYUlBkMjVRY205d1pYSjBlVk41YldKdmJITW9jSEp2Y0dWeWRIbFFZWFJvS1NrN1hHNGdJQ0FnSUNCc1pYUWdabWx1WVd4VGRHRjBaU0FnUFNCN2ZUdGNibHh1SUNBZ0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQnJaWGtnUFNCclpYbHpXMmxkTzF4dUlDQWdJQ0FnSUNCc1pYUWdXeUIyWVd4MVpTd2diR0Z6ZEZCaGNuUWdYU0E5SUZWMGFXeHpMbVpsZEdOb1JHVmxjRkJ5YjNCbGNuUjVLSE4wWVhSbExDQnJaWGtzSUhCeWIzQmxjblI1VUdGMGFGdHJaWGxkTENCMGNuVmxLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHeGhjM1JRWVhKMElEMDlJRzUxYkd3cFhHNGdJQ0FnSUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzVjYmlBZ0lDQWdJQ0FnWm1sdVlXeFRkR0YwWlZ0c1lYTjBVR0Z5ZEYwZ1BTQjJZV3gxWlR0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdacGJtRnNVM1JoZEdVN1hHNGdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQlZkR2xzY3k1bVpYUmphRVJsWlhCUWNtOXdaWEowZVNoemRHRjBaU3dnY0hKdmNHVnlkSGxRWVhSb0xDQmtaV1poZFd4MFZtRnNkV1VwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUhObGRGTjBZWFJsS0haaGJIVmxLU0I3WEc0Z0lDQWdhV1lnS0NGcGMxWmhiR2xrVTNSaGRHVlBZbXBsWTNRb2RtRnNkV1VwS1Z4dUlDQWdJQ0FnZEdoeWIzY2dibVYzSUZSNWNHVkZjbkp2Y2loZ1NXNTJZV3hwWkNCMllXeDFaU0JtYjNJZ1hDSjBhR2x6TG5ObGRGTjBZWFJsWENJNklGd2lKSHQyWVd4MVpYMWNJaTRnVUhKdmRtbGtaV1FnWENKemRHRjBaVndpSUcxMWMzUWdZbVVnWVc0Z2FYUmxjbUZpYkdVZ2IySnFaV04wTG1BcE8xeHVYRzRnSUNBZ1QySnFaV04wTG1GemMybG5iaWgwYUdsekxuTjBZWFJsTENCMllXeDFaU2s3WEc0Z0lIMWNibHh1SUNCelpYUlRkR0YwWlZCaGMzTnBkbVVvZG1Gc2RXVXBJSHRjYmlBZ0lDQnBaaUFvSVdselZtRnNhV1JUZEdGMFpVOWlhbVZqZENoMllXeDFaU2twWEc0Z0lDQWdJQ0IwYUhKdmR5QnVaWGNnVkhsd1pVVnljbTl5S0dCSmJuWmhiR2xrSUhaaGJIVmxJR1p2Y2lCY0luUm9hWE11YzJWMFUzUmhkR1ZRWVhOemFYWmxYQ0k2SUZ3aUpIdDJZV3gxWlgxY0lpNGdVSEp2ZG1sa1pXUWdYQ0p6ZEdGMFpWd2lJRzExYzNRZ1ltVWdZVzRnYVhSbGNtRmliR1VnYjJKcVpXTjBMbUFwTzF4dVhHNGdJQ0FnZEhKNUlIdGNiaUFnSUNBZ0lIUm9hWE5iVTB0SlVGOVRWRUZVUlY5VlVFUkJWRVZUWFNBOUlIUnlkV1U3WEc0Z0lDQWdJQ0JQWW1wbFkzUXVZWE56YVdkdUtIUm9hWE11YzNSaGRHVXNJSFpoYkhWbEtUdGNiaUFnSUNCOUlHWnBibUZzYkhrZ2UxeHVJQ0FnSUNBZ2RHaHBjMXRUUzBsUVgxTlVRVlJGWDFWUVJFRlVSVk5kSUQwZ1ptRnNjMlU3WEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnYzJodmRXeGtWWEJrWVhSbEtDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNCOVhHNWNiaUFnWkdWemRISnZlU2dwSUh0Y2JpQWdJQ0JrWld4bGRHVWdkR2hwY3k1emRHRjBaVHRjYmlBZ0lDQmtaV3hsZEdVZ2RHaHBjeTV3Y205d2N6dGNiaUFnSUNCa1pXeGxkR1VnZEdocGN5NWpiMjUwWlhoME8xeHVJQ0FnSUdSbGJHVjBaU0IwYUdselcwTkJVRlJWVWtWZlVrVkdSVkpGVGtORlgwMUZWRWhQUkZOZE8xeHVJQ0FnSUhSb2FYTXVZMnhsWVhKQmJHeEVaV0p2ZFc1alpYTW9LVHRjYmlBZ2ZWeHVYRzRnSUhKbGJtUmxjbGRoYVhScGJtY29LU0I3WEc0Z0lIMWNibHh1SUNCeVpXNWtaWElvWTJocGJHUnlaVzRwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdZMmhwYkdSeVpXNDdYRzRnSUgxY2JseHVJQ0IxY0dSaGRHVmtLQ2tnZTF4dUlDQjlYRzVjYmlBZ1kyOXRZbWx1WlZkcGRHZ29jMlZ3TENBdUxpNWhjbWR6S1NCN1hHNGdJQ0FnYkdWMElHWnBibUZzUVhKbmN5QTlJRzVsZHlCVFpYUW9LVHRjYmlBZ0lDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0JoY21kekxteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BJSHRjYmlBZ0lDQWdJR3hsZENCaGNtY2dQU0JoY21kelcybGRPMXh1SUNBZ0lDQWdhV1lnS0NGaGNtY3BYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmloaGNtY3NJQ2R6ZEhKcGJtY25LU2tnZTF4dUlDQWdJQ0FnSUNCc1pYUWdkbUZzZFdWeklEMGdZWEpuTG5Od2JHbDBLSE5sY0NrdVptbHNkR1Z5S0ZWMGFXeHpMbWx6VG05MFJXMXdkSGtwTzF4dUlDQWdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQjJZV3gxWlhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlIWmhiSFZsYzF0cFhUdGNiaUFnSUNBZ0lDQWdJQ0JtYVc1aGJFRnlaM011WVdSa0tIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaEJjbkpoZVM1cGMwRnljbUY1S0dGeVp5a3BJSHRjYmlBZ0lDQWdJQ0FnYkdWMElIWmhiSFZsY3lBOUlHRnlaeTVtYVd4MFpYSW9LSFpoYkhWbEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0YyWVd4MVpTbGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNBZ0lDQWdJQ0FnSUdsbUlDZ2hWWFJwYkhNdWFXNXpkR0Z1WTJWUFppaDJZV3gxWlN3Z0ozTjBjbWx1WnljcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRlYwYVd4ekxtbHpUbTkwUlcxd2RIa29kbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQjJZV3gxWlhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlIWmhiSFZsYzF0cFhUdGNiaUFnSUNBZ0lDQWdJQ0JtYVc1aGJFRnlaM011WVdSa0tIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHRnlaeXdnSjI5aWFtVmpkQ2NwS1NCN1hHNGdJQ0FnSUNBZ0lHeGxkQ0JyWlhseklEMGdUMkpxWldOMExtdGxlWE1vWVhKbktUdGNiaUFnSUNBZ0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJR3RsZVNBZ0lEMGdhMlY1YzF0cFhUdGNiaUFnSUNBZ0lDQWdJQ0JzWlhRZ2RtRnNkV1VnUFNCaGNtZGJhMlY1WFR0Y2JseHVJQ0FnSUNBZ0lDQWdJR2xtSUNnaGRtRnNkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1pwYm1Gc1FYSm5jeTVrWld4bGRHVW9hMlY1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1SUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJR1pwYm1Gc1FYSm5jeTVoWkdRb2EyVjVLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJSEpsZEhWeWJpQkJjbkpoZVM1bWNtOXRLR1pwYm1Gc1FYSm5jeWt1YW05cGJpaHpaWEFnZkh3Z0p5Y3BPMXh1SUNCOVhHNWNiaUFnWTJ4aGMzTmxjeWd1TGk1aGNtZHpLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11WTI5dFltbHVaVmRwZEdnb0p5QW5MQ0F1TGk1aGNtZHpLVHRjYmlBZ2ZWeHVYRzRnSUdWNGRISmhZM1JEYUdsc1pISmxiaWhmY0dGMGRHVnlibk1zSUdOb2FXeGtjbVZ1S1NCN1hHNGdJQ0FnYkdWMElHVjRkSEpoWTNSbFpDQTlJSHQ5TzF4dUlDQWdJR3hsZENCd1lYUjBaWEp1Y3lBZ1BTQmZjR0YwZEdWeWJuTTdYRzRnSUNBZ2JHVjBJR2x6UVhKeVlYa2dJQ0E5SUVGeWNtRjVMbWx6UVhKeVlYa29jR0YwZEdWeWJuTXBPMXh1WEc0Z0lDQWdZMjl1YzNRZ2FYTk5ZWFJqYUNBOUlDaHFhV0lwSUQwK0lIdGNiaUFnSUNBZ0lHeGxkQ0JxYVdKVWVYQmxJRDBnYW1saUxsUjVjR1U3WEc0Z0lDQWdJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmlocWFXSlVlWEJsTENBbmMzUnlhVzVuSnlrcFhHNGdJQ0FnSUNBZ0lHcHBZbFI1Y0dVZ1BTQnFhV0pVZVhCbExuUnZURzkzWlhKRFlYTmxLQ2s3WEc1Y2JpQWdJQ0FnSUdsbUlDaHBjMEZ5Y21GNUtTQjdYRzRnSUNBZ0lDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUhCaGRIUmxjbTV6TG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdJQ0JzWlhRZ2NHRjBkR1Z5YmlBOUlIQmhkSFJsY201elcybGRPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtIQmhkSFJsY200c0lDZHpkSEpwYm1jbktTbGNiaUFnSUNBZ0lDQWdJQ0FnSUhCaGRIUmxjbTRnUFNCd1lYUjBaWEp1TG5SdlRHOTNaWEpEWVhObEtDazdYRzVjYmlBZ0lDQWdJQ0FnSUNCcFppQW9hbWxpVkhsd1pTQTlQVDBnY0dGMGRHVnliaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaWGgwY21GamRHVmtXM0JoZEhSbGNtNWRJRDBnYW1saU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0JzWlhRZ2EyVjVjeUE5SUU5aWFtVmpkQzVyWlhsektIQmhkSFJsY201ektUdGNiaUFnSUNBZ0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJR3RsZVNBZ0lDQWdQU0JyWlhselcybGRPMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQndZWFIwWlhKdUlEMGdjR0YwZEdWeWJuTmJhMlY1WFR0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnY21WemRXeDBPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9jR0YwZEdWeWJpd2dVbVZuUlhod0tTbGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGMzVnNkQ0E5SUhCaGRIUmxjbTR1ZEdWemRDaHFhV0pVZVhCbEtUdGNiaUFnSUNBZ0lDQWdJQ0JsYkhObElHbG1JQ2hWZEdsc2N5NXBibk4wWVc1alpVOW1LSEJoZEhSbGNtNHNJQ2R6ZEhKcGJtY25LU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxjM1ZzZENBOUlDaHdZWFIwWlhKdUxuUnZURzkzWlhKRFlYTmxLQ2tnUFQwOUlHcHBZbFI1Y0dVcE8xeHVJQ0FnSUNBZ0lDQWdJR1ZzYzJWY2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYzNWc2RDQTlJQ2h3WVhSMFpYSnVJRDA5UFNCcWFXSlVlWEJsS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJR2xtSUNoeVpYTjFiSFFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Y0ZEhKaFkzUmxaRnRyWlhsZElEMGdhbWxpTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWlhoMGNtRmpkR1ZrTG5KbGJXRnBibWx1WjBOb2FXeGtjbVZ1SUQwZ1kyaHBiR1J5Wlc0dVptbHNkR1Z5S0NocWFXSXBJRDArSUNGcGMwMWhkR05vS0dwcFlpa3BPMXh1SUNBZ0lISmxkSFZ5YmlCbGVIUnlZV04wWldRN1hHNGdJSDFjYmx4dUlDQmtaV0p2ZFc1alpTaG1kVzVqTENCMGFXMWxMQ0JmYVdRcElIdGNiaUFnSUNCamIyNXpkQ0JqYkdWaGNsQmxibVJwYm1kVWFXMWxiM1YwSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnYVdZZ0tIQmxibVJwYm1kVWFXMWxjaUFtSmlCd1pXNWthVzVuVkdsdFpYSXVkR2x0Wlc5MWRDa2dlMXh1SUNBZ0lDQWdJQ0JqYkdWaGNsUnBiV1Z2ZFhRb2NHVnVaR2x1WjFScGJXVnlMblJwYldWdmRYUXBPMXh1SUNBZ0lDQWdJQ0J3Wlc1a2FXNW5WR2x0WlhJdWRHbHRaVzkxZENBOUlHNTFiR3c3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdmVHRjYmx4dUlDQWdJSFpoY2lCcFpDQTlJQ2doWDJsa0tTQS9JQ2duSnlBcklHWjFibU1wSURvZ1gybGtPMXh1SUNBZ0lHbG1JQ2doZEdocGN5NWtaV0p2ZFc1alpWUnBiV1Z5Y3lrZ2UxeHVJQ0FnSUNBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLSFJvYVhNc0lDZGtaV0p2ZFc1alpWUnBiV1Z5Y3ljc0lIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnZTMwc1hHNGdJQ0FnSUNCOUtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCMllYSWdjR1Z1WkdsdVoxUnBiV1Z5SUQwZ2RHaHBjeTVrWldKdmRXNWpaVlJwYldWeWMxdHBaRjA3WEc0Z0lDQWdhV1lnS0NGd1pXNWthVzVuVkdsdFpYSXBYRzRnSUNBZ0lDQndaVzVrYVc1blZHbHRaWElnUFNCMGFHbHpMbVJsWW05MWJtTmxWR2x0WlhKelcybGtYU0E5SUh0OU8xeHVYRzRnSUNBZ2NHVnVaR2x1WjFScGJXVnlMbVoxYm1NZ1BTQm1kVzVqTzF4dUlDQWdJR05zWldGeVVHVnVaR2x1WjFScGJXVnZkWFFvS1R0Y2JseHVJQ0FnSUhaaGNpQndjbTl0YVhObElEMGdjR1Z1WkdsdVoxUnBiV1Z5TG5CeWIyMXBjMlU3WEc0Z0lDQWdhV1lnS0NGd2NtOXRhWE5sSUh4OElDRndjbTl0YVhObExuQmxibVJwYm1jb0tTa2dlMXh1SUNBZ0lDQWdiR1YwSUhOMFlYUjFjeUE5SUNkd1pXNWthVzVuSnp0Y2JpQWdJQ0FnSUd4bGRDQnlaWE52YkhabE8xeHVYRzRnSUNBZ0lDQndjbTl0YVhObElEMGdjR1Z1WkdsdVoxUnBiV1Z5TG5CeWIyMXBjMlVnUFNCdVpYY2dVSEp2YldselpTZ29YM0psYzI5c2RtVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ2NtVnpiMngyWlNBOUlGOXlaWE52YkhabE8xeHVJQ0FnSUNBZ2ZTazdYRzVjYmlBZ0lDQWdJSEJ5YjIxcGMyVXVjbVZ6YjJ4MlpTQTlJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdhV1lnS0hOMFlYUjFjeUFoUFQwZ0ozQmxibVJwYm1jbktWeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJqdGNibHh1SUNBZ0lDQWdJQ0J6ZEdGMGRYTWdQU0FuWm5Wc1ptbHNiR1ZrSnp0Y2JpQWdJQ0FnSUNBZ1kyeGxZWEpRWlc1a2FXNW5WR2x0Wlc5MWRDZ3BPMXh1SUNBZ0lDQWdJQ0IwYUdsekxtUmxZbTkxYm1ObFZHbHRaWEp6VzJsa1hTQTlJRzUxYkd3N1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0hSNWNHVnZaaUJ3Wlc1a2FXNW5WR2x0WlhJdVpuVnVZeUE5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lDQWdJQ0FnSUhaaGNpQnlaWFFnUFNCd1pXNWthVzVuVkdsdFpYSXVablZ1WXk1allXeHNLSFJvYVhNcE8xeHVJQ0FnSUNBZ0lDQWdJR2xtSUNoeVpYUWdhVzV6ZEdGdVkyVnZaaUJRY205dGFYTmxJSHg4SUNoeVpYUWdKaVlnZEhsd1pXOW1JSEpsZEM1MGFHVnVJRDA5UFNBblpuVnVZM1JwYjI0bktTbGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRDNTBhR1Z1S0NoMllXeDFaU2tnUFQ0Z2NtVnpiMngyWlNoMllXeDFaU2twTzF4dUlDQWdJQ0FnSUNBZ0lHVnNjMlZjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxjMjlzZG1Vb2NtVjBLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYTnZiSFpsS0NrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lIMDdYRzVjYmlBZ0lDQWdJSEJ5YjIxcGMyVXVZMkZ1WTJWc0lEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnpkR0YwZFhNZ1BTQW5jbVZxWldOMFpXUW5PMXh1SUNBZ0lDQWdJQ0JqYkdWaGNsQmxibVJwYm1kVWFXMWxiM1YwS0NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WkdWaWIzVnVZMlZVYVcxbGNuTmJhV1JkSUQwZ2JuVnNiRHRjYmx4dUlDQWdJQ0FnSUNCd2NtOXRhWE5sTG5KbGMyOXNkbVVvS1R0Y2JpQWdJQ0FnSUgwN1hHNWNiaUFnSUNBZ0lIQnliMjFwYzJVdWFYTlFaVzVrYVc1bklEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0tITjBZWFIxY3lBOVBUMGdKM0JsYm1ScGJtY25LVHRjYmlBZ0lDQWdJSDA3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjR1Z1WkdsdVoxUnBiV1Z5TG5ScGJXVnZkWFFnUFNCelpYUlVhVzFsYjNWMEtIQnliMjFwYzJVdWNtVnpiMngyWlN3Z0tIUnBiV1VnUFQwZ2JuVnNiQ2tnUHlBeU5UQWdPaUIwYVcxbEtUdGNibHh1SUNBZ0lISmxkSFZ5YmlCd2NtOXRhWE5sTzF4dUlDQjlYRzVjYmlBZ1kyeGxZWEpFWldKdmRXNWpaU2hwWkNrZ2UxeHVJQ0FnSUhaaGNpQndaVzVrYVc1blZHbHRaWElnUFNCMGFHbHpMbVJsWW05MWJtTmxWR2x0WlhKelcybGtYVHRjYmlBZ0lDQnBaaUFvY0dWdVpHbHVaMVJwYldWeUlEMDlJRzUxYkd3cFhHNGdJQ0FnSUNCeVpYUjFjbTQ3WEc1Y2JpQWdJQ0JwWmlBb2NHVnVaR2x1WjFScGJXVnlMblJwYldWdmRYUXBYRzRnSUNBZ0lDQmpiR1ZoY2xScGJXVnZkWFFvY0dWdVpHbHVaMVJwYldWeUxuUnBiV1Z2ZFhRcE8xeHVYRzRnSUNBZ2FXWWdLSEJsYm1ScGJtZFVhVzFsY2k1d2NtOXRhWE5sS1Z4dUlDQWdJQ0FnY0dWdVpHbHVaMVJwYldWeUxuQnliMjFwYzJVdVkyRnVZMlZzS0NrN1hHNGdJSDFjYmx4dUlDQmpiR1ZoY2tGc2JFUmxZbTkxYm1ObGN5Z3BJSHRjYmlBZ0lDQnNaWFFnWkdWaWIzVnVZMlZVYVcxbGNuTWdJRDBnZEdocGN5NWtaV0p2ZFc1alpWUnBiV1Z5Y3lCOGZDQjdmVHRjYmlBZ0lDQnNaWFFnYVdSeklDQWdJQ0FnSUNBZ0lDQWdJRDBnVDJKcVpXTjBMbXRsZVhNb1pHVmliM1Z1WTJWVWFXMWxjbk1wTzF4dVhHNGdJQ0FnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2FXUnpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwWEc0Z0lDQWdJQ0IwYUdsekxtTnNaV0Z5UkdWaWIzVnVZMlVvYVdSelcybGRLVHRjYmlBZ2ZWeHVYRzRnSUdkbGRFVnNaVzFsYm5SRVlYUmhLR1ZzWlcxbGJuUXBJSHRjYmlBZ0lDQnNaWFFnWkdGMFlTQTlJR1ZzWlcxbGJuUkVZWFJoUTJGamFHVXVaMlYwS0dWc1pXMWxiblFwTzF4dUlDQWdJR2xtSUNnaFpHRjBZU2tnZTF4dUlDQWdJQ0FnWkdGMFlTQTlJSHQ5TzF4dUlDQWdJQ0FnWld4bGJXVnVkRVJoZEdGRFlXTm9aUzV6WlhRb1pXeGxiV1Z1ZEN3Z1pHRjBZU2s3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjbVYwZFhKdUlHUmhkR0U3WEc0Z0lIMWNibjFjYmlJc0ltTnZibk4wSUVWV1JVNVVYMHhKVTFSRlRrVlNVeUE5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TDJWMlpXNTBjeTlzYVhOMFpXNWxjbk1uS1R0Y2JseHVaWGh3YjNKMElHTnNZWE56SUVWMlpXNTBSVzFwZEhSbGNpQjdYRzRnSUdOdmJuTjBjblZqZEc5eUtDa2dlMXh1SUNBZ0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBhV1Z6S0hSb2FYTXNJSHRjYmlBZ0lDQWdJRnRGVmtWT1ZGOU1TVk5VUlU1RlVsTmRPaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdibVYzSUUxaGNDZ3BMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQjlLVHRjYmlBZ2ZWeHVYRzRnSUdGa1pFeHBjM1JsYm1WeUtHVjJaVzUwVG1GdFpTd2diR2x6ZEdWdVpYSXBJSHRjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JR3hwYzNSbGJtVnlJQ0U5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ2RHaHliM2NnYm1WM0lGUjVjR1ZGY25KdmNpZ25SWFpsYm5RZ2JHbHpkR1Z1WlhJZ2JYVnpkQ0JpWlNCaElHMWxkR2h2WkNjcE8xeHVYRzRnSUNBZ2JHVjBJR1YyWlc1MFRXRndJQ0E5SUhSb2FYTmJSVlpGVGxSZlRFbFRWRVZPUlZKVFhUdGNiaUFnSUNCc1pYUWdjMk52Y0dVZ0lDQWdJRDBnWlhabGJuUk5ZWEF1WjJWMEtHVjJaVzUwVG1GdFpTazdYRzVjYmlBZ0lDQnBaaUFvSVhOamIzQmxLU0I3WEc0Z0lDQWdJQ0J6WTI5d1pTQTlJRnRkTzF4dUlDQWdJQ0FnWlhabGJuUk5ZWEF1YzJWMEtHVjJaVzUwVG1GdFpTd2djMk52Y0dVcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhOamIzQmxMbkIxYzJnb2JHbHpkR1Z1WlhJcE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzRnSUgxY2JseHVJQ0J5WlcxdmRtVk1hWE4wWlc1bGNpaGxkbVZ1ZEU1aGJXVXNJR3hwYzNSbGJtVnlLU0I3WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUJzYVhOMFpXNWxjaUFoUFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNBZ0lIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9KMFYyWlc1MElHeHBjM1JsYm1WeUlHMTFjM1FnWW1VZ1lTQnRaWFJvYjJRbktUdGNibHh1SUNBZ0lHeGxkQ0JsZG1WdWRFMWhjQ0FnUFNCMGFHbHpXMFZXUlU1VVgweEpVMVJGVGtWU1UxMDdYRzRnSUNBZ2JHVjBJSE5qYjNCbElDQWdJQ0E5SUdWMlpXNTBUV0Z3TG1kbGRDaGxkbVZ1ZEU1aGJXVXBPMXh1SUNBZ0lHbG1JQ2doYzJOdmNHVXBYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmx4dUlDQWdJR3hsZENCcGJtUmxlQ0E5SUhOamIzQmxMbWx1WkdWNFQyWW9iR2x6ZEdWdVpYSXBPMXh1SUNBZ0lHbG1JQ2hwYm1SbGVDQStQU0F3S1Z4dUlDQWdJQ0FnYzJOdmNHVXVjM0JzYVdObEtHbHVaR1Y0TENBeEtUdGNibHh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpPMXh1SUNCOVhHNWNiaUFnY21WdGIzWmxRV3hzVEdsemRHVnVaWEp6S0dWMlpXNTBUbUZ0WlNrZ2UxeHVJQ0FnSUd4bGRDQmxkbVZ1ZEUxaGNDQWdQU0IwYUdselcwVldSVTVVWDB4SlUxUkZUa1ZTVTEwN1hHNGdJQ0FnYVdZZ0tDRmxkbVZ1ZEUxaGNDNW9ZWE1vWlhabGJuUk9ZVzFsS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsek8xeHVYRzRnSUNBZ1pYWmxiblJOWVhBdWMyVjBLR1YyWlc1MFRtRnRaU3dnVzEwcE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzRnSUgxY2JseHVJQ0JsYldsMEtHVjJaVzUwVG1GdFpTd2dMaTR1WVhKbmN5a2dlMXh1SUNBZ0lHeGxkQ0JsZG1WdWRFMWhjQ0FnUFNCMGFHbHpXMFZXUlU1VVgweEpVMVJGVGtWU1UxMDdYRzRnSUNBZ2JHVjBJSE5qYjNCbElDQWdJQ0E5SUdWMlpXNTBUV0Z3TG1kbGRDaGxkbVZ1ZEU1aGJXVXBPMXh1SUNBZ0lHbG1JQ2doYzJOdmNHVWdmSHdnYzJOdmNHVXViR1Z1WjNSb0lEMDlQU0F3S1Z4dUlDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUNBZ1ptOXlJQ2hzWlhRZ2FTQTlJREFzSUdsc0lEMGdjMk52Y0dVdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdiR1YwSUdWMlpXNTBRMkZzYkdKaFkyc2dQU0J6WTI5d1pWdHBYVHRjYmlBZ0lDQWdJR1YyWlc1MFEyRnNiR0poWTJzdVlYQndiSGtvZEdocGN5d2dZWEpuY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJSDFjYmx4dUlDQnZibU5sS0dWMlpXNTBUbUZ0WlN3Z2JHbHpkR1Z1WlhJcElIdGNiaUFnSUNCc1pYUWdablZ1WXlBOUlDZ3VMaTVoY21kektTQTlQaUI3WEc0Z0lDQWdJQ0IwYUdsekxtOW1aaWhsZG1WdWRFNWhiV1VzSUdaMWJtTXBPMXh1SUNBZ0lDQWdjbVYwZFhKdUlHeHBjM1JsYm1WeUtDNHVMbUZ5WjNNcE8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NXZiaWhsZG1WdWRFNWhiV1VzSUdaMWJtTXBPMXh1SUNCOVhHNWNiaUFnYjI0b1pYWmxiblJPWVcxbExDQnNhWE4wWlc1bGNpa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpMbUZrWkV4cGMzUmxibVZ5S0dWMlpXNTBUbUZ0WlN3Z2JHbHpkR1Z1WlhJcE8xeHVJQ0I5WEc1Y2JpQWdiMlptS0dWMlpXNTBUbUZ0WlN3Z2JHbHpkR1Z1WlhJcElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NXlaVzF2ZG1WTWFYTjBaVzVsY2lobGRtVnVkRTVoYldVc0lHeHBjM1JsYm1WeUtUdGNiaUFnZlZ4dVhHNGdJR1YyWlc1MFRtRnRaWE1vS1NCN1hHNGdJQ0FnY21WMGRYSnVJRUZ5Y21GNUxtWnliMjBvZEdocGMxdEZWa1ZPVkY5TVNWTlVSVTVGVWxOZExtdGxlWE1vS1NrN1hHNGdJSDFjYmx4dUlDQnNhWE4wWlc1bGNrTnZkVzUwS0dWMlpXNTBUbUZ0WlNrZ2UxeHVJQ0FnSUd4bGRDQmxkbVZ1ZEUxaGNDQWdQU0IwYUdselcwVldSVTVVWDB4SlUxUkZUa1ZTVTEwN1hHNGdJQ0FnYkdWMElITmpiM0JsSUNBZ0lDQTlJR1YyWlc1MFRXRndMbWRsZENobGRtVnVkRTVoYldVcE8xeHVJQ0FnSUdsbUlDZ2hjMk52Y0dVcFhHNGdJQ0FnSUNCeVpYUjFjbTRnTUR0Y2JseHVJQ0FnSUhKbGRIVnliaUJ6WTI5d1pTNXNaVzVuZEdnN1hHNGdJSDFjYmx4dUlDQnNhWE4wWlc1bGNuTW9aWFpsYm5ST1lXMWxLU0I3WEc0Z0lDQWdiR1YwSUdWMlpXNTBUV0Z3SUNBOUlIUm9hWE5iUlZaRlRsUmZURWxUVkVWT1JWSlRYVHRjYmlBZ0lDQnNaWFFnYzJOdmNHVWdJQ0FnSUQwZ1pYWmxiblJOWVhBdVoyVjBLR1YyWlc1MFRtRnRaU2s3WEc0Z0lDQWdhV1lnS0NGelkyOXdaU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQmJYVHRjYmx4dUlDQWdJSEpsZEhWeWJpQnpZMjl3WlM1emJHbGpaU2dwTzF4dUlDQjlYRzU5WEc0aUxDSnBiWEJ2Y25RZ1pHVmhaR0psWldZZ1puSnZiU0FuWkdWaFpHSmxaV1luTzF4dWFXMXdiM0owSUNvZ1lYTWdWWFJwYkhNZ1puSnZiU0FuTGk5MWRHbHNjeTVxY3ljN1hHNWNibVY0Y0c5eWRDQmpiR0Z6Y3lCS2FXSWdlMXh1SUNCamIyNXpkSEoxWTNSdmNpaFVlWEJsTENCd2NtOXdjeXdnWTJocGJHUnlaVzRwSUh0Y2JpQWdJQ0JzWlhRZ1pHVm1ZWFZzZEZCeWIzQnpJRDBnS0ZSNWNHVWdKaVlnVkhsd1pTNXdjbTl3Y3lrZ1B5QlVlWEJsTG5CeWIzQnpJRG9nZTMwN1hHNWNiaUFnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRHbGxjeWgwYUdsekxDQjdYRzRnSUNBZ0lDQW5WSGx3WlNjNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0JVZVhCbExGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHdjbTl3Y3ljNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0I3SUM0dUxtUmxabUYxYkhSUWNtOXdjeXdnTGk0dUtIQnliM0J6SUh4OElIdDlLU0I5TEZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNkamFHbHNaSEpsYmljNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0JWZEdsc2N5NW1iR0YwZEdWdVFYSnlZWGtvWTJocGJHUnlaVzRwTEZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0I5S1R0Y2JpQWdmVnh1ZlZ4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnU2tsQ1gwSkJVbEpGVGlBZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWN5NWlZWEp5Wlc0bktUdGNibVY0Y0c5eWRDQmpiMjV6ZENCS1NVSmZVRkpQV0ZrZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMbkJ5YjNoNUp5azdYRzVsZUhCdmNuUWdZMjl1YzNRZ1NrbENJQ0FnSUNBZ0lDQWdQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljeTVxYVdJbktUdGNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR1poWTNSdmNua29TbWxpUTJ4aGMzTXBJSHRjYmlBZ2NtVjBkWEp1SUdaMWJtTjBhVzl1SUNRb1gzUjVjR1VzSUhCeWIzQnpJRDBnZTMwcElIdGNiaUFnSUNCcFppQW9hWE5LYVdKcGMyZ29YM1I1Y0dVcEtWeHVJQ0FnSUNBZ2RHaHliM2NnYm1WM0lGUjVjR1ZGY25KdmNpZ25VbVZqWldsMlpXUWdZU0JxYVdJZ1luVjBJR1Y0Y0dWamRHVmtJR0VnWTI5dGNHOXVaVzUwTGljcE8xeHVYRzRnSUNBZ2JHVjBJRlI1Y0dVZ1BTQW9YM1I1Y0dVZ1BUMGdiblZzYkNrZ1B5QktTVUpmVUZKUFdGa2dPaUJmZEhsd1pUdGNibHh1SUNBZ0lHWjFibU4wYVc5dUlHSmhjbkpsYmlndUxpNWZZMmhwYkdSeVpXNHBJSHRjYmlBZ0lDQWdJR3hsZENCamFHbHNaSEpsYmlBOUlGOWphR2xzWkhKbGJqdGNibHh1SUNBZ0lDQWdablZ1WTNScGIyNGdhbWxpS0NrZ2UxeHVJQ0FnSUNBZ0lDQnBaaUFvVlhScGJITXVhVzV6ZEdGdVkyVlBaaWhVZVhCbExDQW5jSEp2YldselpTY3BJSHg4SUdOb2FXeGtjbVZ1TG5OdmJXVW9LR05vYVd4a0tTQTlQaUJWZEdsc2N5NXBibk4wWVc1alpVOW1LR05vYVd4a0xDQW5jSEp2YldselpTY3BLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCUWNtOXRhWE5sTG1Gc2JDaGJJRlI1Y0dVZ1hTNWpiMjVqWVhRb1kyaHBiR1J5Wlc0cEtTNTBhR1Z1S0NoaGJHd3BJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJRlI1Y0dVZ1BTQmhiR3hiTUYwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYUdsc1pISmxiaUE5SUdGc2JDNXpiR2xqWlNneEtUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QkthV0pEYkdGemN5aGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ1ZIbHdaU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdjSEp2Y0hNc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUdOb2FXeGtjbVZ1TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdLVHRjYmlBZ0lDQWdJQ0FnSUNCOUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJ1WlhjZ1NtbGlRMnhoYzNNb1hHNGdJQ0FnSUNBZ0lDQWdWSGx3WlN4Y2JpQWdJQ0FnSUNBZ0lDQndjbTl3Y3l4Y2JpQWdJQ0FnSUNBZ0lDQmphR2xzWkhKbGJpeGNiaUFnSUNBZ0lDQWdLVHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9hbWxpTENCN1hHNGdJQ0FnSUNBZ0lGdEtTVUpkT2lCN1hHNGdJQ0FnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdJQ0JiWkdWaFpHSmxaV1l1YVdSVGVXMWRPaUI3WEc0Z0lDQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQW9LU0E5UGlCVWVYQmxMRnh1SUNBZ0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnZlNrN1hHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCcWFXSTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUnBaWE1vWW1GeWNtVnVMQ0I3WEc0Z0lDQWdJQ0JiU2tsQ1gwSkJVbEpGVGwwNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJRnRrWldGa1ltVmxaaTVwWkZONWJWMDZJSHRjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQW9LU0E5UGlCVWVYQmxMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQjlLVHRjYmx4dUlDQWdJSEpsZEhWeWJpQmlZWEp5Wlc0N1hHNGdJSDA3WEc1OVhHNWNibVY0Y0c5eWRDQmpiMjV6ZENBa0lEMGdabUZqZEc5eWVTaEthV0lwTzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2FYTkthV0pwYzJnb2RtRnNkV1VwSUh0Y2JpQWdhV1lnS0hSNWNHVnZaaUIyWVd4MVpTQTlQVDBnSjJaMWJtTjBhVzl1SnlBbUppQW9kbUZzZFdWYlNrbENYMEpCVWxKRlRsMGdmSHdnZG1Gc2RXVmJTa2xDWFNrcFhHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnYVdZZ0tIWmhiSFZsSUdsdWMzUmhibU5sYjJZZ1NtbGlLVnh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lISmxkSFZ5YmlCbVlXeHpaVHRjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHTnZibk4wY25WamRFcHBZaWgyWVd4MVpTa2dlMXh1SUNCcFppQW9kbUZzZFdVZ2FXNXpkR0Z1WTJWdlppQkthV0lwWEc0Z0lDQWdjbVYwZFhKdUlIWmhiSFZsTzF4dVhHNGdJR2xtSUNoMGVYQmxiMllnZG1Gc2RXVWdQVDA5SUNkbWRXNWpkR2x2YmljcElIdGNiaUFnSUNCcFppQW9kbUZzZFdWYlNrbENYMEpCVWxKRlRsMHBYRzRnSUNBZ0lDQnlaWFIxY200Z2RtRnNkV1VvS1NncE8xeHVJQ0FnSUdWc2MyVWdhV1lnS0haaGJIVmxXMHBKUWwwcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZG1Gc2RXVW9LVHRjYmlBZ2ZWeHVYRzRnSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0oyTnZibk4wY25WamRFcHBZam9nVUhKdmRtbGtaV1FnZG1Gc2RXVWdhWE1nYm05MElHRWdTbWxpTGljcE8xeHVmVnh1WEc1bGVIQnZjblFnWVhONWJtTWdablZ1WTNScGIyNGdjbVZ6YjJ4MlpVTm9hV3hrY21WdUtGOWphR2xzWkhKbGJpa2dlMXh1SUNCc1pYUWdZMmhwYkdSeVpXNGdQU0JmWTJocGJHUnlaVzQ3WEc1Y2JpQWdhV1lnS0ZWMGFXeHpMbWx1YzNSaGJtTmxUMllvWTJocGJHUnlaVzRzSUNkd2NtOXRhWE5sSnlrcFhHNGdJQ0FnWTJocGJHUnlaVzRnUFNCaGQyRnBkQ0JqYUdsc1pISmxianRjYmx4dUlDQnBaaUFvSVNnb2RHaHBjeTVwYzBsMFpYSmhZbXhsUTJocGJHUWdmSHdnVlhScGJITXVhWE5KZEdWeVlXSnNaVU5vYVd4a0tTNWpZV3hzS0hSb2FYTXNJR05vYVd4a2NtVnVLU2tnSmlZZ0tHbHpTbWxpYVhOb0tHTm9hV3hrY21WdUtTQjhmQ0FvS0hSb2FYTXVhWE5XWVd4cFpFTm9hV3hrSUh4OElGVjBhV3h6TG1selZtRnNhV1JEYUdsc1pDa3VZMkZzYkNoMGFHbHpMQ0JqYUdsc1pISmxiaWtwS1NsY2JpQWdJQ0JqYUdsc1pISmxiaUE5SUZzZ1kyaHBiR1J5Wlc0Z1hUdGNibHh1SUNCc1pYUWdjSEp2YldselpYTWdQU0JWZEdsc2N5NXBkR1Z5WVhSbEtHTm9hV3hrY21WdUxDQmhjM2x1WXlBb2V5QjJZV3gxWlRvZ1gyTm9hV3hrSUgwcElEMCtJSHRjYmlBZ0lDQnNaWFFnWTJocGJHUWdQU0FvVlhScGJITXVhVzV6ZEdGdVkyVlBaaWhmWTJocGJHUXNJQ2R3Y205dGFYTmxKeWtwSUQ4Z1lYZGhhWFFnWDJOb2FXeGtJRG9nWDJOb2FXeGtPMXh1WEc0Z0lDQWdhV1lnS0dselNtbGlhWE5vS0dOb2FXeGtLU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQmhkMkZwZENCamIyNXpkSEoxWTNSS2FXSW9ZMmhwYkdRcE8xeHVJQ0FnSUdWc2MyVmNiaUFnSUNBZ0lISmxkSFZ5YmlCamFHbHNaRHRjYmlBZ2ZTazdYRzVjYmlBZ2NtVjBkWEp1SUdGM1lXbDBJRkJ5YjIxcGMyVXVZV3hzS0hCeWIyMXBjMlZ6S1R0Y2JuMWNiaUlzSW1sdGNHOXlkQ0I3SUZKdmIzUkZiR1Z0Wlc1MElIMGdabkp2YlNBbkxpOXliMjkwTFdWc1pXMWxiblF1YW5Nbk8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1EyOXRiV1Z1ZEVWc1pXMWxiblFnWlhoMFpXNWtjeUJTYjI5MFJXeGxiV1Z1ZENCN1hHNGdJSE4wWVhScFl5QlVXVkJGSUQwZ1VtOXZkRVZzWlcxbGJuUXVWRmxRUlY5RFQwMU5SVTVVTzF4dVhHNGdJR052Ym5OMGNuVmpkRzl5S0dsa0xDQjJZV3gxWlN3Z2NISnZjSE1wSUh0Y2JpQWdJQ0J6ZFhCbGNpaFNiMjkwUld4bGJXVnVkQzVVV1ZCRlgwTlBUVTFGVGxRc0lHbGtMQ0IyWVd4MVpTd2djSEp2Y0hNcE8xeHVJQ0I5WEc1OVhHNGlMQ0psZUhCdmNuUWdlMXh1SUNCRFQwNVVSVmhVWDBsRUxGeHVJQ0JTYjI5MFRtOWtaU3hjYm4wZ1puSnZiU0FuTGk5eWIyOTBMVzV2WkdVdWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdSazlTUTBWZlVrVkdURTlYSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5OR2IzSmpaVkpsWm14dmR5Y3BPMXh1WEc1bGVIQnZjblFnZXlCU1pXNWtaWEpsY2lCOUlHWnliMjBnSnk0dmNtVnVaR1Z5WlhJdWFuTW5PMXh1WEc1bGVIQnZjblFnZXlCU2IyOTBSV3hsYldWdWRDQjlJR1p5YjIwZ0p5NHZjbTl2ZEMxbGJHVnRaVzUwTG1wekp6dGNibVY0Y0c5eWRDQjdJRU52YlcxbGJuUkZiR1Z0Wlc1MElIMGdabkp2YlNBbkxpOWpiMjF0Wlc1MExXVnNaVzFsYm5RdWFuTW5PMXh1Wlhod2IzSjBJSHNnVG1GMGFYWmxSV3hsYldWdWRDQjlJR1p5YjIwZ0p5NHZibUYwYVhabExXVnNaVzFsYm5RdWFuTW5PMXh1Wlhod2IzSjBJSHNnVUc5eWRHRnNSV3hsYldWdWRDQjlJR1p5YjIwZ0p5NHZjRzl5ZEdGc0xXVnNaVzFsYm5RdWFuTW5PMXh1Wlhod2IzSjBJSHNnVkdWNGRFVnNaVzFsYm5RZ2ZTQm1jbTl0SUNjdUwzUmxlSFF0Wld4bGJXVnVkQzVxY3ljN1hHNGlMQ0pwYlhCdmNuUWdleUJTYjI5MFJXeGxiV1Z1ZENCOUlHWnliMjBnSnk0dmNtOXZkQzFsYkdWdFpXNTBMbXB6Snp0Y2JseHVaWGh3YjNKMElHTnNZWE56SUU1aGRHbDJaVVZzWlcxbGJuUWdaWGgwWlc1a2N5QlNiMjkwUld4bGJXVnVkQ0I3WEc0Z0lITjBZWFJwWXlCVVdWQkZJRDBnVW05dmRFVnNaVzFsYm5RdVZGbFFSVjlGVEVWTlJVNVVPMXh1WEc0Z0lHTnZibk4wY25WamRHOXlLR2xrTENCMllXeDFaU3dnY0hKdmNITXBJSHRjYmlBZ0lDQnpkWEJsY2loU2IyOTBSV3hsYldWdWRDNVVXVkJGWDBWTVJVMUZUbFFzSUdsa0xDQjJZV3gxWlN3Z2NISnZjSE1wTzF4dUlDQjlYRzU5WEc0aUxDSnBiWEJ2Y25RZ2V5QlNiMjkwUld4bGJXVnVkQ0I5SUdaeWIyMGdKeTR2Y205dmRDMWxiR1Z0Wlc1MExtcHpKenRjYmx4dVpYaHdiM0owSUdOc1lYTnpJRkJ2Y25SaGJFVnNaVzFsYm5RZ1pYaDBaVzVrY3lCU2IyOTBSV3hsYldWdWRDQjdYRzRnSUhOMFlYUnBZeUJVV1ZCRklEMGdVbTl2ZEVWc1pXMWxiblF1VkZsUVJWOVFUMUpVUVV3N1hHNWNiaUFnWTI5dWMzUnlkV04wYjNJb2FXUXNJSFpoYkhWbExDQndjbTl3Y3lrZ2UxeHVJQ0FnSUhOMWNHVnlLRkp2YjNSRmJHVnRaVzUwTGxSWlVFVmZVRTlTVkVGTUxDQnBaQ3dnZG1Gc2RXVXNJSEJ5YjNCektUdGNiaUFnZlZ4dWZWeHVJaXdpYVcxd2IzSjBJSHNnUlhabGJuUkZiV2wwZEdWeUlIMGdabkp2YlNBbkxpNHZaWFpsYm5SekxtcHpKenRjYm1sdGNHOXlkQ0FxSUdGeklGVjBhV3h6SUNBZ0lDQWdJR1p5YjIwZ0p5NHVMM1YwYVd4ekxtcHpKenRjYm1sdGNHOXlkQ0I3WEc0Z0lFTlBUbFJGV0ZSZlNVUXNYRzRnSUZKdmIzUk9iMlJsTEZ4dWZTQm1jbTl0SUNjdUwzSnZiM1F0Ym05a1pTNXFjeWM3WEc1Y2JteGxkQ0JmWTI5dWRHVjRkRWxFUTI5MWJuUmxjaUE5SURCdU8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1VtVnVaR1Z5WlhJZ1pYaDBaVzVrY3lCRmRtVnVkRVZ0YVhSMFpYSWdlMXh1SUNCemRHRjBhV01nVW05dmRFNXZaR1VnUFNCU2IyOTBUbTlrWlR0Y2JseHVJQ0JqYjI1emRISjFZM1J2Y2lncElIdGNiaUFnSUNCemRYQmxjaWdwTzF4dVhHNGdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9kR2hwY3l3Z2UxeHVJQ0FnSUNBZ0oyTnZiblJsZUhRbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUhSb2FYTXVZM0psWVhSbFEyOXVkR1Y0ZENncExGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZGtaWE4wY205NWFXNW5Kem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmNtVnVaR1Z5Um5KaGJXVW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lEQXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lIMHBPMXh1SUNCOVhHNWNiaUFnWTNKbFlYUmxRMjl1ZEdWNGRDaHliMjkwUTI5dWRHVjRkQ3dnYjI1VmNHUmhkR1VzSUc5dVZYQmtZWFJsVkdocGN5a2dlMXh1SUNBZ0lHeGxkQ0JqYjI1MFpYaDBJQ0FnSUNBOUlFOWlhbVZqZEM1amNtVmhkR1VvYm5Wc2JDazdYRzRnSUNBZ2JHVjBJRzE1UTI5dWRHVjRkRWxFSUQwZ0tISnZiM1JEYjI1MFpYaDBLU0EvSUhKdmIzUkRiMjUwWlhoMFcwTlBUbFJGV0ZSZlNVUmRJRG9nTVc0N1hHNWNiaUFnSUNCeVpYUjFjbTRnYm1WM0lGQnliM2g1S0dOdmJuUmxlSFFzSUh0Y2JpQWdJQ0FnSUdkbGREb2dLSFJoY21kbGRDd2djSEp2Y0U1aGJXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSEJ5YjNCT1lXMWxJRDA5UFNCRFQwNVVSVmhVWDBsRUtTQjdYRzRnSUNBZ0lDQWdJQ0FnYkdWMElIQmhjbVZ1ZEVsRUlEMGdLSEp2YjNSRGIyNTBaWGgwS1NBL0lISnZiM1JEYjI1MFpYaDBXME5QVGxSRldGUmZTVVJkSURvZ01XNDdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJQ2h3WVhKbGJuUkpSQ0ErSUcxNVEyOXVkR1Y0ZEVsRUtTQS9JSEJoY21WdWRFbEVJRG9nYlhsRGIyNTBaWGgwU1VRN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JwWmlBb0lVOWlhbVZqZEM1d2NtOTBiM1I1Y0dVdWFHRnpUM2R1VUhKdmNHVnlkSGt1WTJGc2JDaDBZWEpuWlhRc0lIQnliM0JPWVcxbEtTbGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdLSEp2YjNSRGIyNTBaWGgwS1NBL0lISnZiM1JEYjI1MFpYaDBXM0J5YjNCT1lXMWxYU0E2SUhWdVpHVm1hVzVsWkR0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHRnlaMlYwVzNCeWIzQk9ZVzFsWFR0Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCelpYUTZJQ2gwWVhKblpYUXNJSEJ5YjNCT1lXMWxMQ0IyWVd4MVpTa2dQVDRnZTF4dUlDQWdJQ0FnSUNCcFppQW9jSEp2Y0U1aGJXVWdQVDA5SUVOUFRsUkZXRlJmU1VRcFhHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLSFJoY21kbGRGdHdjbTl3VG1GdFpWMGdQVDA5SUhaaGJIVmxLVnh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ0lDQWdJRzE1UTI5dWRHVjRkRWxFSUQwZ0t5dGZZMjl1ZEdWNGRFbEVRMjkxYm5SbGNqdGNiaUFnSUNBZ0lDQWdkR0Z5WjJWMFczQnliM0JPWVcxbFhTQTlJSFpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoMGVYQmxiMllnYjI1VmNHUmhkR1VnUFQwOUlDZG1kVzVqZEdsdmJpY3BYRzRnSUNBZ0lDQWdJQ0FnYjI1VmNHUmhkR1V1WTJGc2JDaHZibFZ3WkdGMFpWUm9hWE1zSUc5dVZYQmtZWFJsVkdocGN5azdYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUgwcE8xeHVJQ0I5WEc1OVhHNGlMQ0pjYm1OdmJuTjBJRlJaVUVWZlJVeEZUVVZPVkNBZ1BTQXhPMXh1WTI5dWMzUWdWRmxRUlY5VVJWaFVJQ0FnSUNBOUlETTdYRzVqYjI1emRDQlVXVkJGWDBOUFRVMUZUbFFnSUQwZ09EdGNibU52Ym5OMElGUlpVRVZmVUU5U1ZFRk1JQ0FnUFNBeE5UdGNibHh1Wlhod2IzSjBJR05zWVhOeklGSnZiM1JGYkdWdFpXNTBJSHRjYmlBZ2MzUmhkR2xqSUZSWlVFVmZSVXhGVFVWT1ZDQWdQU0JVV1ZCRlgwVk1SVTFGVGxRN1hHNWNiaUFnYzNSaGRHbGpJRlJaVUVWZlZFVllWQ0FnSUNBZ1BTQlVXVkJGWDFSRldGUTdYRzVjYmlBZ2MzUmhkR2xqSUZSWlVFVmZRMDlOVFVWT1ZDQWdQU0JVV1ZCRlgwTlBUVTFGVGxRN1hHNWNiaUFnYzNSaGRHbGpJRlJaVUVWZlVFOVNWRUZNSUNBZ1BTQlVXVkJGWDFCUFVsUkJURHRjYmx4dUlDQmpiMjV6ZEhKMVkzUnZjaWgwZVhCbExDQnBaQ3dnZG1Gc2RXVXNJSEJ5YjNCektTQjdYRzRnSUNBZ2RHaHBjeTVwYzBwcFluTldhWEowZFdGc1JXeGxiV1Z1ZENBOUlIUnlkV1U3WEc0Z0lDQWdkR2hwY3k1MGVYQmxJQ0FnUFNCMGVYQmxPMXh1SUNBZ0lIUm9hWE11YVdRZ0lDQWdJRDBnYVdRN1hHNGdJQ0FnZEdocGN5NTJZV3gxWlNBZ1BTQjJZV3gxWlR0Y2JpQWdJQ0IwYUdsekxuQnliM0J6SUNBOUlIQnliM0J6SUh4OElIdDlPMXh1SUNCOVhHNTlYRzRpTENKcGJYQnZjblFnS2lCaGN5QlZkR2xzY3lCbWNtOXRJQ2N1TGk5MWRHbHNjeTVxY3ljN1hHNWNibVY0Y0c5eWRDQmpiMjV6ZENCRFQwNVVSVmhVWDBsRUlEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTXZibTlrWlM5amIyNTBaWGgwU1VRbktUdGNibHh1YkdWMElIVjFhV1FnUFNBeE8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1VtOXZkRTV2WkdVZ2UxeHVJQ0J6ZEdGMGFXTWdRMDlPVkVWWVZGOUpSQ0E5SUVOUFRsUkZXRlJmU1VRN1hHNWNiaUFnWTI5dWMzUnlkV04wYjNJb2NtVnVaR1Z5WlhJc0lIQmhjbVZ1ZEN3Z1gyTnZiblJsZUhRcElIdGNiaUFnSUNCc1pYUWdZMjl1ZEdWNGRDQTlJSEpsYm1SbGNtVnlMbU55WldGMFpVTnZiblJsZUhRb1hHNGdJQ0FnSUNCZlkyOXVkR1Y0ZEN4Y2JpQWdJQ0FnSUNoMGFHbHpMbTl1UTI5dWRHVjRkRlZ3WkdGMFpTa2dQeUIwYUdsekxtOXVRMjl1ZEdWNGRGVndaR0YwWlNBNklIVnVaR1ZtYVc1bFpDeGNiaUFnSUNBZ0lIUm9hWE1zWEc0Z0lDQWdLVHRjYmx4dUlDQWdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowYVdWektIUm9hWE1zSUh0Y2JpQWdJQ0FnSUNkcFpDYzZJSHRjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQjFkV2xrS3lzc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0ozSmxibVJsY21WeUp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCeVpXNWtaWEpsY2l4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmNHRnlaVzUwSnpvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J3WVhKbGJuUXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMk52Ym5SbGVIUW5PaUI3WEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdaMlYwT2lBZ0lDQWdJQ0FnSUNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUdOdmJuUmxlSFE3WEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lITmxkRG9nSUNBZ0lDQWdJQ0FnS0NrZ1BUNGdlMzBzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSjNKbGJtUmxjbEJ5YjIxcGMyVW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lHNTFiR3dzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSjJSbGMzUnliM2xwYm1jbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUdaaGJITmxMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ2R5Wlc1a1pYSkdjbUZ0WlNjNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnTUN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnZlNrN1hHNGdJSDFjYmx4dUlDQmtaWE4wY205NUtDa2dlMXh1SUNBZ0lIUm9hWE11WkdWemRISnZlV2x1WnlBOUlIUnlkV1U3WEc0Z0lDQWdkR2hwY3k1amIyNTBaWGgwSUQwZ2JuVnNiRHRjYmlBZ2ZWeHVYRzRnSUdselZtRnNhV1JEYUdsc1pDaGphR2xzWkNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJWZEdsc2N5NXBjMVpoYkdsa1EyaHBiR1FvWTJocGJHUXBPMXh1SUNCOVhHNWNiaUFnYVhOSmRHVnlZV0pzWlVOb2FXeGtLR05vYVd4a0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUZWMGFXeHpMbWx6U1hSbGNtRmliR1ZEYUdsc1pDaGphR2xzWkNrN1hHNGdJSDFjYmx4dUlDQndjbTl3YzBScFptWmxjaWh2YkdSUWNtOXdjeXdnYm1WM1VISnZjSE1zSUhOcmFYQkxaWGx6S1NCN1hHNGdJQ0FnY21WMGRYSnVJRlYwYVd4ekxuQnliM0J6UkdsbVptVnlLRzlzWkZCeWIzQnpMQ0J1WlhkUWNtOXdjeXdnYzJ0cGNFdGxlWE1wTzF4dUlDQjlYRzVjYmlBZ1kyaHBiR1J5Wlc1RWFXWm1aWElvYjJ4a1EyaHBiR1J5Wlc0c0lHNWxkME5vYVd4a2NtVnVLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGVjBhV3h6TG1Ob2FXeGtjbVZ1UkdsbVptVnlLRzlzWkVOb2FXeGtjbVZ1TENCdVpYZERhR2xzWkhKbGJpazdYRzRnSUgxY2JseHVJQ0JoYzNsdVl5QnlaVzVrWlhJb2FtbGlMQ0J5Wlc1a1pYSkRiMjUwWlhoMEtTQjdYRzRnSUNBZ2FXWWdLSFJvYVhNdVpHVnpkSEp2ZVdsdVp5bGNiaUFnSUNBZ0lISmxkSFZ5Ymp0Y2JseHVJQ0FnSUhSb2FYTXVjbVZ1WkdWeVJuSmhiV1VyS3p0Y2JseHVJQ0FnSUhKbGRIVnliaUIwYUdsekxsOXlaVzVrWlhJb2FtbGlMQ0J5Wlc1a1pYSkRiMjUwWlhoMEtWeHVJQ0FnSUNBZ0xuUm9aVzRvS0hKbGMzVnNkQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJtUmxjbEJ5YjIxcGMyVWdQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2NtVnpkV3gwTzF4dUlDQWdJQ0FnZlNsY2JpQWdJQ0FnSUM1allYUmphQ2dvWlhKeWIzSXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTV5Wlc1a1pYSlFjbTl0YVhObElEMGdiblZzYkR0Y2JpQWdJQ0FnSUNBZ2RHaHliM2NnWlhKeWIzSTdYRzRnSUNBZ0lDQjlLVHRjYmlBZ2ZWeHVmVnh1SWl3aWFXMXdiM0owSUhzZ1VtOXZkRVZzWlcxbGJuUWdmU0JtY205dElDY3VMM0p2YjNRdFpXeGxiV1Z1ZEM1cWN5YzdYRzVjYm1WNGNHOXlkQ0JqYkdGemN5QlVaWGgwUld4bGJXVnVkQ0JsZUhSbGJtUnpJRkp2YjNSRmJHVnRaVzUwSUh0Y2JpQWdjM1JoZEdsaklGUlpVRVVnUFNCU2IyOTBSV3hsYldWdWRDNVVXVkJGWDFSRldGUTdYRzVjYmlBZ1kyOXVjM1J5ZFdOMGIzSW9hV1FzSUhaaGJIVmxMQ0J3Y205d2N5a2dlMXh1SUNBZ0lITjFjR1Z5S0ZKdmIzUkZiR1Z0Wlc1MExsUlpVRVZmVkVWWVZDd2dhV1FzSUhaaGJIVmxMQ0J3Y205d2N5azdYRzRnSUgxY2JuMWNiaUlzSW1sdGNHOXlkQ0JrWldGa1ltVmxaaUJtY205dElDZGtaV0ZrWW1WbFppYzdYRzVjYm1OdmJuTjBJRk5VVDFBZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWMwbDBaWEpoZEdWVGRHOXdKeWs3WEc1Y2JpOHZJR1Z6YkdsdWRDMWthWE5oWW14bExXNWxlSFF0YkdsdVpTQnVieTF1WlhOMFpXUXRkR1Z5Ym1GeWVWeHVZMjl1YzNRZ1oyeHZZbUZzVTJOdmNHVWdQU0FvZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnSjNWdVpHVm1hVzVsWkNjcElEOGdaMnh2WW1Gc0lEb2dLSFI1Y0dWdlppQjNhVzVrYjNjZ0lUMDlJQ2QxYm1SbFptbHVaV1FuS1NBL0lIZHBibVJ2ZHlBNklIUm9hWE03WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCcGJuTjBZVzVqWlU5bUtHOWlhaWtnZTF4dUlDQm1kVzVqZEdsdmJpQjBaWE4wVkhsd1pTaHZZbW9zSUY5MllXd3BJSHRjYmlBZ0lDQm1kVzVqZEdsdmJpQnBjMFJsWm1WeWNtVmtWSGx3WlNodlltb3BJSHRjYmlBZ0lDQWdJR2xtSUNodlltb2dhVzV6ZEdGdVkyVnZaaUJRY205dGFYTmxJSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkUWNtOXRhWE5sSnlrcFhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdJQ0F2THlCUmRXRmpheUJ4ZFdGamF5NHVMbHh1SUNBZ0lDQWdhV1lnS0hSNWNHVnZaaUJ2WW1vdWRHaGxiaUE5UFQwZ0oyWjFibU4wYVc5dUp5QW1KaUIwZVhCbGIyWWdiMkpxTG1OaGRHTm9JRDA5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUd4bGRDQjJZV3dnSUNBZ0lEMGdYM1poYkR0Y2JpQWdJQ0JzWlhRZ2RIbHdaVTltSUNBOUlDaDBlWEJsYjJZZ2IySnFLVHRjYmx4dUlDQWdJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExsTjBjbWx1WnlsY2JpQWdJQ0FnSUhaaGJDQTlJQ2R6ZEhKcGJtY25PMXh1SUNBZ0lHVnNjMlVnYVdZZ0tIWmhiQ0E5UFQwZ1oyeHZZbUZzVTJOdmNHVXVUblZ0WW1WeUtWeHVJQ0FnSUNBZ2RtRnNJRDBnSjI1MWJXSmxjaWM3WEc0Z0lDQWdaV3h6WlNCcFppQW9kbUZzSUQwOVBTQm5iRzlpWVd4VFkyOXdaUzVDYjI5c1pXRnVLVnh1SUNBZ0lDQWdkbUZzSUQwZ0oySnZiMnhsWVc0bk8xeHVJQ0FnSUdWc2MyVWdhV1lnS0haaGJDQTlQVDBnWjJ4dlltRnNVMk52Y0dVdVJuVnVZM1JwYjI0cFhHNGdJQ0FnSUNCMllXd2dQU0FuWm5WdVkzUnBiMjRuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1UVhKeVlYa3BYRzRnSUNBZ0lDQjJZV3dnUFNBbllYSnlZWGtuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VDJKcVpXTjBLVnh1SUNBZ0lDQWdkbUZzSUQwZ0oyOWlhbVZqZENjN1hHNGdJQ0FnWld4elpTQnBaaUFvZG1Gc0lEMDlQU0JuYkc5aVlXeFRZMjl3WlM1UWNtOXRhWE5sS1Z4dUlDQWdJQ0FnZG1Gc0lEMGdKM0J5YjIxcGMyVW5PMXh1SUNBZ0lHVnNjMlVnYVdZZ0tIWmhiQ0E5UFQwZ1oyeHZZbUZzVTJOdmNHVXVRbWxuU1c1MEtWeHVJQ0FnSUNBZ2RtRnNJRDBnSjJKcFoybHVkQ2M3WEc0Z0lDQWdaV3h6WlNCcFppQW9kbUZzSUQwOVBTQm5iRzlpWVd4VFkyOXdaUzVOWVhBcFhHNGdJQ0FnSUNCMllXd2dQU0FuYldGd0p6dGNiaUFnSUNCbGJITmxJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExsZGxZV3ROWVhBcFhHNGdJQ0FnSUNCMllXd2dQU0FuZDJWaGEyMWhjQ2M3WEc0Z0lDQWdaV3h6WlNCcFppQW9kbUZzSUQwOVBTQm5iRzlpWVd4VFkyOXdaUzVUWlhRcFhHNGdJQ0FnSUNCMllXd2dQU0FuYzJWMEp6dGNiaUFnSUNCbGJITmxJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExsTjViV0p2YkNsY2JpQWdJQ0FnSUhaaGJDQTlJQ2R6ZVcxaWIyd25PMXh1SUNBZ0lHVnNjMlVnYVdZZ0tIWmhiQ0E5UFQwZ1oyeHZZbUZzVTJOdmNHVXVRblZtWm1WeUtWeHVJQ0FnSUNBZ2RtRnNJRDBnSjJKMVptWmxjaWM3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNBblluVm1abVZ5SnlBbUppQm5iRzlpWVd4VFkyOXdaUzVDZFdabVpYSWdKaVlnWjJ4dlltRnNVMk52Y0dVdVFuVm1abVZ5TG1selFuVm1abVZ5S0c5aWFpa3BYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJR2xtSUNoMllXd2dQVDA5SUNkdWRXMWlaWEluSUNZbUlDaDBlWEJsVDJZZ1BUMDlJQ2R1ZFcxaVpYSW5JSHg4SUc5aWFpQnBibk4wWVc1alpXOW1JRTUxYldKbGNpQjhmQ0FvYjJKcUxtTnZibk4wY25WamRHOXlJQ1ltSUc5aWFpNWpiMjV6ZEhKMVkzUnZjaTV1WVcxbElEMDlQU0FuVG5WdFltVnlKeWtwS1NCN1hHNGdJQ0FnSUNCcFppQW9JV2x6Um1sdWFYUmxLRzlpYWlrcFhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0FoUFQwZ0oyOWlhbVZqZENjZ0ppWWdkbUZzSUQwOVBTQjBlWEJsVDJZcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lHbG1JQ2gyWVd3Z1BUMDlJQ2R2WW1wbFkzUW5LU0I3WEc0Z0lDQWdJQ0JwWmlBb0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBOVBUMGdUMkpxWldOMExuQnliM1J2ZEhsd1pTNWpiMjV6ZEhKMVkzUnZjaUI4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblQySnFaV04wSnlrcEtWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJQ0FnTHk4Z1RuVnNiQ0J3Y205MGIzUjVjR1VnYjI0Z2IySnFaV04wWEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVTltSUQwOVBTQW5iMkpxWldOMEp5QW1KaUFoYjJKcUxtTnZibk4wY25WamRHOXlLVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHbG1JQ2gyWVd3Z1BUMDlJQ2RoY25KaGVTY2dKaVlnS0VGeWNtRjVMbWx6UVhKeVlYa29iMkpxS1NCOGZDQnZZbW9nYVc1emRHRnVZMlZ2WmlCQmNuSmhlU0I4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblFYSnlZWGtuS1NrcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lHbG1JQ2dvZG1Gc0lEMDlQU0FuY0hKdmJXbHpaU2NnZkh3Z2RtRnNJRDA5UFNBblpHVm1aWEp5WldRbktTQW1KaUJwYzBSbFptVnljbVZrVkhsd1pTaHZZbW9wS1Z4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNCcFppQW9kbUZzSUQwOVBTQW5jM1J5YVc1bkp5QW1KaUFvYjJKcUlHbHVjM1JoYm1ObGIyWWdaMnh2WW1Gc1UyTnZjR1V1VTNSeWFXNW5JSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkVGRISnBibWNuS1NrcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lHbG1JQ2gyWVd3Z1BUMDlJQ2RpYjI5c1pXRnVKeUFtSmlBb2IySnFJR2x1YzNSaGJtTmxiMllnWjJ4dlltRnNVMk52Y0dVdVFtOXZiR1ZoYmlCOGZDQW9iMkpxTG1OdmJuTjBjblZqZEc5eUlDWW1JRzlpYWk1amIyNXpkSEoxWTNSdmNpNXVZVzFsSUQwOVBTQW5RbTl2YkdWaGJpY3BLU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0E5UFQwZ0oyMWhjQ2NnSmlZZ0tHOWlhaUJwYm5OMFlXNWpaVzltSUdkc2IySmhiRk5qYjNCbExrMWhjQ0I4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblRXRndKeWtwS1Z4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNCcFppQW9kbUZzSUQwOVBTQW5kMlZoYTIxaGNDY2dKaVlnS0c5aWFpQnBibk4wWVc1alpXOW1JR2RzYjJKaGJGTmpiM0JsTGxkbFlXdE5ZWEFnZkh3Z0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBbUppQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0oxZGxZV3ROWVhBbktTa3BYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJR2xtSUNoMllXd2dQVDA5SUNkelpYUW5JQ1ltSUNodlltb2dhVzV6ZEdGdVkyVnZaaUJuYkc5aVlXeFRZMjl3WlM1VFpYUWdmSHdnS0c5aWFpNWpiMjV6ZEhKMVkzUnZjaUFtSmlCdlltb3VZMjl1YzNSeWRXTjBiM0l1Ym1GdFpTQTlQVDBnSjFObGRDY3BLU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0E5UFQwZ0oyWjFibU4wYVc5dUp5QW1KaUIwZVhCbFQyWWdQVDA5SUNkbWRXNWpkR2x2YmljcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdkbUZzSUQwOVBTQW5ablZ1WTNScGIyNG5JQ1ltSUc5aWFpQnBibk4wWVc1alpXOW1JSFpoYkNsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFI1Y0dWdlppQjJZV3dnUFQwOUlDZHpkSEpwYm1jbklDWW1JRzlpYWk1amIyNXpkSEoxWTNSdmNpQW1KaUJ2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlNBOVBUMGdkbUZzS1Z4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzRnSUgxY2JseHVJQ0JwWmlBb2IySnFJRDA5SUc1MWJHd3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHWnZjaUFvZG1GeUlHa2dQU0F4TENCc1pXNGdQU0JoY21kMWJXVnVkSE11YkdWdVozUm9PeUJwSUR3Z2JHVnVPeUJwS3lzcElIdGNiaUFnSUNCcFppQW9kR1Z6ZEZSNWNHVW9iMkpxTENCaGNtZDFiV1Z1ZEhOYmFWMHBJRDA5UFNCMGNuVmxLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzU5WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCd2NtOXdjMFJwWm1abGNpaHZiR1JRY205d2N5d2dibVYzVUhKdmNITXNJSE5yYVhCTFpYbHpLU0I3WEc0Z0lHbG1JQ2h2YkdSUWNtOXdjeUE5UFQwZ2JtVjNVSEp2Y0hNcFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaDBlWEJsYjJZZ2IyeGtVSEp2Y0hNZ0lUMDlJSFI1Y0dWdlppQnVaWGRRY205d2N5bGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNCcFppQW9JVzlzWkZCeWIzQnpJQ1ltSUc1bGQxQnliM0J6S1Z4dUlDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJR2xtSUNodmJHUlFjbTl3Y3lBbUppQWhibVYzVUhKdmNITXBYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0x5OGdaWE5zYVc1MExXUnBjMkZpYkdVdGJtVjRkQzFzYVc1bElHVnhaWEZsY1Z4dUlDQnBaaUFvSVc5c1pGQnliM0J6SUNZbUlDRnVaWGRRY205d2N5QW1KaUJ2YkdSUWNtOXdjeUFoUFNCdmJHUlFjbTl3Y3lsY2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JzWlhRZ1lVdGxlWE1nUFNCUFltcGxZM1F1YTJWNWN5aHZiR1JRY205d2N5a3VZMjl1WTJGMEtFOWlhbVZqZEM1blpYUlBkMjVRY205d1pYSjBlVk41YldKdmJITW9iMnhrVUhKdmNITXBLVHRjYmlBZ2JHVjBJR0pMWlhseklEMGdUMkpxWldOMExtdGxlWE1vYm1WM1VISnZjSE1wTG1OdmJtTmhkQ2hQWW1wbFkzUXVaMlYwVDNkdVVISnZjR1Z5ZEhsVGVXMWliMnh6S0c1bGQxQnliM0J6S1NrN1hHNWNiaUFnYVdZZ0tHRkxaWGx6TG14bGJtZDBhQ0FoUFQwZ1lrdGxlWE11YkdWdVozUm9LVnh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJR0ZMWlhsekxteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BJSHRjYmlBZ0lDQnNaWFFnWVV0bGVTQTlJR0ZMWlhselcybGRPMXh1SUNBZ0lHbG1JQ2h6YTJsd1MyVjVjeUFtSmlCemEybHdTMlY1Y3k1cGJtUmxlRTltS0dGTFpYa3BJRDQ5SURBcFhHNGdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUdsbUlDaHZiR1JRY205d2MxdGhTMlY1WFNBaFBUMGdibVYzVUhKdmNITmJZVXRsZVYwcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lHeGxkQ0JpUzJWNUlEMGdZa3RsZVhOYmFWMDdYRzRnSUNBZ2FXWWdLSE5yYVhCTFpYbHpJQ1ltSUhOcmFYQkxaWGx6TG1sdVpHVjRUMllvWWt0bGVTa3BYRzRnSUNBZ0lDQmpiMjUwYVc1MVpUdGNibHh1SUNBZ0lHbG1JQ2hoUzJWNUlEMDlQU0JpUzJWNUtWeHVJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNWNiaUFnSUNCcFppQW9iMnhrVUhKdmNITmJZa3RsZVYwZ0lUMDlJRzVsZDFCeWIzQnpXMkpMWlhsZEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNTlYRzVjYm1WNGNHOXlkQ0JtZFc1amRHbHZiaUJ6YVhwbFQyWW9kbUZzZFdVcElIdGNiaUFnYVdZZ0tDRjJZV3gxWlNsY2JpQWdJQ0J5WlhSMWNtNGdNRHRjYmx4dUlDQnBaaUFvVDJKcVpXTjBMbWx6S0VsdVptbHVhWFI1S1NsY2JpQWdJQ0J5WlhSMWNtNGdNRHRjYmx4dUlDQnBaaUFvZEhsd1pXOW1JSFpoYkhWbExteGxibWQwYUNBOVBUMGdKMjUxYldKbGNpY3BYRzRnSUNBZ2NtVjBkWEp1SUhaaGJIVmxMbXhsYm1kMGFEdGNibHh1SUNCeVpYUjFjbTRnVDJKcVpXTjBMbXRsZVhNb2RtRnNkV1VwTG14bGJtZDBhRHRjYm4xY2JseHVablZ1WTNScGIyNGdYMmwwWlhKaGRHVW9iMkpxTENCallXeHNZbUZqYXlrZ2UxeHVJQ0JwWmlBb0lXOWlhaUI4ZkNCUFltcGxZM1F1YVhNb1NXNW1hVzVwZEhrcEtWeHVJQ0FnSUhKbGRIVnliaUJiWFR0Y2JseHVJQ0JzWlhRZ2NtVnpkV3gwY3lBZ0lEMGdXMTA3WEc0Z0lHeGxkQ0J6WTI5d1pTQWdJQ0FnUFNCN0lHTnZiR3hsWTNScGIyNDZJRzlpYWl3Z1UxUlBVQ0I5TzF4dUlDQnNaWFFnY21WemRXeDBPMXh1WEc0Z0lHbG1JQ2hCY25KaGVTNXBjMEZ5Y21GNUtHOWlhaWtwSUh0Y2JpQWdJQ0J6WTI5d1pTNTBlWEJsSUQwZ0owRnljbUY1Snp0Y2JseHVJQ0FnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlHOWlhaTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1NCN1hHNGdJQ0FnSUNCelkyOXdaUzUyWVd4MVpTQTlJRzlpYWx0cFhUdGNiaUFnSUNBZ0lITmpiM0JsTG1sdVpHVjRJRDBnYzJOdmNHVXVhMlY1SUQwZ2FUdGNibHh1SUNBZ0lDQWdjbVZ6ZFd4MElEMGdZMkZzYkdKaFkyc3VZMkZzYkNoMGFHbHpMQ0J6WTI5d1pTazdYRzRnSUNBZ0lDQnBaaUFvY21WemRXeDBJRDA5UFNCVFZFOVFLVnh1SUNBZ0lDQWdJQ0JpY21WaGF6dGNibHh1SUNBZ0lDQWdjbVZ6ZFd4MGN5NXdkWE5vS0hKbGMzVnNkQ2s3WEc0Z0lDQWdmVnh1SUNCOUlHVnNjMlVnYVdZZ0tIUjVjR1Z2WmlCdlltb3VaVzUwY21sbGN5QTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUdsbUlDaHZZbW9nYVc1emRHRnVZMlZ2WmlCVFpYUWdmSHdnYjJKcUxtTnZibk4wY25WamRHOXlMbTVoYldVZ1BUMDlJQ2RUWlhRbktTQjdYRzRnSUNBZ0lDQnpZMjl3WlM1MGVYQmxJRDBnSjFObGRDYzdYRzVjYmlBZ0lDQWdJR3hsZENCcGJtUmxlQ0E5SURBN1hHNGdJQ0FnSUNCbWIzSWdLR3hsZENCcGRHVnRJRzltSUc5aWFpNTJZV3gxWlhNb0tTa2dlMXh1SUNBZ0lDQWdJQ0J6WTI5d1pTNTJZV3gxWlNBOUlHbDBaVzA3WEc0Z0lDQWdJQ0FnSUhOamIzQmxMbXRsZVNBOUlHbDBaVzA3WEc0Z0lDQWdJQ0FnSUhOamIzQmxMbWx1WkdWNElEMGdhVzVrWlhnckt6dGNibHh1SUNBZ0lDQWdJQ0J5WlhOMWJIUWdQU0JqWVd4c1ltRmpheTVqWVd4c0tIUm9hWE1zSUhOamIzQmxLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tISmxjM1ZzZENBOVBUMGdVMVJQVUNsY2JpQWdJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JseHVJQ0FnSUNBZ0lDQnlaWE4xYkhSekxuQjFjMmdvY21WemRXeDBLVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ2MyTnZjR1V1ZEhsd1pTQTlJRzlpYWk1amIyNXpkSEoxWTNSdmNpNXVZVzFsTzF4dVhHNGdJQ0FnSUNCc1pYUWdhVzVrWlhnZ1BTQXdPMXh1SUNBZ0lDQWdabTl5SUNoc1pYUWdXeUJyWlhrc0lIWmhiSFZsSUYwZ2IyWWdiMkpxTG1WdWRISnBaWE1vS1NrZ2UxeHVJQ0FnSUNBZ0lDQnpZMjl3WlM1MllXeDFaU0E5SUhaaGJIVmxPMXh1SUNBZ0lDQWdJQ0J6WTI5d1pTNXJaWGtnUFNCclpYazdYRzRnSUNBZ0lDQWdJSE5qYjNCbExtbHVaR1Y0SUQwZ2FXNWtaWGdyS3p0Y2JseHVJQ0FnSUNBZ0lDQnlaWE4xYkhRZ1BTQmpZV3hzWW1GamF5NWpZV3hzS0hSb2FYTXNJSE5qYjNCbEtUdGNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ1UxUlBVQ2xjYmlBZ0lDQWdJQ0FnSUNCaWNtVmhhenRjYmx4dUlDQWdJQ0FnSUNCeVpYTjFiSFJ6TG5CMWMyZ29jbVZ6ZFd4MEtUdGNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNGdJSDBnWld4elpTQjdYRzRnSUNBZ2FXWWdLR2x1YzNSaGJtTmxUMllvYjJKcUxDQW5ZbTl2YkdWaGJpY3NJQ2R1ZFcxaVpYSW5MQ0FuWW1sbmFXNTBKeXdnSjJaMWJtTjBhVzl1SnlrcFhHNGdJQ0FnSUNCeVpYUjFjbTQ3WEc1Y2JpQWdJQ0J6WTI5d1pTNTBlWEJsSUQwZ0tHOWlhaTVqYjI1emRISjFZM1J2Y2lrZ1B5QnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E2SUNkUFltcGxZM1FuTzF4dVhHNGdJQ0FnYkdWMElHdGxlWE1nUFNCUFltcGxZM1F1YTJWNWN5aHZZbW9wTzF4dUlDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUd0bGVYTXViR1Z1WjNSb095QnBJRHdnYVd3N0lHa3JLeWtnZTF4dUlDQWdJQ0FnYkdWMElHdGxlU0FnSUQwZ2EyVjVjMXRwWFR0Y2JpQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlHOWlhbHRyWlhsZE8xeHVYRzRnSUNBZ0lDQnpZMjl3WlM1MllXeDFaU0E5SUhaaGJIVmxPMXh1SUNBZ0lDQWdjMk52Y0dVdWEyVjVJRDBnYTJWNU8xeHVJQ0FnSUNBZ2MyTnZjR1V1YVc1a1pYZ2dQU0JwTzF4dVhHNGdJQ0FnSUNCeVpYTjFiSFFnUFNCallXeHNZbUZqYXk1allXeHNLSFJvYVhNc0lITmpiM0JsS1R0Y2JpQWdJQ0FnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJRk5VVDFBcFhHNGdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dVhHNGdJQ0FnSUNCeVpYTjFiSFJ6TG5CMWMyZ29jbVZ6ZFd4MEtUdGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2NtVnpkV3gwY3p0Y2JuMWNibHh1VDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9YMmwwWlhKaGRHVXNJSHRjYmlBZ0oxTlVUMUFuT2lCN1hHNGdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCVFZFOVFMRnh1SUNCOUxGeHVmU2s3WEc1Y2JtVjRjRzl5ZENCamIyNXpkQ0JwZEdWeVlYUmxJRDBnWDJsMFpYSmhkR1U3WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCamFHbHNaSEpsYmtScFptWmxjaWhmWTJocGJHUnlaVzR4TENCZlkyaHBiR1J5Wlc0eUtTQjdYRzRnSUd4bGRDQmphR2xzWkhKbGJqRWdQU0FvSVVGeWNtRjVMbWx6UVhKeVlYa29YMk5vYVd4a2NtVnVNU2twSUQ4Z1d5QmZZMmhwYkdSeVpXNHhJRjBnT2lCZlkyaHBiR1J5Wlc0eE8xeHVJQ0JzWlhRZ1kyaHBiR1J5Wlc0eUlEMGdLQ0ZCY25KaGVTNXBjMEZ5Y21GNUtGOWphR2xzWkhKbGJqSXBLU0EvSUZzZ1gyTm9hV3hrY21WdU1pQmRJRG9nWDJOb2FXeGtjbVZ1TWp0Y2JseHVJQ0J5WlhSMWNtNGdLR1JsWVdSaVpXVm1LQzR1TG1Ob2FXeGtjbVZ1TVNrZ0lUMDlJR1JsWVdSaVpXVm1LQzR1TG1Ob2FXeGtjbVZ1TWlrcE8xeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWm1WMFkyaEVaV1Z3VUhKdmNHVnlkSGtvYjJKcUxDQmZhMlY1TENCa1pXWmhkV3gwVm1Gc2RXVXNJR3hoYzNSUVlYSjBLU0I3WEc0Z0lHbG1JQ2h2WW1vZ1BUMGdiblZzYkNCOGZDQlBZbXBsWTNRdWFYTW9UbUZPTENCdlltb3BJSHg4SUU5aWFtVmpkQzVwY3loSmJtWnBibWwwZVN3Z2IySnFLU2xjYmlBZ0lDQnlaWFIxY200Z0tHeGhjM1JRWVhKMEtTQS9JRnNnWkdWbVlYVnNkRlpoYkhWbExDQnVkV3hzSUYwZ09pQmtaV1poZFd4MFZtRnNkV1U3WEc1Y2JpQWdhV1lnS0Y5clpYa2dQVDBnYm5Wc2JDQjhmQ0JQWW1wbFkzUXVhWE1vVG1GT0xDQmZhMlY1S1NCOGZDQlBZbXBsWTNRdWFYTW9TVzVtYVc1cGRIa3NJRjlyWlhrcEtWeHVJQ0FnSUhKbGRIVnliaUFvYkdGemRGQmhjblFwSUQ4Z1d5QmtaV1poZFd4MFZtRnNkV1VzSUc1MWJHd2dYU0E2SUdSbFptRjFiSFJXWVd4MVpUdGNibHh1SUNCc1pYUWdjR0Z5ZEhNN1hHNWNiaUFnYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvWDJ0bGVTa3BJSHRjYmlBZ0lDQndZWEowY3lBOUlGOXJaWGs3WEc0Z0lIMGdaV3h6WlNCcFppQW9kSGx3Wlc5bUlGOXJaWGtnUFQwOUlDZHplVzFpYjJ3bktTQjdYRzRnSUNBZ2NHRnlkSE1nUFNCYklGOXJaWGtnWFR0Y2JpQWdmU0JsYkhObElIdGNiaUFnSUNCc1pYUWdhMlY1SUNBZ0lDQWdJQ0FnUFNBb0p5Y2dLeUJmYTJWNUtUdGNiaUFnSUNCc1pYUWdiR0Z6ZEVsdVpHVjRJQ0FnUFNBd08xeHVJQ0FnSUd4bGRDQnNZWE4wUTNWeWMyOXlJQ0E5SURBN1hHNWNiaUFnSUNCd1lYSjBjeUE5SUZ0ZE8xeHVYRzRnSUNBZ0x5OGdaWE5zYVc1MExXUnBjMkZpYkdVdGJtVjRkQzFzYVc1bElHNXZMV052Ym5OMFlXNTBMV052Ym1ScGRHbHZibHh1SUNBZ0lIZG9hV3hsSUNoMGNuVmxLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2FXNWtaWGdnUFNCclpYa3VhVzVrWlhoUFppZ25MaWNzSUd4aGMzUkpibVJsZUNrN1hHNGdJQ0FnSUNCcFppQW9hVzVrWlhnZ1BDQXdLU0I3WEc0Z0lDQWdJQ0FnSUhCaGNuUnpMbkIxYzJnb2EyVjVMbk4xWW5OMGNtbHVaeWhzWVhOMFEzVnljMjl5S1NrN1hHNGdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCcFppQW9hMlY1TG1Ob1lYSkJkQ2hwYm1SbGVDQXRJREVwSUQwOVBTQW5YRnhjWENjcElIdGNiaUFnSUNBZ0lDQWdiR0Z6ZEVsdVpHVjRJRDBnYVc1a1pYZ2dLeUF4TzF4dUlDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NHRnlkSE11Y0hWemFDaHJaWGt1YzNWaWMzUnlhVzVuS0d4aGMzUkRkWEp6YjNJc0lHbHVaR1Y0S1NrN1hHNGdJQ0FnSUNCc1lYTjBRM1Z5YzI5eUlEMGdiR0Z6ZEVsdVpHVjRJRDBnYVc1a1pYZ2dLeUF4TzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUd4bGRDQndZWEowVGlBOUlIQmhjblJ6VzNCaGNuUnpMbXhsYm1kMGFDQXRJREZkTzF4dUlDQnBaaUFvY0dGeWRITXViR1Z1WjNSb0lEMDlQU0F3S1Z4dUlDQWdJSEpsZEhWeWJpQW9iR0Z6ZEZCaGNuUXBJRDhnV3lCa1pXWmhkV3gwVm1Gc2RXVXNJSEJoY25ST0lGMGdPaUJrWldaaGRXeDBWbUZzZFdVN1hHNWNiaUFnYkdWMElHTjFjbkpsYm5SV1lXeDFaU0E5SUc5aWFqdGNiaUFnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2NHRnlkSE11YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUd4bGRDQnJaWGtnUFNCd1lYSjBjMXRwWFR0Y2JseHVJQ0FnSUdOMWNuSmxiblJXWVd4MVpTQTlJR04xY25KbGJuUldZV3gxWlZ0clpYbGRPMXh1SUNBZ0lHbG1JQ2hqZFhKeVpXNTBWbUZzZFdVZ1BUMGdiblZzYkNsY2JpQWdJQ0FnSUhKbGRIVnliaUFvYkdGemRGQmhjblFwSUQ4Z1d5QmtaV1poZFd4MFZtRnNkV1VzSUhCaGNuUk9JRjBnT2lCa1pXWmhkV3gwVm1Gc2RXVTdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdLR3hoYzNSUVlYSjBLU0EvSUZzZ1kzVnljbVZ1ZEZaaGJIVmxMQ0J3WVhKMFRpQmRJRG9nWTNWeWNtVnVkRlpoYkhWbE8xeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWW1sdVpFMWxkR2h2WkhNb1gzQnliM1J2TENCemEybHdVSEp2ZEc5ektTQjdYRzRnSUd4bGRDQndjbTkwYnlBZ0lDQWdJQ0FnSUNBZ1BTQmZjSEp2ZEc4N1hHNGdJR3hsZENCaGJISmxZV1I1Vm1semFYUmxaQ0FnUFNCdVpYY2dVMlYwS0NrN1hHNWNiaUFnZDJocGJHVWdLSEJ5YjNSdktTQjdYRzRnSUNBZ2JHVjBJR1JsYzJOeWFYQjBiM0p6SUQwZ1QySnFaV04wTG1kbGRFOTNibEJ5YjNCbGNuUjVSR1Z6WTNKcGNIUnZjbk1vY0hKdmRHOHBPMXh1SUNBZ0lHeGxkQ0JyWlhseklDQWdJQ0FnSUNBOUlFOWlhbVZqZEM1clpYbHpLR1JsYzJOeWFYQjBiM0p6S1M1amIyNWpZWFFvVDJKcVpXTjBMbWRsZEU5M2JsQnliM0JsY25SNVUzbHRZbTlzY3loa1pYTmpjbWx3ZEc5eWN5a3BPMXh1WEc0Z0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2EyVjVJRDBnYTJWNWMxdHBYVHRjYmlBZ0lDQWdJR2xtSUNoclpYa2dQVDA5SUNkamIyNXpkSEoxWTNSdmNpY3BYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdJQ0JwWmlBb1lXeHlaV0ZrZVZacGMybDBaV1F1YUdGektHdGxlU2twWEc0Z0lDQWdJQ0FnSUdOdmJuUnBiblZsTzF4dVhHNGdJQ0FnSUNCaGJISmxZV1I1Vm1semFYUmxaQzVoWkdRb2EyVjVLVHRjYmx4dUlDQWdJQ0FnYkdWMElIWmhiSFZsSUQwZ2NISnZkRzliYTJWNVhUdGNibHh1SUNBZ0lDQWdMeThnVTJ0cGNDQndjbTkwYjNSNWNHVWdiMllnVDJKcVpXTjBYRzRnSUNBZ0lDQXZMeUJsYzJ4cGJuUXRaR2x6WVdKc1pTMXVaWGgwTFd4cGJtVWdibTh0Y0hKdmRHOTBlWEJsTFdKMWFXeDBhVzV6WEc0Z0lDQWdJQ0JwWmlBb1QySnFaV04wTG5CeWIzUnZkSGx3WlM1b1lYTlBkMjVRY205d1pYSjBlU2hyWlhrcElDWW1JRTlpYW1WamRDNXdjbTkwYjNSNWNHVmJhMlY1WFNBOVBUMGdkbUZzZFdVcFhHNGdJQ0FnSUNBZ0lHTnZiblJwYm5WbE8xeHVYRzRnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JSFpoYkhWbElDRTlQU0FuWm5WdVkzUnBiMjRuS1Z4dUlDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUNBZ2RHaHBjMXRyWlhsZElEMGdkbUZzZFdVdVltbHVaQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCd2NtOTBieUE5SUU5aWFtVmpkQzVuWlhSUWNtOTBiM1I1Y0dWUFppaHdjbTkwYnlrN1hHNGdJQ0FnYVdZZ0tIQnliM1J2SUQwOVBTQlBZbXBsWTNRdWNISnZkRzkwZVhCbEtWeHVJQ0FnSUNBZ1luSmxZV3M3WEc1Y2JpQWdJQ0JwWmlBb2MydHBjRkJ5YjNSdmN5QW1KaUJ6YTJsd1VISnZkRzl6TG1sdVpHVjRUMllvY0hKdmRHOHBJRDQ5SURBcFhHNGdJQ0FnSUNCaWNtVmhhenRjYmlBZ2ZWeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnYVhORmJYQjBlU2gyWVd4MVpTa2dlMXh1SUNCcFppQW9kbUZzZFdVZ1BUMGdiblZzYkNsY2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JwWmlBb1QySnFaV04wTG1sektIWmhiSFZsTENCSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaFBZbXBsWTNRdWFYTW9kbUZzZFdVc0lFNWhUaWtwWEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdhV1lnS0dsdWMzUmhibU5sVDJZb2RtRnNkV1VzSUNkemRISnBibWNuS1NsY2JpQWdJQ0J5WlhSMWNtNGdJU2d2WEZ4VEx5a3VkR1Z6ZENoMllXeDFaU2s3WEc0Z0lHVnNjMlVnYVdZZ0tHbHVjM1JoYm1ObFQyWW9kbUZzZFdVc0lDZHVkVzFpWlhJbktTQW1KaUJwYzBacGJtbDBaU2gyWVd4MVpTa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNCbGJITmxJR2xtSUNnaGFXNXpkR0Z1WTJWUFppaDJZV3gxWlN3Z0oySnZiMnhsWVc0bkxDQW5ZbWxuYVc1MEp5d2dKMloxYm1OMGFXOXVKeWtnSmlZZ2MybDZaVTltS0haaGJIVmxLU0E5UFQwZ01DbGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzU5WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCcGMwNXZkRVZ0Y0hSNUtIWmhiSFZsS1NCN1hHNGdJSEpsZEhWeWJpQWhhWE5GYlhCMGVTNWpZV3hzS0hSb2FYTXNJSFpoYkhWbEtUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdac1lYUjBaVzVCY25KaGVTaDJZV3gxWlNrZ2UxeHVJQ0JwWmlBb0lVRnljbUY1TG1selFYSnlZWGtvZG1Gc2RXVXBLVnh1SUNBZ0lISmxkSFZ5YmlCMllXeDFaVHRjYmx4dUlDQnNaWFFnYm1WM1FYSnlZWGtnUFNCYlhUdGNiaUFnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2RtRnNkV1V1YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUd4bGRDQnBkR1Z0SUQwZ2RtRnNkV1ZiYVYwN1hHNGdJQ0FnYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvYVhSbGJTa3BYRzRnSUNBZ0lDQnVaWGRCY25KaGVTQTlJRzVsZDBGeWNtRjVMbU52Ym1OaGRDaG1iR0YwZEdWdVFYSnlZWGtvYVhSbGJTa3BPMXh1SUNBZ0lHVnNjMlZjYmlBZ0lDQWdJRzVsZDBGeWNtRjVMbkIxYzJnb2FYUmxiU2s3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnYm1WM1FYSnlZWGs3WEc1OVhHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnBjMVpoYkdsa1EyaHBiR1FvWTJocGJHUXBJSHRjYmlBZ2FXWWdLR05vYVd4a0lEMDlJRzUxYkd3cFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaDBlWEJsYjJZZ1kyaHBiR1FnUFQwOUlDZGliMjlzWldGdUp5bGNiaUFnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ2FXWWdLRTlpYW1WamRDNXBjeWhqYUdsc1pDd2dTVzVtYVc1cGRIa3BLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQnBaaUFvVDJKcVpXTjBMbWx6S0dOb2FXeGtMQ0JPWVU0cEtWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCeVpYUjFjbTRnZEhKMVpUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdselNYUmxjbUZpYkdWRGFHbHNaQ2hqYUdsc1pDa2dlMXh1SUNCcFppQW9ZMmhwYkdRZ1BUMGdiblZzYkNCOGZDQlBZbXBsWTNRdWFYTW9ZMmhwYkdRc0lFNWhUaWtnZkh3Z1QySnFaV04wTG1sektHTm9hV3hrTENCSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUhKbGRIVnliaUFvUVhKeVlYa3VhWE5CY25KaGVTaGphR2xzWkNrZ2ZId2dkSGx3Wlc5bUlHTm9hV3hrSUQwOVBTQW5iMkpxWldOMEp5QW1KaUFoYVc1emRHRnVZMlZQWmloamFHbHNaQ3dnSjJKdmIyeGxZVzRuTENBbmJuVnRZbVZ5Snl3Z0ozTjBjbWx1WnljcEtUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUc1dmR5Z3BJSHRjYmlBZ2FXWWdLSFI1Y0dWdlppQndaWEptYjNKdFlXNWpaU0FoUFQwZ0ozVnVaR1ZtYVc1bFpDY2dKaVlnZEhsd1pXOW1JSEJsY21admNtMWhibU5sTG01dmR5QTlQVDBnSjJaMWJtTjBhVzl1SnlsY2JpQWdJQ0J5WlhSMWNtNGdjR1Z5Wm05eWJXRnVZMlV1Ym05M0tDazdYRzRnSUdWc2MyVmNiaUFnSUNCeVpYUjFjbTRnUkdGMFpTNXViM2NvS1R0Y2JuMWNiaUlzSWk4dklGUm9aU0J0YjJSMWJHVWdZMkZqYUdWY2JuWmhjaUJmWDNkbFluQmhZMnRmYlc5a2RXeGxYMk5oWTJobFgxOGdQU0I3ZlR0Y2JseHVMeThnVkdobElISmxjWFZwY21VZ1puVnVZM1JwYjI1Y2JtWjFibU4wYVc5dUlGOWZkMlZpY0dGamExOXlaWEYxYVhKbFgxOG9iVzlrZFd4bFNXUXBJSHRjYmx4MEx5OGdRMmhsWTJzZ2FXWWdiVzlrZFd4bElHbHpJR2x1SUdOaFkyaGxYRzVjZEhaaGNpQmpZV05vWldSTmIyUjFiR1VnUFNCZlgzZGxZbkJoWTJ0ZmJXOWtkV3hsWDJOaFkyaGxYMTliYlc5a2RXeGxTV1JkTzF4dVhIUnBaaUFvWTJGamFHVmtUVzlrZFd4bElDRTlQU0IxYm1SbFptbHVaV1FwSUh0Y2JseDBYSFJ5WlhSMWNtNGdZMkZqYUdWa1RXOWtkV3hsTG1WNGNHOXlkSE03WEc1Y2RIMWNibHgwTHk4Z1EzSmxZWFJsSUdFZ2JtVjNJRzF2WkhWc1pTQW9ZVzVrSUhCMWRDQnBkQ0JwYm5SdklIUm9aU0JqWVdOb1pTbGNibHgwZG1GeUlHMXZaSFZzWlNBOUlGOWZkMlZpY0dGamExOXRiMlIxYkdWZlkyRmphR1ZmWDF0dGIyUjFiR1ZKWkYwZ1BTQjdYRzVjZEZ4MEx5OGdibThnYlc5a2RXeGxMbWxrSUc1bFpXUmxaRnh1WEhSY2RDOHZJRzV2SUcxdlpIVnNaUzVzYjJGa1pXUWdibVZsWkdWa1hHNWNkRngwWlhod2IzSjBjem9nZTMxY2JseDBmVHRjYmx4dVhIUXZMeUJGZUdWamRYUmxJSFJvWlNCdGIyUjFiR1VnWm5WdVkzUnBiMjVjYmx4MFgxOTNaV0p3WVdOclgyMXZaSFZzWlhOZlgxdHRiMlIxYkdWSlpGMHVZMkZzYkNodGIyUjFiR1V1Wlhod2IzSjBjeXdnYlc5a2RXeGxMQ0J0YjJSMWJHVXVaWGh3YjNKMGN5d2dYMTkzWldKd1lXTnJYM0psY1hWcGNtVmZYeWs3WEc1Y2JseDBMeThnVW1WMGRYSnVJSFJvWlNCbGVIQnZjblJ6SUc5bUlIUm9aU0J0YjJSMWJHVmNibHgwY21WMGRYSnVJRzF2WkhWc1pTNWxlSEJ2Y25Sek8xeHVmVnh1WEc0aUxDSXZMeUJrWldacGJtVWdaMlYwZEdWeUlHWjFibU4wYVc5dWN5Qm1iM0lnYUdGeWJXOXVlU0JsZUhCdmNuUnpYRzVmWDNkbFluQmhZMnRmY21WeGRXbHlaVjlmTG1RZ1BTQW9aWGh3YjNKMGN5d2daR1ZtYVc1cGRHbHZiaWtnUFQ0Z2UxeHVYSFJtYjNJb2RtRnlJR3RsZVNCcGJpQmtaV1pwYm1sMGFXOXVLU0I3WEc1Y2RGeDBhV1lvWDE5M1pXSndZV05yWDNKbGNYVnBjbVZmWHk1dktHUmxabWx1YVhScGIyNHNJR3RsZVNrZ0ppWWdJVjlmZDJWaWNHRmphMTl5WlhGMWFYSmxYMTh1YnlobGVIQnZjblJ6TENCclpYa3BLU0I3WEc1Y2RGeDBYSFJQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb1pYaHdiM0owY3l3Z2EyVjVMQ0I3SUdWdWRXMWxjbUZpYkdVNklIUnlkV1VzSUdkbGREb2daR1ZtYVc1cGRHbHZibHRyWlhsZElIMHBPMXh1WEhSY2RIMWNibHgwZlZ4dWZUc2lMQ0pmWDNkbFluQmhZMnRmY21WeGRXbHlaVjlmTG1jZ1BTQW9ablZ1WTNScGIyNG9LU0I3WEc1Y2RHbG1JQ2gwZVhCbGIyWWdaMnh2WW1Gc1ZHaHBjeUE5UFQwZ0oyOWlhbVZqZENjcElISmxkSFZ5YmlCbmJHOWlZV3hVYUdsek8xeHVYSFIwY25rZ2UxeHVYSFJjZEhKbGRIVnliaUIwYUdseklIeDhJRzVsZHlCR2RXNWpkR2x2YmlnbmNtVjBkWEp1SUhSb2FYTW5LU2dwTzF4dVhIUjlJR05oZEdOb0lDaGxLU0I3WEc1Y2RGeDBhV1lnS0hSNWNHVnZaaUIzYVc1a2IzY2dQVDA5SUNkdlltcGxZM1FuS1NCeVpYUjFjbTRnZDJsdVpHOTNPMXh1WEhSOVhHNTlLU2dwT3lJc0lsOWZkMlZpY0dGamExOXlaWEYxYVhKbFgxOHVieUE5SUNodlltb3NJSEJ5YjNBcElEMCtJQ2hQWW1wbFkzUXVjSEp2ZEc5MGVYQmxMbWhoYzA5M2JsQnliM0JsY25SNUxtTmhiR3dvYjJKcUxDQndjbTl3S1NraUxDSXZMeUJrWldacGJtVWdYMTlsYzAxdlpIVnNaU0J2YmlCbGVIQnZjblJ6WEc1ZlgzZGxZbkJoWTJ0ZmNtVnhkV2x5WlY5ZkxuSWdQU0FvWlhod2IzSjBjeWtnUFQ0Z2UxeHVYSFJwWmloMGVYQmxiMllnVTNsdFltOXNJQ0U5UFNBbmRXNWtaV1pwYm1Wa0p5QW1KaUJUZVcxaWIyd3VkRzlUZEhKcGJtZFVZV2NwSUh0Y2JseDBYSFJQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb1pYaHdiM0owY3l3Z1UzbHRZbTlzTG5SdlUzUnlhVzVuVkdGbkxDQjdJSFpoYkhWbE9pQW5UVzlrZFd4bEp5QjlLVHRjYmx4MGZWeHVYSFJQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEhrb1pYaHdiM0owY3l3Z0oxOWZaWE5OYjJSMWJHVW5MQ0I3SUhaaGJIVmxPaUIwY25WbElIMHBPMXh1ZlRzaUxDSnBiWEJ2Y25RZ2UxeHVJQ0JLU1VKZlFrRlNVa1ZPTEZ4dUlDQktTVUpmVUZKUFdGa3NYRzRnSUVwSlFpeGNiaUFnU21saUxGeHVJQ0JtWVdOMGIzSjVMRnh1SUNBa0xGeHVJQ0JwYzBwcFltbHphQ3hjYmlBZ1kyOXVjM1J5ZFdOMFNtbGlMRnh1SUNCeVpYTnZiSFpsUTJocGJHUnlaVzRzWEc1OUlHWnliMjBnSnk0dmFtbGlMbXB6Snp0Y2JseHVaWGh3YjNKMElHTnZibk4wSUVwcFluTWdQU0I3WEc0Z0lFcEpRbDlDUVZKU1JVNHNYRzRnSUVwSlFsOVFVazlZV1N4Y2JpQWdTa2xDTEZ4dUlDQkthV0lzWEc0Z0lHbHpTbWxpYVhOb0xGeHVJQ0JqYjI1emRISjFZM1JLYVdJc1hHNGdJSEpsYzI5c2RtVkRhR2xzWkhKbGJpeGNibjA3WEc1Y2JtbHRjRzl5ZENCN1hHNGdJRlZRUkVGVVJWOUZWa1ZPVkN4Y2JpQWdVVlZGVlVWZlZWQkVRVlJGWDAxRlZFaFBSQ3hjYmlBZ1JreFZVMGhmVlZCRVFWUkZYMDFGVkVoUFJDeGNiaUFnU1U1SlZGOU5SVlJJVDBRc1hHNGdJRk5MU1ZCZlUxUkJWRVZmVlZCRVFWUkZVeXhjYmlBZ1VFVk9SRWxPUjE5VFZFRlVSVjlWVUVSQlZFVXNYRzRnSUV4QlUxUmZVa1ZPUkVWU1gxUkpUVVVzWEc0Z0lGQlNSVlpKVDFWVFgxTlVRVlJGTEZ4dVhHNGdJRU52YlhCdmJtVnVkQ3hjYm4wZ1puSnZiU0FuTGk5amIyMXdiMjVsYm5RdWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdRMjl0Y0c5dVpXNTBjeUE5SUh0Y2JpQWdWVkJFUVZSRlgwVldSVTVVTEZ4dUlDQlJWVVZWUlY5VlVFUkJWRVZmVFVWVVNFOUVMRnh1SUNCR1RGVlRTRjlWVUVSQlZFVmZUVVZVU0U5RUxGeHVJQ0JKVGtsVVgwMUZWRWhQUkN4Y2JpQWdVMHRKVUY5VFZFRlVSVjlWVUVSQlZFVlRMRnh1SUNCUVJVNUVTVTVIWDFOVVFWUkZYMVZRUkVGVVJTeGNiaUFnVEVGVFZGOVNSVTVFUlZKZlZFbE5SU3hjYmlBZ1VGSkZWa2xQVlZOZlUxUkJWRVVzWEc1OU8xeHVYRzVwYlhCdmNuUWdlMXh1SUNCR1QxSkRSVjlTUlVaTVQxY3NYRzRnSUZKdmIzUk9iMlJsTEZ4dUlDQlNaVzVrWlhKbGNpeGNiaUFnVW05dmRFVnNaVzFsYm5Rc1hHNGdJRU52YlcxbGJuUkZiR1Z0Wlc1MExGeHVJQ0JPWVhScGRtVkZiR1Z0Wlc1MExGeHVJQ0JRYjNKMFlXeEZiR1Z0Wlc1MExGeHVJQ0JVWlhoMFJXeGxiV1Z1ZEN4Y2JuMGdabkp2YlNBbkxpOXlaVzVrWlhKbGNuTXZhVzVrWlhndWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdVbVZ1WkdWeVpYSnpJRDBnZTF4dUlDQkRUMDVVUlZoVVgwbEVPaUJTYjI5MFRtOWtaUzVEVDA1VVJWaFVYMGxFTEZ4dUlDQkdUMUpEUlY5U1JVWk1UMWNzWEc0Z0lGSnZiM1JPYjJSbExGeHVJQ0JTWlc1a1pYSmxjaXhjYmlBZ1VtOXZkRVZzWlcxbGJuUXNYRzRnSUVOdmJXMWxiblJGYkdWdFpXNTBMRnh1SUNCT1lYUnBkbVZGYkdWdFpXNTBMRnh1SUNCUWIzSjBZV3hGYkdWdFpXNTBMRnh1SUNCVVpYaDBSV3hsYldWdWRDeGNibjA3WEc1Y2JtVjRjRzl5ZENBcUlHRnpJRlYwYVd4eklHWnliMjBnSnk0dmRYUnBiSE11YW5Nbk8xeHVaWGh3YjNKMElIc2daR1ZtWVhWc2RDQmhjeUJrWldGa1ltVmxaaUI5SUdaeWIyMGdKMlJsWVdSaVpXVm1KenRjYmx4dVpYaHdiM0owSUh0Y2JpQWdabUZqZEc5eWVTeGNiaUFnSkN4Y2JpQWdRMjl0Y0c5dVpXNTBMRnh1ZlR0Y2JpSmRMQ0p1WVcxbGN5STZXMTBzSW5OdmRYSmpaVkp2YjNRaU9pSWlmUT09IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJleHBvcnQgeyBET01SZW5kZXJlciB9IGZyb20gJy4vZG9tLXJlbmRlcmVyLmpzJztcbmV4cG9ydCAqIGZyb20gJ2ppYnMnO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9