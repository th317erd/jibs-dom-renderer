'use strict';

const {
  Jibs,
  Renderers,
} = require('jibs');

const { FragmentNode }  = require('./fragment-node');
const { TextNode }      = require('./text-node');
const { NativeNode }    = require('./native-node');
const { ComponentNode } = require('./component-node');
const { Renderer }      = Renderers;

const {
  JIB_PROXY,
} = Jibs;

class DOMRenderer extends Renderer {
  static FragmentNode = FragmentNode;

  static TextNode = TextNode;

  static NativeNode = NativeNode;

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

  getNativeElement() {
    return this.rootElement;
  }

  constructNodeFromJib(jib, parent, context) {
    if (jib === JIB_PROXY)
      return new this.constructor.FragmentNode(this, parent, context);

    let { Type } = jib;
    if (typeof Type === 'function')
      return new this.constructor.ComponentNode(this, parent, context);
    else if (typeof Type === 'string')
      return new this.constructor.NativeNode(this, parent, context);
    else if (Type == null || Type === JIB_PROXY)
      return new this.constructor.FragmentNode(this, parent, context);
  }

  render(jib) {
    let rootNode = this.rootNode;
    if (!rootNode)
      rootNode = this.rootNode = this.constructNodeFromJib(JIB_PROXY, this, this.context);

    this.currentChildIndex = 0;
    rootNode.render(jib);
  }
}

module.exports = {
  DOMRenderer,
};
