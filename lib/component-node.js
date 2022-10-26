import {
  Jibs,
  Components,
  Renderers,
} from 'jibs';

const {
  JIB_PROXY,
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
      '_cachedRenderResult': {
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
      '_isRendering': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        false,
      },
      '_contextUpdatePromise': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  createComponentProps(parentProps) {
    let props = Object.create(parentProps || null);

    Object.defineProperties(props, {
      'ref': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        undefined,
      },
      'key': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        undefined,
      },
    });

    return props;
  }

  firePropUpdates(_newProps, _oldProps) {
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
      this._previousState = Object.assign({}, component.state);
      let assignProps = this.createComponentProps(newProps);

      this.firePropUpdates(newProps, assignProps);
      component.props = assignProps;

      return true;
    }

    if (this.childrenDiffer(component.children, newChildren)) {
      this._previousState = Object.assign({}, component.state);
      let assignProps = this.createComponentProps(newProps);

      this.firePropUpdates(newProps, assignProps);
      component.props = assignProps;

      return true;
    }

    let previousState = this._previousState || {};
    let propsDiffer   = this.propsDiffer(component.props, newProps, [ 'ref', 'key' ]);
    if (propsDiffer && component.shouldUpdate(newProps, previousState)) {
      this._previousState = Object.assign({}, component.state);
      let assignProps = this.createComponentProps(newProps);

      this.firePropUpdates(newProps, assignProps);
      component.props = assignProps;

      return true;
    }

    let stateDiffers = this.propsDiffer(previousState, component.state);
    if (stateDiffers && component.shouldUpdate(newProps, previousState)) {
      this._previousState = Object.assign({}, component.state);
      return true;
    }

    return false;
  }

  destroy() {
    if (this.component) {
      if (this._currentJib && typeof this._currentJib.props.ref === 'function')
        this._currentJib.props.ref.call(this.component, null);

      this.component.destroy();
      this.component = null;
    }

    if (this.rootNode) {
      this.rootNode.destroy();
      this.rootNode = null;
    }

    this._cachedRenderResult = null;
    this._previousState = null;
    this._currentJib = null;

    super.destroy();
  }

  onContextUpdate() {
    if (!this.component || this.component[SKIP_STATE_UPDATES] || this.component[PENDING_STATE_UPDATE])
      return Promise.resolve();

    if (this._contextUpdatePromise)
      return this._contextUpdatePromise;

    this._contextUpdatePromise = Promise.resolve().then(() => {
      this._contextUpdatePromise = null;

      if (this._isRendering)
        return this._cachedRenderResult;

      if (!this._currentJib)
        return this._cachedRenderResult;

      return this.render(this._currentJib);
    });
  }

  render(jib) {
    this._isRendering = true;

    let didRender = false;
    let renderResult;

    if (jib !== this._currentJib)
      this._currentJib = jib;

    try {
      if (!this.shouldRender(jib.props, jib.children)) {
        renderResult = this._cachedRenderResult;
      } else {
        let component = this.component;
        if (!component) {
          let { Type: ComponentClass, props } = jib;

          component = this.component = new ComponentClass({ ...jib, props: this.createComponentProps(props), context: this.context });
          if (typeof component[INIT_METHOD] === 'function')
            component[INIT_METHOD]();

          component.on(UPDATE_EVENT, () => {
            this.render(this._currentJib);
          });

          if (props && typeof props.ref === 'function')
            props.ref.call(component, component);
        }

        // Cancel any pending state updates
        if (this.component[PENDING_STATE_UPDATE])
          this.component[PENDING_STATE_UPDATE] = null;

        renderResult = this.component.render(jib.children);
        this.component[LAST_RENDER_TIME] = Date.now();

        didRender = true;
      }
    } catch (error) {
      try {
        if (this.component)
          renderResult = this.component.renderErrorState(error);
        else
          renderResult = [ `${error.message}\n${error.stack}` ];
      } catch (error2) {
        renderResult = [ `${error.message}\n${error.stack}` ];
      }

      didRender = true;
    }

    if (renderResult !== this._cachedRenderResult)
      this._cachedRenderResult = renderResult;

    let rootNode = this.rootNode;
    if (!rootNode)
      rootNode = this.rootNode = this.renderer.constructNodeFromJib(JIB_PROXY, this.parent, this.context);

    rootNode.render(renderResult);

    if (didRender && this.component) {
      try {
        this.component.updated();
      } catch (error) {
        console.error('Error in "updated" call: ', error);
      }
    }

    this._isRendering = false;
  }
}
