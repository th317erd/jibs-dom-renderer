import {
  Jibs,
  Renderers,
  Utils,
} from 'jibs';

const {
  isJibish,
  constructJib,
  JIB_PROXY,
} = Jibs;

import deadbeef from 'deadbeef';

const {
  RootNode,
} = Renderers;

const TEXT_TYPE     = Symbol.for('@jib/textNode');
const FRAGMENT_TYPE = Symbol.for('@jib/fragmentNode');

export class FragmentNode extends RootNode {
  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      '_nodeCache': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        new Map(),
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

  async syncElementsWithRenderer(node, renderResult, renderStartTime) {
    if (!this.parent || renderStartTime < this.renderStartTime || this.renderPromise)
      return;

    if (!this._nodeCache)
      return await this.parent.syncElementsWithRenderer(node, renderResult, renderStartTime);

    let renderResults = [];
    for (let [ cacheKey, cachedResult ] of this._nodeCache) {
      if (cachedResult.node === node) {
        this._nodeCache.set(cacheKey, { ...cachedResult, renderResult });
        renderResults.push(renderResult);
      } else {
        renderResults.push(cachedResult.renderResult);
      }
    }

    return await this.parent.syncElementsWithRenderer(node, renderResults, renderStartTime);
  }

  async _render(_children, renderContext) {
    let indexMap        = new Map();
    let children        = _children;
    let renderStartTime = Date.now();

    if (Utils.instanceOf(children, 'promise'))
      children = await children;

    if (this.destroying || renderStartTime < this.renderStartTime)
      return;

    if (!this.isIterableChild(children) && (isJibish(children) || this.isValidChild(children)))
      children = [ children ];

    const getIndexForType = (Type) => {
      let index = (indexMap.get(Type) || 0) + 1;
      indexMap.set(Type, index);

      return index;
    };

    let loopStopped = false;
    let promises = Utils.iterate(children, ({ value: _child, key, index, STOP }) => {
      if (loopStopped || this.destroying || renderStartTime < this.renderStartTime)
        return STOP;

      return (async () => {
        let child = (Utils.instanceOf(_child, 'promise')) ? await _child : _child;
        let created;
        let cacheKey;
        let node;
        let renderResult;

        if (isJibish(child)) {
          let jib = constructJib(child);
          if (Utils.instanceOf(jib, 'promise'))
            jib = await jib;

          if (this.destroying || renderStartTime < this.renderStartTime) {
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

          cacheKey = deadbeef(Type, localKey);

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
          if (Utils.isEmpty(child))
            return;

          cacheKey = deadbeef(`@jib/internal_fragment_${getIndexForType(FRAGMENT_TYPE)}`);

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
          cacheKey = deadbeef(`@jib/internal_text_${getIndexForType(TEXT_TYPE)}`);

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
    if (this.destroying || renderStartTime < this.renderStartTime) {
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

    return renderResults.map((renderResult) => renderResult.renderResult).filter((result) => (result != null && !Object.is(result, NaN) && !Object.is(result, Infinity)));
  }
}
