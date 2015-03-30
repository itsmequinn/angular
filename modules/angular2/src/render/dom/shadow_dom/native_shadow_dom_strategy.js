import {isBlank, isPresent} from 'angular2/src/facade/lang';
import {List, ListWrapper} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/dom/dom_adapter';

import * as viewModule from '../view/view';
import * as NS from '../compiler/compile_step';
import {Template} from '../../api';

import {StyleUrlResolver} from './style_url_resolver';
import {ShadowDomStrategy} from './shadow_dom_strategy';
import {moveViewNodesIntoParent} from './util';
import {NativeCssStep} from './native_css_step';

/**
 * This strategies uses the native Shadow DOM support.
 *
 * The templates for the component are inserted in a Shadow Root created on the component element.
 * Hence they are strictly isolated.
 */
export class NativeShadowDomStrategy extends ShadowDomStrategy {
  _styleUrlResolver: StyleUrlResolver;

  constructor(styleUrlResolver: StyleUrlResolver) {
    super();
    this._styleUrlResolver = styleUrlResolver;
  }

  attachTemplate(el, view:viewModule.View){
    moveViewNodesIntoParent(DOM.createShadowRoot(el), view);
  }

  getStyleCompileStep(template: Template, stylePromises: List<Promise>): NS.CompileStep {
    return new NativeCssStep(template.absUrl, this._styleUrlResolver);
  }
}
