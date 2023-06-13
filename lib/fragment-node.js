import {
  Jibs,
  Renderers,
  Utils,
  deadbeef,
} from 'jibs';

const {
  isJibish,
  constructJib,
  JIB_PROXY,
  JIB_RAW_TEXT,
  JIB_CHILD_INDEX_PROP,
} = Jibs;

const {
  RootNode,
} = Renderers;

export class FragmentNode extends RootNode {
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 11;

  getThisNodeOrChildNodes() {
    return this.getChildrenNodes();
  }

  async _render() {
    let indexMap    = new Map();
    let renderFrame = this.renderFrame;

    let { children } = (this.jib || {});
    if (Utils.instanceOf(children, 'promise'))
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
    let promises = Utils.iterate(children, ({ value: _child, key, index, STOP }) => {
      if (loopStopped || this.destroying || renderFrame < this.renderFrame)
        return STOP;

      return (async () => {
        let child = (Utils.instanceOf(_child, 'promise')) ? await _child : _child;
        if (Utils.isEmpty(child) || Object.is(child, NaN) || Object.is(child, Infinity))
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
          if (Utils.instanceOf(jib, 'promise'))
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

        let cacheKey = deadbeef(Type, props.key);
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
