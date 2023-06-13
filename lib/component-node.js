import {
  Jibs,
  Components,
  Renderers,
  Utils,
} from 'jibs';

const {
  JIB_PROXY,
  JIB_CHILD_INDEX_PROP,
} = Jibs;

const {
  CONTEXT_ID,
  RootNode,
} = Renderers;

const {
  INIT_METHOD,
  UPDATE_EVENT,
  PENDING_STATE_UPDATE,
  LAST_RENDER_TIME,
  SKIP_STATE_UPDATES,
} = Components;

export class ComponentNode extends RootNode {
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
      this.component[LAST_RENDER_TIME] = Utils.now();

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
        this.component[LAST_RENDER_TIME] = Utils.now();

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
      if (Utils.instanceOf(renderResult, 'promise')) {
        let waitingRenderResult = this.component.renderWaiting(this.cachedRenderResult);
        let renderCompleted = false;

        let loadingTimer = setTimeout(async () => {
          loadingTimer = null;

          if (Utils.instanceOf(waitingRenderResult, 'promise'))
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
