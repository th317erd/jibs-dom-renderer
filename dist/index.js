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

      if (node.jib && node.jib.props && typeof node.jib.props.ref === 'function')
        node.jib.props.ref.call(node, nativeElement, null);

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUtjOztBQUVkO0FBQ0E7QUFDQTtBQUNBLEVBQUUsRUFBRSxzQ0FBSTs7QUFFUjtBQUNBO0FBQ0E7QUFDQSxFQUFFLEVBQUUsMkNBQVM7O0FBRWI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRSxFQUFFLDRDQUFVOztBQUVQO0FBQ1A7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEIsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLGlFQUFpRTtBQUNqRTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNkNBQTZDLFFBQVE7QUFDckQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSwyQ0FBMkM7O0FBRTNDO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMkNBQTJDOztBQUUzQztBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDOztBQUUzQztBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDJDQUEyQztBQUMzQztBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxVQUFVLHdDQUF3QyxpQkFBaUI7QUFDbkU7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSx5Q0FBeUMsMkNBQVM7O0FBRWxEO0FBQ0EsMEJBQTBCLDBCQUEwQjs7QUFFcEQ7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSwyQ0FBMkMsMkNBQVM7O0FBRXBEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLGNBQWMsSUFBSSxZQUFZO0FBQzVELFFBQVE7QUFDUiw0QkFBNEIsY0FBYyxJQUFJLFlBQVk7QUFDMUQ7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMERBQTBELGtCQUFrQixxRkFBcUY7QUFDaks7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsVUFBVSxrREFBZ0I7QUFDMUI7QUFDQTs7QUFFQTtBQUNBOztBQUVBLGNBQWMsa0RBQWdCO0FBQzlCOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNuVmM7O0FBRXdDO0FBQ0o7QUFDRTtBQUNBO0FBQ0c7O0FBRXZEO0FBQ0E7QUFDQSxFQUFFLEVBQUUsMkNBQVM7O0FBRWI7QUFDQTtBQUNBO0FBQ0EsRUFBRSxFQUFFLHNDQUFJOztBQUVSOztBQUVPO0FBQ1A7QUFDQTs7QUFFQSx3QkFBd0IsMkRBQVk7O0FBRXBDLG9CQUFvQixtREFBUTs7QUFFNUIsc0JBQXNCLHVEQUFVOztBQUVoQyxzQkFBc0IsdURBQVU7O0FBRWhDLHlCQUF5Qiw2REFBYTs7QUFFdEM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0Isb0NBQW9DLGdCQUFnQjtBQUM1RSxPQUFPO0FBQ1AsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFVBQVUsT0FBTztBQUNqQjtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNkJBQTZCLHNCQUFzQjs7QUFFbkQ7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esd0JBQXdCLDBCQUEwQjs7QUFFbEQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHNCQUFzQiw0REFBZTtBQUNyQztBQUNBLDJCQUEyQix3REFBYTtBQUN4QztBQUNBLDJCQUEyQiw0REFBZTtBQUMxQztBQUNBO0FBQ0EsNkJBQTZCLHNCQUFzQiwrRUFBK0UsVUFBVTtBQUM1STs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsc0JBQXNCLDREQUFlO0FBQ3JDO0FBQ0EsMkJBQTJCLHdEQUFhO0FBQ3hDO0FBQ0EsMkJBQTJCLDREQUFlO0FBQzFDO0FBQ0E7QUFDQSw2QkFBNkIsc0JBQXNCLHlEQUF5RCxVQUFVOztBQUV0SDs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLHdCQUF3Qiw0REFBZTtBQUN2QztBQUNBLDZCQUE2Qix3REFBYTtBQUMxQztBQUNBLDZCQUE2Qiw0REFBZTtBQUM1QztBQUNBO0FBQ0EseUJBQXlCLHNCQUFzQix5REFBeUQsVUFBVTtBQUNsSDs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLGFBQWE7QUFDYjs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsYUFBYTtBQUNiOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGFBQWE7QUFDYjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDOVRjOztBQUVkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUUsRUFBRSxzQ0FBSTs7QUFFUjtBQUNBO0FBQ0EsRUFBRSxFQUFFLDJDQUFTOztBQUVOO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLFVBQVUsV0FBVyxpQkFBaUI7QUFDdEMsUUFBUSxrREFBZ0I7QUFDeEI7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsbUJBQW1CLCtDQUFhLGNBQWMsaUNBQWlDO0FBQy9FO0FBQ0E7O0FBRUE7QUFDQSxxQkFBcUIsa0RBQWdCO0FBQ3JDLFlBQVksK0NBQWE7QUFDekI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2Q0FBNkMsMkJBQTJCO0FBQ3hFLGFBQWE7QUFDYjtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUNBQXlDLDhCQUE4QjtBQUN2RSxhQUFhO0FBQ2I7QUFDQSxVQUFVO0FBQ1Y7QUFDQSxjQUFjLGtEQUFnQjtBQUM5QjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLGNBQWMsY0FBYztBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtIQUErSCxzQkFBc0I7O0FBRXJKO0FBQ0E7QUFDQTs7QUFFQSx1QkFBdUIsOENBQVE7QUFDL0I7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxpQkFBaUI7QUFDakIsT0FBTztBQUNQLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsaURBQWlELFFBQVE7QUFDekQ7QUFDQSxjQUFjLGdCQUFnQjs7QUFFOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxpQkFBaUI7O0FBRTdCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLG1EQUFtRCxRQUFRO0FBQzNEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDL01jOztBQUVkO0FBQ0E7QUFDQSxFQUFFLEVBQUUsc0NBQUk7O0FBRVI7QUFDQTtBQUNBLEVBQUUsRUFBRSwyQ0FBUzs7QUFFTjtBQUNQOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTSxpQkFBaUI7O0FBRXZCO0FBQ0E7O0FBRUE7QUFDQSwwQkFBMEIsMEJBQTBCO0FBQ3BEOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBOztBQUVBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDOUU4Qzs7QUFFdkMseUJBQXlCLHVEQUFVO0FBQzFDO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7OztBQ0hjOztBQUVkO0FBQ0E7QUFDQSxFQUFFLEVBQUUsMkNBQVM7O0FBRU47QUFDUDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDYkE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrREFBa0QsOEJBQW1COztBQUVyRTs7OztBQUlBLCtEQUErRCw4QkFBbUI7QUFDbEY7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLHlDQUF5QyxRQUFRO0FBQ2pELFVBQVUsb0JBQW9CO0FBQzlCO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EscUJBQXFCLGVBQWU7O0FBRXBDO0FBQ0E7QUFDQSxtQ0FBbUMsSUFBSSxlQUFlLElBQUk7O0FBRTFEO0FBQ0E7O0FBRUEsY0FBYyxPQUFPLEdBQUcsSUFBSTtBQUM1Qjs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGlCQUFpQixXQUFXLEdBQUcsY0FBYztBQUM3QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUNBQXlDLFFBQVE7QUFDakQ7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EseUNBQXlDLFFBQVE7QUFDakQ7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLG1CQUFtQixtQkFBbUI7QUFDdEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0gsQ0FBQzs7QUFFRDs7O0FBR0EsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtFQUFrRSwrQkFBbUI7O0FBRXJGLCtCQUFtQjtBQUNuQixxQkFBcUIsK0JBQW1CO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEIsaUVBQWlFLCtCQUFtQjtBQUNwRixtRUFBbUUsK0JBQW1CO0FBQ3RGLGtFQUFrRSwrQkFBbUI7QUFDckYsZ0VBQWdFLCtCQUFtQjtBQUNuRjs7Ozs7OztBQU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsU0FBUztBQUNULE9BQU87QUFDUDs7QUFFQSx3RUFBd0U7QUFDeEU7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QjtBQUN4QixPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxvRUFBb0UsTUFBTTs7QUFFMUU7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULE9BQU87QUFDUDs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSx3Q0FBd0MsUUFBUTtBQUNoRDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsaUVBQWlFLE1BQU07O0FBRXZFO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHdFQUF3RSxNQUFNOztBQUU5RTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxzQ0FBc0MsUUFBUTtBQUM5QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLDRDQUE0QyxRQUFRO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLFNBQVM7O0FBRVQsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0EsMENBQTBDLFFBQVE7QUFDbEQ7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOENBQThDLFFBQVE7QUFDdEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7O0FBRUE7QUFD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LDhCQUE4QjtBQUM5QixPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULDhCQUE4QjtBQUM5QixPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFVBQVUsY0FBYyxpQkFBaUI7QUFDekM7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxNQUFNO0FBQ047QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBLE9BQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrRUFBa0UsZ0NBQW1COztBQUVyRixnQ0FBbUI7QUFDbkIscUJBQXFCLGdDQUFtQjtBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCLGlFQUFpRSxnQ0FBbUI7QUFDcEY7OztBQUdBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSwwQ0FBMEMsU0FBUztBQUNuRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSxxQ0FBcUMsUUFBUTtBQUM3QztBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0Esb0JBQW9CO0FBQ3BCOztBQUVBO0FBQ0E7O0FBRUEscUNBQXFDLFFBQVE7QUFDN0M7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxNQUFNO0FBQ047O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSxzQ0FBc0MsUUFBUTtBQUM5QztBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNILENBQUM7O0FBRUQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxxQ0FBcUMsUUFBUTtBQUM3Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsc0NBQXND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L2NvbXBvbmVudC1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL2RvbS1yZW5kZXJlci5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9mcmFnbWVudC1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL25hdGl2ZS1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL3BvcnRhbC1ub2RlLmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyLy4vbGliL3RleHQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uLi9qaWJzL2Rpc3QvaW5kZXguanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBKaWJzLFxuICBDb21wb25lbnRzLFxuICBSZW5kZXJlcnMsXG4gIFV0aWxzLFxufSBmcm9tICdqaWJzJztcblxuY29uc3Qge1xuICBKSUJfUFJPWFksXG4gIEpJQl9DSElMRF9JTkRFWF9QUk9QLFxufSA9IEppYnM7XG5cbmNvbnN0IHtcbiAgQ09OVEVYVF9JRCxcbiAgUm9vdE5vZGUsXG59ID0gUmVuZGVyZXJzO1xuXG5jb25zdCB7XG4gIElOSVRfTUVUSE9ELFxuICBVUERBVEVfRVZFTlQsXG4gIFBFTkRJTkdfU1RBVEVfVVBEQVRFLFxuICBMQVNUX1JFTkRFUl9USU1FLFxuICBTS0lQX1NUQVRFX1VQREFURVMsXG59ID0gQ29tcG9uZW50cztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudE5vZGUgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gMjA7XG5cbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHN1cGVyKC4uLmFyZ3MpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ2ZyYWdtZW50Tm9kZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAnY29tcG9uZW50Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdwZW5kaW5nQ29udGV4dFVwZGF0ZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAncHJldmlvdXNTdGF0ZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9LFxuICAgICAgJ2xhc3RDb250ZXh0SUQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgICAgICB2YWx1ZTogICAgICAgIHRoaXMuY29udGV4dFtDT05URVhUX0lEXSB8fCAxbixcbiAgICAgIH0sXG4gICAgICAnY2FjaGVkUmVuZGVyUmVzdWx0Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIGlmICghdGhpcy5mcmFnbWVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gdGhpcy5mcmFnbWVudE5vZGUuZ2V0Q2hpbGRyZW5Ob2RlcygpO1xuICB9XG5cbiAgbWVyZ2VDb21wb25lbnRQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMpIHtcbiAgICBsZXQgcHJvcHMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIG9sZFByb3BzIHx8IHt9LCBuZXdQcm9wcyk7XG4gICAgcmV0dXJuIHByb3BzO1xuICB9XG5cbiAgZmlyZVByb3BVcGRhdGVzKF9vbGRQcm9wcywgX25ld1Byb3BzKSB7XG4gICAgbGV0IG5ld1Byb3BzICAgID0gX25ld1Byb3BzIHx8IHt9O1xuICAgIGxldCBhbGxQcm9wS2V5cyA9IG5ldyBTZXQoT2JqZWN0LmtleXMobmV3UHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG5ld1Byb3BzKSkpO1xuXG4gICAgbGV0IG9sZFByb3BzICAgID0gX29sZFByb3BzIHx8IHt9O1xuICAgIGxldCBvbGRQcm9wS2V5cyA9IE9iamVjdC5rZXlzKG9sZFByb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvbGRQcm9wcykpO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IG9sZFByb3BLZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspXG4gICAgICBhbGxQcm9wS2V5cy5hZGQob2xkUHJvcEtleXNbaV0pO1xuXG4gICAgZm9yIChsZXQga2V5IG9mIGFsbFByb3BLZXlzKSB7XG4gICAgICBsZXQgb2xkVmFsdWUgID0gb2xkUHJvcHNba2V5XTtcbiAgICAgIGxldCBuZXdWYWx1ZSAgPSBuZXdQcm9wc1trZXldO1xuXG4gICAgICBpZiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKVxuICAgICAgICB0aGlzLmNvbXBvbmVudC5vblByb3BVcGRhdGVkKGtleSwgbmV3VmFsdWUsIG9sZFZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBzaG91bGRSZW5kZXIobmV3UHJvcHMsIG5ld0NoaWxkcmVuKSB7XG4gICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50O1xuICAgIGlmICghY29tcG9uZW50KVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodGhpcy5sYXN0Q29udGV4dElEIDwgdGhpcy5jb250ZXh0W0NPTlRFWFRfSURdKSB7XG4gICAgICB0aGlzLmxhc3RDb250ZXh0SUQgPSB0aGlzLmNvbnRleHRbQ09OVEVYVF9JRF07XG4gICAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuY2hpbGRyZW5EaWZmZXIoY29tcG9uZW50LmNoaWxkcmVuLCBuZXdDaGlsZHJlbikpIHtcbiAgICAgIHRoaXMuY29tcG9uZW50LmNoaWxkcmVuID0gbmV3Q2hpbGRyZW4uc2xpY2UoKTtcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbXBvbmVudC5zdGF0ZSk7XG5cbiAgICAgIHRoaXMuZmlyZVByb3BVcGRhdGVzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuICAgICAgY29tcG9uZW50LnByb3BzID0gdGhpcy5tZXJnZUNvbXBvbmVudFByb3BzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNTdGF0ZSA9IHRoaXMucHJldmlvdXNTdGF0ZSB8fCB7fTtcbiAgICBsZXQgcHJvcHNEaWZmZXIgICA9IHRoaXMucHJvcHNEaWZmZXIoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcywgWyAncmVmJywgJ2tleScsIEpJQl9DSElMRF9JTkRFWF9QUk9QIF0sIHRydWUpO1xuICAgIGlmIChwcm9wc0RpZmZlciAmJiBjb21wb25lbnQuc2hvdWxkVXBkYXRlKG5ld1Byb3BzLCBwcmV2aW91c1N0YXRlKSkge1xuICAgICAgdGhpcy5wcmV2aW91c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgY29tcG9uZW50LnN0YXRlKTtcblxuICAgICAgdGhpcy5maXJlUHJvcFVwZGF0ZXMoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcyk7XG4gICAgICBjb21wb25lbnQucHJvcHMgPSB0aGlzLm1lcmdlQ29tcG9uZW50UHJvcHMoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcyk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGxldCBzdGF0ZURpZmZlcnMgPSB0aGlzLnByb3BzRGlmZmVyKHByZXZpb3VzU3RhdGUsIGNvbXBvbmVudC5zdGF0ZSk7XG4gICAgaWYgKHN0YXRlRGlmZmVycyAmJiBjb21wb25lbnQuc2hvdWxkVXBkYXRlKG5ld1Byb3BzLCBwcmV2aW91c1N0YXRlKSkge1xuICAgICAgdGhpcy5wcmV2aW91c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgY29tcG9uZW50LnN0YXRlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5jb21wb25lbnQpIHtcbiAgICAgIGlmICh0aGlzLmppYiAmJiB0aGlzLmppYi5wcm9wcyAmJiB0eXBlb2YgdGhpcy5qaWIucHJvcHMucmVmID09PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aGlzLmppYi5wcm9wcy5yZWYuY2FsbCh0aGlzLmNvbXBvbmVudCwgbnVsbCwgdGhpcy5jb21wb25lbnQpO1xuXG4gICAgICBhd2FpdCB0aGlzLmNvbXBvbmVudC5kZXN0cm95KCk7XG4gICAgICB0aGlzLmNvbXBvbmVudCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZnJhZ21lbnROb2RlKSB7XG4gICAgICB0aGlzLnJlbW92ZUNoaWxkKHRoaXMuZnJhZ21lbnROb2RlKTtcblxuICAgICAgYXdhaXQgdGhpcy5mcmFnbWVudE5vZGUuZGVzdHJveSgpO1xuICAgICAgdGhpcy5mcmFnbWVudE5vZGUgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuY2FjaGVkUmVuZGVyUmVzdWx0ID0gbnVsbDtcbiAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBudWxsO1xuXG4gICAgcmV0dXJuIGF3YWl0IHN1cGVyLmRlc3Ryb3kodHJ1ZSk7XG4gIH1cblxuICBvbkNvbnRleHRVcGRhdGUoKSB7XG4gICAgaWYgKCF0aGlzLmNvbXBvbmVudCB8fCB0aGlzLmNvbXBvbmVudFtQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAodGhpcy5wZW5kaW5nQ29udGV4dFVwZGF0ZSlcbiAgICAgIHJldHVybiB0aGlzLnBlbmRpbmdDb250ZXh0VXBkYXRlO1xuXG4gICAgdGhpcy5wZW5kaW5nQ29udGV4dFVwZGF0ZSA9IFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCAhdGhpcy5jb21wb25lbnQgfHwgdGhpcy5jb21wb25lbnRbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIHRoaXMucGVuZGluZ0NvbnRleHRVcGRhdGUgPSBudWxsO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLnBlbmRpbmdDb250ZXh0VXBkYXRlO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIGFzeW5jIF9yZW5kZXIoZm9yY2VSZW5kZXIpIHtcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgbGV0IHsgVHlwZTogQ29tcG9uZW50Q2xhc3MsIHByb3BzLCBjaGlsZHJlbiB9ID0gKHRoaXMuamliIHx8IHt9KTtcbiAgICBpZiAoIUNvbXBvbmVudENsYXNzKVxuICAgICAgcmV0dXJuO1xuXG4gICAgY2hpbGRyZW4gPSB0aGlzLmppYi5jaGlsZHJlbiA9IGF3YWl0IHRoaXMucmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKTtcblxuICAgIGNvbnN0IGZpbmFsaXplUmVuZGVyID0gYXN5bmMgKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lIHx8ICF0aGlzLmNvbXBvbmVudClcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLmNhY2hlZFJlbmRlclJlc3VsdCA9IHJlbmRlclJlc3VsdDtcbiAgICAgIHRoaXMuY29tcG9uZW50W0xBU1RfUkVOREVSX1RJTUVdID0gVXRpbHMubm93KCk7XG5cbiAgICAgIGxldCBmcmFnbWVudE5vZGUgPSB0aGlzLmZyYWdtZW50Tm9kZTtcbiAgICAgIGxldCBmcmFnbWVudEppYiA9IHsgVHlwZTogSklCX1BST1hZLCBwcm9wczoge30sIGNoaWxkcmVuOiByZW5kZXJSZXN1bHQgfTtcblxuICAgICAgaWYgKCFmcmFnbWVudE5vZGUpIHtcbiAgICAgICAgZnJhZ21lbnROb2RlID0gdGhpcy5mcmFnbWVudE5vZGUgPSB0aGlzLnJlbmRlcmVyLmNvbnN0cnVjdE5vZGVGcm9tSmliKGZyYWdtZW50SmliLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKGZyYWdtZW50Tm9kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcmFnbWVudE5vZGUudXBkYXRlSmliKGZyYWdtZW50SmliKTtcbiAgICAgIH1cblxuICAgICAgYXdhaXQgZnJhZ21lbnROb2RlLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICBjb25zdCBoYW5kbGVSZW5kZXJFcnJvciA9IChlcnJvcikgPT4ge1xuICAgICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG5cbiAgICAgIGlmICh0aGlzLmNvbXBvbmVudClcbiAgICAgICAgdGhpcy5jb21wb25lbnRbTEFTVF9SRU5ERVJfVElNRV0gPSBVdGlscy5ub3coKTtcblxuICAgICAgbGV0IHJlbmRlclJlc3VsdDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuY29tcG9uZW50ICYmIHR5cGVvZiB0aGlzLmNvbXBvbmVudC5yZW5kZXJFcnJvclN0YXRlID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgIHJlbmRlclJlc3VsdCA9IHRoaXMuY29tcG9uZW50LnJlbmRlckVycm9yU3RhdGUoZXJyb3IpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVuZGVyUmVzdWx0ID0gWyBgJHtlcnJvci5tZXNzYWdlfVxcbiR7ZXJyb3Iuc3RhY2t9YCBdO1xuICAgICAgfSBjYXRjaCAoZXJyb3IyKSB7XG4gICAgICAgIHJlbmRlclJlc3VsdCA9IFsgYCR7ZXJyb3IubWVzc2FnZX1cXG4ke2Vycm9yLnN0YWNrfWAgXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpbmFsaXplUmVuZGVyKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoZm9yY2VSZW5kZXIgIT09IHRydWUgJiYgdGhpcy5jb21wb25lbnQgJiYgIXRoaXMuc2hvdWxkUmVuZGVyKHByb3BzLCBjaGlsZHJlbikpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgbGV0IGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50O1xuICAgICAgaWYgKCFjb21wb25lbnQpIHtcbiAgICAgICAgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnQgPSBuZXcgQ29tcG9uZW50Q2xhc3MoeyAuLi4odGhpcy5qaWIgfHwge30pLCBwcm9wczogdGhpcy5tZXJnZUNvbXBvbmVudFByb3BzKG51bGwsIHByb3BzKSwgY29udGV4dDogdGhpcy5jb250ZXh0LCBpZDogdGhpcy5pZCB9KTtcbiAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRbSU5JVF9NRVRIT0RdID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgIGNvbXBvbmVudFtJTklUX01FVEhPRF0oKTtcblxuICAgICAgICBjb21wb25lbnQub24oVVBEQVRFX0VWRU5ULCAocHVzaGVkUmVuZGVyUmVzdWx0KSA9PiB7XG4gICAgICAgICAgaWYgKHB1c2hlZFJlbmRlclJlc3VsdCkge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXJGcmFtZSsrO1xuICAgICAgICAgICAgZmluYWxpemVSZW5kZXIocHVzaGVkUmVuZGVyUmVzdWx0LCB0aGlzLnJlbmRlckZyYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZW5kZXIodHJ1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocHJvcHMgJiYgdHlwZW9mIHByb3BzLnJlZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBwcm9wcy5yZWYuY2FsbChjb21wb25lbnQsIGNvbXBvbmVudCwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhbmNlbCBhbnkgcGVuZGluZyBzdGF0ZSB1cGRhdGVzXG4gICAgICBpZiAodGhpcy5jb21wb25lbnRbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgICB0aGlzLmNvbXBvbmVudFtQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBudWxsO1xuXG4gICAgICBsZXQgcmVuZGVyUmVzdWx0ID0gdGhpcy5jb21wb25lbnQucmVuZGVyKGNoaWxkcmVuKTtcbiAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKHJlbmRlclJlc3VsdCwgJ3Byb21pc2UnKSkge1xuICAgICAgICBsZXQgd2FpdGluZ1JlbmRlclJlc3VsdCA9IHRoaXMuY29tcG9uZW50LnJlbmRlcldhaXRpbmcodGhpcy5jYWNoZWRSZW5kZXJSZXN1bHQpO1xuICAgICAgICBsZXQgcmVuZGVyQ29tcGxldGVkID0gZmFsc2U7XG5cbiAgICAgICAgbGV0IGxvYWRpbmdUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGxvYWRpbmdUaW1lciA9IG51bGw7XG5cbiAgICAgICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZih3YWl0aW5nUmVuZGVyUmVzdWx0LCAncHJvbWlzZScpKVxuICAgICAgICAgICAgd2FpdGluZ1JlbmRlclJlc3VsdCA9IGF3YWl0IHdhaXRpbmdSZW5kZXJSZXN1bHQ7XG5cbiAgICAgICAgICBpZiAocmVuZGVyQ29tcGxldGVkKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgYXdhaXQgZmluYWxpemVSZW5kZXIod2FpdGluZ1JlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICAgICAgICB9LCA1KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJlbmRlclJlc3VsdCA9IGF3YWl0IHJlbmRlclJlc3VsdDtcbiAgICAgICAgICByZW5kZXJDb21wbGV0ZWQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKGxvYWRpbmdUaW1lcikge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGxvYWRpbmdUaW1lcik7XG4gICAgICAgICAgICBsb2FkaW5nVGltZXIgPSBudWxsO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGF3YWl0IGZpbmFsaXplUmVuZGVyKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGF3YWl0IGhhbmRsZVJlbmRlckVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgZmluYWxpemVSZW5kZXIocmVuZGVyUmVzdWx0LCByZW5kZXJGcmFtZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGF3YWl0IGhhbmRsZVJlbmRlckVycm9yKGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBkZXN0cm95RnJvbURPTShfY29udGV4dCwgX25vZGUpIHtcbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0ID0gX2NvbnRleHQ7XG4gICAgbGV0IG5vZGUgPSBfbm9kZTtcbiAgICBpZiAobm9kZSA9PT0gdGhpcykge1xuICAgICAgY29udGV4dCA9IHRoaXMucGFyZW50Tm9kZS5jb250ZXh0O1xuICAgICAgbm9kZSA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJlbnROb2RlLmRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpO1xuICB9XG5cbiAgYXN5bmMgc3luY0RPTShfY29udGV4dCwgX25vZGUpIHtcbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIGxldCBjb250ZXh0ID0gX2NvbnRleHQ7XG4gICAgbGV0IG5vZGUgPSBfbm9kZTtcbiAgICBpZiAobm9kZSA9PT0gdGhpcykge1xuICAgICAgY29udGV4dCA9IHRoaXMucGFyZW50Tm9kZS5jb250ZXh0O1xuICAgICAgbm9kZSA9IHRoaXMucGFyZW50Tm9kZTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJlbnROb2RlLnN5bmNET00oY29udGV4dCwgbm9kZSk7XG4gIH1cbn1cbiIsImltcG9ydCB7XG4gIEppYnMsXG4gIFJlbmRlcmVycyxcbn0gZnJvbSAnamlicyc7XG5cbmltcG9ydCB7IEZyYWdtZW50Tm9kZSB9ICAgICBmcm9tICcuL2ZyYWdtZW50LW5vZGUuanMnO1xuaW1wb3J0IHsgVGV4dE5vZGUgfSAgICAgICAgIGZyb20gJy4vdGV4dC1ub2RlLmpzJztcbmltcG9ydCB7IE5hdGl2ZU5vZGUgfSAgICAgICBmcm9tICcuL25hdGl2ZS1ub2RlLmpzJztcbmltcG9ydCB7IFBvcnRhbE5vZGUgfSAgICAgICBmcm9tICcuL3BvcnRhbC1ub2RlLmpzJztcbmltcG9ydCB7IENvbXBvbmVudE5vZGUgfSAgICBmcm9tICcuL2NvbXBvbmVudC1ub2RlLmpzJztcblxuY29uc3Qge1xuICBSZW5kZXJlcixcbn0gPSBSZW5kZXJlcnM7XG5cbmNvbnN0IHtcbiAgSklCX1BST1hZLFxuICBKSUJfUkFXX1RFWFQsXG59ID0gSmlicztcblxuY29uc3QgU0tJUF9VUERBVEVTID0gdHJ1ZTtcblxuZXhwb3J0IGNsYXNzIERPTVJlbmRlcmVyIGV4dGVuZHMgUmVuZGVyZXIge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDk7XG5cbiAgc3RhdGljIEZyYWdtZW50Tm9kZSA9IEZyYWdtZW50Tm9kZTtcblxuICBzdGF0aWMgVGV4dE5vZGUgPSBUZXh0Tm9kZTtcblxuICBzdGF0aWMgTmF0aXZlTm9kZSA9IE5hdGl2ZU5vZGU7XG5cbiAgc3RhdGljIFBvcnRhbE5vZGUgPSBQb3J0YWxOb2RlO1xuXG4gIHN0YXRpYyBDb21wb25lbnROb2RlID0gQ29tcG9uZW50Tm9kZTtcblxuICBjb25zdHJ1Y3Rvcihyb290RWxlbWVudFNlbGVjdG9yLCBvcHRpb25zKSB7XG4gICAgc3VwZXIob3B0aW9ucyk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAncm9vdE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ2ppYic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgeyBUeXBlOiByb290RWxlbWVudFNlbGVjdG9yLCBwcm9wczoge30sIGNoaWxkcmVuOiBbXSB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGlzUG9ydGFsTm9kZSh0eXBlKSB7XG4gICAgcmV0dXJuICgvW15hLXpBLVowLTk6XS8pLnRlc3QodHlwZSk7XG4gIH1cblxuICBjb25zdHJ1Y3ROb2RlRnJvbUppYihqaWIsIHBhcmVudCwgY29udGV4dCkge1xuICAgIGxldCB7IFR5cGUgfSA9IGppYjtcbiAgICBpZiAodHlwZW9mIFR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5Db21wb25lbnROb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBUeXBlID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKHRoaXMuaXNQb3J0YWxOb2RlKFR5cGUpKVxuICAgICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuUG9ydGFsTm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQsIGppYik7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5OYXRpdmVOb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9IGVsc2UgaWYgKFR5cGUgPT0gbnVsbCB8fCBUeXBlID09PSBKSUJfUFJPWFkpIHtcbiAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5GcmFnbWVudE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0LCBqaWIpO1xuICAgIH0gZWxzZSBpZiAoVHlwZSA9PT0gSklCX1JBV19URVhUKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuVGV4dE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0LCBqaWIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZGVzdHJveWluZyA9IHRydWU7XG5cbiAgICBpZiAodGhpcy5yb290Tm9kZSkge1xuICAgICAgYXdhaXQgdGhpcy5yb290Tm9kZS5kZXN0cm95KCk7XG4gICAgICB0aGlzLnJvb3ROb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgc3VwZXIuZGVzdHJveSh0cnVlKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlcihjaGlsZHJlbikge1xuICAgIGlmICghY2hpbGRyZW4pXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OnJlbmRlcjogQSBqaWIgbXVzdCBiZSBwcm92aWRlZC5gKTtcblxuICAgIHRoaXMudXBkYXRlSmliKHtcbiAgICAgIC4uLnRoaXMuamliLFxuICAgICAgY2hpbGRyZW4sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3VwZXIucmVuZGVyKCk7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuICAgIGxldCByb290Tm9kZSA9IHRoaXMucm9vdE5vZGU7XG4gICAgbGV0IGZyYWdtZW50SmliID0geyBUeXBlOiBKSUJfUFJPWFksIHByb3BzOiB7fSwgY2hpbGRyZW46IHRoaXMuamliIH07XG5cbiAgICBpZiAoIXJvb3ROb2RlKVxuICAgICAgcm9vdE5vZGUgPSB0aGlzLnJvb3ROb2RlID0gdGhpcy5jb25zdHJ1Y3ROb2RlRnJvbUppYih0aGlzLmppYiwgdGhpcywgdGhpcy5jb250ZXh0KTtcbiAgICBlbHNlXG4gICAgICByb290Tm9kZS51cGRhdGVKaWIoZnJhZ21lbnRKaWIpO1xuXG4gICAgYXdhaXQgcm9vdE5vZGUucmVuZGVyKCk7XG4gICAgaWYgKHJlbmRlckZyYW1lID49IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzLnJvb3ROb2RlKTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAobm9kZSA9PT0gdGhpcykge1xuICAgICAgaWYgKCF0aGlzLnJvb3ROb2RlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmRlc3Ryb3lOb2RlKGNvbnRleHQsIHRoaXMucm9vdE5vZGUpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmRlc3Ryb3lOb2RlKGNvbnRleHQsIG5vZGUpO1xuICB9XG5cbiAgYXN5bmMgc3luY0RPTShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG5vZGUgPT09IHRoaXMpIHtcbiAgICAgIGlmICghdGhpcy5yb290Tm9kZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5zeW5jTm9kZShjb250ZXh0LCB0aGlzLnJvb3ROb2RlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5zeW5jTm9kZShjb250ZXh0LCBub2RlKTtcbiAgfVxuXG4gIGFzeW5jIGFkZE5vZGUoY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGF3YWl0IHRoaXMuYXR0YWNoQ2hpbGRyZW4oY29udGV4dCwgbm9kZSwgZmFsc2UpO1xuXG4gICAgLy8gVGVsbCBvdXIgcGFyZW50IHRvIHJlb3JkZXIgaXRzZWxmXG4gICAgbGV0IHBhcmVudE5vZGUgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgaWYgKHBhcmVudE5vZGUpIHtcbiAgICAgIC8vIFNraXAgdXBkYXRlcywgYXMgd2UgYXJlbid0IG1vZGlmeWluZyBvdGhlciBjaGlsZHJlbi5cbiAgICAgIC8vIEp1c3QgZW5zdXJlIHByb3BlciBjaGlsZCBvcmRlci5cbiAgICAgIGF3YWl0IHRoaXMuYXR0YWNoQ2hpbGRyZW4oY29udGV4dCwgcGFyZW50Tm9kZSwgU0tJUF9VUERBVEVTKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGNvbnN0cnVjdE5hdGl2ZUVsZW1lbnRGcm9tTm9kZShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG5vZGUuVFlQRSA9PT0gTmF0aXZlTm9kZS5UWVBFKVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFRleHROb2RlLlRZUEUpXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVUZXh0RWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFBvcnRhbE5vZGUuVFlQRSB8fCBub2RlLlRZUEUgPT09IERPTVJlbmRlcmVyLlRZUEUpXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5jcmVhdGVQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTo6Y29uc3RydWN0TmF0aXZlRWxlbWVudEZyb21Ob2RlOiBVbnN1cHBvcnRlZCB2aXJ0dWFsIGVsZW1lbnQgdHlwZSBkZXRlY3RlZDogJHtub2RlLlRZUEV9YCk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVOb2RlKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgcmVzdWx0O1xuXG4gICAgaWYgKG5vZGUuVFlQRSA9PT0gTmF0aXZlTm9kZS5UWVBFKVxuICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy51cGRhdGVOYXRpdmVFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuVFlQRSA9PT0gVGV4dE5vZGUuVFlQRSlcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMudXBkYXRlVGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBQb3J0YWxOb2RlLlRZUEUgfHwgbm9kZS5UWVBFID09PSBET01SZW5kZXJlci5UWVBFKVxuICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy51cGRhdGVQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2VcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTo6c3luY05vZGU6IFVuc3VwcG9ydGVkIHZpcnR1YWwgZWxlbWVudCB0eXBlIGRldGVjdGVkOiAke25vZGUuVFlQRX1gKTtcblxuICAgIGF3YWl0IHRoaXMuYXR0YWNoQ2hpbGRyZW4oY29udGV4dCwgbm9kZSwgdHJ1ZSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgc3luY05vZGUoY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBuYXRpdmVFbGVtZW50ID0gKG5vZGUgJiYgbm9kZS5uYXRpdmVFbGVtZW50KTtcbiAgICBpZiAoIW5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgIG5hdGl2ZUVsZW1lbnQgPSBhd2FpdCB0aGlzLmNvbnN0cnVjdE5hdGl2ZUVsZW1lbnRGcm9tTm9kZShjb250ZXh0LCBub2RlKTtcbiAgICAgIG5vZGUubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgIGlmIChub2RlLmppYiAmJiBub2RlLmppYi5wcm9wcyAmJiB0eXBlb2Ygbm9kZS5qaWIucHJvcHMucmVmID09PSAnZnVuY3Rpb24nKVxuICAgICAgICBub2RlLmppYi5wcm9wcy5yZWYuY2FsbChub2RlLCBuYXRpdmVFbGVtZW50LCBudWxsKTtcblxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYWRkTm9kZShjb250ZXh0LCBub2RlKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUpIHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLnVwZGF0ZU5vZGUoY29udGV4dCwgbm9kZSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZGVzdHJveU5vZGUoY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBuYXRpdmVFbGVtZW50ID0gKG5vZGUgJiYgbm9kZS5uYXRpdmVFbGVtZW50KTtcbiAgICBsZXQgcmVzdWx0ID0gZmFsc2U7XG5cbiAgICBpZiAobmF0aXZlRWxlbWVudCkge1xuICAgICAgaWYgKG5vZGUuVFlQRSA9PT0gTmF0aXZlTm9kZS5UWVBFKVxuICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLmRlc3Ryb3lOYXRpdmVFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBUZXh0Tm9kZS5UWVBFKVxuICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLmRlc3Ryb3lUZXh0RWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICAgIGVsc2UgaWYgKG5vZGUuVFlQRSA9PT0gUG9ydGFsTm9kZS5UWVBFIHx8IG5vZGUuVFlQRSA9PT0gRE9NUmVuZGVyZXIuVFlQRSlcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5kZXN0cm95UG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICAgIGVsc2VcbiAgICAgICAgbmV3IFR5cGVFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OjpzeW5jTm9kZTogVW5zdXBwb3J0ZWQgdmlydHVhbCBlbGVtZW50IHR5cGUgZGV0ZWN0ZWQ6ICR7bm9kZS5UWVBFfWApO1xuICAgIH1cblxuICAgIGlmIChub2RlKVxuICAgICAgYXdhaXQgdGhpcy5kZXRhY2hDaGlsZHJlbihjb250ZXh0LCBub2RlKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBmaW5kTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gIH1cblxuICBjcmVhdGVOYXRpdmVFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgICByZXR1cm4geyB0eXBlOiAnZWxlbWVudCcsIHZhbHVlOiBub2RlLnZhbHVlIH07XG4gIH1cblxuICB1cGRhdGVOYXRpdmVFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgfVxuXG4gIGNyZWF0ZVRleHRFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgICByZXR1cm4geyB0eXBlOiAndGV4dCcsIHZhbHVlOiBub2RlLnZhbHVlIH07XG4gIH1cblxuICB1cGRhdGVUZXh0RWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY3JlYXRlUG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogJ3BvcnRhbCcsIHZhbHVlOiBub2RlLnZhbHVlIH07XG4gIH1cblxuICB1cGRhdGVQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBkZXN0cm95TmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gIH1cblxuICBkZXN0cm95VGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICB9XG5cbiAgZGVzdHJveVBvcnRhbEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICB9XG5cbiAgZm9yY2VOYXRpdmVFbGVtZW50UmVmbG93KGNvbnRleHQsIG5vZGUsIG5hdGl2ZUVsZW1lbnQpIHtcbiAgfVxuXG4gIGFzeW5jIGF0dGFjaENoaWxkcmVuKGNvbnRleHQsIHBhcmVudE5vZGUsIG9yZGVyT25seSkge1xuICAgIGxldCBwYXJlbnROYXRpdmVFbGVtZW50ID0gKHBhcmVudE5vZGUgJiYgcGFyZW50Tm9kZS5uYXRpdmVFbGVtZW50KTtcbiAgICBpZiAoIXBhcmVudE5hdGl2ZUVsZW1lbnQpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgbmF0aXZlUGFyZW50Q2hpbGROb2RlcyA9IEFycmF5LmZyb20ocGFyZW50TmF0aXZlRWxlbWVudC5jaGlsZE5vZGVzKTtcbiAgICBsZXQgaW5kZXggPSAwO1xuICAgIGxldCBza2lwT3JkZXJlZE5vZGVzID0gdHJ1ZTtcblxuICAgIGZvciAobGV0IGNoaWxkTm9kZSBvZiBwYXJlbnROb2RlLmdldENoaWxkcmVuTm9kZXMoKSkge1xuICAgICAgbGV0IGNoaWxkTmF0aXZlRWxlbWVudCA9IGNoaWxkTm9kZS5uYXRpdmVFbGVtZW50O1xuICAgICAgaWYgKCFjaGlsZE5hdGl2ZUVsZW1lbnQpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAob3JkZXJPbmx5ICE9PSB0cnVlKVxuICAgICAgICBhd2FpdCB0aGlzLnVwZGF0ZU5vZGUoY29udGV4dCwgY2hpbGROb2RlKTtcblxuICAgICAgLy8gUGVyZm9ybWFuY2UgYm9vc3RcbiAgICAgIGlmIChza2lwT3JkZXJlZE5vZGVzKSB7XG4gICAgICAgIGlmIChuYXRpdmVQYXJlbnRDaGlsZE5vZGVzW2luZGV4KytdID09PSBjaGlsZE5hdGl2ZUVsZW1lbnQpXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBza2lwT3JkZXJlZE5vZGVzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IHBhcmVudE5hdGl2ZUVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGROYXRpdmVFbGVtZW50KTtcbiAgICAgIHRoaXMuZm9yY2VOYXRpdmVFbGVtZW50UmVmbG93KGNvbnRleHQsIGNoaWxkTm9kZSwgY2hpbGROYXRpdmVFbGVtZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGRldGFjaENoaWxkcmVuKGNvbnRleHQsIHBhcmVudE5vZGUpIHtcbiAgICBsZXQgcGFyZW50TmF0aXZlRWxlbWVudCA9IChwYXJlbnROb2RlICYmIHBhcmVudE5vZGUubmF0aXZlRWxlbWVudCk7XG4gICAgaWYgKCFwYXJlbnROYXRpdmVFbGVtZW50KVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IGRlc3Ryb3lQcm9taXNlcyA9IFtdO1xuICAgIGZvciAobGV0IGNoaWxkTm9kZSBvZiBwYXJlbnROb2RlLmdldENoaWxkcmVuTm9kZXMoKSlcbiAgICAgIGRlc3Ryb3lQcm9taXNlcy5wdXNoKHRoaXMuZGVzdHJveU5vZGUoY29udGV4dCwgY2hpbGROb2RlKSk7XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbChkZXN0cm95UHJvbWlzZXMpO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cbiIsImltcG9ydCB7XG4gIEppYnMsXG4gIFJlbmRlcmVycyxcbiAgVXRpbHMsXG4gIGRlYWRiZWVmLFxufSBmcm9tICdqaWJzJztcblxuY29uc3Qge1xuICBpc0ppYmlzaCxcbiAgY29uc3RydWN0SmliLFxuICBKSUJfUFJPWFksXG4gIEpJQl9SQVdfVEVYVCxcbiAgSklCX0NISUxEX0lOREVYX1BST1AsXG59ID0gSmlicztcblxuY29uc3Qge1xuICBSb290Tm9kZSxcbn0gPSBSZW5kZXJlcnM7XG5cbmV4cG9ydCBjbGFzcyBGcmFnbWVudE5vZGUgZXh0ZW5kcyBSb290Tm9kZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gMTE7XG5cbiAgZ2V0VGhpc05vZGVPckNoaWxkTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2hpbGRyZW5Ob2RlcygpO1xuICB9XG5cbiAgYXN5bmMgX3JlbmRlcigpIHtcbiAgICBsZXQgaW5kZXhNYXAgICAgPSBuZXcgTWFwKCk7XG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcblxuICAgIGxldCB7IGNoaWxkcmVuIH0gPSAodGhpcy5qaWIgfHwge30pO1xuICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGNoaWxkcmVuLCAncHJvbWlzZScpKVxuICAgICAgY2hpbGRyZW4gPSBhd2FpdCBjaGlsZHJlbjtcblxuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKCF0aGlzLmlzSXRlcmFibGVDaGlsZChjaGlsZHJlbikgJiYgKGlzSmliaXNoKGNoaWxkcmVuKSB8fCB0aGlzLmlzVmFsaWRDaGlsZChjaGlsZHJlbikpKVxuICAgICAgY2hpbGRyZW4gPSBbIGNoaWxkcmVuIF07XG5cbiAgICBjb25zdCBnZXRJbmRleEZvclR5cGUgPSAoVHlwZSkgPT4ge1xuICAgICAgbGV0IGluZGV4ID0gKGluZGV4TWFwLmdldChUeXBlKSB8fCAwKSArIDE7XG4gICAgICBpbmRleE1hcC5zZXQoVHlwZSwgaW5kZXgpO1xuXG4gICAgICByZXR1cm4gaW5kZXg7XG4gICAgfTtcblxuICAgIGxldCBsb29wU3RvcHBlZCA9IGZhbHNlO1xuICAgIGxldCBwcm9taXNlcyA9IFV0aWxzLml0ZXJhdGUoY2hpbGRyZW4sICh7IHZhbHVlOiBfY2hpbGQsIGtleSwgaW5kZXgsIFNUT1AgfSkgPT4ge1xuICAgICAgaWYgKGxvb3BTdG9wcGVkIHx8IHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgIHJldHVybiBTVE9QO1xuXG4gICAgICByZXR1cm4gKGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IGNoaWxkID0gKFV0aWxzLmluc3RhbmNlT2YoX2NoaWxkLCAncHJvbWlzZScpKSA/IGF3YWl0IF9jaGlsZCA6IF9jaGlsZDtcbiAgICAgICAgaWYgKFV0aWxzLmlzRW1wdHkoY2hpbGQpIHx8IE9iamVjdC5pcyhjaGlsZCwgTmFOKSB8fCBPYmplY3QuaXMoY2hpbGQsIEluZmluaXR5KSlcbiAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpIHtcbiAgICAgICAgICBsb29wU3RvcHBlZCA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGlzSmliID0gaXNKaWJpc2goY2hpbGQpO1xuICAgICAgICBsZXQgY3JlYXRlZDtcbiAgICAgICAgbGV0IGppYjtcblxuICAgICAgICBpZiAoIWlzSmliICYmIHRoaXMuaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSkge1xuICAgICAgICAgIGppYiA9IHtcbiAgICAgICAgICAgIFR5cGU6ICAgICBKSUJfUFJPWFksXG4gICAgICAgICAgICBjaGlsZHJlbjogY2hpbGQsXG4gICAgICAgICAgICBwcm9wczogICAge1xuICAgICAgICAgICAgICBrZXk6IGBAamliL2ludGVybmFsX2ZyYWdtZW50XyR7Z2V0SW5kZXhGb3JUeXBlKEpJQl9QUk9YWSl9YCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICghaXNKaWIgJiYgdGhpcy5pc1ZhbGlkQ2hpbGQoY2hpbGQpKSB7XG4gICAgICAgICAgY2hpbGQgPSAodHlwZW9mIGNoaWxkLnZhbHVlT2YgPT09ICdmdW5jdGlvbicpID8gY2hpbGQudmFsdWVPZigpIDogY2hpbGQ7XG4gICAgICAgICAgamliID0ge1xuICAgICAgICAgICAgVHlwZTogICAgIEpJQl9SQVdfVEVYVCxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBjaGlsZCxcbiAgICAgICAgICAgIHByb3BzOiAgICB7XG4gICAgICAgICAgICAgIGtleTogYEBqaWIvaW50ZXJuYWxfdGV4dF8ke2dldEluZGV4Rm9yVHlwZShKSUJfUkFXX1RFWFQpfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoaXNKaWIpIHtcbiAgICAgICAgICBqaWIgPSBjb25zdHJ1Y3RKaWIoY2hpbGQpO1xuICAgICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGppYiwgJ3Byb21pc2UnKSlcbiAgICAgICAgICAgIGppYiA9IGF3YWl0IGppYjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKSB7XG4gICAgICAgICAgbG9vcFN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB7IFR5cGUsIHByb3BzIH0gPSBqaWI7XG4gICAgICAgIGxldCBsb2NhbEtleTtcbiAgICAgICAgaWYgKGluZGV4ICE9PSBrZXkpIC8vIEluZGV4IGlzIGFuIGludGVnZXIsIGFuZCBrZXkgaXMgYSBzdHJpbmcsIG1lYW5pbmcgdGhpcyBpcyBhbiBvYmplY3RcbiAgICAgICAgICBsb2NhbEtleSA9IGtleTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGxvY2FsS2V5ID0gKHByb3BzLmtleSA9PSBudWxsIHx8IE9iamVjdC5pcyhwcm9wcy5rZXksIE5hTikgfHwgT2JqZWN0LmlzKHByb3BzLmtleSwgSW5maW5pdHkpKSA/IGBAamliL2ludGVybmFsX2tleV8ke2dldEluZGV4Rm9yVHlwZShUeXBlKX1gIDogcHJvcHMua2V5O1xuXG4gICAgICAgIHByb3BzW0pJQl9DSElMRF9JTkRFWF9QUk9QXSA9IGluZGV4O1xuICAgICAgICBwcm9wcy5rZXkgPSBsb2NhbEtleTtcbiAgICAgICAgamliLnByb3BzID0gcHJvcHM7XG5cbiAgICAgICAgbGV0IGNhY2hlS2V5ID0gZGVhZGJlZWYoVHlwZSwgcHJvcHMua2V5KTtcbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLmdldENoaWxkKGNhY2hlS2V5KTtcblxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICBjcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICBub2RlID0gdGhpcy5yZW5kZXJlci5jb25zdHJ1Y3ROb2RlRnJvbUppYihqaWIsIHRoaXMsIHRoaXMuY29udGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3JlYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIG5vZGUudXBkYXRlSmliKGppYik7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBub2RlLnJlbmRlcigpO1xuXG4gICAgICAgIHJldHVybiB7IG5vZGUsIGNhY2hlS2V5LCBjcmVhdGVkIH07XG4gICAgICB9KSgpO1xuICAgIH0pO1xuXG4gICAgbGV0IHJlbmRlclJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgcmVuZGVyUmVzdWx0cyA9IHJlbmRlclJlc3VsdHMuZmlsdGVyKChyZXN1bHQpID0+ICEhcmVzdWx0KTtcblxuICAgIGxldCBkZXN0cm95UHJvbWlzZXMgPSBbXTtcbiAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSkge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcmVuZGVyUmVzdWx0cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSByZW5kZXJSZXN1bHRzW2ldO1xuICAgICAgICBsZXQgeyBub2RlLCBjcmVhdGVkIH0gPSByZXN1bHQ7XG5cbiAgICAgICAgaWYgKGNyZWF0ZWQgJiYgbm9kZSkge1xuICAgICAgICAgIC8vIERlc3Ryb3kgbm9kZXMgc2luY2UgdGhpcyByZW5kZXIgd2FzIHJlamVjdGVkLlxuICAgICAgICAgIC8vIEJ1dCBvbmx5IG5vZGVzIHRoYXQgd2VyZSBqdXN0IGNyZWF0ZWQuLi5cbiAgICAgICAgICAvLyBhcyBleGlzdGluZyBub2RlcyBtaWdodCBzdGlsbCBuZWVkIHRvIGV4aXN0LlxuICAgICAgICAgIGRlc3Ryb3lQcm9taXNlcy5wdXNoKG5vZGUuZGVzdHJveSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZGVzdHJveVByb21pc2VzLmxlbmd0aCA+IDApXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGRlc3Ryb3lQcm9taXNlcyk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBBZGQgbmV3IGNoaWxkcmVuLCBhbmQgYnVpbGQgYSBtYXBcbiAgICAvLyBvZiBjaGlsZHJlbiBqdXN0IGFkZGVkLlxuICAgIGxldCBhZGRlZENoaWxkcmVuID0gbmV3IE1hcCgpO1xuICAgIGZvciAobGV0IHJlbmRlclJlc3VsdCBvZiByZW5kZXJSZXN1bHRzKSB7XG4gICAgICBsZXQgeyBjYWNoZUtleSwgbm9kZSB9ID0gcmVuZGVyUmVzdWx0O1xuXG4gICAgICBhZGRlZENoaWxkcmVuLnNldChjYWNoZUtleSwgbm9kZSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIG5vZGVzIG5vIGxvbmdlciBpbiB0aGUgZnJhZ21lbnRcbiAgICBsZXQgY2hpbGRyZW5Ub0Rlc3Ryb3kgPSBbXTtcbiAgICBmb3IgKGxldCBbIGNhY2hlS2V5LCBjaGlsZE5vZGUgXSBvZiB0aGlzLmdldENoaWxkcmVuKCkpIHtcbiAgICAgIGxldCBoYXNDaGlsZCA9IGFkZGVkQ2hpbGRyZW4uaGFzKGNhY2hlS2V5KTtcbiAgICAgIGlmICghaGFzQ2hpbGQpIHtcbiAgICAgICAgLy8gVGhpcyBub2RlIHdhcyBkZXN0cm95ZWRcbiAgICAgICAgY2hpbGRyZW5Ub0Rlc3Ryb3kucHVzaChjaGlsZE5vZGUpO1xuICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGNoaWxkTm9kZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2xlYXIgY2hpbGRyZW4gYW5kIHJlYWRkIHRoZW1cbiAgICAvLyB0byBrZWVwIHRoZSByZW5kZXIgb3JkZXIgaW50YWN0XG4gICAgdGhpcy5jbGVhckNoaWxkcmVuKCk7XG5cbiAgICBmb3IgKGxldCBbIGNhY2hlS2V5LCBjaGlsZE5vZGUgXSBvZiBhZGRlZENoaWxkcmVuKVxuICAgICAgdGhpcy5hZGRDaGlsZChjaGlsZE5vZGUsIGNhY2hlS2V5KTtcblxuICAgIGFkZGVkQ2hpbGRyZW4uY2xlYXIoKTtcblxuICAgIC8vIE5vdyB0aGF0IGNoaWxkcmVuIHRvIGRlc3Ryb3kgaGF2ZVxuICAgIC8vIGJlZW4gY29sbGVjdGVkLCBwbGVhc2UgZGVzdHJveSB0aGVtXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gY2hpbGRyZW5Ub0Rlc3Ryb3kubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGNoaWxkTm9kZSA9IGNoaWxkcmVuVG9EZXN0cm95W2ldO1xuICAgICAgZGVzdHJveVByb21pc2VzLnB1c2goY2hpbGROb2RlLmRlc3Ryb3koKSk7XG4gICAgfVxuXG4gICAgaWYgKGRlc3Ryb3lQcm9taXNlcy5sZW5ndGggPiAwKVxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICAvLyBGcmFnbWVudHMgY2FuIG5vdCBiZSBkZXN0cm95ZWQgZnJvbSB0aGUgRE9NXG4gICAgaWYgKG5vZGUgPT09IHRoaXMpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnBhcmVudE5vZGUuZGVzdHJveUZyb21ET00oY29udGV4dCwgbm9kZSk7XG4gIH1cblxuICBhc3luYyBzeW5jRE9NKF9jb250ZXh0LCBfbm9kZSkge1xuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgbGV0IGNvbnRleHQgPSBfY29udGV4dDtcbiAgICBsZXQgbm9kZSA9IF9ub2RlO1xuICAgIGlmIChub2RlID09PSB0aGlzKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcy5wYXJlbnROb2RlLmNvbnRleHQ7XG4gICAgICBub2RlID0gdGhpcy5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnBhcmVudE5vZGUuc3luY0RPTShjb250ZXh0LCBub2RlKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgSmlicyxcbiAgUmVuZGVyZXJzLFxufSBmcm9tICdqaWJzJztcblxuY29uc3Qge1xuICBKSUJfUFJPWFksXG59ID0gSmlicztcblxuY29uc3Qge1xuICBSb290Tm9kZSxcbn0gPSBSZW5kZXJlcnM7XG5cbmV4cG9ydCBjbGFzcyBOYXRpdmVOb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICBzdGF0aWMgVFlQRSA9IDE7XG5cbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHN1cGVyKC4uLmFyZ3MpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ2ZyYWdtZW50Tm9kZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuICAgIGF3YWl0IHRoaXMuZGVzdHJveUZyYWdtZW50Tm9kZSgpO1xuXG4gICAgcmV0dXJuIGF3YWl0IHN1cGVyLmRlc3Ryb3kodHJ1ZSk7XG4gIH1cblxuICBhc3luYyBkZXN0cm95RnJhZ21lbnROb2RlKCkge1xuICAgIGlmICghdGhpcy5mcmFnbWVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLnJlbW92ZUNoaWxkKHRoaXMuZnJhZ21lbnROb2RlKTtcblxuICAgIGF3YWl0IHRoaXMuZnJhZ21lbnROb2RlLmRlc3Ryb3koKTtcbiAgICB0aGlzLmZyYWdtZW50Tm9kZSA9IG51bGw7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQge1xuICAgICAgVHlwZSxcbiAgICAgIHByb3BzLFxuICAgICAgY2hpbGRyZW4sXG4gICAgfSA9ICh0aGlzLmppYiB8fCB7fSk7XG5cbiAgICBpZiAoIVR5cGUpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwcm9wcywgJ2lubmVySFRNTCcpKSB7XG4gICAgICBsZXQgZnJhZ21lbnRKaWIgPSB7IFR5cGU6IEpJQl9QUk9YWSwgcHJvcHM6IHt9LCBjaGlsZHJlbiB9O1xuICAgICAgbGV0IGZyYWdtZW50Tm9kZSA9IHRoaXMuZnJhZ21lbnROb2RlO1xuXG4gICAgICBpZiAoIWZyYWdtZW50Tm9kZSkge1xuICAgICAgICBmcmFnbWVudE5vZGUgPSB0aGlzLmZyYWdtZW50Tm9kZSA9IHRoaXMucmVuZGVyZXIuY29uc3RydWN0Tm9kZUZyb21KaWIoZnJhZ21lbnRKaWIsIHRoaXMsIHRoaXMuY29udGV4dCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoZnJhZ21lbnROb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZnJhZ21lbnROb2RlLnVwZGF0ZUppYihmcmFnbWVudEppYik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IGZyYWdtZW50Tm9kZS5yZW5kZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5kZXN0cm95RnJhZ21lbnROb2RlKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBOYXRpdmVOb2RlIH0gZnJvbSAnLi9uYXRpdmUtbm9kZS5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQb3J0YWxOb2RlIGV4dGVuZHMgTmF0aXZlTm9kZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gMTU7XG59XG4iLCJpbXBvcnQge1xuICBSZW5kZXJlcnMsXG59IGZyb20gJ2ppYnMnO1xuXG5jb25zdCB7XG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuZXhwb3J0IGNsYXNzIFRleHROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDM7XG5cbiAgc3RhdGljIEhBU19DT05URVhUID0gZmFsc2U7XG59XG4iLCIvKioqKioqLyB2YXIgX193ZWJwYWNrX21vZHVsZXNfXyA9ICh7XG5cbi8qKiovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgX191bnVzZWRfd2VicGFja19leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cbi8vIENvcHlyaWdodCAyMDIyIFd5YXR0IEdyZWVud2F5XG5cblxuXG5jb25zdCB0aGlzR2xvYmFsID0gKCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiBfX3dlYnBhY2tfcmVxdWlyZV9fLmcpIHx8IHRoaXM7XG5jb25zdCBERUFEQkVFRl9SRUZfTUFQX0tFWSA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZSZWZNYXAnKTtcbmNvbnN0IFVOSVFVRV9JRF9TWU1CT0wgPSBTeW1ib2wuZm9yKCdAQGRlYWRiZWVmVW5pcXVlSUQnKTtcbmNvbnN0IHJlZk1hcCA9ICh0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSkgPyB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA6IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBpZEhlbHBlcnMgPSBbXTtcblxuaWYgKCF0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSlcbiAgdGhpc0dsb2JhbFtERUFEQkVFRl9SRUZfTUFQX0tFWV0gPSByZWZNYXA7XG5cbmxldCB1dWlkQ291bnRlciA9IDBuO1xuXG5mdW5jdGlvbiBnZXRIZWxwZXJGb3JWYWx1ZSh2YWx1ZSkge1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBpZEhlbHBlcnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCB7IGhlbHBlciwgZ2VuZXJhdG9yIH0gPSBpZEhlbHBlcnNbaV07XG4gICAgaWYgKGhlbHBlcih2YWx1ZSkpXG4gICAgICByZXR1cm4gZ2VuZXJhdG9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFueXRoaW5nVG9JRChfYXJnLCBfYWxyZWFkeVZpc2l0ZWQpIHtcbiAgbGV0IGFyZyA9IF9hcmc7XG4gIGlmIChhcmcgaW5zdGFuY2VvZiBOdW1iZXIgfHwgYXJnIGluc3RhbmNlb2YgU3RyaW5nIHx8IGFyZyBpbnN0YW5jZW9mIEJvb2xlYW4pXG4gICAgYXJnID0gYXJnLnZhbHVlT2YoKTtcblxuICBsZXQgdHlwZU9mID0gdHlwZW9mIGFyZztcblxuICBpZiAodHlwZU9mID09PSAnbnVtYmVyJyAmJiBhcmcgPT09IDApIHtcbiAgICBpZiAoT2JqZWN0LmlzKGFyZywgLTApKVxuICAgICAgcmV0dXJuICdudW1iZXI6LTAnO1xuXG4gICAgcmV0dXJuICdudW1iZXI6KzAnO1xuICB9XG5cbiAgaWYgKHR5cGVPZiA9PT0gJ3N5bWJvbCcpXG4gICAgcmV0dXJuIGBzeW1ib2w6JHthcmcudG9TdHJpbmcoKX1gO1xuXG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlT2YgPT09ICdudW1iZXInIHx8IHR5cGVPZiA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVPZiA9PT0gJ3N0cmluZycgfHwgdHlwZU9mID09PSAnYmlnaW50Jykge1xuICAgIGlmICh0eXBlT2YgPT09ICdudW1iZXInKVxuICAgICAgcmV0dXJuIChhcmcgPCAwKSA/IGBudW1iZXI6JHthcmd9YCA6IGBudW1iZXI6KyR7YXJnfWA7XG5cbiAgICBpZiAodHlwZU9mID09PSAnYmlnaW50JyAmJiBhcmcgPT09IDBuKVxuICAgICAgcmV0dXJuICdiaWdpbnQ6KzAnO1xuXG4gICAgcmV0dXJuIGAke3R5cGVPZn06JHthcmd9YDtcbiAgfVxuXG4gIGxldCBpZEhlbHBlciA9IChpZEhlbHBlcnMubGVuZ3RoID4gMCAmJiBnZXRIZWxwZXJGb3JWYWx1ZShhcmcpKTtcbiAgaWYgKGlkSGVscGVyKVxuICAgIHJldHVybiBhbnl0aGluZ1RvSUQoaWRIZWxwZXIoYXJnKSk7XG5cbiAgaWYgKFVOSVFVRV9JRF9TWU1CT0wgaW4gYXJnICYmIHR5cGVvZiBhcmdbVU5JUVVFX0lEX1NZTUJPTF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBQcmV2ZW50IGluZmluaXRlIHJlY3Vyc2lvblxuICAgIGlmICghX2FscmVhZHlWaXNpdGVkIHx8ICFfYWxyZWFkeVZpc2l0ZWQuaGFzKGFyZykpIHtcbiAgICAgIGxldCBhbHJlYWR5VmlzaXRlZCA9IF9hbHJlYWR5VmlzaXRlZCB8fCBuZXcgU2V0KCk7XG4gICAgICBhbHJlYWR5VmlzaXRlZC5hZGQoYXJnKTtcbiAgICAgIHJldHVybiBhbnl0aGluZ1RvSUQoYXJnW1VOSVFVRV9JRF9TWU1CT0xdKCksIGFscmVhZHlWaXNpdGVkKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXJlZk1hcC5oYXMoYXJnKSkge1xuICAgIGxldCBrZXkgPSBgJHt0eXBlb2YgYXJnfTokeysrdXVpZENvdW50ZXJ9YDtcbiAgICByZWZNYXAuc2V0KGFyZywga2V5KTtcbiAgICByZXR1cm4ga2V5O1xuICB9XG5cbiAgcmV0dXJuIHJlZk1hcC5nZXQoYXJnKTtcbn1cblxuZnVuY3Rpb24gZGVhZGJlZWYoKSB7XG4gIGxldCBwYXJ0cyA9IFsgYXJndW1lbnRzLmxlbmd0aCBdO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICBwYXJ0cy5wdXNoKGFueXRoaW5nVG9JRChhcmd1bWVudHNbaV0pKTtcblxuICByZXR1cm4gcGFydHMuam9pbignOicpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZlNvcnRlZCgpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5zb3J0KCkuam9pbignOicpO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUlERm9yKGhlbHBlciwgZ2VuZXJhdG9yKSB7XG4gIGlkSGVscGVycy5wdXNoKHsgaGVscGVyLCBnZW5lcmF0b3IgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUlER2VuZXJhdG9yKGhlbHBlcikge1xuICBsZXQgaW5kZXggPSBpZEhlbHBlcnMuZmluZEluZGV4KChpdGVtKSA9PiAoaXRlbS5oZWxwZXIgPT09IGhlbHBlcikpO1xuICBpZiAoaW5kZXggPCAwKVxuICAgIHJldHVybjtcblxuICBpZEhlbHBlcnMuc3BsaWNlKGluZGV4LCAxKTtcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZGVhZGJlZWYsIHtcbiAgJ2lkU3ltJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIFVOSVFVRV9JRF9TWU1CT0wsXG4gIH0sXG4gICdzb3J0ZWQnOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZGVhZGJlZWZTb3J0ZWQsXG4gIH0sXG4gICdnZW5lcmF0ZUlERm9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIGdlbmVyYXRlSURGb3IsXG4gIH0sXG4gICdyZW1vdmVJREdlbmVyYXRvcic6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICByZW1vdmVJREdlbmVyYXRvcixcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYWRiZWVmO1xuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL2NvbXBvbmVudC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvY29tcG9uZW50LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNvbXBvbmVudFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBDb21wb25lbnQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkZMVVNIX1VQREFURV9NRVRIT0RcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gRkxVU0hfVVBEQVRFX01FVEhPRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSU5JVF9NRVRIT0RcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSU5JVF9NRVRIT0QpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkxBU1RfUkVOREVSX1RJTUVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gTEFTVF9SRU5ERVJfVElNRSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUEVORElOR19TVEFURV9VUERBVEVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUEVORElOR19TVEFURV9VUERBVEUpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlBSRVZJT1VTX1NUQVRFXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFBSRVZJT1VTX1NUQVRFKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJRVUVVRV9VUERBVEVfTUVUSE9EXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFFVRVVFX1VQREFURV9NRVRIT0QpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlNLSVBfU1RBVEVfVVBEQVRFU1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBTS0lQX1NUQVRFX1VQREFURVMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlRlcm1cIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gVGVybSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiVVBEQVRFX0VWRU5UXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFVQREFURV9FVkVOVClcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXZlbnRzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V2ZW50cy5qcyAqLyBcIi4vbGliL2V2ZW50cy5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbHMuanMgKi8gXCIuL2xpYi91dGlscy5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2ppYi5qcyAqLyBcIi4vbGliL2ppYi5qc1wiKTtcbi8qIGdsb2JhbCBCdWZmZXIgKi9cblxuXG5cblxuXG5cbmNvbnN0IFVQREFURV9FVkVOVCAgICAgICAgICAgICAgPSAnQGppYnMvY29tcG9uZW50L2V2ZW50L3VwZGF0ZSc7XG5jb25zdCBRVUVVRV9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3F1ZXVlVXBkYXRlJyk7XG5jb25zdCBGTFVTSF9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2ZsdXNoVXBkYXRlJyk7XG5jb25zdCBJTklUX01FVEhPRCAgICAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L19faW5pdCcpO1xuY29uc3QgU0tJUF9TVEFURV9VUERBVEVTICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9za2lwU3RhdGVVcGRhdGVzJyk7XG5jb25zdCBQRU5ESU5HX1NUQVRFX1VQREFURSAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3BlbmRpbmdTdGF0ZVVwZGF0ZScpO1xuY29uc3QgTEFTVF9SRU5ERVJfVElNRSAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9sYXN0UmVuZGVyVGltZScpO1xuY29uc3QgUFJFVklPVVNfU1RBVEUgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wcmV2aW91c1N0YXRlJyk7XG5jb25zdCBDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3ByZXZpb3VzU3RhdGUnKTtcblxuY29uc3QgZWxlbWVudERhdGFDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgTmFOKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCb29sZWFuIHx8IHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBsZXQgdHlwZU9mID0gdHlwZW9mIHZhbHVlO1xuICBpZiAodHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdudW1iZXInIHx8IHR5cGVPZiA9PT0gJ2Jvb2xlYW4nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgQnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiBCdWZmZXIuaXNCdWZmZXIodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgX2V2ZW50c19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkV2ZW50RW1pdHRlciB7XG4gIHN0YXRpYyBVUERBVEVfRVZFTlQgPSBVUERBVEVfRVZFTlQ7XG5cbiAgW1FVRVVFX1VQREFURV9NRVRIT0RdKCkge1xuICAgIGlmICh0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0udGhlbih0aGlzW0ZMVVNIX1VQREFURV9NRVRIT0RdLmJpbmQodGhpcykpO1xuICB9XG5cbiAgW0ZMVVNIX1VQREFURV9NRVRIT0RdKCkge1xuICAgIC8vIFdhcyB0aGUgc3RhdGUgdXBkYXRlIGNhbmNlbGxlZD9cbiAgICBpZiAoIXRoaXNbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5lbWl0KFVQREFURV9FVkVOVCk7XG5cbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSA9IG51bGw7XG4gIH1cblxuICBbSU5JVF9NRVRIT0RdKCkge1xuICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IGZhbHNlO1xuICB9XG5cbiAgY29uc3RydWN0b3IoX2ppYikge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvLyBCaW5kIGFsbCBjbGFzcyBtZXRob2RzIHRvIFwidGhpc1wiXG4gICAgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uYmluZE1ldGhvZHMuY2FsbCh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG5cbiAgICBsZXQgamliID0gX2ppYiB8fCB7fTtcblxuICAgIGNvbnN0IGNyZWF0ZU5ld1N0YXRlID0gKCkgPT4ge1xuICAgICAgbGV0IGxvY2FsU3RhdGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgICByZXR1cm4gbmV3IFByb3h5KGxvY2FsU3RhdGUsIHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBwcm9wTmFtZSkgPT4ge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgIGxldCBjdXJyZW50VmFsdWUgPSB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUgPT09IHZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICBpZiAoIXRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSlcbiAgICAgICAgICAgIHRoaXNbUVVFVUVfVVBEQVRFX01FVEhPRF0oKTtcblxuICAgICAgICAgIHRhcmdldFtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLm9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCB2YWx1ZSwgY3VycmVudFZhbHVlKTtcblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxldCBwcm9wcyAgICAgICA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSwgamliLnByb3BzIHx8IHt9KTtcbiAgICBsZXQgX2xvY2FsU3RhdGUgPSBjcmVhdGVOZXdTdGF0ZSgpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW1NLSVBfU1RBVEVfVVBEQVRFU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBbUEVORElOR19TVEFURV9VUERBVEVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFByb21pc2UucmVzb2x2ZSgpLFxuICAgICAgfSxcbiAgICAgIFtMQVNUX1JFTkRFUl9USU1FXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5ub3coKSxcbiAgICAgIH0sXG4gICAgICBbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9LFxuICAgICAgJ2lkJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5pZCxcbiAgICAgIH0sXG4gICAgICAncHJvcHMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHByb3BzLFxuICAgICAgfSxcbiAgICAgICdjaGlsZHJlbic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmNoaWxkcmVuIHx8IFtdLFxuICAgICAgfSxcbiAgICAgICdjb250ZXh0Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuY29udGV4dCB8fCBPYmplY3QuY3JlYXRlKG51bGwpLFxuICAgICAgfSxcbiAgICAgICdzdGF0ZSc6IHtcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gX2xvY2FsU3RhdGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCFpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgXCJ0aGlzLnN0YXRlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihfbG9jYWxTdGF0ZSwgdmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJlc29sdmVDaGlsZHJlbihjaGlsZHJlbikge1xuICAgIHJldHVybiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18ucmVzb2x2ZUNoaWxkcmVuLmNhbGwodGhpcywgY2hpbGRyZW4pO1xuICB9XG5cbiAgaXNKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLmlzSmliaXNoKSh2YWx1ZSk7XG4gIH1cblxuICBjb25zdHJ1Y3RKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLmNvbnN0cnVjdEppYikodmFsdWUpO1xuICB9XG5cbiAgcHVzaFJlbmRlcihyZW5kZXJSZXN1bHQpIHtcbiAgICB0aGlzLmVtaXQoVVBEQVRFX0VWRU5ULCByZW5kZXJSZXN1bHQpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uUHJvcFVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCBuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgfVxuXG4gIGNhcHR1cmVSZWZlcmVuY2UobmFtZSwgaW50ZXJjZXB0b3JDYWxsYmFjaykge1xuICAgIGxldCBtZXRob2QgPSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdW25hbWVdO1xuICAgIGlmIChtZXRob2QpXG4gICAgICByZXR1cm4gbWV0aG9kO1xuXG4gICAgbWV0aG9kID0gKF9yZWYsIHByZXZpb3VzUmVmKSA9PiB7XG4gICAgICBsZXQgcmVmID0gX3JlZjtcblxuICAgICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZWYgPSBpbnRlcmNlcHRvckNhbGxiYWNrLmNhbGwodGhpcywgcmVmLCBwcmV2aW91c1JlZik7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICAgW25hbWVdOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgcmVmLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgaW50ZXJjZXB0b3JDYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU10gPSBtZXRob2Q7XG5cbiAgICByZXR1cm4gbWV0aG9kO1xuICB9XG5cbiAgZm9yY2VVcGRhdGUoKSB7XG4gICAgdGhpc1tRVUVVRV9VUERBVEVfTUVUSE9EXSgpO1xuICB9XG5cbiAgZ2V0U3RhdGUocHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIHN0YXRlO1xuXG4gICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocHJvcGVydHlQYXRoLCAnb2JqZWN0JykpIHtcbiAgICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKHByb3BlcnR5UGF0aCkuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocHJvcGVydHlQYXRoKSk7XG4gICAgICBsZXQgZmluYWxTdGF0ZSAgPSB7fTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIGxldCBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBsZXQgWyB2YWx1ZSwgbGFzdFBhcnQgXSA9IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBrZXksIHByb3BlcnR5UGF0aFtrZXldLCB0cnVlKTtcbiAgICAgICAgaWYgKGxhc3RQYXJ0ID09IG51bGwpXG4gICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgZmluYWxTdGF0ZVtsYXN0UGFydF0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpbmFsU3RhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5mZXRjaERlZXBQcm9wZXJ0eShzdGF0ZSwgcHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHNldFN0YXRlKHZhbHVlKSB7XG4gICAgaWYgKCFpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgXCJ0aGlzLnNldFN0YXRlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnN0YXRlLCB2YWx1ZSk7XG4gIH1cblxuICBzZXRTdGF0ZVBhc3NpdmUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVQYXNzaXZlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IHRydWU7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBkZWxldGUgdGhpcy5zdGF0ZTtcbiAgICBkZWxldGUgdGhpcy5wcm9wcztcbiAgICBkZWxldGUgdGhpcy5jb250ZXh0O1xuICAgIGRlbGV0ZSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdO1xuICAgIHRoaXMuY2xlYXJBbGxEZWJvdW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcldhaXRpbmcoKSB7XG4gIH1cblxuICByZW5kZXIoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICB1cGRhdGVkKCkge1xuICB9XG5cbiAgY29tYmluZVdpdGgoc2VwLCAuLi5hcmdzKSB7XG4gICAgbGV0IGZpbmFsQXJncyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmdzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xuICAgICAgaWYgKCFhcmcpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihhcmcsICdzdHJpbmcnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLnNwbGl0KHNlcCkuZmlsdGVyKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmlzTm90RW1wdHkpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgbGV0IHZhbHVlcyA9IGFyZy5maWx0ZXIoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgIGlmICghX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZih2YWx1ZSwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmlzTm90RW1wdHkodmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGFyZywgJ29iamVjdCcpKSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMoYXJnKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IGtleSAgID0ga2V5c1tpXTtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBhcmdba2V5XTtcblxuICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIGZpbmFsQXJncy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZpbmFsQXJncy5hZGQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKGZpbmFsQXJncykuam9pbihzZXAgfHwgJycpO1xuICB9XG5cbiAgY2xhc3NlcyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tYmluZVdpdGgoJyAnLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGV4dHJhY3RDaGlsZHJlbihfcGF0dGVybnMsIGNoaWxkcmVuLCBfb3B0aW9ucykge1xuICAgIGxldCBvcHRpb25zICAgPSBfb3B0aW9ucyB8fCB7fTtcbiAgICBsZXQgZXh0cmFjdGVkID0ge307XG4gICAgbGV0IHBhdHRlcm5zICA9IF9wYXR0ZXJucztcbiAgICBsZXQgaXNBcnJheSAgID0gQXJyYXkuaXNBcnJheShwYXR0ZXJucyk7XG5cbiAgICBjb25zdCBpc01hdGNoID0gKGppYikgPT4ge1xuICAgICAgbGV0IGppYlR5cGUgPSBqaWIuVHlwZTtcbiAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGF0dGVybnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBwYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgIGlmIChqaWJUeXBlICE9PSBwYXR0ZXJuKVxuICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICBpZiAoZXh0cmFjdGVkW3BhdHRlcm5dICYmIG9wdGlvbnMubXVsdGlwbGUpIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShleHRyYWN0ZWRbcGF0dGVybl0pKVxuICAgICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBbIGV4dHJhY3RlZFtwYXR0ZXJuXSBdO1xuXG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0ucHVzaChqaWIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBqaWI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGF0dGVybnMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgICA9IGtleXNbaV07XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICAgIGxldCByZXN1bHQ7XG5cbiAgICAgICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihwYXR0ZXJuLCBSZWdFeHApKVxuICAgICAgICAgICAgcmVzdWx0ID0gcGF0dGVybi50ZXN0KGppYlR5cGUpO1xuICAgICAgICAgIGVsc2UgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4udG9Mb3dlckNhc2UoKSA9PT0gamliVHlwZSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4gPT09IGppYlR5cGUpO1xuXG4gICAgICAgICAgaWYgKCFyZXN1bHQpXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIGlmIChleHRyYWN0ZWRbcGF0dGVybl0gJiYgb3B0aW9ucy5tdWx0aXBsZSkge1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV4dHJhY3RlZFtwYXR0ZXJuXSkpXG4gICAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IFsgZXh0cmFjdGVkW3BhdHRlcm5dIF07XG5cbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXS5wdXNoKGppYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IGppYjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIGV4dHJhY3RlZC5yZW1haW5pbmdDaGlsZHJlbiA9IGNoaWxkcmVuLmZpbHRlcigoamliKSA9PiAhaXNNYXRjaChqaWIpKTtcbiAgICByZXR1cm4gZXh0cmFjdGVkO1xuICB9XG5cbiAgbWFwQ2hpbGRyZW4ocGF0dGVybnMsIF9jaGlsZHJlbikge1xuICAgIGxldCBjaGlsZHJlbiA9ICghQXJyYXkuaXNBcnJheShfY2hpbGRyZW4pKSA/IFsgX2NoaWxkcmVuIF0gOiBfY2hpbGRyZW47XG5cbiAgICByZXR1cm4gY2hpbGRyZW4ubWFwKChqaWIpID0+IHtcbiAgICAgIGlmICghamliKVxuICAgICAgICByZXR1cm4gamliO1xuXG4gICAgICBsZXQgamliVHlwZSA9IGppYi5UeXBlO1xuICAgICAgaWYgKCFfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgcmV0dXJuIGppYjtcblxuICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXR0ZXJucyk7XG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKSAhPT0gamliVHlwZSlcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBsZXQgbWV0aG9kID0gcGF0dGVybnNba2V5XTtcbiAgICAgICAgaWYgKCFtZXRob2QpXG4gICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsKHRoaXMsIGppYiwgaSwgY2hpbGRyZW4pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gamliO1xuICAgIH0pO1xuICB9XG5cbiAgZGVib3VuY2UoZnVuYywgdGltZSwgX2lkKSB7XG4gICAgY29uc3QgY2xlYXJQZW5kaW5nVGltZW91dCA9ICgpID0+IHtcbiAgICAgIGlmIChwZW5kaW5nVGltZXIgJiYgcGVuZGluZ1RpbWVyLnRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lci50aW1lb3V0KTtcbiAgICAgICAgcGVuZGluZ1RpbWVyLnRpbWVvdXQgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgaWQgPSAoIV9pZCkgPyAoJycgKyBmdW5jKSA6IF9pZDtcbiAgICBpZiAoIXRoaXMuZGVib3VuY2VUaW1lcnMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZGVib3VuY2VUaW1lcnMnLCB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHt9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdO1xuICAgIGlmICghcGVuZGluZ1RpbWVyKVxuICAgICAgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSB7fTtcblxuICAgIHBlbmRpbmdUaW1lci5mdW5jID0gZnVuYztcbiAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IHBlbmRpbmdUaW1lci5wcm9taXNlO1xuICAgIGlmICghcHJvbWlzZSB8fCAhcHJvbWlzZS5pc1BlbmRpbmcoKSkge1xuICAgICAgbGV0IHN0YXR1cyA9ICdwZW5kaW5nJztcbiAgICAgIGxldCByZXNvbHZlO1xuXG4gICAgICBwcm9taXNlID0gcGVuZGluZ1RpbWVyLnByb21pc2UgPSBuZXcgUHJvbWlzZSgoX3Jlc29sdmUpID0+IHtcbiAgICAgICAgcmVzb2x2ZSA9IF9yZXNvbHZlO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UucmVzb2x2ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gJ3BlbmRpbmcnKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBzdGF0dXMgPSAnZnVsZmlsbGVkJztcbiAgICAgICAgY2xlYXJQZW5kaW5nVGltZW91dCgpO1xuICAgICAgICB0aGlzLmRlYm91bmNlVGltZXJzW2lkXSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBwZW5kaW5nVGltZXIuZnVuYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHZhciByZXQgPSBwZW5kaW5nVGltZXIuZnVuYy5jYWxsKHRoaXMpO1xuICAgICAgICAgIGlmIChyZXQgaW5zdGFuY2VvZiBQcm9taXNlIHx8IChyZXQgJiYgdHlwZW9mIHJldC50aGVuID09PSAnZnVuY3Rpb24nKSlcbiAgICAgICAgICAgIHJldC50aGVuKCh2YWx1ZSkgPT4gcmVzb2x2ZSh2YWx1ZSkpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc29sdmUocmV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICBzdGF0dXMgPSAncmVqZWN0ZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBwcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuaXNQZW5kaW5nID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gKHN0YXR1cyA9PT0gJ3BlbmRpbmcnKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICBwZW5kaW5nVGltZXIudGltZW91dCA9IHNldFRpbWVvdXQocHJvbWlzZS5yZXNvbHZlLCAodGltZSA9PSBudWxsKSA/IDI1MCA6IHRpbWUpO1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBjbGVhckRlYm91bmNlKGlkKSB7XG4gICAgaWYgKCF0aGlzLmRlYm91bmNlVGltZXJzKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdmFyIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdO1xuICAgIGlmIChwZW5kaW5nVGltZXIgPT0gbnVsbClcbiAgICAgIHJldHVybjtcblxuICAgIGlmIChwZW5kaW5nVGltZXIudGltZW91dClcbiAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZXIudGltZW91dCk7XG5cbiAgICBpZiAocGVuZGluZ1RpbWVyLnByb21pc2UpXG4gICAgICBwZW5kaW5nVGltZXIucHJvbWlzZS5jYW5jZWwoKTtcbiAgfVxuXG4gIGNsZWFyQWxsRGVib3VuY2VzKCkge1xuICAgIGxldCBkZWJvdW5jZVRpbWVycyAgPSB0aGlzLmRlYm91bmNlVGltZXJzIHx8IHt9O1xuICAgIGxldCBpZHMgICAgICAgICAgICAgPSBPYmplY3Qua2V5cyhkZWJvdW5jZVRpbWVycyk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBpZHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICAgIHRoaXMuY2xlYXJEZWJvdW5jZShpZHNbaV0pO1xuICB9XG5cbiAgZ2V0RWxlbWVudERhdGEoZWxlbWVudCkge1xuICAgIGxldCBkYXRhID0gZWxlbWVudERhdGFDYWNoZS5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICBkYXRhID0ge307XG4gICAgICBlbGVtZW50RGF0YUNhY2hlLnNldChlbGVtZW50LCBkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIG1lbW9pemUoZnVuYykge1xuICAgIGxldCBjYWNoZUlEO1xuICAgIGxldCBjYWNoZWRSZXN1bHQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgbGV0IG5ld0NhY2hlSUQgPSBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKC4uLmFyZ3MpO1xuICAgICAgaWYgKG5ld0NhY2hlSUQgIT09IGNhY2hlSUQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cbiAgICAgICAgY2FjaGVJRCA9IG5ld0NhY2hlSUQ7XG4gICAgICAgIGNhY2hlZFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZFJlc3VsdDtcbiAgICB9O1xuICB9XG5cbiAgdG9UZXJtKHRlcm0pIHtcbiAgICBpZiAoKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLmlzSmliaXNoKSh0ZXJtKSkge1xuICAgICAgbGV0IGppYiA9ICgwLF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXy5jb25zdHJ1Y3RKaWIpKHRlcm0pO1xuXG4gICAgICBpZiAoamliLlR5cGUgPT09IFRlcm0pXG4gICAgICAgIHJldHVybiB0ZXJtO1xuXG4gICAgICBpZiAoamliLlR5cGUgJiYgamliLlR5cGVbVEVSTV9DT01QT05FTlRfVFlQRV9DSEVDS10pXG4gICAgICAgIHJldHVybiB0ZXJtO1xuXG4gICAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLiQpKFRlcm0sIGppYi5wcm9wcykoLi4uamliLmNoaWxkcmVuKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXJtID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuICgwLF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXy4kKShUZXJtKSh0ZXJtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGVybTtcbiAgfVxufVxuXG5jb25zdCBURVJNX0NPTVBPTkVOVF9UWVBFX0NIRUNLID0gU3ltYm9sLmZvcignQGppYnMvaXNUZXJtJyk7XG5cbmNsYXNzIFRlcm0gZXh0ZW5kcyBDb21wb25lbnQge1xuICByZXNvbHZlVGVybShhcmdzKSB7XG4gICAgbGV0IHRlcm1SZXNvbHZlciA9IHRoaXMuY29udGV4dC5fdGVybVJlc29sdmVyO1xuICAgIGlmICh0eXBlb2YgdGVybVJlc29sdmVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIHRlcm1SZXNvbHZlci5jYWxsKHRoaXMsIGFyZ3MpO1xuXG4gICAgbGV0IGNoaWxkcmVuID0gKGFyZ3MuY2hpbGRyZW4gfHwgW10pO1xuICAgIHJldHVybiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSB8fCAnJztcbiAgfVxuXG4gIHJlbmRlcihjaGlsZHJlbikge1xuICAgIGxldCB0ZXJtID0gdGhpcy5yZXNvbHZlVGVybSh7IGNoaWxkcmVuLCBwcm9wczogdGhpcy5wcm9wcyB9KTtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLiQpKCdTUEFOJywgdGhpcy5wcm9wcykodGVybSk7XG4gIH1cbn1cblxuVGVybVtURVJNX0NPTVBPTkVOVF9UWVBFX0NIRUNLXSA9IHRydWU7XG5cblxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL2V2ZW50cy5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvZXZlbnRzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJFdmVudEVtaXR0ZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gRXZlbnRFbWl0dGVyKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG5jb25zdCBFVkVOVF9MSVNURU5FUlMgPSBTeW1ib2wuZm9yKCdAamlicy9ldmVudHMvbGlzdGVuZXJzJyk7XG5cbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgIFtFVkVOVF9MSVNURU5FUlNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbmV3IE1hcCgpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXZlbnQgbGlzdGVuZXIgbXVzdCBiZSBhIG1ldGhvZCcpO1xuXG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG5cbiAgICBpZiAoIXNjb3BlKSB7XG4gICAgICBzY29wZSA9IFtdO1xuICAgICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgc2NvcGUpO1xuICAgIH1cblxuICAgIHNjb3BlLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V2ZW50IGxpc3RlbmVyIG11c3QgYmUgYSBtZXRob2QnKTtcblxuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGxldCBpbmRleCA9IHNjb3BlLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKVxuICAgICAgc2NvcGUuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgaWYgKCFldmVudE1hcC5oYXMoZXZlbnROYW1lKSlcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgW10pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBlbWl0KGV2ZW50TmFtZSwgLi4uYXJncykge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUgfHwgc2NvcGUubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gc2NvcGUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGV2ZW50Q2FsbGJhY2sgPSBzY29wZVtpXTtcbiAgICAgIGV2ZW50Q2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvbmNlKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBsZXQgZnVuYyA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLm9mZihldmVudE5hbWUsIGZ1bmMpO1xuICAgICAgcmV0dXJuIGxpc3RlbmVyKC4uLmFyZ3MpO1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5vbihldmVudE5hbWUsIGZ1bmMpO1xuICB9XG5cbiAgb24oZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgb2ZmKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIGV2ZW50TmFtZXMoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpc1tFVkVOVF9MSVNURU5FUlNdLmtleXMoKSk7XG4gIH1cblxuICBsaXN0ZW5lckNvdW50KGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gMDtcblxuICAgIHJldHVybiBzY29wZS5sZW5ndGg7XG4gIH1cblxuICBsaXN0ZW5lcnMoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiBbXTtcblxuICAgIHJldHVybiBzY29wZS5zbGljZSgpO1xuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvamliLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9qaWIuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIiRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gJCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX0JBUlJFTlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBKSUJfQkFSUkVOKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKSUJfQ0hJTERfSU5ERVhfUFJPUFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBKSUJfQ0hJTERfSU5ERVhfUFJPUCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX1BST1hZXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9QUk9YWSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX1JBV19URVhUXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9SQVdfVEVYVCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSmliXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEppYiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiY29uc3RydWN0SmliXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGNvbnN0cnVjdEppYiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmFjdG9yeVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBmYWN0b3J5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc0ppYmlzaFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc0ppYmlzaCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwicmVzb2x2ZUNoaWxkcmVuXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIHJlc29sdmVDaGlsZHJlbilcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbHMuanMgKi8gXCIuL2xpYi91dGlscy5qc1wiKTtcblxuXG5cbmNsYXNzIEppYiB7XG4gIGNvbnN0cnVjdG9yKFR5cGUsIHByb3BzLCBjaGlsZHJlbikge1xuICAgIGxldCBkZWZhdWx0UHJvcHMgPSAoVHlwZSAmJiBUeXBlLnByb3BzKSA/IFR5cGUucHJvcHMgOiB7fTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUeXBlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFR5cGUsXG4gICAgICB9LFxuICAgICAgJ3Byb3BzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHsgW0pJQl9DSElMRF9JTkRFWF9QUk9QXTogMCwgLi4uZGVmYXVsdFByb3BzLCAuLi4ocHJvcHMgfHwge30pIH0sXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmZsYXR0ZW5BcnJheShjaGlsZHJlbiksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbmNvbnN0IEpJQl9CQVJSRU4gICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMuYmFycmVuJyk7XG5jb25zdCBKSUJfUFJPWFkgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLnByb3h5Jyk7XG5jb25zdCBKSUJfUkFXX1RFWFQgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLnJhd1RleHQnKTtcbmNvbnN0IEpJQiAgICAgICAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMuamliJyk7XG5jb25zdCBKSUJfQ0hJTERfSU5ERVhfUFJPUCA9IFN5bWJvbC5mb3IoJ0BqaWJzLmNoaWxkSW5kZXhQcm9wJyk7XG5cbmZ1bmN0aW9uIGZhY3RvcnkoSmliQ2xhc3MpIHtcbiAgZnVuY3Rpb24gJChfdHlwZSwgcHJvcHMgPSB7fSkge1xuICAgIGlmIChpc0ppYmlzaChfdHlwZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWNlaXZlZCBhIGppYiBidXQgZXhwZWN0ZWQgYSBjb21wb25lbnQuJyk7XG5cbiAgICBsZXQgVHlwZSA9IChfdHlwZSA9PSBudWxsKSA/IEpJQl9QUk9YWSA6IF90eXBlO1xuXG4gICAgZnVuY3Rpb24gYmFycmVuKC4uLl9jaGlsZHJlbikge1xuICAgICAgbGV0IGNoaWxkcmVuID0gX2NoaWxkcmVuO1xuXG4gICAgICBmdW5jdGlvbiBqaWIoKSB7XG4gICAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKFR5cGUsICdwcm9taXNlJykgfHwgY2hpbGRyZW4uc29tZSgoY2hpbGQpID0+IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoY2hpbGQsICdwcm9taXNlJykpKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsgVHlwZSBdLmNvbmNhdChjaGlsZHJlbikpLnRoZW4oKGFsbCkgPT4ge1xuICAgICAgICAgICAgVHlwZSA9IGFsbFswXTtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYWxsLnNsaWNlKDEpO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEppYkNsYXNzKFxuICAgICAgICAgICAgICBUeXBlLFxuICAgICAgICAgICAgICBwcm9wcyxcbiAgICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBKaWJDbGFzcyhcbiAgICAgICAgICBUeXBlLFxuICAgICAgICAgIHByb3BzLFxuICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhqaWIsIHtcbiAgICAgICAgW0pJQl06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIFtkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmlkU3ltXToge1xuICAgICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgKCkgPT4gVHlwZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gamliO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGJhcnJlbiwge1xuICAgICAgW0pJQl9CQVJSRU5dOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBbZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5pZFN5bV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICAoKSA9PiBUeXBlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBiYXJyZW47XG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcygkLCB7XG4gICAgJ3JlbWFwJzoge1xuICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgdmFsdWU6ICAgICAgICAoX2ppYiwgY2FsbGJhY2spID0+IHtcbiAgICAgICAgbGV0IGppYiA9IF9qaWI7XG4gICAgICAgIGlmIChqaWIgPT0gbnVsbCB8fCBPYmplY3QuaXMoamliLCBJbmZpbml0eSkgfHwgT2JqZWN0LmlzKGppYiwgTmFOKSlcbiAgICAgICAgICByZXR1cm4gamliO1xuXG4gICAgICAgIGlmIChpc0ppYmlzaChqaWIpKVxuICAgICAgICAgIGppYiA9IGNvbnN0cnVjdEppYihqaWIpO1xuXG4gICAgICAgIGNvbnN0IGZpbmFsaXplTWFwID0gKF9tYXBwZWRKaWIpID0+IHtcbiAgICAgICAgICBsZXQgbWFwcGVkSmliID0gX21hcHBlZEppYjtcblxuICAgICAgICAgIGlmIChpc0ppYmlzaChtYXBwZWRKaWIpKVxuICAgICAgICAgICAgbWFwcGVkSmliID0gY29uc3RydWN0SmliKG1hcHBlZEppYik7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIG1hcHBlZEppYjtcblxuICAgICAgICAgIHJldHVybiAkKG1hcHBlZEppYi5UeXBlLCBtYXBwZWRKaWIucHJvcHMpKC4uLihtYXBwZWRKaWIuY2hpbGRyZW4gfHwgW10pKTtcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgbWFwcGVkSmliID0gY2FsbGJhY2soamliKTtcbiAgICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YobWFwcGVkSmliLCAncHJvbWlzZScpKVxuICAgICAgICAgIHJldHVybiBtYXBwZWRKaWIudGhlbihmaW5hbGl6ZU1hcCk7XG5cbiAgICAgICAgcmV0dXJuIGZpbmFsaXplTWFwKG1hcHBlZEppYik7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiAkO1xufVxuXG5jb25zdCAkID0gZmFjdG9yeShKaWIpO1xuXG5mdW5jdGlvbiBpc0ppYmlzaCh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmICh2YWx1ZVtKSUJfQkFSUkVOXSB8fCB2YWx1ZVtKSUJdKSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBKaWIpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RKaWIodmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSmliKVxuICAgIHJldHVybiB2YWx1ZTtcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKHZhbHVlW0pJQl9CQVJSRU5dKVxuICAgICAgcmV0dXJuIHZhbHVlKCkoKTtcbiAgICBlbHNlIGlmICh2YWx1ZVtKSUJdKVxuICAgICAgcmV0dXJuIHZhbHVlKCk7XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdjb25zdHJ1Y3RKaWI6IFByb3ZpZGVkIHZhbHVlIGlzIG5vdCBhIEppYi4nKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUNoaWxkcmVuKF9jaGlsZHJlbikge1xuICBsZXQgY2hpbGRyZW4gPSBfY2hpbGRyZW47XG5cbiAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoY2hpbGRyZW4sICdwcm9taXNlJykpXG4gICAgY2hpbGRyZW4gPSBhd2FpdCBjaGlsZHJlbjtcblxuICBpZiAoISgodGhpcy5pc0l0ZXJhYmxlQ2hpbGQgfHwgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXNJdGVyYWJsZUNoaWxkKS5jYWxsKHRoaXMsIGNoaWxkcmVuKSkgJiYgKGlzSmliaXNoKGNoaWxkcmVuKSB8fCAoKHRoaXMuaXNWYWxpZENoaWxkIHx8IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmlzVmFsaWRDaGlsZCkuY2FsbCh0aGlzLCBjaGlsZHJlbikpKSlcbiAgICBjaGlsZHJlbiA9IFsgY2hpbGRyZW4gXTtcblxuICBsZXQgcHJvbWlzZXMgPSBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pdGVyYXRlKGNoaWxkcmVuLCBhc3luYyAoeyB2YWx1ZTogX2NoaWxkIH0pID0+IHtcbiAgICBsZXQgY2hpbGQgPSAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaW5zdGFuY2VPZihfY2hpbGQsICdwcm9taXNlJykpID8gYXdhaXQgX2NoaWxkIDogX2NoaWxkO1xuXG4gICAgaWYgKGlzSmliaXNoKGNoaWxkKSlcbiAgICAgIHJldHVybiBhd2FpdCBjb25zdHJ1Y3RKaWIoY2hpbGQpO1xuICAgIGVsc2VcbiAgICAgIHJldHVybiBjaGlsZDtcbiAgfSk7XG5cbiAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9yZW5kZXJlcnMvaW5kZXguanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3JlbmRlcmVycy9pbmRleC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ09OVEVYVF9JRFwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiRk9SQ0VfUkVGTE9XXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEZPUkNFX1JFRkxPVyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUmVuZGVyZXJcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX3JlbmRlcmVyX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uUmVuZGVyZXIpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJvb3ROb2RlXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5Sb290Tm9kZSlcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcm9vdC1ub2RlLmpzICovIFwiLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfcmVuZGVyZXJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcmVuZGVyZXIuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcmVuZGVyZXIuanNcIik7XG5cblxuY29uc3QgRk9SQ0VfUkVGTE9XID0gU3ltYm9sLmZvcignQGppYnNGb3JjZVJlZmxvdycpO1xuXG5cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9yZW5kZXJlcnMvcmVuZGVyZXIuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3JlbmRlcmVycy9yZW5kZXJlci5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUmVuZGVyZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUmVuZGVyZXIpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3Jvb3Qtbm9kZS5qcyAqLyBcIi4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanNcIik7XG5cblxuY29uc3QgSU5JVElBTF9DT05URVhUX0lEID0gMW47XG5sZXQgX2NvbnRleHRJRENvdW50ZXIgPSBJTklUSUFMX0NPTlRFWFRfSUQ7XG5cbmNsYXNzIFJlbmRlcmVyIGV4dGVuZHMgX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3ROb2RlIHtcbiAgc3RhdGljIFJvb3ROb2RlID0gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLlJvb3ROb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICBzdXBlcihudWxsLCBudWxsLCBudWxsKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdvcHRpb25zJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG9wdGlvbnMgfHwge30sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy5yZW5kZXJlciA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudGVybVJlc29sdmVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgdGhpcy5jb250ZXh0Ll90ZXJtUmVzb2x2ZXIgPSBvcHRpb25zLnRlcm1SZXNvbHZlcjtcbiAgfVxuXG4gIGdldE9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucztcbiAgfVxuXG4gIHJlc29sdmVUZXJtKGFyZ3MpIHtcbiAgICBsZXQgeyB0ZXJtUmVzb2x2ZXIgfSA9IHRoaXMuZ2V0T3B0aW9ucygpO1xuICAgIGlmICh0eXBlb2YgdGVybVJlc29sdmVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIHRlcm1SZXNvbHZlci5jYWxsKHRoaXMsIGFyZ3MpO1xuXG4gICAgbGV0IGNoaWxkcmVuID0gKGFyZ3MuY2hpbGRyZW4gfHwgW10pO1xuICAgIHJldHVybiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSB8fCAnJztcbiAgfVxuXG4gIGNyZWF0ZUNvbnRleHQocm9vdENvbnRleHQsIG9uVXBkYXRlLCBvblVwZGF0ZVRoaXMpIHtcbiAgICBsZXQgY29udGV4dCAgICAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBteUNvbnRleHRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRF0gOiBJTklUSUFMX0NPTlRFWFRfSUQ7XG5cbiAgICByZXR1cm4gbmV3IFByb3h5KGNvbnRleHQsIHtcbiAgICAgIGdldDogKHRhcmdldCwgcHJvcE5hbWUpID0+IHtcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRCkge1xuICAgICAgICAgIGxldCBwYXJlbnRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRF0gOiBJTklUSUFMX0NPTlRFWFRfSUQ7XG4gICAgICAgICAgcmV0dXJuIChwYXJlbnRJRCA+IG15Q29udGV4dElEKSA/IHBhcmVudElEIDogbXlDb250ZXh0SUQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIHByb3BOYW1lKSlcbiAgICAgICAgICByZXR1cm4gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W3Byb3BOYW1lXSA6IHVuZGVmaW5lZDtcblxuICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BOYW1lXTtcbiAgICAgIH0sXG4gICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAocHJvcE5hbWUgPT09IF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5DT05URVhUX0lEKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGlmICh0YXJnZXRbcHJvcE5hbWVdID09PSB2YWx1ZSlcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBteUNvbnRleHRJRCA9ICsrX2NvbnRleHRJRENvdW50ZXI7XG4gICAgICAgIHRhcmdldFtwcm9wTmFtZV0gPSB2YWx1ZTtcblxuICAgICAgICBpZiAodHlwZW9mIG9uVXBkYXRlID09PSAnZnVuY3Rpb24nKVxuICAgICAgICAgIG9uVXBkYXRlLmNhbGwob25VcGRhdGVUaGlzLCBvblVwZGF0ZVRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqLyAoKF9fdW51c2VkX3dlYnBhY2tfX193ZWJwYWNrX21vZHVsZV9fLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSA9PiB7XG5cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ09OVEVYVF9JRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBDT05URVhUX0lEKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSb290Tm9kZVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBSb290Tm9kZSlcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4uL3V0aWxzLmpzICovIFwiLi9saWIvdXRpbHMuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi4vamliLmpzICovIFwiLi9saWIvamliLmpzXCIpO1xuXG5cblxuXG5jb25zdCBDT05URVhUX0lEID0gU3ltYm9sLmZvcignQGppYnMvbm9kZS9jb250ZXh0SUQnKTtcblxuY2xhc3MgUm9vdE5vZGUge1xuICBzdGF0aWMgQ09OVEVYVF9JRCA9IENPTlRFWFRfSUQ7XG5cbiAgY29uc3RydWN0b3IocmVuZGVyZXIsIHBhcmVudE5vZGUsIF9jb250ZXh0LCBqaWIpIHtcbiAgICBsZXQgY29udGV4dCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5jb25zdHJ1Y3Rvci5IQVNfQ09OVEVYVCAhPT0gZmFsc2UgJiYgKHJlbmRlcmVyIHx8IHRoaXMuY3JlYXRlQ29udGV4dCkpIHtcbiAgICAgIGNvbnRleHQgPSAocmVuZGVyZXIgfHwgdGhpcykuY3JlYXRlQ29udGV4dChcbiAgICAgICAgX2NvbnRleHQsXG4gICAgICAgICh0aGlzLm9uQ29udGV4dFVwZGF0ZSkgPyB0aGlzLm9uQ29udGV4dFVwZGF0ZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgdGhpcyxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ1RZUEUnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4gdGhpcy5jb25zdHJ1Y3Rvci5UWVBFLFxuICAgICAgICBzZXQ6ICAgICAgICAgICgpID0+IHt9LCAvLyBOT09QXG4gICAgICB9LFxuICAgICAgJ2lkJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmdlbmVyYXRlVVVJRCgpLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJlcic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcmVuZGVyZXIsXG4gICAgICB9LFxuICAgICAgJ3BhcmVudE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHBhcmVudE5vZGUsXG4gICAgICB9LFxuICAgICAgJ2NoaWxkTm9kZXMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG5ldyBNYXAoKSxcbiAgICAgIH0sXG4gICAgICAnY29udGV4dCc6IHtcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAgICAgICAgICAoKSA9PiB7fSxcbiAgICAgIH0sXG4gICAgICAnZGVzdHJveWluZyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgZmFsc2UsXG4gICAgICB9LFxuICAgICAgJ3JlbmRlclByb21pc2UnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ3JlbmRlckZyYW1lJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICAwLFxuICAgICAgfSxcbiAgICAgICdqaWInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYixcbiAgICAgIH0sXG4gICAgICAnbmF0aXZlRWxlbWVudCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICByZXNvbHZlQ2hpbGRyZW4oY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLnJlc29sdmVDaGlsZHJlbi5jYWxsKHRoaXMsIGNoaWxkcmVuKTtcbiAgfVxuXG4gIGlzSmliKHZhbHVlKSB7XG4gICAgcmV0dXJuICgwLF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pc0ppYmlzaCkodmFsdWUpO1xuICB9XG5cbiAgY29uc3RydWN0SmliKHZhbHVlKSB7XG4gICAgcmV0dXJuICgwLF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5jb25zdHJ1Y3RKaWIpKHZhbHVlKTtcbiAgfVxuXG4gIGdldENhY2hlS2V5KCkge1xuICAgIGxldCB7IFR5cGUsIHByb3BzIH0gPSAodGhpcy5qaWIgfHwge30pO1xuICAgIGxldCBjYWNoZUtleSA9IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oVHlwZSwgcHJvcHMua2V5KTtcblxuICAgIHJldHVybiBjYWNoZUtleTtcbiAgfVxuXG4gIHVwZGF0ZUppYihuZXdKaWIpIHtcbiAgICB0aGlzLmppYiA9IG5ld0ppYjtcbiAgfVxuXG4gIGNsZWFyQ2hpbGRyZW4oKSB7XG4gICAgdGhpcy5jaGlsZE5vZGVzLmNsZWFyKCk7XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZE5vZGUpIHtcbiAgICBsZXQgY2FjaGVLZXkgPSBjaGlsZE5vZGUuZ2V0Q2FjaGVLZXkoKTtcbiAgICB0aGlzLmNoaWxkTm9kZXMuZGVsZXRlKGNhY2hlS2V5KTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkTm9kZSwgX2NhY2hlS2V5KSB7XG4gICAgbGV0IGNhY2hlS2V5ID0gKF9jYWNoZUtleSkgPyBfY2FjaGVLZXkgOiBjaGlsZE5vZGUuZ2V0Q2FjaGVLZXkoKTtcbiAgICB0aGlzLmNoaWxkTm9kZXMuc2V0KGNhY2hlS2V5LCBjaGlsZE5vZGUpO1xuICB9XG5cbiAgZ2V0Q2hpbGQoY2FjaGVLZXkpIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZE5vZGVzLmdldChjYWNoZUtleSk7XG4gIH1cblxuICBnZXRDaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZE5vZGVzO1xuICB9XG5cbiAgZ2V0VGhpc05vZGVPckNoaWxkTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRDaGlsZHJlbk5vZGVzKCkge1xuICAgIGxldCBjaGlsZE5vZGVzID0gW107XG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHRoaXMuY2hpbGROb2Rlcy52YWx1ZXMoKSlcbiAgICAgIGNoaWxkTm9kZXMgPSBjaGlsZE5vZGVzLmNvbmNhdChjaGlsZE5vZGUuZ2V0VGhpc05vZGVPckNoaWxkTm9kZXMoKSk7XG5cbiAgICByZXR1cm4gY2hpbGROb2Rlcy5maWx0ZXIoQm9vbGVhbik7XG4gIH1cblxuICBhc3luYyBkZXN0cm95KGZvcmNlKSB7XG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMucmVuZGVyUHJvbWlzZSlcbiAgICAgIGF3YWl0IHRoaXMucmVuZGVyUHJvbWlzZTtcblxuICAgIGF3YWl0IHRoaXMuZGVzdHJveUZyb21ET00odGhpcy5jb250ZXh0LCB0aGlzKTtcblxuICAgIGxldCBkZXN0cm95UHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBjaGlsZE5vZGUgb2YgdGhpcy5jaGlsZE5vZGVzLnZhbHVlcygpKVxuICAgICAgZGVzdHJveVByb21pc2VzLnB1c2goY2hpbGROb2RlLmRlc3Ryb3koKSk7XG5cbiAgICB0aGlzLmNoaWxkTm9kZXMuY2xlYXIoKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChkZXN0cm95UHJvbWlzZXMpO1xuXG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLnBhcmVudE5vZGUgPSBudWxsO1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgdGhpcy5qaWIgPSBudWxsO1xuICB9XG5cbiAgaXNWYWxpZENoaWxkKGNoaWxkKSB7XG4gICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmlzVmFsaWRDaGlsZChjaGlsZCk7XG4gIH1cblxuICBpc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpIHtcbiAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXNJdGVyYWJsZUNoaWxkKGNoaWxkKTtcbiAgfVxuXG4gIHByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpIHtcbiAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18ucHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cyk7XG4gIH1cblxuICBjaGlsZHJlbkRpZmZlcihvbGRDaGlsZHJlbiwgbmV3Q2hpbGRyZW4pIHtcbiAgICByZXR1cm4gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uY2hpbGRyZW5EaWZmZXIob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlciguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLl9yZW5kZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IHRoaXMuX3JlbmRlciguLi5hcmdzKVxuICAgICAgICAudGhlbihhc3luYyAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgaWYgKHJlbmRlckZyYW1lID49IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcblxuICAgICAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZW5kZXJQcm9taXNlO1xuICB9XG5cbiAgZ2V0UGFyZW50SUQoKSB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gdGhpcy5wYXJlbnROb2RlLmlkO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveUZyb21ET00oY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLmRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpO1xuICB9XG5cbiAgYXN5bmMgc3luY0RPTShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCF0aGlzLnJlbmRlcmVyKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucmVuZGVyZXIuc3luY0RPTShjb250ZXh0LCBub2RlKTtcbiAgfVxufVxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL3V0aWxzLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbGliL3V0aWxzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImJpbmRNZXRob2RzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGJpbmRNZXRob2RzKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJjaGlsZHJlbkRpZmZlclwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBjaGlsZHJlbkRpZmZlciksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmV0Y2hEZWVwUHJvcGVydHlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gZmV0Y2hEZWVwUHJvcGVydHkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImZsYXR0ZW5BcnJheVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBmbGF0dGVuQXJyYXkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImdlbmVyYXRlVVVJRFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBnZW5lcmF0ZVVVSUQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImluc3RhbmNlT2ZcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaW5zdGFuY2VPZiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaXNFbXB0eVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc0VtcHR5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc0l0ZXJhYmxlQ2hpbGRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXNJdGVyYWJsZUNoaWxkKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc05vdEVtcHR5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzTm90RW1wdHkpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzVmFsaWRDaGlsZFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc1ZhbGlkQ2hpbGQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIml0ZXJhdGVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXRlcmF0ZSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwibm93XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIG5vdyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwicHJvcHNEaWZmZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gcHJvcHNEaWZmZXIpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcInNpemVPZlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBzaXplT2YpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgZGVhZGJlZWYgKi8gXCIuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanNcIik7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby1tYWdpYy1udW1iZXJzICovXG5cblxuY29uc3QgU1RPUCA9IFN5bWJvbC5mb3IoJ0BqaWJzSXRlcmF0ZVN0b3AnKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5lc3RlZC10ZXJuYXJ5XG5jb25zdCBnbG9iYWxTY29wZSA9ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgPyBnbG9iYWwgOiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuXG5sZXQgdXVpZCA9IDEwMDAwMDA7XG5cbmZ1bmN0aW9uIGluc3RhbmNlT2Yob2JqKSB7XG4gIGZ1bmN0aW9uIHRlc3RUeXBlKG9iaiwgX3ZhbCkge1xuICAgIGZ1bmN0aW9uIGlzRGVmZXJyZWRUeXBlKG9iaikge1xuICAgICAgaWYgKG9iaiBpbnN0YW5jZW9mIFByb21pc2UgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1Byb21pc2UnKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIFF1YWNrIHF1YWNrLi4uXG4gICAgICBpZiAodHlwZW9mIG9iai50aGVuID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBvYmouY2F0Y2ggPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHZhbCAgICAgPSBfdmFsO1xuICAgIGxldCB0eXBlT2YgID0gKHR5cGVvZiBvYmopO1xuXG4gICAgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU3RyaW5nKVxuICAgICAgdmFsID0gJ3N0cmluZyc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5OdW1iZXIpXG4gICAgICB2YWwgPSAnbnVtYmVyJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJvb2xlYW4pXG4gICAgICB2YWwgPSAnYm9vbGVhbic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5GdW5jdGlvbilcbiAgICAgIHZhbCA9ICdmdW5jdGlvbic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5BcnJheSlcbiAgICAgIHZhbCA9ICdhcnJheSc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5PYmplY3QpXG4gICAgICB2YWwgPSAnb2JqZWN0JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlByb21pc2UpXG4gICAgICB2YWwgPSAncHJvbWlzZSc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5CaWdJbnQpXG4gICAgICB2YWwgPSAnYmlnaW50JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk1hcClcbiAgICAgIHZhbCA9ICdtYXAnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuV2Vha01hcClcbiAgICAgIHZhbCA9ICd3ZWFrbWFwJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlNldClcbiAgICAgIHZhbCA9ICdzZXQnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU3ltYm9sKVxuICAgICAgdmFsID0gJ3N5bWJvbCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5CdWZmZXIpXG4gICAgICB2YWwgPSAnYnVmZmVyJztcblxuICAgIGlmICh2YWwgPT09ICdidWZmZXInICYmIGdsb2JhbFNjb3BlLkJ1ZmZlciAmJiBnbG9iYWxTY29wZS5CdWZmZXIuaXNCdWZmZXIob2JqKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ251bWJlcicgJiYgKHR5cGVPZiA9PT0gJ251bWJlcicgfHwgb2JqIGluc3RhbmNlb2YgTnVtYmVyIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdOdW1iZXInKSkpIHtcbiAgICAgIGlmICghaXNGaW5pdGUob2JqKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodmFsICE9PSAnb2JqZWN0JyAmJiB2YWwgPT09IHR5cGVPZilcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmICgob2JqLmNvbnN0cnVjdG9yID09PSBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSkpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAvLyBOdWxsIHByb3RvdHlwZSBvbiBvYmplY3RcbiAgICAgIGlmICh0eXBlT2YgPT09ICdvYmplY3QnICYmICFvYmouY29uc3RydWN0b3IpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHZhbCA9PT0gJ2FycmF5JyAmJiAoQXJyYXkuaXNBcnJheShvYmopIHx8IG9iaiBpbnN0YW5jZW9mIEFycmF5IHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdBcnJheScpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKCh2YWwgPT09ICdwcm9taXNlJyB8fCB2YWwgPT09ICdkZWZlcnJlZCcpICYmIGlzRGVmZXJyZWRUeXBlKG9iaikpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdzdHJpbmcnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5TdHJpbmcgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1N0cmluZycpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2Jvb2xlYW4nICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5Cb29sZWFuIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdCb29sZWFuJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnbWFwJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuTWFwIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdNYXAnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICd3ZWFrbWFwJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuV2Vha01hcCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnV2Vha01hcCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3NldCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLlNldCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2V0JykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnZnVuY3Rpb24nICYmIHR5cGVPZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicgJiYgb2JqIGluc3RhbmNlb2YgdmFsKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycgJiYgb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB2YWwpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChvYmogPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICh0ZXN0VHlwZShvYmosIGFyZ3VtZW50c1tpXSkgPT09IHRydWUpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cykge1xuICBpZiAob2xkUHJvcHMgPT09IG5ld1Byb3BzKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIG9sZFByb3BzICE9PSB0eXBlb2YgbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKCFvbGRQcm9wcyAmJiBuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAob2xkUHJvcHMgJiYgIW5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcbiAgaWYgKCFvbGRQcm9wcyAmJiAhbmV3UHJvcHMgJiYgb2xkUHJvcHMgIT0gb2xkUHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgbGV0IGFLZXlzID0gT2JqZWN0LmtleXMob2xkUHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9sZFByb3BzKSk7XG4gIGxldCBiS2V5cyA9IE9iamVjdC5rZXlzKG5ld1Byb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhuZXdQcm9wcykpO1xuXG4gIGlmIChhS2V5cy5sZW5ndGggIT09IGJLZXlzLmxlbmd0aClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhS2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGFLZXkgPSBhS2V5c1tpXTtcbiAgICBpZiAoc2tpcEtleXMgJiYgc2tpcEtleXMuaW5kZXhPZihhS2V5KSA+PSAwKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAob2xkUHJvcHNbYUtleV0gIT09IG5ld1Byb3BzW2FLZXldKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBsZXQgYktleSA9IGJLZXlzW2ldO1xuICAgIGlmIChza2lwS2V5cyAmJiBza2lwS2V5cy5pbmRleE9mKGJLZXkpKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAoYUtleSA9PT0gYktleSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKG9sZFByb3BzW2JLZXldICE9PSBuZXdQcm9wc1tiS2V5XSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBzaXplT2YodmFsdWUpIHtcbiAgaWYgKCF2YWx1ZSlcbiAgICByZXR1cm4gMDtcblxuICBpZiAoT2JqZWN0LmlzKEluZmluaXR5KSlcbiAgICByZXR1cm4gMDtcblxuICBpZiAodHlwZW9mIHZhbHVlLmxlbmd0aCA9PT0gJ251bWJlcicpXG4gICAgcmV0dXJuIHZhbHVlLmxlbmd0aDtcblxuICByZXR1cm4gT2JqZWN0LmtleXModmFsdWUpLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gX2l0ZXJhdGUob2JqLCBjYWxsYmFjaykge1xuICBpZiAoIW9iaiB8fCBPYmplY3QuaXMoSW5maW5pdHkpKVxuICAgIHJldHVybiBbXTtcblxuICBsZXQgcmVzdWx0cyAgID0gW107XG4gIGxldCBzY29wZSAgICAgPSB7IGNvbGxlY3Rpb246IG9iaiwgU1RPUCB9O1xuICBsZXQgcmVzdWx0O1xuXG4gIGlmIChBcnJheS5pc0FycmF5KG9iaikpIHtcbiAgICBzY29wZS50eXBlID0gJ0FycmF5JztcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IG9iai5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBzY29wZS52YWx1ZSA9IG9ialtpXTtcbiAgICAgIHNjb3BlLmluZGV4ID0gc2NvcGUua2V5ID0gaTtcblxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICBicmVhaztcblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBvYmouZW50cmllcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChvYmogaW5zdGFuY2VvZiBTZXQgfHwgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTZXQnKSB7XG4gICAgICBzY29wZS50eXBlID0gJ1NldCc7XG5cbiAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICBmb3IgKGxldCBpdGVtIG9mIG9iai52YWx1ZXMoKSkge1xuICAgICAgICBzY29wZS52YWx1ZSA9IGl0ZW07XG4gICAgICAgIHNjb3BlLmtleSA9IGl0ZW07XG4gICAgICAgIHNjb3BlLmluZGV4ID0gaW5kZXgrKztcblxuICAgICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2NvcGUudHlwZSA9IG9iai5jb25zdHJ1Y3Rvci5uYW1lO1xuXG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIChsZXQgWyBrZXksIHZhbHVlIF0gb2Ygb2JqLmVudHJpZXMoKSkge1xuICAgICAgICBzY29wZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICBzY29wZS5rZXkgPSBrZXk7XG4gICAgICAgIHNjb3BlLmluZGV4ID0gaW5kZXgrKztcblxuICAgICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGluc3RhbmNlT2Yob2JqLCAnYm9vbGVhbicsICdudW1iZXInLCAnYmlnaW50JywgJ2Z1bmN0aW9uJykpXG4gICAgICByZXR1cm47XG5cbiAgICBzY29wZS50eXBlID0gKG9iai5jb25zdHJ1Y3RvcikgPyBvYmouY29uc3RydWN0b3IubmFtZSA6ICdPYmplY3QnO1xuXG4gICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGtleSAgID0ga2V5c1tpXTtcbiAgICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuXG4gICAgICBzY29wZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgc2NvcGUua2V5ID0ga2V5O1xuICAgICAgc2NvcGUuaW5kZXggPSBpO1xuXG4gICAgICByZXN1bHQgPSBjYWxsYmFjay5jYWxsKHRoaXMsIHNjb3BlKTtcbiAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgIGJyZWFrO1xuXG4gICAgICByZXN1bHRzLnB1c2gocmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0cztcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoX2l0ZXJhdGUsIHtcbiAgJ1NUT1AnOiB7XG4gICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgdmFsdWU6ICAgICAgICBTVE9QLFxuICB9LFxufSk7XG5cbmNvbnN0IGl0ZXJhdGUgPSBfaXRlcmF0ZTtcblxuZnVuY3Rpb24gY2hpbGRyZW5EaWZmZXIoY2hpbGRyZW4xLCBjaGlsZHJlbjIpIHtcbiAgaWYgKGNoaWxkcmVuMSA9PT0gY2hpbGRyZW4yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBsZXQgcmVzdWx0MSA9ICghQXJyYXkuaXNBcnJheShjaGlsZHJlbjEpKSA/IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oY2hpbGRyZW4xKSA6IGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18oLi4uY2hpbGRyZW4xKTtcbiAgbGV0IHJlc3VsdDIgPSAoIUFycmF5LmlzQXJyYXkoY2hpbGRyZW4yKSkgPyBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKGNoaWxkcmVuMikgOiBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKC4uLmNoaWxkcmVuMik7XG5cbiAgcmV0dXJuIChyZXN1bHQxICE9PSByZXN1bHQyKTtcbn1cblxuZnVuY3Rpb24gZmV0Y2hEZWVwUHJvcGVydHkob2JqLCBfa2V5LCBkZWZhdWx0VmFsdWUsIGxhc3RQYXJ0KSB7XG4gIGlmIChvYmogPT0gbnVsbCB8fCBPYmplY3QuaXMoTmFOLCBvYmopIHx8IE9iamVjdC5pcyhJbmZpbml0eSwgb2JqKSlcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBudWxsIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgaWYgKF9rZXkgPT0gbnVsbCB8fCBPYmplY3QuaXMoTmFOLCBfa2V5KSB8fCBPYmplY3QuaXMoSW5maW5pdHksIF9rZXkpKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIG51bGwgXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBsZXQgcGFydHM7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoX2tleSkpIHtcbiAgICBwYXJ0cyA9IF9rZXk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIF9rZXkgPT09ICdzeW1ib2wnKSB7XG4gICAgcGFydHMgPSBbIF9rZXkgXTtcbiAgfSBlbHNlIHtcbiAgICBsZXQga2V5ICAgICAgICAgPSAoJycgKyBfa2V5KTtcbiAgICBsZXQgbGFzdEluZGV4ICAgPSAwO1xuICAgIGxldCBsYXN0Q3Vyc29yICA9IDA7XG5cbiAgICBwYXJ0cyA9IFtdO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnN0YW50LWNvbmRpdGlvblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBsZXQgaW5kZXggPSBrZXkuaW5kZXhPZignLicsIGxhc3RJbmRleCk7XG4gICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgIHBhcnRzLnB1c2goa2V5LnN1YnN0cmluZyhsYXN0Q3Vyc29yKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoa2V5LmNoYXJBdChpbmRleCAtIDEpID09PSAnXFxcXCcpIHtcbiAgICAgICAgbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcGFydHMucHVzaChrZXkuc3Vic3RyaW5nKGxhc3RDdXJzb3IsIGluZGV4KSk7XG4gICAgICBsYXN0Q3Vyc29yID0gbGFzdEluZGV4ID0gaW5kZXggKyAxO1xuICAgIH1cbiAgfVxuXG4gIGxldCBwYXJ0TiA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuICBpZiAocGFydHMubGVuZ3RoID09PSAwKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIHBhcnROIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgbGV0IGN1cnJlbnRWYWx1ZSA9IG9iajtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGFydHMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBrZXkgPSBwYXJ0c1tpXTtcblxuICAgIGN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZVtrZXldO1xuICAgIGlmIChjdXJyZW50VmFsdWUgPT0gbnVsbClcbiAgICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIHBhcnROIF0gOiBkZWZhdWx0VmFsdWU7XG4gIH1cblxuICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgY3VycmVudFZhbHVlLCBwYXJ0TiBdIDogY3VycmVudFZhbHVlO1xufVxuXG5mdW5jdGlvbiBiaW5kTWV0aG9kcyhfcHJvdG8sIHNraXBQcm90b3MpIHtcbiAgbGV0IHByb3RvICAgICAgICAgICA9IF9wcm90bztcbiAgbGV0IGFscmVhZHlWaXNpdGVkICA9IG5ldyBTZXQoKTtcblxuICB3aGlsZSAocHJvdG8pIHtcbiAgICBsZXQgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhwcm90byk7XG4gICAgbGV0IGtleXMgICAgICAgID0gT2JqZWN0LmtleXMoZGVzY3JpcHRvcnMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGRlc2NyaXB0b3JzKSk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKGtleSA9PT0gJ2NvbnN0cnVjdG9yJylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChhbHJlYWR5VmlzaXRlZC5oYXMoa2V5KSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGFscmVhZHlWaXNpdGVkLmFkZChrZXkpO1xuXG4gICAgICBsZXQgdmFsdWUgPSBwcm90b1trZXldO1xuXG4gICAgICAvLyBTa2lwIHByb3RvdHlwZSBvZiBPYmplY3RcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b3R5cGUtYnVpbHRpbnNcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KGtleSkgJiYgT2JqZWN0LnByb3RvdHlwZVtrZXldID09PSB2YWx1ZSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICB0aGlzW2tleV0gPSB2YWx1ZS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKTtcbiAgICBpZiAocHJvdG8gPT09IE9iamVjdC5wcm90b3R5cGUpXG4gICAgICBicmVhaztcblxuICAgIGlmIChza2lwUHJvdG9zICYmIHNraXBQcm90b3MuaW5kZXhPZihwcm90bykgPj0gMClcbiAgICAgIGJyZWFrO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBOYU4pKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChpbnN0YW5jZU9mKHZhbHVlLCAnc3RyaW5nJykpXG4gICAgcmV0dXJuICEoL1xcUy8pLnRlc3QodmFsdWUpO1xuICBlbHNlIGlmIChpbnN0YW5jZU9mKHZhbHVlLCAnbnVtYmVyJykgJiYgaXNGaW5pdGUodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZiAoIWluc3RhbmNlT2YodmFsdWUsICdib29sZWFuJywgJ2JpZ2ludCcsICdmdW5jdGlvbicpICYmIHNpemVPZih2YWx1ZSkgPT09IDApXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBpc05vdEVtcHR5KHZhbHVlKSB7XG4gIHJldHVybiAhaXNFbXB0eS5jYWxsKHRoaXMsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbkFycmF5KHZhbHVlKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpXG4gICAgcmV0dXJuIHZhbHVlO1xuXG4gIGxldCBuZXdBcnJheSA9IFtdO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGl0ZW0gPSB2YWx1ZVtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSlcbiAgICAgIG5ld0FycmF5ID0gbmV3QXJyYXkuY29uY2F0KGZsYXR0ZW5BcnJheShpdGVtKSk7XG4gICAgZWxzZVxuICAgICAgbmV3QXJyYXkucHVzaChpdGVtKTtcbiAgfVxuXG4gIHJldHVybiBuZXdBcnJheTtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZENoaWxkKGNoaWxkKSB7XG4gIGlmIChjaGlsZCA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIGNoaWxkID09PSAnYm9vbGVhbicpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXMoY2hpbGQsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyhjaGlsZCwgTmFOKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzSXRlcmFibGVDaGlsZChjaGlsZCkge1xuICBpZiAoY2hpbGQgPT0gbnVsbCB8fCBPYmplY3QuaXMoY2hpbGQsIE5hTikgfHwgT2JqZWN0LmlzKGNoaWxkLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiAoQXJyYXkuaXNBcnJheShjaGlsZCkgfHwgdHlwZW9mIGNoaWxkID09PSAnb2JqZWN0JyAmJiAhaW5zdGFuY2VPZihjaGlsZCwgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ3N0cmluZycpKTtcbn1cblxuZnVuY3Rpb24gbm93KCkge1xuICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGVyZm9ybWFuY2Uubm93ID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcbiAgZWxzZVxuICAgIHJldHVybiBEYXRlLm5vdygpO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7XG4gIGlmICh1dWlkID4gOTk5OTk5OSlcbiAgICB1dWlkID0gMTAwMDAwMDtcblxuICByZXR1cm4gYCR7RGF0ZS5ub3coKX0uJHt1dWlkKyt9JHtNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCkudG9TdHJpbmcoKS5wYWRTdGFydCgyMCwgJzAnKX1gO1xufVxuXG5cbi8qKiovIH0pXG5cbi8qKioqKiovIH0pO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIC8vIFRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIHZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcbi8qKioqKiovIFxuLyoqKioqKi8gLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbi8qKioqKiovIGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcbi8qKioqKiovIFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4vKioqKioqLyBcdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuLyoqKioqKi8gXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbi8qKioqKiovIFx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyBcdH1cbi8qKioqKiovIFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbi8qKioqKiovIFx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG4vKioqKioqLyBcdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuLyoqKioqKi8gXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG4vKioqKioqLyBcdFx0ZXhwb3J0czoge31cbi8qKioqKiovIFx0fTtcbi8qKioqKiovIFxuLyoqKioqKi8gXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG4vKioqKioqLyBcbi8qKioqKiovIFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbi8qKioqKiovIFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gfVxuLyoqKioqKi8gXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gLyogd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzICovXG4vKioqKioqLyAoKCkgPT4ge1xuLyoqKioqKi8gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG4vKioqKioqLyBcdFx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuLyoqKioqKi8gXHRcdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG4vKioqKioqLyBcdFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG4vKioqKioqLyBcdFx0XHR9XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHR9O1xuLyoqKioqKi8gfSkoKTtcbi8qKioqKiovIFxuLyoqKioqKi8gLyogd2VicGFjay9ydW50aW1lL2dsb2JhbCAqL1xuLyoqKioqKi8gKCgpID0+IHtcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuLyoqKioqKi8gXHRcdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuLyoqKioqKi8gXHRcdHRyeSB7XG4vKioqKioqLyBcdFx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbi8qKioqKiovIFx0XHR9IGNhdGNoIChlKSB7XG4vKioqKioqLyBcdFx0XHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcpIHJldHVybiB3aW5kb3c7XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHR9KSgpO1xuLyoqKioqKi8gfSkoKTtcbi8qKioqKiovIFxuLyoqKioqKi8gLyogd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCAqL1xuLyoqKioqKi8gKCgpID0+IHtcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKVxuLyoqKioqKi8gfSkoKTtcbi8qKioqKiovIFxuLyoqKioqKi8gLyogd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCAqL1xuLyoqKioqKi8gKCgpID0+IHtcbi8qKioqKiovIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuLyoqKioqKi8gXHRcdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuLyoqKioqKi8gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4vKioqKioqLyBcdH07XG4vKioqKioqLyB9KSgpO1xuLyoqKioqKi8gXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xudmFyIF9fd2VicGFja19leHBvcnRzX18gPSB7fTtcbi8vIFRoaXMgZW50cnkgbmVlZCB0byBiZSB3cmFwcGVkIGluIGFuIElJRkUgYmVjYXVzZSBpdCBuZWVkIHRvIGJlIGlzb2xhdGVkIGFnYWluc3Qgb3RoZXIgbW9kdWxlcyBpbiB0aGUgY2h1bmsuXG4oKCkgPT4ge1xuLyohKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9pbmRleC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKi9cbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgZXhwb3J0ICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCB7XG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiJFwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uJCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiQ29tcG9uZW50XCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5Db21wb25lbnQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNvbXBvbmVudHNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gQ29tcG9uZW50cyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSmlic1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBKaWJzKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSZW5kZXJlcnNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUmVuZGVyZXJzKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJUZXJtXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5UZXJtKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJVdGlsc1wiOiAoKSA9PiAoLyogcmVleHBvcnQgbW9kdWxlIG9iamVjdCAqLyBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZGVhZGJlZWZcIjogKCkgPT4gKC8qIHJlZXhwb3J0IGRlZmF1bHQgZXhwb3J0IGZyb20gbmFtZWQgbW9kdWxlICovIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV80X18pLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImZhY3RvcnlcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmZhY3RvcnkpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2ppYi5qcyAqLyBcIi4vbGliL2ppYi5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2NvbXBvbmVudC5qcyAqLyBcIi4vbGliL2NvbXBvbmVudC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3JlbmRlcmVycy9pbmRleC5qcyAqLyBcIi4vbGliL3JlbmRlcmVycy9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbHMuanMgKi8gXCIuL2xpYi91dGlscy5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfNF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgZGVhZGJlZWYgKi8gXCIuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanNcIik7XG5cblxuY29uc3QgSmlicyA9IHtcbiAgSklCX0JBUlJFTjogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkpJQl9CQVJSRU4sXG4gIEpJQl9QUk9YWTogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkpJQl9QUk9YWSxcbiAgSklCX1JBV19URVhUOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCX1JBV19URVhULFxuICBKSUI6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUIsXG4gIEpJQl9DSElMRF9JTkRFWF9QUk9QOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCX0NISUxEX0lOREVYX1BST1AsXG4gIEppYjogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkppYixcbiAgaXNKaWJpc2g6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5pc0ppYmlzaCxcbiAgY29uc3RydWN0SmliOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uY29uc3RydWN0SmliLFxuICByZXNvbHZlQ2hpbGRyZW46IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5yZXNvbHZlQ2hpbGRyZW4sXG59O1xuXG5cblxuY29uc3QgQ29tcG9uZW50cyA9IHtcbiAgVVBEQVRFX0VWRU5UOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uVVBEQVRFX0VWRU5ULFxuICBRVUVVRV9VUERBVEVfTUVUSE9EOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uUVVFVUVfVVBEQVRFX01FVEhPRCxcbiAgRkxVU0hfVVBEQVRFX01FVEhPRDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkZMVVNIX1VQREFURV9NRVRIT0QsXG4gIElOSVRfTUVUSE9EOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uSU5JVF9NRVRIT0QsXG4gIFNLSVBfU1RBVEVfVVBEQVRFUzogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlNLSVBfU1RBVEVfVVBEQVRFUyxcbiAgUEVORElOR19TVEFURV9VUERBVEU6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5QRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRTogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkxBU1RfUkVOREVSX1RJTUUsXG4gIFBSRVZJT1VTX1NUQVRFOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uUFJFVklPVVNfU1RBVEUsXG59O1xuXG5cblxuY29uc3QgUmVuZGVyZXJzID0ge1xuICBDT05URVhUX0lEOiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uUm9vdE5vZGUuQ09OVEVYVF9JRCxcbiAgRk9SQ0VfUkVGTE9XOiBfcmVuZGVyZXJzX2luZGV4X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uRk9SQ0VfUkVGTE9XLFxuICBSb290Tm9kZTogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJvb3ROb2RlLFxuICBSZW5kZXJlcjogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJlbmRlcmVyLFxufTtcblxuXG5cblxuXG5cbn0pKCk7XG5cbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fJCA9IF9fd2VicGFja19leHBvcnRzX18uJDtcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fQ29tcG9uZW50ID0gX193ZWJwYWNrX2V4cG9ydHNfXy5Db21wb25lbnQ7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX0NvbXBvbmVudHMgPSBfX3dlYnBhY2tfZXhwb3J0c19fLkNvbXBvbmVudHM7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX0ppYnMgPSBfX3dlYnBhY2tfZXhwb3J0c19fLkppYnM7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX1JlbmRlcmVycyA9IF9fd2VicGFja19leHBvcnRzX18uUmVuZGVyZXJzO1xudmFyIF9fd2VicGFja19leHBvcnRzX19UZXJtID0gX193ZWJwYWNrX2V4cG9ydHNfXy5UZXJtO1xudmFyIF9fd2VicGFja19leHBvcnRzX19VdGlscyA9IF9fd2VicGFja19leHBvcnRzX18uVXRpbHM7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX2RlYWRiZWVmID0gX193ZWJwYWNrX2V4cG9ydHNfXy5kZWFkYmVlZjtcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fZmFjdG9yeSA9IF9fd2VicGFja19leHBvcnRzX18uZmFjdG9yeTtcbmV4cG9ydCB7IF9fd2VicGFja19leHBvcnRzX18kIGFzICQsIF9fd2VicGFja19leHBvcnRzX19Db21wb25lbnQgYXMgQ29tcG9uZW50LCBfX3dlYnBhY2tfZXhwb3J0c19fQ29tcG9uZW50cyBhcyBDb21wb25lbnRzLCBfX3dlYnBhY2tfZXhwb3J0c19fSmlicyBhcyBKaWJzLCBfX3dlYnBhY2tfZXhwb3J0c19fUmVuZGVyZXJzIGFzIFJlbmRlcmVycywgX193ZWJwYWNrX2V4cG9ydHNfX1Rlcm0gYXMgVGVybSwgX193ZWJwYWNrX2V4cG9ydHNfX1V0aWxzIGFzIFV0aWxzLCBfX3dlYnBhY2tfZXhwb3J0c19fZGVhZGJlZWYgYXMgZGVhZGJlZWYsIF9fd2VicGFja19leHBvcnRzX19mYWN0b3J5IGFzIGZhY3RvcnkgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lhVzVrWlhndWFuTWlMQ0p0WVhCd2FXNW5jeUk2SWpzN096czdPenM3UVVGQlFUczdRVUZGWVRzN1FVRkZZaXdyUkVGQkswUXNjVUpCUVUwN1FVRkRja1U3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJMSGxEUVVGNVF5eFJRVUZSTzBGQlEycEVMRlZCUVZVc2IwSkJRVzlDTzBGQlF6bENPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRXNjVUpCUVhGQ0xHVkJRV1U3TzBGQlJYQkRPMEZCUTBFN1FVRkRRU3h0UTBGQmJVTXNTVUZCU1N4bFFVRmxMRWxCUVVrN08wRkJSVEZFTzBGQlEwRTdPMEZCUlVFc1kwRkJZeXhQUVVGUExFZEJRVWNzU1VGQlNUdEJRVU0xUWpzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJMR2xDUVVGcFFpeFhRVUZYTEVkQlFVY3NZMEZCWXp0QlFVTTNRenRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzZVVOQlFYbERMRkZCUVZFN1FVRkRha1E3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzZVVOQlFYbERMRkZCUVZFN1FVRkRha1E3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxHMUNRVUZ0UWl4dFFrRkJiVUk3UVVGRGRFTTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4SFFVRkhPMEZCUTBnN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEVkQlFVYzdRVUZEU0R0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzUjBGQlJ6dEJRVU5JTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hIUVVGSE8wRkJRMGdzUTBGQlF6czdRVUZGUkRzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN1FVTXZTRUU3TzBGQlJXZERPMEZCUTFjN1FVRkRSRHRCUVUxNFFqczdRVUZGV0R0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlZBN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUeXgzUWtGQmQwSXNiMFJCUVZrN1FVRkRNME03TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzU1VGQlNTeDFSRUZCYzBJN08wRkJSVEZDT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRXNVMEZCVXp0QlFVTlVPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEZOQlFWTTdRVUZEVkN4UFFVRlBPMEZCUTFBN08wRkJSVUVzZDBWQlFYZEZPMEZCUTNoRk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNjMEpCUVhOQ0xEQkRRVUZUTzBGQlF5OUNMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEhkQ1FVRjNRanRCUVVONFFpeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVTBGQlV6dEJRVU5VTzBGQlEwRTdRVUZEUVN4dlJVRkJiMFVzVFVGQlRUczdRVUZGTVVVN1FVRkRRU3hUUVVGVE8wRkJRMVFzVDBGQlR6dEJRVU5RTEV0QlFVczdRVUZEVERzN1FVRkZRVHRCUVVOQkxGZEJRVmNzZVVSQlFXOUNPMEZCUXk5Q096dEJRVVZCTzBGQlEwRXNWMEZCVnl4cFJFRkJVVHRCUVVOdVFqczdRVUZGUVR0QlFVTkJMRmRCUVZjc2NVUkJRVms3UVVGRGRrSTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRk5CUVZNN1FVRkRWQ3hQUVVGUE8wRkJRMUE3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVN4UlFVRlJMR2xFUVVGblFqdEJRVU40UWp0QlFVTkJPenRCUVVWQkxIZERRVUYzUXl4UlFVRlJPMEZCUTJoRU8wRkJRMEVzYTBOQlFXdERMSGRFUVVGMVFqdEJRVU42UkR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4TlFVRk5PMEZCUTA0c1lVRkJZU3gzUkVGQmRVSTdRVUZEY0VNN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRXNhVVZCUVdsRkxFMUJRVTA3TzBGQlJYWkZPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTEhkRlFVRjNSU3hOUVVGTk96dEJRVVU1UlR0QlFVTkJPMEZCUTBFN1FVRkRRU3hOUVVGTk8wRkJRMDQ3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3h6UTBGQmMwTXNVVUZCVVR0QlFVTTVRenRCUVVOQk8wRkJRMEU3TzBGQlJVRXNWVUZCVlN4cFJFRkJaMEk3UVVGRE1VSXNNa05CUVRKRExHbEVRVUZuUWp0QlFVTXpSQ3cwUTBGQk5FTXNVVUZCVVR0QlFVTndSRHRCUVVOQk8wRkJRMEU3UVVGRFFTeFJRVUZSTzBGQlExSTdRVUZEUVR0QlFVTkJPenRCUVVWQkxHVkJRV1VzYVVSQlFXZENPMEZCUXk5Q096dEJRVVZCTEdsQ1FVRnBRaXhwUkVGQlowSTdRVUZEYWtNc1UwRkJVenM3UVVGRlZDdzBRMEZCTkVNc1VVRkJVVHRCUVVOd1JEdEJRVU5CTzBGQlEwRTdRVUZEUVN4UlFVRlJMRk5CUVZNc2FVUkJRV2RDTzBGQlEycERPMEZCUTBFc01FTkJRVEJETEZGQlFWRTdRVUZEYkVRN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVN4VlFVRlZMR2xFUVVGblFqdEJRVU14UWpzN1FVRkZRVHRCUVVOQkxEaERRVUU0UXl4UlFVRlJPMEZCUTNSRU8wRkJRMEVzWTBGQll5eHBSRUZCWjBJN1FVRkRPVUk3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4WlFVRlpPMEZCUTFvN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRXNVVUZCVVR0QlFVTlNPMEZCUTBFc01FTkJRVEJETEZGQlFWRTdRVUZEYkVRN1FVRkRRVHRCUVVOQk96dEJRVVZCTEdOQlFXTXNhVVJCUVdkQ08wRkJRemxDTzBGQlEwRXNiVUpCUVcxQ0xHbEVRVUZuUWp0QlFVTnVRenRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4WlFVRlpPMEZCUTFvN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3hYUVVGWExHbEVRVUZuUWp0QlFVTXpRanM3UVVGRlFUczdRVUZGUVR0QlFVTkJMSGREUVVGM1F5eFJRVUZSTzBGQlEyaEVPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEV0QlFVczdRVUZEVERzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4M1FrRkJkMEk3UVVGRGVFSXNUMEZCVHp0QlFVTlFPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hQUVVGUE96dEJRVVZRTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVlVGQlZUdEJRVU5XTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFTeHhRMEZCY1VNc1VVRkJVVHRCUVVNM1F6dEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJMSFZDUVVGMVFpeHhRMEZCVVR0QlFVTXZRanRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4UlFVRlJMR2xFUVVGUk8wRkJRMmhDTEdkQ1FVRm5RaXh4UkVGQldUczdRVUZGTlVJN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJMR0ZCUVdFc01FTkJRVU03UVVGRFpDeE5RVUZOTzBGQlEwNHNZVUZCWVN3d1EwRkJRenRCUVVOa096dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJMR3REUVVGclF5dzJRa0ZCTmtJN1FVRkRMMFFzVjBGQlZ5d3dRMEZCUXp0QlFVTmFPMEZCUTBFN08wRkJSVUU3TzBGQlNVVTdPenM3T3pzN096czdPenM3T3p0QlF6bHNRa1k3TzBGQlJVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUN4TFFVRkxPMEZCUTB3N08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQkxIVkRRVUYxUXl4UlFVRlJPMEZCUXk5RE8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenRCUXpkSFowTTdRVUZEU1RzN1FVRkZOMEk3UVVGRFVEdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxIZENRVUYzUWl3eVJFRkJNa1FzUjBGQlJ6dEJRVU4wUml4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeHpRa0ZCYzBJc2JVUkJRV3RDTzBGQlEzaERMRTlCUVU4N1FVRkRVQ3hMUVVGTE8wRkJRMHc3UVVGRFFUczdRVUZGVHp0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlExQXNPRUpCUVRoQ08wRkJRemxDTzBGQlEwRTdPMEZCUlVFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJMRmxCUVZrc2FVUkJRV2RDTERoRFFVRTRReXhwUkVGQlowSTdRVUZETVVZN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hYUVVGWE8wRkJRMWc3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxGTkJRVk03UVVGRFZDeFRRVUZUTERKRFFVRmpPMEZCUTNaQ08wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNVMEZCVXp0QlFVTlVMRTlCUVU4N08wRkJSVkE3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQXNUMEZCVHl3eVEwRkJZenRCUVVOeVFqdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVQ3hMUVVGTE96dEJRVVZNTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzV1VGQldTeHBSRUZCWjBJN1FVRkROVUk3TzBGQlJVRTdRVUZEUVN4UFFVRlBPMEZCUTFBc1MwRkJTenRCUVVOTUxFZEJRVWM3TzBGQlJVZzdRVUZEUVRzN1FVRkZUenM3UVVGRlFUdEJRVU5RTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGVHp0QlFVTlFPenRCUVVWQkxFMUJRVTBzYVVSQlFXZENPMEZCUTNSQ096dEJRVVZCTEdsRFFVRnBReXh6UkVGQmNVSXNlVVZCUVhsRkxHMUVRVUZyUWp0QlFVTnFTanM3UVVGRlFTeHBRa0ZCYVVJc09FTkJRV0VzYjBKQlFXOUNMR1ZCUVdVN1FVRkRha1VzYVVKQlFXbENMR2xFUVVGblFqczdRVUZGYWtNN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeEhRVUZIT3p0QlFVVklPMEZCUTBFN096czdPenM3T3pzN096czdPenM3T3pzN08wRkRja3gzUWpzN1FVRkZha0k3TzBGQlJXdERPenM3T3pzN096czdPenM3T3pzN08wRkRTbXBDT3p0QlFVVjRRanRCUVVOQk96dEJRVVZQTEhWQ1FVRjFRaXh0UkVGQlVUdEJRVU4wUXl4dlFrRkJiMElzYlVSQlFWRTdPMEZCUlRWQ08wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxHMURRVUZ0UXp0QlFVTnVReXhQUVVGUE8wRkJRMUFzUzBGQlN6czdRVUZGVERzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzVlVGQlZTeGxRVUZsTzBGQlEzcENPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hyUkVGQmEwUXNjVVJCUVZVN08wRkJSVFZFTzBGQlEwRTdRVUZEUVN4NVFrRkJlVUlzY1VSQlFWVTdRVUZEYmtNc2NVUkJRWEZFTEhGRVFVRlZPMEZCUXk5RU8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTEhsQ1FVRjVRaXh4UkVGQlZUdEJRVU51UXpzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEU5QlFVODdRVUZEVUN4TFFVRkxPMEZCUTB3N1FVRkRRVHM3T3pzN096czdPenM3T3pzN096czdPenRCUXpORlowTTdRVUZEU3p0QlFVdHNRanM3UVVGRldqczdRVUZGUVR0QlFVTlFPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxEaENRVUU0UWp0QlFVTTVRaXhQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4elFrRkJjMElzYlVSQlFXdENPMEZCUTNoRExFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVTBGQlV6dEJRVU5VTERoQ1FVRTRRanRCUVVNNVFpeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTEV0QlFVczdRVUZEVERzN1FVRkZRVHRCUVVOQkxGZEJRVmNzZVVSQlFXOUNPMEZCUXk5Q096dEJRVVZCTzBGQlEwRXNWMEZCVnl4cFJFRkJVVHRCUVVOdVFqczdRVUZGUVR0QlFVTkJMRmRCUVZjc2NVUkJRVms3UVVGRGRrSTdPMEZCUlVFN1FVRkRRU3hWUVVGVkxHTkJRV01zYVVKQlFXbENPMEZCUTNwRExHMUNRVUZ0UWl4eFEwRkJVVHM3UVVGRk0wSTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJMRmRCUVZjc2JVUkJRV3RDTzBGQlF6ZENPenRCUVVWQk8wRkJRMEVzVjBGQlZ5eHpSRUZCY1VJN1FVRkRhRU03TzBGQlJVRTdRVUZEUVN4WFFVRlhMR3RFUVVGcFFqdEJRVU0xUWpzN1FVRkZRVHRCUVVOQkxGZEJRVmNzY1VSQlFXOUNPMEZCUXk5Q096dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTEZOQlFWTTdRVUZEVkR0QlFVTkJPMEZCUTBFN1FVRkRRU3hUUVVGVE8wRkJRMVFzVFVGQlRUdEJRVU5PTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096dEJRMmhRUVR0QlFVTm5RenM3UVVGRmFFTTdPMEZCUlVFN1FVRkRRU3d3UjBGQk1FY3NVMEZCU1RzN1FVRkZPVWM3TzBGQlJVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVN3d1EwRkJNRU1zVTBGQlV6dEJRVU51UkR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGVHp0QlFVTlFPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRU3h4UTBGQmNVTXNVVUZCVVR0QlFVTTNRenRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRXNiMEpCUVc5Q08wRkJRM0JDT3p0QlFVVkJPMEZCUTBFN08wRkJSVUVzY1VOQlFYRkRMRkZCUVZFN1FVRkROME03UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTEVsQlFVazdRVUZEU2p0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVN4TlFVRk5PMEZCUTA0N08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1NVRkJTVHRCUVVOS08wRkJRMEU3TzBGQlJVRTdPMEZCUlVFN1FVRkRRU3h6UTBGQmMwTXNVVUZCVVR0QlFVTTVRenRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzUjBGQlJ6dEJRVU5JTEVOQlFVTTdPMEZCUlUwN08wRkJSVUU3UVVGRFVEdEJRVU5CT3p0QlFVVkJMRGhEUVVFNFF5eHhRMEZCVVN4alFVRmpMSEZEUVVGUk8wRkJRelZGTERoRFFVRTRReXh4UTBGQlVTeGpRVUZqTEhGRFFVRlJPenRCUVVVMVJUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeEpRVUZKTzBGQlEwbzdRVUZEUVN4SlFVRkpPMEZCUTBvN1FVRkRRVHRCUVVOQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJMSEZEUVVGeFF5eFJRVUZSTzBGQlF6ZERPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVTg3UVVGRFVEdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFTeHpRMEZCYzBNc1VVRkJVVHRCUVVNNVF6dEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVODdRVUZEVUR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGUVR0QlFVTkJMSEZEUVVGeFF5eFJRVUZSTzBGQlF6ZERPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZQTzBGQlExQTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlR6dEJRVU5RTzBGQlEwRTdPMEZCUlVFc1dVRkJXU3hYUVVGWExFZEJRVWNzVDBGQlR5eEZRVUZGTEd0RlFVRnJSVHRCUVVOeVJ6czdPenM3T3p0VFEyaGpRVHRUUVVOQk96dFRRVVZCTzFOQlEwRTdVMEZEUVR0VFFVTkJPMU5CUTBFN1UwRkRRVHRUUVVOQk8xTkJRMEU3VTBGRFFUdFRRVU5CTzFOQlEwRTdVMEZEUVR0VFFVTkJPenRUUVVWQk8xTkJRMEU3TzFOQlJVRTdVMEZEUVR0VFFVTkJPenM3T3p0VlEzUkNRVHRWUVVOQk8xVkJRMEU3VlVGRFFUdFZRVU5CTEhsRFFVRjVReXgzUTBGQmQwTTdWVUZEYWtZN1ZVRkRRVHRWUVVOQk96czdPenRWUTFCQk8xVkJRMEU3VlVGRFFUdFZRVU5CTzFWQlEwRXNSMEZCUnp0VlFVTklPMVZCUTBFN1ZVRkRRU3hEUVVGRE96czdPenRWUTFCRU96czdPenRWUTBGQk8xVkJRMEU3VlVGRFFUdFZRVU5CTEhWRVFVRjFSQ3hwUWtGQmFVSTdWVUZEZUVVN1ZVRkRRU3huUkVGQlowUXNZVUZCWVR0VlFVTTNSRHM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPMEZEVFd0Q096dEJRVVZZTzBGQlExQXNXVUZCV1R0QlFVTmFMRmRCUVZjN1FVRkRXQ3hqUVVGak8wRkJRMlFzUzBGQlN6dEJRVU5NTEhOQ1FVRnpRanRCUVVOMFFpeExRVUZMTzBGQlEwd3NWVUZCVlR0QlFVTldMR05CUVdNN1FVRkRaQ3hwUWtGQmFVSTdRVUZEYWtJN08wRkJZM2RDT3p0QlFVVnFRanRCUVVOUUxHTkJRV003UVVGRFpDeHhRa0ZCY1VJN1FVRkRja0lzY1VKQlFYRkNPMEZCUTNKQ0xHRkJRV0U3UVVGRFlpeHZRa0ZCYjBJN1FVRkRjRUlzYzBKQlFYTkNPMEZCUTNSQ0xHdENRVUZyUWp0QlFVTnNRaXhuUWtGQlowSTdRVUZEYUVJN08wRkJUVGhDT3p0QlFVVjJRanRCUVVOUUxHTkJRV01zYjBWQlFXMUNPMEZCUTJwRExHTkJRV003UVVGRFpDeFZRVUZWTzBGQlExWXNWVUZCVlR0QlFVTldPenRCUVVWdlF6dEJRVU5YT3p0QlFVODNReUlzSW5OdmRYSmpaWE1pT2xzaWQyVmljR0ZqYXpvdkwycHBZbk12TGk5dWIyUmxYMjF2WkhWc1pYTXZaR1ZoWkdKbFpXWXZiR2xpTDJsdVpHVjRMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZZMjl0Y0c5dVpXNTBMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZaWFpsYm5SekxtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZMaTlzYVdJdmFtbGlMbXB6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZjbVZ1WkdWeVpYSnpMMmx1WkdWNExtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZMaTlzYVdJdmNtVnVaR1Z5WlhKekwzSmxibVJsY21WeUxtcHpJaXdpZDJWaWNHRmphem92TDJwcFluTXZMaTlzYVdJdmNtVnVaR1Z5WlhKekwzSnZiM1F0Ym05a1pTNXFjeUlzSW5kbFluQmhZMnM2THk5cWFXSnpMeTR2YkdsaUwzVjBhV3h6TG1weklpd2lkMlZpY0dGamF6b3ZMMnBwWW5NdmQyVmljR0ZqYXk5aWIyOTBjM1J5WVhBaUxDSjNaV0p3WVdOck9pOHZhbWxpY3k5M1pXSndZV05yTDNKMWJuUnBiV1V2WkdWbWFXNWxJSEJ5YjNCbGNuUjVJR2RsZEhSbGNuTWlMQ0ozWldKd1lXTnJPaTh2YW1saWN5OTNaV0p3WVdOckwzSjFiblJwYldVdloyeHZZbUZzSWl3aWQyVmljR0ZqYXpvdkwycHBZbk12ZDJWaWNHRmpheTl5ZFc1MGFXMWxMMmhoYzA5M2JsQnliM0JsY25SNUlITm9iM0owYUdGdVpDSXNJbmRsWW5CaFkyczZMeTlxYVdKekwzZGxZbkJoWTJzdmNuVnVkR2x0WlM5dFlXdGxJRzVoYldWemNHRmpaU0J2WW1wbFkzUWlMQ0ozWldKd1lXTnJPaTh2YW1saWN5OHVMMnhwWWk5cGJtUmxlQzVxY3lKZExDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SXZMeUJEYjNCNWNtbG5hSFFnTWpBeU1pQlhlV0YwZENCSGNtVmxibmRoZVZ4dVhHNG5kWE5sSUhOMGNtbGpkQ2M3WEc1Y2JtTnZibk4wSUhSb2FYTkhiRzlpWVd3Z1BTQW9LSFI1Y0dWdlppQjNhVzVrYjNjZ0lUMDlJQ2QxYm1SbFptbHVaV1FuS1NBL0lIZHBibVJ2ZHlBNklHZHNiMkpoYkNrZ2ZId2dkR2hwY3p0Y2JtTnZibk4wSUVSRlFVUkNSVVZHWDFKRlJsOU5RVkJmUzBWWklEMGdVM2x0WW05c0xtWnZjaWduUUVCa1pXRmtZbVZsWmxKbFprMWhjQ2NwTzF4dVkyOXVjM1FnVlU1SlVWVkZYMGxFWDFOWlRVSlBUQ0E5SUZONWJXSnZiQzVtYjNJb0owQkFaR1ZoWkdKbFpXWlZibWx4ZFdWSlJDY3BPMXh1WTI5dWMzUWdjbVZtVFdGd0lEMGdLSFJvYVhOSGJHOWlZV3hiUkVWQlJFSkZSVVpmVWtWR1gwMUJVRjlMUlZsZEtTQS9JSFJvYVhOSGJHOWlZV3hiUkVWQlJFSkZSVVpmVWtWR1gwMUJVRjlMUlZsZElEb2dibVYzSUZkbFlXdE5ZWEFvS1R0Y2JtTnZibk4wSUdsa1NHVnNjR1Z5Y3lBOUlGdGRPMXh1WEc1cFppQW9JWFJvYVhOSGJHOWlZV3hiUkVWQlJFSkZSVVpmVWtWR1gwMUJVRjlMUlZsZEtWeHVJQ0IwYUdselIyeHZZbUZzVzBSRlFVUkNSVVZHWDFKRlJsOU5RVkJmUzBWWlhTQTlJSEpsWmsxaGNEdGNibHh1YkdWMElIVjFhV1JEYjNWdWRHVnlJRDBnTUc0N1hHNWNibVoxYm1OMGFXOXVJR2RsZEVobGJIQmxja1p2Y2xaaGJIVmxLSFpoYkhWbEtTQjdYRzRnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlHbGtTR1ZzY0dWeWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdiR1YwSUhzZ2FHVnNjR1Z5TENCblpXNWxjbUYwYjNJZ2ZTQTlJR2xrU0dWc2NHVnljMXRwWFR0Y2JpQWdJQ0JwWmlBb2FHVnNjR1Z5S0haaGJIVmxLU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQm5aVzVsY21GMGIzSTdYRzRnSUgxY2JuMWNibHh1Wm5WdVkzUnBiMjRnWVc1NWRHaHBibWRVYjBsRUtGOWhjbWNzSUY5aGJISmxZV1I1Vm1semFYUmxaQ2tnZTF4dUlDQnNaWFFnWVhKbklEMGdYMkZ5Wnp0Y2JpQWdhV1lnS0dGeVp5QnBibk4wWVc1alpXOW1JRTUxYldKbGNpQjhmQ0JoY21jZ2FXNXpkR0Z1WTJWdlppQlRkSEpwYm1jZ2ZId2dZWEpuSUdsdWMzUmhibU5sYjJZZ1FtOXZiR1ZoYmlsY2JpQWdJQ0JoY21jZ1BTQmhjbWN1ZG1Gc2RXVlBaaWdwTzF4dVhHNGdJR3hsZENCMGVYQmxUMllnUFNCMGVYQmxiMllnWVhKbk8xeHVYRzRnSUdsbUlDaDBlWEJsVDJZZ1BUMDlJQ2R1ZFcxaVpYSW5JQ1ltSUdGeVp5QTlQVDBnTUNrZ2UxeHVJQ0FnSUdsbUlDaFBZbXBsWTNRdWFYTW9ZWEpuTENBdE1Da3BYRzRnSUNBZ0lDQnlaWFIxY200Z0oyNTFiV0psY2pvdE1DYzdYRzVjYmlBZ0lDQnlaWFIxY200Z0oyNTFiV0psY2pvck1DYzdYRzRnSUgxY2JseHVJQ0JwWmlBb2RIbHdaVTltSUQwOVBTQW5jM2x0WW05c0p5bGNiaUFnSUNCeVpYUjFjbTRnWUhONWJXSnZiRG9rZTJGeVp5NTBiMU4wY21sdVp5Z3BmV0E3WEc1Y2JpQWdhV1lnS0dGeVp5QTlQU0J1ZFd4c0lIeDhJSFI1Y0dWUFppQTlQVDBnSjI1MWJXSmxjaWNnZkh3Z2RIbHdaVTltSUQwOVBTQW5ZbTl2YkdWaGJpY2dmSHdnZEhsd1pVOW1JRDA5UFNBbmMzUnlhVzVuSnlCOGZDQjBlWEJsVDJZZ1BUMDlJQ2RpYVdkcGJuUW5LU0I3WEc0Z0lDQWdhV1lnS0hSNWNHVlBaaUE5UFQwZ0oyNTFiV0psY2ljcFhHNGdJQ0FnSUNCeVpYUjFjbTRnS0dGeVp5QThJREFwSUQ4Z1lHNTFiV0psY2pva2UyRnlaMzFnSURvZ1lHNTFiV0psY2pvckpIdGhjbWQ5WUR0Y2JseHVJQ0FnSUdsbUlDaDBlWEJsVDJZZ1BUMDlJQ2RpYVdkcGJuUW5JQ1ltSUdGeVp5QTlQVDBnTUc0cFhHNGdJQ0FnSUNCeVpYUjFjbTRnSjJKcFoybHVkRG9yTUNjN1hHNWNiaUFnSUNCeVpYUjFjbTRnWUNSN2RIbHdaVTltZlRva2UyRnlaMzFnTzF4dUlDQjlYRzVjYmlBZ2JHVjBJR2xrU0dWc2NHVnlJRDBnS0dsa1NHVnNjR1Z5Y3k1c1pXNW5kR2dnUGlBd0lDWW1JR2RsZEVobGJIQmxja1p2Y2xaaGJIVmxLR0Z5WnlrcE8xeHVJQ0JwWmlBb2FXUklaV3h3WlhJcFhHNGdJQ0FnY21WMGRYSnVJR0Z1ZVhSb2FXNW5WRzlKUkNocFpFaGxiSEJsY2loaGNtY3BLVHRjYmx4dUlDQnBaaUFvVlU1SlVWVkZYMGxFWDFOWlRVSlBUQ0JwYmlCaGNtY2dKaVlnZEhsd1pXOW1JR0Z5WjF0VlRrbFJWVVZmU1VSZlUxbE5RazlNWFNBOVBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJQzh2SUZCeVpYWmxiblFnYVc1bWFXNXBkR1VnY21WamRYSnphVzl1WEc0Z0lDQWdhV1lnS0NGZllXeHlaV0ZrZVZacGMybDBaV1FnZkh3Z0lWOWhiSEpsWVdSNVZtbHphWFJsWkM1b1lYTW9ZWEpuS1NrZ2UxeHVJQ0FnSUNBZ2JHVjBJR0ZzY21WaFpIbFdhWE5wZEdWa0lEMGdYMkZzY21WaFpIbFdhWE5wZEdWa0lIeDhJRzVsZHlCVFpYUW9LVHRjYmlBZ0lDQWdJR0ZzY21WaFpIbFdhWE5wZEdWa0xtRmtaQ2hoY21jcE8xeHVJQ0FnSUNBZ2NtVjBkWEp1SUdGdWVYUm9hVzVuVkc5SlJDaGhjbWRiVlU1SlVWVkZYMGxFWDFOWlRVSlBURjBvS1N3Z1lXeHlaV0ZrZVZacGMybDBaV1FwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUdsbUlDZ2hjbVZtVFdGd0xtaGhjeWhoY21jcEtTQjdYRzRnSUNBZ2JHVjBJR3RsZVNBOUlHQWtlM1I1Y0dWdlppQmhjbWQ5T2lSN0t5dDFkV2xrUTI5MWJuUmxjbjFnTzF4dUlDQWdJSEpsWmsxaGNDNXpaWFFvWVhKbkxDQnJaWGtwTzF4dUlDQWdJSEpsZEhWeWJpQnJaWGs3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnY21WbVRXRndMbWRsZENoaGNtY3BPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmtaV0ZrWW1WbFppZ3BJSHRjYmlBZ2JHVjBJSEJoY25SeklEMGdXeUJoY21kMWJXVnVkSE11YkdWdVozUm9JRjA3WEc0Z0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1Z4dUlDQWdJSEJoY25SekxuQjFjMmdvWVc1NWRHaHBibWRVYjBsRUtHRnlaM1Z0Wlc1MGMxdHBYU2twTzF4dVhHNGdJSEpsZEhWeWJpQndZWEowY3k1cWIybHVLQ2M2SnlrN1hHNTlYRzVjYm1aMWJtTjBhVzl1SUdSbFlXUmlaV1ZtVTI5eWRHVmtLQ2tnZTF4dUlDQnNaWFFnY0dGeWRITWdQU0JiSUdGeVozVnRaVzUwY3k1c1pXNW5kR2dnWFR0Y2JpQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnWVhKbmRXMWxiblJ6TG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcFhHNGdJQ0FnY0dGeWRITXVjSFZ6YUNoaGJubDBhR2x1WjFSdlNVUW9ZWEpuZFcxbGJuUnpXMmxkS1NrN1hHNWNiaUFnY21WMGRYSnVJSEJoY25SekxuTnZjblFvS1M1cWIybHVLQ2M2SnlrN1hHNTlYRzVjYm1aMWJtTjBhVzl1SUdkbGJtVnlZWFJsU1VSR2IzSW9hR1ZzY0dWeUxDQm5aVzVsY21GMGIzSXBJSHRjYmlBZ2FXUklaV3h3WlhKekxuQjFjMmdvZXlCb1pXeHdaWElzSUdkbGJtVnlZWFJ2Y2lCOUtUdGNibjFjYmx4dVpuVnVZM1JwYjI0Z2NtVnRiM1psU1VSSFpXNWxjbUYwYjNJb2FHVnNjR1Z5S1NCN1hHNGdJR3hsZENCcGJtUmxlQ0E5SUdsa1NHVnNjR1Z5Y3k1bWFXNWtTVzVrWlhnb0tHbDBaVzBwSUQwK0lDaHBkR1Z0TG1obGJIQmxjaUE5UFQwZ2FHVnNjR1Z5S1NrN1hHNGdJR2xtSUNocGJtUmxlQ0E4SURBcFhHNGdJQ0FnY21WMGRYSnVPMXh1WEc0Z0lHbGtTR1ZzY0dWeWN5NXpjR3hwWTJVb2FXNWtaWGdzSURFcE8xeHVmVnh1WEc1UFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRHbGxjeWhrWldGa1ltVmxaaXdnZTF4dUlDQW5hV1JUZVcwbk9pQjdYRzRnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1ZVNUpVVlZGWDBsRVgxTlpUVUpQVEN4Y2JpQWdmU3hjYmlBZ0ozTnZjblJsWkNjNklIdGNiaUFnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCa1pXRmtZbVZsWmxOdmNuUmxaQ3hjYmlBZ2ZTeGNiaUFnSjJkbGJtVnlZWFJsU1VSR2IzSW5PaUI3WEc0Z0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdaMlZ1WlhKaGRHVkpSRVp2Y2l4Y2JpQWdmU3hjYmlBZ0ozSmxiVzkyWlVsRVIyVnVaWEpoZEc5eUp6b2dlMXh1SUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lISmxiVzkyWlVsRVIyVnVaWEpoZEc5eUxGeHVJQ0I5TEZ4dWZTazdYRzVjYm0xdlpIVnNaUzVsZUhCdmNuUnpJRDBnWkdWaFpHSmxaV1k3WEc0aUxDSXZLaUJuYkc5aVlXd2dRblZtWm1WeUlDb3ZYRzVjYm1sdGNHOXlkQ0JrWldGa1ltVmxaaUJtY205dElDZGtaV0ZrWW1WbFppYzdYRzVwYlhCdmNuUWdleUJGZG1WdWRFVnRhWFIwWlhJZ2ZTQm1jbTl0SUNjdUwyVjJaVzUwY3k1cWN5YzdYRzVwYlhCdmNuUWdLaUJoY3lCVmRHbHNjeUFnSUNBZ0lDQm1jbTl0SUNjdUwzVjBhV3h6TG1wekp6dGNibWx0Y0c5eWRDQjdYRzRnSUNRc1hHNGdJR2x6U21saWFYTm9MRnh1SUNCeVpYTnZiSFpsUTJocGJHUnlaVzRzWEc0Z0lHTnZibk4wY25WamRFcHBZaXhjYm4wZ1puSnZiU0FuTGk5cWFXSXVhbk1uTzF4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnVlZCRVFWUkZYMFZXUlU1VUlDQWdJQ0FnSUNBZ0lDQWdJQ0E5SUNkQWFtbGljeTlqYjIxd2IyNWxiblF2WlhabGJuUXZkWEJrWVhSbEp6dGNibVY0Y0c5eWRDQmpiMjV6ZENCUlZVVlZSVjlWVUVSQlZFVmZUVVZVU0U5RUlDQWdJQ0FnSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5NdlkyOXRjRzl1Wlc1MEwzRjFaWFZsVlhCa1lYUmxKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdSa3hWVTBoZlZWQkVRVlJGWDAxRlZFaFBSQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzltYkhWemFGVndaR0YwWlNjcE8xeHVaWGh3YjNKMElHTnZibk4wSUVsT1NWUmZUVVZVU0U5RUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnUFNCVGVXMWliMnd1Wm05eUtDZEFhbWxpY3k5amIyMXdiMjVsYm5RdlgxOXBibWwwSnlrN1hHNWxlSEJ2Y25RZ1kyOXVjM1FnVTB0SlVGOVRWRUZVUlY5VlVFUkJWRVZUSUNBZ0lDQWdJQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TDJOdmJYQnZibVZ1ZEM5emEybHdVM1JoZEdWVmNHUmhkR1Z6SnlrN1hHNWxlSEJ2Y25RZ1kyOXVjM1FnVUVWT1JFbE9SMTlUVkVGVVJWOVZVRVJCVkVVZ0lDQWdJQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TDJOdmJYQnZibVZ1ZEM5d1pXNWthVzVuVTNSaGRHVlZjR1JoZEdVbktUdGNibVY0Y0c5eWRDQmpiMjV6ZENCTVFWTlVYMUpGVGtSRlVsOVVTVTFGSUNBZ0lDQWdJQ0FnSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5NdlkyOXRjRzl1Wlc1MEwyeGhjM1JTWlc1a1pYSlVhVzFsSnlrN1hHNWxlSEJ2Y25RZ1kyOXVjM1FnVUZKRlZrbFBWVk5mVTFSQlZFVWdJQ0FnSUNBZ0lDQWdJQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TDJOdmJYQnZibVZ1ZEM5d2NtVjJhVzkxYzFOMFlYUmxKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdRMEZRVkZWU1JWOVNSVVpGVWtWT1EwVmZUVVZVU0U5RVV5QTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl3Y21WMmFXOTFjMU4wWVhSbEp5azdYRzVjYm1OdmJuTjBJR1ZzWlcxbGJuUkVZWFJoUTJGamFHVWdQU0J1WlhjZ1YyVmhhMDFoY0NncE8xeHVYRzVtZFc1amRHbHZiaUJwYzFaaGJHbGtVM1JoZEdWUFltcGxZM1FvZG1Gc2RXVXBJSHRjYmlBZ2FXWWdLSFpoYkhWbElEMDlJRzUxYkd3cFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaFBZbXBsWTNRdWFYTW9kbUZzZFdVc0lFNWhUaWtwWEc0Z0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dVhHNGdJR2xtSUNoUFltcGxZM1F1YVhNb2RtRnNkV1VzSUVsdVptbHVhWFI1S1NsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnYVdZZ0tIWmhiSFZsSUdsdWMzUmhibU5sYjJZZ1FtOXZiR1ZoYmlCOGZDQjJZV3gxWlNCcGJuTjBZVzVqWlc5bUlFNTFiV0psY2lCOGZDQjJZV3gxWlNCcGJuTjBZVzVqWlc5bUlGTjBjbWx1WnlsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnYkdWMElIUjVjR1ZQWmlBOUlIUjVjR1Z2WmlCMllXeDFaVHRjYmlBZ2FXWWdLSFI1Y0dWUFppQTlQVDBnSjNOMGNtbHVaeWNnZkh3Z2RIbHdaVTltSUQwOVBTQW5iblZ0WW1WeUp5QjhmQ0IwZVhCbFQyWWdQVDA5SUNkaWIyOXNaV0Z1SnlsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvZG1Gc2RXVXBLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQnBaaUFvZEhsd1pXOW1JRUoxWm1abGNpQWhQVDBnSjNWdVpHVm1hVzVsWkNjZ0ppWWdRblZtWm1WeUxtbHpRblZtWm1WeUtIWmhiSFZsS1NsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnY21WMGRYSnVJSFJ5ZFdVN1hHNTlYRzVjYm1WNGNHOXlkQ0JqYkdGemN5QkRiMjF3YjI1bGJuUWdaWGgwWlc1a2N5QkZkbVZ1ZEVWdGFYUjBaWElnZTF4dUlDQnpkR0YwYVdNZ1ZWQkVRVlJGWDBWV1JVNVVJRDBnVlZCRVFWUkZYMFZXUlU1VU8xeHVYRzRnSUZ0UlZVVlZSVjlWVUVSQlZFVmZUVVZVU0U5RVhTZ3BJSHRjYmlBZ0lDQnBaaUFvZEdocGMxdFFSVTVFU1U1SFgxTlVRVlJGWDFWUVJFRlVSVjBwWEc0Z0lDQWdJQ0J5WlhSMWNtNDdYRzVjYmlBZ0lDQjBhR2x6VzFCRlRrUkpUa2RmVTFSQlZFVmZWVkJFUVZSRlhTQTlJRkJ5YjIxcGMyVXVjbVZ6YjJ4MlpTZ3BPMXh1SUNBZ0lIUm9hWE5iVUVWT1JFbE9SMTlUVkVGVVJWOVZVRVJCVkVWZExuUm9aVzRvZEdocGMxdEdURlZUU0Y5VlVFUkJWRVZmVFVWVVNFOUVYUzVpYVc1a0tIUm9hWE1wS1R0Y2JpQWdmVnh1WEc0Z0lGdEdURlZUU0Y5VlVFUkJWRVZmVFVWVVNFOUVYU2dwSUh0Y2JpQWdJQ0F2THlCWFlYTWdkR2hsSUhOMFlYUmxJSFZ3WkdGMFpTQmpZVzVqWld4c1pXUS9YRzRnSUNBZ2FXWWdLQ0YwYUdselcxQkZUa1JKVGtkZlUxUkJWRVZmVlZCRVFWUkZYU2xjYmlBZ0lDQWdJSEpsZEhWeWJqdGNibHh1SUNBZ0lIUm9hWE11WlcxcGRDaFZVRVJCVkVWZlJWWkZUbFFwTzF4dVhHNGdJQ0FnZEdocGMxdFFSVTVFU1U1SFgxTlVRVlJGWDFWUVJFRlVSVjBnUFNCdWRXeHNPMXh1SUNCOVhHNWNiaUFnVzBsT1NWUmZUVVZVU0U5RVhTZ3BJSHRjYmlBZ0lDQjBhR2x6VzFOTFNWQmZVMVJCVkVWZlZWQkVRVlJGVTEwZ1BTQm1ZV3h6WlR0Y2JpQWdmVnh1WEc0Z0lHTnZibk4wY25WamRHOXlLRjlxYVdJcElIdGNiaUFnSUNCemRYQmxjaWdwTzF4dVhHNGdJQ0FnTHk4Z1FtbHVaQ0JoYkd3Z1kyeGhjM01nYldWMGFHOWtjeUIwYnlCY0luUm9hWE5jSWx4dUlDQWdJRlYwYVd4ekxtSnBibVJOWlhSb2IyUnpMbU5oYkd3b2RHaHBjeXdnZEdocGN5NWpiMjV6ZEhKMVkzUnZjaTV3Y205MGIzUjVjR1VwTzF4dVhHNGdJQ0FnYkdWMElHcHBZaUE5SUY5cWFXSWdmSHdnZTMwN1hHNWNiaUFnSUNCamIyNXpkQ0JqY21WaGRHVk9aWGRUZEdGMFpTQTlJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lHeGxkQ0JzYjJOaGJGTjBZWFJsSUQwZ1QySnFaV04wTG1OeVpXRjBaU2h1ZFd4c0tUdGNibHh1SUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJRY205NGVTaHNiMk5oYkZOMFlYUmxMQ0I3WEc0Z0lDQWdJQ0FnSUdkbGREb2dLSFJoY21kbGRDd2djSEp2Y0U1aGJXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RHRnlaMlYwVzNCeWIzQk9ZVzFsWFR0Y2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDQWdjMlYwT2lBb2RHRnlaMlYwTENCd2NtOXdUbUZ0WlN3Z2RtRnNkV1VwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0JzWlhRZ1kzVnljbVZ1ZEZaaGJIVmxJRDBnZEdGeVoyVjBXM0J5YjNCT1lXMWxYVHRjYmlBZ0lDQWdJQ0FnSUNCcFppQW9ZM1Z5Y21WdWRGWmhiSFZsSUQwOVBTQjJZV3gxWlNsY2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnSUNBZ0lDQWdhV1lnS0NGMGFHbHpXMU5MU1ZCZlUxUkJWRVZmVlZCRVFWUkZVMTBwWEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhR2x6VzFGVlJWVkZYMVZRUkVGVVJWOU5SVlJJVDBSZEtDazdYRzVjYmlBZ0lDQWdJQ0FnSUNCMFlYSm5aWFJiY0hKdmNFNWhiV1ZkSUQwZ2RtRnNkV1U3WEc0Z0lDQWdJQ0FnSUNBZ2RHaHBjeTV2YmxOMFlYUmxWWEJrWVhSbFpDaHdjbTl3VG1GdFpTd2dkbUZzZFdVc0lHTjFjbkpsYm5SV1lXeDFaU2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUgwcE8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCc1pYUWdjSEp2Y0hNZ0lDQWdJQ0FnUFNCUFltcGxZM1F1WVhOemFXZHVLRTlpYW1WamRDNWpjbVZoZEdVb2JuVnNiQ2tzSUdwcFlpNXdjbTl3Y3lCOGZDQjdmU2s3WEc0Z0lDQWdiR1YwSUY5c2IyTmhiRk4wWVhSbElEMGdZM0psWVhSbFRtVjNVM1JoZEdVb0tUdGNibHh1SUNBZ0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBhV1Z6S0hSb2FYTXNJSHRjYmlBZ0lDQWdJRnRUUzBsUVgxTlVRVlJGWDFWUVJFRlVSVk5kT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ1cxQkZUa1JKVGtkZlUxUkJWRVZmVlZCRVFWUkZYVG9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQlFjbTl0YVhObExuSmxjMjlzZG1Vb0tTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQmJURUZUVkY5U1JVNUVSVkpmVkVsTlJWMDZJSHRjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQjBjblZsTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1ZYUnBiSE11Ym05M0tDa3NYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdXME5CVUZSVlVrVmZVa1ZHUlZKRlRrTkZYMDFGVkVoUFJGTmRPaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lIdDlMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ2RwWkNjNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCcWFXSXVhV1FzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSjNCeWIzQnpKem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQndjbTl3Y3l4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBblkyaHBiR1J5Wlc0bk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUdwcFlpNWphR2xzWkhKbGJpQjhmQ0JiWFN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBblkyOXVkR1Y0ZENjNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnYW1saUxtTnZiblJsZUhRZ2ZId2dUMkpxWldOMExtTnlaV0YwWlNodWRXeHNLU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuYzNSaGRHVW5PaUI3WEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdaMlYwT2lBZ0lDQWdJQ0FnSUNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUY5c2IyTmhiRk4wWVhSbE8xeHVJQ0FnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdJQ0J6WlhRNklDQWdJQ0FnSUNBZ0lDaDJZV3gxWlNrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDZ2hhWE5XWVd4cFpGTjBZWFJsVDJKcVpXTjBLSFpoYkhWbEtTbGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb1lFbHVkbUZzYVdRZ2RtRnNkV1VnWm05eUlGd2lkR2hwY3k1emRHRjBaVndpT2lCY0lpUjdkbUZzZFdWOVhDSXVJRkJ5YjNacFpHVmtJRndpYzNSaGRHVmNJaUJ0ZFhOMElHSmxJR0Z1SUdsMFpYSmhZbXhsSUc5aWFtVmpkQzVnS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJRTlpYW1WamRDNWhjM05wWjI0b1gyeHZZMkZzVTNSaGRHVXNJSFpoYkhWbEtUdGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdmU2s3WEc0Z0lIMWNibHh1SUNCeVpYTnZiSFpsUTJocGJHUnlaVzRvWTJocGJHUnlaVzRwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdjbVZ6YjJ4MlpVTm9hV3hrY21WdUxtTmhiR3dvZEdocGN5d2dZMmhwYkdSeVpXNHBPMXh1SUNCOVhHNWNiaUFnYVhOS2FXSW9kbUZzZFdVcElIdGNiaUFnSUNCeVpYUjFjbTRnYVhOS2FXSnBjMmdvZG1Gc2RXVXBPMXh1SUNCOVhHNWNiaUFnWTI5dWMzUnlkV04wU21saUtIWmhiSFZsS1NCN1hHNGdJQ0FnY21WMGRYSnVJR052Ym5OMGNuVmpkRXBwWWloMllXeDFaU2s3WEc0Z0lIMWNibHh1SUNCd2RYTm9VbVZ1WkdWeUtISmxibVJsY2xKbGMzVnNkQ2tnZTF4dUlDQWdJSFJvYVhNdVpXMXBkQ2hWVUVSQlZFVmZSVlpGVGxRc0lISmxibVJsY2xKbGMzVnNkQ2s3WEc0Z0lIMWNibHh1SUNBdkx5QmxjMnhwYm5RdFpHbHpZV0pzWlMxdVpYaDBMV3hwYm1VZ2JtOHRkVzUxYzJWa0xYWmhjbk5jYmlBZ2IyNVFjbTl3VlhCa1lYUmxaQ2h3Y205d1RtRnRaU3dnYm1WM1ZtRnNkV1VzSUc5c1pGWmhiSFZsS1NCN1hHNGdJSDFjYmx4dUlDQXZMeUJsYzJ4cGJuUXRaR2x6WVdKc1pTMXVaWGgwTFd4cGJtVWdibTh0ZFc1MWMyVmtMWFpoY25OY2JpQWdiMjVUZEdGMFpWVndaR0YwWldRb2NISnZjRTVoYldVc0lHNWxkMVpoYkhWbExDQnZiR1JXWVd4MVpTa2dlMXh1SUNCOVhHNWNiaUFnWTJGd2RIVnlaVkpsWm1WeVpXNWpaU2h1WVcxbExDQnBiblJsY21ObGNIUnZja05oYkd4aVlXTnJLU0I3WEc0Z0lDQWdiR1YwSUcxbGRHaHZaQ0E5SUhSb2FYTmJRMEZRVkZWU1JWOVNSVVpGVWtWT1EwVmZUVVZVU0U5RVUxMWJibUZ0WlYwN1hHNGdJQ0FnYVdZZ0tHMWxkR2h2WkNsY2JpQWdJQ0FnSUhKbGRIVnliaUJ0WlhSb2IyUTdYRzVjYmlBZ0lDQnRaWFJvYjJRZ1BTQW9YM0psWml3Z2NISmxkbWx2ZFhOU1pXWXBJRDArSUh0Y2JpQWdJQ0FnSUd4bGRDQnlaV1lnUFNCZmNtVm1PMXh1WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUdsdWRHVnlZMlZ3ZEc5eVEyRnNiR0poWTJzZ1BUMDlJQ2RtZFc1amRHbHZiaWNwWEc0Z0lDQWdJQ0FnSUhKbFppQTlJR2x1ZEdWeVkyVndkRzl5UTJGc2JHSmhZMnN1WTJGc2JDaDBhR2x6TENCeVpXWXNJSEJ5WlhacGIzVnpVbVZtS1R0Y2JseHVJQ0FnSUNBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUnBaWE1vZEdocGN5d2dlMXh1SUNBZ0lDQWdJQ0JiYm1GdFpWMDZJSHRjYmlBZ0lDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCeVpXWXNYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnYVdZZ0tIUjVjR1Z2WmlCcGJuUmxjbU5sY0hSdmNrTmhiR3hpWVdOcklDRTlQU0FuWm5WdVkzUnBiMjRuS1Z4dUlDQWdJQ0FnZEdocGMxdERRVkJVVlZKRlgxSkZSa1ZTUlU1RFJWOU5SVlJJVDBSVFhTQTlJRzFsZEdodlpEdGNibHh1SUNBZ0lISmxkSFZ5YmlCdFpYUm9iMlE3WEc0Z0lIMWNibHh1SUNCbWIzSmpaVlZ3WkdGMFpTZ3BJSHRjYmlBZ0lDQjBhR2x6VzFGVlJWVkZYMVZRUkVGVVJWOU5SVlJJVDBSZEtDazdYRzRnSUgxY2JseHVJQ0JuWlhSVGRHRjBaU2h3Y205d1pYSjBlVkJoZEdnc0lHUmxabUYxYkhSV1lXeDFaU2tnZTF4dUlDQWdJR3hsZENCemRHRjBaU0E5SUhSb2FYTXVjM1JoZEdVN1hHNGdJQ0FnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdjM1JoZEdVN1hHNWNiaUFnSUNCcFppQW9WWFJwYkhNdWFXNXpkR0Z1WTJWUFppaHdjbTl3WlhKMGVWQmhkR2dzSUNkdlltcGxZM1FuS1NrZ2UxeHVJQ0FnSUNBZ2JHVjBJR3RsZVhNZ0lDQWdJQ0FnSUQwZ1QySnFaV04wTG10bGVYTW9jSEp2Y0dWeWRIbFFZWFJvS1M1amIyNWpZWFFvVDJKcVpXTjBMbWRsZEU5M2JsQnliM0JsY25SNVUzbHRZbTlzY3lod2NtOXdaWEowZVZCaGRHZ3BLVHRjYmlBZ0lDQWdJR3hsZENCbWFXNWhiRk4wWVhSbElDQTlJSHQ5TzF4dVhHNGdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQnJaWGx6TG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUd0bGVTQTlJR3RsZVhOYmFWMDdYRzRnSUNBZ0lDQWdJR3hsZENCYklIWmhiSFZsTENCc1lYTjBVR0Z5ZENCZElEMGdWWFJwYkhNdVptVjBZMmhFWldWd1VISnZjR1Z5ZEhrb2MzUmhkR1VzSUd0bGVTd2djSEp2Y0dWeWRIbFFZWFJvVzJ0bGVWMHNJSFJ5ZFdVcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvYkdGemRGQmhjblFnUFQwZ2JuVnNiQ2xjYmlBZ0lDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUNBZ0lDQm1hVzVoYkZOMFlYUmxXMnhoYzNSUVlYSjBYU0E5SUhaaGJIVmxPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdabWx1WVd4VGRHRjBaVHRjYmlBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUZWMGFXeHpMbVpsZEdOb1JHVmxjRkJ5YjNCbGNuUjVLSE4wWVhSbExDQndjbTl3WlhKMGVWQmhkR2dzSUdSbFptRjFiSFJXWVd4MVpTazdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JpQWdjMlYwVTNSaGRHVW9kbUZzZFdVcElIdGNiaUFnSUNCcFppQW9JV2x6Vm1Gc2FXUlRkR0YwWlU5aWFtVmpkQ2gyWVd4MVpTa3BYRzRnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dWSGx3WlVWeWNtOXlLR0JKYm5aaGJHbGtJSFpoYkhWbElHWnZjaUJjSW5Sb2FYTXVjMlYwVTNSaGRHVmNJam9nWENJa2UzWmhiSFZsZlZ3aUxpQlFjbTkyYVdSbFpDQmNJbk4wWVhSbFhDSWdiWFZ6ZENCaVpTQmhiaUJwZEdWeVlXSnNaU0J2WW1wbFkzUXVZQ2s3WEc1Y2JpQWdJQ0JQWW1wbFkzUXVZWE56YVdkdUtIUm9hWE11YzNSaGRHVXNJSFpoYkhWbEtUdGNiaUFnZlZ4dVhHNGdJSE5sZEZOMFlYUmxVR0Z6YzJsMlpTaDJZV3gxWlNrZ2UxeHVJQ0FnSUdsbUlDZ2hhWE5XWVd4cFpGTjBZWFJsVDJKcVpXTjBLSFpoYkhWbEtTbGNiaUFnSUNBZ0lIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9ZRWx1ZG1Gc2FXUWdkbUZzZFdVZ1ptOXlJRndpZEdocGN5NXpaWFJUZEdGMFpWQmhjM05wZG1WY0lqb2dYQ0lrZTNaaGJIVmxmVndpTGlCUWNtOTJhV1JsWkNCY0luTjBZWFJsWENJZ2JYVnpkQ0JpWlNCaGJpQnBkR1Z5WVdKc1pTQnZZbXBsWTNRdVlDazdYRzVjYmlBZ0lDQjBjbmtnZTF4dUlDQWdJQ0FnZEdocGMxdFRTMGxRWDFOVVFWUkZYMVZRUkVGVVJWTmRJRDBnZEhKMVpUdGNiaUFnSUNBZ0lFOWlhbVZqZEM1aGMzTnBaMjRvZEdocGN5NXpkR0YwWlN3Z2RtRnNkV1VwTzF4dUlDQWdJSDBnWm1sdVlXeHNlU0I3WEc0Z0lDQWdJQ0IwYUdselcxTkxTVkJmVTFSQlZFVmZWVkJFUVZSRlUxMGdQU0JtWVd4elpUdGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnphRzkxYkdSVmNHUmhkR1VvS1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJSDFjYmx4dUlDQmtaWE4wY205NUtDa2dlMXh1SUNBZ0lHUmxiR1YwWlNCMGFHbHpMbk4wWVhSbE8xeHVJQ0FnSUdSbGJHVjBaU0IwYUdsekxuQnliM0J6TzF4dUlDQWdJR1JsYkdWMFpTQjBhR2x6TG1OdmJuUmxlSFE3WEc0Z0lDQWdaR1ZzWlhSbElIUm9hWE5iUTBGUVZGVlNSVjlTUlVaRlVrVk9RMFZmVFVWVVNFOUVVMTA3WEc0Z0lDQWdkR2hwY3k1amJHVmhja0ZzYkVSbFltOTFibU5sY3lncE8xeHVJQ0I5WEc1Y2JpQWdjbVZ1WkdWeVYyRnBkR2x1WnlncElIdGNiaUFnZlZ4dVhHNGdJSEpsYm1SbGNpaGphR2xzWkhKbGJpa2dlMXh1SUNBZ0lISmxkSFZ5YmlCamFHbHNaSEpsYmp0Y2JpQWdmVnh1WEc0Z0lIVndaR0YwWldRb0tTQjdYRzRnSUgxY2JseHVJQ0JqYjIxaWFXNWxWMmwwYUNoelpYQXNJQzR1TG1GeVozTXBJSHRjYmlBZ0lDQnNaWFFnWm1sdVlXeEJjbWR6SUQwZ2JtVjNJRk5sZENncE8xeHVJQ0FnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlHRnlaM011YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUNBZ2JHVjBJR0Z5WnlBOUlHRnlaM05iYVYwN1hHNGdJQ0FnSUNCcFppQW9JV0Z5WnlsY2JpQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNWNiaUFnSUNBZ0lHbG1JQ2hWZEdsc2N5NXBibk4wWVc1alpVOW1LR0Z5Wnl3Z0ozTjBjbWx1WnljcEtTQjdYRzRnSUNBZ0lDQWdJR3hsZENCMllXeDFaWE1nUFNCaGNtY3VjM0JzYVhRb2MyVndLUzVtYVd4MFpYSW9WWFJwYkhNdWFYTk9iM1JGYlhCMGVTazdYRzRnSUNBZ0lDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUhaaGJIVmxjeTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1NCN1hHNGdJQ0FnSUNBZ0lDQWdiR1YwSUhaaGJIVmxJRDBnZG1Gc2RXVnpXMmxkTzF4dUlDQWdJQ0FnSUNBZ0lHWnBibUZzUVhKbmN5NWhaR1FvZG1Gc2RXVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0VGeWNtRjVMbWx6UVhKeVlYa29ZWEpuS1NrZ2UxeHVJQ0FnSUNBZ0lDQnNaWFFnZG1Gc2RXVnpJRDBnWVhKbkxtWnBiSFJsY2lnb2RtRnNkV1VwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0JwWmlBb0lYWmhiSFZsS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dVhHNGdJQ0FnSUNBZ0lDQWdhV1lnS0NGVmRHbHNjeTVwYm5OMFlXNWpaVTltS0haaGJIVmxMQ0FuYzNSeWFXNW5KeWtwWEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z1ZYUnBiSE11YVhOT2IzUkZiWEIwZVNoMllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUgwcE8xeHVYRzRnSUNBZ0lDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUhaaGJIVmxjeTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1NCN1hHNGdJQ0FnSUNBZ0lDQWdiR1YwSUhaaGJIVmxJRDBnZG1Gc2RXVnpXMmxkTzF4dUlDQWdJQ0FnSUNBZ0lHWnBibUZzUVhKbmN5NWhaR1FvZG1Gc2RXVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0I5SUdWc2MyVWdhV1lnS0ZWMGFXeHpMbWx1YzNSaGJtTmxUMllvWVhKbkxDQW5iMkpxWldOMEp5a3BJSHRjYmlBZ0lDQWdJQ0FnYkdWMElHdGxlWE1nUFNCUFltcGxZM1F1YTJWNWN5aGhjbWNwTzF4dUlDQWdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQnJaWGx6TG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdJQ0JzWlhRZ2EyVjVJQ0FnUFNCclpYbHpXMmxkTzF4dUlDQWdJQ0FnSUNBZ0lHeGxkQ0IyWVd4MVpTQTlJR0Z5WjF0clpYbGRPMXh1WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0YyWVd4MVpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1ptbHVZV3hCY21kekxtUmxiR1YwWlNoclpYa3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ1ptbHVZV3hCY21kekxtRmtaQ2hyWlhrcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2NtVjBkWEp1SUVGeWNtRjVMbVp5YjIwb1ptbHVZV3hCY21kektTNXFiMmx1S0hObGNDQjhmQ0FuSnlrN1hHNGdJSDFjYmx4dUlDQmpiR0Z6YzJWektDNHVMbUZ5WjNNcElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NWpiMjFpYVc1bFYybDBhQ2duSUNjc0lDNHVMbUZ5WjNNcE8xeHVJQ0I5WEc1Y2JpQWdaWGgwY21GamRFTm9hV3hrY21WdUtGOXdZWFIwWlhKdWN5d2dZMmhwYkdSeVpXNHNJRjl2Y0hScGIyNXpLU0I3WEc0Z0lDQWdiR1YwSUc5d2RHbHZibk1nSUNBOUlGOXZjSFJwYjI1eklIeDhJSHQ5TzF4dUlDQWdJR3hsZENCbGVIUnlZV04wWldRZ1BTQjdmVHRjYmlBZ0lDQnNaWFFnY0dGMGRHVnlibk1nSUQwZ1gzQmhkSFJsY201ek8xeHVJQ0FnSUd4bGRDQnBjMEZ5Y21GNUlDQWdQU0JCY25KaGVTNXBjMEZ5Y21GNUtIQmhkSFJsY201ektUdGNibHh1SUNBZ0lHTnZibk4wSUdselRXRjBZMmdnUFNBb2FtbGlLU0E5UGlCN1hHNGdJQ0FnSUNCc1pYUWdhbWxpVkhsd1pTQTlJR3BwWWk1VWVYQmxPMXh1SUNBZ0lDQWdhV1lnS0ZWMGFXeHpMbWx1YzNSaGJtTmxUMllvYW1saVZIbHdaU3dnSjNOMGNtbHVaeWNwS1Z4dUlDQWdJQ0FnSUNCcWFXSlVlWEJsSUQwZ2FtbGlWSGx3WlM1MGIweHZkMlZ5UTJGelpTZ3BPMXh1WEc0Z0lDQWdJQ0JwWmlBb2FYTkJjbkpoZVNrZ2UxeHVJQ0FnSUNBZ0lDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0J3WVhSMFpYSnVjeTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1NCN1hHNGdJQ0FnSUNBZ0lDQWdiR1YwSUhCaGRIUmxjbTRnUFNCd1lYUjBaWEp1YzF0cFhUdGNiaUFnSUNBZ0lDQWdJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmlod1lYUjBaWEp1TENBbmMzUnlhVzVuSnlrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0J3WVhSMFpYSnVJRDBnY0dGMGRHVnliaTUwYjB4dmQyVnlRMkZ6WlNncE8xeHVYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tHcHBZbFI1Y0dVZ0lUMDlJSEJoZEhSbGNtNHBYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUNBZ0lDQWdJR2xtSUNobGVIUnlZV04wWldSYmNHRjBkR1Z5YmwwZ0ppWWdiM0IwYVc5dWN5NXRkV3gwYVhCc1pTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLQ0ZCY25KaGVTNXBjMEZ5Y21GNUtHVjRkSEpoWTNSbFpGdHdZWFIwWlhKdVhTa3BYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lHVjRkSEpoWTNSbFpGdHdZWFIwWlhKdVhTQTlJRnNnWlhoMGNtRmpkR1ZrVzNCaGRIUmxjbTVkSUYwN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdWNGRISmhZM1JsWkZ0d1lYUjBaWEp1WFM1d2RYTm9LR3BwWWlrN1hHNGdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdWNGRISmhZM1JsWkZ0d1lYUjBaWEp1WFNBOUlHcHBZanRjYmlBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ2JHVjBJR3RsZVhNZ1BTQlBZbXBsWTNRdWEyVjVjeWh3WVhSMFpYSnVjeWs3WEc0Z0lDQWdJQ0FnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlHdGxlWE11YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJR3hsZENCclpYa2dJQ0FnSUQwZ2EyVjVjMXRwWFR0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnY0dGMGRHVnliaUE5SUhCaGRIUmxjbTV6VzJ0bGVWMDdYRzRnSUNBZ0lDQWdJQ0FnYkdWMElISmxjM1ZzZER0Y2JseHVJQ0FnSUNBZ0lDQWdJR2xtSUNoVmRHbHNjeTVwYm5OMFlXNWpaVTltS0hCaGRIUmxjbTRzSUZKbFowVjRjQ2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWE4xYkhRZ1BTQndZWFIwWlhKdUxuUmxjM1FvYW1saVZIbHdaU2s3WEc0Z0lDQWdJQ0FnSUNBZ1pXeHpaU0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmlod1lYUjBaWEp1TENBbmMzUnlhVzVuSnlrcFhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhOMWJIUWdQU0FvY0dGMGRHVnliaTUwYjB4dmQyVnlRMkZ6WlNncElEMDlQU0JxYVdKVWVYQmxLVHRjYmlBZ0lDQWdJQ0FnSUNCbGJITmxYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYTjFiSFFnUFNBb2NHRjBkR1Z5YmlBOVBUMGdhbWxpVkhsd1pTazdYRzVjYmlBZ0lDQWdJQ0FnSUNCcFppQW9JWEpsYzNWc2RDbGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuUnBiblZsTzF4dVhHNGdJQ0FnSUNBZ0lDQWdhV1lnS0dWNGRISmhZM1JsWkZ0d1lYUjBaWEp1WFNBbUppQnZjSFJwYjI1ekxtMTFiSFJwY0d4bEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JVUZ5Y21GNUxtbHpRWEp5WVhrb1pYaDBjbUZqZEdWa1czQmhkSFJsY201ZEtTbGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ1pYaDBjbUZqZEdWa1czQmhkSFJsY201ZElEMGdXeUJsZUhSeVlXTjBaV1JiY0dGMGRHVnlibDBnWFR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWlhoMGNtRmpkR1ZrVzNCaGRIUmxjbTVkTG5CMWMyZ29hbWxpS1R0Y2JpQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWlhoMGNtRmpkR1ZrVzNCaGRIUmxjbTVkSUQwZ2FtbGlPMXh1SUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdaWGgwY21GamRHVmtMbkpsYldGcGJtbHVaME5vYVd4a2NtVnVJRDBnWTJocGJHUnlaVzR1Wm1sc2RHVnlLQ2hxYVdJcElEMCtJQ0ZwYzAxaGRHTm9LR3BwWWlrcE8xeHVJQ0FnSUhKbGRIVnliaUJsZUhSeVlXTjBaV1E3WEc0Z0lIMWNibHh1SUNCdFlYQkRhR2xzWkhKbGJpaHdZWFIwWlhKdWN5d2dYMk5vYVd4a2NtVnVLU0I3WEc0Z0lDQWdiR1YwSUdOb2FXeGtjbVZ1SUQwZ0tDRkJjbkpoZVM1cGMwRnljbUY1S0Y5amFHbHNaSEpsYmlrcElEOGdXeUJmWTJocGJHUnlaVzRnWFNBNklGOWphR2xzWkhKbGJqdGNibHh1SUNBZ0lISmxkSFZ5YmlCamFHbHNaSEpsYmk1dFlYQW9LR3BwWWlrZ1BUNGdlMXh1SUNBZ0lDQWdhV1lnS0NGcWFXSXBYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQnFhV0k3WEc1Y2JpQWdJQ0FnSUd4bGRDQnFhV0pVZVhCbElEMGdhbWxpTGxSNWNHVTdYRzRnSUNBZ0lDQnBaaUFvSVZWMGFXeHpMbWx1YzNSaGJtTmxUMllvYW1saVZIbHdaU3dnSjNOMGNtbHVaeWNwS1Z4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYW1saU8xeHVYRzRnSUNBZ0lDQnFhV0pVZVhCbElEMGdhbWxpVkhsd1pTNTBiMHh2ZDJWeVEyRnpaU2dwTzF4dVhHNGdJQ0FnSUNCc1pYUWdhMlY1Y3lBOUlFOWlhbVZqZEM1clpYbHpLSEJoZEhSbGNtNXpLVHRjYmlBZ0lDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUd0bGVYTXViR1Z1WjNSb095QnBJRHdnYVd3N0lHa3JLeWtnZTF4dUlDQWdJQ0FnSUNCc1pYUWdhMlY1SUQwZ2EyVjVjMXRwWFR0Y2JpQWdJQ0FnSUNBZ2FXWWdLR3RsZVM1MGIweHZkMlZ5UTJGelpTZ3BJQ0U5UFNCcWFXSlVlWEJsS1Z4dUlDQWdJQ0FnSUNBZ0lHTnZiblJwYm5WbE8xeHVYRzRnSUNBZ0lDQWdJR3hsZENCdFpYUm9iMlFnUFNCd1lYUjBaWEp1YzF0clpYbGRPMXh1SUNBZ0lDQWdJQ0JwWmlBb0lXMWxkR2h2WkNsY2JpQWdJQ0FnSUNBZ0lDQmpiMjUwYVc1MVpUdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiV1YwYUc5a0xtTmhiR3dvZEdocGN5d2dhbWxpTENCcExDQmphR2xzWkhKbGJpazdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQnFhV0k3WEc0Z0lDQWdmU2s3WEc0Z0lIMWNibHh1SUNCa1pXSnZkVzVqWlNobWRXNWpMQ0IwYVcxbExDQmZhV1FwSUh0Y2JpQWdJQ0JqYjI1emRDQmpiR1ZoY2xCbGJtUnBibWRVYVcxbGIzVjBJRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdhV1lnS0hCbGJtUnBibWRVYVcxbGNpQW1KaUJ3Wlc1a2FXNW5WR2x0WlhJdWRHbHRaVzkxZENrZ2UxeHVJQ0FnSUNBZ0lDQmpiR1ZoY2xScGJXVnZkWFFvY0dWdVpHbHVaMVJwYldWeUxuUnBiV1Z2ZFhRcE8xeHVJQ0FnSUNBZ0lDQndaVzVrYVc1blZHbHRaWEl1ZEdsdFpXOTFkQ0E5SUc1MWJHdzdYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lIWmhjaUJwWkNBOUlDZ2hYMmxrS1NBL0lDZ25KeUFySUdaMWJtTXBJRG9nWDJsa08xeHVJQ0FnSUdsbUlDZ2hkR2hwY3k1a1pXSnZkVzVqWlZScGJXVnljeWtnZTF4dUlDQWdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25SNUtIUm9hWE1zSUNka1pXSnZkVzVqWlZScGJXVnljeWNzSUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdlMzBzWEc0Z0lDQWdJQ0I5S1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0IyWVhJZ2NHVnVaR2x1WjFScGJXVnlJRDBnZEdocGN5NWtaV0p2ZFc1alpWUnBiV1Z5YzF0cFpGMDdYRzRnSUNBZ2FXWWdLQ0Z3Wlc1a2FXNW5WR2x0WlhJcFhHNGdJQ0FnSUNCd1pXNWthVzVuVkdsdFpYSWdQU0IwYUdsekxtUmxZbTkxYm1ObFZHbHRaWEp6VzJsa1hTQTlJSHQ5TzF4dVhHNGdJQ0FnY0dWdVpHbHVaMVJwYldWeUxtWjFibU1nUFNCbWRXNWpPMXh1SUNBZ0lHTnNaV0Z5VUdWdVpHbHVaMVJwYldWdmRYUW9LVHRjYmx4dUlDQWdJSFpoY2lCd2NtOXRhWE5sSUQwZ2NHVnVaR2x1WjFScGJXVnlMbkJ5YjIxcGMyVTdYRzRnSUNBZ2FXWWdLQ0Z3Y205dGFYTmxJSHg4SUNGd2NtOXRhWE5sTG1selVHVnVaR2x1WnlncEtTQjdYRzRnSUNBZ0lDQnNaWFFnYzNSaGRIVnpJRDBnSjNCbGJtUnBibWNuTzF4dUlDQWdJQ0FnYkdWMElISmxjMjlzZG1VN1hHNWNiaUFnSUNBZ0lIQnliMjFwYzJVZ1BTQndaVzVrYVc1blZHbHRaWEl1Y0hKdmJXbHpaU0E5SUc1bGR5QlFjbTl0YVhObEtDaGZjbVZ6YjJ4MlpTa2dQVDRnZTF4dUlDQWdJQ0FnSUNCeVpYTnZiSFpsSUQwZ1gzSmxjMjlzZG1VN1hHNGdJQ0FnSUNCOUtUdGNibHh1SUNBZ0lDQWdjSEp2YldselpTNXlaWE52YkhabElEMGdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYzNSaGRIVnpJQ0U5UFNBbmNHVnVaR2x1WnljcFhHNGdJQ0FnSUNBZ0lDQWdjbVYwZFhKdU8xeHVYRzRnSUNBZ0lDQWdJSE4wWVhSMWN5QTlJQ2RtZFd4bWFXeHNaV1FuTzF4dUlDQWdJQ0FnSUNCamJHVmhjbEJsYm1ScGJtZFVhVzFsYjNWMEtDazdYRzRnSUNBZ0lDQWdJSFJvYVhNdVpHVmliM1Z1WTJWVWFXMWxjbk5iYVdSZElEMGdiblZzYkR0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JSEJsYm1ScGJtZFVhVzFsY2k1bWRXNWpJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQWdJQ0FnZG1GeUlISmxkQ0E5SUhCbGJtUnBibWRVYVcxbGNpNW1kVzVqTG1OaGJHd29kR2hwY3lrN1hHNGdJQ0FnSUNBZ0lDQWdhV1lnS0hKbGRDQnBibk4wWVc1alpXOW1JRkJ5YjIxcGMyVWdmSHdnS0hKbGRDQW1KaUIwZVhCbGIyWWdjbVYwTG5Sb1pXNGdQVDA5SUNkbWRXNWpkR2x2YmljcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMExuUm9aVzRvS0haaGJIVmxLU0E5UGlCeVpYTnZiSFpsS0haaGJIVmxLU2s3WEc0Z0lDQWdJQ0FnSUNBZ1pXeHpaVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnpiMngyWlNoeVpYUXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUhKbGMyOXNkbVVvS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZUdGNibHh1SUNBZ0lDQWdjSEp2YldselpTNWpZVzVqWld3Z1BTQW9LU0E5UGlCN1hHNGdJQ0FnSUNBZ0lITjBZWFIxY3lBOUlDZHlaV3BsWTNSbFpDYzdYRzRnSUNBZ0lDQWdJR05zWldGeVVHVnVaR2x1WjFScGJXVnZkWFFvS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVrWldKdmRXNWpaVlJwYldWeWMxdHBaRjBnUFNCdWRXeHNPMXh1WEc0Z0lDQWdJQ0FnSUhCeWIyMXBjMlV1Y21WemIyeDJaU2dwTzF4dUlDQWdJQ0FnZlR0Y2JseHVJQ0FnSUNBZ2NISnZiV2x6WlM1cGMxQmxibVJwYm1jZ1BTQW9LU0E5UGlCN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlBb2MzUmhkSFZ6SUQwOVBTQW5jR1Z1WkdsdVp5Y3BPMXh1SUNBZ0lDQWdmVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQXZMeUJsYzJ4cGJuUXRaR2x6WVdKc1pTMXVaWGgwTFd4cGJtVWdibTh0YldGbmFXTXRiblZ0WW1WeWMxeHVJQ0FnSUhCbGJtUnBibWRVYVcxbGNpNTBhVzFsYjNWMElEMGdjMlYwVkdsdFpXOTFkQ2h3Y205dGFYTmxMbkpsYzI5c2RtVXNJQ2gwYVcxbElEMDlJRzUxYkd3cElEOGdNalV3SURvZ2RHbHRaU2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdjSEp2YldselpUdGNiaUFnZlZ4dVhHNGdJR05zWldGeVJHVmliM1Z1WTJVb2FXUXBJSHRjYmlBZ0lDQnBaaUFvSVhSb2FYTXVaR1ZpYjNWdVkyVlVhVzFsY25NcFhHNGdJQ0FnSUNCeVpYUjFjbTQ3WEc1Y2JpQWdJQ0IyWVhJZ2NHVnVaR2x1WjFScGJXVnlJRDBnZEdocGN5NWtaV0p2ZFc1alpWUnBiV1Z5YzF0cFpGMDdYRzRnSUNBZ2FXWWdLSEJsYm1ScGJtZFVhVzFsY2lBOVBTQnVkV3hzS1Z4dUlDQWdJQ0FnY21WMGRYSnVPMXh1WEc0Z0lDQWdhV1lnS0hCbGJtUnBibWRVYVcxbGNpNTBhVzFsYjNWMEtWeHVJQ0FnSUNBZ1kyeGxZWEpVYVcxbGIzVjBLSEJsYm1ScGJtZFVhVzFsY2k1MGFXMWxiM1YwS1R0Y2JseHVJQ0FnSUdsbUlDaHdaVzVrYVc1blZHbHRaWEl1Y0hKdmJXbHpaU2xjYmlBZ0lDQWdJSEJsYm1ScGJtZFVhVzFsY2k1d2NtOXRhWE5sTG1OaGJtTmxiQ2dwTzF4dUlDQjlYRzVjYmlBZ1kyeGxZWEpCYkd4RVpXSnZkVzVqWlhNb0tTQjdYRzRnSUNBZ2JHVjBJR1JsWW05MWJtTmxWR2x0WlhKeklDQTlJSFJvYVhNdVpHVmliM1Z1WTJWVWFXMWxjbk1nZkh3Z2UzMDdYRzRnSUNBZ2JHVjBJR2xrY3lBZ0lDQWdJQ0FnSUNBZ0lDQTlJRTlpYW1WamRDNXJaWGx6S0dSbFltOTFibU5sVkdsdFpYSnpLVHRjYmx4dUlDQWdJR1p2Y2lBb2JHVjBJR2tnUFNBd0xDQnBiQ0E5SUdsa2N5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLVnh1SUNBZ0lDQWdkR2hwY3k1amJHVmhja1JsWW05MWJtTmxLR2xrYzF0cFhTazdYRzRnSUgxY2JseHVJQ0JuWlhSRmJHVnRaVzUwUkdGMFlTaGxiR1Z0Wlc1MEtTQjdYRzRnSUNBZ2JHVjBJR1JoZEdFZ1BTQmxiR1Z0Wlc1MFJHRjBZVU5oWTJobExtZGxkQ2hsYkdWdFpXNTBLVHRjYmlBZ0lDQnBaaUFvSVdSaGRHRXBJSHRjYmlBZ0lDQWdJR1JoZEdFZ1BTQjdmVHRjYmlBZ0lDQWdJR1ZzWlcxbGJuUkVZWFJoUTJGamFHVXVjMlYwS0dWc1pXMWxiblFzSUdSaGRHRXBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lISmxkSFZ5YmlCa1lYUmhPMXh1SUNCOVhHNWNiaUFnYldWdGIybDZaU2htZFc1aktTQjdYRzRnSUNBZ2JHVjBJR05oWTJobFNVUTdYRzRnSUNBZ2JHVjBJR05oWTJobFpGSmxjM1ZzZER0Y2JseHVJQ0FnSUhKbGRIVnliaUJtZFc1amRHbHZiaWd1TGk1aGNtZHpLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2JtVjNRMkZqYUdWSlJDQTlJR1JsWVdSaVpXVm1LQzR1TG1GeVozTXBPMXh1SUNBZ0lDQWdhV1lnS0c1bGQwTmhZMmhsU1VRZ0lUMDlJR05oWTJobFNVUXBJSHRjYmlBZ0lDQWdJQ0FnYkdWMElISmxjM1ZzZENBOUlHWjFibU11WVhCd2JIa29kR2hwY3l3Z1lYSm5jeWs3WEc1Y2JpQWdJQ0FnSUNBZ1kyRmphR1ZKUkNBOUlHNWxkME5oWTJobFNVUTdYRzRnSUNBZ0lDQWdJR05oWTJobFpGSmxjM1ZzZENBOUlISmxjM1ZzZER0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdOaFkyaGxaRkpsYzNWc2REdGNiaUFnSUNCOU8xeHVJQ0I5WEc1Y2JpQWdkRzlVWlhKdEtIUmxjbTBwSUh0Y2JpQWdJQ0JwWmlBb2FYTkthV0pwYzJnb2RHVnliU2twSUh0Y2JpQWdJQ0FnSUd4bGRDQnFhV0lnUFNCamIyNXpkSEoxWTNSS2FXSW9kR1Z5YlNrN1hHNWNiaUFnSUNBZ0lHbG1JQ2hxYVdJdVZIbHdaU0E5UFQwZ1ZHVnliU2xjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJsY20wN1hHNWNiaUFnSUNBZ0lHbG1JQ2hxYVdJdVZIbHdaU0FtSmlCcWFXSXVWSGx3WlZ0VVJWSk5YME5QVFZCUFRrVk9WRjlVV1ZCRlgwTklSVU5MWFNsY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSbGNtMDdYRzVjYmlBZ0lDQWdJSEpsZEhWeWJpQWtLRlJsY20wc0lHcHBZaTV3Y205d2N5a29MaTR1YW1saUxtTm9hV3hrY21WdUtUdGNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tIUjVjR1Z2WmlCMFpYSnRJRDA5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUNBZ2NtVjBkWEp1SUNRb1ZHVnliU2tvZEdWeWJTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2NtVjBkWEp1SUhSbGNtMDdYRzRnSUgxY2JuMWNibHh1WTI5dWMzUWdWRVZTVFY5RFQwMVFUMDVGVGxSZlZGbFFSVjlEU0VWRFN5QTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMmx6VkdWeWJTY3BPMXh1WEc1amJHRnpjeUJVWlhKdElHVjRkR1Z1WkhNZ1EyOXRjRzl1Wlc1MElIdGNiaUFnY21WemIyeDJaVlJsY20wb1lYSm5jeWtnZTF4dUlDQWdJR3hsZENCMFpYSnRVbVZ6YjJ4MlpYSWdQU0IwYUdsekxtTnZiblJsZUhRdVgzUmxjbTFTWlhOdmJIWmxjanRjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JSFJsY20xU1pYTnZiSFpsY2lBOVBUMGdKMloxYm1OMGFXOXVKeWxjYmlBZ0lDQWdJSEpsZEhWeWJpQjBaWEp0VW1WemIyeDJaWEl1WTJGc2JDaDBhR2x6TENCaGNtZHpLVHRjYmx4dUlDQWdJR3hsZENCamFHbHNaSEpsYmlBOUlDaGhjbWR6TG1Ob2FXeGtjbVZ1SUh4OElGdGRLVHRjYmlBZ0lDQnlaWFIxY200Z1kyaHBiR1J5Wlc1YlkyaHBiR1J5Wlc0dWJHVnVaM1JvSUMwZ01WMGdmSHdnSnljN1hHNGdJSDFjYmx4dUlDQnlaVzVrWlhJb1kyaHBiR1J5Wlc0cElIdGNiaUFnSUNCc1pYUWdkR1Z5YlNBOUlIUm9hWE11Y21WemIyeDJaVlJsY20wb2V5QmphR2xzWkhKbGJpd2djSEp2Y0hNNklIUm9hWE11Y0hKdmNITWdmU2s3WEc0Z0lDQWdjbVYwZFhKdUlDUW9KMU5RUVU0bkxDQjBhR2x6TG5CeWIzQnpLU2gwWlhKdEtUdGNiaUFnZlZ4dWZWeHVYRzVVWlhKdFcxUkZVazFmUTA5TlVFOU9SVTVVWDFSWlVFVmZRMGhGUTB0ZElEMGdkSEoxWlR0Y2JseHVaWGh3YjNKMElIdGNiaUFnVkdWeWJTeGNibjA3WEc0aUxDSmpiMjV6ZENCRlZrVk9WRjlNU1ZOVVJVNUZVbE1nUFNCVGVXMWliMnd1Wm05eUtDZEFhbWxpY3k5bGRtVnVkSE12YkdsemRHVnVaWEp6SnlrN1hHNWNibVY0Y0c5eWRDQmpiR0Z6Y3lCRmRtVnVkRVZ0YVhSMFpYSWdlMXh1SUNCamIyNXpkSEoxWTNSdmNpZ3BJSHRjYmlBZ0lDQlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkR2xsY3loMGFHbHpMQ0I3WEc0Z0lDQWdJQ0JiUlZaRlRsUmZURWxUVkVWT1JWSlRYVG9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJRzVsZHlCTllYQW9LU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdmU2s3WEc0Z0lIMWNibHh1SUNCaFpHUk1hWE4wWlc1bGNpaGxkbVZ1ZEU1aGJXVXNJR3hwYzNSbGJtVnlLU0I3WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUJzYVhOMFpXNWxjaUFoUFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNBZ0lIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9KMFYyWlc1MElHeHBjM1JsYm1WeUlHMTFjM1FnWW1VZ1lTQnRaWFJvYjJRbktUdGNibHh1SUNBZ0lHeGxkQ0JsZG1WdWRFMWhjQ0FnUFNCMGFHbHpXMFZXUlU1VVgweEpVMVJGVGtWU1UxMDdYRzRnSUNBZ2JHVjBJSE5qYjNCbElDQWdJQ0E5SUdWMlpXNTBUV0Z3TG1kbGRDaGxkbVZ1ZEU1aGJXVXBPMXh1WEc0Z0lDQWdhV1lnS0NGelkyOXdaU2tnZTF4dUlDQWdJQ0FnYzJOdmNHVWdQU0JiWFR0Y2JpQWdJQ0FnSUdWMlpXNTBUV0Z3TG5ObGRDaGxkbVZ1ZEU1aGJXVXNJSE5qYjNCbEtUdGNiaUFnSUNCOVhHNWNiaUFnSUNCelkyOXdaUzV3ZFhOb0tHeHBjM1JsYm1WeUtUdGNibHh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpPMXh1SUNCOVhHNWNiaUFnY21WdGIzWmxUR2x6ZEdWdVpYSW9aWFpsYm5ST1lXMWxMQ0JzYVhOMFpXNWxjaWtnZTF4dUlDQWdJR2xtSUNoMGVYQmxiMllnYkdsemRHVnVaWElnSVQwOUlDZG1kVzVqZEdsdmJpY3BYRzRnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dWSGx3WlVWeWNtOXlLQ2RGZG1WdWRDQnNhWE4wWlc1bGNpQnRkWE4wSUdKbElHRWdiV1YwYUc5a0p5azdYRzVjYmlBZ0lDQnNaWFFnWlhabGJuUk5ZWEFnSUQwZ2RHaHBjMXRGVmtWT1ZGOU1TVk5VUlU1RlVsTmRPMXh1SUNBZ0lHeGxkQ0J6WTI5d1pTQWdJQ0FnUFNCbGRtVnVkRTFoY0M1blpYUW9aWFpsYm5ST1lXMWxLVHRjYmlBZ0lDQnBaaUFvSVhOamIzQmxLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUm9hWE03WEc1Y2JpQWdJQ0JzWlhRZ2FXNWtaWGdnUFNCelkyOXdaUzVwYm1SbGVFOW1LR3hwYzNSbGJtVnlLVHRjYmlBZ0lDQnBaaUFvYVc1a1pYZ2dQajBnTUNsY2JpQWdJQ0FnSUhOamIzQmxMbk53YkdsalpTaHBibVJsZUN3Z01TazdYRzVjYmlBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ2ZWeHVYRzRnSUhKbGJXOTJaVUZzYkV4cGMzUmxibVZ5Y3lobGRtVnVkRTVoYldVcElIdGNiaUFnSUNCc1pYUWdaWFpsYm5STllYQWdJRDBnZEdocGMxdEZWa1ZPVkY5TVNWTlVSVTVGVWxOZE8xeHVJQ0FnSUdsbUlDZ2haWFpsYm5STllYQXVhR0Z6S0dWMlpXNTBUbUZ0WlNrcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEdocGN6dGNibHh1SUNBZ0lHVjJaVzUwVFdGd0xuTmxkQ2hsZG1WdWRFNWhiV1VzSUZ0ZEtUdGNibHh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpPMXh1SUNCOVhHNWNiaUFnWlcxcGRDaGxkbVZ1ZEU1aGJXVXNJQzR1TG1GeVozTXBJSHRjYmlBZ0lDQnNaWFFnWlhabGJuUk5ZWEFnSUQwZ2RHaHBjMXRGVmtWT1ZGOU1TVk5VUlU1RlVsTmRPMXh1SUNBZ0lHeGxkQ0J6WTI5d1pTQWdJQ0FnUFNCbGRtVnVkRTFoY0M1blpYUW9aWFpsYm5ST1lXMWxLVHRjYmlBZ0lDQnBaaUFvSVhOamIzQmxJSHg4SUhOamIzQmxMbXhsYm1kMGFDQTlQVDBnTUNsY2JpQWdJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNBZ0lHWnZjaUFvYkdWMElHa2dQU0F3TENCcGJDQTlJSE5qYjNCbExteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BJSHRjYmlBZ0lDQWdJR3hsZENCbGRtVnVkRU5oYkd4aVlXTnJJRDBnYzJOdmNHVmJhVjA3WEc0Z0lDQWdJQ0JsZG1WdWRFTmhiR3hpWVdOckxtRndjR3g1S0hSb2FYTXNJR0Z5WjNNcE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0I5WEc1Y2JpQWdiMjVqWlNobGRtVnVkRTVoYldVc0lHeHBjM1JsYm1WeUtTQjdYRzRnSUNBZ2JHVjBJR1oxYm1NZ1BTQW9MaTR1WVhKbmN5a2dQVDRnZTF4dUlDQWdJQ0FnZEdocGN5NXZabVlvWlhabGJuUk9ZVzFsTENCbWRXNWpLVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQnNhWE4wWlc1bGNpZ3VMaTVoY21kektUdGNiaUFnSUNCOU8xeHVYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTXViMjRvWlhabGJuUk9ZVzFsTENCbWRXNWpLVHRjYmlBZ2ZWeHVYRzRnSUc5dUtHVjJaVzUwVG1GdFpTd2diR2x6ZEdWdVpYSXBJSHRjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTVoWkdSTWFYTjBaVzVsY2lobGRtVnVkRTVoYldVc0lHeHBjM1JsYm1WeUtUdGNiaUFnZlZ4dVhHNGdJRzltWmlobGRtVnVkRTVoYldVc0lHeHBjM1JsYm1WeUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTXVjbVZ0YjNabFRHbHpkR1Z1WlhJb1pYWmxiblJPWVcxbExDQnNhWE4wWlc1bGNpazdYRzRnSUgxY2JseHVJQ0JsZG1WdWRFNWhiV1Z6S0NrZ2UxeHVJQ0FnSUhKbGRIVnliaUJCY25KaGVTNW1jbTl0S0hSb2FYTmJSVlpGVGxSZlRFbFRWRVZPUlZKVFhTNXJaWGx6S0NrcE8xeHVJQ0I5WEc1Y2JpQWdiR2x6ZEdWdVpYSkRiM1Z1ZENobGRtVnVkRTVoYldVcElIdGNiaUFnSUNCc1pYUWdaWFpsYm5STllYQWdJRDBnZEdocGMxdEZWa1ZPVkY5TVNWTlVSVTVGVWxOZE8xeHVJQ0FnSUd4bGRDQnpZMjl3WlNBZ0lDQWdQU0JsZG1WdWRFMWhjQzVuWlhRb1pYWmxiblJPWVcxbEtUdGNiaUFnSUNCcFppQW9JWE5qYjNCbEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SURBN1hHNWNiaUFnSUNCeVpYUjFjbTRnYzJOdmNHVXViR1Z1WjNSb08xeHVJQ0I5WEc1Y2JpQWdiR2x6ZEdWdVpYSnpLR1YyWlc1MFRtRnRaU2tnZTF4dUlDQWdJR3hsZENCbGRtVnVkRTFoY0NBZ1BTQjBhR2x6VzBWV1JVNVVYMHhKVTFSRlRrVlNVMTA3WEc0Z0lDQWdiR1YwSUhOamIzQmxJQ0FnSUNBOUlHVjJaVzUwVFdGd0xtZGxkQ2hsZG1WdWRFNWhiV1VwTzF4dUlDQWdJR2xtSUNnaGMyTnZjR1VwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdXMTA3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdjMk52Y0dVdWMyeHBZMlVvS1R0Y2JpQWdmVnh1ZlZ4dUlpd2lhVzF3YjNKMElHUmxZV1JpWldWbUlHWnliMjBnSjJSbFlXUmlaV1ZtSnp0Y2JtbHRjRzl5ZENBcUlHRnpJRlYwYVd4eklHWnliMjBnSnk0dmRYUnBiSE11YW5Nbk8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1NtbGlJSHRjYmlBZ1kyOXVjM1J5ZFdOMGIzSW9WSGx3WlN3Z2NISnZjSE1zSUdOb2FXeGtjbVZ1S1NCN1hHNGdJQ0FnYkdWMElHUmxabUYxYkhSUWNtOXdjeUE5SUNoVWVYQmxJQ1ltSUZSNWNHVXVjSEp2Y0hNcElEOGdWSGx3WlM1d2NtOXdjeUE2SUh0OU8xeHVYRzRnSUNBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUnBaWE1vZEdocGN5d2dlMXh1SUNBZ0lDQWdKMVI1Y0dVbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQjBjblZsTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnVkhsd1pTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQW5jSEp2Y0hNbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQjBjblZsTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnZXlCYlNrbENYME5JU1V4RVgwbE9SRVZZWDFCU1QxQmRPaUF3TENBdUxpNWtaV1poZFd4MFVISnZjSE1zSUM0dUxpaHdjbTl3Y3lCOGZDQjdmU2tnZlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBblkyaHBiR1J5Wlc0bk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQjBjblZsTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnVlhScGJITXVabXhoZEhSbGJrRnljbUY1S0dOb2FXeGtjbVZ1S1N4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnZlNrN1hHNGdJSDFjYm4xY2JseHVaWGh3YjNKMElHTnZibk4wSUVwSlFsOUNRVkpTUlU0Z0lDQWdJQ0FnSUNBZ0lEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTXVZbUZ5Y21WdUp5azdYRzVsZUhCdmNuUWdZMjl1YzNRZ1NrbENYMUJTVDFoWklDQWdJQ0FnSUNBZ0lDQWdQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljeTV3Y205NGVTY3BPMXh1Wlhod2IzSjBJR052Ym5OMElFcEpRbDlTUVZkZlZFVllWQ0FnSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk11Y21GM1ZHVjRkQ2NwTzF4dVpYaHdiM0owSUdOdmJuTjBJRXBKUWlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5NdWFtbGlKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdTa2xDWDBOSVNVeEVYMGxPUkVWWVgxQlNUMUFnUFNCVGVXMWliMnd1Wm05eUtDZEFhbWxpY3k1amFHbHNaRWx1WkdWNFVISnZjQ2NwTzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1ptRmpkRzl5ZVNoS2FXSkRiR0Z6Y3lrZ2UxeHVJQ0JtZFc1amRHbHZiaUFrS0Y5MGVYQmxMQ0J3Y205d2N5QTlJSHQ5S1NCN1hHNGdJQ0FnYVdZZ0tHbHpTbWxpYVhOb0tGOTBlWEJsS1NsY2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0oxSmxZMlZwZG1Wa0lHRWdhbWxpSUdKMWRDQmxlSEJsWTNSbFpDQmhJR052YlhCdmJtVnVkQzRuS1R0Y2JseHVJQ0FnSUd4bGRDQlVlWEJsSUQwZ0tGOTBlWEJsSUQwOUlHNTFiR3dwSUQ4Z1NrbENYMUJTVDFoWklEb2dYM1I1Y0dVN1hHNWNiaUFnSUNCbWRXNWpkR2x2YmlCaVlYSnlaVzRvTGk0dVgyTm9hV3hrY21WdUtTQjdYRzRnSUNBZ0lDQnNaWFFnWTJocGJHUnlaVzRnUFNCZlkyaHBiR1J5Wlc0N1hHNWNiaUFnSUNBZ0lHWjFibU4wYVc5dUlHcHBZaWdwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9WSGx3WlN3Z0ozQnliMjFwYzJVbktTQjhmQ0JqYUdsc1pISmxiaTV6YjIxbEtDaGphR2xzWkNrZ1BUNGdWWFJwYkhNdWFXNXpkR0Z1WTJWUFppaGphR2xzWkN3Z0ozQnliMjFwYzJVbktTa3BJSHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnVUhKdmJXbHpaUzVoYkd3b1d5QlVlWEJsSUYwdVkyOXVZMkYwS0dOb2FXeGtjbVZ1S1NrdWRHaGxiaWdvWVd4c0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQlVlWEJsSUQwZ1lXeHNXekJkTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMmhwYkdSeVpXNGdQU0JoYkd3dWMyeHBZMlVvTVNrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1WlhjZ1NtbGlRMnhoYzNNb1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUZSNWNHVXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnliM0J6TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0JqYUdsc1pISmxiaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDazdYRzRnSUNBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUVwcFlrTnNZWE56S0Z4dUlDQWdJQ0FnSUNBZ0lGUjVjR1VzWEc0Z0lDQWdJQ0FnSUNBZ2NISnZjSE1zWEc0Z0lDQWdJQ0FnSUNBZ1kyaHBiR1J5Wlc0c1hHNGdJQ0FnSUNBZ0lDazdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowYVdWektHcHBZaXdnZTF4dUlDQWdJQ0FnSUNCYlNrbENYVG9nZTF4dUlDQWdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDQWdXMlJsWVdSaVpXVm1MbWxrVTNsdFhUb2dlMXh1SUNBZ0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ0tDa2dQVDRnVkhsd1pTeGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJSDBwTzF4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnYW1saU8xeHVJQ0FnSUgxY2JseHVJQ0FnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGFXVnpLR0poY25KbGJpd2dlMXh1SUNBZ0lDQWdXMHBKUWw5Q1FWSlNSVTVkT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dabUZzYzJVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQmJaR1ZoWkdKbFpXWXVhV1JUZVcxZE9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ0tDa2dQVDRnVkhsd1pTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ2ZTazdYRzVjYmlBZ0lDQnlaWFIxY200Z1ltRnljbVZ1TzF4dUlDQjlYRzVjYmlBZ1QySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUnBaWE1vSkN3Z2UxeHVJQ0FnSUNkeVpXMWhjQ2M2SUh0Y2JpQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnS0Y5cWFXSXNJR05oYkd4aVlXTnJLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHeGxkQ0JxYVdJZ1BTQmZhbWxpTzF4dUlDQWdJQ0FnSUNCcFppQW9hbWxpSUQwOUlHNTFiR3dnZkh3Z1QySnFaV04wTG1sektHcHBZaXdnU1c1bWFXNXBkSGtwSUh4OElFOWlhbVZqZEM1cGN5aHFhV0lzSUU1aFRpa3BYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR3BwWWp0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvYVhOS2FXSnBjMmdvYW1saUtTbGNiaUFnSUNBZ0lDQWdJQ0JxYVdJZ1BTQmpiMjV6ZEhKMVkzUkthV0lvYW1saUtUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQm1hVzVoYkdsNlpVMWhjQ0E5SUNoZmJXRndjR1ZrU21saUtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJRzFoY0hCbFpFcHBZaUE5SUY5dFlYQndaV1JLYVdJN1hHNWNiaUFnSUNBZ0lDQWdJQ0JwWmlBb2FYTkthV0pwYzJnb2JXRndjR1ZrU21saUtTbGNiaUFnSUNBZ0lDQWdJQ0FnSUcxaGNIQmxaRXBwWWlBOUlHTnZibk4wY25WamRFcHBZaWh0WVhCd1pXUkthV0lwTzF4dUlDQWdJQ0FnSUNBZ0lHVnNjMlZjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCdFlYQndaV1JLYVdJN1hHNWNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdKQ2h0WVhCd1pXUkthV0l1Vkhsd1pTd2diV0Z3Y0dWa1NtbGlMbkJ5YjNCektTZ3VMaTRvYldGd2NHVmtTbWxpTG1Ob2FXeGtjbVZ1SUh4OElGdGRLU2s3WEc0Z0lDQWdJQ0FnSUgwN1hHNWNiaUFnSUNBZ0lDQWdiR1YwSUcxaGNIQmxaRXBwWWlBOUlHTmhiR3hpWVdOcktHcHBZaWs3WEc0Z0lDQWdJQ0FnSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHMWhjSEJsWkVwcFlpd2dKM0J5YjIxcGMyVW5LU2xjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYldGd2NHVmtTbWxpTG5Sb1pXNG9abWx1WVd4cGVtVk5ZWEFwTzF4dVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCbWFXNWhiR2w2WlUxaGNDaHRZWEJ3WldSS2FXSXBPMXh1SUNBZ0lDQWdmU3hjYmlBZ0lDQjlMRnh1SUNCOUtUdGNibHh1SUNCeVpYUjFjbTRnSkR0Y2JuMWNibHh1Wlhod2IzSjBJR052Ym5OMElDUWdQU0JtWVdOMGIzSjVLRXBwWWlrN1hHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnBjMHBwWW1semFDaDJZV3gxWlNrZ2UxeHVJQ0JwWmlBb2RIbHdaVzltSUhaaGJIVmxJRDA5UFNBblpuVnVZM1JwYjI0bklDWW1JQ2gyWVd4MVpWdEtTVUpmUWtGU1VrVk9YU0I4ZkNCMllXeDFaVnRLU1VKZEtTbGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNCcFppQW9kbUZzZFdVZ2FXNXpkR0Z1WTJWdlppQkthV0lwWEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdjbVYwZFhKdUlHWmhiSE5sTzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdZMjl1YzNSeWRXTjBTbWxpS0haaGJIVmxLU0I3WEc0Z0lHbG1JQ2gyWVd4MVpTQnBibk4wWVc1alpXOW1JRXBwWWlsY2JpQWdJQ0J5WlhSMWNtNGdkbUZzZFdVN1hHNWNiaUFnYVdZZ0tIUjVjR1Z2WmlCMllXeDFaU0E5UFQwZ0oyWjFibU4wYVc5dUp5a2dlMXh1SUNBZ0lHbG1JQ2gyWVd4MVpWdEtTVUpmUWtGU1VrVk9YU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjJZV3gxWlNncEtDazdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNkV1ZiU2tsQ1hTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCMllXeDFaU2dwTzF4dUlDQjlYRzVjYmlBZ2RHaHliM2NnYm1WM0lGUjVjR1ZGY25KdmNpZ25ZMjl1YzNSeWRXTjBTbWxpT2lCUWNtOTJhV1JsWkNCMllXeDFaU0JwY3lCdWIzUWdZU0JLYVdJdUp5azdYRzU5WEc1Y2JtVjRjRzl5ZENCaGMzbHVZeUJtZFc1amRHbHZiaUJ5WlhOdmJIWmxRMmhwYkdSeVpXNG9YMk5vYVd4a2NtVnVLU0I3WEc0Z0lHeGxkQ0JqYUdsc1pISmxiaUE5SUY5amFHbHNaSEpsYmp0Y2JseHVJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmloamFHbHNaSEpsYml3Z0ozQnliMjFwYzJVbktTbGNiaUFnSUNCamFHbHNaSEpsYmlBOUlHRjNZV2wwSUdOb2FXeGtjbVZ1TzF4dVhHNGdJR2xtSUNnaEtDaDBhR2x6TG1selNYUmxjbUZpYkdWRGFHbHNaQ0I4ZkNCVmRHbHNjeTVwYzBsMFpYSmhZbXhsUTJocGJHUXBMbU5oYkd3b2RHaHBjeXdnWTJocGJHUnlaVzRwS1NBbUppQW9hWE5LYVdKcGMyZ29ZMmhwYkdSeVpXNHBJSHg4SUNnb2RHaHBjeTVwYzFaaGJHbGtRMmhwYkdRZ2ZId2dWWFJwYkhNdWFYTldZV3hwWkVOb2FXeGtLUzVqWVd4c0tIUm9hWE1zSUdOb2FXeGtjbVZ1S1NrcEtWeHVJQ0FnSUdOb2FXeGtjbVZ1SUQwZ1d5QmphR2xzWkhKbGJpQmRPMXh1WEc0Z0lHeGxkQ0J3Y205dGFYTmxjeUE5SUZWMGFXeHpMbWwwWlhKaGRHVW9ZMmhwYkdSeVpXNHNJR0Z6ZVc1aklDaDdJSFpoYkhWbE9pQmZZMmhwYkdRZ2ZTa2dQVDRnZTF4dUlDQWdJR3hsZENCamFHbHNaQ0E5SUNoVmRHbHNjeTVwYm5OMFlXNWpaVTltS0Y5amFHbHNaQ3dnSjNCeWIyMXBjMlVuS1NrZ1B5QmhkMkZwZENCZlkyaHBiR1FnT2lCZlkyaHBiR1E3WEc1Y2JpQWdJQ0JwWmlBb2FYTkthV0pwYzJnb1kyaHBiR1FwS1Z4dUlDQWdJQ0FnY21WMGRYSnVJR0YzWVdsMElHTnZibk4wY25WamRFcHBZaWhqYUdsc1pDazdYRzRnSUNBZ1pXeHpaVnh1SUNBZ0lDQWdjbVYwZFhKdUlHTm9hV3hrTzF4dUlDQjlLVHRjYmx4dUlDQnlaWFIxY200Z1lYZGhhWFFnVUhKdmJXbHpaUzVoYkd3b2NISnZiV2x6WlhNcE8xeHVmVnh1SWl3aVpYaHdiM0owSUh0Y2JpQWdRMDlPVkVWWVZGOUpSQ3hjYmlBZ1VtOXZkRTV2WkdVc1hHNTlJR1p5YjIwZ0p5NHZjbTl2ZEMxdWIyUmxMbXB6Snp0Y2JseHVaWGh3YjNKMElHTnZibk4wSUVaUFVrTkZYMUpGUmt4UFZ5QTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpSbTl5WTJWU1pXWnNiM2NuS1R0Y2JseHVaWGh3YjNKMElIc2dVbVZ1WkdWeVpYSWdmU0JtY205dElDY3VMM0psYm1SbGNtVnlMbXB6Snp0Y2JpSXNJbWx0Y0c5eWRDQjdYRzRnSUVOUFRsUkZXRlJmU1VRc1hHNGdJRkp2YjNST2IyUmxMRnh1ZlNCbWNtOXRJQ2N1TDNKdmIzUXRibTlrWlM1cWN5YzdYRzVjYm1OdmJuTjBJRWxPU1ZSSlFVeGZRMDlPVkVWWVZGOUpSQ0E5SURGdU8xeHViR1YwSUY5amIyNTBaWGgwU1VSRGIzVnVkR1Z5SUQwZ1NVNUpWRWxCVEY5RFQwNVVSVmhVWDBsRU8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1VtVnVaR1Z5WlhJZ1pYaDBaVzVrY3lCU2IyOTBUbTlrWlNCN1hHNGdJSE4wWVhScFl5QlNiMjkwVG05a1pTQTlJRkp2YjNST2IyUmxPMXh1WEc0Z0lHTnZibk4wY25WamRHOXlLRzl3ZEdsdmJuTXBJSHRjYmlBZ0lDQnpkWEJsY2lodWRXeHNMQ0J1ZFd4c0xDQnVkV3hzS1R0Y2JseHVJQ0FnSUU5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGFXVnpLSFJvYVhNc0lIdGNiaUFnSUNBZ0lDZHZjSFJwYjI1ekp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lHOXdkR2x2Ym5NZ2ZId2dlMzBzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJSDBwTzF4dVhHNGdJQ0FnZEdocGN5NXlaVzVrWlhKbGNpQTlJSFJvYVhNN1hHNWNiaUFnSUNCcFppQW9kSGx3Wlc5bUlHOXdkR2x2Ym5NdWRHVnliVkpsYzI5c2RtVnlJRDA5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ2RHaHBjeTVqYjI1MFpYaDBMbDkwWlhKdFVtVnpiMngyWlhJZ1BTQnZjSFJwYjI1ekxuUmxjbTFTWlhOdmJIWmxjanRjYmlBZ2ZWeHVYRzRnSUdkbGRFOXdkR2x2Ym5Nb0tTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTXViM0IwYVc5dWN6dGNiaUFnZlZ4dVhHNGdJSEpsYzI5c2RtVlVaWEp0S0dGeVozTXBJSHRjYmlBZ0lDQnNaWFFnZXlCMFpYSnRVbVZ6YjJ4MlpYSWdmU0E5SUhSb2FYTXVaMlYwVDNCMGFXOXVjeWdwTzF4dUlDQWdJR2xtSUNoMGVYQmxiMllnZEdWeWJWSmxjMjlzZG1WeUlEMDlQU0FuWm5WdVkzUnBiMjRuS1Z4dUlDQWdJQ0FnY21WMGRYSnVJSFJsY20xU1pYTnZiSFpsY2k1allXeHNLSFJvYVhNc0lHRnlaM01wTzF4dVhHNGdJQ0FnYkdWMElHTm9hV3hrY21WdUlEMGdLR0Z5WjNNdVkyaHBiR1J5Wlc0Z2ZId2dXMTBwTzF4dUlDQWdJSEpsZEhWeWJpQmphR2xzWkhKbGJsdGphR2xzWkhKbGJpNXNaVzVuZEdnZ0xTQXhYU0I4ZkNBbkp6dGNiaUFnZlZ4dVhHNGdJR055WldGMFpVTnZiblJsZUhRb2NtOXZkRU52Ym5SbGVIUXNJRzl1VlhCa1lYUmxMQ0J2YmxWd1pHRjBaVlJvYVhNcElIdGNiaUFnSUNCc1pYUWdZMjl1ZEdWNGRDQWdJQ0FnUFNCUFltcGxZM1F1WTNKbFlYUmxLRzUxYkd3cE8xeHVJQ0FnSUd4bGRDQnRlVU52Ym5SbGVIUkpSQ0E5SUNoeWIyOTBRMjl1ZEdWNGRDa2dQeUJ5YjI5MFEyOXVkR1Y0ZEZ0RFQwNVVSVmhVWDBsRVhTQTZJRWxPU1ZSSlFVeGZRMDlPVkVWWVZGOUpSRHRjYmx4dUlDQWdJSEpsZEhWeWJpQnVaWGNnVUhKdmVIa29ZMjl1ZEdWNGRDd2dlMXh1SUNBZ0lDQWdaMlYwT2lBb2RHRnlaMlYwTENCd2NtOXdUbUZ0WlNrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0JwWmlBb2NISnZjRTVoYldVZ1BUMDlJRU5QVGxSRldGUmZTVVFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQnNaWFFnY0dGeVpXNTBTVVFnUFNBb2NtOXZkRU52Ym5SbGVIUXBJRDhnY205dmRFTnZiblJsZUhSYlEwOU9WRVZZVkY5SlJGMGdPaUJKVGtsVVNVRk1YME5QVGxSRldGUmZTVVE3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUNod1lYSmxiblJKUkNBK0lHMTVRMjl1ZEdWNGRFbEVLU0EvSUhCaGNtVnVkRWxFSURvZ2JYbERiMjUwWlhoMFNVUTdYRzRnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNCcFppQW9JVTlpYW1WamRDNXdjbTkwYjNSNWNHVXVhR0Z6VDNkdVVISnZjR1Z5ZEhrdVkyRnNiQ2gwWVhKblpYUXNJSEJ5YjNCT1lXMWxLU2xjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnS0hKdmIzUkRiMjUwWlhoMEtTQS9JSEp2YjNSRGIyNTBaWGgwVzNCeWIzQk9ZVzFsWFNBNklIVnVaR1ZtYVc1bFpEdGNibHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdkR0Z5WjJWMFczQnliM0JPWVcxbFhUdGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQnpaWFE2SUNoMFlYSm5aWFFzSUhCeWIzQk9ZVzFsTENCMllXeDFaU2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvY0hKdmNFNWhiV1VnUFQwOUlFTlBUbFJGV0ZSZlNVUXBYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0hSaGNtZGxkRnR3Y205d1RtRnRaVjBnUFQwOUlIWmhiSFZsS1Z4dUlDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdJQ0FnSUcxNVEyOXVkR1Y0ZEVsRUlEMGdLeXRmWTI5dWRHVjRkRWxFUTI5MWJuUmxjanRjYmlBZ0lDQWdJQ0FnZEdGeVoyVjBXM0J5YjNCT1lXMWxYU0E5SUhaaGJIVmxPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ2IyNVZjR1JoZEdVZ1BUMDlJQ2RtZFc1amRHbHZiaWNwWEc0Z0lDQWdJQ0FnSUNBZ2IyNVZjR1JoZEdVdVkyRnNiQ2h2YmxWd1pHRjBaVlJvYVhNc0lHOXVWWEJrWVhSbFZHaHBjeWs3WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lIMHBPMXh1SUNCOVhHNTlYRzRpTENKcGJYQnZjblFnWkdWaFpHSmxaV1lnWm5KdmJTQW5aR1ZoWkdKbFpXWW5PMXh1YVcxd2IzSjBJQ29nWVhNZ1ZYUnBiSE1nWm5KdmJTQW5MaTR2ZFhScGJITXVhbk1uTzF4dWFXMXdiM0owSUh0Y2JpQWdhWE5LYVdKcGMyZ3NYRzRnSUhKbGMyOXNkbVZEYUdsc1pISmxiaXhjYmlBZ1kyOXVjM1J5ZFdOMFNtbGlMRnh1ZlNCbWNtOXRJQ2N1TGk5cWFXSXVhbk1uTzF4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnUTA5T1ZFVllWRjlKUkNBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekwyNXZaR1V2WTI5dWRHVjRkRWxFSnlrN1hHNWNibVY0Y0c5eWRDQmpiR0Z6Y3lCU2IyOTBUbTlrWlNCN1hHNGdJSE4wWVhScFl5QkRUMDVVUlZoVVgwbEVJRDBnUTA5T1ZFVllWRjlKUkR0Y2JseHVJQ0JqYjI1emRISjFZM1J2Y2loeVpXNWtaWEpsY2l3Z2NHRnlaVzUwVG05a1pTd2dYMk52Ym5SbGVIUXNJR3BwWWlrZ2UxeHVJQ0FnSUd4bGRDQmpiMjUwWlhoMElEMGdiblZzYkR0Y2JseHVJQ0FnSUdsbUlDaDBhR2x6TG1OdmJuTjBjblZqZEc5eUxraEJVMTlEVDA1VVJWaFVJQ0U5UFNCbVlXeHpaU0FtSmlBb2NtVnVaR1Z5WlhJZ2ZId2dkR2hwY3k1amNtVmhkR1ZEYjI1MFpYaDBLU2tnZTF4dUlDQWdJQ0FnWTI5dWRHVjRkQ0E5SUNoeVpXNWtaWEpsY2lCOGZDQjBhR2x6S1M1amNtVmhkR1ZEYjI1MFpYaDBLRnh1SUNBZ0lDQWdJQ0JmWTI5dWRHVjRkQ3hjYmlBZ0lDQWdJQ0FnS0hSb2FYTXViMjVEYjI1MFpYaDBWWEJrWVhSbEtTQS9JSFJvYVhNdWIyNURiMjUwWlhoMFZYQmtZWFJsSURvZ2RXNWtaV1pwYm1Wa0xGeHVJQ0FnSUNBZ0lDQjBhR2x6TEZ4dUlDQWdJQ0FnS1R0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEdsbGN5aDBhR2x6TENCN1hHNGdJQ0FnSUNBblZGbFFSU2M2SUh0Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWjJWME9pQWdJQ0FnSUNBZ0lDQW9LU0E5UGlCMGFHbHpMbU52Ym5OMGNuVmpkRzl5TGxSWlVFVXNYRzRnSUNBZ0lDQWdJSE5sZERvZ0lDQWdJQ0FnSUNBZ0tDa2dQVDRnZTMwc0lDOHZJRTVQVDFCY2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmFXUW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdWWFJwYkhNdVoyVnVaWEpoZEdWVlZVbEVLQ2tzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSjNKbGJtUmxjbVZ5SnpvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J5Wlc1a1pYSmxjaXhjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuY0dGeVpXNTBUbTlrWlNjNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnY0dGeVpXNTBUbTlrWlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBblkyaHBiR1JPYjJSbGN5YzZJSHRjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQjBjblZsTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ2JtVjNJRTFoY0NncExGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZGpiMjUwWlhoMEp6b2dlMXh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHZGxkRG9nSUNBZ0lDQWdJQ0FnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJqYjI1MFpYaDBPMXh1SUNBZ0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSUNCelpYUTZJQ0FnSUNBZ0lDQWdJQ2dwSUQwK0lIdDlMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ2RrWlhOMGNtOTVhVzVuSnpvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0JtWVd4elpTeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQW5jbVZ1WkdWeVVISnZiV2x6WlNjNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnYm5Wc2JDeGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQW5jbVZ1WkdWeVJuSmhiV1VuT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJREFzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSjJwcFlpYzZJSHRjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQjBjblZsTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ2FtbGlMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ2R1WVhScGRtVkZiR1Z0Wlc1MEp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCdWRXeHNMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQjlLVHRjYmlBZ2ZWeHVYRzRnSUhKbGMyOXNkbVZEYUdsc1pISmxiaWhqYUdsc1pISmxiaWtnZTF4dUlDQWdJSEpsZEhWeWJpQnlaWE52YkhabFEyaHBiR1J5Wlc0dVkyRnNiQ2gwYUdsekxDQmphR2xzWkhKbGJpazdYRzRnSUgxY2JseHVJQ0JwYzBwcFlpaDJZV3gxWlNrZ2UxeHVJQ0FnSUhKbGRIVnliaUJwYzBwcFltbHphQ2gyWVd4MVpTazdYRzRnSUgxY2JseHVJQ0JqYjI1emRISjFZM1JLYVdJb2RtRnNkV1VwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdZMjl1YzNSeWRXTjBTbWxpS0haaGJIVmxLVHRjYmlBZ2ZWeHVYRzRnSUdkbGRFTmhZMmhsUzJWNUtDa2dlMXh1SUNBZ0lHeGxkQ0I3SUZSNWNHVXNJSEJ5YjNCeklIMGdQU0FvZEdocGN5NXFhV0lnZkh3Z2UzMHBPMXh1SUNBZ0lHeGxkQ0JqWVdOb1pVdGxlU0E5SUdSbFlXUmlaV1ZtS0ZSNWNHVXNJSEJ5YjNCekxtdGxlU2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdZMkZqYUdWTFpYazdYRzRnSUgxY2JseHVJQ0IxY0dSaGRHVkthV0lvYm1WM1NtbGlLU0I3WEc0Z0lDQWdkR2hwY3k1cWFXSWdQU0J1WlhkS2FXSTdYRzRnSUgxY2JseHVJQ0JqYkdWaGNrTm9hV3hrY21WdUtDa2dlMXh1SUNBZ0lIUm9hWE11WTJocGJHUk9iMlJsY3k1amJHVmhjaWdwTzF4dUlDQjlYRzVjYmlBZ2NtVnRiM1psUTJocGJHUW9ZMmhwYkdST2IyUmxLU0I3WEc0Z0lDQWdiR1YwSUdOaFkyaGxTMlY1SUQwZ1kyaHBiR1JPYjJSbExtZGxkRU5oWTJobFMyVjVLQ2s3WEc0Z0lDQWdkR2hwY3k1amFHbHNaRTV2WkdWekxtUmxiR1YwWlNoallXTm9aVXRsZVNrN1hHNGdJSDFjYmx4dUlDQmhaR1JEYUdsc1pDaGphR2xzWkU1dlpHVXNJRjlqWVdOb1pVdGxlU2tnZTF4dUlDQWdJR3hsZENCallXTm9aVXRsZVNBOUlDaGZZMkZqYUdWTFpYa3BJRDhnWDJOaFkyaGxTMlY1SURvZ1kyaHBiR1JPYjJSbExtZGxkRU5oWTJobFMyVjVLQ2s3WEc0Z0lDQWdkR2hwY3k1amFHbHNaRTV2WkdWekxuTmxkQ2hqWVdOb1pVdGxlU3dnWTJocGJHUk9iMlJsS1R0Y2JpQWdmVnh1WEc0Z0lHZGxkRU5vYVd4a0tHTmhZMmhsUzJWNUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTXVZMmhwYkdST2IyUmxjeTVuWlhRb1kyRmphR1ZMWlhrcE8xeHVJQ0I5WEc1Y2JpQWdaMlYwUTJocGJHUnlaVzRvS1NCN1hHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdVkyaHBiR1JPYjJSbGN6dGNiaUFnZlZ4dVhHNGdJR2RsZEZSb2FYTk9iMlJsVDNKRGFHbHNaRTV2WkdWektDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpPMXh1SUNCOVhHNWNiaUFnWjJWMFEyaHBiR1J5Wlc1T2IyUmxjeWdwSUh0Y2JpQWdJQ0JzWlhRZ1kyaHBiR1JPYjJSbGN5QTlJRnRkTzF4dUlDQWdJR1p2Y2lBb2JHVjBJR05vYVd4a1RtOWtaU0J2WmlCMGFHbHpMbU5vYVd4a1RtOWtaWE11ZG1Gc2RXVnpLQ2twWEc0Z0lDQWdJQ0JqYUdsc1pFNXZaR1Z6SUQwZ1kyaHBiR1JPYjJSbGN5NWpiMjVqWVhRb1kyaHBiR1JPYjJSbExtZGxkRlJvYVhOT2IyUmxUM0pEYUdsc1pFNXZaR1Z6S0NrcE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUdOb2FXeGtUbTlrWlhNdVptbHNkR1Z5S0VKdmIyeGxZVzRwTzF4dUlDQjlYRzVjYmlBZ1lYTjVibU1nWkdWemRISnZlU2htYjNKalpTa2dlMXh1SUNBZ0lHbG1JQ2doWm05eVkyVWdKaVlnZEdocGN5NWtaWE4wY205NWFXNW5LVnh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVYRzRnSUNBZ2RHaHBjeTVrWlhOMGNtOTVhVzVuSUQwZ2RISjFaVHRjYmx4dUlDQWdJR2xtSUNoMGFHbHpMbkpsYm1SbGNsQnliMjFwYzJVcFhHNGdJQ0FnSUNCaGQyRnBkQ0IwYUdsekxuSmxibVJsY2xCeWIyMXBjMlU3WEc1Y2JpQWdJQ0JoZDJGcGRDQjBhR2x6TG1SbGMzUnliM2xHY205dFJFOU5LSFJvYVhNdVkyOXVkR1Y0ZEN3Z2RHaHBjeWs3WEc1Y2JpQWdJQ0JzWlhRZ1pHVnpkSEp2ZVZCeWIyMXBjMlZ6SUQwZ1cxMDdYRzRnSUNBZ1ptOXlJQ2hzWlhRZ1kyaHBiR1JPYjJSbElHOW1JSFJvYVhNdVkyaHBiR1JPYjJSbGN5NTJZV3gxWlhNb0tTbGNiaUFnSUNBZ0lHUmxjM1J5YjNsUWNtOXRhWE5sY3k1d2RYTm9LR05vYVd4a1RtOWtaUzVrWlhOMGNtOTVLQ2twTzF4dVhHNGdJQ0FnZEdocGN5NWphR2xzWkU1dlpHVnpMbU5zWldGeUtDazdYRzRnSUNBZ1lYZGhhWFFnVUhKdmJXbHpaUzVoYkd3b1pHVnpkSEp2ZVZCeWIyMXBjMlZ6S1R0Y2JseHVJQ0FnSUhSb2FYTXVibUYwYVhabFJXeGxiV1Z1ZENBOUlHNTFiR3c3WEc0Z0lDQWdkR2hwY3k1d1lYSmxiblJPYjJSbElEMGdiblZzYkR0Y2JpQWdJQ0IwYUdsekxtTnZiblJsZUhRZ1BTQnVkV3hzTzF4dUlDQWdJSFJvYVhNdWFtbGlJRDBnYm5Wc2JEdGNiaUFnZlZ4dVhHNGdJR2x6Vm1Gc2FXUkRhR2xzWkNoamFHbHNaQ2tnZTF4dUlDQWdJSEpsZEhWeWJpQlZkR2xzY3k1cGMxWmhiR2xrUTJocGJHUW9ZMmhwYkdRcE8xeHVJQ0I5WEc1Y2JpQWdhWE5KZEdWeVlXSnNaVU5vYVd4a0tHTm9hV3hrS1NCN1hHNGdJQ0FnY21WMGRYSnVJRlYwYVd4ekxtbHpTWFJsY21GaWJHVkRhR2xzWkNoamFHbHNaQ2s3WEc0Z0lIMWNibHh1SUNCd2NtOXdjMFJwWm1abGNpaHZiR1JRY205d2N5d2dibVYzVUhKdmNITXNJSE5yYVhCTFpYbHpLU0I3WEc0Z0lDQWdjbVYwZFhKdUlGVjBhV3h6TG5CeWIzQnpSR2xtWm1WeUtHOXNaRkJ5YjNCekxDQnVaWGRRY205d2N5d2djMnRwY0V0bGVYTXBPMXh1SUNCOVhHNWNiaUFnWTJocGJHUnlaVzVFYVdabVpYSW9iMnhrUTJocGJHUnlaVzRzSUc1bGQwTm9hV3hrY21WdUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUZWMGFXeHpMbU5vYVd4a2NtVnVSR2xtWm1WeUtHOXNaRU5vYVd4a2NtVnVMQ0J1WlhkRGFHbHNaSEpsYmlrN1hHNGdJSDFjYmx4dUlDQmhjM2x1WXlCeVpXNWtaWElvTGk0dVlYSm5jeWtnZTF4dUlDQWdJR2xtSUNoMGFHbHpMbVJsYzNSeWIzbHBibWNwWEc0Z0lDQWdJQ0J5WlhSMWNtNDdYRzVjYmlBZ0lDQjBhR2x6TG5KbGJtUmxja1p5WVcxbEt5czdYRzRnSUNBZ2JHVjBJSEpsYm1SbGNrWnlZVzFsSUQwZ2RHaHBjeTV5Wlc1a1pYSkdjbUZ0WlR0Y2JseHVJQ0FnSUdsbUlDaDBlWEJsYjJZZ2RHaHBjeTVmY21WdVpHVnlJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ0lDQjBhR2x6TG5KbGJtUmxjbEJ5YjIxcGMyVWdQU0IwYUdsekxsOXlaVzVrWlhJb0xpNHVZWEpuY3lsY2JpQWdJQ0FnSUNBZ0xuUm9aVzRvWVhONWJtTWdLSEpsYzNWc2RDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2h5Wlc1a1pYSkdjbUZ0WlNBK1BTQjBhR2x6TG5KbGJtUmxja1p5WVcxbEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdkR2hwY3k1emVXNWpSRTlOS0hSb2FYTXVZMjl1ZEdWNGRDd2dkR2hwY3lrN1hHNWNiaUFnSUNBZ0lDQWdJQ0IwYUdsekxuSmxibVJsY2xCeWIyMXBjMlVnUFNCdWRXeHNPMXh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ5WlhOMWJIUTdYRzRnSUNBZ0lDQWdJSDBwWEc0Z0lDQWdJQ0FnSUM1allYUmphQ2dvWlhKeWIzSXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQjBhR2x6TG5KbGJtUmxjbEJ5YjIxcGMyVWdQU0J1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJSFJvY205M0lHVnljbTl5TzF4dUlDQWdJQ0FnSUNCOUtUdGNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnWVhkaGFYUWdkR2hwY3k1emVXNWpSRTlOS0hSb2FYTXVZMjl1ZEdWNGRDd2dkR2hwY3lrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnY21WMGRYSnVJSFJvYVhNdWNtVnVaR1Z5VUhKdmJXbHpaVHRjYmlBZ2ZWeHVYRzRnSUdkbGRGQmhjbVZ1ZEVsRUtDa2dlMXh1SUNBZ0lHbG1JQ2doZEdocGN5NXdZWEpsYm5ST2IyUmxLVnh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVYRzRnSUNBZ2NtVjBkWEp1SUhSb2FYTXVjR0Z5Wlc1MFRtOWtaUzVwWkR0Y2JpQWdmVnh1WEc0Z0lHRnplVzVqSUdSbGMzUnliM2xHY205dFJFOU5LR052Ym5SbGVIUXNJRzV2WkdVcElIdGNiaUFnSUNCcFppQW9JWFJvYVhNdWNtVnVaR1Z5WlhJcFhHNGdJQ0FnSUNCeVpYUjFjbTQ3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdZWGRoYVhRZ2RHaHBjeTV5Wlc1a1pYSmxjaTVrWlhOMGNtOTVSbkp2YlVSUFRTaGpiMjUwWlhoMExDQnViMlJsS1R0Y2JpQWdmVnh1WEc0Z0lHRnplVzVqSUhONWJtTkVUMDBvWTI5dWRHVjRkQ3dnYm05a1pTa2dlMXh1SUNBZ0lHbG1JQ2doZEdocGN5NXlaVzVrWlhKbGNpbGNiaUFnSUNBZ0lISmxkSFZ5Ymp0Y2JseHVJQ0FnSUhKbGRIVnliaUJoZDJGcGRDQjBhR2x6TG5KbGJtUmxjbVZ5TG5ONWJtTkVUMDBvWTI5dWRHVjRkQ3dnYm05a1pTazdYRzRnSUgxY2JuMWNiaUlzSWk4cUlHVnpiR2x1ZEMxa2FYTmhZbXhsSUc1dkxXMWhaMmxqTFc1MWJXSmxjbk1nS2k5Y2JtbHRjRzl5ZENCa1pXRmtZbVZsWmlCbWNtOXRJQ2RrWldGa1ltVmxaaWM3WEc1Y2JtTnZibk4wSUZOVVQxQWdQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljMGwwWlhKaGRHVlRkRzl3SnlrN1hHNWNiaTh2SUdWemJHbHVkQzFrYVhOaFlteGxMVzVsZUhRdGJHbHVaU0J1YnkxdVpYTjBaV1F0ZEdWeWJtRnllVnh1WTI5dWMzUWdaMnh2WW1Gc1UyTnZjR1VnUFNBb2RIbHdaVzltSUdkc2IySmhiQ0FoUFQwZ0ozVnVaR1ZtYVc1bFpDY3BJRDhnWjJ4dlltRnNJRG9nS0hSNWNHVnZaaUIzYVc1a2IzY2dJVDA5SUNkMWJtUmxabWx1WldRbktTQS9JSGRwYm1SdmR5QTZJSFJvYVhNN1hHNWNibXhsZENCMWRXbGtJRDBnTVRBd01EQXdNRHRjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdsdWMzUmhibU5sVDJZb2IySnFLU0I3WEc0Z0lHWjFibU4wYVc5dUlIUmxjM1JVZVhCbEtHOWlhaXdnWDNaaGJDa2dlMXh1SUNBZ0lHWjFibU4wYVc5dUlHbHpSR1ZtWlhKeVpXUlVlWEJsS0c5aWFpa2dlMXh1SUNBZ0lDQWdhV1lnS0c5aWFpQnBibk4wWVc1alpXOW1JRkJ5YjIxcGMyVWdmSHdnS0c5aWFpNWpiMjV6ZEhKMVkzUnZjaUFtSmlCdlltb3VZMjl1YzNSeWRXTjBiM0l1Ym1GdFpTQTlQVDBnSjFCeWIyMXBjMlVuS1NsY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQWdJQzh2SUZGMVlXTnJJSEYxWVdOckxpNHVYRzRnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JRzlpYWk1MGFHVnVJRDA5UFNBblpuVnVZM1JwYjI0bklDWW1JSFI1Y0dWdlppQnZZbW91WTJGMFkyZ2dQVDA5SUNkbWRXNWpkR2x2YmljcFhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnYkdWMElIWmhiQ0FnSUNBZ1BTQmZkbUZzTzF4dUlDQWdJR3hsZENCMGVYQmxUMllnSUQwZ0tIUjVjR1Z2WmlCdlltb3BPMXh1WEc0Z0lDQWdhV1lnS0haaGJDQTlQVDBnWjJ4dlltRnNVMk52Y0dVdVUzUnlhVzVuS1Z4dUlDQWdJQ0FnZG1Gc0lEMGdKM04wY21sdVp5YzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNU9kVzFpWlhJcFhHNGdJQ0FnSUNCMllXd2dQU0FuYm5WdFltVnlKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMa0p2YjJ4bFlXNHBYRzRnSUNBZ0lDQjJZV3dnUFNBblltOXZiR1ZoYmljN1hHNGdJQ0FnWld4elpTQnBaaUFvZG1Gc0lEMDlQU0JuYkc5aVlXeFRZMjl3WlM1R2RXNWpkR2x2YmlsY2JpQWdJQ0FnSUhaaGJDQTlJQ2RtZFc1amRHbHZiaWM3WEc0Z0lDQWdaV3h6WlNCcFppQW9kbUZzSUQwOVBTQm5iRzlpWVd4VFkyOXdaUzVCY25KaGVTbGNiaUFnSUNBZ0lIWmhiQ0E5SUNkaGNuSmhlU2M3WEc0Z0lDQWdaV3h6WlNCcFppQW9kbUZzSUQwOVBTQm5iRzlpWVd4VFkyOXdaUzVQWW1wbFkzUXBYRzRnSUNBZ0lDQjJZV3dnUFNBbmIySnFaV04wSnp0Y2JpQWdJQ0JsYkhObElHbG1JQ2gyWVd3Z1BUMDlJR2RzYjJKaGJGTmpiM0JsTGxCeWIyMXBjMlVwWEc0Z0lDQWdJQ0IyWVd3Z1BTQW5jSEp2YldselpTYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNUNhV2RKYm5RcFhHNGdJQ0FnSUNCMllXd2dQU0FuWW1sbmFXNTBKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMazFoY0NsY2JpQWdJQ0FnSUhaaGJDQTlJQ2R0WVhBbk8xeHVJQ0FnSUdWc2MyVWdhV1lnS0haaGJDQTlQVDBnWjJ4dlltRnNVMk52Y0dVdVYyVmhhMDFoY0NsY2JpQWdJQ0FnSUhaaGJDQTlJQ2QzWldGcmJXRndKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMbE5sZENsY2JpQWdJQ0FnSUhaaGJDQTlJQ2R6WlhRbk8xeHVJQ0FnSUdWc2MyVWdhV1lnS0haaGJDQTlQVDBnWjJ4dlltRnNVMk52Y0dVdVUzbHRZbTlzS1Z4dUlDQWdJQ0FnZG1Gc0lEMGdKM041YldKdmJDYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNUNkV1ptWlhJcFhHNGdJQ0FnSUNCMllXd2dQU0FuWW5WbVptVnlKenRjYmx4dUlDQWdJR2xtSUNoMllXd2dQVDA5SUNkaWRXWm1aWEluSUNZbUlHZHNiMkpoYkZOamIzQmxMa0oxWm1abGNpQW1KaUJuYkc5aVlXeFRZMjl3WlM1Q2RXWm1aWEl1YVhOQ2RXWm1aWElvYjJKcUtTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdhV1lnS0haaGJDQTlQVDBnSjI1MWJXSmxjaWNnSmlZZ0tIUjVjR1ZQWmlBOVBUMGdKMjUxYldKbGNpY2dmSHdnYjJKcUlHbHVjM1JoYm1ObGIyWWdUblZ0WW1WeUlIeDhJQ2h2WW1vdVkyOXVjM1J5ZFdOMGIzSWdKaVlnYjJKcUxtTnZibk4wY25WamRHOXlMbTVoYldVZ1BUMDlJQ2RPZFcxaVpYSW5LU2twSUh0Y2JpQWdJQ0FnSUdsbUlDZ2hhWE5HYVc1cGRHVW9iMkpxS1NsY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJQ0U5UFNBbmIySnFaV04wSnlBbUppQjJZV3dnUFQwOUlIUjVjR1ZQWmlsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKMjlpYW1WamRDY3BJSHRjYmlBZ0lDQWdJR2xtSUNnb2IySnFMbU52Ym5OMGNuVmpkRzl5SUQwOVBTQlBZbXBsWTNRdWNISnZkRzkwZVhCbExtTnZibk4wY25WamRHOXlJSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkUFltcGxZM1FuS1NrcFhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdJQ0F2THlCT2RXeHNJSEJ5YjNSdmRIbHdaU0J2YmlCdlltcGxZM1JjYmlBZ0lDQWdJR2xtSUNoMGVYQmxUMllnUFQwOUlDZHZZbXBsWTNRbklDWW1JQ0Z2WW1vdVkyOXVjM1J5ZFdOMGIzSXBYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKMkZ5Y21GNUp5QW1KaUFvUVhKeVlYa3VhWE5CY25KaGVTaHZZbW9wSUh4OElHOWlhaUJwYm5OMFlXNWpaVzltSUVGeWNtRjVJSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkQmNuSmhlU2NwS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLQ2gyWVd3Z1BUMDlJQ2R3Y205dGFYTmxKeUI4ZkNCMllXd2dQVDA5SUNka1pXWmxjbkpsWkNjcElDWW1JR2x6UkdWbVpYSnlaV1JVZVhCbEtHOWlhaWtwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUdsbUlDaDJZV3dnUFQwOUlDZHpkSEpwYm1jbklDWW1JQ2h2WW1vZ2FXNXpkR0Z1WTJWdlppQm5iRzlpWVd4VFkyOXdaUzVUZEhKcGJtY2dmSHdnS0c5aWFpNWpiMjV6ZEhKMVkzUnZjaUFtSmlCdlltb3VZMjl1YzNSeWRXTjBiM0l1Ym1GdFpTQTlQVDBnSjFOMGNtbHVaeWNwS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKMkp2YjJ4bFlXNG5JQ1ltSUNodlltb2dhVzV6ZEdGdVkyVnZaaUJuYkc5aVlXeFRZMjl3WlM1Q2IyOXNaV0Z1SUh4OElDaHZZbW91WTI5dWMzUnlkV04wYjNJZ0ppWWdiMkpxTG1OdmJuTjBjblZqZEc5eUxtNWhiV1VnUFQwOUlDZENiMjlzWldGdUp5a3BLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNBbmJXRndKeUFtSmlBb2IySnFJR2x1YzNSaGJtTmxiMllnWjJ4dlltRnNVMk52Y0dVdVRXRndJSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkTllYQW5LU2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUdsbUlDaDJZV3dnUFQwOUlDZDNaV0ZyYldGd0p5QW1KaUFvYjJKcUlHbHVjM1JoYm1ObGIyWWdaMnh2WW1Gc1UyTnZjR1V1VjJWaGEwMWhjQ0I4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblYyVmhhMDFoY0NjcEtTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDQWdhV1lnS0haaGJDQTlQVDBnSjNObGRDY2dKaVlnS0c5aWFpQnBibk4wWVc1alpXOW1JR2RzYjJKaGJGTmpiM0JsTGxObGRDQjhmQ0FvYjJKcUxtTnZibk4wY25WamRHOXlJQ1ltSUc5aWFpNWpiMjV6ZEhKMVkzUnZjaTV1WVcxbElEMDlQU0FuVTJWMEp5a3BLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNBblpuVnVZM1JwYjI0bklDWW1JSFI1Y0dWUFppQTlQVDBnSjJaMWJtTjBhVzl1SnlsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFI1Y0dWdlppQjJZV3dnUFQwOUlDZG1kVzVqZEdsdmJpY2dKaVlnYjJKcUlHbHVjM1JoYm1ObGIyWWdkbUZzS1Z4dUlDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNCcFppQW9kSGx3Wlc5bUlIWmhiQ0E5UFQwZ0ozTjBjbWx1WnljZ0ppWWdiMkpxTG1OdmJuTjBjblZqZEc5eUlDWW1JRzlpYWk1amIyNXpkSEoxWTNSdmNpNXVZVzFsSUQwOVBTQjJZV3dwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNiaUFnZlZ4dVhHNGdJR2xtSUNodlltb2dQVDBnYm5Wc2JDbGNiaUFnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ1ptOXlJQ2gyWVhJZ2FTQTlJREVzSUd4bGJpQTlJR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZzdJR2tnUENCc1pXNDdJR2tyS3lrZ2UxeHVJQ0FnSUdsbUlDaDBaWE4wVkhsd1pTaHZZbW9zSUdGeVozVnRaVzUwYzF0cFhTa2dQVDA5SUhSeWRXVXBYRzRnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmlBZ2ZWeHVYRzRnSUhKbGRIVnliaUJtWVd4elpUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUhCeWIzQnpSR2xtWm1WeUtHOXNaRkJ5YjNCekxDQnVaWGRRY205d2N5d2djMnRwY0V0bGVYTXBJSHRjYmlBZ2FXWWdLRzlzWkZCeWIzQnpJRDA5UFNCdVpYZFFjbTl3Y3lsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnYVdZZ0tIUjVjR1Z2WmlCdmJHUlFjbTl3Y3lBaFBUMGdkSGx3Wlc5bUlHNWxkMUJ5YjNCektWeHVJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUdsbUlDZ2hiMnhrVUhKdmNITWdKaVlnYm1WM1VISnZjSE1wWEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdhV1lnS0c5c1pGQnliM0J6SUNZbUlDRnVaWGRRY205d2N5bGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBdkx5QmxjMnhwYm5RdFpHbHpZV0pzWlMxdVpYaDBMV3hwYm1VZ1pYRmxjV1Z4WEc0Z0lHbG1JQ2doYjJ4a1VISnZjSE1nSmlZZ0lXNWxkMUJ5YjNCeklDWW1JRzlzWkZCeWIzQnpJQ0U5SUc5c1pGQnliM0J6S1Z4dUlDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJR3hsZENCaFMyVjVjeUE5SUU5aWFtVmpkQzVyWlhsektHOXNaRkJ5YjNCektTNWpiMjVqWVhRb1QySnFaV04wTG1kbGRFOTNibEJ5YjNCbGNuUjVVM2x0WW05c2N5aHZiR1JRY205d2N5a3BPMXh1SUNCc1pYUWdZa3RsZVhNZ1BTQlBZbXBsWTNRdWEyVjVjeWh1WlhkUWNtOXdjeWt1WTI5dVkyRjBLRTlpYW1WamRDNW5aWFJQZDI1UWNtOXdaWEowZVZONWJXSnZiSE1vYm1WM1VISnZjSE1wS1R0Y2JseHVJQ0JwWmlBb1lVdGxlWE11YkdWdVozUm9JQ0U5UFNCaVMyVjVjeTVzWlc1bmRHZ3BYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ1ptOXlJQ2hzWlhRZ2FTQTlJREFzSUdsc0lEMGdZVXRsZVhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lHeGxkQ0JoUzJWNUlEMGdZVXRsZVhOYmFWMDdYRzRnSUNBZ2FXWWdLSE5yYVhCTFpYbHpJQ1ltSUhOcmFYQkxaWGx6TG1sdVpHVjRUMllvWVV0bGVTa2dQajBnTUNsY2JpQWdJQ0FnSUdOdmJuUnBiblZsTzF4dVhHNGdJQ0FnYVdZZ0tHOXNaRkJ5YjNCelcyRkxaWGxkSUNFOVBTQnVaWGRRY205d2MxdGhTMlY1WFNsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2JHVjBJR0pMWlhrZ1BTQmlTMlY1YzF0cFhUdGNiaUFnSUNCcFppQW9jMnRwY0V0bGVYTWdKaVlnYzJ0cGNFdGxlWE11YVc1a1pYaFBaaWhpUzJWNUtTbGNiaUFnSUNBZ0lHTnZiblJwYm5WbE8xeHVYRzRnSUNBZ2FXWWdLR0ZMWlhrZ1BUMDlJR0pMWlhrcFhHNGdJQ0FnSUNCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUdsbUlDaHZiR1JRY205d2MxdGlTMlY1WFNBaFBUMGdibVYzVUhKdmNITmJZa3RsZVYwcFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJSE5wZW1WUFppaDJZV3gxWlNrZ2UxeHVJQ0JwWmlBb0lYWmhiSFZsS1Z4dUlDQWdJSEpsZEhWeWJpQXdPMXh1WEc0Z0lHbG1JQ2hQWW1wbFkzUXVhWE1vU1c1bWFXNXBkSGtwS1Z4dUlDQWdJSEpsZEhWeWJpQXdPMXh1WEc0Z0lHbG1JQ2gwZVhCbGIyWWdkbUZzZFdVdWJHVnVaM1JvSUQwOVBTQW5iblZ0WW1WeUp5bGNiaUFnSUNCeVpYUjFjbTRnZG1Gc2RXVXViR1Z1WjNSb08xeHVYRzRnSUhKbGRIVnliaUJQWW1wbFkzUXVhMlY1Y3loMllXeDFaU2t1YkdWdVozUm9PMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmZhWFJsY21GMFpTaHZZbW9zSUdOaGJHeGlZV05yS1NCN1hHNGdJR2xtSUNnaGIySnFJSHg4SUU5aWFtVmpkQzVwY3loSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJRnRkTzF4dVhHNGdJR3hsZENCeVpYTjFiSFJ6SUNBZ1BTQmJYVHRjYmlBZ2JHVjBJSE5qYjNCbElDQWdJQ0E5SUhzZ1kyOXNiR1ZqZEdsdmJqb2diMkpxTENCVFZFOVFJSDA3WEc0Z0lHeGxkQ0J5WlhOMWJIUTdYRzVjYmlBZ2FXWWdLRUZ5Y21GNUxtbHpRWEp5WVhrb2IySnFLU2tnZTF4dUlDQWdJSE5qYjNCbExuUjVjR1VnUFNBblFYSnlZWGtuTzF4dVhHNGdJQ0FnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2IySnFMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUhOamIzQmxMblpoYkhWbElEMGdiMkpxVzJsZE8xeHVJQ0FnSUNBZ2MyTnZjR1V1YVc1a1pYZ2dQU0J6WTI5d1pTNXJaWGtnUFNCcE8xeHVYRzRnSUNBZ0lDQnlaWE4xYkhRZ1BTQmpZV3hzWW1GamF5NWpZV3hzS0hSb2FYTXNJSE5qYjNCbEtUdGNiaUFnSUNBZ0lHbG1JQ2h5WlhOMWJIUWdQVDA5SUZOVVQxQXBYRzRnSUNBZ0lDQWdJR0p5WldGck8xeHVYRzRnSUNBZ0lDQnlaWE4xYkhSekxuQjFjMmdvY21WemRXeDBLVHRjYmlBZ0lDQjlYRzRnSUgwZ1pXeHpaU0JwWmlBb2RIbHdaVzltSUc5aWFpNWxiblJ5YVdWeklEMDlQU0FuWm5WdVkzUnBiMjRuS1NCN1hHNGdJQ0FnYVdZZ0tHOWlhaUJwYm5OMFlXNWpaVzltSUZObGRDQjhmQ0J2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlNBOVBUMGdKMU5sZENjcElIdGNiaUFnSUNBZ0lITmpiM0JsTG5SNWNHVWdQU0FuVTJWMEp6dGNibHh1SUNBZ0lDQWdiR1YwSUdsdVpHVjRJRDBnTUR0Y2JpQWdJQ0FnSUdadmNpQW9iR1YwSUdsMFpXMGdiMllnYjJKcUxuWmhiSFZsY3lncEtTQjdYRzRnSUNBZ0lDQWdJSE5qYjNCbExuWmhiSFZsSUQwZ2FYUmxiVHRjYmlBZ0lDQWdJQ0FnYzJOdmNHVXVhMlY1SUQwZ2FYUmxiVHRjYmlBZ0lDQWdJQ0FnYzJOdmNHVXVhVzVrWlhnZ1BTQnBibVJsZUNzck8xeHVYRzRnSUNBZ0lDQWdJSEpsYzNWc2RDQTlJR05oYkd4aVlXTnJMbU5oYkd3b2RHaHBjeXdnYzJOdmNHVXBPMXh1SUNBZ0lDQWdJQ0JwWmlBb2NtVnpkV3gwSUQwOVBTQlRWRTlRS1Z4dUlDQWdJQ0FnSUNBZ0lHSnlaV0ZyTzF4dVhHNGdJQ0FnSUNBZ0lISmxjM1ZzZEhNdWNIVnphQ2h5WlhOMWJIUXBPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNCelkyOXdaUzUwZVhCbElEMGdiMkpxTG1OdmJuTjBjblZqZEc5eUxtNWhiV1U3WEc1Y2JpQWdJQ0FnSUd4bGRDQnBibVJsZUNBOUlEQTdYRzRnSUNBZ0lDQm1iM0lnS0d4bGRDQmJJR3RsZVN3Z2RtRnNkV1VnWFNCdlppQnZZbW91Wlc1MGNtbGxjeWdwS1NCN1hHNGdJQ0FnSUNBZ0lITmpiM0JsTG5aaGJIVmxJRDBnZG1Gc2RXVTdYRzRnSUNBZ0lDQWdJSE5qYjNCbExtdGxlU0E5SUd0bGVUdGNiaUFnSUNBZ0lDQWdjMk52Y0dVdWFXNWtaWGdnUFNCcGJtUmxlQ3NyTzF4dVhHNGdJQ0FnSUNBZ0lISmxjM1ZzZENBOUlHTmhiR3hpWVdOckxtTmhiR3dvZEdocGN5d2djMk52Y0dVcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvY21WemRXeDBJRDA5UFNCVFZFOVFLVnh1SUNBZ0lDQWdJQ0FnSUdKeVpXRnJPMXh1WEc0Z0lDQWdJQ0FnSUhKbGMzVnNkSE11Y0hWemFDaHlaWE4xYkhRcE8xeHVJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdmU0JsYkhObElIdGNiaUFnSUNCcFppQW9hVzV6ZEdGdVkyVlBaaWh2WW1vc0lDZGliMjlzWldGdUp5d2dKMjUxYldKbGNpY3NJQ2RpYVdkcGJuUW5MQ0FuWm5WdVkzUnBiMjRuS1NsY2JpQWdJQ0FnSUhKbGRIVnlianRjYmx4dUlDQWdJSE5qYjNCbExuUjVjR1VnUFNBb2IySnFMbU52Ym5OMGNuVmpkRzl5S1NBL0lHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRG9nSjA5aWFtVmpkQ2M3WEc1Y2JpQWdJQ0JzWlhRZ2EyVjVjeUE5SUU5aWFtVmpkQzVyWlhsektHOWlhaWs3WEc0Z0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0JzWlhRZ2EyVjVJQ0FnUFNCclpYbHpXMmxkTzF4dUlDQWdJQ0FnYkdWMElIWmhiSFZsSUQwZ2IySnFXMnRsZVYwN1hHNWNiaUFnSUNBZ0lITmpiM0JsTG5aaGJIVmxJRDBnZG1Gc2RXVTdYRzRnSUNBZ0lDQnpZMjl3WlM1clpYa2dQU0JyWlhrN1hHNGdJQ0FnSUNCelkyOXdaUzVwYm1SbGVDQTlJR2s3WEc1Y2JpQWdJQ0FnSUhKbGMzVnNkQ0E5SUdOaGJHeGlZV05yTG1OaGJHd29kR2hwY3l3Z2MyTnZjR1VwTzF4dUlDQWdJQ0FnYVdZZ0tISmxjM1ZzZENBOVBUMGdVMVJQVUNsY2JpQWdJQ0FnSUNBZ1luSmxZV3M3WEc1Y2JpQWdJQ0FnSUhKbGMzVnNkSE11Y0hWemFDaHlaWE4xYkhRcE8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlCeVpYTjFiSFJ6TzF4dWZWeHVYRzVQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEdsbGN5aGZhWFJsY21GMFpTd2dlMXh1SUNBblUxUlBVQ2M2SUh0Y2JpQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lHWmhiSE5sTEZ4dUlDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUZOVVQxQXNYRzRnSUgwc1hHNTlLVHRjYmx4dVpYaHdiM0owSUdOdmJuTjBJR2wwWlhKaGRHVWdQU0JmYVhSbGNtRjBaVHRjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdOb2FXeGtjbVZ1UkdsbVptVnlLR05vYVd4a2NtVnVNU3dnWTJocGJHUnlaVzR5S1NCN1hHNGdJR2xtSUNoamFHbHNaSEpsYmpFZ1BUMDlJR05vYVd4a2NtVnVNaWxjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdiR1YwSUhKbGMzVnNkREVnUFNBb0lVRnljbUY1TG1selFYSnlZWGtvWTJocGJHUnlaVzR4S1NrZ1B5QmtaV0ZrWW1WbFppaGphR2xzWkhKbGJqRXBJRG9nWkdWaFpHSmxaV1lvTGk0dVkyaHBiR1J5Wlc0eEtUdGNiaUFnYkdWMElISmxjM1ZzZERJZ1BTQW9JVUZ5Y21GNUxtbHpRWEp5WVhrb1kyaHBiR1J5Wlc0eUtTa2dQeUJrWldGa1ltVmxaaWhqYUdsc1pISmxiaklwSURvZ1pHVmhaR0psWldZb0xpNHVZMmhwYkdSeVpXNHlLVHRjYmx4dUlDQnlaWFIxY200Z0tISmxjM1ZzZERFZ0lUMDlJSEpsYzNWc2RESXBPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1ptVjBZMmhFWldWd1VISnZjR1Z5ZEhrb2IySnFMQ0JmYTJWNUxDQmtaV1poZFd4MFZtRnNkV1VzSUd4aGMzUlFZWEowS1NCN1hHNGdJR2xtSUNodlltb2dQVDBnYm5Wc2JDQjhmQ0JQWW1wbFkzUXVhWE1vVG1GT0xDQnZZbW9wSUh4OElFOWlhbVZqZEM1cGN5aEpibVpwYm1sMGVTd2diMkpxS1NsY2JpQWdJQ0J5WlhSMWNtNGdLR3hoYzNSUVlYSjBLU0EvSUZzZ1pHVm1ZWFZzZEZaaGJIVmxMQ0J1ZFd4c0lGMGdPaUJrWldaaGRXeDBWbUZzZFdVN1hHNWNiaUFnYVdZZ0tGOXJaWGtnUFQwZ2JuVnNiQ0I4ZkNCUFltcGxZM1F1YVhNb1RtRk9MQ0JmYTJWNUtTQjhmQ0JQWW1wbFkzUXVhWE1vU1c1bWFXNXBkSGtzSUY5clpYa3BLVnh1SUNBZ0lISmxkSFZ5YmlBb2JHRnpkRkJoY25RcElEOGdXeUJrWldaaGRXeDBWbUZzZFdVc0lHNTFiR3dnWFNBNklHUmxabUYxYkhSV1lXeDFaVHRjYmx4dUlDQnNaWFFnY0dGeWRITTdYRzVjYmlBZ2FXWWdLRUZ5Y21GNUxtbHpRWEp5WVhrb1gydGxlU2twSUh0Y2JpQWdJQ0J3WVhKMGN5QTlJRjlyWlhrN1hHNGdJSDBnWld4elpTQnBaaUFvZEhsd1pXOW1JRjlyWlhrZ1BUMDlJQ2R6ZVcxaWIyd25LU0I3WEc0Z0lDQWdjR0Z5ZEhNZ1BTQmJJRjlyWlhrZ1hUdGNiaUFnZlNCbGJITmxJSHRjYmlBZ0lDQnNaWFFnYTJWNUlDQWdJQ0FnSUNBZ1BTQW9KeWNnS3lCZmEyVjVLVHRjYmlBZ0lDQnNaWFFnYkdGemRFbHVaR1Y0SUNBZ1BTQXdPMXh1SUNBZ0lHeGxkQ0JzWVhOMFEzVnljMjl5SUNBOUlEQTdYRzVjYmlBZ0lDQndZWEowY3lBOUlGdGRPMXh1WEc0Z0lDQWdMeThnWlhOc2FXNTBMV1JwYzJGaWJHVXRibVY0ZEMxc2FXNWxJRzV2TFdOdmJuTjBZVzUwTFdOdmJtUnBkR2x2Ymx4dUlDQWdJSGRvYVd4bElDaDBjblZsS1NCN1hHNGdJQ0FnSUNCc1pYUWdhVzVrWlhnZ1BTQnJaWGt1YVc1a1pYaFBaaWduTGljc0lHeGhjM1JKYm1SbGVDazdYRzRnSUNBZ0lDQnBaaUFvYVc1a1pYZ2dQQ0F3S1NCN1hHNGdJQ0FnSUNBZ0lIQmhjblJ6TG5CMWMyZ29hMlY1TG5OMVluTjBjbWx1Wnloc1lYTjBRM1Z5YzI5eUtTazdYRzRnSUNBZ0lDQWdJR0p5WldGck8xeHVJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQnBaaUFvYTJWNUxtTm9ZWEpCZENocGJtUmxlQ0F0SURFcElEMDlQU0FuWEZ4Y1hDY3BJSHRjYmlBZ0lDQWdJQ0FnYkdGemRFbHVaR1Y0SUQwZ2FXNWtaWGdnS3lBeE8xeHVJQ0FnSUNBZ0lDQmpiMjUwYVc1MVpUdGNiaUFnSUNBZ0lIMWNibHh1SUNBZ0lDQWdjR0Z5ZEhNdWNIVnphQ2hyWlhrdWMzVmljM1J5YVc1bktHeGhjM1JEZFhKemIzSXNJR2x1WkdWNEtTazdYRzRnSUNBZ0lDQnNZWE4wUTNWeWMyOXlJRDBnYkdGemRFbHVaR1Y0SUQwZ2FXNWtaWGdnS3lBeE8xeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lHeGxkQ0J3WVhKMFRpQTlJSEJoY25SelczQmhjblJ6TG14bGJtZDBhQ0F0SURGZE8xeHVJQ0JwWmlBb2NHRnlkSE11YkdWdVozUm9JRDA5UFNBd0tWeHVJQ0FnSUhKbGRIVnliaUFvYkdGemRGQmhjblFwSUQ4Z1d5QmtaV1poZFd4MFZtRnNkV1VzSUhCaGNuUk9JRjBnT2lCa1pXWmhkV3gwVm1Gc2RXVTdYRzVjYmlBZ2JHVjBJR04xY25KbGJuUldZV3gxWlNBOUlHOWlhanRjYmlBZ1ptOXlJQ2hzWlhRZ2FTQTlJREFzSUdsc0lEMGdjR0Z5ZEhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lHeGxkQ0JyWlhrZ1BTQndZWEowYzF0cFhUdGNibHh1SUNBZ0lHTjFjbkpsYm5SV1lXeDFaU0E5SUdOMWNuSmxiblJXWVd4MVpWdHJaWGxkTzF4dUlDQWdJR2xtSUNoamRYSnlaVzUwVm1Gc2RXVWdQVDBnYm5Wc2JDbGNiaUFnSUNBZ0lISmxkSFZ5YmlBb2JHRnpkRkJoY25RcElEOGdXeUJrWldaaGRXeDBWbUZzZFdVc0lIQmhjblJPSUYwZ09pQmtaV1poZFd4MFZtRnNkV1U3WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnS0d4aGMzUlFZWEowS1NBL0lGc2dZM1Z5Y21WdWRGWmhiSFZsTENCd1lYSjBUaUJkSURvZ1kzVnljbVZ1ZEZaaGJIVmxPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1ltbHVaRTFsZEdodlpITW9YM0J5YjNSdkxDQnphMmx3VUhKdmRHOXpLU0I3WEc0Z0lHeGxkQ0J3Y205MGJ5QWdJQ0FnSUNBZ0lDQWdQU0JmY0hKdmRHODdYRzRnSUd4bGRDQmhiSEpsWVdSNVZtbHphWFJsWkNBZ1BTQnVaWGNnVTJWMEtDazdYRzVjYmlBZ2QyaHBiR1VnS0hCeWIzUnZLU0I3WEc0Z0lDQWdiR1YwSUdSbGMyTnlhWEIwYjNKeklEMGdUMkpxWldOMExtZGxkRTkzYmxCeWIzQmxjblI1UkdWelkzSnBjSFJ2Y25Nb2NISnZkRzhwTzF4dUlDQWdJR3hsZENCclpYbHpJQ0FnSUNBZ0lDQTlJRTlpYW1WamRDNXJaWGx6S0dSbGMyTnlhWEIwYjNKektTNWpiMjVqWVhRb1QySnFaV04wTG1kbGRFOTNibEJ5YjNCbGNuUjVVM2x0WW05c2N5aGtaWE5qY21sd2RHOXljeWtwTzF4dVhHNGdJQ0FnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2EyVjVjeTVzWlc1bmRHZzdJR2tnUENCcGJEc2dhU3NyS1NCN1hHNGdJQ0FnSUNCc1pYUWdhMlY1SUQwZ2EyVjVjMXRwWFR0Y2JpQWdJQ0FnSUdsbUlDaHJaWGtnUFQwOUlDZGpiMjV6ZEhKMVkzUnZjaWNwWEc0Z0lDQWdJQ0FnSUdOdmJuUnBiblZsTzF4dVhHNGdJQ0FnSUNCcFppQW9ZV3h5WldGa2VWWnBjMmwwWldRdWFHRnpLR3RsZVNrcFhHNGdJQ0FnSUNBZ0lHTnZiblJwYm5WbE8xeHVYRzRnSUNBZ0lDQmhiSEpsWVdSNVZtbHphWFJsWkM1aFpHUW9hMlY1S1R0Y2JseHVJQ0FnSUNBZ2JHVjBJSFpoYkhWbElEMGdjSEp2ZEc5YmEyVjVYVHRjYmx4dUlDQWdJQ0FnTHk4Z1UydHBjQ0J3Y205MGIzUjVjR1VnYjJZZ1QySnFaV04wWEc0Z0lDQWdJQ0F2THlCbGMyeHBiblF0WkdsellXSnNaUzF1WlhoMExXeHBibVVnYm04dGNISnZkRzkwZVhCbExXSjFhV3gwYVc1elhHNGdJQ0FnSUNCcFppQW9UMkpxWldOMExuQnliM1J2ZEhsd1pTNW9ZWE5QZDI1UWNtOXdaWEowZVNoclpYa3BJQ1ltSUU5aWFtVmpkQzV3Y205MGIzUjVjR1ZiYTJWNVhTQTlQVDBnZG1Gc2RXVXBYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdJQ0JwWmlBb2RIbHdaVzltSUhaaGJIVmxJQ0U5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ0lDQmpiMjUwYVc1MVpUdGNibHh1SUNBZ0lDQWdkR2hwYzF0clpYbGRJRDBnZG1Gc2RXVXVZbWx1WkNoMGFHbHpLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQndjbTkwYnlBOUlFOWlhbVZqZEM1blpYUlFjbTkwYjNSNWNHVlBaaWh3Y205MGJ5azdYRzRnSUNBZ2FXWWdLSEJ5YjNSdklEMDlQU0JQWW1wbFkzUXVjSEp2ZEc5MGVYQmxLVnh1SUNBZ0lDQWdZbkpsWVdzN1hHNWNiaUFnSUNCcFppQW9jMnRwY0ZCeWIzUnZjeUFtSmlCemEybHdVSEp2ZEc5ekxtbHVaR1Y0VDJZb2NISnZkRzhwSUQ0OUlEQXBYRzRnSUNBZ0lDQmljbVZoYXp0Y2JpQWdmVnh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2FYTkZiWEIwZVNoMllXeDFaU2tnZTF4dUlDQnBaaUFvZG1Gc2RXVWdQVDBnYm5Wc2JDbGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNCcFppQW9UMkpxWldOMExtbHpLSFpoYkhWbExDQkpibVpwYm1sMGVTa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2hQWW1wbFkzUXVhWE1vZG1Gc2RXVXNJRTVoVGlrcFhHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnYVdZZ0tHbHVjM1JoYm1ObFQyWW9kbUZzZFdVc0lDZHpkSEpwYm1jbktTbGNiaUFnSUNCeVpYUjFjbTRnSVNndlhGeFRMeWt1ZEdWemRDaDJZV3gxWlNrN1hHNGdJR1ZzYzJVZ2FXWWdLR2x1YzNSaGJtTmxUMllvZG1Gc2RXVXNJQ2R1ZFcxaVpYSW5LU0FtSmlCcGMwWnBibWwwWlNoMllXeDFaU2twWEc0Z0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dUlDQmxiSE5sSUdsbUlDZ2hhVzV6ZEdGdVkyVlBaaWgyWVd4MVpTd2dKMkp2YjJ4bFlXNG5MQ0FuWW1sbmFXNTBKeXdnSjJaMWJtTjBhVzl1SnlrZ0ppWWdjMmw2WlU5bUtIWmhiSFZsS1NBOVBUMGdNQ2xjYmlBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQnlaWFIxY200Z1ptRnNjMlU3WEc1OVhHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnBjMDV2ZEVWdGNIUjVLSFpoYkhWbEtTQjdYRzRnSUhKbGRIVnliaUFoYVhORmJYQjBlUzVqWVd4c0tIUm9hWE1zSUhaaGJIVmxLVHRjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHWnNZWFIwWlc1QmNuSmhlU2gyWVd4MVpTa2dlMXh1SUNCcFppQW9JVUZ5Y21GNUxtbHpRWEp5WVhrb2RtRnNkV1VwS1Z4dUlDQWdJSEpsZEhWeWJpQjJZV3gxWlR0Y2JseHVJQ0JzWlhRZ2JtVjNRWEp5WVhrZ1BTQmJYVHRjYmlBZ1ptOXlJQ2hzWlhRZ2FTQTlJREFzSUdsc0lEMGdkbUZzZFdVdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lHeGxkQ0JwZEdWdElEMGdkbUZzZFdWYmFWMDdYRzRnSUNBZ2FXWWdLRUZ5Y21GNUxtbHpRWEp5WVhrb2FYUmxiU2twWEc0Z0lDQWdJQ0J1WlhkQmNuSmhlU0E5SUc1bGQwRnljbUY1TG1OdmJtTmhkQ2htYkdGMGRHVnVRWEp5WVhrb2FYUmxiU2twTzF4dUlDQWdJR1ZzYzJWY2JpQWdJQ0FnSUc1bGQwRnljbUY1TG5CMWMyZ29hWFJsYlNrN1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2JtVjNRWEp5WVhrN1hHNTlYRzVjYm1WNGNHOXlkQ0JtZFc1amRHbHZiaUJwYzFaaGJHbGtRMmhwYkdRb1kyaHBiR1FwSUh0Y2JpQWdhV1lnS0dOb2FXeGtJRDA5SUc1MWJHd3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2gwZVhCbGIyWWdZMmhwYkdRZ1BUMDlJQ2RpYjI5c1pXRnVKeWxjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0U5aWFtVmpkQzVwY3loamFHbHNaQ3dnU1c1bWFXNXBkSGtwS1Z4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0JwWmlBb1QySnFaV04wTG1sektHTm9hV3hrTENCT1lVNHBLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQnlaWFIxY200Z2RISjFaVHRjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHbHpTWFJsY21GaWJHVkRhR2xzWkNoamFHbHNaQ2tnZTF4dUlDQnBaaUFvWTJocGJHUWdQVDBnYm5Wc2JDQjhmQ0JQWW1wbFkzUXVhWE1vWTJocGJHUXNJRTVoVGlrZ2ZId2dUMkpxWldOMExtbHpLR05vYVd4a0xDQkpibVpwYm1sMGVTa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lISmxkSFZ5YmlBb1FYSnlZWGt1YVhOQmNuSmhlU2hqYUdsc1pDa2dmSHdnZEhsd1pXOW1JR05vYVd4a0lEMDlQU0FuYjJKcVpXTjBKeUFtSmlBaGFXNXpkR0Z1WTJWUFppaGphR2xzWkN3Z0oySnZiMnhsWVc0bkxDQW5iblZ0WW1WeUp5d2dKM04wY21sdVp5Y3BLVHRjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHNXZkeWdwSUh0Y2JpQWdhV1lnS0hSNWNHVnZaaUJ3WlhKbWIzSnRZVzVqWlNBaFBUMGdKM1Z1WkdWbWFXNWxaQ2NnSmlZZ2RIbHdaVzltSUhCbGNtWnZjbTFoYm1ObExtNXZkeUE5UFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNCeVpYUjFjbTRnY0dWeVptOXliV0Z1WTJVdWJtOTNLQ2s3WEc0Z0lHVnNjMlZjYmlBZ0lDQnlaWFIxY200Z1JHRjBaUzV1YjNjb0tUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdkbGJtVnlZWFJsVlZWSlJDZ3BJSHRjYmlBZ2FXWWdLSFYxYVdRZ1BpQTVPVGs1T1RrNUtWeHVJQ0FnSUhWMWFXUWdQU0F4TURBd01EQXdPMXh1WEc0Z0lISmxkSFZ5YmlCZ0pIdEVZWFJsTG01dmR5Z3BmUzRrZTNWMWFXUXJLMzBrZTAxaGRHZ3VjbTkxYm1Rb1RXRjBhQzV5WVc1a2IyMG9LU0FxSURFd01EQXdNREF3S1M1MGIxTjBjbWx1WnlncExuQmhaRk4wWVhKMEtESXdMQ0FuTUNjcGZXQTdYRzU5WEc0aUxDSXZMeUJVYUdVZ2JXOWtkV3hsSUdOaFkyaGxYRzUyWVhJZ1gxOTNaV0p3WVdOclgyMXZaSFZzWlY5allXTm9aVjlmSUQwZ2UzMDdYRzVjYmk4dklGUm9aU0J5WlhGMWFYSmxJR1oxYm1OMGFXOXVYRzVtZFc1amRHbHZiaUJmWDNkbFluQmhZMnRmY21WeGRXbHlaVjlmS0cxdlpIVnNaVWxrS1NCN1hHNWNkQzh2SUVOb1pXTnJJR2xtSUcxdlpIVnNaU0JwY3lCcGJpQmpZV05vWlZ4dVhIUjJZWElnWTJGamFHVmtUVzlrZFd4bElEMGdYMTkzWldKd1lXTnJYMjF2WkhWc1pWOWpZV05vWlY5ZlcyMXZaSFZzWlVsa1hUdGNibHgwYVdZZ0tHTmhZMmhsWkUxdlpIVnNaU0FoUFQwZ2RXNWtaV1pwYm1Wa0tTQjdYRzVjZEZ4MGNtVjBkWEp1SUdOaFkyaGxaRTF2WkhWc1pTNWxlSEJ2Y25Sek8xeHVYSFI5WEc1Y2RDOHZJRU55WldGMFpTQmhJRzVsZHlCdGIyUjFiR1VnS0dGdVpDQndkWFFnYVhRZ2FXNTBieUIwYUdVZ1kyRmphR1VwWEc1Y2RIWmhjaUJ0YjJSMWJHVWdQU0JmWDNkbFluQmhZMnRmYlc5a2RXeGxYMk5oWTJobFgxOWJiVzlrZFd4bFNXUmRJRDBnZTF4dVhIUmNkQzh2SUc1dklHMXZaSFZzWlM1cFpDQnVaV1ZrWldSY2JseDBYSFF2THlCdWJ5QnRiMlIxYkdVdWJHOWhaR1ZrSUc1bFpXUmxaRnh1WEhSY2RHVjRjRzl5ZEhNNklIdDlYRzVjZEgwN1hHNWNibHgwTHk4Z1JYaGxZM1YwWlNCMGFHVWdiVzlrZFd4bElHWjFibU4wYVc5dVhHNWNkRjlmZDJWaWNHRmphMTl0YjJSMWJHVnpYMTliYlc5a2RXeGxTV1JkTG1OaGJHd29iVzlrZFd4bExtVjRjRzl5ZEhNc0lHMXZaSFZzWlN3Z2JXOWtkV3hsTG1WNGNHOXlkSE1zSUY5ZmQyVmljR0ZqYTE5eVpYRjFhWEpsWDE4cE8xeHVYRzVjZEM4dklGSmxkSFZ5YmlCMGFHVWdaWGh3YjNKMGN5QnZaaUIwYUdVZ2JXOWtkV3hsWEc1Y2RISmxkSFZ5YmlCdGIyUjFiR1V1Wlhod2IzSjBjenRjYm4xY2JseHVJaXdpTHk4Z1pHVm1hVzVsSUdkbGRIUmxjaUJtZFc1amRHbHZibk1nWm05eUlHaGhjbTF2Ym5rZ1pYaHdiM0owYzF4dVgxOTNaV0p3WVdOclgzSmxjWFZwY21WZlh5NWtJRDBnS0dWNGNHOXlkSE1zSUdSbFptbHVhWFJwYjI0cElEMCtJSHRjYmx4MFptOXlLSFpoY2lCclpYa2dhVzRnWkdWbWFXNXBkR2x2YmlrZ2UxeHVYSFJjZEdsbUtGOWZkMlZpY0dGamExOXlaWEYxYVhKbFgxOHVieWhrWldacGJtbDBhVzl1TENCclpYa3BJQ1ltSUNGZlgzZGxZbkJoWTJ0ZmNtVnhkV2x5WlY5ZkxtOG9aWGh3YjNKMGN5d2dhMlY1S1NrZ2UxeHVYSFJjZEZ4MFQySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLR1Y0Y0c5eWRITXNJR3RsZVN3Z2V5QmxiblZ0WlhKaFlteGxPaUIwY25WbExDQm5aWFE2SUdSbFptbHVhWFJwYjI1YmEyVjVYU0I5S1R0Y2JseDBYSFI5WEc1Y2RIMWNibjA3SWl3aVgxOTNaV0p3WVdOclgzSmxjWFZwY21WZlh5NW5JRDBnS0daMWJtTjBhVzl1S0NrZ2UxeHVYSFJwWmlBb2RIbHdaVzltSUdkc2IySmhiRlJvYVhNZ1BUMDlJQ2R2WW1wbFkzUW5LU0J5WlhSMWNtNGdaMnh2WW1Gc1ZHaHBjenRjYmx4MGRISjVJSHRjYmx4MFhIUnlaWFIxY200Z2RHaHBjeUI4ZkNCdVpYY2dSblZ1WTNScGIyNG9KM0psZEhWeWJpQjBhR2x6Snlrb0tUdGNibHgwZlNCallYUmphQ0FvWlNrZ2UxeHVYSFJjZEdsbUlDaDBlWEJsYjJZZ2QybHVaRzkzSUQwOVBTQW5iMkpxWldOMEp5a2djbVYwZFhKdUlIZHBibVJ2ZHp0Y2JseDBmVnh1ZlNrb0tUc2lMQ0pmWDNkbFluQmhZMnRmY21WeGRXbHlaVjlmTG04Z1BTQW9iMkpxTENCd2NtOXdLU0E5UGlBb1QySnFaV04wTG5CeWIzUnZkSGx3WlM1b1lYTlBkMjVRY205d1pYSjBlUzVqWVd4c0tHOWlhaXdnY0hKdmNDa3BJaXdpTHk4Z1pHVm1hVzVsSUY5ZlpYTk5iMlIxYkdVZ2IyNGdaWGh3YjNKMGMxeHVYMTkzWldKd1lXTnJYM0psY1hWcGNtVmZYeTV5SUQwZ0tHVjRjRzl5ZEhNcElEMCtJSHRjYmx4MGFXWW9kSGx3Wlc5bUlGTjViV0p2YkNBaFBUMGdKM1Z1WkdWbWFXNWxaQ2NnSmlZZ1UzbHRZbTlzTG5SdlUzUnlhVzVuVkdGbktTQjdYRzVjZEZ4MFQySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLR1Y0Y0c5eWRITXNJRk41YldKdmJDNTBiMU4wY21sdVoxUmhaeXdnZXlCMllXeDFaVG9nSjAxdlpIVnNaU2NnZlNrN1hHNWNkSDFjYmx4MFQySnFaV04wTG1SbFptbHVaVkJ5YjNCbGNuUjVLR1Y0Y0c5eWRITXNJQ2RmWDJWelRXOWtkV3hsSnl3Z2V5QjJZV3gxWlRvZ2RISjFaU0I5S1R0Y2JuMDdJaXdpYVcxd2IzSjBJSHRjYmlBZ1NrbENYMEpCVWxKRlRpeGNiaUFnU2tsQ1gxQlNUMWhaTEZ4dUlDQktTVUpmVWtGWFgxUkZXRlFzWEc0Z0lFcEpRaXhjYmlBZ1NrbENYME5JU1V4RVgwbE9SRVZZWDFCU1QxQXNYRzRnSUVwcFlpeGNiaUFnWm1GamRHOXllU3hjYmlBZ0pDeGNiaUFnYVhOS2FXSnBjMmdzWEc0Z0lHTnZibk4wY25WamRFcHBZaXhjYmlBZ2NtVnpiMngyWlVOb2FXeGtjbVZ1TEZ4dWZTQm1jbTl0SUNjdUwycHBZaTVxY3ljN1hHNWNibVY0Y0c5eWRDQmpiMjV6ZENCS2FXSnpJRDBnZTF4dUlDQktTVUpmUWtGU1VrVk9MRnh1SUNCS1NVSmZVRkpQV0Zrc1hHNGdJRXBKUWw5U1FWZGZWRVZZVkN4Y2JpQWdTa2xDTEZ4dUlDQktTVUpmUTBoSlRFUmZTVTVFUlZoZlVGSlBVQ3hjYmlBZ1NtbGlMRnh1SUNCcGMwcHBZbWx6YUN4Y2JpQWdZMjl1YzNSeWRXTjBTbWxpTEZ4dUlDQnlaWE52YkhabFEyaHBiR1J5Wlc0c1hHNTlPMXh1WEc1cGJYQnZjblFnZTF4dUlDQlZVRVJCVkVWZlJWWkZUbFFzWEc0Z0lGRlZSVlZGWDFWUVJFRlVSVjlOUlZSSVQwUXNYRzRnSUVaTVZWTklYMVZRUkVGVVJWOU5SVlJJVDBRc1hHNGdJRWxPU1ZSZlRVVlVTRTlFTEZ4dUlDQlRTMGxRWDFOVVFWUkZYMVZRUkVGVVJWTXNYRzRnSUZCRlRrUkpUa2RmVTFSQlZFVmZWVkJFUVZSRkxGeHVJQ0JNUVZOVVgxSkZUa1JGVWw5VVNVMUZMRnh1SUNCUVVrVldTVTlWVTE5VFZFRlVSU3hjYmx4dUlDQkRiMjF3YjI1bGJuUXNYRzRnSUZSbGNtMHNYRzU5SUdaeWIyMGdKeTR2WTI5dGNHOXVaVzUwTG1wekp6dGNibHh1Wlhod2IzSjBJR052Ym5OMElFTnZiWEJ2Ym1WdWRITWdQU0I3WEc0Z0lGVlFSRUZVUlY5RlZrVk9WQ3hjYmlBZ1VWVkZWVVZmVlZCRVFWUkZYMDFGVkVoUFJDeGNiaUFnUmt4VlUwaGZWVkJFUVZSRlgwMUZWRWhQUkN4Y2JpQWdTVTVKVkY5TlJWUklUMFFzWEc0Z0lGTkxTVkJmVTFSQlZFVmZWVkJFUVZSRlV5eGNiaUFnVUVWT1JFbE9SMTlUVkVGVVJWOVZVRVJCVkVVc1hHNGdJRXhCVTFSZlVrVk9SRVZTWDFSSlRVVXNYRzRnSUZCU1JWWkpUMVZUWDFOVVFWUkZMRnh1ZlR0Y2JseHVhVzF3YjNKMElIdGNiaUFnUms5U1EwVmZVa1ZHVEU5WExGeHVJQ0JTYjI5MFRtOWtaU3hjYmlBZ1VtVnVaR1Z5WlhJc1hHNTlJR1p5YjIwZ0p5NHZjbVZ1WkdWeVpYSnpMMmx1WkdWNExtcHpKenRjYmx4dVpYaHdiM0owSUdOdmJuTjBJRkpsYm1SbGNtVnljeUE5SUh0Y2JpQWdRMDlPVkVWWVZGOUpSRG9nVW05dmRFNXZaR1V1UTA5T1ZFVllWRjlKUkN4Y2JpQWdSazlTUTBWZlVrVkdURTlYTEZ4dUlDQlNiMjkwVG05a1pTeGNiaUFnVW1WdVpHVnlaWElzWEc1OU8xeHVYRzVsZUhCdmNuUWdLaUJoY3lCVmRHbHNjeUJtY205dElDY3VMM1YwYVd4ekxtcHpKenRjYm1WNGNHOXlkQ0I3SUdSbFptRjFiSFFnWVhNZ1pHVmhaR0psWldZZ2ZTQm1jbTl0SUNka1pXRmtZbVZsWmljN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUdaaFkzUnZjbmtzWEc0Z0lDUXNYRzRnSUVOdmJYQnZibVZ1ZEN4Y2JpQWdWR1Z5YlN4Y2JuMDdYRzRpWFN3aWJtRnRaWE1pT2x0ZExDSnpiM1Z5WTJWU2IyOTBJam9pSW4wPSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiZXhwb3J0IHsgRE9NUmVuZGVyZXIgfSBmcm9tICcuL2RvbS1yZW5kZXJlci5qcyc7XG5leHBvcnQgKiBmcm9tICdqaWJzJztcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==