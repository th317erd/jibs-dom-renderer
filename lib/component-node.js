import {
  Jibs,
  Components,
  Renderers,
  Utils,
} from 'jibs';

const {
  JIB_PROXY,
  resolveChildren,
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

      this.component[LAST_RENDER_TIME] = Utils.now();

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
        if (Utils.instanceOf(renderResult, 'promise')) {
          let waitingRenderResult = this.component.renderWaiting(this._cachedRenderResult);
          let renderCompleted = false;

          let loadingTimer = setTimeout(async () => {
            loadingTimer = null;

            if (Utils.instanceOf(waitingRenderResult, 'promise'))
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
