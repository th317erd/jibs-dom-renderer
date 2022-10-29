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
    if (this.nativeElement) {
      if (await this.renderer.destroyTextElement(this.nativeElement)) {
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
    let parentNativeElement = (this.parent && await this.parent.getNativeElement());
    if (!parentNativeElement)
      return;

    let nativeElement = this.nativeElement;
    if (!nativeElement) {
      nativeElement = this.nativeElement = await this.renderer.createTextElement(text);

      let parentNativeElementChildren = parentNativeElement.childNodes;
      if (parentNativeElementChildren.length > renderContext.index)
        await parentNativeElement.replaceChild(nativeElement, parentNativeElementChildren[renderContext.index]);
      else
        await parentNativeElement.appendChild(nativeElement);

      renderContext.index++;

      this.renderer.emit('updated', {
        action: 'created',
        type:   'text',
        target: nativeElement,
      });
    } else {
      renderContext.index++;

      let diff = await this.renderer.updateTextElement(nativeElement, text);
      if (diff) {
        this.renderer.emit('updated', {
          action: 'updated',
          type:   'text',
          target: nativeElement,
          text:   diff,
        });
      }
    }
  }
}
