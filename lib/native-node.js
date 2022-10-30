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

  async destroy() {
    if (this.rootNode) {
      await this.rootNode.destroy();
      this.rootNode = null;
    }

    let nativeElement = this.nativeElement;
    if (nativeElement) {
      if (await this.renderer.destroyNativeElement(this.context, nativeElement)) {
        if (this._currentJib && typeof this._currentJib.props.ref === 'function')
          this._currentJib.props.ref.call(nativeElement, null, nativeElement);

        this.renderer.emit('updated', {
          action: 'deleted',
          type:   'element',
          target: nativeElement,
        });
      }

      this.nativeElement = null;
    }

    return await super.destroy();
  }

  getNativeElement() {
    return this.nativeElement;
  }

  async _render(jib, renderContext) {
    let {
      Type,
      props,
      children,
    } = this._currentJib = jib;

    if (!Type)
      return;

    let parentNativeElement = (this.parent && await this.parent.getNativeElement());
    if (!parentNativeElement)
      return;

    let nativeElement = await this.getNativeElement();
    if (!nativeElement) {
      nativeElement = this.nativeElement = await this.renderer.createNativeElement(this.context, Type);
      await this.renderer.updateElementAttributes(this.context, nativeElement, props);

      let parentNativeElementChildren = parentNativeElement.childNodes;
      if (parentNativeElementChildren.length > renderContext.index)
        await parentNativeElement.replaceChild(nativeElement, parentNativeElementChildren[renderContext.index]);
      else
        await parentNativeElement.appendChild(nativeElement);

      renderContext.index++;

      if (props && typeof props.ref === 'function')
        props.ref.call(nativeElement, nativeElement, null);

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
      renderContext.index++;

      let propDiff = await this.renderer.updateElementAttributes(this.context, nativeElement, props);
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

    let newContext = Object.create(renderContext);
    newContext.index = 0;

    return await rootNode.render(children, newContext);
  }
}
