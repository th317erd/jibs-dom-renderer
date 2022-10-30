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
    if (!this._nodeCache)
      return;

    let destroyPromises = [];

    for (let node of this._nodeCache.values())
      destroyPromises.push(node.destroy());

    await Promise.all(destroyPromises);

    this._nodeCache.clear();
    this._nodeCache = null;

    return await super.destroy();
  }

  async _render(_children, renderContext) {
    let indexMap      = new Map();
    let childrenAdded = new Map();
    let children      = _children;

    if (Utils.instanceOf(children, 'promise'))
      children = await children;

    if (!this.isIterableChild(children) && (isJibish(children) || this.isValidChild(children)))
      children = [ children ];

    const getIndexForType = (Type) => {
      let index = (indexMap.get(Type) || 0) + 1;
      indexMap.set(Type, index);

      return index;
    };

    await Utils.iterateAsync(children, async ({ value: _child, key, index }) => {
      let child = (Utils.instanceOf(_child, 'promise')) ? await _child : _child;
      let cacheKey;

      if (isJibish(child)) {
        let jib = await constructJib(child);
        let { Type, props } = jib;
        if (!props)
          props = {};

        let localKey;
        if (index !== key) // Index is an integer, and key is a string, meaning this is an object
          localKey = key;
        else
          localKey = (props.key == null || Object.is(props.key, NaN) || Object.is(props.key, Infinity)) ? `@jib/internal_key_${getIndexForType(Type)}` : props.key;

        cacheKey = deadbeef(Type, localKey);

        let node = this._nodeCache.get(cacheKey);
        if (!node)
          node = this.renderer.constructNodeFromJib(jib, this.parent, this.context);

        childrenAdded.set(cacheKey, node);

        if (Type === JIB_PROXY)
          return await node.render(jib.children, renderContext);
        else
          return await node.render(jib, renderContext);
      } else if (this.isIterableChild(child)) {
        if (Utils.isEmpty(child))
          return;

        cacheKey = deadbeef(`@jib/internal_fragment_${getIndexForType(FRAGMENT_TYPE)}`);

        let fragmentNode = this._nodeCache.get(cacheKey);
        if (!fragmentNode)
          fragmentNode = this.renderer.constructNodeFromJib(JIB_PROXY, this.parent, this.context);

        childrenAdded.set(cacheKey, fragmentNode);

        return await fragmentNode.render(child, renderContext);
      } else if (this.isValidChild(child)) {
        child = (typeof child.valueOf === 'function') ? child.valueOf() : child;
        cacheKey = deadbeef(`@jib/internal_text_${getIndexForType(TEXT_TYPE)}`);

        let textNode = this._nodeCache.get(cacheKey);
        if (!textNode)
          textNode = new this.renderer.constructor.TextNode(this.renderer, this.parent, this.context);

        childrenAdded.set(cacheKey, textNode);

        return await textNode.render(child, renderContext);
      }
    });

    let destroyPromises = [];

    // Cleanup
    for (let [ cacheKey, node ] of this._nodeCache) {
      let newChild = (childrenAdded) ? childrenAdded.get(cacheKey) : null;
      if (!newChild) {
        // This node was destroyed
        destroyPromises.push(node.destroy());
      }
    }

    if (destroyPromises.length > 0)
      await Promise.all(destroyPromises);

    this._nodeCache = childrenAdded;

    return childrenAdded;
  }
}

