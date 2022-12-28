import {
  Jibs,
  Renderers,
  Utils,
} from 'jibs';

const {
  JIB_PROXY,
} = Jibs;

const {
  RootNode,
  NativeElement,
  TextElement,
} = Renderers;

export class NativeNode extends RootNode {
  static ELEMENT_CLASS = NativeElement;

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
      '_cachedRenderResult': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        { id: this.id },
      },
    });
  }

  async syncElementsWithRenderer(node, renderResult, renderFrame) {
    if (!this.renderer || this.destroying || renderFrame < this.renderFrame)
      return;

    await this.renderer.updateElementChildren(
      this.context,
      this._cachedRenderResult,
      renderResult,
      renderFrame,
    );
  }

  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    if (this.rootNode) {
      await this.rootNode.destroy();
      this.rootNode = null;
    }

    return await super.destroy();
  }

  async _render(jib, renderContext) {
    let {
      Type,
      props,
      children,
    } = this._currentJib = (jib || {});

    if (!Type)
      return;

    let renderFrame = this.renderFrame;

    if (!Object.prototype.hasOwnProperty.call(props, 'innerHTML')) {
      let rootNode = this.rootNode;
      if (!rootNode)
        rootNode = this.rootNode = this.renderer.constructNodeFromJib(JIB_PROXY, this, this.context);

      let newContext = Object.create(renderContext);
      newContext.index = 0;

      rootNode.render(children, newContext).then((fragmentResult) => {
        return this.syncElementsWithRenderer(this, fragmentResult, renderFrame);
      }).catch((_error) => {
        let error = _error;
        if (!(error instanceof Error))
          error = new Error(error);

        return this.syncElementsWithRenderer(this, [ new TextElement(null, error, props) ], renderFrame);
      });
    } else {
      if (this.rootNode) {
        await this.rootNode.destroy();
        this.rootNode = null;
      }
    }

    let renderResult = this._cachedRenderResult = new this.constructor.ELEMENT_CLASS(
      this.id,
      Type,
      props,
    );

    return renderResult;
  }
}
