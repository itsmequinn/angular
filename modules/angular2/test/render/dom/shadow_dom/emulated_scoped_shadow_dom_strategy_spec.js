import {
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  el,
  expect,
  iit,
  inject,
  it,
  xit,
  SpyObject,
} from 'angular2/test_lib';

import {
  NativeShadowDomStrategy
} from 'angular2/src/render/dom/shadow_dom/native_shadow_dom_strategy';
import {
  EmulatedScopedShadowDomStrategy,
} from 'angular2/src/render/dom/shadow_dom/emulated_scoped_shadow_dom_strategy';
import {
  EmulatedUnscopedShadowDomStrategy,
} from 'angular2/src/render/dom/shadow_dom/emulated_unscoped_shadow_dom_strategy';
import {
  resetShadowDomCache,
} from 'angular2/src/render/dom/shadow_dom/util';
import {UrlResolver} from 'angular2/src/services/url_resolver';
import {StyleUrlResolver} from 'angular2/src/render/dom/shadow_dom/style_url_resolver';
import {StyleInliner} from 'angular2/src/render/dom/shadow_dom/style_inliner';
import {ProtoView} from 'angular2/src/render/dom/view/proto_view';
import {ProtoViewBuilder} from 'angular2/src/render/dom/view/proto_view_builder';
import {ViewFactory} from 'angular2/src/render/dom/view/view_factory';
import {
  DirectiveMetadata,
  Template
} from 'angular2/src/render/api';

import {CompileElement} from 'angular2/src/render/dom/compiler/compile_element';

import {XHR} from 'angular2/src/services/xhr';

import {isPresent, isBlank} from 'angular2/src/facade/lang';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {Map, MapWrapper} from 'angular2/src/facade/collection';
import {PromiseWrapper, Promise} from 'angular2/src/facade/async';

export function main() {
  var strategy;
  describe('EmulatedScoped', () => {
    var xhr, styleHost;

    beforeEach(() => {
      var urlResolver = new UrlResolver();
      var styleUrlResolver = new StyleUrlResolver(urlResolver);
      xhr = new FakeXHR();
      var styleInliner = new StyleInliner(xhr, styleUrlResolver, urlResolver);
      styleHost = el('<div></div>');
      strategy = new EmulatedScopedShadowDomStrategy(styleInliner, styleUrlResolver, styleHost);
      resetShadowDomCache();
    });

    it('should attach the view nodes as child of the host element', () => {
      var host = el('<div><span>original content</span></div>');
      var nodes = el('<div>view</div>');
      var pv = new ProtoView({
        element: nodes,
        elementBinders: [],
        instantiateInPlace: false
      });
      var vf = new ViewFactory(0, null);
      var view = vf.getView(pv);

      strategy.attachTemplate(host, view);
      var firstChild = DOM.firstChild(host);
      expect(DOM.tagName(firstChild).toLowerCase()).toEqual('div');
      expect(firstChild).toHaveText('view');
      expect(host).toHaveText('view');
    });

    it('should mark the host element when a child view is attached', () => {
      var host = el('<div><span>original content</span></div>');
      var nodes = el('<div>view</div>');
      var pv = new ProtoView({
        element: nodes,
        elementBinders: [],
        instantiateInPlace: false
      });
      var vf = new ViewFactory(0, null);
      var view = vf.getView(pv);

      strategy.attachTemplate(host, view);
      var firstChild = DOM.firstChild(host);
      expect(host).toHaveText('view');
      expect(DOM.getAttribute(host, '_nghost-0')).toEqual('');
    });

    it('should rewrite style urls', () => {
      var style = el('<div><style>.foo {background-image: url("img.jpg");}</style></div>');
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);
      expect(styleElement).toHaveText(".foo[_ngcontent-0] {\n" +
        "background-image: url(http://base/img.jpg);\n" +
        "}");
    });

    it('should scope styles', () => {
      var style = el('<div><style>.foo {} :host {}</style></div>');
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);
      expect(styleElement).toHaveText(".foo[_ngcontent-0] {\n\n}\n\n[_nghost-0] {\n\n}");
    });

    it('should inline @import rules', inject([AsyncTestCompleter], (async) => {
      xhr.reply('http://base/one.css', '.one {}');

      var style = el('<div><style>@import "one.css";</style></div>');
      var template = new Template({absUrl: 'http://base'});
      var stylePromises = [];
      var step = strategy.getStyleCompileStep(template, stylePromises);
      var styleElement = DOM.firstChild(style);
      var parentElement = new CompileElement(style);
      var compileElement = new CompileElement(styleElement);
      step.process(parentElement, compileElement, null);

      expect(stylePromises.length).toEqual(1);
      expect(stylePromises[0]).toBePromise();

      expect(styleElement).toHaveText('');
      stylePromises[0].then((_) => {
        expect(styleElement).toHaveText('.one[_ngcontent-0] {\n\n}');
        async.done();
      });
    }));

    it('should return the same style given the same component', () => {
      var style = el('<div><style>.foo {} :host {}</style></div>');
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);

      var style2 = el('<div><style>.foo {} :host {}</style></div>');
      var step2 = strategy.getStyleCompileStep(template, []);
      var styleElement2 = DOM.firstChild(style2);
      var compileElement2 = new CompileElement(styleElement2);
      step2.process(null, compileElement2, null);

      expect(DOM.getText(styleElement)).toEqual(DOM.getText(styleElement2));
    });

    it('should return different styles given different components', () => {
      var template = new Template({id: '1', absUrl: 'http://base'});

      var style = el('<div><style>.foo {} :host {}</style></div>');
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);

      var style2 = el('<div><style>.foo {} :host {}</style></div>');
      var template2 = new Template({id: '2', absUrl: 'http://base'});
      var step2 = strategy.getStyleCompileStep(template2, []);
      var styleElement2 = DOM.firstChild(style2);
      var compileElement2 = new CompileElement(styleElement2);
      step2.process(null, compileElement2, null);

      expect(DOM.getText(styleElement)).not.toEqual(DOM.getText(styleElement2));
    });

    it('should move the style element to the style host', () => {
      var style = el('<div><style>.one {}</style></div>');
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);
      expect(style).toHaveText('');
      expect(styleHost).toHaveText('.one[_ngcontent-0] {\n\n}');
    });

    it('should add an attribute to the content elements', () => {
      var style = el('<div></div>');
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getTemplateCompileStep(template);
      var compileElement = new CompileElement(style);
      step.process(null, compileElement, null);
      expect(DOM.getAttribute(style, '_ngcontent-0')).toEqual('');
    });

    it('should ignore bindings on style elements', () => {
      var tmpl = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(tmpl, []);
      var styleElement = DOM.createStyleElement('');
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);
      expect(compileElement.ignoreBindings).toBe(true);
    });

    it('should not change non style elements', () => {
      var tmpl = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(tmpl, []);
      var element = el('<div>a</div>');
      step.process(null, new CompileElement(element), null);
      expect(DOM.getOuterHTML(element)).toEqual('<div>a</div>');
    });
  });
}

class FakeXHR extends XHR {
  _responses: Map;

  constructor() {
    super();
    this._responses = MapWrapper.create();
  }

  get(url: string): Promise<string> {
    var response = MapWrapper.get(this._responses, url);
    if (isBlank(response)) {
      return PromiseWrapper.reject('xhr error');
    }

    return PromiseWrapper.resolve(response);
  }

  reply(url: string, response: string) {
    MapWrapper.set(this._responses, url, response);
  }
}
