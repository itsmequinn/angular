import {isBlank, isPresent} from 'angular2/src/facade/lang';

import {DOM} from 'angular2/src/dom/dom_adapter';

import {CompileElement} from '../compiler/compile_element';
import {CompileControl} from '../compiler/compile_control';
import {Template} from '../api';

import {BaseEmulatedShadowDomStep} from './base_emulated_shadow_dom_step';

export class ShimShadowDomStep extends BaseEmulatedShadowDomStep {
  _contentAttribute: string;

  constructor(template: Template) {
    super();
    this._contentAttribute = _getContentAttribute(_getComponentId(template.id));
  }


  process(parent:CompileElement, current:CompileElement, control:CompileControl) {
    super.process(parent, current, control);
    if (current.ignoreBindings) {
      return;
    }

    // Shim the element as a child of the compiled component
    DOM.setAttribute(current.element, this._contentAttribute, '');
  }
}

