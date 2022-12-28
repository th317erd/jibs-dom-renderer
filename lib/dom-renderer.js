import {
  Jibs,
  Renderers,
} from 'jibs';

import { FragmentNode }  from './fragment-node.js';
import { TextNode }      from './text-node.js';
import { NativeNode }    from './native-node.js';
import { PortalNode }    from './portal-node.js';
import { ComponentNode } from './component-node.js';

const { Renderer } = Renderers;

const {
  JIB_PROXY,
} = Jibs;

export class DOMRenderer extends Renderer {
  static FragmentNode = FragmentNode;

  static TextNode = TextNode;

  static NativeNode = NativeNode;

  static PortalNode = PortalNode;

  static ComponentNode = ComponentNode;

  constructor(rootElement) {
    super();

    Object.defineProperties(this, {
      'rootElement': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        rootElement,
      },
      'rootNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  isPortalNode(type) {
    return (/[^a-zA-Z0-9:]/).test(type);
  }

  constructNodeFromJib(jib, parent, context) {
    if (jib === JIB_PROXY)
      return new this.constructor.FragmentNode(this, parent, context);

    let { Type } = jib;
    if (typeof Type === 'function') {
      return new this.constructor.ComponentNode(this, parent, context);
    } else if (typeof Type === 'string') {
      if (this.isPortalNode(Type))
        return new this.constructor.PortalNode(this, parent, context);
      else
        return new this.constructor.NativeNode(this, parent, context);
    } else if (Type == null || Type === JIB_PROXY) {
      return new this.constructor.FragmentNode(this, parent, context);
    }
  }

  async syncElementsWithRenderer(node, renderResult, renderFrame) {
    if (this.destroying || renderFrame < this.renderFrame)
      return;

    await this.updateElementChildren(
      this.context,
      this.rootElement,
      renderResult,
      renderFrame,
    );
  }

  async render(jib) {
    this.renderFrame++;
    let renderFrame = this.renderFrame;

    let rootNode = this.rootNode;
    if (!rootNode)
      rootNode = this.rootNode = this.constructNodeFromJib(JIB_PROXY, this, this.context);

    let renderResult = await rootNode.render(jib, { index: 0 });
    await this.syncElementsWithRenderer(
      this,
      renderResult,
      renderFrame,
    );

    return renderResult;
  }
}
