import {
  Renderers,
} from 'jibs';

const {
  RootNode,
} = Renderers;

export class TextNode extends RootNode {
  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'nativeElement': {
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

    if (this.nativeElement) {
      if (await this.renderer.destroyTextElement(this.context, this.nativeElement)) {
        this.renderer.emit('updated', {
          action: 'deleted',
          type:   'text',
          target: this.nativeElement,
        });
      }

      this.nativeElement = null;
    }

    return await super.destroy();
  }

  getNativeElement() {
    return this.nativeElement;
  }

  async _render(text, renderContext) {
    let renderStartTime = Date.now();
    let nativeElement   = this.nativeElement;
    if (!nativeElement) {
      nativeElement = await this.renderer.createTextElement(this.context, text);

      if (this.destroying || renderStartTime < this.renderStartTime)
        return;

      this.nativeElement = nativeElement;

      this.renderer.emit('updated', {
        action: 'created',
        type:   'text',
        target: nativeElement,
      });
    } else {
      let diff = await this.renderer.updateTextElement(this.context, nativeElement, text);
      if (diff) {
        this.renderer.emit('updated', {
          action: 'updated',
          type:   'text',
          target: nativeElement,
          text:   diff,
        });
      }
    }

    return nativeElement;
  }
}
