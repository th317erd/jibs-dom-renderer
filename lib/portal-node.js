import {
  Renderers,
} from 'jibs';

import { NativeNode } from './native-node.js';

const {
  PortalElement,
} = Renderers;

export class PortalNode extends NativeNode {
  static ELEMENT_CLASS = PortalElement;
}
