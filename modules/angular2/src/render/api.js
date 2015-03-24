import {List, Map} from 'angular2/src/facade/collection';
import {ASTWithSource} from 'angular2/change_detection';

// Note: we are already parsing expressions on the render side:
// - this makes the ElementBinders more compact
//   (e.g. no need to distinguish interpolations from regular expressions from literals)
// - allows later to store event meta data that defines the data
//   that should be returned to the application when an even thappens
// - we need the parse at least for the `template` attribute to match
//   directives in it
// - render compiler would read all syntax, application
//   would be syntax independent
// - render compiler is not on the critical path as
//   its output will be stored in precompiled templates.

export class ElementBinder {
  index:number;
  parentIndex:number;
  distanceToParent:number;
  parentWithDirectivesIndex:number;
  distanceToParentWithDirectives:number;
  directives:List<DirectiveBinder>;
  nestedProtoView:ProtoView;
  propertyBindings: Map<string, ASTWithSource>;
  variableBindings: Map<string, ASTWithSource>;
  eventBindings: Map<string, ASTWithSource>;
  textBindings: List<ASTWithSource>;

  constructor({
    index, parentIndex, distanceToParent, parentWithDirectivesIndex,
    distanceToParentWithDirectives, directives, nestedProtoView,
    propertyBindings, variableBindings,
    eventBindings, textBindings
  }) {
    this.index = index;
    this.parentIndex = parentIndex;
    this.distanceToParent = distanceToParent;
    this.parentWithDirectivesIndex = parentWithDirectivesIndex;
    this.distanceToParentWithDirectives = distanceToParentWithDirectives;
    this.directives = directives;
    this.nestedProtoView = nestedProtoView;
    this.propertyBindings = propertyBindings;
    this.variableBindings = variableBindings;
    this.eventBindings = eventBindings;
    this.textBindings = textBindings;
  }
}

export class DirectiveBinder {
  directiveIndex:number;
  propertyBindings: Map<string, ASTWithSource>;
  eventBindings: Map<string, ASTWithSource>;
  constructor({
    directiveIndex, propertyBindings, eventBindings
  }) {
    this.directiveIndex = directiveIndex;
    this.propertyBindings = propertyBindings;
    this.eventBindings = eventBindings;
  }
}

export class ProtoView {
  render: ProtoViewRef;
  elementBinders:List<ElementBinder>;
  variableBindings: Map<string, string>;

  constructor({render, elementBinders, variableBindings}) {
    this.render = render;
    this.elementBinders = elementBinders;
    this.variableBindings = variableBindings;
  }
}

export class DirectiveMetadata {
  selector:string;
  compileChildren:boolean;
  events:Map<string, string>;
  bind:Map<string, string>;
  constructor(selector, compileChildren, events, bind) {
    this.selector = selector;
    this.compileChildren = compileChildren;
    this.events = events;
    this.bind = bind;
  }
}

// An opaque reference to a ProtoView
export class ProtoViewRef {}

// An opaque reference to a View
export class ViewRef {}

export class ViewContainerRef {
  view:ViewRef;
  viewContainerIndex:number;
  constructor(view:ViewRef, viewContainerIndex: number) {
    this.view = view;
    this.viewContainerIndex = viewContainerIndex;
  }
}

export class Template {
  id: string;
  absUrl: string;
  inline: string;
  directives: List<DirectiveMetadata>;
  constructor({id, absUrl, inline, directives}) {
    this.id = id;
    this.absUrl = absUrl;
    this.inline = inline;
    this.directives = directives;
  }
}

export class Renderer {
  // TODO(tbosch): union type return ProtoView or Promise<ProtoView>
  compile(template:Template) {}

  createView(protoView:ProtoViewRef):ViewRef {}

  // Note: This does NOT remove the view from
  // a ViewContainer nor it's parent component!
  destroyView(view:ViewRef):void {}

  // this will always return data in sync
  createRootView(selectorOrElement):ViewRef {}

  insertViewIntoContainer(vc:ViewContainerRef, view:ViewRef, atIndex=-1):void {}

  // Note: We can't detach based on an index
  // as otherwise we would need to return the detached View in sync,
  // which is not possible over a remote protocol
  /**
   * The method can be used together with insert to implement a view move, i.e.
   * moving the dom nodes while the directives in the view stay intact.
   * Note: The detached view cannot be inserted into another ViewContainer!
   */
  detachViewFromContainer(vc:ViewContainerRef, view:ViewRef):void {}

  setElementProperty(view:ViewRef, elementIndex:number, propertyName:string, propertyValue:any):void {}

  setComponentView(view:ViewRef, elementIndex:number, nestedView:ViewRef):void {}

  setText(view:ViewRef, textNodeIndex:number, text:string):void {}

  // TODO(tbosch): think about how to serialize callbacks
  // - maybe keep a local WeakMap with ids?
  listen(view:ViewRef, elementIndex:number, eventName:string, callback:Function):void {}

  // To be called at end of VmTurn
  flush():void {}
}
