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

  async destroy() {
    if (this.rootNode) {
      await this.rootNode.destroy();
      this.rootNode = null;
    }

    return await super.destroy();
  }

  async getNativeElement() {
    let { Type } = (this._currentJib || {});
    if (!Type)
      return;

    return await this.renderer.findNativeElement(this.context, Type);
  }

  async _render(jib, renderContext) {
    this._currentJib = jib;

    let {
      children,
    } = (jib || {});

    let rootNode = this.rootNode;
    if (!rootNode)
      rootNode = this.rootNode = this.renderer.constructNodeFromJib(JIB_PROXY, this, this.context);

    let newContext = Object.create(renderContext);
    newContext.index = 0;

    return await rootNode.render(children, newContext);
  }
}
