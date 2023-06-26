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
  JIB_CHILD_INDEX_PROP,
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
      'internalRefTracker': {
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
      this.component.children = newChildren.slice();
      this.previousState = Object.assign({}, component.state);

      this.firePropUpdates(component.props, newProps);
      component.props = this.mergeComponentProps(component.props, newProps);

      return true;
    }

    let previousState = this.previousState || {};
    let propsDiffer   = this.propsDiffer(component.props, newProps, [ 'ref', 'key', JIB_CHILD_INDEX_PROP ], true);
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
  async _render(forceRender) {
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

      let component           = this.component;
      let internalRefTracker  = this.internalRefTracker;
      if (props && typeof props.ref === 'function' && internalRefTracker !== component) {
        this.internalRefTracker = component;
        props.ref.call(component, component, internalRefTracker);
      }
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
      if (forceRender !== true && this.component && !this.shouldRender(props, children))
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
            this.render(true);
          }
        });
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

        try {
          renderResult = await renderResult;
          renderCompleted = true;

          if (loadingTimer) {
            clearTimeout(loadingTimer);
            loadingTimer = null;
          }

          await finalizeRender(renderResult, renderFrame);
        } catch (error) {
          await handleRenderError(error);
        }
      } else {
        await finalizeRender(renderResult, renderFrame);
      }
    } catch (error) {
      await handleRenderError(error);
    }
  }

  async destroyFromDOM(_context, _node) {
    if (!this.parentNode)
      return;

    let context = _context;
    let node = _node;
    if (node === this) {
      context = this.parentNode.context;
      node = this.parentNode;
    }

    return await this.parentNode.destroyFromDOM(context, node);
  }

  async syncDOM(_context, _node) {
    if (!this.parentNode)
      return;

    let context = _context;
    let node = _node;
    if (node === this) {
      context = this.parentNode.context;
      node = this.parentNode;
    }

    return await this.parentNode.syncDOM(context, node);
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
    super(options);

    Object.defineProperties(this, {
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
    if (this.destroying)
      return;

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

    await this.attachChildren(context, node, false);

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

    await this.attachChildren(context, node, true);

    return result;
  }

  async syncNode(context, node) {
    if (!node)
      return false;

    let nativeElement = (node && node.nativeElement);
    if (!nativeElement) {
      nativeElement = await this.constructNativeElementFromNode(context, node);
      node.nativeElement = nativeElement;

      let result = await this.addNode(context, node);

      await this.updateNode(context, node);

      if (node.jib && node.jib.props && typeof node.jib.props.ref === 'function')
        node.jib.props.ref.call(node, nativeElement, null);

      return result;
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
  JIB_CHILD_INDEX_PROP,
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

        if (this.destroying || renderFrame < this.renderFrame) {
          loopStopped = true;
          return;
        }

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

        props[JIB_CHILD_INDEX_PROP] = index;
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
    let addedChildren = new Map();
    for (let renderResult of renderResults) {
      let { cacheKey, node } = renderResult;

      addedChildren.set(cacheKey, node);
    }

    // Remove nodes no longer in the fragment
    let childrenToDestroy = [];
    for (let [ cacheKey, childNode ] of this.getChildren()) {
      let hasChild = addedChildren.has(cacheKey);
      if (!hasChild) {
        // This node was destroyed
        childrenToDestroy.push(childNode);
        this.removeChild(childNode);
      }
    }

    // Clear children and readd them
    // to keep the render order intact
    this.clearChildren();

    for (let [ cacheKey, childNode ] of addedChildren)
      this.addChild(childNode, cacheKey);

    addedChildren.clear();

    // Now that children to destroy have
    // been collected, please destroy them
    for (let i = 0, il = childrenToDestroy.length; i < il; i++) {
      let childNode = childrenToDestroy[i];
      destroyPromises.push(childNode.destroy());
    }

    if (destroyPromises.length > 0)
      await Promise.all(destroyPromises);
  }

  async destroyFromDOM(context, node) {
    // Fragments can not be destroyed from the DOM
    if (node === this)
      return;

    if (!this.parentNode)
      return;

    return await this.parentNode.destroyFromDOM(context, node);
  }

  async syncDOM(_context, _node) {
    if (!this.parentNode)
      return;

    let context = _context;
    let node = _node;
    if (node === this) {
      context = this.parentNode.context;
      node = this.parentNode;
    }

    return await this.parentNode.syncDOM(context, node);
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
    if (this.destroying)
      return;

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

  static HAS_CONTEXT = false;
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
/* harmony export */   "Term": () => (/* binding */ __webpack_exports__Term),
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
/* harmony export */   "Term": () => (/* binding */ Term),
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

  extractChildren(_patterns, children, _options) {
    let options   = _options || {};
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

          if (jibType !== pattern)
            continue;

          if (extracted[pattern] && options.multiple) {
            if (!Array.isArray(extracted[pattern]))
              extracted[pattern] = [ extracted[pattern] ];

            extracted[pattern].push(jib);
          } else {
            extracted[pattern] = jib;
          }

          return true;
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

          if (!result)
            continue;

          if (extracted[pattern] && options.multiple) {
            if (!Array.isArray(extracted[pattern]))
              extracted[pattern] = [ extracted[pattern] ];

            extracted[pattern].push(jib);
          } else {
            extracted[pattern] = jib;
          }

          return true;
        }
      }

      return false;
    };

    extracted.remainingChildren = children.filter((jib) => !isMatch(jib));
    return extracted;
  }

  mapChildren(patterns, _children) {
    let children = (!Array.isArray(_children)) ? [ _children ] : _children;

    return children.map((jib) => {
      if (!jib)
        return jib;

      let jibType = jib.Type;
      if (!_utils_js__WEBPACK_IMPORTED_MODULE_2__.instanceOf(jibType, 'string'))
        return jib;

      jibType = jibType.toLowerCase();

      let keys = Object.keys(patterns);
      for (let i = 0, il = keys.length; i < il; i++) {
        let key = keys[i];
        if (key.toLowerCase() !== jibType)
          continue;

        let method = patterns[key];
        if (!method)
          continue;

        return method.call(this, jib, i, children);
      }

      return jib;
    });
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
    if (!promise || !promise.isPending()) {
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
    if (!this.debounceTimers)
      return;

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

  toTerm(term) {
    if ((0,_jib_js__WEBPACK_IMPORTED_MODULE_3__.isJibish)(term)) {
      let jib = (0,_jib_js__WEBPACK_IMPORTED_MODULE_3__.constructJib)(term);

      if (jib.Type === Term)
        return term;

      if (jib.Type && jib.Type[TERM_COMPONENT_TYPE_CHECK])
        return term;

      return (0,_jib_js__WEBPACK_IMPORTED_MODULE_3__.$)(Term, jib.props)(...jib.children);
    } else if (typeof term === 'string') {
      return (0,_jib_js__WEBPACK_IMPORTED_MODULE_3__.$)(Term)(term);
    }

    return term;
  }
}

const TERM_COMPONENT_TYPE_CHECK = Symbol.for('@jibs/isTerm');

class Term extends Component {
  resolveTerm(args) {
    let termResolver = this.context._termResolver;
    if (typeof termResolver === 'function')
      return termResolver.call(this, args);

    let children = (args.children || []);
    return children[children.length - 1] || '';
  }

  render(children) {
    let term = this.resolveTerm({ children, props: this.props });
    return (0,_jib_js__WEBPACK_IMPORTED_MODULE_3__.$)('SPAN', this.props)(term);
  }
}

Term[TERM_COMPONENT_TYPE_CHECK] = true;




/***/ }),

/***/ "./lib/events.js":
/*!***********************!*\
  !*** ./lib/events.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_21188__) => {

__nested_webpack_require_21188__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_21188__.d(__webpack_exports__, {
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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_23949__) => {

__nested_webpack_require_23949__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_23949__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* binding */ $),
/* harmony export */   "JIB": () => (/* binding */ JIB),
/* harmony export */   "JIB_BARREN": () => (/* binding */ JIB_BARREN),
/* harmony export */   "JIB_CHILD_INDEX_PROP": () => (/* binding */ JIB_CHILD_INDEX_PROP),
/* harmony export */   "JIB_PROXY": () => (/* binding */ JIB_PROXY),
/* harmony export */   "JIB_RAW_TEXT": () => (/* binding */ JIB_RAW_TEXT),
/* harmony export */   "Jib": () => (/* binding */ Jib),
/* harmony export */   "constructJib": () => (/* binding */ constructJib),
/* harmony export */   "factory": () => (/* binding */ factory),
/* harmony export */   "isJibish": () => (/* binding */ isJibish),
/* harmony export */   "resolveChildren": () => (/* binding */ resolveChildren)
/* harmony export */ });
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_23949__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_23949__(/*! ./utils.js */ "./lib/utils.js");



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
        value:        { [JIB_CHILD_INDEX_PROP]: 0, ...defaultProps, ...(props || {}) },
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

const JIB_BARREN           = Symbol.for('@jibs.barren');
const JIB_PROXY            = Symbol.for('@jibs.proxy');
const JIB_RAW_TEXT         = Symbol.for('@jibs.rawText');
const JIB                  = Symbol.for('@jibs.jib');
const JIB_CHILD_INDEX_PROP = Symbol.for('@jibs.childIndexProp');

function factory(JibClass) {
  function $(_type, props = {}) {
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
  }

  Object.defineProperties($, {
    'remap': {
      writable:     false,
      enumerable:   false,
      configurable: false,
      value:        (_jib, callback) => {
        let jib = _jib;
        if (jib == null || Object.is(jib, Infinity) || Object.is(jib, NaN))
          return jib;

        if (isJibish(jib))
          jib = constructJib(jib);

        const finalizeMap = (_mappedJib) => {
          let mappedJib = _mappedJib;

          if (isJibish(mappedJib))
            mappedJib = constructJib(mappedJib);
          else
            return mappedJib;

          return $(mappedJib.Type, mappedJib.props)(...(mappedJib.children || []));
        };

        let mappedJib = callback(jib);
        if (_utils_js__WEBPACK_IMPORTED_MODULE_1__.instanceOf(mappedJib, 'promise'))
          return mappedJib.then(finalizeMap);

        return finalizeMap(mappedJib);
      },
    },
  });

  return $;
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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_30259__) => {

__nested_webpack_require_30259__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_30259__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID),
/* harmony export */   "FORCE_REFLOW": () => (/* binding */ FORCE_REFLOW),
/* harmony export */   "Renderer": () => (/* reexport safe */ _renderer_js__WEBPACK_IMPORTED_MODULE_1__.Renderer),
/* harmony export */   "RootNode": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode)
/* harmony export */ });
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_30259__(/*! ./root-node.js */ "./lib/renderers/root-node.js");
/* harmony import */ var _renderer_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_30259__(/*! ./renderer.js */ "./lib/renderers/renderer.js");


const FORCE_REFLOW = Symbol.for('@jibsForceReflow');




/***/ }),

/***/ "./lib/renderers/renderer.js":
/*!***********************************!*\
  !*** ./lib/renderers/renderer.js ***!
  \***********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_31428__) => {

__nested_webpack_require_31428__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_31428__.d(__webpack_exports__, {
/* harmony export */   "Renderer": () => (/* binding */ Renderer)
/* harmony export */ });
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_31428__(/*! ./root-node.js */ "./lib/renderers/root-node.js");


const INITIAL_CONTEXT_ID = 1n;
let _contextIDCounter = INITIAL_CONTEXT_ID;

class Renderer extends _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode {
  static RootNode = _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode;

  constructor(options) {
    super(null, null, null);

    Object.defineProperties(this, {
      'options': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        options || {},
      },
    });

    this.renderer = this;

    if (typeof options.termResolver === 'function')
      this.context._termResolver = options.termResolver;
  }

  getOptions() {
    return this.options;
  }

  resolveTerm(args) {
    let { termResolver } = this.getOptions();
    if (typeof termResolver === 'function')
      return termResolver.call(this, args);

    let children = (args.children || []);
    return children[children.length - 1] || '';
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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_34158__) => {

__nested_webpack_require_34158__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_34158__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* binding */ CONTEXT_ID),
/* harmony export */   "RootNode": () => (/* binding */ RootNode)
/* harmony export */ });
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_34158__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_34158__(/*! ../utils.js */ "./lib/utils.js");
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_34158__(/*! ../jib.js */ "./lib/jib.js");




const CONTEXT_ID = Symbol.for('@jibs/node/contextID');

class RootNode {
  static CONTEXT_ID = CONTEXT_ID;

  constructor(renderer, parentNode, _context, jib) {
    let context = null;

    if (this.constructor.HAS_CONTEXT !== false && (renderer || this.createContext)) {
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

  isJib(value) {
    return (0,_jib_js__WEBPACK_IMPORTED_MODULE_2__.isJibish)(value);
  }

  constructJib(value) {
    return (0,_jib_js__WEBPACK_IMPORTED_MODULE_2__.constructJib)(value);
  }

  getCacheKey() {
    let { Type, props } = (this.jib || {});
    let cacheKey = deadbeef__WEBPACK_IMPORTED_MODULE_0__(Type, props.key);

    return cacheKey;
  }

  updateJib(newJib) {
    this.jib = newJib;
  }

  clearChildren() {
    this.childNodes.clear();
  }

  removeChild(childNode) {
    let cacheKey = childNode.getCacheKey();
    this.childNodes.delete(cacheKey);
  }

  addChild(childNode, _cacheKey) {
    let cacheKey = (_cacheKey) ? _cacheKey : childNode.getCacheKey();
    this.childNodes.set(cacheKey, childNode);
  }

  getChild(cacheKey) {
    return this.childNodes.get(cacheKey);
  }

  getChildren() {
    return this.childNodes;
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

  async render(...args) {
    if (this.destroying)
      return;

    this.renderFrame++;
    let renderFrame = this.renderFrame;

    if (typeof this._render === 'function') {
      this.renderPromise = this._render(...args)
        .then(async (result) => {
          if (renderFrame >= this.renderFrame)
            await this.syncDOM(this.context, this);

          this.renderPromise = null;
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

  async destroyFromDOM(context, node) {
    if (!this.renderer)
      return;

    return await this.renderer.destroyFromDOM(context, node);
  }

  async syncDOM(context, node) {
    if (!this.renderer)
      return;

    return await this.renderer.syncDOM(context, node);
  }
}


/***/ }),

/***/ "./lib/utils.js":
/*!**********************!*\
  !*** ./lib/utils.js ***!
  \**********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_40499__) => {

__nested_webpack_require_40499__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_40499__.d(__webpack_exports__, {
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
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_40499__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
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

function childrenDiffer(children1, children2) {
  if (children1 === children2)
    return false;

  let result1 = (!Array.isArray(children1)) ? deadbeef__WEBPACK_IMPORTED_MODULE_0__(children1) : deadbeef__WEBPACK_IMPORTED_MODULE_0__(...children1);
  let result2 = (!Array.isArray(children2)) ? deadbeef__WEBPACK_IMPORTED_MODULE_0__(children2) : deadbeef__WEBPACK_IMPORTED_MODULE_0__(...children2);

  return (result1 !== result2);
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
/******/ function __nested_webpack_require_53284__(moduleId) {
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
/******/ 	__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nested_webpack_require_53284__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nested_webpack_require_53284__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nested_webpack_require_53284__.o(definition, key) && !__nested_webpack_require_53284__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/global */
/******/ (() => {
/******/ 	__nested_webpack_require_53284__.g = (function() {
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
/******/ 	__nested_webpack_require_53284__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__nested_webpack_require_53284__.r = (exports) => {
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
__nested_webpack_require_53284__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_53284__.d(__webpack_exports__, {
/* harmony export */   "$": () => (/* reexport safe */ _jib_js__WEBPACK_IMPORTED_MODULE_0__.$),
/* harmony export */   "Component": () => (/* reexport safe */ _component_js__WEBPACK_IMPORTED_MODULE_1__.Component),
/* harmony export */   "Components": () => (/* binding */ Components),
/* harmony export */   "Jibs": () => (/* binding */ Jibs),
/* harmony export */   "Renderers": () => (/* binding */ Renderers),
/* harmony export */   "Term": () => (/* reexport safe */ _component_js__WEBPACK_IMPORTED_MODULE_1__.Term),
/* harmony export */   "Utils": () => (/* reexport module object */ _utils_js__WEBPACK_IMPORTED_MODULE_3__),
/* harmony export */   "deadbeef": () => (/* reexport default export from named module */ deadbeef__WEBPACK_IMPORTED_MODULE_4__),
/* harmony export */   "factory": () => (/* reexport safe */ _jib_js__WEBPACK_IMPORTED_MODULE_0__.factory)
/* harmony export */ });
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_53284__(/*! ./jib.js */ "./lib/jib.js");
/* harmony import */ var _component_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_53284__(/*! ./component.js */ "./lib/component.js");
/* harmony import */ var _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_53284__(/*! ./renderers/index.js */ "./lib/renderers/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __nested_webpack_require_53284__(/*! ./utils.js */ "./lib/utils.js");
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_4__ = __nested_webpack_require_53284__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");


const Jibs = {
  JIB_BARREN: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_BARREN,
  JIB_PROXY: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_PROXY,
  JIB_RAW_TEXT: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_RAW_TEXT,
  JIB: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB,
  JIB_CHILD_INDEX_PROP: _jib_js__WEBPACK_IMPORTED_MODULE_0__.JIB_CHILD_INDEX_PROP,
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
var __webpack_exports__Term = __webpack_exports__.Term;
var __webpack_exports__Utils = __webpack_exports__.Utils;
var __webpack_exports__deadbeef = __webpack_exports__.deadbeef;
var __webpack_exports__factory = __webpack_exports__.factory;


//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TTtBQUNOO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2hQQTtBQUNnQzs7QUFFaEM7O0FBRUE7QUFDQSwwR0FBMEcsU0FBSTs7QUFFOUc7O0FBRU87QUFDUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSwwQ0FBMEMsU0FBUztBQUNuRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxxQ0FBcUMsUUFBUTtBQUM3QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNB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LGtCQUFrQjtBQUNsQixnQkFBZ0I7QUFDaEI7O0FBTThCOztBQUV2QjtBQUNQLGNBQWMsb0VBQW1CO0FBQ2pDLGNBQWM7QUFDZCxVQUFVO0FBQ1YsVUFBVTtBQUNWOztBQUVvQztBQUNXOztBQU83QyIsInNvdXJjZXMiOlsid2VicGFjazovL2ppYnMvLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvY29tcG9uZW50LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvZXZlbnRzLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvamliLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzIiwid2VicGFjazovL2ppYnMvLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3V0aWxzLmpzIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vamlicy93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vamlicy93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9qaWJzL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vamlicy8uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAyMiBXeWF0dCBHcmVlbndheVxuXG4ndXNlIHN0cmljdCc7XG5cbmNvbnN0IHRoaXNHbG9iYWwgPSAoKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IGdsb2JhbCkgfHwgdGhpcztcbmNvbnN0IERFQURCRUVGX1JFRl9NQVBfS0VZID0gU3ltYm9sLmZvcignQEBkZWFkYmVlZlJlZk1hcCcpO1xuY29uc3QgVU5JUVVFX0lEX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZVbmlxdWVJRCcpO1xuY29uc3QgcmVmTWFwID0gKHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKSA/IHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldIDogbmV3IFdlYWtNYXAoKTtcbmNvbnN0IGlkSGVscGVycyA9IFtdO1xuXG5pZiAoIXRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKVxuICB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA9IHJlZk1hcDtcblxubGV0IHV1aWRDb3VudGVyID0gMG47XG5cbmZ1bmN0aW9uIGdldEhlbHBlckZvclZhbHVlKHZhbHVlKSB7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkSGVscGVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IHsgaGVscGVyLCBnZW5lcmF0b3IgfSA9IGlkSGVscGVyc1tpXTtcbiAgICBpZiAoaGVscGVyKHZhbHVlKSlcbiAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gYW55dGhpbmdUb0lEKF9hcmcsIF9hbHJlYWR5VmlzaXRlZCkge1xuICBsZXQgYXJnID0gX2FyZztcbiAgaWYgKGFyZyBpbnN0YW5jZW9mIE51bWJlciB8fCBhcmcgaW5zdGFuY2VvZiBTdHJpbmcgfHwgYXJnIGluc3RhbmNlb2YgQm9vbGVhbilcbiAgICBhcmcgPSBhcmcudmFsdWVPZigpO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgYXJnO1xuXG4gIGlmICh0eXBlT2YgPT09ICdudW1iZXInICYmIGFyZyA9PT0gMCkge1xuICAgIGlmIChPYmplY3QuaXMoYXJnLCAtMCkpXG4gICAgICByZXR1cm4gJ251bWJlcjotMCc7XG5cbiAgICByZXR1cm4gJ251bWJlcjorMCc7XG4gIH1cblxuICBpZiAodHlwZU9mID09PSAnc3ltYm9sJylcbiAgICByZXR1cm4gYHN5bWJvbDoke2FyZy50b1N0cmluZygpfWA7XG5cbiAgaWYgKGFyZyA9PSBudWxsIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicgfHwgdHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdiaWdpbnQnKSB7XG4gICAgaWYgKHR5cGVPZiA9PT0gJ251bWJlcicpXG4gICAgICByZXR1cm4gKGFyZyA8IDApID8gYG51bWJlcjoke2FyZ31gIDogYG51bWJlcjorJHthcmd9YDtcblxuICAgIGlmICh0eXBlT2YgPT09ICdiaWdpbnQnICYmIGFyZyA9PT0gMG4pXG4gICAgICByZXR1cm4gJ2JpZ2ludDorMCc7XG5cbiAgICByZXR1cm4gYCR7dHlwZU9mfToke2FyZ31gO1xuICB9XG5cbiAgbGV0IGlkSGVscGVyID0gKGlkSGVscGVycy5sZW5ndGggPiAwICYmIGdldEhlbHBlckZvclZhbHVlKGFyZykpO1xuICBpZiAoaWRIZWxwZXIpXG4gICAgcmV0dXJuIGFueXRoaW5nVG9JRChpZEhlbHBlcihhcmcpKTtcblxuICBpZiAoVU5JUVVFX0lEX1NZTUJPTCBpbiBhcmcgJiYgdHlwZW9mIGFyZ1tVTklRVUVfSURfU1lNQk9MXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uXG4gICAgaWYgKCFfYWxyZWFkeVZpc2l0ZWQgfHwgIV9hbHJlYWR5VmlzaXRlZC5oYXMoYXJnKSkge1xuICAgICAgbGV0IGFscmVhZHlWaXNpdGVkID0gX2FscmVhZHlWaXNpdGVkIHx8IG5ldyBTZXQoKTtcbiAgICAgIGFscmVhZHlWaXNpdGVkLmFkZChhcmcpO1xuICAgICAgcmV0dXJuIGFueXRoaW5nVG9JRChhcmdbVU5JUVVFX0lEX1NZTUJPTF0oKSwgYWxyZWFkeVZpc2l0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghcmVmTWFwLmhhcyhhcmcpKSB7XG4gICAgbGV0IGtleSA9IGAke3R5cGVvZiBhcmd9OiR7Kyt1dWlkQ291bnRlcn1gO1xuICAgIHJlZk1hcC5zZXQoYXJnLCBrZXkpO1xuICAgIHJldHVybiBrZXk7XG4gIH1cblxuICByZXR1cm4gcmVmTWFwLmdldChhcmcpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZigpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGRlYWRiZWVmU29ydGVkKCkge1xuICBsZXQgcGFydHMgPSBbIGFyZ3VtZW50cy5sZW5ndGggXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgcGFydHMucHVzaChhbnl0aGluZ1RvSUQoYXJndW1lbnRzW2ldKSk7XG5cbiAgcmV0dXJuIHBhcnRzLnNvcnQoKS5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSURGb3IoaGVscGVyLCBnZW5lcmF0b3IpIHtcbiAgaWRIZWxwZXJzLnB1c2goeyBoZWxwZXIsIGdlbmVyYXRvciB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSURHZW5lcmF0b3IoaGVscGVyKSB7XG4gIGxldCBpbmRleCA9IGlkSGVscGVycy5maW5kSW5kZXgoKGl0ZW0pID0+IChpdGVtLmhlbHBlciA9PT0gaGVscGVyKSk7XG4gIGlmIChpbmRleCA8IDApXG4gICAgcmV0dXJuO1xuXG4gIGlkSGVscGVycy5zcGxpY2UoaW5kZXgsIDEpO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhkZWFkYmVlZiwge1xuICAnaWRTeW0nOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgVU5JUVVFX0lEX1NZTUJPTCxcbiAgfSxcbiAgJ3NvcnRlZCc6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICBkZWFkYmVlZlNvcnRlZCxcbiAgfSxcbiAgJ2dlbmVyYXRlSURGb3InOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZ2VuZXJhdGVJREZvcixcbiAgfSxcbiAgJ3JlbW92ZUlER2VuZXJhdG9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIHJlbW92ZUlER2VuZXJhdG9yLFxuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGVhZGJlZWY7XG4iLCIvKiBnbG9iYWwgQnVmZmVyICovXG5cbmltcG9ydCBkZWFkYmVlZiBmcm9tICdkZWFkYmVlZic7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICcuL2V2ZW50cy5qcyc7XG5pbXBvcnQgKiBhcyBVdGlscyAgICAgICBmcm9tICcuL3V0aWxzLmpzJztcbmltcG9ydCB7XG4gICQsXG4gIGlzSmliaXNoLFxuICByZXNvbHZlQ2hpbGRyZW4sXG4gIGNvbnN0cnVjdEppYixcbn0gZnJvbSAnLi9qaWIuanMnO1xuXG5leHBvcnQgY29uc3QgVVBEQVRFX0VWRU5UICAgICAgICAgICAgICA9ICdAamlicy9jb21wb25lbnQvZXZlbnQvdXBkYXRlJztcbmV4cG9ydCBjb25zdCBRVUVVRV9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3F1ZXVlVXBkYXRlJyk7XG5leHBvcnQgY29uc3QgRkxVU0hfVVBEQVRFX01FVEhPRCAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9mbHVzaFVwZGF0ZScpO1xuZXhwb3J0IGNvbnN0IElOSVRfTUVUSE9EICAgICAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvX19pbml0Jyk7XG5leHBvcnQgY29uc3QgU0tJUF9TVEFURV9VUERBVEVTICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9za2lwU3RhdGVVcGRhdGVzJyk7XG5leHBvcnQgY29uc3QgUEVORElOR19TVEFURV9VUERBVEUgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wZW5kaW5nU3RhdGVVcGRhdGUnKTtcbmV4cG9ydCBjb25zdCBMQVNUX1JFTkRFUl9USU1FICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2xhc3RSZW5kZXJUaW1lJyk7XG5leHBvcnQgY29uc3QgUFJFVklPVVNfU1RBVEUgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wcmV2aW91c1N0YXRlJyk7XG5leHBvcnQgY29uc3QgQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EUyA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wcmV2aW91c1N0YXRlJyk7XG5cbmNvbnN0IGVsZW1lbnREYXRhQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuXG5mdW5jdGlvbiBpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIE5hTikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQm9vbGVhbiB8fCB2YWx1ZSBpbnN0YW5jZW9mIE51bWJlciB8fCB2YWx1ZSBpbnN0YW5jZW9mIFN0cmluZylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgbGV0IHR5cGVPZiA9IHR5cGVvZiB2YWx1ZTtcbiAgaWYgKHR5cGVPZiA9PT0gJ3N0cmluZycgfHwgdHlwZU9mID09PSAnbnVtYmVyJyB8fCB0eXBlT2YgPT09ICdib29sZWFuJylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIEJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgQnVmZmVyLmlzQnVmZmVyKHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuICBzdGF0aWMgVVBEQVRFX0VWRU5UID0gVVBEQVRFX0VWRU5UO1xuXG4gIFtRVUVVRV9VUERBVEVfTUVUSE9EXSgpIHtcbiAgICBpZiAodGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdLnRoZW4odGhpc1tGTFVTSF9VUERBVEVfTUVUSE9EXS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIFtGTFVTSF9VUERBVEVfTUVUSE9EXSgpIHtcbiAgICAvLyBXYXMgdGhlIHN0YXRlIHVwZGF0ZSBjYW5jZWxsZWQ/XG4gICAgaWYgKCF0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZW1pdChVUERBVEVfRVZFTlQpO1xuXG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBudWxsO1xuICB9XG5cbiAgW0lOSVRfTUVUSE9EXSgpIHtcbiAgICB0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10gPSBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKF9qaWIpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgLy8gQmluZCBhbGwgY2xhc3MgbWV0aG9kcyB0byBcInRoaXNcIlxuICAgIFV0aWxzLmJpbmRNZXRob2RzLmNhbGwodGhpcywgdGhpcy5jb25zdHJ1Y3Rvci5wcm90b3R5cGUpO1xuXG4gICAgbGV0IGppYiA9IF9qaWIgfHwge307XG5cbiAgICBjb25zdCBjcmVhdGVOZXdTdGF0ZSA9ICgpID0+IHtcbiAgICAgIGxldCBsb2NhbFN0YXRlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgICAgcmV0dXJuIG5ldyBQcm94eShsb2NhbFN0YXRlLCB7XG4gICAgICAgIGdldDogKHRhcmdldCwgcHJvcE5hbWUpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAodGFyZ2V0LCBwcm9wTmFtZSwgdmFsdWUpID0+IHtcbiAgICAgICAgICBsZXQgY3VycmVudFZhbHVlID0gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgICAgICBpZiAoY3VycmVudFZhbHVlID09PSB2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgaWYgKCF0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10pXG4gICAgICAgICAgICB0aGlzW1FVRVVFX1VQREFURV9NRVRIT0RdKCk7XG5cbiAgICAgICAgICB0YXJnZXRbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgICAgICAgdGhpcy5vblN0YXRlVXBkYXRlZChwcm9wTmFtZSwgdmFsdWUsIGN1cnJlbnRWYWx1ZSk7XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsZXQgcHJvcHMgICAgICAgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIGppYi5wcm9wcyB8fCB7fSk7XG4gICAgbGV0IF9sb2NhbFN0YXRlID0gY3JlYXRlTmV3U3RhdGUoKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgIFtTS0lQX1NUQVRFX1VQREFURVNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICB9LFxuICAgICAgW1BFTkRJTkdfU1RBVEVfVVBEQVRFXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAgIH0sXG4gICAgICBbTEFTVF9SRU5ERVJfVElNRV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVXRpbHMubm93KCksXG4gICAgICB9LFxuICAgICAgW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHt9LFxuICAgICAgfSxcbiAgICAgICdpZCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuaWQsXG4gICAgICB9LFxuICAgICAgJ3Byb3BzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBwcm9wcyxcbiAgICAgIH0sXG4gICAgICAnY2hpbGRyZW4nOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5jaGlsZHJlbiB8fCBbXSxcbiAgICAgIH0sXG4gICAgICAnY29udGV4dCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmNvbnRleHQgfHwgT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICAgIH0sXG4gICAgICAnc3RhdGUnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIF9sb2NhbFN0YXRlO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICAgICAgICAgICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGlmICghaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWUgZm9yIFwidGhpcy5zdGF0ZVwiOiBcIiR7dmFsdWV9XCIuIFByb3ZpZGVkIFwic3RhdGVcIiBtdXN0IGJlIGFuIGl0ZXJhYmxlIG9iamVjdC5gKTtcblxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oX2xvY2FsU3RhdGUsIHZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICByZXNvbHZlQ2hpbGRyZW4oY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gcmVzb2x2ZUNoaWxkcmVuLmNhbGwodGhpcywgY2hpbGRyZW4pO1xuICB9XG5cbiAgaXNKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gaXNKaWJpc2godmFsdWUpO1xuICB9XG5cbiAgY29uc3RydWN0SmliKHZhbHVlKSB7XG4gICAgcmV0dXJuIGNvbnN0cnVjdEppYih2YWx1ZSk7XG4gIH1cblxuICBwdXNoUmVuZGVyKHJlbmRlclJlc3VsdCkge1xuICAgIHRoaXMuZW1pdChVUERBVEVfRVZFTlQsIHJlbmRlclJlc3VsdCk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25Qcm9wVXBkYXRlZChwcm9wTmFtZSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgY2FwdHVyZVJlZmVyZW5jZShuYW1lLCBpbnRlcmNlcHRvckNhbGxiYWNrKSB7XG4gICAgbGV0IG1ldGhvZCA9IHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU11bbmFtZV07XG4gICAgaWYgKG1ldGhvZClcbiAgICAgIHJldHVybiBtZXRob2Q7XG5cbiAgICBtZXRob2QgPSAoX3JlZiwgcHJldmlvdXNSZWYpID0+IHtcbiAgICAgIGxldCByZWYgPSBfcmVmO1xuXG4gICAgICBpZiAodHlwZW9mIGludGVyY2VwdG9yQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJlZiA9IGludGVyY2VwdG9yQ2FsbGJhY2suY2FsbCh0aGlzLCByZWYsIHByZXZpb3VzUmVmKTtcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgICBbbmFtZV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICByZWYsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhpc1tDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXSA9IG1ldGhvZDtcblxuICAgIHJldHVybiBtZXRob2Q7XG4gIH1cblxuICBmb3JjZVVwZGF0ZSgpIHtcbiAgICB0aGlzW1FVRVVFX1VQREFURV9NRVRIT0RdKCk7XG4gIH1cblxuICBnZXRTdGF0ZShwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gc3RhdGU7XG5cbiAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihwcm9wZXJ0eVBhdGgsICdvYmplY3QnKSkge1xuICAgICAgbGV0IGtleXMgICAgICAgID0gT2JqZWN0LmtleXMocHJvcGVydHlQYXRoKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhwcm9wZXJ0eVBhdGgpKTtcbiAgICAgIGxldCBmaW5hbFN0YXRlICA9IHt9O1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGxldCBbIHZhbHVlLCBsYXN0UGFydCBdID0gVXRpbHMuZmV0Y2hEZWVwUHJvcGVydHkoc3RhdGUsIGtleSwgcHJvcGVydHlQYXRoW2tleV0sIHRydWUpO1xuICAgICAgICBpZiAobGFzdFBhcnQgPT0gbnVsbClcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBmaW5hbFN0YXRlW2xhc3RQYXJ0XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmluYWxTdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFV0aWxzLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgc2V0U3RhdGUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgfVxuXG4gIHNldFN0YXRlUGFzc2l2ZSh2YWx1ZSkge1xuICAgIGlmICghaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWUgZm9yIFwidGhpcy5zZXRTdGF0ZVBhc3NpdmVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwgdmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGRlbGV0ZSB0aGlzLnN0YXRlO1xuICAgIGRlbGV0ZSB0aGlzLnByb3BzO1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRleHQ7XG4gICAgZGVsZXRlIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU107XG4gICAgdGhpcy5jbGVhckFsbERlYm91bmNlcygpO1xuICB9XG5cbiAgcmVuZGVyV2FpdGluZygpIHtcbiAgfVxuXG4gIHJlbmRlcihjaGlsZHJlbikge1xuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHVwZGF0ZWQoKSB7XG4gIH1cblxuICBjb21iaW5lV2l0aChzZXAsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZmluYWxBcmdzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3MubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGFyZyA9IGFyZ3NbaV07XG4gICAgICBpZiAoIWFyZylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGFyZywgJ3N0cmluZycpKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSBhcmcuc3BsaXQoc2VwKS5maWx0ZXIoVXRpbHMuaXNOb3RFbXB0eSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLmZpbHRlcigodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgaWYgKCFVdGlscy5pbnN0YW5jZU9mKHZhbHVlLCAnc3RyaW5nJykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICByZXR1cm4gVXRpbHMuaXNOb3RFbXB0eSh2YWx1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKFV0aWxzLmluc3RhbmNlT2YoYXJnLCAnb2JqZWN0JykpIHtcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhhcmcpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgPSBrZXlzW2ldO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IGFyZ1trZXldO1xuXG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgZmluYWxBcmdzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmluYWxBcmdzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZmluYWxBcmdzKS5qb2luKHNlcCB8fCAnJyk7XG4gIH1cblxuICBjbGFzc2VzKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5jb21iaW5lV2l0aCgnICcsIC4uLmFyZ3MpO1xuICB9XG5cbiAgZXh0cmFjdENoaWxkcmVuKF9wYXR0ZXJucywgY2hpbGRyZW4sIF9vcHRpb25zKSB7XG4gICAgbGV0IG9wdGlvbnMgICA9IF9vcHRpb25zIHx8IHt9O1xuICAgIGxldCBleHRyYWN0ZWQgPSB7fTtcbiAgICBsZXQgcGF0dGVybnMgID0gX3BhdHRlcm5zO1xuICAgIGxldCBpc0FycmF5ICAgPSBBcnJheS5pc0FycmF5KHBhdHRlcm5zKTtcblxuICAgIGNvbnN0IGlzTWF0Y2ggPSAoamliKSA9PiB7XG4gICAgICBsZXQgamliVHlwZSA9IGppYi5UeXBlO1xuICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2YoamliVHlwZSwgJ3N0cmluZycpKVxuICAgICAgICBqaWJUeXBlID0gamliVHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBwYXR0ZXJucy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1tpXTtcbiAgICAgICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihwYXR0ZXJuLCAnc3RyaW5nJykpXG4gICAgICAgICAgICBwYXR0ZXJuID0gcGF0dGVybi50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKGppYlR5cGUgIT09IHBhdHRlcm4pXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIGlmIChleHRyYWN0ZWRbcGF0dGVybl0gJiYgb3B0aW9ucy5tdWx0aXBsZSkge1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV4dHJhY3RlZFtwYXR0ZXJuXSkpXG4gICAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IFsgZXh0cmFjdGVkW3BhdHRlcm5dIF07XG5cbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXS5wdXNoKGppYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IGppYjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXR0ZXJucyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBrZXkgICAgID0ga2V5c1tpXTtcbiAgICAgICAgICBsZXQgcGF0dGVybiA9IHBhdHRlcm5zW2tleV07XG4gICAgICAgICAgbGV0IHJlc3VsdDtcblxuICAgICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKHBhdHRlcm4sIFJlZ0V4cCkpXG4gICAgICAgICAgICByZXN1bHQgPSBwYXR0ZXJuLnRlc3QoamliVHlwZSk7XG4gICAgICAgICAgZWxzZSBpZiAoVXRpbHMuaW5zdGFuY2VPZihwYXR0ZXJuLCAnc3RyaW5nJykpXG4gICAgICAgICAgICByZXN1bHQgPSAocGF0dGVybi50b0xvd2VyQ2FzZSgpID09PSBqaWJUeXBlKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXN1bHQgPSAocGF0dGVybiA9PT0gamliVHlwZSk7XG5cbiAgICAgICAgICBpZiAoIXJlc3VsdClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgaWYgKGV4dHJhY3RlZFtwYXR0ZXJuXSAmJiBvcHRpb25zLm11bHRpcGxlKSB7XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXh0cmFjdGVkW3BhdHRlcm5dKSlcbiAgICAgICAgICAgICAgZXh0cmFjdGVkW3BhdHRlcm5dID0gWyBleHRyYWN0ZWRbcGF0dGVybl0gXTtcblxuICAgICAgICAgICAgZXh0cmFjdGVkW3BhdHRlcm5dLnB1c2goamliKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXh0cmFjdGVkW3BhdHRlcm5dID0gamliO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgZXh0cmFjdGVkLnJlbWFpbmluZ0NoaWxkcmVuID0gY2hpbGRyZW4uZmlsdGVyKChqaWIpID0+ICFpc01hdGNoKGppYikpO1xuICAgIHJldHVybiBleHRyYWN0ZWQ7XG4gIH1cblxuICBtYXBDaGlsZHJlbihwYXR0ZXJucywgX2NoaWxkcmVuKSB7XG4gICAgbGV0IGNoaWxkcmVuID0gKCFBcnJheS5pc0FycmF5KF9jaGlsZHJlbikpID8gWyBfY2hpbGRyZW4gXSA6IF9jaGlsZHJlbjtcblxuICAgIHJldHVybiBjaGlsZHJlbi5tYXAoKGppYikgPT4ge1xuICAgICAgaWYgKCFqaWIpXG4gICAgICAgIHJldHVybiBqaWI7XG5cbiAgICAgIGxldCBqaWJUeXBlID0gamliLlR5cGU7XG4gICAgICBpZiAoIVV0aWxzLmluc3RhbmNlT2YoamliVHlwZSwgJ3N0cmluZycpKVxuICAgICAgICByZXR1cm4gamliO1xuXG4gICAgICBqaWJUeXBlID0gamliVHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhdHRlcm5zKTtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICBsZXQga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKGtleS50b0xvd2VyQ2FzZSgpICE9PSBqaWJUeXBlKVxuICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgIGxldCBtZXRob2QgPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICBpZiAoIW1ldGhvZClcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICByZXR1cm4gbWV0aG9kLmNhbGwodGhpcywgamliLCBpLCBjaGlsZHJlbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBqaWI7XG4gICAgfSk7XG4gIH1cblxuICBkZWJvdW5jZShmdW5jLCB0aW1lLCBfaWQpIHtcbiAgICBjb25zdCBjbGVhclBlbmRpbmdUaW1lb3V0ID0gKCkgPT4ge1xuICAgICAgaWYgKHBlbmRpbmdUaW1lciAmJiBwZW5kaW5nVGltZXIudGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVyLnRpbWVvdXQpO1xuICAgICAgICBwZW5kaW5nVGltZXIudGltZW91dCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBpZCA9ICghX2lkKSA/ICgnJyArIGZ1bmMpIDogX2lkO1xuICAgIGlmICghdGhpcy5kZWJvdW5jZVRpbWVycykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdkZWJvdW5jZVRpbWVycycsIHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF07XG4gICAgaWYgKCFwZW5kaW5nVGltZXIpXG4gICAgICBwZW5kaW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzW2lkXSA9IHt9O1xuXG4gICAgcGVuZGluZ1RpbWVyLmZ1bmMgPSBmdW5jO1xuICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcblxuICAgIHZhciBwcm9taXNlID0gcGVuZGluZ1RpbWVyLnByb21pc2U7XG4gICAgaWYgKCFwcm9taXNlIHx8ICFwcm9taXNlLmlzUGVuZGluZygpKSB7XG4gICAgICBsZXQgc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgbGV0IHJlc29sdmU7XG5cbiAgICAgIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSkgPT4ge1xuICAgICAgICByZXNvbHZlID0gX3Jlc29sdmU7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5yZXNvbHZlID0gKCkgPT4ge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAncGVuZGluZycpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHN0YXR1cyA9ICdmdWxmaWxsZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lci5mdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdmFyIHJldCA9IHBlbmRpbmdUaW1lci5mdW5jLmNhbGwodGhpcyk7XG4gICAgICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHJldCAmJiB0eXBlb2YgcmV0LnRoZW4gPT09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgcmV0LnRoZW4oKHZhbHVlKSA9PiByZXNvbHZlKHZhbHVlKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb2x2ZShyZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgIHN0YXR1cyA9ICdyZWplY3RlZCc7XG4gICAgICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSBudWxsO1xuXG4gICAgICAgIHByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5pc1BlbmRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiAoc3RhdHVzID09PSAncGVuZGluZycpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgIHBlbmRpbmdUaW1lci50aW1lb3V0ID0gc2V0VGltZW91dChwcm9taXNlLnJlc29sdmUsICh0aW1lID09IG51bGwpID8gMjUwIDogdGltZSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGNsZWFyRGVib3VuY2UoaWQpIHtcbiAgICBpZiAoIXRoaXMuZGVib3VuY2VUaW1lcnMpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF07XG4gICAgaWYgKHBlbmRpbmdUaW1lciA9PSBudWxsKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKHBlbmRpbmdUaW1lci50aW1lb3V0KVxuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lci50aW1lb3V0KTtcblxuICAgIGlmIChwZW5kaW5nVGltZXIucHJvbWlzZSlcbiAgICAgIHBlbmRpbmdUaW1lci5wcm9taXNlLmNhbmNlbCgpO1xuICB9XG5cbiAgY2xlYXJBbGxEZWJvdW5jZXMoKSB7XG4gICAgbGV0IGRlYm91bmNlVGltZXJzICA9IHRoaXMuZGVib3VuY2VUaW1lcnMgfHwge307XG4gICAgbGV0IGlkcyAgICAgICAgICAgICA9IE9iamVjdC5rZXlzKGRlYm91bmNlVGltZXJzKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkcy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgICAgdGhpcy5jbGVhckRlYm91bmNlKGlkc1tpXSk7XG4gIH1cblxuICBnZXRFbGVtZW50RGF0YShlbGVtZW50KSB7XG4gICAgbGV0IGRhdGEgPSBlbGVtZW50RGF0YUNhY2hlLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGRhdGEgPSB7fTtcbiAgICAgIGVsZW1lbnREYXRhQ2FjaGUuc2V0KGVsZW1lbnQsIGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgbWVtb2l6ZShmdW5jKSB7XG4gICAgbGV0IGNhY2hlSUQ7XG4gICAgbGV0IGNhY2hlZFJlc3VsdDtcblxuICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICBsZXQgbmV3Q2FjaGVJRCA9IGRlYWRiZWVmKC4uLmFyZ3MpO1xuICAgICAgaWYgKG5ld0NhY2hlSUQgIT09IGNhY2hlSUQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cbiAgICAgICAgY2FjaGVJRCA9IG5ld0NhY2hlSUQ7XG4gICAgICAgIGNhY2hlZFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZFJlc3VsdDtcbiAgICB9O1xuICB9XG5cbiAgdG9UZXJtKHRlcm0pIHtcbiAgICBpZiAoaXNKaWJpc2godGVybSkpIHtcbiAgICAgIGxldCBqaWIgPSBjb25zdHJ1Y3RKaWIodGVybSk7XG5cbiAgICAgIGlmIChqaWIuVHlwZSA9PT0gVGVybSlcbiAgICAgICAgcmV0dXJuIHRlcm07XG5cbiAgICAgIGlmIChqaWIuVHlwZSAmJiBqaWIuVHlwZVtURVJNX0NPTVBPTkVOVF9UWVBFX0NIRUNLXSlcbiAgICAgICAgcmV0dXJuIHRlcm07XG5cbiAgICAgIHJldHVybiAkKFRlcm0sIGppYi5wcm9wcykoLi4uamliLmNoaWxkcmVuKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXJtID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuICQoVGVybSkodGVybSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRlcm07XG4gIH1cbn1cblxuY29uc3QgVEVSTV9DT01QT05FTlRfVFlQRV9DSEVDSyA9IFN5bWJvbC5mb3IoJ0BqaWJzL2lzVGVybScpO1xuXG5jbGFzcyBUZXJtIGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgcmVzb2x2ZVRlcm0oYXJncykge1xuICAgIGxldCB0ZXJtUmVzb2x2ZXIgPSB0aGlzLmNvbnRleHQuX3Rlcm1SZXNvbHZlcjtcbiAgICBpZiAodHlwZW9mIHRlcm1SZXNvbHZlciA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiB0ZXJtUmVzb2x2ZXIuY2FsbCh0aGlzLCBhcmdzKTtcblxuICAgIGxldCBjaGlsZHJlbiA9IChhcmdzLmNoaWxkcmVuIHx8IFtdKTtcbiAgICByZXR1cm4gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV0gfHwgJyc7XG4gIH1cblxuICByZW5kZXIoY2hpbGRyZW4pIHtcbiAgICBsZXQgdGVybSA9IHRoaXMucmVzb2x2ZVRlcm0oeyBjaGlsZHJlbiwgcHJvcHM6IHRoaXMucHJvcHMgfSk7XG4gICAgcmV0dXJuICQoJ1NQQU4nLCB0aGlzLnByb3BzKSh0ZXJtKTtcbiAgfVxufVxuXG5UZXJtW1RFUk1fQ09NUE9ORU5UX1RZUEVfQ0hFQ0tdID0gdHJ1ZTtcblxuZXhwb3J0IHtcbiAgVGVybSxcbn07XG4iLCJjb25zdCBFVkVOVF9MSVNURU5FUlMgPSBTeW1ib2wuZm9yKCdAamlicy9ldmVudHMvbGlzdGVuZXJzJyk7XG5cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICBbRVZFTlRfTElTVEVORVJTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG5ldyBNYXAoKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V2ZW50IGxpc3RlbmVyIG11c3QgYmUgYSBtZXRob2QnKTtcblxuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuXG4gICAgaWYgKCFzY29wZSkge1xuICAgICAgc2NvcGUgPSBbXTtcbiAgICAgIGV2ZW50TWFwLnNldChldmVudE5hbWUsIHNjb3BlKTtcbiAgICB9XG5cbiAgICBzY29wZS5wdXNoKGxpc3RlbmVyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFdmVudCBsaXN0ZW5lciBtdXN0IGJlIGEgbWV0aG9kJyk7XG5cbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBsZXQgaW5kZXggPSBzY29wZS5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaW5kZXggPj0gMClcbiAgICAgIHNjb3BlLnNwbGljZShpbmRleCwgMSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUFsbExpc3RlbmVycyhldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGlmICghZXZlbnRNYXAuaGFzKGV2ZW50TmFtZSkpXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGV2ZW50TWFwLnNldChldmVudE5hbWUsIFtdKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZW1pdChldmVudE5hbWUsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlIHx8IHNjb3BlLmxlbmd0aCA9PT0gMClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHNjb3BlLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBldmVudENhbGxiYWNrID0gc2NvcGVbaV07XG4gICAgICBldmVudENhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgb25jZShldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgbGV0IGZ1bmMgPSAoLi4uYXJncykgPT4ge1xuICAgICAgdGhpcy5vZmYoZXZlbnROYW1lLCBmdW5jKTtcbiAgICAgIHJldHVybiBsaXN0ZW5lciguLi5hcmdzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXMub24oZXZlbnROYW1lLCBmdW5jKTtcbiAgfVxuXG4gIG9uKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIG9mZihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gIH1cblxuICBldmVudE5hbWVzKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXNbRVZFTlRfTElTVEVORVJTXS5rZXlzKCkpO1xuICB9XG5cbiAgbGlzdGVuZXJDb3VudChldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIDA7XG5cbiAgICByZXR1cm4gc2NvcGUubGVuZ3RoO1xuICB9XG5cbiAgbGlzdGVuZXJzKGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gW107XG5cbiAgICByZXR1cm4gc2NvcGUuc2xpY2UoKTtcbiAgfVxufVxuIiwiaW1wb3J0IGRlYWRiZWVmIGZyb20gJ2RlYWRiZWVmJztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vdXRpbHMuanMnO1xuXG5leHBvcnQgY2xhc3MgSmliIHtcbiAgY29uc3RydWN0b3IoVHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgbGV0IGRlZmF1bHRQcm9wcyA9IChUeXBlICYmIFR5cGUucHJvcHMpID8gVHlwZS5wcm9wcyA6IHt9O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ1R5cGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVHlwZSxcbiAgICAgIH0sXG4gICAgICAncHJvcHMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgeyBbSklCX0NISUxEX0lOREVYX1BST1BdOiAwLCAuLi5kZWZhdWx0UHJvcHMsIC4uLihwcm9wcyB8fCB7fSkgfSxcbiAgICAgIH0sXG4gICAgICAnY2hpbGRyZW4nOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVXRpbHMuZmxhdHRlbkFycmF5KGNoaWxkcmVuKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IEpJQl9CQVJSRU4gICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMuYmFycmVuJyk7XG5leHBvcnQgY29uc3QgSklCX1BST1hZICAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy5wcm94eScpO1xuZXhwb3J0IGNvbnN0IEpJQl9SQVdfVEVYVCAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMucmF3VGV4dCcpO1xuZXhwb3J0IGNvbnN0IEpJQiAgICAgICAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMuamliJyk7XG5leHBvcnQgY29uc3QgSklCX0NISUxEX0lOREVYX1BST1AgPSBTeW1ib2wuZm9yKCdAamlicy5jaGlsZEluZGV4UHJvcCcpO1xuXG5leHBvcnQgZnVuY3Rpb24gZmFjdG9yeShKaWJDbGFzcykge1xuICBmdW5jdGlvbiAkKF90eXBlLCBwcm9wcyA9IHt9KSB7XG4gICAgaWYgKGlzSmliaXNoKF90eXBlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1JlY2VpdmVkIGEgamliIGJ1dCBleHBlY3RlZCBhIGNvbXBvbmVudC4nKTtcblxuICAgIGxldCBUeXBlID0gKF90eXBlID09IG51bGwpID8gSklCX1BST1hZIDogX3R5cGU7XG5cbiAgICBmdW5jdGlvbiBiYXJyZW4oLi4uX2NoaWxkcmVuKSB7XG4gICAgICBsZXQgY2hpbGRyZW4gPSBfY2hpbGRyZW47XG5cbiAgICAgIGZ1bmN0aW9uIGppYigpIHtcbiAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2YoVHlwZSwgJ3Byb21pc2UnKSB8fCBjaGlsZHJlbi5zb21lKChjaGlsZCkgPT4gVXRpbHMuaW5zdGFuY2VPZihjaGlsZCwgJ3Byb21pc2UnKSkpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoWyBUeXBlIF0uY29uY2F0KGNoaWxkcmVuKSkudGhlbigoYWxsKSA9PiB7XG4gICAgICAgICAgICBUeXBlID0gYWxsWzBdO1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBhbGwuc2xpY2UoMSk7XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgSmliQ2xhc3MoXG4gICAgICAgICAgICAgIFR5cGUsXG4gICAgICAgICAgICAgIHByb3BzLFxuICAgICAgICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IEppYkNsYXNzKFxuICAgICAgICAgIFR5cGUsXG4gICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGppYiwge1xuICAgICAgICBbSklCXToge1xuICAgICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgW2RlYWRiZWVmLmlkU3ltXToge1xuICAgICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgKCkgPT4gVHlwZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gamliO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGJhcnJlbiwge1xuICAgICAgW0pJQl9CQVJSRU5dOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBbZGVhZGJlZWYuaWRTeW1dOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgKCkgPT4gVHlwZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gYmFycmVuO1xuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoJCwge1xuICAgICdyZW1hcCc6IHtcbiAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgIHZhbHVlOiAgICAgICAgKF9qaWIsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgIGxldCBqaWIgPSBfamliO1xuICAgICAgICBpZiAoamliID09IG51bGwgfHwgT2JqZWN0LmlzKGppYiwgSW5maW5pdHkpIHx8IE9iamVjdC5pcyhqaWIsIE5hTikpXG4gICAgICAgICAgcmV0dXJuIGppYjtcblxuICAgICAgICBpZiAoaXNKaWJpc2goamliKSlcbiAgICAgICAgICBqaWIgPSBjb25zdHJ1Y3RKaWIoamliKTtcblxuICAgICAgICBjb25zdCBmaW5hbGl6ZU1hcCA9IChfbWFwcGVkSmliKSA9PiB7XG4gICAgICAgICAgbGV0IG1hcHBlZEppYiA9IF9tYXBwZWRKaWI7XG5cbiAgICAgICAgICBpZiAoaXNKaWJpc2gobWFwcGVkSmliKSlcbiAgICAgICAgICAgIG1hcHBlZEppYiA9IGNvbnN0cnVjdEppYihtYXBwZWRKaWIpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBtYXBwZWRKaWI7XG5cbiAgICAgICAgICByZXR1cm4gJChtYXBwZWRKaWIuVHlwZSwgbWFwcGVkSmliLnByb3BzKSguLi4obWFwcGVkSmliLmNoaWxkcmVuIHx8IFtdKSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IG1hcHBlZEppYiA9IGNhbGxiYWNrKGppYik7XG4gICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKG1hcHBlZEppYiwgJ3Byb21pc2UnKSlcbiAgICAgICAgICByZXR1cm4gbWFwcGVkSmliLnRoZW4oZmluYWxpemVNYXApO1xuXG4gICAgICAgIHJldHVybiBmaW5hbGl6ZU1hcChtYXBwZWRKaWIpO1xuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gJDtcbn1cblxuZXhwb3J0IGNvbnN0ICQgPSBmYWN0b3J5KEppYik7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ppYmlzaCh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmICh2YWx1ZVtKSUJfQkFSUkVOXSB8fCB2YWx1ZVtKSUJdKSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBKaWIpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29uc3RydWN0SmliKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEppYilcbiAgICByZXR1cm4gdmFsdWU7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmICh2YWx1ZVtKSUJfQkFSUkVOXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpKCk7XG4gICAgZWxzZSBpZiAodmFsdWVbSklCXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpO1xuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignY29uc3RydWN0SmliOiBQcm92aWRlZCB2YWx1ZSBpcyBub3QgYSBKaWIuJyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlQ2hpbGRyZW4oX2NoaWxkcmVuKSB7XG4gIGxldCBjaGlsZHJlbiA9IF9jaGlsZHJlbjtcblxuICBpZiAoVXRpbHMuaW5zdGFuY2VPZihjaGlsZHJlbiwgJ3Byb21pc2UnKSlcbiAgICBjaGlsZHJlbiA9IGF3YWl0IGNoaWxkcmVuO1xuXG4gIGlmICghKCh0aGlzLmlzSXRlcmFibGVDaGlsZCB8fCBVdGlscy5pc0l0ZXJhYmxlQ2hpbGQpLmNhbGwodGhpcywgY2hpbGRyZW4pKSAmJiAoaXNKaWJpc2goY2hpbGRyZW4pIHx8ICgodGhpcy5pc1ZhbGlkQ2hpbGQgfHwgVXRpbHMuaXNWYWxpZENoaWxkKS5jYWxsKHRoaXMsIGNoaWxkcmVuKSkpKVxuICAgIGNoaWxkcmVuID0gWyBjaGlsZHJlbiBdO1xuXG4gIGxldCBwcm9taXNlcyA9IFV0aWxzLml0ZXJhdGUoY2hpbGRyZW4sIGFzeW5jICh7IHZhbHVlOiBfY2hpbGQgfSkgPT4ge1xuICAgIGxldCBjaGlsZCA9IChVdGlscy5pbnN0YW5jZU9mKF9jaGlsZCwgJ3Byb21pc2UnKSkgPyBhd2FpdCBfY2hpbGQgOiBfY2hpbGQ7XG5cbiAgICBpZiAoaXNKaWJpc2goY2hpbGQpKVxuICAgICAgcmV0dXJuIGF3YWl0IGNvbnN0cnVjdEppYihjaGlsZCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGNoaWxkO1xuICB9KTtcblxuICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufVxuIiwiZXhwb3J0IHtcbiAgQ09OVEVYVF9JRCxcbiAgUm9vdE5vZGUsXG59IGZyb20gJy4vcm9vdC1ub2RlLmpzJztcblxuZXhwb3J0IGNvbnN0IEZPUkNFX1JFRkxPVyA9IFN5bWJvbC5mb3IoJ0BqaWJzRm9yY2VSZWZsb3cnKTtcblxuZXhwb3J0IHsgUmVuZGVyZXIgfSBmcm9tICcuL3JlbmRlcmVyLmpzJztcbiIsImltcG9ydCB7XG4gIENPTlRFWFRfSUQsXG4gIFJvb3ROb2RlLFxufSBmcm9tICcuL3Jvb3Qtbm9kZS5qcyc7XG5cbmNvbnN0IElOSVRJQUxfQ09OVEVYVF9JRCA9IDFuO1xubGV0IF9jb250ZXh0SURDb3VudGVyID0gSU5JVElBTF9DT05URVhUX0lEO1xuXG5leHBvcnQgY2xhc3MgUmVuZGVyZXIgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIHN0YXRpYyBSb290Tm9kZSA9IFJvb3ROb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihudWxsLCBudWxsLCBudWxsKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdvcHRpb25zJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG9wdGlvbnMgfHwge30sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJlciA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudGVybVJlc29sdmVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgdGhpcy5jb250ZXh0Ll90ZXJtUmVzb2x2ZXIgPSBvcHRpb25zLnRlcm1SZXNvbHZlcjtcbiAgfVxuXG4gIGdldE9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgfVxuXG4gIHJlc29sdmVUZXJtKGFyZ3MpIHtcbiAgICBsZXQgeyB0ZXJtUmVzb2x2ZXIgfSA9IHRoaXMuZ2V0T3B0aW9ucygpO1xuICAgIGlmICh0eXBlb2YgdGVybVJlc29sdmVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIHRlcm1SZXNvbHZlci5jYWxsKHRoaXMsIGFyZ3MpO1xuXG4gICAgbGV0IGNoaWxkcmVuID0gKGFyZ3MuY2hpbGRyZW4gfHwgW10pO1xuICAgIHJldHVybiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSB8fCAnJztcbiAgfVxuXG4gIGNyZWF0ZUNvbnRleHQocm9vdENvbnRleHQsIG9uVXBkYXRlLCBvblVwZGF0ZVRoaXMpIHtcbiAgICBsZXQgY29udGV4dCAgICAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBteUNvbnRleHRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtDT05URVhUX0lEXSA6IElOSVRJQUxfQ09OVEVYVF9JRDtcblxuICAgIHJldHVybiBuZXcgUHJveHkoY29udGV4dCwge1xuICAgICAgZ2V0OiAodGFyZ2V0LCBwcm9wTmFtZSkgPT4ge1xuICAgICAgICBpZiAocHJvcE5hbWUgPT09IENPTlRFWFRfSUQpIHtcbiAgICAgICAgICBsZXQgcGFyZW50SUQgPSAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbQ09OVEVYVF9JRF0gOiBJTklUSUFMX0NPTlRFWFRfSUQ7XG4gICAgICAgICAgcmV0dXJuIChwYXJlbnRJRCA+IG15Q29udGV4dElEKSA/IHBhcmVudElEIDogbXlDb250ZXh0SUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIHByb3BOYW1lKSlcbiAgICAgICAgICByZXR1cm4gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W3Byb3BOYW1lXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgIH0sXG4gICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAocHJvcE5hbWUgPT09IENPTlRFWFRfSUQpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgaWYgKHRhcmdldFtwcm9wTmFtZV0gPT09IHZhbHVlKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIG15Q29udGV4dElEID0gKytfY29udGV4dElEQ291bnRlcjtcbiAgICAgICAgdGFyZ2V0W3Byb3BOYW1lXSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb25VcGRhdGUgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgb25VcGRhdGUuY2FsbChvblVwZGF0ZVRoaXMsIG9uVXBkYXRlVGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgZGVhZGJlZWYgZnJvbSAnZGVhZGJlZWYnO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vdXRpbHMuanMnO1xuaW1wb3J0IHtcbiAgaXNKaWJpc2gsXG4gIHJlc29sdmVDaGlsZHJlbixcbiAgY29uc3RydWN0SmliLFxufSBmcm9tICcuLi9qaWIuanMnO1xuXG5leHBvcnQgY29uc3QgQ09OVEVYVF9JRCA9IFN5bWJvbC5mb3IoJ0BqaWJzL25vZGUvY29udGV4dElEJyk7XG5cbmV4cG9ydCBjbGFzcyBSb290Tm9kZSB7XG4gIHN0YXRpYyBDT05URVhUX0lEID0gQ09OVEVYVF9JRDtcblxuICBjb25zdHJ1Y3RvcihyZW5kZXJlciwgcGFyZW50Tm9kZSwgX2NvbnRleHQsIGppYikge1xuICAgIGxldCBjb250ZXh0ID0gbnVsbDtcblxuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLkhBU19DT05URVhUICE9PSBmYWxzZSAmJiAocmVuZGVyZXIgfHwgdGhpcy5jcmVhdGVDb250ZXh0KSkge1xuICAgICAgY29udGV4dCA9IChyZW5kZXJlciB8fCB0aGlzKS5jcmVhdGVDb250ZXh0KFxuICAgICAgICBfY29udGV4dCxcbiAgICAgICAgKHRoaXMub25Db250ZXh0VXBkYXRlKSA/IHRoaXMub25Db250ZXh0VXBkYXRlIDogdW5kZWZpbmVkLFxuICAgICAgICB0aGlzLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnVFlQRSc6IHtcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnN0cnVjdG9yLlRZUEUsXG4gICAgICAgIHNldDogICAgICAgICAgKCkgPT4ge30sIC8vIE5PT1BcbiAgICAgIH0sXG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVXRpbHMuZ2VuZXJhdGVVVUlEKCksXG4gICAgICB9LFxuICAgICAgJ3JlbmRlcmVyJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICByZW5kZXJlcixcbiAgICAgIH0sXG4gICAgICAncGFyZW50Tm9kZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcGFyZW50Tm9kZSxcbiAgICAgIH0sXG4gICAgICAnY2hpbGROb2Rlcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbmV3IE1hcCgpLFxuICAgICAgfSxcbiAgICAgICdjb250ZXh0Jzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICAgICAgICAgICgpID0+IHt9LFxuICAgICAgfSxcbiAgICAgICdkZXN0cm95aW5nJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBmYWxzZSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyUHJvbWlzZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyRnJhbWUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIDAsXG4gICAgICB9LFxuICAgICAgJ2ppYic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLFxuICAgICAgfSxcbiAgICAgICduYXRpdmVFbGVtZW50Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJlc29sdmVDaGlsZHJlbihjaGlsZHJlbikge1xuICAgIHJldHVybiByZXNvbHZlQ2hpbGRyZW4uY2FsbCh0aGlzLCBjaGlsZHJlbik7XG4gIH1cblxuICBpc0ppYih2YWx1ZSkge1xuICAgIHJldHVybiBpc0ppYmlzaCh2YWx1ZSk7XG4gIH1cblxuICBjb25zdHJ1Y3RKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gY29uc3RydWN0SmliKHZhbHVlKTtcbiAgfVxuXG4gIGdldENhY2hlS2V5KCkge1xuICAgIGxldCB7IFR5cGUsIHByb3BzIH0gPSAodGhpcy5qaWIgfHwge30pO1xuICAgIGxldCBjYWNoZUtleSA9IGRlYWRiZWVmKFR5cGUsIHByb3BzLmtleSk7XG5cbiAgICByZXR1cm4gY2FjaGVLZXk7XG4gIH1cblxuICB1cGRhdGVKaWIobmV3SmliKSB7XG4gICAgdGhpcy5qaWIgPSBuZXdKaWI7XG4gIH1cblxuICBjbGVhckNoaWxkcmVuKCkge1xuICAgIHRoaXMuY2hpbGROb2Rlcy5jbGVhcigpO1xuICB9XG5cbiAgcmVtb3ZlQ2hpbGQoY2hpbGROb2RlKSB7XG4gICAgbGV0IGNhY2hlS2V5ID0gY2hpbGROb2RlLmdldENhY2hlS2V5KCk7XG4gICAgdGhpcy5jaGlsZE5vZGVzLmRlbGV0ZShjYWNoZUtleSk7XG4gIH1cblxuICBhZGRDaGlsZChjaGlsZE5vZGUsIF9jYWNoZUtleSkge1xuICAgIGxldCBjYWNoZUtleSA9IChfY2FjaGVLZXkpID8gX2NhY2hlS2V5IDogY2hpbGROb2RlLmdldENhY2hlS2V5KCk7XG4gICAgdGhpcy5jaGlsZE5vZGVzLnNldChjYWNoZUtleSwgY2hpbGROb2RlKTtcbiAgfVxuXG4gIGdldENoaWxkKGNhY2hlS2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuY2hpbGROb2Rlcy5nZXQoY2FjaGVLZXkpO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hpbGROb2RlcztcbiAgfVxuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW5Ob2RlcygpIHtcbiAgICBsZXQgY2hpbGROb2RlcyA9IFtdO1xuICAgIGZvciAobGV0IGNoaWxkTm9kZSBvZiB0aGlzLmNoaWxkTm9kZXMudmFsdWVzKCkpXG4gICAgICBjaGlsZE5vZGVzID0gY2hpbGROb2Rlcy5jb25jYXQoY2hpbGROb2RlLmdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkpO1xuXG4gICAgcmV0dXJuIGNoaWxkTm9kZXMuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveShmb3JjZSkge1xuICAgIGlmICghZm9yY2UgJiYgdGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5kZXN0cm95aW5nID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLnJlbmRlclByb21pc2UpXG4gICAgICBhd2FpdCB0aGlzLnJlbmRlclByb21pc2U7XG5cbiAgICBhd2FpdCB0aGlzLmRlc3Ryb3lGcm9tRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG5cbiAgICBsZXQgZGVzdHJveVByb21pc2VzID0gW107XG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHRoaXMuY2hpbGROb2Rlcy52YWx1ZXMoKSlcbiAgICAgIGRlc3Ryb3lQcm9taXNlcy5wdXNoKGNoaWxkTm9kZS5kZXN0cm95KCkpO1xuXG4gICAgdGhpcy5jaGlsZE5vZGVzLmNsZWFyKCk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5wYXJlbnROb2RlID0gbnVsbDtcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIHRoaXMuamliID0gbnVsbDtcbiAgfVxuXG4gIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICAgIHJldHVybiBVdGlscy5pc1ZhbGlkQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gICAgcmV0dXJuIFV0aWxzLmlzSXRlcmFibGVDaGlsZChjaGlsZCk7XG4gIH1cblxuICBwcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKSB7XG4gICAgcmV0dXJuIFV0aWxzLnByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpO1xuICB9XG5cbiAgY2hpbGRyZW5EaWZmZXIob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKSB7XG4gICAgcmV0dXJuIFV0aWxzLmNoaWxkcmVuRGlmZmVyKG9sZENoaWxkcmVuLCBuZXdDaGlsZHJlbik7XG4gIH1cblxuICBhc3luYyByZW5kZXIoLi4uYXJncykge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLnJlbmRlckZyYW1lKys7XG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5fcmVuZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLnJlbmRlclByb21pc2UgPSB0aGlzLl9yZW5kZXIoLi4uYXJncylcbiAgICAgICAgLnRoZW4oYXN5bmMgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgIGlmIChyZW5kZXJGcmFtZSA+PSB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zeW5jRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG5cbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5zeW5jRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmVuZGVyUHJvbWlzZTtcbiAgfVxuXG4gIGdldFBhcmVudElEKCkge1xuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50Tm9kZS5pZDtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIXRoaXMucmVuZGVyZXIpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5yZW5kZXJlci5kZXN0cm95RnJvbURPTShjb250ZXh0LCBub2RlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bmNET00oY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLnN5bmNET00oY29udGV4dCwgbm9kZSk7XG4gIH1cbn1cbiIsIi8qIGVzbGludC1kaXNhYmxlIG5vLW1hZ2ljLW51bWJlcnMgKi9cbmltcG9ydCBkZWFkYmVlZiBmcm9tICdkZWFkYmVlZic7XG5cbmNvbnN0IFNUT1AgPSBTeW1ib2wuZm9yKCdAamlic0l0ZXJhdGVTdG9wJyk7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXN0ZWQtdGVybmFyeVxuY29uc3QgZ2xvYmFsU2NvcGUgPSAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpID8gZ2xvYmFsIDogKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHRoaXM7XG5cbmxldCB1dWlkID0gMTAwMDAwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbmNlT2Yob2JqKSB7XG4gIGZ1bmN0aW9uIHRlc3RUeXBlKG9iaiwgX3ZhbCkge1xuICAgIGZ1bmN0aW9uIGlzRGVmZXJyZWRUeXBlKG9iaikge1xuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFByb21pc2UgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1Byb21pc2UnKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIFF1YWNrIHF1YWNrLi4uXG4gICAgICBpZiAodHlwZW9mIG9iai50aGVuID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvYmouY2F0Y2ggPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHZhbCAgICAgPSBfdmFsO1xuICAgIGxldCB0eXBlT2YgID0gKHR5cGVvZiBvYmopO1xuXG4gICAgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU3RyaW5nKVxuICAgICAgdmFsID0gJ3N0cmluZyc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5OdW1iZXIpXG4gICAgICB2YWwgPSAnbnVtYmVyJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJvb2xlYW4pXG4gICAgICB2YWwgPSAnYm9vbGVhbic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5GdW5jdGlvbilcbiAgICAgIHZhbCA9ICdmdW5jdGlvbic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5BcnJheSlcbiAgICAgIHZhbCA9ICdhcnJheSc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5PYmplY3QpXG4gICAgICB2YWwgPSAnb2JqZWN0JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlByb21pc2UpXG4gICAgICB2YWwgPSAncHJvbWlzZSc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5CaWdJbnQpXG4gICAgICB2YWwgPSAnYmlnaW50JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk1hcClcbiAgICAgIHZhbCA9ICdtYXAnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuV2Vha01hcClcbiAgICAgIHZhbCA9ICd3ZWFrbWFwJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlNldClcbiAgICAgIHZhbCA9ICdzZXQnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU3ltYm9sKVxuICAgICAgdmFsID0gJ3N5bWJvbCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5CdWZmZXIpXG4gICAgICB2YWwgPSAnYnVmZmVyJztcblxuICAgIGlmICh2YWwgPT09ICdidWZmZXInICYmIGdsb2JhbFNjb3BlLkJ1ZmZlciAmJiBnbG9iYWxTY29wZS5CdWZmZXIuaXNCdWZmZXIob2JqKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ251bWJlcicgJiYgKHR5cGVPZiA9PT0gJ251bWJlcicgfHwgb2JqIGluc3RhbmNlb2YgTnVtYmVyIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdOdW1iZXInKSkpIHtcbiAgICAgIGlmICghaXNGaW5pdGUob2JqKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodmFsICE9PSAnb2JqZWN0JyAmJiB2YWwgPT09IHR5cGVPZilcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmICgob2JqLmNvbnN0cnVjdG9yID09PSBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAvLyBOdWxsIHByb3RvdHlwZSBvbiBvYmplY3RcbiAgICAgIGlmICh0eXBlT2YgPT09ICdvYmplY3QnICYmICFvYmouY29uc3RydWN0b3IpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHZhbCA9PT0gJ2FycmF5JyAmJiAoQXJyYXkuaXNBcnJheShvYmopIHx8IG9iaiBpbnN0YW5jZW9mIEFycmF5IHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdBcnJheScpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKCh2YWwgPT09ICdwcm9taXNlJyB8fCB2YWwgPT09ICdkZWZlcnJlZCcpICYmIGlzRGVmZXJyZWRUeXBlKG9iaikpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdzdHJpbmcnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5TdHJpbmcgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1N0cmluZycpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2Jvb2xlYW4nICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5Cb29sZWFuIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdCb29sZWFuJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnbWFwJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuTWFwIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdNYXAnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICd3ZWFrbWFwJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuV2Vha01hcCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnV2Vha01hcCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3NldCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLlNldCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2V0JykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnZnVuY3Rpb24nICYmIHR5cGVPZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicgJiYgb2JqIGluc3RhbmNlb2YgdmFsKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgJiYgb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB2YWwpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChvYmogPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICh0ZXN0VHlwZShvYmosIGFyZ3VtZW50c1tpXSkgPT09IHRydWUpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpIHtcbiAgaWYgKG9sZFByb3BzID09PSBuZXdQcm9wcylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBvbGRQcm9wcyAhPT0gdHlwZW9mIG5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmICghb2xkUHJvcHMgJiYgbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKG9sZFByb3BzICYmICFuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZXFlcWVxXG4gIGlmICghb2xkUHJvcHMgJiYgIW5ld1Byb3BzICYmIG9sZFByb3BzICE9IG9sZFByb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGxldCBhS2V5cyA9IE9iamVjdC5rZXlzKG9sZFByb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvbGRQcm9wcykpO1xuICBsZXQgYktleXMgPSBPYmplY3Qua2V5cyhuZXdQcm9wcykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMobmV3UHJvcHMpKTtcblxuICBpZiAoYUtleXMubGVuZ3RoICE9PSBiS2V5cy5sZW5ndGgpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYUtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBhS2V5ID0gYUtleXNbaV07XG4gICAgaWYgKHNraXBLZXlzICYmIHNraXBLZXlzLmluZGV4T2YoYUtleSkgPj0gMClcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKG9sZFByb3BzW2FLZXldICE9PSBuZXdQcm9wc1thS2V5XSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgbGV0IGJLZXkgPSBiS2V5c1tpXTtcbiAgICBpZiAoc2tpcEtleXMgJiYgc2tpcEtleXMuaW5kZXhPZihiS2V5KSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKGFLZXkgPT09IGJLZXkpXG4gICAgICBjb250aW51ZTtcblxuICAgIGlmIChvbGRQcm9wc1tiS2V5XSAhPT0gbmV3UHJvcHNbYktleV0pXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNpemVPZih2YWx1ZSkge1xuICBpZiAoIXZhbHVlKVxuICAgIHJldHVybiAwO1xuXG4gIGlmIChPYmplY3QuaXMoSW5maW5pdHkpKVxuICAgIHJldHVybiAwO1xuXG4gIGlmICh0eXBlb2YgdmFsdWUubGVuZ3RoID09PSAnbnVtYmVyJylcbiAgICByZXR1cm4gdmFsdWUubGVuZ3RoO1xuXG4gIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBfaXRlcmF0ZShvYmosIGNhbGxiYWNrKSB7XG4gIGlmICghb2JqIHx8IE9iamVjdC5pcyhJbmZpbml0eSkpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGxldCByZXN1bHRzICAgPSBbXTtcbiAgbGV0IHNjb3BlICAgICA9IHsgY29sbGVjdGlvbjogb2JqLCBTVE9QIH07XG4gIGxldCByZXN1bHQ7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIHNjb3BlLnR5cGUgPSAnQXJyYXknO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gb2JqLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIHNjb3BlLnZhbHVlID0gb2JqW2ldO1xuICAgICAgc2NvcGUuaW5kZXggPSBzY29wZS5rZXkgPSBpO1xuXG4gICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9iai5lbnRyaWVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIFNldCB8fCBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1NldCcpIHtcbiAgICAgIHNjb3BlLnR5cGUgPSAnU2V0JztcblxuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2Ygb2JqLnZhbHVlcygpKSB7XG4gICAgICAgIHNjb3BlLnZhbHVlID0gaXRlbTtcbiAgICAgICAgc2NvcGUua2V5ID0gaXRlbTtcbiAgICAgICAgc2NvcGUuaW5kZXggPSBpbmRleCsrO1xuXG4gICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzY29wZS50eXBlID0gb2JqLmNvbnN0cnVjdG9yLm5hbWU7XG5cbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGxldCBbIGtleSwgdmFsdWUgXSBvZiBvYmouZW50cmllcygpKSB7XG4gICAgICAgIHNjb3BlLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHNjb3BlLmtleSA9IGtleTtcbiAgICAgICAgc2NvcGUuaW5kZXggPSBpbmRleCsrO1xuXG4gICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoaW5zdGFuY2VPZihvYmosICdib29sZWFuJywgJ251bWJlcicsICdiaWdpbnQnLCAnZnVuY3Rpb24nKSlcbiAgICAgIHJldHVybjtcblxuICAgIHNjb3BlLnR5cGUgPSAob2JqLmNvbnN0cnVjdG9yKSA/IG9iai5jb25zdHJ1Y3Rvci5uYW1lIDogJ09iamVjdCc7XG5cbiAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQga2V5ICAgPSBrZXlzW2ldO1xuICAgICAgbGV0IHZhbHVlID0gb2JqW2tleV07XG5cbiAgICAgIHNjb3BlLnZhbHVlID0gdmFsdWU7XG4gICAgICBzY29wZS5rZXkgPSBrZXk7XG4gICAgICBzY29wZS5pbmRleCA9IGk7XG5cbiAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhfaXRlcmF0ZSwge1xuICAnU1RPUCc6IHtcbiAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB2YWx1ZTogICAgICAgIFNUT1AsXG4gIH0sXG59KTtcblxuZXhwb3J0IGNvbnN0IGl0ZXJhdGUgPSBfaXRlcmF0ZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNoaWxkcmVuRGlmZmVyKGNoaWxkcmVuMSwgY2hpbGRyZW4yKSB7XG4gIGlmIChjaGlsZHJlbjEgPT09IGNoaWxkcmVuMilcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgbGV0IHJlc3VsdDEgPSAoIUFycmF5LmlzQXJyYXkoY2hpbGRyZW4xKSkgPyBkZWFkYmVlZihjaGlsZHJlbjEpIDogZGVhZGJlZWYoLi4uY2hpbGRyZW4xKTtcbiAgbGV0IHJlc3VsdDIgPSAoIUFycmF5LmlzQXJyYXkoY2hpbGRyZW4yKSkgPyBkZWFkYmVlZihjaGlsZHJlbjIpIDogZGVhZGJlZWYoLi4uY2hpbGRyZW4yKTtcblxuICByZXR1cm4gKHJlc3VsdDEgIT09IHJlc3VsdDIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmV0Y2hEZWVwUHJvcGVydHkob2JqLCBfa2V5LCBkZWZhdWx0VmFsdWUsIGxhc3RQYXJ0KSB7XG4gIGlmIChvYmogPT0gbnVsbCB8fCBPYmplY3QuaXMoTmFOLCBvYmopIHx8IE9iamVjdC5pcyhJbmZpbml0eSwgb2JqKSlcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBudWxsIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgaWYgKF9rZXkgPT0gbnVsbCB8fCBPYmplY3QuaXMoTmFOLCBfa2V5KSB8fCBPYmplY3QuaXMoSW5maW5pdHksIF9rZXkpKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIG51bGwgXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBsZXQgcGFydHM7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoX2tleSkpIHtcbiAgICBwYXJ0cyA9IF9rZXk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIF9rZXkgPT09ICdzeW1ib2wnKSB7XG4gICAgcGFydHMgPSBbIF9rZXkgXTtcbiAgfSBlbHNlIHtcbiAgICBsZXQga2V5ICAgICAgICAgPSAoJycgKyBfa2V5KTtcbiAgICBsZXQgbGFzdEluZGV4ICAgPSAwO1xuICAgIGxldCBsYXN0Q3Vyc29yICA9IDA7XG5cbiAgICBwYXJ0cyA9IFtdO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBsZXQgaW5kZXggPSBrZXkuaW5kZXhPZignLicsIGxhc3RJbmRleCk7XG4gICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIHBhcnRzLnB1c2goa2V5LnN1YnN0cmluZyhsYXN0Q3Vyc29yKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoa2V5LmNoYXJBdChpbmRleCAtIDEpID09PSAnXFxcXCcpIHtcbiAgICAgICAgbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcGFydHMucHVzaChrZXkuc3Vic3RyaW5nKGxhc3RDdXJzb3IsIGluZGV4KSk7XG4gICAgICBsYXN0Q3Vyc29yID0gbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgIH1cbiAgfVxuXG4gIGxldCBwYXJ0TiA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuICBpZiAocGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIHBhcnROIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgbGV0IGN1cnJlbnRWYWx1ZSA9IG9iajtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGFydHMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1tpXTtcblxuICAgIGN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZVtrZXldO1xuICAgIGlmIChjdXJyZW50VmFsdWUgPT0gbnVsbClcbiAgICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIHBhcnROIF0gOiBkZWZhdWx0VmFsdWU7XG4gIH1cblxuICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgY3VycmVudFZhbHVlLCBwYXJ0TiBdIDogY3VycmVudFZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmluZE1ldGhvZHMoX3Byb3RvLCBza2lwUHJvdG9zKSB7XG4gIGxldCBwcm90byAgICAgICAgICAgPSBfcHJvdG87XG4gIGxldCBhbHJlYWR5VmlzaXRlZCAgPSBuZXcgU2V0KCk7XG5cbiAgd2hpbGUgKHByb3RvKSB7XG4gICAgbGV0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMocHJvdG8pO1xuICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKGRlc2NyaXB0b3JzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhkZXNjcmlwdG9ycykpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChrZXkgPT09ICdjb25zdHJ1Y3RvcicpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoYWxyZWFkeVZpc2l0ZWQuaGFzKGtleSkpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBhbHJlYWR5VmlzaXRlZC5hZGQoa2V5KTtcblxuICAgICAgbGV0IHZhbHVlID0gcHJvdG9ba2V5XTtcblxuICAgICAgLy8gU2tpcCBwcm90b3R5cGUgb2YgT2JqZWN0XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIE9iamVjdC5wcm90b3R5cGVba2V5XSA9PT0gdmFsdWUpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgdGhpc1trZXldID0gdmFsdWUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgaWYgKHByb3RvID09PSBPYmplY3QucHJvdG90eXBlKVxuICAgICAgYnJlYWs7XG5cbiAgICBpZiAoc2tpcFByb3RvcyAmJiBza2lwUHJvdG9zLmluZGV4T2YocHJvdG8pID49IDApXG4gICAgICBicmVhaztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIE5hTikpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKGluc3RhbmNlT2YodmFsdWUsICdzdHJpbmcnKSlcbiAgICByZXR1cm4gISgvXFxTLykudGVzdCh2YWx1ZSk7XG4gIGVsc2UgaWYgKGluc3RhbmNlT2YodmFsdWUsICdudW1iZXInKSAmJiBpc0Zpbml0ZSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBlbHNlIGlmICghaW5zdGFuY2VPZih2YWx1ZSwgJ2Jvb2xlYW4nLCAnYmlnaW50JywgJ2Z1bmN0aW9uJykgJiYgc2l6ZU9mKHZhbHVlKSA9PT0gMClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc05vdEVtcHR5KHZhbHVlKSB7XG4gIHJldHVybiAhaXNFbXB0eS5jYWxsKHRoaXMsIHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZsYXR0ZW5BcnJheSh2YWx1ZSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgIHJldHVybiB2YWx1ZTtcblxuICBsZXQgbmV3QXJyYXkgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gdmFsdWUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBpdGVtID0gdmFsdWVbaV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpXG4gICAgICBuZXdBcnJheSA9IG5ld0FycmF5LmNvbmNhdChmbGF0dGVuQXJyYXkoaXRlbSkpO1xuICAgIGVsc2VcbiAgICAgIG5ld0FycmF5LnB1c2goaXRlbSk7XG4gIH1cblxuICByZXR1cm4gbmV3QXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQ2hpbGQoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgY2hpbGQgPT09ICdib29sZWFuJylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKGNoaWxkLCBOYU4pKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzSXRlcmFibGVDaGlsZChjaGlsZCkge1xuICBpZiAoY2hpbGQgPT0gbnVsbCB8fCBPYmplY3QuaXMoY2hpbGQsIE5hTikgfHwgT2JqZWN0LmlzKGNoaWxkLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiAoQXJyYXkuaXNBcnJheShjaGlsZCkgfHwgdHlwZW9mIGNoaWxkID09PSAnb2JqZWN0JyAmJiAhaW5zdGFuY2VPZihjaGlsZCwgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ3N0cmluZycpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vdygpIHtcbiAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIGVsc2VcbiAgICByZXR1cm4gRGF0ZS5ub3coKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcbiAgaWYgKHV1aWQgPiA5OTk5OTk5KVxuICAgIHV1aWQgPSAxMDAwMDAwO1xuXG4gIHJldHVybiBgJHtEYXRlLm5vdygpfS4ke3V1aWQrK30ke01hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwKS50b1N0cmluZygpLnBhZFN0YXJ0KDIwLCAnMCcpfWA7XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHtcbiAgSklCX0JBUlJFTixcbiAgSklCX1BST1hZLFxuICBKSUJfUkFXX1RFWFQsXG4gIEpJQixcbiAgSklCX0NISUxEX0lOREVYX1BST1AsXG4gIEppYixcbiAgZmFjdG9yeSxcbiAgJCxcbiAgaXNKaWJpc2gsXG4gIGNvbnN0cnVjdEppYixcbiAgcmVzb2x2ZUNoaWxkcmVuLFxufSBmcm9tICcuL2ppYi5qcyc7XG5cbmV4cG9ydCBjb25zdCBKaWJzID0ge1xuICBKSUJfQkFSUkVOLFxuICBKSUJfUFJPWFksXG4gIEpJQl9SQVdfVEVYVCxcbiAgSklCLFxuICBKSUJfQ0hJTERfSU5ERVhfUFJPUCxcbiAgSmliLFxuICBpc0ppYmlzaCxcbiAgY29uc3RydWN0SmliLFxuICByZXNvbHZlQ2hpbGRyZW4sXG59O1xuXG5pbXBvcnQge1xuICBVUERBVEVfRVZFTlQsXG4gIFFVRVVFX1VQREFURV9NRVRIT0QsXG4gIEZMVVNIX1VQREFURV9NRVRIT0QsXG4gIElOSVRfTUVUSE9ELFxuICBTS0lQX1NUQVRFX1VQREFURVMsXG4gIFBFTkRJTkdfU1RBVEVfVVBEQVRFLFxuICBMQVNUX1JFTkRFUl9USU1FLFxuICBQUkVWSU9VU19TVEFURSxcblxuICBDb21wb25lbnQsXG4gIFRlcm0sXG59IGZyb20gJy4vY29tcG9uZW50LmpzJztcblxuZXhwb3J0IGNvbnN0IENvbXBvbmVudHMgPSB7XG4gIFVQREFURV9FVkVOVCxcbiAgUVVFVUVfVVBEQVRFX01FVEhPRCxcbiAgRkxVU0hfVVBEQVRFX01FVEhPRCxcbiAgSU5JVF9NRVRIT0QsXG4gIFNLSVBfU1RBVEVfVVBEQVRFUyxcbiAgUEVORElOR19TVEFURV9VUERBVEUsXG4gIExBU1RfUkVOREVSX1RJTUUsXG4gIFBSRVZJT1VTX1NUQVRFLFxufTtcblxuaW1wb3J0IHtcbiAgRk9SQ0VfUkVGTE9XLFxuICBSb290Tm9kZSxcbiAgUmVuZGVyZXIsXG59IGZyb20gJy4vcmVuZGVyZXJzL2luZGV4LmpzJztcblxuZXhwb3J0IGNvbnN0IFJlbmRlcmVycyA9IHtcbiAgQ09OVEVYVF9JRDogUm9vdE5vZGUuQ09OVEVYVF9JRCxcbiAgRk9SQ0VfUkVGTE9XLFxuICBSb290Tm9kZSxcbiAgUmVuZGVyZXIsXG59O1xuXG5leHBvcnQgKiBhcyBVdGlscyBmcm9tICcuL3V0aWxzLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgZGVhZGJlZWYgfSBmcm9tICdkZWFkYmVlZic7XG5cbmV4cG9ydCB7XG4gIGZhY3RvcnksXG4gICQsXG4gIENvbXBvbmVudCxcbiAgVGVybSxcbn07XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=

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
/* harmony export */   "Term": () => (/* reexport safe */ jibs__WEBPACK_IMPORTED_MODULE_1__.Term),
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
var __webpack_exports__Term = __webpack_exports__.Term;
var __webpack_exports__Utils = __webpack_exports__.Utils;
var __webpack_exports__deadbeef = __webpack_exports__.deadbeef;
var __webpack_exports__factory = __webpack_exports__.factory;
export { __webpack_exports__$ as $, __webpack_exports__Component as Component, __webpack_exports__Components as Components, __webpack_exports__DOMRenderer as DOMRenderer, __webpack_exports__Jibs as Jibs, __webpack_exports__Renderers as Renderers, __webpack_exports__Term as Term, __webpack_exports__Utils as Utils, __webpack_exports__deadbeef as deadbeef, __webpack_exports__factory as factory };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxPQUFPO0FBQ1A7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsd0NBQXdDLFFBQVE7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlFQUFpRSxNQUFNOztBQUV2RTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx3RUFBd0UsTUFBTTs7QUFFOUU7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTOztBQUVULDRDQUE0QyxRQUFRO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBLDBDQUEwQyxRQUFRO0FBQ2xEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhDQUE4QyxRQUFRO0FBQ3REO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSwwQ0FBMEMsUUFBUTtBQUNsRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLHdDQUF3QyxRQUFRO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEIsT0FBTztBQUNQOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxxQ0FBcUMsUUFBUTtBQUM3QztBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxrQ0FBa0MsNkJBQTZCO0FBQy9EO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7QUFLQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGdDQUFtQjs7QUFFckYsZ0NBQW1CO0FBQ25CLHFCQUFxQixnQ0FBbUI7QUFDeEM7QUFDQSxzQkFBc0I7QUFDdEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLHVDQUF1QyxRQUFRO0FBQy9DO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBLE9BQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRUFBa0UsZ0NBQW1COztBQUVyRixnQ0FBbUI7QUFDbkIscUJBQXFCLGdDQUFtQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCLGlFQUFpRSxnQ0FBbUI7QUFDcEYsa0VBQWtFLGdDQUFtQjs7OztBQUlyRjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLDJEQUEyRCxHQUFHO0FBQ3RGLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4QkFBOEI7QUFDOUI7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVc7QUFDWDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTzs7QUFFUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTCxHQUFHOztBQUVIO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsbUZBQW1GLGVBQWU7QUFDbEc7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7OztBQUdBLE9BQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRUFBa0UsZ0NBQW1COztBQUVyRixnQ0FBbUI7QUFDbkIscUJBQXFCLGdDQUFtQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QixzRUFBc0UsZ0NBQW1CO0FBQ3pGLHFFQUFxRSxnQ0FBbUI7OztBQUd4Rjs7Ozs7QUFLQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGdDQUFtQjs7QUFFckYsZ0NBQW1CO0FBQ25CLHFCQUFxQixnQ0FBbUI7QUFDeEM7QUFDQSxzQkFBc0I7QUFDdEIsc0VBQXNFLGdDQUFtQjs7O0FBR3pGO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkMsT0FBTztBQUNQLEtBQUs7O0FBRUw7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFVBQVUsZUFBZTtBQUN6QjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBOzs7QUFHQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGdDQUFtQjs7QUFFckYsZ0NBQW1CO0FBQ25CLHFCQUFxQixnQ0FBbUI7QUFDeEM7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QixpRUFBaUUsZ0NBQW1CO0FBQ3BGLGtFQUFrRSxnQ0FBbUI7QUFDckYsZ0VBQWdFLGdDQUFtQjs7Ozs7QUFLbkY7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4QkFBOEI7QUFDOUIsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCw4QkFBOEI7QUFDOUIsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxVQUFVLGNBQWMsaUJBQWlCO0FBQ3pDOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsTUFBTTtBQUNOO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGdDQUFtQjs7QUFFckYsZ0NBQW1CO0FBQ25CLHFCQUFxQixnQ0FBbUI7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QixpRUFBaUUsZ0NBQW1CO0FBQ3BGOzs7QUFHQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsMENBQTBDLFNBQVM7QUFDbkQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEscUNBQXFDLFFBQVE7QUFDN0M7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQjtBQUNwQjs7QUFFQTtBQUNBOztBQUVBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EscUNBQXFDLFFBQVE7QUFDN0M7O0FBRUE7QUFD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Ozs7Ozs7Ozs7QUNOZ0Q7QUFDM0IiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9jb21wb25lbnQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9kb20tcmVuZGVyZXIuanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi9saWIvZnJhZ21lbnQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9uYXRpdmUtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9wb3J0YWwtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi90ZXh0LW5vZGUuanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi4vamlicy9kaXN0L2luZGV4LmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSmlicyxcbiAgQ29tcG9uZW50cyxcbiAgUmVuZGVyZXJzLFxuICBVdGlscyxcbn0gZnJvbSAnamlicyc7XG5cbmNvbnN0IHtcbiAgSklCX1BST1hZLFxuICBKSUJfQ0hJTERfSU5ERVhfUFJPUCxcbn0gPSBKaWJzO1xuXG5jb25zdCB7XG4gIENPTlRFWFRfSUQsXG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuY29uc3Qge1xuICBJTklUX01FVEhPRCxcbiAgVVBEQVRFX0VWRU5ULFxuICBQRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRSxcbiAgU0tJUF9TVEFURV9VUERBVEVTLFxufSA9IENvbXBvbmVudHM7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDIwO1xuXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICBzdXBlciguLi5hcmdzKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdmcmFnbWVudE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ2NvbXBvbmVudCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAnaW50ZXJuYWxSZWZUcmFja2VyJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdwZW5kaW5nQ29udGV4dFVwZGF0ZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAncHJldmlvdXNTdGF0ZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9LFxuICAgICAgJ2xhc3RDb250ZXh0SUQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgICAgICB2YWx1ZTogICAgICAgIHRoaXMuY29udGV4dFtDT05URVhUX0lEXSB8fCAxbixcbiAgICAgIH0sXG4gICAgICAnY2FjaGVkUmVuZGVyUmVzdWx0Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIGlmICghdGhpcy5mcmFnbWVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gdGhpcy5mcmFnbWVudE5vZGUuZ2V0Q2hpbGRyZW5Ob2RlcygpO1xuICB9XG5cbiAgbWVyZ2VDb21wb25lbnRQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIG9sZFByb3BzIHx8IHt9LCBuZXdQcm9wcyk7XG4gICAgcmV0dXJuIHByb3BzO1xuICB9XG5cbiAgZmlyZVByb3BVcGRhdGVzKF9vbGRQcm9wcywgX25ld1Byb3BzKSB7XG4gICAgbGV0IG5ld1Byb3BzICAgID0gX25ld1Byb3BzIHx8IHt9O1xuICAgIGxldCBhbGxQcm9wS2V5cyA9IG5ldyBTZXQoT2JqZWN0LmtleXMobmV3UHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG5ld1Byb3BzKSkpO1xuXG4gICAgbGV0IG9sZFByb3BzICAgID0gX29sZFByb3BzIHx8IHt9O1xuICAgIGxldCBvbGRQcm9wS2V5cyA9IE9iamVjdC5rZXlzKG9sZFByb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvbGRQcm9wcykpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IG9sZFByb3BLZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgICBhbGxQcm9wS2V5cy5hZGQob2xkUHJvcEtleXNbaV0pO1xuXG4gICAgZm9yIChsZXQga2V5IG9mIGFsbFByb3BLZXlzKSB7XG4gICAgICBsZXQgb2xkVmFsdWUgID0gb2xkUHJvcHNba2V5XTtcbiAgICAgIGxldCBuZXdWYWx1ZSAgPSBuZXdQcm9wc1trZXldO1xuXG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKVxuICAgICAgICB0aGlzLmNvbXBvbmVudC5vblByb3BVcGRhdGVkKGtleSwgbmV3VmFsdWUsIG9sZFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRSZW5kZXIobmV3UHJvcHMsIG5ld0NoaWxkcmVuKSB7XG4gICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50O1xuICAgIGlmICghY29tcG9uZW50KVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodGhpcy5sYXN0Q29udGV4dElEIDwgdGhpcy5jb250ZXh0W0NPTlRFWFRfSURdKSB7XG4gICAgICB0aGlzLmxhc3RDb250ZXh0SUQgPSB0aGlzLmNvbnRleHRbQ09OVEVYVF9JRF07XG4gICAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2hpbGRyZW5EaWZmZXIoY29tcG9uZW50LmNoaWxkcmVuLCBuZXdDaGlsZHJlbikpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50LmNoaWxkcmVuID0gbmV3Q2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbXBvbmVudC5zdGF0ZSk7XG5cbiAgICAgIHRoaXMuZmlyZVByb3BVcGRhdGVzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuICAgICAgY29tcG9uZW50LnByb3BzID0gdGhpcy5tZXJnZUNvbXBvbmVudFByb3BzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNTdGF0ZSA9IHRoaXMucHJldmlvdXNTdGF0ZSB8fCB7fTtcbiAgICBsZXQgcHJvcHNEaWZmZXIgICA9IHRoaXMucHJvcHNEaWZmZXIoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcywgWyAncmVmJywgJ2tleScsIEpJQl9DSElMRF9JTkRFWF9QUk9QIF0sIHRydWUpO1xuICAgIGlmIChwcm9wc0RpZmZlciAmJiBjb21wb25lbnQuc2hvdWxkVXBkYXRlKG5ld1Byb3BzLCBwcmV2aW91c1N0YXRlKSkge1xuICAgICAgdGhpcy5wcmV2aW91c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgY29tcG9uZW50LnN0YXRlKTtcblxuICAgICAgdGhpcy5maXJlUHJvcFVwZGF0ZXMoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcyk7XG4gICAgICBjb21wb25lbnQucHJvcHMgPSB0aGlzLm1lcmdlQ29tcG9uZW50UHJvcHMoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcyk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGxldCBzdGF0ZURpZmZlcnMgPSB0aGlzLnByb3BzRGlmZmVyKHByZXZpb3VzU3RhdGUsIGNvbXBvbmVudC5zdGF0ZSk7XG4gICAgaWYgKHN0YXRlRGlmZmVycyAmJiBjb21wb25lbnQuc2hvdWxkVXBkYXRlKG5ld1Byb3BzLCBwcmV2aW91c1N0YXRlKSkge1xuICAgICAgdGhpcy5wcmV2aW91c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgY29tcG9uZW50LnN0YXRlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5jb21wb25lbnQpIHtcbiAgICAgIGlmICh0aGlzLmppYiAmJiB0aGlzLmppYi5wcm9wcyAmJiB0eXBlb2YgdGhpcy5qaWIucHJvcHMucmVmID09PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aGlzLmppYi5wcm9wcy5yZWYuY2FsbCh0aGlzLmNvbXBvbmVudCwgbnVsbCwgdGhpcy5jb21wb25lbnQpO1xuXG4gICAgICBhd2FpdCB0aGlzLmNvbXBvbmVudC5kZXN0cm95KCk7XG4gICAgICB0aGlzLmNvbXBvbmVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZnJhZ21lbnROb2RlKSB7XG4gICAgICB0aGlzLnJlbW92ZUNoaWxkKHRoaXMuZnJhZ21lbnROb2RlKTtcblxuICAgICAgYXdhaXQgdGhpcy5mcmFnbWVudE5vZGUuZGVzdHJveSgpO1xuICAgICAgdGhpcy5mcmFnbWVudE5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuY2FjaGVkUmVuZGVyUmVzdWx0ID0gbnVsbDtcbiAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBudWxsO1xuXG4gICAgcmV0dXJuIGF3YWl0IHN1cGVyLmRlc3Ryb3kodHJ1ZSk7XG4gIH1cblxuICBvbkNvbnRleHRVcGRhdGUoKSB7XG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudCB8fCB0aGlzLmNvbXBvbmVudFtQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAodGhpcy5wZW5kaW5nQ29udGV4dFVwZGF0ZSlcbiAgICAgIHJldHVybiB0aGlzLnBlbmRpbmdDb250ZXh0VXBkYXRlO1xuXG4gICAgdGhpcy5wZW5kaW5nQ29udGV4dFVwZGF0ZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCAhdGhpcy5jb21wb25lbnQgfHwgdGhpcy5jb21wb25lbnRbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIHRoaXMucGVuZGluZ0NvbnRleHRVcGRhdGUgPSBudWxsO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLnBlbmRpbmdDb250ZXh0VXBkYXRlO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIGFzeW5jIF9yZW5kZXIoZm9yY2VSZW5kZXIpIHtcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgbGV0IHsgVHlwZTogQ29tcG9uZW50Q2xhc3MsIHByb3BzLCBjaGlsZHJlbiB9ID0gKHRoaXMuamliIHx8IHt9KTtcbiAgICBpZiAoIUNvbXBvbmVudENsYXNzKVxuICAgICAgcmV0dXJuO1xuXG4gICAgY2hpbGRyZW4gPSB0aGlzLmppYi5jaGlsZHJlbiA9IGF3YWl0IHRoaXMucmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKTtcblxuICAgIGNvbnN0IGZpbmFsaXplUmVuZGVyID0gYXN5bmMgKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lIHx8ICF0aGlzLmNvbXBvbmVudClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLmNhY2hlZFJlbmRlclJlc3VsdCA9IHJlbmRlclJlc3VsdDtcbiAgICAgIHRoaXMuY29tcG9uZW50W0xBU1RfUkVOREVSX1RJTUVdID0gVXRpbHMubm93KCk7XG5cbiAgICAgIGxldCBmcmFnbWVudE5vZGUgPSB0aGlzLmZyYWdtZW50Tm9kZTtcbiAgICAgIGxldCBmcmFnbWVudEppYiA9IHsgVHlwZTogSklCX1BST1hZLCBwcm9wczoge30sIGNoaWxkcmVuOiByZW5kZXJSZXN1bHQgfTtcblxuICAgICAgaWYgKCFmcmFnbWVudE5vZGUpIHtcbiAgICAgICAgZnJhZ21lbnROb2RlID0gdGhpcy5mcmFnbWVudE5vZGUgPSB0aGlzLnJlbmRlcmVyLmNvbnN0cnVjdE5vZGVGcm9tSmliKGZyYWdtZW50SmliLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKGZyYWdtZW50Tm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcmFnbWVudE5vZGUudXBkYXRlSmliKGZyYWdtZW50SmliKTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgZnJhZ21lbnROb2RlLnJlbmRlcigpO1xuXG4gICAgICBsZXQgY29tcG9uZW50ICAgICAgICAgICA9IHRoaXMuY29tcG9uZW50O1xuICAgICAgbGV0IGludGVybmFsUmVmVHJhY2tlciAgPSB0aGlzLmludGVybmFsUmVmVHJhY2tlcjtcbiAgICAgIGlmIChwcm9wcyAmJiB0eXBlb2YgcHJvcHMucmVmID09PSAnZnVuY3Rpb24nICYmIGludGVybmFsUmVmVHJhY2tlciAhPT0gY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuaW50ZXJuYWxSZWZUcmFja2VyID0gY29tcG9uZW50O1xuICAgICAgICBwcm9wcy5yZWYuY2FsbChjb21wb25lbnQsIGNvbXBvbmVudCwgaW50ZXJuYWxSZWZUcmFja2VyKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlUmVuZGVyRXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgICBpZiAodGhpcy5jb21wb25lbnQpXG4gICAgICAgIHRoaXMuY29tcG9uZW50W0xBU1RfUkVOREVSX1RJTUVdID0gVXRpbHMubm93KCk7XG5cbiAgICAgIGxldCByZW5kZXJSZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCAmJiB0eXBlb2YgdGhpcy5jb21wb25lbnQucmVuZGVyRXJyb3JTdGF0ZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICByZW5kZXJSZXN1bHQgPSB0aGlzLmNvbXBvbmVudC5yZW5kZXJFcnJvclN0YXRlKGVycm9yKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlbmRlclJlc3VsdCA9IFsgYCR7ZXJyb3IubWVzc2FnZX1cXG4ke2Vycm9yLnN0YWNrfWAgXTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yMikge1xuICAgICAgICByZW5kZXJSZXN1bHQgPSBbIGAke2Vycm9yLm1lc3NhZ2V9XFxuJHtlcnJvci5zdGFja31gIF07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmaW5hbGl6ZVJlbmRlcihyZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKTtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgaWYgKGZvcmNlUmVuZGVyICE9PSB0cnVlICYmIHRoaXMuY29tcG9uZW50ICYmICF0aGlzLnNob3VsZFJlbmRlcihwcm9wcywgY2hpbGRyZW4pKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudDtcbiAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50ID0gbmV3IENvbXBvbmVudENsYXNzKHsgLi4uKHRoaXMuamliIHx8IHt9KSwgcHJvcHM6IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhudWxsLCBwcm9wcyksIGNvbnRleHQ6IHRoaXMuY29udGV4dCwgaWQ6IHRoaXMuaWQgfSk7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50W0lOSVRfTUVUSE9EXSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBjb21wb25lbnRbSU5JVF9NRVRIT0RdKCk7XG5cbiAgICAgICAgY29tcG9uZW50Lm9uKFVQREFURV9FVkVOVCwgKHB1c2hlZFJlbmRlclJlc3VsdCkgPT4ge1xuICAgICAgICAgIGlmIChwdXNoZWRSZW5kZXJSZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICAgICAgICAgIGZpbmFsaXplUmVuZGVyKHB1c2hlZFJlbmRlclJlc3VsdCwgdGhpcy5yZW5kZXJGcmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbmNlbCBhbnkgcGVuZGluZyBzdGF0ZSB1cGRhdGVzXG4gICAgICBpZiAodGhpcy5jb21wb25lbnRbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgICB0aGlzLmNvbXBvbmVudFtQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBudWxsO1xuXG4gICAgICBsZXQgcmVuZGVyUmVzdWx0ID0gdGhpcy5jb21wb25lbnQucmVuZGVyKGNoaWxkcmVuKTtcbiAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKHJlbmRlclJlc3VsdCwgJ3Byb21pc2UnKSkge1xuICAgICAgICBsZXQgd2FpdGluZ1JlbmRlclJlc3VsdCA9IHRoaXMuY29tcG9uZW50LnJlbmRlcldhaXRpbmcodGhpcy5jYWNoZWRSZW5kZXJSZXN1bHQpO1xuICAgICAgICBsZXQgcmVuZGVyQ29tcGxldGVkID0gZmFsc2U7XG5cbiAgICAgICAgbGV0IGxvYWRpbmdUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGxvYWRpbmdUaW1lciA9IG51bGw7XG5cbiAgICAgICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZih3YWl0aW5nUmVuZGVyUmVzdWx0LCAncHJvbWlzZScpKVxuICAgICAgICAgICAgd2FpdGluZ1JlbmRlclJlc3VsdCA9IGF3YWl0IHdhaXRpbmdSZW5kZXJSZXN1bHQ7XG5cbiAgICAgICAgICBpZiAocmVuZGVyQ29tcGxldGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgYXdhaXQgZmluYWxpemVSZW5kZXIod2FpdGluZ1JlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgICAgICB9LCA1KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlbmRlclJlc3VsdCA9IGF3YWl0IHJlbmRlclJlc3VsdDtcbiAgICAgICAgICByZW5kZXJDb21wbGV0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKGxvYWRpbmdUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGxvYWRpbmdUaW1lcik7XG4gICAgICAgICAgICBsb2FkaW5nVGltZXIgPSBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGF3YWl0IGZpbmFsaXplUmVuZGVyKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGF3YWl0IGhhbmRsZVJlbmRlckVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgZmluYWxpemVSZW5kZXIocmVuZGVyUmVzdWx0LCByZW5kZXJGcmFtZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGF3YWl0IGhhbmRsZVJlbmRlckVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBkZXN0cm95RnJvbURPTShfY29udGV4dCwgX25vZGUpIHtcbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0ID0gX2NvbnRleHQ7XG4gICAgbGV0IG5vZGUgPSBfbm9kZTtcbiAgICBpZiAobm9kZSA9PT0gdGhpcykge1xuICAgICAgY29udGV4dCA9IHRoaXMucGFyZW50Tm9kZS5jb250ZXh0O1xuICAgICAgbm9kZSA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJlbnROb2RlLmRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpO1xuICB9XG5cbiAgYXN5bmMgc3luY0RPTShfY29udGV4dCwgX25vZGUpIHtcbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0ID0gX2NvbnRleHQ7XG4gICAgbGV0IG5vZGUgPSBfbm9kZTtcbiAgICBpZiAobm9kZSA9PT0gdGhpcykge1xuICAgICAgY29udGV4dCA9IHRoaXMucGFyZW50Tm9kZS5jb250ZXh0O1xuICAgICAgbm9kZSA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJlbnROb2RlLnN5bmNET00oY29udGV4dCwgbm9kZSk7XG4gIH1cbn1cbiIsImltcG9ydCB7XG4gIEppYnMsXG4gIFJlbmRlcmVycyxcbn0gZnJvbSAnamlicyc7XG5cbmltcG9ydCB7IEZyYWdtZW50Tm9kZSB9ICAgICBmcm9tICcuL2ZyYWdtZW50LW5vZGUuanMnO1xuaW1wb3J0IHsgVGV4dE5vZGUgfSAgICAgICAgIGZyb20gJy4vdGV4dC1ub2RlLmpzJztcbmltcG9ydCB7IE5hdGl2ZU5vZGUgfSAgICAgICBmcm9tICcuL25hdGl2ZS1ub2RlLmpzJztcbmltcG9ydCB7IFBvcnRhbE5vZGUgfSAgICAgICBmcm9tICcuL3BvcnRhbC1ub2RlLmpzJztcbmltcG9ydCB7IENvbXBvbmVudE5vZGUgfSAgICBmcm9tICcuL2NvbXBvbmVudC1ub2RlLmpzJztcblxuY29uc3Qge1xuICBSZW5kZXJlcixcbn0gPSBSZW5kZXJlcnM7XG5cbmNvbnN0IHtcbiAgSklCX1BST1hZLFxuICBKSUJfUkFXX1RFWFQsXG59ID0gSmlicztcblxuY29uc3QgU0tJUF9VUERBVEVTID0gdHJ1ZTtcblxuZXhwb3J0IGNsYXNzIERPTVJlbmRlcmVyIGV4dGVuZHMgUmVuZGVyZXIge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDk7XG5cbiAgc3RhdGljIEZyYWdtZW50Tm9kZSA9IEZyYWdtZW50Tm9kZTtcblxuICBzdGF0aWMgVGV4dE5vZGUgPSBUZXh0Tm9kZTtcblxuICBzdGF0aWMgTmF0aXZlTm9kZSA9IE5hdGl2ZU5vZGU7XG5cbiAgc3RhdGljIFBvcnRhbE5vZGUgPSBQb3J0YWxOb2RlO1xuXG4gIHN0YXRpYyBDb21wb25lbnROb2RlID0gQ29tcG9uZW50Tm9kZTtcblxuICBjb25zdHJ1Y3Rvcihyb290RWxlbWVudFNlbGVjdG9yLCBvcHRpb25zKSB7XG4gICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAncm9vdE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ2ppYic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgeyBUeXBlOiByb290RWxlbWVudFNlbGVjdG9yLCBwcm9wczoge30sIGNoaWxkcmVuOiBbXSB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGlzUG9ydGFsTm9kZSh0eXBlKSB7XG4gICAgcmV0dXJuICgvW15hLXpBLVowLTk6XS8pLnRlc3QodHlwZSk7XG4gIH1cblxuICBjb25zdHJ1Y3ROb2RlRnJvbUppYihqaWIsIHBhcmVudCwgY29udGV4dCkge1xuICAgIGxldCB7IFR5cGUgfSA9IGppYjtcbiAgICBpZiAodHlwZW9mIFR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5Db21wb25lbnROb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKHRoaXMuaXNQb3J0YWxOb2RlKFR5cGUpKVxuICAgICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuUG9ydGFsTm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQsIGppYik7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5OYXRpdmVOb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9IGVsc2UgaWYgKFR5cGUgPT0gbnVsbCB8fCBUeXBlID09PSBKSUJfUFJPWFkpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5GcmFnbWVudE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0LCBqaWIpO1xuICAgIH0gZWxzZSBpZiAoVHlwZSA9PT0gSklCX1JBV19URVhUKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuVGV4dE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0LCBqaWIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5yb290Tm9kZSkge1xuICAgICAgYXdhaXQgdGhpcy5yb290Tm9kZS5kZXN0cm95KCk7XG4gICAgICB0aGlzLnJvb3ROb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgc3VwZXIuZGVzdHJveSh0cnVlKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcihjaGlsZHJlbikge1xuICAgIGlmICghY2hpbGRyZW4pXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OnJlbmRlcjogQSBqaWIgbXVzdCBiZSBwcm92aWRlZC5gKTtcblxuICAgIHRoaXMudXBkYXRlSmliKHtcbiAgICAgIC4uLnRoaXMuamliLFxuICAgICAgY2hpbGRyZW4sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3VwZXIucmVuZGVyKCk7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuICAgIGxldCByb290Tm9kZSA9IHRoaXMucm9vdE5vZGU7XG4gICAgbGV0IGZyYWdtZW50SmliID0geyBUeXBlOiBKSUJfUFJPWFksIHByb3BzOiB7fSwgY2hpbGRyZW46IHRoaXMuamliIH07XG5cbiAgICBpZiAoIXJvb3ROb2RlKVxuICAgICAgcm9vdE5vZGUgPSB0aGlzLnJvb3ROb2RlID0gdGhpcy5jb25zdHJ1Y3ROb2RlRnJvbUppYih0aGlzLmppYiwgdGhpcywgdGhpcy5jb250ZXh0KTtcbiAgICBlbHNlXG4gICAgICByb290Tm9kZS51cGRhdGVKaWIoZnJhZ21lbnRKaWIpO1xuXG4gICAgYXdhaXQgcm9vdE5vZGUucmVuZGVyKCk7XG4gICAgaWYgKHJlbmRlckZyYW1lID49IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzLnJvb3ROb2RlKTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAobm9kZSA9PT0gdGhpcykge1xuICAgICAgaWYgKCF0aGlzLnJvb3ROb2RlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRlc3Ryb3lOb2RlKGNvbnRleHQsIHRoaXMucm9vdE5vZGUpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmRlc3Ryb3lOb2RlKGNvbnRleHQsIG5vZGUpO1xuICB9XG5cbiAgYXN5bmMgc3luY0RPTShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG5vZGUgPT09IHRoaXMpIHtcbiAgICAgIGlmICghdGhpcy5yb290Tm9kZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5zeW5jTm9kZShjb250ZXh0LCB0aGlzLnJvb3ROb2RlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zeW5jTm9kZShjb250ZXh0LCBub2RlKTtcbiAgfVxuXG4gIGFzeW5jIGFkZE5vZGUoY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGF3YWl0IHRoaXMuYXR0YWNoQ2hpbGRyZW4oY29udGV4dCwgbm9kZSwgZmFsc2UpO1xuXG4gICAgLy8gVGVsbCBvdXIgcGFyZW50IHRvIHJlb3JkZXIgaXRzZWxmXG4gICAgbGV0IHBhcmVudE5vZGUgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgIC8vIFNraXAgdXBkYXRlcywgYXMgd2UgYXJlbid0IG1vZGlmeWluZyBvdGhlciBjaGlsZHJlbi5cbiAgICAgIC8vIEp1c3QgZW5zdXJlIHByb3BlciBjaGlsZCBvcmRlci5cbiAgICAgIGF3YWl0IHRoaXMuYXR0YWNoQ2hpbGRyZW4oY29udGV4dCwgcGFyZW50Tm9kZSwgU0tJUF9VUERBVEVTKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGNvbnN0cnVjdE5hdGl2ZUVsZW1lbnRGcm9tTm9kZShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG5vZGUuVFlQRSA9PT0gTmF0aXZlTm9kZS5UWVBFKVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFRleHROb2RlLlRZUEUpXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVUZXh0RWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFBvcnRhbE5vZGUuVFlQRSB8fCBub2RlLlRZUEUgPT09IERPTVJlbmRlcmVyLlRZUEUpXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTo6Y29uc3RydWN0TmF0aXZlRWxlbWVudEZyb21Ob2RlOiBVbnN1cHBvcnRlZCB2aXJ0dWFsIGVsZW1lbnQgdHlwZSBkZXRlY3RlZDogJHtub2RlLlRZUEV9YCk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVOb2RlKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgcmVzdWx0O1xuXG4gICAgaWYgKG5vZGUuVFlQRSA9PT0gTmF0aXZlTm9kZS5UWVBFKVxuICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy51cGRhdGVOYXRpdmVFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuVFlQRSA9PT0gVGV4dE5vZGUuVFlQRSlcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMudXBkYXRlVGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBQb3J0YWxOb2RlLlRZUEUgfHwgbm9kZS5UWVBFID09PSBET01SZW5kZXJlci5UWVBFKVxuICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy51cGRhdGVQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTo6c3luY05vZGU6IFVuc3VwcG9ydGVkIHZpcnR1YWwgZWxlbWVudCB0eXBlIGRldGVjdGVkOiAke25vZGUuVFlQRX1gKTtcblxuICAgIGF3YWl0IHRoaXMuYXR0YWNoQ2hpbGRyZW4oY29udGV4dCwgbm9kZSwgdHJ1ZSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3luY05vZGUoY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBuYXRpdmVFbGVtZW50ID0gKG5vZGUgJiYgbm9kZS5uYXRpdmVFbGVtZW50KTtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgIG5hdGl2ZUVsZW1lbnQgPSBhd2FpdCB0aGlzLmNvbnN0cnVjdE5hdGl2ZUVsZW1lbnRGcm9tTm9kZShjb250ZXh0LCBub2RlKTtcbiAgICAgIG5vZGUubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgIGxldCByZXN1bHQgPSBhd2FpdCB0aGlzLmFkZE5vZGUoY29udGV4dCwgbm9kZSk7XG5cbiAgICAgIGF3YWl0IHRoaXMudXBkYXRlTm9kZShjb250ZXh0LCBub2RlKTtcblxuICAgICAgaWYgKG5vZGUuamliICYmIG5vZGUuamliLnByb3BzICYmIHR5cGVvZiBub2RlLmppYi5wcm9wcy5yZWYgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIG5vZGUuamliLnByb3BzLnJlZi5jYWxsKG5vZGUsIG5hdGl2ZUVsZW1lbnQsIG51bGwpO1xuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gZWxzZSBpZiAobm9kZSkge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlTm9kZShjb250ZXh0LCBub2RlKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBkZXN0cm95Tm9kZShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IG5hdGl2ZUVsZW1lbnQgPSAobm9kZSAmJiBub2RlLm5hdGl2ZUVsZW1lbnQpO1xuICAgIGxldCByZXN1bHQgPSBmYWxzZTtcblxuICAgIGlmIChuYXRpdmVFbGVtZW50KSB7XG4gICAgICBpZiAobm9kZS5UWVBFID09PSBOYXRpdmVOb2RlLlRZUEUpXG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuZGVzdHJveU5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFRleHROb2RlLlRZUEUpXG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuZGVzdHJveVRleHRFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBQb3J0YWxOb2RlLlRZUEUgfHwgbm9kZS5UWVBFID09PSBET01SZW5kZXJlci5UWVBFKVxuICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLmRlc3Ryb3lQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgICAgZWxzZVxuICAgICAgICBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OnN5bmNOb2RlOiBVbnN1cHBvcnRlZCB2aXJ0dWFsIGVsZW1lbnQgdHlwZSBkZXRlY3RlZDogJHtub2RlLlRZUEV9YCk7XG4gICAgfVxuXG4gICAgaWYgKG5vZGUpXG4gICAgICBhd2FpdCB0aGlzLmRldGFjaENoaWxkcmVuKGNvbnRleHQsIG5vZGUpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZpbmROYXRpdmVFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgfVxuXG4gIGNyZWF0ZU5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICAgIHJldHVybiB7IHR5cGU6ICdlbGVtZW50JywgdmFsdWU6IG5vZGUudmFsdWUgfTtcbiAgfVxuXG4gIHVwZGF0ZU5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICB9XG5cbiAgY3JlYXRlVGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICAgIHJldHVybiB7IHR5cGU6ICd0ZXh0JywgdmFsdWU6IG5vZGUudmFsdWUgfTtcbiAgfVxuXG4gIHVwZGF0ZVRleHRFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjcmVhdGVQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgICByZXR1cm4geyB0eXBlOiAncG9ydGFsJywgdmFsdWU6IG5vZGUudmFsdWUgfTtcbiAgfVxuXG4gIHVwZGF0ZVBvcnRhbEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGRlc3Ryb3lOYXRpdmVFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgfVxuXG4gIGRlc3Ryb3lUZXh0RWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gIH1cblxuICBkZXN0cm95UG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gIH1cblxuICBmb3JjZU5hdGl2ZUVsZW1lbnRSZWZsb3coY29udGV4dCwgbm9kZSwgbmF0aXZlRWxlbWVudCkge1xuICB9XG5cbiAgYXN5bmMgYXR0YWNoQ2hpbGRyZW4oY29udGV4dCwgcGFyZW50Tm9kZSwgb3JkZXJPbmx5KSB7XG4gICAgbGV0IHBhcmVudE5hdGl2ZUVsZW1lbnQgPSAocGFyZW50Tm9kZSAmJiBwYXJlbnROb2RlLm5hdGl2ZUVsZW1lbnQpO1xuICAgIGlmICghcGFyZW50TmF0aXZlRWxlbWVudClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBuYXRpdmVQYXJlbnRDaGlsZE5vZGVzID0gQXJyYXkuZnJvbShwYXJlbnROYXRpdmVFbGVtZW50LmNoaWxkTm9kZXMpO1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgbGV0IHNraXBPcmRlcmVkTm9kZXMgPSB0cnVlO1xuXG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHBhcmVudE5vZGUuZ2V0Q2hpbGRyZW5Ob2RlcygpKSB7XG4gICAgICBsZXQgY2hpbGROYXRpdmVFbGVtZW50ID0gY2hpbGROb2RlLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICBpZiAoIWNoaWxkTmF0aXZlRWxlbWVudClcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChvcmRlck9ubHkgIT09IHRydWUpXG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlTm9kZShjb250ZXh0LCBjaGlsZE5vZGUpO1xuXG4gICAgICAvLyBQZXJmb3JtYW5jZSBib29zdFxuICAgICAgaWYgKHNraXBPcmRlcmVkTm9kZXMpIHtcbiAgICAgICAgaWYgKG5hdGl2ZVBhcmVudENoaWxkTm9kZXNbaW5kZXgrK10gPT09IGNoaWxkTmF0aXZlRWxlbWVudClcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNraXBPcmRlcmVkTm9kZXMgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgcGFyZW50TmF0aXZlRWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZE5hdGl2ZUVsZW1lbnQpO1xuICAgICAgdGhpcy5mb3JjZU5hdGl2ZUVsZW1lbnRSZWZsb3coY29udGV4dCwgY2hpbGROb2RlLCBjaGlsZE5hdGl2ZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZGV0YWNoQ2hpbGRyZW4oY29udGV4dCwgcGFyZW50Tm9kZSkge1xuICAgIGxldCBwYXJlbnROYXRpdmVFbGVtZW50ID0gKHBhcmVudE5vZGUgJiYgcGFyZW50Tm9kZS5uYXRpdmVFbGVtZW50KTtcbiAgICBpZiAoIXBhcmVudE5hdGl2ZUVsZW1lbnQpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgZGVzdHJveVByb21pc2VzID0gW107XG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHBhcmVudE5vZGUuZ2V0Q2hpbGRyZW5Ob2RlcygpKVxuICAgICAgZGVzdHJveVByb21pc2VzLnB1c2godGhpcy5kZXN0cm95Tm9kZShjb250ZXh0LCBjaGlsZE5vZGUpKTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKGRlc3Ryb3lQcm9taXNlcyk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgSmlicyxcbiAgUmVuZGVyZXJzLFxuICBVdGlscyxcbiAgZGVhZGJlZWYsXG59IGZyb20gJ2ppYnMnO1xuXG5jb25zdCB7XG4gIGlzSmliaXNoLFxuICBjb25zdHJ1Y3RKaWIsXG4gIEpJQl9QUk9YWSxcbiAgSklCX1JBV19URVhULFxuICBKSUJfQ0hJTERfSU5ERVhfUFJPUCxcbn0gPSBKaWJzO1xuXG5jb25zdCB7XG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuZXhwb3J0IGNsYXNzIEZyYWdtZW50Tm9kZSBleHRlbmRzIFJvb3ROb2RlIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgc3RhdGljIFRZUEUgPSAxMTtcblxuICBnZXRUaGlzTm9kZU9yQ2hpbGROb2RlcygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDaGlsZHJlbk5vZGVzKCk7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKCkge1xuICAgIGxldCBpbmRleE1hcCAgICA9IG5ldyBNYXAoKTtcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgbGV0IHsgY2hpbGRyZW4gfSA9ICh0aGlzLmppYiB8fCB7fSk7XG4gICAgaWYgKFV0aWxzLmluc3RhbmNlT2YoY2hpbGRyZW4sICdwcm9taXNlJykpXG4gICAgICBjaGlsZHJlbiA9IGF3YWl0IGNoaWxkcmVuO1xuXG4gICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoIXRoaXMuaXNJdGVyYWJsZUNoaWxkKGNoaWxkcmVuKSAmJiAoaXNKaWJpc2goY2hpbGRyZW4pIHx8IHRoaXMuaXNWYWxpZENoaWxkKGNoaWxkcmVuKSkpXG4gICAgICBjaGlsZHJlbiA9IFsgY2hpbGRyZW4gXTtcblxuICAgIGNvbnN0IGdldEluZGV4Rm9yVHlwZSA9IChUeXBlKSA9PiB7XG4gICAgICBsZXQgaW5kZXggPSAoaW5kZXhNYXAuZ2V0KFR5cGUpIHx8IDApICsgMTtcbiAgICAgIGluZGV4TWFwLnNldChUeXBlLCBpbmRleCk7XG5cbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9O1xuXG4gICAgbGV0IGxvb3BTdG9wcGVkID0gZmFsc2U7XG4gICAgbGV0IHByb21pc2VzID0gVXRpbHMuaXRlcmF0ZShjaGlsZHJlbiwgKHsgdmFsdWU6IF9jaGlsZCwga2V5LCBpbmRleCwgU1RPUCB9KSA9PiB7XG4gICAgICBpZiAobG9vcFN0b3BwZWQgfHwgdGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgICAgcmV0dXJuIFNUT1A7XG5cbiAgICAgIHJldHVybiAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgY2hpbGQgPSAoVXRpbHMuaW5zdGFuY2VPZihfY2hpbGQsICdwcm9taXNlJykpID8gYXdhaXQgX2NoaWxkIDogX2NoaWxkO1xuICAgICAgICBpZiAoVXRpbHMuaXNFbXB0eShjaGlsZCkgfHwgT2JqZWN0LmlzKGNoaWxkLCBOYU4pIHx8IE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSkge1xuICAgICAgICAgIGxvb3BTdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaXNKaWIgPSBpc0ppYmlzaChjaGlsZCk7XG4gICAgICAgIGxldCBjcmVhdGVkO1xuICAgICAgICBsZXQgamliO1xuXG4gICAgICAgIGlmICghaXNKaWIgJiYgdGhpcy5pc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpKSB7XG4gICAgICAgICAgamliID0ge1xuICAgICAgICAgICAgVHlwZTogICAgIEpJQl9QUk9YWSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBjaGlsZCxcbiAgICAgICAgICAgIHByb3BzOiAgICB7XG4gICAgICAgICAgICAgIGtleTogYEBqaWIvaW50ZXJuYWxfZnJhZ21lbnRfJHtnZXRJbmRleEZvclR5cGUoSklCX1BST1hZKX1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKCFpc0ppYiAmJiB0aGlzLmlzVmFsaWRDaGlsZChjaGlsZCkpIHtcbiAgICAgICAgICBjaGlsZCA9ICh0eXBlb2YgY2hpbGQudmFsdWVPZiA9PT0gJ2Z1bmN0aW9uJykgPyBjaGlsZC52YWx1ZU9mKCkgOiBjaGlsZDtcbiAgICAgICAgICBqaWIgPSB7XG4gICAgICAgICAgICBUeXBlOiAgICAgSklCX1JBV19URVhULFxuICAgICAgICAgICAgY2hpbGRyZW46IGNoaWxkLFxuICAgICAgICAgICAgcHJvcHM6ICAgIHtcbiAgICAgICAgICAgICAga2V5OiBgQGppYi9pbnRlcm5hbF90ZXh0XyR7Z2V0SW5kZXhGb3JUeXBlKEpJQl9SQVdfVEVYVCl9YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChpc0ppYikge1xuICAgICAgICAgIGppYiA9IGNvbnN0cnVjdEppYihjaGlsZCk7XG4gICAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2YoamliLCAncHJvbWlzZScpKVxuICAgICAgICAgICAgamliID0gYXdhaXQgamliO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpIHtcbiAgICAgICAgICBsb29wU3RvcHBlZCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHsgVHlwZSwgcHJvcHMgfSA9IGppYjtcbiAgICAgICAgbGV0IGxvY2FsS2V5O1xuICAgICAgICBpZiAoaW5kZXggIT09IGtleSkgLy8gSW5kZXggaXMgYW4gaW50ZWdlciwgYW5kIGtleSBpcyBhIHN0cmluZywgbWVhbmluZyB0aGlzIGlzIGFuIG9iamVjdFxuICAgICAgICAgIGxvY2FsS2V5ID0ga2V5O1xuICAgICAgICBlbHNlXG4gICAgICAgICAgbG9jYWxLZXkgPSAocHJvcHMua2V5ID09IG51bGwgfHwgT2JqZWN0LmlzKHByb3BzLmtleSwgTmFOKSB8fCBPYmplY3QuaXMocHJvcHMua2V5LCBJbmZpbml0eSkpID8gYEBqaWIvaW50ZXJuYWxfa2V5XyR7Z2V0SW5kZXhGb3JUeXBlKFR5cGUpfWAgOiBwcm9wcy5rZXk7XG5cbiAgICAgICAgcHJvcHNbSklCX0NISUxEX0lOREVYX1BST1BdID0gaW5kZXg7XG4gICAgICAgIHByb3BzLmtleSA9IGxvY2FsS2V5O1xuICAgICAgICBqaWIucHJvcHMgPSBwcm9wcztcblxuICAgICAgICBsZXQgY2FjaGVLZXkgPSBkZWFkYmVlZihUeXBlLCBwcm9wcy5rZXkpO1xuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuZ2V0Q2hpbGQoY2FjaGVLZXkpO1xuXG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgIGNyZWF0ZWQgPSB0cnVlO1xuICAgICAgICAgIG5vZGUgPSB0aGlzLnJlbmRlcmVyLmNvbnN0cnVjdE5vZGVGcm9tSmliKGppYiwgdGhpcywgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjcmVhdGVkID0gZmFsc2U7XG4gICAgICAgICAgbm9kZS51cGRhdGVKaWIoamliKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IG5vZGUucmVuZGVyKCk7XG5cbiAgICAgICAgcmV0dXJuIHsgbm9kZSwgY2FjaGVLZXksIGNyZWF0ZWQgfTtcbiAgICAgIH0pKCk7XG4gICAgfSk7XG5cbiAgICBsZXQgcmVuZGVyUmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICByZW5kZXJSZXN1bHRzID0gcmVuZGVyUmVzdWx0cy5maWx0ZXIoKHJlc3VsdCkgPT4gISFyZXN1bHQpO1xuXG4gICAgbGV0IGRlc3Ryb3lQcm9taXNlcyA9IFtdO1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSByZW5kZXJSZXN1bHRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHJlbmRlclJlc3VsdHNbaV07XG4gICAgICAgIGxldCB7IG5vZGUsIGNyZWF0ZWQgfSA9IHJlc3VsdDtcblxuICAgICAgICBpZiAoY3JlYXRlZCAmJiBub2RlKSB7XG4gICAgICAgICAgLy8gRGVzdHJveSBub2RlcyBzaW5jZSB0aGlzIHJlbmRlciB3YXMgcmVqZWN0ZWQuXG4gICAgICAgICAgLy8gQnV0IG9ubHkgbm9kZXMgdGhhdCB3ZXJlIGp1c3QgY3JlYXRlZC4uLlxuICAgICAgICAgIC8vIGFzIGV4aXN0aW5nIG5vZGVzIG1pZ2h0IHN0aWxsIG5lZWQgdG8gZXhpc3QuXG4gICAgICAgICAgZGVzdHJveVByb21pc2VzLnB1c2gobm9kZS5kZXN0cm95KCkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChkZXN0cm95UHJvbWlzZXMubGVuZ3RoID4gMClcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEFkZCBuZXcgY2hpbGRyZW4sIGFuZCBidWlsZCBhIG1hcFxuICAgIC8vIG9mIGNoaWxkcmVuIGp1c3QgYWRkZWQuXG4gICAgbGV0IGFkZGVkQ2hpbGRyZW4gPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgcmVuZGVyUmVzdWx0IG9mIHJlbmRlclJlc3VsdHMpIHtcbiAgICAgIGxldCB7IGNhY2hlS2V5LCBub2RlIH0gPSByZW5kZXJSZXN1bHQ7XG5cbiAgICAgIGFkZGVkQ2hpbGRyZW4uc2V0KGNhY2hlS2V5LCBub2RlKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgbm9kZXMgbm8gbG9uZ2VyIGluIHRoZSBmcmFnbWVudFxuICAgIGxldCBjaGlsZHJlblRvRGVzdHJveSA9IFtdO1xuICAgIGZvciAobGV0IFsgY2FjaGVLZXksIGNoaWxkTm9kZSBdIG9mIHRoaXMuZ2V0Q2hpbGRyZW4oKSkge1xuICAgICAgbGV0IGhhc0NoaWxkID0gYWRkZWRDaGlsZHJlbi5oYXMoY2FjaGVLZXkpO1xuICAgICAgaWYgKCFoYXNDaGlsZCkge1xuICAgICAgICAvLyBUaGlzIG5vZGUgd2FzIGRlc3Ryb3llZFxuICAgICAgICBjaGlsZHJlblRvRGVzdHJveS5wdXNoKGNoaWxkTm9kZSk7XG4gICAgICAgIHRoaXMucmVtb3ZlQ2hpbGQoY2hpbGROb2RlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbGVhciBjaGlsZHJlbiBhbmQgcmVhZGQgdGhlbVxuICAgIC8vIHRvIGtlZXAgdGhlIHJlbmRlciBvcmRlciBpbnRhY3RcbiAgICB0aGlzLmNsZWFyQ2hpbGRyZW4oKTtcblxuICAgIGZvciAobGV0IFsgY2FjaGVLZXksIGNoaWxkTm9kZSBdIG9mIGFkZGVkQ2hpbGRyZW4pXG4gICAgICB0aGlzLmFkZENoaWxkKGNoaWxkTm9kZSwgY2FjaGVLZXkpO1xuXG4gICAgYWRkZWRDaGlsZHJlbi5jbGVhcigpO1xuXG4gICAgLy8gTm93IHRoYXQgY2hpbGRyZW4gdG8gZGVzdHJveSBoYXZlXG4gICAgLy8gYmVlbiBjb2xsZWN0ZWQsIHBsZWFzZSBkZXN0cm95IHRoZW1cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBjaGlsZHJlblRvRGVzdHJveS5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgY2hpbGROb2RlID0gY2hpbGRyZW5Ub0Rlc3Ryb3lbaV07XG4gICAgICBkZXN0cm95UHJvbWlzZXMucHVzaChjaGlsZE5vZGUuZGVzdHJveSgpKTtcbiAgICB9XG5cbiAgICBpZiAoZGVzdHJveVByb21pc2VzLmxlbmd0aCA+IDApXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChkZXN0cm95UHJvbWlzZXMpO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveUZyb21ET00oY29udGV4dCwgbm9kZSkge1xuICAgIC8vIEZyYWdtZW50cyBjYW4gbm90IGJlIGRlc3Ryb3llZCBmcm9tIHRoZSBET01cbiAgICBpZiAobm9kZSA9PT0gdGhpcylcbiAgICAgIHJldHVybjtcblxuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyZW50Tm9kZS5kZXN0cm95RnJvbURPTShjb250ZXh0LCBub2RlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bmNET00oX2NvbnRleHQsIF9ub2RlKSB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgY29udGV4dCA9IF9jb250ZXh0O1xuICAgIGxldCBub2RlID0gX25vZGU7XG4gICAgaWYgKG5vZGUgPT09IHRoaXMpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzLnBhcmVudE5vZGUuY29udGV4dDtcbiAgICAgIG5vZGUgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyZW50Tm9kZS5zeW5jRE9NKGNvbnRleHQsIG5vZGUpO1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBKaWJzLFxuICBSZW5kZXJlcnMsXG59IGZyb20gJ2ppYnMnO1xuXG5jb25zdCB7XG4gIEpJQl9QUk9YWSxcbn0gPSBKaWJzO1xuXG5jb25zdCB7XG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuZXhwb3J0IGNsYXNzIE5hdGl2ZU5vZGUgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIHN0YXRpYyBUWVBFID0gMTtcblxuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnZnJhZ21lbnROb2RlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG4gICAgYXdhaXQgdGhpcy5kZXN0cm95RnJhZ21lbnROb2RlKCk7XG5cbiAgICByZXR1cm4gYXdhaXQgc3VwZXIuZGVzdHJveSh0cnVlKTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcmFnbWVudE5vZGUoKSB7XG4gICAgaWYgKCF0aGlzLmZyYWdtZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMucmVtb3ZlQ2hpbGQodGhpcy5mcmFnbWVudE5vZGUpO1xuXG4gICAgYXdhaXQgdGhpcy5mcmFnbWVudE5vZGUuZGVzdHJveSgpO1xuICAgIHRoaXMuZnJhZ21lbnROb2RlID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIF9yZW5kZXIoKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIGxldCB7XG4gICAgICBUeXBlLFxuICAgICAgcHJvcHMsXG4gICAgICBjaGlsZHJlbixcbiAgICB9ID0gKHRoaXMuamliIHx8IHt9KTtcblxuICAgIGlmICghVHlwZSlcbiAgICAgIHJldHVybjtcblxuICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3BzLCAnaW5uZXJIVE1MJykpIHtcbiAgICAgIGxldCBmcmFnbWVudEppYiA9IHsgVHlwZTogSklCX1BST1hZLCBwcm9wczoge30sIGNoaWxkcmVuIH07XG4gICAgICBsZXQgZnJhZ21lbnROb2RlID0gdGhpcy5mcmFnbWVudE5vZGU7XG5cbiAgICAgIGlmICghZnJhZ21lbnROb2RlKSB7XG4gICAgICAgIGZyYWdtZW50Tm9kZSA9IHRoaXMuZnJhZ21lbnROb2RlID0gdGhpcy5yZW5kZXJlci5jb25zdHJ1Y3ROb2RlRnJvbUppYihmcmFnbWVudEppYiwgdGhpcywgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChmcmFnbWVudE5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5mcmFnbWVudE5vZGUudXBkYXRlSmliKGZyYWdtZW50SmliKTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgZnJhZ21lbnROb2RlLnJlbmRlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCB0aGlzLmRlc3Ryb3lGcmFnbWVudE5vZGUoKTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IE5hdGl2ZU5vZGUgfSBmcm9tICcuL25hdGl2ZS1ub2RlLmpzJztcblxuZXhwb3J0IGNsYXNzIFBvcnRhbE5vZGUgZXh0ZW5kcyBOYXRpdmVOb2RlIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgc3RhdGljIFRZUEUgPSAxNTtcbn1cbiIsImltcG9ydCB7XG4gIFJlbmRlcmVycyxcbn0gZnJvbSAnamlicyc7XG5cbmNvbnN0IHtcbiAgUm9vdE5vZGUsXG59ID0gUmVuZGVyZXJzO1xuXG5leHBvcnQgY2xhc3MgVGV4dE5vZGUgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gMztcblxuICBzdGF0aWMgSEFTX0NPTlRFWFQgPSBmYWxzZTtcbn1cbiIsIi8qKioqKiovIHZhciBfX3dlYnBhY2tfbW9kdWxlc19fID0gKHtcblxuLyoqKi8gXCIuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3VudXNlZF93ZWJwYWNrX2V4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuLy8gQ29weXJpZ2h0IDIwMjIgV3lhdHQgR3JlZW53YXlcblxuXG5cbmNvbnN0IHRoaXNHbG9iYWwgPSAoKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IF9fd2VicGFja19yZXF1aXJlX18uZykgfHwgdGhpcztcbmNvbnN0IERFQURCRUVGX1JFRl9NQVBfS0VZID0gU3ltYm9sLmZvcignQEBkZWFkYmVlZlJlZk1hcCcpO1xuY29uc3QgVU5JUVVFX0lEX1NZTUJPTCA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZVbmlxdWVJRCcpO1xuY29uc3QgcmVmTWFwID0gKHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKSA/IHRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldIDogbmV3IFdlYWtNYXAoKTtcbmNvbnN0IGlkSGVscGVycyA9IFtdO1xuXG5pZiAoIXRoaXNHbG9iYWxbREVBREJFRUZfUkVGX01BUF9LRVldKVxuICB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA9IHJlZk1hcDtcblxubGV0IHV1aWRDb3VudGVyID0gMG47XG5cbmZ1bmN0aW9uIGdldEhlbHBlckZvclZhbHVlKHZhbHVlKSB7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkSGVscGVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IHsgaGVscGVyLCBnZW5lcmF0b3IgfSA9IGlkSGVscGVyc1tpXTtcbiAgICBpZiAoaGVscGVyKHZhbHVlKSlcbiAgICAgIHJldHVybiBnZW5lcmF0b3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gYW55dGhpbmdUb0lEKF9hcmcsIF9hbHJlYWR5VmlzaXRlZCkge1xuICBsZXQgYXJnID0gX2FyZztcbiAgaWYgKGFyZyBpbnN0YW5jZW9mIE51bWJlciB8fCBhcmcgaW5zdGFuY2VvZiBTdHJpbmcgfHwgYXJnIGluc3RhbmNlb2YgQm9vbGVhbilcbiAgICBhcmcgPSBhcmcudmFsdWVPZigpO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgYXJnO1xuXG4gIGlmICh0eXBlT2YgPT09ICdudW1iZXInICYmIGFyZyA9PT0gMCkge1xuICAgIGlmIChPYmplY3QuaXMoYXJnLCAtMCkpXG4gICAgICByZXR1cm4gJ251bWJlcjotMCc7XG5cbiAgICByZXR1cm4gJ251bWJlcjorMCc7XG4gIH1cblxuICBpZiAodHlwZU9mID09PSAnc3ltYm9sJylcbiAgICByZXR1cm4gYHN5bWJvbDoke2FyZy50b1N0cmluZygpfWA7XG5cbiAgaWYgKGFyZyA9PSBudWxsIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicgfHwgdHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdiaWdpbnQnKSB7XG4gICAgaWYgKHR5cGVPZiA9PT0gJ251bWJlcicpXG4gICAgICByZXR1cm4gKGFyZyA8IDApID8gYG51bWJlcjoke2FyZ31gIDogYG51bWJlcjorJHthcmd9YDtcblxuICAgIGlmICh0eXBlT2YgPT09ICdiaWdpbnQnICYmIGFyZyA9PT0gMG4pXG4gICAgICByZXR1cm4gJ2JpZ2ludDorMCc7XG5cbiAgICByZXR1cm4gYCR7dHlwZU9mfToke2FyZ31gO1xuICB9XG5cbiAgbGV0IGlkSGVscGVyID0gKGlkSGVscGVycy5sZW5ndGggPiAwICYmIGdldEhlbHBlckZvclZhbHVlKGFyZykpO1xuICBpZiAoaWRIZWxwZXIpXG4gICAgcmV0dXJuIGFueXRoaW5nVG9JRChpZEhlbHBlcihhcmcpKTtcblxuICBpZiAoVU5JUVVFX0lEX1NZTUJPTCBpbiBhcmcgJiYgdHlwZW9mIGFyZ1tVTklRVUVfSURfU1lNQk9MXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uXG4gICAgaWYgKCFfYWxyZWFkeVZpc2l0ZWQgfHwgIV9hbHJlYWR5VmlzaXRlZC5oYXMoYXJnKSkge1xuICAgICAgbGV0IGFscmVhZHlWaXNpdGVkID0gX2FscmVhZHlWaXNpdGVkIHx8IG5ldyBTZXQoKTtcbiAgICAgIGFscmVhZHlWaXNpdGVkLmFkZChhcmcpO1xuICAgICAgcmV0dXJuIGFueXRoaW5nVG9JRChhcmdbVU5JUVVFX0lEX1NZTUJPTF0oKSwgYWxyZWFkeVZpc2l0ZWQpO1xuICAgIH1cbiAgfVxuXG4gIGlmICghcmVmTWFwLmhhcyhhcmcpKSB7XG4gICAgbGV0IGtleSA9IGAke3R5cGVvZiBhcmd9OiR7Kyt1dWlkQ291bnRlcn1gO1xuICAgIHJlZk1hcC5zZXQoYXJnLCBrZXkpO1xuICAgIHJldHVybiBrZXk7XG4gIH1cblxuICByZXR1cm4gcmVmTWFwLmdldChhcmcpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZigpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGRlYWRiZWVmU29ydGVkKCkge1xuICBsZXQgcGFydHMgPSBbIGFyZ3VtZW50cy5sZW5ndGggXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgcGFydHMucHVzaChhbnl0aGluZ1RvSUQoYXJndW1lbnRzW2ldKSk7XG5cbiAgcmV0dXJuIHBhcnRzLnNvcnQoKS5qb2luKCc6Jyk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlSURGb3IoaGVscGVyLCBnZW5lcmF0b3IpIHtcbiAgaWRIZWxwZXJzLnB1c2goeyBoZWxwZXIsIGdlbmVyYXRvciB9KTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlSURHZW5lcmF0b3IoaGVscGVyKSB7XG4gIGxldCBpbmRleCA9IGlkSGVscGVycy5maW5kSW5kZXgoKGl0ZW0pID0+IChpdGVtLmhlbHBlciA9PT0gaGVscGVyKSk7XG4gIGlmIChpbmRleCA8IDApXG4gICAgcmV0dXJuO1xuXG4gIGlkSGVscGVycy5zcGxpY2UoaW5kZXgsIDEpO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhkZWFkYmVlZiwge1xuICAnaWRTeW0nOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgVU5JUVVFX0lEX1NZTUJPTCxcbiAgfSxcbiAgJ3NvcnRlZCc6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICBkZWFkYmVlZlNvcnRlZCxcbiAgfSxcbiAgJ2dlbmVyYXRlSURGb3InOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZ2VuZXJhdGVJREZvcixcbiAgfSxcbiAgJ3JlbW92ZUlER2VuZXJhdG9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIHJlbW92ZUlER2VuZXJhdG9yLFxuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZGVhZGJlZWY7XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvY29tcG9uZW50LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9jb21wb25lbnQuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EUyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ29tcG9uZW50XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENvbXBvbmVudCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiRkxVU0hfVVBEQVRFX01FVEhPRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBGTFVTSF9VUERBVEVfTUVUSE9EKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJJTklUX01FVEhPRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBJTklUX01FVEhPRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiTEFTVF9SRU5ERVJfVElNRVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBMQVNUX1JFTkRFUl9USU1FKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJQRU5ESU5HX1NUQVRFX1VQREFURVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBQRU5ESU5HX1NUQVRFX1VQREFURSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUFJFVklPVVNfU1RBVEVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUFJFVklPVVNfU1RBVEUpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlFVRVVFX1VQREFURV9NRVRIT0RcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUVVFVUVfVVBEQVRFX01FVEhPRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiU0tJUF9TVEFURV9VUERBVEVTXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFNLSVBfU1RBVEVfVVBEQVRFUyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiVGVybVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBUZXJtKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJVUERBVEVfRVZFTlRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gVVBEQVRFX0VWRU5UKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9ldmVudHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXZlbnRzLmpzICovIFwiLi9saWIvZXZlbnRzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vamliLmpzICovIFwiLi9saWIvamliLmpzXCIpO1xuLyogZ2xvYmFsIEJ1ZmZlciAqL1xuXG5cblxuXG5cblxuY29uc3QgVVBEQVRFX0VWRU5UICAgICAgICAgICAgICA9ICdAamlicy9jb21wb25lbnQvZXZlbnQvdXBkYXRlJztcbmNvbnN0IFFVRVVFX1VQREFURV9NRVRIT0QgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcXVldWVVcGRhdGUnKTtcbmNvbnN0IEZMVVNIX1VQREFURV9NRVRIT0QgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvZmx1c2hVcGRhdGUnKTtcbmNvbnN0IElOSVRfTUVUSE9EICAgICAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvX19pbml0Jyk7XG5jb25zdCBTS0lQX1NUQVRFX1VQREFURVMgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3NraXBTdGF0ZVVwZGF0ZXMnKTtcbmNvbnN0IFBFTkRJTkdfU1RBVEVfVVBEQVRFICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcGVuZGluZ1N0YXRlVXBkYXRlJyk7XG5jb25zdCBMQVNUX1JFTkRFUl9USU1FICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2xhc3RSZW5kZXJUaW1lJyk7XG5jb25zdCBQUkVWSU9VU19TVEFURSAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3ByZXZpb3VzU3RhdGUnKTtcbmNvbnN0IENBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFMgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcHJldmlvdXNTdGF0ZScpO1xuXG5jb25zdCBlbGVtZW50RGF0YUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcblxuZnVuY3Rpb24gaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBOYU4pKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEJvb2xlYW4gfHwgdmFsdWUgaW5zdGFuY2VvZiBOdW1iZXIgfHwgdmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgdmFsdWU7XG4gIGlmICh0eXBlT2YgPT09ICdzdHJpbmcnIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5jbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBfZXZlbnRzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uRXZlbnRFbWl0dGVyIHtcbiAgc3RhdGljIFVQREFURV9FVkVOVCA9IFVQREFURV9FVkVOVDtcblxuICBbUVVFVUVfVVBEQVRFX01FVEhPRF0oKSB7XG4gICAgaWYgKHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXS50aGVuKHRoaXNbRkxVU0hfVVBEQVRFX01FVEhPRF0uYmluZCh0aGlzKSk7XG4gIH1cblxuICBbRkxVU0hfVVBEQVRFX01FVEhPRF0oKSB7XG4gICAgLy8gV2FzIHRoZSBzdGF0ZSB1cGRhdGUgY2FuY2VsbGVkP1xuICAgIGlmICghdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmVtaXQoVVBEQVRFX0VWRU5UKTtcblxuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdID0gbnVsbDtcbiAgfVxuXG4gIFtJTklUX01FVEhPRF0oKSB7XG4gICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gZmFsc2U7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihfamliKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIC8vIEJpbmQgYWxsIGNsYXNzIG1ldGhvZHMgdG8gXCJ0aGlzXCJcbiAgICBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5iaW5kTWV0aG9kcy5jYWxsKHRoaXMsIHRoaXMuY29uc3RydWN0b3IucHJvdG90eXBlKTtcblxuICAgIGxldCBqaWIgPSBfamliIHx8IHt9O1xuXG4gICAgY29uc3QgY3JlYXRlTmV3U3RhdGUgPSAoKSA9PiB7XG4gICAgICBsZXQgbG9jYWxTdGF0ZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAgIHJldHVybiBuZXcgUHJveHkobG9jYWxTdGF0ZSwge1xuICAgICAgICBnZXQ6ICh0YXJnZXQsIHByb3BOYW1lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wTmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogKHRhcmdldCwgcHJvcE5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgbGV0IGN1cnJlbnRWYWx1ZSA9IHRhcmdldFtwcm9wTmFtZV07XG4gICAgICAgICAgaWYgKGN1cnJlbnRWYWx1ZSA9PT0gdmFsdWUpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgIGlmICghdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdKVxuICAgICAgICAgICAgdGhpc1tRVUVVRV9VUERBVEVfTUVUSE9EXSgpO1xuXG4gICAgICAgICAgdGFyZ2V0W3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgICAgICAgIHRoaXMub25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIHZhbHVlLCBjdXJyZW50VmFsdWUpO1xuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgbGV0IHByb3BzICAgICAgID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCBqaWIucHJvcHMgfHwge30pO1xuICAgIGxldCBfbG9jYWxTdGF0ZSA9IGNyZWF0ZU5ld1N0YXRlKCk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICBbU0tJUF9TVEFURV9VUERBVEVTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgfSxcbiAgICAgIFtQRU5ESU5HX1NUQVRFX1VQREFURV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgICB9LFxuICAgICAgW0xBU1RfUkVOREVSX1RJTUVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLm5vdygpLFxuICAgICAgfSxcbiAgICAgIFtDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0sXG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmlkLFxuICAgICAgfSxcbiAgICAgICdwcm9wcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcHJvcHMsXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuY2hpbGRyZW4gfHwgW10sXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5jb250ZXh0IHx8IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgICB9LFxuICAgICAgJ3N0YXRlJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBfbG9jYWxTdGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduKF9sb2NhbFN0YXRlLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXy5yZXNvbHZlQ2hpbGRyZW4uY2FsbCh0aGlzLCBjaGlsZHJlbik7XG4gIH1cblxuICBpc0ppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uaXNKaWJpc2gpKHZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uY29uc3RydWN0SmliKSh2YWx1ZSk7XG4gIH1cblxuICBwdXNoUmVuZGVyKHJlbmRlclJlc3VsdCkge1xuICAgIHRoaXMuZW1pdChVUERBVEVfRVZFTlQsIHJlbmRlclJlc3VsdCk7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25Qcm9wVXBkYXRlZChwcm9wTmFtZSwgbmV3VmFsdWUsIG9sZFZhbHVlKSB7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgb25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgY2FwdHVyZVJlZmVyZW5jZShuYW1lLCBpbnRlcmNlcHRvckNhbGxiYWNrKSB7XG4gICAgbGV0IG1ldGhvZCA9IHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU11bbmFtZV07XG4gICAgaWYgKG1ldGhvZClcbiAgICAgIHJldHVybiBtZXRob2Q7XG5cbiAgICBtZXRob2QgPSAoX3JlZiwgcHJldmlvdXNSZWYpID0+IHtcbiAgICAgIGxldCByZWYgPSBfcmVmO1xuXG4gICAgICBpZiAodHlwZW9mIGludGVyY2VwdG9yQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJlZiA9IGludGVyY2VwdG9yQ2FsbGJhY2suY2FsbCh0aGlzLCByZWYsIHByZXZpb3VzUmVmKTtcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgICBbbmFtZV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICByZWYsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhpc1tDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXSA9IG1ldGhvZDtcblxuICAgIHJldHVybiBtZXRob2Q7XG4gIH1cblxuICBmb3JjZVVwZGF0ZSgpIHtcbiAgICB0aGlzW1FVRVVFX1VQREFURV9NRVRIT0RdKCk7XG4gIH1cblxuICBnZXRTdGF0ZShwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSkge1xuICAgIGxldCBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gc3RhdGU7XG5cbiAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihwcm9wZXJ0eVBhdGgsICdvYmplY3QnKSkge1xuICAgICAgbGV0IGtleXMgICAgICAgID0gT2JqZWN0LmtleXMocHJvcGVydHlQYXRoKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhwcm9wZXJ0eVBhdGgpKTtcbiAgICAgIGxldCBmaW5hbFN0YXRlICA9IHt9O1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGxldCBbIHZhbHVlLCBsYXN0UGFydCBdID0gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uZmV0Y2hEZWVwUHJvcGVydHkoc3RhdGUsIGtleSwgcHJvcGVydHlQYXRoW2tleV0sIHRydWUpO1xuICAgICAgICBpZiAobGFzdFBhcnQgPT0gbnVsbClcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBmaW5hbFN0YXRlW2xhc3RQYXJ0XSA9IHZhbHVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmluYWxTdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBwcm9wZXJ0eVBhdGgsIGRlZmF1bHRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgc2V0U3RhdGUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgfVxuXG4gIHNldFN0YXRlUGFzc2l2ZSh2YWx1ZSkge1xuICAgIGlmICghaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEludmFsaWQgdmFsdWUgZm9yIFwidGhpcy5zZXRTdGF0ZVBhc3NpdmVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICB0cnkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwgdmFsdWUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzW1NLSVBfU1RBVEVfVVBEQVRFU10gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRVcGRhdGUoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGRlbGV0ZSB0aGlzLnN0YXRlO1xuICAgIGRlbGV0ZSB0aGlzLnByb3BzO1xuICAgIGRlbGV0ZSB0aGlzLmNvbnRleHQ7XG4gICAgZGVsZXRlIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU107XG4gICAgdGhpcy5jbGVhckFsbERlYm91bmNlcygpO1xuICB9XG5cbiAgcmVuZGVyV2FpdGluZygpIHtcbiAgfVxuXG4gIHJlbmRlcihjaGlsZHJlbikge1xuICAgIHJldHVybiBjaGlsZHJlbjtcbiAgfVxuXG4gIHVwZGF0ZWQoKSB7XG4gIH1cblxuICBjb21iaW5lV2l0aChzZXAsIC4uLmFyZ3MpIHtcbiAgICBsZXQgZmluYWxBcmdzID0gbmV3IFNldCgpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3MubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGFyZyA9IGFyZ3NbaV07XG4gICAgICBpZiAoIWFyZylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGFyZywgJ3N0cmluZycpKSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSBhcmcuc3BsaXQoc2VwKS5maWx0ZXIoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaXNOb3RFbXB0eSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLmZpbHRlcigodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgaWYgKCFfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKHZhbHVlLCAnc3RyaW5nJykpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaXNOb3RFbXB0eSh2YWx1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGZpbmFsQXJncy5hZGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YoYXJnLCAnb2JqZWN0JykpIHtcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhhcmcpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgPSBrZXlzW2ldO1xuICAgICAgICAgIGxldCB2YWx1ZSA9IGFyZ1trZXldO1xuXG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgZmluYWxBcmdzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmluYWxBcmdzLmFkZChrZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIEFycmF5LmZyb20oZmluYWxBcmdzKS5qb2luKHNlcCB8fCAnJyk7XG4gIH1cblxuICBjbGFzc2VzKC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5jb21iaW5lV2l0aCgnICcsIC4uLmFyZ3MpO1xuICB9XG5cbiAgZXh0cmFjdENoaWxkcmVuKF9wYXR0ZXJucywgY2hpbGRyZW4sIF9vcHRpb25zKSB7XG4gICAgbGV0IG9wdGlvbnMgICA9IF9vcHRpb25zIHx8IHt9O1xuICAgIGxldCBleHRyYWN0ZWQgPSB7fTtcbiAgICBsZXQgcGF0dGVybnMgID0gX3BhdHRlcm5zO1xuICAgIGxldCBpc0FycmF5ICAgPSBBcnJheS5pc0FycmF5KHBhdHRlcm5zKTtcblxuICAgIGNvbnN0IGlzTWF0Y2ggPSAoamliKSA9PiB7XG4gICAgICBsZXQgamliVHlwZSA9IGppYi5UeXBlO1xuICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YoamliVHlwZSwgJ3N0cmluZycpKVxuICAgICAgICBqaWJUeXBlID0gamliVHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBwYXR0ZXJucy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1tpXTtcbiAgICAgICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihwYXR0ZXJuLCAnc3RyaW5nJykpXG4gICAgICAgICAgICBwYXR0ZXJuID0gcGF0dGVybi50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKGppYlR5cGUgIT09IHBhdHRlcm4pXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIGlmIChleHRyYWN0ZWRbcGF0dGVybl0gJiYgb3B0aW9ucy5tdWx0aXBsZSkge1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV4dHJhY3RlZFtwYXR0ZXJuXSkpXG4gICAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IFsgZXh0cmFjdGVkW3BhdHRlcm5dIF07XG5cbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXS5wdXNoKGppYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IGppYjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXR0ZXJucyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBrZXkgICAgID0ga2V5c1tpXTtcbiAgICAgICAgICBsZXQgcGF0dGVybiA9IHBhdHRlcm5zW2tleV07XG4gICAgICAgICAgbGV0IHJlc3VsdDtcblxuICAgICAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKHBhdHRlcm4sIFJlZ0V4cCkpXG4gICAgICAgICAgICByZXN1bHQgPSBwYXR0ZXJuLnRlc3QoamliVHlwZSk7XG4gICAgICAgICAgZWxzZSBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihwYXR0ZXJuLCAnc3RyaW5nJykpXG4gICAgICAgICAgICByZXN1bHQgPSAocGF0dGVybi50b0xvd2VyQ2FzZSgpID09PSBqaWJUeXBlKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXN1bHQgPSAocGF0dGVybiA9PT0gamliVHlwZSk7XG5cbiAgICAgICAgICBpZiAoIXJlc3VsdClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgaWYgKGV4dHJhY3RlZFtwYXR0ZXJuXSAmJiBvcHRpb25zLm11bHRpcGxlKSB7XG4gICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXh0cmFjdGVkW3BhdHRlcm5dKSlcbiAgICAgICAgICAgICAgZXh0cmFjdGVkW3BhdHRlcm5dID0gWyBleHRyYWN0ZWRbcGF0dGVybl0gXTtcblxuICAgICAgICAgICAgZXh0cmFjdGVkW3BhdHRlcm5dLnB1c2goamliKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXh0cmFjdGVkW3BhdHRlcm5dID0gamliO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgZXh0cmFjdGVkLnJlbWFpbmluZ0NoaWxkcmVuID0gY2hpbGRyZW4uZmlsdGVyKChqaWIpID0+ICFpc01hdGNoKGppYikpO1xuICAgIHJldHVybiBleHRyYWN0ZWQ7XG4gIH1cblxuICBtYXBDaGlsZHJlbihwYXR0ZXJucywgX2NoaWxkcmVuKSB7XG4gICAgbGV0IGNoaWxkcmVuID0gKCFBcnJheS5pc0FycmF5KF9jaGlsZHJlbikpID8gWyBfY2hpbGRyZW4gXSA6IF9jaGlsZHJlbjtcblxuICAgIHJldHVybiBjaGlsZHJlbi5tYXAoKGppYikgPT4ge1xuICAgICAgaWYgKCFqaWIpXG4gICAgICAgIHJldHVybiBqaWI7XG5cbiAgICAgIGxldCBqaWJUeXBlID0gamliLlR5cGU7XG4gICAgICBpZiAoIV91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YoamliVHlwZSwgJ3N0cmluZycpKVxuICAgICAgICByZXR1cm4gamliO1xuXG4gICAgICBqaWJUeXBlID0gamliVHlwZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKHBhdHRlcm5zKTtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICBsZXQga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKGtleS50b0xvd2VyQ2FzZSgpICE9PSBqaWJUeXBlKVxuICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgIGxldCBtZXRob2QgPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICBpZiAoIW1ldGhvZClcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICByZXR1cm4gbWV0aG9kLmNhbGwodGhpcywgamliLCBpLCBjaGlsZHJlbik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBqaWI7XG4gICAgfSk7XG4gIH1cblxuICBkZWJvdW5jZShmdW5jLCB0aW1lLCBfaWQpIHtcbiAgICBjb25zdCBjbGVhclBlbmRpbmdUaW1lb3V0ID0gKCkgPT4ge1xuICAgICAgaWYgKHBlbmRpbmdUaW1lciAmJiBwZW5kaW5nVGltZXIudGltZW91dCkge1xuICAgICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVyLnRpbWVvdXQpO1xuICAgICAgICBwZW5kaW5nVGltZXIudGltZW91dCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBpZCA9ICghX2lkKSA/ICgnJyArIGZ1bmMpIDogX2lkO1xuICAgIGlmICghdGhpcy5kZWJvdW5jZVRpbWVycykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdkZWJvdW5jZVRpbWVycycsIHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF07XG4gICAgaWYgKCFwZW5kaW5nVGltZXIpXG4gICAgICBwZW5kaW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzW2lkXSA9IHt9O1xuXG4gICAgcGVuZGluZ1RpbWVyLmZ1bmMgPSBmdW5jO1xuICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcblxuICAgIHZhciBwcm9taXNlID0gcGVuZGluZ1RpbWVyLnByb21pc2U7XG4gICAgaWYgKCFwcm9taXNlIHx8ICFwcm9taXNlLmlzUGVuZGluZygpKSB7XG4gICAgICBsZXQgc3RhdHVzID0gJ3BlbmRpbmcnO1xuICAgICAgbGV0IHJlc29sdmU7XG5cbiAgICAgIHByb21pc2UgPSBwZW5kaW5nVGltZXIucHJvbWlzZSA9IG5ldyBQcm9taXNlKChfcmVzb2x2ZSkgPT4ge1xuICAgICAgICByZXNvbHZlID0gX3Jlc29sdmU7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS5yZXNvbHZlID0gKCkgPT4ge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSAncGVuZGluZycpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHN0YXR1cyA9ICdmdWxmaWxsZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lci5mdW5jID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgdmFyIHJldCA9IHBlbmRpbmdUaW1lci5mdW5jLmNhbGwodGhpcyk7XG4gICAgICAgICAgaWYgKHJldCBpbnN0YW5jZW9mIFByb21pc2UgfHwgKHJldCAmJiB0eXBlb2YgcmV0LnRoZW4gPT09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgcmV0LnRoZW4oKHZhbHVlKSA9PiByZXNvbHZlKHZhbHVlKSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzb2x2ZShyZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5jYW5jZWwgPSAoKSA9PiB7XG4gICAgICAgIHN0YXR1cyA9ICdyZWplY3RlZCc7XG4gICAgICAgIGNsZWFyUGVuZGluZ1RpbWVvdXQoKTtcbiAgICAgICAgdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSBudWxsO1xuXG4gICAgICAgIHByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcHJvbWlzZS5pc1BlbmRpbmcgPSAoKSA9PiB7XG4gICAgICAgIHJldHVybiAoc3RhdHVzID09PSAncGVuZGluZycpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgIHBlbmRpbmdUaW1lci50aW1lb3V0ID0gc2V0VGltZW91dChwcm9taXNlLnJlc29sdmUsICh0aW1lID09IG51bGwpID8gMjUwIDogdGltZSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIGNsZWFyRGVib3VuY2UoaWQpIHtcbiAgICBpZiAoIXRoaXMuZGVib3VuY2VUaW1lcnMpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF07XG4gICAgaWYgKHBlbmRpbmdUaW1lciA9PSBudWxsKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKHBlbmRpbmdUaW1lci50aW1lb3V0KVxuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lci50aW1lb3V0KTtcblxuICAgIGlmIChwZW5kaW5nVGltZXIucHJvbWlzZSlcbiAgICAgIHBlbmRpbmdUaW1lci5wcm9taXNlLmNhbmNlbCgpO1xuICB9XG5cbiAgY2xlYXJBbGxEZWJvdW5jZXMoKSB7XG4gICAgbGV0IGRlYm91bmNlVGltZXJzICA9IHRoaXMuZGVib3VuY2VUaW1lcnMgfHwge307XG4gICAgbGV0IGlkcyAgICAgICAgICAgICA9IE9iamVjdC5rZXlzKGRlYm91bmNlVGltZXJzKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGlkcy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgICAgdGhpcy5jbGVhckRlYm91bmNlKGlkc1tpXSk7XG4gIH1cblxuICBnZXRFbGVtZW50RGF0YShlbGVtZW50KSB7XG4gICAgbGV0IGRhdGEgPSBlbGVtZW50RGF0YUNhY2hlLmdldChlbGVtZW50KTtcbiAgICBpZiAoIWRhdGEpIHtcbiAgICAgIGRhdGEgPSB7fTtcbiAgICAgIGVsZW1lbnREYXRhQ2FjaGUuc2V0KGVsZW1lbnQsIGRhdGEpO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgbWVtb2l6ZShmdW5jKSB7XG4gICAgbGV0IGNhY2hlSUQ7XG4gICAgbGV0IGNhY2hlZFJlc3VsdDtcblxuICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgICBsZXQgbmV3Q2FjaGVJRCA9IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oLi4uYXJncyk7XG4gICAgICBpZiAobmV3Q2FjaGVJRCAhPT0gY2FjaGVJRCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcblxuICAgICAgICBjYWNoZUlEID0gbmV3Q2FjaGVJRDtcbiAgICAgICAgY2FjaGVkUmVzdWx0ID0gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2FjaGVkUmVzdWx0O1xuICAgIH07XG4gIH1cblxuICB0b1Rlcm0odGVybSkge1xuICAgIGlmICgoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uaXNKaWJpc2gpKHRlcm0pKSB7XG4gICAgICBsZXQgamliID0gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLmNvbnN0cnVjdEppYikodGVybSk7XG5cbiAgICAgIGlmIChqaWIuVHlwZSA9PT0gVGVybSlcbiAgICAgICAgcmV0dXJuIHRlcm07XG5cbiAgICAgIGlmIChqaWIuVHlwZSAmJiBqaWIuVHlwZVtURVJNX0NPTVBPTkVOVF9UWVBFX0NIRUNLXSlcbiAgICAgICAgcmV0dXJuIHRlcm07XG5cbiAgICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uJCkoVGVybSwgamliLnByb3BzKSguLi5qaWIuY2hpbGRyZW4pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHRlcm0gPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLiQpKFRlcm0pKHRlcm0pO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXJtO1xuICB9XG59XG5cbmNvbnN0IFRFUk1fQ09NUE9ORU5UX1RZUEVfQ0hFQ0sgPSBTeW1ib2wuZm9yKCdAamlicy9pc1Rlcm0nKTtcblxuY2xhc3MgVGVybSBleHRlbmRzIENvbXBvbmVudCB7XG4gIHJlc29sdmVUZXJtKGFyZ3MpIHtcbiAgICBsZXQgdGVybVJlc29sdmVyID0gdGhpcy5jb250ZXh0Ll90ZXJtUmVzb2x2ZXI7XG4gICAgaWYgKHR5cGVvZiB0ZXJtUmVzb2x2ZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gdGVybVJlc29sdmVyLmNhbGwodGhpcywgYXJncyk7XG5cbiAgICBsZXQgY2hpbGRyZW4gPSAoYXJncy5jaGlsZHJlbiB8fCBbXSk7XG4gICAgcmV0dXJuIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdIHx8ICcnO1xuICB9XG5cbiAgcmVuZGVyKGNoaWxkcmVuKSB7XG4gICAgbGV0IHRlcm0gPSB0aGlzLnJlc29sdmVUZXJtKHsgY2hpbGRyZW4sIHByb3BzOiB0aGlzLnByb3BzIH0pO1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18uJCkoJ1NQQU4nLCB0aGlzLnByb3BzKSh0ZXJtKTtcbiAgfVxufVxuXG5UZXJtW1RFUk1fQ09NUE9ORU5UX1RZUEVfQ0hFQ0tdID0gdHJ1ZTtcblxuXG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvZXZlbnRzLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9ldmVudHMuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkV2ZW50RW1pdHRlclwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBFdmVudEVtaXR0ZXIpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbmNvbnN0IEVWRU5UX0xJU1RFTkVSUyA9IFN5bWJvbC5mb3IoJ0BqaWJzL2V2ZW50cy9saXN0ZW5lcnMnKTtcblxuY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW0VWRU5UX0xJU1RFTkVSU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBuZXcgTWFwKCksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFdmVudCBsaXN0ZW5lciBtdXN0IGJlIGEgbWV0aG9kJyk7XG5cbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcblxuICAgIGlmICghc2NvcGUpIHtcbiAgICAgIHNjb3BlID0gW107XG4gICAgICBldmVudE1hcC5zZXQoZXZlbnROYW1lLCBzY29wZSk7XG4gICAgfVxuXG4gICAgc2NvcGUucHVzaChsaXN0ZW5lcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXZlbnQgbGlzdGVuZXIgbXVzdCBiZSBhIG1ldGhvZCcpO1xuXG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgbGV0IGluZGV4ID0gc2NvcGUuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKGluZGV4ID49IDApXG4gICAgICBzY29wZS5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBpZiAoIWV2ZW50TWFwLmhhcyhldmVudE5hbWUpKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBldmVudE1hcC5zZXQoZXZlbnROYW1lLCBbXSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGVtaXQoZXZlbnROYW1lLCAuLi5hcmdzKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSB8fCBzY29wZS5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBzY29wZS5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgZXZlbnRDYWxsYmFjayA9IHNjb3BlW2ldO1xuICAgICAgZXZlbnRDYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG9uY2UoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGxldCBmdW5jID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMub2ZmKGV2ZW50TmFtZSwgZnVuYyk7XG4gICAgICByZXR1cm4gbGlzdGVuZXIoLi4uYXJncyk7XG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLm9uKGV2ZW50TmFtZSwgZnVuYyk7XG4gIH1cblxuICBvbihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gIH1cblxuICBvZmYoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIHJldHVybiB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgZXZlbnROYW1lcygpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzW0VWRU5UX0xJU1RFTkVSU10ua2V5cygpKTtcbiAgfVxuXG4gIGxpc3RlbmVyQ291bnQoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiAwO1xuXG4gICAgcmV0dXJuIHNjb3BlLmxlbmd0aDtcbiAgfVxuXG4gIGxpc3RlbmVycyhldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIHNjb3BlLnNsaWNlKCk7XG4gIH1cbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9qaWIuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL2ppYi5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiJFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyAkKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKSUJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSklCKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKSUJfQkFSUkVOXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9CQVJSRU4pLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkpJQl9DSElMRF9JTkRFWF9QUk9QXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9DSElMRF9JTkRFWF9QUk9QKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKSUJfUFJPWFlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSklCX1BST1hZKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKSUJfUkFXX1RFWFRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSklCX1JBV19URVhUKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKaWJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSmliKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJjb25zdHJ1Y3RKaWJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gY29uc3RydWN0SmliKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJmYWN0b3J5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGZhY3RvcnkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzSmliaXNoXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzSmliaXNoKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJyZXNvbHZlQ2hpbGRyZW5cIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gcmVzb2x2ZUNoaWxkcmVuKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuXG5cblxuY2xhc3MgSmliIHtcbiAgY29uc3RydWN0b3IoVHlwZSwgcHJvcHMsIGNoaWxkcmVuKSB7XG4gICAgbGV0IGRlZmF1bHRQcm9wcyA9IChUeXBlICYmIFR5cGUucHJvcHMpID8gVHlwZS5wcm9wcyA6IHt9O1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ1R5cGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgVHlwZSxcbiAgICAgIH0sXG4gICAgICAncHJvcHMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgeyBbSklCX0NISUxEX0lOREVYX1BST1BdOiAwLCAuLi5kZWZhdWx0UHJvcHMsIC4uLihwcm9wcyB8fCB7fSkgfSxcbiAgICAgIH0sXG4gICAgICAnY2hpbGRyZW4nOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uZmxhdHRlbkFycmF5KGNoaWxkcmVuKSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgSklCX0JBUlJFTiAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy5iYXJyZW4nKTtcbmNvbnN0IEpJQl9QUk9YWSAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMucHJveHknKTtcbmNvbnN0IEpJQl9SQVdfVEVYVCAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMucmF3VGV4dCcpO1xuY29uc3QgSklCICAgICAgICAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy5qaWInKTtcbmNvbnN0IEpJQl9DSElMRF9JTkRFWF9QUk9QID0gU3ltYm9sLmZvcignQGppYnMuY2hpbGRJbmRleFByb3AnKTtcblxuZnVuY3Rpb24gZmFjdG9yeShKaWJDbGFzcykge1xuICBmdW5jdGlvbiAkKF90eXBlLCBwcm9wcyA9IHt9KSB7XG4gICAgaWYgKGlzSmliaXNoKF90eXBlKSlcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1JlY2VpdmVkIGEgamliIGJ1dCBleHBlY3RlZCBhIGNvbXBvbmVudC4nKTtcblxuICAgIGxldCBUeXBlID0gKF90eXBlID09IG51bGwpID8gSklCX1BST1hZIDogX3R5cGU7XG5cbiAgICBmdW5jdGlvbiBiYXJyZW4oLi4uX2NoaWxkcmVuKSB7XG4gICAgICBsZXQgY2hpbGRyZW4gPSBfY2hpbGRyZW47XG5cbiAgICAgIGZ1bmN0aW9uIGppYigpIHtcbiAgICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoVHlwZSwgJ3Byb21pc2UnKSB8fCBjaGlsZHJlbi5zb21lKChjaGlsZCkgPT4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihjaGlsZCwgJ3Byb21pc2UnKSkpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoWyBUeXBlIF0uY29uY2F0KGNoaWxkcmVuKSkudGhlbigoYWxsKSA9PiB7XG4gICAgICAgICAgICBUeXBlID0gYWxsWzBdO1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBhbGwuc2xpY2UoMSk7XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgSmliQ2xhc3MoXG4gICAgICAgICAgICAgIFR5cGUsXG4gICAgICAgICAgICAgIHByb3BzLFxuICAgICAgICAgICAgICBjaGlsZHJlbixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IEppYkNsYXNzKFxuICAgICAgICAgIFR5cGUsXG4gICAgICAgICAgcHJvcHMsXG4gICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGppYiwge1xuICAgICAgICBbSklCXToge1xuICAgICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgW2RlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uaWRTeW1dOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgICAgdmFsdWU6ICAgICAgICAoKSA9PiBUeXBlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBqaWI7XG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoYmFycmVuLCB7XG4gICAgICBbSklCX0JBUlJFTl06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgfSxcbiAgICAgIFtkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmlkU3ltXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgICgpID0+IFR5cGUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGJhcnJlbjtcbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCQsIHtcbiAgICAncmVtYXAnOiB7XG4gICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICB2YWx1ZTogICAgICAgIChfamliLCBjYWxsYmFjaykgPT4ge1xuICAgICAgICBsZXQgamliID0gX2ppYjtcbiAgICAgICAgaWYgKGppYiA9PSBudWxsIHx8IE9iamVjdC5pcyhqaWIsIEluZmluaXR5KSB8fCBPYmplY3QuaXMoamliLCBOYU4pKVxuICAgICAgICAgIHJldHVybiBqaWI7XG5cbiAgICAgICAgaWYgKGlzSmliaXNoKGppYikpXG4gICAgICAgICAgamliID0gY29uc3RydWN0SmliKGppYik7XG5cbiAgICAgICAgY29uc3QgZmluYWxpemVNYXAgPSAoX21hcHBlZEppYikgPT4ge1xuICAgICAgICAgIGxldCBtYXBwZWRKaWIgPSBfbWFwcGVkSmliO1xuXG4gICAgICAgICAgaWYgKGlzSmliaXNoKG1hcHBlZEppYikpXG4gICAgICAgICAgICBtYXBwZWRKaWIgPSBjb25zdHJ1Y3RKaWIobWFwcGVkSmliKTtcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gbWFwcGVkSmliO1xuXG4gICAgICAgICAgcmV0dXJuICQobWFwcGVkSmliLlR5cGUsIG1hcHBlZEppYi5wcm9wcykoLi4uKG1hcHBlZEppYi5jaGlsZHJlbiB8fCBbXSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBtYXBwZWRKaWIgPSBjYWxsYmFjayhqaWIpO1xuICAgICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihtYXBwZWRKaWIsICdwcm9taXNlJykpXG4gICAgICAgICAgcmV0dXJuIG1hcHBlZEppYi50aGVuKGZpbmFsaXplTWFwKTtcblxuICAgICAgICByZXR1cm4gZmluYWxpemVNYXAobWFwcGVkSmliKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG5cbiAgcmV0dXJuICQ7XG59XG5cbmNvbnN0ICQgPSBmYWN0b3J5KEppYik7XG5cbmZ1bmN0aW9uIGlzSmliaXNoKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgKHZhbHVlW0pJQl9CQVJSRU5dIHx8IHZhbHVlW0pJQl0pKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEppYilcbiAgICByZXR1cm4gdHJ1ZTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBKaWIpXG4gICAgcmV0dXJuIHZhbHVlO1xuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAodmFsdWVbSklCX0JBUlJFTl0pXG4gICAgICByZXR1cm4gdmFsdWUoKSgpO1xuICAgIGVsc2UgaWYgKHZhbHVlW0pJQl0pXG4gICAgICByZXR1cm4gdmFsdWUoKTtcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ2NvbnN0cnVjdEppYjogUHJvdmlkZWQgdmFsdWUgaXMgbm90IGEgSmliLicpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlQ2hpbGRyZW4oX2NoaWxkcmVuKSB7XG4gIGxldCBjaGlsZHJlbiA9IF9jaGlsZHJlbjtcblxuICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihjaGlsZHJlbiwgJ3Byb21pc2UnKSlcbiAgICBjaGlsZHJlbiA9IGF3YWl0IGNoaWxkcmVuO1xuXG4gIGlmICghKCh0aGlzLmlzSXRlcmFibGVDaGlsZCB8fCBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pc0l0ZXJhYmxlQ2hpbGQpLmNhbGwodGhpcywgY2hpbGRyZW4pKSAmJiAoaXNKaWJpc2goY2hpbGRyZW4pIHx8ICgodGhpcy5pc1ZhbGlkQ2hpbGQgfHwgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXNWYWxpZENoaWxkKS5jYWxsKHRoaXMsIGNoaWxkcmVuKSkpKVxuICAgIGNoaWxkcmVuID0gWyBjaGlsZHJlbiBdO1xuXG4gIGxldCBwcm9taXNlcyA9IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLml0ZXJhdGUoY2hpbGRyZW4sIGFzeW5jICh7IHZhbHVlOiBfY2hpbGQgfSkgPT4ge1xuICAgIGxldCBjaGlsZCA9IChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKF9jaGlsZCwgJ3Byb21pc2UnKSkgPyBhd2FpdCBfY2hpbGQgOiBfY2hpbGQ7XG5cbiAgICBpZiAoaXNKaWJpc2goY2hpbGQpKVxuICAgICAgcmV0dXJuIGF3YWl0IGNvbnN0cnVjdEppYihjaGlsZCk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGNoaWxkO1xuICB9KTtcblxuICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3JlbmRlcmVycy9pbmRleC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDT05URVhUX0lEXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5DT05URVhUX0lEKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJGT1JDRV9SRUZMT1dcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gRk9SQ0VfUkVGTE9XKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSZW5kZXJlclwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfcmVuZGVyZXJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5SZW5kZXJlciksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUm9vdE5vZGVcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3ROb2RlKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LW5vZGUuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9yZW5kZXJlcl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yZW5kZXJlci5qcyAqLyBcIi4vbGliL3JlbmRlcmVycy9yZW5kZXJlci5qc1wiKTtcblxuXG5jb25zdCBGT1JDRV9SRUZMT1cgPSBTeW1ib2wuZm9yKCdAamlic0ZvcmNlUmVmbG93Jyk7XG5cblxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3JlbmRlcmVycy9yZW5kZXJlci5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSZW5kZXJlclwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBSZW5kZXJlcilcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcm9vdC1ub2RlLmpzICovIFwiLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qc1wiKTtcblxuXG5jb25zdCBJTklUSUFMX0NPTlRFWFRfSUQgPSAxbjtcbmxldCBfY29udGV4dElEQ291bnRlciA9IElOSVRJQUxfQ09OVEVYVF9JRDtcblxuY2xhc3MgUmVuZGVyZXIgZXh0ZW5kcyBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdE5vZGUge1xuICBzdGF0aWMgUm9vdE5vZGUgPSBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdE5vZGU7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKG51bGwsIG51bGwsIG51bGwpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ29wdGlvbnMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgb3B0aW9ucyB8fCB7fSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlcmVyID0gdGhpcztcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50ZXJtUmVzb2x2ZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICB0aGlzLmNvbnRleHQuX3Rlcm1SZXNvbHZlciA9IG9wdGlvbnMudGVybVJlc29sdmVyO1xuICB9XG5cbiAgZ2V0T3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICB9XG5cbiAgcmVzb2x2ZVRlcm0oYXJncykge1xuICAgIGxldCB7IHRlcm1SZXNvbHZlciB9ID0gdGhpcy5nZXRPcHRpb25zKCk7XG4gICAgaWYgKHR5cGVvZiB0ZXJtUmVzb2x2ZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gdGVybVJlc29sdmVyLmNhbGwodGhpcywgYXJncyk7XG5cbiAgICBsZXQgY2hpbGRyZW4gPSAoYXJncy5jaGlsZHJlbiB8fCBbXSk7XG4gICAgcmV0dXJuIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdIHx8ICcnO1xuICB9XG5cbiAgY3JlYXRlQ29udGV4dChyb290Q29udGV4dCwgb25VcGRhdGUsIG9uVXBkYXRlVGhpcykge1xuICAgIGxldCBjb250ZXh0ICAgICA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IG15Q29udGV4dElEID0gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W19yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5DT05URVhUX0lEXSA6IElOSVRJQUxfQ09OVEVYVF9JRDtcblxuICAgIHJldHVybiBuZXcgUHJveHkoY29udGV4dCwge1xuICAgICAgZ2V0OiAodGFyZ2V0LCBwcm9wTmFtZSkgPT4ge1xuICAgICAgICBpZiAocHJvcE5hbWUgPT09IF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5DT05URVhUX0lEKSB7XG4gICAgICAgICAgbGV0IHBhcmVudElEID0gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W19yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5DT05URVhUX0lEXSA6IElOSVRJQUxfQ09OVEVYVF9JRDtcbiAgICAgICAgICByZXR1cm4gKHBhcmVudElEID4gbXlDb250ZXh0SUQpID8gcGFyZW50SUQgOiBteUNvbnRleHRJRDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCwgcHJvcE5hbWUpKVxuICAgICAgICAgIHJldHVybiAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbcHJvcE5hbWVdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgfSxcbiAgICAgIHNldDogKHRhcmdldCwgcHJvcE5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmIChwcm9wTmFtZSA9PT0gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkNPTlRFWFRfSUQpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgaWYgKHRhcmdldFtwcm9wTmFtZV0gPT09IHZhbHVlKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIG15Q29udGV4dElEID0gKytfY29udGV4dElEQ291bnRlcjtcbiAgICAgICAgdGFyZ2V0W3Byb3BOYW1lXSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0eXBlb2Ygb25VcGRhdGUgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgb25VcGRhdGUuY2FsbChvblVwZGF0ZVRoaXMsIG9uVXBkYXRlVGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDT05URVhUX0lEXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENPTlRFWFRfSUQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJvb3ROb2RlXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFJvb3ROb2RlKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi4vdXRpbHMuanMgKi8gXCIuL2xpYi91dGlscy5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuLi9qaWIuanMgKi8gXCIuL2xpYi9qaWIuanNcIik7XG5cblxuXG5cbmNvbnN0IENPTlRFWFRfSUQgPSBTeW1ib2wuZm9yKCdAamlicy9ub2RlL2NvbnRleHRJRCcpO1xuXG5jbGFzcyBSb290Tm9kZSB7XG4gIHN0YXRpYyBDT05URVhUX0lEID0gQ09OVEVYVF9JRDtcblxuICBjb25zdHJ1Y3RvcihyZW5kZXJlciwgcGFyZW50Tm9kZSwgX2NvbnRleHQsIGppYikge1xuICAgIGxldCBjb250ZXh0ID0gbnVsbDtcblxuICAgIGlmICh0aGlzLmNvbnN0cnVjdG9yLkhBU19DT05URVhUICE9PSBmYWxzZSAmJiAocmVuZGVyZXIgfHwgdGhpcy5jcmVhdGVDb250ZXh0KSkge1xuICAgICAgY29udGV4dCA9IChyZW5kZXJlciB8fCB0aGlzKS5jcmVhdGVDb250ZXh0KFxuICAgICAgICBfY29udGV4dCxcbiAgICAgICAgKHRoaXMub25Db250ZXh0VXBkYXRlKSA/IHRoaXMub25Db250ZXh0VXBkYXRlIDogdW5kZWZpbmVkLFxuICAgICAgICB0aGlzLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnVFlQRSc6IHtcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB0aGlzLmNvbnN0cnVjdG9yLlRZUEUsXG4gICAgICAgIHNldDogICAgICAgICAgKCkgPT4ge30sIC8vIE5PT1BcbiAgICAgIH0sXG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uZ2VuZXJhdGVVVUlEKCksXG4gICAgICB9LFxuICAgICAgJ3JlbmRlcmVyJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICByZW5kZXJlcixcbiAgICAgIH0sXG4gICAgICAncGFyZW50Tm9kZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcGFyZW50Tm9kZSxcbiAgICAgIH0sXG4gICAgICAnY2hpbGROb2Rlcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbmV3IE1hcCgpLFxuICAgICAgfSxcbiAgICAgICdjb250ZXh0Jzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBjb250ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICAgICAgICAgICgpID0+IHt9LFxuICAgICAgfSxcbiAgICAgICdkZXN0cm95aW5nJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBmYWxzZSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyUHJvbWlzZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyRnJhbWUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIDAsXG4gICAgICB9LFxuICAgICAgJ2ppYic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLFxuICAgICAgfSxcbiAgICAgICduYXRpdmVFbGVtZW50Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJlc29sdmVDaGlsZHJlbihjaGlsZHJlbikge1xuICAgIHJldHVybiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18ucmVzb2x2ZUNoaWxkcmVuLmNhbGwodGhpcywgY2hpbGRyZW4pO1xuICB9XG5cbiAgaXNKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmlzSmliaXNoKSh2YWx1ZSk7XG4gIH1cblxuICBjb25zdHJ1Y3RKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmNvbnN0cnVjdEppYikodmFsdWUpO1xuICB9XG5cbiAgZ2V0Q2FjaGVLZXkoKSB7XG4gICAgbGV0IHsgVHlwZSwgcHJvcHMgfSA9ICh0aGlzLmppYiB8fCB7fSk7XG4gICAgbGV0IGNhY2hlS2V5ID0gZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyhUeXBlLCBwcm9wcy5rZXkpO1xuXG4gICAgcmV0dXJuIGNhY2hlS2V5O1xuICB9XG5cbiAgdXBkYXRlSmliKG5ld0ppYikge1xuICAgIHRoaXMuamliID0gbmV3SmliO1xuICB9XG5cbiAgY2xlYXJDaGlsZHJlbigpIHtcbiAgICB0aGlzLmNoaWxkTm9kZXMuY2xlYXIoKTtcbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkTm9kZSkge1xuICAgIGxldCBjYWNoZUtleSA9IGNoaWxkTm9kZS5nZXRDYWNoZUtleSgpO1xuICAgIHRoaXMuY2hpbGROb2Rlcy5kZWxldGUoY2FjaGVLZXkpO1xuICB9XG5cbiAgYWRkQ2hpbGQoY2hpbGROb2RlLCBfY2FjaGVLZXkpIHtcbiAgICBsZXQgY2FjaGVLZXkgPSAoX2NhY2hlS2V5KSA/IF9jYWNoZUtleSA6IGNoaWxkTm9kZS5nZXRDYWNoZUtleSgpO1xuICAgIHRoaXMuY2hpbGROb2Rlcy5zZXQoY2FjaGVLZXksIGNoaWxkTm9kZSk7XG4gIH1cblxuICBnZXRDaGlsZChjYWNoZUtleSkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTm9kZXMuZ2V0KGNhY2hlS2V5KTtcbiAgfVxuXG4gIGdldENoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTm9kZXM7XG4gIH1cblxuICBnZXRUaGlzTm9kZU9yQ2hpbGROb2RlcygpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldENoaWxkcmVuTm9kZXMoKSB7XG4gICAgbGV0IGNoaWxkTm9kZXMgPSBbXTtcbiAgICBmb3IgKGxldCBjaGlsZE5vZGUgb2YgdGhpcy5jaGlsZE5vZGVzLnZhbHVlcygpKVxuICAgICAgY2hpbGROb2RlcyA9IGNoaWxkTm9kZXMuY29uY2F0KGNoaWxkTm9kZS5nZXRUaGlzTm9kZU9yQ2hpbGROb2RlcygpKTtcblxuICAgIHJldHVybiBjaGlsZE5vZGVzLmZpbHRlcihCb29sZWFuKTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koZm9yY2UpIHtcbiAgICBpZiAoIWZvcmNlICYmIHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5yZW5kZXJQcm9taXNlKVxuICAgICAgYXdhaXQgdGhpcy5yZW5kZXJQcm9taXNlO1xuXG4gICAgYXdhaXQgdGhpcy5kZXN0cm95RnJvbURPTSh0aGlzLmNvbnRleHQsIHRoaXMpO1xuXG4gICAgbGV0IGRlc3Ryb3lQcm9taXNlcyA9IFtdO1xuICAgIGZvciAobGV0IGNoaWxkTm9kZSBvZiB0aGlzLmNoaWxkTm9kZXMudmFsdWVzKCkpXG4gICAgICBkZXN0cm95UHJvbWlzZXMucHVzaChjaGlsZE5vZGUuZGVzdHJveSgpKTtcblxuICAgIHRoaXMuY2hpbGROb2Rlcy5jbGVhcigpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKGRlc3Ryb3lQcm9taXNlcyk7XG5cbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBudWxsO1xuICAgIHRoaXMucGFyZW50Tm9kZSA9IG51bGw7XG4gICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgICB0aGlzLmppYiA9IG51bGw7XG4gIH1cblxuICBpc1ZhbGlkQ2hpbGQoY2hpbGQpIHtcbiAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXNWYWxpZENoaWxkKGNoaWxkKTtcbiAgfVxuXG4gIGlzSXRlcmFibGVDaGlsZChjaGlsZCkge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgcHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cykge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5wcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKTtcbiAgfVxuXG4gIGNoaWxkcmVuRGlmZmVyKG9sZENoaWxkcmVuLCBuZXdDaGlsZHJlbikge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5jaGlsZHJlbkRpZmZlcihvbGRDaGlsZHJlbiwgbmV3Q2hpbGRyZW4pO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyKC4uLmFyZ3MpIHtcbiAgICBpZiAodGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5yZW5kZXJGcmFtZSsrO1xuICAgIGxldCByZW5kZXJGcmFtZSA9IHRoaXMucmVuZGVyRnJhbWU7XG5cbiAgICBpZiAodHlwZW9mIHRoaXMuX3JlbmRlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5yZW5kZXJQcm9taXNlID0gdGhpcy5fcmVuZGVyKC4uLmFyZ3MpXG4gICAgICAgIC50aGVuKGFzeW5jIChyZXN1bHQpID0+IHtcbiAgICAgICAgICBpZiAocmVuZGVyRnJhbWUgPj0gdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3luY0RPTSh0aGlzLmNvbnRleHQsIHRoaXMpO1xuXG4gICAgICAgICAgdGhpcy5yZW5kZXJQcm9taXNlID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQcm9taXNlID0gbnVsbDtcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHRoaXMuc3luY0RPTSh0aGlzLmNvbnRleHQsIHRoaXMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJlbmRlclByb21pc2U7XG4gIH1cblxuICBnZXRQYXJlbnRJRCgpIHtcbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiB0aGlzLnBhcmVudE5vZGUuaWQ7XG4gIH1cblxuICBhc3luYyBkZXN0cm95RnJvbURPTShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCF0aGlzLnJlbmRlcmVyKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucmVuZGVyZXIuZGVzdHJveUZyb21ET00oY29udGV4dCwgbm9kZSk7XG4gIH1cblxuICBhc3luYyBzeW5jRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIXRoaXMucmVuZGVyZXIpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5yZW5kZXJlci5zeW5jRE9NKGNvbnRleHQsIG5vZGUpO1xuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvdXRpbHMuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvdXRpbHMuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiYmluZE1ldGhvZHNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gYmluZE1ldGhvZHMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImNoaWxkcmVuRGlmZmVyXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGNoaWxkcmVuRGlmZmVyKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJmZXRjaERlZXBQcm9wZXJ0eVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBmZXRjaERlZXBQcm9wZXJ0eSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmxhdHRlbkFycmF5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGZsYXR0ZW5BcnJheSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZ2VuZXJhdGVVVUlEXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGdlbmVyYXRlVVVJRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaW5zdGFuY2VPZlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpbnN0YW5jZU9mKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc0VtcHR5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzRW1wdHkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzSXRlcmFibGVDaGlsZFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc0l0ZXJhYmxlQ2hpbGQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzTm90RW1wdHlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXNOb3RFbXB0eSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaXNWYWxpZENoaWxkXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzVmFsaWRDaGlsZCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaXRlcmF0ZVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpdGVyYXRlKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJub3dcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gbm93KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJwcm9wc0RpZmZlclwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBwcm9wc0RpZmZlciksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwic2l6ZU9mXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIHNpemVPZilcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGVzbGludC1kaXNhYmxlIG5vLW1hZ2ljLW51bWJlcnMgKi9cblxuXG5jb25zdCBTVE9QID0gU3ltYm9sLmZvcignQGppYnNJdGVyYXRlU3RvcCcpO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbmVzdGVkLXRlcm5hcnlcbmNvbnN0IGdsb2JhbFNjb3BlID0gKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSA/IGdsb2JhbCA6ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiB1bmRlZmluZWQ7XG5cbmxldCB1dWlkID0gMTAwMDAwMDtcblxuZnVuY3Rpb24gaW5zdGFuY2VPZihvYmopIHtcbiAgZnVuY3Rpb24gdGVzdFR5cGUob2JqLCBfdmFsKSB7XG4gICAgZnVuY3Rpb24gaXNEZWZlcnJlZFR5cGUob2JqKSB7XG4gICAgICBpZiAob2JqIGluc3RhbmNlb2YgUHJvbWlzZSB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnUHJvbWlzZScpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gUXVhY2sgcXVhY2suLi5cbiAgICAgIGlmICh0eXBlb2Ygb2JqLnRoZW4gPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5jYXRjaCA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgdmFsICAgICA9IF92YWw7XG4gICAgbGV0IHR5cGVPZiAgPSAodHlwZW9mIG9iaik7XG5cbiAgICBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TdHJpbmcpXG4gICAgICB2YWwgPSAnc3RyaW5nJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk51bWJlcilcbiAgICAgIHZhbCA9ICdudW1iZXInO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQm9vbGVhbilcbiAgICAgIHZhbCA9ICdib29sZWFuJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkZ1bmN0aW9uKVxuICAgICAgdmFsID0gJ2Z1bmN0aW9uJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkFycmF5KVxuICAgICAgdmFsID0gJ2FycmF5JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk9iamVjdClcbiAgICAgIHZhbCA9ICdvYmplY3QnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuUHJvbWlzZSlcbiAgICAgIHZhbCA9ICdwcm9taXNlJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJpZ0ludClcbiAgICAgIHZhbCA9ICdiaWdpbnQnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuTWFwKVxuICAgICAgdmFsID0gJ21hcCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5XZWFrTWFwKVxuICAgICAgdmFsID0gJ3dlYWttYXAnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU2V0KVxuICAgICAgdmFsID0gJ3NldCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TeW1ib2wpXG4gICAgICB2YWwgPSAnc3ltYm9sJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJ1ZmZlcilcbiAgICAgIHZhbCA9ICdidWZmZXInO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2J1ZmZlcicgJiYgZ2xvYmFsU2NvcGUuQnVmZmVyICYmIGdsb2JhbFNjb3BlLkJ1ZmZlci5pc0J1ZmZlcihvYmopKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnbnVtYmVyJyAmJiAodHlwZU9mID09PSAnbnVtYmVyJyB8fCBvYmogaW5zdGFuY2VvZiBOdW1iZXIgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ051bWJlcicpKSkge1xuICAgICAgaWYgKCFpc0Zpbml0ZShvYmopKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh2YWwgIT09ICdvYmplY3QnICYmIHZhbCA9PT0gdHlwZU9mKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKChvYmouY29uc3RydWN0b3IgPT09IE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIE51bGwgcHJvdG90eXBlIG9uIG9iamVjdFxuICAgICAgaWYgKHR5cGVPZiA9PT0gJ29iamVjdCcgJiYgIW9iai5jb25zdHJ1Y3RvcilcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodmFsID09PSAnYXJyYXknICYmIChBcnJheS5pc0FycmF5KG9iaikgfHwgb2JqIGluc3RhbmNlb2YgQXJyYXkgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0FycmF5JykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAoKHZhbCA9PT0gJ3Byb21pc2UnIHx8IHZhbCA9PT0gJ2RlZmVycmVkJykgJiYgaXNEZWZlcnJlZFR5cGUob2JqKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3N0cmluZycgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLlN0cmluZyB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU3RyaW5nJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnYm9vbGVhbicgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLkJvb2xlYW4gfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0Jvb2xlYW4nKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdtYXAnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5NYXAgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ01hcCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3dlYWttYXAnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5XZWFrTWFwIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdXZWFrTWFwJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnc2V0JyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuU2V0IHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTZXQnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdmdW5jdGlvbicgJiYgdHlwZU9mID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJyAmJiBvYmogaW5zdGFuY2VvZiB2YWwpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJyAmJiBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHZhbClcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKG9iaiA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gMSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKHRlc3RUeXBlKG9iaiwgYXJndW1lbnRzW2ldKSA9PT0gdHJ1ZSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBwcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKSB7XG4gIGlmIChvbGRQcm9wcyA9PT0gbmV3UHJvcHMpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2Ygb2xkUHJvcHMgIT09IHR5cGVvZiBuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoIW9sZFByb3BzICYmIG5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChvbGRQcm9wcyAmJiAhbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGVxZXFlcVxuICBpZiAoIW9sZFByb3BzICYmICFuZXdQcm9wcyAmJiBvbGRQcm9wcyAhPSBvbGRQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBsZXQgYUtleXMgPSBPYmplY3Qua2V5cyhvbGRQcm9wcykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2xkUHJvcHMpKTtcbiAgbGV0IGJLZXlzID0gT2JqZWN0LmtleXMobmV3UHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG5ld1Byb3BzKSk7XG5cbiAgaWYgKGFLZXlzLmxlbmd0aCAhPT0gYktleXMubGVuZ3RoKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFLZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQgYUtleSA9IGFLZXlzW2ldO1xuICAgIGlmIChza2lwS2V5cyAmJiBza2lwS2V5cy5pbmRleE9mKGFLZXkpID49IDApXG4gICAgICBjb250aW51ZTtcblxuICAgIGlmIChvbGRQcm9wc1thS2V5XSAhPT0gbmV3UHJvcHNbYUtleV0pXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGxldCBiS2V5ID0gYktleXNbaV07XG4gICAgaWYgKHNraXBLZXlzICYmIHNraXBLZXlzLmluZGV4T2YoYktleSkpXG4gICAgICBjb250aW51ZTtcblxuICAgIGlmIChhS2V5ID09PSBiS2V5KVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAob2xkUHJvcHNbYktleV0gIT09IG5ld1Byb3BzW2JLZXldKVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHNpemVPZih2YWx1ZSkge1xuICBpZiAoIXZhbHVlKVxuICAgIHJldHVybiAwO1xuXG4gIGlmIChPYmplY3QuaXMoSW5maW5pdHkpKVxuICAgIHJldHVybiAwO1xuXG4gIGlmICh0eXBlb2YgdmFsdWUubGVuZ3RoID09PSAnbnVtYmVyJylcbiAgICByZXR1cm4gdmFsdWUubGVuZ3RoO1xuXG4gIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBfaXRlcmF0ZShvYmosIGNhbGxiYWNrKSB7XG4gIGlmICghb2JqIHx8IE9iamVjdC5pcyhJbmZpbml0eSkpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGxldCByZXN1bHRzICAgPSBbXTtcbiAgbGV0IHNjb3BlICAgICA9IHsgY29sbGVjdGlvbjogb2JqLCBTVE9QIH07XG4gIGxldCByZXN1bHQ7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgIHNjb3BlLnR5cGUgPSAnQXJyYXknO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gb2JqLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIHNjb3BlLnZhbHVlID0gb2JqW2ldO1xuICAgICAgc2NvcGUuaW5kZXggPSBzY29wZS5rZXkgPSBpO1xuXG4gICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9iai5lbnRyaWVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKG9iaiBpbnN0YW5jZW9mIFNldCB8fCBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1NldCcpIHtcbiAgICAgIHNjb3BlLnR5cGUgPSAnU2V0JztcblxuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IGl0ZW0gb2Ygb2JqLnZhbHVlcygpKSB7XG4gICAgICAgIHNjb3BlLnZhbHVlID0gaXRlbTtcbiAgICAgICAgc2NvcGUua2V5ID0gaXRlbTtcbiAgICAgICAgc2NvcGUuaW5kZXggPSBpbmRleCsrO1xuXG4gICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzY29wZS50eXBlID0gb2JqLmNvbnN0cnVjdG9yLm5hbWU7XG5cbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGxldCBbIGtleSwgdmFsdWUgXSBvZiBvYmouZW50cmllcygpKSB7XG4gICAgICAgIHNjb3BlLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHNjb3BlLmtleSA9IGtleTtcbiAgICAgICAgc2NvcGUuaW5kZXggPSBpbmRleCsrO1xuXG4gICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoaW5zdGFuY2VPZihvYmosICdib29sZWFuJywgJ251bWJlcicsICdiaWdpbnQnLCAnZnVuY3Rpb24nKSlcbiAgICAgIHJldHVybjtcblxuICAgIHNjb3BlLnR5cGUgPSAob2JqLmNvbnN0cnVjdG9yKSA/IG9iai5jb25zdHJ1Y3Rvci5uYW1lIDogJ09iamVjdCc7XG5cbiAgICBsZXQga2V5cyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQga2V5ICAgPSBrZXlzW2ldO1xuICAgICAgbGV0IHZhbHVlID0gb2JqW2tleV07XG5cbiAgICAgIHNjb3BlLnZhbHVlID0gdmFsdWU7XG4gICAgICBzY29wZS5rZXkgPSBrZXk7XG4gICAgICBzY29wZS5pbmRleCA9IGk7XG5cbiAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHRzO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydGllcyhfaXRlcmF0ZSwge1xuICAnU1RPUCc6IHtcbiAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB2YWx1ZTogICAgICAgIFNUT1AsXG4gIH0sXG59KTtcblxuY29uc3QgaXRlcmF0ZSA9IF9pdGVyYXRlO1xuXG5mdW5jdGlvbiBjaGlsZHJlbkRpZmZlcihjaGlsZHJlbjEsIGNoaWxkcmVuMikge1xuICBpZiAoY2hpbGRyZW4xID09PSBjaGlsZHJlbjIpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGxldCByZXN1bHQxID0gKCFBcnJheS5pc0FycmF5KGNoaWxkcmVuMSkpID8gZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyhjaGlsZHJlbjEpIDogZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyguLi5jaGlsZHJlbjEpO1xuICBsZXQgcmVzdWx0MiA9ICghQXJyYXkuaXNBcnJheShjaGlsZHJlbjIpKSA/IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oY2hpbGRyZW4yKSA6IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oLi4uY2hpbGRyZW4yKTtcblxuICByZXR1cm4gKHJlc3VsdDEgIT09IHJlc3VsdDIpO1xufVxuXG5mdW5jdGlvbiBmZXRjaERlZXBQcm9wZXJ0eShvYmosIF9rZXksIGRlZmF1bHRWYWx1ZSwgbGFzdFBhcnQpIHtcbiAgaWYgKG9iaiA9PSBudWxsIHx8IE9iamVjdC5pcyhOYU4sIG9iaikgfHwgT2JqZWN0LmlzKEluZmluaXR5LCBvYmopKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIG51bGwgXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBpZiAoX2tleSA9PSBudWxsIHx8IE9iamVjdC5pcyhOYU4sIF9rZXkpIHx8IE9iamVjdC5pcyhJbmZpbml0eSwgX2tleSkpXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgbnVsbCBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGxldCBwYXJ0cztcblxuICBpZiAoQXJyYXkuaXNBcnJheShfa2V5KSkge1xuICAgIHBhcnRzID0gX2tleTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgX2tleSA9PT0gJ3N5bWJvbCcpIHtcbiAgICBwYXJ0cyA9IFsgX2tleSBdO1xuICB9IGVsc2Uge1xuICAgIGxldCBrZXkgICAgICAgICA9ICgnJyArIF9rZXkpO1xuICAgIGxldCBsYXN0SW5kZXggICA9IDA7XG4gICAgbGV0IGxhc3RDdXJzb3IgID0gMDtcblxuICAgIHBhcnRzID0gW107XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc3RhbnQtY29uZGl0aW9uXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGxldCBpbmRleCA9IGtleS5pbmRleE9mKCcuJywgbGFzdEluZGV4KTtcbiAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgcGFydHMucHVzaChrZXkuc3Vic3RyaW5nKGxhc3RDdXJzb3IpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXkuY2hhckF0KGluZGV4IC0gMSkgPT09ICdcXFxcJykge1xuICAgICAgICBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGtleS5zdWJzdHJpbmcobGFzdEN1cnNvciwgaW5kZXgpKTtcbiAgICAgIGxhc3RDdXJzb3IgPSBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgfVxuICB9XG5cbiAgbGV0IHBhcnROID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gIGlmIChwYXJ0cy5sZW5ndGggPT09IDApXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgcGFydE4gXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBsZXQgY3VycmVudFZhbHVlID0gb2JqO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBwYXJ0cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGtleSA9IHBhcnRzW2ldO1xuXG4gICAgY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlW2tleV07XG4gICAgaWYgKGN1cnJlbnRWYWx1ZSA9PSBudWxsKVxuICAgICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgcGFydE4gXSA6IGRlZmF1bHRWYWx1ZTtcbiAgfVxuXG4gIHJldHVybiAobGFzdFBhcnQpID8gWyBjdXJyZW50VmFsdWUsIHBhcnROIF0gOiBjdXJyZW50VmFsdWU7XG59XG5cbmZ1bmN0aW9uIGJpbmRNZXRob2RzKF9wcm90bywgc2tpcFByb3Rvcykge1xuICBsZXQgcHJvdG8gICAgICAgICAgID0gX3Byb3RvO1xuICBsZXQgYWxyZWFkeVZpc2l0ZWQgID0gbmV3IFNldCgpO1xuXG4gIHdoaWxlIChwcm90bykge1xuICAgIGxldCBkZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKHByb3RvKTtcbiAgICBsZXQga2V5cyAgICAgICAgPSBPYmplY3Qua2V5cyhkZXNjcmlwdG9ycykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZGVzY3JpcHRvcnMpKTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICBpZiAoa2V5ID09PSAnY29uc3RydWN0b3InKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKGFscmVhZHlWaXNpdGVkLmhhcyhrZXkpKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgYWxyZWFkeVZpc2l0ZWQuYWRkKGtleSk7XG5cbiAgICAgIGxldCB2YWx1ZSA9IHByb3RvW2tleV07XG5cbiAgICAgIC8vIFNraXAgcHJvdG90eXBlIG9mIE9iamVjdFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvdHlwZS1idWlsdGluc1xuICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBPYmplY3QucHJvdG90eXBlW2tleV0gPT09IHZhbHVlKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIHRoaXNba2V5XSA9IHZhbHVlLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocHJvdG8pO1xuICAgIGlmIChwcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSlcbiAgICAgIGJyZWFrO1xuXG4gICAgaWYgKHNraXBQcm90b3MgJiYgc2tpcFByb3Rvcy5pbmRleE9mKHByb3RvKSA+PSAwKVxuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIE5hTikpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKGluc3RhbmNlT2YodmFsdWUsICdzdHJpbmcnKSlcbiAgICByZXR1cm4gISgvXFxTLykudGVzdCh2YWx1ZSk7XG4gIGVsc2UgaWYgKGluc3RhbmNlT2YodmFsdWUsICdudW1iZXInKSAmJiBpc0Zpbml0ZSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBlbHNlIGlmICghaW5zdGFuY2VPZih2YWx1ZSwgJ2Jvb2xlYW4nLCAnYmlnaW50JywgJ2Z1bmN0aW9uJykgJiYgc2l6ZU9mKHZhbHVlKSA9PT0gMClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzTm90RW1wdHkodmFsdWUpIHtcbiAgcmV0dXJuICFpc0VtcHR5LmNhbGwodGhpcywgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuQXJyYXkodmFsdWUpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICByZXR1cm4gdmFsdWU7XG5cbiAgbGV0IG5ld0FycmF5ID0gW107XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQgaXRlbSA9IHZhbHVlW2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGl0ZW0pKVxuICAgICAgbmV3QXJyYXkgPSBuZXdBcnJheS5jb25jYXQoZmxhdHRlbkFycmF5KGl0ZW0pKTtcbiAgICBlbHNlXG4gICAgICBuZXdBcnJheS5wdXNoKGl0ZW0pO1xuICB9XG5cbiAgcmV0dXJuIG5ld0FycmF5O1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkQ2hpbGQoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgY2hpbGQgPT09ICdib29sZWFuJylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKGNoaWxkLCBOYU4pKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gIGlmIChjaGlsZCA9PSBudWxsIHx8IE9iamVjdC5pcyhjaGlsZCwgTmFOKSB8fCBPYmplY3QuaXMoY2hpbGQsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIChBcnJheS5pc0FycmF5KGNoaWxkKSB8fCB0eXBlb2YgY2hpbGQgPT09ICdvYmplY3QnICYmICFpbnN0YW5jZU9mKGNoaWxkLCAnYm9vbGVhbicsICdudW1iZXInLCAnc3RyaW5nJykpO1xufVxuXG5mdW5jdGlvbiBub3coKSB7XG4gIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBwZXJmb3JtYW5jZS5ub3cgPT09ICdmdW5jdGlvbicpXG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuICBlbHNlXG4gICAgcmV0dXJuIERhdGUubm93KCk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcbiAgaWYgKHV1aWQgPiA5OTk5OTk5KVxuICAgIHV1aWQgPSAxMDAwMDAwO1xuXG4gIHJldHVybiBgJHtEYXRlLm5vdygpfS4ke3V1aWQrK30ke01hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwKS50b1N0cmluZygpLnBhZFN0YXJ0KDIwLCAnMCcpfWA7XG59XG5cblxuLyoqKi8gfSlcblxuLyoqKioqKi8gfSk7XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gLy8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gdmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuLyoqKioqKi8gXG4vKioqKioqLyAvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuLyoqKioqKi8gZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuLyoqKioqKi8gXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbi8qKioqKiovIFx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG4vKioqKioqLyBcdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuLyoqKioqKi8gXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIFx0fVxuLyoqKioqKi8gXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG4vKioqKioqLyBcdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcbi8qKioqKiovIFx0XHRleHBvcnRzOiB7fVxuLyoqKioqKi8gXHR9O1xuLyoqKioqKi8gXG4vKioqKioqLyBcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuLyoqKioqKi8gXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcbi8qKioqKiovIFxuLyoqKioqKi8gXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuLyoqKioqKi8gXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyB9XG4vKioqKioqLyBcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcbi8qKioqKiovIFx0XHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG4vKioqKioqLyBcdFx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcbi8qKioqKiovIFx0XHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcbi8qKioqKiovIFx0XHRcdH1cbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdH07XG4vKioqKioqLyB9KSgpO1xuLyoqKioqKi8gXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsICovXG4vKioqKioqLyAoKCkgPT4ge1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG4vKioqKioqLyBcdFx0aWYgKHR5cGVvZiBnbG9iYWxUaGlzID09PSAnb2JqZWN0JykgcmV0dXJuIGdsb2JhbFRoaXM7XG4vKioqKioqLyBcdFx0dHJ5IHtcbi8qKioqKiovIFx0XHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuLyoqKioqKi8gXHRcdH0gY2F0Y2ggKGUpIHtcbi8qKioqKiovIFx0XHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdH0pKCk7XG4vKioqKioqLyB9KSgpO1xuLyoqKioqKi8gXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kICovXG4vKioqKioqLyAoKCkgPT4ge1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpXG4vKioqKioqLyB9KSgpO1xuLyoqKioqKi8gXG4vKioqKioqLyAvKiB3ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0ICovXG4vKioqKioqLyAoKCkgPT4ge1xuLyoqKioqKi8gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG4vKioqKioqLyBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4vKioqKioqLyBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKioqKiovIFx0fTtcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IHt9O1xuLy8gVGhpcyBlbnRyeSBuZWVkIHRvIGJlIHdyYXBwZWQgaW4gYW4gSUlGRSBiZWNhdXNlIGl0IG5lZWQgdG8gYmUgaXNvbGF0ZWQgYWdhaW5zdCBvdGhlciBtb2R1bGVzIGluIHRoZSBjaHVuay5cbigoKSA9PiB7XG4vKiEqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL2luZGV4LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqL1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCIkXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy4kKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDb21wb25lbnRcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkNvbXBvbmVudCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ29tcG9uZW50c1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBDb21wb25lbnRzKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKaWJzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEppYnMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJlbmRlcmVyc1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBSZW5kZXJlcnMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlRlcm1cIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlRlcm0pLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlV0aWxzXCI6ICgpID0+ICgvKiByZWV4cG9ydCBtb2R1bGUgb2JqZWN0ICovIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJkZWFkYmVlZlwiOiAoKSA9PiAoLyogcmVleHBvcnQgZGVmYXVsdCBleHBvcnQgZnJvbSBuYW1lZCBtb2R1bGUgKi8gZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzRfXyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmFjdG9yeVwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uZmFjdG9yeSlcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vamliLmpzICovIFwiLi9saWIvamliLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vY29tcG9uZW50LmpzICovIFwiLi9saWIvY29tcG9uZW50LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcmVuZGVyZXJzL2luZGV4LmpzICovIFwiLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV80X18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcblxuXG5jb25zdCBKaWJzID0ge1xuICBKSUJfQkFSUkVOOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCX0JBUlJFTixcbiAgSklCX1BST1hZOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCX1BST1hZLFxuICBKSUJfUkFXX1RFWFQ6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUJfUkFXX1RFWFQsXG4gIEpJQjogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkpJQixcbiAgSklCX0NISUxEX0lOREVYX1BST1A6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUJfQ0hJTERfSU5ERVhfUFJPUCxcbiAgSmliOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSmliLFxuICBpc0ppYmlzaDogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmlzSmliaXNoLFxuICBjb25zdHJ1Y3RKaWI6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5jb25zdHJ1Y3RKaWIsXG4gIHJlc29sdmVDaGlsZHJlbjogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLnJlc29sdmVDaGlsZHJlbixcbn07XG5cblxuXG5jb25zdCBDb21wb25lbnRzID0ge1xuICBVUERBVEVfRVZFTlQ6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5VUERBVEVfRVZFTlQsXG4gIFFVRVVFX1VQREFURV9NRVRIT0Q6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5RVUVVRV9VUERBVEVfTUVUSE9ELFxuICBGTFVTSF9VUERBVEVfTUVUSE9EOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uRkxVU0hfVVBEQVRFX01FVEhPRCxcbiAgSU5JVF9NRVRIT0Q6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5JTklUX01FVEhPRCxcbiAgU0tJUF9TVEFURV9VUERBVEVTOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uU0tJUF9TVEFURV9VUERBVEVTLFxuICBQRU5ESU5HX1NUQVRFX1VQREFURTogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlBFTkRJTkdfU1RBVEVfVVBEQVRFLFxuICBMQVNUX1JFTkRFUl9USU1FOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uTEFTVF9SRU5ERVJfVElNRSxcbiAgUFJFVklPVVNfU1RBVEU6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5QUkVWSU9VU19TVEFURSxcbn07XG5cblxuXG5jb25zdCBSZW5kZXJlcnMgPSB7XG4gIENPTlRFWFRfSUQ6IF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5Sb290Tm9kZS5DT05URVhUX0lELFxuICBGT1JDRV9SRUZMT1c6IF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5GT1JDRV9SRUZMT1csXG4gIFJvb3ROb2RlOiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uUm9vdE5vZGUsXG4gIFJlbmRlcmVyOiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uUmVuZGVyZXIsXG59O1xuXG5cblxuXG5cblxufSkoKTtcblxudmFyIF9fd2VicGFja19leHBvcnRzX18kID0gX193ZWJwYWNrX2V4cG9ydHNfXy4kO1xudmFyIF9fd2VicGFja19leHBvcnRzX19Db21wb25lbnQgPSBfX3dlYnBhY2tfZXhwb3J0c19fLkNvbXBvbmVudDtcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fQ29tcG9uZW50cyA9IF9fd2VicGFja19leHBvcnRzX18uQ29tcG9uZW50cztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fSmlicyA9IF9fd2VicGFja19leHBvcnRzX18uSmlicztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fUmVuZGVyZXJzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5SZW5kZXJlcnM7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX1Rlcm0gPSBfX3dlYnBhY2tfZXhwb3J0c19fLlRlcm07XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX1V0aWxzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5VdGlscztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fZGVhZGJlZWYgPSBfX3dlYnBhY2tfZXhwb3J0c19fLmRlYWRiZWVmO1xudmFyIF9fd2VicGFja19leHBvcnRzX19mYWN0b3J5ID0gX193ZWJwYWNrX2V4cG9ydHNfXy5mYWN0b3J5O1xuZXhwb3J0IHsgX193ZWJwYWNrX2V4cG9ydHNfXyQgYXMgJCwgX193ZWJwYWNrX2V4cG9ydHNfX0NvbXBvbmVudCBhcyBDb21wb25lbnQsIF9fd2VicGFja19leHBvcnRzX19Db21wb25lbnRzIGFzIENvbXBvbmVudHMsIF9fd2VicGFja19leHBvcnRzX19KaWJzIGFzIEppYnMsIF9fd2VicGFja19leHBvcnRzX19SZW5kZXJlcnMgYXMgUmVuZGVyZXJzLCBfX3dlYnBhY2tfZXhwb3J0c19fVGVybSBhcyBUZXJtLCBfX3dlYnBhY2tfZXhwb3J0c19fVXRpbHMgYXMgVXRpbHMsIF9fd2VicGFja19leHBvcnRzX19kZWFkYmVlZiBhcyBkZWFkYmVlZiwgX193ZWJwYWNrX2V4cG9ydHNfX2ZhY3RvcnkgYXMgZmFjdG9yeSB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWFXNWtaWGd1YW5NaUxDSnRZWEJ3YVc1bmN5STZJanM3T3pzN096czdRVUZCUVRzN1FVRkZZVHM3UVVGRllpd3JSRUZCSzBRc2NVSkJRVTA3UVVGRGNrVTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVRzN1FVRkZRVHRCUVVOQkxIbERRVUY1UXl4UlFVRlJPMEZCUTJwRUxGVkJRVlVzYjBKQlFXOUNPMEZCUXpsQ08wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFc2NVSkJRWEZDTEdWQlFXVTdPMEZCUlhCRE8wRkJRMEU3UVVGRFFTeHRRMEZCYlVNc1NVRkJTU3hsUVVGbExFbEJRVWs3TzBGQlJURkVPMEZCUTBFN08wRkJSVUVzWTBGQll5eFBRVUZQTEVkQlFVY3NTVUZCU1R0QlFVTTFRanM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxHbENRVUZwUWl4WFFVRlhMRWRCUVVjc1kwRkJZenRCUVVNM1F6dEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRXNlVU5CUVhsRExGRkJRVkU3UVVGRGFrUTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRXNlVU5CUVhsRExGRkJRVkU3UVVGRGFrUTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEcxQ1FVRnRRaXh0UWtGQmJVSTdRVUZEZEVNN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hIUVVGSE8wRkJRMGc3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRWRCUVVjN1FVRkRTRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNSMEZCUnp0QlFVTklPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeEhRVUZITzBGQlEwZ3NRMEZCUXpzN1FVRkZSRHM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3UVVNdlNFRTdPMEZCUldkRE8wRkJRMWM3UVVGRFJEdEJRVTE0UWpzN1FVRkZXRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVkE3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlR5eDNRa0ZCZDBJc2IwUkJRVms3UVVGRE0wTTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRXNTVUZCU1N4MVJFRkJjMEk3TzBGQlJURkNPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1UwRkJVenRCUVVOVU8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJMRk5CUVZNN1FVRkRWQ3hQUVVGUE8wRkJRMUE3TzBGQlJVRXNkMFZCUVhkRk8wRkJRM2hGT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc2MwSkJRWE5DTERCRFFVRlRPMEZCUXk5Q0xFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMSGRDUVVGM1FqdEJRVU40UWl4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNVMEZCVXp0QlFVTlVPMEZCUTBFN1FVRkRRU3h2UlVGQmIwVXNUVUZCVFRzN1FVRkZNVVU3UVVGRFFTeFRRVUZUTzBGQlExUXNUMEZCVHp0QlFVTlFMRXRCUVVzN1FVRkRURHM3UVVGRlFUdEJRVU5CTEZkQlFWY3NlVVJCUVc5Q08wRkJReTlDT3p0QlFVVkJPMEZCUTBFc1YwRkJWeXhwUkVGQlVUdEJRVU51UWpzN1FVRkZRVHRCUVVOQkxGZEJRVmNzY1VSQlFWazdRVUZEZGtJN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxGTkJRVk03UVVGRFZDeFBRVUZQTzBGQlExQTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRU3hSUVVGUkxHbEVRVUZuUWp0QlFVTjRRanRCUVVOQk96dEJRVVZCTEhkRFFVRjNReXhSUVVGUk8wRkJRMmhFTzBGQlEwRXNhME5CUVd0RExIZEVRVUYxUWp0QlFVTjZSRHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3hOUVVGTk8wRkJRMDRzWVVGQllTeDNSRUZCZFVJN1FVRkRjRU03UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc2FVVkJRV2xGTEUxQlFVMDdPMEZCUlhaRk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJMSGRGUVVGM1JTeE5RVUZOT3p0QlFVVTVSVHRCUVVOQk8wRkJRMEU3UVVGRFFTeE5RVUZOTzBGQlEwNDdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeHpRMEZCYzBNc1VVRkJVVHRCUVVNNVF6dEJRVU5CTzBGQlEwRTdPMEZCUlVFc1ZVRkJWU3hwUkVGQlowSTdRVUZETVVJc01rTkJRVEpETEdsRVFVRm5RanRCUVVNelJDdzBRMEZCTkVNc1VVRkJVVHRCUVVOd1JEdEJRVU5CTzBGQlEwRTdRVUZEUVN4UlFVRlJPMEZCUTFJN1FVRkRRVHRCUVVOQk96dEJRVVZCTEdWQlFXVXNhVVJCUVdkQ08wRkJReTlDT3p0QlFVVkJMR2xDUVVGcFFpeHBSRUZCWjBJN1FVRkRha01zVTBGQlV6czdRVUZGVkN3MFEwRkJORU1zVVVGQlVUdEJRVU53UkR0QlFVTkJPMEZCUTBFN1FVRkRRU3hSUVVGUkxGTkJRVk1zYVVSQlFXZENPMEZCUTJwRE8wRkJRMEVzTUVOQlFUQkRMRkZCUVZFN1FVRkRiRVE3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hWUVVGVkxHbEVRVUZuUWp0QlFVTXhRanM3UVVGRlFUdEJRVU5CTERoRFFVRTRReXhSUVVGUk8wRkJRM1JFTzBGQlEwRXNZMEZCWXl4cFJFRkJaMEk3UVVGRE9VSTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3haUVVGWk8wRkJRMW83UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc1VVRkJVVHRCUVVOU08wRkJRMEVzTUVOQlFUQkRMRkZCUVZFN1FVRkRiRVE3UVVGRFFUdEJRVU5CT3p0QlFVVkJMR05CUVdNc2FVUkJRV2RDTzBGQlF6bENPMEZCUTBFc2JVSkJRVzFDTEdsRVFVRm5RanRCUVVOdVF6dEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3haUVVGWk8wRkJRMW83UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeFhRVUZYTEdsRVFVRm5RanRCUVVNelFqczdRVUZGUVRzN1FVRkZRVHRCUVVOQkxIZERRVUYzUXl4UlFVRlJPMEZCUTJoRU8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJMRXRCUVVzN1FVRkRURHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3gzUWtGQmQwSTdRVUZEZUVJc1QwRkJUenRCUVVOUU96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeFBRVUZQT3p0QlFVVlFPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNWVUZCVlR0QlFVTldPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVN4eFEwRkJjVU1zVVVGQlVUdEJRVU0zUXp0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxIVkNRVUYxUWl4eFEwRkJVVHRCUVVNdlFqdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3hSUVVGUkxHbEVRVUZSTzBGQlEyaENMR2RDUVVGblFpeHhSRUZCV1RzN1FVRkZOVUk3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQkxHRkJRV0VzTUVOQlFVTTdRVUZEWkN4TlFVRk5PMEZCUTA0c1lVRkJZU3d3UTBGQlF6dEJRVU5rT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxHdERRVUZyUXl3MlFrRkJOa0k3UVVGREwwUXNWMEZCVnl3d1EwRkJRenRCUVVOYU8wRkJRMEU3TzBGQlJVRTdPMEZCU1VVN096czdPenM3T3pzN096czdPenRCUXpsc1FrWTdPMEZCUlU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVQ3hMUVVGTE8wRkJRMHc3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTEhWRFFVRjFReXhSUVVGUk8wRkJReTlETzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRemRIWjBNN1FVRkRTVHM3UVVGRk4wSTdRVUZEVUR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEhkQ1FVRjNRaXd5UkVGQk1rUXNSMEZCUnp0QlFVTjBSaXhQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4elFrRkJjMElzYlVSQlFXdENPMEZCUTNoRExFOUJRVTg3UVVGRFVDeExRVUZMTzBGQlEwdzdRVUZEUVRzN1FVRkZUenRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTFBc09FSkJRVGhDTzBGQlF6bENPMEZCUTBFN08wRkJSVUU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxGbEJRVmtzYVVSQlFXZENMRGhEUVVFNFF5eHBSRUZCWjBJN1FVRkRNVVk3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFhRVUZYTzBGQlExZzdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEZOQlFWTTdRVUZEVkN4VFFVRlRMREpEUVVGak8wRkJRM1pDTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1UwRkJVenRCUVVOVUxFOUJRVTg3TzBGQlJWQTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBc1QwRkJUeXd5UTBGQll6dEJRVU55UWp0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVDeExRVUZMT3p0QlFVVk1PMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRXNXVUZCV1N4cFJFRkJaMEk3UVVGRE5VSTdPMEZCUlVFN1FVRkRRU3hQUVVGUE8wRkJRMUFzUzBGQlN6dEJRVU5NTEVkQlFVYzdPMEZCUlVnN1FVRkRRVHM3UVVGRlR6czdRVUZGUVR0QlFVTlFPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUenRCUVVOUU96dEJRVVZCTEUxQlFVMHNhVVJCUVdkQ08wRkJRM1JDT3p0QlFVVkJMR2xEUVVGcFF5eHpSRUZCY1VJc2VVVkJRWGxGTEcxRVFVRnJRanRCUVVOcVNqczdRVUZGUVN4cFFrRkJhVUlzT0VOQlFXRXNiMEpCUVc5Q0xHVkJRV1U3UVVGRGFrVXNhVUpCUVdsQ0xHbEVRVUZuUWpzN1FVRkZha003UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4SFFVRkhPenRCUVVWSU8wRkJRMEU3T3pzN096czdPenM3T3pzN096czdPenM3TzBGRGNreDNRanM3UVVGRmFrSTdPMEZCUld0RE96czdPenM3T3pzN096czdPenM3TzBGRFNtcENPenRCUVVWNFFqdEJRVU5CT3p0QlFVVlBMSFZDUVVGMVFpeHRSRUZCVVR0QlFVTjBReXh2UWtGQmIwSXNiVVJCUVZFN08wRkJSVFZDTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEcxRFFVRnRRenRCUVVOdVF5eFBRVUZQTzBGQlExQXNTMEZCU3pzN1FVRkZURHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRXNWVUZCVlN4bFFVRmxPMEZCUTNwQ08wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeHJSRUZCYTBRc2NVUkJRVlU3TzBGQlJUVkVPMEZCUTBFN1FVRkRRU3g1UWtGQmVVSXNjVVJCUVZVN1FVRkRia01zY1VSQlFYRkVMSEZFUVVGVk8wRkJReTlFTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJMSGxDUVVGNVFpeHhSRUZCVlR0QlFVTnVRenM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJMRTlCUVU4N1FVRkRVQ3hMUVVGTE8wRkJRMHc3UVVGRFFUczdPenM3T3pzN096czdPenM3T3pzN096dEJRek5GWjBNN1FVRkRTenRCUVV0c1FqczdRVUZGV2pzN1FVRkZRVHRCUVVOUU96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTERoQ1FVRTRRanRCUVVNNVFpeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3h6UWtGQmMwSXNiVVJCUVd0Q08wRkJRM2hETEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNVMEZCVXp0QlFVTlVMRGhDUVVFNFFqdEJRVU01UWl4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFMRXRCUVVzN1FVRkRURHM3UVVGRlFUdEJRVU5CTEZkQlFWY3NlVVJCUVc5Q08wRkJReTlDT3p0QlFVVkJPMEZCUTBFc1YwRkJWeXhwUkVGQlVUdEJRVU51UWpzN1FVRkZRVHRCUVVOQkxGZEJRVmNzY1VSQlFWazdRVUZEZGtJN08wRkJSVUU3UVVGRFFTeFZRVUZWTEdOQlFXTXNhVUpCUVdsQ08wRkJRM3BETEcxQ1FVRnRRaXh4UTBGQlVUczdRVUZGTTBJN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxGZEJRVmNzYlVSQlFXdENPMEZCUXpkQ096dEJRVVZCTzBGQlEwRXNWMEZCVnl4elJFRkJjVUk3UVVGRGFFTTdPMEZCUlVFN1FVRkRRU3hYUVVGWExHdEVRVUZwUWp0QlFVTTFRanM3UVVGRlFUdEJRVU5CTEZkQlFWY3NjVVJCUVc5Q08wRkJReTlDT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJMRk5CUVZNN1FVRkRWRHRCUVVOQk8wRkJRMEU3UVVGRFFTeFRRVUZUTzBGQlExUXNUVUZCVFR0QlFVTk9PMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3p0QlEyaFFRVHRCUVVOblF6czdRVUZGYUVNN08wRkJSVUU3UVVGRFFTd3dSMEZCTUVjc1UwRkJTVHM3UVVGRk9VYzdPMEZCUlU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRU3d3UTBGQk1FTXNVMEZCVXp0QlFVTnVSRHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFTeHhRMEZCY1VNc1VVRkJVVHRCUVVNM1F6dEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlR6dEJRVU5RTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFc2IwSkJRVzlDTzBGQlEzQkNPenRCUVVWQk8wRkJRMEU3TzBGQlJVRXNjVU5CUVhGRExGRkJRVkU3UVVGRE4wTTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJMRWxCUVVrN1FVRkRTanRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hOUVVGTk8wRkJRMDQ3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEVzU1VGQlNUdEJRVU5LTzBGQlEwRTdPMEZCUlVFN08wRkJSVUU3UVVGRFFTeHpRMEZCYzBNc1VVRkJVVHRCUVVNNVF6dEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNSMEZCUnp0QlFVTklMRU5CUVVNN08wRkJSVTA3TzBGQlJVRTdRVUZEVUR0QlFVTkJPenRCUVVWQkxEaERRVUU0UXl4eFEwRkJVU3hqUVVGakxIRkRRVUZSTzBGQlF6VkZMRGhEUVVFNFF5eHhRMEZCVVN4alFVRmpMSEZEUVVGUk96dEJRVVUxUlR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdRVUZEUVN4SlFVRkpPMEZCUTBvN1FVRkRRU3hKUVVGSk8wRkJRMG83UVVGRFFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxIRkRRVUZ4UXl4UlFVRlJPMEZCUXpkRE96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVODdRVUZEVUR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVN4elEwRkJjME1zVVVGQlVUdEJRVU01UXp0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlU4N1FVRkRVRHRCUVVOQk96dEJRVVZQTzBGQlExQTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxIRkRRVUZ4UXl4UlFVRlJPMEZCUXpkRE8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZQTzBGQlExQTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGVHp0QlFVTlFPMEZCUTBFN08wRkJSVUVzV1VGQldTeFhRVUZYTEVkQlFVY3NUMEZCVHl4RlFVRkZMR3RGUVVGclJUdEJRVU55UnpzN096czdPenRUUTJoalFUdFRRVU5CT3p0VFFVVkJPMU5CUTBFN1UwRkRRVHRUUVVOQk8xTkJRMEU3VTBGRFFUdFRRVU5CTzFOQlEwRTdVMEZEUVR0VFFVTkJPMU5CUTBFN1UwRkRRVHRUUVVOQk96dFRRVVZCTzFOQlEwRTdPMU5CUlVFN1UwRkRRVHRUUVVOQk96czdPenRWUTNSQ1FUdFZRVU5CTzFWQlEwRTdWVUZEUVR0VlFVTkJMSGxEUVVGNVF5eDNRMEZCZDBNN1ZVRkRha1k3VlVGRFFUdFZRVU5CT3pzN096dFZRMUJCTzFWQlEwRTdWVUZEUVR0VlFVTkJPMVZCUTBFc1IwRkJSenRWUVVOSU8xVkJRMEU3VlVGRFFTeERRVUZET3pzN096dFZRMUJFT3pzN096dFZRMEZCTzFWQlEwRTdWVUZEUVR0VlFVTkJMSFZFUVVGMVJDeHBRa0ZCYVVJN1ZVRkRlRVU3VlVGRFFTeG5SRUZCWjBRc1lVRkJZVHRWUVVNM1JEczdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN08wRkRUV3RDT3p0QlFVVllPMEZCUTFBc1dVRkJXVHRCUVVOYUxGZEJRVmM3UVVGRFdDeGpRVUZqTzBGQlEyUXNTMEZCU3p0QlFVTk1MSE5DUVVGelFqdEJRVU4wUWl4TFFVRkxPMEZCUTB3c1ZVRkJWVHRCUVVOV0xHTkJRV003UVVGRFpDeHBRa0ZCYVVJN1FVRkRha0k3TzBGQlkzZENPenRCUVVWcVFqdEJRVU5RTEdOQlFXTTdRVUZEWkN4eFFrRkJjVUk3UVVGRGNrSXNjVUpCUVhGQ08wRkJRM0pDTEdGQlFXRTdRVUZEWWl4dlFrRkJiMEk3UVVGRGNFSXNjMEpCUVhOQ08wRkJRM1JDTEd0Q1FVRnJRanRCUVVOc1FpeG5Ra0ZCWjBJN1FVRkRhRUk3TzBGQlRUaENPenRCUVVWMlFqdEJRVU5RTEdOQlFXTXNiMFZCUVcxQ08wRkJRMnBETEdOQlFXTTdRVUZEWkN4VlFVRlZPMEZCUTFZc1ZVRkJWVHRCUVVOV096dEJRVVZ2UXp0QlFVTlhPenRCUVU4M1F5SXNJbk52ZFhKalpYTWlPbHNpZDJWaWNHRmphem92TDJwcFluTXZMaTl1YjJSbFgyMXZaSFZzWlhNdlpHVmhaR0psWldZdmJHbGlMMmx1WkdWNExtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZMaTlzYVdJdlkyOXRjRzl1Wlc1MExtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZMaTlzYVdJdlpYWmxiblJ6TG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2YW1saUxtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZMaTlzYVdJdmNtVnVaR1Z5WlhKekwybHVaR1Y0TG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2Y21WdVpHVnlaWEp6TDNKbGJtUmxjbVZ5TG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdkxpOXNhV0l2Y21WdVpHVnlaWEp6TDNKdmIzUXRibTlrWlM1cWN5SXNJbmRsWW5CaFkyczZMeTlxYVdKekx5NHZiR2xpTDNWMGFXeHpMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12ZDJWaWNHRmpheTlpYjI5MGMzUnlZWEFpTENKM1pXSndZV05yT2k4dmFtbGljeTkzWldKd1lXTnJMM0oxYm5ScGJXVXZaR1ZtYVc1bElIQnliM0JsY25SNUlHZGxkSFJsY25NaUxDSjNaV0p3WVdOck9pOHZhbWxpY3k5M1pXSndZV05yTDNKMWJuUnBiV1V2WjJ4dlltRnNJaXdpZDJWaWNHRmphem92TDJwcFluTXZkMlZpY0dGamF5OXlkVzUwYVcxbEwyaGhjMDkzYmxCeWIzQmxjblI1SUhOb2IzSjBhR0Z1WkNJc0luZGxZbkJoWTJzNkx5OXFhV0p6TDNkbFluQmhZMnN2Y25WdWRHbHRaUzl0WVd0bElHNWhiV1Z6Y0dGalpTQnZZbXBsWTNRaUxDSjNaV0p3WVdOck9pOHZhbWxpY3k4dUwyeHBZaTlwYm1SbGVDNXFjeUpkTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lJdkx5QkRiM0I1Y21sbmFIUWdNakF5TWlCWGVXRjBkQ0JIY21WbGJuZGhlVnh1WEc0bmRYTmxJSE4wY21samRDYzdYRzVjYm1OdmJuTjBJSFJvYVhOSGJHOWlZV3dnUFNBb0tIUjVjR1Z2WmlCM2FXNWtiM2NnSVQwOUlDZDFibVJsWm1sdVpXUW5LU0EvSUhkcGJtUnZkeUE2SUdkc2IySmhiQ2tnZkh3Z2RHaHBjenRjYm1OdmJuTjBJRVJGUVVSQ1JVVkdYMUpGUmw5TlFWQmZTMFZaSUQwZ1UzbHRZbTlzTG1admNpZ25RRUJrWldGa1ltVmxabEpsWmsxaGNDY3BPMXh1WTI5dWMzUWdWVTVKVVZWRlgwbEVYMU5aVFVKUFRDQTlJRk41YldKdmJDNW1iM0lvSjBCQVpHVmhaR0psWldaVmJtbHhkV1ZKUkNjcE8xeHVZMjl1YzNRZ2NtVm1UV0Z3SUQwZ0tIUm9hWE5IYkc5aVlXeGJSRVZCUkVKRlJVWmZVa1ZHWDAxQlVGOUxSVmxkS1NBL0lIUm9hWE5IYkc5aVlXeGJSRVZCUkVKRlJVWmZVa1ZHWDAxQlVGOUxSVmxkSURvZ2JtVjNJRmRsWVd0TllYQW9LVHRjYm1OdmJuTjBJR2xrU0dWc2NHVnljeUE5SUZ0ZE8xeHVYRzVwWmlBb0lYUm9hWE5IYkc5aVlXeGJSRVZCUkVKRlJVWmZVa1ZHWDAxQlVGOUxSVmxkS1Z4dUlDQjBhR2x6UjJ4dlltRnNXMFJGUVVSQ1JVVkdYMUpGUmw5TlFWQmZTMFZaWFNBOUlISmxaazFoY0R0Y2JseHViR1YwSUhWMWFXUkRiM1Z1ZEdWeUlEMGdNRzQ3WEc1Y2JtWjFibU4wYVc5dUlHZGxkRWhsYkhCbGNrWnZjbFpoYkhWbEtIWmhiSFZsS1NCN1hHNGdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUdsa1NHVnNjR1Z5Y3k1c1pXNW5kR2c3SUdrZ1BDQnBiRHNnYVNzcktTQjdYRzRnSUNBZ2JHVjBJSHNnYUdWc2NHVnlMQ0JuWlc1bGNtRjBiM0lnZlNBOUlHbGtTR1ZzY0dWeWMxdHBYVHRjYmlBZ0lDQnBaaUFvYUdWc2NHVnlLSFpoYkhWbEtTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCblpXNWxjbUYwYjNJN1hHNGdJSDFjYm4xY2JseHVablZ1WTNScGIyNGdZVzU1ZEdocGJtZFViMGxFS0Y5aGNtY3NJRjloYkhKbFlXUjVWbWx6YVhSbFpDa2dlMXh1SUNCc1pYUWdZWEpuSUQwZ1gyRnlaenRjYmlBZ2FXWWdLR0Z5WnlCcGJuTjBZVzVqWlc5bUlFNTFiV0psY2lCOGZDQmhjbWNnYVc1emRHRnVZMlZ2WmlCVGRISnBibWNnZkh3Z1lYSm5JR2x1YzNSaGJtTmxiMllnUW05dmJHVmhiaWxjYmlBZ0lDQmhjbWNnUFNCaGNtY3VkbUZzZFdWUFppZ3BPMXh1WEc0Z0lHeGxkQ0IwZVhCbFQyWWdQU0IwZVhCbGIyWWdZWEpuTzF4dVhHNGdJR2xtSUNoMGVYQmxUMllnUFQwOUlDZHVkVzFpWlhJbklDWW1JR0Z5WnlBOVBUMGdNQ2tnZTF4dUlDQWdJR2xtSUNoUFltcGxZM1F1YVhNb1lYSm5MQ0F0TUNrcFhHNGdJQ0FnSUNCeVpYUjFjbTRnSjI1MWJXSmxjam90TUNjN1hHNWNiaUFnSUNCeVpYUjFjbTRnSjI1MWJXSmxjam9yTUNjN1hHNGdJSDFjYmx4dUlDQnBaaUFvZEhsd1pVOW1JRDA5UFNBbmMzbHRZbTlzSnlsY2JpQWdJQ0J5WlhSMWNtNGdZSE41YldKdmJEb2tlMkZ5Wnk1MGIxTjBjbWx1WnlncGZXQTdYRzVjYmlBZ2FXWWdLR0Z5WnlBOVBTQnVkV3hzSUh4OElIUjVjR1ZQWmlBOVBUMGdKMjUxYldKbGNpY2dmSHdnZEhsd1pVOW1JRDA5UFNBblltOXZiR1ZoYmljZ2ZId2dkSGx3WlU5bUlEMDlQU0FuYzNSeWFXNW5KeUI4ZkNCMGVYQmxUMllnUFQwOUlDZGlhV2RwYm5RbktTQjdYRzRnSUNBZ2FXWWdLSFI1Y0dWUFppQTlQVDBnSjI1MWJXSmxjaWNwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdLR0Z5WnlBOElEQXBJRDhnWUc1MWJXSmxjam9rZTJGeVozMWdJRG9nWUc1MWJXSmxjam9ySkh0aGNtZDlZRHRjYmx4dUlDQWdJR2xtSUNoMGVYQmxUMllnUFQwOUlDZGlhV2RwYm5RbklDWW1JR0Z5WnlBOVBUMGdNRzRwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdKMkpwWjJsdWREb3JNQ2M3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdZQ1I3ZEhsd1pVOW1mVG9rZTJGeVozMWdPMXh1SUNCOVhHNWNiaUFnYkdWMElHbGtTR1ZzY0dWeUlEMGdLR2xrU0dWc2NHVnljeTVzWlc1bmRHZ2dQaUF3SUNZbUlHZGxkRWhsYkhCbGNrWnZjbFpoYkhWbEtHRnlaeWtwTzF4dUlDQnBaaUFvYVdSSVpXeHdaWElwWEc0Z0lDQWdjbVYwZFhKdUlHRnVlWFJvYVc1blZHOUpSQ2hwWkVobGJIQmxjaWhoY21jcEtUdGNibHh1SUNCcFppQW9WVTVKVVZWRlgwbEVYMU5aVFVKUFRDQnBiaUJoY21jZ0ppWWdkSGx3Wlc5bUlHRnlaMXRWVGtsUlZVVmZTVVJmVTFsTlFrOU1YU0E5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lDOHZJRkJ5WlhabGJuUWdhVzVtYVc1cGRHVWdjbVZqZFhKemFXOXVYRzRnSUNBZ2FXWWdLQ0ZmWVd4eVpXRmtlVlpwYzJsMFpXUWdmSHdnSVY5aGJISmxZV1I1Vm1semFYUmxaQzVvWVhNb1lYSm5LU2tnZTF4dUlDQWdJQ0FnYkdWMElHRnNjbVZoWkhsV2FYTnBkR1ZrSUQwZ1gyRnNjbVZoWkhsV2FYTnBkR1ZrSUh4OElHNWxkeUJUWlhRb0tUdGNiaUFnSUNBZ0lHRnNjbVZoWkhsV2FYTnBkR1ZrTG1Ga1pDaGhjbWNwTzF4dUlDQWdJQ0FnY21WMGRYSnVJR0Z1ZVhSb2FXNW5WRzlKUkNoaGNtZGJWVTVKVVZWRlgwbEVYMU5aVFVKUFRGMG9LU3dnWVd4eVpXRmtlVlpwYzJsMFpXUXBPMXh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJR2xtSUNnaGNtVm1UV0Z3TG1oaGN5aGhjbWNwS1NCN1hHNGdJQ0FnYkdWMElHdGxlU0E5SUdBa2UzUjVjR1Z2WmlCaGNtZDlPaVI3S3l0MWRXbGtRMjkxYm5SbGNuMWdPMXh1SUNBZ0lISmxaazFoY0M1elpYUW9ZWEpuTENCclpYa3BPMXh1SUNBZ0lISmxkSFZ5YmlCclpYazdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdjbVZtVFdGd0xtZGxkQ2hoY21jcE8xeHVmVnh1WEc1bWRXNWpkR2x2YmlCa1pXRmtZbVZsWmlncElIdGNiaUFnYkdWMElIQmhjblJ6SUQwZ1d5QmhjbWQxYldWdWRITXViR1Z1WjNSb0lGMDdYRzRnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLVnh1SUNBZ0lIQmhjblJ6TG5CMWMyZ29ZVzU1ZEdocGJtZFViMGxFS0dGeVozVnRaVzUwYzF0cFhTa3BPMXh1WEc0Z0lISmxkSFZ5YmlCd1lYSjBjeTVxYjJsdUtDYzZKeWs3WEc1OVhHNWNibVoxYm1OMGFXOXVJR1JsWVdSaVpXVm1VMjl5ZEdWa0tDa2dlMXh1SUNCc1pYUWdjR0Z5ZEhNZ1BTQmJJR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dYVHRjYmlBZ1ptOXlJQ2hzWlhRZ2FTQTlJREFzSUdsc0lEMGdZWEpuZFcxbGJuUnpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwWEc0Z0lDQWdjR0Z5ZEhNdWNIVnphQ2hoYm5sMGFHbHVaMVJ2U1VRb1lYSm5kVzFsYm5SelcybGRLU2s3WEc1Y2JpQWdjbVYwZFhKdUlIQmhjblJ6TG5OdmNuUW9LUzVxYjJsdUtDYzZKeWs3WEc1OVhHNWNibVoxYm1OMGFXOXVJR2RsYm1WeVlYUmxTVVJHYjNJb2FHVnNjR1Z5TENCblpXNWxjbUYwYjNJcElIdGNiaUFnYVdSSVpXeHdaWEp6TG5CMWMyZ29leUJvWld4d1pYSXNJR2RsYm1WeVlYUnZjaUI5S1R0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnY21WdGIzWmxTVVJIWlc1bGNtRjBiM0lvYUdWc2NHVnlLU0I3WEc0Z0lHeGxkQ0JwYm1SbGVDQTlJR2xrU0dWc2NHVnljeTVtYVc1a1NXNWtaWGdvS0dsMFpXMHBJRDArSUNocGRHVnRMbWhsYkhCbGNpQTlQVDBnYUdWc2NHVnlLU2s3WEc0Z0lHbG1JQ2hwYm1SbGVDQThJREFwWEc0Z0lDQWdjbVYwZFhKdU8xeHVYRzRnSUdsa1NHVnNjR1Z5Y3k1emNHeHBZMlVvYVc1a1pYZ3NJREVwTzF4dWZWeHVYRzVQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEdsbGN5aGtaV0ZrWW1WbFppd2dlMXh1SUNBbmFXUlRlVzBuT2lCN1hHNGdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQjBjblZsTEZ4dUlDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnVlU1SlVWVkZYMGxFWDFOWlRVSlBUQ3hjYmlBZ2ZTeGNiaUFnSjNOdmNuUmxaQ2M2SUh0Y2JpQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0JrWldGa1ltVmxabE52Y25SbFpDeGNiaUFnZlN4Y2JpQWdKMmRsYm1WeVlYUmxTVVJHYjNJbk9pQjdYRzRnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1oyVnVaWEpoZEdWSlJFWnZjaXhjYmlBZ2ZTeGNiaUFnSjNKbGJXOTJaVWxFUjJWdVpYSmhkRzl5SnpvZ2UxeHVJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUhKbGJXOTJaVWxFUjJWdVpYSmhkRzl5TEZ4dUlDQjlMRnh1ZlNrN1hHNWNibTF2WkhWc1pTNWxlSEJ2Y25SeklEMGdaR1ZoWkdKbFpXWTdYRzRpTENJdktpQm5iRzlpWVd3Z1FuVm1abVZ5SUNvdlhHNWNibWx0Y0c5eWRDQmtaV0ZrWW1WbFppQm1jbTl0SUNka1pXRmtZbVZsWmljN1hHNXBiWEJ2Y25RZ2V5QkZkbVZ1ZEVWdGFYUjBaWElnZlNCbWNtOXRJQ2N1TDJWMlpXNTBjeTVxY3ljN1hHNXBiWEJ2Y25RZ0tpQmhjeUJWZEdsc2N5QWdJQ0FnSUNCbWNtOXRJQ2N1TDNWMGFXeHpMbXB6Snp0Y2JtbHRjRzl5ZENCN1hHNGdJQ1FzWEc0Z0lHbHpTbWxpYVhOb0xGeHVJQ0J5WlhOdmJIWmxRMmhwYkdSeVpXNHNYRzRnSUdOdmJuTjBjblZqZEVwcFlpeGNibjBnWm5KdmJTQW5MaTlxYVdJdWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdWVkJFUVZSRlgwVldSVTVVSUNBZ0lDQWdJQ0FnSUNBZ0lDQTlJQ2RBYW1saWN5OWpiMjF3YjI1bGJuUXZaWFpsYm5RdmRYQmtZWFJsSnp0Y2JtVjRjRzl5ZENCamIyNXpkQ0JSVlVWVlJWOVZVRVJCVkVWZlRVVlVTRTlFSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk12WTI5dGNHOXVaVzUwTDNGMVpYVmxWWEJrWVhSbEp5azdYRzVsZUhCdmNuUWdZMjl1YzNRZ1JreFZVMGhmVlZCRVFWUkZYMDFGVkVoUFJDQWdJQ0FnSUNBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekwyTnZiWEJ2Ym1WdWRDOW1iSFZ6YUZWd1pHRjBaU2NwTzF4dVpYaHdiM0owSUdOdmJuTjBJRWxPU1ZSZlRVVlVTRTlFSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljeTlqYjIxd2IyNWxiblF2WDE5cGJtbDBKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdVMHRKVUY5VFZFRlVSVjlWVUVSQlZFVlRJQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl6YTJsd1UzUmhkR1ZWY0dSaGRHVnpKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdVRVZPUkVsT1IxOVRWRUZVUlY5VlVFUkJWRVVnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl3Wlc1a2FXNW5VM1JoZEdWVmNHUmhkR1VuS1R0Y2JtVjRjRzl5ZENCamIyNXpkQ0JNUVZOVVgxSkZUa1JGVWw5VVNVMUZJQ0FnSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk12WTI5dGNHOXVaVzUwTDJ4aGMzUlNaVzVrWlhKVWFXMWxKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdVRkpGVmtsUFZWTmZVMVJCVkVVZ0lDQWdJQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl3Y21WMmFXOTFjMU4wWVhSbEp5azdYRzVsZUhCdmNuUWdZMjl1YzNRZ1EwRlFWRlZTUlY5U1JVWkZVa1ZPUTBWZlRVVlVTRTlFVXlBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekwyTnZiWEJ2Ym1WdWRDOXdjbVYyYVc5MWMxTjBZWFJsSnlrN1hHNWNibU52Ym5OMElHVnNaVzFsYm5SRVlYUmhRMkZqYUdVZ1BTQnVaWGNnVjJWaGEwMWhjQ2dwTzF4dVhHNW1kVzVqZEdsdmJpQnBjMVpoYkdsa1UzUmhkR1ZQWW1wbFkzUW9kbUZzZFdVcElIdGNiaUFnYVdZZ0tIWmhiSFZsSUQwOUlHNTFiR3dwWEc0Z0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dVhHNGdJR2xtSUNoUFltcGxZM1F1YVhNb2RtRnNkV1VzSUU1aFRpa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2hQWW1wbFkzUXVhWE1vZG1Gc2RXVXNJRWx1Wm1sdWFYUjVLU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0haaGJIVmxJR2x1YzNSaGJtTmxiMllnUW05dmJHVmhiaUI4ZkNCMllXeDFaU0JwYm5OMFlXNWpaVzltSUU1MWJXSmxjaUI4ZkNCMllXeDFaU0JwYm5OMFlXNWpaVzltSUZOMGNtbHVaeWxjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdiR1YwSUhSNWNHVlBaaUE5SUhSNWNHVnZaaUIyWVd4MVpUdGNiaUFnYVdZZ0tIUjVjR1ZQWmlBOVBUMGdKM04wY21sdVp5Y2dmSHdnZEhsd1pVOW1JRDA5UFNBbmJuVnRZbVZ5SnlCOGZDQjBlWEJsVDJZZ1BUMDlJQ2RpYjI5c1pXRnVKeWxjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0VGeWNtRjVMbWx6UVhKeVlYa29kbUZzZFdVcEtWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCcFppQW9kSGx3Wlc5bUlFSjFabVpsY2lBaFBUMGdKM1Z1WkdWbWFXNWxaQ2NnSmlZZ1FuVm1abVZ5TG1selFuVm1abVZ5S0haaGJIVmxLU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdjbVYwZFhKdUlIUnlkV1U3WEc1OVhHNWNibVY0Y0c5eWRDQmpiR0Z6Y3lCRGIyMXdiMjVsYm5RZ1pYaDBaVzVrY3lCRmRtVnVkRVZ0YVhSMFpYSWdlMXh1SUNCemRHRjBhV01nVlZCRVFWUkZYMFZXUlU1VUlEMGdWVkJFUVZSRlgwVldSVTVVTzF4dVhHNGdJRnRSVlVWVlJWOVZVRVJCVkVWZlRVVlVTRTlFWFNncElIdGNiaUFnSUNCcFppQW9kR2hwYzF0UVJVNUVTVTVIWDFOVVFWUkZYMVZRUkVGVVJWMHBYRzRnSUNBZ0lDQnlaWFIxY200N1hHNWNiaUFnSUNCMGFHbHpXMUJGVGtSSlRrZGZVMVJCVkVWZlZWQkVRVlJGWFNBOUlGQnliMjFwYzJVdWNtVnpiMngyWlNncE8xeHVJQ0FnSUhSb2FYTmJVRVZPUkVsT1IxOVRWRUZVUlY5VlVFUkJWRVZkTG5Sb1pXNG9kR2hwYzF0R1RGVlRTRjlWVUVSQlZFVmZUVVZVU0U5RVhTNWlhVzVrS0hSb2FYTXBLVHRjYmlBZ2ZWeHVYRzRnSUZ0R1RGVlRTRjlWVUVSQlZFVmZUVVZVU0U5RVhTZ3BJSHRjYmlBZ0lDQXZMeUJYWVhNZ2RHaGxJSE4wWVhSbElIVndaR0YwWlNCallXNWpaV3hzWldRL1hHNGdJQ0FnYVdZZ0tDRjBhR2x6VzFCRlRrUkpUa2RmVTFSQlZFVmZWVkJFUVZSRlhTbGNiaUFnSUNBZ0lISmxkSFZ5Ymp0Y2JseHVJQ0FnSUhSb2FYTXVaVzFwZENoVlVFUkJWRVZmUlZaRlRsUXBPMXh1WEc0Z0lDQWdkR2hwYzF0UVJVNUVTVTVIWDFOVVFWUkZYMVZRUkVGVVJWMGdQU0J1ZFd4c08xeHVJQ0I5WEc1Y2JpQWdXMGxPU1ZSZlRVVlVTRTlFWFNncElIdGNiaUFnSUNCMGFHbHpXMU5MU1ZCZlUxUkJWRVZmVlZCRVFWUkZVMTBnUFNCbVlXeHpaVHRjYmlBZ2ZWeHVYRzRnSUdOdmJuTjBjblZqZEc5eUtGOXFhV0lwSUh0Y2JpQWdJQ0J6ZFhCbGNpZ3BPMXh1WEc0Z0lDQWdMeThnUW1sdVpDQmhiR3dnWTJ4aGMzTWdiV1YwYUc5a2N5QjBieUJjSW5Sb2FYTmNJbHh1SUNBZ0lGVjBhV3h6TG1KcGJtUk5aWFJvYjJSekxtTmhiR3dvZEdocGN5d2dkR2hwY3k1amIyNXpkSEoxWTNSdmNpNXdjbTkwYjNSNWNHVXBPMXh1WEc0Z0lDQWdiR1YwSUdwcFlpQTlJRjlxYVdJZ2ZId2dlMzA3WEc1Y2JpQWdJQ0JqYjI1emRDQmpjbVZoZEdWT1pYZFRkR0YwWlNBOUlDZ3BJRDArSUh0Y2JpQWdJQ0FnSUd4bGRDQnNiMk5oYkZOMFlYUmxJRDBnVDJKcVpXTjBMbU55WldGMFpTaHVkV3hzS1R0Y2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QlFjbTk0ZVNoc2IyTmhiRk4wWVhSbExDQjdYRzRnSUNBZ0lDQWdJR2RsZERvZ0tIUmhjbWRsZEN3Z2NISnZjRTVoYldVcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEdGeVoyVjBXM0J5YjNCT1lXMWxYVHRjYmlBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNBZ2MyVjBPaUFvZEdGeVoyVjBMQ0J3Y205d1RtRnRaU3dnZG1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnWTNWeWNtVnVkRlpoYkhWbElEMGdkR0Z5WjJWMFczQnliM0JPWVcxbFhUdGNiaUFnSUNBZ0lDQWdJQ0JwWmlBb1kzVnljbVZ1ZEZaaGJIVmxJRDA5UFNCMllXeDFaU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0YwYUdselcxTkxTVkJmVTFSQlZFVmZWVkJFUVZSRlUxMHBYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFHbHpXMUZWUlZWRlgxVlFSRUZVUlY5TlJWUklUMFJkS0NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0IwWVhKblpYUmJjSEp2Y0U1aGJXVmRJRDBnZG1Gc2RXVTdYRzRnSUNBZ0lDQWdJQ0FnZEdocGN5NXZibE4wWVhSbFZYQmtZWFJsWkNod2NtOXdUbUZ0WlN3Z2RtRnNkV1VzSUdOMWNuSmxiblJXWVd4MVpTazdYRzVjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJSDBwTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JzWlhRZ2NISnZjSE1nSUNBZ0lDQWdQU0JQWW1wbFkzUXVZWE56YVdkdUtFOWlhbVZqZEM1amNtVmhkR1VvYm5Wc2JDa3NJR3BwWWk1d2NtOXdjeUI4ZkNCN2ZTazdYRzRnSUNBZ2JHVjBJRjlzYjJOaGJGTjBZWFJsSUQwZ1kzSmxZWFJsVG1WM1UzUmhkR1VvS1R0Y2JseHVJQ0FnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGFXVnpLSFJvYVhNc0lIdGNiaUFnSUNBZ0lGdFRTMGxRWDFOVVFWUkZYMVZRUkVGVVJWTmRPaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnVzFCRlRrUkpUa2RmVTFSQlZFVmZWVkJFUVZSRlhUb2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCUWNtOXRhWE5sTG5KbGMyOXNkbVVvS1N4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCYlRFRlRWRjlTUlU1RVJWSmZWRWxOUlYwNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnVlhScGJITXVibTkzS0Nrc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ1cwTkJVRlJWVWtWZlVrVkdSVkpGVGtORlgwMUZWRWhQUkZOZE9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUh0OUxGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHBaQ2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0JxYVdJdWFXUXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKM0J5YjNCekp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCd2NtOXdjeXhjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuWTJocGJHUnlaVzRuT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJR3BwWWk1amFHbHNaSEpsYmlCOGZDQmJYU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuWTI5dWRHVjRkQ2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdhbWxpTG1OdmJuUmxlSFFnZkh3Z1QySnFaV04wTG1OeVpXRjBaU2h1ZFd4c0tTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQW5jM1JoZEdVbk9pQjdYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1oyVjBPaUFnSUNBZ0lDQWdJQ0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRjlzYjJOaGJGTjBZWFJsTzF4dUlDQWdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0lDQnpaWFE2SUNBZ0lDQWdJQ0FnSUNoMllXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJR2xtSUNnaGFYTldZV3hwWkZOMFlYUmxUMkpxWldOMEtIWmhiSFZsS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lHNWxkeUJVZVhCbFJYSnliM0lvWUVsdWRtRnNhV1FnZG1Gc2RXVWdabTl5SUZ3aWRHaHBjeTV6ZEdGMFpWd2lPaUJjSWlSN2RtRnNkV1Y5WENJdUlGQnliM1pwWkdWa0lGd2ljM1JoZEdWY0lpQnRkWE4wSUdKbElHRnVJR2wwWlhKaFlteGxJRzlpYW1WamRDNWdLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lFOWlhbVZqZEM1aGMzTnBaMjRvWDJ4dlkyRnNVM1JoZEdVc0lIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ2ZTazdYRzRnSUgxY2JseHVJQ0J5WlhOdmJIWmxRMmhwYkdSeVpXNG9ZMmhwYkdSeVpXNHBJSHRjYmlBZ0lDQnlaWFIxY200Z2NtVnpiMngyWlVOb2FXeGtjbVZ1TG1OaGJHd29kR2hwY3l3Z1kyaHBiR1J5Wlc0cE8xeHVJQ0I5WEc1Y2JpQWdhWE5LYVdJb2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdhWE5LYVdKcGMyZ29kbUZzZFdVcE8xeHVJQ0I5WEc1Y2JpQWdZMjl1YzNSeWRXTjBTbWxpS0haaGJIVmxLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHTnZibk4wY25WamRFcHBZaWgyWVd4MVpTazdYRzRnSUgxY2JseHVJQ0J3ZFhOb1VtVnVaR1Z5S0hKbGJtUmxjbEpsYzNWc2RDa2dlMXh1SUNBZ0lIUm9hWE11WlcxcGRDaFZVRVJCVkVWZlJWWkZUbFFzSUhKbGJtUmxjbEpsYzNWc2RDazdYRzRnSUgxY2JseHVJQ0F2THlCbGMyeHBiblF0WkdsellXSnNaUzF1WlhoMExXeHBibVVnYm04dGRXNTFjMlZrTFhaaGNuTmNiaUFnYjI1UWNtOXdWWEJrWVhSbFpDaHdjbTl3VG1GdFpTd2dibVYzVm1Gc2RXVXNJRzlzWkZaaGJIVmxLU0I3WEc0Z0lIMWNibHh1SUNBdkx5QmxjMnhwYm5RdFpHbHpZV0pzWlMxdVpYaDBMV3hwYm1VZ2JtOHRkVzUxYzJWa0xYWmhjbk5jYmlBZ2IyNVRkR0YwWlZWd1pHRjBaV1FvY0hKdmNFNWhiV1VzSUc1bGQxWmhiSFZsTENCdmJHUldZV3gxWlNrZ2UxeHVJQ0I5WEc1Y2JpQWdZMkZ3ZEhWeVpWSmxabVZ5Wlc1alpTaHVZVzFsTENCcGJuUmxjbU5sY0hSdmNrTmhiR3hpWVdOcktTQjdYRzRnSUNBZ2JHVjBJRzFsZEdodlpDQTlJSFJvYVhOYlEwRlFWRlZTUlY5U1JVWkZVa1ZPUTBWZlRVVlVTRTlFVTExYmJtRnRaVjA3WEc0Z0lDQWdhV1lnS0cxbGRHaHZaQ2xjYmlBZ0lDQWdJSEpsZEhWeWJpQnRaWFJvYjJRN1hHNWNiaUFnSUNCdFpYUm9iMlFnUFNBb1gzSmxaaXdnY0hKbGRtbHZkWE5TWldZcElEMCtJSHRjYmlBZ0lDQWdJR3hsZENCeVpXWWdQU0JmY21WbU8xeHVYRzRnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JR2x1ZEdWeVkyVndkRzl5UTJGc2JHSmhZMnNnUFQwOUlDZG1kVzVqZEdsdmJpY3BYRzRnSUNBZ0lDQWdJSEpsWmlBOUlHbHVkR1Z5WTJWd2RHOXlRMkZzYkdKaFkyc3VZMkZzYkNoMGFHbHpMQ0J5WldZc0lIQnlaWFpwYjNWelVtVm1LVHRjYmx4dUlDQWdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9kR2hwY3l3Z2UxeHVJQ0FnSUNBZ0lDQmJibUZ0WlYwNklIdGNiaUFnSUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J5WldZc1hHNGdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUJwYm5SbGNtTmxjSFJ2Y2tOaGJHeGlZV05ySUNFOVBTQW5ablZ1WTNScGIyNG5LVnh1SUNBZ0lDQWdkR2hwYzF0RFFWQlVWVkpGWDFKRlJrVlNSVTVEUlY5TlJWUklUMFJUWFNBOUlHMWxkR2h2WkR0Y2JseHVJQ0FnSUhKbGRIVnliaUJ0WlhSb2IyUTdYRzRnSUgxY2JseHVJQ0JtYjNKalpWVndaR0YwWlNncElIdGNiaUFnSUNCMGFHbHpXMUZWUlZWRlgxVlFSRUZVUlY5TlJWUklUMFJkS0NrN1hHNGdJSDFjYmx4dUlDQm5aWFJUZEdGMFpTaHdjbTl3WlhKMGVWQmhkR2dzSUdSbFptRjFiSFJXWVd4MVpTa2dlMXh1SUNBZ0lHeGxkQ0J6ZEdGMFpTQTlJSFJvYVhNdWMzUmhkR1U3WEc0Z0lDQWdhV1lnS0dGeVozVnRaVzUwY3k1c1pXNW5kR2dnUFQwOUlEQXBYRzRnSUNBZ0lDQnlaWFIxY200Z2MzUmhkR1U3WEc1Y2JpQWdJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmlod2NtOXdaWEowZVZCaGRHZ3NJQ2R2WW1wbFkzUW5LU2tnZTF4dUlDQWdJQ0FnYkdWMElHdGxlWE1nSUNBZ0lDQWdJRDBnVDJKcVpXTjBMbXRsZVhNb2NISnZjR1Z5ZEhsUVlYUm9LUzVqYjI1allYUW9UMkpxWldOMExtZGxkRTkzYmxCeWIzQmxjblI1VTNsdFltOXNjeWh3Y205d1pYSjBlVkJoZEdncEtUdGNiaUFnSUNBZ0lHeGxkQ0JtYVc1aGJGTjBZWFJsSUNBOUlIdDlPMXh1WEc0Z0lDQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCclpYbHpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJR3RsZVNBOUlHdGxlWE5iYVYwN1hHNGdJQ0FnSUNBZ0lHeGxkQ0JiSUhaaGJIVmxMQ0JzWVhOMFVHRnlkQ0JkSUQwZ1ZYUnBiSE11Wm1WMFkyaEVaV1Z3VUhKdmNHVnlkSGtvYzNSaGRHVXNJR3RsZVN3Z2NISnZjR1Z5ZEhsUVlYUm9XMnRsZVYwc0lIUnlkV1VwTzF4dUlDQWdJQ0FnSUNCcFppQW9iR0Z6ZEZCaGNuUWdQVDBnYm5Wc2JDbGNiaUFnSUNBZ0lDQWdJQ0JqYjI1MGFXNTFaVHRjYmx4dUlDQWdJQ0FnSUNCbWFXNWhiRk4wWVhSbFcyeGhjM1JRWVhKMFhTQTlJSFpoYkhWbE8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnlaWFIxY200Z1ptbHVZV3hUZEdGMFpUdGNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnY21WMGRYSnVJRlYwYVd4ekxtWmxkR05vUkdWbGNGQnliM0JsY25SNUtITjBZWFJsTENCd2NtOXdaWEowZVZCaGRHZ3NJR1JsWm1GMWJIUldZV3gxWlNrN1hHNGdJQ0FnZlZ4dUlDQjlYRzVjYmlBZ2MyVjBVM1JoZEdVb2RtRnNkV1VwSUh0Y2JpQWdJQ0JwWmlBb0lXbHpWbUZzYVdSVGRHRjBaVTlpYW1WamRDaDJZV3gxWlNrcFhHNGdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtHQkpiblpoYkdsa0lIWmhiSFZsSUdadmNpQmNJblJvYVhNdWMyVjBVM1JoZEdWY0lqb2dYQ0lrZTNaaGJIVmxmVndpTGlCUWNtOTJhV1JsWkNCY0luTjBZWFJsWENJZ2JYVnpkQ0JpWlNCaGJpQnBkR1Z5WVdKc1pTQnZZbXBsWTNRdVlDazdYRzVjYmlBZ0lDQlBZbXBsWTNRdVlYTnphV2R1S0hSb2FYTXVjM1JoZEdVc0lIWmhiSFZsS1R0Y2JpQWdmVnh1WEc0Z0lITmxkRk4wWVhSbFVHRnpjMmwyWlNoMllXeDFaU2tnZTF4dUlDQWdJR2xtSUNnaGFYTldZV3hwWkZOMFlYUmxUMkpxWldOMEtIWmhiSFZsS1NsY2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb1lFbHVkbUZzYVdRZ2RtRnNkV1VnWm05eUlGd2lkR2hwY3k1elpYUlRkR0YwWlZCaGMzTnBkbVZjSWpvZ1hDSWtlM1poYkhWbGZWd2lMaUJRY205MmFXUmxaQ0JjSW5OMFlYUmxYQ0lnYlhWemRDQmlaU0JoYmlCcGRHVnlZV0pzWlNCdlltcGxZM1F1WUNrN1hHNWNiaUFnSUNCMGNua2dlMXh1SUNBZ0lDQWdkR2hwYzF0VFMwbFFYMU5VUVZSRlgxVlFSRUZVUlZOZElEMGdkSEoxWlR0Y2JpQWdJQ0FnSUU5aWFtVmpkQzVoYzNOcFoyNG9kR2hwY3k1emRHRjBaU3dnZG1Gc2RXVXBPMXh1SUNBZ0lIMGdabWx1WVd4c2VTQjdYRzRnSUNBZ0lDQjBhR2x6VzFOTFNWQmZVMVJCVkVWZlZWQkVRVlJGVTEwZ1BTQm1ZV3h6WlR0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCemFHOTFiR1JWY0dSaGRHVW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc0Z0lIMWNibHh1SUNCa1pYTjBjbTk1S0NrZ2UxeHVJQ0FnSUdSbGJHVjBaU0IwYUdsekxuTjBZWFJsTzF4dUlDQWdJR1JsYkdWMFpTQjBhR2x6TG5CeWIzQnpPMXh1SUNBZ0lHUmxiR1YwWlNCMGFHbHpMbU52Ym5SbGVIUTdYRzRnSUNBZ1pHVnNaWFJsSUhSb2FYTmJRMEZRVkZWU1JWOVNSVVpGVWtWT1EwVmZUVVZVU0U5RVUxMDdYRzRnSUNBZ2RHaHBjeTVqYkdWaGNrRnNiRVJsWW05MWJtTmxjeWdwTzF4dUlDQjlYRzVjYmlBZ2NtVnVaR1Z5VjJGcGRHbHVaeWdwSUh0Y2JpQWdmVnh1WEc0Z0lISmxibVJsY2loamFHbHNaSEpsYmlrZ2UxeHVJQ0FnSUhKbGRIVnliaUJqYUdsc1pISmxianRjYmlBZ2ZWeHVYRzRnSUhWd1pHRjBaV1FvS1NCN1hHNGdJSDFjYmx4dUlDQmpiMjFpYVc1bFYybDBhQ2h6WlhBc0lDNHVMbUZ5WjNNcElIdGNiaUFnSUNCc1pYUWdabWx1WVd4QmNtZHpJRDBnYm1WM0lGTmxkQ2dwTzF4dUlDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUdGeVozTXViR1Z1WjNSb095QnBJRHdnYVd3N0lHa3JLeWtnZTF4dUlDQWdJQ0FnYkdWMElHRnlaeUE5SUdGeVozTmJhVjA3WEc0Z0lDQWdJQ0JwWmlBb0lXRnlaeWxjYmlBZ0lDQWdJQ0FnWTI5dWRHbHVkV1U3WEc1Y2JpQWdJQ0FnSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHRnlaeXdnSjNOMGNtbHVaeWNwS1NCN1hHNGdJQ0FnSUNBZ0lHeGxkQ0IyWVd4MVpYTWdQU0JoY21jdWMzQnNhWFFvYzJWd0tTNW1hV3gwWlhJb1ZYUnBiSE11YVhOT2IzUkZiWEIwZVNrN1hHNGdJQ0FnSUNBZ0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJSFpoYkhWbGN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdkbUZzZFdWelcybGRPMXh1SUNBZ0lDQWdJQ0FnSUdacGJtRnNRWEpuY3k1aFpHUW9kbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLRUZ5Y21GNUxtbHpRWEp5WVhrb1lYSm5LU2tnZTF4dUlDQWdJQ0FnSUNCc1pYUWdkbUZzZFdWeklEMGdZWEpuTG1acGJIUmxjaWdvZG1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvSVhaaGJIVmxLVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZWZEdsc2N5NXBibk4wWVc1alpVOW1LSFpoYkhWbExDQW5jM1J5YVc1bkp5a3BYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnVlhScGJITXVhWE5PYjNSRmJYQjBlU2gyWVd4MVpTazdYRzRnSUNBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJSFpoYkhWbGN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdkbUZzZFdWelcybGRPMXh1SUNBZ0lDQWdJQ0FnSUdacGJtRnNRWEpuY3k1aFpHUW9kbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9ZWEpuTENBbmIySnFaV04wSnlrcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUd0bGVYTWdQU0JQWW1wbFkzUXVhMlY1Y3loaGNtY3BPMXh1SUNBZ0lDQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCclpYbHpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnYTJWNUlDQWdQU0JyWlhselcybGRPMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlHRnlaMXRyWlhsZE8xeHVYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tDRjJZV3gxWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWm1sdVlXeEJjbWR6TG1SbGJHVjBaU2hyWlhrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHbHVkV1U3WEc0Z0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnWm1sdVlXeEJjbWR6TG1Ga1pDaHJaWGtwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJRUZ5Y21GNUxtWnliMjBvWm1sdVlXeEJjbWR6S1M1cWIybHVLSE5sY0NCOGZDQW5KeWs3WEc0Z0lIMWNibHh1SUNCamJHRnpjMlZ6S0M0dUxtRnlaM01wSUh0Y2JpQWdJQ0J5WlhSMWNtNGdkR2hwY3k1amIyMWlhVzVsVjJsMGFDZ25JQ2NzSUM0dUxtRnlaM01wTzF4dUlDQjlYRzVjYmlBZ1pYaDBjbUZqZEVOb2FXeGtjbVZ1S0Y5d1lYUjBaWEp1Y3l3Z1kyaHBiR1J5Wlc0c0lGOXZjSFJwYjI1ektTQjdYRzRnSUNBZ2JHVjBJRzl3ZEdsdmJuTWdJQ0E5SUY5dmNIUnBiMjV6SUh4OElIdDlPMXh1SUNBZ0lHeGxkQ0JsZUhSeVlXTjBaV1FnUFNCN2ZUdGNiaUFnSUNCc1pYUWdjR0YwZEdWeWJuTWdJRDBnWDNCaGRIUmxjbTV6TzF4dUlDQWdJR3hsZENCcGMwRnljbUY1SUNBZ1BTQkJjbkpoZVM1cGMwRnljbUY1S0hCaGRIUmxjbTV6S1R0Y2JseHVJQ0FnSUdOdmJuTjBJR2x6VFdGMFkyZ2dQU0FvYW1saUtTQTlQaUI3WEc0Z0lDQWdJQ0JzWlhRZ2FtbGlWSGx3WlNBOUlHcHBZaTVVZVhCbE8xeHVJQ0FnSUNBZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9hbWxpVkhsd1pTd2dKM04wY21sdVp5Y3BLVnh1SUNBZ0lDQWdJQ0JxYVdKVWVYQmxJRDBnYW1saVZIbHdaUzUwYjB4dmQyVnlRMkZ6WlNncE8xeHVYRzRnSUNBZ0lDQnBaaUFvYVhOQmNuSmhlU2tnZTF4dUlDQWdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQndZWFIwWlhKdWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJSEJoZEhSbGNtNGdQU0J3WVhSMFpYSnVjMXRwWFR0Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvVlhScGJITXVhVzV6ZEdGdVkyVlBaaWh3WVhSMFpYSnVMQ0FuYzNSeWFXNW5KeWtwWEc0Z0lDQWdJQ0FnSUNBZ0lDQndZWFIwWlhKdUlEMGdjR0YwZEdWeWJpNTBiMHh2ZDJWeVEyRnpaU2dwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdhV1lnS0dwcFlsUjVjR1VnSVQwOUlIQmhkSFJsY200cFhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MGFXNTFaVHRjYmx4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2hsZUhSeVlXTjBaV1JiY0dGMGRHVnlibDBnSmlZZ2IzQjBhVzl1Y3k1dGRXeDBhWEJzWlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRkJjbkpoZVM1cGMwRnljbUY1S0dWNGRISmhZM1JsWkZ0d1lYUjBaWEp1WFNrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUdWNGRISmhZM1JsWkZ0d1lYUjBaWEp1WFNBOUlGc2daWGgwY21GamRHVmtXM0JoZEhSbGNtNWRJRjA3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Y0ZEhKaFkzUmxaRnR3WVhSMFpYSnVYUzV3ZFhOb0tHcHBZaWs3WEc0Z0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Y0ZEhKaFkzUmxaRnR3WVhSMFpYSnVYU0E5SUdwcFlqdGNiaUFnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnYkdWMElHdGxlWE1nUFNCUFltcGxZM1F1YTJWNWN5aHdZWFIwWlhKdWN5azdYRzRnSUNBZ0lDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUd0bGVYTXViR1Z1WjNSb095QnBJRHdnYVd3N0lHa3JLeWtnZTF4dUlDQWdJQ0FnSUNBZ0lHeGxkQ0JyWlhrZ0lDQWdJRDBnYTJWNWMxdHBYVHRjYmlBZ0lDQWdJQ0FnSUNCc1pYUWdjR0YwZEdWeWJpQTlJSEJoZEhSbGNtNXpXMnRsZVYwN1hHNGdJQ0FnSUNBZ0lDQWdiR1YwSUhKbGMzVnNkRHRjYmx4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2hWZEdsc2N5NXBibk4wWVc1alpVOW1LSEJoZEhSbGNtNHNJRkpsWjBWNGNDa3BYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYTjFiSFFnUFNCd1lYUjBaWEp1TG5SbGMzUW9hbWxpVkhsd1pTazdYRzRnSUNBZ0lDQWdJQ0FnWld4elpTQnBaaUFvVlhScGJITXVhVzV6ZEdGdVkyVlBaaWh3WVhSMFpYSnVMQ0FuYzNSeWFXNW5KeWtwWEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWE4xYkhRZ1BTQW9jR0YwZEdWeWJpNTBiMHh2ZDJWeVEyRnpaU2dwSUQwOVBTQnFhV0pVZVhCbEtUdGNiaUFnSUNBZ0lDQWdJQ0JsYkhObFhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhOMWJIUWdQU0FvY0dGMGRHVnliaUE5UFQwZ2FtbGlWSGx3WlNrN1hHNWNiaUFnSUNBZ0lDQWdJQ0JwWmlBb0lYSmxjM1ZzZENsY2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLR1Y0ZEhKaFkzUmxaRnR3WVhSMFpYSnVYU0FtSmlCdmNIUnBiMjV6TG0xMWJIUnBjR3hsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lVRnljbUY1TG1selFYSnlZWGtvWlhoMGNtRmpkR1ZrVzNCaGRIUmxjbTVkS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnWlhoMGNtRmpkR1ZrVzNCaGRIUmxjbTVkSUQwZ1d5QmxlSFJ5WVdOMFpXUmJjR0YwZEdWeWJsMGdYVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdaWGgwY21GamRHVmtXM0JoZEhSbGNtNWRMbkIxYzJnb2FtbGlLVHRjYmlBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdaWGgwY21GamRHVmtXM0JoZEhSbGNtNWRJRDBnYW1saU8xeHVJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNiaUFnSUNCOU8xeHVYRzRnSUNBZ1pYaDBjbUZqZEdWa0xuSmxiV0ZwYm1sdVowTm9hV3hrY21WdUlEMGdZMmhwYkdSeVpXNHVabWxzZEdWeUtDaHFhV0lwSUQwK0lDRnBjMDFoZEdOb0tHcHBZaWtwTzF4dUlDQWdJSEpsZEhWeWJpQmxlSFJ5WVdOMFpXUTdYRzRnSUgxY2JseHVJQ0J0WVhCRGFHbHNaSEpsYmlod1lYUjBaWEp1Y3l3Z1gyTm9hV3hrY21WdUtTQjdYRzRnSUNBZ2JHVjBJR05vYVd4a2NtVnVJRDBnS0NGQmNuSmhlUzVwYzBGeWNtRjVLRjlqYUdsc1pISmxiaWtwSUQ4Z1d5QmZZMmhwYkdSeVpXNGdYU0E2SUY5amFHbHNaSEpsYmp0Y2JseHVJQ0FnSUhKbGRIVnliaUJqYUdsc1pISmxiaTV0WVhBb0tHcHBZaWtnUFQ0Z2UxeHVJQ0FnSUNBZ2FXWWdLQ0ZxYVdJcFhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCcWFXSTdYRzVjYmlBZ0lDQWdJR3hsZENCcWFXSlVlWEJsSUQwZ2FtbGlMbFI1Y0dVN1hHNGdJQ0FnSUNCcFppQW9JVlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9hbWxpVkhsd1pTd2dKM04wY21sdVp5Y3BLVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdhbWxpTzF4dVhHNGdJQ0FnSUNCcWFXSlVlWEJsSUQwZ2FtbGlWSGx3WlM1MGIweHZkMlZ5UTJGelpTZ3BPMXh1WEc0Z0lDQWdJQ0JzWlhRZ2EyVjVjeUE5SUU5aWFtVmpkQzVyWlhsektIQmhkSFJsY201ektUdGNiaUFnSUNBZ0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJR3RsZVhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0JzWlhRZ2EyVjVJRDBnYTJWNWMxdHBYVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHdGxlUzUwYjB4dmQyVnlRMkZ6WlNncElDRTlQU0JxYVdKVWVYQmxLVnh1SUNBZ0lDQWdJQ0FnSUdOdmJuUnBiblZsTzF4dVhHNGdJQ0FnSUNBZ0lHeGxkQ0J0WlhSb2IyUWdQU0J3WVhSMFpYSnVjMXRyWlhsZE8xeHVJQ0FnSUNBZ0lDQnBaaUFvSVcxbGRHaHZaQ2xjYmlBZ0lDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JXVjBhRzlrTG1OaGJHd29kR2hwY3l3Z2FtbGlMQ0JwTENCamFHbHNaSEpsYmlrN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCcWFXSTdYRzRnSUNBZ2ZTazdYRzRnSUgxY2JseHVJQ0JrWldKdmRXNWpaU2htZFc1akxDQjBhVzFsTENCZmFXUXBJSHRjYmlBZ0lDQmpiMjV6ZENCamJHVmhjbEJsYm1ScGJtZFVhVzFsYjNWMElEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ2FXWWdLSEJsYm1ScGJtZFVhVzFsY2lBbUppQndaVzVrYVc1blZHbHRaWEl1ZEdsdFpXOTFkQ2tnZTF4dUlDQWdJQ0FnSUNCamJHVmhjbFJwYldWdmRYUW9jR1Z1WkdsdVoxUnBiV1Z5TG5ScGJXVnZkWFFwTzF4dUlDQWdJQ0FnSUNCd1pXNWthVzVuVkdsdFpYSXVkR2x0Wlc5MWRDQTlJRzUxYkd3N1hHNGdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUhaaGNpQnBaQ0E5SUNnaFgybGtLU0EvSUNnbkp5QXJJR1oxYm1NcElEb2dYMmxrTzF4dUlDQWdJR2xtSUNnaGRHaHBjeTVrWldKdmRXNWpaVlJwYldWeWN5a2dlMXh1SUNBZ0lDQWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblI1S0hSb2FYTXNJQ2RrWldKdmRXNWpaVlJwYldWeWN5Y3NJSHRjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQjBjblZsTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ2UzMHNYRzRnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQjJZWElnY0dWdVpHbHVaMVJwYldWeUlEMGdkR2hwY3k1a1pXSnZkVzVqWlZScGJXVnljMXRwWkYwN1hHNGdJQ0FnYVdZZ0tDRndaVzVrYVc1blZHbHRaWElwWEc0Z0lDQWdJQ0J3Wlc1a2FXNW5WR2x0WlhJZ1BTQjBhR2x6TG1SbFltOTFibU5sVkdsdFpYSnpXMmxrWFNBOUlIdDlPMXh1WEc0Z0lDQWdjR1Z1WkdsdVoxUnBiV1Z5TG1aMWJtTWdQU0JtZFc1ak8xeHVJQ0FnSUdOc1pXRnlVR1Z1WkdsdVoxUnBiV1Z2ZFhRb0tUdGNibHh1SUNBZ0lIWmhjaUJ3Y205dGFYTmxJRDBnY0dWdVpHbHVaMVJwYldWeUxuQnliMjFwYzJVN1hHNGdJQ0FnYVdZZ0tDRndjbTl0YVhObElIeDhJQ0Z3Y205dGFYTmxMbWx6VUdWdVpHbHVaeWdwS1NCN1hHNGdJQ0FnSUNCc1pYUWdjM1JoZEhWeklEMGdKM0JsYm1ScGJtY25PMXh1SUNBZ0lDQWdiR1YwSUhKbGMyOXNkbVU3WEc1Y2JpQWdJQ0FnSUhCeWIyMXBjMlVnUFNCd1pXNWthVzVuVkdsdFpYSXVjSEp2YldselpTQTlJRzVsZHlCUWNtOXRhWE5sS0NoZmNtVnpiMngyWlNrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0J5WlhOdmJIWmxJRDBnWDNKbGMyOXNkbVU3WEc0Z0lDQWdJQ0I5S1R0Y2JseHVJQ0FnSUNBZ2NISnZiV2x6WlM1eVpYTnZiSFpsSUQwZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNCcFppQW9jM1JoZEhWeklDRTlQU0FuY0dWdVpHbHVaeWNwWEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJQ0FnSUNBZ0lITjBZWFIxY3lBOUlDZG1kV3htYVd4c1pXUW5PMXh1SUNBZ0lDQWdJQ0JqYkdWaGNsQmxibVJwYm1kVWFXMWxiM1YwS0NrN1hHNGdJQ0FnSUNBZ0lIUm9hWE11WkdWaWIzVnVZMlZVYVcxbGNuTmJhV1JkSUQwZ2JuVnNiRHRjYmx4dUlDQWdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlIQmxibVJwYm1kVWFXMWxjaTVtZFc1aklEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNBZ0lDQWdkbUZ5SUhKbGRDQTlJSEJsYm1ScGJtZFVhVzFsY2k1bWRXNWpMbU5oYkd3b2RHaHBjeWs3WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLSEpsZENCcGJuTjBZVzVqWlc5bUlGQnliMjFwYzJVZ2ZId2dLSEpsZENBbUppQjBlWEJsYjJZZ2NtVjBMblJvWlc0Z1BUMDlJQ2RtZFc1amRHbHZiaWNwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwTG5Sb1pXNG9LSFpoYkhWbEtTQTlQaUJ5WlhOdmJIWmxLSFpoYkhWbEtTazdYRzRnSUNBZ0lDQWdJQ0FnWld4elpWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemIyeDJaU2h5WlhRcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVW9LVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnZlR0Y2JseHVJQ0FnSUNBZ2NISnZiV2x6WlM1allXNWpaV3dnUFNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUhOMFlYUjFjeUE5SUNkeVpXcGxZM1JsWkNjN1hHNGdJQ0FnSUNBZ0lHTnNaV0Z5VUdWdVpHbHVaMVJwYldWdmRYUW9LVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NWtaV0p2ZFc1alpWUnBiV1Z5YzF0cFpGMGdQU0J1ZFd4c08xeHVYRzRnSUNBZ0lDQWdJSEJ5YjIxcGMyVXVjbVZ6YjJ4MlpTZ3BPMXh1SUNBZ0lDQWdmVHRjYmx4dUlDQWdJQ0FnY0hKdmJXbHpaUzVwYzFCbGJtUnBibWNnUFNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUFvYzNSaGRIVnpJRDA5UFNBbmNHVnVaR2x1WnljcE8xeHVJQ0FnSUNBZ2ZUdGNiaUFnSUNCOVhHNWNiaUFnSUNBdkx5QmxjMnhwYm5RdFpHbHpZV0pzWlMxdVpYaDBMV3hwYm1VZ2JtOHRiV0ZuYVdNdGJuVnRZbVZ5YzF4dUlDQWdJSEJsYm1ScGJtZFVhVzFsY2k1MGFXMWxiM1YwSUQwZ2MyVjBWR2x0Wlc5MWRDaHdjbTl0YVhObExuSmxjMjlzZG1Vc0lDaDBhVzFsSUQwOUlHNTFiR3dwSUQ4Z01qVXdJRG9nZEdsdFpTazdYRzVjYmlBZ0lDQnlaWFIxY200Z2NISnZiV2x6WlR0Y2JpQWdmVnh1WEc0Z0lHTnNaV0Z5UkdWaWIzVnVZMlVvYVdRcElIdGNiaUFnSUNCcFppQW9JWFJvYVhNdVpHVmliM1Z1WTJWVWFXMWxjbk1wWEc0Z0lDQWdJQ0J5WlhSMWNtNDdYRzVjYmlBZ0lDQjJZWElnY0dWdVpHbHVaMVJwYldWeUlEMGdkR2hwY3k1a1pXSnZkVzVqWlZScGJXVnljMXRwWkYwN1hHNGdJQ0FnYVdZZ0tIQmxibVJwYm1kVWFXMWxjaUE5UFNCdWRXeHNLVnh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVYRzRnSUNBZ2FXWWdLSEJsYm1ScGJtZFVhVzFsY2k1MGFXMWxiM1YwS1Z4dUlDQWdJQ0FnWTJ4bFlYSlVhVzFsYjNWMEtIQmxibVJwYm1kVWFXMWxjaTUwYVcxbGIzVjBLVHRjYmx4dUlDQWdJR2xtSUNod1pXNWthVzVuVkdsdFpYSXVjSEp2YldselpTbGNiaUFnSUNBZ0lIQmxibVJwYm1kVWFXMWxjaTV3Y205dGFYTmxMbU5oYm1ObGJDZ3BPMXh1SUNCOVhHNWNiaUFnWTJ4bFlYSkJiR3hFWldKdmRXNWpaWE1vS1NCN1hHNGdJQ0FnYkdWMElHUmxZbTkxYm1ObFZHbHRaWEp6SUNBOUlIUm9hWE11WkdWaWIzVnVZMlZVYVcxbGNuTWdmSHdnZTMwN1hHNGdJQ0FnYkdWMElHbGtjeUFnSUNBZ0lDQWdJQ0FnSUNBOUlFOWlhbVZqZEM1clpYbHpLR1JsWW05MWJtTmxWR2x0WlhKektUdGNibHh1SUNBZ0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJR2xrY3k1c1pXNW5kR2c3SUdrZ1BDQnBiRHNnYVNzcktWeHVJQ0FnSUNBZ2RHaHBjeTVqYkdWaGNrUmxZbTkxYm1ObEtHbGtjMXRwWFNrN1hHNGdJSDFjYmx4dUlDQm5aWFJGYkdWdFpXNTBSR0YwWVNobGJHVnRaVzUwS1NCN1hHNGdJQ0FnYkdWMElHUmhkR0VnUFNCbGJHVnRaVzUwUkdGMFlVTmhZMmhsTG1kbGRDaGxiR1Z0Wlc1MEtUdGNiaUFnSUNCcFppQW9JV1JoZEdFcElIdGNiaUFnSUNBZ0lHUmhkR0VnUFNCN2ZUdGNiaUFnSUNBZ0lHVnNaVzFsYm5SRVlYUmhRMkZqYUdVdWMyVjBLR1ZzWlcxbGJuUXNJR1JoZEdFcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUJrWVhSaE8xeHVJQ0I5WEc1Y2JpQWdiV1Z0YjJsNlpTaG1kVzVqS1NCN1hHNGdJQ0FnYkdWMElHTmhZMmhsU1VRN1hHNGdJQ0FnYkdWMElHTmhZMmhsWkZKbGMzVnNkRHRjYmx4dUlDQWdJSEpsZEhWeWJpQm1kVzVqZEdsdmJpZ3VMaTVoY21kektTQjdYRzRnSUNBZ0lDQnNaWFFnYm1WM1EyRmphR1ZKUkNBOUlHUmxZV1JpWldWbUtDNHVMbUZ5WjNNcE8xeHVJQ0FnSUNBZ2FXWWdLRzVsZDBOaFkyaGxTVVFnSVQwOUlHTmhZMmhsU1VRcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUhKbGMzVnNkQ0E5SUdaMWJtTXVZWEJ3Ykhrb2RHaHBjeXdnWVhKbmN5azdYRzVjYmlBZ0lDQWdJQ0FnWTJGamFHVkpSQ0E5SUc1bGQwTmhZMmhsU1VRN1hHNGdJQ0FnSUNBZ0lHTmhZMmhsWkZKbGMzVnNkQ0E5SUhKbGMzVnNkRHRjYmlBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnY21WMGRYSnVJR05oWTJobFpGSmxjM1ZzZER0Y2JpQWdJQ0I5TzF4dUlDQjlYRzVjYmlBZ2RHOVVaWEp0S0hSbGNtMHBJSHRjYmlBZ0lDQnBaaUFvYVhOS2FXSnBjMmdvZEdWeWJTa3BJSHRjYmlBZ0lDQWdJR3hsZENCcWFXSWdQU0JqYjI1emRISjFZM1JLYVdJb2RHVnliU2s3WEc1Y2JpQWdJQ0FnSUdsbUlDaHFhV0l1Vkhsd1pTQTlQVDBnVkdWeWJTbGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUmxjbTA3WEc1Y2JpQWdJQ0FnSUdsbUlDaHFhV0l1Vkhsd1pTQW1KaUJxYVdJdVZIbHdaVnRVUlZKTlgwTlBUVkJQVGtWT1ZGOVVXVkJGWDBOSVJVTkxYU2xjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJsY20wN1hHNWNiaUFnSUNBZ0lISmxkSFZ5YmlBa0tGUmxjbTBzSUdwcFlpNXdjbTl3Y3lrb0xpNHVhbWxpTG1Ob2FXeGtjbVZ1S1R0Y2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0hSNWNHVnZaaUIwWlhKdElEMDlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJQ0FnY21WMGRYSnVJQ1FvVkdWeWJTa29kR1Z5YlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJSFJsY20wN1hHNGdJSDFjYm4xY2JseHVZMjl1YzNRZ1ZFVlNUVjlEVDAxUVQwNUZUbFJmVkZsUVJWOURTRVZEU3lBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekwybHpWR1Z5YlNjcE8xeHVYRzVqYkdGemN5QlVaWEp0SUdWNGRHVnVaSE1nUTI5dGNHOXVaVzUwSUh0Y2JpQWdjbVZ6YjJ4MlpWUmxjbTBvWVhKbmN5a2dlMXh1SUNBZ0lHeGxkQ0IwWlhKdFVtVnpiMngyWlhJZ1BTQjBhR2x6TG1OdmJuUmxlSFF1WDNSbGNtMVNaWE52YkhabGNqdGNiaUFnSUNCcFppQW9kSGx3Wlc5bUlIUmxjbTFTWlhOdmJIWmxjaUE5UFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNBZ0lISmxkSFZ5YmlCMFpYSnRVbVZ6YjJ4MlpYSXVZMkZzYkNoMGFHbHpMQ0JoY21kektUdGNibHh1SUNBZ0lHeGxkQ0JqYUdsc1pISmxiaUE5SUNoaGNtZHpMbU5vYVd4a2NtVnVJSHg4SUZ0ZEtUdGNiaUFnSUNCeVpYUjFjbTRnWTJocGJHUnlaVzViWTJocGJHUnlaVzR1YkdWdVozUm9JQzBnTVYwZ2ZId2dKeWM3WEc0Z0lIMWNibHh1SUNCeVpXNWtaWElvWTJocGJHUnlaVzRwSUh0Y2JpQWdJQ0JzWlhRZ2RHVnliU0E5SUhSb2FYTXVjbVZ6YjJ4MlpWUmxjbTBvZXlCamFHbHNaSEpsYml3Z2NISnZjSE02SUhSb2FYTXVjSEp2Y0hNZ2ZTazdYRzRnSUNBZ2NtVjBkWEp1SUNRb0oxTlFRVTRuTENCMGFHbHpMbkJ5YjNCektTaDBaWEp0S1R0Y2JpQWdmVnh1ZlZ4dVhHNVVaWEp0VzFSRlVrMWZRMDlOVUU5T1JVNVVYMVJaVUVWZlEwaEZRMHRkSUQwZ2RISjFaVHRjYmx4dVpYaHdiM0owSUh0Y2JpQWdWR1Z5YlN4Y2JuMDdYRzRpTENKamIyNXpkQ0JGVmtWT1ZGOU1TVk5VUlU1RlVsTWdQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljeTlsZG1WdWRITXZiR2x6ZEdWdVpYSnpKeWs3WEc1Y2JtVjRjRzl5ZENCamJHRnpjeUJGZG1WdWRFVnRhWFIwWlhJZ2UxeHVJQ0JqYjI1emRISjFZM1J2Y2lncElIdGNiaUFnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRHbGxjeWgwYUdsekxDQjdYRzRnSUNBZ0lDQmJSVlpGVGxSZlRFbFRWRVZPUlZKVFhUb2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lHNWxkeUJOWVhBb0tTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ2ZTazdYRzRnSUgxY2JseHVJQ0JoWkdSTWFYTjBaVzVsY2lobGRtVnVkRTVoYldVc0lHeHBjM1JsYm1WeUtTQjdYRzRnSUNBZ2FXWWdLSFI1Y0dWdlppQnNhWE4wWlc1bGNpQWhQVDBnSjJaMWJtTjBhVzl1SnlsY2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0owVjJaVzUwSUd4cGMzUmxibVZ5SUcxMWMzUWdZbVVnWVNCdFpYUm9iMlFuS1R0Y2JseHVJQ0FnSUd4bGRDQmxkbVZ1ZEUxaGNDQWdQU0IwYUdselcwVldSVTVVWDB4SlUxUkZUa1ZTVTEwN1hHNGdJQ0FnYkdWMElITmpiM0JsSUNBZ0lDQTlJR1YyWlc1MFRXRndMbWRsZENobGRtVnVkRTVoYldVcE8xeHVYRzRnSUNBZ2FXWWdLQ0Z6WTI5d1pTa2dlMXh1SUNBZ0lDQWdjMk52Y0dVZ1BTQmJYVHRjYmlBZ0lDQWdJR1YyWlc1MFRXRndMbk5sZENobGRtVnVkRTVoYldVc0lITmpiM0JsS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0J6WTI5d1pTNXdkWE5vS0d4cGMzUmxibVZ5S1R0Y2JseHVJQ0FnSUhKbGRIVnliaUIwYUdsek8xeHVJQ0I5WEc1Y2JpQWdjbVZ0YjNabFRHbHpkR1Z1WlhJb1pYWmxiblJPWVcxbExDQnNhWE4wWlc1bGNpa2dlMXh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdiR2x6ZEdWdVpYSWdJVDA5SUNkbWRXNWpkR2x2YmljcFhHNGdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZEZkbVZ1ZENCc2FYTjBaVzVsY2lCdGRYTjBJR0psSUdFZ2JXVjBhRzlrSnlrN1hHNWNiaUFnSUNCc1pYUWdaWFpsYm5STllYQWdJRDBnZEdocGMxdEZWa1ZPVkY5TVNWTlVSVTVGVWxOZE8xeHVJQ0FnSUd4bGRDQnpZMjl3WlNBZ0lDQWdQU0JsZG1WdWRFMWhjQzVuWlhRb1pYWmxiblJPWVcxbEtUdGNiaUFnSUNCcFppQW9JWE5qYjNCbEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzVjYmlBZ0lDQnNaWFFnYVc1a1pYZ2dQU0J6WTI5d1pTNXBibVJsZUU5bUtHeHBjM1JsYm1WeUtUdGNiaUFnSUNCcFppQW9hVzVrWlhnZ1BqMGdNQ2xjYmlBZ0lDQWdJSE5qYjNCbExuTndiR2xqWlNocGJtUmxlQ3dnTVNrN1hHNWNiaUFnSUNCeVpYUjFjbTRnZEdocGN6dGNiaUFnZlZ4dVhHNGdJSEpsYlc5MlpVRnNiRXhwYzNSbGJtVnljeWhsZG1WdWRFNWhiV1VwSUh0Y2JpQWdJQ0JzWlhRZ1pYWmxiblJOWVhBZ0lEMGdkR2hwYzF0RlZrVk9WRjlNU1ZOVVJVNUZVbE5kTzF4dUlDQWdJR2xtSUNnaFpYWmxiblJOWVhBdWFHRnpLR1YyWlc1MFRtRnRaU2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR2hwY3p0Y2JseHVJQ0FnSUdWMlpXNTBUV0Z3TG5ObGRDaGxkbVZ1ZEU1aGJXVXNJRnRkS1R0Y2JseHVJQ0FnSUhKbGRIVnliaUIwYUdsek8xeHVJQ0I5WEc1Y2JpQWdaVzFwZENobGRtVnVkRTVoYldVc0lDNHVMbUZ5WjNNcElIdGNiaUFnSUNCc1pYUWdaWFpsYm5STllYQWdJRDBnZEdocGMxdEZWa1ZPVkY5TVNWTlVSVTVGVWxOZE8xeHVJQ0FnSUd4bGRDQnpZMjl3WlNBZ0lDQWdQU0JsZG1WdWRFMWhjQzVuWlhRb1pYWmxiblJPWVcxbEtUdGNiaUFnSUNCcFppQW9JWE5qYjNCbElIeDhJSE5qYjNCbExteGxibWQwYUNBOVBUMGdNQ2xjYmlBZ0lDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0FnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlITmpiM0JsTG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNBZ0lHeGxkQ0JsZG1WdWRFTmhiR3hpWVdOcklEMGdjMk52Y0dWYmFWMDdYRzRnSUNBZ0lDQmxkbVZ1ZEVOaGJHeGlZV05yTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM01wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQjlYRzVjYmlBZ2IyNWpaU2hsZG1WdWRFNWhiV1VzSUd4cGMzUmxibVZ5S1NCN1hHNGdJQ0FnYkdWMElHWjFibU1nUFNBb0xpNHVZWEpuY3lrZ1BUNGdlMXh1SUNBZ0lDQWdkR2hwY3k1dlptWW9aWFpsYm5ST1lXMWxMQ0JtZFc1aktUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCc2FYTjBaVzVsY2lndUxpNWhjbWR6S1R0Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWIyNG9aWFpsYm5ST1lXMWxMQ0JtZFc1aktUdGNiaUFnZlZ4dVhHNGdJRzl1S0dWMlpXNTBUbUZ0WlN3Z2JHbHpkR1Z1WlhJcElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NWhaR1JNYVhOMFpXNWxjaWhsZG1WdWRFNWhiV1VzSUd4cGMzUmxibVZ5S1R0Y2JpQWdmVnh1WEc0Z0lHOW1aaWhsZG1WdWRFNWhiV1VzSUd4cGMzUmxibVZ5S1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWNtVnRiM1psVEdsemRHVnVaWElvWlhabGJuUk9ZVzFsTENCc2FYTjBaVzVsY2lrN1hHNGdJSDFjYmx4dUlDQmxkbVZ1ZEU1aGJXVnpLQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQkJjbkpoZVM1bWNtOXRLSFJvYVhOYlJWWkZUbFJmVEVsVFZFVk9SVkpUWFM1clpYbHpLQ2twTzF4dUlDQjlYRzVjYmlBZ2JHbHpkR1Z1WlhKRGIzVnVkQ2hsZG1WdWRFNWhiV1VwSUh0Y2JpQWdJQ0JzWlhRZ1pYWmxiblJOWVhBZ0lEMGdkR2hwYzF0RlZrVk9WRjlNU1ZOVVJVNUZVbE5kTzF4dUlDQWdJR3hsZENCelkyOXdaU0FnSUNBZ1BTQmxkbVZ1ZEUxaGNDNW5aWFFvWlhabGJuUk9ZVzFsS1R0Y2JpQWdJQ0JwWmlBb0lYTmpiM0JsS1Z4dUlDQWdJQ0FnY21WMGRYSnVJREE3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdjMk52Y0dVdWJHVnVaM1JvTzF4dUlDQjlYRzVjYmlBZ2JHbHpkR1Z1WlhKektHVjJaVzUwVG1GdFpTa2dlMXh1SUNBZ0lHeGxkQ0JsZG1WdWRFMWhjQ0FnUFNCMGFHbHpXMFZXUlU1VVgweEpVMVJGVGtWU1UxMDdYRzRnSUNBZ2JHVjBJSE5qYjNCbElDQWdJQ0E5SUdWMlpXNTBUV0Z3TG1kbGRDaGxkbVZ1ZEU1aGJXVXBPMXh1SUNBZ0lHbG1JQ2doYzJOdmNHVXBYRzRnSUNBZ0lDQnlaWFIxY200Z1cxMDdYRzVjYmlBZ0lDQnlaWFIxY200Z2MyTnZjR1V1YzJ4cFkyVW9LVHRjYmlBZ2ZWeHVmVnh1SWl3aWFXMXdiM0owSUdSbFlXUmlaV1ZtSUdaeWIyMGdKMlJsWVdSaVpXVm1KenRjYm1sdGNHOXlkQ0FxSUdGeklGVjBhV3h6SUdaeWIyMGdKeTR2ZFhScGJITXVhbk1uTzF4dVhHNWxlSEJ2Y25RZ1kyeGhjM01nU21saUlIdGNiaUFnWTI5dWMzUnlkV04wYjNJb1ZIbHdaU3dnY0hKdmNITXNJR05vYVd4a2NtVnVLU0I3WEc0Z0lDQWdiR1YwSUdSbFptRjFiSFJRY205d2N5QTlJQ2hVZVhCbElDWW1JRlI1Y0dVdWNISnZjSE1wSUQ4Z1ZIbHdaUzV3Y205d2N5QTZJSHQ5TzF4dVhHNGdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9kR2hwY3l3Z2UxeHVJQ0FnSUNBZ0oxUjVjR1VuT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdWSGx3WlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmNISnZjSE1uT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdleUJiU2tsQ1gwTklTVXhFWDBsT1JFVllYMUJTVDFCZE9pQXdMQ0F1TGk1a1pXWmhkV3gwVUhKdmNITXNJQzR1TGlod2NtOXdjeUI4ZkNCN2ZTa2dmU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuWTJocGJHUnlaVzRuT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdWWFJwYkhNdVpteGhkSFJsYmtGeWNtRjVLR05vYVd4a2NtVnVLU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdmU2s3WEc0Z0lIMWNibjFjYmx4dVpYaHdiM0owSUdOdmJuTjBJRXBKUWw5Q1FWSlNSVTRnSUNBZ0lDQWdJQ0FnSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5NdVltRnljbVZ1SnlrN1hHNWxlSEJ2Y25RZ1kyOXVjM1FnU2tsQ1gxQlNUMWhaSUNBZ0lDQWdJQ0FnSUNBZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWN5NXdjbTk0ZVNjcE8xeHVaWGh3YjNKMElHTnZibk4wSUVwSlFsOVNRVmRmVkVWWVZDQWdJQ0FnSUNBZ0lEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTXVjbUYzVkdWNGRDY3BPMXh1Wlhod2IzSjBJR052Ym5OMElFcEpRaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk11YW1saUp5azdYRzVsZUhCdmNuUWdZMjl1YzNRZ1NrbENYME5JU1V4RVgwbE9SRVZZWDFCU1QxQWdQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljeTVqYUdsc1pFbHVaR1Y0VUhKdmNDY3BPMXh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWm1GamRHOXllU2hLYVdKRGJHRnpjeWtnZTF4dUlDQm1kVzVqZEdsdmJpQWtLRjkwZVhCbExDQndjbTl3Y3lBOUlIdDlLU0I3WEc0Z0lDQWdhV1lnS0dselNtbGlhWE5vS0Y5MGVYQmxLU2xjYmlBZ0lDQWdJSFJvY205M0lHNWxkeUJVZVhCbFJYSnliM0lvSjFKbFkyVnBkbVZrSUdFZ2FtbGlJR0oxZENCbGVIQmxZM1JsWkNCaElHTnZiWEJ2Ym1WdWRDNG5LVHRjYmx4dUlDQWdJR3hsZENCVWVYQmxJRDBnS0Y5MGVYQmxJRDA5SUc1MWJHd3BJRDhnU2tsQ1gxQlNUMWhaSURvZ1gzUjVjR1U3WEc1Y2JpQWdJQ0JtZFc1amRHbHZiaUJpWVhKeVpXNG9MaTR1WDJOb2FXeGtjbVZ1S1NCN1hHNGdJQ0FnSUNCc1pYUWdZMmhwYkdSeVpXNGdQU0JmWTJocGJHUnlaVzQ3WEc1Y2JpQWdJQ0FnSUdaMWJtTjBhVzl1SUdwcFlpZ3BJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tGVjBhV3h6TG1sdWMzUmhibU5sVDJZb1ZIbHdaU3dnSjNCeWIyMXBjMlVuS1NCOGZDQmphR2xzWkhKbGJpNXpiMjFsS0NoamFHbHNaQ2tnUFQ0Z1ZYUnBiSE11YVc1emRHRnVZMlZQWmloamFHbHNaQ3dnSjNCeWIyMXBjMlVuS1NrcElIdGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdVSEp2YldselpTNWhiR3dvV3lCVWVYQmxJRjB1WTI5dVkyRjBLR05vYVd4a2NtVnVLU2t1ZEdobGJpZ29ZV3hzS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCVWVYQmxJRDBnWVd4c1d6QmRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyaHBiR1J5Wlc0Z1BTQmhiR3d1YzJ4cFkyVW9NU2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnU21saVEyeGhjM01vWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJRlI1Y0dVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhCeWIzQnpMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQmphR2xzWkhKbGJpeGNiaUFnSUNBZ0lDQWdJQ0FnSUNrN1hHNGdJQ0FnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRXBwWWtOc1lYTnpLRnh1SUNBZ0lDQWdJQ0FnSUZSNWNHVXNYRzRnSUNBZ0lDQWdJQ0FnY0hKdmNITXNYRzRnSUNBZ0lDQWdJQ0FnWTJocGJHUnlaVzRzWEc0Z0lDQWdJQ0FnSUNrN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBhV1Z6S0dwcFlpd2dlMXh1SUNBZ0lDQWdJQ0JiU2tsQ1hUb2dlMXh1SUNBZ0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNBZ1cyUmxZV1JpWldWbUxtbGtVM2x0WFRvZ2UxeHVJQ0FnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnS0NrZ1BUNGdWSGx3WlN4Y2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lIMHBPMXh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdhbWxpTzF4dUlDQWdJSDFjYmx4dUlDQWdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowYVdWektHSmhjbkpsYml3Z2UxeHVJQ0FnSUNBZ1cwcEpRbDlDUVZKU1JVNWRPaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCYlpHVmhaR0psWldZdWFXUlRlVzFkT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dabUZzYzJVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnS0NrZ1BUNGdWSGx3WlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnZlNrN1hHNWNiaUFnSUNCeVpYUjFjbTRnWW1GeWNtVnVPMXh1SUNCOVhHNWNiaUFnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9KQ3dnZTF4dUlDQWdJQ2R5WlcxaGNDYzZJSHRjYmlBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdLRjlxYVdJc0lHTmhiR3hpWVdOcktTQTlQaUI3WEc0Z0lDQWdJQ0FnSUd4bGRDQnFhV0lnUFNCZmFtbGlPMXh1SUNBZ0lDQWdJQ0JwWmlBb2FtbGlJRDA5SUc1MWJHd2dmSHdnVDJKcVpXTjBMbWx6S0dwcFlpd2dTVzVtYVc1cGRIa3BJSHg4SUU5aWFtVmpkQzVwY3locWFXSXNJRTVoVGlrcFhHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHcHBZanRjYmx4dUlDQWdJQ0FnSUNCcFppQW9hWE5LYVdKcGMyZ29hbWxpS1NsY2JpQWdJQ0FnSUNBZ0lDQnFhV0lnUFNCamIyNXpkSEoxWTNSS2FXSW9hbWxpS1R0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCbWFXNWhiR2w2WlUxaGNDQTlJQ2hmYldGd2NHVmtTbWxpS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnYkdWMElHMWhjSEJsWkVwcFlpQTlJRjl0WVhCd1pXUkthV0k3WEc1Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvYVhOS2FXSnBjMmdvYldGd2NHVmtTbWxpS1NsY2JpQWdJQ0FnSUNBZ0lDQWdJRzFoY0hCbFpFcHBZaUE5SUdOdmJuTjBjblZqZEVwcFlpaHRZWEJ3WldSS2FXSXBPMXh1SUNBZ0lDQWdJQ0FnSUdWc2MyVmNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ0WVhCd1pXUkthV0k3WEc1Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z0pDaHRZWEJ3WldSS2FXSXVWSGx3WlN3Z2JXRndjR1ZrU21saUxuQnliM0J6S1NndUxpNG9iV0Z3Y0dWa1NtbGlMbU5vYVd4a2NtVnVJSHg4SUZ0ZEtTazdYRzRnSUNBZ0lDQWdJSDA3WEc1Y2JpQWdJQ0FnSUNBZ2JHVjBJRzFoY0hCbFpFcHBZaUE5SUdOaGJHeGlZV05yS0dwcFlpazdYRzRnSUNBZ0lDQWdJR2xtSUNoVmRHbHNjeTVwYm5OMFlXNWpaVTltS0cxaGNIQmxaRXBwWWl3Z0ozQnliMjFwYzJVbktTbGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdiV0Z3Y0dWa1NtbGlMblJvWlc0b1ptbHVZV3hwZW1WTllYQXBPMXh1WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJtYVc1aGJHbDZaVTFoY0NodFlYQndaV1JLYVdJcE8xeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNCOUxGeHVJQ0I5S1R0Y2JseHVJQ0J5WlhSMWNtNGdKRHRjYm4xY2JseHVaWGh3YjNKMElHTnZibk4wSUNRZ1BTQm1ZV04wYjNKNUtFcHBZaWs3WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCcGMwcHBZbWx6YUNoMllXeDFaU2tnZTF4dUlDQnBaaUFvZEhsd1pXOW1JSFpoYkhWbElEMDlQU0FuWm5WdVkzUnBiMjRuSUNZbUlDaDJZV3gxWlZ0S1NVSmZRa0ZTVWtWT1hTQjhmQ0IyWVd4MVpWdEtTVUpkS1NsY2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JwWmlBb2RtRnNkV1VnYVc1emRHRnVZMlZ2WmlCS2FXSXBYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ2NtVjBkWEp1SUdaaGJITmxPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1kyOXVjM1J5ZFdOMFNtbGlLSFpoYkhWbEtTQjdYRzRnSUdsbUlDaDJZV3gxWlNCcGJuTjBZVzVqWlc5bUlFcHBZaWxjYmlBZ0lDQnlaWFIxY200Z2RtRnNkV1U3WEc1Y2JpQWdhV1lnS0hSNWNHVnZaaUIyWVd4MVpTQTlQVDBnSjJaMWJtTjBhVzl1SnlrZ2UxeHVJQ0FnSUdsbUlDaDJZV3gxWlZ0S1NVSmZRa0ZTVWtWT1hTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCMllXeDFaU2dwS0NrN1hHNGdJQ0FnWld4elpTQnBaaUFvZG1Gc2RXVmJTa2xDWFNsY2JpQWdJQ0FnSUhKbGRIVnliaUIyWVd4MVpTZ3BPMXh1SUNCOVhHNWNiaUFnZEdoeWIzY2dibVYzSUZSNWNHVkZjbkp2Y2lnblkyOXVjM1J5ZFdOMFNtbGlPaUJRY205MmFXUmxaQ0IyWVd4MVpTQnBjeUJ1YjNRZ1lTQkthV0l1SnlrN1hHNTlYRzVjYm1WNGNHOXlkQ0JoYzNsdVl5Qm1kVzVqZEdsdmJpQnlaWE52YkhabFEyaHBiR1J5Wlc0b1gyTm9hV3hrY21WdUtTQjdYRzRnSUd4bGRDQmphR2xzWkhKbGJpQTlJRjlqYUdsc1pISmxianRjYmx4dUlDQnBaaUFvVlhScGJITXVhVzV6ZEdGdVkyVlBaaWhqYUdsc1pISmxiaXdnSjNCeWIyMXBjMlVuS1NsY2JpQWdJQ0JqYUdsc1pISmxiaUE5SUdGM1lXbDBJR05vYVd4a2NtVnVPMXh1WEc0Z0lHbG1JQ2doS0NoMGFHbHpMbWx6U1hSbGNtRmliR1ZEYUdsc1pDQjhmQ0JWZEdsc2N5NXBjMGwwWlhKaFlteGxRMmhwYkdRcExtTmhiR3dvZEdocGN5d2dZMmhwYkdSeVpXNHBLU0FtSmlBb2FYTkthV0pwYzJnb1kyaHBiR1J5Wlc0cElIeDhJQ2dvZEdocGN5NXBjMVpoYkdsa1EyaHBiR1FnZkh3Z1ZYUnBiSE11YVhOV1lXeHBaRU5vYVd4a0tTNWpZV3hzS0hSb2FYTXNJR05vYVd4a2NtVnVLU2twS1Z4dUlDQWdJR05vYVd4a2NtVnVJRDBnV3lCamFHbHNaSEpsYmlCZE8xeHVYRzRnSUd4bGRDQndjbTl0YVhObGN5QTlJRlYwYVd4ekxtbDBaWEpoZEdVb1kyaHBiR1J5Wlc0c0lHRnplVzVqSUNoN0lIWmhiSFZsT2lCZlkyaHBiR1FnZlNrZ1BUNGdlMXh1SUNBZ0lHeGxkQ0JqYUdsc1pDQTlJQ2hWZEdsc2N5NXBibk4wWVc1alpVOW1LRjlqYUdsc1pDd2dKM0J5YjIxcGMyVW5LU2tnUHlCaGQyRnBkQ0JmWTJocGJHUWdPaUJmWTJocGJHUTdYRzVjYmlBZ0lDQnBaaUFvYVhOS2FXSnBjMmdvWTJocGJHUXBLVnh1SUNBZ0lDQWdjbVYwZFhKdUlHRjNZV2wwSUdOdmJuTjBjblZqZEVwcFlpaGphR2xzWkNrN1hHNGdJQ0FnWld4elpWeHVJQ0FnSUNBZ2NtVjBkWEp1SUdOb2FXeGtPMXh1SUNCOUtUdGNibHh1SUNCeVpYUjFjbTRnWVhkaGFYUWdVSEp2YldselpTNWhiR3dvY0hKdmJXbHpaWE1wTzF4dWZWeHVJaXdpWlhod2IzSjBJSHRjYmlBZ1EwOU9WRVZZVkY5SlJDeGNiaUFnVW05dmRFNXZaR1VzWEc1OUlHWnliMjBnSnk0dmNtOXZkQzF1YjJSbExtcHpKenRjYmx4dVpYaHdiM0owSUdOdmJuTjBJRVpQVWtORlgxSkZSa3hQVnlBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKelJtOXlZMlZTWldac2IzY25LVHRjYmx4dVpYaHdiM0owSUhzZ1VtVnVaR1Z5WlhJZ2ZTQm1jbTl0SUNjdUwzSmxibVJsY21WeUxtcHpKenRjYmlJc0ltbHRjRzl5ZENCN1hHNGdJRU5QVGxSRldGUmZTVVFzWEc0Z0lGSnZiM1JPYjJSbExGeHVmU0JtY205dElDY3VMM0p2YjNRdGJtOWtaUzVxY3ljN1hHNWNibU52Ym5OMElFbE9TVlJKUVV4ZlEwOU9WRVZZVkY5SlJDQTlJREZ1TzF4dWJHVjBJRjlqYjI1MFpYaDBTVVJEYjNWdWRHVnlJRDBnU1U1SlZFbEJURjlEVDA1VVJWaFVYMGxFTzF4dVhHNWxlSEJ2Y25RZ1kyeGhjM01nVW1WdVpHVnlaWElnWlhoMFpXNWtjeUJTYjI5MFRtOWtaU0I3WEc0Z0lITjBZWFJwWXlCU2IyOTBUbTlrWlNBOUlGSnZiM1JPYjJSbE8xeHVYRzRnSUdOdmJuTjBjblZqZEc5eUtHOXdkR2x2Ym5NcElIdGNiaUFnSUNCemRYQmxjaWh1ZFd4c0xDQnVkV3hzTENCdWRXeHNLVHRjYmx4dUlDQWdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowYVdWektIUm9hWE1zSUh0Y2JpQWdJQ0FnSUNkdmNIUnBiMjV6SnpvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUc5d2RHbHZibk1nZkh3Z2UzMHNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lIMHBPMXh1WEc0Z0lDQWdkR2hwY3k1eVpXNWtaWEpsY2lBOUlIUm9hWE03WEc1Y2JpQWdJQ0JwWmlBb2RIbHdaVzltSUc5d2RHbHZibk11ZEdWeWJWSmxjMjlzZG1WeUlEMDlQU0FuWm5WdVkzUnBiMjRuS1Z4dUlDQWdJQ0FnZEdocGN5NWpiMjUwWlhoMExsOTBaWEp0VW1WemIyeDJaWElnUFNCdmNIUnBiMjV6TG5SbGNtMVNaWE52YkhabGNqdGNiaUFnZlZ4dVhHNGdJR2RsZEU5d2RHbHZibk1vS1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWIzQjBhVzl1Y3p0Y2JpQWdmVnh1WEc0Z0lISmxjMjlzZG1WVVpYSnRLR0Z5WjNNcElIdGNiaUFnSUNCc1pYUWdleUIwWlhKdFVtVnpiMngyWlhJZ2ZTQTlJSFJvYVhNdVoyVjBUM0IwYVc5dWN5Z3BPMXh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdkR1Z5YlZKbGMyOXNkbVZ5SUQwOVBTQW5ablZ1WTNScGIyNG5LVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUmxjbTFTWlhOdmJIWmxjaTVqWVd4c0tIUm9hWE1zSUdGeVozTXBPMXh1WEc0Z0lDQWdiR1YwSUdOb2FXeGtjbVZ1SUQwZ0tHRnlaM011WTJocGJHUnlaVzRnZkh3Z1cxMHBPMXh1SUNBZ0lISmxkSFZ5YmlCamFHbHNaSEpsYmx0amFHbHNaSEpsYmk1c1pXNW5kR2dnTFNBeFhTQjhmQ0FuSnp0Y2JpQWdmVnh1WEc0Z0lHTnlaV0YwWlVOdmJuUmxlSFFvY205dmRFTnZiblJsZUhRc0lHOXVWWEJrWVhSbExDQnZibFZ3WkdGMFpWUm9hWE1wSUh0Y2JpQWdJQ0JzWlhRZ1kyOXVkR1Y0ZENBZ0lDQWdQU0JQWW1wbFkzUXVZM0psWVhSbEtHNTFiR3dwTzF4dUlDQWdJR3hsZENCdGVVTnZiblJsZUhSSlJDQTlJQ2h5YjI5MFEyOXVkR1Y0ZENrZ1B5QnliMjkwUTI5dWRHVjRkRnREVDA1VVJWaFVYMGxFWFNBNklFbE9TVlJKUVV4ZlEwOU9WRVZZVkY5SlJEdGNibHh1SUNBZ0lISmxkSFZ5YmlCdVpYY2dVSEp2ZUhrb1kyOXVkR1Y0ZEN3Z2UxeHVJQ0FnSUNBZ1oyVjBPaUFvZEdGeVoyVjBMQ0J3Y205d1RtRnRaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvY0hKdmNFNWhiV1VnUFQwOUlFTlBUbFJGV0ZSZlNVUXBJSHRjYmlBZ0lDQWdJQ0FnSUNCc1pYUWdjR0Z5Wlc1MFNVUWdQU0FvY205dmRFTnZiblJsZUhRcElEOGdjbTl2ZEVOdmJuUmxlSFJiUTA5T1ZFVllWRjlKUkYwZ09pQkpUa2xVU1VGTVgwTlBUbFJGV0ZSZlNVUTdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJQ2h3WVhKbGJuUkpSQ0ErSUcxNVEyOXVkR1Y0ZEVsRUtTQS9JSEJoY21WdWRFbEVJRG9nYlhsRGIyNTBaWGgwU1VRN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JwWmlBb0lVOWlhbVZqZEM1d2NtOTBiM1I1Y0dVdWFHRnpUM2R1VUhKdmNHVnlkSGt1WTJGc2JDaDBZWEpuWlhRc0lIQnliM0JPWVcxbEtTbGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdLSEp2YjNSRGIyNTBaWGgwS1NBL0lISnZiM1JEYjI1MFpYaDBXM0J5YjNCT1lXMWxYU0E2SUhWdVpHVm1hVzVsWkR0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHRnlaMlYwVzNCeWIzQk9ZVzFsWFR0Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCelpYUTZJQ2gwWVhKblpYUXNJSEJ5YjNCT1lXMWxMQ0IyWVd4MVpTa2dQVDRnZTF4dUlDQWdJQ0FnSUNCcFppQW9jSEp2Y0U1aGJXVWdQVDA5SUVOUFRsUkZXRlJmU1VRcFhHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLSFJoY21kbGRGdHdjbTl3VG1GdFpWMGdQVDA5SUhaaGJIVmxLVnh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ0lDQWdJRzE1UTI5dWRHVjRkRWxFSUQwZ0t5dGZZMjl1ZEdWNGRFbEVRMjkxYm5SbGNqdGNiaUFnSUNBZ0lDQWdkR0Z5WjJWMFczQnliM0JPWVcxbFhTQTlJSFpoYkhWbE8xeHVYRzRnSUNBZ0lDQWdJR2xtSUNoMGVYQmxiMllnYjI1VmNHUmhkR1VnUFQwOUlDZG1kVzVqZEdsdmJpY3BYRzRnSUNBZ0lDQWdJQ0FnYjI1VmNHUmhkR1V1WTJGc2JDaHZibFZ3WkdGMFpWUm9hWE1zSUc5dVZYQmtZWFJsVkdocGN5azdYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUgwcE8xeHVJQ0I5WEc1OVhHNGlMQ0pwYlhCdmNuUWdaR1ZoWkdKbFpXWWdabkp2YlNBblpHVmhaR0psWldZbk8xeHVhVzF3YjNKMElDb2dZWE1nVlhScGJITWdabkp2YlNBbkxpNHZkWFJwYkhNdWFuTW5PMXh1YVcxd2IzSjBJSHRjYmlBZ2FYTkthV0pwYzJnc1hHNGdJSEpsYzI5c2RtVkRhR2xzWkhKbGJpeGNiaUFnWTI5dWMzUnlkV04wU21saUxGeHVmU0JtY205dElDY3VMaTlxYVdJdWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdRMDlPVkVWWVZGOUpSQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TDI1dlpHVXZZMjl1ZEdWNGRFbEVKeWs3WEc1Y2JtVjRjRzl5ZENCamJHRnpjeUJTYjI5MFRtOWtaU0I3WEc0Z0lITjBZWFJwWXlCRFQwNVVSVmhVWDBsRUlEMGdRMDlPVkVWWVZGOUpSRHRjYmx4dUlDQmpiMjV6ZEhKMVkzUnZjaWh5Wlc1a1pYSmxjaXdnY0dGeVpXNTBUbTlrWlN3Z1gyTnZiblJsZUhRc0lHcHBZaWtnZTF4dUlDQWdJR3hsZENCamIyNTBaWGgwSUQwZ2JuVnNiRHRjYmx4dUlDQWdJR2xtSUNoMGFHbHpMbU52Ym5OMGNuVmpkRzl5TGtoQlUxOURUMDVVUlZoVUlDRTlQU0JtWVd4elpTQW1KaUFvY21WdVpHVnlaWElnZkh3Z2RHaHBjeTVqY21WaGRHVkRiMjUwWlhoMEtTa2dlMXh1SUNBZ0lDQWdZMjl1ZEdWNGRDQTlJQ2h5Wlc1a1pYSmxjaUI4ZkNCMGFHbHpLUzVqY21WaGRHVkRiMjUwWlhoMEtGeHVJQ0FnSUNBZ0lDQmZZMjl1ZEdWNGRDeGNiaUFnSUNBZ0lDQWdLSFJvYVhNdWIyNURiMjUwWlhoMFZYQmtZWFJsS1NBL0lIUm9hWE11YjI1RGIyNTBaWGgwVlhCa1lYUmxJRG9nZFc1a1pXWnBibVZrTEZ4dUlDQWdJQ0FnSUNCMGFHbHpMRnh1SUNBZ0lDQWdLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkR2xsY3loMGFHbHpMQ0I3WEc0Z0lDQWdJQ0FuVkZsUVJTYzZJSHRjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNBZ0lDQWdaMlYwT2lBZ0lDQWdJQ0FnSUNBb0tTQTlQaUIwYUdsekxtTnZibk4wY25WamRHOXlMbFJaVUVVc1hHNGdJQ0FnSUNBZ0lITmxkRG9nSUNBZ0lDQWdJQ0FnS0NrZ1BUNGdlMzBzSUM4dklFNVBUMUJjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuYVdRbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1ZYUnBiSE11WjJWdVpYSmhkR1ZWVlVsRUtDa3NYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKM0psYm1SbGNtVnlKem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQnlaVzVrWlhKbGNpeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQW5jR0Z5Wlc1MFRtOWtaU2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdjR0Z5Wlc1MFRtOWtaU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuWTJocGJHUk9iMlJsY3ljNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnYm1WM0lFMWhjQ2dwTEZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNkamIyNTBaWGgwSnpvZ2UxeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdkbGREb2dJQ0FnSUNBZ0lDQWdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQmpiMjUwWlhoME8xeHVJQ0FnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdJQ0J6WlhRNklDQWdJQ0FnSUNBZ0lDZ3BJRDArSUh0OUxGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZGtaWE4wY205NWFXNW5Kem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmNtVnVaR1Z5VUhKdmJXbHpaU2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdiblZzYkN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmNtVnVaR1Z5Um5KaGJXVW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lEQXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMnBwWWljNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnYW1saUxGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHVZWFJwZG1WRmJHVnRaVzUwSnpvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J1ZFd4c0xGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNCOUtUdGNiaUFnZlZ4dVhHNGdJSEpsYzI5c2RtVkRhR2xzWkhKbGJpaGphR2xzWkhKbGJpa2dlMXh1SUNBZ0lISmxkSFZ5YmlCeVpYTnZiSFpsUTJocGJHUnlaVzR1WTJGc2JDaDBhR2x6TENCamFHbHNaSEpsYmlrN1hHNGdJSDFjYmx4dUlDQnBjMHBwWWloMllXeDFaU2tnZTF4dUlDQWdJSEpsZEhWeWJpQnBjMHBwWW1semFDaDJZV3gxWlNrN1hHNGdJSDFjYmx4dUlDQmpiMjV6ZEhKMVkzUkthV0lvZG1Gc2RXVXBJSHRjYmlBZ0lDQnlaWFIxY200Z1kyOXVjM1J5ZFdOMFNtbGlLSFpoYkhWbEtUdGNiaUFnZlZ4dVhHNGdJR2RsZEVOaFkyaGxTMlY1S0NrZ2UxeHVJQ0FnSUd4bGRDQjdJRlI1Y0dVc0lIQnliM0J6SUgwZ1BTQW9kR2hwY3k1cWFXSWdmSHdnZTMwcE8xeHVJQ0FnSUd4bGRDQmpZV05vWlV0bGVTQTlJR1JsWVdSaVpXVm1LRlI1Y0dVc0lIQnliM0J6TG10bGVTazdYRzVjYmlBZ0lDQnlaWFIxY200Z1kyRmphR1ZMWlhrN1hHNGdJSDFjYmx4dUlDQjFjR1JoZEdWS2FXSW9ibVYzU21saUtTQjdYRzRnSUNBZ2RHaHBjeTVxYVdJZ1BTQnVaWGRLYVdJN1hHNGdJSDFjYmx4dUlDQmpiR1ZoY2tOb2FXeGtjbVZ1S0NrZ2UxeHVJQ0FnSUhSb2FYTXVZMmhwYkdST2IyUmxjeTVqYkdWaGNpZ3BPMXh1SUNCOVhHNWNiaUFnY21WdGIzWmxRMmhwYkdRb1kyaHBiR1JPYjJSbEtTQjdYRzRnSUNBZ2JHVjBJR05oWTJobFMyVjVJRDBnWTJocGJHUk9iMlJsTG1kbGRFTmhZMmhsUzJWNUtDazdYRzRnSUNBZ2RHaHBjeTVqYUdsc1pFNXZaR1Z6TG1SbGJHVjBaU2hqWVdOb1pVdGxlU2s3WEc0Z0lIMWNibHh1SUNCaFpHUkRhR2xzWkNoamFHbHNaRTV2WkdVc0lGOWpZV05vWlV0bGVTa2dlMXh1SUNBZ0lHeGxkQ0JqWVdOb1pVdGxlU0E5SUNoZlkyRmphR1ZMWlhrcElEOGdYMk5oWTJobFMyVjVJRG9nWTJocGJHUk9iMlJsTG1kbGRFTmhZMmhsUzJWNUtDazdYRzRnSUNBZ2RHaHBjeTVqYUdsc1pFNXZaR1Z6TG5ObGRDaGpZV05vWlV0bGVTd2dZMmhwYkdST2IyUmxLVHRjYmlBZ2ZWeHVYRzRnSUdkbGRFTm9hV3hrS0dOaFkyaGxTMlY1S1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdVkyaHBiR1JPYjJSbGN5NW5aWFFvWTJGamFHVkxaWGtwTzF4dUlDQjlYRzVjYmlBZ1oyVjBRMmhwYkdSeVpXNG9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11WTJocGJHUk9iMlJsY3p0Y2JpQWdmVnh1WEc0Z0lHZGxkRlJvYVhOT2IyUmxUM0pEYUdsc1pFNXZaR1Z6S0NrZ2UxeHVJQ0FnSUhKbGRIVnliaUIwYUdsek8xeHVJQ0I5WEc1Y2JpQWdaMlYwUTJocGJHUnlaVzVPYjJSbGN5Z3BJSHRjYmlBZ0lDQnNaWFFnWTJocGJHUk9iMlJsY3lBOUlGdGRPMXh1SUNBZ0lHWnZjaUFvYkdWMElHTm9hV3hrVG05a1pTQnZaaUIwYUdsekxtTm9hV3hrVG05a1pYTXVkbUZzZFdWektDa3BYRzRnSUNBZ0lDQmphR2xzWkU1dlpHVnpJRDBnWTJocGJHUk9iMlJsY3k1amIyNWpZWFFvWTJocGJHUk9iMlJsTG1kbGRGUm9hWE5PYjJSbFQzSkRhR2xzWkU1dlpHVnpLQ2twTzF4dVhHNGdJQ0FnY21WMGRYSnVJR05vYVd4a1RtOWtaWE11Wm1sc2RHVnlLRUp2YjJ4bFlXNHBPMXh1SUNCOVhHNWNiaUFnWVhONWJtTWdaR1Z6ZEhKdmVTaG1iM0pqWlNrZ2UxeHVJQ0FnSUdsbUlDZ2habTl5WTJVZ0ppWWdkR2hwY3k1a1pYTjBjbTk1YVc1bktWeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJQ0FnZEdocGN5NWtaWE4wY205NWFXNW5JRDBnZEhKMVpUdGNibHh1SUNBZ0lHbG1JQ2gwYUdsekxuSmxibVJsY2xCeWIyMXBjMlVwWEc0Z0lDQWdJQ0JoZDJGcGRDQjBhR2x6TG5KbGJtUmxjbEJ5YjIxcGMyVTdYRzVjYmlBZ0lDQmhkMkZwZENCMGFHbHpMbVJsYzNSeWIzbEdjbTl0UkU5TktIUm9hWE11WTI5dWRHVjRkQ3dnZEdocGN5azdYRzVjYmlBZ0lDQnNaWFFnWkdWemRISnZlVkJ5YjIxcGMyVnpJRDBnVzEwN1hHNGdJQ0FnWm05eUlDaHNaWFFnWTJocGJHUk9iMlJsSUc5bUlIUm9hWE11WTJocGJHUk9iMlJsY3k1MllXeDFaWE1vS1NsY2JpQWdJQ0FnSUdSbGMzUnliM2xRY205dGFYTmxjeTV3ZFhOb0tHTm9hV3hrVG05a1pTNWtaWE4wY205NUtDa3BPMXh1WEc0Z0lDQWdkR2hwY3k1amFHbHNaRTV2WkdWekxtTnNaV0Z5S0NrN1hHNGdJQ0FnWVhkaGFYUWdVSEp2YldselpTNWhiR3dvWkdWemRISnZlVkJ5YjIxcGMyVnpLVHRjYmx4dUlDQWdJSFJvYVhNdWJtRjBhWFpsUld4bGJXVnVkQ0E5SUc1MWJHdzdYRzRnSUNBZ2RHaHBjeTV3WVhKbGJuUk9iMlJsSUQwZ2JuVnNiRHRjYmlBZ0lDQjBhR2x6TG1OdmJuUmxlSFFnUFNCdWRXeHNPMXh1SUNBZ0lIUm9hWE11YW1saUlEMGdiblZzYkR0Y2JpQWdmVnh1WEc0Z0lHbHpWbUZzYVdSRGFHbHNaQ2hqYUdsc1pDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCVmRHbHNjeTVwYzFaaGJHbGtRMmhwYkdRb1kyaHBiR1FwTzF4dUlDQjlYRzVjYmlBZ2FYTkpkR1Z5WVdKc1pVTm9hV3hrS0dOb2FXeGtLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGVjBhV3h6TG1selNYUmxjbUZpYkdWRGFHbHNaQ2hqYUdsc1pDazdYRzRnSUgxY2JseHVJQ0J3Y205d2MwUnBabVpsY2lodmJHUlFjbTl3Y3l3Z2JtVjNVSEp2Y0hNc0lITnJhWEJMWlhsektTQjdYRzRnSUNBZ2NtVjBkWEp1SUZWMGFXeHpMbkJ5YjNCelJHbG1abVZ5S0c5c1pGQnliM0J6TENCdVpYZFFjbTl3Y3l3Z2MydHBjRXRsZVhNcE8xeHVJQ0I5WEc1Y2JpQWdZMmhwYkdSeVpXNUVhV1ptWlhJb2IyeGtRMmhwYkdSeVpXNHNJRzVsZDBOb2FXeGtjbVZ1S1NCN1hHNGdJQ0FnY21WMGRYSnVJRlYwYVd4ekxtTm9hV3hrY21WdVJHbG1abVZ5S0c5c1pFTm9hV3hrY21WdUxDQnVaWGREYUdsc1pISmxiaWs3WEc0Z0lIMWNibHh1SUNCaGMzbHVZeUJ5Wlc1a1pYSW9MaTR1WVhKbmN5a2dlMXh1SUNBZ0lHbG1JQ2gwYUdsekxtUmxjM1J5YjNscGJtY3BYRzRnSUNBZ0lDQnlaWFIxY200N1hHNWNiaUFnSUNCMGFHbHpMbkpsYm1SbGNrWnlZVzFsS3lzN1hHNGdJQ0FnYkdWMElISmxibVJsY2taeVlXMWxJRDBnZEdocGN5NXlaVzVrWlhKR2NtRnRaVHRjYmx4dUlDQWdJR2xtSUNoMGVYQmxiMllnZEdocGN5NWZjbVZ1WkdWeUlEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnSUNCMGFHbHpMbkpsYm1SbGNsQnliMjFwYzJVZ1BTQjBhR2x6TGw5eVpXNWtaWElvTGk0dVlYSm5jeWxjYmlBZ0lDQWdJQ0FnTG5Sb1pXNG9ZWE41Ym1NZ0tISmxjM1ZzZENrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaHlaVzVrWlhKR2NtRnRaU0ErUFNCMGFHbHpMbkpsYm1SbGNrWnlZVzFsS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2RHaHBjeTV6ZVc1alJFOU5LSFJvYVhNdVkyOXVkR1Y0ZEN3Z2RHaHBjeWs3WEc1Y2JpQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJtUmxjbEJ5YjIxcGMyVWdQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNGdJQ0FnSUNBZ0lIMHBYRzRnSUNBZ0lDQWdJQzVqWVhSamFDZ29aWEp5YjNJcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNCMGFHbHpMbkpsYm1SbGNsQnliMjFwYzJVZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnSUNBZ0lIUm9jbTkzSUdWeWNtOXlPMXh1SUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdZWGRoYVhRZ2RHaHBjeTV6ZVc1alJFOU5LSFJvYVhNdVkyOXVkR1Y0ZEN3Z2RHaHBjeWs3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11Y21WdVpHVnlVSEp2YldselpUdGNiaUFnZlZ4dVhHNGdJR2RsZEZCaGNtVnVkRWxFS0NrZ2UxeHVJQ0FnSUdsbUlDZ2hkR2hwY3k1d1lYSmxiblJPYjJSbEtWeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWNHRnlaVzUwVG05a1pTNXBaRHRjYmlBZ2ZWeHVYRzRnSUdGemVXNWpJR1JsYzNSeWIzbEdjbTl0UkU5TktHTnZiblJsZUhRc0lHNXZaR1VwSUh0Y2JpQWdJQ0JwWmlBb0lYUm9hWE11Y21WdVpHVnlaWElwWEc0Z0lDQWdJQ0J5WlhSMWNtNDdYRzVjYmlBZ0lDQnlaWFIxY200Z1lYZGhhWFFnZEdocGN5NXlaVzVrWlhKbGNpNWtaWE4wY205NVJuSnZiVVJQVFNoamIyNTBaWGgwTENCdWIyUmxLVHRjYmlBZ2ZWeHVYRzRnSUdGemVXNWpJSE41Ym1ORVQwMG9ZMjl1ZEdWNGRDd2dibTlrWlNrZ2UxeHVJQ0FnSUdsbUlDZ2hkR2hwY3k1eVpXNWtaWEpsY2lsY2JpQWdJQ0FnSUhKbGRIVnlianRjYmx4dUlDQWdJSEpsZEhWeWJpQmhkMkZwZENCMGFHbHpMbkpsYm1SbGNtVnlMbk41Ym1ORVQwMG9ZMjl1ZEdWNGRDd2dibTlrWlNrN1hHNGdJSDFjYm4xY2JpSXNJaThxSUdWemJHbHVkQzFrYVhOaFlteGxJRzV2TFcxaFoybGpMVzUxYldKbGNuTWdLaTljYm1sdGNHOXlkQ0JrWldGa1ltVmxaaUJtY205dElDZGtaV0ZrWW1WbFppYzdYRzVjYm1OdmJuTjBJRk5VVDFBZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWMwbDBaWEpoZEdWVGRHOXdKeWs3WEc1Y2JpOHZJR1Z6YkdsdWRDMWthWE5oWW14bExXNWxlSFF0YkdsdVpTQnVieTF1WlhOMFpXUXRkR1Z5Ym1GeWVWeHVZMjl1YzNRZ1oyeHZZbUZzVTJOdmNHVWdQU0FvZEhsd1pXOW1JR2RzYjJKaGJDQWhQVDBnSjNWdVpHVm1hVzVsWkNjcElEOGdaMnh2WW1Gc0lEb2dLSFI1Y0dWdlppQjNhVzVrYjNjZ0lUMDlJQ2QxYm1SbFptbHVaV1FuS1NBL0lIZHBibVJ2ZHlBNklIUm9hWE03WEc1Y2JteGxkQ0IxZFdsa0lEMGdNVEF3TURBd01EdGNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR2x1YzNSaGJtTmxUMllvYjJKcUtTQjdYRzRnSUdaMWJtTjBhVzl1SUhSbGMzUlVlWEJsS0c5aWFpd2dYM1poYkNrZ2UxeHVJQ0FnSUdaMWJtTjBhVzl1SUdselJHVm1aWEp5WldSVWVYQmxLRzlpYWlrZ2UxeHVJQ0FnSUNBZ2FXWWdLRzlpYWlCcGJuTjBZVzVqWlc5bUlGQnliMjFwYzJVZ2ZId2dLRzlpYWk1amIyNXpkSEoxWTNSdmNpQW1KaUJ2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlNBOVBUMGdKMUJ5YjIxcGMyVW5LU2xjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNBZ0lDOHZJRkYxWVdOcklIRjFZV05yTGk0dVhHNGdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlHOWlhaTUwYUdWdUlEMDlQU0FuWm5WdVkzUnBiMjRuSUNZbUlIUjVjR1Z2WmlCdlltb3VZMkYwWTJnZ1BUMDlJQ2RtZFc1amRHbHZiaWNwWEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc0Z0lDQWdmVnh1WEc0Z0lDQWdiR1YwSUhaaGJDQWdJQ0FnUFNCZmRtRnNPMXh1SUNBZ0lHeGxkQ0IwZVhCbFQyWWdJRDBnS0hSNWNHVnZaaUJ2WW1vcE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VTNSeWFXNW5LVnh1SUNBZ0lDQWdkbUZzSUQwZ0ozTjBjbWx1WnljN1hHNGdJQ0FnWld4elpTQnBaaUFvZG1Gc0lEMDlQU0JuYkc5aVlXeFRZMjl3WlM1T2RXMWlaWElwWEc0Z0lDQWdJQ0IyWVd3Z1BTQW5iblZ0WW1WeUp6dGNiaUFnSUNCbGJITmxJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExrSnZiMnhsWVc0cFhHNGdJQ0FnSUNCMllXd2dQU0FuWW05dmJHVmhiaWM3WEc0Z0lDQWdaV3h6WlNCcFppQW9kbUZzSUQwOVBTQm5iRzlpWVd4VFkyOXdaUzVHZFc1amRHbHZiaWxjYmlBZ0lDQWdJSFpoYkNBOUlDZG1kVzVqZEdsdmJpYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNUJjbkpoZVNsY2JpQWdJQ0FnSUhaaGJDQTlJQ2RoY25KaGVTYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNVBZbXBsWTNRcFhHNGdJQ0FnSUNCMllXd2dQU0FuYjJKcVpXTjBKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMbEJ5YjIxcGMyVXBYRzRnSUNBZ0lDQjJZV3dnUFNBbmNISnZiV2x6WlNjN1hHNGdJQ0FnWld4elpTQnBaaUFvZG1Gc0lEMDlQU0JuYkc5aVlXeFRZMjl3WlM1Q2FXZEpiblFwWEc0Z0lDQWdJQ0IyWVd3Z1BTQW5ZbWxuYVc1MEp6dGNiaUFnSUNCbGJITmxJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExrMWhjQ2xjYmlBZ0lDQWdJSFpoYkNBOUlDZHRZWEFuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VjJWaGEwMWhjQ2xjYmlBZ0lDQWdJSFpoYkNBOUlDZDNaV0ZyYldGd0p6dGNiaUFnSUNCbGJITmxJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExsTmxkQ2xjYmlBZ0lDQWdJSFpoYkNBOUlDZHpaWFFuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VTNsdFltOXNLVnh1SUNBZ0lDQWdkbUZzSUQwZ0ozTjViV0p2YkNjN1hHNGdJQ0FnWld4elpTQnBaaUFvZG1Gc0lEMDlQU0JuYkc5aVlXeFRZMjl3WlM1Q2RXWm1aWElwWEc0Z0lDQWdJQ0IyWVd3Z1BTQW5ZblZtWm1WeUp6dGNibHh1SUNBZ0lHbG1JQ2gyWVd3Z1BUMDlJQ2RpZFdabVpYSW5JQ1ltSUdkc2IySmhiRk5qYjNCbExrSjFabVpsY2lBbUppQm5iRzlpWVd4VFkyOXdaUzVDZFdabVpYSXVhWE5DZFdabVpYSW9iMkpxS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKMjUxYldKbGNpY2dKaVlnS0hSNWNHVlBaaUE5UFQwZ0oyNTFiV0psY2ljZ2ZId2diMkpxSUdsdWMzUmhibU5sYjJZZ1RuVnRZbVZ5SUh4OElDaHZZbW91WTI5dWMzUnlkV04wYjNJZ0ppWWdiMkpxTG1OdmJuTjBjblZqZEc5eUxtNWhiV1VnUFQwOUlDZE9kVzFpWlhJbktTa3BJSHRjYmlBZ0lDQWdJR2xtSUNnaGFYTkdhVzVwZEdVb2IySnFLU2xjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lDRTlQU0FuYjJKcVpXTjBKeUFtSmlCMllXd2dQVDA5SUhSNWNHVlBaaWxjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0E5UFQwZ0oyOWlhbVZqZENjcElIdGNiaUFnSUNBZ0lHbG1JQ2dvYjJKcUxtTnZibk4wY25WamRHOXlJRDA5UFNCUFltcGxZM1F1Y0hKdmRHOTBlWEJsTG1OdmJuTjBjblZqZEc5eUlIeDhJQ2h2WW1vdVkyOXVjM1J5ZFdOMGIzSWdKaVlnYjJKcUxtTnZibk4wY25WamRHOXlMbTVoYldVZ1BUMDlJQ2RQWW1wbFkzUW5LU2twWEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ0lDQXZMeUJPZFd4c0lIQnliM1J2ZEhsd1pTQnZiaUJ2WW1wbFkzUmNiaUFnSUNBZ0lHbG1JQ2gwZVhCbFQyWWdQVDA5SUNkdlltcGxZM1FuSUNZbUlDRnZZbW91WTI5dWMzUnlkV04wYjNJcFhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0E5UFQwZ0oyRnljbUY1SnlBbUppQW9RWEp5WVhrdWFYTkJjbkpoZVNodlltb3BJSHg4SUc5aWFpQnBibk4wWVc1alpXOW1JRUZ5Y21GNUlIeDhJQ2h2WW1vdVkyOXVjM1J5ZFdOMGIzSWdKaVlnYjJKcUxtTnZibk4wY25WamRHOXlMbTVoYldVZ1BUMDlJQ2RCY25KaGVTY3BLU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnYVdZZ0tDaDJZV3dnUFQwOUlDZHdjbTl0YVhObEp5QjhmQ0IyWVd3Z1BUMDlJQ2RrWldabGNuSmxaQ2NwSUNZbUlHbHpSR1ZtWlhKeVpXUlVlWEJsS0c5aWFpa3BYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJR2xtSUNoMllXd2dQVDA5SUNkemRISnBibWNuSUNZbUlDaHZZbW9nYVc1emRHRnVZMlZ2WmlCbmJHOWlZV3hUWTI5d1pTNVRkSEpwYm1jZ2ZId2dLRzlpYWk1amIyNXpkSEoxWTNSdmNpQW1KaUJ2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlNBOVBUMGdKMU4wY21sdVp5Y3BLU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0E5UFQwZ0oySnZiMnhsWVc0bklDWW1JQ2h2WW1vZ2FXNXpkR0Z1WTJWdlppQm5iRzlpWVd4VFkyOXdaUzVDYjI5c1pXRnVJSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkQ2IyOXNaV0Z1SnlrcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuYldGd0p5QW1KaUFvYjJKcUlHbHVjM1JoYm1ObGIyWWdaMnh2WW1Gc1UyTnZjR1V1VFdGd0lIeDhJQ2h2WW1vdVkyOXVjM1J5ZFdOMGIzSWdKaVlnYjJKcUxtTnZibk4wY25WamRHOXlMbTVoYldVZ1BUMDlJQ2ROWVhBbktTa3BYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJR2xtSUNoMllXd2dQVDA5SUNkM1pXRnJiV0Z3SnlBbUppQW9iMkpxSUdsdWMzUmhibU5sYjJZZ1oyeHZZbUZzVTJOdmNHVXVWMlZoYTAxaGNDQjhmQ0FvYjJKcUxtTnZibk4wY25WamRHOXlJQ1ltSUc5aWFpNWpiMjV6ZEhKMVkzUnZjaTV1WVcxbElEMDlQU0FuVjJWaGEwMWhjQ2NwS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKM05sZENjZ0ppWWdLRzlpYWlCcGJuTjBZVzVqWlc5bUlHZHNiMkpoYkZOamIzQmxMbE5sZENCOGZDQW9iMkpxTG1OdmJuTjBjblZqZEc5eUlDWW1JRzlpYWk1amIyNXpkSEoxWTNSdmNpNXVZVzFsSUQwOVBTQW5VMlYwSnlrcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuWm5WdVkzUnBiMjRuSUNZbUlIUjVjR1ZQWmlBOVBUMGdKMloxYm1OMGFXOXVKeWxjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnYVdZZ0tIUjVjR1Z2WmlCMllXd2dQVDA5SUNkbWRXNWpkR2x2YmljZ0ppWWdiMkpxSUdsdWMzUmhibU5sYjJZZ2RtRnNLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0JwWmlBb2RIbHdaVzltSUhaaGJDQTlQVDBnSjNOMGNtbHVaeWNnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNCMllXd3BYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JpQWdmVnh1WEc0Z0lHbG1JQ2h2WW1vZ1BUMGdiblZzYkNsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnWm05eUlDaDJZWElnYVNBOUlERXNJR3hsYmlBOUlHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnN0lHa2dQQ0JzWlc0N0lHa3JLeWtnZTF4dUlDQWdJR2xtSUNoMFpYTjBWSGx3WlNodlltb3NJR0Z5WjNWdFpXNTBjMXRwWFNrZ1BUMDlJSFJ5ZFdVcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJSEJ5YjNCelJHbG1abVZ5S0c5c1pGQnliM0J6TENCdVpYZFFjbTl3Y3l3Z2MydHBjRXRsZVhNcElIdGNiaUFnYVdZZ0tHOXNaRkJ5YjNCeklEMDlQU0J1WlhkUWNtOXdjeWxjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0hSNWNHVnZaaUJ2YkdSUWNtOXdjeUFoUFQwZ2RIbHdaVzltSUc1bGQxQnliM0J6S1Z4dUlDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJR2xtSUNnaGIyeGtVSEp2Y0hNZ0ppWWdibVYzVUhKdmNITXBYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ2FXWWdLRzlzWkZCeWIzQnpJQ1ltSUNGdVpYZFFjbTl3Y3lsY2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0F2THlCbGMyeHBiblF0WkdsellXSnNaUzF1WlhoMExXeHBibVVnWlhGbGNXVnhYRzRnSUdsbUlDZ2hiMnhrVUhKdmNITWdKaVlnSVc1bGQxQnliM0J6SUNZbUlHOXNaRkJ5YjNCeklDRTlJRzlzWkZCeWIzQnpLVnh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lHeGxkQ0JoUzJWNWN5QTlJRTlpYW1WamRDNXJaWGx6S0c5c1pGQnliM0J6S1M1amIyNWpZWFFvVDJKcVpXTjBMbWRsZEU5M2JsQnliM0JsY25SNVUzbHRZbTlzY3lodmJHUlFjbTl3Y3lrcE8xeHVJQ0JzWlhRZ1lrdGxlWE1nUFNCUFltcGxZM1F1YTJWNWN5aHVaWGRRY205d2N5a3VZMjl1WTJGMEtFOWlhbVZqZEM1blpYUlBkMjVRY205d1pYSjBlVk41YldKdmJITW9ibVYzVUhKdmNITXBLVHRjYmx4dUlDQnBaaUFvWVV0bGVYTXViR1Z1WjNSb0lDRTlQU0JpUzJWNWN5NXNaVzVuZEdncFhHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ1lVdGxlWE11YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUd4bGRDQmhTMlY1SUQwZ1lVdGxlWE5iYVYwN1hHNGdJQ0FnYVdZZ0tITnJhWEJMWlhseklDWW1JSE5yYVhCTFpYbHpMbWx1WkdWNFQyWW9ZVXRsZVNrZ1BqMGdNQ2xjYmlBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdhV1lnS0c5c1pGQnliM0J6VzJGTFpYbGRJQ0U5UFNCdVpYZFFjbTl3YzF0aFMyVjVYU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnYkdWMElHSkxaWGtnUFNCaVMyVjVjMXRwWFR0Y2JpQWdJQ0JwWmlBb2MydHBjRXRsZVhNZ0ppWWdjMnRwY0V0bGVYTXVhVzVrWlhoUFppaGlTMlY1S1NsY2JpQWdJQ0FnSUdOdmJuUnBiblZsTzF4dVhHNGdJQ0FnYVdZZ0tHRkxaWGtnUFQwOUlHSkxaWGtwWEc0Z0lDQWdJQ0JqYjI1MGFXNTFaVHRjYmx4dUlDQWdJR2xtSUNodmJHUlFjbTl3YzF0aVMyVjVYU0FoUFQwZ2JtVjNVSEp2Y0hOYllrdGxlVjBwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlCbVlXeHpaVHRjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlITnBlbVZQWmloMllXeDFaU2tnZTF4dUlDQnBaaUFvSVhaaGJIVmxLVnh1SUNBZ0lISmxkSFZ5YmlBd08xeHVYRzRnSUdsbUlDaFBZbXBsWTNRdWFYTW9TVzVtYVc1cGRIa3BLVnh1SUNBZ0lISmxkSFZ5YmlBd08xeHVYRzRnSUdsbUlDaDBlWEJsYjJZZ2RtRnNkV1V1YkdWdVozUm9JRDA5UFNBbmJuVnRZbVZ5SnlsY2JpQWdJQ0J5WlhSMWNtNGdkbUZzZFdVdWJHVnVaM1JvTzF4dVhHNGdJSEpsZEhWeWJpQlBZbXBsWTNRdWEyVjVjeWgyWVd4MVpTa3ViR1Z1WjNSb08xeHVmVnh1WEc1bWRXNWpkR2x2YmlCZmFYUmxjbUYwWlNodlltb3NJR05oYkd4aVlXTnJLU0I3WEc0Z0lHbG1JQ2doYjJKcUlIeDhJRTlpYW1WamRDNXBjeWhKYm1acGJtbDBlU2twWEc0Z0lDQWdjbVYwZFhKdUlGdGRPMXh1WEc0Z0lHeGxkQ0J5WlhOMWJIUnpJQ0FnUFNCYlhUdGNiaUFnYkdWMElITmpiM0JsSUNBZ0lDQTlJSHNnWTI5c2JHVmpkR2x2YmpvZ2IySnFMQ0JUVkU5UUlIMDdYRzRnSUd4bGRDQnlaWE4xYkhRN1hHNWNiaUFnYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvYjJKcUtTa2dlMXh1SUNBZ0lITmpiM0JsTG5SNWNHVWdQU0FuUVhKeVlYa25PMXh1WEc0Z0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYjJKcUxteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BJSHRjYmlBZ0lDQWdJSE5qYjNCbExuWmhiSFZsSUQwZ2IySnFXMmxkTzF4dUlDQWdJQ0FnYzJOdmNHVXVhVzVrWlhnZ1BTQnpZMjl3WlM1clpYa2dQU0JwTzF4dVhHNGdJQ0FnSUNCeVpYTjFiSFFnUFNCallXeHNZbUZqYXk1allXeHNLSFJvYVhNc0lITmpiM0JsS1R0Y2JpQWdJQ0FnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJRk5VVDFBcFhHNGdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dVhHNGdJQ0FnSUNCeVpYTjFiSFJ6TG5CMWMyZ29jbVZ6ZFd4MEtUdGNiaUFnSUNCOVhHNGdJSDBnWld4elpTQnBaaUFvZEhsd1pXOW1JRzlpYWk1bGJuUnlhV1Z6SUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdhV1lnS0c5aWFpQnBibk4wWVc1alpXOW1JRk5sZENCOGZDQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0oxTmxkQ2NwSUh0Y2JpQWdJQ0FnSUhOamIzQmxMblI1Y0dVZ1BTQW5VMlYwSnp0Y2JseHVJQ0FnSUNBZ2JHVjBJR2x1WkdWNElEMGdNRHRjYmlBZ0lDQWdJR1p2Y2lBb2JHVjBJR2wwWlcwZ2IyWWdiMkpxTG5aaGJIVmxjeWdwS1NCN1hHNGdJQ0FnSUNBZ0lITmpiM0JsTG5aaGJIVmxJRDBnYVhSbGJUdGNiaUFnSUNBZ0lDQWdjMk52Y0dVdWEyVjVJRDBnYVhSbGJUdGNiaUFnSUNBZ0lDQWdjMk52Y0dVdWFXNWtaWGdnUFNCcGJtUmxlQ3NyTzF4dVhHNGdJQ0FnSUNBZ0lISmxjM1ZzZENBOUlHTmhiR3hpWVdOckxtTmhiR3dvZEdocGN5d2djMk52Y0dVcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvY21WemRXeDBJRDA5UFNCVFZFOVFLVnh1SUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1WEc0Z0lDQWdJQ0FnSUhKbGMzVnNkSE11Y0hWemFDaHlaWE4xYkhRcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0J6WTI5d1pTNTBlWEJsSUQwZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVTdYRzVjYmlBZ0lDQWdJR3hsZENCcGJtUmxlQ0E5SURBN1hHNGdJQ0FnSUNCbWIzSWdLR3hsZENCYklHdGxlU3dnZG1Gc2RXVWdYU0J2WmlCdlltb3VaVzUwY21sbGN5Z3BLU0I3WEc0Z0lDQWdJQ0FnSUhOamIzQmxMblpoYkhWbElEMGdkbUZzZFdVN1hHNGdJQ0FnSUNBZ0lITmpiM0JsTG10bGVTQTlJR3RsZVR0Y2JpQWdJQ0FnSUNBZ2MyTnZjR1V1YVc1a1pYZ2dQU0JwYm1SbGVDc3JPMXh1WEc0Z0lDQWdJQ0FnSUhKbGMzVnNkQ0E5SUdOaGJHeGlZV05yTG1OaGJHd29kR2hwY3l3Z2MyTnZjR1VwTzF4dUlDQWdJQ0FnSUNCcFppQW9jbVZ6ZFd4MElEMDlQU0JUVkU5UUtWeHVJQ0FnSUNBZ0lDQWdJR0p5WldGck8xeHVYRzRnSUNBZ0lDQWdJSEpsYzNWc2RITXVjSFZ6YUNoeVpYTjFiSFFwTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmlBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0JwWmlBb2FXNXpkR0Z1WTJWUFppaHZZbW9zSUNkaWIyOXNaV0Z1Snl3Z0oyNTFiV0psY2ljc0lDZGlhV2RwYm5RbkxDQW5ablZ1WTNScGIyNG5LU2xjYmlBZ0lDQWdJSEpsZEhWeWJqdGNibHh1SUNBZ0lITmpiM0JsTG5SNWNHVWdQU0FvYjJKcUxtTnZibk4wY25WamRHOXlLU0EvSUc5aWFpNWpiMjV6ZEhKMVkzUnZjaTV1WVcxbElEb2dKMDlpYW1WamRDYzdYRzVjYmlBZ0lDQnNaWFFnYTJWNWN5QTlJRTlpYW1WamRDNXJaWGx6S0c5aWFpazdYRzRnSUNBZ1ptOXlJQ2hzWlhRZ2FTQTlJREFzSUdsc0lEMGdhMlY1Y3k1c1pXNW5kR2c3SUdrZ1BDQnBiRHNnYVNzcktTQjdYRzRnSUNBZ0lDQnNaWFFnYTJWNUlDQWdQU0JyWlhselcybGRPMXh1SUNBZ0lDQWdiR1YwSUhaaGJIVmxJRDBnYjJKcVcydGxlVjA3WEc1Y2JpQWdJQ0FnSUhOamIzQmxMblpoYkhWbElEMGdkbUZzZFdVN1hHNGdJQ0FnSUNCelkyOXdaUzVyWlhrZ1BTQnJaWGs3WEc0Z0lDQWdJQ0J6WTI5d1pTNXBibVJsZUNBOUlHazdYRzVjYmlBZ0lDQWdJSEpsYzNWc2RDQTlJR05oYkd4aVlXTnJMbU5oYkd3b2RHaHBjeXdnYzJOdmNHVXBPMXh1SUNBZ0lDQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ1UxUlBVQ2xjYmlBZ0lDQWdJQ0FnWW5KbFlXczdYRzVjYmlBZ0lDQWdJSEpsYzNWc2RITXVjSFZ6YUNoeVpYTjFiSFFwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUhKbGRIVnliaUJ5WlhOMWJIUnpPMXh1ZlZ4dVhHNVBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkR2xsY3loZmFYUmxjbUYwWlN3Z2UxeHVJQ0FuVTFSUFVDYzZJSHRjYmlBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUdaaGJITmxMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNCMllXeDFaVG9nSUNBZ0lDQWdJRk5VVDFBc1hHNGdJSDBzWEc1OUtUdGNibHh1Wlhod2IzSjBJR052Ym5OMElHbDBaWEpoZEdVZ1BTQmZhWFJsY21GMFpUdGNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR05vYVd4a2NtVnVSR2xtWm1WeUtHTm9hV3hrY21WdU1Td2dZMmhwYkdSeVpXNHlLU0I3WEc0Z0lHbG1JQ2hqYUdsc1pISmxiakVnUFQwOUlHTm9hV3hrY21WdU1pbGNiaUFnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ2JHVjBJSEpsYzNWc2RERWdQU0FvSVVGeWNtRjVMbWx6UVhKeVlYa29ZMmhwYkdSeVpXNHhLU2tnUHlCa1pXRmtZbVZsWmloamFHbHNaSEpsYmpFcElEb2daR1ZoWkdKbFpXWW9MaTR1WTJocGJHUnlaVzR4S1R0Y2JpQWdiR1YwSUhKbGMzVnNkRElnUFNBb0lVRnljbUY1TG1selFYSnlZWGtvWTJocGJHUnlaVzR5S1NrZ1B5QmtaV0ZrWW1WbFppaGphR2xzWkhKbGJqSXBJRG9nWkdWaFpHSmxaV1lvTGk0dVkyaHBiR1J5Wlc0eUtUdGNibHh1SUNCeVpYUjFjbTRnS0hKbGMzVnNkREVnSVQwOUlISmxjM1ZzZERJcE8xeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWm1WMFkyaEVaV1Z3VUhKdmNHVnlkSGtvYjJKcUxDQmZhMlY1TENCa1pXWmhkV3gwVm1Gc2RXVXNJR3hoYzNSUVlYSjBLU0I3WEc0Z0lHbG1JQ2h2WW1vZ1BUMGdiblZzYkNCOGZDQlBZbXBsWTNRdWFYTW9UbUZPTENCdlltb3BJSHg4SUU5aWFtVmpkQzVwY3loSmJtWnBibWwwZVN3Z2IySnFLU2xjYmlBZ0lDQnlaWFIxY200Z0tHeGhjM1JRWVhKMEtTQS9JRnNnWkdWbVlYVnNkRlpoYkhWbExDQnVkV3hzSUYwZ09pQmtaV1poZFd4MFZtRnNkV1U3WEc1Y2JpQWdhV1lnS0Y5clpYa2dQVDBnYm5Wc2JDQjhmQ0JQWW1wbFkzUXVhWE1vVG1GT0xDQmZhMlY1S1NCOGZDQlBZbXBsWTNRdWFYTW9TVzVtYVc1cGRIa3NJRjlyWlhrcEtWeHVJQ0FnSUhKbGRIVnliaUFvYkdGemRGQmhjblFwSUQ4Z1d5QmtaV1poZFd4MFZtRnNkV1VzSUc1MWJHd2dYU0E2SUdSbFptRjFiSFJXWVd4MVpUdGNibHh1SUNCc1pYUWdjR0Z5ZEhNN1hHNWNiaUFnYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvWDJ0bGVTa3BJSHRjYmlBZ0lDQndZWEowY3lBOUlGOXJaWGs3WEc0Z0lIMGdaV3h6WlNCcFppQW9kSGx3Wlc5bUlGOXJaWGtnUFQwOUlDZHplVzFpYjJ3bktTQjdYRzRnSUNBZ2NHRnlkSE1nUFNCYklGOXJaWGtnWFR0Y2JpQWdmU0JsYkhObElIdGNiaUFnSUNCc1pYUWdhMlY1SUNBZ0lDQWdJQ0FnUFNBb0p5Y2dLeUJmYTJWNUtUdGNiaUFnSUNCc1pYUWdiR0Z6ZEVsdVpHVjRJQ0FnUFNBd08xeHVJQ0FnSUd4bGRDQnNZWE4wUTNWeWMyOXlJQ0E5SURBN1hHNWNiaUFnSUNCd1lYSjBjeUE5SUZ0ZE8xeHVYRzRnSUNBZ0x5OGdaWE5zYVc1MExXUnBjMkZpYkdVdGJtVjRkQzFzYVc1bElHNXZMV052Ym5OMFlXNTBMV052Ym1ScGRHbHZibHh1SUNBZ0lIZG9hV3hsSUNoMGNuVmxLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2FXNWtaWGdnUFNCclpYa3VhVzVrWlhoUFppZ25MaWNzSUd4aGMzUkpibVJsZUNrN1hHNGdJQ0FnSUNCcFppQW9hVzVrWlhnZ1BDQXdLU0I3WEc0Z0lDQWdJQ0FnSUhCaGNuUnpMbkIxYzJnb2EyVjVMbk4xWW5OMGNtbHVaeWhzWVhOMFEzVnljMjl5S1NrN1hHNGdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCcFppQW9hMlY1TG1Ob1lYSkJkQ2hwYm1SbGVDQXRJREVwSUQwOVBTQW5YRnhjWENjcElIdGNiaUFnSUNBZ0lDQWdiR0Z6ZEVsdVpHVjRJRDBnYVc1a1pYZ2dLeUF4TzF4dUlDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NHRnlkSE11Y0hWemFDaHJaWGt1YzNWaWMzUnlhVzVuS0d4aGMzUkRkWEp6YjNJc0lHbHVaR1Y0S1NrN1hHNGdJQ0FnSUNCc1lYTjBRM1Z5YzI5eUlEMGdiR0Z6ZEVsdVpHVjRJRDBnYVc1a1pYZ2dLeUF4TzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUd4bGRDQndZWEowVGlBOUlIQmhjblJ6VzNCaGNuUnpMbXhsYm1kMGFDQXRJREZkTzF4dUlDQnBaaUFvY0dGeWRITXViR1Z1WjNSb0lEMDlQU0F3S1Z4dUlDQWdJSEpsZEhWeWJpQW9iR0Z6ZEZCaGNuUXBJRDhnV3lCa1pXWmhkV3gwVm1Gc2RXVXNJSEJoY25ST0lGMGdPaUJrWldaaGRXeDBWbUZzZFdVN1hHNWNiaUFnYkdWMElHTjFjbkpsYm5SV1lXeDFaU0E5SUc5aWFqdGNiaUFnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2NHRnlkSE11YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUd4bGRDQnJaWGtnUFNCd1lYSjBjMXRwWFR0Y2JseHVJQ0FnSUdOMWNuSmxiblJXWVd4MVpTQTlJR04xY25KbGJuUldZV3gxWlZ0clpYbGRPMXh1SUNBZ0lHbG1JQ2hqZFhKeVpXNTBWbUZzZFdVZ1BUMGdiblZzYkNsY2JpQWdJQ0FnSUhKbGRIVnliaUFvYkdGemRGQmhjblFwSUQ4Z1d5QmtaV1poZFd4MFZtRnNkV1VzSUhCaGNuUk9JRjBnT2lCa1pXWmhkV3gwVm1Gc2RXVTdYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdLR3hoYzNSUVlYSjBLU0EvSUZzZ1kzVnljbVZ1ZEZaaGJIVmxMQ0J3WVhKMFRpQmRJRG9nWTNWeWNtVnVkRlpoYkhWbE8xeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWW1sdVpFMWxkR2h2WkhNb1gzQnliM1J2TENCemEybHdVSEp2ZEc5ektTQjdYRzRnSUd4bGRDQndjbTkwYnlBZ0lDQWdJQ0FnSUNBZ1BTQmZjSEp2ZEc4N1hHNGdJR3hsZENCaGJISmxZV1I1Vm1semFYUmxaQ0FnUFNCdVpYY2dVMlYwS0NrN1hHNWNiaUFnZDJocGJHVWdLSEJ5YjNSdktTQjdYRzRnSUNBZ2JHVjBJR1JsYzJOeWFYQjBiM0p6SUQwZ1QySnFaV04wTG1kbGRFOTNibEJ5YjNCbGNuUjVSR1Z6WTNKcGNIUnZjbk1vY0hKdmRHOHBPMXh1SUNBZ0lHeGxkQ0JyWlhseklDQWdJQ0FnSUNBOUlFOWlhbVZqZEM1clpYbHpLR1JsYzJOeWFYQjBiM0p6S1M1amIyNWpZWFFvVDJKcVpXTjBMbWRsZEU5M2JsQnliM0JsY25SNVUzbHRZbTlzY3loa1pYTmpjbWx3ZEc5eWN5a3BPMXh1WEc0Z0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2EyVjVJRDBnYTJWNWMxdHBYVHRjYmlBZ0lDQWdJR2xtSUNoclpYa2dQVDA5SUNkamIyNXpkSEoxWTNSdmNpY3BYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdJQ0JwWmlBb1lXeHlaV0ZrZVZacGMybDBaV1F1YUdGektHdGxlU2twWEc0Z0lDQWdJQ0FnSUdOdmJuUnBiblZsTzF4dVhHNGdJQ0FnSUNCaGJISmxZV1I1Vm1semFYUmxaQzVoWkdRb2EyVjVLVHRjYmx4dUlDQWdJQ0FnYkdWMElIWmhiSFZsSUQwZ2NISnZkRzliYTJWNVhUdGNibHh1SUNBZ0lDQWdMeThnVTJ0cGNDQndjbTkwYjNSNWNHVWdiMllnVDJKcVpXTjBYRzRnSUNBZ0lDQXZMeUJsYzJ4cGJuUXRaR2x6WVdKc1pTMXVaWGgwTFd4cGJtVWdibTh0Y0hKdmRHOTBlWEJsTFdKMWFXeDBhVzV6WEc0Z0lDQWdJQ0JwWmlBb1QySnFaV04wTG5CeWIzUnZkSGx3WlM1b1lYTlBkMjVRY205d1pYSjBlU2hyWlhrcElDWW1JRTlpYW1WamRDNXdjbTkwYjNSNWNHVmJhMlY1WFNBOVBUMGdkbUZzZFdVcFhHNGdJQ0FnSUNBZ0lHTnZiblJwYm5WbE8xeHVYRzRnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JSFpoYkhWbElDRTlQU0FuWm5WdVkzUnBiMjRuS1Z4dUlDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUNBZ2RHaHBjMXRyWlhsZElEMGdkbUZzZFdVdVltbHVaQ2gwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCd2NtOTBieUE5SUU5aWFtVmpkQzVuWlhSUWNtOTBiM1I1Y0dWUFppaHdjbTkwYnlrN1hHNGdJQ0FnYVdZZ0tIQnliM1J2SUQwOVBTQlBZbXBsWTNRdWNISnZkRzkwZVhCbEtWeHVJQ0FnSUNBZ1luSmxZV3M3WEc1Y2JpQWdJQ0JwWmlBb2MydHBjRkJ5YjNSdmN5QW1KaUJ6YTJsd1VISnZkRzl6TG1sdVpHVjRUMllvY0hKdmRHOHBJRDQ5SURBcFhHNGdJQ0FnSUNCaWNtVmhhenRjYmlBZ2ZWeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnYVhORmJYQjBlU2gyWVd4MVpTa2dlMXh1SUNCcFppQW9kbUZzZFdVZ1BUMGdiblZzYkNsY2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JwWmlBb1QySnFaV04wTG1sektIWmhiSFZsTENCSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaFBZbXBsWTNRdWFYTW9kbUZzZFdVc0lFNWhUaWtwWEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdhV1lnS0dsdWMzUmhibU5sVDJZb2RtRnNkV1VzSUNkemRISnBibWNuS1NsY2JpQWdJQ0J5WlhSMWNtNGdJU2d2WEZ4VEx5a3VkR1Z6ZENoMllXeDFaU2s3WEc0Z0lHVnNjMlVnYVdZZ0tHbHVjM1JoYm1ObFQyWW9kbUZzZFdVc0lDZHVkVzFpWlhJbktTQW1KaUJwYzBacGJtbDBaU2gyWVd4MVpTa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNCbGJITmxJR2xtSUNnaGFXNXpkR0Z1WTJWUFppaDJZV3gxWlN3Z0oySnZiMnhsWVc0bkxDQW5ZbWxuYVc1MEp5d2dKMloxYm1OMGFXOXVKeWtnSmlZZ2MybDZaVTltS0haaGJIVmxLU0E5UFQwZ01DbGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzU5WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCcGMwNXZkRVZ0Y0hSNUtIWmhiSFZsS1NCN1hHNGdJSEpsZEhWeWJpQWhhWE5GYlhCMGVTNWpZV3hzS0hSb2FYTXNJSFpoYkhWbEtUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdac1lYUjBaVzVCY25KaGVTaDJZV3gxWlNrZ2UxeHVJQ0JwWmlBb0lVRnljbUY1TG1selFYSnlZWGtvZG1Gc2RXVXBLVnh1SUNBZ0lISmxkSFZ5YmlCMllXeDFaVHRjYmx4dUlDQnNaWFFnYm1WM1FYSnlZWGtnUFNCYlhUdGNiaUFnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2RtRnNkV1V1YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUd4bGRDQnBkR1Z0SUQwZ2RtRnNkV1ZiYVYwN1hHNGdJQ0FnYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvYVhSbGJTa3BYRzRnSUNBZ0lDQnVaWGRCY25KaGVTQTlJRzVsZDBGeWNtRjVMbU52Ym1OaGRDaG1iR0YwZEdWdVFYSnlZWGtvYVhSbGJTa3BPMXh1SUNBZ0lHVnNjMlZjYmlBZ0lDQWdJRzVsZDBGeWNtRjVMbkIxYzJnb2FYUmxiU2s3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnYm1WM1FYSnlZWGs3WEc1OVhHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnBjMVpoYkdsa1EyaHBiR1FvWTJocGJHUXBJSHRjYmlBZ2FXWWdLR05vYVd4a0lEMDlJRzUxYkd3cFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaDBlWEJsYjJZZ1kyaHBiR1FnUFQwOUlDZGliMjlzWldGdUp5bGNiaUFnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ2FXWWdLRTlpYW1WamRDNXBjeWhqYUdsc1pDd2dTVzVtYVc1cGRIa3BLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQnBaaUFvVDJKcVpXTjBMbWx6S0dOb2FXeGtMQ0JPWVU0cEtWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCeVpYUjFjbTRnZEhKMVpUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdselNYUmxjbUZpYkdWRGFHbHNaQ2hqYUdsc1pDa2dlMXh1SUNCcFppQW9ZMmhwYkdRZ1BUMGdiblZzYkNCOGZDQlBZbXBsWTNRdWFYTW9ZMmhwYkdRc0lFNWhUaWtnZkh3Z1QySnFaV04wTG1sektHTm9hV3hrTENCSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUhKbGRIVnliaUFvUVhKeVlYa3VhWE5CY25KaGVTaGphR2xzWkNrZ2ZId2dkSGx3Wlc5bUlHTm9hV3hrSUQwOVBTQW5iMkpxWldOMEp5QW1KaUFoYVc1emRHRnVZMlZQWmloamFHbHNaQ3dnSjJKdmIyeGxZVzRuTENBbmJuVnRZbVZ5Snl3Z0ozTjBjbWx1WnljcEtUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUc1dmR5Z3BJSHRjYmlBZ2FXWWdLSFI1Y0dWdlppQndaWEptYjNKdFlXNWpaU0FoUFQwZ0ozVnVaR1ZtYVc1bFpDY2dKaVlnZEhsd1pXOW1JSEJsY21admNtMWhibU5sTG01dmR5QTlQVDBnSjJaMWJtTjBhVzl1SnlsY2JpQWdJQ0J5WlhSMWNtNGdjR1Z5Wm05eWJXRnVZMlV1Ym05M0tDazdYRzRnSUdWc2MyVmNiaUFnSUNCeVpYUjFjbTRnUkdGMFpTNXViM2NvS1R0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR2RsYm1WeVlYUmxWVlZKUkNncElIdGNiaUFnYVdZZ0tIVjFhV1FnUGlBNU9UazVPVGs1S1Z4dUlDQWdJSFYxYVdRZ1BTQXhNREF3TURBd08xeHVYRzRnSUhKbGRIVnliaUJnSkh0RVlYUmxMbTV2ZHlncGZTNGtlM1YxYVdRckszMGtlMDFoZEdndWNtOTFibVFvVFdGMGFDNXlZVzVrYjIwb0tTQXFJREV3TURBd01EQXdLUzUwYjFOMGNtbHVaeWdwTG5CaFpGTjBZWEowS0RJd0xDQW5NQ2NwZldBN1hHNTlYRzRpTENJdkx5QlVhR1VnYlc5a2RXeGxJR05oWTJobFhHNTJZWElnWDE5M1pXSndZV05yWDIxdlpIVnNaVjlqWVdOb1pWOWZJRDBnZTMwN1hHNWNiaTh2SUZSb1pTQnlaWEYxYVhKbElHWjFibU4wYVc5dVhHNW1kVzVqZEdsdmJpQmZYM2RsWW5CaFkydGZjbVZ4ZFdseVpWOWZLRzF2WkhWc1pVbGtLU0I3WEc1Y2RDOHZJRU5vWldOcklHbG1JRzF2WkhWc1pTQnBjeUJwYmlCallXTm9aVnh1WEhSMllYSWdZMkZqYUdWa1RXOWtkV3hsSUQwZ1gxOTNaV0p3WVdOclgyMXZaSFZzWlY5allXTm9aVjlmVzIxdlpIVnNaVWxrWFR0Y2JseDBhV1lnS0dOaFkyaGxaRTF2WkhWc1pTQWhQVDBnZFc1a1pXWnBibVZrS1NCN1hHNWNkRngwY21WMGRYSnVJR05oWTJobFpFMXZaSFZzWlM1bGVIQnZjblJ6TzF4dVhIUjlYRzVjZEM4dklFTnlaV0YwWlNCaElHNWxkeUJ0YjJSMWJHVWdLR0Z1WkNCd2RYUWdhWFFnYVc1MGJ5QjBhR1VnWTJGamFHVXBYRzVjZEhaaGNpQnRiMlIxYkdVZ1BTQmZYM2RsWW5CaFkydGZiVzlrZFd4bFgyTmhZMmhsWDE5YmJXOWtkV3hsU1dSZElEMGdlMXh1WEhSY2RDOHZJRzV2SUcxdlpIVnNaUzVwWkNCdVpXVmtaV1JjYmx4MFhIUXZMeUJ1YnlCdGIyUjFiR1V1Ykc5aFpHVmtJRzVsWldSbFpGeHVYSFJjZEdWNGNHOXlkSE02SUh0OVhHNWNkSDA3WEc1Y2JseDBMeThnUlhobFkzVjBaU0IwYUdVZ2JXOWtkV3hsSUdaMWJtTjBhVzl1WEc1Y2RGOWZkMlZpY0dGamExOXRiMlIxYkdWelgxOWJiVzlrZFd4bFNXUmRMbU5oYkd3b2JXOWtkV3hsTG1WNGNHOXlkSE1zSUcxdlpIVnNaU3dnYlc5a2RXeGxMbVY0Y0c5eWRITXNJRjlmZDJWaWNHRmphMTl5WlhGMWFYSmxYMThwTzF4dVhHNWNkQzh2SUZKbGRIVnliaUIwYUdVZ1pYaHdiM0owY3lCdlppQjBhR1VnYlc5a2RXeGxYRzVjZEhKbGRIVnliaUJ0YjJSMWJHVXVaWGh3YjNKMGN6dGNibjFjYmx4dUlpd2lMeThnWkdWbWFXNWxJR2RsZEhSbGNpQm1kVzVqZEdsdmJuTWdabTl5SUdoaGNtMXZibmtnWlhod2IzSjBjMXh1WDE5M1pXSndZV05yWDNKbGNYVnBjbVZmWHk1a0lEMGdLR1Y0Y0c5eWRITXNJR1JsWm1sdWFYUnBiMjRwSUQwK0lIdGNibHgwWm05eUtIWmhjaUJyWlhrZ2FXNGdaR1ZtYVc1cGRHbHZiaWtnZTF4dVhIUmNkR2xtS0Y5ZmQyVmljR0ZqYTE5eVpYRjFhWEpsWDE4dWJ5aGtaV1pwYm1sMGFXOXVMQ0JyWlhrcElDWW1JQ0ZmWDNkbFluQmhZMnRmY21WeGRXbHlaVjlmTG04b1pYaHdiM0owY3l3Z2EyVjVLU2tnZTF4dVhIUmNkRngwVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtHVjRjRzl5ZEhNc0lHdGxlU3dnZXlCbGJuVnRaWEpoWW14bE9pQjBjblZsTENCblpYUTZJR1JsWm1sdWFYUnBiMjViYTJWNVhTQjlLVHRjYmx4MFhIUjlYRzVjZEgxY2JuMDdJaXdpWDE5M1pXSndZV05yWDNKbGNYVnBjbVZmWHk1bklEMGdLR1oxYm1OMGFXOXVLQ2tnZTF4dVhIUnBaaUFvZEhsd1pXOW1JR2RzYjJKaGJGUm9hWE1nUFQwOUlDZHZZbXBsWTNRbktTQnlaWFIxY200Z1oyeHZZbUZzVkdocGN6dGNibHgwZEhKNUlIdGNibHgwWEhSeVpYUjFjbTRnZEdocGN5QjhmQ0J1WlhjZ1JuVnVZM1JwYjI0b0ozSmxkSFZ5YmlCMGFHbHpKeWtvS1R0Y2JseDBmU0JqWVhSamFDQW9aU2tnZTF4dVhIUmNkR2xtSUNoMGVYQmxiMllnZDJsdVpHOTNJRDA5UFNBbmIySnFaV04wSnlrZ2NtVjBkWEp1SUhkcGJtUnZkenRjYmx4MGZWeHVmU2tvS1RzaUxDSmZYM2RsWW5CaFkydGZjbVZ4ZFdseVpWOWZMbThnUFNBb2IySnFMQ0J3Y205d0tTQTlQaUFvVDJKcVpXTjBMbkJ5YjNSdmRIbHdaUzVvWVhOUGQyNVFjbTl3WlhKMGVTNWpZV3hzS0c5aWFpd2djSEp2Y0NrcElpd2lMeThnWkdWbWFXNWxJRjlmWlhOTmIyUjFiR1VnYjI0Z1pYaHdiM0owYzF4dVgxOTNaV0p3WVdOclgzSmxjWFZwY21WZlh5NXlJRDBnS0dWNGNHOXlkSE1wSUQwK0lIdGNibHgwYVdZb2RIbHdaVzltSUZONWJXSnZiQ0FoUFQwZ0ozVnVaR1ZtYVc1bFpDY2dKaVlnVTNsdFltOXNMblJ2VTNSeWFXNW5WR0ZuS1NCN1hHNWNkRngwVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtHVjRjRzl5ZEhNc0lGTjViV0p2YkM1MGIxTjBjbWx1WjFSaFp5d2dleUIyWVd4MVpUb2dKMDF2WkhWc1pTY2dmU2s3WEc1Y2RIMWNibHgwVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtHVjRjRzl5ZEhNc0lDZGZYMlZ6VFc5a2RXeGxKeXdnZXlCMllXeDFaVG9nZEhKMVpTQjlLVHRjYm4wN0lpd2lhVzF3YjNKMElIdGNiaUFnU2tsQ1gwSkJVbEpGVGl4Y2JpQWdTa2xDWDFCU1QxaFpMRnh1SUNCS1NVSmZVa0ZYWDFSRldGUXNYRzRnSUVwSlFpeGNiaUFnU2tsQ1gwTklTVXhFWDBsT1JFVllYMUJTVDFBc1hHNGdJRXBwWWl4Y2JpQWdabUZqZEc5eWVTeGNiaUFnSkN4Y2JpQWdhWE5LYVdKcGMyZ3NYRzRnSUdOdmJuTjBjblZqZEVwcFlpeGNiaUFnY21WemIyeDJaVU5vYVd4a2NtVnVMRnh1ZlNCbWNtOXRJQ2N1TDJwcFlpNXFjeWM3WEc1Y2JtVjRjRzl5ZENCamIyNXpkQ0JLYVdKeklEMGdlMXh1SUNCS1NVSmZRa0ZTVWtWT0xGeHVJQ0JLU1VKZlVGSlBXRmtzWEc0Z0lFcEpRbDlTUVZkZlZFVllWQ3hjYmlBZ1NrbENMRnh1SUNCS1NVSmZRMGhKVEVSZlNVNUVSVmhmVUZKUFVDeGNiaUFnU21saUxGeHVJQ0JwYzBwcFltbHphQ3hjYmlBZ1kyOXVjM1J5ZFdOMFNtbGlMRnh1SUNCeVpYTnZiSFpsUTJocGJHUnlaVzRzWEc1OU8xeHVYRzVwYlhCdmNuUWdlMXh1SUNCVlVFUkJWRVZmUlZaRlRsUXNYRzRnSUZGVlJWVkZYMVZRUkVGVVJWOU5SVlJJVDBRc1hHNGdJRVpNVlZOSVgxVlFSRUZVUlY5TlJWUklUMFFzWEc0Z0lFbE9TVlJmVFVWVVNFOUVMRnh1SUNCVFMwbFFYMU5VUVZSRlgxVlFSRUZVUlZNc1hHNGdJRkJGVGtSSlRrZGZVMVJCVkVWZlZWQkVRVlJGTEZ4dUlDQk1RVk5VWDFKRlRrUkZVbDlVU1UxRkxGeHVJQ0JRVWtWV1NVOVZVMTlUVkVGVVJTeGNibHh1SUNCRGIyMXdiMjVsYm5Rc1hHNGdJRlJsY20wc1hHNTlJR1p5YjIwZ0p5NHZZMjl0Y0c5dVpXNTBMbXB6Snp0Y2JseHVaWGh3YjNKMElHTnZibk4wSUVOdmJYQnZibVZ1ZEhNZ1BTQjdYRzRnSUZWUVJFRlVSVjlGVmtWT1ZDeGNiaUFnVVZWRlZVVmZWVkJFUVZSRlgwMUZWRWhQUkN4Y2JpQWdSa3hWVTBoZlZWQkVRVlJGWDAxRlZFaFBSQ3hjYmlBZ1NVNUpWRjlOUlZSSVQwUXNYRzRnSUZOTFNWQmZVMVJCVkVWZlZWQkVRVlJGVXl4Y2JpQWdVRVZPUkVsT1IxOVRWRUZVUlY5VlVFUkJWRVVzWEc0Z0lFeEJVMVJmVWtWT1JFVlNYMVJKVFVVc1hHNGdJRkJTUlZaSlQxVlRYMU5VUVZSRkxGeHVmVHRjYmx4dWFXMXdiM0owSUh0Y2JpQWdSazlTUTBWZlVrVkdURTlYTEZ4dUlDQlNiMjkwVG05a1pTeGNiaUFnVW1WdVpHVnlaWElzWEc1OUlHWnliMjBnSnk0dmNtVnVaR1Z5WlhKekwybHVaR1Y0TG1wekp6dGNibHh1Wlhod2IzSjBJR052Ym5OMElGSmxibVJsY21WeWN5QTlJSHRjYmlBZ1EwOU9WRVZZVkY5SlJEb2dVbTl2ZEU1dlpHVXVRMDlPVkVWWVZGOUpSQ3hjYmlBZ1JrOVNRMFZmVWtWR1RFOVhMRnh1SUNCU2IyOTBUbTlrWlN4Y2JpQWdVbVZ1WkdWeVpYSXNYRzU5TzF4dVhHNWxlSEJ2Y25RZ0tpQmhjeUJWZEdsc2N5Qm1jbTl0SUNjdUwzVjBhV3h6TG1wekp6dGNibVY0Y0c5eWRDQjdJR1JsWm1GMWJIUWdZWE1nWkdWaFpHSmxaV1lnZlNCbWNtOXRJQ2RrWldGa1ltVmxaaWM3WEc1Y2JtVjRjRzl5ZENCN1hHNGdJR1poWTNSdmNua3NYRzRnSUNRc1hHNGdJRU52YlhCdmJtVnVkQ3hjYmlBZ1ZHVnliU3hjYm4wN1hHNGlYU3dpYm1GdFpYTWlPbHRkTENKemIzVnlZMlZTYjI5MElqb2lJbjA9IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJleHBvcnQgeyBET01SZW5kZXJlciB9IGZyb20gJy4vZG9tLXJlbmRlcmVyLmpzJztcbmV4cG9ydCAqIGZyb20gJ2ppYnMnO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9