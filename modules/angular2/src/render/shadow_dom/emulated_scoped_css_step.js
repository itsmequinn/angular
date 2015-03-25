import {isBlank, isPresent, int, StringWrapper, assertionsEnabled} from 'angular2/src/facade/lang';
import {List, ListWrapper, MapWrapper, Map} from 'angular2/src/facade/collection';
import {PromiseWrapper} from 'angular2/src/facade/async';

import {DOM} from 'angular2/src/dom/dom_adapter';

import {CompileElement} from '../compiler/compile_element';
import {CompileControl} from '../compiler/compile_control';
import {Template} from '../api';

import {StyleInliner} from './style_inliner';
import {StyleUrlResolver} from './style_url_resolver';
import {CssProcessorStep} from './css_processor_step';
import {shimCssForComponent, insertStyleElement} from './util';

export class EmulatedScopedCssStep extends CssProcessorStep {
  _templateUrl: string;
  _template: Template;
  _styleInliner: StyleInliner;
  _styleUrlResolver: StyleUrlResolver;
  _styleHost;
  _stylePromises;

  constructor(template: Template, styleInliner: StyleInliner,
    styleUrlResolver: StyleUrlResolver, styleHost, stylePromises: List<Promise>) {
    super();
    this._template = template;
    this._styleInliner = styleInliner;
    this._styleUrlResolver = styleUrlResolver;
    this._styleHost = styleHost;
    this._stylePromises = stylePromises;
  }

  processStyleElement(styleEl) {
    var cssText = DOM.getText(styleEl);

    cssText = this._styleUrlResolver.resolveUrls(cssText, this._template.absUrl);
    var css = this._styleInliner.inlineImports(cssText, this._template.absUrl);

    if (PromiseWrapper.isPromise(css)) {
      DOM.setText(styleEl, '');
      ListWrapper.push(this._stylePromises, css);
      return css.then((css) => {
        css = shimCssForComponent(css, this._template.id);
        DOM.setText(styleEl, css);
      });
    } else {
      css = shimCssForComponent(css, this._template.id);
      DOM.setText(styleEl, css);
    }

    DOM.remove(styleEl);
    insertStyleElement(this._styleHost, styleEl);
  }
}
