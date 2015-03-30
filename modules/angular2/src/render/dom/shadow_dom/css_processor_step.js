import {isBlank, isPresent} from 'angular2/src/facade/lang';

import {DOM} from 'angular2/src/dom/dom_adapter';

import * as NS from '../compiler/compile_step';
import {CompileElement} from '../compiler/compile_element';
import {CompileControl} from '../compiler/compile_control';

export class CssProcessorStep extends NS.CompileStep {
  process(parent:CompileElement, current:CompileElement, control:CompileControl) {
    if (DOM.tagName(current.element) == 'STYLE') {
      current.ignoreBindings = true;
      this.processStyleElement(current.element);
    }
  }

  processStyleElement(styleEl) {}
}

