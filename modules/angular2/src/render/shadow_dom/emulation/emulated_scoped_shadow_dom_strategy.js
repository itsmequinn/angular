import {isBlank, isPresent} from 'angular2/src/facade/lang';
import {List, ListWrapper} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/dom/dom_adapter';

import * as viewModule from '../../view/view';
import * as NS from '../../compiler/compile_step';
import {Template} from '../../api';

import {StyleInliner} from './style_inliner';
import {StyleUrlResolver} from '../style_url_resolver';
import {EmulatedUnscopedShadowDomStrategy} from './emulated_unscoped_shadow_dom_strategy';

/**
 * This strategy emulates the Shadow DOM for the templates, styles **included**:
 * - components templates are added as children of their component element,
 * - both the template and the styles are modified so that styles are scoped to the component
 *   they belong to,
 * - styles are moved from the templates to the styleHost (i.e. the document head).
 *
 * Notes:
 * - styles are scoped to their component and will apply only to it,
 * - a common subset of shadow DOM selectors are supported,
 * - see `ShadowCss` for more information and limitations.
 */
export class EmulatedScopedShadowDomStrategy extends EmulatedUnscopedShadowDomStrategy {
  _styleInliner: StyleInliner;

  constructor(styleInliner: StyleInliner, styleUrlResolver: StyleUrlResolver, styleHost) {
    super(styleUrlResolver, styleHost);
    this._styleInliner = styleInliner;
  }

  attachTemplate(el, view:viewModule.View) {
    super.attachTemplate(el, view);

    var hostAttribute = _getHostAttribute(_getComponentId(view.proto.componentId));
    DOM.setAttribute(el, hostAttribute, '');
  }

  getStyleCompileStep(template: Template, stylePromises: List<Promise>): NS.CompileStep {
    return new _EmulatedScopedCssStep(template, this._styleInliner,
      this._styleUrlResolver, this._styleHost, stylePromises);
  }

  getTemplateCompileStep(template: Template): NS.CompileStep {
    return new _ShimShadowDomStep(template);
  }
}
