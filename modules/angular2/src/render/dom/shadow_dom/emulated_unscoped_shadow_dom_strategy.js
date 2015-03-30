import {isBlank, isPresent} from 'angular2/src/facade/lang';
import {List, ListWrapper} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/dom/dom_adapter';

import * as viewModule from '../view/view';
import * as NS from '../compiler/compile_step';
import {Template} from '../../api';

import {LightDom} from './light_dom';
import {ShadowDomStrategy} from './shadow_dom_strategy';
import {StyleUrlResolver} from './style_url_resolver';
import {EmulatedUnscopedCssStep} from './emulated_unscoped_css_step';
import {BaseEmulatedShadowDomStep} from './base_emulated_shadow_dom_step';
import {moveViewNodesIntoParent} from './util';

/**
 * This strategy emulates the Shadow DOM for the templates, styles **excluded**:
 * - components templates are added as children of their component element,
 * - styles are moved from the templates to the styleHost (i.e. the document head).
 *
 * Notes:
 * - styles are **not** scoped to their component and will apply to the whole document,
 * - you can **not** use shadow DOM specific selectors in the styles
 */
export class EmulatedUnscopedShadowDomStrategy extends ShadowDomStrategy {
  styleUrlResolver: StyleUrlResolver;
  styleHost;

  constructor(styleUrlResolver: StyleUrlResolver, styleHost) {
    super();
    this.styleUrlResolver = styleUrlResolver;
    this.styleHost = styleHost;
  }

  attachTemplate(el, view:viewModule.View) {
    DOM.clearNodes(el);
    moveViewNodesIntoParent(el, view);
  }

  constructLightDom(lightDomView:viewModule.View, shadowDomView:viewModule.View, el): LightDom {
    return new LightDom(lightDomView, shadowDomView, el);
  }

  getStyleCompileStep(template: Template, stylePromises: List<Promise>): NS.CompileStep {
    return new EmulatedUnscopedCssStep(template, this.styleUrlResolver,
      this.styleHost, stylePromises);
  }

  getTemplateCompileStep(template: Template): NS.CompileStep {
    return new BaseEmulatedShadowDomStep();
  }
}