import {isBlank, isPresent} from 'angular2/src/facade/lang';

import * as viewModule from '../view/view';
import * as NS from '../compiler/compile_step';
import {CompileElement} from '../compiler/compile_element';
import {CompileControl} from '../compiler/compile_control';
import {Template} from '../api';

import {LightDom} from './emulation/light_dom';


var _EMPTY_STEP;

// Note: fill _EMPTY_STEP to prevent
// problems from cyclic dependencies
function _emptyStep() {
  if (isBlank(_EMPTY_STEP)) {
    _EMPTY_STEP = new _EmptyCompileStep();
  }
  return _EMPTY_STEP;
}

export class ShadowDomStrategy {
  attachTemplate(el, view:viewModule.View) {}
  constructLightDom(lightDomView:viewModule.View, shadowDomView:viewModule.View, el): LightDom { return null; }

  /**
   * An optional step that can modify the template style elements.
   *
   * @param {Template} template
   * @param {List<Promise>} stylePromises
   * @returns {CompileStep} a compile step to append to the compiler pipeline
   */
  getStyleCompileStep(template: Template, stylePromises: List<Promise>): NS.CompileStep {
    return _emptyStep();
  }

  /**
   * An optional step that can modify the template elements (style elements exlcuded).
   *
   * This step could be used to modify the template in order to scope the styles.
   *
   * @param {Template} template
   * @returns {CompileStep} a compile step to append to the compiler pipeline
   */
  getTemplateCompileStep(template: Template): NS.CompileStep { return _emptyStep(); }
}


class _EmptyCompileStep extends NS.CompileStep {
  process(parent:CompileElement, current:CompileElement, control:CompileControl) {
  }
}

