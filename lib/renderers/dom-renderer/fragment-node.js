'use strict';

const {
  Jibs,
  Renderers,
  Utils,
} = require('jibs');

const {
  isJibish,
  constructJib,
  JIB_PROXY,
} = Jibs;

const deadbeef = require('deadbeef');

const {
  RootNode,
} = Renderers;

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
    });
  }

  destroy() {
    if (!this._nodeCache)
      return;

    for (let node of this._nodeCache.values())
      node.destroy();

    this._nodeCache.clear();
    this._nodeCache = null;

    super.destroy();
  }

  render(children) {
    const renderNewChildren = (children) => {
      let indexMap = new Map();

      const getIndexForType = (Type) => {
        let index = (indexMap.get(Type) || 0) + 1;
        indexMap.set(Type, index);

        return index;
      };

      let childrenAdded = new Map();
      Utils.iterate(children, ({ index, key, value: _child }) => {
        let cacheKey;
        let child = _child;

        if (isJibish(child)) {
          let jib = constructJib(child);
          let { Type, props } = jib;
          if (!props)
            props = {};

          let localKey;
          if (index !== key)
            localKey = key;
          else
            localKey = (props.key == null || Object.is(props.key, NaN) || Object.is(props.key, Infinity)) ? `@jib/internal_key_${getIndexForType(Type)}` : props.key;

          cacheKey = deadbeef(Type, localKey);

          let node = this._nodeCache.get(cacheKey);
          if (!node)
            node = this.renderer.constructNodeFromJib(jib, this.parent, this.context);

          if (Type === JIB_PROXY)
            node.render(jib.children);
          else
            node.render(jib);

          childrenAdded.set(cacheKey, node);
        } else if (this.isIterableChild(child)) {
          cacheKey = deadbeef(`@jib/internal_fragment_${getIndexForType(FRAGMENT_TYPE)}`);

          let fragmentNode = this._nodeCache.get(cacheKey);
          if (!fragmentNode)
            fragmentNode = this.renderer.constructNodeFromJib(JIB_PROXY, this.parent, this.context);

          fragmentNode.render(children);

          childrenAdded.set(cacheKey, fragmentNode);
        } else if (this.isValidChild(child)) {
          child = (typeof child.valueOf === 'function') ? child.valueOf() : child;
          cacheKey = deadbeef(`@jib/internal_text_${getIndexForType(TEXT_TYPE)}`);

          let textNode = this._nodeCache.get(cacheKey);
          if (!textNode)
            textNode = new this.renderer.constructor.TextNode(this.renderer, this.parent, this.context);

          textNode.render(child);

          childrenAdded.set(cacheKey, textNode);
        }
      });

      return childrenAdded;
    };

    let result;
    if (this.isIterableChild(children))
      result = renderNewChildren(children);
    else if (isJibish(children) || this.isValidChild(children))
      result = renderNewChildren([ children ]);

    // Cleanup
    for (let [ cacheKey, node ] of this._nodeCache) {
      let newChild = (result) ? result.get(cacheKey) : null;
      if (!newChild) {
        // This node was destroyed
        node.destroy();
      }
    }

    this._nodeCache = (result) ? result : new Map();
  }
}

module.exports = {
  FragmentNode,
};
