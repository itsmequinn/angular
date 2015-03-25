import {isPresent} from 'angular2/src/facade/lang';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {SetterFn} from 'angular2/src/reflection/types';

import {List, Map} from 'angular2/src/facade/collection';

import {ElementBinder} from './element_binder';
import {NG_BINDING_CLASS} from '../util';

export class ProtoView {
  element;
  elementBinders:List<ElementBinder>;
  isTemplateElement:boolean;
  instantiateInPlace:boolean;
  rootBindingOffset:int;
  componentId:string;
  propertySetters: Map<string, SetterFn>;

  constructor({
    elementBinders,
    element,
    instantiateInPlace,
    componentId,
    propertySetters
  }) {
    this.element = element;
    this.elementBinders = elementBinders;
    this.isTemplateElement = DOM.isTemplateElement(this.element);
    this.instantiateInPlace = instantiateInPlace;
    this.rootBindingOffset = (isPresent(this.element) && DOM.hasClass(this.element, NG_BINDING_CLASS)) ? 1 : 0;
    this.componentId = componentId;
    this.propertySetters = propertySetters;
  }
}