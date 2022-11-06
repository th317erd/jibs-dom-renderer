import {
  Renderers,
} from 'jibs';

const {
  RootNode,
  TextElement,
} = Renderers;

export class TextNode extends RootNode {
  async destroy() {
    if (this.destroying)
      return;

    this.destroying = true;

    return await super.destroy();
  }

  async _render(text) {
    return new TextElement(this.id, text);
  }
}
