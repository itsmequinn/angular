import {isBlank, isPresent} from 'angular2/src/facade/lang';
import {List, ListWrapper, MapWrapper, Map} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/dom/dom_adapter';

import {Template} from '../api';

import {CssProcessorStep} from './css_processor_step';
import {StyleUrlResolver} from './style_url_resolver';
import {insertSharedStyleText} from './util';

export class EmulatedUnscopedCssStep extends CssProcessorStep {
  _templateUrl: string;
  _styleUrlResolver: StyleUrlResolver;
  _styleHost;

  constructor(template: Template, styleUrlResolver: StyleUrlResolver, styleHost, stylePromises: List<Promise>) {
    super();
    this._templateUrl = template.absUrl;
    this._styleUrlResolver = styleUrlResolver;
    this._styleHost = styleHost;
  }

  processStyleElement(styleEl) {
    var cssText = DOM.getText(styleEl);
    cssText = this._styleUrlResolver.resolveUrls(cssText, this._templateUrl);
    DOM.setText(styleEl, cssText);
    DOM.remove(styleEl);

    insertSharedStyleText(cssText, this._styleHost, styleEl);
  }
}
