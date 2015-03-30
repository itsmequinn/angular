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

  describe('EmulatedUnscoped', () => {
    var styleHost;

    beforeEach(() => {
      var urlResolver = new UrlResolver();
      var styleUrlResolver = new StyleUrlResolver(urlResolver);
      styleHost = el('<div></div>');
      strategy = new EmulatedUnscopedShadowDomStrategy(styleUrlResolver, styleHost);
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

    it('should rewrite style urls', () => {
      var style = el('<div><style>.one {background-image: url("img.jpg");}</style></div>')
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);
      expect(styleElement).toHaveText(".one {background-image: url('http://base/img.jpg');}");
    });

    it('should not inline import rules', () => {
      var style = el('<div><style>@import "other.css";</style></div>')
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);
      expect(styleElement).toHaveText("@import 'http://base/other.css';");
    });

    it('should move the style element to the style host', () => {
      var style = el('<div><style>/*css*/</style></div>')
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElement = DOM.firstChild(style);
      var compileElement = new CompileElement(styleElement);
      step.process(null, compileElement, null);
      expect(styleHost).toHaveText("/*css*/");
    });

    it('should insert the same style only once in the style host', () => {
      var style = el('<div><style>/*css1*/</style><style>/*css2*/</style>' +
                        '<style>/*css1*/</style></div>')
      var template = new Template({absUrl: 'http://base'});
      var step = strategy.getStyleCompileStep(template, []);
      var styleElements = DOM.childNodes(style);
      var compileElement = new CompileElement(styleElements[0]);
      step.process(null, compileElement, null);
      compileElement = new CompileElement(styleElements[0]);
      step.process(null, compileElement, null);
      compileElement = new CompileElement(styleElements[0]);
      step.process(null, compileElement, null);

      expect(styleHost).toHaveText("/*css1*//*css2*/");
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
