import {isPresent} from 'angular2/src/facade/lang';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {SetterFn} from 'angular2/src/reflection/types';

import {List, Map, ListWrapper, MapWrapper} from 'angular2/src/facade/collection';

import {ElementBinder} from './element_binder';
import {NG_BINDING_CLASS} from '../util';

/**
 * Note: Code that uses this class assumes that is immutable!
 */
export class ProtoView {
  element;
  elementBinders:List<ElementBinder>;
  isTemplateElement:boolean;
  isRootView:boolean;
  rootBindingOffset:int;
  componentId:string;
  propertySetters: Map<string, SetterFn>;

  constructor({
    elementBinders,
    element,
    isRootView,
    componentId,
    propertySetters
  }) {
    this.element = element;
    this.elementBinders = elementBinders;
    this.isTemplateElement = DOM.isTemplateElement(this.element);
    this.isRootView = isRootView;
    this.rootBindingOffset = (isPresent(this.element) && DOM.hasClass(this.element, NG_BINDING_CLASS)) ? 1 : 0;
    this.componentId = componentId;
    this.propertySetters = propertySetters;
  }

  mergeChildComponentProtoViews(protoViews:List<ProtoView>):ProtoView {
    var elementBinders = ListWrapper.createFixedSize(this.elementBinders.length);
    for (var i=0; i<protoViews.length; i++) {
      var protoView = protoViews[i];
      var eb = this.elementBinders[i];
      elementBinders[i] = isPresent(protoView) ? eb.mergeChildComponentProtoView(protoView) : eb;
    }
    return new ProtoView({
      elementBinders: elementBinders,
      element: this.element,
      isRootView: this.isRootView,
      componentId: this.componentId,
      // Don't clone as we assume immutability!
      propertySetters: this.propertySetters
    });
  }
}
