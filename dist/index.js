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
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 20;

  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'fragmentNode': {
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
      'pendingContextUpdate': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      'previousState': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        {},
      },
      'lastContextID': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        // eslint-disable-next-line no-magic-numbers
        value:        this.context[CONTEXT_ID] || 1n,
      },
      'cachedRenderResult': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  getThisNodeOrChildNodes() {
    if (!this.fragmentNode)
      return;

    return this.fragmentNode.getChildrenNodes();
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

    if (this.lastContextID < this.context[CONTEXT_ID]) {
      this.lastContextID = this.context[CONTEXT_ID];
      this.previousState = Object.assign({}, component.state);

      this.firePropUpdates(component.props, newProps);
      component.props = this.mergeComponentProps(component.props, newProps);

      return true;
    }

    if (this.childrenDiffer(component.children, newChildren)) {
      this.previousState = Object.assign({}, component.state);

      this.firePropUpdates(component.props, newProps);
      component.props = this.mergeComponentProps(component.props, newProps);

      return true;
    }

    let previousState = this.previousState || {};
    let propsDiffer   = this.propsDiffer(component.props, newProps, [ 'ref', 'key' ], true);
    if (propsDiffer && component.shouldUpdate(newProps, previousState)) {
      this.previousState = Object.assign({}, component.state);

      this.firePropUpdates(component.props, newProps);
      component.props = this.mergeComponentProps(component.props, newProps);

      return true;
    }

    let stateDiffers = this.propsDiffer(previousState, component.state);
    if (stateDiffers && component.shouldUpdate(newProps, previousState)) {
      this.previousState = Object.assign({}, component.state);
      return true;
    }

    return false;
  }

  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    if (this.component) {
      if (this.jib && this.jib.props && typeof this.jib.props.ref === 'function')
        this.jib.props.ref.call(this.component, null, this.component);

      await this.component.destroy();
      this.component = null;
    }

    if (this.fragmentNode) {
      this.removeChild(this.fragmentNode);

      await this.fragmentNode.destroy();
      this.fragmentNode = null;
    }

    this.cachedRenderResult = null;
    this.previousState = null;

    return await super.destroy(true);
  }

  onContextUpdate() {
    if (!this.component || this.component[PENDING_STATE_UPDATE])
      return;

    if (this.pendingContextUpdate)
      return this.pendingContextUpdate;

    this.pendingContextUpdate = Promise.resolve().then(() => {
      if (this.destroying || !this.component || this.component[PENDING_STATE_UPDATE])
        return;

      this.pendingContextUpdate = null;
      this.render();
    });

    return this.pendingContextUpdate;
  }

  // eslint-disable-next-line no-unused-vars
  async _render() {
    let renderFrame = this.renderFrame;

    let { Type: ComponentClass, props, children } = (this.jib || {});
    if (!ComponentClass)
      return;

    children = this.jib.children = await this.resolveChildren(children);

    const finalizeRender = async (renderResult, renderFrame) => {
      if (this.destroying || renderFrame < this.renderFrame || !this.component)
        return;

      this.cachedRenderResult = renderResult;

      this.component[LAST_RENDER_TIME] = jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.now();

      let fragmentNode = this.fragmentNode;
      let fragmentJib = { Type: JIB_PROXY, props: {}, children: renderResult };

      if (!fragmentNode) {
        fragmentNode = this.fragmentNode = this.renderer.constructNodeFromJib(fragmentJib, this, this.context);
        this.addChild(fragmentNode);
      } else {
        fragmentNode.updateJib(fragmentJib);
      }

      await fragmentNode.render();
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

    if (this.destroying || renderFrame < this.renderFrame)
      return;

    try {
      if (this.component && !this.shouldRender(props, children))
        return;

      let component = this.component;
      if (!component) {
        component = this.component = new ComponentClass({ ...(this.jib || {}), props: this.mergeComponentProps(null, props), context: this.context, id: this.id });
        if (typeof component[INIT_METHOD] === 'function')
          component[INIT_METHOD]();

        component.on(UPDATE_EVENT, (pushedRenderResult) => {
          if (pushedRenderResult) {
            this.renderFrame++;
            finalizeRender(pushedRenderResult, this.renderFrame);
          } else {
            this.render();
          }
        });

        if (props && typeof props.ref === 'function')
          props.ref.call(component, component, null);
      }

      // Cancel any pending state updates
      if (this.component[PENDING_STATE_UPDATE])
        this.component[PENDING_STATE_UPDATE] = null;

      let renderResult = this.component.render(children);
      if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(renderResult, 'promise')) {
        let waitingRenderResult = this.component.renderWaiting(this.cachedRenderResult);
        let renderCompleted = false;

        let loadingTimer = setTimeout(async () => {
          loadingTimer = null;

          if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(waitingRenderResult, 'promise'))
            waitingRenderResult = await waitingRenderResult;

          if (renderCompleted)
            return;

          await finalizeRender(waitingRenderResult, renderFrame);
        // eslint-disable-next-line no-magic-numbers
        }, 5);

        await renderResult.then(async (renderResult) => {
          renderCompleted = true;

          if (loadingTimer) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
          }

          await finalizeRender(renderResult, renderFrame);
        }).catch(handleRenderError);
      } else {
        await finalizeRender(renderResult, renderFrame);
      }
    } catch (error) {
      await handleRenderError(error);
    }
  }

  async destroyFromDOM() {
    if (!this.parentNode)
      return;

    return await this.parentNode.destroyFromDOM(this.parentNode.context, this.parentNode);
  }

  async syncDOM() {
    if (!this.parentNode)
      return;

    return await this.parentNode.syncDOM(this.parentNode.context, this.parentNode);
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








const {
  Renderer,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

const {
  JIB_PROXY,
  JIB_RAW_TEXT,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Jibs;

const SKIP_UPDATES = true;

class DOMRenderer extends Renderer {
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 9;

  static FragmentNode = _fragment_node_js__WEBPACK_IMPORTED_MODULE_1__.FragmentNode;

  static TextNode = _text_node_js__WEBPACK_IMPORTED_MODULE_2__.TextNode;

  static NativeNode = _native_node_js__WEBPACK_IMPORTED_MODULE_3__.NativeNode;

  static PortalNode = _portal_node_js__WEBPACK_IMPORTED_MODULE_4__.PortalNode;

  static ComponentNode = _component_node_js__WEBPACK_IMPORTED_MODULE_5__.ComponentNode;

  constructor(rootElementSelector, options) {
    super();

    Object.defineProperties(this, {
      'options': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        options || {},
      },
      'rootNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      'jib': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        { Type: rootElementSelector, props: {}, children: [] },
      },
    });
  }

  isPortalNode(type) {
    return (/[^a-zA-Z0-9:]/).test(type);
  }

  constructNodeFromJib(jib, parent, context) {
    let { Type } = jib;
    if (typeof Type === 'function') {
      return new this.constructor.ComponentNode(this, parent, context, jib);
    } else if (typeof Type === 'string') {
      if (this.isPortalNode(Type))
        return new this.constructor.PortalNode(this, parent, context, jib);
      else
        return new this.constructor.NativeNode(this, parent, context, jib);
    } else if (Type == null || Type === JIB_PROXY) {
      return new this.constructor.FragmentNode(this, parent, context, jib);
    } else if (Type === JIB_RAW_TEXT) {
      return new this.constructor.TextNode(this, parent, context, jib);
    }
  }

  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    if (this.rootNode) {
      await this.rootNode.destroy();
      this.rootNode = null;
    }

    return await super.destroy(true);
  }

  async render(children) {
    if (!children)
      throw new TypeError(`${this.constructor.name}::render: A jib must be provided.`);

    this.updateJib({
      ...this.jib,
      children,
    });

    return super.render();
  }

  async _render() {
    let renderFrame = this.renderFrame;
    let rootNode = this.rootNode;
    let fragmentJib = { Type: JIB_PROXY, props: {}, children: this.jib };

    if (!rootNode)
      rootNode = this.rootNode = this.constructNodeFromJib(this.jib, this, this.context);
    else
      rootNode.updateJib(fragmentJib);

    await rootNode.render();
    if (renderFrame >= this.renderFrame)
      this.syncDOM(this.context, this.rootNode);
  }

  async destroyFromDOM(context, node) {
    if (!node)
      return false;

    if (node === this) {
      if (!this.rootNode)
        return false;

      return await this.destroyNode(context, this.rootNode);
    }

    return await this.destroyNode(context, node);
  }

  async syncDOM(context, node) {
    if (!node)
      return false;

    if (node === this) {
      if (!this.rootNode)
        return false;

      return await this.syncNode(context, this.rootNode);
    }

    return await this.syncNode(context, node);
  }

  async addNode(context, node) {
    if (!node)
      return false;

    await this.attachChildren(context, node);

    // Tell our parent to reorder itself
    let parentNode = this.parentNode;
    if (parentNode) {
      // Skip updates, as we aren't modifying other children.
      // Just ensure proper child order.
      await this.attachChildren(context, parentNode, SKIP_UPDATES);
    }

    return true;
  }

  async constructNativeElementFromNode(context, node) {
    if (!node)
      return false;

    if (node.TYPE === _native_node_js__WEBPACK_IMPORTED_MODULE_3__.NativeNode.TYPE)
      return await this.createNativeElement(context, node);
    else if (node.TYPE === _text_node_js__WEBPACK_IMPORTED_MODULE_2__.TextNode.TYPE)
      return await this.createTextElement(context, node);
    else if (node.TYPE === _portal_node_js__WEBPACK_IMPORTED_MODULE_4__.PortalNode.TYPE || node.TYPE === DOMRenderer.TYPE)
      return await this.createPortalElement(context, node);
    else
      throw new TypeError(`${this.constructor.name}::constructNativeElementFromNode: Unsupported virtual element type detected: ${node.TYPE}`);
  }

  async updateNode(context, node) {
    if (!node)
      return false;

    let result;

    if (node.TYPE === _native_node_js__WEBPACK_IMPORTED_MODULE_3__.NativeNode.TYPE)
      result = await this.updateNativeElement(context, node);
    else if (node.TYPE === _text_node_js__WEBPACK_IMPORTED_MODULE_2__.TextNode.TYPE)
      result = await this.updateTextElement(context, node);
    else if (node.TYPE === _portal_node_js__WEBPACK_IMPORTED_MODULE_4__.PortalNode.TYPE || node.TYPE === DOMRenderer.TYPE)
      result = await this.updatePortalElement(context, node);
    else
      throw new TypeError(`${this.constructor.name}::syncNode: Unsupported virtual element type detected: ${node.TYPE}`);

    await this.attachChildren(context, node);

    return result;
  }

  async syncNode(context, node) {
    if (!node)
      return false;

    let nativeElement = (node && node.nativeElement);
    if (!nativeElement) {
      nativeElement = await this.constructNativeElementFromNode(context, node);
      if (node.jib && node.jib.props && typeof node.jib.props.ref === 'function')
        node.jib.props.ref.call(node, nativeElement, null);

      node.nativeElement = nativeElement;

      return await this.addNode(context, node);
    } else if (node) {
      return await this.updateNode(context, node);
    }
  }

  async destroyNode(context, node) {
    if (!node)
      return false;

    let nativeElement = (node && node.nativeElement);
    let result = false;

    if (nativeElement) {
      if (node.TYPE === _native_node_js__WEBPACK_IMPORTED_MODULE_3__.NativeNode.TYPE)
        result = await this.destroyNativeElement(context, node);
      else if (node.TYPE === _text_node_js__WEBPACK_IMPORTED_MODULE_2__.TextNode.TYPE)
        result = await this.destroyTextElement(context, node);
      else if (node.TYPE === _portal_node_js__WEBPACK_IMPORTED_MODULE_4__.PortalNode.TYPE || node.TYPE === DOMRenderer.TYPE)
        result = await this.destroyPortalElement(context, node);
      else
        new TypeError(`${this.constructor.name}::syncNode: Unsupported virtual element type detected: ${node.TYPE}`);
    }

    if (node)
      await this.detachChildren(context, node);

    return result;
  }

  findNativeElement(context, node) {
  }

  createNativeElement(context, node) {
    return { type: 'element', value: node.value };
  }

  updateNativeElement(context, node) {
  }

  createTextElement(context, node) {
    return { type: 'text', value: node.value };
  }

  updateTextElement(context, node) {
    return false;
  }

  createPortalElement(context, node) {
    return { type: 'portal', value: node.value };
  }

  updatePortalElement(context, node) {
    return false;
  }

  destroyNativeElement(context, node) {
  }

  destroyTextElement(context, node) {
  }

  destroyPortalElement(context, node) {
  }

  forceNativeElementReflow(context, node, nativeElement) {
  }

  async attachChildren(context, parentNode, orderOnly) {
    let parentNativeElement = (parentNode && parentNode.nativeElement);
    if (!parentNativeElement)
      return false;

    let nativeParentChildNodes = Array.from(parentNativeElement.childNodes);
    let index = 0;
    let skipOrderedNodes = true;

    for (let childNode of parentNode.getChildrenNodes()) {
      let childNativeElement = childNode.nativeElement;
      if (!childNativeElement)
        continue;

      if (orderOnly !== true)
        await this.updateNode(context, childNode);

      // Performance boost
      if (skipOrderedNodes) {
        if (nativeParentChildNodes[index++] === childNativeElement)
          continue;
        else
          skipOrderedNodes = false;
      }

      await parentNativeElement.appendChild(childNativeElement);
      this.forceNativeElementReflow(context, childNode, childNativeElement);
    }

    return true;
  }

  async detachChildren(context, parentNode) {
    let parentNativeElement = (parentNode && parentNode.nativeElement);
    if (!parentNativeElement)
      return false;

    let destroyPromises = [];
    for (let childNode of parentNode.getChildrenNodes())
      destroyPromises.push(this.destroyNode(context, childNode));

    await Promise.all(destroyPromises);

    return true;
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
  JIB_RAW_TEXT,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Jibs;

const {
  RootNode,
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

class FragmentNode extends RootNode {
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 11;

  getThisNodeOrChildNodes() {
    return this.getChildrenNodes();
  }

  async _render() {
    let indexMap    = new Map();
    let renderFrame = this.renderFrame;

    let { children } = (this.jib || {});
    if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(children, 'promise'))
      children = await children;

    if (this.destroying || renderFrame < this.renderFrame)
      return;

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
        if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.isEmpty(child) || Object.is(child, NaN) || Object.is(child, Infinity))
          return;

        let isJib = isJibish(child);
        let created;
        let jib;

        if (!isJib && this.isIterableChild(child)) {
          jib = {
            Type:     JIB_PROXY,
            children: child,
            props:    {
              key: `@jib/internal_fragment_${getIndexForType(JIB_PROXY)}`,
            },
          };
        } else if (!isJib && this.isValidChild(child)) {
          child = (typeof child.valueOf === 'function') ? child.valueOf() : child;
          jib = {
            Type:     JIB_RAW_TEXT,
            children: child,
            props:    {
              key: `@jib/internal_text_${getIndexForType(JIB_RAW_TEXT)}`,
            },
          };
        } else if (isJib) {
          jib = constructJib(child);
          if (jibs__WEBPACK_IMPORTED_MODULE_0__.Utils.instanceOf(jib, 'promise'))
            jib = await jib;
        }

        if (this.destroying || renderFrame < this.renderFrame) {
          loopStopped = true;
          return;
        }

        let { Type, props } = jib;
        let localKey;
        if (index !== key) // Index is an integer, and key is a string, meaning this is an object
          localKey = key;
        else
          localKey = (props.key == null || Object.is(props.key, NaN) || Object.is(props.key, Infinity)) ? `@jib/internal_key_${getIndexForType(Type)}` : props.key;

        props.key = localKey;
        jib.props = props;

        let cacheKey = (0,jibs__WEBPACK_IMPORTED_MODULE_0__.deadbeef)(Type, props.key);
        let node = this.getChild(cacheKey);

        if (!node) {
          created = true;
          node = this.renderer.constructNodeFromJib(jib, this, this.context);
        } else {
          created = false;
          node.updateJib(jib);
        }

        await node.render();

        return { node, cacheKey, created };
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

      return;
    }

    // Add new children, and build a map
    // of children just added.
    let nodeMap = new Map();
    for (let renderResult of renderResults) {
      let { node, cacheKey } = renderResult;

      nodeMap.set(cacheKey, renderResult);
      this.addChild(node);
    }

    // Remove nodes no longer in the fragment
    for (let [ cacheKey, childNode ] of this.childNodes) {
      let hasChild = nodeMap.has(cacheKey);
      if (!hasChild) {
        // This node was destroyed
        destroyPromises.push(childNode.destroy());
        this.removeChild(childNode);
      }
    }

    nodeMap.clear();

    if (destroyPromises.length > 0)
      await Promise.all(destroyPromises);
  }

  async destroyFromDOM() {
    if (!this.parentNode)
      return;

    return await this.parentNode.destroyFromDOM(this.parentNode.context, this.parentNode);
  }

  async syncDOM() {
    if (!this.parentNode)
      return;

    return await this.parentNode.syncDOM(this.parentNode.context, this.parentNode);
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
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

class NativeNode extends RootNode {
  static TYPE = 1;

  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'fragmentNode': {
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
    await this.destroyFragmentNode();

    return await super.destroy(true);
  }

  async destroyFragmentNode() {
    if (!this.fragmentNode)
      return;

    this.removeChild(this.fragmentNode);

    await this.fragmentNode.destroy();
    this.fragmentNode = null;
  }

  async _render() {
    let {
      Type,
      props,
      children,
    } = (this.jib || {});

    if (!Type)
      return;

    if (!Object.prototype.hasOwnProperty.call(props, 'innerHTML')) {
      let fragmentJib = { Type: JIB_PROXY, props: {}, children };
      let fragmentNode = this.fragmentNode;

      if (!fragmentNode) {
        fragmentNode = this.fragmentNode = this.renderer.constructNodeFromJib(fragmentJib, this, this.context);
        this.addChild(fragmentNode);
      } else {
        this.fragmentNode.updateJib(fragmentJib);
      }

      await fragmentNode.render();
    } else {
      await this.destroyFragmentNode();
    }
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
/* harmony import */ var _native_node_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./native-node.js */ "./lib/native-node.js");


class PortalNode extends _native_node_js__WEBPACK_IMPORTED_MODULE_0__.NativeNode {
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 15;
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
} = jibs__WEBPACK_IMPORTED_MODULE_0__.Renderers;

class TextNode extends RootNode {
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 3;
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
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_3738__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _events_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_3738__(/*! ./events.js */ "./lib/events.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_3738__(/*! ./utils.js */ "./lib/utils.js");
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_3__ = __nested_webpack_require_3738__(/*! ./jib.js */ "./lib/jib.js");
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

class Component extends _events_js__WEBPACK_IMPORTED_MODULE_1__.EventEmitter {
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
    _utils_js__WEBPACK_IMPORTED_MODULE_2__.bindMethods.call(this, this.constructor.prototype);

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
        value:        Promise.resolve(),
      },
      [LAST_RENDER_TIME]: {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        _utils_js__WEBPACK_IMPORTED_MODULE_2__.now(),
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
    return _jib_js__WEBPACK_IMPORTED_MODULE_3__.resolveChildren.call(this, children);
  }

  isJib(value) {
    return (0,_jib_js__WEBPACK_IMPORTED_MODULE_3__.isJibish)(value);
  }

  constructJib(value) {
    return (0,_jib_js__WEBPACK_IMPORTED_MODULE_3__.constructJib)(value);
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

    if (_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(propertyPath, 'object')) {
      let keys        = Object.keys(propertyPath).concat(Object.getOwnPropertySymbols(propertyPath));
      let finalState  = {};

      for (let i = 0, il = keys.length; i < il; i++) {
        let key = keys[i];
        let [ value, lastPart ] = _utils_js__WEBPACK_IMPORTED_MODULE_2__.fetchDeepProperty(state, key, propertyPath[key], true);
        if (lastPart == null)
          continue;

        finalState[lastPart] = value;
      }

      return finalState;
    } else {
      return _utils_js__WEBPACK_IMPORTED_MODULE_2__.fetchDeepProperty(state, propertyPath, defaultValue);
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

      if (_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(arg, 'string')) {
        let values = arg.split(sep).filter(_utils_js__WEBPACK_IMPORTED_MODULE_2__.isNotEmpty);
        for (let i = 0, il = values.length; i < il; i++) {
          let value = values[i];
          finalArgs.add(value);
        }
      } else if (Array.isArray(arg)) {
        let values = arg.filter((value) => {
          if (!value)
            return false;

          if (!_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(value, 'string'))
            return false;

          return _utils_js__WEBPACK_IMPORTED_MODULE_2__.isNotEmpty(value);
        });

        for (let i = 0, il = values.length; i < il; i++) {
          let value = values[i];
          finalArgs.add(value);
        }
      } else if (_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(arg, 'object')) {
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
      if (_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(jibType, 'string'))
        jibType = jibType.toLowerCase();

      if (isArray) {
        for (let i = 0, il = patterns.length; i < il; i++) {
          let pattern = patterns[i];
          if (_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(pattern, 'string'))
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

          if (_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(pattern, RegExp))
            result = pattern.test(jibType);
          else if (_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(pattern, 'string'))
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

    // eslint-disable-next-line no-magic-numbers
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

  memoize(func) {
    let cacheID;
    let cachedResult;

    return function(...args) {
      let newCacheID = deadbeef__WEBPACK_IMPORTED_MODULE_0__(...args);
      if (newCacheID !== cacheID) {
        let result = func.apply(this, args);

        cacheID = newCacheID;
        cachedResult = result;
      }

      return cachedResult;
    };
  }
}


/***/ }),

/***/ "./lib/events.js":
/*!***********************!*\
  !*** ./lib/events.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_18724__) => {

__nested_webpack_require_18724__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_18724__.d(__webpack_exports__, {
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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_21485__) => {

__nested_webpack_require_21485__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_21485__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* binding */ $),
/* harmony export */   "JIB": () => (/* binding */ JIB),
/* harmony export */   "JIB_BARREN": () => (/* binding */ JIB_BARREN),
/* harmony export */   "JIB_PROXY": () => (/* binding */ JIB_PROXY),
/* harmony export */   "JIB_RAW_TEXT": () => (/* binding */ JIB_RAW_TEXT),
/* harmony export */   "Jib": () => (/* binding */ Jib),
/* harmony export */   "constructJib": () => (/* binding */ constructJib),
/* harmony export */   "factory": () => (/* binding */ factory),
/* harmony export */   "isJibish": () => (/* binding */ isJibish),
/* harmony export */   "resolveChildren": () => (/* binding */ resolveChildren)
/* harmony export */ });
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_21485__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_21485__(/*! ./utils.js */ "./lib/utils.js");



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

const JIB_BARREN   = Symbol.for('@jibs.barren');
const JIB_PROXY    = Symbol.for('@jibs.proxy');
const JIB_RAW_TEXT = Symbol.for('@jibs.rawText');
const JIB          = Symbol.for('@jibs.jib');

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

/***/ "./lib/renderers/index.js":
/*!********************************!*\
  !*** ./lib/renderers/index.js ***!
  \********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_26676__) => {

__nested_webpack_require_26676__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_26676__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID),
/* harmony export */   "FORCE_REFLOW": () => (/* binding */ FORCE_REFLOW),
/* harmony export */   "Renderer": () => (/* reexport safe */ _renderer_js__WEBPACK_IMPORTED_MODULE_1__.Renderer),
/* harmony export */   "RootNode": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode)
/* harmony export */ });
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_26676__(/*! ./root-node.js */ "./lib/renderers/root-node.js");
/* harmony import */ var _renderer_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_26676__(/*! ./renderer.js */ "./lib/renderers/renderer.js");


const FORCE_REFLOW = Symbol.for('@jibsForceReflow');




/***/ }),

/***/ "./lib/renderers/renderer.js":
/*!***********************************!*\
  !*** ./lib/renderers/renderer.js ***!
  \***********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_27845__) => {

__nested_webpack_require_27845__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_27845__.d(__webpack_exports__, {
/* harmony export */   "Renderer": () => (/* binding */ Renderer)
/* harmony export */ });
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_27845__(/*! ./root-node.js */ "./lib/renderers/root-node.js");


const INITIAL_CONTEXT_ID = 1n;
let _contextIDCounter = INITIAL_CONTEXT_ID;

class Renderer extends _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode {
  static RootNode = _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode;

  constructor() {
    super(null, null, null);
    this.renderer = this;
  }

  createContext(rootContext, onUpdate, onUpdateThis) {
    let context     = Object.create(null);
    let myContextID = (rootContext) ? rootContext[_root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID] : INITIAL_CONTEXT_ID;

    return new Proxy(context, {
      get: (target, propName) => {
        if (propName === _root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID) {
          let parentID = (rootContext) ? rootContext[_root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID] : INITIAL_CONTEXT_ID;
          return (parentID > myContextID) ? parentID : myContextID;
        }

        if (!Object.prototype.hasOwnProperty.call(target, propName))
          return (rootContext) ? rootContext[propName] : undefined;

        return target[propName];
      },
      set: (target, propName, value) => {
        if (propName === _root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID)
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

/***/ "./lib/renderers/root-node.js":
/*!************************************!*\
  !*** ./lib/renderers/root-node.js ***!
  \************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_29961__) => {

__nested_webpack_require_29961__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_29961__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* binding */ CONTEXT_ID),
/* harmony export */   "RootNode": () => (/* binding */ RootNode)
/* harmony export */ });
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_29961__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_29961__(/*! ../utils.js */ "./lib/utils.js");
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_29961__(/*! ../jib.js */ "./lib/jib.js");




const CONTEXT_ID = Symbol.for('@jibs/node/contextID');

class RootNode {
  static CONTEXT_ID = CONTEXT_ID;

  constructor(renderer, parentNode, _context, jib) {
    let context = null;

    if (renderer || this.createContext) {
      context = (renderer || this).createContext(
        _context,
        (this.onContextUpdate) ? this.onContextUpdate : undefined,
        this,
      );
    }

    Object.defineProperties(this, {
      'TYPE': {
        enumerable:   false,
        configurable: false,
        get:          () => this.constructor.TYPE,
        set:          () => {}, // NOOP
      },
      'id': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        _utils_js__WEBPACK_IMPORTED_MODULE_1__.generateUUID(),
      },
      'renderer': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        renderer,
      },
      'parentNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        parentNode,
      },
      'childNodes': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        new Map(),
      },
      'context': {
        enumerable:   false,
        configurable: true,
        get:          () => {
          return context;
        },
        set:          () => {},
      },
      'destroying': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        false,
      },
      'renderPromise': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      'renderFrame': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        0,
      },
      'jib': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        jib,
      },
      'nativeElement': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  resolveChildren(children) {
    return _jib_js__WEBPACK_IMPORTED_MODULE_2__.resolveChildren.call(this, children);
  }

  getCacheKey() {
    let { Type, props } = (this.jib || {});
    let cacheKey = deadbeef__WEBPACK_IMPORTED_MODULE_0__(Type, props.key);

    return cacheKey;
  }

  updateJib(newJib) {
    this.jib = newJib;
  }

  removeChild(childNode) {
    let cacheKey = childNode.getCacheKey();
    this.childNodes.delete(cacheKey);
  }

  addChild(childNode) {
    let cacheKey = childNode.getCacheKey();
    this.childNodes.set(cacheKey, childNode);
  }

  getChild(cacheKey) {
    return this.childNodes.get(cacheKey);
  }

  getThisNodeOrChildNodes() {
    return this;
  }

  getChildrenNodes() {
    let childNodes = [];
    for (let childNode of this.childNodes.values())
      childNodes = childNodes.concat(childNode.getThisNodeOrChildNodes());

    return childNodes.filter(Boolean);
  }

  async destroy(force) {
    if (!force && this.destroying)
      return;

    this.destroying = true;

    if (this.renderPromise)
      await this.renderPromise;

    await this.destroyFromDOM(this.context, this);

    let destroyPromises = [];
    for (let childNode of this.childNodes.values())
      destroyPromises.push(childNode.destroy());

    this.childNodes.clear();
    await Promise.all(destroyPromises);

    this.nativeElement = null;
    this.parentNode = null;
    this.context = null;
    this.jib = null;
  }

  isValidChild(child) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_1__.isValidChild(child);
  }

  isIterableChild(child) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_1__.isIterableChild(child);
  }

  propsDiffer(oldProps, newProps, skipKeys) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_1__.propsDiffer(oldProps, newProps, skipKeys);
  }

  childrenDiffer(oldChildren, newChildren) {
    return _utils_js__WEBPACK_IMPORTED_MODULE_1__.childrenDiffer(oldChildren, newChildren);
  }

  async render(jib, renderContext) {
    if (this.destroying)
      return;

    this.renderFrame++;
    let renderFrame = this.renderFrame;

    if (typeof this._render === 'function') {
      this.renderPromise = this._render(jib, renderContext)
        .then(async (result) => {
          this.renderPromise = null;

          if (renderFrame >= this.renderFrame)
            await this.syncDOM(this.context, this);

          return result;
        })
        .catch((error) => {
          this.renderPromise = null;
          throw error;
        });
    } else {
      await this.syncDOM(this.context, this);
    }

    return this.renderPromise;
  }

  getParentID() {
    if (!this.parentNode)
      return;

    return this.parentNode.id;
  }

  async destroyFromDOM() {
    if (!this.renderer)
      return;

    return await this.renderer.destroyFromDOM(this.context, this);
  }

  async syncDOM() {
    if (!this.renderer)
      return;

    return await this.renderer.syncDOM(this.context, this);
  }
}


/***/ }),

/***/ "./lib/utils.js":
/*!**********************!*\
  !*** ./lib/utils.js ***!
  \**********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_35930__) => {

__nested_webpack_require_35930__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_35930__.d(__webpack_exports__, {
/* harmony export */   "bindMethods": () => (/* binding */ bindMethods),
/* harmony export */   "childrenDiffer": () => (/* binding */ childrenDiffer),
/* harmony export */   "fetchDeepProperty": () => (/* binding */ fetchDeepProperty),
/* harmony export */   "flattenArray": () => (/* binding */ flattenArray),
/* harmony export */   "generateUUID": () => (/* binding */ generateUUID),
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
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_35930__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* eslint-disable no-magic-numbers */


const STOP = Symbol.for('@jibsIterateStop');

// eslint-disable-next-line no-nested-ternary
const globalScope = (typeof global !== 'undefined') ? global : (typeof window !== 'undefined') ? window : undefined;

let uuid = 1000000;

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

function generateUUID() {
  if (uuid > 9999999)
    uuid = 1000000;

  return `${Date.now()}.${uuid++}${Math.round(Math.random() * 10000000).toString().padStart(20, '0')}`;
}


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nested_webpack_require_48611__(moduleId) {
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
/******/ 	__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nested_webpack_require_48611__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nested_webpack_require_48611__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nested_webpack_require_48611__.o(definition, key) && !__nested_webpack_require_48611__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/global */
/******/ (() => {
/******/ 	__nested_webpack_require_48611__.g = (function() {
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
/******/ 	__nested_webpack_require_48611__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__nested_webpack_require_48611__.r = (exports) => {
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
__nested_webpack_require_48611__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_48611__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* reexport safe */ _jib_js__WEBPACK_IMPORTED_MODULE_0__.$),
/* harmony export */   "Component": () => (/* reexport safe */ _component_js__WEBPACK_IMPORTED_MODULE_1__.Component),
/* harmony export */   "Components": () => (/* binding */ Components),
/* harmony export */   "Jibs": () => (/* binding */ Jibs),
/* harmony export */   "Renderers": () => (/* binding */ Renderers),
/* harmony export */   "Utils": () => (/* reexport module object */ _utils_js__WEBPACK_IMPORTED_MODULE_3__),
/* harmony export */   "deadbeef": () => (/* reexport default export from named module */ deadbeef__WEBPACK_IMPORTED_MODULE_4__),
/* harmony export */   "factory": () => (/* reexport safe */ _jib_js__WEBPACK_IMPORTED_MODULE_0__.factory)
/* harmony export */ });
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_48611__(/*! ./jib.js */ "./lib/jib.js");
/* harmony import */ var _component_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_48611__(/*! ./component.js */ "./lib/component.js");
/* harmony import */ var _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_48611__(/*! ./renderers/index.js */ "./lib/renderers/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __nested_webpack_require_48611__(/*! ./utils.js */ "./lib/utils.js");
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_4__ = __nested_webpack_require_48611__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");


const Jibs = {
  JIB_BARREN: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_BARREN,
  JIB_PROXY: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_PROXY,
  JIB_RAW_TEXT: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_RAW_TEXT,
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


//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBLFNBQVM7QUFDVCxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDN05BO0FBQ2dDOztBQUVoQzs7QUFFQTtBQUNBLDBHQUEwRyxTQUFJOztBQUU5Rzs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBLDBDQUEwQyxTQUFTO0FBQ25EO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxvQkFBb0I7QUFDcEI7O0FBRUE7QUFDQTs7QUFFQSxxQ0FBcUMsUUFBUTtBQUM3QztBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQU07QUFDTjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLHNDQUFzQyxRQUFRO0FBQzlDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0gsQ0FBQzs7QUFFTTs7QUFFQTtBQUNQO0FBQ0E7O0FBRUEsVUFBVSxxQ0FBUSxtQkFBbUIscUNBQVE7QUFDN0M7O0FBRU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EscUNBQXFDLFFBQVE7QUFDN0M7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHNDQUFzQyxRQUFRO0FBQzlDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRU87QUFDUDtBQUNBOztBQUVBO0FBQ0EscUNBQXFDLFFBQVE7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7O0FBRU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTs7QUFFQSxZQUFZLFdBQVcsR0FBRyxPQUFPLEVBQUUsa0VBQWtFO0FBQ3JHOzs7Ozs7O1NDN2JBO1NBQ0E7O1NBRUE7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7O1NBRUE7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7Ozs7O1VDdEJBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EseUNBQXlDLHdDQUF3QztVQUNqRjtVQUNBO1VBQ0E7Ozs7O1VDUEE7VUFDQTtVQUNBO1VBQ0E7VUFDQSxHQUFHO1VBQ0g7VUFDQTtVQUNBLENBQUM7Ozs7O1VDUEQ7Ozs7O1VDQUE7VUFDQTtVQUNBO1VBQ0EsdURBQXVELGlCQUFpQjtVQUN4RTtVQUNBLGdEQUFnRCxhQUFhO1VBQzdEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0trQjs7QUFFWDtBQUNQLFlBQVk7QUFDWixXQUFXO0FBQ1gsY0FBYztBQUNkLEtBQUs7QUFDTCxLQUFLO0FBQ0wsVUFBVTtBQUNWLGNBQWM7QUFDZCxpQkFBaUI7QUFDakI7O0FBYXdCOztBQUVqQjtBQUNQLGNBQWM7QUFDZCxxQkFBcUI7QUFDckIscUJBQXFCO0FBQ3JCLGFBQWE7QUFDYixvQkFBb0I7QUFDcEIsc0JBQXNCO0FBQ3RCLGtCQUFrQjtBQUNsQixnQkFBZ0I7QUFDaEI7O0FBTThCOztBQUV2QjtBQUNQLGNBQWMsb0VBQW1CO0FBQ2pDLGNBQWM7QUFDZCxVQUFVO0FBQ1YsVUFBVTtBQUNWOztBQUVvQztBQUNXOztBQU03QyIsInNvdXJjZXMiOlsid2VicGFjazovL2ppYnMvLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvY29tcG9uZW50LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvZXZlbnRzLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvamliLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3V0aWxzLmpzIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vamlicy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vamlicy93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9qaWJzL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vamlicy8uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMiBXeWF0dCBHcmVlbndheVxuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IHRoaXNHbG9iYWwgPSAoKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IGdsb2JhbCkgfHwgdGhpcztcbmNvbnN0IERFQURCRUVGX1JFRl9NQVBfS0VZID0gU3ltYm9sLmZvcignQEBkZWFkYmVlZlJlZk1hcCcpO1xuY29uc3QgVU5JUVVFX0lEX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZVbmlxdWVJRCcpO1xuY29uc3QgcmVmTWFwID0gKHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKSA/IHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldIDogbmV3IFdlYWtNYXAoKTtcbmNvbnN0IGlkSGVscGVycyA9IFtdO1xuXG5pZiAoIXRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKVxuICB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA9IHJlZk1hcDtcblxubGV0IHV1aWRDb3VudGVyID0gMG47XG5cbmZ1bmN0aW9uIGdldEhlbHBlckZvclZhbHVlKHZhbHVlKSB7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkSGVscGVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IHsgaGVscGVyLCBnZW5lcmF0b3IgfSA9IGlkSGVscGVyc1tpXTtcbiAgICBpZiAoaGVscGVyKHZhbHVlKSlcbiAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gYW55dGhpbmdUb0lEKF9hcmcsIF9hbHJlYWR5VmlzaXRlZCkge1xuICBsZXQgYXJnID0gX2FyZztcbiAgaWYgKGFyZyBpbnN0YW5jZW9mIE51bWJlciB8fCBhcmcgaW5zdGFuY2VvZiBTdHJpbmcgfHwgYXJnIGluc3RhbmNlb2YgQm9vbGVhbilcbiAgICBhcmcgPSBhcmcudmFsdWVPZigpO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgYXJnO1xuXG4gIGlmICh0eXBlT2YgPT09ICdudW1iZXInICYmIGFyZyA9PT0gMCkge1xuICAgIGlmIChPYmplY3QuaXMoYXJnLCAtMCkpXG4gICAgICByZXR1cm4gJ251bWJlcjotMCc7XG5cbiAgICByZXR1cm4gJ251bWJlcjorMCc7XG4gIH1cblxuICBpZiAodHlwZU9mID09PSAnc3ltYm9sJylcbiAgICByZXR1cm4gYHN5bWJvbDoke2FyZy50b1N0cmluZygpfWA7XG5cbiAgaWYgKGFyZyA9PSBudWxsIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicgfHwgdHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdiaWdpbnQnKSB7XG4gICAgaWYgKHR5cGVPZiA9PT0gJ251bWJlcicpXG4gICAgICByZXR1cm4gKGFyZyA8IDApID8gYG51bWJlcjoke2FyZ31gIDogYG51bWJlcjorJHthcmd9YDtcblxuICAgIGlmICh0eXBlT2YgPT09ICdiaWdpbnQnICYmIGFyZyA9PT0gMG4pXG4gICAgICByZXR1cm4gJ2JpZ2ludDorMCc7XG5cbiAgICByZXR1cm4gYCR7dHlwZU9mfToke2FyZ31gO1xuICB9XG5cbiAgbGV0IGlkSGVscGVyID0gKGlkSGVscGVycy5sZW5ndGggPiAwICYmIGdldEhlbHBlckZvclZhbHVlKGFyZykpO1xuICBpZiAoaWRIZWxwZXIpXG4gICAgcmV0dXJuIGFueXRoaW5nVG9JRChpZEhlbHBlcihhcmcpKTtcblxuICBpZiAoVU5JUVVFX0lEX1NZTUJPTCBpbiBhcmcgJiYgdHlwZW9mIGFyZ1tVTklRVUVfSURfU1lNQk9MXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uXG4gICAgaWYgKCFfYWxyZWFkeVZpc2l0ZWQgfHwgIV9hbHJlYWR5VmlzaXRlZC5oYXMoYXJnKSkge1xuICAgICAgbGV0IGFscmVhZHlWaXNpdGVkID0gX2FscmVhZHlWaXNpdGVkIHx8IG5ldyBTZXQoKTtcbiAgICAgIGFscmVhZHlWaXNpdGVkLmFkZChhcmcpO1xuICAgICAgcmV0dXJuIGFueXRoaW5nVG9JRChhcmdbVU5JUVVFX0lEX1NZTUJPTF0oKSwgYWxyZWFkeVZpc2l0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghcmVmTWFwLmhhcyhhcmcpKSB7XG4gICAgbGV0IGtleSA9IGAke3R5cGVvZiBhcmd9OiR7Kyt1dWlkQ291bnRlcn1gO1xuICAgIHJlZk1hcC5zZXQoYXJnLCBrZXkpO1xuICAgIHJldHVybiBrZXk7XG4gIH1cblxuICByZXR1cm4gcmVmTWFwLmdldChhcmcpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZigpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGRlYWRiZWVmU29ydGVkKCkge1xuICBsZXQgcGFydHMgPSBbIGFyZ3VtZW50cy5sZW5ndGggXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgcGFydHMucHVzaChhbnl0aGluZ1RvSUQoYXJndW1lbnRzW2ldKSk7XG5cbiAgcmV0dXJuIHBhcnRzLnNvcnQoKS5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSURGb3IoaGVscGVyLCBnZW5lcmF0b3IpIHtcbiAgaWRIZWxwZXJzLnB1c2goeyBoZWxwZXIsIGdlbmVyYXRvciB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSURHZW5lcmF0b3IoaGVscGVyKSB7XG4gIGxldCBpbmRleCA9IGlkSGVscGVycy5maW5kSW5kZXgoKGl0ZW0pID0+IChpdGVtLmhlbHBlciA9PT0gaGVscGVyKSk7XG4gIGlmIChpbmRleCA8IDApXG4gICAgcmV0dXJuO1xuXG4gIGlkSGVscGVycy5zcGxpY2UoaW5kZXgsIDEpO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhkZWFkYmVlZiwge1xuICAnaWRTeW0nOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgVU5JUVVFX0lEX1NZTUJPTCxcbiAgfSxcbiAgJ3NvcnRlZCc6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICBkZWFkYmVlZlNvcnRlZCxcbiAgfSxcbiAgJ2dlbmVyYXRlSURGb3InOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZ2VuZXJhdGVJREZvcixcbiAgfSxcbiAgJ3JlbW92ZUlER2VuZXJhdG9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIHJlbW92ZUlER2VuZXJhdG9yLFxuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGVhZGJlZWY7XG4iLCIvKiBnbG9iYWwgQnVmZmVyICovXG5cbmltcG9ydCBkZWFkYmVlZiBmcm9tICdkZWFkYmVlZic7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5pbXBvcnQgKiBhcyBVdGlscyAgICAgICBmcm9tICcuL3V0aWxzLmpzJztcbmltcG9ydCB7XG4gIGlzSmliaXNoLFxuICByZXNvbHZlQ2hpbGRyZW4sXG4gIGNvbnN0cnVjdEppYixcbn0gZnJvbSAnLi9qaWIuanMnO1xuXG5leHBvcnQgY29uc3QgVVBEQVRFX0VWRU5UICAgICAgICAgICAgICA9ICdAamlicy9jb21wb25lbnQvZXZlbnQvdXBkYXRlJztcbmV4cG9ydCBjb25zdCBRVUVVRV9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3F1ZXVlVXBkYXRlJyk7XG5leHBvcnQgY29uc3QgRkxVU0hfVVBEQVRFX01FVEhPRCAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9mbHVzaFVwZGF0ZScpO1xuZXhwb3J0IGNvbnN0IElOSVRfTUVUSE9EICAgICAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvX19pbml0Jyk7XG5leHBvcnQgY29uc3QgU0tJUF9TVEFURV9VUERBVEVTICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9za2lwU3RhdGVVcGRhdGVzJyk7XG5leHBvcnQgY29uc3QgUEVORElOR19TVEFURV9VUERBVEUgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wZW5kaW5nU3RhdGVVcGRhdGUnKTtcbmV4cG9ydCBjb25zdCBMQVNUX1JFTkRFUl9USU1FICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2xhc3RSZW5kZXJUaW1lJyk7XG5leHBvcnQgY29uc3QgUFJFVklPVVNfU1RBVEUgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wcmV2aW91c1N0YXRlJyk7XG5leHBvcnQgY29uc3QgQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EUyA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wcmV2aW91c1N0YXRlJyk7XG5cbmNvbnN0IGVsZW1lbnREYXRhQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuXG5mdW5jdGlvbiBpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIE5hTikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQm9vbGVhbiB8fCB2YWx1ZSBpbnN0YW5jZW9mIE51bWJlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgbGV0IHR5cGVPZiA9IHR5cGVvZiB2YWx1ZTtcbiAgaWYgKHR5cGVPZiA9PT0gJ3N0cmluZycgfHwgdHlwZU9mID09PSAnbnVtYmVyJyB8fCB0eXBlT2YgPT09ICdib29sZWFuJylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIEJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBzdGF0aWMgVVBEQVRFX0VWRU5UID0gVVBEQVRFX0VWRU5UO1xuXG4gIFtRVUVVRV9VUERBVEVfTUVUSE9EXSgpIHtcbiAgICBpZiAodGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdLnRoZW4odGhpc1tGTFVTSF9VUERBVEVfTUVUSE9EXS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIFtGTFVTSF9VUERBVEVfTUVUSE9EXSgpIHtcbiAgICAvLyBXYXMgdGhlIHN0YXRlIHVwZGF0ZSBjYW5jZWxsZWQ/XG4gICAgaWYgKCF0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZW1pdChVUERBVEVfRVZFTlQpO1xuXG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBudWxsO1xuICB9XG5cbiAgW0lOSVRfTUVUSE9EXSgpIHtcbiAgICB0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10gPSBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKF9qaWIpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgLy8gQmluZCBhbGwgY2xhc3MgbWV0aG9kcyB0byBcInRoaXNcIlxuICAgIFV0aWxzLmJpbmRNZXRob2RzLmNhbGwodGhpcywgdGhpcy5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuXG4gICAgbGV0IGppYiA9IF9qaWIgfHwge307XG5cbiAgICBjb25zdCBjcmVhdGVOZXdTdGF0ZSA9ICgpID0+IHtcbiAgICAgIGxldCBsb2NhbFN0YXRlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgICAgcmV0dXJuIG5ldyBQcm94eShsb2NhbFN0YXRlLCB7XG4gICAgICAgIGdldDogKHRhcmdldCwgcHJvcE5hbWUpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAodGFyZ2V0LCBwcm9wTmFtZSwgdmFsdWUpID0+IHtcbiAgICAgICAgICBsZXQgY3VycmVudFZhbHVlID0gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgICAgICBpZiAoY3VycmVudFZhbHVlID09PSB2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgaWYgKCF0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10pXG4gICAgICAgICAgICB0aGlzW1FVRVVFX1VQREFURV9NRVRIT0RdKCk7XG5cbiAgICAgICAgICB0YXJnZXRbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy5vblN0YXRlVXBkYXRlZChwcm9wTmFtZSwgdmFsdWUsIGN1cnJlbnRWYWx1ZSk7XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsZXQgcHJvcHMgICAgICAgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIGppYi5wcm9wcyB8fCB7fSk7XG4gICAgbGV0IF9sb2NhbFN0YXRlID0gY3JlYXRlTmV3U3RhdGUoKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgIFtTS0lQX1NUQVRFX1VQREFURVNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICB9LFxuICAgICAgW1BFTkRJTkdfU1RBVEVfVVBEQVRFXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAgIH0sXG4gICAgICBbTEFTVF9SRU5ERVJfVElNRV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVXRpbHMubm93KCksXG4gICAgICB9LFxuICAgICAgW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHt9LFxuICAgICAgfSxcbiAgICAgICdpZCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuaWQsXG4gICAgICB9LFxuICAgICAgJ3Byb3BzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBwcm9wcyxcbiAgICAgIH0sXG4gICAgICAnY2hpbGRyZW4nOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5jaGlsZHJlbiB8fCBbXSxcbiAgICAgIH0sXG4gICAgICAnY29udGV4dCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmNvbnRleHQgfHwgT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICAgIH0sXG4gICAgICAnc3RhdGUnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIF9sb2NhbFN0YXRlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGlmICghaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWUgZm9yIFwidGhpcy5zdGF0ZVwiOiBcIiR7dmFsdWV9XCIuIFByb3ZpZGVkIFwic3RhdGVcIiBtdXN0IGJlIGFuIGl0ZXJhYmxlIG9iamVjdC5gKTtcblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oX2xvY2FsU3RhdGUsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICByZXNvbHZlQ2hpbGRyZW4oY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gcmVzb2x2ZUNoaWxkcmVuLmNhbGwodGhpcywgY2hpbGRyZW4pO1xuICB9XG5cbiAgaXNKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gaXNKaWJpc2godmFsdWUpO1xuICB9XG5cbiAgY29uc3RydWN0SmliKHZhbHVlKSB7XG4gICAgcmV0dXJuIGNvbnN0cnVjdEppYih2YWx1ZSk7XG4gIH1cblxuICBwdXNoUmVuZGVyKHJlbmRlclJlc3VsdCkge1xuICAgIHRoaXMuZW1pdChVUERBVEVfRVZFTlQsIHJlbmRlclJlc3VsdCk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25Qcm9wVXBkYXRlZChwcm9wTmFtZSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgY2FwdHVyZVJlZmVyZW5jZShuYW1lLCBpbnRlcmNlcHRvckNhbGxiYWNrKSB7XG4gICAgbGV0IG1ldGhvZCA9IHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU11bbmFtZV07XG4gICAgaWYgKG1ldGhvZClcbiAgICAgIHJldHVybiBtZXRob2Q7XG5cbiAgICBtZXRob2QgPSAoX3JlZiwgcHJldmlvdXNSZWYpID0+IHtcbiAgICAgIGxldCByZWYgPSBfcmVmO1xuXG4gICAgICBpZiAodHlwZW9mIGludGVyY2VwdG9yQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJlZiA9IGludGVyY2VwdG9yQ2FsbGJhY2suY2FsbCh0aGlzLCByZWYsIHByZXZpb3VzUmVmKTtcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgICBbbmFtZV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICByZWYsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhpc1tDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXSA9IG1ldGhvZDtcblxuICAgIHJldHVybiBtZXRob2Q7XG4gIH1cblxuICBmb3JjZVVwZGF0ZSgpIHtcbiAgICB0aGlzW1FVRVVFX1VQREFURV9NRVRIT0RdKCk7XG4gIH1cblxuICBnZXRTdGF0ZShwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gc3RhdGU7XG5cbiAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihwcm9wZXJ0eVBhdGgsICdvYmplY3QnKSkge1xuICAgICAgbGV0IGtleXMgICAgICAgID0gT2JqZWN0LmtleXMocHJvcGVydHlQYXRoKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhwcm9wZXJ0eVBhdGgpKTtcbiAgICAgIGxldCBmaW5hbFN0YXRlICA9IHt9O1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGxldCBbIHZhbHVlLCBsYXN0UGFydCBdID0gVXRpbHMuZmV0Y2hEZWVwUHJvcGVydHkoc3RhdGUsIGtleSwgcHJvcGVydHlQYXRoW2tleV0sIHRydWUpO1xuICAgICAgICBpZiAobGFzdFBhcnQgPT0gbnVsbClcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBmaW5hbFN0YXRlW2xhc3RQYXJ0XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmluYWxTdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFV0aWxzLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgc2V0U3RhdGUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgfVxuXG4gIHNldFN0YXRlUGFzc2l2ZSh2YWx1ZSkge1xuICAgIGlmICghaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWUgZm9yIFwidGhpcy5zZXRTdGF0ZVBhc3NpdmVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwgdmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGRlbGV0ZSB0aGlzLnN0YXRlO1xuICAgIGRlbGV0ZSB0aGlzLnByb3BzO1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRleHQ7XG4gICAgZGVsZXRlIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU107XG4gICAgdGhpcy5jbGVhckFsbERlYm91bmNlcygpO1xuICB9XG5cbiAgcmVuZGVyV2FpdGluZygpIHtcbiAgfVxuXG4gIHJlbmRlcihjaGlsZHJlbikge1xuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHVwZGF0ZWQoKSB7XG4gIH1cblxuICBjb21iaW5lV2l0aChzZXAsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZmluYWxBcmdzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3MubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGFyZyA9IGFyZ3NbaV07XG4gICAgICBpZiAoIWFyZylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGFyZywgJ3N0cmluZycpKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSBhcmcuc3BsaXQoc2VwKS5maWx0ZXIoVXRpbHMuaXNOb3RFbXB0eSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLmZpbHRlcigodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgaWYgKCFVdGlscy5pbnN0YW5jZU9mKHZhbHVlLCAnc3RyaW5nJykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICByZXR1cm4gVXRpbHMuaXNOb3RFbXB0eSh2YWx1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKFV0aWxzLmluc3RhbmNlT2YoYXJnLCAnb2JqZWN0JykpIHtcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhhcmcpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgPSBrZXlzW2ldO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IGFyZ1trZXldO1xuXG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgZmluYWxBcmdzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmluYWxBcmdzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZmluYWxBcmdzKS5qb2luKHNlcCB8fCAnJyk7XG4gIH1cblxuICBjbGFzc2VzKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5jb21iaW5lV2l0aCgnICcsIC4uLmFyZ3MpO1xuICB9XG5cbiAgZXh0cmFjdENoaWxkcmVuKF9wYXR0ZXJucywgY2hpbGRyZW4pIHtcbiAgICBsZXQgZXh0cmFjdGVkID0ge307XG4gICAgbGV0IHBhdHRlcm5zICA9IF9wYXR0ZXJucztcbiAgICBsZXQgaXNBcnJheSAgID0gQXJyYXkuaXNBcnJheShwYXR0ZXJucyk7XG5cbiAgICBjb25zdCBpc01hdGNoID0gKGppYikgPT4ge1xuICAgICAgbGV0IGppYlR5cGUgPSBqaWIuVHlwZTtcbiAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGF0dGVybnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBwYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgIGlmIChqaWJUeXBlID09PSBwYXR0ZXJuKSB7XG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBqaWI7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGF0dGVybnMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgICA9IGtleXNbaV07XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICAgIGxldCByZXN1bHQ7XG5cbiAgICAgICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihwYXR0ZXJuLCBSZWdFeHApKVxuICAgICAgICAgICAgcmVzdWx0ID0gcGF0dGVybi50ZXN0KGppYlR5cGUpO1xuICAgICAgICAgIGVsc2UgaWYgKFV0aWxzLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4udG9Mb3dlckNhc2UoKSA9PT0gamliVHlwZSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4gPT09IGppYlR5cGUpO1xuXG4gICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgZXh0cmFjdGVkW2tleV0gPSBqaWI7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBleHRyYWN0ZWQucmVtYWluaW5nQ2hpbGRyZW4gPSBjaGlsZHJlbi5maWx0ZXIoKGppYikgPT4gIWlzTWF0Y2goamliKSk7XG4gICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgfVxuXG4gIGRlYm91bmNlKGZ1bmMsIHRpbWUsIF9pZCkge1xuICAgIGNvbnN0IGNsZWFyUGVuZGluZ1RpbWVvdXQgPSAoKSA9PiB7XG4gICAgICBpZiAocGVuZGluZ1RpbWVyICYmIHBlbmRpbmdUaW1lci50aW1lb3V0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZXIudGltZW91dCk7XG4gICAgICAgIHBlbmRpbmdUaW1lci50aW1lb3V0ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGlkID0gKCFfaWQpID8gKCcnICsgZnVuYykgOiBfaWQ7XG4gICAgaWYgKCF0aGlzLmRlYm91bmNlVGltZXJzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2RlYm91bmNlVGltZXJzJywge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBwZW5kaW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzW2lkXTtcbiAgICBpZiAoIXBlbmRpbmdUaW1lcilcbiAgICAgIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0ge307XG5cbiAgICBwZW5kaW5nVGltZXIuZnVuYyA9IGZ1bmM7XG4gICAgY2xlYXJQZW5kaW5nVGltZW91dCgpO1xuXG4gICAgdmFyIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZTtcbiAgICBpZiAoIXByb21pc2UgfHwgIXByb21pc2UucGVuZGluZygpKSB7XG4gICAgICBsZXQgc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgbGV0IHJlc29sdmU7XG5cbiAgICAgIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSkgPT4ge1xuICAgICAgICByZXNvbHZlID0gX3Jlc29sdmU7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5yZXNvbHZlID0gKCkgPT4ge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAncGVuZGluZycpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHN0YXR1cyA9ICdmdWxmaWxsZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lci5mdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdmFyIHJldCA9IHBlbmRpbmdUaW1lci5mdW5jLmNhbGwodGhpcyk7XG4gICAgICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHJldCAmJiB0eXBlb2YgcmV0LnRoZW4gPT09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgcmV0LnRoZW4oKHZhbHVlKSA9PiByZXNvbHZlKHZhbHVlKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb2x2ZShyZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgIHN0YXR1cyA9ICdyZWplY3RlZCc7XG4gICAgICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSBudWxsO1xuXG4gICAgICAgIHByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5pc1BlbmRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiAoc3RhdHVzID09PSAncGVuZGluZycpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgIHBlbmRpbmdUaW1lci50aW1lb3V0ID0gc2V0VGltZW91dChwcm9taXNlLnJlc29sdmUsICh0aW1lID09IG51bGwpID8gMjUwIDogdGltZSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGNsZWFyRGVib3VuY2UoaWQpIHtcbiAgICB2YXIgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF07XG4gICAgaWYgKHBlbmRpbmdUaW1lciA9PSBudWxsKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKHBlbmRpbmdUaW1lci50aW1lb3V0KVxuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lci50aW1lb3V0KTtcblxuICAgIGlmIChwZW5kaW5nVGltZXIucHJvbWlzZSlcbiAgICAgIHBlbmRpbmdUaW1lci5wcm9taXNlLmNhbmNlbCgpO1xuICB9XG5cbiAgY2xlYXJBbGxEZWJvdW5jZXMoKSB7XG4gICAgbGV0IGRlYm91bmNlVGltZXJzICA9IHRoaXMuZGVib3VuY2VUaW1lcnMgfHwge307XG4gICAgbGV0IGlkcyAgICAgICAgICAgICA9IE9iamVjdC5rZXlzKGRlYm91bmNlVGltZXJzKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkcy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgICAgdGhpcy5jbGVhckRlYm91bmNlKGlkc1tpXSk7XG4gIH1cblxuICBnZXRFbGVtZW50RGF0YShlbGVtZW50KSB7XG4gICAgbGV0IGRhdGEgPSBlbGVtZW50RGF0YUNhY2hlLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGRhdGEgPSB7fTtcbiAgICAgIGVsZW1lbnREYXRhQ2FjaGUuc2V0KGVsZW1lbnQsIGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgbWVtb2l6ZShmdW5jKSB7XG4gICAgbGV0IGNhY2hlSUQ7XG4gICAgbGV0IGNhY2hlZFJlc3VsdDtcblxuICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICBsZXQgbmV3Q2FjaGVJRCA9IGRlYWRiZWVmKC4uLmFyZ3MpO1xuICAgICAgaWYgKG5ld0NhY2hlSUQgIT09IGNhY2hlSUQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cbiAgICAgICAgY2FjaGVJRCA9IG5ld0NhY2hlSUQ7XG4gICAgICAgIGNhY2hlZFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZFJlc3VsdDtcbiAgICB9O1xuICB9XG59XG4iLCJjb25zdCBFVkVOVF9MSVNURU5FUlMgPSBTeW1ib2wuZm9yKCdAamlicy9ldmVudHMvbGlzdGVuZXJzJyk7XG5cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICBbRVZFTlRfTElTVEVORVJTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG5ldyBNYXAoKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V2ZW50IGxpc3RlbmVyIG11c3QgYmUgYSBtZXRob2QnKTtcblxuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuXG4gICAgaWYgKCFzY29wZSkge1xuICAgICAgc2NvcGUgPSBbXTtcbiAgICAgIGV2ZW50TWFwLnNldChldmVudE5hbWUsIHNjb3BlKTtcbiAgICB9XG5cbiAgICBzY29wZS5wdXNoKGxpc3RlbmVyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFdmVudCBsaXN0ZW5lciBtdXN0IGJlIGEgbWV0aG9kJyk7XG5cbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBsZXQgaW5kZXggPSBzY29wZS5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaW5kZXggPj0gMClcbiAgICAgIHNjb3BlLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUFsbExpc3RlbmVycyhldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGlmICghZXZlbnRNYXAuaGFzKGV2ZW50TmFtZSkpXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGV2ZW50TWFwLnNldChldmVudE5hbWUsIFtdKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZW1pdChldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlIHx8IHNjb3BlLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHNjb3BlLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBldmVudENhbGxiYWNrID0gc2NvcGVbaV07XG4gICAgICBldmVudENhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgb25jZShldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgbGV0IGZ1bmMgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5vZmYoZXZlbnROYW1lLCBmdW5jKTtcbiAgICAgIHJldHVybiBsaXN0ZW5lciguLi5hcmdzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMub24oZXZlbnROYW1lLCBmdW5jKTtcbiAgfVxuXG4gIG9uKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIG9mZihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gIH1cblxuICBldmVudE5hbWVzKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXNbRVZFTlRfTElTVEVORVJTXS5rZXlzKCkpO1xuICB9XG5cbiAgbGlzdGVuZXJDb3VudChldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIDA7XG5cbiAgICByZXR1cm4gc2NvcGUubGVuZ3RoO1xuICB9XG5cbiAgbGlzdGVuZXJzKGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gW107XG5cbiAgICByZXR1cm4gc2NvcGUuc2xpY2UoKTtcbiAgfVxufVxuIiwiaW1wb3J0IGRlYWRiZWVmIGZyb20gJ2RlYWRiZWVmJztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vdXRpbHMuanMnO1xuXG5leHBvcnQgY2xhc3MgSmliIHtcbiAgY29uc3RydWN0b3IoVHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgbGV0IGRlZmF1bHRQcm9wcyA9IChUeXBlICYmIFR5cGUucHJvcHMpID8gVHlwZS5wcm9wcyA6IHt9O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ1R5cGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVHlwZSxcbiAgICAgIH0sXG4gICAgICAncHJvcHMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgeyAuLi5kZWZhdWx0UHJvcHMsIC4uLihwcm9wcyB8fCB7fSkgfSxcbiAgICAgIH0sXG4gICAgICAnY2hpbGRyZW4nOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVXRpbHMuZmxhdHRlbkFycmF5KGNoaWxkcmVuKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IEpJQl9CQVJSRU4gICA9IFN5bWJvbC5mb3IoJ0BqaWJzLmJhcnJlbicpO1xuZXhwb3J0IGNvbnN0IEpJQl9QUk9YWSAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLnByb3h5Jyk7XG5leHBvcnQgY29uc3QgSklCX1JBV19URVhUID0gU3ltYm9sLmZvcignQGppYnMucmF3VGV4dCcpO1xuZXhwb3J0IGNvbnN0IEpJQiAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLmppYicpO1xuXG5leHBvcnQgZnVuY3Rpb24gZmFjdG9yeShKaWJDbGFzcykge1xuICByZXR1cm4gZnVuY3Rpb24gJChfdHlwZSwgcHJvcHMgPSB7fSkge1xuICAgIGlmIChpc0ppYmlzaChfdHlwZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWNlaXZlZCBhIGppYiBidXQgZXhwZWN0ZWQgYSBjb21wb25lbnQuJyk7XG5cbiAgICBsZXQgVHlwZSA9IChfdHlwZSA9PSBudWxsKSA/IEpJQl9QUk9YWSA6IF90eXBlO1xuXG4gICAgZnVuY3Rpb24gYmFycmVuKC4uLl9jaGlsZHJlbikge1xuICAgICAgbGV0IGNoaWxkcmVuID0gX2NoaWxkcmVuO1xuXG4gICAgICBmdW5jdGlvbiBqaWIoKSB7XG4gICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKFR5cGUsICdwcm9taXNlJykgfHwgY2hpbGRyZW4uc29tZSgoY2hpbGQpID0+IFV0aWxzLmluc3RhbmNlT2YoY2hpbGQsICdwcm9taXNlJykpKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsgVHlwZSBdLmNvbmNhdChjaGlsZHJlbikpLnRoZW4oKGFsbCkgPT4ge1xuICAgICAgICAgICAgVHlwZSA9IGFsbFswXTtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYWxsLnNsaWNlKDEpO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEppYkNsYXNzKFxuICAgICAgICAgICAgICBUeXBlLFxuICAgICAgICAgICAgICBwcm9wcyxcbiAgICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBKaWJDbGFzcyhcbiAgICAgICAgICBUeXBlLFxuICAgICAgICAgIHByb3BzLFxuICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhqaWIsIHtcbiAgICAgICAgW0pJQl06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIFtkZWFkYmVlZi5pZFN5bV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogICAgICAgICgpID0+IFR5cGUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGppYjtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhiYXJyZW4sIHtcbiAgICAgIFtKSUJfQkFSUkVOXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICB9LFxuICAgICAgW2RlYWRiZWVmLmlkU3ltXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgICgpID0+IFR5cGUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGJhcnJlbjtcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0ICQgPSBmYWN0b3J5KEppYik7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ppYmlzaCh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmICh2YWx1ZVtKSUJfQkFSUkVOXSB8fCB2YWx1ZVtKSUJdKSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBKaWIpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3RydWN0SmliKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEppYilcbiAgICByZXR1cm4gdmFsdWU7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmICh2YWx1ZVtKSUJfQkFSUkVOXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpKCk7XG4gICAgZWxzZSBpZiAodmFsdWVbSklCXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpO1xuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignY29uc3RydWN0SmliOiBQcm92aWRlZCB2YWx1ZSBpcyBub3QgYSBKaWIuJyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlQ2hpbGRyZW4oX2NoaWxkcmVuKSB7XG4gIGxldCBjaGlsZHJlbiA9IF9jaGlsZHJlbjtcblxuICBpZiAoVXRpbHMuaW5zdGFuY2VPZihjaGlsZHJlbiwgJ3Byb21pc2UnKSlcbiAgICBjaGlsZHJlbiA9IGF3YWl0IGNoaWxkcmVuO1xuXG4gIGlmICghKCh0aGlzLmlzSXRlcmFibGVDaGlsZCB8fCBVdGlscy5pc0l0ZXJhYmxlQ2hpbGQpLmNhbGwodGhpcywgY2hpbGRyZW4pKSAmJiAoaXNKaWJpc2goY2hpbGRyZW4pIHx8ICgodGhpcy5pc1ZhbGlkQ2hpbGQgfHwgVXRpbHMuaXNWYWxpZENoaWxkKS5jYWxsKHRoaXMsIGNoaWxkcmVuKSkpKVxuICAgIGNoaWxkcmVuID0gWyBjaGlsZHJlbiBdO1xuXG4gIGxldCBwcm9taXNlcyA9IFV0aWxzLml0ZXJhdGUoY2hpbGRyZW4sIGFzeW5jICh7IHZhbHVlOiBfY2hpbGQgfSkgPT4ge1xuICAgIGxldCBjaGlsZCA9IChVdGlscy5pbnN0YW5jZU9mKF9jaGlsZCwgJ3Byb21pc2UnKSkgPyBhd2FpdCBfY2hpbGQgOiBfY2hpbGQ7XG5cbiAgICBpZiAoaXNKaWJpc2goY2hpbGQpKVxuICAgICAgcmV0dXJuIGF3YWl0IGNvbnN0cnVjdEppYihjaGlsZCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGNoaWxkO1xuICB9KTtcblxuICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufVxuIiwiZXhwb3J0IHtcbiAgQ09OVEVYVF9JRCxcbiAgUm9vdE5vZGUsXG59IGZyb20gJy4vcm9vdC1ub2RlLmpzJztcblxuZXhwb3J0IGNvbnN0IEZPUkNFX1JFRkxPVyA9IFN5bWJvbC5mb3IoJ0BqaWJzRm9yY2VSZWZsb3cnKTtcblxuZXhwb3J0IHsgUmVuZGVyZXIgfSBmcm9tICcuL3JlbmRlcmVyLmpzJztcbiIsImltcG9ydCB7XG4gIENPTlRFWFRfSUQsXG4gIFJvb3ROb2RlLFxufSBmcm9tICcuL3Jvb3Qtbm9kZS5qcyc7XG5cbmNvbnN0IElOSVRJQUxfQ09OVEVYVF9JRCA9IDFuO1xubGV0IF9jb250ZXh0SURDb3VudGVyID0gSU5JVElBTF9DT05URVhUX0lEO1xuXG5leHBvcnQgY2xhc3MgUmVuZGVyZXIgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIHN0YXRpYyBSb290Tm9kZSA9IFJvb3ROb2RlO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKG51bGwsIG51bGwsIG51bGwpO1xuICAgIHRoaXMucmVuZGVyZXIgPSB0aGlzO1xuICB9XG5cbiAgY3JlYXRlQ29udGV4dChyb290Q29udGV4dCwgb25VcGRhdGUsIG9uVXBkYXRlVGhpcykge1xuICAgIGxldCBjb250ZXh0ICAgICA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IG15Q29udGV4dElEID0gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W0NPTlRFWFRfSURdIDogSU5JVElBTF9DT05URVhUX0lEO1xuXG4gICAgcmV0dXJuIG5ldyBQcm94eShjb250ZXh0LCB7XG4gICAgICBnZXQ6ICh0YXJnZXQsIHByb3BOYW1lKSA9PiB7XG4gICAgICAgIGlmIChwcm9wTmFtZSA9PT0gQ09OVEVYVF9JRCkge1xuICAgICAgICAgIGxldCBwYXJlbnRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtDT05URVhUX0lEXSA6IElOSVRJQUxfQ09OVEVYVF9JRDtcbiAgICAgICAgICByZXR1cm4gKHBhcmVudElEID4gbXlDb250ZXh0SUQpID8gcGFyZW50SUQgOiBteUNvbnRleHRJRDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCwgcHJvcE5hbWUpKVxuICAgICAgICAgIHJldHVybiAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbcHJvcE5hbWVdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgfSxcbiAgICAgIHNldDogKHRhcmdldCwgcHJvcE5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmIChwcm9wTmFtZSA9PT0gQ09OVEVYVF9JRClcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBpZiAodGFyZ2V0W3Byb3BOYW1lXSA9PT0gdmFsdWUpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgbXlDb250ZXh0SUQgPSArK19jb250ZXh0SURDb3VudGVyO1xuICAgICAgICB0YXJnZXRbcHJvcE5hbWVdID0gdmFsdWU7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvblVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBvblVwZGF0ZS5jYWxsKG9uVXBkYXRlVGhpcywgb25VcGRhdGVUaGlzKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBkZWFkYmVlZiBmcm9tICdkZWFkYmVlZic7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi91dGlscy5qcyc7XG5pbXBvcnQgeyByZXNvbHZlQ2hpbGRyZW4gIH0gZnJvbSAnLi4vamliLmpzJztcblxuZXhwb3J0IGNvbnN0IENPTlRFWFRfSUQgPSBTeW1ib2wuZm9yKCdAamlicy9ub2RlL2NvbnRleHRJRCcpO1xuXG5leHBvcnQgY2xhc3MgUm9vdE5vZGUge1xuICBzdGF0aWMgQ09OVEVYVF9JRCA9IENPTlRFWFRfSUQ7XG5cbiAgY29uc3RydWN0b3IocmVuZGVyZXIsIHBhcmVudE5vZGUsIF9jb250ZXh0LCBqaWIpIHtcbiAgICBsZXQgY29udGV4dCA9IG51bGw7XG5cbiAgICBpZiAocmVuZGVyZXIgfHwgdGhpcy5jcmVhdGVDb250ZXh0KSB7XG4gICAgICBjb250ZXh0ID0gKHJlbmRlcmVyIHx8IHRoaXMpLmNyZWF0ZUNvbnRleHQoXG4gICAgICAgIF9jb250ZXh0LFxuICAgICAgICAodGhpcy5vbkNvbnRleHRVcGRhdGUpID8gdGhpcy5vbkNvbnRleHRVcGRhdGUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRoaXMsXG4gICAgICApO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUWVBFJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBnZXQ6ICAgICAgICAgICgpID0+IHRoaXMuY29uc3RydWN0b3IuVFlQRSxcbiAgICAgICAgc2V0OiAgICAgICAgICAoKSA9PiB7fSwgLy8gTk9PUFxuICAgICAgfSxcbiAgICAgICdpZCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBVdGlscy5nZW5lcmF0ZVVVSUQoKSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyZXInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHJlbmRlcmVyLFxuICAgICAgfSxcbiAgICAgICdwYXJlbnROb2RlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBwYXJlbnROb2RlLFxuICAgICAgfSxcbiAgICAgICdjaGlsZE5vZGVzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBuZXcgTWFwKCksXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogICAgICAgICAgKCkgPT4ge30sXG4gICAgICB9LFxuICAgICAgJ2Rlc3Ryb3lpbmcnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGZhbHNlLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJQcm9taXNlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJGcmFtZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgMCxcbiAgICAgIH0sXG4gICAgICAnamliJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIsXG4gICAgICB9LFxuICAgICAgJ25hdGl2ZUVsZW1lbnQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIHJlc29sdmVDaGlsZHJlbi5jYWxsKHRoaXMsIGNoaWxkcmVuKTtcbiAgfVxuXG4gIGdldENhY2hlS2V5KCkge1xuICAgIGxldCB7IFR5cGUsIHByb3BzIH0gPSAodGhpcy5qaWIgfHwge30pO1xuICAgIGxldCBjYWNoZUtleSA9IGRlYWRiZWVmKFR5cGUsIHByb3BzLmtleSk7XG5cbiAgICByZXR1cm4gY2FjaGVLZXk7XG4gIH1cblxuICB1cGRhdGVKaWIobmV3SmliKSB7XG4gICAgdGhpcy5qaWIgPSBuZXdKaWI7XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZE5vZGUpIHtcbiAgICBsZXQgY2FjaGVLZXkgPSBjaGlsZE5vZGUuZ2V0Q2FjaGVLZXkoKTtcbiAgICB0aGlzLmNoaWxkTm9kZXMuZGVsZXRlKGNhY2hlS2V5KTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkTm9kZSkge1xuICAgIGxldCBjYWNoZUtleSA9IGNoaWxkTm9kZS5nZXRDYWNoZUtleSgpO1xuICAgIHRoaXMuY2hpbGROb2Rlcy5zZXQoY2FjaGVLZXksIGNoaWxkTm9kZSk7XG4gIH1cblxuICBnZXRDaGlsZChjYWNoZUtleSkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTm9kZXMuZ2V0KGNhY2hlS2V5KTtcbiAgfVxuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW5Ob2RlcygpIHtcbiAgICBsZXQgY2hpbGROb2RlcyA9IFtdO1xuICAgIGZvciAobGV0IGNoaWxkTm9kZSBvZiB0aGlzLmNoaWxkTm9kZXMudmFsdWVzKCkpXG4gICAgICBjaGlsZE5vZGVzID0gY2hpbGROb2Rlcy5jb25jYXQoY2hpbGROb2RlLmdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkpO1xuXG4gICAgcmV0dXJuIGNoaWxkTm9kZXMuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveShmb3JjZSkge1xuICAgIGlmICghZm9yY2UgJiYgdGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5kZXN0cm95aW5nID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLnJlbmRlclByb21pc2UpXG4gICAgICBhd2FpdCB0aGlzLnJlbmRlclByb21pc2U7XG5cbiAgICBhd2FpdCB0aGlzLmRlc3Ryb3lGcm9tRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG5cbiAgICBsZXQgZGVzdHJveVByb21pc2VzID0gW107XG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHRoaXMuY2hpbGROb2Rlcy52YWx1ZXMoKSlcbiAgICAgIGRlc3Ryb3lQcm9taXNlcy5wdXNoKGNoaWxkTm9kZS5kZXN0cm95KCkpO1xuXG4gICAgdGhpcy5jaGlsZE5vZGVzLmNsZWFyKCk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5wYXJlbnROb2RlID0gbnVsbDtcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIHRoaXMuamliID0gbnVsbDtcbiAgfVxuXG4gIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICAgIHJldHVybiBVdGlscy5pc1ZhbGlkQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gICAgcmV0dXJuIFV0aWxzLmlzSXRlcmFibGVDaGlsZChjaGlsZCk7XG4gIH1cblxuICBwcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKSB7XG4gICAgcmV0dXJuIFV0aWxzLnByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpO1xuICB9XG5cbiAgY2hpbGRyZW5EaWZmZXIob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKSB7XG4gICAgcmV0dXJuIFV0aWxzLmNoaWxkcmVuRGlmZmVyKG9sZENoaWxkcmVuLCBuZXdDaGlsZHJlbik7XG4gIH1cblxuICBhc3luYyByZW5kZXIoamliLCByZW5kZXJDb250ZXh0KSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLl9yZW5kZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IHRoaXMuX3JlbmRlcihqaWIsIHJlbmRlckNvbnRleHQpXG4gICAgICAgIC50aGVuKGFzeW5jIChyZXN1bHQpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuXG4gICAgICAgICAgaWYgKHJlbmRlckZyYW1lID49IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcblxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5zeW5jRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmVuZGVyUHJvbWlzZTtcbiAgfVxuXG4gIGdldFBhcmVudElEKCkge1xuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50Tm9kZS5pZDtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKCkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLmRlc3Ryb3lGcm9tRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG4gIH1cblxuICBhc3luYyBzeW5jRE9NKCkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgbm8tbWFnaWMtbnVtYmVycyAqL1xuaW1wb3J0IGRlYWRiZWVmIGZyb20gJ2RlYWRiZWVmJztcblxuY29uc3QgU1RPUCA9IFN5bWJvbC5mb3IoJ0BqaWJzSXRlcmF0ZVN0b3AnKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5lc3RlZC10ZXJuYXJ5XG5jb25zdCBnbG9iYWxTY29wZSA9ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgPyBnbG9iYWwgOiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdGhpcztcblxubGV0IHV1aWQgPSAxMDAwMDAwO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFuY2VPZihvYmopIHtcbiAgZnVuY3Rpb24gdGVzdFR5cGUob2JqLCBfdmFsKSB7XG4gICAgZnVuY3Rpb24gaXNEZWZlcnJlZFR5cGUob2JqKSB7XG4gICAgICBpZiAob2JqIGluc3RhbmNlb2YgUHJvbWlzZSB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnUHJvbWlzZScpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gUXVhY2sgcXVhY2suLi5cbiAgICAgIGlmICh0eXBlb2Ygb2JqLnRoZW4gPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5jYXRjaCA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgdmFsICAgICA9IF92YWw7XG4gICAgbGV0IHR5cGVPZiAgPSAodHlwZW9mIG9iaik7XG5cbiAgICBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TdHJpbmcpXG4gICAgICB2YWwgPSAnc3RyaW5nJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk51bWJlcilcbiAgICAgIHZhbCA9ICdudW1iZXInO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQm9vbGVhbilcbiAgICAgIHZhbCA9ICdib29sZWFuJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkZ1bmN0aW9uKVxuICAgICAgdmFsID0gJ2Z1bmN0aW9uJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkFycmF5KVxuICAgICAgdmFsID0gJ2FycmF5JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk9iamVjdClcbiAgICAgIHZhbCA9ICdvYmplY3QnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuUHJvbWlzZSlcbiAgICAgIHZhbCA9ICdwcm9taXNlJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJpZ0ludClcbiAgICAgIHZhbCA9ICdiaWdpbnQnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuTWFwKVxuICAgICAgdmFsID0gJ21hcCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5XZWFrTWFwKVxuICAgICAgdmFsID0gJ3dlYWttYXAnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU2V0KVxuICAgICAgdmFsID0gJ3NldCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TeW1ib2wpXG4gICAgICB2YWwgPSAnc3ltYm9sJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJ1ZmZlcilcbiAgICAgIHZhbCA9ICdidWZmZXInO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2J1ZmZlcicgJiYgZ2xvYmFsU2NvcGUuQnVmZmVyICYmIGdsb2JhbFNjb3BlLkJ1ZmZlci5pc0J1ZmZlcihvYmopKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnbnVtYmVyJyAmJiAodHlwZU9mID09PSAnbnVtYmVyJyB8fCBvYmogaW5zdGFuY2VvZiBOdW1iZXIgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ051bWJlcicpKSkge1xuICAgICAgaWYgKCFpc0Zpbml0ZShvYmopKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh2YWwgIT09ICdvYmplY3QnICYmIHZhbCA9PT0gdHlwZU9mKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKChvYmouY29uc3RydWN0b3IgPT09IE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIE51bGwgcHJvdG90eXBlIG9uIG9iamVjdFxuICAgICAgaWYgKHR5cGVPZiA9PT0gJ29iamVjdCcgJiYgIW9iai5jb25zdHJ1Y3RvcilcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodmFsID09PSAnYXJyYXknICYmIChBcnJheS5pc0FycmF5KG9iaikgfHwgb2JqIGluc3RhbmNlb2YgQXJyYXkgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0FycmF5JykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAoKHZhbCA9PT0gJ3Byb21pc2UnIHx8IHZhbCA9PT0gJ2RlZmVycmVkJykgJiYgaXNEZWZlcnJlZFR5cGUob2JqKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3N0cmluZycgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLlN0cmluZyB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU3RyaW5nJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnYm9vbGVhbicgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLkJvb2xlYW4gfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0Jvb2xlYW4nKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdtYXAnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5NYXAgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ01hcCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3dlYWttYXAnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5XZWFrTWFwIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdXZWFrTWFwJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnc2V0JyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuU2V0IHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTZXQnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdmdW5jdGlvbicgJiYgdHlwZU9mID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJyAmJiBvYmogaW5zdGFuY2VvZiB2YWwpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJyAmJiBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHZhbClcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKG9iaiA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gMSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKHRlc3RUeXBlKG9iaiwgYXJndW1lbnRzW2ldKSA9PT0gdHJ1ZSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cykge1xuICBpZiAob2xkUHJvcHMgPT09IG5ld1Byb3BzKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIG9sZFByb3BzICE9PSB0eXBlb2YgbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKCFvbGRQcm9wcyAmJiBuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAob2xkUHJvcHMgJiYgIW5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcbiAgaWYgKCFvbGRQcm9wcyAmJiAhbmV3UHJvcHMgJiYgb2xkUHJvcHMgIT0gb2xkUHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgbGV0IGFLZXlzID0gT2JqZWN0LmtleXMob2xkUHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9sZFByb3BzKSk7XG4gIGxldCBiS2V5cyA9IE9iamVjdC5rZXlzKG5ld1Byb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhuZXdQcm9wcykpO1xuXG4gIGlmIChhS2V5cy5sZW5ndGggIT09IGJLZXlzLmxlbmd0aClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhS2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGFLZXkgPSBhS2V5c1tpXTtcbiAgICBpZiAoc2tpcEtleXMgJiYgc2tpcEtleXMuaW5kZXhPZihhS2V5KSA+PSAwKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAob2xkUHJvcHNbYUtleV0gIT09IG5ld1Byb3BzW2FLZXldKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBsZXQgYktleSA9IGJLZXlzW2ldO1xuICAgIGlmIChza2lwS2V5cyAmJiBza2lwS2V5cy5pbmRleE9mKGJLZXkpKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAoYUtleSA9PT0gYktleSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKG9sZFByb3BzW2JLZXldICE9PSBuZXdQcm9wc1tiS2V5XSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2l6ZU9mKHZhbHVlKSB7XG4gIGlmICghdmFsdWUpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKE9iamVjdC5pcyhJbmZpbml0eSkpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInKVxuICAgIHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIF9pdGVyYXRlKG9iaiwgY2FsbGJhY2spIHtcbiAgaWYgKCFvYmogfHwgT2JqZWN0LmlzKEluZmluaXR5KSlcbiAgICByZXR1cm4gW107XG5cbiAgbGV0IHJlc3VsdHMgICA9IFtdO1xuICBsZXQgc2NvcGUgICAgID0geyBjb2xsZWN0aW9uOiBvYmosIFNUT1AgfTtcbiAgbGV0IHJlc3VsdDtcblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgc2NvcGUudHlwZSA9ICdBcnJheSc7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBvYmoubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgc2NvcGUudmFsdWUgPSBvYmpbaV07XG4gICAgICBzY29wZS5pbmRleCA9IHNjb3BlLmtleSA9IGk7XG5cbiAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmVudHJpZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgU2V0IHx8IG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2V0Jykge1xuICAgICAgc2NvcGUudHlwZSA9ICdTZXQnO1xuXG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBvYmoudmFsdWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSBpdGVtO1xuICAgICAgICBzY29wZS5rZXkgPSBpdGVtO1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3BlLnR5cGUgPSBvYmouY29uc3RydWN0b3IubmFtZTtcblxuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IFsga2V5LCB2YWx1ZSBdIG9mIG9iai5lbnRyaWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgc2NvcGUua2V5ID0ga2V5O1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChpbnN0YW5jZU9mKG9iaiwgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ2JpZ2ludCcsICdmdW5jdGlvbicpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgc2NvcGUudHlwZSA9IChvYmouY29uc3RydWN0b3IpID8gb2JqLmNvbnN0cnVjdG9yLm5hbWUgOiAnT2JqZWN0JztcblxuICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBrZXkgICA9IGtleXNbaV07XG4gICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgIHNjb3BlLmtleSA9IGtleTtcbiAgICAgIHNjb3BlLmluZGV4ID0gaTtcblxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICBicmVhaztcblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKF9pdGVyYXRlLCB7XG4gICdTVE9QJzoge1xuICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHZhbHVlOiAgICAgICAgU1RPUCxcbiAgfSxcbn0pO1xuXG5leHBvcnQgY29uc3QgaXRlcmF0ZSA9IF9pdGVyYXRlO1xuXG5leHBvcnQgZnVuY3Rpb24gY2hpbGRyZW5EaWZmZXIoX2NoaWxkcmVuMSwgX2NoaWxkcmVuMikge1xuICBsZXQgY2hpbGRyZW4xID0gKCFBcnJheS5pc0FycmF5KF9jaGlsZHJlbjEpKSA/IFsgX2NoaWxkcmVuMSBdIDogX2NoaWxkcmVuMTtcbiAgbGV0IGNoaWxkcmVuMiA9ICghQXJyYXkuaXNBcnJheShfY2hpbGRyZW4yKSkgPyBbIF9jaGlsZHJlbjIgXSA6IF9jaGlsZHJlbjI7XG5cbiAgcmV0dXJuIChkZWFkYmVlZiguLi5jaGlsZHJlbjEpICE9PSBkZWFkYmVlZiguLi5jaGlsZHJlbjIpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoRGVlcFByb3BlcnR5KG9iaiwgX2tleSwgZGVmYXVsdFZhbHVlLCBsYXN0UGFydCkge1xuICBpZiAob2JqID09IG51bGwgfHwgT2JqZWN0LmlzKE5hTiwgb2JqKSB8fCBPYmplY3QuaXMoSW5maW5pdHksIG9iaikpXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgbnVsbCBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGlmIChfa2V5ID09IG51bGwgfHwgT2JqZWN0LmlzKE5hTiwgX2tleSkgfHwgT2JqZWN0LmlzKEluZmluaXR5LCBfa2V5KSlcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBudWxsIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgbGV0IHBhcnRzO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KF9rZXkpKSB7XG4gICAgcGFydHMgPSBfa2V5O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBfa2V5ID09PSAnc3ltYm9sJykge1xuICAgIHBhcnRzID0gWyBfa2V5IF07XG4gIH0gZWxzZSB7XG4gICAgbGV0IGtleSAgICAgICAgID0gKCcnICsgX2tleSk7XG4gICAgbGV0IGxhc3RJbmRleCAgID0gMDtcbiAgICBsZXQgbGFzdEN1cnNvciAgPSAwO1xuXG4gICAgcGFydHMgPSBbXTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgbGV0IGluZGV4ID0ga2V5LmluZGV4T2YoJy4nLCBsYXN0SW5kZXgpO1xuICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICBwYXJ0cy5wdXNoKGtleS5zdWJzdHJpbmcobGFzdEN1cnNvcikpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKGtleS5jaGFyQXQoaW5kZXggLSAxKSA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHBhcnRzLnB1c2goa2V5LnN1YnN0cmluZyhsYXN0Q3Vyc29yLCBpbmRleCkpO1xuICAgICAgbGFzdEN1cnNvciA9IGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICB9XG4gIH1cblxuICBsZXQgcGFydE4gPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBwYXJ0TiBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGxldCBjdXJyZW50VmFsdWUgPSBvYmo7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IHBhcnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQga2V5ID0gcGFydHNbaV07XG5cbiAgICBjdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWVba2V5XTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09IG51bGwpXG4gICAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBwYXJ0TiBdIDogZGVmYXVsdFZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGN1cnJlbnRWYWx1ZSwgcGFydE4gXSA6IGN1cnJlbnRWYWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmRNZXRob2RzKF9wcm90bywgc2tpcFByb3Rvcykge1xuICBsZXQgcHJvdG8gICAgICAgICAgID0gX3Byb3RvO1xuICBsZXQgYWxyZWFkeVZpc2l0ZWQgID0gbmV3IFNldCgpO1xuXG4gIHdoaWxlIChwcm90bykge1xuICAgIGxldCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHByb3RvKTtcbiAgICBsZXQga2V5cyAgICAgICAgPSBPYmplY3Qua2V5cyhkZXNjcmlwdG9ycykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZGVzY3JpcHRvcnMpKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICBpZiAoa2V5ID09PSAnY29uc3RydWN0b3InKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKGFscmVhZHlWaXNpdGVkLmhhcyhrZXkpKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgYWxyZWFkeVZpc2l0ZWQuYWRkKGtleSk7XG5cbiAgICAgIGxldCB2YWx1ZSA9IHByb3RvW2tleV07XG5cbiAgICAgIC8vIFNraXAgcHJvdG90eXBlIG9mIE9iamVjdFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvdHlwZS1idWlsdGluc1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBPYmplY3QucHJvdG90eXBlW2tleV0gPT09IHZhbHVlKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHRoaXNba2V5XSA9IHZhbHVlLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgIGlmIChwcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSlcbiAgICAgIGJyZWFrO1xuXG4gICAgaWYgKHNraXBQcm90b3MgJiYgc2tpcFByb3Rvcy5pbmRleE9mKHByb3RvKSA+PSAwKVxuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBOYU4pKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChpbnN0YW5jZU9mKHZhbHVlLCAnc3RyaW5nJykpXG4gICAgcmV0dXJuICEoL1xcUy8pLnRlc3QodmFsdWUpO1xuICBlbHNlIGlmIChpbnN0YW5jZU9mKHZhbHVlLCAnbnVtYmVyJykgJiYgaXNGaW5pdGUodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZiAoIWluc3RhbmNlT2YodmFsdWUsICdib29sZWFuJywgJ2JpZ2ludCcsICdmdW5jdGlvbicpICYmIHNpemVPZih2YWx1ZSkgPT09IDApXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNOb3RFbXB0eSh2YWx1ZSkge1xuICByZXR1cm4gIWlzRW1wdHkuY2FsbCh0aGlzLCB2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmbGF0dGVuQXJyYXkodmFsdWUpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICByZXR1cm4gdmFsdWU7XG5cbiAgbGV0IG5ld0FycmF5ID0gW107XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQgaXRlbSA9IHZhbHVlW2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKVxuICAgICAgbmV3QXJyYXkgPSBuZXdBcnJheS5jb25jYXQoZmxhdHRlbkFycmF5KGl0ZW0pKTtcbiAgICBlbHNlXG4gICAgICBuZXdBcnJheS5wdXNoKGl0ZW0pO1xuICB9XG5cbiAgcmV0dXJuIG5ld0FycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZENoaWxkKGNoaWxkKSB7XG4gIGlmIChjaGlsZCA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGNoaWxkID09PSAnYm9vbGVhbicpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXMoY2hpbGQsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyhjaGlsZCwgTmFOKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwgfHwgT2JqZWN0LmlzKGNoaWxkLCBOYU4pIHx8IE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gKEFycmF5LmlzQXJyYXkoY2hpbGQpIHx8IHR5cGVvZiBjaGlsZCA9PT0gJ29iamVjdCcgJiYgIWluc3RhbmNlT2YoY2hpbGQsICdib29sZWFuJywgJ251bWJlcicsICdzdHJpbmcnKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3coKSB7XG4gIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICBlbHNlXG4gICAgcmV0dXJuIERhdGUubm93KCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7XG4gIGlmICh1dWlkID4gOTk5OTk5OSlcbiAgICB1dWlkID0gMTAwMDAwMDtcblxuICByZXR1cm4gYCR7RGF0ZS5ub3coKX0uJHt1dWlkKyt9JHtNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCkudG9TdHJpbmcoKS5wYWRTdGFydCgyMCwgJzAnKX1gO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcblx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG5cdHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG5cdH1cbn0pKCk7IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7XG4gIEpJQl9CQVJSRU4sXG4gIEpJQl9QUk9YWSxcbiAgSklCX1JBV19URVhULFxuICBKSUIsXG4gIEppYixcbiAgZmFjdG9yeSxcbiAgJCxcbiAgaXNKaWJpc2gsXG4gIGNvbnN0cnVjdEppYixcbiAgcmVzb2x2ZUNoaWxkcmVuLFxufSBmcm9tICcuL2ppYi5qcyc7XG5cbmV4cG9ydCBjb25zdCBKaWJzID0ge1xuICBKSUJfQkFSUkVOLFxuICBKSUJfUFJPWFksXG4gIEpJQl9SQVdfVEVYVCxcbiAgSklCLFxuICBKaWIsXG4gIGlzSmliaXNoLFxuICBjb25zdHJ1Y3RKaWIsXG4gIHJlc29sdmVDaGlsZHJlbixcbn07XG5cbmltcG9ydCB7XG4gIFVQREFURV9FVkVOVCxcbiAgUVVFVUVfVVBEQVRFX01FVEhPRCxcbiAgRkxVU0hfVVBEQVRFX01FVEhPRCxcbiAgSU5JVF9NRVRIT0QsXG4gIFNLSVBfU1RBVEVfVVBEQVRFUyxcbiAgUEVORElOR19TVEFURV9VUERBVEUsXG4gIExBU1RfUkVOREVSX1RJTUUsXG4gIFBSRVZJT1VTX1NUQVRFLFxuXG4gIENvbXBvbmVudCxcbn0gZnJvbSAnLi9jb21wb25lbnQuanMnO1xuXG5leHBvcnQgY29uc3QgQ29tcG9uZW50cyA9IHtcbiAgVVBEQVRFX0VWRU5ULFxuICBRVUVVRV9VUERBVEVfTUVUSE9ELFxuICBGTFVTSF9VUERBVEVfTUVUSE9ELFxuICBJTklUX01FVEhPRCxcbiAgU0tJUF9TVEFURV9VUERBVEVTLFxuICBQRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRSxcbiAgUFJFVklPVVNfU1RBVEUsXG59O1xuXG5pbXBvcnQge1xuICBGT1JDRV9SRUZMT1csXG4gIFJvb3ROb2RlLFxuICBSZW5kZXJlcixcbn0gZnJvbSAnLi9yZW5kZXJlcnMvaW5kZXguanMnO1xuXG5leHBvcnQgY29uc3QgUmVuZGVyZXJzID0ge1xuICBDT05URVhUX0lEOiBSb290Tm9kZS5DT05URVhUX0lELFxuICBGT1JDRV9SRUZMT1csXG4gIFJvb3ROb2RlLFxuICBSZW5kZXJlcixcbn07XG5cbmV4cG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vdXRpbHMuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBkZWFkYmVlZiB9IGZyb20gJ2RlYWRiZWVmJztcblxuZXhwb3J0IHtcbiAgZmFjdG9yeSxcbiAgJCxcbiAgQ29tcG9uZW50LFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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OztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQOztBQUVBLHdFQUF3RTtBQUN4RTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLG9FQUFvRSxNQUFNOztBQUUxRTtBQUNBLFNBQVM7QUFDVCxPQUFPO0FBQ1AsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHdDQUF3QyxRQUFRO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxpRUFBaUUsTUFBTTs7QUFFdkU7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esd0VBQXdFLE1BQU07O0FBRTlFO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHNDQUFzQyxRQUFRO0FBQzlDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsU0FBUzs7QUFFVCw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSwwQ0FBMEMsUUFBUTtBQUNsRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOENBQThDLFFBQVE7QUFDdEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSwwQ0FBMEMsUUFBUTtBQUNsRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEIsT0FBTztBQUNQOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FB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QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCw4QkFBOEI7QUFDOUIsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsVUFBVSxjQUFjLGlCQUFpQjtBQUN6Qzs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsTUFBTTtBQUNOO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGdDQUFtQjs7QUFFckYsZ0NBQW1CO0FBQ25CLHFCQUFxQixnQ0FBbUI7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QixpRUFBaUUsZ0NBQW1CO0FBQ3BGOzs7QUFHQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsMENBQTBDLFNBQVM7QUFDbkQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEscUNBQXFDLFFBQVE7QUFDN0M7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQjtBQUNwQjs7QUFFQTtBQUNBOztBQUVBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHFDQUFxQyxRQUFRO0FBQzdDOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxzQ0FBc0MsUUFBUTtBQUM5QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWSxXQUFXLEdBQUcsT0FBTyxFQUFFLGtFQUFrRTtBQUNyRzs7O0FBR0EsT0FBTzs7QUFFUCxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixnQ0FBbUI7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxRkFBcUYsZ0NBQW1CO0FBQ3hHO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVUsZ0NBQW1CO0FBQzdCO0FBQ0EsZUFBZSxnQ0FBbUIsd0JBQXdCLGdDQUFtQjtBQUM3RSxtREFBbUQsd0NBQXdDO0FBQzNGO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxVQUFVLGdDQUFtQjtBQUM3QjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFdBQVc7QUFDWCxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0EsVUFBVSxnQ0FBbUI7QUFDN0IsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSxnQ0FBbUI7QUFDN0I7QUFDQSxpRUFBaUUsaUJBQWlCO0FBQ2xGO0FBQ0EsMERBQTBELGFBQWE7QUFDdkU7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdDQUFtQjtBQUNuQixxQkFBcUIsZ0NBQW1CO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEIsZ0VBQWdFLGdDQUFtQjtBQUNuRixzRUFBc0UsZ0NBQW1CO0FBQ3pGLDRFQUE0RSxnQ0FBbUI7QUFDL0Ysa0VBQWtFLGdDQUFtQjtBQUNyRixpRUFBaUUsZ0NBQW1COzs7QUFHcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQU9BLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUM0VDs7QUFFNVQsMkNBQTJDLGNBQWM7Ozs7OztTQzMzRHpEO1NBQ0E7O1NBRUE7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7O1NBRUE7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7Ozs7O1VDdEJBO1VBQ0E7VUFDQTtVQUNBO1VBQ0EseUNBQXlDLHdDQUF3QztVQUNqRjtVQUNBO1VBQ0E7Ozs7O1VDUEE7Ozs7O1VDQUE7VUFDQTtVQUNBO1VBQ0EsdURBQXVELGlCQUFpQjtVQUN4RTtVQUNBLGdEQUFnRCxhQUFhO1VBQzdEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNOZ0Q7QUFDM0IiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9jb21wb25lbnQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9kb20tcmVuZGVyZXIuanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi9saWIvZnJhZ21lbnQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9uYXRpdmUtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9wb3J0YWwtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi90ZXh0LW5vZGUuanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi4vamlicy9kaXN0L2luZGV4LmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSmlicyxcbiAgQ29tcG9uZW50cyxcbiAgUmVuZGVyZXJzLFxuICBVdGlscyxcbn0gZnJvbSAnamlicyc7XG5cbmNvbnN0IHtcbiAgSklCX1BST1hZLFxufSA9IEppYnM7XG5cbmNvbnN0IHtcbiAgQ09OVEVYVF9JRCxcbiAgUm9vdE5vZGUsXG59ID0gUmVuZGVyZXJzO1xuXG5jb25zdCB7XG4gIElOSVRfTUVUSE9ELFxuICBVUERBVEVfRVZFTlQsXG4gIFBFTkRJTkdfU1RBVEVfVVBEQVRFLFxuICBMQVNUX1JFTkRFUl9USU1FLFxuICBTS0lQX1NUQVRFX1VQREFURVMsXG59ID0gQ29tcG9uZW50cztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5vZGUgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gMjA7XG5cbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHN1cGVyKC4uLmFyZ3MpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ2ZyYWdtZW50Tm9kZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAnY29tcG9uZW50Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdwZW5kaW5nQ29udGV4dFVwZGF0ZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAncHJldmlvdXNTdGF0ZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9LFxuICAgICAgJ2xhc3RDb250ZXh0SUQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgICAgICB2YWx1ZTogICAgICAgIHRoaXMuY29udGV4dFtDT05URVhUX0lEXSB8fCAxbixcbiAgICAgIH0sXG4gICAgICAnY2FjaGVkUmVuZGVyUmVzdWx0Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIGlmICghdGhpcy5mcmFnbWVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gdGhpcy5mcmFnbWVudE5vZGUuZ2V0Q2hpbGRyZW5Ob2RlcygpO1xuICB9XG5cbiAgbWVyZ2VDb21wb25lbnRQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIG9sZFByb3BzIHx8IHt9LCBuZXdQcm9wcyk7XG4gICAgcmV0dXJuIHByb3BzO1xuICB9XG5cbiAgZmlyZVByb3BVcGRhdGVzKF9vbGRQcm9wcywgX25ld1Byb3BzKSB7XG4gICAgbGV0IG5ld1Byb3BzICAgID0gX25ld1Byb3BzIHx8IHt9O1xuICAgIGxldCBhbGxQcm9wS2V5cyA9IG5ldyBTZXQoT2JqZWN0LmtleXMobmV3UHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG5ld1Byb3BzKSkpO1xuXG4gICAgbGV0IG9sZFByb3BzICAgID0gX29sZFByb3BzIHx8IHt9O1xuICAgIGxldCBvbGRQcm9wS2V5cyA9IE9iamVjdC5rZXlzKG9sZFByb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvbGRQcm9wcykpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IG9sZFByb3BLZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgICBhbGxQcm9wS2V5cy5hZGQob2xkUHJvcEtleXNbaV0pO1xuXG4gICAgZm9yIChsZXQga2V5IG9mIGFsbFByb3BLZXlzKSB7XG4gICAgICBsZXQgb2xkVmFsdWUgID0gb2xkUHJvcHNba2V5XTtcbiAgICAgIGxldCBuZXdWYWx1ZSAgPSBuZXdQcm9wc1trZXldO1xuXG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKVxuICAgICAgICB0aGlzLmNvbXBvbmVudC5vblByb3BVcGRhdGVkKGtleSwgbmV3VmFsdWUsIG9sZFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRSZW5kZXIobmV3UHJvcHMsIG5ld0NoaWxkcmVuKSB7XG4gICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50O1xuICAgIGlmICghY29tcG9uZW50KVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodGhpcy5sYXN0Q29udGV4dElEIDwgdGhpcy5jb250ZXh0W0NPTlRFWFRfSURdKSB7XG4gICAgICB0aGlzLmxhc3RDb250ZXh0SUQgPSB0aGlzLmNvbnRleHRbQ09OVEVYVF9JRF07XG4gICAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2hpbGRyZW5EaWZmZXIoY29tcG9uZW50LmNoaWxkcmVuLCBuZXdDaGlsZHJlbikpIHtcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbXBvbmVudC5zdGF0ZSk7XG5cbiAgICAgIHRoaXMuZmlyZVByb3BVcGRhdGVzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuICAgICAgY29tcG9uZW50LnByb3BzID0gdGhpcy5tZXJnZUNvbXBvbmVudFByb3BzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNTdGF0ZSA9IHRoaXMucHJldmlvdXNTdGF0ZSB8fCB7fTtcbiAgICBsZXQgcHJvcHNEaWZmZXIgICA9IHRoaXMucHJvcHNEaWZmZXIoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcywgWyAncmVmJywgJ2tleScgXSwgdHJ1ZSk7XG4gICAgaWYgKHByb3BzRGlmZmVyICYmIGNvbXBvbmVudC5zaG91bGRVcGRhdGUobmV3UHJvcHMsIHByZXZpb3VzU3RhdGUpKSB7XG4gICAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgbGV0IHN0YXRlRGlmZmVycyA9IHRoaXMucHJvcHNEaWZmZXIocHJldmlvdXNTdGF0ZSwgY29tcG9uZW50LnN0YXRlKTtcbiAgICBpZiAoc3RhdGVEaWZmZXJzICYmIGNvbXBvbmVudC5zaG91bGRVcGRhdGUobmV3UHJvcHMsIHByZXZpb3VzU3RhdGUpKSB7XG4gICAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveSgpIHtcbiAgICBpZiAodGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5kZXN0cm95aW5nID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLmNvbXBvbmVudCkge1xuICAgICAgaWYgKHRoaXMuamliICYmIHRoaXMuamliLnByb3BzICYmIHR5cGVvZiB0aGlzLmppYi5wcm9wcy5yZWYgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRoaXMuamliLnByb3BzLnJlZi5jYWxsKHRoaXMuY29tcG9uZW50LCBudWxsLCB0aGlzLmNvbXBvbmVudCk7XG5cbiAgICAgIGF3YWl0IHRoaXMuY29tcG9uZW50LmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuY29tcG9uZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5mcmFnbWVudE5vZGUpIHtcbiAgICAgIHRoaXMucmVtb3ZlQ2hpbGQodGhpcy5mcmFnbWVudE5vZGUpO1xuXG4gICAgICBhd2FpdCB0aGlzLmZyYWdtZW50Tm9kZS5kZXN0cm95KCk7XG4gICAgICB0aGlzLmZyYWdtZW50Tm9kZSA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5jYWNoZWRSZW5kZXJSZXN1bHQgPSBudWxsO1xuICAgIHRoaXMucHJldmlvdXNTdGF0ZSA9IG51bGw7XG5cbiAgICByZXR1cm4gYXdhaXQgc3VwZXIuZGVzdHJveSh0cnVlKTtcbiAgfVxuXG4gIG9uQ29udGV4dFVwZGF0ZSgpIHtcbiAgICBpZiAoIXRoaXMuY29tcG9uZW50IHx8IHRoaXMuY29tcG9uZW50W1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybjtcblxuICAgIGlmICh0aGlzLnBlbmRpbmdDb250ZXh0VXBkYXRlKVxuICAgICAgcmV0dXJuIHRoaXMucGVuZGluZ0NvbnRleHRVcGRhdGU7XG5cbiAgICB0aGlzLnBlbmRpbmdDb250ZXh0VXBkYXRlID0gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8ICF0aGlzLmNvbXBvbmVudCB8fCB0aGlzLmNvbXBvbmVudFtQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICAgIHJldHVybjtcblxuICAgICAgdGhpcy5wZW5kaW5nQ29udGV4dFVwZGF0ZSA9IG51bGw7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMucGVuZGluZ0NvbnRleHRVcGRhdGU7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgYXN5bmMgX3JlbmRlcigpIHtcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgbGV0IHsgVHlwZTogQ29tcG9uZW50Q2xhc3MsIHByb3BzLCBjaGlsZHJlbiB9ID0gKHRoaXMuamliIHx8IHt9KTtcbiAgICBpZiAoIUNvbXBvbmVudENsYXNzKVxuICAgICAgcmV0dXJuO1xuXG4gICAgY2hpbGRyZW4gPSB0aGlzLmppYi5jaGlsZHJlbiA9IGF3YWl0IHRoaXMucmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKTtcblxuICAgIGNvbnN0IGZpbmFsaXplUmVuZGVyID0gYXN5bmMgKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lIHx8ICF0aGlzLmNvbXBvbmVudClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLmNhY2hlZFJlbmRlclJlc3VsdCA9IHJlbmRlclJlc3VsdDtcblxuICAgICAgdGhpcy5jb21wb25lbnRbTEFTVF9SRU5ERVJfVElNRV0gPSBVdGlscy5ub3coKTtcblxuICAgICAgbGV0IGZyYWdtZW50Tm9kZSA9IHRoaXMuZnJhZ21lbnROb2RlO1xuICAgICAgbGV0IGZyYWdtZW50SmliID0geyBUeXBlOiBKSUJfUFJPWFksIHByb3BzOiB7fSwgY2hpbGRyZW46IHJlbmRlclJlc3VsdCB9O1xuXG4gICAgICBpZiAoIWZyYWdtZW50Tm9kZSkge1xuICAgICAgICBmcmFnbWVudE5vZGUgPSB0aGlzLmZyYWdtZW50Tm9kZSA9IHRoaXMucmVuZGVyZXIuY29uc3RydWN0Tm9kZUZyb21KaWIoZnJhZ21lbnRKaWIsIHRoaXMsIHRoaXMuY29udGV4dCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoZnJhZ21lbnROb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZyYWdtZW50Tm9kZS51cGRhdGVKaWIoZnJhZ21lbnRKaWIpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBmcmFnbWVudE5vZGUucmVuZGVyKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGhhbmRsZVJlbmRlckVycm9yID0gKGVycm9yKSA9PiB7XG4gICAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcblxuICAgICAgaWYgKHRoaXMuY29tcG9uZW50KVxuICAgICAgICB0aGlzLmNvbXBvbmVudFtMQVNUX1JFTkRFUl9USU1FXSA9IFV0aWxzLm5vdygpO1xuXG4gICAgICBsZXQgcmVuZGVyUmVzdWx0O1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5jb21wb25lbnQgJiYgdHlwZW9mIHRoaXMuY29tcG9uZW50LnJlbmRlckVycm9yU3RhdGUgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgcmVuZGVyUmVzdWx0ID0gdGhpcy5jb21wb25lbnQucmVuZGVyRXJyb3JTdGF0ZShlcnJvcik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZW5kZXJSZXN1bHQgPSBbIGAke2Vycm9yLm1lc3NhZ2V9XFxuJHtlcnJvci5zdGFja31gIF07XG4gICAgICB9IGNhdGNoIChlcnJvcjIpIHtcbiAgICAgICAgcmVuZGVyUmVzdWx0ID0gWyBgJHtlcnJvci5tZXNzYWdlfVxcbiR7ZXJyb3Iuc3RhY2t9YCBdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmluYWxpemVSZW5kZXIocmVuZGVyUmVzdWx0LCByZW5kZXJGcmFtZSk7XG4gICAgfTtcblxuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudCAmJiAhdGhpcy5zaG91bGRSZW5kZXIocHJvcHMsIGNoaWxkcmVuKSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnQ7XG4gICAgICBpZiAoIWNvbXBvbmVudCkge1xuICAgICAgICBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudCA9IG5ldyBDb21wb25lbnRDbGFzcyh7IC4uLih0aGlzLmppYiB8fCB7fSksIHByb3BzOiB0aGlzLm1lcmdlQ29tcG9uZW50UHJvcHMobnVsbCwgcHJvcHMpLCBjb250ZXh0OiB0aGlzLmNvbnRleHQsIGlkOiB0aGlzLmlkIH0pO1xuICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudFtJTklUX01FVEhPRF0gPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgY29tcG9uZW50W0lOSVRfTUVUSE9EXSgpO1xuXG4gICAgICAgIGNvbXBvbmVudC5vbihVUERBVEVfRVZFTlQsIChwdXNoZWRSZW5kZXJSZXN1bHQpID0+IHtcbiAgICAgICAgICBpZiAocHVzaGVkUmVuZGVyUmVzdWx0KSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckZyYW1lKys7XG4gICAgICAgICAgICBmaW5hbGl6ZVJlbmRlcihwdXNoZWRSZW5kZXJSZXN1bHQsIHRoaXMucmVuZGVyRnJhbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHByb3BzICYmIHR5cGVvZiBwcm9wcy5yZWYgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgcHJvcHMucmVmLmNhbGwoY29tcG9uZW50LCBjb21wb25lbnQsIG51bGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYW5jZWwgYW55IHBlbmRpbmcgc3RhdGUgdXBkYXRlc1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50W1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgICAgdGhpcy5jb21wb25lbnRbUEVORElOR19TVEFURV9VUERBVEVdID0gbnVsbDtcblxuICAgICAgbGV0IHJlbmRlclJlc3VsdCA9IHRoaXMuY29tcG9uZW50LnJlbmRlcihjaGlsZHJlbik7XG4gICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihyZW5kZXJSZXN1bHQsICdwcm9taXNlJykpIHtcbiAgICAgICAgbGV0IHdhaXRpbmdSZW5kZXJSZXN1bHQgPSB0aGlzLmNvbXBvbmVudC5yZW5kZXJXYWl0aW5nKHRoaXMuY2FjaGVkUmVuZGVyUmVzdWx0KTtcbiAgICAgICAgbGV0IHJlbmRlckNvbXBsZXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGxldCBsb2FkaW5nVGltZXIgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICBsb2FkaW5nVGltZXIgPSBudWxsO1xuXG4gICAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2Yod2FpdGluZ1JlbmRlclJlc3VsdCwgJ3Byb21pc2UnKSlcbiAgICAgICAgICAgIHdhaXRpbmdSZW5kZXJSZXN1bHQgPSBhd2FpdCB3YWl0aW5nUmVuZGVyUmVzdWx0O1xuXG4gICAgICAgICAgaWYgKHJlbmRlckNvbXBsZXRlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgIGF3YWl0IGZpbmFsaXplUmVuZGVyKHdhaXRpbmdSZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICAgICAgfSwgNSk7XG5cbiAgICAgICAgYXdhaXQgcmVuZGVyUmVzdWx0LnRoZW4oYXN5bmMgKHJlbmRlclJlc3VsdCkgPT4ge1xuICAgICAgICAgIHJlbmRlckNvbXBsZXRlZCA9IHRydWU7XG5cbiAgICAgICAgICBpZiAobG9hZGluZ1RpbWVyKSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQobG9hZGluZ1RpbWVyKTtcbiAgICAgICAgICAgIGxvYWRpbmdUaW1lciA9IG51bGw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXdhaXQgZmluYWxpemVSZW5kZXIocmVuZGVyUmVzdWx0LCByZW5kZXJGcmFtZSk7XG4gICAgICAgIH0pLmNhdGNoKGhhbmRsZVJlbmRlckVycm9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGZpbmFsaXplUmVuZGVyKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBhd2FpdCBoYW5kbGVSZW5kZXJFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZGVzdHJveUZyb21ET00oKSB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJlbnROb2RlLmRlc3Ryb3lGcm9tRE9NKHRoaXMucGFyZW50Tm9kZS5jb250ZXh0LCB0aGlzLnBhcmVudE5vZGUpO1xuICB9XG5cbiAgYXN5bmMgc3luY0RPTSgpIHtcbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnBhcmVudE5vZGUuc3luY0RPTSh0aGlzLnBhcmVudE5vZGUuY29udGV4dCwgdGhpcy5wYXJlbnROb2RlKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgSmlicyxcbiAgUmVuZGVyZXJzLFxufSBmcm9tICdqaWJzJztcblxuaW1wb3J0IHsgRnJhZ21lbnROb2RlIH0gICAgIGZyb20gJy4vZnJhZ21lbnQtbm9kZS5qcyc7XG5pbXBvcnQgeyBUZXh0Tm9kZSB9ICAgICAgICAgZnJvbSAnLi90ZXh0LW5vZGUuanMnO1xuaW1wb3J0IHsgTmF0aXZlTm9kZSB9ICAgICAgIGZyb20gJy4vbmF0aXZlLW5vZGUuanMnO1xuaW1wb3J0IHsgUG9ydGFsTm9kZSB9ICAgICAgIGZyb20gJy4vcG9ydGFsLW5vZGUuanMnO1xuaW1wb3J0IHsgQ29tcG9uZW50Tm9kZSB9ICAgIGZyb20gJy4vY29tcG9uZW50LW5vZGUuanMnO1xuXG5jb25zdCB7XG4gIFJlbmRlcmVyLFxufSA9IFJlbmRlcmVycztcblxuY29uc3Qge1xuICBKSUJfUFJPWFksXG4gIEpJQl9SQVdfVEVYVCxcbn0gPSBKaWJzO1xuXG5jb25zdCBTS0lQX1VQREFURVMgPSB0cnVlO1xuXG5leHBvcnQgY2xhc3MgRE9NUmVuZGVyZXIgZXh0ZW5kcyBSZW5kZXJlciB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gOTtcblxuICBzdGF0aWMgRnJhZ21lbnROb2RlID0gRnJhZ21lbnROb2RlO1xuXG4gIHN0YXRpYyBUZXh0Tm9kZSA9IFRleHROb2RlO1xuXG4gIHN0YXRpYyBOYXRpdmVOb2RlID0gTmF0aXZlTm9kZTtcblxuICBzdGF0aWMgUG9ydGFsTm9kZSA9IFBvcnRhbE5vZGU7XG5cbiAgc3RhdGljIENvbXBvbmVudE5vZGUgPSBDb21wb25lbnROb2RlO1xuXG4gIGNvbnN0cnVjdG9yKHJvb3RFbGVtZW50U2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ29wdGlvbnMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgb3B0aW9ucyB8fCB7fSxcbiAgICAgIH0sXG4gICAgICAncm9vdE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ2ppYic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgeyBUeXBlOiByb290RWxlbWVudFNlbGVjdG9yLCBwcm9wczoge30sIGNoaWxkcmVuOiBbXSB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGlzUG9ydGFsTm9kZSh0eXBlKSB7XG4gICAgcmV0dXJuICgvW15hLXpBLVowLTk6XS8pLnRlc3QodHlwZSk7XG4gIH1cblxuICBjb25zdHJ1Y3ROb2RlRnJvbUppYihqaWIsIHBhcmVudCwgY29udGV4dCkge1xuICAgIGxldCB7IFR5cGUgfSA9IGppYjtcbiAgICBpZiAodHlwZW9mIFR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5Db21wb25lbnROb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKHRoaXMuaXNQb3J0YWxOb2RlKFR5cGUpKVxuICAgICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuUG9ydGFsTm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQsIGppYik7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5OYXRpdmVOb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9IGVsc2UgaWYgKFR5cGUgPT0gbnVsbCB8fCBUeXBlID09PSBKSUJfUFJPWFkpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5GcmFnbWVudE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0LCBqaWIpO1xuICAgIH0gZWxzZSBpZiAoVHlwZSA9PT0gSklCX1JBV19URVhUKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuVGV4dE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0LCBqaWIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5yb290Tm9kZSkge1xuICAgICAgYXdhaXQgdGhpcy5yb290Tm9kZS5kZXN0cm95KCk7XG4gICAgICB0aGlzLnJvb3ROb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgc3VwZXIuZGVzdHJveSh0cnVlKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcihjaGlsZHJlbikge1xuICAgIGlmICghY2hpbGRyZW4pXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OnJlbmRlcjogQSBqaWIgbXVzdCBiZSBwcm92aWRlZC5gKTtcblxuICAgIHRoaXMudXBkYXRlSmliKHtcbiAgICAgIC4uLnRoaXMuamliLFxuICAgICAgY2hpbGRyZW4sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3VwZXIucmVuZGVyKCk7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKCkge1xuICAgIGxldCByZW5kZXJGcmFtZSA9IHRoaXMucmVuZGVyRnJhbWU7XG4gICAgbGV0IHJvb3ROb2RlID0gdGhpcy5yb290Tm9kZTtcbiAgICBsZXQgZnJhZ21lbnRKaWIgPSB7IFR5cGU6IEpJQl9QUk9YWSwgcHJvcHM6IHt9LCBjaGlsZHJlbjogdGhpcy5qaWIgfTtcblxuICAgIGlmICghcm9vdE5vZGUpXG4gICAgICByb290Tm9kZSA9IHRoaXMucm9vdE5vZGUgPSB0aGlzLmNvbnN0cnVjdE5vZGVGcm9tSmliKHRoaXMuamliLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xuICAgIGVsc2VcbiAgICAgIHJvb3ROb2RlLnVwZGF0ZUppYihmcmFnbWVudEppYik7XG5cbiAgICBhd2FpdCByb290Tm9kZS5yZW5kZXIoKTtcbiAgICBpZiAocmVuZGVyRnJhbWUgPj0gdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgIHRoaXMuc3luY0RPTSh0aGlzLmNvbnRleHQsIHRoaXMucm9vdE5vZGUpO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveUZyb21ET00oY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChub2RlID09PSB0aGlzKSB7XG4gICAgICBpZiAoIXRoaXMucm9vdE5vZGUpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVzdHJveU5vZGUoY29udGV4dCwgdGhpcy5yb290Tm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZGVzdHJveU5vZGUoY29udGV4dCwgbm9kZSk7XG4gIH1cblxuICBhc3luYyBzeW5jRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAobm9kZSA9PT0gdGhpcykge1xuICAgICAgaWYgKCF0aGlzLnJvb3ROb2RlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnN5bmNOb2RlKGNvbnRleHQsIHRoaXMucm9vdE5vZGUpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnN5bmNOb2RlKGNvbnRleHQsIG5vZGUpO1xuICB9XG5cbiAgYXN5bmMgYWRkTm9kZShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgYXdhaXQgdGhpcy5hdHRhY2hDaGlsZHJlbihjb250ZXh0LCBub2RlKTtcblxuICAgIC8vIFRlbGwgb3VyIHBhcmVudCB0byByZW9yZGVyIGl0c2VsZlxuICAgIGxldCBwYXJlbnROb2RlID0gdGhpcy5wYXJlbnROb2RlO1xuICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAvLyBTa2lwIHVwZGF0ZXMsIGFzIHdlIGFyZW4ndCBtb2RpZnlpbmcgb3RoZXIgY2hpbGRyZW4uXG4gICAgICAvLyBKdXN0IGVuc3VyZSBwcm9wZXIgY2hpbGQgb3JkZXIuXG4gICAgICBhd2FpdCB0aGlzLmF0dGFjaENoaWxkcmVuKGNvbnRleHQsIHBhcmVudE5vZGUsIFNLSVBfVVBEQVRFUyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBjb25zdHJ1Y3ROYXRpdmVFbGVtZW50RnJvbU5vZGUoY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChub2RlLlRZUEUgPT09IE5hdGl2ZU5vZGUuVFlQRSlcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZU5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBUZXh0Tm9kZS5UWVBFKVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlVGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBQb3J0YWxOb2RlLlRZUEUgfHwgbm9kZS5UWVBFID09PSBET01SZW5kZXJlci5UWVBFKVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlUG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OmNvbnN0cnVjdE5hdGl2ZUVsZW1lbnRGcm9tTm9kZTogVW5zdXBwb3J0ZWQgdmlydHVhbCBlbGVtZW50IHR5cGUgZGV0ZWN0ZWQ6ICR7bm9kZS5UWVBFfWApO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlTm9kZShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHJlc3VsdDtcblxuICAgIGlmIChub2RlLlRZUEUgPT09IE5hdGl2ZU5vZGUuVFlQRSlcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMudXBkYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFRleHROb2RlLlRZUEUpXG4gICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLnVwZGF0ZVRleHRFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuVFlQRSA9PT0gUG9ydGFsTm9kZS5UWVBFIHx8IG5vZGUuVFlQRSA9PT0gRE9NUmVuZGVyZXIuVFlQRSlcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMudXBkYXRlUG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OnN5bmNOb2RlOiBVbnN1cHBvcnRlZCB2aXJ0dWFsIGVsZW1lbnQgdHlwZSBkZXRlY3RlZDogJHtub2RlLlRZUEV9YCk7XG5cbiAgICBhd2FpdCB0aGlzLmF0dGFjaENoaWxkcmVuKGNvbnRleHQsIG5vZGUpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHN5bmNOb2RlKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgbmF0aXZlRWxlbWVudCA9IChub2RlICYmIG5vZGUubmF0aXZlRWxlbWVudCk7XG4gICAgaWYgKCFuYXRpdmVFbGVtZW50KSB7XG4gICAgICBuYXRpdmVFbGVtZW50ID0gYXdhaXQgdGhpcy5jb25zdHJ1Y3ROYXRpdmVFbGVtZW50RnJvbU5vZGUoY29udGV4dCwgbm9kZSk7XG4gICAgICBpZiAobm9kZS5qaWIgJiYgbm9kZS5qaWIucHJvcHMgJiYgdHlwZW9mIG5vZGUuamliLnByb3BzLnJlZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgbm9kZS5qaWIucHJvcHMucmVmLmNhbGwobm9kZSwgbmF0aXZlRWxlbWVudCwgbnVsbCk7XG5cbiAgICAgIG5vZGUubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmFkZE5vZGUoY29udGV4dCwgbm9kZSk7XG4gICAgfSBlbHNlIGlmIChub2RlKSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGVOb2RlKGNvbnRleHQsIG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lOb2RlKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgbmF0aXZlRWxlbWVudCA9IChub2RlICYmIG5vZGUubmF0aXZlRWxlbWVudCk7XG4gICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgaWYgKG5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgIGlmIChub2RlLlRZUEUgPT09IE5hdGl2ZU5vZGUuVFlQRSlcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5kZXN0cm95TmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICAgIGVsc2UgaWYgKG5vZGUuVFlQRSA9PT0gVGV4dE5vZGUuVFlQRSlcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5kZXN0cm95VGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFBvcnRhbE5vZGUuVFlQRSB8fCBub2RlLlRZUEUgPT09IERPTVJlbmRlcmVyLlRZUEUpXG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuZGVzdHJveVBvcnRhbEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgICBlbHNlXG4gICAgICAgIG5ldyBUeXBlRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTo6c3luY05vZGU6IFVuc3VwcG9ydGVkIHZpcnR1YWwgZWxlbWVudCB0eXBlIGRldGVjdGVkOiAke25vZGUuVFlQRX1gKTtcbiAgICB9XG5cbiAgICBpZiAobm9kZSlcbiAgICAgIGF3YWl0IHRoaXMuZGV0YWNoQ2hpbGRyZW4oY29udGV4dCwgbm9kZSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZmluZE5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICB9XG5cbiAgY3JlYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogJ2VsZW1lbnQnLCB2YWx1ZTogbm9kZS52YWx1ZSB9O1xuICB9XG5cbiAgdXBkYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gIH1cblxuICBjcmVhdGVUZXh0RWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogJ3RleHQnLCB2YWx1ZTogbm9kZS52YWx1ZSB9O1xuICB9XG5cbiAgdXBkYXRlVGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNyZWF0ZVBvcnRhbEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICAgIHJldHVybiB7IHR5cGU6ICdwb3J0YWwnLCB2YWx1ZTogbm9kZS52YWx1ZSB9O1xuICB9XG5cbiAgdXBkYXRlUG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGVzdHJveU5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICB9XG5cbiAgZGVzdHJveVRleHRFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgfVxuXG4gIGRlc3Ryb3lQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgfVxuXG4gIGZvcmNlTmF0aXZlRWxlbWVudFJlZmxvdyhjb250ZXh0LCBub2RlLCBuYXRpdmVFbGVtZW50KSB7XG4gIH1cblxuICBhc3luYyBhdHRhY2hDaGlsZHJlbihjb250ZXh0LCBwYXJlbnROb2RlLCBvcmRlck9ubHkpIHtcbiAgICBsZXQgcGFyZW50TmF0aXZlRWxlbWVudCA9IChwYXJlbnROb2RlICYmIHBhcmVudE5vZGUubmF0aXZlRWxlbWVudCk7XG4gICAgaWYgKCFwYXJlbnROYXRpdmVFbGVtZW50KVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IG5hdGl2ZVBhcmVudENoaWxkTm9kZXMgPSBBcnJheS5mcm9tKHBhcmVudE5hdGl2ZUVsZW1lbnQuY2hpbGROb2Rlcyk7XG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICBsZXQgc2tpcE9yZGVyZWROb2RlcyA9IHRydWU7XG5cbiAgICBmb3IgKGxldCBjaGlsZE5vZGUgb2YgcGFyZW50Tm9kZS5nZXRDaGlsZHJlbk5vZGVzKCkpIHtcbiAgICAgIGxldCBjaGlsZE5hdGl2ZUVsZW1lbnQgPSBjaGlsZE5vZGUubmF0aXZlRWxlbWVudDtcbiAgICAgIGlmICghY2hpbGROYXRpdmVFbGVtZW50KVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKG9yZGVyT25seSAhPT0gdHJ1ZSlcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVOb2RlKGNvbnRleHQsIGNoaWxkTm9kZSk7XG5cbiAgICAgIC8vIFBlcmZvcm1hbmNlIGJvb3N0XG4gICAgICBpZiAoc2tpcE9yZGVyZWROb2Rlcykge1xuICAgICAgICBpZiAobmF0aXZlUGFyZW50Q2hpbGROb2Rlc1tpbmRleCsrXSA9PT0gY2hpbGROYXRpdmVFbGVtZW50KVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc2tpcE9yZGVyZWROb2RlcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBwYXJlbnROYXRpdmVFbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkTmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLmZvcmNlTmF0aXZlRWxlbWVudFJlZmxvdyhjb250ZXh0LCBjaGlsZE5vZGUsIGNoaWxkTmF0aXZlRWxlbWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBkZXRhY2hDaGlsZHJlbihjb250ZXh0LCBwYXJlbnROb2RlKSB7XG4gICAgbGV0IHBhcmVudE5hdGl2ZUVsZW1lbnQgPSAocGFyZW50Tm9kZSAmJiBwYXJlbnROb2RlLm5hdGl2ZUVsZW1lbnQpO1xuICAgIGlmICghcGFyZW50TmF0aXZlRWxlbWVudClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBkZXN0cm95UHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBjaGlsZE5vZGUgb2YgcGFyZW50Tm9kZS5nZXRDaGlsZHJlbk5vZGVzKCkpXG4gICAgICBkZXN0cm95UHJvbWlzZXMucHVzaCh0aGlzLmRlc3Ryb3lOb2RlKGNvbnRleHQsIGNoaWxkTm9kZSkpO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBKaWJzLFxuICBSZW5kZXJlcnMsXG4gIFV0aWxzLFxuICBkZWFkYmVlZixcbn0gZnJvbSAnamlicyc7XG5cbmNvbnN0IHtcbiAgaXNKaWJpc2gsXG4gIGNvbnN0cnVjdEppYixcbiAgSklCX1BST1hZLFxuICBKSUJfUkFXX1RFWFQsXG59ID0gSmlicztcblxuY29uc3Qge1xuICBSb290Tm9kZSxcbn0gPSBSZW5kZXJlcnM7XG5cbmV4cG9ydCBjbGFzcyBGcmFnbWVudE5vZGUgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gMTE7XG5cbiAgZ2V0VGhpc05vZGVPckNoaWxkTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2hpbGRyZW5Ob2RlcygpO1xuICB9XG5cbiAgYXN5bmMgX3JlbmRlcigpIHtcbiAgICBsZXQgaW5kZXhNYXAgICAgPSBuZXcgTWFwKCk7XG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcblxuICAgIGxldCB7IGNoaWxkcmVuIH0gPSAodGhpcy5qaWIgfHwge30pO1xuICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGNoaWxkcmVuLCAncHJvbWlzZScpKVxuICAgICAgY2hpbGRyZW4gPSBhd2FpdCBjaGlsZHJlbjtcblxuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKCF0aGlzLmlzSXRlcmFibGVDaGlsZChjaGlsZHJlbikgJiYgKGlzSmliaXNoKGNoaWxkcmVuKSB8fCB0aGlzLmlzVmFsaWRDaGlsZChjaGlsZHJlbikpKVxuICAgICAgY2hpbGRyZW4gPSBbIGNoaWxkcmVuIF07XG5cbiAgICBjb25zdCBnZXRJbmRleEZvclR5cGUgPSAoVHlwZSkgPT4ge1xuICAgICAgbGV0IGluZGV4ID0gKGluZGV4TWFwLmdldChUeXBlKSB8fCAwKSArIDE7XG4gICAgICBpbmRleE1hcC5zZXQoVHlwZSwgaW5kZXgpO1xuXG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfTtcblxuICAgIGxldCBsb29wU3RvcHBlZCA9IGZhbHNlO1xuICAgIGxldCBwcm9taXNlcyA9IFV0aWxzLml0ZXJhdGUoY2hpbGRyZW4sICh7IHZhbHVlOiBfY2hpbGQsIGtleSwgaW5kZXgsIFNUT1AgfSkgPT4ge1xuICAgICAgaWYgKGxvb3BTdG9wcGVkIHx8IHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgIHJldHVybiBTVE9QO1xuXG4gICAgICByZXR1cm4gKGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGNoaWxkID0gKFV0aWxzLmluc3RhbmNlT2YoX2NoaWxkLCAncHJvbWlzZScpKSA/IGF3YWl0IF9jaGlsZCA6IF9jaGlsZDtcbiAgICAgICAgaWYgKFV0aWxzLmlzRW1wdHkoY2hpbGQpIHx8IE9iamVjdC5pcyhjaGlsZCwgTmFOKSB8fCBPYmplY3QuaXMoY2hpbGQsIEluZmluaXR5KSlcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgbGV0IGlzSmliID0gaXNKaWJpc2goY2hpbGQpO1xuICAgICAgICBsZXQgY3JlYXRlZDtcbiAgICAgICAgbGV0IGppYjtcblxuICAgICAgICBpZiAoIWlzSmliICYmIHRoaXMuaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSkge1xuICAgICAgICAgIGppYiA9IHtcbiAgICAgICAgICAgIFR5cGU6ICAgICBKSUJfUFJPWFksXG4gICAgICAgICAgICBjaGlsZHJlbjogY2hpbGQsXG4gICAgICAgICAgICBwcm9wczogICAge1xuICAgICAgICAgICAgICBrZXk6IGBAamliL2ludGVybmFsX2ZyYWdtZW50XyR7Z2V0SW5kZXhGb3JUeXBlKEpJQl9QUk9YWSl9YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICghaXNKaWIgJiYgdGhpcy5pc1ZhbGlkQ2hpbGQoY2hpbGQpKSB7XG4gICAgICAgICAgY2hpbGQgPSAodHlwZW9mIGNoaWxkLnZhbHVlT2YgPT09ICdmdW5jdGlvbicpID8gY2hpbGQudmFsdWVPZigpIDogY2hpbGQ7XG4gICAgICAgICAgamliID0ge1xuICAgICAgICAgICAgVHlwZTogICAgIEpJQl9SQVdfVEVYVCxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBjaGlsZCxcbiAgICAgICAgICAgIHByb3BzOiAgICB7XG4gICAgICAgICAgICAgIGtleTogYEBqaWIvaW50ZXJuYWxfdGV4dF8ke2dldEluZGV4Rm9yVHlwZShKSUJfUkFXX1RFWFQpfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoaXNKaWIpIHtcbiAgICAgICAgICBqaWIgPSBjb25zdHJ1Y3RKaWIoY2hpbGQpO1xuICAgICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGppYiwgJ3Byb21pc2UnKSlcbiAgICAgICAgICAgIGppYiA9IGF3YWl0IGppYjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKSB7XG4gICAgICAgICAgbG9vcFN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB7IFR5cGUsIHByb3BzIH0gPSBqaWI7XG4gICAgICAgIGxldCBsb2NhbEtleTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSBrZXkpIC8vIEluZGV4IGlzIGFuIGludGVnZXIsIGFuZCBrZXkgaXMgYSBzdHJpbmcsIG1lYW5pbmcgdGhpcyBpcyBhbiBvYmplY3RcbiAgICAgICAgICBsb2NhbEtleSA9IGtleTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvY2FsS2V5ID0gKHByb3BzLmtleSA9PSBudWxsIHx8IE9iamVjdC5pcyhwcm9wcy5rZXksIE5hTikgfHwgT2JqZWN0LmlzKHByb3BzLmtleSwgSW5maW5pdHkpKSA/IGBAamliL2ludGVybmFsX2tleV8ke2dldEluZGV4Rm9yVHlwZShUeXBlKX1gIDogcHJvcHMua2V5O1xuXG4gICAgICAgIHByb3BzLmtleSA9IGxvY2FsS2V5O1xuICAgICAgICBqaWIucHJvcHMgPSBwcm9wcztcblxuICAgICAgICBsZXQgY2FjaGVLZXkgPSBkZWFkYmVlZihUeXBlLCBwcm9wcy5rZXkpO1xuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuZ2V0Q2hpbGQoY2FjaGVLZXkpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgIGNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgIG5vZGUgPSB0aGlzLnJlbmRlcmVyLmNvbnN0cnVjdE5vZGVGcm9tSmliKGppYiwgdGhpcywgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgbm9kZS51cGRhdGVKaWIoamliKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG5vZGUucmVuZGVyKCk7XG5cbiAgICAgICAgcmV0dXJuIHsgbm9kZSwgY2FjaGVLZXksIGNyZWF0ZWQgfTtcbiAgICAgIH0pKCk7XG4gICAgfSk7XG5cbiAgICBsZXQgcmVuZGVyUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICByZW5kZXJSZXN1bHRzID0gcmVuZGVyUmVzdWx0cy5maWx0ZXIoKHJlc3VsdCkgPT4gISFyZXN1bHQpO1xuXG4gICAgbGV0IGRlc3Ryb3lQcm9taXNlcyA9IFtdO1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSByZW5kZXJSZXN1bHRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHJlbmRlclJlc3VsdHNbaV07XG4gICAgICAgIGxldCB7IG5vZGUsIGNyZWF0ZWQgfSA9IHJlc3VsdDtcblxuICAgICAgICBpZiAoY3JlYXRlZCAmJiBub2RlKSB7XG4gICAgICAgICAgLy8gRGVzdHJveSBub2RlcyBzaW5jZSB0aGlzIHJlbmRlciB3YXMgcmVqZWN0ZWQuXG4gICAgICAgICAgLy8gQnV0IG9ubHkgbm9kZXMgdGhhdCB3ZXJlIGp1c3QgY3JlYXRlZC4uLlxuICAgICAgICAgIC8vIGFzIGV4aXN0aW5nIG5vZGVzIG1pZ2h0IHN0aWxsIG5lZWQgdG8gZXhpc3QuXG4gICAgICAgICAgZGVzdHJveVByb21pc2VzLnB1c2gobm9kZS5kZXN0cm95KCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChkZXN0cm95UHJvbWlzZXMubGVuZ3RoID4gMClcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFkZCBuZXcgY2hpbGRyZW4sIGFuZCBidWlsZCBhIG1hcFxuICAgIC8vIG9mIGNoaWxkcmVuIGp1c3QgYWRkZWQuXG4gICAgbGV0IG5vZGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgcmVuZGVyUmVzdWx0IG9mIHJlbmRlclJlc3VsdHMpIHtcbiAgICAgIGxldCB7IG5vZGUsIGNhY2hlS2V5IH0gPSByZW5kZXJSZXN1bHQ7XG5cbiAgICAgIG5vZGVNYXAuc2V0KGNhY2hlS2V5LCByZW5kZXJSZXN1bHQpO1xuICAgICAgdGhpcy5hZGRDaGlsZChub2RlKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgbm9kZXMgbm8gbG9uZ2VyIGluIHRoZSBmcmFnbWVudFxuICAgIGZvciAobGV0IFsgY2FjaGVLZXksIGNoaWxkTm9kZSBdIG9mIHRoaXMuY2hpbGROb2Rlcykge1xuICAgICAgbGV0IGhhc0NoaWxkID0gbm9kZU1hcC5oYXMoY2FjaGVLZXkpO1xuICAgICAgaWYgKCFoYXNDaGlsZCkge1xuICAgICAgICAvLyBUaGlzIG5vZGUgd2FzIGRlc3Ryb3llZFxuICAgICAgICBkZXN0cm95UHJvbWlzZXMucHVzaChjaGlsZE5vZGUuZGVzdHJveSgpKTtcbiAgICAgICAgdGhpcy5yZW1vdmVDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIG5vZGVNYXAuY2xlYXIoKTtcblxuICAgIGlmIChkZXN0cm95UHJvbWlzZXMubGVuZ3RoID4gMClcbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKGRlc3Ryb3lQcm9taXNlcyk7XG4gIH1cblxuICBhc3luYyBkZXN0cm95RnJvbURPTSgpIHtcbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnBhcmVudE5vZGUuZGVzdHJveUZyb21ET00odGhpcy5wYXJlbnROb2RlLmNvbnRleHQsIHRoaXMucGFyZW50Tm9kZSk7XG4gIH1cblxuICBhc3luYyBzeW5jRE9NKCkge1xuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyZW50Tm9kZS5zeW5jRE9NKHRoaXMucGFyZW50Tm9kZS5jb250ZXh0LCB0aGlzLnBhcmVudE5vZGUpO1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBKaWJzLFxuICBSZW5kZXJlcnMsXG59IGZyb20gJ2ppYnMnO1xuXG5jb25zdCB7XG4gIEpJQl9QUk9YWSxcbn0gPSBKaWJzO1xuXG5jb25zdCB7XG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuZXhwb3J0IGNsYXNzIE5hdGl2ZU5vZGUgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIHN0YXRpYyBUWVBFID0gMTtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnZnJhZ21lbnROb2RlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG4gICAgYXdhaXQgdGhpcy5kZXN0cm95RnJhZ21lbnROb2RlKCk7XG5cbiAgICByZXR1cm4gYXdhaXQgc3VwZXIuZGVzdHJveSh0cnVlKTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcmFnbWVudE5vZGUoKSB7XG4gICAgaWYgKCF0aGlzLmZyYWdtZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMucmVtb3ZlQ2hpbGQodGhpcy5mcmFnbWVudE5vZGUpO1xuXG4gICAgYXdhaXQgdGhpcy5mcmFnbWVudE5vZGUuZGVzdHJveSgpO1xuICAgIHRoaXMuZnJhZ21lbnROb2RlID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIF9yZW5kZXIoKSB7XG4gICAgbGV0IHtcbiAgICAgIFR5cGUsXG4gICAgICBwcm9wcyxcbiAgICAgIGNoaWxkcmVuLFxuICAgIH0gPSAodGhpcy5qaWIgfHwge30pO1xuXG4gICAgaWYgKCFUeXBlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocHJvcHMsICdpbm5lckhUTUwnKSkge1xuICAgICAgbGV0IGZyYWdtZW50SmliID0geyBUeXBlOiBKSUJfUFJPWFksIHByb3BzOiB7fSwgY2hpbGRyZW4gfTtcbiAgICAgIGxldCBmcmFnbWVudE5vZGUgPSB0aGlzLmZyYWdtZW50Tm9kZTtcblxuICAgICAgaWYgKCFmcmFnbWVudE5vZGUpIHtcbiAgICAgICAgZnJhZ21lbnROb2RlID0gdGhpcy5mcmFnbWVudE5vZGUgPSB0aGlzLnJlbmRlcmVyLmNvbnN0cnVjdE5vZGVGcm9tSmliKGZyYWdtZW50SmliLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKGZyYWdtZW50Tm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmZyYWdtZW50Tm9kZS51cGRhdGVKaWIoZnJhZ21lbnRKaWIpO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBmcmFnbWVudE5vZGUucmVuZGVyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHRoaXMuZGVzdHJveUZyYWdtZW50Tm9kZSgpO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgTmF0aXZlTm9kZSB9IGZyb20gJy4vbmF0aXZlLW5vZGUuanMnO1xuXG5leHBvcnQgY2xhc3MgUG9ydGFsTm9kZSBleHRlbmRzIE5hdGl2ZU5vZGUge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDE1O1xufVxuIiwiaW1wb3J0IHtcbiAgUmVuZGVyZXJzLFxufSBmcm9tICdqaWJzJztcblxuY29uc3Qge1xuICBSb290Tm9kZSxcbn0gPSBSZW5kZXJlcnM7XG5cbmV4cG9ydCBjbGFzcyBUZXh0Tm9kZSBleHRlbmRzIFJvb3ROb2RlIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgc3RhdGljIFRZUEUgPSAzO1xufVxuIiwiLyoqKioqKi8gdmFyIF9fd2VicGFja19tb2R1bGVzX18gPSAoe1xuXG4vKioqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fdW51c2VkX3dlYnBhY2tfZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG4vLyBDb3B5cmlnaHQgMjAyMiBXeWF0dCBHcmVlbndheVxuXG5cblxuY29uc3QgdGhpc0dsb2JhbCA9ICgodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogX193ZWJwYWNrX3JlcXVpcmVfXy5nKSB8fCB0aGlzO1xuY29uc3QgREVBREJFRUZfUkVGX01BUF9LRVkgPSBTeW1ib2wuZm9yKCdAQGRlYWRiZWVmUmVmTWFwJyk7XG5jb25zdCBVTklRVUVfSURfU1lNQk9MID0gU3ltYm9sLmZvcignQEBkZWFkYmVlZlVuaXF1ZUlEJyk7XG5jb25zdCByZWZNYXAgPSAodGhpc0dsb2JhbFtERUFEQkVFRl9SRUZfTUFQX0tFWV0pID8gdGhpc0dsb2JhbFtERUFEQkVFRl9SRUZfTUFQX0tFWV0gOiBuZXcgV2Vha01hcCgpO1xuY29uc3QgaWRIZWxwZXJzID0gW107XG5cbmlmICghdGhpc0dsb2JhbFtERUFEQkVFRl9SRUZfTUFQX0tFWV0pXG4gIHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldID0gcmVmTWFwO1xuXG5sZXQgdXVpZENvdW50ZXIgPSAwbjtcblxuZnVuY3Rpb24gZ2V0SGVscGVyRm9yVmFsdWUodmFsdWUpIHtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gaWRIZWxwZXJzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQgeyBoZWxwZXIsIGdlbmVyYXRvciB9ID0gaWRIZWxwZXJzW2ldO1xuICAgIGlmIChoZWxwZXIodmFsdWUpKVxuICAgICAgcmV0dXJuIGdlbmVyYXRvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBhbnl0aGluZ1RvSUQoX2FyZywgX2FscmVhZHlWaXNpdGVkKSB7XG4gIGxldCBhcmcgPSBfYXJnO1xuICBpZiAoYXJnIGluc3RhbmNlb2YgTnVtYmVyIHx8IGFyZyBpbnN0YW5jZW9mIFN0cmluZyB8fCBhcmcgaW5zdGFuY2VvZiBCb29sZWFuKVxuICAgIGFyZyA9IGFyZy52YWx1ZU9mKCk7XG5cbiAgbGV0IHR5cGVPZiA9IHR5cGVvZiBhcmc7XG5cbiAgaWYgKHR5cGVPZiA9PT0gJ251bWJlcicgJiYgYXJnID09PSAwKSB7XG4gICAgaWYgKE9iamVjdC5pcyhhcmcsIC0wKSlcbiAgICAgIHJldHVybiAnbnVtYmVyOi0wJztcblxuICAgIHJldHVybiAnbnVtYmVyOiswJztcbiAgfVxuXG4gIGlmICh0eXBlT2YgPT09ICdzeW1ib2wnKVxuICAgIHJldHVybiBgc3ltYm9sOiR7YXJnLnRvU3RyaW5nKCl9YDtcblxuICBpZiAoYXJnID09IG51bGwgfHwgdHlwZU9mID09PSAnbnVtYmVyJyB8fCB0eXBlT2YgPT09ICdib29sZWFuJyB8fCB0eXBlT2YgPT09ICdzdHJpbmcnIHx8IHR5cGVPZiA9PT0gJ2JpZ2ludCcpIHtcbiAgICBpZiAodHlwZU9mID09PSAnbnVtYmVyJylcbiAgICAgIHJldHVybiAoYXJnIDwgMCkgPyBgbnVtYmVyOiR7YXJnfWAgOiBgbnVtYmVyOiske2FyZ31gO1xuXG4gICAgaWYgKHR5cGVPZiA9PT0gJ2JpZ2ludCcgJiYgYXJnID09PSAwbilcbiAgICAgIHJldHVybiAnYmlnaW50OiswJztcblxuICAgIHJldHVybiBgJHt0eXBlT2Z9OiR7YXJnfWA7XG4gIH1cblxuICBsZXQgaWRIZWxwZXIgPSAoaWRIZWxwZXJzLmxlbmd0aCA+IDAgJiYgZ2V0SGVscGVyRm9yVmFsdWUoYXJnKSk7XG4gIGlmIChpZEhlbHBlcilcbiAgICByZXR1cm4gYW55dGhpbmdUb0lEKGlkSGVscGVyKGFyZykpO1xuXG4gIGlmIChVTklRVUVfSURfU1lNQk9MIGluIGFyZyAmJiB0eXBlb2YgYXJnW1VOSVFVRV9JRF9TWU1CT0xdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gUHJldmVudCBpbmZpbml0ZSByZWN1cnNpb25cbiAgICBpZiAoIV9hbHJlYWR5VmlzaXRlZCB8fCAhX2FscmVhZHlWaXNpdGVkLmhhcyhhcmcpKSB7XG4gICAgICBsZXQgYWxyZWFkeVZpc2l0ZWQgPSBfYWxyZWFkeVZpc2l0ZWQgfHwgbmV3IFNldCgpO1xuICAgICAgYWxyZWFkeVZpc2l0ZWQuYWRkKGFyZyk7XG4gICAgICByZXR1cm4gYW55dGhpbmdUb0lEKGFyZ1tVTklRVUVfSURfU1lNQk9MXSgpLCBhbHJlYWR5VmlzaXRlZCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFyZWZNYXAuaGFzKGFyZykpIHtcbiAgICBsZXQga2V5ID0gYCR7dHlwZW9mIGFyZ306JHsrK3V1aWRDb3VudGVyfWA7XG4gICAgcmVmTWFwLnNldChhcmcsIGtleSk7XG4gICAgcmV0dXJuIGtleTtcbiAgfVxuXG4gIHJldHVybiByZWZNYXAuZ2V0KGFyZyk7XG59XG5cbmZ1bmN0aW9uIGRlYWRiZWVmKCkge1xuICBsZXQgcGFydHMgPSBbIGFyZ3VtZW50cy5sZW5ndGggXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgcGFydHMucHVzaChhbnl0aGluZ1RvSUQoYXJndW1lbnRzW2ldKSk7XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJzonKTtcbn1cblxuZnVuY3Rpb24gZGVhZGJlZWZTb3J0ZWQoKSB7XG4gIGxldCBwYXJ0cyA9IFsgYXJndW1lbnRzLmxlbmd0aCBdO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICBwYXJ0cy5wdXNoKGFueXRoaW5nVG9JRChhcmd1bWVudHNbaV0pKTtcblxuICByZXR1cm4gcGFydHMuc29ydCgpLmpvaW4oJzonKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVJREZvcihoZWxwZXIsIGdlbmVyYXRvcikge1xuICBpZEhlbHBlcnMucHVzaCh7IGhlbHBlciwgZ2VuZXJhdG9yIH0pO1xufVxuXG5mdW5jdGlvbiByZW1vdmVJREdlbmVyYXRvcihoZWxwZXIpIHtcbiAgbGV0IGluZGV4ID0gaWRIZWxwZXJzLmZpbmRJbmRleCgoaXRlbSkgPT4gKGl0ZW0uaGVscGVyID09PSBoZWxwZXIpKTtcbiAgaWYgKGluZGV4IDwgMClcbiAgICByZXR1cm47XG5cbiAgaWRIZWxwZXJzLnNwbGljZShpbmRleCwgMSk7XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGRlYWRiZWVmLCB7XG4gICdpZFN5bSc6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICBVTklRVUVfSURfU1lNQk9MLFxuICB9LFxuICAnc29ydGVkJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIGRlYWRiZWVmU29ydGVkLFxuICB9LFxuICAnZ2VuZXJhdGVJREZvcic6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICBnZW5lcmF0ZUlERm9yLFxuICB9LFxuICAncmVtb3ZlSURHZW5lcmF0b3InOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgcmVtb3ZlSURHZW5lcmF0b3IsXG4gIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWFkYmVlZjtcblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9jb21wb25lbnQuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL2NvbXBvbmVudC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDb21wb25lbnRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gQ29tcG9uZW50KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJGTFVTSF9VUERBVEVfTUVUSE9EXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEZMVVNIX1VQREFURV9NRVRIT0QpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIklOSVRfTUVUSE9EXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIElOSVRfTUVUSE9EKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJMQVNUX1JFTkRFUl9USU1FXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIExBU1RfUkVOREVSX1RJTUUpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlBFTkRJTkdfU1RBVEVfVVBEQVRFXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFBFTkRJTkdfU1RBVEVfVVBEQVRFKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJQUkVWSU9VU19TVEFURVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBQUkVWSU9VU19TVEFURSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUVVFVUVfVVBEQVRFX01FVEhPRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBRVUVVRV9VUERBVEVfTUVUSE9EKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJTS0lQX1NUQVRFX1VQREFURVNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gU0tJUF9TVEFURV9VUERBVEVTKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJVUERBVEVfRVZFTlRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gVVBEQVRFX0VWRU5UKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9ldmVudHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXZlbnRzLmpzICovIFwiLi9saWIvZXZlbnRzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vamliLmpzICovIFwiLi9saWIvamliLmpzXCIpO1xuLyogZ2xvYmFsIEJ1ZmZlciAqL1xuXG5cblxuXG5cblxuY29uc3QgVVBEQVRFX0VWRU5UICAgICAgICAgICAgICA9ICdAamlicy9jb21wb25lbnQvZXZlbnQvdXBkYXRlJztcbmNvbnN0IFFVRVVFX1VQREFURV9NRVRIT0QgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcXVldWVVcGRhdGUnKTtcbmNvbnN0IEZMVVNIX1VQREFURV9NRVRIT0QgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvZmx1c2hVcGRhdGUnKTtcbmNvbnN0IElOSVRfTUVUSE9EICAgICAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvX19pbml0Jyk7XG5jb25zdCBTS0lQX1NUQVRFX1VQREFURVMgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3NraXBTdGF0ZVVwZGF0ZXMnKTtcbmNvbnN0IFBFTkRJTkdfU1RBVEVfVVBEQVRFICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcGVuZGluZ1N0YXRlVXBkYXRlJyk7XG5jb25zdCBMQVNUX1JFTkRFUl9USU1FICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2xhc3RSZW5kZXJUaW1lJyk7XG5jb25zdCBQUkVWSU9VU19TVEFURSAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3ByZXZpb3VzU3RhdGUnKTtcbmNvbnN0IENBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFMgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcHJldmlvdXNTdGF0ZScpO1xuXG5jb25zdCBlbGVtZW50RGF0YUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcblxuZnVuY3Rpb24gaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBOYU4pKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEJvb2xlYW4gfHwgdmFsdWUgaW5zdGFuY2VvZiBOdW1iZXIgfHwgdmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgdmFsdWU7XG4gIGlmICh0eXBlT2YgPT09ICdzdHJpbmcnIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5jbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBfZXZlbnRzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uRXZlbnRFbWl0dGVyIHtcbiAgc3RhdGljIFVQREFURV9FVkVOVCA9IFVQREFURV9FVkVOVDtcblxuICBbUVVFVUVfVVBEQVRFX01FVEhPRF0oKSB7XG4gICAgaWYgKHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXS50aGVuKHRoaXNbRkxVU0hfVVBEQVRFX01FVEhPRF0uYmluZCh0aGlzKSk7XG4gIH1cblxuICBbRkxVU0hfVVBEQVRFX01FVEhPRF0oKSB7XG4gICAgLy8gV2FzIHRoZSBzdGF0ZSB1cGRhdGUgY2FuY2VsbGVkP1xuICAgIGlmICghdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmVtaXQoVVBEQVRFX0VWRU5UKTtcblxuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdID0gbnVsbDtcbiAgfVxuXG4gIFtJTklUX01FVEhPRF0oKSB7XG4gICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gZmFsc2U7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihfamliKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIC8vIEJpbmQgYWxsIGNsYXNzIG1ldGhvZHMgdG8gXCJ0aGlzXCJcbiAgICBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5iaW5kTWV0aG9kcy5jYWxsKHRoaXMsIHRoaXMuY29uc3RydWN0b3IucHJvdG90eXBlKTtcblxuICAgIGxldCBqaWIgPSBfamliIHx8IHt9O1xuXG4gICAgY29uc3QgY3JlYXRlTmV3U3RhdGUgPSAoKSA9PiB7XG4gICAgICBsZXQgbG9jYWxTdGF0ZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAgIHJldHVybiBuZXcgUHJveHkobG9jYWxTdGF0ZSwge1xuICAgICAgICBnZXQ6ICh0YXJnZXQsIHByb3BOYW1lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wTmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogKHRhcmdldCwgcHJvcE5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgbGV0IGN1cnJlbnRWYWx1ZSA9IHRhcmdldFtwcm9wTmFtZV07XG4gICAgICAgICAgaWYgKGN1cnJlbnRWYWx1ZSA9PT0gdmFsdWUpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgIGlmICghdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdKVxuICAgICAgICAgICAgdGhpc1tRVUVVRV9VUERBVEVfTUVUSE9EXSgpO1xuXG4gICAgICAgICAgdGFyZ2V0W3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgICAgICAgIHRoaXMub25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIHZhbHVlLCBjdXJyZW50VmFsdWUpO1xuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgbGV0IHByb3BzICAgICAgID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCBqaWIucHJvcHMgfHwge30pO1xuICAgIGxldCBfbG9jYWxTdGF0ZSA9IGNyZWF0ZU5ld1N0YXRlKCk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICBbU0tJUF9TVEFURV9VUERBVEVTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgfSxcbiAgICAgIFtQRU5ESU5HX1NUQVRFX1VQREFURV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgICB9LFxuICAgICAgW0xBU1RfUkVOREVSX1RJTUVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLm5vdygpLFxuICAgICAgfSxcbiAgICAgIFtDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0sXG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmlkLFxuICAgICAgfSxcbiAgICAgICdwcm9wcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcHJvcHMsXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuY2hpbGRyZW4gfHwgW10sXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5jb250ZXh0IHx8IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgICB9LFxuICAgICAgJ3N0YXRlJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBfbG9jYWxTdGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduKF9sb2NhbFN0YXRlLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXy5yZXNvbHZlQ2hpbGRyZW4uY2FsbCh0aGlzLCBjaGlsZHJlbik7XG4gIH1cblxuICBpc0ppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uaXNKaWJpc2gpKHZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uY29uc3RydWN0SmliKSh2YWx1ZSk7XG4gIH1cblxuICBwdXNoUmVuZGVyKHJlbmRlclJlc3VsdCkge1xuICAgIHRoaXMuZW1pdChVUERBVEVfRVZFTlQsIHJlbmRlclJlc3VsdCk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25Qcm9wVXBkYXRlZChwcm9wTmFtZSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgY2FwdHVyZVJlZmVyZW5jZShuYW1lLCBpbnRlcmNlcHRvckNhbGxiYWNrKSB7XG4gICAgbGV0IG1ldGhvZCA9IHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU11bbmFtZV07XG4gICAgaWYgKG1ldGhvZClcbiAgICAgIHJldHVybiBtZXRob2Q7XG5cbiAgICBtZXRob2QgPSAoX3JlZiwgcHJldmlvdXNSZWYpID0+IHtcbiAgICAgIGxldCByZWYgPSBfcmVmO1xuXG4gICAgICBpZiAodHlwZW9mIGludGVyY2VwdG9yQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJlZiA9IGludGVyY2VwdG9yQ2FsbGJhY2suY2FsbCh0aGlzLCByZWYsIHByZXZpb3VzUmVmKTtcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgICBbbmFtZV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICByZWYsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhpc1tDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXSA9IG1ldGhvZDtcblxuICAgIHJldHVybiBtZXRob2Q7XG4gIH1cblxuICBmb3JjZVVwZGF0ZSgpIHtcbiAgICB0aGlzW1FVRVVFX1VQREFURV9NRVRIT0RdKCk7XG4gIH1cblxuICBnZXRTdGF0ZShwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gc3RhdGU7XG5cbiAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihwcm9wZXJ0eVBhdGgsICdvYmplY3QnKSkge1xuICAgICAgbGV0IGtleXMgICAgICAgID0gT2JqZWN0LmtleXMocHJvcGVydHlQYXRoKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhwcm9wZXJ0eVBhdGgpKTtcbiAgICAgIGxldCBmaW5hbFN0YXRlICA9IHt9O1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGxldCBbIHZhbHVlLCBsYXN0UGFydCBdID0gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uZmV0Y2hEZWVwUHJvcGVydHkoc3RhdGUsIGtleSwgcHJvcGVydHlQYXRoW2tleV0sIHRydWUpO1xuICAgICAgICBpZiAobGFzdFBhcnQgPT0gbnVsbClcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBmaW5hbFN0YXRlW2xhc3RQYXJ0XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmluYWxTdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgc2V0U3RhdGUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgfVxuXG4gIHNldFN0YXRlUGFzc2l2ZSh2YWx1ZSkge1xuICAgIGlmICghaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWUgZm9yIFwidGhpcy5zZXRTdGF0ZVBhc3NpdmVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwgdmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGRlbGV0ZSB0aGlzLnN0YXRlO1xuICAgIGRlbGV0ZSB0aGlzLnByb3BzO1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRleHQ7XG4gICAgZGVsZXRlIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU107XG4gICAgdGhpcy5jbGVhckFsbERlYm91bmNlcygpO1xuICB9XG5cbiAgcmVuZGVyV2FpdGluZygpIHtcbiAgfVxuXG4gIHJlbmRlcihjaGlsZHJlbikge1xuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHVwZGF0ZWQoKSB7XG4gIH1cblxuICBjb21iaW5lV2l0aChzZXAsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZmluYWxBcmdzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3MubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGFyZyA9IGFyZ3NbaV07XG4gICAgICBpZiAoIWFyZylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGFyZywgJ3N0cmluZycpKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSBhcmcuc3BsaXQoc2VwKS5maWx0ZXIoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaXNOb3RFbXB0eSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLmZpbHRlcigodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgaWYgKCFfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKHZhbHVlLCAnc3RyaW5nJykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaXNOb3RFbXB0eSh2YWx1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YoYXJnLCAnb2JqZWN0JykpIHtcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhhcmcpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgPSBrZXlzW2ldO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IGFyZ1trZXldO1xuXG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgZmluYWxBcmdzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmluYWxBcmdzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZmluYWxBcmdzKS5qb2luKHNlcCB8fCAnJyk7XG4gIH1cblxuICBjbGFzc2VzKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5jb21iaW5lV2l0aCgnICcsIC4uLmFyZ3MpO1xuICB9XG5cbiAgZXh0cmFjdENoaWxkcmVuKF9wYXR0ZXJucywgY2hpbGRyZW4pIHtcbiAgICBsZXQgZXh0cmFjdGVkID0ge307XG4gICAgbGV0IHBhdHRlcm5zICA9IF9wYXR0ZXJucztcbiAgICBsZXQgaXNBcnJheSAgID0gQXJyYXkuaXNBcnJheShwYXR0ZXJucyk7XG5cbiAgICBjb25zdCBpc01hdGNoID0gKGppYikgPT4ge1xuICAgICAgbGV0IGppYlR5cGUgPSBqaWIuVHlwZTtcbiAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGF0dGVybnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBwYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgIGlmIChqaWJUeXBlID09PSBwYXR0ZXJuKSB7XG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBqaWI7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGF0dGVybnMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgICA9IGtleXNbaV07XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICAgIGxldCByZXN1bHQ7XG5cbiAgICAgICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihwYXR0ZXJuLCBSZWdFeHApKVxuICAgICAgICAgICAgcmVzdWx0ID0gcGF0dGVybi50ZXN0KGppYlR5cGUpO1xuICAgICAgICAgIGVsc2UgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4udG9Mb3dlckNhc2UoKSA9PT0gamliVHlwZSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4gPT09IGppYlR5cGUpO1xuXG4gICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgZXh0cmFjdGVkW2tleV0gPSBqaWI7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICBleHRyYWN0ZWQucmVtYWluaW5nQ2hpbGRyZW4gPSBjaGlsZHJlbi5maWx0ZXIoKGppYikgPT4gIWlzTWF0Y2goamliKSk7XG4gICAgcmV0dXJuIGV4dHJhY3RlZDtcbiAgfVxuXG4gIGRlYm91bmNlKGZ1bmMsIHRpbWUsIF9pZCkge1xuICAgIGNvbnN0IGNsZWFyUGVuZGluZ1RpbWVvdXQgPSAoKSA9PiB7XG4gICAgICBpZiAocGVuZGluZ1RpbWVyICYmIHBlbmRpbmdUaW1lci50aW1lb3V0KSB7XG4gICAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZXIudGltZW91dCk7XG4gICAgICAgIHBlbmRpbmdUaW1lci50aW1lb3V0ID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGlkID0gKCFfaWQpID8gKCcnICsgZnVuYykgOiBfaWQ7XG4gICAgaWYgKCF0aGlzLmRlYm91bmNlVGltZXJzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2RlYm91bmNlVGltZXJzJywge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBwZW5kaW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzW2lkXTtcbiAgICBpZiAoIXBlbmRpbmdUaW1lcilcbiAgICAgIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0ge307XG5cbiAgICBwZW5kaW5nVGltZXIuZnVuYyA9IGZ1bmM7XG4gICAgY2xlYXJQZW5kaW5nVGltZW91dCgpO1xuXG4gICAgdmFyIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZTtcbiAgICBpZiAoIXByb21pc2UgfHwgIXByb21pc2UucGVuZGluZygpKSB7XG4gICAgICBsZXQgc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgbGV0IHJlc29sdmU7XG5cbiAgICAgIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSkgPT4ge1xuICAgICAgICByZXNvbHZlID0gX3Jlc29sdmU7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5yZXNvbHZlID0gKCkgPT4ge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAncGVuZGluZycpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHN0YXR1cyA9ICdmdWxmaWxsZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lci5mdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdmFyIHJldCA9IHBlbmRpbmdUaW1lci5mdW5jLmNhbGwodGhpcyk7XG4gICAgICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHJldCAmJiB0eXBlb2YgcmV0LnRoZW4gPT09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgcmV0LnRoZW4oKHZhbHVlKSA9PiByZXNvbHZlKHZhbHVlKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb2x2ZShyZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgIHN0YXR1cyA9ICdyZWplY3RlZCc7XG4gICAgICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSBudWxsO1xuXG4gICAgICAgIHByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5pc1BlbmRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiAoc3RhdHVzID09PSAncGVuZGluZycpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgIHBlbmRpbmdUaW1lci50aW1lb3V0ID0gc2V0VGltZW91dChwcm9taXNlLnJlc29sdmUsICh0aW1lID09IG51bGwpID8gMjUwIDogdGltZSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGNsZWFyRGVib3VuY2UoaWQpIHtcbiAgICB2YXIgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF07XG4gICAgaWYgKHBlbmRpbmdUaW1lciA9PSBudWxsKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKHBlbmRpbmdUaW1lci50aW1lb3V0KVxuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lci50aW1lb3V0KTtcblxuICAgIGlmIChwZW5kaW5nVGltZXIucHJvbWlzZSlcbiAgICAgIHBlbmRpbmdUaW1lci5wcm9taXNlLmNhbmNlbCgpO1xuICB9XG5cbiAgY2xlYXJBbGxEZWJvdW5jZXMoKSB7XG4gICAgbGV0IGRlYm91bmNlVGltZXJzICA9IHRoaXMuZGVib3VuY2VUaW1lcnMgfHwge307XG4gICAgbGV0IGlkcyAgICAgICAgICAgICA9IE9iamVjdC5rZXlzKGRlYm91bmNlVGltZXJzKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkcy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgICAgdGhpcy5jbGVhckRlYm91bmNlKGlkc1tpXSk7XG4gIH1cblxuICBnZXRFbGVtZW50RGF0YShlbGVtZW50KSB7XG4gICAgbGV0IGRhdGEgPSBlbGVtZW50RGF0YUNhY2hlLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGRhdGEgPSB7fTtcbiAgICAgIGVsZW1lbnREYXRhQ2FjaGUuc2V0KGVsZW1lbnQsIGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgbWVtb2l6ZShmdW5jKSB7XG4gICAgbGV0IGNhY2hlSUQ7XG4gICAgbGV0IGNhY2hlZFJlc3VsdDtcblxuICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICBsZXQgbmV3Q2FjaGVJRCA9IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oLi4uYXJncyk7XG4gICAgICBpZiAobmV3Q2FjaGVJRCAhPT0gY2FjaGVJRCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcblxuICAgICAgICBjYWNoZUlEID0gbmV3Q2FjaGVJRDtcbiAgICAgICAgY2FjaGVkUmVzdWx0ID0gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FjaGVkUmVzdWx0O1xuICAgIH07XG4gIH1cbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9ldmVudHMuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL2V2ZW50cy5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiRXZlbnRFbWl0dGVyXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEV2ZW50RW1pdHRlcilcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuY29uc3QgRVZFTlRfTElTVEVORVJTID0gU3ltYm9sLmZvcignQGppYnMvZXZlbnRzL2xpc3RlbmVycycpO1xuXG5jbGFzcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICBbRVZFTlRfTElTVEVORVJTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG5ldyBNYXAoKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V2ZW50IGxpc3RlbmVyIG11c3QgYmUgYSBtZXRob2QnKTtcblxuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuXG4gICAgaWYgKCFzY29wZSkge1xuICAgICAgc2NvcGUgPSBbXTtcbiAgICAgIGV2ZW50TWFwLnNldChldmVudE5hbWUsIHNjb3BlKTtcbiAgICB9XG5cbiAgICBzY29wZS5wdXNoKGxpc3RlbmVyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFdmVudCBsaXN0ZW5lciBtdXN0IGJlIGEgbWV0aG9kJyk7XG5cbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBsZXQgaW5kZXggPSBzY29wZS5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaW5kZXggPj0gMClcbiAgICAgIHNjb3BlLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUFsbExpc3RlbmVycyhldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGlmICghZXZlbnRNYXAuaGFzKGV2ZW50TmFtZSkpXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGV2ZW50TWFwLnNldChldmVudE5hbWUsIFtdKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZW1pdChldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlIHx8IHNjb3BlLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHNjb3BlLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBldmVudENhbGxiYWNrID0gc2NvcGVbaV07XG4gICAgICBldmVudENhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgb25jZShldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgbGV0IGZ1bmMgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5vZmYoZXZlbnROYW1lLCBmdW5jKTtcbiAgICAgIHJldHVybiBsaXN0ZW5lciguLi5hcmdzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMub24oZXZlbnROYW1lLCBmdW5jKTtcbiAgfVxuXG4gIG9uKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIG9mZihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gIH1cblxuICBldmVudE5hbWVzKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXNbRVZFTlRfTElTVEVORVJTXS5rZXlzKCkpO1xuICB9XG5cbiAgbGlzdGVuZXJDb3VudChldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIDA7XG5cbiAgICByZXR1cm4gc2NvcGUubGVuZ3RoO1xuICB9XG5cbiAgbGlzdGVuZXJzKGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gW107XG5cbiAgICByZXR1cm4gc2NvcGUuc2xpY2UoKTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL2ppYi5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvamliLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCIkXCI6ICgpID0+ICgvKiBiaW5kaW5nICovICQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkpJQlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBKSUIpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkpJQl9CQVJSRU5cIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSklCX0JBUlJFTiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX1BST1hZXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9QUk9YWSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX1JBV19URVhUXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9SQVdfVEVYVCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSmliXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEppYiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiY29uc3RydWN0SmliXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGNvbnN0cnVjdEppYiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmFjdG9yeVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBmYWN0b3J5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc0ppYmlzaFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc0ppYmlzaCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwicmVzb2x2ZUNoaWxkcmVuXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIHJlc29sdmVDaGlsZHJlbilcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbHMuanMgKi8gXCIuL2xpYi91dGlscy5qc1wiKTtcblxuXG5cbmNsYXNzIEppYiB7XG4gIGNvbnN0cnVjdG9yKFR5cGUsIHByb3BzLCBjaGlsZHJlbikge1xuICAgIGxldCBkZWZhdWx0UHJvcHMgPSAoVHlwZSAmJiBUeXBlLnByb3BzKSA/IFR5cGUucHJvcHMgOiB7fTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUeXBlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFR5cGUsXG4gICAgICB9LFxuICAgICAgJ3Byb3BzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHsgLi4uZGVmYXVsdFByb3BzLCAuLi4ocHJvcHMgfHwge30pIH0sXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmZsYXR0ZW5BcnJheShjaGlsZHJlbiksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbmNvbnN0IEpJQl9CQVJSRU4gICA9IFN5bWJvbC5mb3IoJ0BqaWJzLmJhcnJlbicpO1xuY29uc3QgSklCX1BST1hZICAgID0gU3ltYm9sLmZvcignQGppYnMucHJveHknKTtcbmNvbnN0IEpJQl9SQVdfVEVYVCA9IFN5bWJvbC5mb3IoJ0BqaWJzLnJhd1RleHQnKTtcbmNvbnN0IEpJQiAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLmppYicpO1xuXG5mdW5jdGlvbiBmYWN0b3J5KEppYkNsYXNzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAkKF90eXBlLCBwcm9wcyA9IHt9KSB7XG4gICAgaWYgKGlzSmliaXNoKF90eXBlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1JlY2VpdmVkIGEgamliIGJ1dCBleHBlY3RlZCBhIGNvbXBvbmVudC4nKTtcblxuICAgIGxldCBUeXBlID0gKF90eXBlID09IG51bGwpID8gSklCX1BST1hZIDogX3R5cGU7XG5cbiAgICBmdW5jdGlvbiBiYXJyZW4oLi4uX2NoaWxkcmVuKSB7XG4gICAgICBsZXQgY2hpbGRyZW4gPSBfY2hpbGRyZW47XG5cbiAgICAgIGZ1bmN0aW9uIGppYigpIHtcbiAgICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoVHlwZSwgJ3Byb21pc2UnKSB8fCBjaGlsZHJlbi5zb21lKChjaGlsZCkgPT4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihjaGlsZCwgJ3Byb21pc2UnKSkpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoWyBUeXBlIF0uY29uY2F0KGNoaWxkcmVuKSkudGhlbigoYWxsKSA9PiB7XG4gICAgICAgICAgICBUeXBlID0gYWxsWzBdO1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBhbGwuc2xpY2UoMSk7XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgSmliQ2xhc3MoXG4gICAgICAgICAgICAgIFR5cGUsXG4gICAgICAgICAgICAgIHByb3BzLFxuICAgICAgICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IEppYkNsYXNzKFxuICAgICAgICAgIFR5cGUsXG4gICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGppYiwge1xuICAgICAgICBbSklCXToge1xuICAgICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgW2RlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uaWRTeW1dOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICAoKSA9PiBUeXBlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBqaWI7XG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoYmFycmVuLCB7XG4gICAgICBbSklCX0JBUlJFTl06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgfSxcbiAgICAgIFtkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmlkU3ltXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgICgpID0+IFR5cGUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGJhcnJlbjtcbiAgfTtcbn1cblxuY29uc3QgJCA9IGZhY3RvcnkoSmliKTtcblxuZnVuY3Rpb24gaXNKaWJpc2godmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiAodmFsdWVbSklCX0JBUlJFTl0gfHwgdmFsdWVbSklCXSkpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSmliKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0SmliKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEppYilcbiAgICByZXR1cm4gdmFsdWU7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmICh2YWx1ZVtKSUJfQkFSUkVOXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpKCk7XG4gICAgZWxzZSBpZiAodmFsdWVbSklCXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpO1xuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignY29uc3RydWN0SmliOiBQcm92aWRlZCB2YWx1ZSBpcyBub3QgYSBKaWIuJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVDaGlsZHJlbihfY2hpbGRyZW4pIHtcbiAgbGV0IGNoaWxkcmVuID0gX2NoaWxkcmVuO1xuXG4gIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKGNoaWxkcmVuLCAncHJvbWlzZScpKVxuICAgIGNoaWxkcmVuID0gYXdhaXQgY2hpbGRyZW47XG5cbiAgaWYgKCEoKHRoaXMuaXNJdGVyYWJsZUNoaWxkIHx8IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmlzSXRlcmFibGVDaGlsZCkuY2FsbCh0aGlzLCBjaGlsZHJlbikpICYmIChpc0ppYmlzaChjaGlsZHJlbikgfHwgKCh0aGlzLmlzVmFsaWRDaGlsZCB8fCBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pc1ZhbGlkQ2hpbGQpLmNhbGwodGhpcywgY2hpbGRyZW4pKSkpXG4gICAgY2hpbGRyZW4gPSBbIGNoaWxkcmVuIF07XG5cbiAgbGV0IHByb21pc2VzID0gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXRlcmF0ZShjaGlsZHJlbiwgYXN5bmMgKHsgdmFsdWU6IF9jaGlsZCB9KSA9PiB7XG4gICAgbGV0IGNoaWxkID0gKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoX2NoaWxkLCAncHJvbWlzZScpKSA/IGF3YWl0IF9jaGlsZCA6IF9jaGlsZDtcblxuICAgIGlmIChpc0ppYmlzaChjaGlsZCkpXG4gICAgICByZXR1cm4gYXdhaXQgY29uc3RydWN0SmliKGNoaWxkKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gY2hpbGQ7XG4gIH0pO1xuXG4gIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9yZW5kZXJlcnMvaW5kZXguanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNPTlRFWFRfSURcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkNPTlRFWFRfSUQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkZPUkNFX1JFRkxPV1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBGT1JDRV9SRUZMT1cpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJlbmRlcmVyXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9yZW5kZXJlcl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlJlbmRlcmVyKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSb290Tm9kZVwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdE5vZGUpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3Jvb3Qtbm9kZS5qcyAqLyBcIi4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3JlbmRlcmVyX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3JlbmRlcmVyLmpzICovIFwiLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzXCIpO1xuXG5cbmNvbnN0IEZPUkNFX1JFRkxPVyA9IFN5bWJvbC5mb3IoJ0BqaWJzRm9yY2VSZWZsb3cnKTtcblxuXG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9yZW5kZXJlcnMvcmVuZGVyZXIuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJlbmRlcmVyXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFJlbmRlcmVyKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LW5vZGUuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzXCIpO1xuXG5cbmNvbnN0IElOSVRJQUxfQ09OVEVYVF9JRCA9IDFuO1xubGV0IF9jb250ZXh0SURDb3VudGVyID0gSU5JVElBTF9DT05URVhUX0lEO1xuXG5jbGFzcyBSZW5kZXJlciBleHRlbmRzIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5Sb290Tm9kZSB7XG4gIHN0YXRpYyBSb290Tm9kZSA9IF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5Sb290Tm9kZTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihudWxsLCBudWxsLCBudWxsKTtcbiAgICB0aGlzLnJlbmRlcmVyID0gdGhpcztcbiAgfVxuXG4gIGNyZWF0ZUNvbnRleHQocm9vdENvbnRleHQsIG9uVXBkYXRlLCBvblVwZGF0ZVRoaXMpIHtcbiAgICBsZXQgY29udGV4dCAgICAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBteUNvbnRleHRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRF0gOiBJTklUSUFMX0NPTlRFWFRfSUQ7XG5cbiAgICByZXR1cm4gbmV3IFByb3h5KGNvbnRleHQsIHtcbiAgICAgIGdldDogKHRhcmdldCwgcHJvcE5hbWUpID0+IHtcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRCkge1xuICAgICAgICAgIGxldCBwYXJlbnRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRF0gOiBJTklUSUFMX0NPTlRFWFRfSUQ7XG4gICAgICAgICAgcmV0dXJuIChwYXJlbnRJRCA+IG15Q29udGV4dElEKSA/IHBhcmVudElEIDogbXlDb250ZXh0SUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIHByb3BOYW1lKSlcbiAgICAgICAgICByZXR1cm4gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W3Byb3BOYW1lXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgIH0sXG4gICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAocHJvcE5hbWUgPT09IF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5DT05URVhUX0lEKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGlmICh0YXJnZXRbcHJvcE5hbWVdID09PSB2YWx1ZSlcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBteUNvbnRleHRJRCA9ICsrX2NvbnRleHRJRENvdW50ZXI7XG4gICAgICAgIHRhcmdldFtwcm9wTmFtZV0gPSB2YWx1ZTtcblxuICAgICAgICBpZiAodHlwZW9mIG9uVXBkYXRlID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgIG9uVXBkYXRlLmNhbGwob25VcGRhdGVUaGlzLCBvblVwZGF0ZVRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ09OVEVYVF9JRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBDT05URVhUX0lEKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSb290Tm9kZVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBSb290Tm9kZSlcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4uL3V0aWxzLmpzICovIFwiLi9saWIvdXRpbHMuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi4vamliLmpzICovIFwiLi9saWIvamliLmpzXCIpO1xuXG5cblxuXG5jb25zdCBDT05URVhUX0lEID0gU3ltYm9sLmZvcignQGppYnMvbm9kZS9jb250ZXh0SUQnKTtcblxuY2xhc3MgUm9vdE5vZGUge1xuICBzdGF0aWMgQ09OVEVYVF9JRCA9IENPTlRFWFRfSUQ7XG5cbiAgY29uc3RydWN0b3IocmVuZGVyZXIsIHBhcmVudE5vZGUsIF9jb250ZXh0LCBqaWIpIHtcbiAgICBsZXQgY29udGV4dCA9IG51bGw7XG5cbiAgICBpZiAocmVuZGVyZXIgfHwgdGhpcy5jcmVhdGVDb250ZXh0KSB7XG4gICAgICBjb250ZXh0ID0gKHJlbmRlcmVyIHx8IHRoaXMpLmNyZWF0ZUNvbnRleHQoXG4gICAgICAgIF9jb250ZXh0LFxuICAgICAgICAodGhpcy5vbkNvbnRleHRVcGRhdGUpID8gdGhpcy5vbkNvbnRleHRVcGRhdGUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRoaXMsXG4gICAgICApO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUWVBFJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBnZXQ6ICAgICAgICAgICgpID0+IHRoaXMuY29uc3RydWN0b3IuVFlQRSxcbiAgICAgICAgc2V0OiAgICAgICAgICAoKSA9PiB7fSwgLy8gTk9PUFxuICAgICAgfSxcbiAgICAgICdpZCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5nZW5lcmF0ZVVVSUQoKSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyZXInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHJlbmRlcmVyLFxuICAgICAgfSxcbiAgICAgICdwYXJlbnROb2RlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBwYXJlbnROb2RlLFxuICAgICAgfSxcbiAgICAgICdjaGlsZE5vZGVzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBuZXcgTWFwKCksXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogICAgICAgICAgKCkgPT4ge30sXG4gICAgICB9LFxuICAgICAgJ2Rlc3Ryb3lpbmcnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGZhbHNlLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJQcm9taXNlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJGcmFtZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgMCxcbiAgICAgIH0sXG4gICAgICAnamliJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIsXG4gICAgICB9LFxuICAgICAgJ25hdGl2ZUVsZW1lbnQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5yZXNvbHZlQ2hpbGRyZW4uY2FsbCh0aGlzLCBjaGlsZHJlbik7XG4gIH1cblxuICBnZXRDYWNoZUtleSgpIHtcbiAgICBsZXQgeyBUeXBlLCBwcm9wcyB9ID0gKHRoaXMuamliIHx8IHt9KTtcbiAgICBsZXQgY2FjaGVLZXkgPSBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKFR5cGUsIHByb3BzLmtleSk7XG5cbiAgICByZXR1cm4gY2FjaGVLZXk7XG4gIH1cblxuICB1cGRhdGVKaWIobmV3SmliKSB7XG4gICAgdGhpcy5qaWIgPSBuZXdKaWI7XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZE5vZGUpIHtcbiAgICBsZXQgY2FjaGVLZXkgPSBjaGlsZE5vZGUuZ2V0Q2FjaGVLZXkoKTtcbiAgICB0aGlzLmNoaWxkTm9kZXMuZGVsZXRlKGNhY2hlS2V5KTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkTm9kZSkge1xuICAgIGxldCBjYWNoZUtleSA9IGNoaWxkTm9kZS5nZXRDYWNoZUtleSgpO1xuICAgIHRoaXMuY2hpbGROb2Rlcy5zZXQoY2FjaGVLZXksIGNoaWxkTm9kZSk7XG4gIH1cblxuICBnZXRDaGlsZChjYWNoZUtleSkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTm9kZXMuZ2V0KGNhY2hlS2V5KTtcbiAgfVxuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW5Ob2RlcygpIHtcbiAgICBsZXQgY2hpbGROb2RlcyA9IFtdO1xuICAgIGZvciAobGV0IGNoaWxkTm9kZSBvZiB0aGlzLmNoaWxkTm9kZXMudmFsdWVzKCkpXG4gICAgICBjaGlsZE5vZGVzID0gY2hpbGROb2Rlcy5jb25jYXQoY2hpbGROb2RlLmdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkpO1xuXG4gICAgcmV0dXJuIGNoaWxkTm9kZXMuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveShmb3JjZSkge1xuICAgIGlmICghZm9yY2UgJiYgdGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5kZXN0cm95aW5nID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLnJlbmRlclByb21pc2UpXG4gICAgICBhd2FpdCB0aGlzLnJlbmRlclByb21pc2U7XG5cbiAgICBhd2FpdCB0aGlzLmRlc3Ryb3lGcm9tRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG5cbiAgICBsZXQgZGVzdHJveVByb21pc2VzID0gW107XG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHRoaXMuY2hpbGROb2Rlcy52YWx1ZXMoKSlcbiAgICAgIGRlc3Ryb3lQcm9taXNlcy5wdXNoKGNoaWxkTm9kZS5kZXN0cm95KCkpO1xuXG4gICAgdGhpcy5jaGlsZE5vZGVzLmNsZWFyKCk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5wYXJlbnROb2RlID0gbnVsbDtcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIHRoaXMuamliID0gbnVsbDtcbiAgfVxuXG4gIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pc1ZhbGlkQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmlzSXRlcmFibGVDaGlsZChjaGlsZCk7XG4gIH1cblxuICBwcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKSB7XG4gICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLnByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpO1xuICB9XG5cbiAgY2hpbGRyZW5EaWZmZXIob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmNoaWxkcmVuRGlmZmVyKG9sZENoaWxkcmVuLCBuZXdDaGlsZHJlbik7XG4gIH1cblxuICBhc3luYyByZW5kZXIoamliLCByZW5kZXJDb250ZXh0KSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLl9yZW5kZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IHRoaXMuX3JlbmRlcihqaWIsIHJlbmRlckNvbnRleHQpXG4gICAgICAgIC50aGVuKGFzeW5jIChyZXN1bHQpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuXG4gICAgICAgICAgaWYgKHJlbmRlckZyYW1lID49IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcblxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5zeW5jRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmVuZGVyUHJvbWlzZTtcbiAgfVxuXG4gIGdldFBhcmVudElEKCkge1xuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50Tm9kZS5pZDtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKCkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLmRlc3Ryb3lGcm9tRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG4gIH1cblxuICBhc3luYyBzeW5jRE9NKCkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3V0aWxzLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3V0aWxzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImJpbmRNZXRob2RzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGJpbmRNZXRob2RzKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJjaGlsZHJlbkRpZmZlclwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBjaGlsZHJlbkRpZmZlciksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmV0Y2hEZWVwUHJvcGVydHlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gZmV0Y2hEZWVwUHJvcGVydHkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImZsYXR0ZW5BcnJheVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBmbGF0dGVuQXJyYXkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImdlbmVyYXRlVVVJRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBnZW5lcmF0ZVVVSUQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImluc3RhbmNlT2ZcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaW5zdGFuY2VPZiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaXNFbXB0eVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc0VtcHR5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc0l0ZXJhYmxlQ2hpbGRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXNJdGVyYWJsZUNoaWxkKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc05vdEVtcHR5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzTm90RW1wdHkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzVmFsaWRDaGlsZFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc1ZhbGlkQ2hpbGQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIml0ZXJhdGVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXRlcmF0ZSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwibm93XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIG5vdyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwicHJvcHNEaWZmZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gcHJvcHNEaWZmZXIpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcInNpemVPZlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBzaXplT2YpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgZGVhZGJlZWYgKi8gXCIuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanNcIik7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby1tYWdpYy1udW1iZXJzICovXG5cblxuY29uc3QgU1RPUCA9IFN5bWJvbC5mb3IoJ0BqaWJzSXRlcmF0ZVN0b3AnKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5lc3RlZC10ZXJuYXJ5XG5jb25zdCBnbG9iYWxTY29wZSA9ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgPyBnbG9iYWwgOiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuXG5sZXQgdXVpZCA9IDEwMDAwMDA7XG5cbmZ1bmN0aW9uIGluc3RhbmNlT2Yob2JqKSB7XG4gIGZ1bmN0aW9uIHRlc3RUeXBlKG9iaiwgX3ZhbCkge1xuICAgIGZ1bmN0aW9uIGlzRGVmZXJyZWRUeXBlKG9iaikge1xuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFByb21pc2UgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1Byb21pc2UnKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIFF1YWNrIHF1YWNrLi4uXG4gICAgICBpZiAodHlwZW9mIG9iai50aGVuID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvYmouY2F0Y2ggPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHZhbCAgICAgPSBfdmFsO1xuICAgIGxldCB0eXBlT2YgID0gKHR5cGVvZiBvYmopO1xuXG4gICAgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU3RyaW5nKVxuICAgICAgdmFsID0gJ3N0cmluZyc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5OdW1iZXIpXG4gICAgICB2YWwgPSAnbnVtYmVyJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJvb2xlYW4pXG4gICAgICB2YWwgPSAnYm9vbGVhbic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5GdW5jdGlvbilcbiAgICAgIHZhbCA9ICdmdW5jdGlvbic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5BcnJheSlcbiAgICAgIHZhbCA9ICdhcnJheSc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5PYmplY3QpXG4gICAgICB2YWwgPSAnb2JqZWN0JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlByb21pc2UpXG4gICAgICB2YWwgPSAncHJvbWlzZSc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5CaWdJbnQpXG4gICAgICB2YWwgPSAnYmlnaW50JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk1hcClcbiAgICAgIHZhbCA9ICdtYXAnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuV2Vha01hcClcbiAgICAgIHZhbCA9ICd3ZWFrbWFwJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlNldClcbiAgICAgIHZhbCA9ICdzZXQnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU3ltYm9sKVxuICAgICAgdmFsID0gJ3N5bWJvbCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5CdWZmZXIpXG4gICAgICB2YWwgPSAnYnVmZmVyJztcblxuICAgIGlmICh2YWwgPT09ICdidWZmZXInICYmIGdsb2JhbFNjb3BlLkJ1ZmZlciAmJiBnbG9iYWxTY29wZS5CdWZmZXIuaXNCdWZmZXIob2JqKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ251bWJlcicgJiYgKHR5cGVPZiA9PT0gJ251bWJlcicgfHwgb2JqIGluc3RhbmNlb2YgTnVtYmVyIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdOdW1iZXInKSkpIHtcbiAgICAgIGlmICghaXNGaW5pdGUob2JqKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodmFsICE9PSAnb2JqZWN0JyAmJiB2YWwgPT09IHR5cGVPZilcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmICgob2JqLmNvbnN0cnVjdG9yID09PSBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAvLyBOdWxsIHByb3RvdHlwZSBvbiBvYmplY3RcbiAgICAgIGlmICh0eXBlT2YgPT09ICdvYmplY3QnICYmICFvYmouY29uc3RydWN0b3IpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHZhbCA9PT0gJ2FycmF5JyAmJiAoQXJyYXkuaXNBcnJheShvYmopIHx8IG9iaiBpbnN0YW5jZW9mIEFycmF5IHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdBcnJheScpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKCh2YWwgPT09ICdwcm9taXNlJyB8fCB2YWwgPT09ICdkZWZlcnJlZCcpICYmIGlzRGVmZXJyZWRUeXBlKG9iaikpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdzdHJpbmcnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5TdHJpbmcgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1N0cmluZycpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2Jvb2xlYW4nICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5Cb29sZWFuIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdCb29sZWFuJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnbWFwJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuTWFwIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdNYXAnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICd3ZWFrbWFwJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuV2Vha01hcCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnV2Vha01hcCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3NldCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLlNldCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2V0JykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnZnVuY3Rpb24nICYmIHR5cGVPZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicgJiYgb2JqIGluc3RhbmNlb2YgdmFsKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgJiYgb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB2YWwpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChvYmogPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICh0ZXN0VHlwZShvYmosIGFyZ3VtZW50c1tpXSkgPT09IHRydWUpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cykge1xuICBpZiAob2xkUHJvcHMgPT09IG5ld1Byb3BzKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIG9sZFByb3BzICE9PSB0eXBlb2YgbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKCFvbGRQcm9wcyAmJiBuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAob2xkUHJvcHMgJiYgIW5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcbiAgaWYgKCFvbGRQcm9wcyAmJiAhbmV3UHJvcHMgJiYgb2xkUHJvcHMgIT0gb2xkUHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgbGV0IGFLZXlzID0gT2JqZWN0LmtleXMob2xkUHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9sZFByb3BzKSk7XG4gIGxldCBiS2V5cyA9IE9iamVjdC5rZXlzKG5ld1Byb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhuZXdQcm9wcykpO1xuXG4gIGlmIChhS2V5cy5sZW5ndGggIT09IGJLZXlzLmxlbmd0aClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhS2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGFLZXkgPSBhS2V5c1tpXTtcbiAgICBpZiAoc2tpcEtleXMgJiYgc2tpcEtleXMuaW5kZXhPZihhS2V5KSA+PSAwKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAob2xkUHJvcHNbYUtleV0gIT09IG5ld1Byb3BzW2FLZXldKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBsZXQgYktleSA9IGJLZXlzW2ldO1xuICAgIGlmIChza2lwS2V5cyAmJiBza2lwS2V5cy5pbmRleE9mKGJLZXkpKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAoYUtleSA9PT0gYktleSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKG9sZFByb3BzW2JLZXldICE9PSBuZXdQcm9wc1tiS2V5XSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBzaXplT2YodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSlcbiAgICByZXR1cm4gMDtcblxuICBpZiAoT2JqZWN0LmlzKEluZmluaXR5KSlcbiAgICByZXR1cm4gMDtcblxuICBpZiAodHlwZW9mIHZhbHVlLmxlbmd0aCA9PT0gJ251bWJlcicpXG4gICAgcmV0dXJuIHZhbHVlLmxlbmd0aDtcblxuICByZXR1cm4gT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gX2l0ZXJhdGUob2JqLCBjYWxsYmFjaykge1xuICBpZiAoIW9iaiB8fCBPYmplY3QuaXMoSW5maW5pdHkpKVxuICAgIHJldHVybiBbXTtcblxuICBsZXQgcmVzdWx0cyAgID0gW107XG4gIGxldCBzY29wZSAgICAgPSB7IGNvbGxlY3Rpb246IG9iaiwgU1RPUCB9O1xuICBsZXQgcmVzdWx0O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBzY29wZS50eXBlID0gJ0FycmF5JztcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IG9iai5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBzY29wZS52YWx1ZSA9IG9ialtpXTtcbiAgICAgIHNjb3BlLmluZGV4ID0gc2NvcGUua2V5ID0gaTtcblxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICBicmVhaztcblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmouZW50cmllcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBTZXQgfHwgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTZXQnKSB7XG4gICAgICBzY29wZS50eXBlID0gJ1NldCc7XG5cbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIG9iai52YWx1ZXMoKSkge1xuICAgICAgICBzY29wZS52YWx1ZSA9IGl0ZW07XG4gICAgICAgIHNjb3BlLmtleSA9IGl0ZW07XG4gICAgICAgIHNjb3BlLmluZGV4ID0gaW5kZXgrKztcblxuICAgICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2NvcGUudHlwZSA9IG9iai5jb25zdHJ1Y3Rvci5uYW1lO1xuXG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIChsZXQgWyBrZXksIHZhbHVlIF0gb2Ygb2JqLmVudHJpZXMoKSkge1xuICAgICAgICBzY29wZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBzY29wZS5rZXkgPSBrZXk7XG4gICAgICAgIHNjb3BlLmluZGV4ID0gaW5kZXgrKztcblxuICAgICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGluc3RhbmNlT2Yob2JqLCAnYm9vbGVhbicsICdudW1iZXInLCAnYmlnaW50JywgJ2Z1bmN0aW9uJykpXG4gICAgICByZXR1cm47XG5cbiAgICBzY29wZS50eXBlID0gKG9iai5jb25zdHJ1Y3RvcikgPyBvYmouY29uc3RydWN0b3IubmFtZSA6ICdPYmplY3QnO1xuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGtleSAgID0ga2V5c1tpXTtcbiAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuXG4gICAgICBzY29wZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgc2NvcGUua2V5ID0ga2V5O1xuICAgICAgc2NvcGUuaW5kZXggPSBpO1xuXG4gICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoX2l0ZXJhdGUsIHtcbiAgJ1NUT1AnOiB7XG4gICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgdmFsdWU6ICAgICAgICBTVE9QLFxuICB9LFxufSk7XG5cbmNvbnN0IGl0ZXJhdGUgPSBfaXRlcmF0ZTtcblxuZnVuY3Rpb24gY2hpbGRyZW5EaWZmZXIoX2NoaWxkcmVuMSwgX2NoaWxkcmVuMikge1xuICBsZXQgY2hpbGRyZW4xID0gKCFBcnJheS5pc0FycmF5KF9jaGlsZHJlbjEpKSA/IFsgX2NoaWxkcmVuMSBdIDogX2NoaWxkcmVuMTtcbiAgbGV0IGNoaWxkcmVuMiA9ICghQXJyYXkuaXNBcnJheShfY2hpbGRyZW4yKSkgPyBbIF9jaGlsZHJlbjIgXSA6IF9jaGlsZHJlbjI7XG5cbiAgcmV0dXJuIChkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKC4uLmNoaWxkcmVuMSkgIT09IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oLi4uY2hpbGRyZW4yKSk7XG59XG5cbmZ1bmN0aW9uIGZldGNoRGVlcFByb3BlcnR5KG9iaiwgX2tleSwgZGVmYXVsdFZhbHVlLCBsYXN0UGFydCkge1xuICBpZiAob2JqID09IG51bGwgfHwgT2JqZWN0LmlzKE5hTiwgb2JqKSB8fCBPYmplY3QuaXMoSW5maW5pdHksIG9iaikpXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgbnVsbCBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGlmIChfa2V5ID09IG51bGwgfHwgT2JqZWN0LmlzKE5hTiwgX2tleSkgfHwgT2JqZWN0LmlzKEluZmluaXR5LCBfa2V5KSlcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBudWxsIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgbGV0IHBhcnRzO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KF9rZXkpKSB7XG4gICAgcGFydHMgPSBfa2V5O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBfa2V5ID09PSAnc3ltYm9sJykge1xuICAgIHBhcnRzID0gWyBfa2V5IF07XG4gIH0gZWxzZSB7XG4gICAgbGV0IGtleSAgICAgICAgID0gKCcnICsgX2tleSk7XG4gICAgbGV0IGxhc3RJbmRleCAgID0gMDtcbiAgICBsZXQgbGFzdEN1cnNvciAgPSAwO1xuXG4gICAgcGFydHMgPSBbXTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgbGV0IGluZGV4ID0ga2V5LmluZGV4T2YoJy4nLCBsYXN0SW5kZXgpO1xuICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICBwYXJ0cy5wdXNoKGtleS5zdWJzdHJpbmcobGFzdEN1cnNvcikpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKGtleS5jaGFyQXQoaW5kZXggLSAxKSA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHBhcnRzLnB1c2goa2V5LnN1YnN0cmluZyhsYXN0Q3Vyc29yLCBpbmRleCkpO1xuICAgICAgbGFzdEN1cnNvciA9IGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICB9XG4gIH1cblxuICBsZXQgcGFydE4gPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBwYXJ0TiBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGxldCBjdXJyZW50VmFsdWUgPSBvYmo7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IHBhcnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQga2V5ID0gcGFydHNbaV07XG5cbiAgICBjdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWVba2V5XTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09IG51bGwpXG4gICAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBwYXJ0TiBdIDogZGVmYXVsdFZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGN1cnJlbnRWYWx1ZSwgcGFydE4gXSA6IGN1cnJlbnRWYWx1ZTtcbn1cblxuZnVuY3Rpb24gYmluZE1ldGhvZHMoX3Byb3RvLCBza2lwUHJvdG9zKSB7XG4gIGxldCBwcm90byAgICAgICAgICAgPSBfcHJvdG87XG4gIGxldCBhbHJlYWR5VmlzaXRlZCAgPSBuZXcgU2V0KCk7XG5cbiAgd2hpbGUgKHByb3RvKSB7XG4gICAgbGV0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMocHJvdG8pO1xuICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKGRlc2NyaXB0b3JzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhkZXNjcmlwdG9ycykpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChrZXkgPT09ICdjb25zdHJ1Y3RvcicpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoYWxyZWFkeVZpc2l0ZWQuaGFzKGtleSkpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBhbHJlYWR5VmlzaXRlZC5hZGQoa2V5KTtcblxuICAgICAgbGV0IHZhbHVlID0gcHJvdG9ba2V5XTtcblxuICAgICAgLy8gU2tpcCBwcm90b3R5cGUgb2YgT2JqZWN0XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIE9iamVjdC5wcm90b3R5cGVba2V5XSA9PT0gdmFsdWUpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgdGhpc1trZXldID0gdmFsdWUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgaWYgKHByb3RvID09PSBPYmplY3QucHJvdG90eXBlKVxuICAgICAgYnJlYWs7XG5cbiAgICBpZiAoc2tpcFByb3RvcyAmJiBza2lwUHJvdG9zLmluZGV4T2YocHJvdG8pID49IDApXG4gICAgICBicmVhaztcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgTmFOKSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoaW5zdGFuY2VPZih2YWx1ZSwgJ3N0cmluZycpKVxuICAgIHJldHVybiAhKC9cXFMvKS50ZXN0KHZhbHVlKTtcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZih2YWx1ZSwgJ251bWJlcicpICYmIGlzRmluaXRlKHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGVsc2UgaWYgKCFpbnN0YW5jZU9mKHZhbHVlLCAnYm9vbGVhbicsICdiaWdpbnQnLCAnZnVuY3Rpb24nKSAmJiBzaXplT2YodmFsdWUpID09PSAwKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNOb3RFbXB0eSh2YWx1ZSkge1xuICByZXR1cm4gIWlzRW1wdHkuY2FsbCh0aGlzLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5BcnJheSh2YWx1ZSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgIHJldHVybiB2YWx1ZTtcblxuICBsZXQgbmV3QXJyYXkgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gdmFsdWUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBpdGVtID0gdmFsdWVbaV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpXG4gICAgICBuZXdBcnJheSA9IG5ld0FycmF5LmNvbmNhdChmbGF0dGVuQXJyYXkoaXRlbSkpO1xuICAgIGVsc2VcbiAgICAgIG5ld0FycmF5LnB1c2goaXRlbSk7XG4gIH1cblxuICByZXR1cm4gbmV3QXJyYXk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICBpZiAoY2hpbGQgPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBjaGlsZCA9PT0gJ2Jvb2xlYW4nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKGNoaWxkLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXMoY2hpbGQsIE5hTikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwgfHwgT2JqZWN0LmlzKGNoaWxkLCBOYU4pIHx8IE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gKEFycmF5LmlzQXJyYXkoY2hpbGQpIHx8IHR5cGVvZiBjaGlsZCA9PT0gJ29iamVjdCcgJiYgIWluc3RhbmNlT2YoY2hpbGQsICdib29sZWFuJywgJ251bWJlcicsICdzdHJpbmcnKSk7XG59XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIGVsc2VcbiAgICByZXR1cm4gRGF0ZS5ub3coKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xuICBpZiAodXVpZCA+IDk5OTk5OTkpXG4gICAgdXVpZCA9IDEwMDAwMDA7XG5cbiAgcmV0dXJuIGAke0RhdGUubm93KCl9LiR7dXVpZCsrfSR7TWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApLnRvU3RyaW5nKCkucGFkU3RhcnQoMjAsICcwJyl9YDtcbn1cblxuXG4vKioqLyB9KVxuXG4vKioqKioqLyB9KTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyB2YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG4vKioqKioqLyBcbi8qKioqKiovIC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG4vKioqKioqLyBcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcbi8qKioqKiovIFx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG4vKioqKioqLyBcdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG4vKioqKioqLyBcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcbi8qKioqKiovIFx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuLyoqKioqKi8gXHRcdGV4cG9ydHM6IHt9XG4vKioqKioqLyBcdH07XG4vKioqKioqLyBcbi8qKioqKiovIFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4vKioqKioqLyBcdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuLyoqKioqKi8gXG4vKioqKioqLyBcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIH1cbi8qKioqKiovIFxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyAqL1xuLyoqKioqKi8gKCgpID0+IHtcbi8qKioqKiovIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuLyoqKioqKi8gXHRcdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcbi8qKioqKiovIFx0XHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuLyoqKioqKi8gXHRcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0fTtcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9nbG9iYWwgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcbi8qKioqKiovIFx0XHR0cnkge1xuLyoqKioqKi8gXHRcdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG4vKioqKioqLyBcdFx0fSBjYXRjaCAoZSkge1xuLyoqKioqKi8gXHRcdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSlcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcbi8qKioqKiovIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbi8qKioqKiovIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqKioqKi8gXHR9O1xuLyoqKioqKi8gfSkoKTtcbi8qKioqKiovIFxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0ge307XG4vLyBUaGlzIGVudHJ5IG5lZWQgdG8gYmUgd3JhcHBlZCBpbiBhbiBJSUZFIGJlY2F1c2UgaXQgbmVlZCB0byBiZSBpc29sYXRlZCBhZ2FpbnN0IG90aGVyIG1vZHVsZXMgaW4gdGhlIGNodW5rLlxuKCgpID0+IHtcbi8qISoqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvaW5kZXguanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKiovXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIiRcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLiQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNvbXBvbmVudFwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uQ29tcG9uZW50KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDb21wb25lbnRzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENvbXBvbmVudHMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkppYnNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSmlicyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUmVuZGVyZXJzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFJlbmRlcmVycyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiVXRpbHNcIjogKCkgPT4gKC8qIHJlZXhwb3J0IG1vZHVsZSBvYmplY3QgKi8gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18pLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImRlYWRiZWVmXCI6ICgpID0+ICgvKiByZWV4cG9ydCBkZWZhdWx0IGV4cG9ydCBmcm9tIG5hbWVkIG1vZHVsZSAqLyBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfNF9fKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJmYWN0b3J5XCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5mYWN0b3J5KVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9qaWIuanMgKi8gXCIuL2xpYi9qaWIuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9jb21wb25lbnQuanMgKi8gXCIuL2xpYi9jb21wb25lbnQuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yZW5kZXJlcnMvaW5kZXguanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvaW5kZXguanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3V0aWxzLmpzICovIFwiLi9saWIvdXRpbHMuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzRfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuXG5cbmNvbnN0IEppYnMgPSB7XG4gIEpJQl9CQVJSRU46IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUJfQkFSUkVOLFxuICBKSUJfUFJPWFk6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUJfUFJPWFksXG4gIEpJQl9SQVdfVEVYVDogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkpJQl9SQVdfVEVYVCxcbiAgSklCOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCLFxuICBKaWI6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KaWIsXG4gIGlzSmliaXNoOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uaXNKaWJpc2gsXG4gIGNvbnN0cnVjdEppYjogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmNvbnN0cnVjdEppYixcbiAgcmVzb2x2ZUNoaWxkcmVuOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18ucmVzb2x2ZUNoaWxkcmVuLFxufTtcblxuXG5cbmNvbnN0IENvbXBvbmVudHMgPSB7XG4gIFVQREFURV9FVkVOVDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlVQREFURV9FVkVOVCxcbiAgUVVFVUVfVVBEQVRFX01FVEhPRDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlFVRVVFX1VQREFURV9NRVRIT0QsXG4gIEZMVVNIX1VQREFURV9NRVRIT0Q6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5GTFVTSF9VUERBVEVfTUVUSE9ELFxuICBJTklUX01FVEhPRDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLklOSVRfTUVUSE9ELFxuICBTS0lQX1NUQVRFX1VQREFURVM6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5TS0lQX1NUQVRFX1VQREFURVMsXG4gIFBFTkRJTkdfU1RBVEVfVVBEQVRFOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uUEVORElOR19TVEFURV9VUERBVEUsXG4gIExBU1RfUkVOREVSX1RJTUU6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5MQVNUX1JFTkRFUl9USU1FLFxuICBQUkVWSU9VU19TVEFURTogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlBSRVZJT1VTX1NUQVRFLFxufTtcblxuXG5cbmNvbnN0IFJlbmRlcmVycyA9IHtcbiAgQ09OVEVYVF9JRDogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJvb3ROb2RlLkNPTlRFWFRfSUQsXG4gIEZPUkNFX1JFRkxPVzogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLkZPUkNFX1JFRkxPVyxcbiAgUm9vdE5vZGU6IF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5Sb290Tm9kZSxcbiAgUmVuZGVyZXI6IF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5SZW5kZXJlcixcbn07XG5cblxuXG5cblxuXG59KSgpO1xuXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyQgPSBfX3dlYnBhY2tfZXhwb3J0c19fLiQ7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX0NvbXBvbmVudCA9IF9fd2VicGFja19leHBvcnRzX18uQ29tcG9uZW50O1xudmFyIF9fd2VicGFja19leHBvcnRzX19Db21wb25lbnRzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5Db21wb25lbnRzO1xudmFyIF9fd2VicGFja19leHBvcnRzX19KaWJzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5KaWJzO1xudmFyIF9fd2VicGFja19leHBvcnRzX19SZW5kZXJlcnMgPSBfX3dlYnBhY2tfZXhwb3J0c19fLlJlbmRlcmVycztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fVXRpbHMgPSBfX3dlYnBhY2tfZXhwb3J0c19fLlV0aWxzO1xudmFyIF9fd2VicGFja19leHBvcnRzX19kZWFkYmVlZiA9IF9fd2VicGFja19leHBvcnRzX18uZGVhZGJlZWY7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX2ZhY3RvcnkgPSBfX3dlYnBhY2tfZXhwb3J0c19fLmZhY3Rvcnk7XG5leHBvcnQgeyBfX3dlYnBhY2tfZXhwb3J0c19fJCBhcyAkLCBfX3dlYnBhY2tfZXhwb3J0c19fQ29tcG9uZW50IGFzIENvbXBvbmVudCwgX193ZWJwYWNrX2V4cG9ydHNfX0NvbXBvbmVudHMgYXMgQ29tcG9uZW50cywgX193ZWJwYWNrX2V4cG9ydHNfX0ppYnMgYXMgSmlicywgX193ZWJwYWNrX2V4cG9ydHNfX1JlbmRlcmVycyBhcyBSZW5kZXJlcnMsIF9fd2VicGFja19leHBvcnRzX19VdGlscyBhcyBVdGlscywgX193ZWJwYWNrX2V4cG9ydHNfX2RlYWRiZWVmIGFzIGRlYWRiZWVmLCBfX3dlYnBhY2tfZXhwb3J0c19fZmFjdG9yeSBhcyBmYWN0b3J5IH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYVc1a1pYZ3Vhbk1pTENKdFlYQndhVzVuY3lJNklqczdPenM3T3pzN1FVRkJRVHM3UVVGRllUczdRVUZGWWl3clJFRkJLMFFzY1VKQlFVMDdRVUZEY2tVN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CTEhsRFFVRjVReXhSUVVGUk8wRkJRMnBFTEZWQlFWVXNiMEpCUVc5Q08wRkJRemxDTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzY1VKQlFYRkNMR1ZCUVdVN08wRkJSWEJETzBGQlEwRTdRVUZEUVN4dFEwRkJiVU1zU1VGQlNTeGxRVUZsTEVsQlFVazdPMEZCUlRGRU8wRkJRMEU3TzBGQlJVRXNZMEZCWXl4UFFVRlBMRWRCUVVjc1NVRkJTVHRCUVVNMVFqczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEdsQ1FVRnBRaXhYUVVGWExFZEJRVWNzWTBGQll6dEJRVU0zUXp0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc2VVTkJRWGxETEZGQlFWRTdRVUZEYWtRN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc2VVTkJRWGxETEZGQlFWRTdRVUZEYWtRN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJMRzFDUVVGdFFpeHRRa0ZCYlVJN1FVRkRkRU03TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeEhRVUZITzBGQlEwZzdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFZEJRVWM3UVVGRFNEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1IwRkJSenRCUVVOSU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4SFFVRkhPMEZCUTBnc1EwRkJRenM3UVVGRlJEczdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJReTlJUVRzN1FVRkZaME03UVVGRFZ6dEJRVU5FTzBGQlMzaENPenRCUVVWWU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlVEczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZQTEhkQ1FVRjNRaXh2UkVGQldUdEJRVU16UXpzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4SlFVRkpMSFZFUVVGelFqczdRVUZGTVVJN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hUUVVGVE8wRkJRMVE3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFc1UwRkJVenRCUVVOVUxFOUJRVTg3UVVGRFVEczdRVUZGUVN4M1JVRkJkMFU3UVVGRGVFVTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3h6UWtGQmMwSXNNRU5CUVZNN1FVRkRMMElzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc2QwSkJRWGRDTzBGQlEzaENMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4VFFVRlRPMEZCUTFRN1FVRkRRVHRCUVVOQkxHOUZRVUZ2UlN4TlFVRk5PenRCUVVVeFJUdEJRVU5CTEZOQlFWTTdRVUZEVkN4UFFVRlBPMEZCUTFBc1MwRkJTenRCUVVOTU96dEJRVVZCTzBGQlEwRXNWMEZCVnl4NVJFRkJiMEk3UVVGREwwSTdPMEZCUlVFN1FVRkRRU3hYUVVGWExHbEVRVUZSTzBGQlEyNUNPenRCUVVWQk8wRkJRMEVzVjBGQlZ5eHhSRUZCV1R0QlFVTjJRanM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVTBGQlV6dEJRVU5VTEU5QlFVODdRVUZEVURzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQkxGRkJRVkVzYVVSQlFXZENPMEZCUTNoQ08wRkJRMEU3TzBGQlJVRXNkME5CUVhkRExGRkJRVkU3UVVGRGFFUTdRVUZEUVN4clEwRkJhME1zZDBSQlFYVkNPMEZCUTNwRU8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxFMUJRVTA3UVVGRFRpeGhRVUZoTEhkRVFVRjFRanRCUVVOd1F6dEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hwUlVGQmFVVXNUVUZCVFRzN1FVRkZka1U3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc2QwVkJRWGRGTEUxQlFVMDdPMEZCUlRsRk8wRkJRMEU3UVVGRFFUdEJRVU5CTEUxQlFVMDdRVUZEVGp0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTEhORFFVRnpReXhSUVVGUk8wRkJRemxETzBGQlEwRTdRVUZEUVRzN1FVRkZRU3hWUVVGVkxHbEVRVUZuUWp0QlFVTXhRaXd5UTBGQk1rTXNhVVJCUVdkQ08wRkJRek5FTERSRFFVRTBReXhSUVVGUk8wRkJRM0JFTzBGQlEwRTdRVUZEUVR0QlFVTkJMRkZCUVZFN1FVRkRVanRCUVVOQk8wRkJRMEU3TzBGQlJVRXNaVUZCWlN4cFJFRkJaMEk3UVVGREwwSTdPMEZCUlVFc2FVSkJRV2xDTEdsRVFVRm5RanRCUVVOcVF5eFRRVUZUT3p0QlFVVlVMRFJEUVVFMFF5eFJRVUZSTzBGQlEzQkVPMEZCUTBFN1FVRkRRVHRCUVVOQkxGRkJRVkVzVTBGQlV5eHBSRUZCWjBJN1FVRkRha003UVVGRFFTd3dRMEZCTUVNc1VVRkJVVHRCUVVOc1JEdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hWUVVGVkxHbEVRVUZuUWp0QlFVTXhRanM3UVVGRlFUdEJRVU5CTERoRFFVRTRReXhSUVVGUk8wRkJRM1JFTzBGQlEwRXNZMEZCWXl4cFJFRkJaMEk3UVVGRE9VSTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEZGQlFWRTdRVUZEVWp0QlFVTkJMREJEUVVFd1F5eFJRVUZSTzBGQlEyeEVPMEZCUTBFN1FVRkRRVHM3UVVGRlFTeGpRVUZqTEdsRVFVRm5RanRCUVVNNVFqdEJRVU5CTEcxQ1FVRnRRaXhwUkVGQlowSTdRVUZEYmtNN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3gzUWtGQmQwSTdRVUZEZUVJc1QwRkJUenRCUVVOUU96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeFBRVUZQT3p0QlFVVlFPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNWVUZCVlR0QlFVTldPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUVzY1VOQlFYRkRMRkZCUVZFN1FVRkROME03UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4MVFrRkJkVUlzY1VOQlFWRTdRVUZETDBJN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3T3pzN096czdPenM3T3pzN096dEJReTltUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUUxFdEJRVXM3UVVGRFREczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRXNkVU5CUVhWRExGRkJRVkU3UVVGREwwTTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3UVVNM1IyZERPMEZCUTBrN08wRkJSVGRDTzBGQlExQTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeDNRa0ZCZDBJc1owTkJRV2RETEVkQlFVYzdRVUZETTBRc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNjMEpCUVhOQ0xHMUVRVUZyUWp0QlFVTjRReXhQUVVGUE8wRkJRMUFzUzBGQlN6dEJRVU5NTzBGQlEwRTdPMEZCUlU4N1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEVUN4eFEwRkJjVU03UVVGRGNrTTdRVUZEUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFc1dVRkJXU3hwUkVGQlowSXNPRU5CUVRoRExHbEVRVUZuUWp0QlFVTXhSanRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxGZEJRVmM3UVVGRFdEczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVTBGQlV6dEJRVU5VTEZOQlFWTXNNa05CUVdNN1FVRkRka0k3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4VFFVRlRPMEZCUTFRc1QwRkJUenM3UVVGRlVEdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUN4UFFVRlBMREpEUVVGak8wRkJRM0pDTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUUxFdEJRVXM3TzBGQlJVdzdRVUZEUVR0QlFVTkJPenRCUVVWUE96dEJRVVZCTzBGQlExQTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlU4N1FVRkRVRHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN08wRkJSVUVzVFVGQlRTeHBSRUZCWjBJN1FVRkRkRUk3TzBGQlJVRXNhVU5CUVdsRExITkVRVUZ4UWl4NVJVRkJlVVVzYlVSQlFXdENPMEZCUTJwS096dEJRVVZCTEdsQ1FVRnBRaXc0UTBGQllTeHZRa0ZCYjBJc1pVRkJaVHRCUVVOcVJTeHBRa0ZCYVVJc2FVUkJRV2RDT3p0QlFVVnFRenRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEVkQlFVYzdPMEZCUlVnN1FVRkRRVHM3T3pzN096czdPenM3T3pzN096czdPenM3UVVOcVNuZENPenRCUVVWcVFqczdRVUZGYTBNN096czdPenM3T3pzN096czdPenM3UVVOS2FrSTdPMEZCUlhoQ08wRkJRMEU3TzBGQlJVOHNkVUpCUVhWQ0xHMUVRVUZSTzBGQlEzUkRMRzlDUVVGdlFpeHRSRUZCVVRzN1FVRkZOVUk3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQkxHdEVRVUZyUkN4eFJFRkJWVHM3UVVGRk5VUTdRVUZEUVR0QlFVTkJMSGxDUVVGNVFpeHhSRUZCVlR0QlFVTnVReXh4UkVGQmNVUXNjVVJCUVZVN1FVRkRMMFE3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRXNlVUpCUVhsQ0xIRkVRVUZWTzBGQlEyNURPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRXNUMEZCVHp0QlFVTlFMRXRCUVVzN1FVRkRURHRCUVVOQk96czdPenM3T3pzN096czdPenM3T3pzN08wRkRha1JuUXp0QlFVTkxPMEZCUTFFN08wRkJSWFJET3p0QlFVVkJPMEZCUTFBN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzT0VKQlFUaENPMEZCUXpsQ0xFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMSE5DUVVGelFpeHRSRUZCYTBJN1FVRkRlRU1zVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFRRVUZUTzBGQlExUXNPRUpCUVRoQ08wRkJRemxDTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQXNTMEZCU3p0QlFVTk1PenRCUVVWQk8wRkJRMEVzVjBGQlZ5eDVSRUZCYjBJN1FVRkRMMEk3TzBGQlJVRTdRVUZEUVN4VlFVRlZMR05CUVdNc2FVSkJRV2xDTzBGQlEzcERMRzFDUVVGdFFpeHhRMEZCVVRzN1FVRkZNMEk3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeFhRVUZYTEcxRVFVRnJRanRCUVVNM1FqczdRVUZGUVR0QlFVTkJMRmRCUVZjc2MwUkJRWEZDTzBGQlEyaERPenRCUVVWQk8wRkJRMEVzVjBGQlZ5eHJSRUZCYVVJN1FVRkROVUk3TzBGQlJVRTdRVUZEUVN4WFFVRlhMSEZFUVVGdlFqdEJRVU12UWpzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzVTBGQlV6dEJRVU5VTzBGQlEwRTdRVUZEUVR0QlFVTkJMRk5CUVZNN1FVRkRWQ3hOUVVGTk8wRkJRMDQ3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN08wRkROMDVCTzBGQlEyZERPenRCUVVWb1F6czdRVUZGUVR0QlFVTkJMREJIUVVFd1J5eFRRVUZKT3p0QlFVVTVSenM3UVVGRlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTERCRFFVRXdReXhUUVVGVE8wRkJRMjVFTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZQTzBGQlExQTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJMSEZEUVVGeFF5eFJRVUZSTzBGQlF6ZERPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeHZRa0ZCYjBJN1FVRkRjRUk3TzBGQlJVRTdRVUZEUVRzN1FVRkZRU3h4UTBGQmNVTXNVVUZCVVR0QlFVTTNRenRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzU1VGQlNUdEJRVU5LTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTEUxQlFVMDdRVUZEVGpzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4SlFVRkpPMEZCUTBvN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJMSE5EUVVGelF5eFJRVUZSTzBGQlF6bERPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hIUVVGSE8wRkJRMGdzUTBGQlF6czdRVUZGVFRzN1FVRkZRVHRCUVVOUU8wRkJRMEU3TzBGQlJVRXNWVUZCVlN4eFEwRkJVU3h0UWtGQmJVSXNjVU5CUVZFN1FVRkROME03TzBGQlJVODdRVUZEVUR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdPMEZCUlVFN1FVRkRRVHRCUVVOQkxFbEJRVWs3UVVGRFNqdEJRVU5CTEVsQlFVazdRVUZEU2p0QlFVTkJPMEZCUTBFN08wRkJSVUU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRXNjVU5CUVhGRExGRkJRVkU3UVVGRE4wTTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQkxITkRRVUZ6UXl4UlFVRlJPMEZCUXpsRE8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVODdRVUZEVUR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlR6dEJRVU5RTzBGQlEwRTdPMEZCUlU4N1FVRkRVRHRCUVVOQk96dEJRVVZCTzBGQlEwRXNjVU5CUVhGRExGRkJRVkU3UVVGRE4wTTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlU4N1FVRkRVRHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVTg3UVVGRFVEdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGUVN4WlFVRlpMRmRCUVZjc1IwRkJSeXhQUVVGUExFVkJRVVVzYTBWQlFXdEZPMEZCUTNKSE96czdPenM3TzFORE4ySkJPMU5CUTBFN08xTkJSVUU3VTBGRFFUdFRRVU5CTzFOQlEwRTdVMEZEUVR0VFFVTkJPMU5CUTBFN1UwRkRRVHRUUVVOQk8xTkJRMEU3VTBGRFFUdFRRVU5CTzFOQlEwRTdPMU5CUlVFN1UwRkRRVHM3VTBGRlFUdFRRVU5CTzFOQlEwRTdPenM3TzFWRGRFSkJPMVZCUTBFN1ZVRkRRVHRWUVVOQk8xVkJRMEVzZVVOQlFYbERMSGREUVVGM1F6dFZRVU5xUmp0VlFVTkJPMVZCUTBFN096czdPMVZEVUVFN1ZVRkRRVHRWUVVOQk8xVkJRMEU3VlVGRFFTeEhRVUZITzFWQlEwZzdWVUZEUVR0VlFVTkJMRU5CUVVNN096czdPMVZEVUVRN096czdPMVZEUVVFN1ZVRkRRVHRWUVVOQk8xVkJRMEVzZFVSQlFYVkVMR2xDUVVGcFFqdFZRVU40UlR0VlFVTkJMR2RFUVVGblJDeGhRVUZoTzFWQlF6ZEVPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRMHRyUWpzN1FVRkZXRHRCUVVOUUxGbEJRVms3UVVGRFdpeFhRVUZYTzBGQlExZ3NZMEZCWXp0QlFVTmtMRXRCUVVzN1FVRkRUQ3hMUVVGTE8wRkJRMHdzVlVGQlZUdEJRVU5XTEdOQlFXTTdRVUZEWkN4cFFrRkJhVUk3UVVGRGFrSTdPMEZCWVhkQ096dEJRVVZxUWp0QlFVTlFMR05CUVdNN1FVRkRaQ3h4UWtGQmNVSTdRVUZEY2tJc2NVSkJRWEZDTzBGQlEzSkNMR0ZCUVdFN1FVRkRZaXh2UWtGQmIwSTdRVUZEY0VJc2MwSkJRWE5DTzBGQlEzUkNMR3RDUVVGclFqdEJRVU5zUWl4blFrRkJaMEk3UVVGRGFFSTdPMEZCVFRoQ096dEJRVVYyUWp0QlFVTlFMR05CUVdNc2IwVkJRVzFDTzBGQlEycERMR05CUVdNN1FVRkRaQ3hWUVVGVk8wRkJRMVlzVlVGQlZUdEJRVU5XT3p0QlFVVnZRenRCUVVOWE96dEJRVTAzUXlJc0luTnZkWEpqWlhNaU9sc2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXViMlJsWDIxdlpIVnNaWE12WkdWaFpHSmxaV1l2YkdsaUwybHVaR1Y0TG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2WTI5dGNHOXVaVzUwTG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2WlhabGJuUnpMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZhbWxpTG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2Y21WdVpHVnlaWEp6TDJsdVpHVjRMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZjbVZ1WkdWeVpYSnpMM0psYm1SbGNtVnlMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZjbVZ1WkdWeVpYSnpMM0p2YjNRdGJtOWtaUzVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMM1YwYVd4ekxtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZkMlZpY0dGamF5OWliMjkwYzNSeVlYQWlMQ0ozWldKd1lXTnJPaTh2YW1saWN5OTNaV0p3WVdOckwzSjFiblJwYldVdlpHVm1hVzVsSUhCeWIzQmxjblI1SUdkbGRIUmxjbk1pTENKM1pXSndZV05yT2k4dmFtbGljeTkzWldKd1lXTnJMM0oxYm5ScGJXVXZaMnh2WW1Gc0lpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdmQyVmljR0ZqYXk5eWRXNTBhVzFsTDJoaGMwOTNibEJ5YjNCbGNuUjVJSE5vYjNKMGFHRnVaQ0lzSW5kbFluQmhZMnM2THk5cWFXSnpMM2RsWW5CaFkyc3ZjblZ1ZEdsdFpTOXRZV3RsSUc1aGJXVnpjR0ZqWlNCdlltcGxZM1FpTENKM1pXSndZV05yT2k4dmFtbGljeTh1TDJ4cFlpOXBibVJsZUM1cWN5SmRMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUl2THlCRGIzQjVjbWxuYUhRZ01qQXlNaUJYZVdGMGRDQkhjbVZsYm5kaGVWeHVYRzRuZFhObElITjBjbWxqZENjN1hHNWNibU52Ym5OMElIUm9hWE5IYkc5aVlXd2dQU0FvS0hSNWNHVnZaaUIzYVc1a2IzY2dJVDA5SUNkMWJtUmxabWx1WldRbktTQS9JSGRwYm1SdmR5QTZJR2RzYjJKaGJDa2dmSHdnZEdocGN6dGNibU52Ym5OMElFUkZRVVJDUlVWR1gxSkZSbDlOUVZCZlMwVlpJRDBnVTNsdFltOXNMbVp2Y2lnblFFQmtaV0ZrWW1WbFpsSmxaazFoY0NjcE8xeHVZMjl1YzNRZ1ZVNUpVVlZGWDBsRVgxTlpUVUpQVENBOUlGTjViV0p2YkM1bWIzSW9KMEJBWkdWaFpHSmxaV1pWYm1seGRXVkpSQ2NwTzF4dVkyOXVjM1FnY21WbVRXRndJRDBnS0hSb2FYTkhiRzlpWVd4YlJFVkJSRUpGUlVaZlVrVkdYMDFCVUY5TFJWbGRLU0EvSUhSb2FYTkhiRzlpWVd4YlJFVkJSRUpGUlVaZlVrVkdYMDFCVUY5TFJWbGRJRG9nYm1WM0lGZGxZV3ROWVhBb0tUdGNibU52Ym5OMElHbGtTR1ZzY0dWeWN5QTlJRnRkTzF4dVhHNXBaaUFvSVhSb2FYTkhiRzlpWVd4YlJFVkJSRUpGUlVaZlVrVkdYMDFCVUY5TFJWbGRLVnh1SUNCMGFHbHpSMnh2WW1Gc1cwUkZRVVJDUlVWR1gxSkZSbDlOUVZCZlMwVlpYU0E5SUhKbFprMWhjRHRjYmx4dWJHVjBJSFYxYVdSRGIzVnVkR1Z5SUQwZ01HNDdYRzVjYm1aMWJtTjBhVzl1SUdkbGRFaGxiSEJsY2tadmNsWmhiSFZsS0haaGJIVmxLU0I3WEc0Z0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJR2xrU0dWc2NHVnljeTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1NCN1hHNGdJQ0FnYkdWMElIc2dhR1ZzY0dWeUxDQm5aVzVsY21GMGIzSWdmU0E5SUdsa1NHVnNjR1Z5YzF0cFhUdGNiaUFnSUNCcFppQW9hR1ZzY0dWeUtIWmhiSFZsS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUJuWlc1bGNtRjBiM0k3WEc0Z0lIMWNibjFjYmx4dVpuVnVZM1JwYjI0Z1lXNTVkR2hwYm1kVWIwbEVLRjloY21jc0lGOWhiSEpsWVdSNVZtbHphWFJsWkNrZ2UxeHVJQ0JzWlhRZ1lYSm5JRDBnWDJGeVp6dGNiaUFnYVdZZ0tHRnlaeUJwYm5OMFlXNWpaVzltSUU1MWJXSmxjaUI4ZkNCaGNtY2dhVzV6ZEdGdVkyVnZaaUJUZEhKcGJtY2dmSHdnWVhKbklHbHVjM1JoYm1ObGIyWWdRbTl2YkdWaGJpbGNiaUFnSUNCaGNtY2dQU0JoY21jdWRtRnNkV1ZQWmlncE8xeHVYRzRnSUd4bGRDQjBlWEJsVDJZZ1BTQjBlWEJsYjJZZ1lYSm5PMXh1WEc0Z0lHbG1JQ2gwZVhCbFQyWWdQVDA5SUNkdWRXMWlaWEluSUNZbUlHRnlaeUE5UFQwZ01Da2dlMXh1SUNBZ0lHbG1JQ2hQWW1wbFkzUXVhWE1vWVhKbkxDQXRNQ2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdKMjUxYldKbGNqb3RNQ2M3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdKMjUxYldKbGNqb3JNQ2M3WEc0Z0lIMWNibHh1SUNCcFppQW9kSGx3WlU5bUlEMDlQU0FuYzNsdFltOXNKeWxjYmlBZ0lDQnlaWFIxY200Z1lITjViV0p2YkRva2UyRnlaeTUwYjFOMGNtbHVaeWdwZldBN1hHNWNiaUFnYVdZZ0tHRnlaeUE5UFNCdWRXeHNJSHg4SUhSNWNHVlBaaUE5UFQwZ0oyNTFiV0psY2ljZ2ZId2dkSGx3WlU5bUlEMDlQU0FuWW05dmJHVmhiaWNnZkh3Z2RIbHdaVTltSUQwOVBTQW5jM1J5YVc1bkp5QjhmQ0IwZVhCbFQyWWdQVDA5SUNkaWFXZHBiblFuS1NCN1hHNGdJQ0FnYVdZZ0tIUjVjR1ZQWmlBOVBUMGdKMjUxYldKbGNpY3BYRzRnSUNBZ0lDQnlaWFIxY200Z0tHRnlaeUE4SURBcElEOGdZRzUxYldKbGNqb2tlMkZ5WjMxZ0lEb2dZRzUxYldKbGNqb3JKSHRoY21kOVlEdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbFQyWWdQVDA5SUNkaWFXZHBiblFuSUNZbUlHRnlaeUE5UFQwZ01HNHBYRzRnSUNBZ0lDQnlaWFIxY200Z0oySnBaMmx1ZERvck1DYzdYRzVjYmlBZ0lDQnlaWFIxY200Z1lDUjdkSGx3WlU5bWZUb2tlMkZ5WjMxZ08xeHVJQ0I5WEc1Y2JpQWdiR1YwSUdsa1NHVnNjR1Z5SUQwZ0tHbGtTR1ZzY0dWeWN5NXNaVzVuZEdnZ1BpQXdJQ1ltSUdkbGRFaGxiSEJsY2tadmNsWmhiSFZsS0dGeVp5a3BPMXh1SUNCcFppQW9hV1JJWld4d1pYSXBYRzRnSUNBZ2NtVjBkWEp1SUdGdWVYUm9hVzVuVkc5SlJDaHBaRWhsYkhCbGNpaGhjbWNwS1R0Y2JseHVJQ0JwWmlBb1ZVNUpVVlZGWDBsRVgxTlpUVUpQVENCcGJpQmhjbWNnSmlZZ2RIbHdaVzltSUdGeVoxdFZUa2xSVlVWZlNVUmZVMWxOUWs5TVhTQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUM4dklGQnlaWFpsYm5RZ2FXNW1hVzVwZEdVZ2NtVmpkWEp6YVc5dVhHNGdJQ0FnYVdZZ0tDRmZZV3h5WldGa2VWWnBjMmwwWldRZ2ZId2dJVjloYkhKbFlXUjVWbWx6YVhSbFpDNW9ZWE1vWVhKbktTa2dlMXh1SUNBZ0lDQWdiR1YwSUdGc2NtVmhaSGxXYVhOcGRHVmtJRDBnWDJGc2NtVmhaSGxXYVhOcGRHVmtJSHg4SUc1bGR5QlRaWFFvS1R0Y2JpQWdJQ0FnSUdGc2NtVmhaSGxXYVhOcGRHVmtMbUZrWkNoaGNtY3BPMXh1SUNBZ0lDQWdjbVYwZFhKdUlHRnVlWFJvYVc1blZHOUpSQ2hoY21kYlZVNUpVVlZGWDBsRVgxTlpUVUpQVEYwb0tTd2dZV3h5WldGa2VWWnBjMmwwWldRcE8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lHbG1JQ2doY21WbVRXRndMbWhoY3loaGNtY3BLU0I3WEc0Z0lDQWdiR1YwSUd0bGVTQTlJR0FrZTNSNWNHVnZaaUJoY21kOU9pUjdLeXQxZFdsa1EyOTFiblJsY24xZ08xeHVJQ0FnSUhKbFprMWhjQzV6WlhRb1lYSm5MQ0JyWlhrcE8xeHVJQ0FnSUhKbGRIVnliaUJyWlhrN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2NtVm1UV0Z3TG1kbGRDaGhjbWNwTzF4dWZWeHVYRzVtZFc1amRHbHZiaUJrWldGa1ltVmxaaWdwSUh0Y2JpQWdiR1YwSUhCaGNuUnpJRDBnV3lCaGNtZDFiV1Z1ZEhNdWJHVnVaM1JvSUYwN1hHNGdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUdGeVozVnRaVzUwY3k1c1pXNW5kR2c3SUdrZ1BDQnBiRHNnYVNzcktWeHVJQ0FnSUhCaGNuUnpMbkIxYzJnb1lXNTVkR2hwYm1kVWIwbEVLR0Z5WjNWdFpXNTBjMXRwWFNrcE8xeHVYRzRnSUhKbGRIVnliaUJ3WVhKMGN5NXFiMmx1S0NjNkp5azdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHUmxZV1JpWldWbVUyOXlkR1ZrS0NrZ2UxeHVJQ0JzWlhRZ2NHRnlkSE1nUFNCYklHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1hUdGNiaUFnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ1lYSm5kVzFsYm5SekxteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BYRzRnSUNBZ2NHRnlkSE11Y0hWemFDaGhibmwwYUdsdVoxUnZTVVFvWVhKbmRXMWxiblJ6VzJsZEtTazdYRzVjYmlBZ2NtVjBkWEp1SUhCaGNuUnpMbk52Y25Rb0tTNXFiMmx1S0NjNkp5azdYRzU5WEc1Y2JtWjFibU4wYVc5dUlHZGxibVZ5WVhSbFNVUkdiM0lvYUdWc2NHVnlMQ0JuWlc1bGNtRjBiM0lwSUh0Y2JpQWdhV1JJWld4d1pYSnpMbkIxYzJnb2V5Qm9aV3h3WlhJc0lHZGxibVZ5WVhSdmNpQjlLVHRjYm4xY2JseHVablZ1WTNScGIyNGdjbVZ0YjNabFNVUkhaVzVsY21GMGIzSW9hR1ZzY0dWeUtTQjdYRzRnSUd4bGRDQnBibVJsZUNBOUlHbGtTR1ZzY0dWeWN5NW1hVzVrU1c1a1pYZ29LR2wwWlcwcElEMCtJQ2hwZEdWdExtaGxiSEJsY2lBOVBUMGdhR1ZzY0dWeUtTazdYRzRnSUdsbUlDaHBibVJsZUNBOElEQXBYRzRnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJR2xrU0dWc2NHVnljeTV6Y0d4cFkyVW9hVzVrWlhnc0lERXBPMXh1ZlZ4dVhHNVBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkR2xsY3loa1pXRmtZbVZsWml3Z2UxeHVJQ0FuYVdSVGVXMG5PaUI3WEc0Z0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdWVTVKVVZWRlgwbEVYMU5aVFVKUFRDeGNiaUFnZlN4Y2JpQWdKM052Y25SbFpDYzZJSHRjYmlBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQmtaV0ZrWW1WbFpsTnZjblJsWkN4Y2JpQWdmU3hjYmlBZ0oyZGxibVZ5WVhSbFNVUkdiM0luT2lCN1hHNGdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQjBjblZsTEZ4dUlDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnWjJWdVpYSmhkR1ZKUkVadmNpeGNiaUFnZlN4Y2JpQWdKM0psYlc5MlpVbEVSMlZ1WlhKaGRHOXlKem9nZTF4dUlDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNCMllXeDFaVG9nSUNBZ0lDQWdJSEpsYlc5MlpVbEVSMlZ1WlhKaGRHOXlMRnh1SUNCOUxGeHVmU2s3WEc1Y2JtMXZaSFZzWlM1bGVIQnZjblJ6SUQwZ1pHVmhaR0psWldZN1hHNGlMQ0l2S2lCbmJHOWlZV3dnUW5WbVptVnlJQ292WEc1Y2JtbHRjRzl5ZENCa1pXRmtZbVZsWmlCbWNtOXRJQ2RrWldGa1ltVmxaaWM3WEc1cGJYQnZjblFnZXlCRmRtVnVkRVZ0YVhSMFpYSWdmU0JtY205dElDY3VMMlYyWlc1MGN5NXFjeWM3WEc1cGJYQnZjblFnS2lCaGN5QlZkR2xzY3lBZ0lDQWdJQ0JtY205dElDY3VMM1YwYVd4ekxtcHpKenRjYm1sdGNHOXlkQ0I3WEc0Z0lHbHpTbWxpYVhOb0xGeHVJQ0J5WlhOdmJIWmxRMmhwYkdSeVpXNHNYRzRnSUdOdmJuTjBjblZqZEVwcFlpeGNibjBnWm5KdmJTQW5MaTlxYVdJdWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdWVkJFUVZSRlgwVldSVTVVSUNBZ0lDQWdJQ0FnSUNBZ0lDQTlJQ2RBYW1saWN5OWpiMjF3YjI1bGJuUXZaWFpsYm5RdmRYQmtZWFJsSnp0Y2JtVjRjRzl5ZENCamIyNXpkQ0JSVlVWVlJWOVZVRVJCVkVWZlRVVlVTRTlFSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk12WTI5dGNHOXVaVzUwTDNGMVpYVmxWWEJrWVhSbEp5azdYRzVsZUhCdmNuUWdZMjl1YzNRZ1JreFZVMGhmVlZCRVFWUkZYMDFGVkVoUFJDQWdJQ0FnSUNBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekwyTnZiWEJ2Ym1WdWRDOW1iSFZ6YUZWd1pHRjBaU2NwTzF4dVpYaHdiM0owSUdOdmJuTjBJRWxPU1ZSZlRVVlVTRTlFSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljeTlqYjIxd2IyNWxiblF2WDE5cGJtbDBKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdVMHRKVUY5VFZFRlVSVjlWVUVSQlZFVlRJQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl6YTJsd1UzUmhkR1ZWY0dSaGRHVnpKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdVRVZPUkVsT1IxOVRWRUZVUlY5VlVFUkJWRVVnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl3Wlc1a2FXNW5VM1JoZEdWVmNHUmhkR1VuS1R0Y2JtVjRjRzl5ZENCamIyNXpkQ0JNUVZOVVgxSkZUa1JGVWw5VVNVMUZJQ0FnSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk12WTI5dGNHOXVaVzUwTDJ4aGMzUlNaVzVrWlhKVWFXMWxKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdVRkpGVmtsUFZWTmZVMVJCVkVVZ0lDQWdJQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl3Y21WMmFXOTFjMU4wWVhSbEp5azdYRzVsZUhCdmNuUWdZMjl1YzNRZ1EwRlFWRlZTUlY5U1JVWkZVa1ZPUTBWZlRVVlVTRTlFVXlBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekwyTnZiWEJ2Ym1WdWRDOXdjbVYyYVc5MWMxTjBZWFJsSnlrN1hHNWNibU52Ym5OMElHVnNaVzFsYm5SRVlYUmhRMkZqYUdVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVhHNW1kVzVqZEdsdmJpQnBjMVpoYkdsa1UzUmhkR1ZQWW1wbFkzUW9kbUZzZFdVcElIdGNiaUFnYVdZZ0tIWmhiSFZsSUQwOUlHNTFiR3dwWEc0Z0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dVhHNGdJR2xtSUNoUFltcGxZM1F1YVhNb2RtRnNkV1VzSUU1aFRpa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2hQWW1wbFkzUXVhWE1vZG1Gc2RXVXNJRWx1Wm1sdWFYUjVLU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0haaGJIVmxJR2x1YzNSaGJtTmxiMllnUW05dmJHVmhiaUI4ZkNCMllXeDFaU0JwYm5OMFlXNWpaVzltSUU1MWJXSmxjaUI4ZkNCMllXeDFaU0JwYm5OMFlXNWpaVzltSUZOMGNtbHVaeWxjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdiR1YwSUhSNWNHVlBaaUE5SUhSNWNHVnZaaUIyWVd4MVpUdGNiaUFnYVdZZ0tIUjVjR1ZQWmlBOVBUMGdKM04wY21sdVp5Y2dmSHdnZEhsd1pVOW1JRDA5UFNBbmJuVnRZbVZ5SnlCOGZDQjBlWEJsVDJZZ1BUMDlJQ2RpYjI5c1pXRnVKeWxjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0VGeWNtRjVMbWx6UVhKeVlYa29kbUZzZFdVcEtWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCcFppQW9kSGx3Wlc5bUlFSjFabVpsY2lBaFBUMGdKM1Z1WkdWbWFXNWxaQ2NnSmlZZ1FuVm1abVZ5TG1selFuVm1abVZ5S0haaGJIVmxLU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdjbVYwZFhKdUlIUnlkV1U3WEc1OVhHNWNibVY0Y0c5eWRDQmpiR0Z6Y3lCRGIyMXdiMjVsYm5RZ1pYaDBaVzVrY3lCRmRtVnVkRVZ0YVhSMFpYSWdlMXh1SUNCemRHRjBhV01nVlZCRVFWUkZYMFZXUlU1VUlEMGdWVkJFUVZSRlgwVldSVTVVTzF4dVhHNGdJRnRSVlVWVlJWOVZVRVJCVkVWZlRVVlVTRTlFWFNncElIdGNiaUFnSUNCcFppQW9kR2hwYzF0UVJVNUVTVTVIWDFOVVFWUkZYMVZRUkVGVVJWMHBYRzRnSUNBZ0lDQnlaWFIxY200N1hHNWNiaUFnSUNCMGFHbHpXMUJGVGtSSlRrZGZVMVJCVkVWZlZWQkVRVlJGWFNBOUlGQnliMjFwYzJVdWNtVnpiMngyWlNncE8xeHVJQ0FnSUhSb2FYTmJVRVZPUkVsT1IxOVRWRUZVUlY5VlVFUkJWRVZkTG5Sb1pXNG9kR2hwYzF0R1RGVlRTRjlWVUVSQlZFVmZUVVZVU0U5RVhTNWlhVzVrS0hSb2FYTXBLVHRjYmlBZ2ZWeHVYRzRnSUZ0R1RGVlRTRjlWVUVSQlZFVmZUVVZVU0U5RVhTZ3BJSHRjYmlBZ0lDQXZMeUJYWVhNZ2RHaGxJSE4wWVhSbElIVndaR0YwWlNCallXNWpaV3hzWldRL1hHNGdJQ0FnYVdZZ0tDRjBhR2x6VzFCRlRrUkpUa2RmVTFSQlZFVmZWVkJFUVZSRlhTbGNiaUFnSUNBZ0lISmxkSFZ5Ymp0Y2JseHVJQ0FnSUhSb2FYTXVaVzFwZENoVlVFUkJWRVZmUlZaRlRsUXBPMXh1WEc0Z0lDQWdkR2hwYzF0UVJVNUVTVTVIWDFOVVFWUkZYMVZRUkVGVVJWMGdQU0J1ZFd4c08xeHVJQ0I5WEc1Y2JpQWdXMGxPU1ZSZlRVVlVTRTlFWFNncElIdGNiaUFnSUNCMGFHbHpXMU5MU1ZCZlUxUkJWRVZmVlZCRVFWUkZVMTBnUFNCbVlXeHpaVHRjYmlBZ2ZWeHVYRzRnSUdOdmJuTjBjblZqZEc5eUtGOXFhV0lwSUh0Y2JpQWdJQ0J6ZFhCbGNpZ3BPMXh1WEc0Z0lDQWdMeThnUW1sdVpDQmhiR3dnWTJ4aGMzTWdiV1YwYUc5a2N5QjBieUJjSW5Sb2FYTmNJbHh1SUNBZ0lGVjBhV3h6TG1KcGJtUk5aWFJvYjJSekxtTmhiR3dvZEdocGN5d2dkR2hwY3k1amIyNXpkSEoxWTNSdmNpNXdjbTkwYjNSNWNHVXBPMXh1WEc0Z0lDQWdiR1YwSUdwcFlpQTlJRjlxYVdJZ2ZId2dlMzA3WEc1Y2JpQWdJQ0JqYjI1emRDQmpjbVZoZEdWT1pYZFRkR0YwWlNBOUlDZ3BJRDArSUh0Y2JpQWdJQ0FnSUd4bGRDQnNiMk5oYkZOMFlYUmxJRDBnVDJKcVpXTjBMbU55WldGMFpTaHVkV3hzS1R0Y2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QlFjbTk0ZVNoc2IyTmhiRk4wWVhSbExDQjdYRzRnSUNBZ0lDQWdJR2RsZERvZ0tIUmhjbWRsZEN3Z2NISnZjRTVoYldVcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEdGeVoyVjBXM0J5YjNCT1lXMWxYVHRjYmlBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNBZ2MyVjBPaUFvZEdGeVoyVjBMQ0J3Y205d1RtRnRaU3dnZG1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnWTNWeWNtVnVkRlpoYkhWbElEMGdkR0Z5WjJWMFczQnliM0JPWVcxbFhUdGNiaUFnSUNBZ0lDQWdJQ0JwWmlBb1kzVnljbVZ1ZEZaaGJIVmxJRDA5UFNCMllXeDFaU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0YwYUdselcxTkxTVkJmVTFSQlZFVmZWVkJFUVZSRlUxMHBYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpXMUZWUlZWRlgxVlFSRUZVUlY5TlJWUklUMFJkS0NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0IwWVhKblpYUmJjSEp2Y0U1aGJXVmRJRDBnZG1Gc2RXVTdYRzRnSUNBZ0lDQWdJQ0FnZEdocGN5NXZibE4wWVhSbFZYQmtZWFJsWkNod2NtOXdUbUZ0WlN3Z2RtRnNkV1VzSUdOMWNuSmxiblJXWVd4MVpTazdYRzVjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJSDBwTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JzWlhRZ2NISnZjSE1nSUNBZ0lDQWdQU0JQWW1wbFkzUXVZWE56YVdkdUtFOWlhbVZqZEM1amNtVmhkR1VvYm5Wc2JDa3NJR3BwWWk1d2NtOXdjeUI4ZkNCN2ZTazdYRzRnSUNBZ2JHVjBJRjlzYjJOaGJGTjBZWFJsSUQwZ1kzSmxZWFJsVG1WM1UzUmhkR1VvS1R0Y2JseHVJQ0FnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGFXVnpLSFJvYVhNc0lIdGNiaUFnSUNBZ0lGdFRTMGxRWDFOVVFWUkZYMVZRUkVGVVJWTmRPaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnVzFCRlRrUkpUa2RmVTFSQlZFVmZWVkJFUVZSRlhUb2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCUWNtOXRhWE5sTG5KbGMyOXNkbVVvS1N4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCYlRFRlRWRjlTUlU1RVJWSmZWRWxOUlYwNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnVlhScGJITXVibTkzS0Nrc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ1cwTkJVRlJWVWtWZlVrVkdSVkpGVGtORlgwMUZWRWhQUkZOZE9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUh0OUxGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHBaQ2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0JxYVdJdWFXUXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKM0J5YjNCekp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCd2NtOXdjeXhjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuWTJocGJHUnlaVzRuT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJR3BwWWk1amFHbHNaSEpsYmlCOGZDQmJYU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuWTI5dWRHVjRkQ2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdhbWxpTG1OdmJuUmxlSFFnZkh3Z1QySnFaV04wTG1OeVpXRjBaU2h1ZFd4c0tTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQW5jM1JoZEdVbk9pQjdYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1oyVjBPaUFnSUNBZ0lDQWdJQ0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRjlzYjJOaGJGTjBZWFJsTzF4dUlDQWdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0lDQnpaWFE2SUNBZ0lDQWdJQ0FnSUNoMllXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJR2xtSUNnaGFYTldZV3hwWkZOMFlYUmxUMkpxWldOMEtIWmhiSFZsS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJVZVhCbFJYSnliM0lvWUVsdWRtRnNhV1FnZG1Gc2RXVWdabTl5SUZ3aWRHaHBjeTV6ZEdGMFpWd2lPaUJjSWlSN2RtRnNkV1Y5WENJdUlGQnliM1pwWkdWa0lGd2ljM1JoZEdWY0lpQnRkWE4wSUdKbElHRnVJR2wwWlhKaFlteGxJRzlpYW1WamRDNWdLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lFOWlhbVZqZEM1aGMzTnBaMjRvWDJ4dlkyRnNVM1JoZEdVc0lIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ2ZTazdYRzRnSUgxY2JseHVJQ0J5WlhOdmJIWmxRMmhwYkdSeVpXNG9ZMmhwYkdSeVpXNHBJSHRjYmlBZ0lDQnlaWFIxY200Z2NtVnpiMngyWlVOb2FXeGtjbVZ1TG1OaGJHd29kR2hwY3l3Z1kyaHBiR1J5Wlc0cE8xeHVJQ0I5WEc1Y2JpQWdhWE5LYVdJb2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdhWE5LYVdKcGMyZ29kbUZzZFdVcE8xeHVJQ0I5WEc1Y2JpQWdZMjl1YzNSeWRXTjBTbWxpS0haaGJIVmxLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHTnZibk4wY25WamRFcHBZaWgyWVd4MVpTazdYRzRnSUgxY2JseHVJQ0J3ZFhOb1VtVnVaR1Z5S0hKbGJtUmxjbEpsYzNWc2RDa2dlMXh1SUNBZ0lIUm9hWE11WlcxcGRDaFZVRVJCVkVWZlJWWkZUbFFzSUhKbGJtUmxjbEpsYzNWc2RDazdYRzRnSUgxY2JseHVJQ0F2THlCbGMyeHBiblF0WkdsellXSnNaUzF1WlhoMExXeHBibVVnYm04dGRXNTFjMlZrTFhaaGNuTmNiaUFnYjI1UWNtOXdWWEJrWVhSbFpDaHdjbTl3VG1GdFpTd2dibVYzVm1Gc2RXVXNJRzlzWkZaaGJIVmxLU0I3WEc0Z0lIMWNibHh1SUNBdkx5QmxjMnhwYm5RdFpHbHpZV0pzWlMxdVpYaDBMV3hwYm1VZ2JtOHRkVzUxYzJWa0xYWmhjbk5jYmlBZ2IyNVRkR0YwWlZWd1pHRjBaV1FvY0hKdmNFNWhiV1VzSUc1bGQxWmhiSFZsTENCdmJHUldZV3gxWlNrZ2UxeHVJQ0I5WEc1Y2JpQWdZMkZ3ZEhWeVpWSmxabVZ5Wlc1alpTaHVZVzFsTENCcGJuUmxjbU5sY0hSdmNrTmhiR3hpWVdOcktTQjdYRzRnSUNBZ2JHVjBJRzFsZEdodlpDQTlJSFJvYVhOYlEwRlFWRlZTUlY5U1JVWkZVa1ZPUTBWZlRVVlVTRTlFVTExYmJtRnRaVjA3WEc0Z0lDQWdhV1lnS0cxbGRHaHZaQ2xjYmlBZ0lDQWdJSEpsZEhWeWJpQnRaWFJvYjJRN1hHNWNiaUFnSUNCdFpYUm9iMlFnUFNBb1gzSmxaaXdnY0hKbGRtbHZkWE5TWldZcElEMCtJSHRjYmlBZ0lDQWdJR3hsZENCeVpXWWdQU0JmY21WbU8xeHVYRzRnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JR2x1ZEdWeVkyVndkRzl5UTJGc2JHSmhZMnNnUFQwOUlDZG1kVzVqZEdsdmJpY3BYRzRnSUNBZ0lDQWdJSEpsWmlBOUlHbHVkR1Z5WTJWd2RHOXlRMkZzYkdKaFkyc3VZMkZzYkNoMGFHbHpMQ0J5WldZc0lIQnlaWFpwYjNWelVtVm1LVHRjYmx4dUlDQWdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9kR2hwY3l3Z2UxeHVJQ0FnSUNBZ0lDQmJibUZ0WlYwNklIdGNiaUFnSUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J5WldZc1hHNGdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUJwYm5SbGNtTmxjSFJ2Y2tOaGJHeGlZV05ySUNFOVBTQW5ablZ1WTNScGIyNG5LVnh1SUNBZ0lDQWdkR2hwYzF0RFFWQlVWVkpGWDFKRlJrVlNSVTVEUlY5TlJWUklUMFJUWFNBOUlHMWxkR2h2WkR0Y2JseHVJQ0FnSUhKbGRIVnliaUJ0WlhSb2IyUTdYRzRnSUgxY2JseHVJQ0JtYjNKalpWVndaR0YwWlNncElIdGNiaUFnSUNCMGFHbHpXMUZWUlZWRlgxVlFSRUZVUlY5TlJWUklUMFJkS0NrN1hHNGdJSDFjYmx4dUlDQm5aWFJUZEdGMFpTaHdjbTl3WlhKMGVWQmhkR2dzSUdSbFptRjFiSFJXWVd4MVpTa2dlMXh1SUNBZ0lHeGxkQ0J6ZEdGMFpTQTlJSFJvYVhNdWMzUmhkR1U3WEc0Z0lDQWdhV1lnS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUFQwOUlEQXBYRzRnSUNBZ0lDQnlaWFIxY200Z2MzUmhkR1U3WEc1Y2JpQWdJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmlod2NtOXdaWEowZVZCaGRHZ3NJQ2R2WW1wbFkzUW5LU2tnZTF4dUlDQWdJQ0FnYkdWMElHdGxlWE1nSUNBZ0lDQWdJRDBnVDJKcVpXTjBMbXRsZVhNb2NISnZjR1Z5ZEhsUVlYUm9LUzVqYjI1allYUW9UMkpxWldOMExtZGxkRTkzYmxCeWIzQmxjblI1VTNsdFltOXNjeWh3Y205d1pYSjBlVkJoZEdncEtUdGNiaUFnSUNBZ0lHeGxkQ0JtYVc1aGJGTjBZWFJsSUNBOUlIdDlPMXh1WEc0Z0lDQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCclpYbHpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJR3RsZVNBOUlHdGxlWE5iYVYwN1hHNGdJQ0FnSUNBZ0lHeGxkQ0JiSUhaaGJIVmxMQ0JzWVhOMFVHRnlkQ0JkSUQwZ1ZYUnBiSE11Wm1WMFkyaEVaV1Z3VUhKdmNHVnlkSGtvYzNSaGRHVXNJR3RsZVN3Z2NISnZjR1Z5ZEhsUVlYUm9XMnRsZVYwc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCcFppQW9iR0Z6ZEZCaGNuUWdQVDBnYm5Wc2JDbGNiaUFnSUNBZ0lDQWdJQ0JqYjI1MGFXNTFaVHRjYmx4dUlDQWdJQ0FnSUNCbWFXNWhiRk4wWVhSbFcyeGhjM1JRWVhKMFhTQTlJSFpoYkhWbE8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnlaWFIxY200Z1ptbHVZV3hUZEdGMFpUdGNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRlYwYVd4ekxtWmxkR05vUkdWbGNGQnliM0JsY25SNUtITjBZWFJsTENCd2NtOXdaWEowZVZCaGRHZ3NJR1JsWm1GMWJIUldZV3gxWlNrN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYmlBZ2MyVjBVM1JoZEdVb2RtRnNkV1VwSUh0Y2JpQWdJQ0JwWmlBb0lXbHpWbUZzYVdSVGRHRjBaVTlpYW1WamRDaDJZV3gxWlNrcFhHNGdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtHQkpiblpoYkdsa0lIWmhiSFZsSUdadmNpQmNJblJvYVhNdWMyVjBVM1JoZEdWY0lqb2dYQ0lrZTNaaGJIVmxmVndpTGlCUWNtOTJhV1JsWkNCY0luTjBZWFJsWENJZ2JYVnpkQ0JpWlNCaGJpQnBkR1Z5WVdKc1pTQnZZbXBsWTNRdVlDazdYRzVjYmlBZ0lDQlBZbXBsWTNRdVlYTnphV2R1S0hSb2FYTXVjM1JoZEdVc0lIWmhiSFZsS1R0Y2JpQWdmVnh1WEc0Z0lITmxkRk4wWVhSbFVHRnpjMmwyWlNoMllXeDFaU2tnZTF4dUlDQWdJR2xtSUNnaGFYTldZV3hwWkZOMFlYUmxUMkpxWldOMEtIWmhiSFZsS1NsY2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb1lFbHVkbUZzYVdRZ2RtRnNkV1VnWm05eUlGd2lkR2hwY3k1elpYUlRkR0YwWlZCaGMzTnBkbVZjSWpvZ1hDSWtlM1poYkhWbGZWd2lMaUJRY205MmFXUmxaQ0JjSW5OMFlYUmxYQ0lnYlhWemRDQmlaU0JoYmlCcGRHVnlZV0pzWlNCdlltcGxZM1F1WUNrN1hHNWNiaUFnSUNCMGNua2dlMXh1SUNBZ0lDQWdkR2hwYzF0VFMwbFFYMU5VUVZSRlgxVlFSRUZVUlZOZElEMGdkSEoxWlR0Y2JpQWdJQ0FnSUU5aWFtVmpkQzVoYzNOcFoyNG9kR2hwY3k1emRHRjBaU3dnZG1Gc2RXVXBPMXh1SUNBZ0lIMGdabWx1WVd4c2VTQjdYRzRnSUNBZ0lDQjBhR2x6VzFOTFNWQmZVMVJCVkVWZlZWQkVRVlJGVTEwZ1BTQm1ZV3h6WlR0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCemFHOTFiR1JWY0dSaGRHVW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lIMWNibHh1SUNCa1pYTjBjbTk1S0NrZ2UxeHVJQ0FnSUdSbGJHVjBaU0IwYUdsekxuTjBZWFJsTzF4dUlDQWdJR1JsYkdWMFpTQjBhR2x6TG5CeWIzQnpPMXh1SUNBZ0lHUmxiR1YwWlNCMGFHbHpMbU52Ym5SbGVIUTdYRzRnSUNBZ1pHVnNaWFJsSUhSb2FYTmJRMEZRVkZWU1JWOVNSVVpGVWtWT1EwVmZUVVZVU0U5RVUxMDdYRzRnSUNBZ2RHaHBjeTVqYkdWaGNrRnNiRVJsWW05MWJtTmxjeWdwTzF4dUlDQjlYRzVjYmlBZ2NtVnVaR1Z5VjJGcGRHbHVaeWdwSUh0Y2JpQWdmVnh1WEc0Z0lISmxibVJsY2loamFHbHNaSEpsYmlrZ2UxeHVJQ0FnSUhKbGRIVnliaUJqYUdsc1pISmxianRjYmlBZ2ZWeHVYRzRnSUhWd1pHRjBaV1FvS1NCN1hHNGdJSDFjYmx4dUlDQmpiMjFpYVc1bFYybDBhQ2h6WlhBc0lDNHVMbUZ5WjNNcElIdGNiaUFnSUNCc1pYUWdabWx1WVd4QmNtZHpJRDBnYm1WM0lGTmxkQ2dwTzF4dUlDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUdGeVozTXViR1Z1WjNSb095QnBJRHdnYVd3N0lHa3JLeWtnZTF4dUlDQWdJQ0FnYkdWMElHRnlaeUE5SUdGeVozTmJhVjA3WEc0Z0lDQWdJQ0JwWmlBb0lXRnlaeWxjYmlBZ0lDQWdJQ0FnWTI5dWRHbHVkV1U3WEc1Y2JpQWdJQ0FnSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHRnlaeXdnSjNOMGNtbHVaeWNwS1NCN1hHNGdJQ0FnSUNBZ0lHeGxkQ0IyWVd4MVpYTWdQU0JoY21jdWMzQnNhWFFvYzJWd0tTNW1hV3gwWlhJb1ZYUnBiSE11YVhOT2IzUkZiWEIwZVNrN1hHNGdJQ0FnSUNBZ0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJSFpoYkhWbGN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdkbUZzZFdWelcybGRPMXh1SUNBZ0lDQWdJQ0FnSUdacGJtRnNRWEpuY3k1aFpHUW9kbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLRUZ5Y21GNUxtbHpRWEp5WVhrb1lYSm5LU2tnZTF4dUlDQWdJQ0FnSUNCc1pYUWdkbUZzZFdWeklEMGdZWEpuTG1acGJIUmxjaWdvZG1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvSVhaaGJIVmxLVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZWZEdsc2N5NXBibk4wWVc1alpVOW1LSFpoYkhWbExDQW5jM1J5YVc1bkp5a3BYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnVlhScGJITXVhWE5PYjNSRmJYQjBlU2gyWVd4MVpTazdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJSFpoYkhWbGN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdkbUZzZFdWelcybGRPMXh1SUNBZ0lDQWdJQ0FnSUdacGJtRnNRWEpuY3k1aFpHUW9kbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9ZWEpuTENBbmIySnFaV04wSnlrcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUd0bGVYTWdQU0JQWW1wbFkzUXVhMlY1Y3loaGNtY3BPMXh1SUNBZ0lDQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCclpYbHpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnYTJWNUlDQWdQU0JyWlhselcybGRPMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlHRnlaMXRyWlhsZE8xeHVYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tDRjJZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWm1sdVlXeEJjbWR6TG1SbGJHVjBaU2hyWlhrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHbHVkV1U3WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnWm1sdVlXeEJjbWR6TG1Ga1pDaHJaWGtwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJRUZ5Y21GNUxtWnliMjBvWm1sdVlXeEJjbWR6S1M1cWIybHVLSE5sY0NCOGZDQW5KeWs3WEc0Z0lIMWNibHh1SUNCamJHRnpjMlZ6S0M0dUxtRnlaM01wSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1amIyMWlhVzVsVjJsMGFDZ25JQ2NzSUM0dUxtRnlaM01wTzF4dUlDQjlYRzVjYmlBZ1pYaDBjbUZqZEVOb2FXeGtjbVZ1S0Y5d1lYUjBaWEp1Y3l3Z1kyaHBiR1J5Wlc0cElIdGNiaUFnSUNCc1pYUWdaWGgwY21GamRHVmtJRDBnZTMwN1hHNGdJQ0FnYkdWMElIQmhkSFJsY201eklDQTlJRjl3WVhSMFpYSnVjenRjYmlBZ0lDQnNaWFFnYVhOQmNuSmhlU0FnSUQwZ1FYSnlZWGt1YVhOQmNuSmhlU2h3WVhSMFpYSnVjeWs3WEc1Y2JpQWdJQ0JqYjI1emRDQnBjMDFoZEdOb0lEMGdLR3BwWWlrZ1BUNGdlMXh1SUNBZ0lDQWdiR1YwSUdwcFlsUjVjR1VnUFNCcWFXSXVWSGx3WlR0Y2JpQWdJQ0FnSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHcHBZbFI1Y0dVc0lDZHpkSEpwYm1jbktTbGNiaUFnSUNBZ0lDQWdhbWxpVkhsd1pTQTlJR3BwWWxSNWNHVXVkRzlNYjNkbGNrTmhjMlVvS1R0Y2JseHVJQ0FnSUNBZ2FXWWdLR2x6UVhKeVlYa3BJSHRjYmlBZ0lDQWdJQ0FnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2NHRjBkR1Z5Ym5NdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQndZWFIwWlhKdUlEMGdjR0YwZEdWeWJuTmJhVjA3WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9jR0YwZEdWeWJpd2dKM04wY21sdVp5Y3BLVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NHRjBkR1Z5YmlBOUlIQmhkSFJsY200dWRHOU1iM2RsY2tOaGMyVW9LVHRjYmx4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2hxYVdKVWVYQmxJRDA5UFNCd1lYUjBaWEp1S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JsZUhSeVlXTjBaV1JiY0dGMGRHVnlibDBnUFNCcWFXSTdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQnJaWGx6SUQwZ1QySnFaV04wTG10bGVYTW9jR0YwZEdWeWJuTXBPMXh1SUNBZ0lDQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCclpYbHpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnYTJWNUlDQWdJQ0E5SUd0bGVYTmJhVjA3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJSEJoZEhSbGNtNGdQU0J3WVhSMFpYSnVjMXRyWlhsZE8xeHVJQ0FnSUNBZ0lDQWdJR3hsZENCeVpYTjFiSFE3WEc1Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvVlhScGJITXVhVzV6ZEdGdVkyVlBaaWh3WVhSMFpYSnVMQ0JTWldkRmVIQXBLVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnpkV3gwSUQwZ2NHRjBkR1Z5Ymk1MFpYTjBLR3BwWWxSNWNHVXBPMXh1SUNBZ0lDQWdJQ0FnSUdWc2MyVWdhV1lnS0ZWMGFXeHpMbWx1YzNSaGJtTmxUMllvY0dGMGRHVnliaXdnSjNOMGNtbHVaeWNwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ6ZFd4MElEMGdLSEJoZEhSbGNtNHVkRzlNYjNkbGNrTmhjMlVvS1NBOVBUMGdhbWxpVkhsd1pTazdYRzRnSUNBZ0lDQWdJQ0FnWld4elpWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBJRDBnS0hCaGRIUmxjbTRnUFQwOUlHcHBZbFI1Y0dVcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tISmxjM1ZzZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWlhoMGNtRmpkR1ZrVzJ0bGVWMGdQU0JxYVdJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCbGVIUnlZV04wWldRdWNtVnRZV2x1YVc1blEyaHBiR1J5Wlc0Z1BTQmphR2xzWkhKbGJpNW1hV3gwWlhJb0tHcHBZaWtnUFQ0Z0lXbHpUV0YwWTJnb2FtbGlLU2s3WEc0Z0lDQWdjbVYwZFhKdUlHVjRkSEpoWTNSbFpEdGNiaUFnZlZ4dVhHNGdJR1JsWW05MWJtTmxLR1oxYm1Nc0lIUnBiV1VzSUY5cFpDa2dlMXh1SUNBZ0lHTnZibk4wSUdOc1pXRnlVR1Z1WkdsdVoxUnBiV1Z2ZFhRZ1BTQW9LU0E5UGlCN1hHNGdJQ0FnSUNCcFppQW9jR1Z1WkdsdVoxUnBiV1Z5SUNZbUlIQmxibVJwYm1kVWFXMWxjaTUwYVcxbGIzVjBLU0I3WEc0Z0lDQWdJQ0FnSUdOc1pXRnlWR2x0Wlc5MWRDaHdaVzVrYVc1blZHbHRaWEl1ZEdsdFpXOTFkQ2s3WEc0Z0lDQWdJQ0FnSUhCbGJtUnBibWRVYVcxbGNpNTBhVzFsYjNWMElEMGdiblZzYkR0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0I5TzF4dVhHNGdJQ0FnZG1GeUlHbGtJRDBnS0NGZmFXUXBJRDhnS0NjbklDc2dablZ1WXlrZ09pQmZhV1E3WEc0Z0lDQWdhV1lnS0NGMGFHbHpMbVJsWW05MWJtTmxWR2x0WlhKektTQjdYRzRnSUNBZ0lDQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvZEdocGN5d2dKMlJsWW05MWJtTmxWR2x0WlhKekp5d2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCN2ZTeGNiaUFnSUNBZ0lIMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lIWmhjaUJ3Wlc1a2FXNW5WR2x0WlhJZ1BTQjBhR2x6TG1SbFltOTFibU5sVkdsdFpYSnpXMmxrWFR0Y2JpQWdJQ0JwWmlBb0lYQmxibVJwYm1kVWFXMWxjaWxjYmlBZ0lDQWdJSEJsYm1ScGJtZFVhVzFsY2lBOUlIUm9hWE11WkdWaWIzVnVZMlZVYVcxbGNuTmJhV1JkSUQwZ2UzMDdYRzVjYmlBZ0lDQndaVzVrYVc1blZHbHRaWEl1Wm5WdVl5QTlJR1oxYm1NN1hHNGdJQ0FnWTJ4bFlYSlFaVzVrYVc1blZHbHRaVzkxZENncE8xeHVYRzRnSUNBZ2RtRnlJSEJ5YjIxcGMyVWdQU0J3Wlc1a2FXNW5WR2x0WlhJdWNISnZiV2x6WlR0Y2JpQWdJQ0JwWmlBb0lYQnliMjFwYzJVZ2ZId2dJWEJ5YjIxcGMyVXVjR1Z1WkdsdVp5Z3BLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2MzUmhkSFZ6SUQwZ0ozQmxibVJwYm1jbk8xeHVJQ0FnSUNBZ2JHVjBJSEpsYzI5c2RtVTdYRzVjYmlBZ0lDQWdJSEJ5YjIxcGMyVWdQU0J3Wlc1a2FXNW5WR2x0WlhJdWNISnZiV2x6WlNBOUlHNWxkeUJRY205dGFYTmxLQ2hmY21WemIyeDJaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnlaWE52YkhabElEMGdYM0psYzI5c2RtVTdYRzRnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnY0hKdmJXbHpaUzV5WlhOdmJIWmxJRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0JwWmlBb2MzUmhkSFZ6SUNFOVBTQW5jR1Z1WkdsdVp5Y3BYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVPMXh1WEc0Z0lDQWdJQ0FnSUhOMFlYUjFjeUE5SUNkbWRXeG1hV3hzWldRbk8xeHVJQ0FnSUNBZ0lDQmpiR1ZoY2xCbGJtUnBibWRVYVcxbGIzVjBLQ2s3WEc0Z0lDQWdJQ0FnSUhSb2FYTXVaR1ZpYjNWdVkyVlVhVzFsY25OYmFXUmRJRDBnYm5Wc2JEdGNibHh1SUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUhCbGJtUnBibWRVYVcxbGNpNW1kVzVqSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0FnSUNBZ2RtRnlJSEpsZENBOUlIQmxibVJwYm1kVWFXMWxjaTVtZFc1akxtTmhiR3dvZEdocGN5azdYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tISmxkQ0JwYm5OMFlXNWpaVzltSUZCeWIyMXBjMlVnZkh3Z0tISmxkQ0FtSmlCMGVYQmxiMllnY21WMExuUm9aVzRnUFQwOUlDZG1kVzVqZEdsdmJpY3BLVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBMblJvWlc0b0tIWmhiSFZsS1NBOVBpQnlaWE52YkhabEtIWmhiSFZsS1NrN1hHNGdJQ0FnSUNBZ0lDQWdaV3h6WlZ4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ6YjJ4MlpTaHlaWFFwTzF4dUlDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lISmxjMjlzZG1Vb0tUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdmVHRjYmx4dUlDQWdJQ0FnY0hKdmJXbHpaUzVqWVc1alpXd2dQU0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJSE4wWVhSMWN5QTlJQ2R5WldwbFkzUmxaQ2M3WEc0Z0lDQWdJQ0FnSUdOc1pXRnlVR1Z1WkdsdVoxUnBiV1Z2ZFhRb0tUdGNiaUFnSUNBZ0lDQWdkR2hwY3k1a1pXSnZkVzVqWlZScGJXVnljMXRwWkYwZ1BTQnVkV3hzTzF4dVhHNGdJQ0FnSUNBZ0lIQnliMjFwYzJVdWNtVnpiMngyWlNncE8xeHVJQ0FnSUNBZ2ZUdGNibHh1SUNBZ0lDQWdjSEp2YldselpTNXBjMUJsYm1ScGJtY2dQU0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQW9jM1JoZEhWeklEMDlQU0FuY0dWdVpHbHVaeWNwTzF4dUlDQWdJQ0FnZlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0F2THlCbGMyeHBiblF0WkdsellXSnNaUzF1WlhoMExXeHBibVVnYm04dGJXRm5hV010Ym5WdFltVnljMXh1SUNBZ0lIQmxibVJwYm1kVWFXMWxjaTUwYVcxbGIzVjBJRDBnYzJWMFZHbHRaVzkxZENod2NtOXRhWE5sTG5KbGMyOXNkbVVzSUNoMGFXMWxJRDA5SUc1MWJHd3BJRDhnTWpVd0lEb2dkR2x0WlNrN1hHNWNiaUFnSUNCeVpYUjFjbTRnY0hKdmJXbHpaVHRjYmlBZ2ZWeHVYRzRnSUdOc1pXRnlSR1ZpYjNWdVkyVW9hV1FwSUh0Y2JpQWdJQ0IyWVhJZ2NHVnVaR2x1WjFScGJXVnlJRDBnZEdocGN5NWtaV0p2ZFc1alpWUnBiV1Z5YzF0cFpGMDdYRzRnSUNBZ2FXWWdLSEJsYm1ScGJtZFVhVzFsY2lBOVBTQnVkV3hzS1Z4dUlDQWdJQ0FnY21WMGRYSnVPMXh1WEc0Z0lDQWdhV1lnS0hCbGJtUnBibWRVYVcxbGNpNTBhVzFsYjNWMEtWeHVJQ0FnSUNBZ1kyeGxZWEpVYVcxbGIzVjBLSEJsYm1ScGJtZFVhVzFsY2k1MGFXMWxiM1YwS1R0Y2JseHVJQ0FnSUdsbUlDaHdaVzVrYVc1blZHbHRaWEl1Y0hKdmJXbHpaU2xjYmlBZ0lDQWdJSEJsYm1ScGJtZFVhVzFsY2k1d2NtOXRhWE5sTG1OaGJtTmxiQ2dwTzF4dUlDQjlYRzVjYmlBZ1kyeGxZWEpCYkd4RVpXSnZkVzVqWlhNb0tTQjdYRzRnSUNBZ2JHVjBJR1JsWW05MWJtTmxWR2x0WlhKeklDQTlJSFJvYVhNdVpHVmliM1Z1WTJWVWFXMWxjbk1nZkh3Z2UzMDdYRzRnSUNBZ2JHVjBJR2xrY3lBZ0lDQWdJQ0FnSUNBZ0lDQTlJRTlpYW1WamRDNXJaWGx6S0dSbFltOTFibU5sVkdsdFpYSnpLVHRjYmx4dUlDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUdsa2N5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLVnh1SUNBZ0lDQWdkR2hwY3k1amJHVmhja1JsWW05MWJtTmxLR2xrYzF0cFhTazdYRzRnSUgxY2JseHVJQ0JuWlhSRmJHVnRaVzUwUkdGMFlTaGxiR1Z0Wlc1MEtTQjdYRzRnSUNBZ2JHVjBJR1JoZEdFZ1BTQmxiR1Z0Wlc1MFJHRjBZVU5oWTJobExtZGxkQ2hsYkdWdFpXNTBLVHRjYmlBZ0lDQnBaaUFvSVdSaGRHRXBJSHRjYmlBZ0lDQWdJR1JoZEdFZ1BTQjdmVHRjYmlBZ0lDQWdJR1ZzWlcxbGJuUkVZWFJoUTJGamFHVXVjMlYwS0dWc1pXMWxiblFzSUdSaGRHRXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lISmxkSFZ5YmlCa1lYUmhPMXh1SUNCOVhHNWNiaUFnYldWdGIybDZaU2htZFc1aktTQjdYRzRnSUNBZ2JHVjBJR05oWTJobFNVUTdYRzRnSUNBZ2JHVjBJR05oWTJobFpGSmxjM1ZzZER0Y2JseHVJQ0FnSUhKbGRIVnliaUJtZFc1amRHbHZiaWd1TGk1aGNtZHpLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2JtVjNRMkZqYUdWSlJDQTlJR1JsWVdSaVpXVm1LQzR1TG1GeVozTXBPMXh1SUNBZ0lDQWdhV1lnS0c1bGQwTmhZMmhsU1VRZ0lUMDlJR05oWTJobFNVUXBJSHRjYmlBZ0lDQWdJQ0FnYkdWMElISmxjM1ZzZENBOUlHWjFibU11WVhCd2JIa29kR2hwY3l3Z1lYSm5jeWs3WEc1Y2JpQWdJQ0FnSUNBZ1kyRmphR1ZKUkNBOUlHNWxkME5oWTJobFNVUTdYRzRnSUNBZ0lDQWdJR05oWTJobFpGSmxjM1ZzZENBOUlISmxjM1ZzZER0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdOaFkyaGxaRkpsYzNWc2REdGNiaUFnSUNCOU8xeHVJQ0I5WEc1OVhHNGlMQ0pqYjI1emRDQkZWa1ZPVkY5TVNWTlVSVTVGVWxNZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWN5OWxkbVZ1ZEhNdmJHbHpkR1Z1WlhKekp5azdYRzVjYm1WNGNHOXlkQ0JqYkdGemN5QkZkbVZ1ZEVWdGFYUjBaWElnZTF4dUlDQmpiMjV6ZEhKMVkzUnZjaWdwSUh0Y2JpQWdJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEdsbGN5aDBhR2x6TENCN1hHNGdJQ0FnSUNCYlJWWkZUbFJmVEVsVFZFVk9SVkpUWFRvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUc1bGR5Qk5ZWEFvS1N4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnZlNrN1hHNGdJSDFjYmx4dUlDQmhaR1JNYVhOMFpXNWxjaWhsZG1WdWRFNWhiV1VzSUd4cGMzUmxibVZ5S1NCN1hHNGdJQ0FnYVdZZ0tIUjVjR1Z2WmlCc2FYTjBaVzVsY2lBaFBUMGdKMloxYm1OMGFXOXVKeWxjYmlBZ0lDQWdJSFJvY205M0lHNWxkeUJVZVhCbFJYSnliM0lvSjBWMlpXNTBJR3hwYzNSbGJtVnlJRzExYzNRZ1ltVWdZU0J0WlhSb2IyUW5LVHRjYmx4dUlDQWdJR3hsZENCbGRtVnVkRTFoY0NBZ1BTQjBhR2x6VzBWV1JVNVVYMHhKVTFSRlRrVlNVMTA3WEc0Z0lDQWdiR1YwSUhOamIzQmxJQ0FnSUNBOUlHVjJaVzUwVFdGd0xtZGxkQ2hsZG1WdWRFNWhiV1VwTzF4dVhHNGdJQ0FnYVdZZ0tDRnpZMjl3WlNrZ2UxeHVJQ0FnSUNBZ2MyTnZjR1VnUFNCYlhUdGNiaUFnSUNBZ0lHVjJaVzUwVFdGd0xuTmxkQ2hsZG1WdWRFNWhiV1VzSUhOamIzQmxLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnpZMjl3WlM1d2RYTm9LR3hwYzNSbGJtVnlLVHRjYmx4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TzF4dUlDQjlYRzVjYmlBZ2NtVnRiM1psVEdsemRHVnVaWElvWlhabGJuUk9ZVzFsTENCc2FYTjBaVzVsY2lrZ2UxeHVJQ0FnSUdsbUlDaDBlWEJsYjJZZ2JHbHpkR1Z1WlhJZ0lUMDlJQ2RtZFc1amRHbHZiaWNwWEc0Z0lDQWdJQ0IwYUhKdmR5QnVaWGNnVkhsd1pVVnljbTl5S0NkRmRtVnVkQ0JzYVhOMFpXNWxjaUJ0ZFhOMElHSmxJR0VnYldWMGFHOWtKeWs3WEc1Y2JpQWdJQ0JzWlhRZ1pYWmxiblJOWVhBZ0lEMGdkR2hwYzF0RlZrVk9WRjlNU1ZOVVJVNUZVbE5kTzF4dUlDQWdJR3hsZENCelkyOXdaU0FnSUNBZ1BTQmxkbVZ1ZEUxaGNDNW5aWFFvWlhabGJuUk9ZVzFsS1R0Y2JpQWdJQ0JwWmlBb0lYTmpiM0JsS1Z4dUlDQWdJQ0FnY21WMGRYSnVJSFJvYVhNN1hHNWNiaUFnSUNCc1pYUWdhVzVrWlhnZ1BTQnpZMjl3WlM1cGJtUmxlRTltS0d4cGMzUmxibVZ5S1R0Y2JpQWdJQ0JwWmlBb2FXNWtaWGdnUGowZ01DbGNiaUFnSUNBZ0lITmpiM0JsTG5Od2JHbGpaU2hwYm1SbGVDd2dNU2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JpQWdmVnh1WEc0Z0lISmxiVzkyWlVGc2JFeHBjM1JsYm1WeWN5aGxkbVZ1ZEU1aGJXVXBJSHRjYmlBZ0lDQnNaWFFnWlhabGJuUk5ZWEFnSUQwZ2RHaHBjMXRGVmtWT1ZGOU1TVk5VUlU1RlVsTmRPMXh1SUNBZ0lHbG1JQ2doWlhabGJuUk5ZWEF1YUdGektHVjJaVzUwVG1GdFpTa3BYRzRnSUNBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmx4dUlDQWdJR1YyWlc1MFRXRndMbk5sZENobGRtVnVkRTVoYldVc0lGdGRLVHRjYmx4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TzF4dUlDQjlYRzVjYmlBZ1pXMXBkQ2hsZG1WdWRFNWhiV1VzSUM0dUxtRnlaM01wSUh0Y2JpQWdJQ0JzWlhRZ1pYWmxiblJOWVhBZ0lEMGdkR2hwYzF0RlZrVk9WRjlNU1ZOVVJVNUZVbE5kTzF4dUlDQWdJR3hsZENCelkyOXdaU0FnSUNBZ1BTQmxkbVZ1ZEUxaGNDNW5aWFFvWlhabGJuUk9ZVzFsS1R0Y2JpQWdJQ0JwWmlBb0lYTmpiM0JsSUh4OElITmpiM0JsTG14bGJtZDBhQ0E5UFQwZ01DbGNiaUFnSUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUhOamIzQmxMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUd4bGRDQmxkbVZ1ZEVOaGJHeGlZV05ySUQwZ2MyTnZjR1ZiYVYwN1hHNGdJQ0FnSUNCbGRtVnVkRU5oYkd4aVlXTnJMbUZ3Y0d4NUtIUm9hWE1zSUdGeVozTXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNCOVhHNWNiaUFnYjI1alpTaGxkbVZ1ZEU1aGJXVXNJR3hwYzNSbGJtVnlLU0I3WEc0Z0lDQWdiR1YwSUdaMWJtTWdQU0FvTGk0dVlYSm5jeWtnUFQ0Z2UxeHVJQ0FnSUNBZ2RHaHBjeTV2Wm1Zb1pYWmxiblJPWVcxbExDQm1kVzVqS1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUJzYVhOMFpXNWxjaWd1TGk1aGNtZHpLVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11YjI0b1pYWmxiblJPWVcxbExDQm1kVzVqS1R0Y2JpQWdmVnh1WEc0Z0lHOXVLR1YyWlc1MFRtRnRaU3dnYkdsemRHVnVaWElwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1aFpHUk1hWE4wWlc1bGNpaGxkbVZ1ZEU1aGJXVXNJR3hwYzNSbGJtVnlLVHRjYmlBZ2ZWeHVYRzRnSUc5bVppaGxkbVZ1ZEU1aGJXVXNJR3hwYzNSbGJtVnlLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11Y21WdGIzWmxUR2x6ZEdWdVpYSW9aWFpsYm5ST1lXMWxMQ0JzYVhOMFpXNWxjaWs3WEc0Z0lIMWNibHh1SUNCbGRtVnVkRTVoYldWektDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCQmNuSmhlUzVtY205dEtIUm9hWE5iUlZaRlRsUmZURWxUVkVWT1JWSlRYUzVyWlhsektDa3BPMXh1SUNCOVhHNWNiaUFnYkdsemRHVnVaWEpEYjNWdWRDaGxkbVZ1ZEU1aGJXVXBJSHRjYmlBZ0lDQnNaWFFnWlhabGJuUk5ZWEFnSUQwZ2RHaHBjMXRGVmtWT1ZGOU1TVk5VUlU1RlVsTmRPMXh1SUNBZ0lHeGxkQ0J6WTI5d1pTQWdJQ0FnUFNCbGRtVnVkRTFoY0M1blpYUW9aWFpsYm5ST1lXMWxLVHRjYmlBZ0lDQnBaaUFvSVhOamIzQmxLVnh1SUNBZ0lDQWdjbVYwZFhKdUlEQTdYRzVjYmlBZ0lDQnlaWFIxY200Z2MyTnZjR1V1YkdWdVozUm9PMXh1SUNCOVhHNWNiaUFnYkdsemRHVnVaWEp6S0dWMlpXNTBUbUZ0WlNrZ2UxeHVJQ0FnSUd4bGRDQmxkbVZ1ZEUxaGNDQWdQU0IwYUdselcwVldSVTVVWDB4SlUxUkZUa1ZTVTEwN1hHNGdJQ0FnYkdWMElITmpiM0JsSUNBZ0lDQTlJR1YyWlc1MFRXRndMbWRsZENobGRtVnVkRTVoYldVcE8xeHVJQ0FnSUdsbUlDZ2hjMk52Y0dVcFhHNGdJQ0FnSUNCeVpYUjFjbTRnVzEwN1hHNWNiaUFnSUNCeVpYUjFjbTRnYzJOdmNHVXVjMnhwWTJVb0tUdGNiaUFnZlZ4dWZWeHVJaXdpYVcxd2IzSjBJR1JsWVdSaVpXVm1JR1p5YjIwZ0oyUmxZV1JpWldWbUp6dGNibWx0Y0c5eWRDQXFJR0Z6SUZWMGFXeHpJR1p5YjIwZ0p5NHZkWFJwYkhNdWFuTW5PMXh1WEc1bGVIQnZjblFnWTJ4aGMzTWdTbWxpSUh0Y2JpQWdZMjl1YzNSeWRXTjBiM0lvVkhsd1pTd2djSEp2Y0hNc0lHTm9hV3hrY21WdUtTQjdYRzRnSUNBZ2JHVjBJR1JsWm1GMWJIUlFjbTl3Y3lBOUlDaFVlWEJsSUNZbUlGUjVjR1V1Y0hKdmNITXBJRDhnVkhsd1pTNXdjbTl3Y3lBNklIdDlPMXh1WEc0Z0lDQWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblJwWlhNb2RHaHBjeXdnZTF4dUlDQWdJQ0FnSjFSNWNHVW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1ZIbHdaU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuY0hKdmNITW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ2V5QXVMaTVrWldaaGRXeDBVSEp2Y0hNc0lDNHVMaWh3Y205d2N5QjhmQ0I3ZlNrZ2ZTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQW5ZMmhwYkdSeVpXNG5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1ZYUnBiSE11Wm14aGRIUmxia0Z5Y21GNUtHTm9hV3hrY21WdUtTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ2ZTazdYRzRnSUgxY2JuMWNibHh1Wlhod2IzSjBJR052Ym5OMElFcEpRbDlDUVZKU1JVNGdJQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TG1KaGNuSmxiaWNwTzF4dVpYaHdiM0owSUdOdmJuTjBJRXBKUWw5UVVrOVlXU0FnSUNBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekxuQnliM2g1SnlrN1hHNWxlSEJ2Y25RZ1kyOXVjM1FnU2tsQ1gxSkJWMTlVUlZoVUlEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTXVjbUYzVkdWNGRDY3BPMXh1Wlhod2IzSjBJR052Ym5OMElFcEpRaUFnSUNBZ0lDQWdJQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TG1wcFlpY3BPMXh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWm1GamRHOXllU2hLYVdKRGJHRnpjeWtnZTF4dUlDQnlaWFIxY200Z1puVnVZM1JwYjI0Z0pDaGZkSGx3WlN3Z2NISnZjSE1nUFNCN2ZTa2dlMXh1SUNBZ0lHbG1JQ2hwYzBwcFltbHphQ2hmZEhsd1pTa3BYRzRnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dWSGx3WlVWeWNtOXlLQ2RTWldObGFYWmxaQ0JoSUdwcFlpQmlkWFFnWlhod1pXTjBaV1FnWVNCamIyMXdiMjVsYm5RdUp5azdYRzVjYmlBZ0lDQnNaWFFnVkhsd1pTQTlJQ2hmZEhsd1pTQTlQU0J1ZFd4c0tTQS9JRXBKUWw5UVVrOVlXU0E2SUY5MGVYQmxPMXh1WEc0Z0lDQWdablZ1WTNScGIyNGdZbUZ5Y21WdUtDNHVMbDlqYUdsc1pISmxiaWtnZTF4dUlDQWdJQ0FnYkdWMElHTm9hV3hrY21WdUlEMGdYMk5vYVd4a2NtVnVPMXh1WEc0Z0lDQWdJQ0JtZFc1amRHbHZiaUJxYVdJb0tTQjdYRzRnSUNBZ0lDQWdJR2xtSUNoVmRHbHNjeTVwYm5OMFlXNWpaVTltS0ZSNWNHVXNJQ2R3Y205dGFYTmxKeWtnZkh3Z1kyaHBiR1J5Wlc0dWMyOXRaU2dvWTJocGJHUXBJRDArSUZWMGFXeHpMbWx1YzNSaGJtTmxUMllvWTJocGJHUXNJQ2R3Y205dGFYTmxKeWtwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlGQnliMjFwYzJVdVlXeHNLRnNnVkhsd1pTQmRMbU52Ym1OaGRDaGphR2xzWkhKbGJpa3BMblJvWlc0b0tHRnNiQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnVkhsd1pTQTlJR0ZzYkZzd1hUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOb2FXeGtjbVZ1SUQwZ1lXeHNMbk5zYVdObEtERXBPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRXBwWWtOc1lYTnpLRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQlVlWEJsTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0J3Y205d2N5eGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ1kyaHBiR1J5Wlc0c1hHNGdJQ0FnSUNBZ0lDQWdJQ0FwTzF4dUlDQWdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QkthV0pEYkdGemN5aGNiaUFnSUNBZ0lDQWdJQ0JVZVhCbExGeHVJQ0FnSUNBZ0lDQWdJSEJ5YjNCekxGeHVJQ0FnSUNBZ0lDQWdJR05vYVd4a2NtVnVMRnh1SUNBZ0lDQWdJQ0FwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRHbGxjeWhxYVdJc0lIdGNiaUFnSUNBZ0lDQWdXMHBKUWwwNklIdGNiaUFnSUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUZ0a1pXRmtZbVZsWmk1cFpGTjViVjA2SUh0Y2JpQWdJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJQ2dwSUQwK0lGUjVjR1VzWEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCOUtUdGNibHh1SUNBZ0lDQWdjbVYwZFhKdUlHcHBZanRjYmlBZ0lDQjlYRzVjYmlBZ0lDQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkR2xsY3loaVlYSnlaVzRzSUh0Y2JpQWdJQ0FnSUZ0S1NVSmZRa0ZTVWtWT1hUb2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnVzJSbFlXUmlaV1ZtTG1sa1UzbHRYVG9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJQ2dwSUQwK0lGUjVjR1VzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJSDBwTzF4dVhHNGdJQ0FnY21WMGRYSnVJR0poY25KbGJqdGNiaUFnZlR0Y2JuMWNibHh1Wlhod2IzSjBJR052Ym5OMElDUWdQU0JtWVdOMGIzSjVLRXBwWWlrN1hHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnBjMHBwWW1semFDaDJZV3gxWlNrZ2UxeHVJQ0JwWmlBb2RIbHdaVzltSUhaaGJIVmxJRDA5UFNBblpuVnVZM1JwYjI0bklDWW1JQ2gyWVd4MVpWdEtTVUpmUWtGU1VrVk9YU0I4ZkNCMllXeDFaVnRLU1VKZEtTbGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNCcFppQW9kbUZzZFdVZ2FXNXpkR0Z1WTJWdlppQkthV0lwWEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdjbVYwZFhKdUlHWmhiSE5sTzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdZMjl1YzNSeWRXTjBTbWxpS0haaGJIVmxLU0I3WEc0Z0lHbG1JQ2gyWVd4MVpTQnBibk4wWVc1alpXOW1JRXBwWWlsY2JpQWdJQ0J5WlhSMWNtNGdkbUZzZFdVN1hHNWNiaUFnYVdZZ0tIUjVjR1Z2WmlCMllXeDFaU0E5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lHbG1JQ2gyWVd4MVpWdEtTVUpmUWtGU1VrVk9YU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjJZV3gxWlNncEtDazdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNkV1ZiU2tsQ1hTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCMllXeDFaU2dwTzF4dUlDQjlYRzVjYmlBZ2RHaHliM2NnYm1WM0lGUjVjR1ZGY25KdmNpZ25ZMjl1YzNSeWRXTjBTbWxpT2lCUWNtOTJhV1JsWkNCMllXeDFaU0JwY3lCdWIzUWdZU0JLYVdJdUp5azdYRzU5WEc1Y2JtVjRjRzl5ZENCaGMzbHVZeUJtZFc1amRHbHZiaUJ5WlhOdmJIWmxRMmhwYkdSeVpXNG9YMk5vYVd4a2NtVnVLU0I3WEc0Z0lHeGxkQ0JqYUdsc1pISmxiaUE5SUY5amFHbHNaSEpsYmp0Y2JseHVJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmloamFHbHNaSEpsYml3Z0ozQnliMjFwYzJVbktTbGNiaUFnSUNCamFHbHNaSEpsYmlBOUlHRjNZV2wwSUdOb2FXeGtjbVZ1TzF4dVhHNGdJR2xtSUNnaEtDaDBhR2x6TG1selNYUmxjbUZpYkdWRGFHbHNaQ0I4ZkNCVmRHbHNjeTVwYzBsMFpYSmhZbXhsUTJocGJHUXBMbU5oYkd3b2RHaHBjeXdnWTJocGJHUnlaVzRwS1NBbUppQW9hWE5LYVdKcGMyZ29ZMmhwYkdSeVpXNHBJSHg4SUNnb2RHaHBjeTVwYzFaaGJHbGtRMmhwYkdRZ2ZId2dWWFJwYkhNdWFYTldZV3hwWkVOb2FXeGtLUzVqWVd4c0tIUm9hWE1zSUdOb2FXeGtjbVZ1S1NrcEtWeHVJQ0FnSUdOb2FXeGtjbVZ1SUQwZ1d5QmphR2xzWkhKbGJpQmRPMXh1WEc0Z0lHeGxkQ0J3Y205dGFYTmxjeUE5SUZWMGFXeHpMbWwwWlhKaGRHVW9ZMmhwYkdSeVpXNHNJR0Z6ZVc1aklDaDdJSFpoYkhWbE9pQmZZMmhwYkdRZ2ZTa2dQVDRnZTF4dUlDQWdJR3hsZENCamFHbHNaQ0E5SUNoVmRHbHNjeTVwYm5OMFlXNWpaVTltS0Y5amFHbHNaQ3dnSjNCeWIyMXBjMlVuS1NrZ1B5QmhkMkZwZENCZlkyaHBiR1FnT2lCZlkyaHBiR1E3WEc1Y2JpQWdJQ0JwWmlBb2FYTkthV0pwYzJnb1kyaHBiR1FwS1Z4dUlDQWdJQ0FnY21WMGRYSnVJR0YzWVdsMElHTnZibk4wY25WamRFcHBZaWhqYUdsc1pDazdYRzRnSUNBZ1pXeHpaVnh1SUNBZ0lDQWdjbVYwZFhKdUlHTm9hV3hrTzF4dUlDQjlLVHRjYmx4dUlDQnlaWFIxY200Z1lYZGhhWFFnVUhKdmJXbHpaUzVoYkd3b2NISnZiV2x6WlhNcE8xeHVmVnh1SWl3aVpYaHdiM0owSUh0Y2JpQWdRMDlPVkVWWVZGOUpSQ3hjYmlBZ1VtOXZkRTV2WkdVc1hHNTlJR1p5YjIwZ0p5NHZjbTl2ZEMxdWIyUmxMbXB6Snp0Y2JseHVaWGh3YjNKMElHTnZibk4wSUVaUFVrTkZYMUpGUmt4UFZ5QTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpSbTl5WTJWU1pXWnNiM2NuS1R0Y2JseHVaWGh3YjNKMElIc2dVbVZ1WkdWeVpYSWdmU0JtY205dElDY3VMM0psYm1SbGNtVnlMbXB6Snp0Y2JpSXNJbWx0Y0c5eWRDQjdYRzRnSUVOUFRsUkZXRlJmU1VRc1hHNGdJRkp2YjNST2IyUmxMRnh1ZlNCbWNtOXRJQ2N1TDNKdmIzUXRibTlrWlM1cWN5YzdYRzVjYm1OdmJuTjBJRWxPU1ZSSlFVeGZRMDlPVkVWWVZGOUpSQ0E5SURGdU8xeHViR1YwSUY5amIyNTBaWGgwU1VSRGIzVnVkR1Z5SUQwZ1NVNUpWRWxCVEY5RFQwNVVSVmhVWDBsRU8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1VtVnVaR1Z5WlhJZ1pYaDBaVzVrY3lCU2IyOTBUbTlrWlNCN1hHNGdJSE4wWVhScFl5QlNiMjkwVG05a1pTQTlJRkp2YjNST2IyUmxPMXh1WEc0Z0lHTnZibk4wY25WamRHOXlLQ2tnZTF4dUlDQWdJSE4xY0dWeUtHNTFiR3dzSUc1MWJHd3NJRzUxYkd3cE8xeHVJQ0FnSUhSb2FYTXVjbVZ1WkdWeVpYSWdQU0IwYUdsek8xeHVJQ0I5WEc1Y2JpQWdZM0psWVhSbFEyOXVkR1Y0ZENoeWIyOTBRMjl1ZEdWNGRDd2diMjVWY0dSaGRHVXNJRzl1VlhCa1lYUmxWR2hwY3lrZ2UxeHVJQ0FnSUd4bGRDQmpiMjUwWlhoMElDQWdJQ0E5SUU5aWFtVmpkQzVqY21WaGRHVW9iblZzYkNrN1hHNGdJQ0FnYkdWMElHMTVRMjl1ZEdWNGRFbEVJRDBnS0hKdmIzUkRiMjUwWlhoMEtTQS9JSEp2YjNSRGIyNTBaWGgwVzBOUFRsUkZXRlJmU1VSZElEb2dTVTVKVkVsQlRGOURUMDVVUlZoVVgwbEVPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHNWxkeUJRY205NGVTaGpiMjUwWlhoMExDQjdYRzRnSUNBZ0lDQm5aWFE2SUNoMFlYSm5aWFFzSUhCeWIzQk9ZVzFsS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNod2NtOXdUbUZ0WlNBOVBUMGdRMDlPVkVWWVZGOUpSQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lHeGxkQ0J3WVhKbGJuUkpSQ0E5SUNoeWIyOTBRMjl1ZEdWNGRDa2dQeUJ5YjI5MFEyOXVkR1Y0ZEZ0RFQwNVVSVmhVWDBsRVhTQTZJRWxPU1ZSSlFVeGZRMDlPVkVWWVZGOUpSRHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnS0hCaGNtVnVkRWxFSUQ0Z2JYbERiMjUwWlhoMFNVUXBJRDhnY0dGeVpXNTBTVVFnT2lCdGVVTnZiblJsZUhSSlJEdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hUMkpxWldOMExuQnliM1J2ZEhsd1pTNW9ZWE5QZDI1UWNtOXdaWEowZVM1allXeHNLSFJoY21kbGRDd2djSEp2Y0U1aGJXVXBLVnh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUFvY205dmRFTnZiblJsZUhRcElEOGdjbTl2ZEVOdmJuUmxlSFJiY0hKdmNFNWhiV1ZkSURvZ2RXNWtaV1pwYm1Wa08xeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBZWEpuWlhSYmNISnZjRTVoYldWZE8xeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lITmxkRG9nS0hSaGNtZGxkQ3dnY0hKdmNFNWhiV1VzSUhaaGJIVmxLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h3Y205d1RtRnRaU0E5UFQwZ1EwOU9WRVZZVkY5SlJDbGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvZEdGeVoyVjBXM0J5YjNCT1lXMWxYU0E5UFQwZ2RtRnNkV1VwWEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQWdJQ0FnYlhsRGIyNTBaWGgwU1VRZ1BTQXJLMTlqYjI1MFpYaDBTVVJEYjNWdWRHVnlPMXh1SUNBZ0lDQWdJQ0IwWVhKblpYUmJjSEp2Y0U1aGJXVmRJRDBnZG1Gc2RXVTdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCdmJsVndaR0YwWlNBOVBUMGdKMloxYm1OMGFXOXVKeWxjYmlBZ0lDQWdJQ0FnSUNCdmJsVndaR0YwWlM1allXeHNLRzl1VlhCa1lYUmxWR2hwY3l3Z2IyNVZjR1JoZEdWVWFHbHpLVHRjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ2ZTazdYRzRnSUgxY2JuMWNiaUlzSW1sdGNHOXlkQ0JrWldGa1ltVmxaaUJtY205dElDZGtaV0ZrWW1WbFppYzdYRzVwYlhCdmNuUWdLaUJoY3lCVmRHbHNjeUJtY205dElDY3VMaTkxZEdsc2N5NXFjeWM3WEc1cGJYQnZjblFnZXlCeVpYTnZiSFpsUTJocGJHUnlaVzRnSUgwZ1puSnZiU0FuTGk0dmFtbGlMbXB6Snp0Y2JseHVaWGh3YjNKMElHTnZibk4wSUVOUFRsUkZXRlJmU1VRZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWN5OXViMlJsTDJOdmJuUmxlSFJKUkNjcE8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1VtOXZkRTV2WkdVZ2UxeHVJQ0J6ZEdGMGFXTWdRMDlPVkVWWVZGOUpSQ0E5SUVOUFRsUkZXRlJmU1VRN1hHNWNiaUFnWTI5dWMzUnlkV04wYjNJb2NtVnVaR1Z5WlhJc0lIQmhjbVZ1ZEU1dlpHVXNJRjlqYjI1MFpYaDBMQ0JxYVdJcElIdGNiaUFnSUNCc1pYUWdZMjl1ZEdWNGRDQTlJRzUxYkd3N1hHNWNiaUFnSUNCcFppQW9jbVZ1WkdWeVpYSWdmSHdnZEdocGN5NWpjbVZoZEdWRGIyNTBaWGgwS1NCN1hHNGdJQ0FnSUNCamIyNTBaWGgwSUQwZ0tISmxibVJsY21WeUlIeDhJSFJvYVhNcExtTnlaV0YwWlVOdmJuUmxlSFFvWEc0Z0lDQWdJQ0FnSUY5amIyNTBaWGgwTEZ4dUlDQWdJQ0FnSUNBb2RHaHBjeTV2YmtOdmJuUmxlSFJWY0dSaGRHVXBJRDhnZEdocGN5NXZia052Ym5SbGVIUlZjR1JoZEdVZ09pQjFibVJsWm1sdVpXUXNYRzRnSUNBZ0lDQWdJSFJvYVhNc1hHNGdJQ0FnSUNBcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGFXVnpLSFJvYVhNc0lIdGNiaUFnSUNBZ0lDZFVXVkJGSnpvZ2UxeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCblpYUTZJQ0FnSUNBZ0lDQWdJQ2dwSUQwK0lIUm9hWE11WTI5dWMzUnlkV04wYjNJdVZGbFFSU3hjYmlBZ0lDQWdJQ0FnYzJWME9pQWdJQ0FnSUNBZ0lDQW9LU0E5UGlCN2ZTd2dMeThnVGs5UFVGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHBaQ2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0JWZEdsc2N5NW5aVzVsY21GMFpWVlZTVVFvS1N4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmNtVnVaR1Z5WlhJbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUhKbGJtUmxjbVZ5TEZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNkd1lYSmxiblJPYjJSbEp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCd1lYSmxiblJPYjJSbExGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZGphR2xzWkU1dlpHVnpKem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQnVaWGNnVFdGd0tDa3NYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMk52Ym5SbGVIUW5PaUI3WEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdaMlYwT2lBZ0lDQWdJQ0FnSUNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUdOdmJuUmxlSFE3WEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lITmxkRG9nSUNBZ0lDQWdJQ0FnS0NrZ1BUNGdlMzBzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSjJSbGMzUnliM2xwYm1jbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUdaaGJITmxMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ2R5Wlc1a1pYSlFjbTl0YVhObEp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCdWRXeHNMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ2R5Wlc1a1pYSkdjbUZ0WlNjNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnTUN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmFtbGlKem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQnFhV0lzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSjI1aGRHbDJaVVZzWlcxbGJuUW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lHNTFiR3dzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJSDBwTzF4dUlDQjlYRzVjYmlBZ2NtVnpiMngyWlVOb2FXeGtjbVZ1S0dOb2FXeGtjbVZ1S1NCN1hHNGdJQ0FnY21WMGRYSnVJSEpsYzI5c2RtVkRhR2xzWkhKbGJpNWpZV3hzS0hSb2FYTXNJR05vYVd4a2NtVnVLVHRjYmlBZ2ZWeHVYRzRnSUdkbGRFTmhZMmhsUzJWNUtDa2dlMXh1SUNBZ0lHeGxkQ0I3SUZSNWNHVXNJSEJ5YjNCeklIMGdQU0FvZEdocGN5NXFhV0lnZkh3Z2UzMHBPMXh1SUNBZ0lHeGxkQ0JqWVdOb1pVdGxlU0E5SUdSbFlXUmlaV1ZtS0ZSNWNHVXNJSEJ5YjNCekxtdGxlU2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdZMkZqYUdWTFpYazdYRzRnSUgxY2JseHVJQ0IxY0dSaGRHVkthV0lvYm1WM1NtbGlLU0I3WEc0Z0lDQWdkR2hwY3k1cWFXSWdQU0J1WlhkS2FXSTdYRzRnSUgxY2JseHVJQ0J5WlcxdmRtVkRhR2xzWkNoamFHbHNaRTV2WkdVcElIdGNiaUFnSUNCc1pYUWdZMkZqYUdWTFpYa2dQU0JqYUdsc1pFNXZaR1V1WjJWMFEyRmphR1ZMWlhrb0tUdGNiaUFnSUNCMGFHbHpMbU5vYVd4a1RtOWtaWE11WkdWc1pYUmxLR05oWTJobFMyVjVLVHRjYmlBZ2ZWeHVYRzRnSUdGa1pFTm9hV3hrS0dOb2FXeGtUbTlrWlNrZ2UxeHVJQ0FnSUd4bGRDQmpZV05vWlV0bGVTQTlJR05vYVd4a1RtOWtaUzVuWlhSRFlXTm9aVXRsZVNncE8xeHVJQ0FnSUhSb2FYTXVZMmhwYkdST2IyUmxjeTV6WlhRb1kyRmphR1ZMWlhrc0lHTm9hV3hrVG05a1pTazdYRzRnSUgxY2JseHVJQ0JuWlhSRGFHbHNaQ2hqWVdOb1pVdGxlU2tnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TG1Ob2FXeGtUbTlrWlhNdVoyVjBLR05oWTJobFMyVjVLVHRjYmlBZ2ZWeHVYRzRnSUdkbGRGUm9hWE5PYjJSbFQzSkRhR2xzWkU1dlpHVnpLQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQjBhR2x6TzF4dUlDQjlYRzVjYmlBZ1oyVjBRMmhwYkdSeVpXNU9iMlJsY3lncElIdGNiaUFnSUNCc1pYUWdZMmhwYkdST2IyUmxjeUE5SUZ0ZE8xeHVJQ0FnSUdadmNpQW9iR1YwSUdOb2FXeGtUbTlrWlNCdlppQjBhR2x6TG1Ob2FXeGtUbTlrWlhNdWRtRnNkV1Z6S0NrcFhHNGdJQ0FnSUNCamFHbHNaRTV2WkdWeklEMGdZMmhwYkdST2IyUmxjeTVqYjI1allYUW9ZMmhwYkdST2IyUmxMbWRsZEZSb2FYTk9iMlJsVDNKRGFHbHNaRTV2WkdWektDa3BPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHTm9hV3hrVG05a1pYTXVabWxzZEdWeUtFSnZiMnhsWVc0cE8xeHVJQ0I5WEc1Y2JpQWdZWE41Ym1NZ1pHVnpkSEp2ZVNobWIzSmpaU2tnZTF4dUlDQWdJR2xtSUNnaFptOXlZMlVnSmlZZ2RHaHBjeTVrWlhOMGNtOTVhVzVuS1Z4dUlDQWdJQ0FnY21WMGRYSnVPMXh1WEc0Z0lDQWdkR2hwY3k1a1pYTjBjbTk1YVc1bklEMGdkSEoxWlR0Y2JseHVJQ0FnSUdsbUlDaDBhR2x6TG5KbGJtUmxjbEJ5YjIxcGMyVXBYRzRnSUNBZ0lDQmhkMkZwZENCMGFHbHpMbkpsYm1SbGNsQnliMjFwYzJVN1hHNWNiaUFnSUNCaGQyRnBkQ0IwYUdsekxtUmxjM1J5YjNsR2NtOXRSRTlOS0hSb2FYTXVZMjl1ZEdWNGRDd2dkR2hwY3lrN1hHNWNiaUFnSUNCc1pYUWdaR1Z6ZEhKdmVWQnliMjFwYzJWeklEMGdXMTA3WEc0Z0lDQWdabTl5SUNoc1pYUWdZMmhwYkdST2IyUmxJRzltSUhSb2FYTXVZMmhwYkdST2IyUmxjeTUyWVd4MVpYTW9LU2xjYmlBZ0lDQWdJR1JsYzNSeWIzbFFjbTl0YVhObGN5NXdkWE5vS0dOb2FXeGtUbTlrWlM1a1pYTjBjbTk1S0NrcE8xeHVYRzRnSUNBZ2RHaHBjeTVqYUdsc1pFNXZaR1Z6TG1Oc1pXRnlLQ2s3WEc0Z0lDQWdZWGRoYVhRZ1VISnZiV2x6WlM1aGJHd29aR1Z6ZEhKdmVWQnliMjFwYzJWektUdGNibHh1SUNBZ0lIUm9hWE11Ym1GMGFYWmxSV3hsYldWdWRDQTlJRzUxYkd3N1hHNGdJQ0FnZEdocGN5NXdZWEpsYm5ST2IyUmxJRDBnYm5Wc2JEdGNiaUFnSUNCMGFHbHpMbU52Ym5SbGVIUWdQU0J1ZFd4c08xeHVJQ0FnSUhSb2FYTXVhbWxpSUQwZ2JuVnNiRHRjYmlBZ2ZWeHVYRzRnSUdselZtRnNhV1JEYUdsc1pDaGphR2xzWkNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJWZEdsc2N5NXBjMVpoYkdsa1EyaHBiR1FvWTJocGJHUXBPMXh1SUNCOVhHNWNiaUFnYVhOSmRHVnlZV0pzWlVOb2FXeGtLR05vYVd4a0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUZWMGFXeHpMbWx6U1hSbGNtRmliR1ZEYUdsc1pDaGphR2xzWkNrN1hHNGdJSDFjYmx4dUlDQndjbTl3YzBScFptWmxjaWh2YkdSUWNtOXdjeXdnYm1WM1VISnZjSE1zSUhOcmFYQkxaWGx6S1NCN1hHNGdJQ0FnY21WMGRYSnVJRlYwYVd4ekxuQnliM0J6UkdsbVptVnlLRzlzWkZCeWIzQnpMQ0J1WlhkUWNtOXdjeXdnYzJ0cGNFdGxlWE1wTzF4dUlDQjlYRzVjYmlBZ1kyaHBiR1J5Wlc1RWFXWm1aWElvYjJ4a1EyaHBiR1J5Wlc0c0lHNWxkME5vYVd4a2NtVnVLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGVjBhV3h6TG1Ob2FXeGtjbVZ1UkdsbVptVnlLRzlzWkVOb2FXeGtjbVZ1TENCdVpYZERhR2xzWkhKbGJpazdYRzRnSUgxY2JseHVJQ0JoYzNsdVl5QnlaVzVrWlhJb2FtbGlMQ0J5Wlc1a1pYSkRiMjUwWlhoMEtTQjdYRzRnSUNBZ2FXWWdLSFJvYVhNdVpHVnpkSEp2ZVdsdVp5bGNiaUFnSUNBZ0lISmxkSFZ5Ymp0Y2JseHVJQ0FnSUhSb2FYTXVjbVZ1WkdWeVJuSmhiV1VyS3p0Y2JpQWdJQ0JzWlhRZ2NtVnVaR1Z5Um5KaGJXVWdQU0IwYUdsekxuSmxibVJsY2taeVlXMWxPMXh1WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUIwYUdsekxsOXlaVzVrWlhJZ1BUMDlJQ2RtZFc1amRHbHZiaWNwSUh0Y2JpQWdJQ0FnSUhSb2FYTXVjbVZ1WkdWeVVISnZiV2x6WlNBOUlIUm9hWE11WDNKbGJtUmxjaWhxYVdJc0lISmxibVJsY2tOdmJuUmxlSFFwWEc0Z0lDQWdJQ0FnSUM1MGFHVnVLR0Z6ZVc1aklDaHlaWE4xYkhRcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYm1SbGNsQnliMjFwYzJVZ1BTQnVkV3hzTzF4dVhHNGdJQ0FnSUNBZ0lDQWdhV1lnS0hKbGJtUmxja1p5WVcxbElENDlJSFJvYVhNdWNtVnVaR1Z5Um5KaGJXVXBYRzRnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0IwYUdsekxuTjVibU5FVDAwb2RHaHBjeTVqYjI1MFpYaDBMQ0IwYUdsektUdGNibHh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ5WlhOMWJIUTdYRzRnSUNBZ0lDQWdJSDBwWEc0Z0lDQWdJQ0FnSUM1allYUmphQ2dvWlhKeWIzSXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJtUmxjbEJ5YjIxcGMyVWdQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJSFJvY205M0lHVnljbTl5TzF4dUlDQWdJQ0FnSUNCOUtUdGNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnWVhkaGFYUWdkR2hwY3k1emVXNWpSRTlOS0hSb2FYTXVZMjl1ZEdWNGRDd2dkR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWNtVnVaR1Z5VUhKdmJXbHpaVHRjYmlBZ2ZWeHVYRzRnSUdkbGRGQmhjbVZ1ZEVsRUtDa2dlMXh1SUNBZ0lHbG1JQ2doZEdocGN5NXdZWEpsYm5ST2IyUmxLVnh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTXVjR0Z5Wlc1MFRtOWtaUzVwWkR0Y2JpQWdmVnh1WEc0Z0lHRnplVzVqSUdSbGMzUnliM2xHY205dFJFOU5LQ2tnZTF4dUlDQWdJR2xtSUNnaGRHaHBjeTV5Wlc1a1pYSmxjaWxjYmlBZ0lDQWdJSEpsZEhWeWJqdGNibHh1SUNBZ0lISmxkSFZ5YmlCaGQyRnBkQ0IwYUdsekxuSmxibVJsY21WeUxtUmxjM1J5YjNsR2NtOXRSRTlOS0hSb2FYTXVZMjl1ZEdWNGRDd2dkR2hwY3lrN1hHNGdJSDFjYmx4dUlDQmhjM2x1WXlCemVXNWpSRTlOS0NrZ2UxeHVJQ0FnSUdsbUlDZ2hkR2hwY3k1eVpXNWtaWEpsY2lsY2JpQWdJQ0FnSUhKbGRIVnlianRjYmx4dUlDQWdJSEpsZEhWeWJpQmhkMkZwZENCMGFHbHpMbkpsYm1SbGNtVnlMbk41Ym1ORVQwMG9kR2hwY3k1amIyNTBaWGgwTENCMGFHbHpLVHRjYmlBZ2ZWeHVmVnh1SWl3aUx5b2daWE5zYVc1MExXUnBjMkZpYkdVZ2JtOHRiV0ZuYVdNdGJuVnRZbVZ5Y3lBcUwxeHVhVzF3YjNKMElHUmxZV1JpWldWbUlHWnliMjBnSjJSbFlXUmlaV1ZtSnp0Y2JseHVZMjl1YzNRZ1UxUlBVQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6U1hSbGNtRjBaVk4wYjNBbktUdGNibHh1THk4Z1pYTnNhVzUwTFdScGMyRmliR1V0Ym1WNGRDMXNhVzVsSUc1dkxXNWxjM1JsWkMxMFpYSnVZWEo1WEc1amIyNXpkQ0JuYkc5aVlXeFRZMjl3WlNBOUlDaDBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQW5kVzVrWldacGJtVmtKeWtnUHlCbmJHOWlZV3dnT2lBb2RIbHdaVzltSUhkcGJtUnZkeUFoUFQwZ0ozVnVaR1ZtYVc1bFpDY3BJRDhnZDJsdVpHOTNJRG9nZEdocGN6dGNibHh1YkdWMElIVjFhV1FnUFNBeE1EQXdNREF3TzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2FXNXpkR0Z1WTJWUFppaHZZbW9wSUh0Y2JpQWdablZ1WTNScGIyNGdkR1Z6ZEZSNWNHVW9iMkpxTENCZmRtRnNLU0I3WEc0Z0lDQWdablZ1WTNScGIyNGdhWE5FWldabGNuSmxaRlI1Y0dVb2IySnFLU0I3WEc0Z0lDQWdJQ0JwWmlBb2IySnFJR2x1YzNSaGJtTmxiMllnVUhKdmJXbHpaU0I4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblVISnZiV2x6WlNjcEtWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJQ0FnTHk4Z1VYVmhZMnNnY1hWaFkyc3VMaTVjYmlBZ0lDQWdJR2xtSUNoMGVYQmxiMllnYjJKcUxuUm9aVzRnUFQwOUlDZG1kVzVqZEdsdmJpY2dKaVlnZEhsd1pXOW1JRzlpYWk1allYUmphQ0E5UFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNiaUFnSUNCOVhHNWNiaUFnSUNCc1pYUWdkbUZzSUNBZ0lDQTlJRjkyWVd3N1hHNGdJQ0FnYkdWMElIUjVjR1ZQWmlBZ1BTQW9kSGx3Wlc5bUlHOWlhaWs3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNVRkSEpwYm1jcFhHNGdJQ0FnSUNCMllXd2dQU0FuYzNSeWFXNW5KenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMazUxYldKbGNpbGNiaUFnSUNBZ0lIWmhiQ0E5SUNkdWRXMWlaWEluTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1UW05dmJHVmhiaWxjYmlBZ0lDQWdJSFpoYkNBOUlDZGliMjlzWldGdUp6dGNiaUFnSUNCbGJITmxJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExrWjFibU4wYVc5dUtWeHVJQ0FnSUNBZ2RtRnNJRDBnSjJaMWJtTjBhVzl1Snp0Y2JpQWdJQ0JsYkhObElHbG1JQ2gyWVd3Z1BUMDlJR2RzYjJKaGJGTmpiM0JsTGtGeWNtRjVLVnh1SUNBZ0lDQWdkbUZzSUQwZ0oyRnljbUY1Snp0Y2JpQWdJQ0JsYkhObElHbG1JQ2gyWVd3Z1BUMDlJR2RzYjJKaGJGTmpiM0JsTGs5aWFtVmpkQ2xjYmlBZ0lDQWdJSFpoYkNBOUlDZHZZbXBsWTNRbk8xeHVJQ0FnSUdWc2MyVWdhV1lnS0haaGJDQTlQVDBnWjJ4dlltRnNVMk52Y0dVdVVISnZiV2x6WlNsY2JpQWdJQ0FnSUhaaGJDQTlJQ2R3Y205dGFYTmxKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMa0pwWjBsdWRDbGNiaUFnSUNBZ0lIWmhiQ0E5SUNkaWFXZHBiblFuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VFdGd0tWeHVJQ0FnSUNBZ2RtRnNJRDBnSjIxaGNDYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNVhaV0ZyVFdGd0tWeHVJQ0FnSUNBZ2RtRnNJRDBnSjNkbFlXdHRZWEFuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VTJWMEtWeHVJQ0FnSUNBZ2RtRnNJRDBnSjNObGRDYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNVRlVzFpYjJ3cFhHNGdJQ0FnSUNCMllXd2dQU0FuYzNsdFltOXNKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMa0oxWm1abGNpbGNiaUFnSUNBZ0lIWmhiQ0E5SUNkaWRXWm1aWEluTzF4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0E5UFQwZ0oySjFabVpsY2ljZ0ppWWdaMnh2WW1Gc1UyTnZjR1V1UW5WbVptVnlJQ1ltSUdkc2IySmhiRk5qYjNCbExrSjFabVpsY2k1cGMwSjFabVpsY2lodlltb3BLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNBbmJuVnRZbVZ5SnlBbUppQW9kSGx3WlU5bUlEMDlQU0FuYm5WdFltVnlKeUI4ZkNCdlltb2dhVzV6ZEdGdVkyVnZaaUJPZFcxaVpYSWdmSHdnS0c5aWFpNWpiMjV6ZEhKMVkzUnZjaUFtSmlCdlltb3VZMjl1YzNSeWRXTjBiM0l1Ym1GdFpTQTlQVDBnSjA1MWJXSmxjaWNwS1NrZ2UxeHVJQ0FnSUNBZ2FXWWdLQ0ZwYzBacGJtbDBaU2h2WW1vcEtWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdsbUlDaDJZV3dnSVQwOUlDZHZZbXBsWTNRbklDWW1JSFpoYkNBOVBUMGdkSGx3WlU5bUtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuYjJKcVpXTjBKeWtnZTF4dUlDQWdJQ0FnYVdZZ0tDaHZZbW91WTI5dWMzUnlkV04wYjNJZ1BUMDlJRTlpYW1WamRDNXdjbTkwYjNSNWNHVXVZMjl1YzNSeWRXTjBiM0lnZkh3Z0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBbUppQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0owOWlhbVZqZENjcEtTbGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0FnSUM4dklFNTFiR3dnY0hKdmRHOTBlWEJsSUc5dUlHOWlhbVZqZEZ4dUlDQWdJQ0FnYVdZZ0tIUjVjR1ZQWmlBOVBUMGdKMjlpYW1WamRDY2dKaVlnSVc5aWFpNWpiMjV6ZEhKMVkzUnZjaWxjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuWVhKeVlYa25JQ1ltSUNoQmNuSmhlUzVwYzBGeWNtRjVLRzlpYWlrZ2ZId2diMkpxSUdsdWMzUmhibU5sYjJZZ1FYSnlZWGtnZkh3Z0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBbUppQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0owRnljbUY1SnlrcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvS0haaGJDQTlQVDBnSjNCeWIyMXBjMlVuSUh4OElIWmhiQ0E5UFQwZ0oyUmxabVZ5Y21Wa0p5a2dKaVlnYVhORVpXWmxjbkpsWkZSNWNHVW9iMkpxS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKM04wY21sdVp5Y2dKaVlnS0c5aWFpQnBibk4wWVc1alpXOW1JR2RzYjJKaGJGTmpiM0JsTGxOMGNtbHVaeUI4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblUzUnlhVzVuSnlrcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuWW05dmJHVmhiaWNnSmlZZ0tHOWlhaUJwYm5OMFlXNWpaVzltSUdkc2IySmhiRk5qYjNCbExrSnZiMnhsWVc0Z2ZId2dLRzlpYWk1amIyNXpkSEoxWTNSdmNpQW1KaUJ2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlNBOVBUMGdKMEp2YjJ4bFlXNG5LU2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUdsbUlDaDJZV3dnUFQwOUlDZHRZWEFuSUNZbUlDaHZZbW9nYVc1emRHRnVZMlZ2WmlCbmJHOWlZV3hUWTI5d1pTNU5ZWEFnZkh3Z0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBbUppQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0owMWhjQ2NwS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKM2RsWVd0dFlYQW5JQ1ltSUNodlltb2dhVzV6ZEdGdVkyVnZaaUJuYkc5aVlXeFRZMjl3WlM1WFpXRnJUV0Z3SUh4OElDaHZZbW91WTI5dWMzUnlkV04wYjNJZ0ppWWdiMkpxTG1OdmJuTjBjblZqZEc5eUxtNWhiV1VnUFQwOUlDZFhaV0ZyVFdGd0p5a3BLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNBbmMyVjBKeUFtSmlBb2IySnFJR2x1YzNSaGJtTmxiMllnWjJ4dlltRnNVMk52Y0dVdVUyVjBJSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkVFpYUW5LU2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUdsbUlDaDJZV3dnUFQwOUlDZG1kVzVqZEdsdmJpY2dKaVlnZEhsd1pVOW1JRDA5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JSFpoYkNBOVBUMGdKMloxYm1OMGFXOXVKeUFtSmlCdlltb2dhVzV6ZEdGdVkyVnZaaUIyWVd3cFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdkbUZzSUQwOVBTQW5jM1J5YVc1bkp5QW1KaUJ2WW1vdVkyOXVjM1J5ZFdOMGIzSWdKaVlnYjJKcUxtTnZibk4wY25WamRHOXlMbTVoYldVZ1BUMDlJSFpoYkNsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNCOVhHNWNiaUFnYVdZZ0tHOWlhaUE5UFNCdWRXeHNLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQm1iM0lnS0haaGNpQnBJRDBnTVN3Z2JHVnVJRDBnWVhKbmRXMWxiblJ6TG14bGJtZDBhRHNnYVNBOElHeGxianNnYVNzcktTQjdYRzRnSUNBZ2FXWWdLSFJsYzNSVWVYQmxLRzlpYWl3Z1lYSm5kVzFsYm5SelcybGRLU0E5UFQwZ2RISjFaU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUdaaGJITmxPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2NISnZjSE5FYVdabVpYSW9iMnhrVUhKdmNITXNJRzVsZDFCeWIzQnpMQ0J6YTJsd1MyVjVjeWtnZTF4dUlDQnBaaUFvYjJ4a1VISnZjSE1nUFQwOUlHNWxkMUJ5YjNCektWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCcFppQW9kSGx3Wlc5bUlHOXNaRkJ5YjNCeklDRTlQU0IwZVhCbGIyWWdibVYzVUhKdmNITXBYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ2FXWWdLQ0Z2YkdSUWNtOXdjeUFtSmlCdVpYZFFjbTl3Y3lsY2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JwWmlBb2IyeGtVSEp2Y0hNZ0ppWWdJVzVsZDFCeWIzQnpLVnh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDOHZJR1Z6YkdsdWRDMWthWE5oWW14bExXNWxlSFF0YkdsdVpTQmxjV1Z4WlhGY2JpQWdhV1lnS0NGdmJHUlFjbTl3Y3lBbUppQWhibVYzVUhKdmNITWdKaVlnYjJ4a1VISnZjSE1nSVQwZ2IyeGtVSEp2Y0hNcFhHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnYkdWMElHRkxaWGx6SUQwZ1QySnFaV04wTG10bGVYTW9iMnhrVUhKdmNITXBMbU52Ym1OaGRDaFBZbXBsWTNRdVoyVjBUM2R1VUhKdmNHVnlkSGxUZVcxaWIyeHpLRzlzWkZCeWIzQnpLU2s3WEc0Z0lHeGxkQ0JpUzJWNWN5QTlJRTlpYW1WamRDNXJaWGx6S0c1bGQxQnliM0J6S1M1amIyNWpZWFFvVDJKcVpXTjBMbWRsZEU5M2JsQnliM0JsY25SNVUzbHRZbTlzY3lodVpYZFFjbTl3Y3lrcE8xeHVYRzRnSUdsbUlDaGhTMlY1Y3k1c1pXNW5kR2dnSVQwOUlHSkxaWGx6TG14bGJtZDBhQ2xjYmlBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0JoUzJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdiR1YwSUdGTFpYa2dQU0JoUzJWNWMxdHBYVHRjYmlBZ0lDQnBaaUFvYzJ0cGNFdGxlWE1nSmlZZ2MydHBjRXRsZVhNdWFXNWtaWGhQWmloaFMyVjVLU0ErUFNBd0tWeHVJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNWNiaUFnSUNCcFppQW9iMnhrVUhKdmNITmJZVXRsZVYwZ0lUMDlJRzVsZDFCeWIzQnpXMkZMWlhsZEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnNaWFFnWWt0bGVTQTlJR0pMWlhselcybGRPMXh1SUNBZ0lHbG1JQ2h6YTJsd1MyVjVjeUFtSmlCemEybHdTMlY1Y3k1cGJtUmxlRTltS0dKTFpYa3BLVnh1SUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzVjYmlBZ0lDQnBaaUFvWVV0bGVTQTlQVDBnWWt0bGVTbGNiaUFnSUNBZ0lHTnZiblJwYm5WbE8xeHVYRzRnSUNBZ2FXWWdLRzlzWkZCeWIzQnpXMkpMWlhsZElDRTlQU0J1WlhkUWNtOXdjMXRpUzJWNVhTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJR1poYkhObE8xeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnYzJsNlpVOW1LSFpoYkhWbEtTQjdYRzRnSUdsbUlDZ2hkbUZzZFdVcFhHNGdJQ0FnY21WMGRYSnVJREE3WEc1Y2JpQWdhV1lnS0U5aWFtVmpkQzVwY3loSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJREE3WEc1Y2JpQWdhV1lnS0hSNWNHVnZaaUIyWVd4MVpTNXNaVzVuZEdnZ1BUMDlJQ2R1ZFcxaVpYSW5LVnh1SUNBZ0lISmxkSFZ5YmlCMllXeDFaUzVzWlc1bmRHZzdYRzVjYmlBZ2NtVjBkWEp1SUU5aWFtVmpkQzVyWlhsektIWmhiSFZsS1M1c1pXNW5kR2c3WEc1OVhHNWNibVoxYm1OMGFXOXVJRjlwZEdWeVlYUmxLRzlpYWl3Z1kyRnNiR0poWTJzcElIdGNiaUFnYVdZZ0tDRnZZbW9nZkh3Z1QySnFaV04wTG1sektFbHVabWx1YVhSNUtTbGNiaUFnSUNCeVpYUjFjbTRnVzEwN1hHNWNiaUFnYkdWMElISmxjM1ZzZEhNZ0lDQTlJRnRkTzF4dUlDQnNaWFFnYzJOdmNHVWdJQ0FnSUQwZ2V5QmpiMnhzWldOMGFXOXVPaUJ2WW1vc0lGTlVUMUFnZlR0Y2JpQWdiR1YwSUhKbGMzVnNkRHRjYmx4dUlDQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaHZZbW9wS1NCN1hHNGdJQ0FnYzJOdmNHVXVkSGx3WlNBOUlDZEJjbkpoZVNjN1hHNWNiaUFnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQnZZbW91YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUNBZ2MyTnZjR1V1ZG1Gc2RXVWdQU0J2WW1wYmFWMDdYRzRnSUNBZ0lDQnpZMjl3WlM1cGJtUmxlQ0E5SUhOamIzQmxMbXRsZVNBOUlHazdYRzVjYmlBZ0lDQWdJSEpsYzNWc2RDQTlJR05oYkd4aVlXTnJMbU5oYkd3b2RHaHBjeXdnYzJOdmNHVXBPMXh1SUNBZ0lDQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ1UxUlBVQ2xjYmlBZ0lDQWdJQ0FnWW5KbFlXczdYRzVjYmlBZ0lDQWdJSEpsYzNWc2RITXVjSFZ6YUNoeVpYTjFiSFFwTzF4dUlDQWdJSDFjYmlBZ2ZTQmxiSE5sSUdsbUlDaDBlWEJsYjJZZ2IySnFMbVZ1ZEhKcFpYTWdQVDA5SUNkbWRXNWpkR2x2YmljcElIdGNiaUFnSUNCcFppQW9iMkpxSUdsdWMzUmhibU5sYjJZZ1UyVjBJSHg4SUc5aWFpNWpiMjV6ZEhKMVkzUnZjaTV1WVcxbElEMDlQU0FuVTJWMEp5a2dlMXh1SUNBZ0lDQWdjMk52Y0dVdWRIbHdaU0E5SUNkVFpYUW5PMXh1WEc0Z0lDQWdJQ0JzWlhRZ2FXNWtaWGdnUFNBd08xeHVJQ0FnSUNBZ1ptOXlJQ2hzWlhRZ2FYUmxiU0J2WmlCdlltb3VkbUZzZFdWektDa3BJSHRjYmlBZ0lDQWdJQ0FnYzJOdmNHVXVkbUZzZFdVZ1BTQnBkR1Z0TzF4dUlDQWdJQ0FnSUNCelkyOXdaUzVyWlhrZ1BTQnBkR1Z0TzF4dUlDQWdJQ0FnSUNCelkyOXdaUzVwYm1SbGVDQTlJR2x1WkdWNEt5czdYRzVjYmlBZ0lDQWdJQ0FnY21WemRXeDBJRDBnWTJGc2JHSmhZMnN1WTJGc2JDaDBhR2x6TENCelkyOXdaU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJRk5VVDFBcFhHNGdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNWNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MGN5NXdkWE5vS0hKbGMzVnNkQ2s3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lITmpiM0JsTG5SNWNHVWdQU0J2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlR0Y2JseHVJQ0FnSUNBZ2JHVjBJR2x1WkdWNElEMGdNRHRjYmlBZ0lDQWdJR1p2Y2lBb2JHVjBJRnNnYTJWNUxDQjJZV3gxWlNCZElHOW1JRzlpYWk1bGJuUnlhV1Z6S0NrcElIdGNiaUFnSUNBZ0lDQWdjMk52Y0dVdWRtRnNkV1VnUFNCMllXeDFaVHRjYmlBZ0lDQWdJQ0FnYzJOdmNHVXVhMlY1SUQwZ2EyVjVPMXh1SUNBZ0lDQWdJQ0J6WTI5d1pTNXBibVJsZUNBOUlHbHVaR1Y0S3lzN1hHNWNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MElEMGdZMkZzYkdKaFkyc3VZMkZzYkNoMGFHbHpMQ0J6WTI5d1pTazdYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTjFiSFFnUFQwOUlGTlVUMUFwWEc0Z0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc1Y2JpQWdJQ0FnSUNBZ2NtVnpkV3gwY3k1d2RYTm9LSEpsYzNWc2RDazdYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHbG1JQ2hwYm5OMFlXNWpaVTltS0c5aWFpd2dKMkp2YjJ4bFlXNG5MQ0FuYm5WdFltVnlKeXdnSjJKcFoybHVkQ2NzSUNkbWRXNWpkR2x2YmljcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJQ0FnYzJOdmNHVXVkSGx3WlNBOUlDaHZZbW91WTI5dWMzUnlkV04wYjNJcElEOGdiMkpxTG1OdmJuTjBjblZqZEc5eUxtNWhiV1VnT2lBblQySnFaV04wSnp0Y2JseHVJQ0FnSUd4bGRDQnJaWGx6SUQwZ1QySnFaV04wTG10bGVYTW9iMkpxS1R0Y2JpQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCclpYbHpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUd4bGRDQnJaWGtnSUNBOUlHdGxlWE5iYVYwN1hHNGdJQ0FnSUNCc1pYUWdkbUZzZFdVZ1BTQnZZbXBiYTJWNVhUdGNibHh1SUNBZ0lDQWdjMk52Y0dVdWRtRnNkV1VnUFNCMllXeDFaVHRjYmlBZ0lDQWdJSE5qYjNCbExtdGxlU0E5SUd0bGVUdGNiaUFnSUNBZ0lITmpiM0JsTG1sdVpHVjRJRDBnYVR0Y2JseHVJQ0FnSUNBZ2NtVnpkV3gwSUQwZ1kyRnNiR0poWTJzdVkyRnNiQ2gwYUdsekxDQnpZMjl3WlNrN1hHNGdJQ0FnSUNCcFppQW9jbVZ6ZFd4MElEMDlQU0JUVkU5UUtWeHVJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JseHVJQ0FnSUNBZ2NtVnpkV3gwY3k1d2RYTm9LSEpsYzNWc2RDazdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlISmxjM1ZzZEhNN1hHNTlYRzVjYms5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGFXVnpLRjlwZEdWeVlYUmxMQ0I3WEc0Z0lDZFRWRTlRSnpvZ2UxeHVJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1UxUlBVQ3hjYmlBZ2ZTeGNibjBwTzF4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnYVhSbGNtRjBaU0E5SUY5cGRHVnlZWFJsTzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1kyaHBiR1J5Wlc1RWFXWm1aWElvWDJOb2FXeGtjbVZ1TVN3Z1gyTm9hV3hrY21WdU1pa2dlMXh1SUNCc1pYUWdZMmhwYkdSeVpXNHhJRDBnS0NGQmNuSmhlUzVwYzBGeWNtRjVLRjlqYUdsc1pISmxiakVwS1NBL0lGc2dYMk5vYVd4a2NtVnVNU0JkSURvZ1gyTm9hV3hrY21WdU1UdGNiaUFnYkdWMElHTm9hV3hrY21WdU1pQTlJQ2doUVhKeVlYa3VhWE5CY25KaGVTaGZZMmhwYkdSeVpXNHlLU2tnUHlCYklGOWphR2xzWkhKbGJqSWdYU0E2SUY5amFHbHNaSEpsYmpJN1hHNWNiaUFnY21WMGRYSnVJQ2hrWldGa1ltVmxaaWd1TGk1amFHbHNaSEpsYmpFcElDRTlQU0JrWldGa1ltVmxaaWd1TGk1amFHbHNaSEpsYmpJcEtUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdabGRHTm9SR1ZsY0ZCeWIzQmxjblI1S0c5aWFpd2dYMnRsZVN3Z1pHVm1ZWFZzZEZaaGJIVmxMQ0JzWVhOMFVHRnlkQ2tnZTF4dUlDQnBaaUFvYjJKcUlEMDlJRzUxYkd3Z2ZId2dUMkpxWldOMExtbHpLRTVoVGl3Z2IySnFLU0I4ZkNCUFltcGxZM1F1YVhNb1NXNW1hVzVwZEhrc0lHOWlhaWtwWEc0Z0lDQWdjbVYwZFhKdUlDaHNZWE4wVUdGeWRDa2dQeUJiSUdSbFptRjFiSFJXWVd4MVpTd2diblZzYkNCZElEb2daR1ZtWVhWc2RGWmhiSFZsTzF4dVhHNGdJR2xtSUNoZmEyVjVJRDA5SUc1MWJHd2dmSHdnVDJKcVpXTjBMbWx6S0U1aFRpd2dYMnRsZVNrZ2ZId2dUMkpxWldOMExtbHpLRWx1Wm1sdWFYUjVMQ0JmYTJWNUtTbGNiaUFnSUNCeVpYUjFjbTRnS0d4aGMzUlFZWEowS1NBL0lGc2daR1ZtWVhWc2RGWmhiSFZsTENCdWRXeHNJRjBnT2lCa1pXWmhkV3gwVm1Gc2RXVTdYRzVjYmlBZ2JHVjBJSEJoY25Sek8xeHVYRzRnSUdsbUlDaEJjbkpoZVM1cGMwRnljbUY1S0Y5clpYa3BLU0I3WEc0Z0lDQWdjR0Z5ZEhNZ1BTQmZhMlY1TzF4dUlDQjlJR1ZzYzJVZ2FXWWdLSFI1Y0dWdlppQmZhMlY1SUQwOVBTQW5jM2x0WW05c0p5a2dlMXh1SUNBZ0lIQmhjblJ6SUQwZ1d5QmZhMlY1SUYwN1hHNGdJSDBnWld4elpTQjdYRzRnSUNBZ2JHVjBJR3RsZVNBZ0lDQWdJQ0FnSUQwZ0tDY25JQ3NnWDJ0bGVTazdYRzRnSUNBZ2JHVjBJR3hoYzNSSmJtUmxlQ0FnSUQwZ01EdGNiaUFnSUNCc1pYUWdiR0Z6ZEVOMWNuTnZjaUFnUFNBd08xeHVYRzRnSUNBZ2NHRnlkSE1nUFNCYlhUdGNibHh1SUNBZ0lDOHZJR1Z6YkdsdWRDMWthWE5oWW14bExXNWxlSFF0YkdsdVpTQnVieTFqYjI1emRHRnVkQzFqYjI1a2FYUnBiMjVjYmlBZ0lDQjNhR2xzWlNBb2RISjFaU2tnZTF4dUlDQWdJQ0FnYkdWMElHbHVaR1Y0SUQwZ2EyVjVMbWx1WkdWNFQyWW9KeTRuTENCc1lYTjBTVzVrWlhncE8xeHVJQ0FnSUNBZ2FXWWdLR2x1WkdWNElEd2dNQ2tnZTF4dUlDQWdJQ0FnSUNCd1lYSjBjeTV3ZFhOb0tHdGxlUzV6ZFdKemRISnBibWNvYkdGemRFTjFjbk52Y2lrcE8xeHVJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2FXWWdLR3RsZVM1amFHRnlRWFFvYVc1a1pYZ2dMU0F4S1NBOVBUMGdKMXhjWEZ3bktTQjdYRzRnSUNBZ0lDQWdJR3hoYzNSSmJtUmxlQ0E5SUdsdVpHVjRJQ3NnTVR0Y2JpQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lIQmhjblJ6TG5CMWMyZ29hMlY1TG5OMVluTjBjbWx1Wnloc1lYTjBRM1Z5YzI5eUxDQnBibVJsZUNrcE8xeHVJQ0FnSUNBZ2JHRnpkRU4xY25OdmNpQTlJR3hoYzNSSmJtUmxlQ0E5SUdsdVpHVjRJQ3NnTVR0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCc1pYUWdjR0Z5ZEU0Z1BTQndZWEowYzF0d1lYSjBjeTVzWlc1bmRHZ2dMU0F4WFR0Y2JpQWdhV1lnS0hCaGNuUnpMbXhsYm1kMGFDQTlQVDBnTUNsY2JpQWdJQ0J5WlhSMWNtNGdLR3hoYzNSUVlYSjBLU0EvSUZzZ1pHVm1ZWFZzZEZaaGJIVmxMQ0J3WVhKMFRpQmRJRG9nWkdWbVlYVnNkRlpoYkhWbE8xeHVYRzRnSUd4bGRDQmpkWEp5Wlc1MFZtRnNkV1VnUFNCdlltbzdYRzRnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlIQmhjblJ6TG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNCc1pYUWdhMlY1SUQwZ2NHRnlkSE5iYVYwN1hHNWNiaUFnSUNCamRYSnlaVzUwVm1Gc2RXVWdQU0JqZFhKeVpXNTBWbUZzZFdWYmEyVjVYVHRjYmlBZ0lDQnBaaUFvWTNWeWNtVnVkRlpoYkhWbElEMDlJRzUxYkd3cFhHNGdJQ0FnSUNCeVpYUjFjbTRnS0d4aGMzUlFZWEowS1NBL0lGc2daR1ZtWVhWc2RGWmhiSFZsTENCd1lYSjBUaUJkSURvZ1pHVm1ZWFZzZEZaaGJIVmxPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJQ2hzWVhOMFVHRnlkQ2tnUHlCYklHTjFjbkpsYm5SV1lXeDFaU3dnY0dGeWRFNGdYU0E2SUdOMWNuSmxiblJXWVd4MVpUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdKcGJtUk5aWFJvYjJSektGOXdjbTkwYnl3Z2MydHBjRkJ5YjNSdmN5a2dlMXh1SUNCc1pYUWdjSEp2ZEc4Z0lDQWdJQ0FnSUNBZ0lEMGdYM0J5YjNSdk8xeHVJQ0JzWlhRZ1lXeHlaV0ZrZVZacGMybDBaV1FnSUQwZ2JtVjNJRk5sZENncE8xeHVYRzRnSUhkb2FXeGxJQ2h3Y205MGJ5a2dlMXh1SUNBZ0lHeGxkQ0JrWlhOamNtbHdkRzl5Y3lBOUlFOWlhbVZqZEM1blpYUlBkMjVRY205d1pYSjBlVVJsYzJOeWFYQjBiM0p6S0hCeWIzUnZLVHRjYmlBZ0lDQnNaWFFnYTJWNWN5QWdJQ0FnSUNBZ1BTQlBZbXBsWTNRdWEyVjVjeWhrWlhOamNtbHdkRzl5Y3lrdVkyOXVZMkYwS0U5aWFtVmpkQzVuWlhSUGQyNVFjbTl3WlhKMGVWTjViV0p2YkhNb1pHVnpZM0pwY0hSdmNuTXBLVHRjYmx4dUlDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUd0bGVYTXViR1Z1WjNSb095QnBJRHdnYVd3N0lHa3JLeWtnZTF4dUlDQWdJQ0FnYkdWMElHdGxlU0E5SUd0bGVYTmJhVjA3WEc0Z0lDQWdJQ0JwWmlBb2EyVjVJRDA5UFNBblkyOXVjM1J5ZFdOMGIzSW5LVnh1SUNBZ0lDQWdJQ0JqYjI1MGFXNTFaVHRjYmx4dUlDQWdJQ0FnYVdZZ0tHRnNjbVZoWkhsV2FYTnBkR1ZrTG1oaGN5aHJaWGtwS1Z4dUlDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUNBZ1lXeHlaV0ZrZVZacGMybDBaV1F1WVdSa0tHdGxlU2s3WEc1Y2JpQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlIQnliM1J2VzJ0bGVWMDdYRzVjYmlBZ0lDQWdJQzh2SUZOcmFYQWdjSEp2ZEc5MGVYQmxJRzltSUU5aWFtVmpkRnh1SUNBZ0lDQWdMeThnWlhOc2FXNTBMV1JwYzJGaWJHVXRibVY0ZEMxc2FXNWxJRzV2TFhCeWIzUnZkSGx3WlMxaWRXbHNkR2x1YzF4dUlDQWdJQ0FnYVdZZ0tFOWlhbVZqZEM1d2NtOTBiM1I1Y0dVdWFHRnpUM2R1VUhKdmNHVnlkSGtvYTJWNUtTQW1KaUJQWW1wbFkzUXVjSEp2ZEc5MGVYQmxXMnRsZVYwZ1BUMDlJSFpoYkhWbEtWeHVJQ0FnSUNBZ0lDQmpiMjUwYVc1MVpUdGNibHh1SUNBZ0lDQWdhV1lnS0hSNWNHVnZaaUIyWVd4MVpTQWhQVDBnSjJaMWJtTjBhVzl1SnlsY2JpQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNWNiaUFnSUNBZ0lIUm9hWE5iYTJWNVhTQTlJSFpoYkhWbExtSnBibVFvZEdocGN5azdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2NISnZkRzhnUFNCUFltcGxZM1F1WjJWMFVISnZkRzkwZVhCbFQyWW9jSEp2ZEc4cE8xeHVJQ0FnSUdsbUlDaHdjbTkwYnlBOVBUMGdUMkpxWldOMExuQnliM1J2ZEhsd1pTbGNiaUFnSUNBZ0lHSnlaV0ZyTzF4dVhHNGdJQ0FnYVdZZ0tITnJhWEJRY205MGIzTWdKaVlnYzJ0cGNGQnliM1J2Y3k1cGJtUmxlRTltS0hCeWIzUnZLU0ErUFNBd0tWeHVJQ0FnSUNBZ1luSmxZV3M3WEc0Z0lIMWNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdselJXMXdkSGtvZG1Gc2RXVXBJSHRjYmlBZ2FXWWdLSFpoYkhWbElEMDlJRzUxYkd3cFhHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnYVdZZ0tFOWlhbVZqZEM1cGN5aDJZV3gxWlN3Z1NXNW1hVzVwZEhrcEtWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCcFppQW9UMkpxWldOMExtbHpLSFpoYkhWbExDQk9ZVTRwS1Z4dUlDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJR2xtSUNocGJuTjBZVzVqWlU5bUtIWmhiSFZsTENBbmMzUnlhVzVuSnlrcFhHNGdJQ0FnY21WMGRYSnVJQ0VvTDF4Y1V5OHBMblJsYzNRb2RtRnNkV1VwTzF4dUlDQmxiSE5sSUdsbUlDaHBibk4wWVc1alpVOW1LSFpoYkhWbExDQW5iblZ0WW1WeUp5a2dKaVlnYVhOR2FXNXBkR1VvZG1Gc2RXVXBLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmlBZ1pXeHpaU0JwWmlBb0lXbHVjM1JoYm1ObFQyWW9kbUZzZFdVc0lDZGliMjlzWldGdUp5d2dKMkpwWjJsdWRDY3NJQ2RtZFc1amRHbHZiaWNwSUNZbUlITnBlbVZQWmloMllXeDFaU2tnUFQwOUlEQXBYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ2NtVjBkWEp1SUdaaGJITmxPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2FYTk9iM1JGYlhCMGVTaDJZV3gxWlNrZ2UxeHVJQ0J5WlhSMWNtNGdJV2x6Ulcxd2RIa3VZMkZzYkNoMGFHbHpMQ0IyWVd4MVpTazdYRzU5WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCbWJHRjBkR1Z1UVhKeVlYa29kbUZzZFdVcElIdGNiaUFnYVdZZ0tDRkJjbkpoZVM1cGMwRnljbUY1S0haaGJIVmxLU2xjYmlBZ0lDQnlaWFIxY200Z2RtRnNkV1U3WEc1Y2JpQWdiR1YwSUc1bGQwRnljbUY1SUQwZ1cxMDdYRzRnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlIWmhiSFZsTG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNCc1pYUWdhWFJsYlNBOUlIWmhiSFZsVzJsZE8xeHVJQ0FnSUdsbUlDaEJjbkpoZVM1cGMwRnljbUY1S0dsMFpXMHBLVnh1SUNBZ0lDQWdibVYzUVhKeVlYa2dQU0J1WlhkQmNuSmhlUzVqYjI1allYUW9abXhoZEhSbGJrRnljbUY1S0dsMFpXMHBLVHRjYmlBZ0lDQmxiSE5sWEc0Z0lDQWdJQ0J1WlhkQmNuSmhlUzV3ZFhOb0tHbDBaVzBwTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUc1bGQwRnljbUY1TzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdhWE5XWVd4cFpFTm9hV3hrS0dOb2FXeGtLU0I3WEc0Z0lHbG1JQ2hqYUdsc1pDQTlQU0J1ZFd4c0tWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCcFppQW9kSGx3Wlc5bUlHTm9hV3hrSUQwOVBTQW5ZbTl2YkdWaGJpY3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2hQWW1wbFkzUXVhWE1vWTJocGJHUXNJRWx1Wm1sdWFYUjVLU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0U5aWFtVmpkQzVwY3loamFHbHNaQ3dnVG1GT0tTbGNiaUFnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ2NtVjBkWEp1SUhSeWRXVTdYRzU5WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCcGMwbDBaWEpoWW14bFEyaHBiR1FvWTJocGJHUXBJSHRjYmlBZ2FXWWdLR05vYVd4a0lEMDlJRzUxYkd3Z2ZId2dUMkpxWldOMExtbHpLR05vYVd4a0xDQk9ZVTRwSUh4OElFOWlhbVZqZEM1cGN5aGphR2xzWkN3Z1NXNW1hVzVwZEhrcEtWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCeVpYUjFjbTRnS0VGeWNtRjVMbWx6UVhKeVlYa29ZMmhwYkdRcElIeDhJSFI1Y0dWdlppQmphR2xzWkNBOVBUMGdKMjlpYW1WamRDY2dKaVlnSVdsdWMzUmhibU5sVDJZb1kyaHBiR1FzSUNkaWIyOXNaV0Z1Snl3Z0oyNTFiV0psY2ljc0lDZHpkSEpwYm1jbktTazdYRzU5WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCdWIzY29LU0I3WEc0Z0lHbG1JQ2gwZVhCbGIyWWdjR1Z5Wm05eWJXRnVZMlVnSVQwOUlDZDFibVJsWm1sdVpXUW5JQ1ltSUhSNWNHVnZaaUJ3WlhKbWIzSnRZVzVqWlM1dWIzY2dQVDA5SUNkbWRXNWpkR2x2YmljcFhHNGdJQ0FnY21WMGRYSnVJSEJsY21admNtMWhibU5sTG01dmR5Z3BPMXh1SUNCbGJITmxYRzRnSUNBZ2NtVjBkWEp1SUVSaGRHVXVibTkzS0NrN1hHNTlYRzVjYm1WNGNHOXlkQ0JtZFc1amRHbHZiaUJuWlc1bGNtRjBaVlZWU1VRb0tTQjdYRzRnSUdsbUlDaDFkV2xrSUQ0Z09UazVPVGs1T1NsY2JpQWdJQ0IxZFdsa0lEMGdNVEF3TURBd01EdGNibHh1SUNCeVpYUjFjbTRnWUNSN1JHRjBaUzV1YjNjb0tYMHVKSHQxZFdsa0t5dDlKSHROWVhSb0xuSnZkVzVrS0UxaGRHZ3VjbUZ1Wkc5dEtDa2dLaUF4TURBd01EQXdNQ2t1ZEc5VGRISnBibWNvS1M1d1lXUlRkR0Z5ZENneU1Dd2dKekFuS1gxZ08xeHVmVnh1SWl3aUx5OGdWR2hsSUcxdlpIVnNaU0JqWVdOb1pWeHVkbUZ5SUY5ZmQyVmljR0ZqYTE5dGIyUjFiR1ZmWTJGamFHVmZYeUE5SUh0OU8xeHVYRzR2THlCVWFHVWdjbVZ4ZFdseVpTQm1kVzVqZEdsdmJseHVablZ1WTNScGIyNGdYMTkzWldKd1lXTnJYM0psY1hWcGNtVmZYeWh0YjJSMWJHVkpaQ2tnZTF4dVhIUXZMeUJEYUdWamF5QnBaaUJ0YjJSMWJHVWdhWE1nYVc0Z1kyRmphR1ZjYmx4MGRtRnlJR05oWTJobFpFMXZaSFZzWlNBOUlGOWZkMlZpY0dGamExOXRiMlIxYkdWZlkyRmphR1ZmWDF0dGIyUjFiR1ZKWkYwN1hHNWNkR2xtSUNoallXTm9aV1JOYjJSMWJHVWdJVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVYSFJjZEhKbGRIVnliaUJqWVdOb1pXUk5iMlIxYkdVdVpYaHdiM0owY3p0Y2JseDBmVnh1WEhRdkx5QkRjbVZoZEdVZ1lTQnVaWGNnYlc5a2RXeGxJQ2hoYm1RZ2NIVjBJR2wwSUdsdWRHOGdkR2hsSUdOaFkyaGxLVnh1WEhSMllYSWdiVzlrZFd4bElEMGdYMTkzWldKd1lXTnJYMjF2WkhWc1pWOWpZV05vWlY5ZlcyMXZaSFZzWlVsa1hTQTlJSHRjYmx4MFhIUXZMeUJ1YnlCdGIyUjFiR1V1YVdRZ2JtVmxaR1ZrWEc1Y2RGeDBMeThnYm04Z2JXOWtkV3hsTG14dllXUmxaQ0J1WldWa1pXUmNibHgwWEhSbGVIQnZjblJ6T2lCN2ZWeHVYSFI5TzF4dVhHNWNkQzh2SUVWNFpXTjFkR1VnZEdobElHMXZaSFZzWlNCbWRXNWpkR2x2Ymx4dVhIUmZYM2RsWW5CaFkydGZiVzlrZFd4bGMxOWZXMjF2WkhWc1pVbGtYUzVqWVd4c0tHMXZaSFZzWlM1bGVIQnZjblJ6TENCdGIyUjFiR1VzSUcxdlpIVnNaUzVsZUhCdmNuUnpMQ0JmWDNkbFluQmhZMnRmY21WeGRXbHlaVjlmS1R0Y2JseHVYSFF2THlCU1pYUjFjbTRnZEdobElHVjRjRzl5ZEhNZ2IyWWdkR2hsSUcxdlpIVnNaVnh1WEhSeVpYUjFjbTRnYlc5a2RXeGxMbVY0Y0c5eWRITTdYRzU5WEc1Y2JpSXNJaTh2SUdSbFptbHVaU0JuWlhSMFpYSWdablZ1WTNScGIyNXpJR1p2Y2lCb1lYSnRiMjU1SUdWNGNHOXlkSE5jYmw5ZmQyVmljR0ZqYTE5eVpYRjFhWEpsWDE4dVpDQTlJQ2hsZUhCdmNuUnpMQ0JrWldacGJtbDBhVzl1S1NBOVBpQjdYRzVjZEdadmNpaDJZWElnYTJWNUlHbHVJR1JsWm1sdWFYUnBiMjRwSUh0Y2JseDBYSFJwWmloZlgzZGxZbkJoWTJ0ZmNtVnhkV2x5WlY5ZkxtOG9aR1ZtYVc1cGRHbHZiaXdnYTJWNUtTQW1KaUFoWDE5M1pXSndZV05yWDNKbGNYVnBjbVZmWHk1dktHVjRjRzl5ZEhNc0lHdGxlU2twSUh0Y2JseDBYSFJjZEU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaGxlSEJ2Y25SekxDQnJaWGtzSUhzZ1pXNTFiV1Z5WVdKc1pUb2dkSEoxWlN3Z1oyVjBPaUJrWldacGJtbDBhVzl1VzJ0bGVWMGdmU2s3WEc1Y2RGeDBmVnh1WEhSOVhHNTlPeUlzSWw5ZmQyVmljR0ZqYTE5eVpYRjFhWEpsWDE4dVp5QTlJQ2htZFc1amRHbHZiaWdwSUh0Y2JseDBhV1lnS0hSNWNHVnZaaUJuYkc5aVlXeFVhR2x6SUQwOVBTQW5iMkpxWldOMEp5a2djbVYwZFhKdUlHZHNiMkpoYkZSb2FYTTdYRzVjZEhSeWVTQjdYRzVjZEZ4MGNtVjBkWEp1SUhSb2FYTWdmSHdnYm1WM0lFWjFibU4wYVc5dUtDZHlaWFIxY200Z2RHaHBjeWNwS0NrN1hHNWNkSDBnWTJGMFkyZ2dLR1VwSUh0Y2JseDBYSFJwWmlBb2RIbHdaVzltSUhkcGJtUnZkeUE5UFQwZ0oyOWlhbVZqZENjcElISmxkSFZ5YmlCM2FXNWtiM2M3WEc1Y2RIMWNibjBwS0NrN0lpd2lYMTkzWldKd1lXTnJYM0psY1hWcGNtVmZYeTV2SUQwZ0tHOWlhaXdnY0hKdmNDa2dQVDRnS0U5aWFtVmpkQzV3Y205MGIzUjVjR1V1YUdGelQzZHVVSEp2Y0dWeWRIa3VZMkZzYkNodlltb3NJSEJ5YjNBcEtTSXNJaTh2SUdSbFptbHVaU0JmWDJWelRXOWtkV3hsSUc5dUlHVjRjRzl5ZEhOY2JsOWZkMlZpY0dGamExOXlaWEYxYVhKbFgxOHVjaUE5SUNobGVIQnZjblJ6S1NBOVBpQjdYRzVjZEdsbUtIUjVjR1Z2WmlCVGVXMWliMndnSVQwOUlDZDFibVJsWm1sdVpXUW5JQ1ltSUZONWJXSnZiQzUwYjFOMGNtbHVaMVJoWnlrZ2UxeHVYSFJjZEU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaGxlSEJ2Y25SekxDQlRlVzFpYjJ3dWRHOVRkSEpwYm1kVVlXY3NJSHNnZG1Gc2RXVTZJQ2ROYjJSMWJHVW5JSDBwTzF4dVhIUjlYRzVjZEU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGVTaGxlSEJ2Y25SekxDQW5YMTlsYzAxdlpIVnNaU2NzSUhzZ2RtRnNkV1U2SUhSeWRXVWdmU2s3WEc1OU95SXNJbWx0Y0c5eWRDQjdYRzRnSUVwSlFsOUNRVkpTUlU0c1hHNGdJRXBKUWw5UVVrOVlXU3hjYmlBZ1NrbENYMUpCVjE5VVJWaFVMRnh1SUNCS1NVSXNYRzRnSUVwcFlpeGNiaUFnWm1GamRHOXllU3hjYmlBZ0pDeGNiaUFnYVhOS2FXSnBjMmdzWEc0Z0lHTnZibk4wY25WamRFcHBZaXhjYmlBZ2NtVnpiMngyWlVOb2FXeGtjbVZ1TEZ4dWZTQm1jbTl0SUNjdUwycHBZaTVxY3ljN1hHNWNibVY0Y0c5eWRDQmpiMjV6ZENCS2FXSnpJRDBnZTF4dUlDQktTVUpmUWtGU1VrVk9MRnh1SUNCS1NVSmZVRkpQV0Zrc1hHNGdJRXBKUWw5U1FWZGZWRVZZVkN4Y2JpQWdTa2xDTEZ4dUlDQkthV0lzWEc0Z0lHbHpTbWxpYVhOb0xGeHVJQ0JqYjI1emRISjFZM1JLYVdJc1hHNGdJSEpsYzI5c2RtVkRhR2xzWkhKbGJpeGNibjA3WEc1Y2JtbHRjRzl5ZENCN1hHNGdJRlZRUkVGVVJWOUZWa1ZPVkN4Y2JpQWdVVlZGVlVWZlZWQkVRVlJGWDAxRlZFaFBSQ3hjYmlBZ1JreFZVMGhmVlZCRVFWUkZYMDFGVkVoUFJDeGNiaUFnU1U1SlZGOU5SVlJJVDBRc1hHNGdJRk5MU1ZCZlUxUkJWRVZmVlZCRVFWUkZVeXhjYmlBZ1VFVk9SRWxPUjE5VFZFRlVSVjlWVUVSQlZFVXNYRzRnSUV4QlUxUmZVa1ZPUkVWU1gxUkpUVVVzWEc0Z0lGQlNSVlpKVDFWVFgxTlVRVlJGTEZ4dVhHNGdJRU52YlhCdmJtVnVkQ3hjYm4wZ1puSnZiU0FuTGk5amIyMXdiMjVsYm5RdWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdRMjl0Y0c5dVpXNTBjeUE5SUh0Y2JpQWdWVkJFUVZSRlgwVldSVTVVTEZ4dUlDQlJWVVZWUlY5VlVFUkJWRVZmVFVWVVNFOUVMRnh1SUNCR1RGVlRTRjlWVUVSQlZFVmZUVVZVU0U5RUxGeHVJQ0JKVGtsVVgwMUZWRWhQUkN4Y2JpQWdVMHRKVUY5VFZFRlVSVjlWVUVSQlZFVlRMRnh1SUNCUVJVNUVTVTVIWDFOVVFWUkZYMVZRUkVGVVJTeGNiaUFnVEVGVFZGOVNSVTVFUlZKZlZFbE5SU3hjYmlBZ1VGSkZWa2xQVlZOZlUxUkJWRVVzWEc1OU8xeHVYRzVwYlhCdmNuUWdlMXh1SUNCR1QxSkRSVjlTUlVaTVQxY3NYRzRnSUZKdmIzUk9iMlJsTEZ4dUlDQlNaVzVrWlhKbGNpeGNibjBnWm5KdmJTQW5MaTl5Wlc1a1pYSmxjbk12YVc1a1pYZ3Vhbk1uTzF4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnVW1WdVpHVnlaWEp6SUQwZ2UxeHVJQ0JEVDA1VVJWaFVYMGxFT2lCU2IyOTBUbTlrWlM1RFQwNVVSVmhVWDBsRUxGeHVJQ0JHVDFKRFJWOVNSVVpNVDFjc1hHNGdJRkp2YjNST2IyUmxMRnh1SUNCU1pXNWtaWEpsY2l4Y2JuMDdYRzVjYm1WNGNHOXlkQ0FxSUdGeklGVjBhV3h6SUdaeWIyMGdKeTR2ZFhScGJITXVhbk1uTzF4dVpYaHdiM0owSUhzZ1pHVm1ZWFZzZENCaGN5QmtaV0ZrWW1WbFppQjlJR1p5YjIwZ0oyUmxZV1JpWldWbUp6dGNibHh1Wlhod2IzSjBJSHRjYmlBZ1ptRmpkRzl5ZVN4Y2JpQWdKQ3hjYmlBZ1EyOXRjRzl1Wlc1MExGeHVmVHRjYmlKZExDSnVZVzFsY3lJNlcxMHNJbk52ZFhKalpWSnZiM1FpT2lJaWZRPT0iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImV4cG9ydCB7IERPTVJlbmRlcmVyIH0gZnJvbSAnLi9kb20tcmVuZGVyZXIuanMnO1xuZXhwb3J0ICogZnJvbSAnamlicyc7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=