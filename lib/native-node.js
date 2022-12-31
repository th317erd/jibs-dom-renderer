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

export class NativeNode extends RootNode {
  static TYPE = 1;

  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'fragmentNode': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
    });
  }

  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;
    await this.destroyFragmentNode();

    return await super.destroy(true);
  }

  async destroyFragmentNode() {
    if (!this.fragmentNode)
      return;

    this.removeChild(this.fragmentNode);

    await this.fragmentNode.destroy();
    this.fragmentNode = null;
  }

  async _render() {
    let {
      Type,
      props,
      children,
    } = (this.jib || {});

    if (!Type)
      return;

    if (!Object.prototype.hasOwnProperty.call(props, 'innerHTML')) {
      let fragmentJib = { Type: JIB_PROXY, props: {}, children };
      let fragmentNode = this.fragmentNode;

      if (!fragmentNode) {
        fragmentNode = this.fragmentNode = this.renderer.constructNodeFromJib(fragmentJib, this, this.context);
        this.addChild(fragmentNode);
      } else {
        this.fragmentNode.updateJib(fragmentJib);
      }

      await fragmentNode.render();
    } else {
      await this.destroyFragmentNode();
    }
  }
}
