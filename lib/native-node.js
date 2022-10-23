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
} = Renderers;

export class NativeNode extends RootNode {
  constructor(...args) {
    super(...args);

    Object.defineProperties(this, {
      'nativeElement': {
        writable:     true,
        enumerable:   false,
        configurable: true,
        value:        null,
      },
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

    let nativeElement = this.nativeElement;
    if (nativeElement) {
      if (this.renderer.destroyNativeElement(nativeElement)) {
        if (this._currentJib && typeof this._currentJib.props.ref === 'function')
          this._currentJib.props.ref.call(nativeElement, null);

        this.renderer.emit('updated', {
          action: 'deleted',
          type:   'element',
          target: nativeElement,
        });
      }

      this.nativeElement = null;
    }

    super.destroy();
  }

  getNativeElement() {
    return this.nativeElement;
  }

  render(jib) {
    let {
      Type,
      props,
      children,
    } = this._currentJib = jib;

    if (!Type)
      return;

    let parentNativeElement = (this.parent && this.parent.getNativeElement());
    if (!parentNativeElement)
      return;

    let nativeElement = this.getNativeElement();
    if (!nativeElement) {
      nativeElement = this.nativeElement = this.renderer.createNativeElement(Type.toLowerCase());
      this.renderer.updateElementAttributes(nativeElement, props);

      let childIndex                  = this.parent.currentChildIndex;
      let parentNativeElementChildren = parentNativeElement.childNodes;
      if (parentNativeElementChildren.length > childIndex)
        parentNativeElement.replaceChild(nativeElement, parentNativeElementChildren[childIndex]);
      else
        parentNativeElement.appendChild(nativeElement);

      if (props && typeof props.ref === 'function')
        props.ref.call(nativeElement, nativeElement);

      this.parent.currentChildIndex++;

      this.renderer.emit('updated', {
        action: 'created',
        type:   'element',
        target: nativeElement,
        props:  Object.keys(props).reduce((propDiff, propName) => {
          propDiff[propName] = { previous: undefined, current: props[propName] };
          return propDiff;
        }, {}),
      });
    } else {
      this.parent.currentChildIndex++;

      let propDiff = this.renderer.updateElementAttributes(nativeElement, props);
      if (Utils.sizeOf(propDiff) > 0) {
        this.renderer.emit('updated', {
          action: 'updated',
          type:   'element',
          target: nativeElement,
          props:  propDiff,
        });
      }
    }

    let rootNode = this.rootNode;
    if (!rootNode)
      rootNode = this.rootNode = this.renderer.constructNodeFromJib(JIB_PROXY, this, this.context);

    this.currentChildIndex = 0;
    rootNode.render(children);
  }
}
