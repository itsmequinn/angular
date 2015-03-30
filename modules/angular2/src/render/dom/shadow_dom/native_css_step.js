import {isBlank, isPresent} from 'angular2/src/facade/lang';

import {DOM} from 'angular2/src/dom/dom_adapter';

import {StyleUrlResolver} from './style_url_resolver';
import {CssProcessorStep} from './css_processor_step';

export class NativeCssStep extends CssProcessorStep {
  _styleUrlResolver: StyleUrlResolver;
  _templateUrl: string;

  constructor(templateUrl: string, styleUrlResover: StyleUrlResolver) {
    super();
    this._styleUrlResolver = styleUrlResover;
    this._templateUrl = templateUrl;
  }

  processStyleElement(styleEl) {
    var cssText = DOM.getText(styleEl);
    cssText = this._styleUrlResolver.resolveUrls(cssText, this._templateUrl);
    DOM.setText(styleEl, cssText);
  }
}
