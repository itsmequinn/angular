import {isPresent} from 'angular2/src/facade/lang';
import {List, Map} from 'angular2/src/facade/collection';
import {ASTWithSource} from 'angular2/change_detection';

/**
 * General notes:
 * We are already parsing expressions on the render side:
 * - this makes the ElementBinders more compact
 *   (e.g. no need to distinguish interpolations from regular expressions from literals)
 * - allows to retrieve which properties should be accessed from the event
 *   by looking at the expression
 * - we need the parse at least for the `template` attribute to match
 *   directives in it
 * - render compiler is not on the critical path as
 *   its output will be stored in precompiled templates.
 */
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
  // Note: this contains a preprocessed AST
  // that replaced the values that should be extracted from the element
  // with a local name
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
  // Index into the array of directives in the Template instance
  directiveIndex:any;
  propertyBindings: Map<string, ASTWithSource>;
  // Note: this contains a preprocessed AST
  // that replaced the values that should be extracted from the element
  // with a local name
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
  id:any;
  selector:string;
  compileChildren:boolean;
  events:Map<string, string>;
  bind:Map<string, string>;
  setters:List<string>;
  type:number;
  constructor({id, selector, compileChildren, events, bind, setters, type}) {
    this.id = id;
    this.selector = selector;
    this.compileChildren = isPresent(compileChildren) ? compileChildren : true;
    this.events = events;
    this.bind = bind;
    this.setters = setters;
    this.type = type;
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
  /**
   * Compiles a single ProtoView. Non recursive so that
   * we don't need to serialize all possible components over the wire,
   * but only the needed ones based on previous calls.
   */
  compile(template:Template):Promise<ProtoView> {}

  /**
   * Creates a root view
   *
   * Note: This returns the ViewRef synchronously also in
   * a WebWorker scenario as the required id will be created on the client already.
   */
  createRootView(selectorOrElement):ViewRef {}

  /**
   * Destroys a view and returns it back into the pool.
   */
  destroyView(view:ViewRef):void {}

  /**
   * Creates a new View
   */
  createView(protoViewRef:api.ProtoViewRef):api.ViewRef {}

  /**
   * Inserts a detached view into a viewContainer.
   */
  insertViewIntoContainer(vcRef:ViewContainerRef, view:ViewRef, atIndex):void {}

  /**
   * Detaches a view from a container so that it can be inserted later on
   */
  detachViewFromContainer(vcRef:ViewContainerRef, view:ViewRef):void {}

  /**
   * Sets a property on an element.
   * Note: This will fail if the property was not mentioned previously as a propertySetter
   * in the Template.
   */
  setElementProperty(view:ViewRef, elementIndex:number, propertyName:string, propertyValue:any):void {}

  /**
   * Creates and installs a nested component in another view.
   * Note: this might be a noop if we don't disassemble nested component views
   * when caching views.
   */
  createComponentView(protoView:ProtoViewRef, elementIndex:number, nestedView:ViewRef):ViewRef {}

  /**
   * This will set the value for a text node.
   * Note: This needs to be separate from setElementProperty as we don't have ElementBinders
   * for text nodes in the ProtoView either.
   */
  setText(view:ViewRef, textNodeIndex:number, text:string):void {}

  /**
   * Sets the dispatcher for all events that have been defined in the template or in directives
   * in the given view.
   */
  setEventDispatcher(view:ViewRef, dispatcher:EventDispatcher) {}

  /**
   * To be called at the end of the VmTurn so the API can buffer calls
   */
  flush():void {}
}


/**
 * A dispatcher for all events happening in a view.
 */
class EventDispatcher {
  /**
   * Called when an event was triggered for a on-* attribute on an element.
   * @param {List<any>} locals Locals to be used to evaluate the
   *   event expressions
   */
  dispatchElementEvent(
    elementIndex:number, eventName:string, locals:List<any>
  ) {}
}
