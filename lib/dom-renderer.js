import {
  Jibs,
  Renderers,
} from 'jibs';

import { FragmentNode }     from './fragment-node.js';
import { TextNode }         from './text-node.js';
import { NativeNode }       from './native-node.js';
import { PortalNode }       from './portal-node.js';
import { ComponentNode }    from './component-node.js';

const {
  Renderer,
} = Renderers;

const {
  JIB_PROXY,
  JIB_RAW_TEXT,
} = Jibs;

const SKIP_UPDATES = true;

export class DOMRenderer extends Renderer {
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 9;

  static FragmentNode = FragmentNode;

  static TextNode = TextNode;

  static NativeNode = NativeNode;

  static PortalNode = PortalNode;

  static ComponentNode = ComponentNode;

  constructor(rootElementSelector, options) {
    super();

    Object.defineProperties(this, {
      'options': {
        writable:     false,
        enumerable:   false,
        configurable: false,
        value:        options || {},
      },
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

    await this.attachChildren(context, node);

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

    if (node.TYPE === NativeNode.TYPE)
      return await this.createNativeElement(context, node);
    else if (node.TYPE === TextNode.TYPE)
      return await this.createTextElement(context, node);
    else if (node.TYPE === PortalNode.TYPE || node.TYPE === DOMRenderer.TYPE)
      return await this.createPortalElement(context, node);
    else
      throw new TypeError(`${this.constructor.name}::constructNativeElementFromNode: Unsupported virtual element type detected: ${node.TYPE}`);
  }

  async updateNode(context, node) {
    if (!node)
      return false;

    let result;

    if (node.TYPE === NativeNode.TYPE)
      result = await this.updateNativeElement(context, node);
    else if (node.TYPE === TextNode.TYPE)
      result = await this.updateTextElement(context, node);
    else if (node.TYPE === PortalNode.TYPE || node.TYPE === DOMRenderer.TYPE)
      result = await this.updatePortalElement(context, node);
    else
      throw new TypeError(`${this.constructor.name}::syncNode: Unsupported virtual element type detected: ${node.TYPE}`);

    await this.attachChildren(context, node);

    return result;
  }

  async syncNode(context, node) {
    if (!node)
      return false;

    let nativeElement = (node && node.nativeElement);
    if (!nativeElement) {
      nativeElement = await this.constructNativeElementFromNode(context, node);
      if (node.jib && node.jib.props && typeof node.jib.props.ref === 'function')
        node.jib.props.ref.call(node, nativeElement, null);

      node.nativeElement = nativeElement;

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
      if (node.TYPE === NativeNode.TYPE)
        result = await this.destroyNativeElement(context, node);
      else if (node.TYPE === TextNode.TYPE)
        result = await this.destroyTextElement(context, node);
      else if (node.TYPE === PortalNode.TYPE || node.TYPE === DOMRenderer.TYPE)
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
