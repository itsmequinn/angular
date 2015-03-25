import {isPresent} from 'angular2/src/facade/lang';
import {ListWrapper, MapWrapper, Set, SetWrapper} from 'angular2/src/facade/collection';
import {DOM} from 'angular2/src/dom/dom_adapter';

import {ASTWithSource} from 'angular2/change_detection';
import {SetterFn} from 'angular2/src/reflection/types';

import {ProtoView} from './proto_view';
import {ElementBinder} from './element_binder';
import {ShadowDomStrategy} from '../shadow_dom/shadow_dom_strategy';

import * as api from '../api';
import {DirectProtoViewRef} from '../direct_proto_view_ref';

import {NG_BINDING_CLASS} from '../util';

export class ProtoViewBuilder {
  rootElement;
  variableBindings: Map<string, string>;
  elements:List<ElementBinderBuilder>;
  instantiateInPlace:boolean;
  componentId:string;
  propertySetters:Set<string>;

  constructor(rootElement) {
    this.rootElement = rootElement;
    this.elements = [];
    this.instantiateInPlace = false;
    this.variableBindings = MapWrapper.create();
    this.componentId = null;
    this.propertySetters = new Set();
  }

  bindElement(element, description = null):ElementBinderBuilder {
    var builder = new ElementBinderBuilder(this.elements.length, element, description);
    ListWrapper.push(this.elements, builder);
    DOM.addClass(element, NG_BINDING_CLASS);

    return builder;
  }

  bindVariable(name, value) {
    // Store the variable map from value to variable, reflecting how it will be used later by
    // View. When a local is set to the view, a lookup for the variable name will take place keyed
    // by the "value", or exported identifier. For example, ng-repeat sets a view local of "index".
    // When this occurs, a lookup keyed by "index" must occur to find if there is a var referencing
    // it.
    MapWrapper.set(this.variableBindings, value, name);
  }

  setInstantiateInPlace(value) {
    this.instantiateInPlace = value;
  }

  setComponentId(componentId) {
    this.componentId = componentId;
    return this;
  }

  build():api.ProtoView {
    var renderElementBinders = [];

    var apiElementBinders = [];
    var propertySetters = MapWrapper.create();
    ListWrapper.forEach(this.elements, (ebb) => {
      var apiDirectiveBinders = ListWrapper.map(ebb.directives, (db) => {
        MapWrapper.forEach(db.propertySetters, (setter, propertyName) => {
          MapWrapper.set(propertySetters, propertyName, setter);
        });
        return new api.DirectiveBinder({
          directiveIndex: db.directiveIndex,
          propertyBindings: db.propertyBindings,
          eventBindings: db.eventBindings
        });
      });
      MapWrapper.forEach(ebb.propertySetters, (setter, propertyName) => {
        MapWrapper.set(propertySetters, propertyName, setter);
      });
      var nestedProtoView =
          isPresent(ebb.nestedProtoView) ? ebb.nestedProtoView.build() : null;
      var parentIndex = isPresent(ebb.parent) ? ebb.parent.index : -1;
      var parentWithDirectivesIndex = isPresent(ebb.parentWithDirectives) ? ebb.parentWithDirectives.index : -1;
      ListWrapper.push(apiElementBinders, new api.ElementBinder({
        index: ebb.index, parentIndex:parentIndex, distanceToParent:ebb.distanceToParent,
        parentWithDirectivesIndex: parentWithDirectivesIndex, distanceToParentWithDirectives: ebb.distanceToParentWithDirectives,
        directives: apiDirectiveBinders,
        nestedProtoView: nestedProtoView,
        propertyBindings: ebb.propertyBindings, variableBindings: ebb.variableBindings,
        eventBindings: ebb.eventBindings,
        textBindings: ebb.textBindings
      }));
      ListWrapper.push(renderElementBinders, new ElementBinder({
        textNodeIndices: ebb.textBindingIndices,
        contentTagSelector: ebb.contentTagSelector,
        nestedProtoView: isPresent(nestedProtoView) ? nestedProtoView.render : null
      }));
    });
    return new api.ProtoView({
      render: new DirectProtoViewRef(new ProtoView({
        element: this.rootElement,
        elementBinders: renderElementBinders,
        instantiateInPlace: instantiateInPlace,
        componentId: this.componentId,
        propertySetters: propertySetters
      })),
      elementBinders: apiElementBinders,
      variableBindings: this.variableBindings
    });
  }
}

export class ElementBinderBuilder {
  element;
  index:number;
  parent:ElementBinderBuilder;
  distanceToParent:number;
  parentWithDirectives:ElementBinderBuilder;
  distanceToParentWithDirectives:number;
  directives:List<DirectiveBuilder>;
  nestedProtoView:ProtoViewBuilder;
  propertyBindings: Map<string, ASTWithSource>;
  variableBindings: Map<string, string>;
  eventBindings: Map<string, ASTWithSource>;
  textBindingIndices: List<number>;
  textBindings: List<ASTWithSource>;
  contentTagSelector:string;
  propertySetters: Map<string, SetterFn>;

  constructor(index, element, description) {
    this.element = element;
    this.index = index;
    this.parent = null;
    this.distanceToParent = 0;
    this.parentWithDirectives = null;
    this.distanceToParentWithDirectives = 0;
    this.directives = [];
    this.nestedProtoView = null;
    this.propertyBindings = MapWrapper.create();
    this.variableBindings = MapWrapper.create();
    this.eventBindings = MapWrapper.create();
    this.textBindings = [];
    this.textBindingIndices = [];
    this.contentTagSelector = null;
    this.propertySetters = MapWrapper.create();
  }

  setParent(parent:ElementBinderBuilder, distanceToParent):ElementBinderBuilder {
    this.parent = parent;
    if (isPresent(parent)) {
      this.distanceToParent = distanceToParent;
      if (parent.directives.length > 0) {
        this.parentWithDirectives = parent;
        this.distanceToParentWithDirectives = distanceToParent;
      } else {
        this.parentWithDirectives = parent.parentWithDirectives;
        if (isPresent(this.parentWithDirectives)) {
          this.distanceToParentWithDirectives = distanceToParent + parent.distanceToParentWithDirectives;
        }
      }
    }
    return this;
  }

  bindDirective(directiveIndex:number):DirectiveBuilder {
    var directive = new DirectiveBuilder(directiveIndex);
    ListWrapper.push(this.directives, directive);
    return directive;
  }

  bindNestedProtoView():ProtoViewBuilder {
    if (isPresent(nestedProtoView)) {
      throw new BaseException('Only one nested view per element is allowed');
    }
    this.nestedProtoView = new ProtoViewBuilder(this.element);
    return this.nestedProtoView;
  }

  bindProperty(name, expression) {
    MapWrapper.set(this.propertyBindings, name, expression);
  }

  bindVariable(name, value) {

    // When current is a view root, the variable bindings are set to the *nested* proto view.
    // The root view conceptually signifies a new "block scope" (the nested view), to which
    // the variables are bound.
    if (isPresent(this.nestedProtoView)) {
      this.nestedProtoView.bindVariable(name, value);
    } else {
      // Store the variable map from value to variable, reflecting how it will be used later by
      // View. When a local is set to the view, a lookup for the variable name will take place keyed
      // by the "value", or exported identifier. For example, ng-repeat sets a view local of "index".
      // When this occurs, a lookup keyed by "index" must occur to find if there is a var referencing
      // it.
      MapWrapper.set(this.variableBindings, value, name);
    }
  }

  bindEvent(name, expression) {
    MapWrapper.set(this.eventBindings, name, expression);
  }

  bindText(index, expression) {
    ListWrapper.push(this.textBindingIndices, index);
    ListWrapper.push(this.textBindings, expression);
  }

  setContentTagSelector(value:string) {
    this.contentTagSelector = value;
  }

  bindPropertySetter(propertyName, setter) {
    MapWrapper.set(this.propertySetters, propertyName, setter);
  }
}

export class DirectiveBuilder {
  directiveIndex:number;
  propertyBindings: Map<string, ASTWithSource>;
  eventBindings: Map<string, ASTWithSource>;
  propertySetters: Map<string, SetterFn>;

  constructor(directiveIndex) {
    this.directiveIndex = directiveIndex;
    this.propertyBindings = MapWrapper.create();
    this.eventBindings = MapWrapper.create();
    this.propertySetters = MapWrapper.create();
  }

  bindProperty(name, expression) {
    MapWrapper.set(this.propertyBindings, name, expression);
  }

  bindEvent(name, expression) {
    MapWrapper.set(this.eventBindings, name, expression);
  }

  bindPropertySetter(propertyName, setter) {
    MapWrapper.set(this.propertySetters, propertyName, setter);
  }
}