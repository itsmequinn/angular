import * as api from '../api';
import {View} from './view/view';
import {ViewContainer} from './view/view_container';
import {ProtoView} from './view/proto_view';
import {ViewFactory} from './view/view_factory';
import {Compiler} from './compiler/compiler';
import {ShadowDomStrategy} from './shadow_dom/shadow_dom_strategy';
import {EventManager} from './events/event_manager';

function _resolveViewContainer(vc:api.ViewContainerRef) {
  return _resolveView(vc.view).viewContainers[vc.viewContainerIndex];
}

function _resolveView(viewRef:api.ViewRef) {
  return viewRef.delegate;
}

function _resolveProtoView(protoViewRef:api.ProtoViewRef) {
  return protoViewRef.delegate;
}

function _wrapView(view:View) {
  return new _DirectDomViewRef(view);
}

// public so that the compiler can use it.
export class DirectDomProtoViewRef extends api.ProtoViewRef {
  delegate:ProtoView;

  constructor(delegate:ProtoView) {
    this.delegate = delegate;
  }
}

class _DirectDomViewRef extends api.ViewRef {
  delegate:View;

  constructor(delegate:View) {
    this.delegate = delegate;
  }
}

export class DirectDomRenderer extends api.Renderer {
  _compiler: Compiler;
  _viewFactory: ViewFactory;
  _shadowDomStrategy: ShadowDomStrategy;
  _evenManager: EventManager;

  constructor(
      compiler: Compiler, viewFactory: ViewFactory, shadowDomStrategy: ShadowDomStrategy,
      eventManager: EventManager) {
    super();
    this._compiler = compiler;
    this._viewFactory = viewFactory;
    this._shadowDomStrategy = shadowDomStrategy;
    this._evenManager = eventManager;
  }

  compile(template:api.Template):Promise<ProtoView> {
    // Note: compiler already uses a DirectDomProtoViewRef, so we don't
    // need to do anything here
    return this._compiler.compile(template);
  }

  createRootView(selectorOrElement, protoViewRefs:List<ProtoViewRef>):List<ViewRef> {
    // TODO: handle the child protoViews as well!
    return _wrapView(_viewFactory.getRootView(selectorOrElement));
  }

  createView(protoViewRefs:List<ProtoViewRef>):List<ViewRef> {
    // TODO!
    // return _wrapView(_viewFactory.getView(_resolveProtoView(protoViewRef)));
  }

  destroyView(viewRef:api.ViewRef) {
    this._viewFactory.returnView(this._resolveView(viewRef));
  }

  insertViewIntoContainer(vcRef:api.ViewContainerRef, viewRef:api.ViewRef, atIndex=-1):void {
    this._resolveViewContainer(vcRef).insert(_resolveView(viewRef), atIndex);
  }

  detachViewFromContainer(vcRef:api.ViewContainerRef, viewRef:api.ViewRef):void {
    this._resolveViewContainer(vcRef).detach(_resolveView(viewRef));
  }

  setElementProperty(viewRef:api.ViewRef, elementIndex:number, propertyName:string, propertyValue:any):void {
    _resolveView(viewRef).setElementProperty(elementIndex, propertyName, propertyValue);
  }

  setDynamicComponentView(viewRef:api.ViewRef, elementIndex:number, viewRef:api.ViewRef):void {
    _resolveView(viewRef).setComponentView(
      this._shadowDomStrategy,
      elementIndex,
      _resolveView(viewRef)
    );
  }

  setText(viewRef:api.ViewRef, textNodeIndex:number, text:string):void {
    _resolveView(viewRef).setText(textNodeIndex, text);
  }

  setEventDispatcher(view:ViewRef, dispatcher:api.EventDispatcher) {
    _resolveView(viewRef).setEventDispatcher(dispatcher);
  }
}
