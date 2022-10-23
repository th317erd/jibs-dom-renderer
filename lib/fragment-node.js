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

      const processChild = (index, key, child) => {
        let cacheKey;

        if (isJibish(child)) {
          return Utils.awaitOn(constructJib(child), (jib) => {
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

            childrenAdded.set(cacheKey, node);

            if (Type === JIB_PROXY)
              return node.render(jib.children);
            else
              return node.render(jib);
          });
        } else if (this.isIterableChild(child)) {
          cacheKey = deadbeef(`@jib/internal_fragment_${getIndexForType(FRAGMENT_TYPE)}`);

          let fragmentNode = this._nodeCache.get(cacheKey);
          if (!fragmentNode)
            fragmentNode = this.renderer.constructNodeFromJib(JIB_PROXY, this.parent, this.context);

          childrenAdded.set(cacheKey, fragmentNode);

          return fragmentNode.render(children);
        } else if (this.isValidChild(child)) {
          child = (typeof child.valueOf === 'function') ? child.valueOf() : child;
          cacheKey = deadbeef(`@jib/internal_text_${getIndexForType(TEXT_TYPE)}`);

          let textNode = this._nodeCache.get(cacheKey);
          if (!textNode)
            textNode = new this.renderer.constructor.TextNode(this.renderer, this.parent, this.context);

          childrenAdded.set(cacheKey, textNode);

          return textNode.render(child);
        }
      }

      const processNextChild = (index) => {
        if (index >= childKeys.length)
          return childrenAdded;

        let key   = childKeys[index];
        let child = (isMapOrSet) ? children.get(key) : children[key]

        return Utils.awaitOn(processChild(index, key, child), () => {
          return processNextChild(index + 1);
        });
      };

      let isMapOrSet    = Utils.instanceOf(children, 'set', 'map');
      let childKeys     = (isMapOrSet) ? Array.from(children.keys()) : Object.keys(children);
      let childrenAdded = new Map();

      return processNextChild(0);
    };

    const finalizeChildren = (renderResults) => {
      // Cleanup
      for (let [ cacheKey, node ] of this._nodeCache) {
        let newChild = (renderResults) ? renderResults.get(cacheKey) : null;
        if (!newChild) {
          // This node was destroyed
          node.destroy();
        }
      }

      this._nodeCache = (renderResults) ? renderResults : new Map();

      return renderResults;
    };

    const iterateChildren = (children) => {
      let renderResults;

      if (this.isIterableChild(children))
        renderResults = renderNewChildren(children);
      else if (isJibish(children) || this.isValidChild(children))
        renderResults = renderNewChildren([ children ]);

      return Utils.awaitOn(renderResults, finalizeChildren);
    };

    return Utils.awaitOn(children, iterateChildren);
  }
}

