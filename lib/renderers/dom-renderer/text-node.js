'use strict';

const {
  Renderers,
} = require('jibs');

const {
  RootNode,
} = Renderers;

class TextNode extends RootNode {
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

  destroy() {
    if (this.nativeElement) {
      if (this.renderer.destroyTextElement(this.nativeElement)) {
        this.renderer.emit('updated', {
          action: 'deleted',
          type:   'text',
          target: this.nativeElement,
        });
      }

      this.nativeElement = null;
    }

    super.destroy();
  }

  getNativeElement() {
    return this.nativeElement;
  }

  render(text) {
    let parentNativeElement = (this.parent && this.parent.getNativeElement());
    if (!parentNativeElement)
      return;

    let nativeElement = this.nativeElement;
    if (!nativeElement) {
      nativeElement = this.nativeElement = this.renderer.createTextElement(text);

      let childIndex                  = this.parent.currentChildIndex;
      let parentNativeElementChildren = parentNativeElement.childNodes;
      if (parentNativeElementChildren.length > childIndex)
        parentNativeElement.replaceChild(nativeElement, parentNativeElementChildren[childIndex]);
      else
        parentNativeElement.appendChild(nativeElement);

      this.parent.currentChildIndex++;

      this.renderer.emit('updated', {
        action: 'created',
        type:   'text',
        target: nativeElement,
      });
    } else {
      this.parent.currentChildIndex++;

      let diff = this.renderer.updateTextElement(nativeElement, text);
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

module.exports = {
  TextNode,
};
