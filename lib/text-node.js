import {
  Renderers,
} from 'jibs';

const {
  RootNode,
} = Renderers;

export class TextNode extends RootNode {
  // eslint-disable-next-line no-magic-numbers
  static TYPE = 3;

  static HAS_CONTEXT = false;
}
