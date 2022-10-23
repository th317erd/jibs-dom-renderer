import {
  Jibs,
  Renderers,
} from 'jibs';

const {
  JIB_PROXY,
} = Jibs;

const {
  RootNode,
} = Renderers;

export class PortalNode extends RootNode {
  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'rootNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
      '_currentJib': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  destroy() {
    if (this.rootNode) {
      this.rootNode.destroy();
      this.rootNode = null;
    }

    super.destroy();
  }

  getNativeElement() {
    let { Type } = (this._currentJib || {});
    if (!Type)
      return;

    return this.renderer.findNativeElement(Type);
  }

  render(jib) {
    this._currentJib = jib;

    let {
      Type,
      children,
    } = (jib || {});

    let rootNode = this.rootNode;
    if (!rootNode)
      rootNode = this.rootNode = this.renderer.constructNodeFromJib(JIB_PROXY, this, this.context);

    this.currentChildIndex = 0;
    rootNode.render(children);
  }
}
