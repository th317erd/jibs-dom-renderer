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
      let { node, cacheKey } = renderResult;

      addedChildren.set(cacheKey, renderResult);
      this.addChild(node);
    }

    // Remove nodes no longer in the fragment
    let childrenToDestroy = [];
    for (let [ cacheKey, childNode ] of this.childNodes) {
      let hasChild = addedChildren.has(cacheKey);
      if (!hasChild) {
        // This node was destroyed
        childrenToDestroy.push(childNode);
        this.removeChild(childNode);
      }
    }

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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_21143__) => {

__nested_webpack_require_21143__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_21143__.d(__webpack_exports__, {
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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_23904__) => {

__nested_webpack_require_23904__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_23904__.d(__webpack_exports__, {
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
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_23904__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_23904__(/*! ./utils.js */ "./lib/utils.js");



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

        let mappedJib = callback(jib);
        if (isJibish(mappedJib))
          mappedJib = constructJib(mappedJib);
        else
          return mappedJib;

        return $(mappedJib.Type, mappedJib.props)(...(mappedJib.children || []));
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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_29936__) => {

__nested_webpack_require_29936__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_29936__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.CONTEXT_ID),
/* harmony export */   "FORCE_REFLOW": () => (/* binding */ FORCE_REFLOW),
/* harmony export */   "Renderer": () => (/* reexport safe */ _renderer_js__WEBPACK_IMPORTED_MODULE_1__.Renderer),
/* harmony export */   "RootNode": () => (/* reexport safe */ _root_node_js__WEBPACK_IMPORTED_MODULE_0__.RootNode)
/* harmony export */ });
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_29936__(/*! ./root-node.js */ "./lib/renderers/root-node.js");
/* harmony import */ var _renderer_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_29936__(/*! ./renderer.js */ "./lib/renderers/renderer.js");


const FORCE_REFLOW = Symbol.for('@jibsForceReflow');




/***/ }),

/***/ "./lib/renderers/renderer.js":
/*!***********************************!*\
  !*** ./lib/renderers/renderer.js ***!
  \***********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_31105__) => {

__nested_webpack_require_31105__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_31105__.d(__webpack_exports__, {
/* harmony export */   "Renderer": () => (/* binding */ Renderer)
/* harmony export */ });
/* harmony import */ var _root_node_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_31105__(/*! ./root-node.js */ "./lib/renderers/root-node.js");


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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_33835__) => {

__nested_webpack_require_33835__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_33835__.d(__webpack_exports__, {
/* harmony export */   "CONTEXT_ID": () => (/* binding */ CONTEXT_ID),
/* harmony export */   "RootNode": () => (/* binding */ RootNode)
/* harmony export */ });
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_33835__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_33835__(/*! ../utils.js */ "./lib/utils.js");
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_33835__(/*! ../jib.js */ "./lib/jib.js");




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
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __nested_webpack_require_40034__) => {

__nested_webpack_require_40034__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_40034__.d(__webpack_exports__, {
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
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_40034__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");
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
/******/ function __nested_webpack_require_52819__(moduleId) {
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
/******/ 	__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nested_webpack_require_52819__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nested_webpack_require_52819__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nested_webpack_require_52819__.o(definition, key) && !__nested_webpack_require_52819__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/global */
/******/ (() => {
/******/ 	__nested_webpack_require_52819__.g = (function() {
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
/******/ 	__nested_webpack_require_52819__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__nested_webpack_require_52819__.r = (exports) => {
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
__nested_webpack_require_52819__.r(__webpack_exports__);
/* harmony export */ __nested_webpack_require_52819__.d(__webpack_exports__, {
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
/* harmony import */ var _jib_js__WEBPACK_IMPORTED_MODULE_0__ = __nested_webpack_require_52819__(/*! ./jib.js */ "./lib/jib.js");
/* harmony import */ var _component_js__WEBPACK_IMPORTED_MODULE_1__ = __nested_webpack_require_52819__(/*! ./component.js */ "./lib/component.js");
/* harmony import */ var _renderers_index_js__WEBPACK_IMPORTED_MODULE_2__ = __nested_webpack_require_52819__(/*! ./renderers/index.js */ "./lib/renderers/index.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_3__ = __nested_webpack_require_52819__(/*! ./utils.js */ "./lib/utils.js");
/* harmony import */ var deadbeef__WEBPACK_IMPORTED_MODULE_4__ = __nested_webpack_require_52819__(/*! deadbeef */ "./node_modules/deadbeef/lib/index.js");


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


//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOztBQUVNOztBQUVBO0FBQ1A7QUFDQTs7QUFFQSw4Q0FBOEMscUNBQVEsY0FBYyxxQ0FBUTtBQUM1RSw4Q0FBOEMscUNBQVEsY0FBYyxxQ0FBUTs7QUFFNUU7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxxQ0FBcUMsUUFBUTtBQUM3Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVPO0FBQ1A7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQSxxQ0FBcUMsUUFBUTtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRU87QUFDUDtBQUNBOztBQUVBLFlBQVksV0FBVyxHQUFHLE9BQU8sRUFBRSxrRUFBa0U7QUFDckc7Ozs7Ozs7U0NoY0E7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTs7U0FFQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTs7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTtVQUNBO1VBQ0E7VUFDQTtVQUNBLEdBQUc7VUFDSDtVQUNBO1VBQ0EsQ0FBQzs7Ozs7VUNQRDs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ01rQjs7QUFFWDtBQUNQLFlBQVk7QUFDWixXQUFXO0FBQ1gsY0FBYztBQUNkLEtBQUs7QUFDTCxzQkFBc0I7QUFDdEIsS0FBSztBQUNMLFVBQVU7QUFDVixjQUFjO0FBQ2QsaUJBQWlCO0FBQ2pCOztBQWN3Qjs7QUFFakI7QUFDUCxjQUFjO0FBQ2QscUJBQXFCO0FBQ3JCLHFCQUFxQjtBQUNyQixhQUFhO0FBQ2Isb0JBQW9CO0FBQ3BCLHNCQUFzQjtBQUN0QixrQkFBa0I7QUFDbEIsZ0JBQWdCO0FBQ2hCOztBQU04Qjs7QUFFdkI7QUFDUCxjQUFjLG9FQUFtQjtBQUNqQyxjQUFjO0FBQ2QsVUFBVTtBQUNWLFVBQVU7QUFDVjs7QUFFb0M7QUFDVzs7QUFPN0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9qaWJzLy4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL2NvbXBvbmVudC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL2V2ZW50cy5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL2ppYi5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9pbmRleC5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9yZW5kZXJlci5qcyIsIndlYnBhY2s6Ly9qaWJzLy4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanMiLCJ3ZWJwYWNrOi8vamlicy8uL2xpYi91dGlscy5qcyIsIndlYnBhY2s6Ly9qaWJzL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2ppYnMvd2VicGFjay9ydW50aW1lL2dsb2JhbCIsIndlYnBhY2s6Ly9qaWJzL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vamlicy93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2ppYnMvLi9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMjIgV3lhdHQgR3JlZW53YXlcblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCB0aGlzR2xvYmFsID0gKCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiBnbG9iYWwpIHx8IHRoaXM7XG5jb25zdCBERUFEQkVFRl9SRUZfTUFQX0tFWSA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZSZWZNYXAnKTtcbmNvbnN0IFVOSVFVRV9JRF9TWU1CT0wgPSBTeW1ib2wuZm9yKCdAQGRlYWRiZWVmVW5pcXVlSUQnKTtcbmNvbnN0IHJlZk1hcCA9ICh0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSkgPyB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA6IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBpZEhlbHBlcnMgPSBbXTtcblxuaWYgKCF0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSlcbiAgdGhpc0dsb2JhbFtERUFEQkVFRl9SRUZfTUFQX0tFWV0gPSByZWZNYXA7XG5cbmxldCB1dWlkQ291bnRlciA9IDBuO1xuXG5mdW5jdGlvbiBnZXRIZWxwZXJGb3JWYWx1ZSh2YWx1ZSkge1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBpZEhlbHBlcnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCB7IGhlbHBlciwgZ2VuZXJhdG9yIH0gPSBpZEhlbHBlcnNbaV07XG4gICAgaWYgKGhlbHBlcih2YWx1ZSkpXG4gICAgICByZXR1cm4gZ2VuZXJhdG9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFueXRoaW5nVG9JRChfYXJnLCBfYWxyZWFkeVZpc2l0ZWQpIHtcbiAgbGV0IGFyZyA9IF9hcmc7XG4gIGlmIChhcmcgaW5zdGFuY2VvZiBOdW1iZXIgfHwgYXJnIGluc3RhbmNlb2YgU3RyaW5nIHx8IGFyZyBpbnN0YW5jZW9mIEJvb2xlYW4pXG4gICAgYXJnID0gYXJnLnZhbHVlT2YoKTtcblxuICBsZXQgdHlwZU9mID0gdHlwZW9mIGFyZztcblxuICBpZiAodHlwZU9mID09PSAnbnVtYmVyJyAmJiBhcmcgPT09IDApIHtcbiAgICBpZiAoT2JqZWN0LmlzKGFyZywgLTApKVxuICAgICAgcmV0dXJuICdudW1iZXI6LTAnO1xuXG4gICAgcmV0dXJuICdudW1iZXI6KzAnO1xuICB9XG5cbiAgaWYgKHR5cGVPZiA9PT0gJ3N5bWJvbCcpXG4gICAgcmV0dXJuIGBzeW1ib2w6JHthcmcudG9TdHJpbmcoKX1gO1xuXG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlT2YgPT09ICdudW1iZXInIHx8IHR5cGVPZiA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVPZiA9PT0gJ3N0cmluZycgfHwgdHlwZU9mID09PSAnYmlnaW50Jykge1xuICAgIGlmICh0eXBlT2YgPT09ICdudW1iZXInKVxuICAgICAgcmV0dXJuIChhcmcgPCAwKSA/IGBudW1iZXI6JHthcmd9YCA6IGBudW1iZXI6KyR7YXJnfWA7XG5cbiAgICBpZiAodHlwZU9mID09PSAnYmlnaW50JyAmJiBhcmcgPT09IDBuKVxuICAgICAgcmV0dXJuICdiaWdpbnQ6KzAnO1xuXG4gICAgcmV0dXJuIGAke3R5cGVPZn06JHthcmd9YDtcbiAgfVxuXG4gIGxldCBpZEhlbHBlciA9IChpZEhlbHBlcnMubGVuZ3RoID4gMCAmJiBnZXRIZWxwZXJGb3JWYWx1ZShhcmcpKTtcbiAgaWYgKGlkSGVscGVyKVxuICAgIHJldHVybiBhbnl0aGluZ1RvSUQoaWRIZWxwZXIoYXJnKSk7XG5cbiAgaWYgKFVOSVFVRV9JRF9TWU1CT0wgaW4gYXJnICYmIHR5cGVvZiBhcmdbVU5JUVVFX0lEX1NZTUJPTF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBQcmV2ZW50IGluZmluaXRlIHJlY3Vyc2lvblxuICAgIGlmICghX2FscmVhZHlWaXNpdGVkIHx8ICFfYWxyZWFkeVZpc2l0ZWQuaGFzKGFyZykpIHtcbiAgICAgIGxldCBhbHJlYWR5VmlzaXRlZCA9IF9hbHJlYWR5VmlzaXRlZCB8fCBuZXcgU2V0KCk7XG4gICAgICBhbHJlYWR5VmlzaXRlZC5hZGQoYXJnKTtcbiAgICAgIHJldHVybiBhbnl0aGluZ1RvSUQoYXJnW1VOSVFVRV9JRF9TWU1CT0xdKCksIGFscmVhZHlWaXNpdGVkKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXJlZk1hcC5oYXMoYXJnKSkge1xuICAgIGxldCBrZXkgPSBgJHt0eXBlb2YgYXJnfTokeysrdXVpZENvdW50ZXJ9YDtcbiAgICByZWZNYXAuc2V0KGFyZywga2V5KTtcbiAgICByZXR1cm4ga2V5O1xuICB9XG5cbiAgcmV0dXJuIHJlZk1hcC5nZXQoYXJnKTtcbn1cblxuZnVuY3Rpb24gZGVhZGJlZWYoKSB7XG4gIGxldCBwYXJ0cyA9IFsgYXJndW1lbnRzLmxlbmd0aCBdO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICBwYXJ0cy5wdXNoKGFueXRoaW5nVG9JRChhcmd1bWVudHNbaV0pKTtcblxuICByZXR1cm4gcGFydHMuam9pbignOicpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZlNvcnRlZCgpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5zb3J0KCkuam9pbignOicpO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUlERm9yKGhlbHBlciwgZ2VuZXJhdG9yKSB7XG4gIGlkSGVscGVycy5wdXNoKHsgaGVscGVyLCBnZW5lcmF0b3IgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUlER2VuZXJhdG9yKGhlbHBlcikge1xuICBsZXQgaW5kZXggPSBpZEhlbHBlcnMuZmluZEluZGV4KChpdGVtKSA9PiAoaXRlbS5oZWxwZXIgPT09IGhlbHBlcikpO1xuICBpZiAoaW5kZXggPCAwKVxuICAgIHJldHVybjtcblxuICBpZEhlbHBlcnMuc3BsaWNlKGluZGV4LCAxKTtcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZGVhZGJlZWYsIHtcbiAgJ2lkU3ltJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIFVOSVFVRV9JRF9TWU1CT0wsXG4gIH0sXG4gICdzb3J0ZWQnOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZGVhZGJlZWZTb3J0ZWQsXG4gIH0sXG4gICdnZW5lcmF0ZUlERm9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIGdlbmVyYXRlSURGb3IsXG4gIH0sXG4gICdyZW1vdmVJREdlbmVyYXRvcic6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICByZW1vdmVJREdlbmVyYXRvcixcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYWRiZWVmO1xuIiwiLyogZ2xvYmFsIEJ1ZmZlciAqL1xuXG5pbXBvcnQgZGVhZGJlZWYgZnJvbSAnZGVhZGJlZWYnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi9ldmVudHMuanMnO1xuaW1wb3J0ICogYXMgVXRpbHMgICAgICAgZnJvbSAnLi91dGlscy5qcyc7XG5pbXBvcnQge1xuICAkLFxuICBpc0ppYmlzaCxcbiAgcmVzb2x2ZUNoaWxkcmVuLFxuICBjb25zdHJ1Y3RKaWIsXG59IGZyb20gJy4vamliLmpzJztcblxuZXhwb3J0IGNvbnN0IFVQREFURV9FVkVOVCAgICAgICAgICAgICAgPSAnQGppYnMvY29tcG9uZW50L2V2ZW50L3VwZGF0ZSc7XG5leHBvcnQgY29uc3QgUVVFVUVfVVBEQVRFX01FVEhPRCAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9xdWV1ZVVwZGF0ZScpO1xuZXhwb3J0IGNvbnN0IEZMVVNIX1VQREFURV9NRVRIT0QgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvZmx1c2hVcGRhdGUnKTtcbmV4cG9ydCBjb25zdCBJTklUX01FVEhPRCAgICAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L19faW5pdCcpO1xuZXhwb3J0IGNvbnN0IFNLSVBfU1RBVEVfVVBEQVRFUyAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvc2tpcFN0YXRlVXBkYXRlcycpO1xuZXhwb3J0IGNvbnN0IFBFTkRJTkdfU1RBVEVfVVBEQVRFICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcGVuZGluZ1N0YXRlVXBkYXRlJyk7XG5leHBvcnQgY29uc3QgTEFTVF9SRU5ERVJfVElNRSAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9sYXN0UmVuZGVyVGltZScpO1xuZXhwb3J0IGNvbnN0IFBSRVZJT1VTX1NUQVRFICAgICAgICAgICAgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcHJldmlvdXNTdGF0ZScpO1xuZXhwb3J0IGNvbnN0IENBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFMgPSBTeW1ib2wuZm9yKCdAamlicy9jb21wb25lbnQvcHJldmlvdXNTdGF0ZScpO1xuXG5jb25zdCBlbGVtZW50RGF0YUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcblxuZnVuY3Rpb24gaXNWYWxpZFN0YXRlT2JqZWN0KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBOYU4pKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKHZhbHVlLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEJvb2xlYW4gfHwgdmFsdWUgaW5zdGFuY2VvZiBOdW1iZXIgfHwgdmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGxldCB0eXBlT2YgPSB0eXBlb2YgdmFsdWU7XG4gIGlmICh0eXBlT2YgPT09ICdzdHJpbmcnIHx8IHR5cGVPZiA9PT0gJ251bWJlcicgfHwgdHlwZU9mID09PSAnYm9vbGVhbicpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmIEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgc3RhdGljIFVQREFURV9FVkVOVCA9IFVQREFURV9FVkVOVDtcblxuICBbUVVFVUVfVVBEQVRFX01FVEhPRF0oKSB7XG4gICAgaWYgKHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0gPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXS50aGVuKHRoaXNbRkxVU0hfVVBEQVRFX01FVEhPRF0uYmluZCh0aGlzKSk7XG4gIH1cblxuICBbRkxVU0hfVVBEQVRFX01FVEhPRF0oKSB7XG4gICAgLy8gV2FzIHRoZSBzdGF0ZSB1cGRhdGUgY2FuY2VsbGVkP1xuICAgIGlmICghdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0pXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmVtaXQoVVBEQVRFX0VWRU5UKTtcblxuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdID0gbnVsbDtcbiAgfVxuXG4gIFtJTklUX01FVEhPRF0oKSB7XG4gICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gZmFsc2U7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihfamliKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIC8vIEJpbmQgYWxsIGNsYXNzIG1ldGhvZHMgdG8gXCJ0aGlzXCJcbiAgICBVdGlscy5iaW5kTWV0aG9kcy5jYWxsKHRoaXMsIHRoaXMuY29uc3RydWN0b3IucHJvdG90eXBlKTtcblxuICAgIGxldCBqaWIgPSBfamliIHx8IHt9O1xuXG4gICAgY29uc3QgY3JlYXRlTmV3U3RhdGUgPSAoKSA9PiB7XG4gICAgICBsZXQgbG9jYWxTdGF0ZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAgIHJldHVybiBuZXcgUHJveHkobG9jYWxTdGF0ZSwge1xuICAgICAgICBnZXQ6ICh0YXJnZXQsIHByb3BOYW1lKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wTmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogKHRhcmdldCwgcHJvcE5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgbGV0IGN1cnJlbnRWYWx1ZSA9IHRhcmdldFtwcm9wTmFtZV07XG4gICAgICAgICAgaWYgKGN1cnJlbnRWYWx1ZSA9PT0gdmFsdWUpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgIGlmICghdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdKVxuICAgICAgICAgICAgdGhpc1tRVUVVRV9VUERBVEVfTUVUSE9EXSgpO1xuXG4gICAgICAgICAgdGFyZ2V0W3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgICAgICAgIHRoaXMub25TdGF0ZVVwZGF0ZWQocHJvcE5hbWUsIHZhbHVlLCBjdXJyZW50VmFsdWUpO1xuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgbGV0IHByb3BzICAgICAgID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCBqaWIucHJvcHMgfHwge30pO1xuICAgIGxldCBfbG9jYWxTdGF0ZSA9IGNyZWF0ZU5ld1N0YXRlKCk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICBbU0tJUF9TVEFURV9VUERBVEVTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB0cnVlLFxuICAgICAgfSxcbiAgICAgIFtQRU5ESU5HX1NUQVRFX1VQREFURV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCksXG4gICAgICB9LFxuICAgICAgW0xBU1RfUkVOREVSX1RJTUVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFV0aWxzLm5vdygpLFxuICAgICAgfSxcbiAgICAgIFtDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICB7fSxcbiAgICAgIH0sXG4gICAgICAnaWQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmlkLFxuICAgICAgfSxcbiAgICAgICdwcm9wcyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgcHJvcHMsXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuY2hpbGRyZW4gfHwgW10sXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5jb250ZXh0IHx8IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgICB9LFxuICAgICAgJ3N0YXRlJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIGdldDogICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBfbG9jYWxTdGF0ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiAgICAgICAgICAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc3RhdGVcIjogXCIke3ZhbHVlfVwiLiBQcm92aWRlZCBcInN0YXRlXCIgbXVzdCBiZSBhbiBpdGVyYWJsZSBvYmplY3QuYCk7XG5cbiAgICAgICAgICBPYmplY3QuYXNzaWduKF9sb2NhbFN0YXRlLCB2YWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIHJlc29sdmVDaGlsZHJlbi5jYWxsKHRoaXMsIGNoaWxkcmVuKTtcbiAgfVxuXG4gIGlzSmliKHZhbHVlKSB7XG4gICAgcmV0dXJuIGlzSmliaXNoKHZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICAgIHJldHVybiBjb25zdHJ1Y3RKaWIodmFsdWUpO1xuICB9XG5cbiAgcHVzaFJlbmRlcihyZW5kZXJSZXN1bHQpIHtcbiAgICB0aGlzLmVtaXQoVVBEQVRFX0VWRU5ULCByZW5kZXJSZXN1bHQpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uUHJvcFVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCBuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgfVxuXG4gIGNhcHR1cmVSZWZlcmVuY2UobmFtZSwgaW50ZXJjZXB0b3JDYWxsYmFjaykge1xuICAgIGxldCBtZXRob2QgPSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdW25hbWVdO1xuICAgIGlmIChtZXRob2QpXG4gICAgICByZXR1cm4gbWV0aG9kO1xuXG4gICAgbWV0aG9kID0gKF9yZWYsIHByZXZpb3VzUmVmKSA9PiB7XG4gICAgICBsZXQgcmVmID0gX3JlZjtcblxuICAgICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZWYgPSBpbnRlcmNlcHRvckNhbGxiYWNrLmNhbGwodGhpcywgcmVmLCBwcmV2aW91c1JlZik7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICAgW25hbWVdOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgcmVmLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgaW50ZXJjZXB0b3JDYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU10gPSBtZXRob2Q7XG5cbiAgICByZXR1cm4gbWV0aG9kO1xuICB9XG5cbiAgZm9yY2VVcGRhdGUoKSB7XG4gICAgdGhpc1tRVUVVRV9VUERBVEVfTUVUSE9EXSgpO1xuICB9XG5cbiAgZ2V0U3RhdGUocHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIHN0YXRlO1xuXG4gICAgaWYgKFV0aWxzLmluc3RhbmNlT2YocHJvcGVydHlQYXRoLCAnb2JqZWN0JykpIHtcbiAgICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKHByb3BlcnR5UGF0aCkuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocHJvcGVydHlQYXRoKSk7XG4gICAgICBsZXQgZmluYWxTdGF0ZSAgPSB7fTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIGxldCBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBsZXQgWyB2YWx1ZSwgbGFzdFBhcnQgXSA9IFV0aWxzLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBrZXksIHByb3BlcnR5UGF0aFtrZXldLCB0cnVlKTtcbiAgICAgICAgaWYgKGxhc3RQYXJ0ID09IG51bGwpXG4gICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgZmluYWxTdGF0ZVtsYXN0UGFydF0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpbmFsU3RhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBVdGlscy5mZXRjaERlZXBQcm9wZXJ0eShzdGF0ZSwgcHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHNldFN0YXRlKHZhbHVlKSB7XG4gICAgaWYgKCFpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgXCJ0aGlzLnNldFN0YXRlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnN0YXRlLCB2YWx1ZSk7XG4gIH1cblxuICBzZXRTdGF0ZVBhc3NpdmUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVQYXNzaXZlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IHRydWU7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBkZWxldGUgdGhpcy5zdGF0ZTtcbiAgICBkZWxldGUgdGhpcy5wcm9wcztcbiAgICBkZWxldGUgdGhpcy5jb250ZXh0O1xuICAgIGRlbGV0ZSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdO1xuICAgIHRoaXMuY2xlYXJBbGxEZWJvdW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcldhaXRpbmcoKSB7XG4gIH1cblxuICByZW5kZXIoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICB1cGRhdGVkKCkge1xuICB9XG5cbiAgY29tYmluZVdpdGgoc2VwLCAuLi5hcmdzKSB7XG4gICAgbGV0IGZpbmFsQXJncyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmdzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xuICAgICAgaWYgKCFhcmcpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihhcmcsICdzdHJpbmcnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLnNwbGl0KHNlcCkuZmlsdGVyKFV0aWxzLmlzTm90RW1wdHkpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgbGV0IHZhbHVlcyA9IGFyZy5maWx0ZXIoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgIGlmICghVXRpbHMuaW5zdGFuY2VPZih2YWx1ZSwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgcmV0dXJuIFV0aWxzLmlzTm90RW1wdHkodmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChVdGlscy5pbnN0YW5jZU9mKGFyZywgJ29iamVjdCcpKSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMoYXJnKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IGtleSAgID0ga2V5c1tpXTtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBhcmdba2V5XTtcblxuICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIGZpbmFsQXJncy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZpbmFsQXJncy5hZGQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKGZpbmFsQXJncykuam9pbihzZXAgfHwgJycpO1xuICB9XG5cbiAgY2xhc3NlcyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tYmluZVdpdGgoJyAnLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGV4dHJhY3RDaGlsZHJlbihfcGF0dGVybnMsIGNoaWxkcmVuLCBfb3B0aW9ucykge1xuICAgIGxldCBvcHRpb25zICAgPSBfb3B0aW9ucyB8fCB7fTtcbiAgICBsZXQgZXh0cmFjdGVkID0ge307XG4gICAgbGV0IHBhdHRlcm5zICA9IF9wYXR0ZXJucztcbiAgICBsZXQgaXNBcnJheSAgID0gQXJyYXkuaXNBcnJheShwYXR0ZXJucyk7XG5cbiAgICBjb25zdCBpc01hdGNoID0gKGppYikgPT4ge1xuICAgICAgbGV0IGppYlR5cGUgPSBqaWIuVHlwZTtcbiAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGF0dGVybnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBwYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgIGlmIChqaWJUeXBlICE9PSBwYXR0ZXJuKVxuICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICBpZiAoZXh0cmFjdGVkW3BhdHRlcm5dICYmIG9wdGlvbnMubXVsdGlwbGUpIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShleHRyYWN0ZWRbcGF0dGVybl0pKVxuICAgICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBbIGV4dHJhY3RlZFtwYXR0ZXJuXSBdO1xuXG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0ucHVzaChqaWIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBqaWI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGF0dGVybnMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgICA9IGtleXNbaV07XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICAgIGxldCByZXN1bHQ7XG5cbiAgICAgICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihwYXR0ZXJuLCBSZWdFeHApKVxuICAgICAgICAgICAgcmVzdWx0ID0gcGF0dGVybi50ZXN0KGppYlR5cGUpO1xuICAgICAgICAgIGVsc2UgaWYgKFV0aWxzLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4udG9Mb3dlckNhc2UoKSA9PT0gamliVHlwZSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4gPT09IGppYlR5cGUpO1xuXG4gICAgICAgICAgaWYgKCFyZXN1bHQpXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIGlmIChleHRyYWN0ZWRbcGF0dGVybl0gJiYgb3B0aW9ucy5tdWx0aXBsZSkge1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV4dHJhY3RlZFtwYXR0ZXJuXSkpXG4gICAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IFsgZXh0cmFjdGVkW3BhdHRlcm5dIF07XG5cbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXS5wdXNoKGppYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IGppYjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIGV4dHJhY3RlZC5yZW1haW5pbmdDaGlsZHJlbiA9IGNoaWxkcmVuLmZpbHRlcigoamliKSA9PiAhaXNNYXRjaChqaWIpKTtcbiAgICByZXR1cm4gZXh0cmFjdGVkO1xuICB9XG5cbiAgbWFwQ2hpbGRyZW4ocGF0dGVybnMsIF9jaGlsZHJlbikge1xuICAgIGxldCBjaGlsZHJlbiA9ICghQXJyYXkuaXNBcnJheShfY2hpbGRyZW4pKSA/IFsgX2NoaWxkcmVuIF0gOiBfY2hpbGRyZW47XG5cbiAgICByZXR1cm4gY2hpbGRyZW4ubWFwKChqaWIpID0+IHtcbiAgICAgIGlmICghamliKVxuICAgICAgICByZXR1cm4gamliO1xuXG4gICAgICBsZXQgamliVHlwZSA9IGppYi5UeXBlO1xuICAgICAgaWYgKCFVdGlscy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgcmV0dXJuIGppYjtcblxuICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXR0ZXJucyk7XG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKSAhPT0gamliVHlwZSlcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBsZXQgbWV0aG9kID0gcGF0dGVybnNba2V5XTtcbiAgICAgICAgaWYgKCFtZXRob2QpXG4gICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsKHRoaXMsIGppYiwgaSwgY2hpbGRyZW4pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gamliO1xuICAgIH0pO1xuICB9XG5cbiAgZGVib3VuY2UoZnVuYywgdGltZSwgX2lkKSB7XG4gICAgY29uc3QgY2xlYXJQZW5kaW5nVGltZW91dCA9ICgpID0+IHtcbiAgICAgIGlmIChwZW5kaW5nVGltZXIgJiYgcGVuZGluZ1RpbWVyLnRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lci50aW1lb3V0KTtcbiAgICAgICAgcGVuZGluZ1RpbWVyLnRpbWVvdXQgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgaWQgPSAoIV9pZCkgPyAoJycgKyBmdW5jKSA6IF9pZDtcbiAgICBpZiAoIXRoaXMuZGVib3VuY2VUaW1lcnMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZGVib3VuY2VUaW1lcnMnLCB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHt9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdO1xuICAgIGlmICghcGVuZGluZ1RpbWVyKVxuICAgICAgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSB7fTtcblxuICAgIHBlbmRpbmdUaW1lci5mdW5jID0gZnVuYztcbiAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IHBlbmRpbmdUaW1lci5wcm9taXNlO1xuICAgIGlmICghcHJvbWlzZSB8fCAhcHJvbWlzZS5pc1BlbmRpbmcoKSkge1xuICAgICAgbGV0IHN0YXR1cyA9ICdwZW5kaW5nJztcbiAgICAgIGxldCByZXNvbHZlO1xuXG4gICAgICBwcm9taXNlID0gcGVuZGluZ1RpbWVyLnByb21pc2UgPSBuZXcgUHJvbWlzZSgoX3Jlc29sdmUpID0+IHtcbiAgICAgICAgcmVzb2x2ZSA9IF9yZXNvbHZlO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UucmVzb2x2ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gJ3BlbmRpbmcnKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBzdGF0dXMgPSAnZnVsZmlsbGVkJztcbiAgICAgICAgY2xlYXJQZW5kaW5nVGltZW91dCgpO1xuICAgICAgICB0aGlzLmRlYm91bmNlVGltZXJzW2lkXSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBwZW5kaW5nVGltZXIuZnVuYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHZhciByZXQgPSBwZW5kaW5nVGltZXIuZnVuYy5jYWxsKHRoaXMpO1xuICAgICAgICAgIGlmIChyZXQgaW5zdGFuY2VvZiBQcm9taXNlIHx8IChyZXQgJiYgdHlwZW9mIHJldC50aGVuID09PSAnZnVuY3Rpb24nKSlcbiAgICAgICAgICAgIHJldC50aGVuKCh2YWx1ZSkgPT4gcmVzb2x2ZSh2YWx1ZSkpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc29sdmUocmV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICBzdGF0dXMgPSAncmVqZWN0ZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBwcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuaXNQZW5kaW5nID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gKHN0YXR1cyA9PT0gJ3BlbmRpbmcnKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICBwZW5kaW5nVGltZXIudGltZW91dCA9IHNldFRpbWVvdXQocHJvbWlzZS5yZXNvbHZlLCAodGltZSA9PSBudWxsKSA/IDI1MCA6IHRpbWUpO1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBjbGVhckRlYm91bmNlKGlkKSB7XG4gICAgdmFyIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdO1xuICAgIGlmIChwZW5kaW5nVGltZXIgPT0gbnVsbClcbiAgICAgIHJldHVybjtcblxuICAgIGlmIChwZW5kaW5nVGltZXIudGltZW91dClcbiAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZXIudGltZW91dCk7XG5cbiAgICBpZiAocGVuZGluZ1RpbWVyLnByb21pc2UpXG4gICAgICBwZW5kaW5nVGltZXIucHJvbWlzZS5jYW5jZWwoKTtcbiAgfVxuXG4gIGNsZWFyQWxsRGVib3VuY2VzKCkge1xuICAgIGxldCBkZWJvdW5jZVRpbWVycyAgPSB0aGlzLmRlYm91bmNlVGltZXJzIHx8IHt9O1xuICAgIGxldCBpZHMgICAgICAgICAgICAgPSBPYmplY3Qua2V5cyhkZWJvdW5jZVRpbWVycyk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBpZHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICAgIHRoaXMuY2xlYXJEZWJvdW5jZShpZHNbaV0pO1xuICB9XG5cbiAgZ2V0RWxlbWVudERhdGEoZWxlbWVudCkge1xuICAgIGxldCBkYXRhID0gZWxlbWVudERhdGFDYWNoZS5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICBkYXRhID0ge307XG4gICAgICBlbGVtZW50RGF0YUNhY2hlLnNldChlbGVtZW50LCBkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIG1lbW9pemUoZnVuYykge1xuICAgIGxldCBjYWNoZUlEO1xuICAgIGxldCBjYWNoZWRSZXN1bHQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgbGV0IG5ld0NhY2hlSUQgPSBkZWFkYmVlZiguLi5hcmdzKTtcbiAgICAgIGlmIChuZXdDYWNoZUlEICE9PSBjYWNoZUlEKSB7XG4gICAgICAgIGxldCByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gICAgICAgIGNhY2hlSUQgPSBuZXdDYWNoZUlEO1xuICAgICAgICBjYWNoZWRSZXN1bHQgPSByZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjYWNoZWRSZXN1bHQ7XG4gICAgfTtcbiAgfVxuXG4gIHRvVGVybSh0ZXJtKSB7XG4gICAgaWYgKGlzSmliaXNoKHRlcm0pKSB7XG4gICAgICBsZXQgamliID0gY29uc3RydWN0SmliKHRlcm0pO1xuXG4gICAgICBpZiAoamliLlR5cGUgPT09IFRlcm0pXG4gICAgICAgIHJldHVybiB0ZXJtO1xuXG4gICAgICBpZiAoamliLlR5cGUgJiYgamliLlR5cGVbVEVSTV9DT01QT05FTlRfVFlQRV9DSEVDS10pXG4gICAgICAgIHJldHVybiB0ZXJtO1xuXG4gICAgICByZXR1cm4gJChUZXJtLCBqaWIucHJvcHMpKC4uLmppYi5jaGlsZHJlbik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGVybSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiAkKFRlcm0pKHRlcm0pO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXJtO1xuICB9XG59XG5cbmNvbnN0IFRFUk1fQ09NUE9ORU5UX1RZUEVfQ0hFQ0sgPSBTeW1ib2wuZm9yKCdAamlicy9pc1Rlcm0nKTtcblxuY2xhc3MgVGVybSBleHRlbmRzIENvbXBvbmVudCB7XG4gIHJlc29sdmVUZXJtKGFyZ3MpIHtcbiAgICBsZXQgdGVybVJlc29sdmVyID0gdGhpcy5jb250ZXh0Ll90ZXJtUmVzb2x2ZXI7XG4gICAgaWYgKHR5cGVvZiB0ZXJtUmVzb2x2ZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gdGVybVJlc29sdmVyLmNhbGwodGhpcywgYXJncyk7XG5cbiAgICBsZXQgY2hpbGRyZW4gPSAoYXJncy5jaGlsZHJlbiB8fCBbXSk7XG4gICAgcmV0dXJuIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdIHx8ICcnO1xuICB9XG5cbiAgcmVuZGVyKGNoaWxkcmVuKSB7XG4gICAgbGV0IHRlcm0gPSB0aGlzLnJlc29sdmVUZXJtKHsgY2hpbGRyZW4sIHByb3BzOiB0aGlzLnByb3BzIH0pO1xuICAgIHJldHVybiAkKCdTUEFOJywgdGhpcy5wcm9wcykodGVybSk7XG4gIH1cbn1cblxuVGVybVtURVJNX0NPTVBPTkVOVF9UWVBFX0NIRUNLXSA9IHRydWU7XG5cbmV4cG9ydCB7XG4gIFRlcm0sXG59O1xuIiwiY29uc3QgRVZFTlRfTElTVEVORVJTID0gU3ltYm9sLmZvcignQGppYnMvZXZlbnRzL2xpc3RlbmVycycpO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW0VWRU5UX0xJU1RFTkVSU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBuZXcgTWFwKCksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFdmVudCBsaXN0ZW5lciBtdXN0IGJlIGEgbWV0aG9kJyk7XG5cbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcblxuICAgIGlmICghc2NvcGUpIHtcbiAgICAgIHNjb3BlID0gW107XG4gICAgICBldmVudE1hcC5zZXQoZXZlbnROYW1lLCBzY29wZSk7XG4gICAgfVxuXG4gICAgc2NvcGUucHVzaChsaXN0ZW5lcik7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXZlbnQgbGlzdGVuZXIgbXVzdCBiZSBhIG1ldGhvZCcpO1xuXG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgbGV0IGluZGV4ID0gc2NvcGUuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKGluZGV4ID49IDApXG4gICAgICBzY29wZS5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBpZiAoIWV2ZW50TWFwLmhhcyhldmVudE5hbWUpKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBldmVudE1hcC5zZXQoZXZlbnROYW1lLCBbXSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGVtaXQoZXZlbnROYW1lLCAuLi5hcmdzKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSB8fCBzY29wZS5sZW5ndGggPT09IDApXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBzY29wZS5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQgZXZlbnRDYWxsYmFjayA9IHNjb3BlW2ldO1xuICAgICAgZXZlbnRDYWxsYmFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG9uY2UoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIGxldCBmdW5jID0gKC4uLmFyZ3MpID0+IHtcbiAgICAgIHRoaXMub2ZmKGV2ZW50TmFtZSwgZnVuYyk7XG4gICAgICByZXR1cm4gbGlzdGVuZXIoLi4uYXJncyk7XG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzLm9uKGV2ZW50TmFtZSwgZnVuYyk7XG4gIH1cblxuICBvbihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZlbnROYW1lLCBsaXN0ZW5lcik7XG4gIH1cblxuICBvZmYoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIHJldHVybiB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgZXZlbnROYW1lcygpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzW0VWRU5UX0xJU1RFTkVSU10ua2V5cygpKTtcbiAgfVxuXG4gIGxpc3RlbmVyQ291bnQoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiAwO1xuXG4gICAgcmV0dXJuIHNjb3BlLmxlbmd0aDtcbiAgfVxuXG4gIGxpc3RlbmVycyhldmVudE5hbWUpIHtcbiAgICBsZXQgZXZlbnRNYXAgID0gdGhpc1tFVkVOVF9MSVNURU5FUlNdO1xuICAgIGxldCBzY29wZSAgICAgPSBldmVudE1hcC5nZXQoZXZlbnROYW1lKTtcbiAgICBpZiAoIXNjb3BlKVxuICAgICAgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIHNjb3BlLnNsaWNlKCk7XG4gIH1cbn1cbiIsImltcG9ydCBkZWFkYmVlZiBmcm9tICdkZWFkYmVlZic7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL3V0aWxzLmpzJztcblxuZXhwb3J0IGNsYXNzIEppYiB7XG4gIGNvbnN0cnVjdG9yKFR5cGUsIHByb3BzLCBjaGlsZHJlbikge1xuICAgIGxldCBkZWZhdWx0UHJvcHMgPSAoVHlwZSAmJiBUeXBlLnByb3BzKSA/IFR5cGUucHJvcHMgOiB7fTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUeXBlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFR5cGUsXG4gICAgICB9LFxuICAgICAgJ3Byb3BzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHsgW0pJQl9DSElMRF9JTkRFWF9QUk9QXTogMCwgLi4uZGVmYXVsdFByb3BzLCAuLi4ocHJvcHMgfHwge30pIH0sXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFV0aWxzLmZsYXR0ZW5BcnJheShjaGlsZHJlbiksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBKSUJfQkFSUkVOICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLmJhcnJlbicpO1xuZXhwb3J0IGNvbnN0IEpJQl9QUk9YWSAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMucHJveHknKTtcbmV4cG9ydCBjb25zdCBKSUJfUkFXX1RFWFQgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLnJhd1RleHQnKTtcbmV4cG9ydCBjb25zdCBKSUIgICAgICAgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLmppYicpO1xuZXhwb3J0IGNvbnN0IEpJQl9DSElMRF9JTkRFWF9QUk9QID0gU3ltYm9sLmZvcignQGppYnMuY2hpbGRJbmRleFByb3AnKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGZhY3RvcnkoSmliQ2xhc3MpIHtcbiAgZnVuY3Rpb24gJChfdHlwZSwgcHJvcHMgPSB7fSkge1xuICAgIGlmIChpc0ppYmlzaChfdHlwZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWNlaXZlZCBhIGppYiBidXQgZXhwZWN0ZWQgYSBjb21wb25lbnQuJyk7XG5cbiAgICBsZXQgVHlwZSA9IChfdHlwZSA9PSBudWxsKSA/IEpJQl9QUk9YWSA6IF90eXBlO1xuXG4gICAgZnVuY3Rpb24gYmFycmVuKC4uLl9jaGlsZHJlbikge1xuICAgICAgbGV0IGNoaWxkcmVuID0gX2NoaWxkcmVuO1xuXG4gICAgICBmdW5jdGlvbiBqaWIoKSB7XG4gICAgICAgIGlmIChVdGlscy5pbnN0YW5jZU9mKFR5cGUsICdwcm9taXNlJykgfHwgY2hpbGRyZW4uc29tZSgoY2hpbGQpID0+IFV0aWxzLmluc3RhbmNlT2YoY2hpbGQsICdwcm9taXNlJykpKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsgVHlwZSBdLmNvbmNhdChjaGlsZHJlbikpLnRoZW4oKGFsbCkgPT4ge1xuICAgICAgICAgICAgVHlwZSA9IGFsbFswXTtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYWxsLnNsaWNlKDEpO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEppYkNsYXNzKFxuICAgICAgICAgICAgICBUeXBlLFxuICAgICAgICAgICAgICBwcm9wcyxcbiAgICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBKaWJDbGFzcyhcbiAgICAgICAgICBUeXBlLFxuICAgICAgICAgIHByb3BzLFxuICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhqaWIsIHtcbiAgICAgICAgW0pJQl06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIFtkZWFkYmVlZi5pZFN5bV06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogICAgICAgICgpID0+IFR5cGUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGppYjtcbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhiYXJyZW4sIHtcbiAgICAgIFtKSUJfQkFSUkVOXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICB9LFxuICAgICAgW2RlYWRiZWVmLmlkU3ltXToge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgICgpID0+IFR5cGUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGJhcnJlbjtcbiAgfVxuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKCQsIHtcbiAgICAncmVtYXAnOiB7XG4gICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICB2YWx1ZTogICAgICAgIChfamliLCBjYWxsYmFjaykgPT4ge1xuICAgICAgICBsZXQgamliID0gX2ppYjtcbiAgICAgICAgaWYgKGppYiA9PSBudWxsIHx8IE9iamVjdC5pcyhqaWIsIEluZmluaXR5KSB8fCBPYmplY3QuaXMoamliLCBOYU4pKVxuICAgICAgICAgIHJldHVybiBqaWI7XG5cbiAgICAgICAgaWYgKGlzSmliaXNoKGppYikpXG4gICAgICAgICAgamliID0gY29uc3RydWN0SmliKGppYik7XG5cbiAgICAgICAgbGV0IG1hcHBlZEppYiA9IGNhbGxiYWNrKGppYik7XG4gICAgICAgIGlmIChpc0ppYmlzaChtYXBwZWRKaWIpKVxuICAgICAgICAgIG1hcHBlZEppYiA9IGNvbnN0cnVjdEppYihtYXBwZWRKaWIpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIG1hcHBlZEppYjtcblxuICAgICAgICByZXR1cm4gJChtYXBwZWRKaWIuVHlwZSwgbWFwcGVkSmliLnByb3BzKSguLi4obWFwcGVkSmliLmNoaWxkcmVuIHx8IFtdKSk7XG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiAkO1xufVxuXG5leHBvcnQgY29uc3QgJCA9IGZhY3RvcnkoSmliKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSmliaXNoKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgKHZhbHVlW0pJQl9CQVJSRU5dIHx8IHZhbHVlW0pJQl0pKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEppYilcbiAgICByZXR1cm4gdHJ1ZTtcblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdHJ1Y3RKaWIodmFsdWUpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSmliKVxuICAgIHJldHVybiB2YWx1ZTtcblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKHZhbHVlW0pJQl9CQVJSRU5dKVxuICAgICAgcmV0dXJuIHZhbHVlKCkoKTtcbiAgICBlbHNlIGlmICh2YWx1ZVtKSUJdKVxuICAgICAgcmV0dXJuIHZhbHVlKCk7XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdjb25zdHJ1Y3RKaWI6IFByb3ZpZGVkIHZhbHVlIGlzIG5vdCBhIEppYi4nKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc29sdmVDaGlsZHJlbihfY2hpbGRyZW4pIHtcbiAgbGV0IGNoaWxkcmVuID0gX2NoaWxkcmVuO1xuXG4gIGlmIChVdGlscy5pbnN0YW5jZU9mKGNoaWxkcmVuLCAncHJvbWlzZScpKVxuICAgIGNoaWxkcmVuID0gYXdhaXQgY2hpbGRyZW47XG5cbiAgaWYgKCEoKHRoaXMuaXNJdGVyYWJsZUNoaWxkIHx8IFV0aWxzLmlzSXRlcmFibGVDaGlsZCkuY2FsbCh0aGlzLCBjaGlsZHJlbikpICYmIChpc0ppYmlzaChjaGlsZHJlbikgfHwgKCh0aGlzLmlzVmFsaWRDaGlsZCB8fCBVdGlscy5pc1ZhbGlkQ2hpbGQpLmNhbGwodGhpcywgY2hpbGRyZW4pKSkpXG4gICAgY2hpbGRyZW4gPSBbIGNoaWxkcmVuIF07XG5cbiAgbGV0IHByb21pc2VzID0gVXRpbHMuaXRlcmF0ZShjaGlsZHJlbiwgYXN5bmMgKHsgdmFsdWU6IF9jaGlsZCB9KSA9PiB7XG4gICAgbGV0IGNoaWxkID0gKFV0aWxzLmluc3RhbmNlT2YoX2NoaWxkLCAncHJvbWlzZScpKSA/IGF3YWl0IF9jaGlsZCA6IF9jaGlsZDtcblxuICAgIGlmIChpc0ppYmlzaChjaGlsZCkpXG4gICAgICByZXR1cm4gYXdhaXQgY29uc3RydWN0SmliKGNoaWxkKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gY2hpbGQ7XG4gIH0pO1xuXG4gIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG59XG4iLCJleHBvcnQge1xuICBDT05URVhUX0lELFxuICBSb290Tm9kZSxcbn0gZnJvbSAnLi9yb290LW5vZGUuanMnO1xuXG5leHBvcnQgY29uc3QgRk9SQ0VfUkVGTE9XID0gU3ltYm9sLmZvcignQGppYnNGb3JjZVJlZmxvdycpO1xuXG5leHBvcnQgeyBSZW5kZXJlciB9IGZyb20gJy4vcmVuZGVyZXIuanMnO1xuIiwiaW1wb3J0IHtcbiAgQ09OVEVYVF9JRCxcbiAgUm9vdE5vZGUsXG59IGZyb20gJy4vcm9vdC1ub2RlLmpzJztcblxuY29uc3QgSU5JVElBTF9DT05URVhUX0lEID0gMW47XG5sZXQgX2NvbnRleHRJRENvdW50ZXIgPSBJTklUSUFMX0NPTlRFWFRfSUQ7XG5cbmV4cG9ydCBjbGFzcyBSZW5kZXJlciBleHRlbmRzIFJvb3ROb2RlIHtcbiAgc3RhdGljIFJvb3ROb2RlID0gUm9vdE5vZGU7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKG51bGwsIG51bGwsIG51bGwpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ29wdGlvbnMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgb3B0aW9ucyB8fCB7fSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlbmRlcmVyID0gdGhpcztcblxuICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50ZXJtUmVzb2x2ZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICB0aGlzLmNvbnRleHQuX3Rlcm1SZXNvbHZlciA9IG9wdGlvbnMudGVybVJlc29sdmVyO1xuICB9XG5cbiAgZ2V0T3B0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zO1xuICB9XG5cbiAgcmVzb2x2ZVRlcm0oYXJncykge1xuICAgIGxldCB7IHRlcm1SZXNvbHZlciB9ID0gdGhpcy5nZXRPcHRpb25zKCk7XG4gICAgaWYgKHR5cGVvZiB0ZXJtUmVzb2x2ZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gdGVybVJlc29sdmVyLmNhbGwodGhpcywgYXJncyk7XG5cbiAgICBsZXQgY2hpbGRyZW4gPSAoYXJncy5jaGlsZHJlbiB8fCBbXSk7XG4gICAgcmV0dXJuIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdIHx8ICcnO1xuICB9XG5cbiAgY3JlYXRlQ29udGV4dChyb290Q29udGV4dCwgb25VcGRhdGUsIG9uVXBkYXRlVGhpcykge1xuICAgIGxldCBjb250ZXh0ICAgICA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IG15Q29udGV4dElEID0gKHJvb3RDb250ZXh0KSA/IHJvb3RDb250ZXh0W0NPTlRFWFRfSURdIDogSU5JVElBTF9DT05URVhUX0lEO1xuXG4gICAgcmV0dXJuIG5ldyBQcm94eShjb250ZXh0LCB7XG4gICAgICBnZXQ6ICh0YXJnZXQsIHByb3BOYW1lKSA9PiB7XG4gICAgICAgIGlmIChwcm9wTmFtZSA9PT0gQ09OVEVYVF9JRCkge1xuICAgICAgICAgIGxldCBwYXJlbnRJRCA9IChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtDT05URVhUX0lEXSA6IElOSVRJQUxfQ09OVEVYVF9JRDtcbiAgICAgICAgICByZXR1cm4gKHBhcmVudElEID4gbXlDb250ZXh0SUQpID8gcGFyZW50SUQgOiBteUNvbnRleHRJRDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRhcmdldCwgcHJvcE5hbWUpKVxuICAgICAgICAgIHJldHVybiAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbcHJvcE5hbWVdIDogdW5kZWZpbmVkO1xuXG4gICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgfSxcbiAgICAgIHNldDogKHRhcmdldCwgcHJvcE5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmIChwcm9wTmFtZSA9PT0gQ09OVEVYVF9JRClcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBpZiAodGFyZ2V0W3Byb3BOYW1lXSA9PT0gdmFsdWUpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgbXlDb250ZXh0SUQgPSArK19jb250ZXh0SURDb3VudGVyO1xuICAgICAgICB0YXJnZXRbcHJvcE5hbWVdID0gdmFsdWU7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvblVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBvblVwZGF0ZS5jYWxsKG9uVXBkYXRlVGhpcywgb25VcGRhdGVUaGlzKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBkZWFkYmVlZiBmcm9tICdkZWFkYmVlZic7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi91dGlscy5qcyc7XG5pbXBvcnQge1xuICBpc0ppYmlzaCxcbiAgcmVzb2x2ZUNoaWxkcmVuLFxuICBjb25zdHJ1Y3RKaWIsXG59IGZyb20gJy4uL2ppYi5qcyc7XG5cbmV4cG9ydCBjb25zdCBDT05URVhUX0lEID0gU3ltYm9sLmZvcignQGppYnMvbm9kZS9jb250ZXh0SUQnKTtcblxuZXhwb3J0IGNsYXNzIFJvb3ROb2RlIHtcbiAgc3RhdGljIENPTlRFWFRfSUQgPSBDT05URVhUX0lEO1xuXG4gIGNvbnN0cnVjdG9yKHJlbmRlcmVyLCBwYXJlbnROb2RlLCBfY29udGV4dCwgamliKSB7XG4gICAgbGV0IGNvbnRleHQgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuSEFTX0NPTlRFWFQgIT09IGZhbHNlICYmIChyZW5kZXJlciB8fCB0aGlzLmNyZWF0ZUNvbnRleHQpKSB7XG4gICAgICBjb250ZXh0ID0gKHJlbmRlcmVyIHx8IHRoaXMpLmNyZWF0ZUNvbnRleHQoXG4gICAgICAgIF9jb250ZXh0LFxuICAgICAgICAodGhpcy5vbkNvbnRleHRVcGRhdGUpID8gdGhpcy5vbkNvbnRleHRVcGRhdGUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRoaXMsXG4gICAgICApO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUWVBFJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBnZXQ6ICAgICAgICAgICgpID0+IHRoaXMuY29uc3RydWN0b3IuVFlQRSxcbiAgICAgICAgc2V0OiAgICAgICAgICAoKSA9PiB7fSwgLy8gTk9PUFxuICAgICAgfSxcbiAgICAgICdpZCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBVdGlscy5nZW5lcmF0ZVVVSUQoKSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyZXInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHJlbmRlcmVyLFxuICAgICAgfSxcbiAgICAgICdwYXJlbnROb2RlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBwYXJlbnROb2RlLFxuICAgICAgfSxcbiAgICAgICdjaGlsZE5vZGVzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBuZXcgTWFwKCksXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogICAgICAgICAgKCkgPT4ge30sXG4gICAgICB9LFxuICAgICAgJ2Rlc3Ryb3lpbmcnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGZhbHNlLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJQcm9taXNlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJGcmFtZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgMCxcbiAgICAgIH0sXG4gICAgICAnamliJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIsXG4gICAgICB9LFxuICAgICAgJ25hdGl2ZUVsZW1lbnQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIHJlc29sdmVDaGlsZHJlbi5jYWxsKHRoaXMsIGNoaWxkcmVuKTtcbiAgfVxuXG4gIGlzSmliKHZhbHVlKSB7XG4gICAgcmV0dXJuIGlzSmliaXNoKHZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICAgIHJldHVybiBjb25zdHJ1Y3RKaWIodmFsdWUpO1xuICB9XG5cbiAgZ2V0Q2FjaGVLZXkoKSB7XG4gICAgbGV0IHsgVHlwZSwgcHJvcHMgfSA9ICh0aGlzLmppYiB8fCB7fSk7XG4gICAgbGV0IGNhY2hlS2V5ID0gZGVhZGJlZWYoVHlwZSwgcHJvcHMua2V5KTtcblxuICAgIHJldHVybiBjYWNoZUtleTtcbiAgfVxuXG4gIHVwZGF0ZUppYihuZXdKaWIpIHtcbiAgICB0aGlzLmppYiA9IG5ld0ppYjtcbiAgfVxuXG4gIHJlbW92ZUNoaWxkKGNoaWxkTm9kZSkge1xuICAgIGxldCBjYWNoZUtleSA9IGNoaWxkTm9kZS5nZXRDYWNoZUtleSgpO1xuICAgIHRoaXMuY2hpbGROb2Rlcy5kZWxldGUoY2FjaGVLZXkpO1xuICB9XG5cbiAgYWRkQ2hpbGQoY2hpbGROb2RlKSB7XG4gICAgbGV0IGNhY2hlS2V5ID0gY2hpbGROb2RlLmdldENhY2hlS2V5KCk7XG4gICAgdGhpcy5jaGlsZE5vZGVzLnNldChjYWNoZUtleSwgY2hpbGROb2RlKTtcbiAgfVxuXG4gIGdldENoaWxkKGNhY2hlS2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuY2hpbGROb2Rlcy5nZXQoY2FjaGVLZXkpO1xuICB9XG5cbiAgZ2V0VGhpc05vZGVPckNoaWxkTm9kZXMoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRDaGlsZHJlbk5vZGVzKCkge1xuICAgIGxldCBjaGlsZE5vZGVzID0gW107XG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHRoaXMuY2hpbGROb2Rlcy52YWx1ZXMoKSlcbiAgICAgIGNoaWxkTm9kZXMgPSBjaGlsZE5vZGVzLmNvbmNhdChjaGlsZE5vZGUuZ2V0VGhpc05vZGVPckNoaWxkTm9kZXMoKSk7XG5cbiAgICByZXR1cm4gY2hpbGROb2Rlcy5maWx0ZXIoQm9vbGVhbik7XG4gIH1cblxuICBhc3luYyBkZXN0cm95KGZvcmNlKSB7XG4gICAgaWYgKCFmb3JjZSAmJiB0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMucmVuZGVyUHJvbWlzZSlcbiAgICAgIGF3YWl0IHRoaXMucmVuZGVyUHJvbWlzZTtcblxuICAgIGF3YWl0IHRoaXMuZGVzdHJveUZyb21ET00odGhpcy5jb250ZXh0LCB0aGlzKTtcblxuICAgIGxldCBkZXN0cm95UHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBjaGlsZE5vZGUgb2YgdGhpcy5jaGlsZE5vZGVzLnZhbHVlcygpKVxuICAgICAgZGVzdHJveVByb21pc2VzLnB1c2goY2hpbGROb2RlLmRlc3Ryb3koKSk7XG5cbiAgICB0aGlzLmNoaWxkTm9kZXMuY2xlYXIoKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChkZXN0cm95UHJvbWlzZXMpO1xuXG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbnVsbDtcbiAgICB0aGlzLnBhcmVudE5vZGUgPSBudWxsO1xuICAgIHRoaXMuY29udGV4dCA9IG51bGw7XG4gICAgdGhpcy5qaWIgPSBudWxsO1xuICB9XG5cbiAgaXNWYWxpZENoaWxkKGNoaWxkKSB7XG4gICAgcmV0dXJuIFV0aWxzLmlzVmFsaWRDaGlsZChjaGlsZCk7XG4gIH1cblxuICBpc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpIHtcbiAgICByZXR1cm4gVXRpbHMuaXNJdGVyYWJsZUNoaWxkKGNoaWxkKTtcbiAgfVxuXG4gIHByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpIHtcbiAgICByZXR1cm4gVXRpbHMucHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cyk7XG4gIH1cblxuICBjaGlsZHJlbkRpZmZlcihvbGRDaGlsZHJlbiwgbmV3Q2hpbGRyZW4pIHtcbiAgICByZXR1cm4gVXRpbHMuY2hpbGRyZW5EaWZmZXIob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKTtcbiAgfVxuXG4gIGFzeW5jIHJlbmRlciguLi5hcmdzKSB7XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZylcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICBsZXQgcmVuZGVyRnJhbWUgPSB0aGlzLnJlbmRlckZyYW1lO1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLl9yZW5kZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IHRoaXMuX3JlbmRlciguLi5hcmdzKVxuICAgICAgICAudGhlbihhc3luYyAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgaWYgKHJlbmRlckZyYW1lID49IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcblxuICAgICAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIHRoaXMucmVuZGVyUHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCB0aGlzLnN5bmNET00odGhpcy5jb250ZXh0LCB0aGlzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yZW5kZXJQcm9taXNlO1xuICB9XG5cbiAgZ2V0UGFyZW50SUQoKSB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gdGhpcy5wYXJlbnROb2RlLmlkO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveUZyb21ET00oY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLmRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpO1xuICB9XG5cbiAgYXN5bmMgc3luY0RPTShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCF0aGlzLnJlbmRlcmVyKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucmVuZGVyZXIuc3luY0RPTShjb250ZXh0LCBub2RlKTtcbiAgfVxufVxuIiwiLyogZXNsaW50LWRpc2FibGUgbm8tbWFnaWMtbnVtYmVycyAqL1xuaW1wb3J0IGRlYWRiZWVmIGZyb20gJ2RlYWRiZWVmJztcblxuY29uc3QgU1RPUCA9IFN5bWJvbC5mb3IoJ0BqaWJzSXRlcmF0ZVN0b3AnKTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5lc3RlZC10ZXJuYXJ5XG5jb25zdCBnbG9iYWxTY29wZSA9ICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykgPyBnbG9iYWwgOiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdGhpcztcblxubGV0IHV1aWQgPSAxMDAwMDAwO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFuY2VPZihvYmopIHtcbiAgZnVuY3Rpb24gdGVzdFR5cGUob2JqLCBfdmFsKSB7XG4gICAgZnVuY3Rpb24gaXNEZWZlcnJlZFR5cGUob2JqKSB7XG4gICAgICBpZiAob2JqIGluc3RhbmNlb2YgUHJvbWlzZSB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnUHJvbWlzZScpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gUXVhY2sgcXVhY2suLi5cbiAgICAgIGlmICh0eXBlb2Ygb2JqLnRoZW4gPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5jYXRjaCA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgdmFsICAgICA9IF92YWw7XG4gICAgbGV0IHR5cGVPZiAgPSAodHlwZW9mIG9iaik7XG5cbiAgICBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TdHJpbmcpXG4gICAgICB2YWwgPSAnc3RyaW5nJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk51bWJlcilcbiAgICAgIHZhbCA9ICdudW1iZXInO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQm9vbGVhbilcbiAgICAgIHZhbCA9ICdib29sZWFuJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkZ1bmN0aW9uKVxuICAgICAgdmFsID0gJ2Z1bmN0aW9uJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkFycmF5KVxuICAgICAgdmFsID0gJ2FycmF5JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLk9iamVjdClcbiAgICAgIHZhbCA9ICdvYmplY3QnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuUHJvbWlzZSlcbiAgICAgIHZhbCA9ICdwcm9taXNlJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJpZ0ludClcbiAgICAgIHZhbCA9ICdiaWdpbnQnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuTWFwKVxuICAgICAgdmFsID0gJ21hcCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5XZWFrTWFwKVxuICAgICAgdmFsID0gJ3dlYWttYXAnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuU2V0KVxuICAgICAgdmFsID0gJ3NldCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TeW1ib2wpXG4gICAgICB2YWwgPSAnc3ltYm9sJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLkJ1ZmZlcilcbiAgICAgIHZhbCA9ICdidWZmZXInO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2J1ZmZlcicgJiYgZ2xvYmFsU2NvcGUuQnVmZmVyICYmIGdsb2JhbFNjb3BlLkJ1ZmZlci5pc0J1ZmZlcihvYmopKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnbnVtYmVyJyAmJiAodHlwZU9mID09PSAnbnVtYmVyJyB8fCBvYmogaW5zdGFuY2VvZiBOdW1iZXIgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ051bWJlcicpKSkge1xuICAgICAgaWYgKCFpc0Zpbml0ZShvYmopKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh2YWwgIT09ICdvYmplY3QnICYmIHZhbCA9PT0gdHlwZU9mKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnb2JqZWN0Jykge1xuICAgICAgaWYgKChvYmouY29uc3RydWN0b3IgPT09IE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIC8vIE51bGwgcHJvdG90eXBlIG9uIG9iamVjdFxuICAgICAgaWYgKHR5cGVPZiA9PT0gJ29iamVjdCcgJiYgIW9iai5jb25zdHJ1Y3RvcilcbiAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodmFsID09PSAnYXJyYXknICYmIChBcnJheS5pc0FycmF5KG9iaikgfHwgb2JqIGluc3RhbmNlb2YgQXJyYXkgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0FycmF5JykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAoKHZhbCA9PT0gJ3Byb21pc2UnIHx8IHZhbCA9PT0gJ2RlZmVycmVkJykgJiYgaXNEZWZlcnJlZFR5cGUob2JqKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3N0cmluZycgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLlN0cmluZyB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU3RyaW5nJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnYm9vbGVhbicgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLkJvb2xlYW4gfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ0Jvb2xlYW4nKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdtYXAnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5NYXAgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ01hcCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ3dlYWttYXAnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5XZWFrTWFwIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdXZWFrTWFwJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnc2V0JyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuU2V0IHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTZXQnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdmdW5jdGlvbicgJiYgdHlwZU9mID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodHlwZW9mIHZhbCA9PT0gJ2Z1bmN0aW9uJyAmJiBvYmogaW5zdGFuY2VvZiB2YWwpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJyAmJiBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHZhbClcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKG9iaiA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gMSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKHRlc3RUeXBlKG9iaiwgYXJndW1lbnRzW2ldKSA9PT0gdHJ1ZSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvcHNEaWZmZXIob2xkUHJvcHMsIG5ld1Byb3BzLCBza2lwS2V5cykge1xuICBpZiAob2xkUHJvcHMgPT09IG5ld1Byb3BzKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodHlwZW9mIG9sZFByb3BzICE9PSB0eXBlb2YgbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKCFvbGRQcm9wcyAmJiBuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAob2xkUHJvcHMgJiYgIW5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBlcWVxZXFcbiAgaWYgKCFvbGRQcm9wcyAmJiAhbmV3UHJvcHMgJiYgb2xkUHJvcHMgIT0gb2xkUHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgbGV0IGFLZXlzID0gT2JqZWN0LmtleXMob2xkUHJvcHMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9sZFByb3BzKSk7XG4gIGxldCBiS2V5cyA9IE9iamVjdC5rZXlzKG5ld1Byb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhuZXdQcm9wcykpO1xuXG4gIGlmIChhS2V5cy5sZW5ndGggIT09IGJLZXlzLmxlbmd0aClcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhS2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGFLZXkgPSBhS2V5c1tpXTtcbiAgICBpZiAoc2tpcEtleXMgJiYgc2tpcEtleXMuaW5kZXhPZihhS2V5KSA+PSAwKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAob2xkUHJvcHNbYUtleV0gIT09IG5ld1Byb3BzW2FLZXldKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBsZXQgYktleSA9IGJLZXlzW2ldO1xuICAgIGlmIChza2lwS2V5cyAmJiBza2lwS2V5cy5pbmRleE9mKGJLZXkpKVxuICAgICAgY29udGludWU7XG5cbiAgICBpZiAoYUtleSA9PT0gYktleSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKG9sZFByb3BzW2JLZXldICE9PSBuZXdQcm9wc1tiS2V5XSlcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2l6ZU9mKHZhbHVlKSB7XG4gIGlmICghdmFsdWUpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKE9iamVjdC5pcyhJbmZpbml0eSkpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInKVxuICAgIHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIF9pdGVyYXRlKG9iaiwgY2FsbGJhY2spIHtcbiAgaWYgKCFvYmogfHwgT2JqZWN0LmlzKEluZmluaXR5KSlcbiAgICByZXR1cm4gW107XG5cbiAgbGV0IHJlc3VsdHMgICA9IFtdO1xuICBsZXQgc2NvcGUgICAgID0geyBjb2xsZWN0aW9uOiBvYmosIFNUT1AgfTtcbiAgbGV0IHJlc3VsdDtcblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgc2NvcGUudHlwZSA9ICdBcnJheSc7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBvYmoubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgc2NvcGUudmFsdWUgPSBvYmpbaV07XG4gICAgICBzY29wZS5pbmRleCA9IHNjb3BlLmtleSA9IGk7XG5cbiAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmVudHJpZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgU2V0IHx8IG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2V0Jykge1xuICAgICAgc2NvcGUudHlwZSA9ICdTZXQnO1xuXG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBvYmoudmFsdWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSBpdGVtO1xuICAgICAgICBzY29wZS5rZXkgPSBpdGVtO1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3BlLnR5cGUgPSBvYmouY29uc3RydWN0b3IubmFtZTtcblxuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IFsga2V5LCB2YWx1ZSBdIG9mIG9iai5lbnRyaWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgc2NvcGUua2V5ID0ga2V5O1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChpbnN0YW5jZU9mKG9iaiwgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ2JpZ2ludCcsICdmdW5jdGlvbicpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgc2NvcGUudHlwZSA9IChvYmouY29uc3RydWN0b3IpID8gb2JqLmNvbnN0cnVjdG9yLm5hbWUgOiAnT2JqZWN0JztcblxuICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBrZXkgICA9IGtleXNbaV07XG4gICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgIHNjb3BlLmtleSA9IGtleTtcbiAgICAgIHNjb3BlLmluZGV4ID0gaTtcblxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICBicmVhaztcblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKF9pdGVyYXRlLCB7XG4gICdTVE9QJzoge1xuICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHZhbHVlOiAgICAgICAgU1RPUCxcbiAgfSxcbn0pO1xuXG5leHBvcnQgY29uc3QgaXRlcmF0ZSA9IF9pdGVyYXRlO1xuXG5leHBvcnQgZnVuY3Rpb24gY2hpbGRyZW5EaWZmZXIoY2hpbGRyZW4xLCBjaGlsZHJlbjIpIHtcbiAgaWYgKGNoaWxkcmVuMSA9PT0gY2hpbGRyZW4yKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBsZXQgcmVzdWx0MSA9ICghQXJyYXkuaXNBcnJheShjaGlsZHJlbjEpKSA/IGRlYWRiZWVmKGNoaWxkcmVuMSkgOiBkZWFkYmVlZiguLi5jaGlsZHJlbjEpO1xuICBsZXQgcmVzdWx0MiA9ICghQXJyYXkuaXNBcnJheShjaGlsZHJlbjIpKSA/IGRlYWRiZWVmKGNoaWxkcmVuMikgOiBkZWFkYmVlZiguLi5jaGlsZHJlbjIpO1xuXG4gIHJldHVybiAocmVzdWx0MSAhPT0gcmVzdWx0Mik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmZXRjaERlZXBQcm9wZXJ0eShvYmosIF9rZXksIGRlZmF1bHRWYWx1ZSwgbGFzdFBhcnQpIHtcbiAgaWYgKG9iaiA9PSBudWxsIHx8IE9iamVjdC5pcyhOYU4sIG9iaikgfHwgT2JqZWN0LmlzKEluZmluaXR5LCBvYmopKVxuICAgIHJldHVybiAobGFzdFBhcnQpID8gWyBkZWZhdWx0VmFsdWUsIG51bGwgXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBpZiAoX2tleSA9PSBudWxsIHx8IE9iamVjdC5pcyhOYU4sIF9rZXkpIHx8IE9iamVjdC5pcyhJbmZpbml0eSwgX2tleSkpXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgbnVsbCBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGxldCBwYXJ0cztcblxuICBpZiAoQXJyYXkuaXNBcnJheShfa2V5KSkge1xuICAgIHBhcnRzID0gX2tleTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgX2tleSA9PT0gJ3N5bWJvbCcpIHtcbiAgICBwYXJ0cyA9IFsgX2tleSBdO1xuICB9IGVsc2Uge1xuICAgIGxldCBrZXkgICAgICAgICA9ICgnJyArIF9rZXkpO1xuICAgIGxldCBsYXN0SW5kZXggICA9IDA7XG4gICAgbGV0IGxhc3RDdXJzb3IgID0gMDtcblxuICAgIHBhcnRzID0gW107XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc3RhbnQtY29uZGl0aW9uXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGxldCBpbmRleCA9IGtleS5pbmRleE9mKCcuJywgbGFzdEluZGV4KTtcbiAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgcGFydHMucHVzaChrZXkuc3Vic3RyaW5nKGxhc3RDdXJzb3IpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXkuY2hhckF0KGluZGV4IC0gMSkgPT09ICdcXFxcJykge1xuICAgICAgICBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBwYXJ0cy5wdXNoKGtleS5zdWJzdHJpbmcobGFzdEN1cnNvciwgaW5kZXgpKTtcbiAgICAgIGxhc3RDdXJzb3IgPSBsYXN0SW5kZXggPSBpbmRleCArIDE7XG4gICAgfVxuICB9XG5cbiAgbGV0IHBhcnROID0gcGFydHNbcGFydHMubGVuZ3RoIC0gMV07XG4gIGlmIChwYXJ0cy5sZW5ndGggPT09IDApXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgcGFydE4gXSA6IGRlZmF1bHRWYWx1ZTtcblxuICBsZXQgY3VycmVudFZhbHVlID0gb2JqO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBwYXJ0cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGtleSA9IHBhcnRzW2ldO1xuXG4gICAgY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlW2tleV07XG4gICAgaWYgKGN1cnJlbnRWYWx1ZSA9PSBudWxsKVxuICAgICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgcGFydE4gXSA6IGRlZmF1bHRWYWx1ZTtcbiAgfVxuXG4gIHJldHVybiAobGFzdFBhcnQpID8gWyBjdXJyZW50VmFsdWUsIHBhcnROIF0gOiBjdXJyZW50VmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiaW5kTWV0aG9kcyhfcHJvdG8sIHNraXBQcm90b3MpIHtcbiAgbGV0IHByb3RvICAgICAgICAgICA9IF9wcm90bztcbiAgbGV0IGFscmVhZHlWaXNpdGVkICA9IG5ldyBTZXQoKTtcblxuICB3aGlsZSAocHJvdG8pIHtcbiAgICBsZXQgZGVzY3JpcHRvcnMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhwcm90byk7XG4gICAgbGV0IGtleXMgICAgICAgID0gT2JqZWN0LmtleXMoZGVzY3JpcHRvcnMpLmNvbmNhdChPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGRlc2NyaXB0b3JzKSk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBrZXkgPSBrZXlzW2ldO1xuICAgICAgaWYgKGtleSA9PT0gJ2NvbnN0cnVjdG9yJylcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmIChhbHJlYWR5VmlzaXRlZC5oYXMoa2V5KSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGFscmVhZHlWaXNpdGVkLmFkZChrZXkpO1xuXG4gICAgICBsZXQgdmFsdWUgPSBwcm90b1trZXldO1xuXG4gICAgICAvLyBTa2lwIHByb3RvdHlwZSBvZiBPYmplY3RcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b3R5cGUtYnVpbHRpbnNcbiAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KGtleSkgJiYgT2JqZWN0LnByb3RvdHlwZVtrZXldID09PSB2YWx1ZSlcbiAgICAgICAgY29udGludWU7XG5cbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICB0aGlzW2tleV0gPSB2YWx1ZS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvKTtcbiAgICBpZiAocHJvdG8gPT09IE9iamVjdC5wcm90b3R5cGUpXG4gICAgICBicmVhaztcblxuICAgIGlmIChza2lwUHJvdG9zICYmIHNraXBQcm90b3MuaW5kZXhPZihwcm90bykgPj0gMClcbiAgICAgIGJyZWFrO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgTmFOKSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoaW5zdGFuY2VPZih2YWx1ZSwgJ3N0cmluZycpKVxuICAgIHJldHVybiAhKC9cXFMvKS50ZXN0KHZhbHVlKTtcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZih2YWx1ZSwgJ251bWJlcicpICYmIGlzRmluaXRlKHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGVsc2UgaWYgKCFpbnN0YW5jZU9mKHZhbHVlLCAnYm9vbGVhbicsICdiaWdpbnQnLCAnZnVuY3Rpb24nKSAmJiBzaXplT2YodmFsdWUpID09PSAwKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTm90RW1wdHkodmFsdWUpIHtcbiAgcmV0dXJuICFpc0VtcHR5LmNhbGwodGhpcywgdmFsdWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbkFycmF5KHZhbHVlKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkpXG4gICAgcmV0dXJuIHZhbHVlO1xuXG4gIGxldCBuZXdBcnJheSA9IFtdO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgbGV0IGl0ZW0gPSB2YWx1ZVtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSlcbiAgICAgIG5ld0FycmF5ID0gbmV3QXJyYXkuY29uY2F0KGZsYXR0ZW5BcnJheShpdGVtKSk7XG4gICAgZWxzZVxuICAgICAgbmV3QXJyYXkucHVzaChpdGVtKTtcbiAgfVxuXG4gIHJldHVybiBuZXdBcnJheTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICBpZiAoY2hpbGQgPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBjaGlsZCA9PT0gJ2Jvb2xlYW4nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKGNoaWxkLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXMoY2hpbGQsIE5hTikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gIGlmIChjaGlsZCA9PSBudWxsIHx8IE9iamVjdC5pcyhjaGlsZCwgTmFOKSB8fCBPYmplY3QuaXMoY2hpbGQsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIChBcnJheS5pc0FycmF5KGNoaWxkKSB8fCB0eXBlb2YgY2hpbGQgPT09ICdvYmplY3QnICYmICFpbnN0YW5jZU9mKGNoaWxkLCAnYm9vbGVhbicsICdudW1iZXInLCAnc3RyaW5nJykpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm93KCkge1xuICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGVyZm9ybWFuY2Uubm93ID09PSAnZnVuY3Rpb24nKVxuICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcbiAgZWxzZVxuICAgIHJldHVybiBEYXRlLm5vdygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xuICBpZiAodXVpZCA+IDk5OTk5OTkpXG4gICAgdXVpZCA9IDEwMDAwMDA7XG5cbiAgcmV0dXJuIGAke0RhdGUubm93KCl9LiR7dXVpZCsrfSR7TWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApLnRvU3RyaW5nKCkucGFkU3RhcnQoMjAsICcwJyl9YDtcbn1cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQge1xuICBKSUJfQkFSUkVOLFxuICBKSUJfUFJPWFksXG4gIEpJQl9SQVdfVEVYVCxcbiAgSklCLFxuICBKSUJfQ0hJTERfSU5ERVhfUFJPUCxcbiAgSmliLFxuICBmYWN0b3J5LFxuICAkLFxuICBpc0ppYmlzaCxcbiAgY29uc3RydWN0SmliLFxuICByZXNvbHZlQ2hpbGRyZW4sXG59IGZyb20gJy4vamliLmpzJztcblxuZXhwb3J0IGNvbnN0IEppYnMgPSB7XG4gIEpJQl9CQVJSRU4sXG4gIEpJQl9QUk9YWSxcbiAgSklCX1JBV19URVhULFxuICBKSUIsXG4gIEpJQl9DSElMRF9JTkRFWF9QUk9QLFxuICBKaWIsXG4gIGlzSmliaXNoLFxuICBjb25zdHJ1Y3RKaWIsXG4gIHJlc29sdmVDaGlsZHJlbixcbn07XG5cbmltcG9ydCB7XG4gIFVQREFURV9FVkVOVCxcbiAgUVVFVUVfVVBEQVRFX01FVEhPRCxcbiAgRkxVU0hfVVBEQVRFX01FVEhPRCxcbiAgSU5JVF9NRVRIT0QsXG4gIFNLSVBfU1RBVEVfVVBEQVRFUyxcbiAgUEVORElOR19TVEFURV9VUERBVEUsXG4gIExBU1RfUkVOREVSX1RJTUUsXG4gIFBSRVZJT1VTX1NUQVRFLFxuXG4gIENvbXBvbmVudCxcbiAgVGVybSxcbn0gZnJvbSAnLi9jb21wb25lbnQuanMnO1xuXG5leHBvcnQgY29uc3QgQ29tcG9uZW50cyA9IHtcbiAgVVBEQVRFX0VWRU5ULFxuICBRVUVVRV9VUERBVEVfTUVUSE9ELFxuICBGTFVTSF9VUERBVEVfTUVUSE9ELFxuICBJTklUX01FVEhPRCxcbiAgU0tJUF9TVEFURV9VUERBVEVTLFxuICBQRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRSxcbiAgUFJFVklPVVNfU1RBVEUsXG59O1xuXG5pbXBvcnQge1xuICBGT1JDRV9SRUZMT1csXG4gIFJvb3ROb2RlLFxuICBSZW5kZXJlcixcbn0gZnJvbSAnLi9yZW5kZXJlcnMvaW5kZXguanMnO1xuXG5leHBvcnQgY29uc3QgUmVuZGVyZXJzID0ge1xuICBDT05URVhUX0lEOiBSb290Tm9kZS5DT05URVhUX0lELFxuICBGT1JDRV9SRUZMT1csXG4gIFJvb3ROb2RlLFxuICBSZW5kZXJlcixcbn07XG5cbmV4cG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vdXRpbHMuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBkZWFkYmVlZiB9IGZyb20gJ2RlYWRiZWVmJztcblxuZXhwb3J0IHtcbiAgZmFjdG9yeSxcbiAgJCxcbiAgQ29tcG9uZW50LFxuICBUZXJtLFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==

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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQOztBQUVBLHdFQUF3RTtBQUN4RTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLG9FQUFvRSxNQUFNOztBQUUxRTtBQUNBLFNBQVM7QUFDVCxPQUFPO0FBQ1AsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsT0FBTztBQUNQOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHdDQUF3QyxRQUFRO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxpRUFBaUUsTUFBTTs7QUFFdkU7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esd0VBQXdFLE1BQU07O0FBRTlFO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHNDQUFzQyxRQUFRO0FBQzlDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsNENBQTRDLFFBQVE7QUFDcEQ7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0EsU0FBUzs7QUFFVCw0Q0FBNEMsUUFBUTtBQUNwRDtBQUNBO0FBQ0E7QUFDQSxRQUFRO0FBQ1I7QUFDQSwwQ0FBMEMsUUFBUTtBQUNsRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4Q0FBOEMsUUFBUTtBQUN0RDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxZQUFZO0FBQ1o7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0EsMENBQTBDLFFBQVE7QUFDbEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFlBQVk7QUFDWjtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSx3Q0FBd0MsUUFBUTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCO0FBQ3hCLE9BQU87QUFDUDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLE1BQU07QUFDTjtBQUNBOztBQUVBO0FBQ0E7QUFD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Q0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULDhCQUE4QjtBQUM5QixPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFVBQVUsY0FBYyxpQkFBaUI7QUFDekM7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsTUFBTTtBQUNOO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGdDQUFtQjs7QUFFckYsZ0NBQW1CO0FBQ25CLHFCQUFxQixnQ0FBbUI7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QixpRUFBaUUsZ0NBQW1CO0FBQ3BGOzs7QUFHQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEsMENBQTBDLFNBQVM7QUFDbkQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEscUNBQXFDLFFBQVE7QUFDN0M7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG9CQUFvQjtBQUNwQjs7QUFFQTtBQUNBOztBQUVBLHFDQUFxQyxRQUFRO0FBQzdDO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBOztBQUVBOztBQUVBO0FBQ0Esc0NBQXNDLFFBQVE7QUFDOUM7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDOztBQUVEOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EscUNBQXFDLFFBQVE7QUFDN0M7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLHNDQUFzQyxRQUFRO0FBQzlDO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EscUNBQXFDLFFBQVE7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxZQUFZLFdBQVcsR0FBRyxPQUFPLEVBQUUsa0VBQWtFO0FBQ3JHOzs7QUFHQSxPQUFPOztBQUVQLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLGdDQUFtQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFGQUFxRixnQ0FBbUI7QUFDeEc7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSxnQ0FBbUI7QUFDN0I7QUFDQSxlQUFlLGdDQUFtQix3QkFBd0IsZ0NBQW1CO0FBQzdFLG1EQUFtRCx3Q0FBd0M7QUFDM0Y7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLFVBQVUsZ0NBQW1CO0FBQzdCO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0EsV0FBVztBQUNYLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxVQUFVLGdDQUFtQjtBQUM3QixVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVLGdDQUFtQjtBQUM3QjtBQUNBLGlFQUFpRSxpQkFBaUI7QUFDbEY7QUFDQSwwREFBMEQsYUFBYTtBQUN2RTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0NBQW1CO0FBQ25CLHFCQUFxQixnQ0FBbUI7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCLGdFQUFnRSxnQ0FBbUI7QUFDbkYsc0VBQXNFLGdDQUFtQjtBQUN6Riw0RUFBNEUsZ0NBQW1CO0FBQy9GLGtFQUFrRSxnQ0FBbUI7QUFDckYsaUVBQWlFLGdDQUFtQjs7O0FBR3BGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQU9BLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQzZWOztBQUU3ViwyQ0FBMkMsY0FBYzs7Ozs7O1NDeGhFekQ7U0FDQTs7U0FFQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTtTQUNBO1NBQ0E7U0FDQTs7U0FFQTtTQUNBOztTQUVBO1NBQ0E7U0FDQTs7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0E7VUFDQSx5Q0FBeUMsd0NBQXdDO1VBQ2pGO1VBQ0E7VUFDQTs7Ozs7VUNQQTs7Ozs7VUNBQTtVQUNBO1VBQ0E7VUFDQSx1REFBdUQsaUJBQWlCO1VBQ3hFO1VBQ0EsZ0RBQWdELGFBQWE7VUFDN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNOZ0Q7QUFDM0IiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9jb21wb25lbnQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9kb20tcmVuZGVyZXIuanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi9saWIvZnJhZ21lbnQtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9uYXRpdmUtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi9wb3J0YWwtbm9kZS5qcyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci8uL2xpYi90ZXh0LW5vZGUuanMiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi4vamlicy9kaXN0L2luZGV4LmpzIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9qaWJzLWRvbS1yZW5kZXJlci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2ppYnMtZG9tLXJlbmRlcmVyL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vamlicy1kb20tcmVuZGVyZXIvLi9saWIvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgSmlicyxcbiAgQ29tcG9uZW50cyxcbiAgUmVuZGVyZXJzLFxuICBVdGlscyxcbn0gZnJvbSAnamlicyc7XG5cbmNvbnN0IHtcbiAgSklCX1BST1hZLFxuICBKSUJfQ0hJTERfSU5ERVhfUFJPUCxcbn0gPSBKaWJzO1xuXG5jb25zdCB7XG4gIENPTlRFWFRfSUQsXG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuY29uc3Qge1xuICBJTklUX01FVEhPRCxcbiAgVVBEQVRFX0VWRU5ULFxuICBQRU5ESU5HX1NUQVRFX1VQREFURSxcbiAgTEFTVF9SRU5ERVJfVElNRSxcbiAgU0tJUF9TVEFURV9VUERBVEVTLFxufSA9IENvbXBvbmVudHM7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDIwO1xuXG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICBzdXBlciguLi5hcmdzKTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdmcmFnbWVudE5vZGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ2NvbXBvbmVudCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgICAncGVuZGluZ0NvbnRleHRVcGRhdGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgICAgJ3ByZXZpb3VzU3RhdGUnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHt9LFxuICAgICAgfSxcbiAgICAgICdsYXN0Q29udGV4dElEJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICAgICAgdmFsdWU6ICAgICAgICB0aGlzLmNvbnRleHRbQ09OVEVYVF9JRF0gfHwgMW4sXG4gICAgICB9LFxuICAgICAgJ2NhY2hlZFJlbmRlclJlc3VsdCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBnZXRUaGlzTm9kZU9yQ2hpbGROb2RlcygpIHtcbiAgICBpZiAoIXRoaXMuZnJhZ21lbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIHRoaXMuZnJhZ21lbnROb2RlLmdldENoaWxkcmVuTm9kZXMoKTtcbiAgfVxuXG4gIG1lcmdlQ29tcG9uZW50UHJvcHMob2xkUHJvcHMsIG5ld1Byb3BzKSB7XG4gICAgbGV0IHByb3BzID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCBvbGRQcm9wcyB8fCB7fSwgbmV3UHJvcHMpO1xuICAgIHJldHVybiBwcm9wcztcbiAgfVxuXG4gIGZpcmVQcm9wVXBkYXRlcyhfb2xkUHJvcHMsIF9uZXdQcm9wcykge1xuICAgIGxldCBuZXdQcm9wcyAgICA9IF9uZXdQcm9wcyB8fCB7fTtcbiAgICBsZXQgYWxsUHJvcEtleXMgPSBuZXcgU2V0KE9iamVjdC5rZXlzKG5ld1Byb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhuZXdQcm9wcykpKTtcblxuICAgIGxldCBvbGRQcm9wcyAgICA9IF9vbGRQcm9wcyB8fCB7fTtcbiAgICBsZXQgb2xkUHJvcEtleXMgPSBPYmplY3Qua2V5cyhvbGRQcm9wcykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMob2xkUHJvcHMpKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBvbGRQcm9wS2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgICAgYWxsUHJvcEtleXMuYWRkKG9sZFByb3BLZXlzW2ldKTtcblxuICAgIGZvciAobGV0IGtleSBvZiBhbGxQcm9wS2V5cykge1xuICAgICAgbGV0IG9sZFZhbHVlICA9IG9sZFByb3BzW2tleV07XG4gICAgICBsZXQgbmV3VmFsdWUgID0gbmV3UHJvcHNba2V5XTtcblxuICAgICAgaWYgKG9sZFZhbHVlICE9PSBuZXdWYWx1ZSlcbiAgICAgICAgdGhpcy5jb21wb25lbnQub25Qcm9wVXBkYXRlZChrZXksIG5ld1ZhbHVlLCBvbGRWYWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkUmVuZGVyKG5ld1Byb3BzLCBuZXdDaGlsZHJlbikge1xuICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudDtcbiAgICBpZiAoIWNvbXBvbmVudClcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHRoaXMubGFzdENvbnRleHRJRCA8IHRoaXMuY29udGV4dFtDT05URVhUX0lEXSkge1xuICAgICAgdGhpcy5sYXN0Q29udGV4dElEID0gdGhpcy5jb250ZXh0W0NPTlRFWFRfSURdO1xuICAgICAgdGhpcy5wcmV2aW91c1N0YXRlID0gT2JqZWN0LmFzc2lnbih7fSwgY29tcG9uZW50LnN0YXRlKTtcblxuICAgICAgdGhpcy5maXJlUHJvcFVwZGF0ZXMoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcyk7XG4gICAgICBjb21wb25lbnQucHJvcHMgPSB0aGlzLm1lcmdlQ29tcG9uZW50UHJvcHMoY29tcG9uZW50LnByb3BzLCBuZXdQcm9wcyk7XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmNoaWxkcmVuRGlmZmVyKGNvbXBvbmVudC5jaGlsZHJlbiwgbmV3Q2hpbGRyZW4pKSB7XG4gICAgICB0aGlzLmNvbXBvbmVudC5jaGlsZHJlbiA9IG5ld0NoaWxkcmVuLnNsaWNlKCk7XG4gICAgICB0aGlzLnByZXZpb3VzU3RhdGUgPSBPYmplY3QuYXNzaWduKHt9LCBjb21wb25lbnQuc3RhdGUpO1xuXG4gICAgICB0aGlzLmZpcmVQcm9wVXBkYXRlcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcbiAgICAgIGNvbXBvbmVudC5wcm9wcyA9IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhjb21wb25lbnQucHJvcHMsIG5ld1Byb3BzKTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzU3RhdGUgPSB0aGlzLnByZXZpb3VzU3RhdGUgfHwge307XG4gICAgbGV0IHByb3BzRGlmZmVyICAgPSB0aGlzLnByb3BzRGlmZmVyKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMsIFsgJ3JlZicsICdrZXknLCBKSUJfQ0hJTERfSU5ERVhfUFJPUCBdLCB0cnVlKTtcbiAgICBpZiAocHJvcHNEaWZmZXIgJiYgY29tcG9uZW50LnNob3VsZFVwZGF0ZShuZXdQcm9wcywgcHJldmlvdXNTdGF0ZSkpIHtcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbXBvbmVudC5zdGF0ZSk7XG5cbiAgICAgIHRoaXMuZmlyZVByb3BVcGRhdGVzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuICAgICAgY29tcG9uZW50LnByb3BzID0gdGhpcy5tZXJnZUNvbXBvbmVudFByb3BzKGNvbXBvbmVudC5wcm9wcywgbmV3UHJvcHMpO1xuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBsZXQgc3RhdGVEaWZmZXJzID0gdGhpcy5wcm9wc0RpZmZlcihwcmV2aW91c1N0YXRlLCBjb21wb25lbnQuc3RhdGUpO1xuICAgIGlmIChzdGF0ZURpZmZlcnMgJiYgY29tcG9uZW50LnNob3VsZFVwZGF0ZShuZXdQcm9wcywgcHJldmlvdXNTdGF0ZSkpIHtcbiAgICAgIHRoaXMucHJldmlvdXNTdGF0ZSA9IE9iamVjdC5hc3NpZ24oe30sIGNvbXBvbmVudC5zdGF0ZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBhc3luYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMuY29tcG9uZW50KSB7XG4gICAgICBpZiAodGhpcy5qaWIgJiYgdGhpcy5qaWIucHJvcHMgJiYgdHlwZW9mIHRoaXMuamliLnByb3BzLnJlZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhpcy5qaWIucHJvcHMucmVmLmNhbGwodGhpcy5jb21wb25lbnQsIG51bGwsIHRoaXMuY29tcG9uZW50KTtcblxuICAgICAgYXdhaXQgdGhpcy5jb21wb25lbnQuZGVzdHJveSgpO1xuICAgICAgdGhpcy5jb21wb25lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmZyYWdtZW50Tm9kZSkge1xuICAgICAgdGhpcy5yZW1vdmVDaGlsZCh0aGlzLmZyYWdtZW50Tm9kZSk7XG5cbiAgICAgIGF3YWl0IHRoaXMuZnJhZ21lbnROb2RlLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuZnJhZ21lbnROb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLmNhY2hlZFJlbmRlclJlc3VsdCA9IG51bGw7XG4gICAgdGhpcy5wcmV2aW91c1N0YXRlID0gbnVsbDtcblxuICAgIHJldHVybiBhd2FpdCBzdXBlci5kZXN0cm95KHRydWUpO1xuICB9XG5cbiAgb25Db250ZXh0VXBkYXRlKCkge1xuICAgIGlmICghdGhpcy5jb21wb25lbnQgfHwgdGhpcy5jb21wb25lbnRbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKHRoaXMucGVuZGluZ0NvbnRleHRVcGRhdGUpXG4gICAgICByZXR1cm4gdGhpcy5wZW5kaW5nQ29udGV4dFVwZGF0ZTtcblxuICAgIHRoaXMucGVuZGluZ0NvbnRleHRVcGRhdGUgPSBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgIXRoaXMuY29tcG9uZW50IHx8IHRoaXMuY29tcG9uZW50W1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgICAgcmV0dXJuO1xuXG4gICAgICB0aGlzLnBlbmRpbmdDb250ZXh0VXBkYXRlID0gbnVsbDtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy5wZW5kaW5nQ29udGV4dFVwZGF0ZTtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuICBhc3luYyBfcmVuZGVyKGZvcmNlUmVuZGVyKSB7XG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcblxuICAgIGxldCB7IFR5cGU6IENvbXBvbmVudENsYXNzLCBwcm9wcywgY2hpbGRyZW4gfSA9ICh0aGlzLmppYiB8fCB7fSk7XG4gICAgaWYgKCFDb21wb25lbnRDbGFzcylcbiAgICAgIHJldHVybjtcblxuICAgIGNoaWxkcmVuID0gdGhpcy5qaWIuY2hpbGRyZW4gPSBhd2FpdCB0aGlzLnJlc29sdmVDaGlsZHJlbihjaGlsZHJlbik7XG5cbiAgICBjb25zdCBmaW5hbGl6ZVJlbmRlciA9IGFzeW5jIChyZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKSA9PiB7XG4gICAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSB8fCAhdGhpcy5jb21wb25lbnQpXG4gICAgICAgIHJldHVybjtcblxuICAgICAgdGhpcy5jYWNoZWRSZW5kZXJSZXN1bHQgPSByZW5kZXJSZXN1bHQ7XG4gICAgICB0aGlzLmNvbXBvbmVudFtMQVNUX1JFTkRFUl9USU1FXSA9IFV0aWxzLm5vdygpO1xuXG4gICAgICBsZXQgZnJhZ21lbnROb2RlID0gdGhpcy5mcmFnbWVudE5vZGU7XG4gICAgICBsZXQgZnJhZ21lbnRKaWIgPSB7IFR5cGU6IEpJQl9QUk9YWSwgcHJvcHM6IHt9LCBjaGlsZHJlbjogcmVuZGVyUmVzdWx0IH07XG5cbiAgICAgIGlmICghZnJhZ21lbnROb2RlKSB7XG4gICAgICAgIGZyYWdtZW50Tm9kZSA9IHRoaXMuZnJhZ21lbnROb2RlID0gdGhpcy5yZW5kZXJlci5jb25zdHJ1Y3ROb2RlRnJvbUppYihmcmFnbWVudEppYiwgdGhpcywgdGhpcy5jb250ZXh0KTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChmcmFnbWVudE5vZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnJhZ21lbnROb2RlLnVwZGF0ZUppYihmcmFnbWVudEppYik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IGZyYWdtZW50Tm9kZS5yZW5kZXIoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgaGFuZGxlUmVuZGVyRXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXG4gICAgICBpZiAodGhpcy5jb21wb25lbnQpXG4gICAgICAgIHRoaXMuY29tcG9uZW50W0xBU1RfUkVOREVSX1RJTUVdID0gVXRpbHMubm93KCk7XG5cbiAgICAgIGxldCByZW5kZXJSZXN1bHQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBvbmVudCAmJiB0eXBlb2YgdGhpcy5jb21wb25lbnQucmVuZGVyRXJyb3JTdGF0ZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICByZW5kZXJSZXN1bHQgPSB0aGlzLmNvbXBvbmVudC5yZW5kZXJFcnJvclN0YXRlKGVycm9yKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJlbmRlclJlc3VsdCA9IFsgYCR7ZXJyb3IubWVzc2FnZX1cXG4ke2Vycm9yLnN0YWNrfWAgXTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yMikge1xuICAgICAgICByZW5kZXJSZXN1bHQgPSBbIGAke2Vycm9yLm1lc3NhZ2V9XFxuJHtlcnJvci5zdGFja31gIF07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmaW5hbGl6ZVJlbmRlcihyZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKTtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpXG4gICAgICByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgaWYgKGZvcmNlUmVuZGVyICE9PSB0cnVlICYmIHRoaXMuY29tcG9uZW50ICYmICF0aGlzLnNob3VsZFJlbmRlcihwcm9wcywgY2hpbGRyZW4pKVxuICAgICAgICByZXR1cm47XG5cbiAgICAgIGxldCBjb21wb25lbnQgPSB0aGlzLmNvbXBvbmVudDtcbiAgICAgIGlmICghY29tcG9uZW50KSB7XG4gICAgICAgIGNvbXBvbmVudCA9IHRoaXMuY29tcG9uZW50ID0gbmV3IENvbXBvbmVudENsYXNzKHsgLi4uKHRoaXMuamliIHx8IHt9KSwgcHJvcHM6IHRoaXMubWVyZ2VDb21wb25lbnRQcm9wcyhudWxsLCBwcm9wcyksIGNvbnRleHQ6IHRoaXMuY29udGV4dCwgaWQ6IHRoaXMuaWQgfSk7XG4gICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50W0lOSVRfTUVUSE9EXSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBjb21wb25lbnRbSU5JVF9NRVRIT0RdKCk7XG5cbiAgICAgICAgY29tcG9uZW50Lm9uKFVQREFURV9FVkVOVCwgKHB1c2hlZFJlbmRlclJlc3VsdCkgPT4ge1xuICAgICAgICAgIGlmIChwdXNoZWRSZW5kZXJSZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRnJhbWUrKztcbiAgICAgICAgICAgIGZpbmFsaXplUmVuZGVyKHB1c2hlZFJlbmRlclJlc3VsdCwgdGhpcy5yZW5kZXJGcmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKHRydWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHByb3BzICYmIHR5cGVvZiBwcm9wcy5yZWYgPT09ICdmdW5jdGlvbicpXG4gICAgICAgICAgcHJvcHMucmVmLmNhbGwoY29tcG9uZW50LCBjb21wb25lbnQsIG51bGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBDYW5jZWwgYW55IHBlbmRpbmcgc3RhdGUgdXBkYXRlc1xuICAgICAgaWYgKHRoaXMuY29tcG9uZW50W1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgICAgdGhpcy5jb21wb25lbnRbUEVORElOR19TVEFURV9VUERBVEVdID0gbnVsbDtcblxuICAgICAgbGV0IHJlbmRlclJlc3VsdCA9IHRoaXMuY29tcG9uZW50LnJlbmRlcihjaGlsZHJlbik7XG4gICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihyZW5kZXJSZXN1bHQsICdwcm9taXNlJykpIHtcbiAgICAgICAgbGV0IHdhaXRpbmdSZW5kZXJSZXN1bHQgPSB0aGlzLmNvbXBvbmVudC5yZW5kZXJXYWl0aW5nKHRoaXMuY2FjaGVkUmVuZGVyUmVzdWx0KTtcbiAgICAgICAgbGV0IHJlbmRlckNvbXBsZXRlZCA9IGZhbHNlO1xuXG4gICAgICAgIGxldCBsb2FkaW5nVGltZXIgPSBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICBsb2FkaW5nVGltZXIgPSBudWxsO1xuXG4gICAgICAgICAgaWYgKFV0aWxzLmluc3RhbmNlT2Yod2FpdGluZ1JlbmRlclJlc3VsdCwgJ3Byb21pc2UnKSlcbiAgICAgICAgICAgIHdhaXRpbmdSZW5kZXJSZXN1bHQgPSBhd2FpdCB3YWl0aW5nUmVuZGVyUmVzdWx0O1xuXG4gICAgICAgICAgaWYgKHJlbmRlckNvbXBsZXRlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgIGF3YWl0IGZpbmFsaXplUmVuZGVyKHdhaXRpbmdSZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKTtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICAgICAgfSwgNSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZW5kZXJSZXN1bHQgPSBhd2FpdCByZW5kZXJSZXN1bHQ7XG4gICAgICAgICAgcmVuZGVyQ29tcGxldGVkID0gdHJ1ZTtcblxuICAgICAgICAgIGlmIChsb2FkaW5nVGltZXIpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChsb2FkaW5nVGltZXIpO1xuICAgICAgICAgICAgbG9hZGluZ1RpbWVyID0gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhd2FpdCBmaW5hbGl6ZVJlbmRlcihyZW5kZXJSZXN1bHQsIHJlbmRlckZyYW1lKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBhd2FpdCBoYW5kbGVSZW5kZXJFcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IGZpbmFsaXplUmVuZGVyKHJlbmRlclJlc3VsdCwgcmVuZGVyRnJhbWUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBhd2FpdCBoYW5kbGVSZW5kZXJFcnJvcihlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZGVzdHJveUZyb21ET00oX2NvbnRleHQsIF9ub2RlKSB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgY29udGV4dCA9IF9jb250ZXh0O1xuICAgIGxldCBub2RlID0gX25vZGU7XG4gICAgaWYgKG5vZGUgPT09IHRoaXMpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzLnBhcmVudE5vZGUuY29udGV4dDtcbiAgICAgIG5vZGUgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyZW50Tm9kZS5kZXN0cm95RnJvbURPTShjb250ZXh0LCBub2RlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bmNET00oX2NvbnRleHQsIF9ub2RlKSB7XG4gICAgaWYgKCF0aGlzLnBhcmVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQgY29udGV4dCA9IF9jb250ZXh0O1xuICAgIGxldCBub2RlID0gX25vZGU7XG4gICAgaWYgKG5vZGUgPT09IHRoaXMpIHtcbiAgICAgIGNvbnRleHQgPSB0aGlzLnBhcmVudE5vZGUuY29udGV4dDtcbiAgICAgIG5vZGUgPSB0aGlzLnBhcmVudE5vZGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucGFyZW50Tm9kZS5zeW5jRE9NKGNvbnRleHQsIG5vZGUpO1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBKaWJzLFxuICBSZW5kZXJlcnMsXG59IGZyb20gJ2ppYnMnO1xuXG5pbXBvcnQgeyBGcmFnbWVudE5vZGUgfSAgICAgZnJvbSAnLi9mcmFnbWVudC1ub2RlLmpzJztcbmltcG9ydCB7IFRleHROb2RlIH0gICAgICAgICBmcm9tICcuL3RleHQtbm9kZS5qcyc7XG5pbXBvcnQgeyBOYXRpdmVOb2RlIH0gICAgICAgZnJvbSAnLi9uYXRpdmUtbm9kZS5qcyc7XG5pbXBvcnQgeyBQb3J0YWxOb2RlIH0gICAgICAgZnJvbSAnLi9wb3J0YWwtbm9kZS5qcyc7XG5pbXBvcnQgeyBDb21wb25lbnROb2RlIH0gICAgZnJvbSAnLi9jb21wb25lbnQtbm9kZS5qcyc7XG5cbmNvbnN0IHtcbiAgUmVuZGVyZXIsXG59ID0gUmVuZGVyZXJzO1xuXG5jb25zdCB7XG4gIEpJQl9QUk9YWSxcbiAgSklCX1JBV19URVhULFxufSA9IEppYnM7XG5cbmNvbnN0IFNLSVBfVVBEQVRFUyA9IHRydWU7XG5cbmV4cG9ydCBjbGFzcyBET01SZW5kZXJlciBleHRlbmRzIFJlbmRlcmVyIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgc3RhdGljIFRZUEUgPSA5O1xuXG4gIHN0YXRpYyBGcmFnbWVudE5vZGUgPSBGcmFnbWVudE5vZGU7XG5cbiAgc3RhdGljIFRleHROb2RlID0gVGV4dE5vZGU7XG5cbiAgc3RhdGljIE5hdGl2ZU5vZGUgPSBOYXRpdmVOb2RlO1xuXG4gIHN0YXRpYyBQb3J0YWxOb2RlID0gUG9ydGFsTm9kZTtcblxuICBzdGF0aWMgQ29tcG9uZW50Tm9kZSA9IENvbXBvbmVudE5vZGU7XG5cbiAgY29uc3RydWN0b3Iocm9vdEVsZW1lbnRTZWxlY3Rvciwgb3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnMpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ3Jvb3ROb2RlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdqaWInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHsgVHlwZTogcm9vdEVsZW1lbnRTZWxlY3RvciwgcHJvcHM6IHt9LCBjaGlsZHJlbjogW10gfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBpc1BvcnRhbE5vZGUodHlwZSkge1xuICAgIHJldHVybiAoL1teYS16QS1aMC05Ol0vKS50ZXN0KHR5cGUpO1xuICB9XG5cbiAgY29uc3RydWN0Tm9kZUZyb21KaWIoamliLCBwYXJlbnQsIGNvbnRleHQpIHtcbiAgICBsZXQgeyBUeXBlIH0gPSBqaWI7XG4gICAgaWYgKHR5cGVvZiBUeXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuQ29tcG9uZW50Tm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQsIGppYik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgVHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmICh0aGlzLmlzUG9ydGFsTm9kZShUeXBlKSlcbiAgICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yLlBvcnRhbE5vZGUodGhpcywgcGFyZW50LCBjb250ZXh0LCBqaWIpO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuTmF0aXZlTm9kZSh0aGlzLCBwYXJlbnQsIGNvbnRleHQsIGppYik7XG4gICAgfSBlbHNlIGlmIChUeXBlID09IG51bGwgfHwgVHlwZSA9PT0gSklCX1BST1hZKSB7XG4gICAgICByZXR1cm4gbmV3IHRoaXMuY29uc3RydWN0b3IuRnJhZ21lbnROb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9IGVsc2UgaWYgKFR5cGUgPT09IEpJQl9SQVdfVEVYVCkge1xuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yLlRleHROb2RlKHRoaXMsIHBhcmVudCwgY29udGV4dCwgamliKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuXG4gICAgaWYgKHRoaXMucm9vdE5vZGUpIHtcbiAgICAgIGF3YWl0IHRoaXMucm9vdE5vZGUuZGVzdHJveSgpO1xuICAgICAgdGhpcy5yb290Tm9kZSA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHN1cGVyLmRlc3Ryb3kodHJ1ZSk7XG4gIH1cblxuICBhc3luYyByZW5kZXIoY2hpbGRyZW4pIHtcbiAgICBpZiAoIWNoaWxkcmVuKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgJHt0aGlzLmNvbnN0cnVjdG9yLm5hbWV9OjpyZW5kZXI6IEEgamliIG11c3QgYmUgcHJvdmlkZWQuYCk7XG5cbiAgICB0aGlzLnVwZGF0ZUppYih7XG4gICAgICAuLi50aGlzLmppYixcbiAgICAgIGNoaWxkcmVuLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHN1cGVyLnJlbmRlcigpO1xuICB9XG5cbiAgYXN5bmMgX3JlbmRlcigpIHtcbiAgICBpZiAodGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcbiAgICBsZXQgcm9vdE5vZGUgPSB0aGlzLnJvb3ROb2RlO1xuICAgIGxldCBmcmFnbWVudEppYiA9IHsgVHlwZTogSklCX1BST1hZLCBwcm9wczoge30sIGNoaWxkcmVuOiB0aGlzLmppYiB9O1xuXG4gICAgaWYgKCFyb290Tm9kZSlcbiAgICAgIHJvb3ROb2RlID0gdGhpcy5yb290Tm9kZSA9IHRoaXMuY29uc3RydWN0Tm9kZUZyb21KaWIodGhpcy5qaWIsIHRoaXMsIHRoaXMuY29udGV4dCk7XG4gICAgZWxzZVxuICAgICAgcm9vdE5vZGUudXBkYXRlSmliKGZyYWdtZW50SmliKTtcblxuICAgIGF3YWl0IHJvb3ROb2RlLnJlbmRlcigpO1xuICAgIGlmIChyZW5kZXJGcmFtZSA+PSB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgdGhpcy5zeW5jRE9NKHRoaXMuY29udGV4dCwgdGhpcy5yb290Tm9kZSk7XG4gIH1cblxuICBhc3luYyBkZXN0cm95RnJvbURPTShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKG5vZGUgPT09IHRoaXMpIHtcbiAgICAgIGlmICghdGhpcy5yb290Tm9kZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5kZXN0cm95Tm9kZShjb250ZXh0LCB0aGlzLnJvb3ROb2RlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5kZXN0cm95Tm9kZShjb250ZXh0LCBub2RlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bmNET00oY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChub2RlID09PSB0aGlzKSB7XG4gICAgICBpZiAoIXRoaXMucm9vdE5vZGUpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc3luY05vZGUoY29udGV4dCwgdGhpcy5yb290Tm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc3luY05vZGUoY29udGV4dCwgbm9kZSk7XG4gIH1cblxuICBhc3luYyBhZGROb2RlKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBhd2FpdCB0aGlzLmF0dGFjaENoaWxkcmVuKGNvbnRleHQsIG5vZGUsIGZhbHNlKTtcblxuICAgIC8vIFRlbGwgb3VyIHBhcmVudCB0byByZW9yZGVyIGl0c2VsZlxuICAgIGxldCBwYXJlbnROb2RlID0gdGhpcy5wYXJlbnROb2RlO1xuICAgIGlmIChwYXJlbnROb2RlKSB7XG4gICAgICAvLyBTa2lwIHVwZGF0ZXMsIGFzIHdlIGFyZW4ndCBtb2RpZnlpbmcgb3RoZXIgY2hpbGRyZW4uXG4gICAgICAvLyBKdXN0IGVuc3VyZSBwcm9wZXIgY2hpbGQgb3JkZXIuXG4gICAgICBhd2FpdCB0aGlzLmF0dGFjaENoaWxkcmVuKGNvbnRleHQsIHBhcmVudE5vZGUsIFNLSVBfVVBEQVRFUyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBjb25zdHJ1Y3ROYXRpdmVFbGVtZW50RnJvbU5vZGUoY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghbm9kZSlcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGlmIChub2RlLlRZUEUgPT09IE5hdGl2ZU5vZGUuVFlQRSlcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNyZWF0ZU5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBUZXh0Tm9kZS5UWVBFKVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlVGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgZWxzZSBpZiAobm9kZS5UWVBFID09PSBQb3J0YWxOb2RlLlRZUEUgfHwgbm9kZS5UWVBFID09PSBET01SZW5kZXJlci5UWVBFKVxuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY3JlYXRlUG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OmNvbnN0cnVjdE5hdGl2ZUVsZW1lbnRGcm9tTm9kZTogVW5zdXBwb3J0ZWQgdmlydHVhbCBlbGVtZW50IHR5cGUgZGV0ZWN0ZWQ6ICR7bm9kZS5UWVBFfWApO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlTm9kZShjb250ZXh0LCBub2RlKSB7XG4gICAgaWYgKCFub2RlKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IHJlc3VsdDtcblxuICAgIGlmIChub2RlLlRZUEUgPT09IE5hdGl2ZU5vZGUuVFlQRSlcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMudXBkYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFRleHROb2RlLlRZUEUpXG4gICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLnVwZGF0ZVRleHRFbGVtZW50KGNvbnRleHQsIG5vZGUpO1xuICAgIGVsc2UgaWYgKG5vZGUuVFlQRSA9PT0gUG9ydGFsTm9kZS5UWVBFIHx8IG5vZGUuVFlQRSA9PT0gRE9NUmVuZGVyZXIuVFlQRSlcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMudXBkYXRlUG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3RoaXMuY29uc3RydWN0b3IubmFtZX06OnN5bmNOb2RlOiBVbnN1cHBvcnRlZCB2aXJ0dWFsIGVsZW1lbnQgdHlwZSBkZXRlY3RlZDogJHtub2RlLlRZUEV9YCk7XG5cbiAgICBhd2FpdCB0aGlzLmF0dGFjaENoaWxkcmVuKGNvbnRleHQsIG5vZGUsIHRydWUpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHN5bmNOb2RlKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgbmF0aXZlRWxlbWVudCA9IChub2RlICYmIG5vZGUubmF0aXZlRWxlbWVudCk7XG4gICAgaWYgKCFuYXRpdmVFbGVtZW50KSB7XG4gICAgICBuYXRpdmVFbGVtZW50ID0gYXdhaXQgdGhpcy5jb25zdHJ1Y3ROYXRpdmVFbGVtZW50RnJvbU5vZGUoY29udGV4dCwgbm9kZSk7XG4gICAgICBub2RlLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVFbGVtZW50O1xuXG4gICAgICBpZiAobm9kZS5qaWIgJiYgbm9kZS5qaWIucHJvcHMgJiYgdHlwZW9mIG5vZGUuamliLnByb3BzLnJlZiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgbm9kZS5qaWIucHJvcHMucmVmLmNhbGwobm9kZSwgbmF0aXZlRWxlbWVudCwgbnVsbCk7XG5cbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmFkZE5vZGUoY29udGV4dCwgbm9kZSk7XG4gICAgfSBlbHNlIGlmIChub2RlKSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGVOb2RlKGNvbnRleHQsIG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lOb2RlKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIW5vZGUpXG4gICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgbmF0aXZlRWxlbWVudCA9IChub2RlICYmIG5vZGUubmF0aXZlRWxlbWVudCk7XG4gICAgbGV0IHJlc3VsdCA9IGZhbHNlO1xuXG4gICAgaWYgKG5hdGl2ZUVsZW1lbnQpIHtcbiAgICAgIGlmIChub2RlLlRZUEUgPT09IE5hdGl2ZU5vZGUuVFlQRSlcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5kZXN0cm95TmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKTtcbiAgICAgIGVsc2UgaWYgKG5vZGUuVFlQRSA9PT0gVGV4dE5vZGUuVFlQRSlcbiAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5kZXN0cm95VGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgICBlbHNlIGlmIChub2RlLlRZUEUgPT09IFBvcnRhbE5vZGUuVFlQRSB8fCBub2RlLlRZUEUgPT09IERPTVJlbmRlcmVyLlRZUEUpXG4gICAgICAgIHJlc3VsdCA9IGF3YWl0IHRoaXMuZGVzdHJveVBvcnRhbEVsZW1lbnQoY29udGV4dCwgbm9kZSk7XG4gICAgICBlbHNlXG4gICAgICAgIG5ldyBUeXBlRXJyb3IoYCR7dGhpcy5jb25zdHJ1Y3Rvci5uYW1lfTo6c3luY05vZGU6IFVuc3VwcG9ydGVkIHZpcnR1YWwgZWxlbWVudCB0eXBlIGRldGVjdGVkOiAke25vZGUuVFlQRX1gKTtcbiAgICB9XG5cbiAgICBpZiAobm9kZSlcbiAgICAgIGF3YWl0IHRoaXMuZGV0YWNoQ2hpbGRyZW4oY29udGV4dCwgbm9kZSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZmluZE5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICB9XG5cbiAgY3JlYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogJ2VsZW1lbnQnLCB2YWx1ZTogbm9kZS52YWx1ZSB9O1xuICB9XG5cbiAgdXBkYXRlTmF0aXZlRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gIH1cblxuICBjcmVhdGVUZXh0RWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIHsgdHlwZTogJ3RleHQnLCB2YWx1ZTogbm9kZS52YWx1ZSB9O1xuICB9XG5cbiAgdXBkYXRlVGV4dEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNyZWF0ZVBvcnRhbEVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICAgIHJldHVybiB7IHR5cGU6ICdwb3J0YWwnLCB2YWx1ZTogbm9kZS52YWx1ZSB9O1xuICB9XG5cbiAgdXBkYXRlUG9ydGFsRWxlbWVudChjb250ZXh0LCBub2RlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGVzdHJveU5hdGl2ZUVsZW1lbnQoY29udGV4dCwgbm9kZSkge1xuICB9XG5cbiAgZGVzdHJveVRleHRFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgfVxuXG4gIGRlc3Ryb3lQb3J0YWxFbGVtZW50KGNvbnRleHQsIG5vZGUpIHtcbiAgfVxuXG4gIGZvcmNlTmF0aXZlRWxlbWVudFJlZmxvdyhjb250ZXh0LCBub2RlLCBuYXRpdmVFbGVtZW50KSB7XG4gIH1cblxuICBhc3luYyBhdHRhY2hDaGlsZHJlbihjb250ZXh0LCBwYXJlbnROb2RlLCBvcmRlck9ubHkpIHtcbiAgICBsZXQgcGFyZW50TmF0aXZlRWxlbWVudCA9IChwYXJlbnROb2RlICYmIHBhcmVudE5vZGUubmF0aXZlRWxlbWVudCk7XG4gICAgaWYgKCFwYXJlbnROYXRpdmVFbGVtZW50KVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgbGV0IG5hdGl2ZVBhcmVudENoaWxkTm9kZXMgPSBBcnJheS5mcm9tKHBhcmVudE5hdGl2ZUVsZW1lbnQuY2hpbGROb2Rlcyk7XG4gICAgbGV0IGluZGV4ID0gMDtcbiAgICBsZXQgc2tpcE9yZGVyZWROb2RlcyA9IHRydWU7XG5cbiAgICBmb3IgKGxldCBjaGlsZE5vZGUgb2YgcGFyZW50Tm9kZS5nZXRDaGlsZHJlbk5vZGVzKCkpIHtcbiAgICAgIGxldCBjaGlsZE5hdGl2ZUVsZW1lbnQgPSBjaGlsZE5vZGUubmF0aXZlRWxlbWVudDtcbiAgICAgIGlmICghY2hpbGROYXRpdmVFbGVtZW50KVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgaWYgKG9yZGVyT25seSAhPT0gdHJ1ZSlcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVOb2RlKGNvbnRleHQsIGNoaWxkTm9kZSk7XG5cbiAgICAgIC8vIFBlcmZvcm1hbmNlIGJvb3N0XG4gICAgICBpZiAoc2tpcE9yZGVyZWROb2Rlcykge1xuICAgICAgICBpZiAobmF0aXZlUGFyZW50Q2hpbGROb2Rlc1tpbmRleCsrXSA9PT0gY2hpbGROYXRpdmVFbGVtZW50KVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc2tpcE9yZGVyZWROb2RlcyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBwYXJlbnROYXRpdmVFbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkTmF0aXZlRWxlbWVudCk7XG4gICAgICB0aGlzLmZvcmNlTmF0aXZlRWxlbWVudFJlZmxvdyhjb250ZXh0LCBjaGlsZE5vZGUsIGNoaWxkTmF0aXZlRWxlbWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBkZXRhY2hDaGlsZHJlbihjb250ZXh0LCBwYXJlbnROb2RlKSB7XG4gICAgbGV0IHBhcmVudE5hdGl2ZUVsZW1lbnQgPSAocGFyZW50Tm9kZSAmJiBwYXJlbnROb2RlLm5hdGl2ZUVsZW1lbnQpO1xuICAgIGlmICghcGFyZW50TmF0aXZlRWxlbWVudClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGxldCBkZXN0cm95UHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBjaGlsZE5vZGUgb2YgcGFyZW50Tm9kZS5nZXRDaGlsZHJlbk5vZGVzKCkpXG4gICAgICBkZXN0cm95UHJvbWlzZXMucHVzaCh0aGlzLmRlc3Ryb3lOb2RlKGNvbnRleHQsIGNoaWxkTm9kZSkpO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG4iLCJpbXBvcnQge1xuICBKaWJzLFxuICBSZW5kZXJlcnMsXG4gIFV0aWxzLFxuICBkZWFkYmVlZixcbn0gZnJvbSAnamlicyc7XG5cbmNvbnN0IHtcbiAgaXNKaWJpc2gsXG4gIGNvbnN0cnVjdEppYixcbiAgSklCX1BST1hZLFxuICBKSUJfUkFXX1RFWFQsXG4gIEpJQl9DSElMRF9JTkRFWF9QUk9QLFxufSA9IEppYnM7XG5cbmNvbnN0IHtcbiAgUm9vdE5vZGUsXG59ID0gUmVuZGVyZXJzO1xuXG5leHBvcnQgY2xhc3MgRnJhZ21lbnROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDExO1xuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIHJldHVybiB0aGlzLmdldENoaWxkcmVuTm9kZXMoKTtcbiAgfVxuXG4gIGFzeW5jIF9yZW5kZXIoKSB7XG4gICAgbGV0IGluZGV4TWFwICAgID0gbmV3IE1hcCgpO1xuICAgIGxldCByZW5kZXJGcmFtZSA9IHRoaXMucmVuZGVyRnJhbWU7XG5cbiAgICBsZXQgeyBjaGlsZHJlbiB9ID0gKHRoaXMuamliIHx8IHt9KTtcbiAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihjaGlsZHJlbiwgJ3Byb21pc2UnKSlcbiAgICAgIGNoaWxkcmVuID0gYXdhaXQgY2hpbGRyZW47XG5cbiAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSlcbiAgICAgIHJldHVybjtcblxuICAgIGlmICghdGhpcy5pc0l0ZXJhYmxlQ2hpbGQoY2hpbGRyZW4pICYmIChpc0ppYmlzaChjaGlsZHJlbikgfHwgdGhpcy5pc1ZhbGlkQ2hpbGQoY2hpbGRyZW4pKSlcbiAgICAgIGNoaWxkcmVuID0gWyBjaGlsZHJlbiBdO1xuXG4gICAgY29uc3QgZ2V0SW5kZXhGb3JUeXBlID0gKFR5cGUpID0+IHtcbiAgICAgIGxldCBpbmRleCA9IChpbmRleE1hcC5nZXQoVHlwZSkgfHwgMCkgKyAxO1xuICAgICAgaW5kZXhNYXAuc2V0KFR5cGUsIGluZGV4KTtcblxuICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH07XG5cbiAgICBsZXQgbG9vcFN0b3BwZWQgPSBmYWxzZTtcbiAgICBsZXQgcHJvbWlzZXMgPSBVdGlscy5pdGVyYXRlKGNoaWxkcmVuLCAoeyB2YWx1ZTogX2NoaWxkLCBrZXksIGluZGV4LCBTVE9QIH0pID0+IHtcbiAgICAgIGlmIChsb29wU3RvcHBlZCB8fCB0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgICByZXR1cm4gU1RPUDtcblxuICAgICAgcmV0dXJuIChhc3luYyAoKSA9PiB7XG4gICAgICAgIGxldCBjaGlsZCA9IChVdGlscy5pbnN0YW5jZU9mKF9jaGlsZCwgJ3Byb21pc2UnKSkgPyBhd2FpdCBfY2hpbGQgOiBfY2hpbGQ7XG4gICAgICAgIGlmIChVdGlscy5pc0VtcHR5KGNoaWxkKSB8fCBPYmplY3QuaXMoY2hpbGQsIE5hTikgfHwgT2JqZWN0LmlzKGNoaWxkLCBJbmZpbml0eSkpXG4gICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcgfHwgcmVuZGVyRnJhbWUgPCB0aGlzLnJlbmRlckZyYW1lKSB7XG4gICAgICAgICAgbG9vcFN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpc0ppYiA9IGlzSmliaXNoKGNoaWxkKTtcbiAgICAgICAgbGV0IGNyZWF0ZWQ7XG4gICAgICAgIGxldCBqaWI7XG5cbiAgICAgICAgaWYgKCFpc0ppYiAmJiB0aGlzLmlzSXRlcmFibGVDaGlsZChjaGlsZCkpIHtcbiAgICAgICAgICBqaWIgPSB7XG4gICAgICAgICAgICBUeXBlOiAgICAgSklCX1BST1hZLFxuICAgICAgICAgICAgY2hpbGRyZW46IGNoaWxkLFxuICAgICAgICAgICAgcHJvcHM6ICAgIHtcbiAgICAgICAgICAgICAga2V5OiBgQGppYi9pbnRlcm5hbF9mcmFnbWVudF8ke2dldEluZGV4Rm9yVHlwZShKSUJfUFJPWFkpfWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAoIWlzSmliICYmIHRoaXMuaXNWYWxpZENoaWxkKGNoaWxkKSkge1xuICAgICAgICAgIGNoaWxkID0gKHR5cGVvZiBjaGlsZC52YWx1ZU9mID09PSAnZnVuY3Rpb24nKSA/IGNoaWxkLnZhbHVlT2YoKSA6IGNoaWxkO1xuICAgICAgICAgIGppYiA9IHtcbiAgICAgICAgICAgIFR5cGU6ICAgICBKSUJfUkFXX1RFWFQsXG4gICAgICAgICAgICBjaGlsZHJlbjogY2hpbGQsXG4gICAgICAgICAgICBwcm9wczogICAge1xuICAgICAgICAgICAgICBrZXk6IGBAamliL2ludGVybmFsX3RleHRfJHtnZXRJbmRleEZvclR5cGUoSklCX1JBV19URVhUKX1gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKGlzSmliKSB7XG4gICAgICAgICAgamliID0gY29uc3RydWN0SmliKGNoaWxkKTtcbiAgICAgICAgICBpZiAoVXRpbHMuaW5zdGFuY2VPZihqaWIsICdwcm9taXNlJykpXG4gICAgICAgICAgICBqaWIgPSBhd2FpdCBqaWI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5kZXN0cm95aW5nIHx8IHJlbmRlckZyYW1lIDwgdGhpcy5yZW5kZXJGcmFtZSkge1xuICAgICAgICAgIGxvb3BTdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgeyBUeXBlLCBwcm9wcyB9ID0gamliO1xuICAgICAgICBsZXQgbG9jYWxLZXk7XG4gICAgICAgIGlmIChpbmRleCAhPT0ga2V5KSAvLyBJbmRleCBpcyBhbiBpbnRlZ2VyLCBhbmQga2V5IGlzIGEgc3RyaW5nLCBtZWFuaW5nIHRoaXMgaXMgYW4gb2JqZWN0XG4gICAgICAgICAgbG9jYWxLZXkgPSBrZXk7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsb2NhbEtleSA9IChwcm9wcy5rZXkgPT0gbnVsbCB8fCBPYmplY3QuaXMocHJvcHMua2V5LCBOYU4pIHx8IE9iamVjdC5pcyhwcm9wcy5rZXksIEluZmluaXR5KSkgPyBgQGppYi9pbnRlcm5hbF9rZXlfJHtnZXRJbmRleEZvclR5cGUoVHlwZSl9YCA6IHByb3BzLmtleTtcblxuICAgICAgICBwcm9wc1tKSUJfQ0hJTERfSU5ERVhfUFJPUF0gPSBpbmRleDtcbiAgICAgICAgcHJvcHMua2V5ID0gbG9jYWxLZXk7XG4gICAgICAgIGppYi5wcm9wcyA9IHByb3BzO1xuXG4gICAgICAgIGxldCBjYWNoZUtleSA9IGRlYWRiZWVmKFR5cGUsIHByb3BzLmtleSk7XG4gICAgICAgIGxldCBub2RlID0gdGhpcy5nZXRDaGlsZChjYWNoZUtleSk7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgY3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgbm9kZSA9IHRoaXMucmVuZGVyZXIuY29uc3RydWN0Tm9kZUZyb21KaWIoamliLCB0aGlzLCB0aGlzLmNvbnRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNyZWF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICBub2RlLnVwZGF0ZUppYihqaWIpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgbm9kZS5yZW5kZXIoKTtcblxuICAgICAgICByZXR1cm4geyBub2RlLCBjYWNoZUtleSwgY3JlYXRlZCB9O1xuICAgICAgfSkoKTtcbiAgICB9KTtcblxuICAgIGxldCByZW5kZXJSZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIHJlbmRlclJlc3VsdHMgPSByZW5kZXJSZXN1bHRzLmZpbHRlcigocmVzdWx0KSA9PiAhIXJlc3VsdCk7XG5cbiAgICBsZXQgZGVzdHJveVByb21pc2VzID0gW107XG4gICAgaWYgKHRoaXMuZGVzdHJveWluZyB8fCByZW5kZXJGcmFtZSA8IHRoaXMucmVuZGVyRnJhbWUpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IHJlbmRlclJlc3VsdHMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICBsZXQgcmVzdWx0ID0gcmVuZGVyUmVzdWx0c1tpXTtcbiAgICAgICAgbGV0IHsgbm9kZSwgY3JlYXRlZCB9ID0gcmVzdWx0O1xuXG4gICAgICAgIGlmIChjcmVhdGVkICYmIG5vZGUpIHtcbiAgICAgICAgICAvLyBEZXN0cm95IG5vZGVzIHNpbmNlIHRoaXMgcmVuZGVyIHdhcyByZWplY3RlZC5cbiAgICAgICAgICAvLyBCdXQgb25seSBub2RlcyB0aGF0IHdlcmUganVzdCBjcmVhdGVkLi4uXG4gICAgICAgICAgLy8gYXMgZXhpc3Rpbmcgbm9kZXMgbWlnaHQgc3RpbGwgbmVlZCB0byBleGlzdC5cbiAgICAgICAgICBkZXN0cm95UHJvbWlzZXMucHVzaChub2RlLmRlc3Ryb3koKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGRlc3Ryb3lQcm9taXNlcy5sZW5ndGggPiAwKVxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChkZXN0cm95UHJvbWlzZXMpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gQWRkIG5ldyBjaGlsZHJlbiwgYW5kIGJ1aWxkIGEgbWFwXG4gICAgLy8gb2YgY2hpbGRyZW4ganVzdCBhZGRlZC5cbiAgICBsZXQgYWRkZWRDaGlsZHJlbiA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCByZW5kZXJSZXN1bHQgb2YgcmVuZGVyUmVzdWx0cykge1xuICAgICAgbGV0IHsgbm9kZSwgY2FjaGVLZXkgfSA9IHJlbmRlclJlc3VsdDtcblxuICAgICAgYWRkZWRDaGlsZHJlbi5zZXQoY2FjaGVLZXksIHJlbmRlclJlc3VsdCk7XG4gICAgICB0aGlzLmFkZENoaWxkKG5vZGUpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBub2RlcyBubyBsb25nZXIgaW4gdGhlIGZyYWdtZW50XG4gICAgbGV0IGNoaWxkcmVuVG9EZXN0cm95ID0gW107XG4gICAgZm9yIChsZXQgWyBjYWNoZUtleSwgY2hpbGROb2RlIF0gb2YgdGhpcy5jaGlsZE5vZGVzKSB7XG4gICAgICBsZXQgaGFzQ2hpbGQgPSBhZGRlZENoaWxkcmVuLmhhcyhjYWNoZUtleSk7XG4gICAgICBpZiAoIWhhc0NoaWxkKSB7XG4gICAgICAgIC8vIFRoaXMgbm9kZSB3YXMgZGVzdHJveWVkXG4gICAgICAgIGNoaWxkcmVuVG9EZXN0cm95LnB1c2goY2hpbGROb2RlKTtcbiAgICAgICAgdGhpcy5yZW1vdmVDaGlsZChjaGlsZE5vZGUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGFkZGVkQ2hpbGRyZW4uY2xlYXIoKTtcblxuICAgIC8vIE5vdyB0aGF0IGNoaWxkcmVuIHRvIGRlc3Ryb3kgaGF2ZVxuICAgIC8vIGJlZW4gY29sbGVjdGVkLCBwbGVhc2UgZGVzdHJveSB0aGVtXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gY2hpbGRyZW5Ub0Rlc3Ryb3kubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGNoaWxkTm9kZSA9IGNoaWxkcmVuVG9EZXN0cm95W2ldO1xuICAgICAgZGVzdHJveVByb21pc2VzLnB1c2goY2hpbGROb2RlLmRlc3Ryb3koKSk7XG4gICAgfVxuXG4gICAgaWYgKGRlc3Ryb3lQcm9taXNlcy5sZW5ndGggPiAwKVxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICAvLyBGcmFnbWVudHMgY2FuIG5vdCBiZSBkZXN0cm95ZWQgZnJvbSB0aGUgRE9NXG4gICAgaWYgKG5vZGUgPT09IHRoaXMpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoIXRoaXMucGFyZW50Tm9kZSlcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnBhcmVudE5vZGUuZGVzdHJveUZyb21ET00oY29udGV4dCwgbm9kZSk7XG4gIH1cblxuICBhc3luYyBzeW5jRE9NKF9jb250ZXh0LCBfbm9kZSkge1xuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgbGV0IGNvbnRleHQgPSBfY29udGV4dDtcbiAgICBsZXQgbm9kZSA9IF9ub2RlO1xuICAgIGlmIChub2RlID09PSB0aGlzKSB7XG4gICAgICBjb250ZXh0ID0gdGhpcy5wYXJlbnROb2RlLmNvbnRleHQ7XG4gICAgICBub2RlID0gdGhpcy5wYXJlbnROb2RlO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnBhcmVudE5vZGUuc3luY0RPTShjb250ZXh0LCBub2RlKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtcbiAgSmlicyxcbiAgUmVuZGVyZXJzLFxufSBmcm9tICdqaWJzJztcblxuY29uc3Qge1xuICBKSUJfUFJPWFksXG59ID0gSmlicztcblxuY29uc3Qge1xuICBSb290Tm9kZSxcbn0gPSBSZW5kZXJlcnM7XG5cbmV4cG9ydCBjbGFzcyBOYXRpdmVOb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICBzdGF0aWMgVFlQRSA9IDE7XG5cbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHN1cGVyKC4uLmFyZ3MpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgJ2ZyYWdtZW50Tm9kZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmRlc3Ryb3lpbmcgPSB0cnVlO1xuICAgIGF3YWl0IHRoaXMuZGVzdHJveUZyYWdtZW50Tm9kZSgpO1xuXG4gICAgcmV0dXJuIGF3YWl0IHN1cGVyLmRlc3Ryb3kodHJ1ZSk7XG4gIH1cblxuICBhc3luYyBkZXN0cm95RnJhZ21lbnROb2RlKCkge1xuICAgIGlmICghdGhpcy5mcmFnbWVudE5vZGUpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLnJlbW92ZUNoaWxkKHRoaXMuZnJhZ21lbnROb2RlKTtcblxuICAgIGF3YWl0IHRoaXMuZnJhZ21lbnROb2RlLmRlc3Ryb3koKTtcbiAgICB0aGlzLmZyYWdtZW50Tm9kZSA9IG51bGw7XG4gIH1cblxuICBhc3luYyBfcmVuZGVyKCkge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICBsZXQge1xuICAgICAgVHlwZSxcbiAgICAgIHByb3BzLFxuICAgICAgY2hpbGRyZW4sXG4gICAgfSA9ICh0aGlzLmppYiB8fCB7fSk7XG5cbiAgICBpZiAoIVR5cGUpXG4gICAgICByZXR1cm47XG5cbiAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChwcm9wcywgJ2lubmVySFRNTCcpKSB7XG4gICAgICBsZXQgZnJhZ21lbnRKaWIgPSB7IFR5cGU6IEpJQl9QUk9YWSwgcHJvcHM6IHt9LCBjaGlsZHJlbiB9O1xuICAgICAgbGV0IGZyYWdtZW50Tm9kZSA9IHRoaXMuZnJhZ21lbnROb2RlO1xuXG4gICAgICBpZiAoIWZyYWdtZW50Tm9kZSkge1xuICAgICAgICBmcmFnbWVudE5vZGUgPSB0aGlzLmZyYWdtZW50Tm9kZSA9IHRoaXMucmVuZGVyZXIuY29uc3RydWN0Tm9kZUZyb21KaWIoZnJhZ21lbnRKaWIsIHRoaXMsIHRoaXMuY29udGV4dCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoZnJhZ21lbnROb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZnJhZ21lbnROb2RlLnVwZGF0ZUppYihmcmFnbWVudEppYik7XG4gICAgICB9XG5cbiAgICAgIGF3YWl0IGZyYWdtZW50Tm9kZS5yZW5kZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5kZXN0cm95RnJhZ21lbnROb2RlKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBOYXRpdmVOb2RlIH0gZnJvbSAnLi9uYXRpdmUtbm9kZS5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQb3J0YWxOb2RlIGV4dGVuZHMgTmF0aXZlTm9kZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1tYWdpYy1udW1iZXJzXG4gIHN0YXRpYyBUWVBFID0gMTU7XG59XG4iLCJpbXBvcnQge1xuICBSZW5kZXJlcnMsXG59IGZyb20gJ2ppYnMnO1xuXG5jb25zdCB7XG4gIFJvb3ROb2RlLFxufSA9IFJlbmRlcmVycztcblxuZXhwb3J0IGNsYXNzIFRleHROb2RlIGV4dGVuZHMgUm9vdE5vZGUge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tbWFnaWMtbnVtYmVyc1xuICBzdGF0aWMgVFlQRSA9IDM7XG5cbiAgc3RhdGljIEhBU19DT05URVhUID0gZmFsc2U7XG59XG4iLCIvKioqKioqLyB2YXIgX193ZWJwYWNrX21vZHVsZXNfXyA9ICh7XG5cbi8qKiovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgX191bnVzZWRfd2VicGFja19leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cbi8vIENvcHlyaWdodCAyMDIyIFd5YXR0IEdyZWVud2F5XG5cblxuXG5jb25zdCB0aGlzR2xvYmFsID0gKCh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgPyB3aW5kb3cgOiBfX3dlYnBhY2tfcmVxdWlyZV9fLmcpIHx8IHRoaXM7XG5jb25zdCBERUFEQkVFRl9SRUZfTUFQX0tFWSA9IFN5bWJvbC5mb3IoJ0BAZGVhZGJlZWZSZWZNYXAnKTtcbmNvbnN0IFVOSVFVRV9JRF9TWU1CT0wgPSBTeW1ib2wuZm9yKCdAQGRlYWRiZWVmVW5pcXVlSUQnKTtcbmNvbnN0IHJlZk1hcCA9ICh0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSkgPyB0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSA6IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBpZEhlbHBlcnMgPSBbXTtcblxuaWYgKCF0aGlzR2xvYmFsW0RFQURCRUVGX1JFRl9NQVBfS0VZXSlcbiAgdGhpc0dsb2JhbFtERUFEQkVFRl9SRUZfTUFQX0tFWV0gPSByZWZNYXA7XG5cbmxldCB1dWlkQ291bnRlciA9IDBuO1xuXG5mdW5jdGlvbiBnZXRIZWxwZXJGb3JWYWx1ZSh2YWx1ZSkge1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBpZEhlbHBlcnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCB7IGhlbHBlciwgZ2VuZXJhdG9yIH0gPSBpZEhlbHBlcnNbaV07XG4gICAgaWYgKGhlbHBlcih2YWx1ZSkpXG4gICAgICByZXR1cm4gZ2VuZXJhdG9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFueXRoaW5nVG9JRChfYXJnLCBfYWxyZWFkeVZpc2l0ZWQpIHtcbiAgbGV0IGFyZyA9IF9hcmc7XG4gIGlmIChhcmcgaW5zdGFuY2VvZiBOdW1iZXIgfHwgYXJnIGluc3RhbmNlb2YgU3RyaW5nIHx8IGFyZyBpbnN0YW5jZW9mIEJvb2xlYW4pXG4gICAgYXJnID0gYXJnLnZhbHVlT2YoKTtcblxuICBsZXQgdHlwZU9mID0gdHlwZW9mIGFyZztcblxuICBpZiAodHlwZU9mID09PSAnbnVtYmVyJyAmJiBhcmcgPT09IDApIHtcbiAgICBpZiAoT2JqZWN0LmlzKGFyZywgLTApKVxuICAgICAgcmV0dXJuICdudW1iZXI6LTAnO1xuXG4gICAgcmV0dXJuICdudW1iZXI6KzAnO1xuICB9XG5cbiAgaWYgKHR5cGVPZiA9PT0gJ3N5bWJvbCcpXG4gICAgcmV0dXJuIGBzeW1ib2w6JHthcmcudG9TdHJpbmcoKX1gO1xuXG4gIGlmIChhcmcgPT0gbnVsbCB8fCB0eXBlT2YgPT09ICdudW1iZXInIHx8IHR5cGVPZiA9PT0gJ2Jvb2xlYW4nIHx8IHR5cGVPZiA9PT0gJ3N0cmluZycgfHwgdHlwZU9mID09PSAnYmlnaW50Jykge1xuICAgIGlmICh0eXBlT2YgPT09ICdudW1iZXInKVxuICAgICAgcmV0dXJuIChhcmcgPCAwKSA/IGBudW1iZXI6JHthcmd9YCA6IGBudW1iZXI6KyR7YXJnfWA7XG5cbiAgICBpZiAodHlwZU9mID09PSAnYmlnaW50JyAmJiBhcmcgPT09IDBuKVxuICAgICAgcmV0dXJuICdiaWdpbnQ6KzAnO1xuXG4gICAgcmV0dXJuIGAke3R5cGVPZn06JHthcmd9YDtcbiAgfVxuXG4gIGxldCBpZEhlbHBlciA9IChpZEhlbHBlcnMubGVuZ3RoID4gMCAmJiBnZXRIZWxwZXJGb3JWYWx1ZShhcmcpKTtcbiAgaWYgKGlkSGVscGVyKVxuICAgIHJldHVybiBhbnl0aGluZ1RvSUQoaWRIZWxwZXIoYXJnKSk7XG5cbiAgaWYgKFVOSVFVRV9JRF9TWU1CT0wgaW4gYXJnICYmIHR5cGVvZiBhcmdbVU5JUVVFX0lEX1NZTUJPTF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBQcmV2ZW50IGluZmluaXRlIHJlY3Vyc2lvblxuICAgIGlmICghX2FscmVhZHlWaXNpdGVkIHx8ICFfYWxyZWFkeVZpc2l0ZWQuaGFzKGFyZykpIHtcbiAgICAgIGxldCBhbHJlYWR5VmlzaXRlZCA9IF9hbHJlYWR5VmlzaXRlZCB8fCBuZXcgU2V0KCk7XG4gICAgICBhbHJlYWR5VmlzaXRlZC5hZGQoYXJnKTtcbiAgICAgIHJldHVybiBhbnl0aGluZ1RvSUQoYXJnW1VOSVFVRV9JRF9TWU1CT0xdKCksIGFscmVhZHlWaXNpdGVkKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXJlZk1hcC5oYXMoYXJnKSkge1xuICAgIGxldCBrZXkgPSBgJHt0eXBlb2YgYXJnfTokeysrdXVpZENvdW50ZXJ9YDtcbiAgICByZWZNYXAuc2V0KGFyZywga2V5KTtcbiAgICByZXR1cm4ga2V5O1xuICB9XG5cbiAgcmV0dXJuIHJlZk1hcC5nZXQoYXJnKTtcbn1cblxuZnVuY3Rpb24gZGVhZGJlZWYoKSB7XG4gIGxldCBwYXJ0cyA9IFsgYXJndW1lbnRzLmxlbmd0aCBdO1xuICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICBwYXJ0cy5wdXNoKGFueXRoaW5nVG9JRChhcmd1bWVudHNbaV0pKTtcblxuICByZXR1cm4gcGFydHMuam9pbignOicpO1xufVxuXG5mdW5jdGlvbiBkZWFkYmVlZlNvcnRlZCgpIHtcbiAgbGV0IHBhcnRzID0gWyBhcmd1bWVudHMubGVuZ3RoIF07XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxuICAgIHBhcnRzLnB1c2goYW55dGhpbmdUb0lEKGFyZ3VtZW50c1tpXSkpO1xuXG4gIHJldHVybiBwYXJ0cy5zb3J0KCkuam9pbignOicpO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUlERm9yKGhlbHBlciwgZ2VuZXJhdG9yKSB7XG4gIGlkSGVscGVycy5wdXNoKHsgaGVscGVyLCBnZW5lcmF0b3IgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUlER2VuZXJhdG9yKGhlbHBlcikge1xuICBsZXQgaW5kZXggPSBpZEhlbHBlcnMuZmluZEluZGV4KChpdGVtKSA9PiAoaXRlbS5oZWxwZXIgPT09IGhlbHBlcikpO1xuICBpZiAoaW5kZXggPCAwKVxuICAgIHJldHVybjtcblxuICBpZEhlbHBlcnMuc3BsaWNlKGluZGV4LCAxKTtcbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoZGVhZGJlZWYsIHtcbiAgJ2lkU3ltJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIFVOSVFVRV9JRF9TWU1CT0wsXG4gIH0sXG4gICdzb3J0ZWQnOiB7XG4gICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAgICAgICAgZGVhZGJlZWZTb3J0ZWQsXG4gIH0sXG4gICdnZW5lcmF0ZUlERm9yJzoge1xuICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogICAgICAgIGdlbmVyYXRlSURGb3IsXG4gIH0sXG4gICdyZW1vdmVJREdlbmVyYXRvcic6IHtcbiAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6ICAgICAgICByZW1vdmVJREdlbmVyYXRvcixcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYWRiZWVmO1xuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL2NvbXBvbmVudC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvY29tcG9uZW50LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNvbXBvbmVudFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBDb21wb25lbnQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkZMVVNIX1VQREFURV9NRVRIT0RcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gRkxVU0hfVVBEQVRFX01FVEhPRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSU5JVF9NRVRIT0RcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSU5JVF9NRVRIT0QpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkxBU1RfUkVOREVSX1RJTUVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gTEFTVF9SRU5ERVJfVElNRSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUEVORElOR19TVEFURV9VUERBVEVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUEVORElOR19TVEFURV9VUERBVEUpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlBSRVZJT1VTX1NUQVRFXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFBSRVZJT1VTX1NUQVRFKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJRVUVVRV9VUERBVEVfTUVUSE9EXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFFVRVVFX1VQREFURV9NRVRIT0QpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlNLSVBfU1RBVEVfVVBEQVRFU1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBTS0lQX1NUQVRFX1VQREFURVMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlRlcm1cIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gVGVybSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiVVBEQVRFX0VWRU5UXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFVQREFURV9FVkVOVClcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXZlbnRzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V2ZW50cy5qcyAqLyBcIi4vbGliL2V2ZW50cy5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbHMuanMgKi8gXCIuL2xpYi91dGlscy5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2ppYi5qcyAqLyBcIi4vbGliL2ppYi5qc1wiKTtcbi8qIGdsb2JhbCBCdWZmZXIgKi9cblxuXG5cblxuXG5cbmNvbnN0IFVQREFURV9FVkVOVCAgICAgICAgICAgICAgPSAnQGppYnMvY29tcG9uZW50L2V2ZW50L3VwZGF0ZSc7XG5jb25zdCBRVUVVRV9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3F1ZXVlVXBkYXRlJyk7XG5jb25zdCBGTFVTSF9VUERBVEVfTUVUSE9EICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L2ZsdXNoVXBkYXRlJyk7XG5jb25zdCBJTklUX01FVEhPRCAgICAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L19faW5pdCcpO1xuY29uc3QgU0tJUF9TVEFURV9VUERBVEVTICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9za2lwU3RhdGVVcGRhdGVzJyk7XG5jb25zdCBQRU5ESU5HX1NUQVRFX1VQREFURSAgICAgID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3BlbmRpbmdTdGF0ZVVwZGF0ZScpO1xuY29uc3QgTEFTVF9SRU5ERVJfVElNRSAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9sYXN0UmVuZGVyVGltZScpO1xuY29uc3QgUFJFVklPVVNfU1RBVEUgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzL2NvbXBvbmVudC9wcmV2aW91c1N0YXRlJyk7XG5jb25zdCBDQVBUVVJFX1JFRkVSRU5DRV9NRVRIT0RTID0gU3ltYm9sLmZvcignQGppYnMvY29tcG9uZW50L3ByZXZpb3VzU3RhdGUnKTtcblxuY29uc3QgZWxlbWVudERhdGFDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5cbmZ1bmN0aW9uIGlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgTmFOKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCb29sZWFuIHx8IHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyIHx8IHZhbHVlIGluc3RhbmNlb2YgU3RyaW5nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBsZXQgdHlwZU9mID0gdHlwZW9mIHZhbHVlO1xuICBpZiAodHlwZU9mID09PSAnc3RyaW5nJyB8fCB0eXBlT2YgPT09ICdudW1iZXInIHx8IHR5cGVPZiA9PT0gJ2Jvb2xlYW4nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmICh0eXBlb2YgQnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJiBCdWZmZXIuaXNCdWZmZXIodmFsdWUpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgX2V2ZW50c19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLkV2ZW50RW1pdHRlciB7XG4gIHN0YXRpYyBVUERBVEVfRVZFTlQgPSBVUERBVEVfRVZFTlQ7XG5cbiAgW1FVRVVFX1VQREFURV9NRVRIT0RdKCkge1xuICAgIGlmICh0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXNbUEVORElOR19TVEFURV9VUERBVEVdID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgdGhpc1tQRU5ESU5HX1NUQVRFX1VQREFURV0udGhlbih0aGlzW0ZMVVNIX1VQREFURV9NRVRIT0RdLmJpbmQodGhpcykpO1xuICB9XG5cbiAgW0ZMVVNIX1VQREFURV9NRVRIT0RdKCkge1xuICAgIC8vIFdhcyB0aGUgc3RhdGUgdXBkYXRlIGNhbmNlbGxlZD9cbiAgICBpZiAoIXRoaXNbUEVORElOR19TVEFURV9VUERBVEVdKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5lbWl0KFVQREFURV9FVkVOVCk7XG5cbiAgICB0aGlzW1BFTkRJTkdfU1RBVEVfVVBEQVRFXSA9IG51bGw7XG4gIH1cblxuICBbSU5JVF9NRVRIT0RdKCkge1xuICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IGZhbHNlO1xuICB9XG5cbiAgY29uc3RydWN0b3IoX2ppYikge1xuICAgIHN1cGVyKCk7XG5cbiAgICAvLyBCaW5kIGFsbCBjbGFzcyBtZXRob2RzIHRvIFwidGhpc1wiXG4gICAgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uYmluZE1ldGhvZHMuY2FsbCh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yLnByb3RvdHlwZSk7XG5cbiAgICBsZXQgamliID0gX2ppYiB8fCB7fTtcblxuICAgIGNvbnN0IGNyZWF0ZU5ld1N0YXRlID0gKCkgPT4ge1xuICAgICAgbGV0IGxvY2FsU3RhdGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgICByZXR1cm4gbmV3IFByb3h5KGxvY2FsU3RhdGUsIHtcbiAgICAgICAgZ2V0OiAodGFyZ2V0LCBwcm9wTmFtZSkgPT4ge1xuICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3BOYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgIGxldCBjdXJyZW50VmFsdWUgPSB0YXJnZXRbcHJvcE5hbWVdO1xuICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUgPT09IHZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICBpZiAoIXRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSlcbiAgICAgICAgICAgIHRoaXNbUVVFVUVfVVBEQVRFX01FVEhPRF0oKTtcblxuICAgICAgICAgIHRhcmdldFtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICB0aGlzLm9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCB2YWx1ZSwgY3VycmVudFZhbHVlKTtcblxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxldCBwcm9wcyAgICAgICA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmNyZWF0ZShudWxsKSwgamliLnByb3BzIHx8IHt9KTtcbiAgICBsZXQgX2xvY2FsU3RhdGUgPSBjcmVhdGVOZXdTdGF0ZSgpO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgICAgW1NLSVBfU1RBVEVfVVBEQVRFU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBbUEVORElOR19TVEFURV9VUERBVEVdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFByb21pc2UucmVzb2x2ZSgpLFxuICAgICAgfSxcbiAgICAgIFtMQVNUX1JFTkRFUl9USU1FXToge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5ub3coKSxcbiAgICAgIH0sXG4gICAgICBbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU106IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAge30sXG4gICAgICB9LFxuICAgICAgJ2lkJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGppYi5pZCxcbiAgICAgIH0sXG4gICAgICAncHJvcHMnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHByb3BzLFxuICAgICAgfSxcbiAgICAgICdjaGlsZHJlbic6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgamliLmNoaWxkcmVuIHx8IFtdLFxuICAgICAgfSxcbiAgICAgICdjb250ZXh0Jzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIuY29udGV4dCB8fCBPYmplY3QuY3JlYXRlKG51bGwpLFxuICAgICAgfSxcbiAgICAgICdzdGF0ZSc6IHtcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICBnZXQ6ICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICByZXR1cm4gX2xvY2FsU3RhdGU7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogICAgICAgICAgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCFpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgXCJ0aGlzLnN0YXRlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbihfbG9jYWxTdGF0ZSwgdmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHJlc29sdmVDaGlsZHJlbihjaGlsZHJlbikge1xuICAgIHJldHVybiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18ucmVzb2x2ZUNoaWxkcmVuLmNhbGwodGhpcywgY2hpbGRyZW4pO1xuICB9XG5cbiAgaXNKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLmlzSmliaXNoKSh2YWx1ZSk7XG4gIH1cblxuICBjb25zdHJ1Y3RKaWIodmFsdWUpIHtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLmNvbnN0cnVjdEppYikodmFsdWUpO1xuICB9XG5cbiAgcHVzaFJlbmRlcihyZW5kZXJSZXN1bHQpIHtcbiAgICB0aGlzLmVtaXQoVVBEQVRFX0VWRU5ULCByZW5kZXJSZXN1bHQpO1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uUHJvcFVwZGF0ZWQocHJvcE5hbWUsIG5ld1ZhbHVlLCBvbGRWYWx1ZSkge1xuICB9XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gIG9uU3RhdGVVcGRhdGVkKHByb3BOYW1lLCBuZXdWYWx1ZSwgb2xkVmFsdWUpIHtcbiAgfVxuXG4gIGNhcHR1cmVSZWZlcmVuY2UobmFtZSwgaW50ZXJjZXB0b3JDYWxsYmFjaykge1xuICAgIGxldCBtZXRob2QgPSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdW25hbWVdO1xuICAgIGlmIChtZXRob2QpXG4gICAgICByZXR1cm4gbWV0aG9kO1xuXG4gICAgbWV0aG9kID0gKF9yZWYsIHByZXZpb3VzUmVmKSA9PiB7XG4gICAgICBsZXQgcmVmID0gX3JlZjtcblxuICAgICAgaWYgKHR5cGVvZiBpbnRlcmNlcHRvckNhbGxiYWNrID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZWYgPSBpbnRlcmNlcHRvckNhbGxiYWNrLmNhbGwodGhpcywgcmVmLCBwcmV2aW91c1JlZik7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICAgW25hbWVdOiB7XG4gICAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgcmVmLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgaW50ZXJjZXB0b3JDYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRoaXNbQ0FQVFVSRV9SRUZFUkVOQ0VfTUVUSE9EU10gPSBtZXRob2Q7XG5cbiAgICByZXR1cm4gbWV0aG9kO1xuICB9XG5cbiAgZm9yY2VVcGRhdGUoKSB7XG4gICAgdGhpc1tRVUVVRV9VUERBVEVfTUVUSE9EXSgpO1xuICB9XG5cbiAgZ2V0U3RhdGUocHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgICBsZXQgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIHN0YXRlO1xuXG4gICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocHJvcGVydHlQYXRoLCAnb2JqZWN0JykpIHtcbiAgICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKHByb3BlcnR5UGF0aCkuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocHJvcGVydHlQYXRoKSk7XG4gICAgICBsZXQgZmluYWxTdGF0ZSAgPSB7fTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgIGxldCBrZXkgPSBrZXlzW2ldO1xuICAgICAgICBsZXQgWyB2YWx1ZSwgbGFzdFBhcnQgXSA9IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmZldGNoRGVlcFByb3BlcnR5KHN0YXRlLCBrZXksIHByb3BlcnR5UGF0aFtrZXldLCB0cnVlKTtcbiAgICAgICAgaWYgKGxhc3RQYXJ0ID09IG51bGwpXG4gICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgZmluYWxTdGF0ZVtsYXN0UGFydF0gPSB2YWx1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZpbmFsU3RhdGU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5mZXRjaERlZXBQcm9wZXJ0eShzdGF0ZSwgcHJvcGVydHlQYXRoLCBkZWZhdWx0VmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHNldFN0YXRlKHZhbHVlKSB7XG4gICAgaWYgKCFpc1ZhbGlkU3RhdGVPYmplY3QodmFsdWUpKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgSW52YWxpZCB2YWx1ZSBmb3IgXCJ0aGlzLnNldFN0YXRlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnN0YXRlLCB2YWx1ZSk7XG4gIH1cblxuICBzZXRTdGF0ZVBhc3NpdmUodmFsdWUpIHtcbiAgICBpZiAoIWlzVmFsaWRTdGF0ZU9iamVjdCh2YWx1ZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBJbnZhbGlkIHZhbHVlIGZvciBcInRoaXMuc2V0U3RhdGVQYXNzaXZlXCI6IFwiJHt2YWx1ZX1cIi4gUHJvdmlkZWQgXCJzdGF0ZVwiIG11c3QgYmUgYW4gaXRlcmFibGUgb2JqZWN0LmApO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXNbU0tJUF9TVEFURV9VUERBVEVTXSA9IHRydWU7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMuc3RhdGUsIHZhbHVlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpc1tTS0lQX1NUQVRFX1VQREFURVNdID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2hvdWxkVXBkYXRlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBkZWxldGUgdGhpcy5zdGF0ZTtcbiAgICBkZWxldGUgdGhpcy5wcm9wcztcbiAgICBkZWxldGUgdGhpcy5jb250ZXh0O1xuICAgIGRlbGV0ZSB0aGlzW0NBUFRVUkVfUkVGRVJFTkNFX01FVEhPRFNdO1xuICAgIHRoaXMuY2xlYXJBbGxEZWJvdW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcldhaXRpbmcoKSB7XG4gIH1cblxuICByZW5kZXIoY2hpbGRyZW4pIHtcbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICB1cGRhdGVkKCkge1xuICB9XG5cbiAgY29tYmluZVdpdGgoc2VwLCAuLi5hcmdzKSB7XG4gICAgbGV0IGZpbmFsQXJncyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBhcmdzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBhcmcgPSBhcmdzW2ldO1xuICAgICAgaWYgKCFhcmcpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihhcmcsICdzdHJpbmcnKSkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXJnLnNwbGl0KHNlcCkuZmlsdGVyKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmlzTm90RW1wdHkpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgICAgbGV0IHZhbHVlcyA9IGFyZy5maWx0ZXIoKHZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgIGlmICghX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZih2YWx1ZSwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmlzTm90RW1wdHkodmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSB2YWx1ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBmaW5hbEFyZ3MuYWRkKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGFyZywgJ29iamVjdCcpKSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMoYXJnKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAgICAgbGV0IGtleSAgID0ga2V5c1tpXTtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBhcmdba2V5XTtcblxuICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIGZpbmFsQXJncy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZpbmFsQXJncy5hZGQoa2V5KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBBcnJheS5mcm9tKGZpbmFsQXJncykuam9pbihzZXAgfHwgJycpO1xuICB9XG5cbiAgY2xhc3NlcyguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuY29tYmluZVdpdGgoJyAnLCAuLi5hcmdzKTtcbiAgfVxuXG4gIGV4dHJhY3RDaGlsZHJlbihfcGF0dGVybnMsIGNoaWxkcmVuLCBfb3B0aW9ucykge1xuICAgIGxldCBvcHRpb25zICAgPSBfb3B0aW9ucyB8fCB7fTtcbiAgICBsZXQgZXh0cmFjdGVkID0ge307XG4gICAgbGV0IHBhdHRlcm5zICA9IF9wYXR0ZXJucztcbiAgICBsZXQgaXNBcnJheSAgID0gQXJyYXkuaXNBcnJheShwYXR0ZXJucyk7XG5cbiAgICBjb25zdCBpc01hdGNoID0gKGppYikgPT4ge1xuICAgICAgbGV0IGppYlR5cGUgPSBqaWIuVHlwZTtcbiAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYgKGlzQXJyYXkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlsID0gcGF0dGVybnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgICAgIGxldCBwYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgICAgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcGF0dGVybiA9IHBhdHRlcm4udG9Mb3dlckNhc2UoKTtcblxuICAgICAgICAgIGlmIChqaWJUeXBlICE9PSBwYXR0ZXJuKVxuICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICBpZiAoZXh0cmFjdGVkW3BhdHRlcm5dICYmIG9wdGlvbnMubXVsdGlwbGUpIHtcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShleHRyYWN0ZWRbcGF0dGVybl0pKVxuICAgICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBbIGV4dHJhY3RlZFtwYXR0ZXJuXSBdO1xuXG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0ucHVzaChqaWIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHRyYWN0ZWRbcGF0dGVybl0gPSBqaWI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMocGF0dGVybnMpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgICBsZXQga2V5ICAgICA9IGtleXNbaV07XG4gICAgICAgICAgbGV0IHBhdHRlcm4gPSBwYXR0ZXJuc1trZXldO1xuICAgICAgICAgIGxldCByZXN1bHQ7XG5cbiAgICAgICAgICBpZiAoX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaW5zdGFuY2VPZihwYXR0ZXJuLCBSZWdFeHApKVxuICAgICAgICAgICAgcmVzdWx0ID0gcGF0dGVybi50ZXN0KGppYlR5cGUpO1xuICAgICAgICAgIGVsc2UgaWYgKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLmluc3RhbmNlT2YocGF0dGVybiwgJ3N0cmluZycpKVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4udG9Mb3dlckNhc2UoKSA9PT0gamliVHlwZSk7XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmVzdWx0ID0gKHBhdHRlcm4gPT09IGppYlR5cGUpO1xuXG4gICAgICAgICAgaWYgKCFyZXN1bHQpXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIGlmIChleHRyYWN0ZWRbcGF0dGVybl0gJiYgb3B0aW9ucy5tdWx0aXBsZSkge1xuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV4dHJhY3RlZFtwYXR0ZXJuXSkpXG4gICAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IFsgZXh0cmFjdGVkW3BhdHRlcm5dIF07XG5cbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXS5wdXNoKGppYik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4dHJhY3RlZFtwYXR0ZXJuXSA9IGppYjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIGV4dHJhY3RlZC5yZW1haW5pbmdDaGlsZHJlbiA9IGNoaWxkcmVuLmZpbHRlcigoamliKSA9PiAhaXNNYXRjaChqaWIpKTtcbiAgICByZXR1cm4gZXh0cmFjdGVkO1xuICB9XG5cbiAgbWFwQ2hpbGRyZW4ocGF0dGVybnMsIF9jaGlsZHJlbikge1xuICAgIGxldCBjaGlsZHJlbiA9ICghQXJyYXkuaXNBcnJheShfY2hpbGRyZW4pKSA/IFsgX2NoaWxkcmVuIF0gOiBfY2hpbGRyZW47XG5cbiAgICByZXR1cm4gY2hpbGRyZW4ubWFwKChqaWIpID0+IHtcbiAgICAgIGlmICghamliKVxuICAgICAgICByZXR1cm4gamliO1xuXG4gICAgICBsZXQgamliVHlwZSA9IGppYi5UeXBlO1xuICAgICAgaWYgKCFfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5pbnN0YW5jZU9mKGppYlR5cGUsICdzdHJpbmcnKSlcbiAgICAgICAgcmV0dXJuIGppYjtcblxuICAgICAgamliVHlwZSA9IGppYlR5cGUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgbGV0IGtleXMgPSBPYmplY3Qua2V5cyhwYXR0ZXJucyk7XG4gICAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgICAgbGV0IGtleSA9IGtleXNbaV07XG4gICAgICAgIGlmIChrZXkudG9Mb3dlckNhc2UoKSAhPT0gamliVHlwZSlcbiAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICBsZXQgbWV0aG9kID0gcGF0dGVybnNba2V5XTtcbiAgICAgICAgaWYgKCFtZXRob2QpXG4gICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5jYWxsKHRoaXMsIGppYiwgaSwgY2hpbGRyZW4pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gamliO1xuICAgIH0pO1xuICB9XG5cbiAgZGVib3VuY2UoZnVuYywgdGltZSwgX2lkKSB7XG4gICAgY29uc3QgY2xlYXJQZW5kaW5nVGltZW91dCA9ICgpID0+IHtcbiAgICAgIGlmIChwZW5kaW5nVGltZXIgJiYgcGVuZGluZ1RpbWVyLnRpbWVvdXQpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lci50aW1lb3V0KTtcbiAgICAgICAgcGVuZGluZ1RpbWVyLnRpbWVvdXQgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgaWQgPSAoIV9pZCkgPyAoJycgKyBmdW5jKSA6IF9pZDtcbiAgICBpZiAoIXRoaXMuZGVib3VuY2VUaW1lcnMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZGVib3VuY2VUaW1lcnMnLCB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHt9LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdO1xuICAgIGlmICghcGVuZGluZ1RpbWVyKVxuICAgICAgcGVuZGluZ1RpbWVyID0gdGhpcy5kZWJvdW5jZVRpbWVyc1tpZF0gPSB7fTtcblxuICAgIHBlbmRpbmdUaW1lci5mdW5jID0gZnVuYztcbiAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG5cbiAgICB2YXIgcHJvbWlzZSA9IHBlbmRpbmdUaW1lci5wcm9taXNlO1xuICAgIGlmICghcHJvbWlzZSB8fCAhcHJvbWlzZS5pc1BlbmRpbmcoKSkge1xuICAgICAgbGV0IHN0YXR1cyA9ICdwZW5kaW5nJztcbiAgICAgIGxldCByZXNvbHZlO1xuXG4gICAgICBwcm9taXNlID0gcGVuZGluZ1RpbWVyLnByb21pc2UgPSBuZXcgUHJvbWlzZSgoX3Jlc29sdmUpID0+IHtcbiAgICAgICAgcmVzb2x2ZSA9IF9yZXNvbHZlO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UucmVzb2x2ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gJ3BlbmRpbmcnKVxuICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBzdGF0dXMgPSAnZnVsZmlsbGVkJztcbiAgICAgICAgY2xlYXJQZW5kaW5nVGltZW91dCgpO1xuICAgICAgICB0aGlzLmRlYm91bmNlVGltZXJzW2lkXSA9IG51bGw7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBwZW5kaW5nVGltZXIuZnVuYyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHZhciByZXQgPSBwZW5kaW5nVGltZXIuZnVuYy5jYWxsKHRoaXMpO1xuICAgICAgICAgIGlmIChyZXQgaW5zdGFuY2VvZiBQcm9taXNlIHx8IChyZXQgJiYgdHlwZW9mIHJldC50aGVuID09PSAnZnVuY3Rpb24nKSlcbiAgICAgICAgICAgIHJldC50aGVuKCh2YWx1ZSkgPT4gcmVzb2x2ZSh2YWx1ZSkpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJlc29sdmUocmV0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuY2FuY2VsID0gKCkgPT4ge1xuICAgICAgICBzdGF0dXMgPSAncmVqZWN0ZWQnO1xuICAgICAgICBjbGVhclBlbmRpbmdUaW1lb3V0KCk7XG4gICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdID0gbnVsbDtcblxuICAgICAgICBwcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH07XG5cbiAgICAgIHByb21pc2UuaXNQZW5kaW5nID0gKCkgPT4ge1xuICAgICAgICByZXR1cm4gKHN0YXR1cyA9PT0gJ3BlbmRpbmcnKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICBwZW5kaW5nVGltZXIudGltZW91dCA9IHNldFRpbWVvdXQocHJvbWlzZS5yZXNvbHZlLCAodGltZSA9PSBudWxsKSA/IDI1MCA6IHRpbWUpO1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICBjbGVhckRlYm91bmNlKGlkKSB7XG4gICAgdmFyIHBlbmRpbmdUaW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnNbaWRdO1xuICAgIGlmIChwZW5kaW5nVGltZXIgPT0gbnVsbClcbiAgICAgIHJldHVybjtcblxuICAgIGlmIChwZW5kaW5nVGltZXIudGltZW91dClcbiAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZXIudGltZW91dCk7XG5cbiAgICBpZiAocGVuZGluZ1RpbWVyLnByb21pc2UpXG4gICAgICBwZW5kaW5nVGltZXIucHJvbWlzZS5jYW5jZWwoKTtcbiAgfVxuXG4gIGNsZWFyQWxsRGVib3VuY2VzKCkge1xuICAgIGxldCBkZWJvdW5jZVRpbWVycyAgPSB0aGlzLmRlYm91bmNlVGltZXJzIHx8IHt9O1xuICAgIGxldCBpZHMgICAgICAgICAgICAgPSBPYmplY3Qua2V5cyhkZWJvdW5jZVRpbWVycyk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBpZHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcbiAgICAgIHRoaXMuY2xlYXJEZWJvdW5jZShpZHNbaV0pO1xuICB9XG5cbiAgZ2V0RWxlbWVudERhdGEoZWxlbWVudCkge1xuICAgIGxldCBkYXRhID0gZWxlbWVudERhdGFDYWNoZS5nZXQoZWxlbWVudCk7XG4gICAgaWYgKCFkYXRhKSB7XG4gICAgICBkYXRhID0ge307XG4gICAgICBlbGVtZW50RGF0YUNhY2hlLnNldChlbGVtZW50LCBkYXRhKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIG1lbW9pemUoZnVuYykge1xuICAgIGxldCBjYWNoZUlEO1xuICAgIGxldCBjYWNoZWRSZXN1bHQ7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oLi4uYXJncykge1xuICAgICAgbGV0IG5ld0NhY2hlSUQgPSBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKC4uLmFyZ3MpO1xuICAgICAgaWYgKG5ld0NhY2hlSUQgIT09IGNhY2hlSUQpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cbiAgICAgICAgY2FjaGVJRCA9IG5ld0NhY2hlSUQ7XG4gICAgICAgIGNhY2hlZFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNhY2hlZFJlc3VsdDtcbiAgICB9O1xuICB9XG5cbiAgdG9UZXJtKHRlcm0pIHtcbiAgICBpZiAoKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLmlzSmliaXNoKSh0ZXJtKSkge1xuICAgICAgbGV0IGppYiA9ICgwLF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXy5jb25zdHJ1Y3RKaWIpKHRlcm0pO1xuXG4gICAgICBpZiAoamliLlR5cGUgPT09IFRlcm0pXG4gICAgICAgIHJldHVybiB0ZXJtO1xuXG4gICAgICBpZiAoamliLlR5cGUgJiYgamliLlR5cGVbVEVSTV9DT01QT05FTlRfVFlQRV9DSEVDS10pXG4gICAgICAgIHJldHVybiB0ZXJtO1xuXG4gICAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLiQpKFRlcm0sIGppYi5wcm9wcykoLi4uamliLmNoaWxkcmVuKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXJtID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuICgwLF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfXy4kKShUZXJtKSh0ZXJtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGVybTtcbiAgfVxufVxuXG5jb25zdCBURVJNX0NPTVBPTkVOVF9UWVBFX0NIRUNLID0gU3ltYm9sLmZvcignQGppYnMvaXNUZXJtJyk7XG5cbmNsYXNzIFRlcm0gZXh0ZW5kcyBDb21wb25lbnQge1xuICByZXNvbHZlVGVybShhcmdzKSB7XG4gICAgbGV0IHRlcm1SZXNvbHZlciA9IHRoaXMuY29udGV4dC5fdGVybVJlc29sdmVyO1xuICAgIGlmICh0eXBlb2YgdGVybVJlc29sdmVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIHRlcm1SZXNvbHZlci5jYWxsKHRoaXMsIGFyZ3MpO1xuXG4gICAgbGV0IGNoaWxkcmVuID0gKGFyZ3MuY2hpbGRyZW4gfHwgW10pO1xuICAgIHJldHVybiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSB8fCAnJztcbiAgfVxuXG4gIHJlbmRlcihjaGlsZHJlbikge1xuICAgIGxldCB0ZXJtID0gdGhpcy5yZXNvbHZlVGVybSh7IGNoaWxkcmVuLCBwcm9wczogdGhpcy5wcm9wcyB9KTtcbiAgICByZXR1cm4gKDAsX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fLiQpKCdTUEFOJywgdGhpcy5wcm9wcykodGVybSk7XG4gIH1cbn1cblxuVGVybVtURVJNX0NPTVBPTkVOVF9UWVBFX0NIRUNLXSA9IHRydWU7XG5cblxuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbGliL2V2ZW50cy5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvZXZlbnRzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJFdmVudEVtaXR0ZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gRXZlbnRFbWl0dGVyKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG5jb25zdCBFVkVOVF9MSVNURU5FUlMgPSBTeW1ib2wuZm9yKCdAamlicy9ldmVudHMvbGlzdGVuZXJzJyk7XG5cbmNsYXNzIEV2ZW50RW1pdHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgIFtFVkVOVF9MSVNURU5FUlNdOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgbmV3IE1hcCgpLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXZlbnQgbGlzdGVuZXIgbXVzdCBiZSBhIG1ldGhvZCcpO1xuXG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG5cbiAgICBpZiAoIXNjb3BlKSB7XG4gICAgICBzY29wZSA9IFtdO1xuICAgICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgc2NvcGUpO1xuICAgIH1cblxuICAgIHNjb3BlLnB1c2gobGlzdGVuZXIpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V2ZW50IGxpc3RlbmVyIG11c3QgYmUgYSBtZXRob2QnKTtcblxuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGxldCBpbmRleCA9IHNjb3BlLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpbmRleCA+PSAwKVxuICAgICAgc2NvcGUuc3BsaWNlKGluZGV4LCAxKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVtb3ZlQWxsTGlzdGVuZXJzKGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgaWYgKCFldmVudE1hcC5oYXMoZXZlbnROYW1lKSlcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgZXZlbnRNYXAuc2V0KGV2ZW50TmFtZSwgW10pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBlbWl0KGV2ZW50TmFtZSwgLi4uYXJncykge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUgfHwgc2NvcGUubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gc2NvcGUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgbGV0IGV2ZW50Q2FsbGJhY2sgPSBzY29wZVtpXTtcbiAgICAgIGV2ZW50Q2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvbmNlKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICBsZXQgZnVuYyA9ICguLi5hcmdzKSA9PiB7XG4gICAgICB0aGlzLm9mZihldmVudE5hbWUsIGZ1bmMpO1xuICAgICAgcmV0dXJuIGxpc3RlbmVyKC4uLmFyZ3MpO1xuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcy5vbihldmVudE5hbWUsIGZ1bmMpO1xuICB9XG5cbiAgb24oZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2ZW50TmFtZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgb2ZmKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICByZXR1cm4gdGhpcy5yZW1vdmVMaXN0ZW5lcihldmVudE5hbWUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIGV2ZW50TmFtZXMoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpc1tFVkVOVF9MSVNURU5FUlNdLmtleXMoKSk7XG4gIH1cblxuICBsaXN0ZW5lckNvdW50KGV2ZW50TmFtZSkge1xuICAgIGxldCBldmVudE1hcCAgPSB0aGlzW0VWRU5UX0xJU1RFTkVSU107XG4gICAgbGV0IHNjb3BlICAgICA9IGV2ZW50TWFwLmdldChldmVudE5hbWUpO1xuICAgIGlmICghc2NvcGUpXG4gICAgICByZXR1cm4gMDtcblxuICAgIHJldHVybiBzY29wZS5sZW5ndGg7XG4gIH1cblxuICBsaXN0ZW5lcnMoZXZlbnROYW1lKSB7XG4gICAgbGV0IGV2ZW50TWFwICA9IHRoaXNbRVZFTlRfTElTVEVORVJTXTtcbiAgICBsZXQgc2NvcGUgICAgID0gZXZlbnRNYXAuZ2V0KGV2ZW50TmFtZSk7XG4gICAgaWYgKCFzY29wZSlcbiAgICAgIHJldHVybiBbXTtcblxuICAgIHJldHVybiBzY29wZS5zbGljZSgpO1xuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvamliLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9qaWIuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIiRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gJCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX0JBUlJFTlwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBKSUJfQkFSUkVOKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJKSUJfQ0hJTERfSU5ERVhfUFJPUFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBKSUJfQ0hJTERfSU5ERVhfUFJPUCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX1BST1hZXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9QUk9YWSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSklCX1JBV19URVhUXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEpJQl9SQVdfVEVYVCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiSmliXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIEppYiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiY29uc3RydWN0SmliXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGNvbnN0cnVjdEppYiksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiZmFjdG9yeVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBmYWN0b3J5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc0ppYmlzaFwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc0ppYmlzaCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwicmVzb2x2ZUNoaWxkcmVuXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIHJlc29sdmVDaGlsZHJlbilcbi8qIGhhcm1vbnkgZXhwb3J0ICovIH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGRlYWRiZWVmX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBkZWFkYmVlZiAqLyBcIi4vbm9kZV9tb2R1bGVzL2RlYWRiZWVmL2xpYi9pbmRleC5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbHMuanMgKi8gXCIuL2xpYi91dGlscy5qc1wiKTtcblxuXG5cbmNsYXNzIEppYiB7XG4gIGNvbnN0cnVjdG9yKFR5cGUsIHByb3BzLCBjaGlsZHJlbikge1xuICAgIGxldCBkZWZhdWx0UHJvcHMgPSAoVHlwZSAmJiBUeXBlLnByb3BzKSA/IFR5cGUucHJvcHMgOiB7fTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUeXBlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIFR5cGUsXG4gICAgICB9LFxuICAgICAgJ3Byb3BzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHsgW0pJQl9DSElMRF9JTkRFWF9QUk9QXTogMCwgLi4uZGVmYXVsdFByb3BzLCAuLi4ocHJvcHMgfHwge30pIH0sXG4gICAgICB9LFxuICAgICAgJ2NoaWxkcmVuJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmZsYXR0ZW5BcnJheShjaGlsZHJlbiksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbmNvbnN0IEpJQl9CQVJSRU4gICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMuYmFycmVuJyk7XG5jb25zdCBKSUJfUFJPWFkgICAgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLnByb3h5Jyk7XG5jb25zdCBKSUJfUkFXX1RFWFQgICAgICAgICA9IFN5bWJvbC5mb3IoJ0BqaWJzLnJhd1RleHQnKTtcbmNvbnN0IEpJQiAgICAgICAgICAgICAgICAgID0gU3ltYm9sLmZvcignQGppYnMuamliJyk7XG5jb25zdCBKSUJfQ0hJTERfSU5ERVhfUFJPUCA9IFN5bWJvbC5mb3IoJ0BqaWJzLmNoaWxkSW5kZXhQcm9wJyk7XG5cbmZ1bmN0aW9uIGZhY3RvcnkoSmliQ2xhc3MpIHtcbiAgZnVuY3Rpb24gJChfdHlwZSwgcHJvcHMgPSB7fSkge1xuICAgIGlmIChpc0ppYmlzaChfdHlwZSkpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdSZWNlaXZlZCBhIGppYiBidXQgZXhwZWN0ZWQgYSBjb21wb25lbnQuJyk7XG5cbiAgICBsZXQgVHlwZSA9IChfdHlwZSA9PSBudWxsKSA/IEpJQl9QUk9YWSA6IF90eXBlO1xuXG4gICAgZnVuY3Rpb24gYmFycmVuKC4uLl9jaGlsZHJlbikge1xuICAgICAgbGV0IGNoaWxkcmVuID0gX2NoaWxkcmVuO1xuXG4gICAgICBmdW5jdGlvbiBqaWIoKSB7XG4gICAgICAgIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKFR5cGUsICdwcm9taXNlJykgfHwgY2hpbGRyZW4uc29tZSgoY2hpbGQpID0+IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoY2hpbGQsICdwcm9taXNlJykpKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFsgVHlwZSBdLmNvbmNhdChjaGlsZHJlbikpLnRoZW4oKGFsbCkgPT4ge1xuICAgICAgICAgICAgVHlwZSA9IGFsbFswXTtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYWxsLnNsaWNlKDEpO1xuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEppYkNsYXNzKFxuICAgICAgICAgICAgICBUeXBlLFxuICAgICAgICAgICAgICBwcm9wcyxcbiAgICAgICAgICAgICAgY2hpbGRyZW4sXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBKaWJDbGFzcyhcbiAgICAgICAgICBUeXBlLFxuICAgICAgICAgIHByb3BzLFxuICAgICAgICAgIGNoaWxkcmVuLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhqaWIsIHtcbiAgICAgICAgW0pJQl06IHtcbiAgICAgICAgICB3cml0YWJsZTogICAgIGZhbHNlLFxuICAgICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB2YWx1ZTogICAgICAgIHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIFtkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmlkU3ltXToge1xuICAgICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiAgICAgICAgKCkgPT4gVHlwZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gamliO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGJhcnJlbiwge1xuICAgICAgW0pJQl9CQVJSRU5dOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiAgICAgICAgdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBbZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5pZFN5bV06IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICAoKSA9PiBUeXBlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBiYXJyZW47XG4gIH1cblxuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcygkLCB7XG4gICAgJ3JlbWFwJzoge1xuICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgdmFsdWU6ICAgICAgICAoX2ppYiwgY2FsbGJhY2spID0+IHtcbiAgICAgICAgbGV0IGppYiA9IF9qaWI7XG4gICAgICAgIGlmIChqaWIgPT0gbnVsbCB8fCBPYmplY3QuaXMoamliLCBJbmZpbml0eSkgfHwgT2JqZWN0LmlzKGppYiwgTmFOKSlcbiAgICAgICAgICByZXR1cm4gamliO1xuXG4gICAgICAgIGlmIChpc0ppYmlzaChqaWIpKVxuICAgICAgICAgIGppYiA9IGNvbnN0cnVjdEppYihqaWIpO1xuXG4gICAgICAgIGxldCBtYXBwZWRKaWIgPSBjYWxsYmFjayhqaWIpO1xuICAgICAgICBpZiAoaXNKaWJpc2gobWFwcGVkSmliKSlcbiAgICAgICAgICBtYXBwZWRKaWIgPSBjb25zdHJ1Y3RKaWIobWFwcGVkSmliKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiBtYXBwZWRKaWI7XG5cbiAgICAgICAgcmV0dXJuICQobWFwcGVkSmliLlR5cGUsIG1hcHBlZEppYi5wcm9wcykoLi4uKG1hcHBlZEppYi5jaGlsZHJlbiB8fCBbXSkpO1xuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gJDtcbn1cblxuY29uc3QgJCA9IGZhY3RvcnkoSmliKTtcblxuZnVuY3Rpb24gaXNKaWJpc2godmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiAodmFsdWVbSklCX0JBUlJFTl0gfHwgdmFsdWVbSklCXSkpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgSmliKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0SmliKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEppYilcbiAgICByZXR1cm4gdmFsdWU7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmICh2YWx1ZVtKSUJfQkFSUkVOXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpKCk7XG4gICAgZWxzZSBpZiAodmFsdWVbSklCXSlcbiAgICAgIHJldHVybiB2YWx1ZSgpO1xuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcignY29uc3RydWN0SmliOiBQcm92aWRlZCB2YWx1ZSBpcyBub3QgYSBKaWIuJyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVDaGlsZHJlbihfY2hpbGRyZW4pIHtcbiAgbGV0IGNoaWxkcmVuID0gX2NoaWxkcmVuO1xuXG4gIGlmIChfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pbnN0YW5jZU9mKGNoaWxkcmVuLCAncHJvbWlzZScpKVxuICAgIGNoaWxkcmVuID0gYXdhaXQgY2hpbGRyZW47XG5cbiAgaWYgKCEoKHRoaXMuaXNJdGVyYWJsZUNoaWxkIHx8IF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmlzSXRlcmFibGVDaGlsZCkuY2FsbCh0aGlzLCBjaGlsZHJlbikpICYmIChpc0ppYmlzaChjaGlsZHJlbikgfHwgKCh0aGlzLmlzVmFsaWRDaGlsZCB8fCBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pc1ZhbGlkQ2hpbGQpLmNhbGwodGhpcywgY2hpbGRyZW4pKSkpXG4gICAgY2hpbGRyZW4gPSBbIGNoaWxkcmVuIF07XG5cbiAgbGV0IHByb21pc2VzID0gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uaXRlcmF0ZShjaGlsZHJlbiwgYXN5bmMgKHsgdmFsdWU6IF9jaGlsZCB9KSA9PiB7XG4gICAgbGV0IGNoaWxkID0gKF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmluc3RhbmNlT2YoX2NoaWxkLCAncHJvbWlzZScpKSA/IGF3YWl0IF9jaGlsZCA6IF9jaGlsZDtcblxuICAgIGlmIChpc0ppYmlzaChjaGlsZCkpXG4gICAgICByZXR1cm4gYXdhaXQgY29uc3RydWN0SmliKGNoaWxkKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gY2hpbGQ7XG4gIH0pO1xuXG4gIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvcmVuZGVyZXJzL2luZGV4LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9yZW5kZXJlcnMvaW5kZXguanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNPTlRFWFRfSURcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkNPTlRFWFRfSUQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkZPUkNFX1JFRkxPV1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBGT1JDRV9SRUZMT1cpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJlbmRlcmVyXCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9yZW5kZXJlcl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlJlbmRlcmVyKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJSb290Tm9kZVwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uUm9vdE5vZGUpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3Jvb3Qtbm9kZS5qcyAqLyBcIi4vbGliL3JlbmRlcmVycy9yb290LW5vZGUuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3JlbmRlcmVyX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3JlbmRlcmVyLmpzICovIFwiLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzXCIpO1xuXG5cbmNvbnN0IEZPUkNFX1JFRkxPVyA9IFN5bWJvbC5mb3IoJ0BqaWJzRm9yY2VSZWZsb3cnKTtcblxuXG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9saWIvcmVuZGVyZXJzL3JlbmRlcmVyLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi9yZW5kZXJlcnMvcmVuZGVyZXIuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIlJlbmRlcmVyXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFJlbmRlcmVyKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yb290LW5vZGUuanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzXCIpO1xuXG5cbmNvbnN0IElOSVRJQUxfQ09OVEVYVF9JRCA9IDFuO1xubGV0IF9jb250ZXh0SURDb3VudGVyID0gSU5JVElBTF9DT05URVhUX0lEO1xuXG5jbGFzcyBSZW5kZXJlciBleHRlbmRzIF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5Sb290Tm9kZSB7XG4gIHN0YXRpYyBSb290Tm9kZSA9IF9yb290X25vZGVfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5Sb290Tm9kZTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIobnVsbCwgbnVsbCwgbnVsbCk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0aGlzLCB7XG4gICAgICAnb3B0aW9ucyc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBvcHRpb25zIHx8IHt9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMucmVuZGVyZXIgPSB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zLnRlcm1SZXNvbHZlciA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHRoaXMuY29udGV4dC5fdGVybVJlc29sdmVyID0gb3B0aW9ucy50ZXJtUmVzb2x2ZXI7XG4gIH1cblxuICBnZXRPcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnM7XG4gIH1cblxuICByZXNvbHZlVGVybShhcmdzKSB7XG4gICAgbGV0IHsgdGVybVJlc29sdmVyIH0gPSB0aGlzLmdldE9wdGlvbnMoKTtcbiAgICBpZiAodHlwZW9mIHRlcm1SZXNvbHZlciA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiB0ZXJtUmVzb2x2ZXIuY2FsbCh0aGlzLCBhcmdzKTtcblxuICAgIGxldCBjaGlsZHJlbiA9IChhcmdzLmNoaWxkcmVuIHx8IFtdKTtcbiAgICByZXR1cm4gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV0gfHwgJyc7XG4gIH1cblxuICBjcmVhdGVDb250ZXh0KHJvb3RDb250ZXh0LCBvblVwZGF0ZSwgb25VcGRhdGVUaGlzKSB7XG4gICAgbGV0IGNvbnRleHQgICAgID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgbXlDb250ZXh0SUQgPSAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkNPTlRFWFRfSURdIDogSU5JVElBTF9DT05URVhUX0lEO1xuXG4gICAgcmV0dXJuIG5ldyBQcm94eShjb250ZXh0LCB7XG4gICAgICBnZXQ6ICh0YXJnZXQsIHByb3BOYW1lKSA9PiB7XG4gICAgICAgIGlmIChwcm9wTmFtZSA9PT0gX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkNPTlRFWFRfSUQpIHtcbiAgICAgICAgICBsZXQgcGFyZW50SUQgPSAocm9vdENvbnRleHQpID8gcm9vdENvbnRleHRbX3Jvb3Rfbm9kZV9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkNPTlRFWFRfSURdIDogSU5JVElBTF9DT05URVhUX0lEO1xuICAgICAgICAgIHJldHVybiAocGFyZW50SUQgPiBteUNvbnRleHRJRCkgPyBwYXJlbnRJRCA6IG15Q29udGV4dElEO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodGFyZ2V0LCBwcm9wTmFtZSkpXG4gICAgICAgICAgcmV0dXJuIChyb290Q29udGV4dCkgPyByb290Q29udGV4dFtwcm9wTmFtZV0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wTmFtZV07XG4gICAgICB9LFxuICAgICAgc2V0OiAodGFyZ2V0LCBwcm9wTmFtZSwgdmFsdWUpID0+IHtcbiAgICAgICAgaWYgKHByb3BOYW1lID09PSBfcm9vdF9ub2RlX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uQ09OVEVYVF9JRClcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBpZiAodGFyZ2V0W3Byb3BOYW1lXSA9PT0gdmFsdWUpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgbXlDb250ZXh0SUQgPSArK19jb250ZXh0SURDb3VudGVyO1xuICAgICAgICB0YXJnZXRbcHJvcE5hbWVdID0gdmFsdWU7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBvblVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICBvblVwZGF0ZS5jYWxsKG9uVXBkYXRlVGhpcywgb25VcGRhdGVUaGlzKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi9yZW5kZXJlcnMvcm9vdC1ub2RlLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvcmVuZGVyZXJzL3Jvb3Qtbm9kZS5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKi8gKChfX3VudXNlZF93ZWJwYWNrX19fd2VicGFja19tb2R1bGVfXywgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykgPT4ge1xuXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNPTlRFWFRfSURcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gQ09OVEVYVF9JRCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUm9vdE5vZGVcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gUm9vdE5vZGUpXG4vKiBoYXJtb255IGV4cG9ydCAqLyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgZGVhZGJlZWYgKi8gXCIuL25vZGVfbW9kdWxlcy9kZWFkYmVlZi9saWIvaW5kZXguanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuLi91dGlscy5qcyAqLyBcIi4vbGliL3V0aWxzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4uL2ppYi5qcyAqLyBcIi4vbGliL2ppYi5qc1wiKTtcblxuXG5cblxuY29uc3QgQ09OVEVYVF9JRCA9IFN5bWJvbC5mb3IoJ0BqaWJzL25vZGUvY29udGV4dElEJyk7XG5cbmNsYXNzIFJvb3ROb2RlIHtcbiAgc3RhdGljIENPTlRFWFRfSUQgPSBDT05URVhUX0lEO1xuXG4gIGNvbnN0cnVjdG9yKHJlbmRlcmVyLCBwYXJlbnROb2RlLCBfY29udGV4dCwgamliKSB7XG4gICAgbGV0IGNvbnRleHQgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IuSEFTX0NPTlRFWFQgIT09IGZhbHNlICYmIChyZW5kZXJlciB8fCB0aGlzLmNyZWF0ZUNvbnRleHQpKSB7XG4gICAgICBjb250ZXh0ID0gKHJlbmRlcmVyIHx8IHRoaXMpLmNyZWF0ZUNvbnRleHQoXG4gICAgICAgIF9jb250ZXh0LFxuICAgICAgICAodGhpcy5vbkNvbnRleHRVcGRhdGUpID8gdGhpcy5vbkNvbnRleHRVcGRhdGUgOiB1bmRlZmluZWQsXG4gICAgICAgIHRoaXMsXG4gICAgICApO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRoaXMsIHtcbiAgICAgICdUWVBFJzoge1xuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgICAgICBnZXQ6ICAgICAgICAgICgpID0+IHRoaXMuY29uc3RydWN0b3IuVFlQRSxcbiAgICAgICAgc2V0OiAgICAgICAgICAoKSA9PiB7fSwgLy8gTk9PUFxuICAgICAgfSxcbiAgICAgICdpZCc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5nZW5lcmF0ZVVVSUQoKSxcbiAgICAgIH0sXG4gICAgICAncmVuZGVyZXInOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIHJlbmRlcmVyLFxuICAgICAgfSxcbiAgICAgICdwYXJlbnROb2RlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBwYXJlbnROb2RlLFxuICAgICAgfSxcbiAgICAgICdjaGlsZE5vZGVzJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBuZXcgTWFwKCksXG4gICAgICB9LFxuICAgICAgJ2NvbnRleHQnOiB7XG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgZ2V0OiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogICAgICAgICAgKCkgPT4ge30sXG4gICAgICB9LFxuICAgICAgJ2Rlc3Ryb3lpbmcnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIGZhbHNlLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJQcm9taXNlJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBudWxsLFxuICAgICAgfSxcbiAgICAgICdyZW5kZXJGcmFtZSc6IHtcbiAgICAgICAgd3JpdGFibGU6ICAgICB0cnVlLFxuICAgICAgICBlbnVtZXJhYmxlOiAgIGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgIHZhbHVlOiAgICAgICAgMCxcbiAgICAgIH0sXG4gICAgICAnamliJzoge1xuICAgICAgICB3cml0YWJsZTogICAgIHRydWUsXG4gICAgICAgIGVudW1lcmFibGU6ICAgZmFsc2UsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6ICAgICAgICBqaWIsXG4gICAgICB9LFxuICAgICAgJ25hdGl2ZUVsZW1lbnQnOiB7XG4gICAgICAgIHdyaXRhYmxlOiAgICAgdHJ1ZSxcbiAgICAgICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZTogICAgICAgIG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVzb2x2ZUNoaWxkcmVuKGNoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5yZXNvbHZlQ2hpbGRyZW4uY2FsbCh0aGlzLCBjaGlsZHJlbik7XG4gIH1cblxuICBpc0ppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uaXNKaWJpc2gpKHZhbHVlKTtcbiAgfVxuXG4gIGNvbnN0cnVjdEppYih2YWx1ZSkge1xuICAgIHJldHVybiAoMCxfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18uY29uc3RydWN0SmliKSh2YWx1ZSk7XG4gIH1cblxuICBnZXRDYWNoZUtleSgpIHtcbiAgICBsZXQgeyBUeXBlLCBwcm9wcyB9ID0gKHRoaXMuamliIHx8IHt9KTtcbiAgICBsZXQgY2FjaGVLZXkgPSBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKFR5cGUsIHByb3BzLmtleSk7XG5cbiAgICByZXR1cm4gY2FjaGVLZXk7XG4gIH1cblxuICB1cGRhdGVKaWIobmV3SmliKSB7XG4gICAgdGhpcy5qaWIgPSBuZXdKaWI7XG4gIH1cblxuICByZW1vdmVDaGlsZChjaGlsZE5vZGUpIHtcbiAgICBsZXQgY2FjaGVLZXkgPSBjaGlsZE5vZGUuZ2V0Q2FjaGVLZXkoKTtcbiAgICB0aGlzLmNoaWxkTm9kZXMuZGVsZXRlKGNhY2hlS2V5KTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkTm9kZSkge1xuICAgIGxldCBjYWNoZUtleSA9IGNoaWxkTm9kZS5nZXRDYWNoZUtleSgpO1xuICAgIHRoaXMuY2hpbGROb2Rlcy5zZXQoY2FjaGVLZXksIGNoaWxkTm9kZSk7XG4gIH1cblxuICBnZXRDaGlsZChjYWNoZUtleSkge1xuICAgIHJldHVybiB0aGlzLmNoaWxkTm9kZXMuZ2V0KGNhY2hlS2V5KTtcbiAgfVxuXG4gIGdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW5Ob2RlcygpIHtcbiAgICBsZXQgY2hpbGROb2RlcyA9IFtdO1xuICAgIGZvciAobGV0IGNoaWxkTm9kZSBvZiB0aGlzLmNoaWxkTm9kZXMudmFsdWVzKCkpXG4gICAgICBjaGlsZE5vZGVzID0gY2hpbGROb2Rlcy5jb25jYXQoY2hpbGROb2RlLmdldFRoaXNOb2RlT3JDaGlsZE5vZGVzKCkpO1xuXG4gICAgcmV0dXJuIGNoaWxkTm9kZXMuZmlsdGVyKEJvb2xlYW4pO1xuICB9XG5cbiAgYXN5bmMgZGVzdHJveShmb3JjZSkge1xuICAgIGlmICghZm9yY2UgJiYgdGhpcy5kZXN0cm95aW5nKVxuICAgICAgcmV0dXJuO1xuXG4gICAgdGhpcy5kZXN0cm95aW5nID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLnJlbmRlclByb21pc2UpXG4gICAgICBhd2FpdCB0aGlzLnJlbmRlclByb21pc2U7XG5cbiAgICBhd2FpdCB0aGlzLmRlc3Ryb3lGcm9tRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG5cbiAgICBsZXQgZGVzdHJveVByb21pc2VzID0gW107XG4gICAgZm9yIChsZXQgY2hpbGROb2RlIG9mIHRoaXMuY2hpbGROb2Rlcy52YWx1ZXMoKSlcbiAgICAgIGRlc3Ryb3lQcm9taXNlcy5wdXNoKGNoaWxkTm9kZS5kZXN0cm95KCkpO1xuXG4gICAgdGhpcy5jaGlsZE5vZGVzLmNsZWFyKCk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVzdHJveVByb21pc2VzKTtcblxuICAgIHRoaXMubmF0aXZlRWxlbWVudCA9IG51bGw7XG4gICAgdGhpcy5wYXJlbnROb2RlID0gbnVsbDtcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsO1xuICAgIHRoaXMuamliID0gbnVsbDtcbiAgfVxuXG4gIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICAgIHJldHVybiBfdXRpbHNfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5pc1ZhbGlkQ2hpbGQoY2hpbGQpO1xuICB9XG5cbiAgaXNJdGVyYWJsZUNoaWxkKGNoaWxkKSB7XG4gICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmlzSXRlcmFibGVDaGlsZChjaGlsZCk7XG4gIH1cblxuICBwcm9wc0RpZmZlcihvbGRQcm9wcywgbmV3UHJvcHMsIHNraXBLZXlzKSB7XG4gICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLnByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpO1xuICB9XG5cbiAgY2hpbGRyZW5EaWZmZXIob2xkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKSB7XG4gICAgcmV0dXJuIF91dGlsc19qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLmNoaWxkcmVuRGlmZmVyKG9sZENoaWxkcmVuLCBuZXdDaGlsZHJlbik7XG4gIH1cblxuICBhc3luYyByZW5kZXIoLi4uYXJncykge1xuICAgIGlmICh0aGlzLmRlc3Ryb3lpbmcpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLnJlbmRlckZyYW1lKys7XG4gICAgbGV0IHJlbmRlckZyYW1lID0gdGhpcy5yZW5kZXJGcmFtZTtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5fcmVuZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLnJlbmRlclByb21pc2UgPSB0aGlzLl9yZW5kZXIoLi4uYXJncylcbiAgICAgICAgLnRoZW4oYXN5bmMgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgIGlmIChyZW5kZXJGcmFtZSA+PSB0aGlzLnJlbmRlckZyYW1lKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5zeW5jRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG5cbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclByb21pc2UgPSBudWxsO1xuICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5zeW5jRE9NKHRoaXMuY29udGV4dCwgdGhpcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmVuZGVyUHJvbWlzZTtcbiAgfVxuXG4gIGdldFBhcmVudElEKCkge1xuICAgIGlmICghdGhpcy5wYXJlbnROb2RlKVxuICAgICAgcmV0dXJuO1xuXG4gICAgcmV0dXJuIHRoaXMucGFyZW50Tm9kZS5pZDtcbiAgfVxuXG4gIGFzeW5jIGRlc3Ryb3lGcm9tRE9NKGNvbnRleHQsIG5vZGUpIHtcbiAgICBpZiAoIXRoaXMucmVuZGVyZXIpXG4gICAgICByZXR1cm47XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5yZW5kZXJlci5kZXN0cm95RnJvbURPTShjb250ZXh0LCBub2RlKTtcbiAgfVxuXG4gIGFzeW5jIHN5bmNET00oY29udGV4dCwgbm9kZSkge1xuICAgIGlmICghdGhpcy5yZW5kZXJlcilcbiAgICAgIHJldHVybjtcblxuICAgIHJldHVybiBhd2FpdCB0aGlzLnJlbmRlcmVyLnN5bmNET00oY29udGV4dCwgbm9kZSk7XG4gIH1cbn1cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL2xpYi91dGlscy5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL2xpYi91dGlscy5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKiovICgoX191bnVzZWRfd2VicGFja19fX3dlYnBhY2tfbW9kdWxlX18sIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pID0+IHtcblxuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIHtcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJiaW5kTWV0aG9kc1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBiaW5kTWV0aG9kcyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiY2hpbGRyZW5EaWZmZXJcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gY2hpbGRyZW5EaWZmZXIpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImZldGNoRGVlcFByb3BlcnR5XCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGZldGNoRGVlcFByb3BlcnR5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJmbGF0dGVuQXJyYXlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gZmxhdHRlbkFycmF5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJnZW5lcmF0ZVVVSURcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gZ2VuZXJhdGVVVUlEKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpbnN0YW5jZU9mXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGluc3RhbmNlT2YpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImlzRW1wdHlcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXNFbXB0eSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaXNJdGVyYWJsZUNoaWxkXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGlzSXRlcmFibGVDaGlsZCksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiaXNOb3RFbXB0eVwiOiAoKSA9PiAoLyogYmluZGluZyAqLyBpc05vdEVtcHR5KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpc1ZhbGlkQ2hpbGRcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gaXNWYWxpZENoaWxkKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJpdGVyYXRlXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIGl0ZXJhdGUpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIm5vd1wiOiAoKSA9PiAoLyogYmluZGluZyAqLyBub3cpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcInByb3BzRGlmZmVyXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIHByb3BzRGlmZmVyKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJzaXplT2ZcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gc2l6ZU9mKVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuLyogZXNsaW50LWRpc2FibGUgbm8tbWFnaWMtbnVtYmVycyAqL1xuXG5cbmNvbnN0IFNUT1AgPSBTeW1ib2wuZm9yKCdAamlic0l0ZXJhdGVTdG9wJyk7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXN0ZWQtdGVybmFyeVxuY29uc3QgZ2xvYmFsU2NvcGUgPSAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpID8gZ2xvYmFsIDogKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSA/IHdpbmRvdyA6IHVuZGVmaW5lZDtcblxubGV0IHV1aWQgPSAxMDAwMDAwO1xuXG5mdW5jdGlvbiBpbnN0YW5jZU9mKG9iaikge1xuICBmdW5jdGlvbiB0ZXN0VHlwZShvYmosIF92YWwpIHtcbiAgICBmdW5jdGlvbiBpc0RlZmVycmVkVHlwZShvYmopIHtcbiAgICAgIGlmIChvYmogaW5zdGFuY2VvZiBQcm9taXNlIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdQcm9taXNlJykpXG4gICAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgICAvLyBRdWFjayBxdWFjay4uLlxuICAgICAgaWYgKHR5cGVvZiBvYmoudGhlbiA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLmNhdGNoID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCB2YWwgICAgID0gX3ZhbDtcbiAgICBsZXQgdHlwZU9mICA9ICh0eXBlb2Ygb2JqKTtcblxuICAgIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlN0cmluZylcbiAgICAgIHZhbCA9ICdzdHJpbmcnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuTnVtYmVyKVxuICAgICAgdmFsID0gJ251bWJlcic7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5Cb29sZWFuKVxuICAgICAgdmFsID0gJ2Jvb2xlYW4nO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuRnVuY3Rpb24pXG4gICAgICB2YWwgPSAnZnVuY3Rpb24nO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQXJyYXkpXG4gICAgICB2YWwgPSAnYXJyYXknO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuT2JqZWN0KVxuICAgICAgdmFsID0gJ29iamVjdCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5Qcm9taXNlKVxuICAgICAgdmFsID0gJ3Byb21pc2UnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQmlnSW50KVxuICAgICAgdmFsID0gJ2JpZ2ludCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5NYXApXG4gICAgICB2YWwgPSAnbWFwJztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLldlYWtNYXApXG4gICAgICB2YWwgPSAnd2Vha21hcCc7XG4gICAgZWxzZSBpZiAodmFsID09PSBnbG9iYWxTY29wZS5TZXQpXG4gICAgICB2YWwgPSAnc2V0JztcbiAgICBlbHNlIGlmICh2YWwgPT09IGdsb2JhbFNjb3BlLlN5bWJvbClcbiAgICAgIHZhbCA9ICdzeW1ib2wnO1xuICAgIGVsc2UgaWYgKHZhbCA9PT0gZ2xvYmFsU2NvcGUuQnVmZmVyKVxuICAgICAgdmFsID0gJ2J1ZmZlcic7XG5cbiAgICBpZiAodmFsID09PSAnYnVmZmVyJyAmJiBnbG9iYWxTY29wZS5CdWZmZXIgJiYgZ2xvYmFsU2NvcGUuQnVmZmVyLmlzQnVmZmVyKG9iaikpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdudW1iZXInICYmICh0eXBlT2YgPT09ICdudW1iZXInIHx8IG9iaiBpbnN0YW5jZW9mIE51bWJlciB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnTnVtYmVyJykpKSB7XG4gICAgICBpZiAoIWlzRmluaXRlKG9iaikpXG4gICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHZhbCAhPT0gJ29iamVjdCcgJiYgdmFsID09PSB0eXBlT2YpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAoKG9iai5jb25zdHJ1Y3RvciA9PT0gT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JykpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgLy8gTnVsbCBwcm90b3R5cGUgb24gb2JqZWN0XG4gICAgICBpZiAodHlwZU9mID09PSAnb2JqZWN0JyAmJiAhb2JqLmNvbnN0cnVjdG9yKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh2YWwgPT09ICdhcnJheScgJiYgKEFycmF5LmlzQXJyYXkob2JqKSB8fCBvYmogaW5zdGFuY2VvZiBBcnJheSB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQXJyYXknKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICgodmFsID09PSAncHJvbWlzZScgfHwgdmFsID09PSAnZGVmZXJyZWQnKSAmJiBpc0RlZmVycmVkVHlwZShvYmopKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnc3RyaW5nJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuU3RyaW5nIHx8IChvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdTdHJpbmcnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdib29sZWFuJyAmJiAob2JqIGluc3RhbmNlb2YgZ2xvYmFsU2NvcGUuQm9vbGVhbiB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnQm9vbGVhbicpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ21hcCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLk1hcCB8fCAob2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnTWFwJykpKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICBpZiAodmFsID09PSAnd2Vha21hcCcgJiYgKG9iaiBpbnN0YW5jZW9mIGdsb2JhbFNjb3BlLldlYWtNYXAgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1dlYWtNYXAnKSkpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh2YWwgPT09ICdzZXQnICYmIChvYmogaW5zdGFuY2VvZiBnbG9iYWxTY29wZS5TZXQgfHwgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gJ1NldCcpKSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHZhbCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlT2YgPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmICh0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nICYmIG9iaiBpbnN0YW5jZW9mIHZhbClcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdmFsKVxuICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAob2JqID09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSAxLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAodGVzdFR5cGUob2JqLCBhcmd1bWVudHNbaV0pID09PSB0cnVlKVxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHByb3BzRGlmZmVyKG9sZFByb3BzLCBuZXdQcm9wcywgc2tpcEtleXMpIHtcbiAgaWYgKG9sZFByb3BzID09PSBuZXdQcm9wcylcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBvbGRQcm9wcyAhPT0gdHlwZW9mIG5ld1Byb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmICghb2xkUHJvcHMgJiYgbmV3UHJvcHMpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgaWYgKG9sZFByb3BzICYmICFuZXdQcm9wcylcbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZXFlcWVxXG4gIGlmICghb2xkUHJvcHMgJiYgIW5ld1Byb3BzICYmIG9sZFByb3BzICE9IG9sZFByb3BzKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGxldCBhS2V5cyA9IE9iamVjdC5rZXlzKG9sZFByb3BzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvbGRQcm9wcykpO1xuICBsZXQgYktleXMgPSBPYmplY3Qua2V5cyhuZXdQcm9wcykuY29uY2F0KE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMobmV3UHJvcHMpKTtcblxuICBpZiAoYUtleXMubGVuZ3RoICE9PSBiS2V5cy5sZW5ndGgpXG4gICAgcmV0dXJuIHRydWU7XG5cbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gYUtleXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBhS2V5ID0gYUtleXNbaV07XG4gICAgaWYgKHNraXBLZXlzICYmIHNraXBLZXlzLmluZGV4T2YoYUtleSkgPj0gMClcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKG9sZFByb3BzW2FLZXldICE9PSBuZXdQcm9wc1thS2V5XSlcbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgbGV0IGJLZXkgPSBiS2V5c1tpXTtcbiAgICBpZiAoc2tpcEtleXMgJiYgc2tpcEtleXMuaW5kZXhPZihiS2V5KSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgaWYgKGFLZXkgPT09IGJLZXkpXG4gICAgICBjb250aW51ZTtcblxuICAgIGlmIChvbGRQcm9wc1tiS2V5XSAhPT0gbmV3UHJvcHNbYktleV0pXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc2l6ZU9mKHZhbHVlKSB7XG4gIGlmICghdmFsdWUpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKE9iamVjdC5pcyhJbmZpbml0eSkpXG4gICAgcmV0dXJuIDA7XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInKVxuICAgIHJldHVybiB2YWx1ZS5sZW5ndGg7XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIF9pdGVyYXRlKG9iaiwgY2FsbGJhY2spIHtcbiAgaWYgKCFvYmogfHwgT2JqZWN0LmlzKEluZmluaXR5KSlcbiAgICByZXR1cm4gW107XG5cbiAgbGV0IHJlc3VsdHMgICA9IFtdO1xuICBsZXQgc2NvcGUgICAgID0geyBjb2xsZWN0aW9uOiBvYmosIFNUT1AgfTtcbiAgbGV0IHJlc3VsdDtcblxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XG4gICAgc2NvcGUudHlwZSA9ICdBcnJheSc7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBvYmoubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgc2NvcGUudmFsdWUgPSBvYmpbaV07XG4gICAgICBzY29wZS5pbmRleCA9IHNjb3BlLmtleSA9IGk7XG5cbiAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmNhbGwodGhpcywgc2NvcGUpO1xuICAgICAgaWYgKHJlc3VsdCA9PT0gU1RPUClcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqLmVudHJpZXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBpZiAob2JqIGluc3RhbmNlb2YgU2V0IHx8IG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSAnU2V0Jykge1xuICAgICAgc2NvcGUudHlwZSA9ICdTZXQnO1xuXG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIChsZXQgaXRlbSBvZiBvYmoudmFsdWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSBpdGVtO1xuICAgICAgICBzY29wZS5rZXkgPSBpdGVtO1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjb3BlLnR5cGUgPSBvYmouY29uc3RydWN0b3IubmFtZTtcblxuICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgIGZvciAobGV0IFsga2V5LCB2YWx1ZSBdIG9mIG9iai5lbnRyaWVzKCkpIHtcbiAgICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgc2NvcGUua2V5ID0ga2V5O1xuICAgICAgICBzY29wZS5pbmRleCA9IGluZGV4Kys7XG5cbiAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICAgIGlmIChyZXN1bHQgPT09IFNUT1ApXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChpbnN0YW5jZU9mKG9iaiwgJ2Jvb2xlYW4nLCAnbnVtYmVyJywgJ2JpZ2ludCcsICdmdW5jdGlvbicpKVxuICAgICAgcmV0dXJuO1xuXG4gICAgc2NvcGUudHlwZSA9IChvYmouY29uc3RydWN0b3IpID8gb2JqLmNvbnN0cnVjdG9yLm5hbWUgOiAnT2JqZWN0JztcblxuICAgIGxldCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBrZXlzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGxldCBrZXkgICA9IGtleXNbaV07XG4gICAgICBsZXQgdmFsdWUgPSBvYmpba2V5XTtcblxuICAgICAgc2NvcGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgIHNjb3BlLmtleSA9IGtleTtcbiAgICAgIHNjb3BlLmluZGV4ID0gaTtcblxuICAgICAgcmVzdWx0ID0gY2FsbGJhY2suY2FsbCh0aGlzLCBzY29wZSk7XG4gICAgICBpZiAocmVzdWx0ID09PSBTVE9QKVxuICAgICAgICBicmVhaztcblxuICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKF9pdGVyYXRlLCB7XG4gICdTVE9QJzoge1xuICAgIHdyaXRhYmxlOiAgICAgZmFsc2UsXG4gICAgZW51bWVyYWJsZTogICBmYWxzZSxcbiAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIHZhbHVlOiAgICAgICAgU1RPUCxcbiAgfSxcbn0pO1xuXG5jb25zdCBpdGVyYXRlID0gX2l0ZXJhdGU7XG5cbmZ1bmN0aW9uIGNoaWxkcmVuRGlmZmVyKGNoaWxkcmVuMSwgY2hpbGRyZW4yKSB7XG4gIGlmIChjaGlsZHJlbjEgPT09IGNoaWxkcmVuMilcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgbGV0IHJlc3VsdDEgPSAoIUFycmF5LmlzQXJyYXkoY2hpbGRyZW4xKSkgPyBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKGNoaWxkcmVuMSkgOiBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fKC4uLmNoaWxkcmVuMSk7XG4gIGxldCByZXN1bHQyID0gKCFBcnJheS5pc0FycmF5KGNoaWxkcmVuMikpID8gZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyhjaGlsZHJlbjIpIDogZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyguLi5jaGlsZHJlbjIpO1xuXG4gIHJldHVybiAocmVzdWx0MSAhPT0gcmVzdWx0Mik7XG59XG5cbmZ1bmN0aW9uIGZldGNoRGVlcFByb3BlcnR5KG9iaiwgX2tleSwgZGVmYXVsdFZhbHVlLCBsYXN0UGFydCkge1xuICBpZiAob2JqID09IG51bGwgfHwgT2JqZWN0LmlzKE5hTiwgb2JqKSB8fCBPYmplY3QuaXMoSW5maW5pdHksIG9iaikpXG4gICAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGRlZmF1bHRWYWx1ZSwgbnVsbCBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGlmIChfa2V5ID09IG51bGwgfHwgT2JqZWN0LmlzKE5hTiwgX2tleSkgfHwgT2JqZWN0LmlzKEluZmluaXR5LCBfa2V5KSlcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBudWxsIF0gOiBkZWZhdWx0VmFsdWU7XG5cbiAgbGV0IHBhcnRzO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KF9rZXkpKSB7XG4gICAgcGFydHMgPSBfa2V5O1xuICB9IGVsc2UgaWYgKHR5cGVvZiBfa2V5ID09PSAnc3ltYm9sJykge1xuICAgIHBhcnRzID0gWyBfa2V5IF07XG4gIH0gZWxzZSB7XG4gICAgbGV0IGtleSAgICAgICAgID0gKCcnICsgX2tleSk7XG4gICAgbGV0IGxhc3RJbmRleCAgID0gMDtcbiAgICBsZXQgbGFzdEN1cnNvciAgPSAwO1xuXG4gICAgcGFydHMgPSBbXTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zdGFudC1jb25kaXRpb25cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgbGV0IGluZGV4ID0ga2V5LmluZGV4T2YoJy4nLCBsYXN0SW5kZXgpO1xuICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICBwYXJ0cy5wdXNoKGtleS5zdWJzdHJpbmcobGFzdEN1cnNvcikpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKGtleS5jaGFyQXQoaW5kZXggLSAxKSA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHBhcnRzLnB1c2goa2V5LnN1YnN0cmluZyhsYXN0Q3Vyc29yLCBpbmRleCkpO1xuICAgICAgbGFzdEN1cnNvciA9IGxhc3RJbmRleCA9IGluZGV4ICsgMTtcbiAgICB9XG4gIH1cblxuICBsZXQgcGFydE4gPSBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXTtcbiAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMClcbiAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBwYXJ0TiBdIDogZGVmYXVsdFZhbHVlO1xuXG4gIGxldCBjdXJyZW50VmFsdWUgPSBvYmo7XG4gIGZvciAobGV0IGkgPSAwLCBpbCA9IHBhcnRzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICBsZXQga2V5ID0gcGFydHNbaV07XG5cbiAgICBjdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWVba2V5XTtcbiAgICBpZiAoY3VycmVudFZhbHVlID09IG51bGwpXG4gICAgICByZXR1cm4gKGxhc3RQYXJ0KSA/IFsgZGVmYXVsdFZhbHVlLCBwYXJ0TiBdIDogZGVmYXVsdFZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIChsYXN0UGFydCkgPyBbIGN1cnJlbnRWYWx1ZSwgcGFydE4gXSA6IGN1cnJlbnRWYWx1ZTtcbn1cblxuZnVuY3Rpb24gYmluZE1ldGhvZHMoX3Byb3RvLCBza2lwUHJvdG9zKSB7XG4gIGxldCBwcm90byAgICAgICAgICAgPSBfcHJvdG87XG4gIGxldCBhbHJlYWR5VmlzaXRlZCAgPSBuZXcgU2V0KCk7XG5cbiAgd2hpbGUgKHByb3RvKSB7XG4gICAgbGV0IGRlc2NyaXB0b3JzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcnMocHJvdG8pO1xuICAgIGxldCBrZXlzICAgICAgICA9IE9iamVjdC5rZXlzKGRlc2NyaXB0b3JzKS5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhkZXNjcmlwdG9ycykpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0ga2V5cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBsZXQga2V5ID0ga2V5c1tpXTtcbiAgICAgIGlmIChrZXkgPT09ICdjb25zdHJ1Y3RvcicpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoYWxyZWFkeVZpc2l0ZWQuaGFzKGtleSkpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBhbHJlYWR5VmlzaXRlZC5hZGQoa2V5KTtcblxuICAgICAgbGV0IHZhbHVlID0gcHJvdG9ba2V5XTtcblxuICAgICAgLy8gU2tpcCBwcm90b3R5cGUgb2YgT2JqZWN0XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcHJvdG90eXBlLWJ1aWx0aW5zXG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIE9iamVjdC5wcm90b3R5cGVba2V5XSA9PT0gdmFsdWUpXG4gICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICBjb250aW51ZTtcblxuICAgICAgdGhpc1trZXldID0gdmFsdWUuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90byk7XG4gICAgaWYgKHByb3RvID09PSBPYmplY3QucHJvdG90eXBlKVxuICAgICAgYnJlYWs7XG5cbiAgICBpZiAoc2tpcFByb3RvcyAmJiBza2lwUHJvdG9zLmluZGV4T2YocHJvdG8pID49IDApXG4gICAgICBicmVhaztcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIGlmIChPYmplY3QuaXModmFsdWUsIEluZmluaXR5KSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKE9iamVjdC5pcyh2YWx1ZSwgTmFOKSlcbiAgICByZXR1cm4gdHJ1ZTtcblxuICBpZiAoaW5zdGFuY2VPZih2YWx1ZSwgJ3N0cmluZycpKVxuICAgIHJldHVybiAhKC9cXFMvKS50ZXN0KHZhbHVlKTtcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZih2YWx1ZSwgJ251bWJlcicpICYmIGlzRmluaXRlKHZhbHVlKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGVsc2UgaWYgKCFpbnN0YW5jZU9mKHZhbHVlLCAnYm9vbGVhbicsICdiaWdpbnQnLCAnZnVuY3Rpb24nKSAmJiBzaXplT2YodmFsdWUpID09PSAwKVxuICAgIHJldHVybiB0cnVlO1xuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gaXNOb3RFbXB0eSh2YWx1ZSkge1xuICByZXR1cm4gIWlzRW1wdHkuY2FsbCh0aGlzLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW5BcnJheSh2YWx1ZSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpKVxuICAgIHJldHVybiB2YWx1ZTtcblxuICBsZXQgbmV3QXJyYXkgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDAsIGlsID0gdmFsdWUubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIGxldCBpdGVtID0gdmFsdWVbaV07XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpXG4gICAgICBuZXdBcnJheSA9IG5ld0FycmF5LmNvbmNhdChmbGF0dGVuQXJyYXkoaXRlbSkpO1xuICAgIGVsc2VcbiAgICAgIG5ld0FycmF5LnB1c2goaXRlbSk7XG4gIH1cblxuICByZXR1cm4gbmV3QXJyYXk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRDaGlsZChjaGlsZCkge1xuICBpZiAoY2hpbGQgPT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBjaGlsZCA9PT0gJ2Jvb2xlYW4nKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoT2JqZWN0LmlzKGNoaWxkLCBJbmZpbml0eSkpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChPYmplY3QuaXMoY2hpbGQsIE5hTikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpc0l0ZXJhYmxlQ2hpbGQoY2hpbGQpIHtcbiAgaWYgKGNoaWxkID09IG51bGwgfHwgT2JqZWN0LmlzKGNoaWxkLCBOYU4pIHx8IE9iamVjdC5pcyhjaGlsZCwgSW5maW5pdHkpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICByZXR1cm4gKEFycmF5LmlzQXJyYXkoY2hpbGQpIHx8IHR5cGVvZiBjaGlsZCA9PT0gJ29iamVjdCcgJiYgIWluc3RhbmNlT2YoY2hpbGQsICdib29sZWFuJywgJ251bWJlcicsICdzdHJpbmcnKSk7XG59XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIGVsc2VcbiAgICByZXR1cm4gRGF0ZS5ub3coKTtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xuICBpZiAodXVpZCA+IDk5OTk5OTkpXG4gICAgdXVpZCA9IDEwMDAwMDA7XG5cbiAgcmV0dXJuIGAke0RhdGUubm93KCl9LiR7dXVpZCsrfSR7TWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApLnRvU3RyaW5nKCkucGFkU3RhcnQoMjAsICcwJyl9YDtcbn1cblxuXG4vKioqLyB9KVxuXG4vKioqKioqLyB9KTtcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyB2YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG4vKioqKioqLyBcbi8qKioqKiovIC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG4vKioqKioqLyBcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcbi8qKioqKiovIFx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG4vKioqKioqLyBcdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG4vKioqKioqLyBcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcbi8qKioqKiovIFx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuLyoqKioqKi8gXHRcdGV4cG9ydHM6IHt9XG4vKioqKioqLyBcdH07XG4vKioqKioqLyBcbi8qKioqKiovIFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4vKioqKioqLyBcdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuLyoqKioqKi8gXG4vKioqKioqLyBcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIH1cbi8qKioqKiovIFxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyAqL1xuLyoqKioqKi8gKCgpID0+IHtcbi8qKioqKiovIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuLyoqKioqKi8gXHRcdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcbi8qKioqKiovIFx0XHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuLyoqKioqKi8gXHRcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuLyoqKioqKi8gXHRcdFx0fVxuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0fTtcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9nbG9iYWwgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uZyA9IChmdW5jdGlvbigpIHtcbi8qKioqKiovIFx0XHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcbi8qKioqKiovIFx0XHR0cnkge1xuLyoqKioqKi8gXHRcdFx0cmV0dXJuIHRoaXMgfHwgbmV3IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG4vKioqKioqLyBcdFx0fSBjYXRjaCAoZSkge1xuLyoqKioqKi8gXHRcdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0fSkoKTtcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSlcbi8qKioqKiovIH0pKCk7XG4vKioqKioqLyBcbi8qKioqKiovIC8qIHdlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QgKi9cbi8qKioqKiovICgoKSA9PiB7XG4vKioqKioqLyBcdC8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcbi8qKioqKiovIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbi8qKioqKiovIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuLyoqKioqKi8gXHRcdH1cbi8qKioqKiovIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuLyoqKioqKi8gXHR9O1xuLyoqKioqKi8gfSkoKTtcbi8qKioqKiovIFxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0ge307XG4vLyBUaGlzIGVudHJ5IG5lZWQgdG8gYmUgd3JhcHBlZCBpbiBhbiBJSUZFIGJlY2F1c2UgaXQgbmVlZCB0byBiZSBpc29sYXRlZCBhZ2FpbnN0IG90aGVyIG1vZHVsZXMgaW4gdGhlIGNodW5rLlxuKCgpID0+IHtcbi8qISoqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9saWIvaW5kZXguanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKiovXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywge1xuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIiRcIjogKCkgPT4gKC8qIHJlZXhwb3J0IHNhZmUgKi8gX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLiQpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkNvbXBvbmVudFwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uQ29tcG9uZW50KSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJDb21wb25lbnRzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIENvbXBvbmVudHMpLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcIkppYnNcIjogKCkgPT4gKC8qIGJpbmRpbmcgKi8gSmlicyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiUmVuZGVyZXJzXCI6ICgpID0+ICgvKiBiaW5kaW5nICovIFJlbmRlcmVycyksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiVGVybVwiOiAoKSA9PiAoLyogcmVleHBvcnQgc2FmZSAqLyBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uVGVybSksXG4vKiBoYXJtb255IGV4cG9ydCAqLyAgIFwiVXRpbHNcIjogKCkgPT4gKC8qIHJlZXhwb3J0IG1vZHVsZSBvYmplY3QgKi8gX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18pLFxuLyogaGFybW9ueSBleHBvcnQgKi8gICBcImRlYWRiZWVmXCI6ICgpID0+ICgvKiByZWV4cG9ydCBkZWZhdWx0IGV4cG9ydCBmcm9tIG5hbWVkIG1vZHVsZSAqLyBkZWFkYmVlZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfNF9fKSxcbi8qIGhhcm1vbnkgZXhwb3J0ICovICAgXCJmYWN0b3J5XCI6ICgpID0+ICgvKiByZWV4cG9ydCBzYWZlICovIF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5mYWN0b3J5KVxuLyogaGFybW9ueSBleHBvcnQgKi8gfSk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9qaWIuanMgKi8gXCIuL2xpYi9qaWIuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9jb21wb25lbnQuanMgKi8gXCIuL2xpYi9jb21wb25lbnQuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9yZW5kZXJlcnMvaW5kZXguanMgKi8gXCIuL2xpYi9yZW5kZXJlcnMvaW5kZXguanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3V0aWxzX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3V0aWxzLmpzICovIFwiLi9saWIvdXRpbHMuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgZGVhZGJlZWZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzRfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRlYWRiZWVmICovIFwiLi9ub2RlX21vZHVsZXMvZGVhZGJlZWYvbGliL2luZGV4LmpzXCIpO1xuXG5cbmNvbnN0IEppYnMgPSB7XG4gIEpJQl9CQVJSRU46IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUJfQkFSUkVOLFxuICBKSUJfUFJPWFk6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KSUJfUFJPWFksXG4gIEpJQl9SQVdfVEVYVDogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkpJQl9SQVdfVEVYVCxcbiAgSklCOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uSklCLFxuICBKSUJfQ0hJTERfSU5ERVhfUFJPUDogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLkpJQl9DSElMRF9JTkRFWF9QUk9QLFxuICBKaWI6IF9qaWJfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXy5KaWIsXG4gIGlzSmliaXNoOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18uaXNKaWJpc2gsXG4gIGNvbnN0cnVjdEppYjogX2ppYl9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fLmNvbnN0cnVjdEppYixcbiAgcmVzb2x2ZUNoaWxkcmVuOiBfamliX2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18ucmVzb2x2ZUNoaWxkcmVuLFxufTtcblxuXG5cbmNvbnN0IENvbXBvbmVudHMgPSB7XG4gIFVQREFURV9FVkVOVDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlVQREFURV9FVkVOVCxcbiAgUVVFVUVfVVBEQVRFX01FVEhPRDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlFVRVVFX1VQREFURV9NRVRIT0QsXG4gIEZMVVNIX1VQREFURV9NRVRIT0Q6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5GTFVTSF9VUERBVEVfTUVUSE9ELFxuICBJTklUX01FVEhPRDogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLklOSVRfTUVUSE9ELFxuICBTS0lQX1NUQVRFX1VQREFURVM6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5TS0lQX1NUQVRFX1VQREFURVMsXG4gIFBFTkRJTkdfU1RBVEVfVVBEQVRFOiBfY29tcG9uZW50X2pzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18uUEVORElOR19TVEFURV9VUERBVEUsXG4gIExBU1RfUkVOREVSX1RJTUU6IF9jb21wb25lbnRfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzFfXy5MQVNUX1JFTkRFUl9USU1FLFxuICBQUkVWSU9VU19TVEFURTogX2NvbXBvbmVudF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLlBSRVZJT1VTX1NUQVRFLFxufTtcblxuXG5cbmNvbnN0IFJlbmRlcmVycyA9IHtcbiAgQ09OVEVYVF9JRDogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLlJvb3ROb2RlLkNPTlRFWFRfSUQsXG4gIEZPUkNFX1JFRkxPVzogX3JlbmRlcmVyc19pbmRleF9qc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMl9fLkZPUkNFX1JFRkxPVyxcbiAgUm9vdE5vZGU6IF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5Sb290Tm9kZSxcbiAgUmVuZGVyZXI6IF9yZW5kZXJlcnNfaW5kZXhfanNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXy5SZW5kZXJlcixcbn07XG5cblxuXG5cblxuXG59KSgpO1xuXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyQgPSBfX3dlYnBhY2tfZXhwb3J0c19fLiQ7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX0NvbXBvbmVudCA9IF9fd2VicGFja19leHBvcnRzX18uQ29tcG9uZW50O1xudmFyIF9fd2VicGFja19leHBvcnRzX19Db21wb25lbnRzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5Db21wb25lbnRzO1xudmFyIF9fd2VicGFja19leHBvcnRzX19KaWJzID0gX193ZWJwYWNrX2V4cG9ydHNfXy5KaWJzO1xudmFyIF9fd2VicGFja19leHBvcnRzX19SZW5kZXJlcnMgPSBfX3dlYnBhY2tfZXhwb3J0c19fLlJlbmRlcmVycztcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fVGVybSA9IF9fd2VicGFja19leHBvcnRzX18uVGVybTtcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fVXRpbHMgPSBfX3dlYnBhY2tfZXhwb3J0c19fLlV0aWxzO1xudmFyIF9fd2VicGFja19leHBvcnRzX19kZWFkYmVlZiA9IF9fd2VicGFja19leHBvcnRzX18uZGVhZGJlZWY7XG52YXIgX193ZWJwYWNrX2V4cG9ydHNfX2ZhY3RvcnkgPSBfX3dlYnBhY2tfZXhwb3J0c19fLmZhY3Rvcnk7XG5leHBvcnQgeyBfX3dlYnBhY2tfZXhwb3J0c19fJCBhcyAkLCBfX3dlYnBhY2tfZXhwb3J0c19fQ29tcG9uZW50IGFzIENvbXBvbmVudCwgX193ZWJwYWNrX2V4cG9ydHNfX0NvbXBvbmVudHMgYXMgQ29tcG9uZW50cywgX193ZWJwYWNrX2V4cG9ydHNfX0ppYnMgYXMgSmlicywgX193ZWJwYWNrX2V4cG9ydHNfX1JlbmRlcmVycyBhcyBSZW5kZXJlcnMsIF9fd2VicGFja19leHBvcnRzX19UZXJtIGFzIFRlcm0sIF9fd2VicGFja19leHBvcnRzX19VdGlscyBhcyBVdGlscywgX193ZWJwYWNrX2V4cG9ydHNfX2RlYWRiZWVmIGFzIGRlYWRiZWVmLCBfX3dlYnBhY2tfZXhwb3J0c19fZmFjdG9yeSBhcyBmYWN0b3J5IH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYVc1a1pYZ3Vhbk1pTENKdFlYQndhVzVuY3lJNklqczdPenM3T3pzN1FVRkJRVHM3UVVGRllUczdRVUZGWWl3clJFRkJLMFFzY1VKQlFVMDdRVUZEY2tVN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CTEhsRFFVRjVReXhSUVVGUk8wRkJRMnBFTEZWQlFWVXNiMEpCUVc5Q08wRkJRemxDTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzY1VKQlFYRkNMR1ZCUVdVN08wRkJSWEJETzBGQlEwRTdRVUZEUVN4dFEwRkJiVU1zU1VGQlNTeGxRVUZsTEVsQlFVazdPMEZCUlRGRU8wRkJRMEU3TzBGQlJVRXNZMEZCWXl4UFFVRlBMRWRCUVVjc1NVRkJTVHRCUVVNMVFqczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEdsQ1FVRnBRaXhYUVVGWExFZEJRVWNzWTBGQll6dEJRVU0zUXp0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc2VVTkJRWGxETEZGQlFWRTdRVUZEYWtRN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFc2VVTkJRWGxETEZGQlFWRTdRVUZEYWtRN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJMRzFDUVVGdFFpeHRRa0ZCYlVJN1FVRkRkRU03TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeEhRVUZITzBGQlEwZzdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFZEJRVWM3UVVGRFNEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1IwRkJSenRCUVVOSU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4SFFVRkhPMEZCUTBnc1EwRkJRenM3UVVGRlJEczdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdRVU12U0VFN08wRkJSV2RETzBGQlExYzdRVUZEUkR0QlFVMTRRanM3UVVGRldEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJWQTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGVHl4M1FrRkJkMElzYjBSQlFWazdRVUZETTBNN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFc1NVRkJTU3gxUkVGQmMwSTdPMEZCUlRGQ096dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVTBGQlV6dEJRVU5VTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxGTkJRVk03UVVGRFZDeFBRVUZQTzBGQlExQTdPMEZCUlVFc2QwVkJRWGRGTzBGQlEzaEZPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzYzBKQlFYTkNMREJEUVVGVE8wRkJReTlDTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxIZENRVUYzUWp0QlFVTjRRaXhQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRTlCUVU4N1FVRkRVRHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1UwRkJVenRCUVVOVU8wRkJRMEU3UVVGRFFTeHZSVUZCYjBVc1RVRkJUVHM3UVVGRk1VVTdRVUZEUVN4VFFVRlRPMEZCUTFRc1QwRkJUenRCUVVOUUxFdEJRVXM3UVVGRFREczdRVUZGUVR0QlFVTkJMRmRCUVZjc2VVUkJRVzlDTzBGQlF5OUNPenRCUVVWQk8wRkJRMEVzVjBGQlZ5eHBSRUZCVVR0QlFVTnVRanM3UVVGRlFUdEJRVU5CTEZkQlFWY3NjVVJCUVZrN1FVRkRka0k3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEZOQlFWTTdRVUZEVkN4UFFVRlBPMEZCUTFBN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFTeFJRVUZSTEdsRVFVRm5RanRCUVVONFFqdEJRVU5CT3p0QlFVVkJMSGREUVVGM1F5eFJRVUZSTzBGQlEyaEVPMEZCUTBFc2EwTkJRV3RETEhkRVFVRjFRanRCUVVONlJEdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeE5RVUZOTzBGQlEwNHNZVUZCWVN4M1JFRkJkVUk3UVVGRGNFTTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzYVVWQlFXbEZMRTFCUVUwN08wRkJSWFpGTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQkxIZEZRVUYzUlN4TlFVRk5PenRCUVVVNVJUdEJRVU5CTzBGQlEwRTdRVUZEUVN4TlFVRk5PMEZCUTA0N1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVN4elEwRkJjME1zVVVGQlVUdEJRVU01UXp0QlFVTkJPMEZCUTBFN08wRkJSVUVzVlVGQlZTeHBSRUZCWjBJN1FVRkRNVUlzTWtOQlFUSkRMR2xFUVVGblFqdEJRVU16UkN3MFEwRkJORU1zVVVGQlVUdEJRVU53UkR0QlFVTkJPMEZCUTBFN1FVRkRRU3hSUVVGUk8wRkJRMUk3UVVGRFFUdEJRVU5CT3p0QlFVVkJMR1ZCUVdVc2FVUkJRV2RDTzBGQlF5OUNPenRCUVVWQkxHbENRVUZwUWl4cFJFRkJaMEk3UVVGRGFrTXNVMEZCVXpzN1FVRkZWQ3cwUTBGQk5FTXNVVUZCVVR0QlFVTndSRHRCUVVOQk8wRkJRMEU3UVVGRFFTeFJRVUZSTEZOQlFWTXNhVVJCUVdkQ08wRkJRMnBETzBGQlEwRXNNRU5CUVRCRExGRkJRVkU3UVVGRGJFUTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeFZRVUZWTEdsRVFVRm5RanRCUVVNeFFqczdRVUZGUVR0QlFVTkJMRGhEUVVFNFF5eFJRVUZSTzBGQlEzUkVPMEZCUTBFc1kwRkJZeXhwUkVGQlowSTdRVUZET1VJN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeFpRVUZaTzBGQlExbzdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzVVVGQlVUdEJRVU5TTzBGQlEwRXNNRU5CUVRCRExGRkJRVkU3UVVGRGJFUTdRVUZEUVR0QlFVTkJPenRCUVVWQkxHTkJRV01zYVVSQlFXZENPMEZCUXpsQ08wRkJRMEVzYlVKQlFXMUNMR2xFUVVGblFqdEJRVU51UXp0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFTeFpRVUZaTzBGQlExbzdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4WFFVRlhMR2xFUVVGblFqdEJRVU16UWpzN1FVRkZRVHM3UVVGRlFUdEJRVU5CTEhkRFFVRjNReXhSUVVGUk8wRkJRMmhFTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxFdEJRVXM3UVVGRFREczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeDNRa0ZCZDBJN1FVRkRlRUlzVDBGQlR6dEJRVU5RT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVN4UFFVRlBPenRCUVVWUU8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1ZVRkJWVHRCUVVOV08wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRXNjVU5CUVhGRExGRkJRVkU3UVVGRE4wTTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3gxUWtGQmRVSXNjVU5CUVZFN1FVRkRMMEk3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFc1VVRkJVU3hwUkVGQlVUdEJRVU5vUWl4blFrRkJaMElzY1VSQlFWazdPMEZCUlRWQ08wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRU3hoUVVGaExEQkRRVUZETzBGQlEyUXNUVUZCVFR0QlFVTk9MR0ZCUVdFc01FTkJRVU03UVVGRFpEczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3hyUTBGQmEwTXNOa0pCUVRaQ08wRkJReTlFTEZkQlFWY3NNRU5CUVVNN1FVRkRXanRCUVVOQk96dEJRVVZCT3p0QlFVbEZPenM3T3pzN096czdPenM3T3pzN1FVTXpiRUpHT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBc1MwRkJTenRCUVVOTU96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFTeDFRMEZCZFVNc1VVRkJVVHRCUVVNdlF6dEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3UVVNM1IyZERPMEZCUTBrN08wRkJSVGRDTzBGQlExQTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeDNRa0ZCZDBJc01rUkJRVEpFTEVkQlFVYzdRVUZEZEVZc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNjMEpCUVhOQ0xHMUVRVUZyUWp0QlFVTjRReXhQUVVGUE8wRkJRMUFzUzBGQlN6dEJRVU5NTzBGQlEwRTdPMEZCUlU4N1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTlFMRGhDUVVFNFFqdEJRVU01UWp0QlFVTkJPenRCUVVWQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRU3haUVVGWkxHbEVRVUZuUWl3NFEwRkJPRU1zYVVSQlFXZENPMEZCUXpGR08wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVjBGQlZ6dEJRVU5ZT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeFRRVUZUTzBGQlExUXNVMEZCVXl3eVEwRkJZenRCUVVOMlFqdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJMRk5CUVZNN1FVRkRWQ3hQUVVGUE96dEJRVVZRTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRXNUMEZCVHp0QlFVTlFMRTlCUVU4c01rTkJRV003UVVGRGNrSTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRU3hQUVVGUE8wRkJRMUFzUzBGQlN6czdRVUZGVER0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4UFFVRlBPMEZCUTFBc1MwRkJTenRCUVVOTUxFZEJRVWM3TzBGQlJVZzdRVUZEUVRzN1FVRkZUenM3UVVGRlFUdEJRVU5RTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVlBPMEZCUTFBN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGVHp0QlFVTlFPenRCUVVWQkxFMUJRVTBzYVVSQlFXZENPMEZCUTNSQ096dEJRVVZCTEdsRFFVRnBReXh6UkVGQmNVSXNlVVZCUVhsRkxHMUVRVUZyUWp0QlFVTnFTanM3UVVGRlFTeHBRa0ZCYVVJc09FTkJRV0VzYjBKQlFXOUNMR1ZCUVdVN1FVRkRha1VzYVVKQlFXbENMR2xFUVVGblFqczdRVUZGYWtNN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFTeEhRVUZIT3p0QlFVVklPMEZCUTBFN096czdPenM3T3pzN096czdPenM3T3pzN08wRkROVXQzUWpzN1FVRkZha0k3TzBGQlJXdERPenM3T3pzN096czdPenM3T3pzN08wRkRTbXBDT3p0QlFVVjRRanRCUVVOQk96dEJRVVZQTEhWQ1FVRjFRaXh0UkVGQlVUdEJRVU4wUXl4dlFrRkJiMElzYlVSQlFWRTdPMEZCUlRWQ08wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxHMURRVUZ0UXp0QlFVTnVReXhQUVVGUE8wRkJRMUFzUzBGQlN6czdRVUZGVERzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEVzVlVGQlZTeGxRVUZsTzBGQlEzcENPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRU3hyUkVGQmEwUXNjVVJCUVZVN08wRkJSVFZFTzBGQlEwRTdRVUZEUVN4NVFrRkJlVUlzY1VSQlFWVTdRVUZEYmtNc2NVUkJRWEZFTEhGRVFVRlZPMEZCUXk5RU8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTEhsQ1FVRjVRaXh4UkVGQlZUdEJRVU51UXpzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEU5QlFVODdRVUZEVUN4TFFVRkxPMEZCUTB3N1FVRkRRVHM3T3pzN096czdPenM3T3pzN096czdPenRCUXpORlowTTdRVUZEU3p0QlFVdHNRanM3UVVGRldqczdRVUZGUVR0QlFVTlFPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxEaENRVUU0UWp0QlFVTTVRaXhQUVVGUE8wRkJRMUE3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4elFrRkJjMElzYlVSQlFXdENPMEZCUTNoRExFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVTBGQlV6dEJRVU5VTERoQ1FVRTRRanRCUVVNNVFpeFBRVUZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFOUJRVTg3UVVGRFVEdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFc1QwRkJUenRCUVVOUU8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVN4UFFVRlBPMEZCUTFBN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTEU5QlFVODdRVUZEVUR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEVzVDBGQlR6dEJRVU5RTEV0QlFVczdRVUZEVERzN1FVRkZRVHRCUVVOQkxGZEJRVmNzZVVSQlFXOUNPMEZCUXk5Q096dEJRVVZCTzBGQlEwRXNWMEZCVnl4cFJFRkJVVHRCUVVOdVFqczdRVUZGUVR0QlFVTkJMRmRCUVZjc2NVUkJRVms3UVVGRGRrSTdPMEZCUlVFN1FVRkRRU3hWUVVGVkxHTkJRV01zYVVKQlFXbENPMEZCUTNwRExHMUNRVUZ0UWl4eFEwRkJVVHM3UVVGRk0wSTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUczdRVUZGUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4WFFVRlhMRzFFUVVGclFqdEJRVU0zUWpzN1FVRkZRVHRCUVVOQkxGZEJRVmNzYzBSQlFYRkNPMEZCUTJoRE96dEJRVVZCTzBGQlEwRXNWMEZCVnl4clJFRkJhVUk3UVVGRE5VSTdPMEZCUlVFN1FVRkRRU3hYUVVGWExIRkVRVUZ2UWp0QlFVTXZRanM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeFRRVUZUTzBGQlExUTdRVUZEUVR0QlFVTkJPMEZCUTBFc1UwRkJVenRCUVVOVUxFMUJRVTA3UVVGRFRqdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3T3pzN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3UVVONFQwRTdRVUZEWjBNN08wRkJSV2hET3p0QlFVVkJPMEZCUTBFc01FZEJRVEJITEZOQlFVazdPMEZCUlRsSE96dEJRVVZQTzBGQlExQTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRXNNRU5CUVRCRExGTkJRVk03UVVGRGJrUTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVODdRVUZEVUR0QlFVTkJPenRCUVVWQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFc2NVTkJRWEZETEZGQlFWRTdRVUZETjBNN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlU4N1FVRkRVRHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTEc5Q1FVRnZRanRCUVVOd1FqczdRVUZGUVR0QlFVTkJPenRCUVVWQkxIRkRRVUZ4UXl4UlFVRlJPMEZCUXpkRE8wRkJRMEU3TzBGQlJVRTdRVUZEUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFTeEpRVUZKTzBGQlEwbzdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRXNUVUZCVFR0QlFVTk9PenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJMRWxCUVVrN1FVRkRTanRCUVVOQk96dEJRVVZCT3p0QlFVVkJPMEZCUTBFc2MwTkJRWE5ETEZGQlFWRTdRVUZET1VNN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQkxFZEJRVWM3UVVGRFNDeERRVUZET3p0QlFVVk5PenRCUVVWQk8wRkJRMUE3UVVGRFFUczdRVUZGUVN3NFEwRkJPRU1zY1VOQlFWRXNZMEZCWXl4eFEwRkJVVHRCUVVNMVJTdzRRMEZCT0VNc2NVTkJRVkVzWTBGQll5eHhRMEZCVVRzN1FVRkZOVVU3UVVGRFFUczdRVUZGVHp0QlFVTlFPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEVzU1VGQlNUdEJRVU5LTzBGQlEwRXNTVUZCU1R0QlFVTktPMEZCUTBFN1FVRkRRVHM3UVVGRlFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHM3UVVGRlFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4eFEwRkJjVU1zVVVGQlVUdEJRVU0zUXpzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWUE8wRkJRMUE3UVVGRFFUczdRVUZGUVR0QlFVTkJPMEZCUTBFN08wRkJSVUVzYzBOQlFYTkRMRkZCUVZFN1FVRkRPVU03UVVGRFFUdEJRVU5CT3p0QlFVVkJPMEZCUTBFN08wRkJSVUU3TzBGQlJVRTdPMEZCUlVFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk8wRkJRMEU3UVVGRFFUczdRVUZGVHp0QlFVTlFPMEZCUTBFN08wRkJSVUU3UVVGRFFUczdRVUZGUVR0QlFVTkJPenRCUVVWQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZQTzBGQlExQTdRVUZEUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3TzBGQlJVRTdRVUZEUVN4eFEwRkJjVU1zVVVGQlVUdEJRVU0zUXp0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZUenRCUVVOUU8wRkJRMEU3TzBGQlJVRTdRVUZEUVRzN1FVRkZRVHRCUVVOQk96dEJRVVZCTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlR6dEJRVU5RTzBGQlEwRTdPMEZCUlVFN1FVRkRRVHM3UVVGRlR6dEJRVU5RTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN08wRkJSVTg3UVVGRFVEdEJRVU5CT3p0QlFVVkJMRmxCUVZrc1YwRkJWeXhIUVVGSExFOUJRVThzUlVGQlJTeHJSVUZCYTBVN1FVRkRja2M3T3pzN096czdVME5vWTBFN1UwRkRRVHM3VTBGRlFUdFRRVU5CTzFOQlEwRTdVMEZEUVR0VFFVTkJPMU5CUTBFN1UwRkRRVHRUUVVOQk8xTkJRMEU3VTBGRFFUdFRRVU5CTzFOQlEwRTdVMEZEUVRzN1UwRkZRVHRUUVVOQk96dFRRVVZCTzFOQlEwRTdVMEZEUVRzN096czdWVU4wUWtFN1ZVRkRRVHRWUVVOQk8xVkJRMEU3VlVGRFFTeDVRMEZCZVVNc2QwTkJRWGRETzFWQlEycEdPMVZCUTBFN1ZVRkRRVHM3T3pzN1ZVTlFRVHRWUVVOQk8xVkJRMEU3VlVGRFFUdFZRVU5CTEVkQlFVYzdWVUZEU0R0VlFVTkJPMVZCUTBFc1EwRkJRenM3T3pzN1ZVTlFSRHM3T3pzN1ZVTkJRVHRWUVVOQk8xVkJRMEU3VlVGRFFTeDFSRUZCZFVRc2FVSkJRV2xDTzFWQlEzaEZPMVZCUTBFc1owUkJRV2RFTEdGQlFXRTdWVUZETjBRN096czdPenM3T3pzN096czdPenM3T3pzN096czdPenM3T3p0QlEwMXJRanM3UVVGRldEdEJRVU5RTEZsQlFWazdRVUZEV2l4WFFVRlhPMEZCUTFnc1kwRkJZenRCUVVOa0xFdEJRVXM3UVVGRFRDeHpRa0ZCYzBJN1FVRkRkRUlzUzBGQlN6dEJRVU5NTEZWQlFWVTdRVUZEVml4alFVRmpPMEZCUTJRc2FVSkJRV2xDTzBGQlEycENPenRCUVdOM1FqczdRVUZGYWtJN1FVRkRVQ3hqUVVGak8wRkJRMlFzY1VKQlFYRkNPMEZCUTNKQ0xIRkNRVUZ4UWp0QlFVTnlRaXhoUVVGaE8wRkJRMklzYjBKQlFXOUNPMEZCUTNCQ0xITkNRVUZ6UWp0QlFVTjBRaXhyUWtGQmEwSTdRVUZEYkVJc1owSkJRV2RDTzBGQlEyaENPenRCUVUwNFFqczdRVUZGZGtJN1FVRkRVQ3hqUVVGakxHOUZRVUZ0UWp0QlFVTnFReXhqUVVGak8wRkJRMlFzVlVGQlZUdEJRVU5XTEZWQlFWVTdRVUZEVmpzN1FVRkZiME03UVVGRFZ6czdRVUZQTjBNaUxDSnpiM1Z5WTJWeklqcGJJbmRsWW5CaFkyczZMeTlxYVdKekx5NHZibTlrWlY5dGIyUjFiR1Z6TDJSbFlXUmlaV1ZtTDJ4cFlpOXBibVJsZUM1cWN5SXNJbmRsWW5CaFkyczZMeTlxYVdKekx5NHZiR2xpTDJOdmJYQnZibVZ1ZEM1cWN5SXNJbmRsWW5CaFkyczZMeTlxYVdKekx5NHZiR2xpTDJWMlpXNTBjeTVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMMnBwWWk1cWN5SXNJbmRsWW5CaFkyczZMeTlxYVdKekx5NHZiR2xpTDNKbGJtUmxjbVZ5Y3k5cGJtUmxlQzVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMM0psYm1SbGNtVnljeTl5Wlc1a1pYSmxjaTVxY3lJc0luZGxZbkJoWTJzNkx5OXFhV0p6THk0dmJHbGlMM0psYm1SbGNtVnljeTl5YjI5MExXNXZaR1V1YW5NaUxDSjNaV0p3WVdOck9pOHZhbWxpY3k4dUwyeHBZaTkxZEdsc2N5NXFjeUlzSW5kbFluQmhZMnM2THk5cWFXSnpMM2RsWW5CaFkyc3ZZbTl2ZEhOMGNtRndJaXdpZDJWaWNHRmphem92TDJwcFluTXZkMlZpY0dGamF5OXlkVzUwYVcxbEwyUmxabWx1WlNCd2NtOXdaWEowZVNCblpYUjBaWEp6SWl3aWQyVmljR0ZqYXpvdkwycHBZbk12ZDJWaWNHRmpheTl5ZFc1MGFXMWxMMmRzYjJKaGJDSXNJbmRsWW5CaFkyczZMeTlxYVdKekwzZGxZbkJoWTJzdmNuVnVkR2x0WlM5b1lYTlBkMjVRY205d1pYSjBlU0J6YUc5eWRHaGhibVFpTENKM1pXSndZV05yT2k4dmFtbGljeTkzWldKd1lXTnJMM0oxYm5ScGJXVXZiV0ZyWlNCdVlXMWxjM0JoWTJVZ2IySnFaV04wSWl3aWQyVmljR0ZqYXpvdkwycHBZbk12TGk5c2FXSXZhVzVrWlhndWFuTWlYU3dpYzI5MWNtTmxjME52Ym5SbGJuUWlPbHNpTHk4Z1EyOXdlWEpwWjJoMElESXdNaklnVjNsaGRIUWdSM0psWlc1M1lYbGNibHh1SjNWelpTQnpkSEpwWTNRbk8xeHVYRzVqYjI1emRDQjBhR2x6UjJ4dlltRnNJRDBnS0NoMGVYQmxiMllnZDJsdVpHOTNJQ0U5UFNBbmRXNWtaV1pwYm1Wa0p5a2dQeUIzYVc1a2IzY2dPaUJuYkc5aVlXd3BJSHg4SUhSb2FYTTdYRzVqYjI1emRDQkVSVUZFUWtWRlJsOVNSVVpmVFVGUVgwdEZXU0E5SUZONWJXSnZiQzVtYjNJb0owQkFaR1ZoWkdKbFpXWlNaV1pOWVhBbktUdGNibU52Ym5OMElGVk9TVkZWUlY5SlJGOVRXVTFDVDB3Z1BTQlRlVzFpYjJ3dVptOXlLQ2RBUUdSbFlXUmlaV1ZtVlc1cGNYVmxTVVFuS1R0Y2JtTnZibk4wSUhKbFprMWhjQ0E5SUNoMGFHbHpSMnh2WW1Gc1cwUkZRVVJDUlVWR1gxSkZSbDlOUVZCZlMwVlpYU2tnUHlCMGFHbHpSMnh2WW1Gc1cwUkZRVVJDUlVWR1gxSkZSbDlOUVZCZlMwVlpYU0E2SUc1bGR5QlhaV0ZyVFdGd0tDazdYRzVqYjI1emRDQnBaRWhsYkhCbGNuTWdQU0JiWFR0Y2JseHVhV1lnS0NGMGFHbHpSMnh2WW1Gc1cwUkZRVVJDUlVWR1gxSkZSbDlOUVZCZlMwVlpYU2xjYmlBZ2RHaHBjMGRzYjJKaGJGdEVSVUZFUWtWRlJsOVNSVVpmVFVGUVgwdEZXVjBnUFNCeVpXWk5ZWEE3WEc1Y2JteGxkQ0IxZFdsa1EyOTFiblJsY2lBOUlEQnVPMXh1WEc1bWRXNWpkR2x2YmlCblpYUklaV3h3WlhKR2IzSldZV3gxWlNoMllXeDFaU2tnZTF4dUlDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0JwWkVobGJIQmxjbk11YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUd4bGRDQjdJR2hsYkhCbGNpd2daMlZ1WlhKaGRHOXlJSDBnUFNCcFpFaGxiSEJsY25OYmFWMDdYRzRnSUNBZ2FXWWdLR2hsYkhCbGNpaDJZV3gxWlNrcFhHNGdJQ0FnSUNCeVpYUjFjbTRnWjJWdVpYSmhkRzl5TzF4dUlDQjlYRzU5WEc1Y2JtWjFibU4wYVc5dUlHRnVlWFJvYVc1blZHOUpSQ2hmWVhKbkxDQmZZV3h5WldGa2VWWnBjMmwwWldRcElIdGNiaUFnYkdWMElHRnlaeUE5SUY5aGNtYzdYRzRnSUdsbUlDaGhjbWNnYVc1emRHRnVZMlZ2WmlCT2RXMWlaWElnZkh3Z1lYSm5JR2x1YzNSaGJtTmxiMllnVTNSeWFXNW5JSHg4SUdGeVp5QnBibk4wWVc1alpXOW1JRUp2YjJ4bFlXNHBYRzRnSUNBZ1lYSm5JRDBnWVhKbkxuWmhiSFZsVDJZb0tUdGNibHh1SUNCc1pYUWdkSGx3WlU5bUlEMGdkSGx3Wlc5bUlHRnlaenRjYmx4dUlDQnBaaUFvZEhsd1pVOW1JRDA5UFNBbmJuVnRZbVZ5SnlBbUppQmhjbWNnUFQwOUlEQXBJSHRjYmlBZ0lDQnBaaUFvVDJKcVpXTjBMbWx6S0dGeVp5d2dMVEFwS1Z4dUlDQWdJQ0FnY21WMGRYSnVJQ2R1ZFcxaVpYSTZMVEFuTzF4dVhHNGdJQ0FnY21WMGRYSnVJQ2R1ZFcxaVpYSTZLekFuTzF4dUlDQjlYRzVjYmlBZ2FXWWdLSFI1Y0dWUFppQTlQVDBnSjNONWJXSnZiQ2NwWEc0Z0lDQWdjbVYwZFhKdUlHQnplVzFpYjJ3NkpIdGhjbWN1ZEc5VGRISnBibWNvS1gxZ08xeHVYRzRnSUdsbUlDaGhjbWNnUFQwZ2JuVnNiQ0I4ZkNCMGVYQmxUMllnUFQwOUlDZHVkVzFpWlhJbklIeDhJSFI1Y0dWUFppQTlQVDBnSjJKdmIyeGxZVzRuSUh4OElIUjVjR1ZQWmlBOVBUMGdKM04wY21sdVp5Y2dmSHdnZEhsd1pVOW1JRDA5UFNBblltbG5hVzUwSnlrZ2UxeHVJQ0FnSUdsbUlDaDBlWEJsVDJZZ1BUMDlJQ2R1ZFcxaVpYSW5LVnh1SUNBZ0lDQWdjbVYwZFhKdUlDaGhjbWNnUENBd0tTQS9JR0J1ZFcxaVpYSTZKSHRoY21kOVlDQTZJR0J1ZFcxaVpYSTZLeVI3WVhKbmZXQTdYRzVjYmlBZ0lDQnBaaUFvZEhsd1pVOW1JRDA5UFNBblltbG5hVzUwSnlBbUppQmhjbWNnUFQwOUlEQnVLVnh1SUNBZ0lDQWdjbVYwZFhKdUlDZGlhV2RwYm5RNkt6QW5PMXh1WEc0Z0lDQWdjbVYwZFhKdUlHQWtlM1I1Y0dWUFpuMDZKSHRoY21kOVlEdGNiaUFnZlZ4dVhHNGdJR3hsZENCcFpFaGxiSEJsY2lBOUlDaHBaRWhsYkhCbGNuTXViR1Z1WjNSb0lENGdNQ0FtSmlCblpYUklaV3h3WlhKR2IzSldZV3gxWlNoaGNtY3BLVHRjYmlBZ2FXWWdLR2xrU0dWc2NHVnlLVnh1SUNBZ0lISmxkSFZ5YmlCaGJubDBhR2x1WjFSdlNVUW9hV1JJWld4d1pYSW9ZWEpuS1NrN1hHNWNiaUFnYVdZZ0tGVk9TVkZWUlY5SlJGOVRXVTFDVDB3Z2FXNGdZWEpuSUNZbUlIUjVjR1Z2WmlCaGNtZGJWVTVKVVZWRlgwbEVYMU5aVFVKUFRGMGdQVDA5SUNkbWRXNWpkR2x2YmljcElIdGNiaUFnSUNBdkx5QlFjbVYyWlc1MElHbHVabWx1YVhSbElISmxZM1Z5YzJsdmJseHVJQ0FnSUdsbUlDZ2hYMkZzY21WaFpIbFdhWE5wZEdWa0lIeDhJQ0ZmWVd4eVpXRmtlVlpwYzJsMFpXUXVhR0Z6S0dGeVp5a3BJSHRjYmlBZ0lDQWdJR3hsZENCaGJISmxZV1I1Vm1semFYUmxaQ0E5SUY5aGJISmxZV1I1Vm1semFYUmxaQ0I4ZkNCdVpYY2dVMlYwS0NrN1hHNGdJQ0FnSUNCaGJISmxZV1I1Vm1semFYUmxaQzVoWkdRb1lYSm5LVHRjYmlBZ0lDQWdJSEpsZEhWeWJpQmhibmwwYUdsdVoxUnZTVVFvWVhKblcxVk9TVkZWUlY5SlJGOVRXVTFDVDB4ZEtDa3NJR0ZzY21WaFpIbFdhWE5wZEdWa0tUdGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnBaaUFvSVhKbFprMWhjQzVvWVhNb1lYSm5LU2tnZTF4dUlDQWdJR3hsZENCclpYa2dQU0JnSkh0MGVYQmxiMllnWVhKbmZUb2tleXNyZFhWcFpFTnZkVzUwWlhKOVlEdGNiaUFnSUNCeVpXWk5ZWEF1YzJWMEtHRnlaeXdnYTJWNUtUdGNiaUFnSUNCeVpYUjFjbTRnYTJWNU8xeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlISmxaazFoY0M1blpYUW9ZWEpuS1R0Y2JuMWNibHh1Wm5WdVkzUnBiMjRnWkdWaFpHSmxaV1lvS1NCN1hHNGdJR3hsZENCd1lYSjBjeUE5SUZzZ1lYSm5kVzFsYm5SekxteGxibWQwYUNCZE8xeHVJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCaGNtZDFiV1Z1ZEhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5bGNiaUFnSUNCd1lYSjBjeTV3ZFhOb0tHRnVlWFJvYVc1blZHOUpSQ2hoY21kMWJXVnVkSE5iYVYwcEtUdGNibHh1SUNCeVpYUjFjbTRnY0dGeWRITXVhbTlwYmlnbk9pY3BPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmtaV0ZrWW1WbFpsTnZjblJsWkNncElIdGNiaUFnYkdWMElIQmhjblJ6SUQwZ1d5QmhjbWQxYldWdWRITXViR1Z1WjNSb0lGMDdYRzRnSUdadmNpQW9iR1YwSUdrZ1BTQXdMQ0JwYkNBOUlHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLVnh1SUNBZ0lIQmhjblJ6TG5CMWMyZ29ZVzU1ZEdocGJtZFViMGxFS0dGeVozVnRaVzUwYzF0cFhTa3BPMXh1WEc0Z0lISmxkSFZ5YmlCd1lYSjBjeTV6YjNKMEtDa3VhbTlwYmlnbk9pY3BPMXh1ZlZ4dVhHNW1kVzVqZEdsdmJpQm5aVzVsY21GMFpVbEVSbTl5S0dobGJIQmxjaXdnWjJWdVpYSmhkRzl5S1NCN1hHNGdJR2xrU0dWc2NHVnljeTV3ZFhOb0tIc2dhR1ZzY0dWeUxDQm5aVzVsY21GMGIzSWdmU2s3WEc1OVhHNWNibVoxYm1OMGFXOXVJSEpsYlc5MlpVbEVSMlZ1WlhKaGRHOXlLR2hsYkhCbGNpa2dlMXh1SUNCc1pYUWdhVzVrWlhnZ1BTQnBaRWhsYkhCbGNuTXVabWx1WkVsdVpHVjRLQ2hwZEdWdEtTQTlQaUFvYVhSbGJTNW9aV3h3WlhJZ1BUMDlJR2hsYkhCbGNpa3BPMXh1SUNCcFppQW9hVzVrWlhnZ1BDQXdLVnh1SUNBZ0lISmxkSFZ5Ymp0Y2JseHVJQ0JwWkVobGJIQmxjbk11YzNCc2FXTmxLR2x1WkdWNExDQXhLVHRjYm4xY2JseHVUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblJwWlhNb1pHVmhaR0psWldZc0lIdGNiaUFnSjJsa1UzbHRKem9nZTF4dUlDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNCMllXeDFaVG9nSUNBZ0lDQWdJRlZPU1ZGVlJWOUpSRjlUV1UxQ1Qwd3NYRzRnSUgwc1hHNGdJQ2R6YjNKMFpXUW5PaUI3WEc0Z0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdaR1ZoWkdKbFpXWlRiM0owWldRc1hHNGdJSDBzWEc0Z0lDZG5aVzVsY21GMFpVbEVSbTl5SnpvZ2UxeHVJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUdkbGJtVnlZWFJsU1VSR2IzSXNYRzRnSUgwc1hHNGdJQ2R5WlcxdmRtVkpSRWRsYm1WeVlYUnZjaWM2SUh0Y2JpQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUhSeWRXVXNYRzRnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J5WlcxdmRtVkpSRWRsYm1WeVlYUnZjaXhjYmlBZ2ZTeGNibjBwTzF4dVhHNXRiMlIxYkdVdVpYaHdiM0owY3lBOUlHUmxZV1JpWldWbU8xeHVJaXdpTHlvZ1oyeHZZbUZzSUVKMVptWmxjaUFxTDF4dVhHNXBiWEJ2Y25RZ1pHVmhaR0psWldZZ1puSnZiU0FuWkdWaFpHSmxaV1luTzF4dWFXMXdiM0owSUhzZ1JYWmxiblJGYldsMGRHVnlJSDBnWm5KdmJTQW5MaTlsZG1WdWRITXVhbk1uTzF4dWFXMXdiM0owSUNvZ1lYTWdWWFJwYkhNZ0lDQWdJQ0FnWm5KdmJTQW5MaTkxZEdsc2N5NXFjeWM3WEc1cGJYQnZjblFnZTF4dUlDQWtMRnh1SUNCcGMwcHBZbWx6YUN4Y2JpQWdjbVZ6YjJ4MlpVTm9hV3hrY21WdUxGeHVJQ0JqYjI1emRISjFZM1JLYVdJc1hHNTlJR1p5YjIwZ0p5NHZhbWxpTG1wekp6dGNibHh1Wlhod2IzSjBJR052Ym5OMElGVlFSRUZVUlY5RlZrVk9WQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BTQW5RR3BwWW5NdlkyOXRjRzl1Wlc1MEwyVjJaVzUwTDNWd1pHRjBaU2M3WEc1bGVIQnZjblFnWTI5dWMzUWdVVlZGVlVWZlZWQkVRVlJGWDAxRlZFaFBSQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzl4ZFdWMVpWVndaR0YwWlNjcE8xeHVaWGh3YjNKMElHTnZibk4wSUVaTVZWTklYMVZRUkVGVVJWOU5SVlJJVDBRZ0lDQWdJQ0FnUFNCVGVXMWliMnd1Wm05eUtDZEFhbWxpY3k5amIyMXdiMjVsYm5RdlpteDFjMmhWY0dSaGRHVW5LVHRjYm1WNGNHOXlkQ0JqYjI1emRDQkpUa2xVWDAxRlZFaFBSQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTXZZMjl0Y0c5dVpXNTBMMTlmYVc1cGRDY3BPMXh1Wlhod2IzSjBJR052Ym5OMElGTkxTVkJmVTFSQlZFVmZWVkJFUVZSRlV5QWdJQ0FnSUNBZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWN5OWpiMjF3YjI1bGJuUXZjMnRwY0ZOMFlYUmxWWEJrWVhSbGN5Y3BPMXh1Wlhod2IzSjBJR052Ym5OMElGQkZUa1JKVGtkZlUxUkJWRVZmVlZCRVFWUkZJQ0FnSUNBZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWN5OWpiMjF3YjI1bGJuUXZjR1Z1WkdsdVoxTjBZWFJsVlhCa1lYUmxKeWs3WEc1bGVIQnZjblFnWTI5dWMzUWdURUZUVkY5U1JVNUVSVkpmVkVsTlJTQWdJQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMMk52YlhCdmJtVnVkQzlzWVhOMFVtVnVaR1Z5VkdsdFpTY3BPMXh1Wlhod2IzSjBJR052Ym5OMElGQlNSVlpKVDFWVFgxTlVRVlJGSUNBZ0lDQWdJQ0FnSUNBZ1BTQlRlVzFpYjJ3dVptOXlLQ2RBYW1saWN5OWpiMjF3YjI1bGJuUXZjSEpsZG1sdmRYTlRkR0YwWlNjcE8xeHVaWGh3YjNKMElHTnZibk4wSUVOQlVGUlZVa1ZmVWtWR1JWSkZUa05GWDAxRlZFaFBSRk1nUFNCVGVXMWliMnd1Wm05eUtDZEFhbWxpY3k5amIyMXdiMjVsYm5RdmNISmxkbWx2ZFhOVGRHRjBaU2NwTzF4dVhHNWpiMjV6ZENCbGJHVnRaVzUwUkdGMFlVTmhZMmhsSUQwZ2JtVjNJRmRsWVd0TllYQW9LVHRjYmx4dVpuVnVZM1JwYjI0Z2FYTldZV3hwWkZOMFlYUmxUMkpxWldOMEtIWmhiSFZsS1NCN1hHNGdJR2xtSUNoMllXeDFaU0E5UFNCdWRXeHNLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQnBaaUFvVDJKcVpXTjBMbWx6S0haaGJIVmxMQ0JPWVU0cEtWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCcFppQW9UMkpxWldOMExtbHpLSFpoYkhWbExDQkpibVpwYm1sMGVTa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2gyWVd4MVpTQnBibk4wWVc1alpXOW1JRUp2YjJ4bFlXNGdmSHdnZG1Gc2RXVWdhVzV6ZEdGdVkyVnZaaUJPZFcxaVpYSWdmSHdnZG1Gc2RXVWdhVzV6ZEdGdVkyVnZaaUJUZEhKcGJtY3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHeGxkQ0IwZVhCbFQyWWdQU0IwZVhCbGIyWWdkbUZzZFdVN1hHNGdJR2xtSUNoMGVYQmxUMllnUFQwOUlDZHpkSEpwYm1jbklIeDhJSFI1Y0dWUFppQTlQVDBnSjI1MWJXSmxjaWNnZkh3Z2RIbHdaVTltSUQwOVBTQW5ZbTl2YkdWaGJpY3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lHbG1JQ2hCY25KaGVTNXBjMEZ5Y21GNUtIWmhiSFZsS1NsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNWNiaUFnYVdZZ0tIUjVjR1Z2WmlCQ2RXWm1aWElnSVQwOUlDZDFibVJsWm1sdVpXUW5JQ1ltSUVKMVptWmxjaTVwYzBKMVptWmxjaWgyWVd4MVpTa3BYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1WEc0Z0lISmxkSFZ5YmlCMGNuVmxPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1kyeGhjM01nUTI5dGNHOXVaVzUwSUdWNGRHVnVaSE1nUlhabGJuUkZiV2wwZEdWeUlIdGNiaUFnYzNSaGRHbGpJRlZRUkVGVVJWOUZWa1ZPVkNBOUlGVlFSRUZVUlY5RlZrVk9WRHRjYmx4dUlDQmJVVlZGVlVWZlZWQkVRVlJGWDAxRlZFaFBSRjBvS1NCN1hHNGdJQ0FnYVdZZ0tIUm9hWE5iVUVWT1JFbE9SMTlUVkVGVVJWOVZVRVJCVkVWZEtWeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJQ0FnZEdocGMxdFFSVTVFU1U1SFgxTlVRVlJGWDFWUVJFRlVSVjBnUFNCUWNtOXRhWE5sTG5KbGMyOXNkbVVvS1R0Y2JpQWdJQ0IwYUdselcxQkZUa1JKVGtkZlUxUkJWRVZmVlZCRVFWUkZYUzUwYUdWdUtIUm9hWE5iUmt4VlUwaGZWVkJFUVZSRlgwMUZWRWhQUkYwdVltbHVaQ2gwYUdsektTazdYRzRnSUgxY2JseHVJQ0JiUmt4VlUwaGZWVkJFUVZSRlgwMUZWRWhQUkYwb0tTQjdYRzRnSUNBZ0x5OGdWMkZ6SUhSb1pTQnpkR0YwWlNCMWNHUmhkR1VnWTJGdVkyVnNiR1ZrUDF4dUlDQWdJR2xtSUNnaGRHaHBjMXRRUlU1RVNVNUhYMU5VUVZSRlgxVlFSRUZVUlYwcFhHNGdJQ0FnSUNCeVpYUjFjbTQ3WEc1Y2JpQWdJQ0IwYUdsekxtVnRhWFFvVlZCRVFWUkZYMFZXUlU1VUtUdGNibHh1SUNBZ0lIUm9hWE5iVUVWT1JFbE9SMTlUVkVGVVJWOVZVRVJCVkVWZElEMGdiblZzYkR0Y2JpQWdmVnh1WEc0Z0lGdEpUa2xVWDAxRlZFaFBSRjBvS1NCN1hHNGdJQ0FnZEdocGMxdFRTMGxRWDFOVVFWUkZYMVZRUkVGVVJWTmRJRDBnWm1Gc2MyVTdYRzRnSUgxY2JseHVJQ0JqYjI1emRISjFZM1J2Y2loZmFtbGlLU0I3WEc0Z0lDQWdjM1Z3WlhJb0tUdGNibHh1SUNBZ0lDOHZJRUpwYm1RZ1lXeHNJR05zWVhOeklHMWxkR2h2WkhNZ2RHOGdYQ0owYUdselhDSmNiaUFnSUNCVmRHbHNjeTVpYVc1a1RXVjBhRzlrY3k1allXeHNLSFJvYVhNc0lIUm9hWE11WTI5dWMzUnlkV04wYjNJdWNISnZkRzkwZVhCbEtUdGNibHh1SUNBZ0lHeGxkQ0JxYVdJZ1BTQmZhbWxpSUh4OElIdDlPMXh1WEc0Z0lDQWdZMjl1YzNRZ1kzSmxZWFJsVG1WM1UzUmhkR1VnUFNBb0tTQTlQaUI3WEc0Z0lDQWdJQ0JzWlhRZ2JHOWpZV3hUZEdGMFpTQTlJRTlpYW1WamRDNWpjbVZoZEdVb2JuVnNiQ2s3WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJ1WlhjZ1VISnZlSGtvYkc5allXeFRkR0YwWlN3Z2UxeHVJQ0FnSUNBZ0lDQm5aWFE2SUNoMFlYSm5aWFFzSUhCeWIzQk9ZVzFsS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJoY21kbGRGdHdjbTl3VG1GdFpWMDdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUhObGREb2dLSFJoY21kbGRDd2djSEp2Y0U1aGJXVXNJSFpoYkhWbEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJR04xY25KbGJuUldZV3gxWlNBOUlIUmhjbWRsZEZ0d2NtOXdUbUZ0WlYwN1hHNGdJQ0FnSUNBZ0lDQWdhV1lnS0dOMWNuSmxiblJXWVd4MVpTQTlQVDBnZG1Gc2RXVXBYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lDQWdJQ0FnSUdsbUlDZ2hkR2hwYzF0VFMwbFFYMU5VUVZSRlgxVlFSRUZVUlZOZEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnZEdocGMxdFJWVVZWUlY5VlVFUkJWRVZmVFVWVVNFOUVYU2dwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdkR0Z5WjJWMFczQnliM0JPWVcxbFhTQTlJSFpoYkhWbE8xeHVJQ0FnSUNBZ0lDQWdJSFJvYVhNdWIyNVRkR0YwWlZWd1pHRjBaV1FvY0hKdmNFNWhiV1VzSUhaaGJIVmxMQ0JqZFhKeVpXNTBWbUZzZFdVcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQjlLVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdiR1YwSUhCeWIzQnpJQ0FnSUNBZ0lEMGdUMkpxWldOMExtRnpjMmxuYmloUFltcGxZM1F1WTNKbFlYUmxLRzUxYkd3cExDQnFhV0l1Y0hKdmNITWdmSHdnZTMwcE8xeHVJQ0FnSUd4bGRDQmZiRzlqWVd4VGRHRjBaU0E5SUdOeVpXRjBaVTVsZDFOMFlYUmxLQ2s3WEc1Y2JpQWdJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEdsbGN5aDBhR2x6TENCN1hHNGdJQ0FnSUNCYlUwdEpVRjlUVkVGVVJWOVZVRVJCVkVWVFhUb2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJRnRRUlU1RVNVNUhYMU5VUVZSRlgxVlFSRUZVUlYwNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnVUhKdmJXbHpaUzV5WlhOdmJIWmxLQ2tzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnVzB4QlUxUmZVa1ZPUkVWU1gxUkpUVVZkT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJRlYwYVd4ekxtNXZkeWdwTEZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUZ0RFFWQlVWVkpGWDFKRlJrVlNSVTVEUlY5TlJWUklUMFJUWFRvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0I3ZlN4Y2JpQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBbmFXUW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdhbWxpTG1sa0xGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHdjbTl3Y3ljNklIdGNiaUFnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIWmhiSFZsT2lBZ0lDQWdJQ0FnY0hKdmNITXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMk5vYVd4a2NtVnVKem9nZTF4dUlDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lHVnVkVzFsY21GaWJHVTZJQ0FnWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJR052Ym1acFozVnlZV0pzWlRvZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQnFhV0l1WTJocGJHUnlaVzRnZkh3Z1cxMHNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMk52Ym5SbGVIUW5PaUI3WEc0Z0lDQWdJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lHcHBZaTVqYjI1MFpYaDBJSHg4SUU5aWFtVmpkQzVqY21WaGRHVW9iblZzYkNrc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0ozTjBZWFJsSnpvZ2UxeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdkbGREb2dJQ0FnSUNBZ0lDQWdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQmZiRzlqWVd4VGRHRjBaVHRjYmlBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNBZ2MyVjBPaUFnSUNBZ0lDQWdJQ0FvZG1Gc2RXVXBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvSVdselZtRnNhV1JUZEdGMFpVOWlhbVZqZENoMllXeDFaU2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dWSGx3WlVWeWNtOXlLR0JKYm5aaGJHbGtJSFpoYkhWbElHWnZjaUJjSW5Sb2FYTXVjM1JoZEdWY0lqb2dYQ0lrZTNaaGJIVmxmVndpTGlCUWNtOTJhV1JsWkNCY0luTjBZWFJsWENJZ2JYVnpkQ0JpWlNCaGJpQnBkR1Z5WVdKc1pTQnZZbXBsWTNRdVlDazdYRzVjYmlBZ0lDQWdJQ0FnSUNCUFltcGxZM1F1WVhOemFXZHVLRjlzYjJOaGJGTjBZWFJsTENCMllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUgwcE8xeHVJQ0I5WEc1Y2JpQWdjbVZ6YjJ4MlpVTm9hV3hrY21WdUtHTm9hV3hrY21WdUtTQjdYRzRnSUNBZ2NtVjBkWEp1SUhKbGMyOXNkbVZEYUdsc1pISmxiaTVqWVd4c0tIUm9hWE1zSUdOb2FXeGtjbVZ1S1R0Y2JpQWdmVnh1WEc0Z0lHbHpTbWxpS0haaGJIVmxLU0I3WEc0Z0lDQWdjbVYwZFhKdUlHbHpTbWxpYVhOb0tIWmhiSFZsS1R0Y2JpQWdmVnh1WEc0Z0lHTnZibk4wY25WamRFcHBZaWgyWVd4MVpTa2dlMXh1SUNBZ0lISmxkSFZ5YmlCamIyNXpkSEoxWTNSS2FXSW9kbUZzZFdVcE8xeHVJQ0I5WEc1Y2JpQWdjSFZ6YUZKbGJtUmxjaWh5Wlc1a1pYSlNaWE4xYkhRcElIdGNiaUFnSUNCMGFHbHpMbVZ0YVhRb1ZWQkVRVlJGWDBWV1JVNVVMQ0J5Wlc1a1pYSlNaWE4xYkhRcE8xeHVJQ0I5WEc1Y2JpQWdMeThnWlhOc2FXNTBMV1JwYzJGaWJHVXRibVY0ZEMxc2FXNWxJRzV2TFhWdWRYTmxaQzEyWVhKelhHNGdJRzl1VUhKdmNGVndaR0YwWldRb2NISnZjRTVoYldVc0lHNWxkMVpoYkhWbExDQnZiR1JXWVd4MVpTa2dlMXh1SUNCOVhHNWNiaUFnTHk4Z1pYTnNhVzUwTFdScGMyRmliR1V0Ym1WNGRDMXNhVzVsSUc1dkxYVnVkWE5sWkMxMllYSnpYRzRnSUc5dVUzUmhkR1ZWY0dSaGRHVmtLSEJ5YjNCT1lXMWxMQ0J1WlhkV1lXeDFaU3dnYjJ4a1ZtRnNkV1VwSUh0Y2JpQWdmVnh1WEc0Z0lHTmhjSFIxY21WU1pXWmxjbVZ1WTJVb2JtRnRaU3dnYVc1MFpYSmpaWEIwYjNKRFlXeHNZbUZqYXlrZ2UxeHVJQ0FnSUd4bGRDQnRaWFJvYjJRZ1BTQjBhR2x6VzBOQlVGUlZVa1ZmVWtWR1JWSkZUa05GWDAxRlZFaFBSRk5kVzI1aGJXVmRPMXh1SUNBZ0lHbG1JQ2h0WlhSb2IyUXBYRzRnSUNBZ0lDQnlaWFIxY200Z2JXVjBhRzlrTzF4dVhHNGdJQ0FnYldWMGFHOWtJRDBnS0Y5eVpXWXNJSEJ5WlhacGIzVnpVbVZtS1NBOVBpQjdYRzRnSUNBZ0lDQnNaWFFnY21WbUlEMGdYM0psWmp0Y2JseHVJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQnBiblJsY21ObGNIUnZja05oYkd4aVlXTnJJRDA5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ0lDQnlaV1lnUFNCcGJuUmxjbU5sY0hSdmNrTmhiR3hpWVdOckxtTmhiR3dvZEdocGN5d2djbVZtTENCd2NtVjJhVzkxYzFKbFppazdYRzVjYmlBZ0lDQWdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowYVdWektIUm9hWE1zSUh0Y2JpQWdJQ0FnSUNBZ1cyNWhiV1ZkT2lCN1hHNGdJQ0FnSUNBZ0lDQWdkM0pwZEdGaWJHVTZJQ0FnSUNCMGNuVmxMRnh1SUNBZ0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdjbVZtTEZ4dUlDQWdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdhVzUwWlhKalpYQjBiM0pEWVd4c1ltRmpheUFoUFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNBZ0lIUm9hWE5iUTBGUVZGVlNSVjlTUlVaRlVrVk9RMFZmVFVWVVNFOUVVMTBnUFNCdFpYUm9iMlE3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdiV1YwYUc5a08xeHVJQ0I5WEc1Y2JpQWdabTl5WTJWVmNHUmhkR1VvS1NCN1hHNGdJQ0FnZEdocGMxdFJWVVZWUlY5VlVFUkJWRVZmVFVWVVNFOUVYU2dwTzF4dUlDQjlYRzVjYmlBZ1oyVjBVM1JoZEdVb2NISnZjR1Z5ZEhsUVlYUm9MQ0JrWldaaGRXeDBWbUZzZFdVcElIdGNiaUFnSUNCc1pYUWdjM1JoZEdVZ1BTQjBhR2x6TG5OMFlYUmxPMXh1SUNBZ0lHbG1JQ2hoY21kMWJXVnVkSE11YkdWdVozUm9JRDA5UFNBd0tWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhOMFlYUmxPMXh1WEc0Z0lDQWdhV1lnS0ZWMGFXeHpMbWx1YzNSaGJtTmxUMllvY0hKdmNHVnlkSGxRWVhSb0xDQW5iMkpxWldOMEp5a3BJSHRjYmlBZ0lDQWdJR3hsZENCclpYbHpJQ0FnSUNBZ0lDQTlJRTlpYW1WamRDNXJaWGx6S0hCeWIzQmxjblI1VUdGMGFDa3VZMjl1WTJGMEtFOWlhbVZqZEM1blpYUlBkMjVRY205d1pYSjBlVk41YldKdmJITW9jSEp2Y0dWeWRIbFFZWFJvS1NrN1hHNGdJQ0FnSUNCc1pYUWdabWx1WVd4VGRHRjBaU0FnUFNCN2ZUdGNibHh1SUNBZ0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQnJaWGtnUFNCclpYbHpXMmxkTzF4dUlDQWdJQ0FnSUNCc1pYUWdXeUIyWVd4MVpTd2diR0Z6ZEZCaGNuUWdYU0E5SUZWMGFXeHpMbVpsZEdOb1JHVmxjRkJ5YjNCbGNuUjVLSE4wWVhSbExDQnJaWGtzSUhCeWIzQmxjblI1VUdGMGFGdHJaWGxkTENCMGNuVmxLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tHeGhjM1JRWVhKMElEMDlJRzUxYkd3cFhHNGdJQ0FnSUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzVjYmlBZ0lDQWdJQ0FnWm1sdVlXeFRkR0YwWlZ0c1lYTjBVR0Z5ZEYwZ1BTQjJZV3gxWlR0Y2JpQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdacGJtRnNVM1JoZEdVN1hHNGdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQlZkR2xzY3k1bVpYUmphRVJsWlhCUWNtOXdaWEowZVNoemRHRjBaU3dnY0hKdmNHVnlkSGxRWVhSb0xDQmtaV1poZFd4MFZtRnNkV1VwTzF4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUhObGRGTjBZWFJsS0haaGJIVmxLU0I3WEc0Z0lDQWdhV1lnS0NGcGMxWmhiR2xrVTNSaGRHVlBZbXBsWTNRb2RtRnNkV1VwS1Z4dUlDQWdJQ0FnZEdoeWIzY2dibVYzSUZSNWNHVkZjbkp2Y2loZ1NXNTJZV3hwWkNCMllXeDFaU0JtYjNJZ1hDSjBhR2x6TG5ObGRGTjBZWFJsWENJNklGd2lKSHQyWVd4MVpYMWNJaTRnVUhKdmRtbGtaV1FnWENKemRHRjBaVndpSUcxMWMzUWdZbVVnWVc0Z2FYUmxjbUZpYkdVZ2IySnFaV04wTG1BcE8xeHVYRzRnSUNBZ1QySnFaV04wTG1GemMybG5iaWgwYUdsekxuTjBZWFJsTENCMllXeDFaU2s3WEc0Z0lIMWNibHh1SUNCelpYUlRkR0YwWlZCaGMzTnBkbVVvZG1Gc2RXVXBJSHRjYmlBZ0lDQnBaaUFvSVdselZtRnNhV1JUZEdGMFpVOWlhbVZqZENoMllXeDFaU2twWEc0Z0lDQWdJQ0IwYUhKdmR5QnVaWGNnVkhsd1pVVnljbTl5S0dCSmJuWmhiR2xrSUhaaGJIVmxJR1p2Y2lCY0luUm9hWE11YzJWMFUzUmhkR1ZRWVhOemFYWmxYQ0k2SUZ3aUpIdDJZV3gxWlgxY0lpNGdVSEp2ZG1sa1pXUWdYQ0p6ZEdGMFpWd2lJRzExYzNRZ1ltVWdZVzRnYVhSbGNtRmliR1VnYjJKcVpXTjBMbUFwTzF4dVhHNGdJQ0FnZEhKNUlIdGNiaUFnSUNBZ0lIUm9hWE5iVTB0SlVGOVRWRUZVUlY5VlVFUkJWRVZUWFNBOUlIUnlkV1U3WEc0Z0lDQWdJQ0JQWW1wbFkzUXVZWE56YVdkdUtIUm9hWE11YzNSaGRHVXNJSFpoYkhWbEtUdGNiaUFnSUNCOUlHWnBibUZzYkhrZ2UxeHVJQ0FnSUNBZ2RHaHBjMXRUUzBsUVgxTlVRVlJGWDFWUVJFRlVSVk5kSUQwZ1ptRnNjMlU3WEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnYzJodmRXeGtWWEJrWVhSbEtDa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNCOVhHNWNiaUFnWkdWemRISnZlU2dwSUh0Y2JpQWdJQ0JrWld4bGRHVWdkR2hwY3k1emRHRjBaVHRjYmlBZ0lDQmtaV3hsZEdVZ2RHaHBjeTV3Y205d2N6dGNiaUFnSUNCa1pXeGxkR1VnZEdocGN5NWpiMjUwWlhoME8xeHVJQ0FnSUdSbGJHVjBaU0IwYUdselcwTkJVRlJWVWtWZlVrVkdSVkpGVGtORlgwMUZWRWhQUkZOZE8xeHVJQ0FnSUhSb2FYTXVZMnhsWVhKQmJHeEVaV0p2ZFc1alpYTW9LVHRjYmlBZ2ZWeHVYRzRnSUhKbGJtUmxjbGRoYVhScGJtY29LU0I3WEc0Z0lIMWNibHh1SUNCeVpXNWtaWElvWTJocGJHUnlaVzRwSUh0Y2JpQWdJQ0J5WlhSMWNtNGdZMmhwYkdSeVpXNDdYRzRnSUgxY2JseHVJQ0IxY0dSaGRHVmtLQ2tnZTF4dUlDQjlYRzVjYmlBZ1kyOXRZbWx1WlZkcGRHZ29jMlZ3TENBdUxpNWhjbWR6S1NCN1hHNGdJQ0FnYkdWMElHWnBibUZzUVhKbmN5QTlJRzVsZHlCVFpYUW9LVHRjYmlBZ0lDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0JoY21kekxteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BJSHRjYmlBZ0lDQWdJR3hsZENCaGNtY2dQU0JoY21kelcybGRPMXh1SUNBZ0lDQWdhV1lnS0NGaGNtY3BYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdJQ0JwWmlBb1ZYUnBiSE11YVc1emRHRnVZMlZQWmloaGNtY3NJQ2R6ZEhKcGJtY25LU2tnZTF4dUlDQWdJQ0FnSUNCc1pYUWdkbUZzZFdWeklEMGdZWEpuTG5Od2JHbDBLSE5sY0NrdVptbHNkR1Z5S0ZWMGFXeHpMbWx6VG05MFJXMXdkSGtwTzF4dUlDQWdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQjJZV3gxWlhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlIWmhiSFZsYzF0cFhUdGNiaUFnSUNBZ0lDQWdJQ0JtYVc1aGJFRnlaM011WVdSa0tIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaEJjbkpoZVM1cGMwRnljbUY1S0dGeVp5a3BJSHRjYmlBZ0lDQWdJQ0FnYkdWMElIWmhiSFZsY3lBOUlHRnlaeTVtYVd4MFpYSW9LSFpoYkhWbEtTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ0YyWVd4MVpTbGNiaUFnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNBZ0lDQWdJQ0FnSUdsbUlDZ2hWWFJwYkhNdWFXNXpkR0Z1WTJWUFppaDJZV3gxWlN3Z0ozTjBjbWx1WnljcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRlYwYVd4ekxtbHpUbTkwUlcxd2RIa29kbUZzZFdVcE8xeHVJQ0FnSUNBZ0lDQjlLVHRjYmx4dUlDQWdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQjJZV3gxWlhNdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQjJZV3gxWlNBOUlIWmhiSFZsYzF0cFhUdGNiaUFnSUNBZ0lDQWdJQ0JtYVc1aGJFRnlaM011WVdSa0tIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHRnlaeXdnSjI5aWFtVmpkQ2NwS1NCN1hHNGdJQ0FnSUNBZ0lHeGxkQ0JyWlhseklEMGdUMkpxWldOMExtdGxlWE1vWVhKbktUdGNiaUFnSUNBZ0lDQWdabTl5SUNoc1pYUWdhU0E5SURBc0lHbHNJRDBnYTJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2JHVjBJR3RsZVNBZ0lEMGdhMlY1YzF0cFhUdGNiaUFnSUNBZ0lDQWdJQ0JzWlhRZ2RtRnNkV1VnUFNCaGNtZGJhMlY1WFR0Y2JseHVJQ0FnSUNBZ0lDQWdJR2xtSUNnaGRtRnNkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1pwYm1Gc1FYSm5jeTVrWld4bGRHVW9hMlY1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1SUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJR1pwYm1Gc1FYSm5jeTVoWkdRb2EyVjVLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJSEpsZEhWeWJpQkJjbkpoZVM1bWNtOXRLR1pwYm1Gc1FYSm5jeWt1YW05cGJpaHpaWEFnZkh3Z0p5Y3BPMXh1SUNCOVhHNWNiaUFnWTJ4aGMzTmxjeWd1TGk1aGNtZHpLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11WTI5dFltbHVaVmRwZEdnb0p5QW5MQ0F1TGk1aGNtZHpLVHRjYmlBZ2ZWeHVYRzRnSUdWNGRISmhZM1JEYUdsc1pISmxiaWhmY0dGMGRHVnlibk1zSUdOb2FXeGtjbVZ1TENCZmIzQjBhVzl1Y3lrZ2UxeHVJQ0FnSUd4bGRDQnZjSFJwYjI1eklDQWdQU0JmYjNCMGFXOXVjeUI4ZkNCN2ZUdGNiaUFnSUNCc1pYUWdaWGgwY21GamRHVmtJRDBnZTMwN1hHNGdJQ0FnYkdWMElIQmhkSFJsY201eklDQTlJRjl3WVhSMFpYSnVjenRjYmlBZ0lDQnNaWFFnYVhOQmNuSmhlU0FnSUQwZ1FYSnlZWGt1YVhOQmNuSmhlU2h3WVhSMFpYSnVjeWs3WEc1Y2JpQWdJQ0JqYjI1emRDQnBjMDFoZEdOb0lEMGdLR3BwWWlrZ1BUNGdlMXh1SUNBZ0lDQWdiR1YwSUdwcFlsUjVjR1VnUFNCcWFXSXVWSGx3WlR0Y2JpQWdJQ0FnSUdsbUlDaFZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHcHBZbFI1Y0dVc0lDZHpkSEpwYm1jbktTbGNiaUFnSUNBZ0lDQWdhbWxpVkhsd1pTQTlJR3BwWWxSNWNHVXVkRzlNYjNkbGNrTmhjMlVvS1R0Y2JseHVJQ0FnSUNBZ2FXWWdLR2x6UVhKeVlYa3BJSHRjYmlBZ0lDQWdJQ0FnWm05eUlDaHNaWFFnYVNBOUlEQXNJR2xzSUQwZ2NHRjBkR1Z5Ym5NdWJHVnVaM1JvT3lCcElEd2dhV3c3SUdrckt5a2dlMXh1SUNBZ0lDQWdJQ0FnSUd4bGRDQndZWFIwWlhKdUlEMGdjR0YwZEdWeWJuTmJhVjA3WEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9jR0YwZEdWeWJpd2dKM04wY21sdVp5Y3BLVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NHRjBkR1Z5YmlBOUlIQmhkSFJsY200dWRHOU1iM2RsY2tOaGMyVW9LVHRjYmx4dUlDQWdJQ0FnSUNBZ0lHbG1JQ2hxYVdKVWVYQmxJQ0U5UFNCd1lYUjBaWEp1S1Z4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzVjYmlBZ0lDQWdJQ0FnSUNCcFppQW9aWGgwY21GamRHVmtXM0JoZEhSbGNtNWRJQ1ltSUc5d2RHbHZibk11YlhWc2RHbHdiR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaFFYSnlZWGt1YVhOQmNuSmhlU2hsZUhSeVlXTjBaV1JiY0dGMGRHVnlibDBwS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0JsZUhSeVlXTjBaV1JiY0dGMGRHVnlibDBnUFNCYklHVjRkSEpoWTNSbFpGdHdZWFIwWlhKdVhTQmRPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQmxlSFJ5WVdOMFpXUmJjR0YwZEdWeWJsMHVjSFZ6YUNocWFXSXBPMXh1SUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmxlSFJ5WVdOMFpXUmJjR0YwZEdWeWJsMGdQU0JxYVdJN1hHNGdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJR3hsZENCclpYbHpJRDBnVDJKcVpXTjBMbXRsZVhNb2NHRjBkR1Z5Ym5NcE8xeHVJQ0FnSUNBZ0lDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0JyWlhsekxteGxibWQwYURzZ2FTQThJR2xzT3lCcEt5c3BJSHRjYmlBZ0lDQWdJQ0FnSUNCc1pYUWdhMlY1SUNBZ0lDQTlJR3RsZVhOYmFWMDdYRzRnSUNBZ0lDQWdJQ0FnYkdWMElIQmhkSFJsY200Z1BTQndZWFIwWlhKdWMxdHJaWGxkTzF4dUlDQWdJQ0FnSUNBZ0lHeGxkQ0J5WlhOMWJIUTdYRzVjYmlBZ0lDQWdJQ0FnSUNCcFppQW9WWFJwYkhNdWFXNXpkR0Z1WTJWUFppaHdZWFIwWlhKdUxDQlNaV2RGZUhBcEtWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBJRDBnY0dGMGRHVnliaTUwWlhOMEtHcHBZbFI1Y0dVcE8xeHVJQ0FnSUNBZ0lDQWdJR1ZzYzJVZ2FXWWdLRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9jR0YwZEdWeWJpd2dKM04wY21sdVp5Y3BLVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnpkV3gwSUQwZ0tIQmhkSFJsY200dWRHOU1iM2RsY2tOaGMyVW9LU0E5UFQwZ2FtbGlWSGx3WlNrN1hHNGdJQ0FnSUNBZ0lDQWdaV3h6WlZ4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ6ZFd4MElEMGdLSEJoZEhSbGNtNGdQVDA5SUdwcFlsUjVjR1VwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdhV1lnS0NGeVpYTjFiSFFwWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjUwYVc1MVpUdGNibHh1SUNBZ0lDQWdJQ0FnSUdsbUlDaGxlSFJ5WVdOMFpXUmJjR0YwZEdWeWJsMGdKaVlnYjNCMGFXOXVjeTV0ZFd4MGFYQnNaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0NGQmNuSmhlUzVwYzBGeWNtRjVLR1Y0ZEhKaFkzUmxaRnR3WVhSMFpYSnVYU2twWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJR1Y0ZEhKaFkzUmxaRnR3WVhSMFpYSnVYU0E5SUZzZ1pYaDBjbUZqZEdWa1czQmhkSFJsY201ZElGMDdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHVjRkSEpoWTNSbFpGdHdZWFIwWlhKdVhTNXdkWE5vS0dwcFlpazdYRzRnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVjRkSEpoWTNSbFpGdHdZWFIwWlhKdVhTQTlJR3BwWWp0Y2JpQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdWNGRISmhZM1JsWkM1eVpXMWhhVzVwYm1kRGFHbHNaSEpsYmlBOUlHTm9hV3hrY21WdUxtWnBiSFJsY2lnb2FtbGlLU0E5UGlBaGFYTk5ZWFJqYUNocWFXSXBLVHRjYmlBZ0lDQnlaWFIxY200Z1pYaDBjbUZqZEdWa08xeHVJQ0I5WEc1Y2JpQWdiV0Z3UTJocGJHUnlaVzRvY0dGMGRHVnlibk1zSUY5amFHbHNaSEpsYmlrZ2UxeHVJQ0FnSUd4bGRDQmphR2xzWkhKbGJpQTlJQ2doUVhKeVlYa3VhWE5CY25KaGVTaGZZMmhwYkdSeVpXNHBLU0EvSUZzZ1gyTm9hV3hrY21WdUlGMGdPaUJmWTJocGJHUnlaVzQ3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdZMmhwYkdSeVpXNHViV0Z3S0NocWFXSXBJRDArSUh0Y2JpQWdJQ0FnSUdsbUlDZ2hhbWxpS1Z4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYW1saU8xeHVYRzRnSUNBZ0lDQnNaWFFnYW1saVZIbHdaU0E5SUdwcFlpNVVlWEJsTzF4dUlDQWdJQ0FnYVdZZ0tDRlZkR2xzY3k1cGJuTjBZVzVqWlU5bUtHcHBZbFI1Y0dVc0lDZHpkSEpwYm1jbktTbGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHcHBZanRjYmx4dUlDQWdJQ0FnYW1saVZIbHdaU0E5SUdwcFlsUjVjR1V1ZEc5TWIzZGxja05oYzJVb0tUdGNibHh1SUNBZ0lDQWdiR1YwSUd0bGVYTWdQU0JQWW1wbFkzUXVhMlY1Y3lod1lYUjBaWEp1Y3lrN1hHNGdJQ0FnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQnJaWGx6TG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdiR1YwSUd0bGVTQTlJR3RsZVhOYmFWMDdYRzRnSUNBZ0lDQWdJR2xtSUNoclpYa3VkRzlNYjNkbGNrTmhjMlVvS1NBaFBUMGdhbWxpVkhsd1pTbGNiaUFnSUNBZ0lDQWdJQ0JqYjI1MGFXNTFaVHRjYmx4dUlDQWdJQ0FnSUNCc1pYUWdiV1YwYUc5a0lEMGdjR0YwZEdWeWJuTmJhMlY1WFR0Y2JpQWdJQ0FnSUNBZ2FXWWdLQ0Z0WlhSb2IyUXBYRzRnSUNBZ0lDQWdJQ0FnWTI5dWRHbHVkV1U3WEc1Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUcxbGRHaHZaQzVqWVd4c0tIUm9hWE1zSUdwcFlpd2dhU3dnWTJocGJHUnlaVzRwTzF4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNCeVpYUjFjbTRnYW1saU8xeHVJQ0FnSUgwcE8xeHVJQ0I5WEc1Y2JpQWdaR1ZpYjNWdVkyVW9ablZ1WXl3Z2RHbHRaU3dnWDJsa0tTQjdYRzRnSUNBZ1kyOXVjM1FnWTJ4bFlYSlFaVzVrYVc1blZHbHRaVzkxZENBOUlDZ3BJRDArSUh0Y2JpQWdJQ0FnSUdsbUlDaHdaVzVrYVc1blZHbHRaWElnSmlZZ2NHVnVaR2x1WjFScGJXVnlMblJwYldWdmRYUXBJSHRjYmlBZ0lDQWdJQ0FnWTJ4bFlYSlVhVzFsYjNWMEtIQmxibVJwYm1kVWFXMWxjaTUwYVcxbGIzVjBLVHRjYmlBZ0lDQWdJQ0FnY0dWdVpHbHVaMVJwYldWeUxuUnBiV1Z2ZFhRZ1BTQnVkV3hzTzF4dUlDQWdJQ0FnZlZ4dUlDQWdJSDA3WEc1Y2JpQWdJQ0IyWVhJZ2FXUWdQU0FvSVY5cFpDa2dQeUFvSnljZ0t5Qm1kVzVqS1NBNklGOXBaRHRjYmlBZ0lDQnBaaUFvSVhSb2FYTXVaR1ZpYjNWdVkyVlVhVzFsY25NcElIdGNiaUFnSUNBZ0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBlU2gwYUdsekxDQW5aR1ZpYjNWdVkyVlVhVzFsY25NbkxDQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUh0OUxGeHVJQ0FnSUNBZ2ZTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2RtRnlJSEJsYm1ScGJtZFVhVzFsY2lBOUlIUm9hWE11WkdWaWIzVnVZMlZVYVcxbGNuTmJhV1JkTzF4dUlDQWdJR2xtSUNnaGNHVnVaR2x1WjFScGJXVnlLVnh1SUNBZ0lDQWdjR1Z1WkdsdVoxUnBiV1Z5SUQwZ2RHaHBjeTVrWldKdmRXNWpaVlJwYldWeWMxdHBaRjBnUFNCN2ZUdGNibHh1SUNBZ0lIQmxibVJwYm1kVWFXMWxjaTVtZFc1aklEMGdablZ1WXp0Y2JpQWdJQ0JqYkdWaGNsQmxibVJwYm1kVWFXMWxiM1YwS0NrN1hHNWNiaUFnSUNCMllYSWdjSEp2YldselpTQTlJSEJsYm1ScGJtZFVhVzFsY2k1d2NtOXRhWE5sTzF4dUlDQWdJR2xtSUNnaGNISnZiV2x6WlNCOGZDQWhjSEp2YldselpTNXBjMUJsYm1ScGJtY29LU2tnZTF4dUlDQWdJQ0FnYkdWMElITjBZWFIxY3lBOUlDZHdaVzVrYVc1bkp6dGNiaUFnSUNBZ0lHeGxkQ0J5WlhOdmJIWmxPMXh1WEc0Z0lDQWdJQ0J3Y205dGFYTmxJRDBnY0dWdVpHbHVaMVJwYldWeUxuQnliMjFwYzJVZ1BTQnVaWGNnVUhKdmJXbHpaU2dvWDNKbGMyOXNkbVVwSUQwK0lIdGNiaUFnSUNBZ0lDQWdjbVZ6YjJ4MlpTQTlJRjl5WlhOdmJIWmxPMXh1SUNBZ0lDQWdmU2s3WEc1Y2JpQWdJQ0FnSUhCeWIyMXBjMlV1Y21WemIyeDJaU0E5SUNncElEMCtJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tITjBZWFIxY3lBaFBUMGdKM0JsYm1ScGJtY25LVnh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnlianRjYmx4dUlDQWdJQ0FnSUNCemRHRjBkWE1nUFNBblpuVnNabWxzYkdWa0p6dGNiaUFnSUNBZ0lDQWdZMnhsWVhKUVpXNWthVzVuVkdsdFpXOTFkQ2dwTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbVJsWW05MWJtTmxWR2x0WlhKelcybGtYU0E5SUc1MWJHdzdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCd1pXNWthVzVuVkdsdFpYSXVablZ1WXlBOVBUMGdKMloxYm1OMGFXOXVKeWtnZTF4dUlDQWdJQ0FnSUNBZ0lIWmhjaUJ5WlhRZ1BTQndaVzVrYVc1blZHbHRaWEl1Wm5WdVl5NWpZV3hzS0hSb2FYTXBPMXh1SUNBZ0lDQWdJQ0FnSUdsbUlDaHlaWFFnYVc1emRHRnVZMlZ2WmlCUWNtOXRhWE5sSUh4OElDaHlaWFFnSmlZZ2RIbHdaVzltSUhKbGRDNTBhR1Z1SUQwOVBTQW5ablZ1WTNScGIyNG5LU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkQzUwYUdWdUtDaDJZV3gxWlNrZ1BUNGdjbVZ6YjJ4MlpTaDJZV3gxWlNrcE8xeHVJQ0FnSUNBZ0lDQWdJR1ZzYzJWY2JpQWdJQ0FnSUNBZ0lDQWdJSEpsYzI5c2RtVW9jbVYwS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQnlaWE52YkhabEtDazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJSDA3WEc1Y2JpQWdJQ0FnSUhCeWIyMXBjMlV1WTJGdVkyVnNJRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0J6ZEdGMGRYTWdQU0FuY21WcVpXTjBaV1FuTzF4dUlDQWdJQ0FnSUNCamJHVmhjbEJsYm1ScGJtZFVhVzFsYjNWMEtDazdYRzRnSUNBZ0lDQWdJSFJvYVhNdVpHVmliM1Z1WTJWVWFXMWxjbk5iYVdSZElEMGdiblZzYkR0Y2JseHVJQ0FnSUNBZ0lDQndjbTl0YVhObExuSmxjMjlzZG1Vb0tUdGNiaUFnSUNBZ0lIMDdYRzVjYmlBZ0lDQWdJSEJ5YjIxcGMyVXVhWE5RWlc1a2FXNW5JRDBnS0NrZ1BUNGdlMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdLSE4wWVhSMWN5QTlQVDBnSjNCbGJtUnBibWNuS1R0Y2JpQWdJQ0FnSUgwN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnTHk4Z1pYTnNhVzUwTFdScGMyRmliR1V0Ym1WNGRDMXNhVzVsSUc1dkxXMWhaMmxqTFc1MWJXSmxjbk5jYmlBZ0lDQndaVzVrYVc1blZHbHRaWEl1ZEdsdFpXOTFkQ0E5SUhObGRGUnBiV1Z2ZFhRb2NISnZiV2x6WlM1eVpYTnZiSFpsTENBb2RHbHRaU0E5UFNCdWRXeHNLU0EvSURJMU1DQTZJSFJwYldVcE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUhCeWIyMXBjMlU3WEc0Z0lIMWNibHh1SUNCamJHVmhja1JsWW05MWJtTmxLR2xrS1NCN1hHNGdJQ0FnZG1GeUlIQmxibVJwYm1kVWFXMWxjaUE5SUhSb2FYTXVaR1ZpYjNWdVkyVlVhVzFsY25OYmFXUmRPMXh1SUNBZ0lHbG1JQ2h3Wlc1a2FXNW5WR2x0WlhJZ1BUMGdiblZzYkNsY2JpQWdJQ0FnSUhKbGRIVnlianRjYmx4dUlDQWdJR2xtSUNod1pXNWthVzVuVkdsdFpYSXVkR2x0Wlc5MWRDbGNiaUFnSUNBZ0lHTnNaV0Z5VkdsdFpXOTFkQ2h3Wlc1a2FXNW5WR2x0WlhJdWRHbHRaVzkxZENrN1hHNWNiaUFnSUNCcFppQW9jR1Z1WkdsdVoxUnBiV1Z5TG5CeWIyMXBjMlVwWEc0Z0lDQWdJQ0J3Wlc1a2FXNW5WR2x0WlhJdWNISnZiV2x6WlM1allXNWpaV3dvS1R0Y2JpQWdmVnh1WEc0Z0lHTnNaV0Z5UVd4c1JHVmliM1Z1WTJWektDa2dlMXh1SUNBZ0lHeGxkQ0JrWldKdmRXNWpaVlJwYldWeWN5QWdQU0IwYUdsekxtUmxZbTkxYm1ObFZHbHRaWEp6SUh4OElIdDlPMXh1SUNBZ0lHeGxkQ0JwWkhNZ0lDQWdJQ0FnSUNBZ0lDQWdQU0JQWW1wbFkzUXVhMlY1Y3loa1pXSnZkVzVqWlZScGJXVnljeWs3WEc1Y2JpQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCcFpITXViR1Z1WjNSb095QnBJRHdnYVd3N0lHa3JLeWxjYmlBZ0lDQWdJSFJvYVhNdVkyeGxZWEpFWldKdmRXNWpaU2hwWkhOYmFWMHBPMXh1SUNCOVhHNWNiaUFnWjJWMFJXeGxiV1Z1ZEVSaGRHRW9aV3hsYldWdWRDa2dlMXh1SUNBZ0lHeGxkQ0JrWVhSaElEMGdaV3hsYldWdWRFUmhkR0ZEWVdOb1pTNW5aWFFvWld4bGJXVnVkQ2s3WEc0Z0lDQWdhV1lnS0NGa1lYUmhLU0I3WEc0Z0lDQWdJQ0JrWVhSaElEMGdlMzA3WEc0Z0lDQWdJQ0JsYkdWdFpXNTBSR0YwWVVOaFkyaGxMbk5sZENobGJHVnRaVzUwTENCa1lYUmhLVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnlaWFIxY200Z1pHRjBZVHRjYmlBZ2ZWeHVYRzRnSUcxbGJXOXBlbVVvWm5WdVl5a2dlMXh1SUNBZ0lHeGxkQ0JqWVdOb1pVbEVPMXh1SUNBZ0lHeGxkQ0JqWVdOb1pXUlNaWE4xYkhRN1hHNWNiaUFnSUNCeVpYUjFjbTRnWm5WdVkzUnBiMjRvTGk0dVlYSm5jeWtnZTF4dUlDQWdJQ0FnYkdWMElHNWxkME5oWTJobFNVUWdQU0JrWldGa1ltVmxaaWd1TGk1aGNtZHpLVHRjYmlBZ0lDQWdJR2xtSUNodVpYZERZV05vWlVsRUlDRTlQU0JqWVdOb1pVbEVLU0I3WEc0Z0lDQWdJQ0FnSUd4bGRDQnlaWE4xYkhRZ1BTQm1kVzVqTG1Gd2NHeDVLSFJvYVhNc0lHRnlaM01wTzF4dVhHNGdJQ0FnSUNBZ0lHTmhZMmhsU1VRZ1BTQnVaWGREWVdOb1pVbEVPMXh1SUNBZ0lDQWdJQ0JqWVdOb1pXUlNaWE4xYkhRZ1BTQnlaWE4xYkhRN1hHNGdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCallXTm9aV1JTWlhOMWJIUTdYRzRnSUNBZ2ZUdGNiaUFnZlZ4dVhHNGdJSFJ2VkdWeWJTaDBaWEp0S1NCN1hHNGdJQ0FnYVdZZ0tHbHpTbWxpYVhOb0tIUmxjbTBwS1NCN1hHNGdJQ0FnSUNCc1pYUWdhbWxpSUQwZ1kyOXVjM1J5ZFdOMFNtbGlLSFJsY20wcE8xeHVYRzRnSUNBZ0lDQnBaaUFvYW1saUxsUjVjR1VnUFQwOUlGUmxjbTBwWEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwWlhKdE8xeHVYRzRnSUNBZ0lDQnBaaUFvYW1saUxsUjVjR1VnSmlZZ2FtbGlMbFI1Y0dWYlZFVlNUVjlEVDAxUVQwNUZUbFJmVkZsUVJWOURTRVZEUzEwcFhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCMFpYSnRPMXh1WEc0Z0lDQWdJQ0J5WlhSMWNtNGdKQ2hVWlhKdExDQnFhV0l1Y0hKdmNITXBLQzR1TG1wcFlpNWphR2xzWkhKbGJpazdYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaDBlWEJsYjJZZ2RHVnliU0E5UFQwZ0ozTjBjbWx1WnljcElIdGNiaUFnSUNBZ0lISmxkSFZ5YmlBa0tGUmxjbTBwS0hSbGNtMHBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lISmxkSFZ5YmlCMFpYSnRPMXh1SUNCOVhHNTlYRzVjYm1OdmJuTjBJRlJGVWsxZlEwOU5VRTlPUlU1VVgxUlpVRVZmUTBoRlEwc2dQU0JUZVcxaWIyd3VabTl5S0NkQWFtbGljeTlwYzFSbGNtMG5LVHRjYmx4dVkyeGhjM01nVkdWeWJTQmxlSFJsYm1SeklFTnZiWEJ2Ym1WdWRDQjdYRzRnSUhKbGMyOXNkbVZVWlhKdEtHRnlaM01wSUh0Y2JpQWdJQ0JzWlhRZ2RHVnliVkpsYzI5c2RtVnlJRDBnZEdocGN5NWpiMjUwWlhoMExsOTBaWEp0VW1WemIyeDJaWEk3WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUIwWlhKdFVtVnpiMngyWlhJZ1BUMDlJQ2RtZFc1amRHbHZiaWNwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR1Z5YlZKbGMyOXNkbVZ5TG1OaGJHd29kR2hwY3l3Z1lYSm5jeWs3WEc1Y2JpQWdJQ0JzWlhRZ1kyaHBiR1J5Wlc0Z1BTQW9ZWEpuY3k1amFHbHNaSEpsYmlCOGZDQmJYU2s3WEc0Z0lDQWdjbVYwZFhKdUlHTm9hV3hrY21WdVcyTm9hV3hrY21WdUxteGxibWQwYUNBdElERmRJSHg4SUNjbk8xeHVJQ0I5WEc1Y2JpQWdjbVZ1WkdWeUtHTm9hV3hrY21WdUtTQjdYRzRnSUNBZ2JHVjBJSFJsY20wZ1BTQjBhR2x6TG5KbGMyOXNkbVZVWlhKdEtIc2dZMmhwYkdSeVpXNHNJSEJ5YjNCek9pQjBhR2x6TG5CeWIzQnpJSDBwTzF4dUlDQWdJSEpsZEhWeWJpQWtLQ2RUVUVGT0p5d2dkR2hwY3k1d2NtOXdjeWtvZEdWeWJTazdYRzRnSUgxY2JuMWNibHh1VkdWeWJWdFVSVkpOWDBOUFRWQlBUa1ZPVkY5VVdWQkZYME5JUlVOTFhTQTlJSFJ5ZFdVN1hHNWNibVY0Y0c5eWRDQjdYRzRnSUZSbGNtMHNYRzU5TzF4dUlpd2lZMjl1YzNRZ1JWWkZUbFJmVEVsVFZFVk9SVkpUSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5NdlpYWmxiblJ6TDJ4cGMzUmxibVZ5Y3ljcE8xeHVYRzVsZUhCdmNuUWdZMnhoYzNNZ1JYWmxiblJGYldsMGRHVnlJSHRjYmlBZ1kyOXVjM1J5ZFdOMGIzSW9LU0I3WEc0Z0lDQWdUMkpxWldOMExtUmxabWx1WlZCeWIzQmxjblJwWlhNb2RHaHBjeXdnZTF4dUlDQWdJQ0FnVzBWV1JVNVVYMHhKVTFSRlRrVlNVMTA2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J1WlhjZ1RXRndLQ2tzWEc0Z0lDQWdJQ0I5TEZ4dUlDQWdJSDBwTzF4dUlDQjlYRzVjYmlBZ1lXUmtUR2x6ZEdWdVpYSW9aWFpsYm5ST1lXMWxMQ0JzYVhOMFpXNWxjaWtnZTF4dUlDQWdJR2xtSUNoMGVYQmxiMllnYkdsemRHVnVaWElnSVQwOUlDZG1kVzVqZEdsdmJpY3BYRzRnSUNBZ0lDQjBhSEp2ZHlCdVpYY2dWSGx3WlVWeWNtOXlLQ2RGZG1WdWRDQnNhWE4wWlc1bGNpQnRkWE4wSUdKbElHRWdiV1YwYUc5a0p5azdYRzVjYmlBZ0lDQnNaWFFnWlhabGJuUk5ZWEFnSUQwZ2RHaHBjMXRGVmtWT1ZGOU1TVk5VUlU1RlVsTmRPMXh1SUNBZ0lHeGxkQ0J6WTI5d1pTQWdJQ0FnUFNCbGRtVnVkRTFoY0M1blpYUW9aWFpsYm5ST1lXMWxLVHRjYmx4dUlDQWdJR2xtSUNnaGMyTnZjR1VwSUh0Y2JpQWdJQ0FnSUhOamIzQmxJRDBnVzEwN1hHNGdJQ0FnSUNCbGRtVnVkRTFoY0M1elpYUW9aWFpsYm5ST1lXMWxMQ0J6WTI5d1pTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2MyTnZjR1V1Y0hWemFDaHNhWE4wWlc1bGNpazdYRzVjYmlBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ2ZWeHVYRzRnSUhKbGJXOTJaVXhwYzNSbGJtVnlLR1YyWlc1MFRtRnRaU3dnYkdsemRHVnVaWElwSUh0Y2JpQWdJQ0JwWmlBb2RIbHdaVzltSUd4cGMzUmxibVZ5SUNFOVBTQW5ablZ1WTNScGIyNG5LVnh1SUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRlI1Y0dWRmNuSnZjaWduUlhabGJuUWdiR2x6ZEdWdVpYSWdiWFZ6ZENCaVpTQmhJRzFsZEdodlpDY3BPMXh1WEc0Z0lDQWdiR1YwSUdWMlpXNTBUV0Z3SUNBOUlIUm9hWE5iUlZaRlRsUmZURWxUVkVWT1JWSlRYVHRjYmlBZ0lDQnNaWFFnYzJOdmNHVWdJQ0FnSUQwZ1pYWmxiblJOWVhBdVoyVjBLR1YyWlc1MFRtRnRaU2s3WEc0Z0lDQWdhV1lnS0NGelkyOXdaU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TzF4dVhHNGdJQ0FnYkdWMElHbHVaR1Y0SUQwZ2MyTnZjR1V1YVc1a1pYaFBaaWhzYVhOMFpXNWxjaWs3WEc0Z0lDQWdhV1lnS0dsdVpHVjRJRDQ5SURBcFhHNGdJQ0FnSUNCelkyOXdaUzV6Y0d4cFkyVW9hVzVrWlhnc0lERXBPMXh1WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE03WEc0Z0lIMWNibHh1SUNCeVpXMXZkbVZCYkd4TWFYTjBaVzVsY25Nb1pYWmxiblJPWVcxbEtTQjdYRzRnSUNBZ2JHVjBJR1YyWlc1MFRXRndJQ0E5SUhSb2FYTmJSVlpGVGxSZlRFbFRWRVZPUlZKVFhUdGNiaUFnSUNCcFppQW9JV1YyWlc1MFRXRndMbWhoY3lobGRtVnVkRTVoYldVcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSb2FYTTdYRzVjYmlBZ0lDQmxkbVZ1ZEUxaGNDNXpaWFFvWlhabGJuUk9ZVzFsTENCYlhTazdYRzVjYmlBZ0lDQnlaWFIxY200Z2RHaHBjenRjYmlBZ2ZWeHVYRzRnSUdWdGFYUW9aWFpsYm5ST1lXMWxMQ0F1TGk1aGNtZHpLU0I3WEc0Z0lDQWdiR1YwSUdWMlpXNTBUV0Z3SUNBOUlIUm9hWE5iUlZaRlRsUmZURWxUVkVWT1JWSlRYVHRjYmlBZ0lDQnNaWFFnYzJOdmNHVWdJQ0FnSUQwZ1pYWmxiblJOWVhBdVoyVjBLR1YyWlc1MFRtRnRaU2s3WEc0Z0lDQWdhV1lnS0NGelkyOXdaU0I4ZkNCelkyOXdaUzVzWlc1bmRHZ2dQVDA5SURBcFhHNGdJQ0FnSUNCeVpYUjFjbTRnWm1Gc2MyVTdYRzVjYmlBZ0lDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0J6WTI5d1pTNXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0JzWlhRZ1pYWmxiblJEWVd4c1ltRmpheUE5SUhOamIzQmxXMmxkTzF4dUlDQWdJQ0FnWlhabGJuUkRZV3hzWW1GamF5NWhjSEJzZVNoMGFHbHpMQ0JoY21kektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnZlZ4dVhHNGdJRzl1WTJVb1pYWmxiblJPWVcxbExDQnNhWE4wWlc1bGNpa2dlMXh1SUNBZ0lHeGxkQ0JtZFc1aklEMGdLQzR1TG1GeVozTXBJRDArSUh0Y2JpQWdJQ0FnSUhSb2FYTXViMlptS0dWMlpXNTBUbUZ0WlN3Z1puVnVZeWs3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdiR2x6ZEdWdVpYSW9MaTR1WVhKbmN5azdYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpMbTl1S0dWMlpXNTBUbUZ0WlN3Z1puVnVZeWs3WEc0Z0lIMWNibHh1SUNCdmJpaGxkbVZ1ZEU1aGJXVXNJR3hwYzNSbGJtVnlLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11WVdSa1RHbHpkR1Z1WlhJb1pYWmxiblJPWVcxbExDQnNhWE4wWlc1bGNpazdYRzRnSUgxY2JseHVJQ0J2Wm1Zb1pYWmxiblJPWVcxbExDQnNhWE4wWlc1bGNpa2dlMXh1SUNBZ0lISmxkSFZ5YmlCMGFHbHpMbkpsYlc5MlpVeHBjM1JsYm1WeUtHVjJaVzUwVG1GdFpTd2diR2x6ZEdWdVpYSXBPMXh1SUNCOVhHNWNiaUFnWlhabGJuUk9ZVzFsY3lncElIdGNiaUFnSUNCeVpYUjFjbTRnUVhKeVlYa3Vabkp2YlNoMGFHbHpXMFZXUlU1VVgweEpVMVJGVGtWU1UxMHVhMlY1Y3lncEtUdGNiaUFnZlZ4dVhHNGdJR3hwYzNSbGJtVnlRMjkxYm5Rb1pYWmxiblJPWVcxbEtTQjdYRzRnSUNBZ2JHVjBJR1YyWlc1MFRXRndJQ0E5SUhSb2FYTmJSVlpGVGxSZlRFbFRWRVZPUlZKVFhUdGNiaUFnSUNCc1pYUWdjMk52Y0dVZ0lDQWdJRDBnWlhabGJuUk5ZWEF1WjJWMEtHVjJaVzUwVG1GdFpTazdYRzRnSUNBZ2FXWWdLQ0Z6WTI5d1pTbGNiaUFnSUNBZ0lISmxkSFZ5YmlBd08xeHVYRzRnSUNBZ2NtVjBkWEp1SUhOamIzQmxMbXhsYm1kMGFEdGNiaUFnZlZ4dVhHNGdJR3hwYzNSbGJtVnljeWhsZG1WdWRFNWhiV1VwSUh0Y2JpQWdJQ0JzWlhRZ1pYWmxiblJOWVhBZ0lEMGdkR2hwYzF0RlZrVk9WRjlNU1ZOVVJVNUZVbE5kTzF4dUlDQWdJR3hsZENCelkyOXdaU0FnSUNBZ1BTQmxkbVZ1ZEUxaGNDNW5aWFFvWlhabGJuUk9ZVzFsS1R0Y2JpQWdJQ0JwWmlBb0lYTmpiM0JsS1Z4dUlDQWdJQ0FnY21WMGRYSnVJRnRkTzF4dVhHNGdJQ0FnY21WMGRYSnVJSE5qYjNCbExuTnNhV05sS0NrN1hHNGdJSDFjYm4xY2JpSXNJbWx0Y0c5eWRDQmtaV0ZrWW1WbFppQm1jbTl0SUNka1pXRmtZbVZsWmljN1hHNXBiWEJ2Y25RZ0tpQmhjeUJWZEdsc2N5Qm1jbTl0SUNjdUwzVjBhV3h6TG1wekp6dGNibHh1Wlhod2IzSjBJR05zWVhOeklFcHBZaUI3WEc0Z0lHTnZibk4wY25WamRHOXlLRlI1Y0dVc0lIQnliM0J6TENCamFHbHNaSEpsYmlrZ2UxeHVJQ0FnSUd4bGRDQmtaV1poZFd4MFVISnZjSE1nUFNBb1ZIbHdaU0FtSmlCVWVYQmxMbkJ5YjNCektTQS9JRlI1Y0dVdWNISnZjSE1nT2lCN2ZUdGNibHh1SUNBZ0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBhV1Z6S0hSb2FYTXNJSHRjYmlBZ0lDQWdJQ2RVZVhCbEp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUZSNWNHVXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKM0J5YjNCekp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUhzZ1cwcEpRbDlEU0VsTVJGOUpUa1JGV0Y5UVVrOVFYVG9nTUN3Z0xpNHVaR1ZtWVhWc2RGQnliM0J6TENBdUxpNG9jSEp2Y0hNZ2ZId2dlMzBwSUgwc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0oyTm9hV3hrY21WdUp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUZWMGFXeHpMbVpzWVhSMFpXNUJjbkpoZVNoamFHbHNaSEpsYmlrc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUgwcE8xeHVJQ0I5WEc1OVhHNWNibVY0Y0c5eWRDQmpiMjV6ZENCS1NVSmZRa0ZTVWtWT0lDQWdJQ0FnSUNBZ0lDQTlJRk41YldKdmJDNW1iM0lvSjBCcWFXSnpMbUpoY25KbGJpY3BPMXh1Wlhod2IzSjBJR052Ym5OMElFcEpRbDlRVWs5WVdTQWdJQ0FnSUNBZ0lDQWdJRDBnVTNsdFltOXNMbVp2Y2lnblFHcHBZbk11Y0hKdmVIa25LVHRjYm1WNGNHOXlkQ0JqYjI1emRDQktTVUpmVWtGWFgxUkZXRlFnSUNBZ0lDQWdJQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6TG5KaGQxUmxlSFFuS1R0Y2JtVjRjRzl5ZENCamIyNXpkQ0JLU1VJZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOUlGTjViV0p2YkM1bWIzSW9KMEJxYVdKekxtcHBZaWNwTzF4dVpYaHdiM0owSUdOdmJuTjBJRXBKUWw5RFNFbE1SRjlKVGtSRldGOVFVazlRSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5NdVkyaHBiR1JKYm1SbGVGQnliM0FuS1R0Y2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHWmhZM1J2Y25rb1NtbGlRMnhoYzNNcElIdGNiaUFnWm5WdVkzUnBiMjRnSkNoZmRIbHdaU3dnY0hKdmNITWdQU0I3ZlNrZ2UxeHVJQ0FnSUdsbUlDaHBjMHBwWW1semFDaGZkSGx3WlNrcFhHNGdJQ0FnSUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZFNaV05sYVhabFpDQmhJR3BwWWlCaWRYUWdaWGh3WldOMFpXUWdZU0JqYjIxd2IyNWxiblF1SnlrN1hHNWNiaUFnSUNCc1pYUWdWSGx3WlNBOUlDaGZkSGx3WlNBOVBTQnVkV3hzS1NBL0lFcEpRbDlRVWs5WVdTQTZJRjkwZVhCbE8xeHVYRzRnSUNBZ1puVnVZM1JwYjI0Z1ltRnljbVZ1S0M0dUxsOWphR2xzWkhKbGJpa2dlMXh1SUNBZ0lDQWdiR1YwSUdOb2FXeGtjbVZ1SUQwZ1gyTm9hV3hrY21WdU8xeHVYRzRnSUNBZ0lDQm1kVzVqZEdsdmJpQnFhV0lvS1NCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hWZEdsc2N5NXBibk4wWVc1alpVOW1LRlI1Y0dVc0lDZHdjbTl0YVhObEp5a2dmSHdnWTJocGJHUnlaVzR1YzI5dFpTZ29ZMmhwYkdRcElEMCtJRlYwYVd4ekxtbHVjM1JoYm1ObFQyWW9ZMmhwYkdRc0lDZHdjbTl0YVhObEp5a3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUZCeWIyMXBjMlV1WVd4c0tGc2dWSGx3WlNCZExtTnZibU5oZENoamFHbHNaSEpsYmlrcExuUm9aVzRvS0dGc2JDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdWSGx3WlNBOUlHRnNiRnN3WFR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05vYVd4a2NtVnVJRDBnWVd4c0xuTnNhV05sS0RFcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lFcHBZa05zWVhOektGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNCVWVYQmxMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQndjbTl3Y3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJocGJHUnlaVzRzWEc0Z0lDQWdJQ0FnSUNBZ0lDQXBPMXh1SUNBZ0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCS2FXSkRiR0Z6Y3loY2JpQWdJQ0FnSUNBZ0lDQlVlWEJsTEZ4dUlDQWdJQ0FnSUNBZ0lIQnliM0J6TEZ4dUlDQWdJQ0FnSUNBZ0lHTm9hV3hrY21WdUxGeHVJQ0FnSUNBZ0lDQXBPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0JQWW1wbFkzUXVaR1ZtYVc1bFVISnZjR1Z5ZEdsbGN5aHFhV0lzSUh0Y2JpQWdJQ0FnSUNBZ1cwcEpRbDA2SUh0Y2JpQWdJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJSFJ5ZFdVc1hHNGdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJRnRrWldGa1ltVmxaaTVwWkZONWJWMDZJSHRjYmlBZ0lDQWdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUJtWVd4elpTeGNiaUFnSUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lDZ3BJRDArSUZSNWNHVXNYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0I5S1R0Y2JseHVJQ0FnSUNBZ2NtVjBkWEp1SUdwcFlqdGNiaUFnSUNCOVhHNWNiaUFnSUNCUFltcGxZM1F1WkdWbWFXNWxVSEp2Y0dWeWRHbGxjeWhpWVhKeVpXNHNJSHRjYmlBZ0lDQWdJRnRLU1VKZlFrRlNVa1ZPWFRvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JsYm5WdFpYSmhZbXhsT2lBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCamIyNW1hV2QxY21GaWJHVTZJR1poYkhObExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdXMlJsWVdSaVpXVm1MbWxrVTNsdFhUb2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lHWmhiSE5sTEZ4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0IyWVd4MVpUb2dJQ0FnSUNBZ0lDZ3BJRDArSUZSNWNHVXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lIMHBPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHSmhjbkpsYmp0Y2JpQWdmVnh1WEc0Z0lFOWlhbVZqZEM1a1pXWnBibVZRY205d1pYSjBhV1Z6S0NRc0lIdGNiaUFnSUNBbmNtVnRZWEFuT2lCN1hHNGdJQ0FnSUNCM2NtbDBZV0pzWlRvZ0lDQWdJR1poYkhObExGeHVJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUNoZmFtbGlMQ0JqWVd4c1ltRmpheWtnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQnNaWFFnYW1saUlEMGdYMnBwWWp0Y2JpQWdJQ0FnSUNBZ2FXWWdLR3BwWWlBOVBTQnVkV3hzSUh4OElFOWlhbVZqZEM1cGN5aHFhV0lzSUVsdVptbHVhWFI1S1NCOGZDQlBZbXBsWTNRdWFYTW9hbWxpTENCT1lVNHBLVnh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJxYVdJN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0dselNtbGlhWE5vS0dwcFlpa3BYRzRnSUNBZ0lDQWdJQ0FnYW1saUlEMGdZMjl1YzNSeWRXTjBTbWxpS0dwcFlpazdYRzVjYmlBZ0lDQWdJQ0FnYkdWMElHMWhjSEJsWkVwcFlpQTlJR05oYkd4aVlXTnJLR3BwWWlrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hwYzBwcFltbHphQ2h0WVhCd1pXUkthV0lwS1Z4dUlDQWdJQ0FnSUNBZ0lHMWhjSEJsWkVwcFlpQTlJR052Ym5OMGNuVmpkRXBwWWlodFlYQndaV1JLYVdJcE8xeHVJQ0FnSUNBZ0lDQmxiSE5sWEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUcxaGNIQmxaRXBwWWp0Y2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z0pDaHRZWEJ3WldSS2FXSXVWSGx3WlN3Z2JXRndjR1ZrU21saUxuQnliM0J6S1NndUxpNG9iV0Z3Y0dWa1NtbGlMbU5vYVd4a2NtVnVJSHg4SUZ0ZEtTazdYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lIMHNYRzRnSUgwcE8xeHVYRzRnSUhKbGRIVnliaUFrTzF4dWZWeHVYRzVsZUhCdmNuUWdZMjl1YzNRZ0pDQTlJR1poWTNSdmNua29TbWxpS1R0Y2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHbHpTbWxpYVhOb0tIWmhiSFZsS1NCN1hHNGdJR2xtSUNoMGVYQmxiMllnZG1Gc2RXVWdQVDA5SUNkbWRXNWpkR2x2YmljZ0ppWWdLSFpoYkhWbFcwcEpRbDlDUVZKU1JVNWRJSHg4SUhaaGJIVmxXMHBKUWwwcEtWeHVJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUdsbUlDaDJZV3gxWlNCcGJuTjBZVzVqWlc5bUlFcHBZaWxjYmlBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQnlaWFIxY200Z1ptRnNjMlU3WEc1OVhHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQmpiMjV6ZEhKMVkzUkthV0lvZG1Gc2RXVXBJSHRjYmlBZ2FXWWdLSFpoYkhWbElHbHVjM1JoYm1ObGIyWWdTbWxpS1Z4dUlDQWdJSEpsZEhWeWJpQjJZV3gxWlR0Y2JseHVJQ0JwWmlBb2RIbHdaVzltSUhaaGJIVmxJRDA5UFNBblpuVnVZM1JwYjI0bktTQjdYRzRnSUNBZ2FXWWdLSFpoYkhWbFcwcEpRbDlDUVZKU1JVNWRLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIWmhiSFZsS0Nrb0tUdGNiaUFnSUNCbGJITmxJR2xtSUNoMllXeDFaVnRLU1VKZEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhaaGJIVmxLQ2s3WEc0Z0lIMWNibHh1SUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZGpiMjV6ZEhKMVkzUkthV0k2SUZCeWIzWnBaR1ZrSUhaaGJIVmxJR2x6SUc1dmRDQmhJRXBwWWk0bktUdGNibjFjYmx4dVpYaHdiM0owSUdGemVXNWpJR1oxYm1OMGFXOXVJSEpsYzI5c2RtVkRhR2xzWkhKbGJpaGZZMmhwYkdSeVpXNHBJSHRjYmlBZ2JHVjBJR05vYVd4a2NtVnVJRDBnWDJOb2FXeGtjbVZ1TzF4dVhHNGdJR2xtSUNoVmRHbHNjeTVwYm5OMFlXNWpaVTltS0dOb2FXeGtjbVZ1TENBbmNISnZiV2x6WlNjcEtWeHVJQ0FnSUdOb2FXeGtjbVZ1SUQwZ1lYZGhhWFFnWTJocGJHUnlaVzQ3WEc1Y2JpQWdhV1lnS0NFb0tIUm9hWE11YVhOSmRHVnlZV0pzWlVOb2FXeGtJSHg4SUZWMGFXeHpMbWx6U1hSbGNtRmliR1ZEYUdsc1pDa3VZMkZzYkNoMGFHbHpMQ0JqYUdsc1pISmxiaWtwSUNZbUlDaHBjMHBwWW1semFDaGphR2xzWkhKbGJpa2dmSHdnS0NoMGFHbHpMbWx6Vm1Gc2FXUkRhR2xzWkNCOGZDQlZkR2xzY3k1cGMxWmhiR2xrUTJocGJHUXBMbU5oYkd3b2RHaHBjeXdnWTJocGJHUnlaVzRwS1NrcFhHNGdJQ0FnWTJocGJHUnlaVzRnUFNCYklHTm9hV3hrY21WdUlGMDdYRzVjYmlBZ2JHVjBJSEJ5YjIxcGMyVnpJRDBnVlhScGJITXVhWFJsY21GMFpTaGphR2xzWkhKbGJpd2dZWE41Ym1NZ0tIc2dkbUZzZFdVNklGOWphR2xzWkNCOUtTQTlQaUI3WEc0Z0lDQWdiR1YwSUdOb2FXeGtJRDBnS0ZWMGFXeHpMbWx1YzNSaGJtTmxUMllvWDJOb2FXeGtMQ0FuY0hKdmJXbHpaU2NwS1NBL0lHRjNZV2wwSUY5amFHbHNaQ0E2SUY5amFHbHNaRHRjYmx4dUlDQWdJR2xtSUNocGMwcHBZbWx6YUNoamFHbHNaQ2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdZWGRoYVhRZ1kyOXVjM1J5ZFdOMFNtbGlLR05vYVd4a0tUdGNiaUFnSUNCbGJITmxYRzRnSUNBZ0lDQnlaWFIxY200Z1kyaHBiR1E3WEc0Z0lIMHBPMXh1WEc0Z0lISmxkSFZ5YmlCaGQyRnBkQ0JRY205dGFYTmxMbUZzYkNod2NtOXRhWE5sY3lrN1hHNTlYRzRpTENKbGVIQnZjblFnZTF4dUlDQkRUMDVVUlZoVVgwbEVMRnh1SUNCU2IyOTBUbTlrWlN4Y2JuMGdabkp2YlNBbkxpOXliMjkwTFc1dlpHVXVhbk1uTzF4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnUms5U1EwVmZVa1ZHVEU5WElEMGdVM2x0WW05c0xtWnZjaWduUUdwcFluTkdiM0pqWlZKbFpteHZkeWNwTzF4dVhHNWxlSEJ2Y25RZ2V5QlNaVzVrWlhKbGNpQjlJR1p5YjIwZ0p5NHZjbVZ1WkdWeVpYSXVhbk1uTzF4dUlpd2lhVzF3YjNKMElIdGNiaUFnUTA5T1ZFVllWRjlKUkN4Y2JpQWdVbTl2ZEU1dlpHVXNYRzU5SUdaeWIyMGdKeTR2Y205dmRDMXViMlJsTG1wekp6dGNibHh1WTI5dWMzUWdTVTVKVkVsQlRGOURUMDVVUlZoVVgwbEVJRDBnTVc0N1hHNXNaWFFnWDJOdmJuUmxlSFJKUkVOdmRXNTBaWElnUFNCSlRrbFVTVUZNWDBOUFRsUkZXRlJmU1VRN1hHNWNibVY0Y0c5eWRDQmpiR0Z6Y3lCU1pXNWtaWEpsY2lCbGVIUmxibVJ6SUZKdmIzUk9iMlJsSUh0Y2JpQWdjM1JoZEdsaklGSnZiM1JPYjJSbElEMGdVbTl2ZEU1dlpHVTdYRzVjYmlBZ1kyOXVjM1J5ZFdOMGIzSW9iM0IwYVc5dWN5a2dlMXh1SUNBZ0lITjFjR1Z5S0c1MWJHd3NJRzUxYkd3c0lHNTFiR3dwTzF4dVhHNGdJQ0FnVDJKcVpXTjBMbVJsWm1sdVpWQnliM0JsY25ScFpYTW9kR2hwY3l3Z2UxeHVJQ0FnSUNBZ0oyOXdkR2x2Ym5Nbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nWm1Gc2MyVXNYRzRnSUNBZ0lDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ2IzQjBhVzl1Y3lCOGZDQjdmU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdmU2s3WEc1Y2JpQWdJQ0IwYUdsekxuSmxibVJsY21WeUlEMGdkR2hwY3p0Y2JseHVJQ0FnSUdsbUlDaDBlWEJsYjJZZ2IzQjBhVzl1Y3k1MFpYSnRVbVZ6YjJ4MlpYSWdQVDA5SUNkbWRXNWpkR2x2YmljcFhHNGdJQ0FnSUNCMGFHbHpMbU52Ym5SbGVIUXVYM1JsY20xU1pYTnZiSFpsY2lBOUlHOXdkR2x2Ym5NdWRHVnliVkpsYzI5c2RtVnlPMXh1SUNCOVhHNWNiaUFnWjJWMFQzQjBhVzl1Y3lncElIdGNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NXZjSFJwYjI1ek8xeHVJQ0I5WEc1Y2JpQWdjbVZ6YjJ4MlpWUmxjbTBvWVhKbmN5a2dlMXh1SUNBZ0lHeGxkQ0I3SUhSbGNtMVNaWE52YkhabGNpQjlJRDBnZEdocGN5NW5aWFJQY0hScGIyNXpLQ2s3WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUIwWlhKdFVtVnpiMngyWlhJZ1BUMDlJQ2RtZFc1amRHbHZiaWNwWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkR1Z5YlZKbGMyOXNkbVZ5TG1OaGJHd29kR2hwY3l3Z1lYSm5jeWs3WEc1Y2JpQWdJQ0JzWlhRZ1kyaHBiR1J5Wlc0Z1BTQW9ZWEpuY3k1amFHbHNaSEpsYmlCOGZDQmJYU2s3WEc0Z0lDQWdjbVYwZFhKdUlHTm9hV3hrY21WdVcyTm9hV3hrY21WdUxteGxibWQwYUNBdElERmRJSHg4SUNjbk8xeHVJQ0I5WEc1Y2JpQWdZM0psWVhSbFEyOXVkR1Y0ZENoeWIyOTBRMjl1ZEdWNGRDd2diMjVWY0dSaGRHVXNJRzl1VlhCa1lYUmxWR2hwY3lrZ2UxeHVJQ0FnSUd4bGRDQmpiMjUwWlhoMElDQWdJQ0E5SUU5aWFtVmpkQzVqY21WaGRHVW9iblZzYkNrN1hHNGdJQ0FnYkdWMElHMTVRMjl1ZEdWNGRFbEVJRDBnS0hKdmIzUkRiMjUwWlhoMEtTQS9JSEp2YjNSRGIyNTBaWGgwVzBOUFRsUkZXRlJmU1VSZElEb2dTVTVKVkVsQlRGOURUMDVVUlZoVVgwbEVPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHNWxkeUJRY205NGVTaGpiMjUwWlhoMExDQjdYRzRnSUNBZ0lDQm5aWFE2SUNoMFlYSm5aWFFzSUhCeWIzQk9ZVzFsS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNod2NtOXdUbUZ0WlNBOVBUMGdRMDlPVkVWWVZGOUpSQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lHeGxkQ0J3WVhKbGJuUkpSQ0E5SUNoeWIyOTBRMjl1ZEdWNGRDa2dQeUJ5YjI5MFEyOXVkR1Y0ZEZ0RFQwNVVSVmhVWDBsRVhTQTZJRWxPU1ZSSlFVeGZRMDlPVkVWWVZGOUpSRHRjYmlBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnS0hCaGNtVnVkRWxFSUQ0Z2JYbERiMjUwWlhoMFNVUXBJRDhnY0dGeVpXNTBTVVFnT2lCdGVVTnZiblJsZUhSSlJEdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hUMkpxWldOMExuQnliM1J2ZEhsd1pTNW9ZWE5QZDI1UWNtOXdaWEowZVM1allXeHNLSFJoY21kbGRDd2djSEp2Y0U1aGJXVXBLVnh1SUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUFvY205dmRFTnZiblJsZUhRcElEOGdjbTl2ZEVOdmJuUmxlSFJiY0hKdmNFNWhiV1ZkSURvZ2RXNWtaV1pwYm1Wa08xeHVYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBZWEpuWlhSYmNISnZjRTVoYldWZE8xeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lITmxkRG9nS0hSaGNtZGxkQ3dnY0hKdmNFNWhiV1VzSUhaaGJIVmxLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h3Y205d1RtRnRaU0E5UFQwZ1EwOU9WRVZZVkY5SlJDbGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUNBZ0lDQnBaaUFvZEdGeVoyVjBXM0J5YjNCT1lXMWxYU0E5UFQwZ2RtRnNkV1VwWEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQWdJQ0FnYlhsRGIyNTBaWGgwU1VRZ1BTQXJLMTlqYjI1MFpYaDBTVVJEYjNWdWRHVnlPMXh1SUNBZ0lDQWdJQ0IwWVhKblpYUmJjSEp2Y0U1aGJXVmRJRDBnZG1Gc2RXVTdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCdmJsVndaR0YwWlNBOVBUMGdKMloxYm1OMGFXOXVKeWxjYmlBZ0lDQWdJQ0FnSUNCdmJsVndaR0YwWlM1allXeHNLRzl1VlhCa1lYUmxWR2hwY3l3Z2IyNVZjR1JoZEdWVWFHbHpLVHRjYmx4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ2ZTazdYRzRnSUgxY2JuMWNiaUlzSW1sdGNHOXlkQ0JrWldGa1ltVmxaaUJtY205dElDZGtaV0ZrWW1WbFppYzdYRzVwYlhCdmNuUWdLaUJoY3lCVmRHbHNjeUJtY205dElDY3VMaTkxZEdsc2N5NXFjeWM3WEc1cGJYQnZjblFnZTF4dUlDQnBjMHBwWW1semFDeGNiaUFnY21WemIyeDJaVU5vYVd4a2NtVnVMRnh1SUNCamIyNXpkSEoxWTNSS2FXSXNYRzU5SUdaeWIyMGdKeTR1TDJwcFlpNXFjeWM3WEc1Y2JtVjRjRzl5ZENCamIyNXpkQ0JEVDA1VVJWaFVYMGxFSUQwZ1UzbHRZbTlzTG1admNpZ25RR3BwWW5NdmJtOWtaUzlqYjI1MFpYaDBTVVFuS1R0Y2JseHVaWGh3YjNKMElHTnNZWE56SUZKdmIzUk9iMlJsSUh0Y2JpQWdjM1JoZEdsaklFTlBUbFJGV0ZSZlNVUWdQU0JEVDA1VVJWaFVYMGxFTzF4dVhHNGdJR052Ym5OMGNuVmpkRzl5S0hKbGJtUmxjbVZ5TENCd1lYSmxiblJPYjJSbExDQmZZMjl1ZEdWNGRDd2dhbWxpS1NCN1hHNGdJQ0FnYkdWMElHTnZiblJsZUhRZ1BTQnVkV3hzTzF4dVhHNGdJQ0FnYVdZZ0tIUm9hWE11WTI5dWMzUnlkV04wYjNJdVNFRlRYME5QVGxSRldGUWdJVDA5SUdaaGJITmxJQ1ltSUNoeVpXNWtaWEpsY2lCOGZDQjBhR2x6TG1OeVpXRjBaVU52Ym5SbGVIUXBLU0I3WEc0Z0lDQWdJQ0JqYjI1MFpYaDBJRDBnS0hKbGJtUmxjbVZ5SUh4OElIUm9hWE1wTG1OeVpXRjBaVU52Ym5SbGVIUW9YRzRnSUNBZ0lDQWdJRjlqYjI1MFpYaDBMRnh1SUNBZ0lDQWdJQ0FvZEdocGN5NXZia052Ym5SbGVIUlZjR1JoZEdVcElEOGdkR2hwY3k1dmJrTnZiblJsZUhSVmNHUmhkR1VnT2lCMWJtUmxabWx1WldRc1hHNGdJQ0FnSUNBZ0lIUm9hWE1zWEc0Z0lDQWdJQ0FwTzF4dUlDQWdJSDFjYmx4dUlDQWdJRTlpYW1WamRDNWtaV1pwYm1WUWNtOXdaWEowYVdWektIUm9hWE1zSUh0Y2JpQWdJQ0FnSUNkVVdWQkZKem9nZTF4dUlDQWdJQ0FnSUNCbGJuVnRaWEpoWW14bE9pQWdJR1poYkhObExGeHVJQ0FnSUNBZ0lDQmpiMjVtYVdkMWNtRmliR1U2SUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JuWlhRNklDQWdJQ0FnSUNBZ0lDZ3BJRDArSUhSb2FYTXVZMjl1YzNSeWRXTjBiM0l1VkZsUVJTeGNiaUFnSUNBZ0lDQWdjMlYwT2lBZ0lDQWdJQ0FnSUNBb0tTQTlQaUI3ZlN3Z0x5OGdUazlQVUZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNkcFpDYzZJSHRjYmlBZ0lDQWdJQ0FnZDNKcGRHRmliR1U2SUNBZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1pXNTFiV1Z5WVdKc1pUb2dJQ0JtWVd4elpTeGNiaUFnSUNBZ0lDQWdZMjl1Wm1sbmRYSmhZbXhsT2lCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnZG1Gc2RXVTZJQ0FnSUNBZ0lDQlZkR2xzY3k1blpXNWxjbUYwWlZWVlNVUW9LU3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuY21WdVpHVnlaWEluT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJSEpsYm1SbGNtVnlMRnh1SUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ2R3WVhKbGJuUk9iMlJsSnpvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J3WVhKbGJuUk9iMlJsTEZ4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNkamFHbHNaRTV2WkdWekp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCdVpYY2dUV0Z3S0Nrc1hHNGdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0oyTnZiblJsZUhRbk9pQjdYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ1oyVjBPaUFnSUNBZ0lDQWdJQ0FvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJR052Ym5SbGVIUTdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUhObGREb2dJQ0FnSUNBZ0lDQWdLQ2tnUFQ0Z2UzMHNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMlJsYzNSeWIzbHBibWNuT2lCN1hHNGdJQ0FnSUNBZ0lIZHlhWFJoWW14bE9pQWdJQ0FnZEhKMVpTeGNiaUFnSUNBZ0lDQWdaVzUxYldWeVlXSnNaVG9nSUNCbVlXeHpaU3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5kWEpoWW14bE9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNCMllXeDFaVG9nSUNBZ0lDQWdJR1poYkhObExGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHlaVzVrWlhKUWNtOXRhWE5sSnpvZ2UxeHVJQ0FnSUNBZ0lDQjNjbWwwWVdKc1pUb2dJQ0FnSUhSeWRXVXNYRzRnSUNBZ0lDQWdJR1Z1ZFcxbGNtRmliR1U2SUNBZ1ptRnNjMlVzWEc0Z0lDQWdJQ0FnSUdOdmJtWnBaM1Z5WVdKc1pUb2dkSEoxWlN4Y2JpQWdJQ0FnSUNBZ2RtRnNkV1U2SUNBZ0lDQWdJQ0J1ZFd4c0xGeHVJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDZHlaVzVrWlhKR2NtRnRaU2M2SUh0Y2JpQWdJQ0FnSUNBZ2QzSnBkR0ZpYkdVNklDQWdJQ0IwY25WbExGeHVJQ0FnSUNBZ0lDQmxiblZ0WlhKaFlteGxPaUFnSUdaaGJITmxMRnh1SUNBZ0lDQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklIUnlkV1VzWEc0Z0lDQWdJQ0FnSUhaaGJIVmxPaUFnSUNBZ0lDQWdNQ3hjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FuYW1saUp6b2dlMXh1SUNBZ0lDQWdJQ0IzY21sMFlXSnNaVG9nSUNBZ0lIUnlkV1VzWEc0Z0lDQWdJQ0FnSUdWdWRXMWxjbUZpYkdVNklDQWdabUZzYzJVc1hHNGdJQ0FnSUNBZ0lHTnZibVpwWjNWeVlXSnNaVG9nZEhKMVpTeGNiaUFnSUNBZ0lDQWdkbUZzZFdVNklDQWdJQ0FnSUNCcWFXSXNYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdKMjVoZEdsMlpVVnNaVzFsYm5Rbk9pQjdYRzRnSUNBZ0lDQWdJSGR5YVhSaFlteGxPaUFnSUNBZ2RISjFaU3hjYmlBZ0lDQWdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuZFhKaFlteGxPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQjJZV3gxWlRvZ0lDQWdJQ0FnSUc1MWJHd3NYRzRnSUNBZ0lDQjlMRnh1SUNBZ0lIMHBPMXh1SUNCOVhHNWNiaUFnY21WemIyeDJaVU5vYVd4a2NtVnVLR05vYVd4a2NtVnVLU0I3WEc0Z0lDQWdjbVYwZFhKdUlISmxjMjlzZG1WRGFHbHNaSEpsYmk1allXeHNLSFJvYVhNc0lHTm9hV3hrY21WdUtUdGNiaUFnZlZ4dVhHNGdJR2x6U21saUtIWmhiSFZsS1NCN1hHNGdJQ0FnY21WMGRYSnVJR2x6U21saWFYTm9LSFpoYkhWbEtUdGNiaUFnZlZ4dVhHNGdJR052Ym5OMGNuVmpkRXBwWWloMllXeDFaU2tnZTF4dUlDQWdJSEpsZEhWeWJpQmpiMjV6ZEhKMVkzUkthV0lvZG1Gc2RXVXBPMXh1SUNCOVhHNWNiaUFnWjJWMFEyRmphR1ZMWlhrb0tTQjdYRzRnSUNBZ2JHVjBJSHNnVkhsd1pTd2djSEp2Y0hNZ2ZTQTlJQ2gwYUdsekxtcHBZaUI4ZkNCN2ZTazdYRzRnSUNBZ2JHVjBJR05oWTJobFMyVjVJRDBnWkdWaFpHSmxaV1lvVkhsd1pTd2djSEp2Y0hNdWEyVjVLVHRjYmx4dUlDQWdJSEpsZEhWeWJpQmpZV05vWlV0bGVUdGNiaUFnZlZ4dVhHNGdJSFZ3WkdGMFpVcHBZaWh1WlhkS2FXSXBJSHRjYmlBZ0lDQjBhR2x6TG1wcFlpQTlJRzVsZDBwcFlqdGNiaUFnZlZ4dVhHNGdJSEpsYlc5MlpVTm9hV3hrS0dOb2FXeGtUbTlrWlNrZ2UxeHVJQ0FnSUd4bGRDQmpZV05vWlV0bGVTQTlJR05vYVd4a1RtOWtaUzVuWlhSRFlXTm9aVXRsZVNncE8xeHVJQ0FnSUhSb2FYTXVZMmhwYkdST2IyUmxjeTVrWld4bGRHVW9ZMkZqYUdWTFpYa3BPMXh1SUNCOVhHNWNiaUFnWVdSa1EyaHBiR1FvWTJocGJHUk9iMlJsS1NCN1hHNGdJQ0FnYkdWMElHTmhZMmhsUzJWNUlEMGdZMmhwYkdST2IyUmxMbWRsZEVOaFkyaGxTMlY1S0NrN1hHNGdJQ0FnZEdocGN5NWphR2xzWkU1dlpHVnpMbk5sZENoallXTm9aVXRsZVN3Z1kyaHBiR1JPYjJSbEtUdGNiaUFnZlZ4dVhHNGdJR2RsZEVOb2FXeGtLR05oWTJobFMyVjVLU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE11WTJocGJHUk9iMlJsY3k1blpYUW9ZMkZqYUdWTFpYa3BPMXh1SUNCOVhHNWNiaUFnWjJWMFZHaHBjMDV2WkdWUGNrTm9hV3hrVG05a1pYTW9LU0I3WEc0Z0lDQWdjbVYwZFhKdUlIUm9hWE03WEc0Z0lIMWNibHh1SUNCblpYUkRhR2xzWkhKbGJrNXZaR1Z6S0NrZ2UxeHVJQ0FnSUd4bGRDQmphR2xzWkU1dlpHVnpJRDBnVzEwN1hHNGdJQ0FnWm05eUlDaHNaWFFnWTJocGJHUk9iMlJsSUc5bUlIUm9hWE11WTJocGJHUk9iMlJsY3k1MllXeDFaWE1vS1NsY2JpQWdJQ0FnSUdOb2FXeGtUbTlrWlhNZ1BTQmphR2xzWkU1dlpHVnpMbU52Ym1OaGRDaGphR2xzWkU1dlpHVXVaMlYwVkdocGMwNXZaR1ZQY2tOb2FXeGtUbTlrWlhNb0tTazdYRzVjYmlBZ0lDQnlaWFIxY200Z1kyaHBiR1JPYjJSbGN5NW1hV3gwWlhJb1FtOXZiR1ZoYmlrN1hHNGdJSDFjYmx4dUlDQmhjM2x1WXlCa1pYTjBjbTk1S0dadmNtTmxLU0I3WEc0Z0lDQWdhV1lnS0NGbWIzSmpaU0FtSmlCMGFHbHpMbVJsYzNSeWIzbHBibWNwWEc0Z0lDQWdJQ0J5WlhSMWNtNDdYRzVjYmlBZ0lDQjBhR2x6TG1SbGMzUnliM2xwYm1jZ1BTQjBjblZsTzF4dVhHNGdJQ0FnYVdZZ0tIUm9hWE11Y21WdVpHVnlVSEp2YldselpTbGNiaUFnSUNBZ0lHRjNZV2wwSUhSb2FYTXVjbVZ1WkdWeVVISnZiV2x6WlR0Y2JseHVJQ0FnSUdGM1lXbDBJSFJvYVhNdVpHVnpkSEp2ZVVaeWIyMUVUMDBvZEdocGN5NWpiMjUwWlhoMExDQjBhR2x6S1R0Y2JseHVJQ0FnSUd4bGRDQmtaWE4wY205NVVISnZiV2x6WlhNZ1BTQmJYVHRjYmlBZ0lDQm1iM0lnS0d4bGRDQmphR2xzWkU1dlpHVWdiMllnZEdocGN5NWphR2xzWkU1dlpHVnpMblpoYkhWbGN5Z3BLVnh1SUNBZ0lDQWdaR1Z6ZEhKdmVWQnliMjFwYzJWekxuQjFjMmdvWTJocGJHUk9iMlJsTG1SbGMzUnliM2tvS1NrN1hHNWNiaUFnSUNCMGFHbHpMbU5vYVd4a1RtOWtaWE11WTJ4bFlYSW9LVHRjYmlBZ0lDQmhkMkZwZENCUWNtOXRhWE5sTG1Gc2JDaGtaWE4wY205NVVISnZiV2x6WlhNcE8xeHVYRzRnSUNBZ2RHaHBjeTV1WVhScGRtVkZiR1Z0Wlc1MElEMGdiblZzYkR0Y2JpQWdJQ0IwYUdsekxuQmhjbVZ1ZEU1dlpHVWdQU0J1ZFd4c08xeHVJQ0FnSUhSb2FYTXVZMjl1ZEdWNGRDQTlJRzUxYkd3N1hHNGdJQ0FnZEdocGN5NXFhV0lnUFNCdWRXeHNPMXh1SUNCOVhHNWNiaUFnYVhOV1lXeHBaRU5vYVd4a0tHTm9hV3hrS1NCN1hHNGdJQ0FnY21WMGRYSnVJRlYwYVd4ekxtbHpWbUZzYVdSRGFHbHNaQ2hqYUdsc1pDazdYRzRnSUgxY2JseHVJQ0JwYzBsMFpYSmhZbXhsUTJocGJHUW9ZMmhwYkdRcElIdGNiaUFnSUNCeVpYUjFjbTRnVlhScGJITXVhWE5KZEdWeVlXSnNaVU5vYVd4a0tHTm9hV3hrS1R0Y2JpQWdmVnh1WEc0Z0lIQnliM0J6UkdsbVptVnlLRzlzWkZCeWIzQnpMQ0J1WlhkUWNtOXdjeXdnYzJ0cGNFdGxlWE1wSUh0Y2JpQWdJQ0J5WlhSMWNtNGdWWFJwYkhNdWNISnZjSE5FYVdabVpYSW9iMnhrVUhKdmNITXNJRzVsZDFCeWIzQnpMQ0J6YTJsd1MyVjVjeWs3WEc0Z0lIMWNibHh1SUNCamFHbHNaSEpsYmtScFptWmxjaWh2YkdSRGFHbHNaSEpsYml3Z2JtVjNRMmhwYkdSeVpXNHBJSHRjYmlBZ0lDQnlaWFIxY200Z1ZYUnBiSE11WTJocGJHUnlaVzVFYVdabVpYSW9iMnhrUTJocGJHUnlaVzRzSUc1bGQwTm9hV3hrY21WdUtUdGNiaUFnZlZ4dVhHNGdJR0Z6ZVc1aklISmxibVJsY2lndUxpNWhjbWR6S1NCN1hHNGdJQ0FnYVdZZ0tIUm9hWE11WkdWemRISnZlV2x1WnlsY2JpQWdJQ0FnSUhKbGRIVnlianRjYmx4dUlDQWdJSFJvYVhNdWNtVnVaR1Z5Um5KaGJXVXJLenRjYmlBZ0lDQnNaWFFnY21WdVpHVnlSbkpoYldVZ1BTQjBhR2x6TG5KbGJtUmxja1p5WVcxbE8xeHVYRzRnSUNBZ2FXWWdLSFI1Y0dWdlppQjBhR2x6TGw5eVpXNWtaWElnUFQwOUlDZG1kVzVqZEdsdmJpY3BJSHRjYmlBZ0lDQWdJSFJvYVhNdWNtVnVaR1Z5VUhKdmJXbHpaU0E5SUhSb2FYTXVYM0psYm1SbGNpZ3VMaTVoY21kektWeHVJQ0FnSUNBZ0lDQXVkR2hsYmloaGMzbHVZeUFvY21WemRXeDBLU0E5UGlCN1hHNGdJQ0FnSUNBZ0lDQWdhV1lnS0hKbGJtUmxja1p5WVcxbElENDlJSFJvYVhNdWNtVnVaR1Z5Um5KaGJXVXBYRzRnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0IwYUdsekxuTjVibU5FVDAwb2RHaHBjeTVqYjI1MFpYaDBMQ0IwYUdsektUdGNibHh1SUNBZ0lDQWdJQ0FnSUhSb2FYTXVjbVZ1WkdWeVVISnZiV2x6WlNBOUlHNTFiR3c3WEc0Z0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhKbGMzVnNkRHRjYmlBZ0lDQWdJQ0FnZlNsY2JpQWdJQ0FnSUNBZ0xtTmhkR05vS0NobGNuSnZjaWtnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJSFJvYVhNdWNtVnVaR1Z5VUhKdmJXbHpaU0E5SUc1MWJHdzdYRzRnSUNBZ0lDQWdJQ0FnZEdoeWIzY2daWEp5YjNJN1hHNGdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNCaGQyRnBkQ0IwYUdsekxuTjVibU5FVDAwb2RHaHBjeTVqYjI1MFpYaDBMQ0IwYUdsektUdGNiaUFnSUNCOVhHNWNiaUFnSUNCeVpYUjFjbTRnZEdocGN5NXlaVzVrWlhKUWNtOXRhWE5sTzF4dUlDQjlYRzVjYmlBZ1oyVjBVR0Z5Wlc1MFNVUW9LU0I3WEc0Z0lDQWdhV1lnS0NGMGFHbHpMbkJoY21WdWRFNXZaR1VwWEc0Z0lDQWdJQ0J5WlhSMWNtNDdYRzVjYmlBZ0lDQnlaWFIxY200Z2RHaHBjeTV3WVhKbGJuUk9iMlJsTG1sa08xeHVJQ0I5WEc1Y2JpQWdZWE41Ym1NZ1pHVnpkSEp2ZVVaeWIyMUVUMDBvWTI5dWRHVjRkQ3dnYm05a1pTa2dlMXh1SUNBZ0lHbG1JQ2doZEdocGN5NXlaVzVrWlhKbGNpbGNiaUFnSUNBZ0lISmxkSFZ5Ymp0Y2JseHVJQ0FnSUhKbGRIVnliaUJoZDJGcGRDQjBhR2x6TG5KbGJtUmxjbVZ5TG1SbGMzUnliM2xHY205dFJFOU5LR052Ym5SbGVIUXNJRzV2WkdVcE8xeHVJQ0I5WEc1Y2JpQWdZWE41Ym1NZ2MzbHVZMFJQVFNoamIyNTBaWGgwTENCdWIyUmxLU0I3WEc0Z0lDQWdhV1lnS0NGMGFHbHpMbkpsYm1SbGNtVnlLVnh1SUNBZ0lDQWdjbVYwZFhKdU8xeHVYRzRnSUNBZ2NtVjBkWEp1SUdGM1lXbDBJSFJvYVhNdWNtVnVaR1Z5WlhJdWMzbHVZMFJQVFNoamIyNTBaWGgwTENCdWIyUmxLVHRjYmlBZ2ZWeHVmVnh1SWl3aUx5b2daWE5zYVc1MExXUnBjMkZpYkdVZ2JtOHRiV0ZuYVdNdGJuVnRZbVZ5Y3lBcUwxeHVhVzF3YjNKMElHUmxZV1JpWldWbUlHWnliMjBnSjJSbFlXUmlaV1ZtSnp0Y2JseHVZMjl1YzNRZ1UxUlBVQ0E5SUZONWJXSnZiQzVtYjNJb0owQnFhV0p6U1hSbGNtRjBaVk4wYjNBbktUdGNibHh1THk4Z1pYTnNhVzUwTFdScGMyRmliR1V0Ym1WNGRDMXNhVzVsSUc1dkxXNWxjM1JsWkMxMFpYSnVZWEo1WEc1amIyNXpkQ0JuYkc5aVlXeFRZMjl3WlNBOUlDaDBlWEJsYjJZZ1oyeHZZbUZzSUNFOVBTQW5kVzVrWldacGJtVmtKeWtnUHlCbmJHOWlZV3dnT2lBb2RIbHdaVzltSUhkcGJtUnZkeUFoUFQwZ0ozVnVaR1ZtYVc1bFpDY3BJRDhnZDJsdVpHOTNJRG9nZEdocGN6dGNibHh1YkdWMElIVjFhV1FnUFNBeE1EQXdNREF3TzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2FXNXpkR0Z1WTJWUFppaHZZbW9wSUh0Y2JpQWdablZ1WTNScGIyNGdkR1Z6ZEZSNWNHVW9iMkpxTENCZmRtRnNLU0I3WEc0Z0lDQWdablZ1WTNScGIyNGdhWE5FWldabGNuSmxaRlI1Y0dVb2IySnFLU0I3WEc0Z0lDQWdJQ0JwWmlBb2IySnFJR2x1YzNSaGJtTmxiMllnVUhKdmJXbHpaU0I4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblVISnZiV2x6WlNjcEtWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQWdJQ0FnTHk4Z1VYVmhZMnNnY1hWaFkyc3VMaTVjYmlBZ0lDQWdJR2xtSUNoMGVYQmxiMllnYjJKcUxuUm9aVzRnUFQwOUlDZG1kVzVqZEdsdmJpY2dKaVlnZEhsd1pXOW1JRzlpYWk1allYUmphQ0E5UFQwZ0oyWjFibU4wYVc5dUp5bGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNiaUFnSUNCOVhHNWNiaUFnSUNCc1pYUWdkbUZzSUNBZ0lDQTlJRjkyWVd3N1hHNGdJQ0FnYkdWMElIUjVjR1ZQWmlBZ1BTQW9kSGx3Wlc5bUlHOWlhaWs3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNVRkSEpwYm1jcFhHNGdJQ0FnSUNCMllXd2dQU0FuYzNSeWFXNW5KenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMazUxYldKbGNpbGNiaUFnSUNBZ0lIWmhiQ0E5SUNkdWRXMWlaWEluTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1UW05dmJHVmhiaWxjYmlBZ0lDQWdJSFpoYkNBOUlDZGliMjlzWldGdUp6dGNiaUFnSUNCbGJITmxJR2xtSUNoMllXd2dQVDA5SUdkc2IySmhiRk5qYjNCbExrWjFibU4wYVc5dUtWeHVJQ0FnSUNBZ2RtRnNJRDBnSjJaMWJtTjBhVzl1Snp0Y2JpQWdJQ0JsYkhObElHbG1JQ2gyWVd3Z1BUMDlJR2RzYjJKaGJGTmpiM0JsTGtGeWNtRjVLVnh1SUNBZ0lDQWdkbUZzSUQwZ0oyRnljbUY1Snp0Y2JpQWdJQ0JsYkhObElHbG1JQ2gyWVd3Z1BUMDlJR2RzYjJKaGJGTmpiM0JsTGs5aWFtVmpkQ2xjYmlBZ0lDQWdJSFpoYkNBOUlDZHZZbXBsWTNRbk8xeHVJQ0FnSUdWc2MyVWdhV1lnS0haaGJDQTlQVDBnWjJ4dlltRnNVMk52Y0dVdVVISnZiV2x6WlNsY2JpQWdJQ0FnSUhaaGJDQTlJQ2R3Y205dGFYTmxKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMa0pwWjBsdWRDbGNiaUFnSUNBZ0lIWmhiQ0E5SUNkaWFXZHBiblFuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VFdGd0tWeHVJQ0FnSUNBZ2RtRnNJRDBnSjIxaGNDYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNVhaV0ZyVFdGd0tWeHVJQ0FnSUNBZ2RtRnNJRDBnSjNkbFlXdHRZWEFuTzF4dUlDQWdJR1ZzYzJVZ2FXWWdLSFpoYkNBOVBUMGdaMnh2WW1Gc1UyTnZjR1V1VTJWMEtWeHVJQ0FnSUNBZ2RtRnNJRDBnSjNObGRDYzdYRzRnSUNBZ1pXeHpaU0JwWmlBb2RtRnNJRDA5UFNCbmJHOWlZV3hUWTI5d1pTNVRlVzFpYjJ3cFhHNGdJQ0FnSUNCMllXd2dQU0FuYzNsdFltOXNKenRjYmlBZ0lDQmxiSE5sSUdsbUlDaDJZV3dnUFQwOUlHZHNiMkpoYkZOamIzQmxMa0oxWm1abGNpbGNiaUFnSUNBZ0lIWmhiQ0E5SUNkaWRXWm1aWEluTzF4dVhHNGdJQ0FnYVdZZ0tIWmhiQ0E5UFQwZ0oySjFabVpsY2ljZ0ppWWdaMnh2WW1Gc1UyTnZjR1V1UW5WbVptVnlJQ1ltSUdkc2IySmhiRk5qYjNCbExrSjFabVpsY2k1cGMwSjFabVpsY2lodlltb3BLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNBbmJuVnRZbVZ5SnlBbUppQW9kSGx3WlU5bUlEMDlQU0FuYm5WdFltVnlKeUI4ZkNCdlltb2dhVzV6ZEdGdVkyVnZaaUJPZFcxaVpYSWdmSHdnS0c5aWFpNWpiMjV6ZEhKMVkzUnZjaUFtSmlCdlltb3VZMjl1YzNSeWRXTjBiM0l1Ym1GdFpTQTlQVDBnSjA1MWJXSmxjaWNwS1NrZ2UxeHVJQ0FnSUNBZ2FXWWdLQ0ZwYzBacGJtbDBaU2h2WW1vcEtWeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVJQ0FnSUgxY2JseHVJQ0FnSUdsbUlDaDJZV3dnSVQwOUlDZHZZbXBsWTNRbklDWW1JSFpoYkNBOVBUMGdkSGx3WlU5bUtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuYjJKcVpXTjBKeWtnZTF4dUlDQWdJQ0FnYVdZZ0tDaHZZbW91WTI5dWMzUnlkV04wYjNJZ1BUMDlJRTlpYW1WamRDNXdjbTkwYjNSNWNHVXVZMjl1YzNSeWRXTjBiM0lnZkh3Z0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBbUppQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0owOWlhbVZqZENjcEtTbGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0FnSUM4dklFNTFiR3dnY0hKdmRHOTBlWEJsSUc5dUlHOWlhbVZqZEZ4dUlDQWdJQ0FnYVdZZ0tIUjVjR1ZQWmlBOVBUMGdKMjlpYW1WamRDY2dKaVlnSVc5aWFpNWpiMjV6ZEhKMVkzUnZjaWxjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnSUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuWVhKeVlYa25JQ1ltSUNoQmNuSmhlUzVwYzBGeWNtRjVLRzlpYWlrZ2ZId2diMkpxSUdsdWMzUmhibU5sYjJZZ1FYSnlZWGtnZkh3Z0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBbUppQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0owRnljbUY1SnlrcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvS0haaGJDQTlQVDBnSjNCeWIyMXBjMlVuSUh4OElIWmhiQ0E5UFQwZ0oyUmxabVZ5Y21Wa0p5a2dKaVlnYVhORVpXWmxjbkpsWkZSNWNHVW9iMkpxS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKM04wY21sdVp5Y2dKaVlnS0c5aWFpQnBibk4wWVc1alpXOW1JR2RzYjJKaGJGTmpiM0JsTGxOMGNtbHVaeUI4ZkNBb2IySnFMbU52Ym5OMGNuVmpkRzl5SUNZbUlHOWlhaTVqYjI1emRISjFZM1J2Y2k1dVlXMWxJRDA5UFNBblUzUnlhVzVuSnlrcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZG1Gc0lEMDlQU0FuWW05dmJHVmhiaWNnSmlZZ0tHOWlhaUJwYm5OMFlXNWpaVzltSUdkc2IySmhiRk5qYjNCbExrSnZiMnhsWVc0Z2ZId2dLRzlpYWk1amIyNXpkSEoxWTNSdmNpQW1KaUJ2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlNBOVBUMGdKMEp2YjJ4bFlXNG5LU2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUdsbUlDaDJZV3dnUFQwOUlDZHRZWEFuSUNZbUlDaHZZbW9nYVc1emRHRnVZMlZ2WmlCbmJHOWlZV3hUWTI5d1pTNU5ZWEFnZkh3Z0tHOWlhaTVqYjI1emRISjFZM1J2Y2lBbUppQnZZbW91WTI5dWMzUnlkV04wYjNJdWJtRnRaU0E5UFQwZ0owMWhjQ2NwS1NsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2FXWWdLSFpoYkNBOVBUMGdKM2RsWVd0dFlYQW5JQ1ltSUNodlltb2dhVzV6ZEdGdVkyVnZaaUJuYkc5aVlXeFRZMjl3WlM1WFpXRnJUV0Z3SUh4OElDaHZZbW91WTI5dWMzUnlkV04wYjNJZ0ppWWdiMkpxTG1OdmJuTjBjblZqZEc5eUxtNWhiV1VnUFQwOUlDZFhaV0ZyVFdGd0p5a3BLVnh1SUNBZ0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1Y2JpQWdJQ0JwWmlBb2RtRnNJRDA5UFNBbmMyVjBKeUFtSmlBb2IySnFJR2x1YzNSaGJtTmxiMllnWjJ4dlltRnNVMk52Y0dVdVUyVjBJSHg4SUNodlltb3VZMjl1YzNSeWRXTjBiM0lnSmlZZ2IySnFMbU52Ym5OMGNuVmpkRzl5TG01aGJXVWdQVDA5SUNkVFpYUW5LU2twWEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0FnSUdsbUlDaDJZV3dnUFQwOUlDZG1kVzVqZEdsdmJpY2dKaVlnZEhsd1pVOW1JRDA5UFNBblpuVnVZM1JwYjI0bktWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JSFpoYkNBOVBUMGdKMloxYm1OMGFXOXVKeUFtSmlCdlltb2dhVzV6ZEdGdVkyVnZaaUIyWVd3cFhHNGdJQ0FnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNBZ0lHbG1JQ2gwZVhCbGIyWWdkbUZzSUQwOVBTQW5jM1J5YVc1bkp5QW1KaUJ2WW1vdVkyOXVjM1J5ZFdOMGIzSWdKaVlnYjJKcUxtTnZibk4wY25WamRHOXlMbTVoYldVZ1BUMDlJSFpoYkNsY2JpQWdJQ0FnSUhKbGRIVnliaUIwY25WbE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUdaaGJITmxPMXh1SUNCOVhHNWNiaUFnYVdZZ0tHOWlhaUE5UFNCdWRXeHNLVnh1SUNBZ0lISmxkSFZ5YmlCbVlXeHpaVHRjYmx4dUlDQm1iM0lnS0haaGNpQnBJRDBnTVN3Z2JHVnVJRDBnWVhKbmRXMWxiblJ6TG14bGJtZDBhRHNnYVNBOElHeGxianNnYVNzcktTQjdYRzRnSUNBZ2FXWWdLSFJsYzNSVWVYQmxLRzlpYWl3Z1lYSm5kVzFsYm5SelcybGRLU0E5UFQwZ2RISjFaU2xjYmlBZ0lDQWdJSEpsZEhWeWJpQjBjblZsTzF4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUdaaGJITmxPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2NISnZjSE5FYVdabVpYSW9iMnhrVUhKdmNITXNJRzVsZDFCeWIzQnpMQ0J6YTJsd1MyVjVjeWtnZTF4dUlDQnBaaUFvYjJ4a1VISnZjSE1nUFQwOUlHNWxkMUJ5YjNCektWeHVJQ0FnSUhKbGRIVnliaUJtWVd4elpUdGNibHh1SUNCcFppQW9kSGx3Wlc5bUlHOXNaRkJ5YjNCeklDRTlQU0IwZVhCbGIyWWdibVYzVUhKdmNITXBYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ2FXWWdLQ0Z2YkdSUWNtOXdjeUFtSmlCdVpYZFFjbTl3Y3lsY2JpQWdJQ0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JwWmlBb2IyeGtVSEp2Y0hNZ0ppWWdJVzVsZDFCeWIzQnpLVnh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lDOHZJR1Z6YkdsdWRDMWthWE5oWW14bExXNWxlSFF0YkdsdVpTQmxjV1Z4WlhGY2JpQWdhV1lnS0NGdmJHUlFjbTl3Y3lBbUppQWhibVYzVUhKdmNITWdKaVlnYjJ4a1VISnZjSE1nSVQwZ2IyeGtVSEp2Y0hNcFhHNGdJQ0FnY21WMGRYSnVJSFJ5ZFdVN1hHNWNiaUFnYkdWMElHRkxaWGx6SUQwZ1QySnFaV04wTG10bGVYTW9iMnhrVUhKdmNITXBMbU52Ym1OaGRDaFBZbXBsWTNRdVoyVjBUM2R1VUhKdmNHVnlkSGxUZVcxaWIyeHpLRzlzWkZCeWIzQnpLU2s3WEc0Z0lHeGxkQ0JpUzJWNWN5QTlJRTlpYW1WamRDNXJaWGx6S0c1bGQxQnliM0J6S1M1amIyNWpZWFFvVDJKcVpXTjBMbWRsZEU5M2JsQnliM0JsY25SNVUzbHRZbTlzY3lodVpYZFFjbTl3Y3lrcE8xeHVYRzRnSUdsbUlDaGhTMlY1Y3k1c1pXNW5kR2dnSVQwOUlHSkxaWGx6TG14bGJtZDBhQ2xjYmlBZ0lDQnlaWFIxY200Z2RISjFaVHRjYmx4dUlDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0JoUzJWNWN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdiR1YwSUdGTFpYa2dQU0JoUzJWNWMxdHBYVHRjYmlBZ0lDQnBaaUFvYzJ0cGNFdGxlWE1nSmlZZ2MydHBjRXRsZVhNdWFXNWtaWGhQWmloaFMyVjVLU0ErUFNBd0tWeHVJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNWNiaUFnSUNCcFppQW9iMnhrVUhKdmNITmJZVXRsZVYwZ0lUMDlJRzVsZDFCeWIzQnpXMkZMWlhsZEtWeHVJQ0FnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzVjYmlBZ0lDQnNaWFFnWWt0bGVTQTlJR0pMWlhselcybGRPMXh1SUNBZ0lHbG1JQ2h6YTJsd1MyVjVjeUFtSmlCemEybHdTMlY1Y3k1cGJtUmxlRTltS0dKTFpYa3BLVnh1SUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzVjYmlBZ0lDQnBaaUFvWVV0bGVTQTlQVDBnWWt0bGVTbGNiaUFnSUNBZ0lHTnZiblJwYm5WbE8xeHVYRzRnSUNBZ2FXWWdLRzlzWkZCeWIzQnpXMkpMWlhsZElDRTlQU0J1WlhkUWNtOXdjMXRpUzJWNVhTbGNiaUFnSUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1SUNCOVhHNWNiaUFnY21WMGRYSnVJR1poYkhObE8xeHVmVnh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnYzJsNlpVOW1LSFpoYkhWbEtTQjdYRzRnSUdsbUlDZ2hkbUZzZFdVcFhHNGdJQ0FnY21WMGRYSnVJREE3WEc1Y2JpQWdhV1lnS0U5aWFtVmpkQzVwY3loSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJREE3WEc1Y2JpQWdhV1lnS0hSNWNHVnZaaUIyWVd4MVpTNXNaVzVuZEdnZ1BUMDlJQ2R1ZFcxaVpYSW5LVnh1SUNBZ0lISmxkSFZ5YmlCMllXeDFaUzVzWlc1bmRHZzdYRzVjYmlBZ2NtVjBkWEp1SUU5aWFtVmpkQzVyWlhsektIWmhiSFZsS1M1c1pXNW5kR2c3WEc1OVhHNWNibVoxYm1OMGFXOXVJRjlwZEdWeVlYUmxLRzlpYWl3Z1kyRnNiR0poWTJzcElIdGNiaUFnYVdZZ0tDRnZZbW9nZkh3Z1QySnFaV04wTG1sektFbHVabWx1YVhSNUtTbGNiaUFnSUNCeVpYUjFjbTRnVzEwN1hHNWNiaUFnYkdWMElISmxjM1ZzZEhNZ0lDQTlJRnRkTzF4dUlDQnNaWFFnYzJOdmNHVWdJQ0FnSUQwZ2V5QmpiMnhzWldOMGFXOXVPaUJ2WW1vc0lGTlVUMUFnZlR0Y2JpQWdiR1YwSUhKbGMzVnNkRHRjYmx4dUlDQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaHZZbW9wS1NCN1hHNGdJQ0FnYzJOdmNHVXVkSGx3WlNBOUlDZEJjbkpoZVNjN1hHNWNiaUFnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQnZZbW91YkdWdVozUm9PeUJwSUR3Z2FXdzdJR2tyS3lrZ2UxeHVJQ0FnSUNBZ2MyTnZjR1V1ZG1Gc2RXVWdQU0J2WW1wYmFWMDdYRzRnSUNBZ0lDQnpZMjl3WlM1cGJtUmxlQ0E5SUhOamIzQmxMbXRsZVNBOUlHazdYRzVjYmlBZ0lDQWdJSEpsYzNWc2RDQTlJR05oYkd4aVlXTnJMbU5oYkd3b2RHaHBjeXdnYzJOdmNHVXBPMXh1SUNBZ0lDQWdhV1lnS0hKbGMzVnNkQ0E5UFQwZ1UxUlBVQ2xjYmlBZ0lDQWdJQ0FnWW5KbFlXczdYRzVjYmlBZ0lDQWdJSEpsYzNWc2RITXVjSFZ6YUNoeVpYTjFiSFFwTzF4dUlDQWdJSDFjYmlBZ2ZTQmxiSE5sSUdsbUlDaDBlWEJsYjJZZ2IySnFMbVZ1ZEhKcFpYTWdQVDA5SUNkbWRXNWpkR2x2YmljcElIdGNiaUFnSUNCcFppQW9iMkpxSUdsdWMzUmhibU5sYjJZZ1UyVjBJSHg4SUc5aWFpNWpiMjV6ZEhKMVkzUnZjaTV1WVcxbElEMDlQU0FuVTJWMEp5a2dlMXh1SUNBZ0lDQWdjMk52Y0dVdWRIbHdaU0E5SUNkVFpYUW5PMXh1WEc0Z0lDQWdJQ0JzWlhRZ2FXNWtaWGdnUFNBd08xeHVJQ0FnSUNBZ1ptOXlJQ2hzWlhRZ2FYUmxiU0J2WmlCdlltb3VkbUZzZFdWektDa3BJSHRjYmlBZ0lDQWdJQ0FnYzJOdmNHVXVkbUZzZFdVZ1BTQnBkR1Z0TzF4dUlDQWdJQ0FnSUNCelkyOXdaUzVyWlhrZ1BTQnBkR1Z0TzF4dUlDQWdJQ0FnSUNCelkyOXdaUzVwYm1SbGVDQTlJR2x1WkdWNEt5czdYRzVjYmlBZ0lDQWdJQ0FnY21WemRXeDBJRDBnWTJGc2JHSmhZMnN1WTJGc2JDaDBhR2x6TENCelkyOXdaU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJRk5VVDFBcFhHNGdJQ0FnSUNBZ0lDQWdZbkpsWVdzN1hHNWNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MGN5NXdkWE5vS0hKbGMzVnNkQ2s3WEc0Z0lDQWdJQ0I5WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lITmpiM0JsTG5SNWNHVWdQU0J2WW1vdVkyOXVjM1J5ZFdOMGIzSXVibUZ0WlR0Y2JseHVJQ0FnSUNBZ2JHVjBJR2x1WkdWNElEMGdNRHRjYmlBZ0lDQWdJR1p2Y2lBb2JHVjBJRnNnYTJWNUxDQjJZV3gxWlNCZElHOW1JRzlpYWk1bGJuUnlhV1Z6S0NrcElIdGNiaUFnSUNBZ0lDQWdjMk52Y0dVdWRtRnNkV1VnUFNCMllXeDFaVHRjYmlBZ0lDQWdJQ0FnYzJOdmNHVXVhMlY1SUQwZ2EyVjVPMXh1SUNBZ0lDQWdJQ0J6WTI5d1pTNXBibVJsZUNBOUlHbHVaR1Y0S3lzN1hHNWNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MElEMGdZMkZzYkdKaFkyc3VZMkZzYkNoMGFHbHpMQ0J6WTI5d1pTazdYRzRnSUNBZ0lDQWdJR2xtSUNoeVpYTjFiSFFnUFQwOUlGTlVUMUFwWEc0Z0lDQWdJQ0FnSUNBZ1luSmxZV3M3WEc1Y2JpQWdJQ0FnSUNBZ2NtVnpkV3gwY3k1d2RYTm9LSEpsYzNWc2RDazdYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHbG1JQ2hwYm5OMFlXNWpaVTltS0c5aWFpd2dKMkp2YjJ4bFlXNG5MQ0FuYm5WdFltVnlKeXdnSjJKcFoybHVkQ2NzSUNkbWRXNWpkR2x2YmljcEtWeHVJQ0FnSUNBZ2NtVjBkWEp1TzF4dVhHNGdJQ0FnYzJOdmNHVXVkSGx3WlNBOUlDaHZZbW91WTI5dWMzUnlkV04wYjNJcElEOGdiMkpxTG1OdmJuTjBjblZqZEc5eUxtNWhiV1VnT2lBblQySnFaV04wSnp0Y2JseHVJQ0FnSUd4bGRDQnJaWGx6SUQwZ1QySnFaV04wTG10bGVYTW9iMkpxS1R0Y2JpQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Dd2dhV3dnUFNCclpYbHpMbXhsYm1kMGFEc2dhU0E4SUdsc095QnBLeXNwSUh0Y2JpQWdJQ0FnSUd4bGRDQnJaWGtnSUNBOUlHdGxlWE5iYVYwN1hHNGdJQ0FnSUNCc1pYUWdkbUZzZFdVZ1BTQnZZbXBiYTJWNVhUdGNibHh1SUNBZ0lDQWdjMk52Y0dVdWRtRnNkV1VnUFNCMllXeDFaVHRjYmlBZ0lDQWdJSE5qYjNCbExtdGxlU0E5SUd0bGVUdGNiaUFnSUNBZ0lITmpiM0JsTG1sdVpHVjRJRDBnYVR0Y2JseHVJQ0FnSUNBZ2NtVnpkV3gwSUQwZ1kyRnNiR0poWTJzdVkyRnNiQ2gwYUdsekxDQnpZMjl3WlNrN1hHNGdJQ0FnSUNCcFppQW9jbVZ6ZFd4MElEMDlQU0JUVkU5UUtWeHVJQ0FnSUNBZ0lDQmljbVZoYXp0Y2JseHVJQ0FnSUNBZ2NtVnpkV3gwY3k1d2RYTm9LSEpsYzNWc2RDazdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlISmxjM1ZzZEhNN1hHNTlYRzVjYms5aWFtVmpkQzVrWldacGJtVlFjbTl3WlhKMGFXVnpLRjlwZEdWeVlYUmxMQ0I3WEc0Z0lDZFRWRTlRSnpvZ2UxeHVJQ0FnSUhkeWFYUmhZbXhsT2lBZ0lDQWdabUZzYzJVc1hHNGdJQ0FnWlc1MWJXVnlZV0pzWlRvZ0lDQm1ZV3h6WlN4Y2JpQWdJQ0JqYjI1bWFXZDFjbUZpYkdVNklHWmhiSE5sTEZ4dUlDQWdJSFpoYkhWbE9pQWdJQ0FnSUNBZ1UxUlBVQ3hjYmlBZ2ZTeGNibjBwTzF4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnYVhSbGNtRjBaU0E5SUY5cGRHVnlZWFJsTzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1kyaHBiR1J5Wlc1RWFXWm1aWElvWTJocGJHUnlaVzR4TENCamFHbHNaSEpsYmpJcElIdGNiaUFnYVdZZ0tHTm9hV3hrY21WdU1TQTlQVDBnWTJocGJHUnlaVzR5S1Z4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0JzWlhRZ2NtVnpkV3gwTVNBOUlDZ2hRWEp5WVhrdWFYTkJjbkpoZVNoamFHbHNaSEpsYmpFcEtTQS9JR1JsWVdSaVpXVm1LR05vYVd4a2NtVnVNU2tnT2lCa1pXRmtZbVZsWmlndUxpNWphR2xzWkhKbGJqRXBPMXh1SUNCc1pYUWdjbVZ6ZFd4ME1pQTlJQ2doUVhKeVlYa3VhWE5CY25KaGVTaGphR2xzWkhKbGJqSXBLU0EvSUdSbFlXUmlaV1ZtS0dOb2FXeGtjbVZ1TWlrZ09pQmtaV0ZrWW1WbFppZ3VMaTVqYUdsc1pISmxiaklwTzF4dVhHNGdJSEpsZEhWeWJpQW9jbVZ6ZFd4ME1TQWhQVDBnY21WemRXeDBNaWs3WEc1OVhHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQm1aWFJqYUVSbFpYQlFjbTl3WlhKMGVTaHZZbW9zSUY5clpYa3NJR1JsWm1GMWJIUldZV3gxWlN3Z2JHRnpkRkJoY25RcElIdGNiaUFnYVdZZ0tHOWlhaUE5UFNCdWRXeHNJSHg4SUU5aWFtVmpkQzVwY3loT1lVNHNJRzlpYWlrZ2ZId2dUMkpxWldOMExtbHpLRWx1Wm1sdWFYUjVMQ0J2WW1vcEtWeHVJQ0FnSUhKbGRIVnliaUFvYkdGemRGQmhjblFwSUQ4Z1d5QmtaV1poZFd4MFZtRnNkV1VzSUc1MWJHd2dYU0E2SUdSbFptRjFiSFJXWVd4MVpUdGNibHh1SUNCcFppQW9YMnRsZVNBOVBTQnVkV3hzSUh4OElFOWlhbVZqZEM1cGN5aE9ZVTRzSUY5clpYa3BJSHg4SUU5aWFtVmpkQzVwY3loSmJtWnBibWwwZVN3Z1gydGxlU2twWEc0Z0lDQWdjbVYwZFhKdUlDaHNZWE4wVUdGeWRDa2dQeUJiSUdSbFptRjFiSFJXWVd4MVpTd2diblZzYkNCZElEb2daR1ZtWVhWc2RGWmhiSFZsTzF4dVhHNGdJR3hsZENCd1lYSjBjenRjYmx4dUlDQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaGZhMlY1S1NrZ2UxeHVJQ0FnSUhCaGNuUnpJRDBnWDJ0bGVUdGNiaUFnZlNCbGJITmxJR2xtSUNoMGVYQmxiMllnWDJ0bGVTQTlQVDBnSjNONWJXSnZiQ2NwSUh0Y2JpQWdJQ0J3WVhKMGN5QTlJRnNnWDJ0bGVTQmRPMXh1SUNCOUlHVnNjMlVnZTF4dUlDQWdJR3hsZENCclpYa2dJQ0FnSUNBZ0lDQTlJQ2duSnlBcklGOXJaWGtwTzF4dUlDQWdJR3hsZENCc1lYTjBTVzVrWlhnZ0lDQTlJREE3WEc0Z0lDQWdiR1YwSUd4aGMzUkRkWEp6YjNJZ0lEMGdNRHRjYmx4dUlDQWdJSEJoY25SeklEMGdXMTA3WEc1Y2JpQWdJQ0F2THlCbGMyeHBiblF0WkdsellXSnNaUzF1WlhoMExXeHBibVVnYm04dFkyOXVjM1JoYm5RdFkyOXVaR2wwYVc5dVhHNGdJQ0FnZDJocGJHVWdLSFJ5ZFdVcElIdGNiaUFnSUNBZ0lHeGxkQ0JwYm1SbGVDQTlJR3RsZVM1cGJtUmxlRTltS0NjdUp5d2diR0Z6ZEVsdVpHVjRLVHRjYmlBZ0lDQWdJR2xtSUNocGJtUmxlQ0E4SURBcElIdGNiaUFnSUNBZ0lDQWdjR0Z5ZEhNdWNIVnphQ2hyWlhrdWMzVmljM1J5YVc1bktHeGhjM1JEZFhKemIzSXBLVHRjYmlBZ0lDQWdJQ0FnWW5KbFlXczdYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJR2xtSUNoclpYa3VZMmhoY2tGMEtHbHVaR1Y0SUMwZ01Ta2dQVDA5SUNkY1hGeGNKeWtnZTF4dUlDQWdJQ0FnSUNCc1lYTjBTVzVrWlhnZ1BTQnBibVJsZUNBcklERTdYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1SUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0J3WVhKMGN5NXdkWE5vS0d0bGVTNXpkV0p6ZEhKcGJtY29iR0Z6ZEVOMWNuTnZjaXdnYVc1a1pYZ3BLVHRjYmlBZ0lDQWdJR3hoYzNSRGRYSnpiM0lnUFNCc1lYTjBTVzVrWlhnZ1BTQnBibVJsZUNBcklERTdYRzRnSUNBZ2ZWeHVJQ0I5WEc1Y2JpQWdiR1YwSUhCaGNuUk9JRDBnY0dGeWRITmJjR0Z5ZEhNdWJHVnVaM1JvSUMwZ01WMDdYRzRnSUdsbUlDaHdZWEowY3k1c1pXNW5kR2dnUFQwOUlEQXBYRzRnSUNBZ2NtVjBkWEp1SUNoc1lYTjBVR0Z5ZENrZ1B5QmJJR1JsWm1GMWJIUldZV3gxWlN3Z2NHRnlkRTRnWFNBNklHUmxabUYxYkhSV1lXeDFaVHRjYmx4dUlDQnNaWFFnWTNWeWNtVnVkRlpoYkhWbElEMGdiMkpxTzF4dUlDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0J3WVhKMGN5NXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdiR1YwSUd0bGVTQTlJSEJoY25SelcybGRPMXh1WEc0Z0lDQWdZM1Z5Y21WdWRGWmhiSFZsSUQwZ1kzVnljbVZ1ZEZaaGJIVmxXMnRsZVYwN1hHNGdJQ0FnYVdZZ0tHTjFjbkpsYm5SV1lXeDFaU0E5UFNCdWRXeHNLVnh1SUNBZ0lDQWdjbVYwZFhKdUlDaHNZWE4wVUdGeWRDa2dQeUJiSUdSbFptRjFiSFJXWVd4MVpTd2djR0Z5ZEU0Z1hTQTZJR1JsWm1GMWJIUldZV3gxWlR0Y2JpQWdmVnh1WEc0Z0lISmxkSFZ5YmlBb2JHRnpkRkJoY25RcElEOGdXeUJqZFhKeVpXNTBWbUZzZFdVc0lIQmhjblJPSUYwZ09pQmpkWEp5Wlc1MFZtRnNkV1U3WEc1OVhHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQmlhVzVrVFdWMGFHOWtjeWhmY0hKdmRHOHNJSE5yYVhCUWNtOTBiM01wSUh0Y2JpQWdiR1YwSUhCeWIzUnZJQ0FnSUNBZ0lDQWdJQ0E5SUY5d2NtOTBienRjYmlBZ2JHVjBJR0ZzY21WaFpIbFdhWE5wZEdWa0lDQTlJRzVsZHlCVFpYUW9LVHRjYmx4dUlDQjNhR2xzWlNBb2NISnZkRzhwSUh0Y2JpQWdJQ0JzWlhRZ1pHVnpZM0pwY0hSdmNuTWdQU0JQWW1wbFkzUXVaMlYwVDNkdVVISnZjR1Z5ZEhsRVpYTmpjbWx3ZEc5eWN5aHdjbTkwYnlrN1hHNGdJQ0FnYkdWMElHdGxlWE1nSUNBZ0lDQWdJRDBnVDJKcVpXTjBMbXRsZVhNb1pHVnpZM0pwY0hSdmNuTXBMbU52Ym1OaGRDaFBZbXBsWTNRdVoyVjBUM2R1VUhKdmNHVnlkSGxUZVcxaWIyeHpLR1JsYzJOeWFYQjBiM0p6S1NrN1hHNWNiaUFnSUNCbWIzSWdLR3hsZENCcElEMGdNQ3dnYVd3Z1BTQnJaWGx6TG14bGJtZDBhRHNnYVNBOElHbHNPeUJwS3lzcElIdGNiaUFnSUNBZ0lHeGxkQ0JyWlhrZ1BTQnJaWGx6VzJsZE8xeHVJQ0FnSUNBZ2FXWWdLR3RsZVNBOVBUMGdKMk52Ym5OMGNuVmpkRzl5SnlsY2JpQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdVN1hHNWNiaUFnSUNBZ0lHbG1JQ2hoYkhKbFlXUjVWbWx6YVhSbFpDNW9ZWE1vYTJWNUtTbGNiaUFnSUNBZ0lDQWdZMjl1ZEdsdWRXVTdYRzVjYmlBZ0lDQWdJR0ZzY21WaFpIbFdhWE5wZEdWa0xtRmtaQ2hyWlhrcE8xeHVYRzRnSUNBZ0lDQnNaWFFnZG1Gc2RXVWdQU0J3Y205MGIxdHJaWGxkTzF4dVhHNGdJQ0FnSUNBdkx5QlRhMmx3SUhCeWIzUnZkSGx3WlNCdlppQlBZbXBsWTNSY2JpQWdJQ0FnSUM4dklHVnpiR2x1ZEMxa2FYTmhZbXhsTFc1bGVIUXRiR2x1WlNCdWJ5MXdjbTkwYjNSNWNHVXRZblZwYkhScGJuTmNiaUFnSUNBZ0lHbG1JQ2hQWW1wbFkzUXVjSEp2ZEc5MGVYQmxMbWhoYzA5M2JsQnliM0JsY25SNUtHdGxlU2tnSmlZZ1QySnFaV04wTG5CeWIzUnZkSGx3WlZ0clpYbGRJRDA5UFNCMllXeDFaU2xjYmlBZ0lDQWdJQ0FnWTI5dWRHbHVkV1U3WEc1Y2JpQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ2RtRnNkV1VnSVQwOUlDZG1kVzVqZEdsdmJpY3BYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxPMXh1WEc0Z0lDQWdJQ0IwYUdselcydGxlVjBnUFNCMllXeDFaUzVpYVc1a0tIUm9hWE1wTzF4dUlDQWdJSDFjYmx4dUlDQWdJSEJ5YjNSdklEMGdUMkpxWldOMExtZGxkRkJ5YjNSdmRIbHdaVTltS0hCeWIzUnZLVHRjYmlBZ0lDQnBaaUFvY0hKdmRHOGdQVDA5SUU5aWFtVmpkQzV3Y205MGIzUjVjR1VwWEc0Z0lDQWdJQ0JpY21WaGF6dGNibHh1SUNBZ0lHbG1JQ2h6YTJsd1VISnZkRzl6SUNZbUlITnJhWEJRY205MGIzTXVhVzVrWlhoUFppaHdjbTkwYnlrZ1BqMGdNQ2xjYmlBZ0lDQWdJR0p5WldGck8xeHVJQ0I5WEc1OVhHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnBjMFZ0Y0hSNUtIWmhiSFZsS1NCN1hHNGdJR2xtSUNoMllXeDFaU0E5UFNCdWRXeHNLVnh1SUNBZ0lISmxkSFZ5YmlCMGNuVmxPMXh1WEc0Z0lHbG1JQ2hQWW1wbFkzUXVhWE1vZG1Gc2RXVXNJRWx1Wm1sdWFYUjVLU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0U5aWFtVmpkQzVwY3loMllXeDFaU3dnVG1GT0tTbGNiaUFnSUNCeVpYUjFjbTRnZEhKMVpUdGNibHh1SUNCcFppQW9hVzV6ZEdGdVkyVlBaaWgyWVd4MVpTd2dKM04wY21sdVp5Y3BLVnh1SUNBZ0lISmxkSFZ5YmlBaEtDOWNYRk12S1M1MFpYTjBLSFpoYkhWbEtUdGNiaUFnWld4elpTQnBaaUFvYVc1emRHRnVZMlZQWmloMllXeDFaU3dnSjI1MWJXSmxjaWNwSUNZbUlHbHpSbWx1YVhSbEtIWmhiSFZsS1NsY2JpQWdJQ0J5WlhSMWNtNGdabUZzYzJVN1hHNGdJR1ZzYzJVZ2FXWWdLQ0ZwYm5OMFlXNWpaVTltS0haaGJIVmxMQ0FuWW05dmJHVmhiaWNzSUNkaWFXZHBiblFuTENBblpuVnVZM1JwYjI0bktTQW1KaUJ6YVhwbFQyWW9kbUZzZFdVcElEMDlQU0F3S1Z4dUlDQWdJSEpsZEhWeWJpQjBjblZsTzF4dVhHNGdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR2x6VG05MFJXMXdkSGtvZG1Gc2RXVXBJSHRjYmlBZ2NtVjBkWEp1SUNGcGMwVnRjSFI1TG1OaGJHd29kR2hwY3l3Z2RtRnNkV1VwTzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdabXhoZEhSbGJrRnljbUY1S0haaGJIVmxLU0I3WEc0Z0lHbG1JQ2doUVhKeVlYa3VhWE5CY25KaGVTaDJZV3gxWlNrcFhHNGdJQ0FnY21WMGRYSnVJSFpoYkhWbE8xeHVYRzRnSUd4bGRDQnVaWGRCY25KaGVTQTlJRnRkTzF4dUlDQm1iM0lnS0d4bGRDQnBJRDBnTUN3Z2FXd2dQU0IyWVd4MVpTNXNaVzVuZEdnN0lHa2dQQ0JwYkRzZ2FTc3JLU0I3WEc0Z0lDQWdiR1YwSUdsMFpXMGdQU0IyWVd4MVpWdHBYVHRjYmlBZ0lDQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaHBkR1Z0S1NsY2JpQWdJQ0FnSUc1bGQwRnljbUY1SUQwZ2JtVjNRWEp5WVhrdVkyOXVZMkYwS0dac1lYUjBaVzVCY25KaGVTaHBkR1Z0S1NrN1hHNGdJQ0FnWld4elpWeHVJQ0FnSUNBZ2JtVjNRWEp5WVhrdWNIVnphQ2hwZEdWdEtUdGNiaUFnZlZ4dVhHNGdJSEpsZEhWeWJpQnVaWGRCY25KaGVUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdselZtRnNhV1JEYUdsc1pDaGphR2xzWkNrZ2UxeHVJQ0JwWmlBb1kyaHBiR1FnUFQwZ2JuVnNiQ2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdhV1lnS0hSNWNHVnZaaUJqYUdsc1pDQTlQVDBnSjJKdmIyeGxZVzRuS1Z4dUlDQWdJSEpsZEhWeWJpQm1ZV3h6WlR0Y2JseHVJQ0JwWmlBb1QySnFaV04wTG1sektHTm9hV3hrTENCSmJtWnBibWwwZVNrcFhHNGdJQ0FnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaFBZbXBsWTNRdWFYTW9ZMmhwYkdRc0lFNWhUaWtwWEc0Z0lDQWdjbVYwZFhKdUlHWmhiSE5sTzF4dVhHNGdJSEpsZEhWeWJpQjBjblZsTzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdhWE5KZEdWeVlXSnNaVU5vYVd4a0tHTm9hV3hrS1NCN1hHNGdJR2xtSUNoamFHbHNaQ0E5UFNCdWRXeHNJSHg4SUU5aWFtVmpkQzVwY3loamFHbHNaQ3dnVG1GT0tTQjhmQ0JQWW1wbFkzUXVhWE1vWTJocGJHUXNJRWx1Wm1sdWFYUjVLU2xjYmlBZ0lDQnlaWFIxY200Z1ptRnNjMlU3WEc1Y2JpQWdjbVYwZFhKdUlDaEJjbkpoZVM1cGMwRnljbUY1S0dOb2FXeGtLU0I4ZkNCMGVYQmxiMllnWTJocGJHUWdQVDA5SUNkdlltcGxZM1FuSUNZbUlDRnBibk4wWVc1alpVOW1LR05vYVd4a0xDQW5ZbTl2YkdWaGJpY3NJQ2R1ZFcxaVpYSW5MQ0FuYzNSeWFXNW5KeWtwTzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdibTkzS0NrZ2UxeHVJQ0JwWmlBb2RIbHdaVzltSUhCbGNtWnZjbTFoYm1ObElDRTlQU0FuZFc1a1pXWnBibVZrSnlBbUppQjBlWEJsYjJZZ2NHVnlabTl5YldGdVkyVXVibTkzSUQwOVBTQW5ablZ1WTNScGIyNG5LVnh1SUNBZ0lISmxkSFZ5YmlCd1pYSm1iM0p0WVc1alpTNXViM2NvS1R0Y2JpQWdaV3h6WlZ4dUlDQWdJSEpsZEhWeWJpQkVZWFJsTG01dmR5Z3BPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1oyVnVaWEpoZEdWVlZVbEVLQ2tnZTF4dUlDQnBaaUFvZFhWcFpDQStJRGs1T1RrNU9Ua3BYRzRnSUNBZ2RYVnBaQ0E5SURFd01EQXdNREE3WEc1Y2JpQWdjbVYwZFhKdUlHQWtlMFJoZEdVdWJtOTNLQ2w5TGlSN2RYVnBaQ3NyZlNSN1RXRjBhQzV5YjNWdVpDaE5ZWFJvTG5KaGJtUnZiU2dwSUNvZ01UQXdNREF3TURBcExuUnZVM1J5YVc1bktDa3VjR0ZrVTNSaGNuUW9NakFzSUNjd0p5bDlZRHRjYm4xY2JpSXNJaTh2SUZSb1pTQnRiMlIxYkdVZ1kyRmphR1ZjYm5aaGNpQmZYM2RsWW5CaFkydGZiVzlrZFd4bFgyTmhZMmhsWDE4Z1BTQjdmVHRjYmx4dUx5OGdWR2hsSUhKbGNYVnBjbVVnWm5WdVkzUnBiMjVjYm1aMWJtTjBhVzl1SUY5ZmQyVmljR0ZqYTE5eVpYRjFhWEpsWDE4b2JXOWtkV3hsU1dRcElIdGNibHgwTHk4Z1EyaGxZMnNnYVdZZ2JXOWtkV3hsSUdseklHbHVJR05oWTJobFhHNWNkSFpoY2lCallXTm9aV1JOYjJSMWJHVWdQU0JmWDNkbFluQmhZMnRmYlc5a2RXeGxYMk5oWTJobFgxOWJiVzlrZFd4bFNXUmRPMXh1WEhScFppQW9ZMkZqYUdWa1RXOWtkV3hsSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmx4MFhIUnlaWFIxY200Z1kyRmphR1ZrVFc5a2RXeGxMbVY0Y0c5eWRITTdYRzVjZEgxY2JseDBMeThnUTNKbFlYUmxJR0VnYm1WM0lHMXZaSFZzWlNBb1lXNWtJSEIxZENCcGRDQnBiblJ2SUhSb1pTQmpZV05vWlNsY2JseDBkbUZ5SUcxdlpIVnNaU0E5SUY5ZmQyVmljR0ZqYTE5dGIyUjFiR1ZmWTJGamFHVmZYMXR0YjJSMWJHVkpaRjBnUFNCN1hHNWNkRngwTHk4Z2JtOGdiVzlrZFd4bExtbGtJRzVsWldSbFpGeHVYSFJjZEM4dklHNXZJRzF2WkhWc1pTNXNiMkZrWldRZ2JtVmxaR1ZrWEc1Y2RGeDBaWGh3YjNKMGN6b2dlMzFjYmx4MGZUdGNibHh1WEhRdkx5QkZlR1ZqZFhSbElIUm9aU0J0YjJSMWJHVWdablZ1WTNScGIyNWNibHgwWDE5M1pXSndZV05yWDIxdlpIVnNaWE5mWDF0dGIyUjFiR1ZKWkYwdVkyRnNiQ2h0YjJSMWJHVXVaWGh3YjNKMGN5d2diVzlrZFd4bExDQnRiMlIxYkdVdVpYaHdiM0owY3l3Z1gxOTNaV0p3WVdOclgzSmxjWFZwY21WZlh5azdYRzVjYmx4MEx5OGdVbVYwZFhKdUlIUm9aU0JsZUhCdmNuUnpJRzltSUhSb1pTQnRiMlIxYkdWY2JseDBjbVYwZFhKdUlHMXZaSFZzWlM1bGVIQnZjblJ6TzF4dWZWeHVYRzRpTENJdkx5QmtaV1pwYm1VZ1oyVjBkR1Z5SUdaMWJtTjBhVzl1Y3lCbWIzSWdhR0Z5Ylc5dWVTQmxlSEJ2Y25SelhHNWZYM2RsWW5CaFkydGZjbVZ4ZFdseVpWOWZMbVFnUFNBb1pYaHdiM0owY3l3Z1pHVm1hVzVwZEdsdmJpa2dQVDRnZTF4dVhIUm1iM0lvZG1GeUlHdGxlU0JwYmlCa1pXWnBibWwwYVc5dUtTQjdYRzVjZEZ4MGFXWW9YMTkzWldKd1lXTnJYM0psY1hWcGNtVmZYeTV2S0dSbFptbHVhWFJwYjI0c0lHdGxlU2tnSmlZZ0lWOWZkMlZpY0dGamExOXlaWEYxYVhKbFgxOHVieWhsZUhCdmNuUnpMQ0JyWlhrcEtTQjdYRzVjZEZ4MFhIUlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvWlhod2IzSjBjeXdnYTJWNUxDQjdJR1Z1ZFcxbGNtRmliR1U2SUhSeWRXVXNJR2RsZERvZ1pHVm1hVzVwZEdsdmJsdHJaWGxkSUgwcE8xeHVYSFJjZEgxY2JseDBmVnh1ZlRzaUxDSmZYM2RsWW5CaFkydGZjbVZ4ZFdseVpWOWZMbWNnUFNBb1puVnVZM1JwYjI0b0tTQjdYRzVjZEdsbUlDaDBlWEJsYjJZZ1oyeHZZbUZzVkdocGN5QTlQVDBnSjI5aWFtVmpkQ2NwSUhKbGRIVnliaUJuYkc5aVlXeFVhR2x6TzF4dVhIUjBjbmtnZTF4dVhIUmNkSEpsZEhWeWJpQjBhR2x6SUh4OElHNWxkeUJHZFc1amRHbHZiaWduY21WMGRYSnVJSFJvYVhNbktTZ3BPMXh1WEhSOUlHTmhkR05vSUNobEtTQjdYRzVjZEZ4MGFXWWdLSFI1Y0dWdlppQjNhVzVrYjNjZ1BUMDlJQ2R2WW1wbFkzUW5LU0J5WlhSMWNtNGdkMmx1Wkc5M08xeHVYSFI5WEc1OUtTZ3BPeUlzSWw5ZmQyVmljR0ZqYTE5eVpYRjFhWEpsWDE4dWJ5QTlJQ2h2WW1vc0lIQnliM0FwSUQwK0lDaFBZbXBsWTNRdWNISnZkRzkwZVhCbExtaGhjMDkzYmxCeWIzQmxjblI1TG1OaGJHd29iMkpxTENCd2NtOXdLU2tpTENJdkx5QmtaV1pwYm1VZ1gxOWxjMDF2WkhWc1pTQnZiaUJsZUhCdmNuUnpYRzVmWDNkbFluQmhZMnRmY21WeGRXbHlaVjlmTG5JZ1BTQW9aWGh3YjNKMGN5a2dQVDRnZTF4dVhIUnBaaWgwZVhCbGIyWWdVM2x0WW05c0lDRTlQU0FuZFc1a1pXWnBibVZrSnlBbUppQlRlVzFpYjJ3dWRHOVRkSEpwYm1kVVlXY3BJSHRjYmx4MFhIUlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvWlhod2IzSjBjeXdnVTNsdFltOXNMblJ2VTNSeWFXNW5WR0ZuTENCN0lIWmhiSFZsT2lBblRXOWtkV3hsSnlCOUtUdGNibHgwZlZ4dVhIUlBZbXBsWTNRdVpHVm1hVzVsVUhKdmNHVnlkSGtvWlhod2IzSjBjeXdnSjE5ZlpYTk5iMlIxYkdVbkxDQjdJSFpoYkhWbE9pQjBjblZsSUgwcE8xeHVmVHNpTENKcGJYQnZjblFnZTF4dUlDQktTVUpmUWtGU1VrVk9MRnh1SUNCS1NVSmZVRkpQV0Zrc1hHNGdJRXBKUWw5U1FWZGZWRVZZVkN4Y2JpQWdTa2xDTEZ4dUlDQktTVUpmUTBoSlRFUmZTVTVFUlZoZlVGSlBVQ3hjYmlBZ1NtbGlMRnh1SUNCbVlXTjBiM0o1TEZ4dUlDQWtMRnh1SUNCcGMwcHBZbWx6YUN4Y2JpQWdZMjl1YzNSeWRXTjBTbWxpTEZ4dUlDQnlaWE52YkhabFEyaHBiR1J5Wlc0c1hHNTlJR1p5YjIwZ0p5NHZhbWxpTG1wekp6dGNibHh1Wlhod2IzSjBJR052Ym5OMElFcHBZbk1nUFNCN1hHNGdJRXBKUWw5Q1FWSlNSVTRzWEc0Z0lFcEpRbDlRVWs5WVdTeGNiaUFnU2tsQ1gxSkJWMTlVUlZoVUxGeHVJQ0JLU1VJc1hHNGdJRXBKUWw5RFNFbE1SRjlKVGtSRldGOVFVazlRTEZ4dUlDQkthV0lzWEc0Z0lHbHpTbWxpYVhOb0xGeHVJQ0JqYjI1emRISjFZM1JLYVdJc1hHNGdJSEpsYzI5c2RtVkRhR2xzWkhKbGJpeGNibjA3WEc1Y2JtbHRjRzl5ZENCN1hHNGdJRlZRUkVGVVJWOUZWa1ZPVkN4Y2JpQWdVVlZGVlVWZlZWQkVRVlJGWDAxRlZFaFBSQ3hjYmlBZ1JreFZVMGhmVlZCRVFWUkZYMDFGVkVoUFJDeGNiaUFnU1U1SlZGOU5SVlJJVDBRc1hHNGdJRk5MU1ZCZlUxUkJWRVZmVlZCRVFWUkZVeXhjYmlBZ1VFVk9SRWxPUjE5VFZFRlVSVjlWVUVSQlZFVXNYRzRnSUV4QlUxUmZVa1ZPUkVWU1gxUkpUVVVzWEc0Z0lGQlNSVlpKVDFWVFgxTlVRVlJGTEZ4dVhHNGdJRU52YlhCdmJtVnVkQ3hjYmlBZ1ZHVnliU3hjYm4wZ1puSnZiU0FuTGk5amIyMXdiMjVsYm5RdWFuTW5PMXh1WEc1bGVIQnZjblFnWTI5dWMzUWdRMjl0Y0c5dVpXNTBjeUE5SUh0Y2JpQWdWVkJFUVZSRlgwVldSVTVVTEZ4dUlDQlJWVVZWUlY5VlVFUkJWRVZmVFVWVVNFOUVMRnh1SUNCR1RGVlRTRjlWVUVSQlZFVmZUVVZVU0U5RUxGeHVJQ0JKVGtsVVgwMUZWRWhQUkN4Y2JpQWdVMHRKVUY5VFZFRlVSVjlWVUVSQlZFVlRMRnh1SUNCUVJVNUVTVTVIWDFOVVFWUkZYMVZRUkVGVVJTeGNiaUFnVEVGVFZGOVNSVTVFUlZKZlZFbE5SU3hjYmlBZ1VGSkZWa2xQVlZOZlUxUkJWRVVzWEc1OU8xeHVYRzVwYlhCdmNuUWdlMXh1SUNCR1QxSkRSVjlTUlVaTVQxY3NYRzRnSUZKdmIzUk9iMlJsTEZ4dUlDQlNaVzVrWlhKbGNpeGNibjBnWm5KdmJTQW5MaTl5Wlc1a1pYSmxjbk12YVc1a1pYZ3Vhbk1uTzF4dVhHNWxlSEJ2Y25RZ1kyOXVjM1FnVW1WdVpHVnlaWEp6SUQwZ2UxeHVJQ0JEVDA1VVJWaFVYMGxFT2lCU2IyOTBUbTlrWlM1RFQwNVVSVmhVWDBsRUxGeHVJQ0JHVDFKRFJWOVNSVVpNVDFjc1hHNGdJRkp2YjNST2IyUmxMRnh1SUNCU1pXNWtaWEpsY2l4Y2JuMDdYRzVjYm1WNGNHOXlkQ0FxSUdGeklGVjBhV3h6SUdaeWIyMGdKeTR2ZFhScGJITXVhbk1uTzF4dVpYaHdiM0owSUhzZ1pHVm1ZWFZzZENCaGN5QmtaV0ZrWW1WbFppQjlJR1p5YjIwZ0oyUmxZV1JpWldWbUp6dGNibHh1Wlhod2IzSjBJSHRjYmlBZ1ptRmpkRzl5ZVN4Y2JpQWdKQ3hjYmlBZ1EyOXRjRzl1Wlc1MExGeHVJQ0JVWlhKdExGeHVmVHRjYmlKZExDSnVZVzFsY3lJNlcxMHNJbk52ZFhKalpWSnZiM1FpT2lJaWZRPT0iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImV4cG9ydCB7IERPTVJlbmRlcmVyIH0gZnJvbSAnLi9kb20tcmVuZGVyZXIuanMnO1xuZXhwb3J0ICogZnJvbSAnamlicyc7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=