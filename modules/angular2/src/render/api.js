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
  static get COMPONENT_TYPE() { return 1; }
  static get DYNAMIC_COMPONENT_TYPE() { return 2; }
  static get VIEWPORT_TYPE() { return 2; }
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
   * Creates a root view and all of its nested component views at once.
   * See createView.
   * @param {List<ProtoViewRef>} protoViewRefs
   *    ProtoViews for the nested components in depth
   *    first order, exlcluding dynamic components.
   */
  createRootView(selectorOrElement, protoViewRefs:List<ProtoViewRef>):List<ViewRef> {}

  /**
   * Creates a view and all of its nested component views at once.
   *
   * Note: We need to pass the nested component views here as well
   * so we can cache them all in one chunk instead of splitting them up.
   * Note: This returns a List of ViewRefs synchronously also in
   * a WebWorker scenario as the required ids will be created on the client already.
   *
   * @param {List<ProtoViewRef>} protoViewRefs
   *    ProtoViews for the nested components in depth
   *    first order, exlcluding dynamic components.
   */
  createView(protoViewRefs:List<ProtoViewRef>):List<ViewRef> {}

  /**
   * Destroys a view and returns it back into the pool.
   * Also destroys all views in ViewContainers transitively,
   * but does not destroy nested component views.
   * Removes the view from its previous viewContainer if needed.
   */
  destroyView(view:ViewRef):void {}

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
   * Installs a nested component in another view.
   * Note: only allowed if there is a dynamic component directive
   */
  setDynamicComponentView(protoView:ProtoViewRef, elementIndex:number, viewRef:ViewRef):void {}

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
  setEventDispatcher(view:ViewRef, dispatcher:EventDispatcher):void {}

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
