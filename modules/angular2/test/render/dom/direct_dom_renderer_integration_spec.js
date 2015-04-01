import {
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  el,
  elementText,
  expect,
  iit,
  inject,
  it,
  xit,
  SpyObject,
} from 'angular2/test_lib';

import {isBlank, isPresent} from 'angular2/src/facade/lang';
import {MapWrapper, ListWrapper} from 'angular2/src/facade/collection';
import {PromiseWrapper, Promise} from 'angular2/src/facade/async';
import {DOM} from 'angular2/src/dom/dom_adapter';

import {Parser, Lexer} from 'angular2/change_detection';
import {DirectDomRenderer} from 'angular2/src/render/dom/direct_dom_renderer';
import {Compiler} from 'angular2/src/render/dom/compiler/compiler';
import {ProtoView, Template, ViewContainerRef, EventDispatcher} from 'angular2/src/render/api';
import {DefaultStepFactory} from 'angular2/src/render/dom/compiler/compile_step_factory';
import {TemplateLoader} from 'angular2/src/render/dom/compiler/template_loader';
import {UrlResolver} from 'angular2/src/services/url_resolver';
import {ShadowDomStrategy} from 'angular2/src/render/dom/shadow_dom/shadow_dom_strategy';
import {EmulatedUnscopedShadowDomStrategy} from 'angular2/src/render/dom/shadow_dom/emulated_unscoped_shadow_dom_strategy';
import {EventManager, EventManagerPlugin} from 'angular2/src/render/dom/events/event_manager';
import {VmTurnZone} from 'angular2/src/core/zone/vm_turn_zone';
import {StyleUrlResolver} from 'angular2/src/render/dom/shadow_dom/style_url_resolver';
import {ViewFactory} from 'angular2/src/render/dom/view/view_factory';

export function main() {
  describe('DirectDomRenderer integration', () => {
    var renderer, parser, rootEl, rootProtoViewRef, eventPlugin;

    function createRenderer({urlData, viewCacheCapacity, shadowDomStrategy}) {
      parser = new Parser(new Lexer());
      var urlResolver = new UrlResolver();
      var compiler = new Compiler(new DefaultStepFactory(parser), new FakeTemplateLoader(urlResolver, urlData));

      if (isBlank(shadowDomStrategy)) {
        shadowDomStrategy = new EmulatedUnscopedShadowDomStrategy(new StyleUrlResolver(urlResolver), null);
      }
      if (isBlank(viewCacheCapacity)) {
        viewCacheCapacity = 1;
      }
      if (isBlank(urlData)) {
        urlData = MapWrapper.create();
      }
      eventPlugin = new FakeEventManagerPlugin();
      var eventManager = new EventManager([eventPlugin], new FakeVmTurnZone());
      var viewFactory = new ViewFactory(viewCacheCapacity, eventManager, shadowDomStrategy);
      renderer = new DirectDomRenderer(compiler, viewFactory, shadowDomStrategy, eventManager);

      rootEl = el('<div></div>');
      rootProtoViewRef = renderer.createRootProtoView(rootEl);
    }

    function mergeStaticComponent(parentProtoViewRef, childProtoView) {
      return renderer.mergeChildComponentProtoViews(parentProtoViewRef, [childProtoView.render]);
    }

    it('should create root views while using the given elements in place', () => {
      createRenderer();
      var viewRefs = renderer.createView(rootProtoViewRef);
      expect(viewRefs.length).toBe(1);
      expect(viewRefs[0].delegate.rootNodes[0]).toEqual(el);
    });

    it('should add a static component', inject([AsyncTestCompleter], (async) => {
      createRenderer();
      var template = new Template({
        id: 'someComponent',
        inline: 'hello',
        directives: []
      });
      renderer.compile(template).then( (pv) => {
        var mergedProtoViewRef = renderer.mergeChildComponentProtoViews(rootProtoViewRef, [pv.render]);
        renderer.createView(mergedProtoViewRef);
        expect(rootEl).toHaveText('hello');
        async.done();
      });
    }));

    it('should add a a dynamic component', inject([AsyncTestCompleter], (async) => {
      createRenderer();
      var template = new Template({
        id: 'someComponent',
        inline: 'hello',
        directives: []
      });
      renderer.compile(template).then( (pv) => {
        var rootViewRef = renderer.createView(rootProtoViewRef)[0];
        var childComponentViewRef = renderer.createView(pv.render)[0];
        renderer.setDynamicComponentView(rootViewRef, 0, childComponentViewRef);
        expect(rootEl).toHaveText('hello');
        async.done();
      });
    }));

    it('should update text nodes', inject([AsyncTestCompleter], (async) => {
      createRenderer();
      var template = new Template({
        id: 'someComponent',
        inline: '{{a}}',
        directives: []
      });
      renderer.compile(template).then( (pv) => {
        var viewRefs = renderer.createView(mergeStaticComponent(rootProtoViewRef, pv));
        renderer.setText(viewRefs[1], 0, 'hello');
        expect(rootEl).toHaveText('hello');
        async.done();
      });
    }));

    it('should update element properties', inject([AsyncTestCompleter], (async) => {
      createRenderer();
      var template = new Template({
        id: 'someComponent',
        inline: '<input [value]="someProp">',
        directives: []
      });
      renderer.compile(template).then( (pv) => {
        var viewRefs = renderer.createView(mergeStaticComponent(rootProtoViewRef, pv));
        renderer.setElementProperty(viewRefs[1], 0, 'value', 'hello');
        expect(DOM.childNodes(rootEl)[0].value).toEqual('hello');
        async.done();
      });
    }));

    it('should add and remove views to and from containers', inject([AsyncTestCompleter], (async) => {
      createRenderer();
      var template = new Template({
        id: 'someComponent',
        inline: '<template>hello</template>',
        directives: []
      });
      renderer.compile(template).then( (pv) => {
        var viewRef = renderer.createView(mergeStaticComponent(rootProtoViewRef, pv))[1];
        var childViewRef = renderer.createView(pv.elementBinders[0].nestedProtoView.render)[0];
        var vcRef = new ViewContainerRef(viewRef, 0);
        expect(rootEl).toHaveText('');
        renderer.insertViewIntoContainer(vcRef, childViewRef);
        expect(rootEl).toHaveText('hello');
        renderer.detachViewFromContainer(vcRef, 0);
        expect(rootEl).toHaveText('');

        async.done();
      });
    }));

    it('should cache views', inject([AsyncTestCompleter], (async) => {
      createRenderer({
        viewCacheCapacity: 2
      });
      var template = new Template({
        id: 'someComponent',
        inline: '<template>hello</template>',
        directives: []
      });
      renderer.compile(template).then( (pv) => {
        var viewRef1 = renderer.createView(pv.render)[0];
        renderer.destroyView(viewRef1);
        var viewRef2 = renderer.createView(pv.render)[0];
        var viewRef3 = renderer.createView(pv.render)[0];
        expect(viewRef2.delegate).toBe(viewRef1.delegate);
        expect(viewRef3.delegate).not.toBe(viewRef1.delegate);

        async.done();
      });
    }));

    it('should handle events', inject([AsyncTestCompleter], (async) => {
      createRenderer();
      var template = new Template({
        id: 'someComponent',
        inline: '<input (change)="$event.target.value">',
        directives: []
      });
      renderer.compile(template).then( (pv) => {
        var viewRef = renderer.createView(mergeStaticComponent(rootProtoViewRef, pv))[1];
        var dispatcher = new LoggingEventDispatcher();
        renderer.setEventDispatcher(viewRef, dispatcher);
        var inputEl = DOM.childNodes(rootEl)[0];
        inputEl.value = 'hello';
        eventPlugin.dispatchEvent('change', new FakeEvent(inputEl));
        expect(dispatcher.log).toEqual([[0, 'change', ['hello']]]);
        async.done();
      });

    }));

  });
}

class FakeTemplateLoader extends TemplateLoader {
  _urlData: Map<string, string>;

  constructor(urlResolver, urlData) {
    super(null, urlResolver);
    this._urlData = urlData;
  }

  load(template: Template) {
    if (isPresent(template.inline)) {
      return PromiseWrapper.resolve(DOM.createTemplate(template.inline));
    }

    if (isPresent(template.absUrl)) {
      var content = this._urlData[template.absUrl];
      if (isPresent(content)) {
        return PromiseWrapper.resolve(DOM.createTemplate(content));
      }
    }

    return PromiseWrapper.reject('Load failed');
  }
}

class FakeVmTurnZone extends VmTurnZone {
  constructor() {
    super({enableLongStackTrace: false});
  }

  run(fn) {
    fn();
  }

  runOutsideAngular(fn) {
    fn();
  }
}

class FakeEventManagerPlugin extends EventManagerPlugin {
  _eventHandlers: Map;

  constructor() {
    super();
    this._eventHandlers = MapWrapper.create();
  }

  dispatchEvent(eventName, event) {
    MapWrapper.get(this._eventHandlers, eventName)(event);
  }

  supports(eventName: string): boolean {
    return true;
  }

  addEventListener(element, eventName: string, handler: Function, shouldSupportBubble: boolean) {
    MapWrapper.set(_eventHandlers, eventName, handler);
  }
}

class LoggingEventDispatcher extends EventDispatcher {
  log:List;
  constructor() {
    this.log = [];
  }
  dispatchEvent(
    elementIndex:number, eventName:string, locals:List<any>
  ) {
    ListWrapper.push(this.log, [elementIndex, eventName, locals]);
  }
}

class FakeEvent {
  target;
  constructor(target) {
    this.target = target;
  }
}