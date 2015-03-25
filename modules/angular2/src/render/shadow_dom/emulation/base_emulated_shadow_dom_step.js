import {isBlank, isPresent, StringWrapper, assertionsEnabled} from 'angular2/src/facade/lang';
import {MapWrapper} from 'angular2/src/facade/collection';

import {DOM} from 'angular2/src/dom/dom_adapter';

import * as viewModule from '../../view/view';
import * as NS from '../../compiler/compile_step';
import {CompileElement} from '../../compiler/compile_element';
import {CompileControl} from '../../compiler/compile_control';

export class BaseEmulatedShadowDomStep extends NS.CompileStep {
  process(parent:CompileElement, current:CompileElement, control:CompileControl) {
    if (current.ignoreBindings) {
      return;
    }
    var nodeName = DOM.nodeName(current.element);
    if (StringWrapper.equals(nodeName.toUpperCase(), 'CONTENT')) {
      var attrs = current.attrs();
      var selector = MapWrapper.get(attrs, 'select');
      selector = isPresent(selector) ? selector : '';
      current.bindElement().setContentTagSelector(selector);

      var contentStart = DOM.createScriptTag('type', 'ng/contentStart');
      if (assertionsEnabled()) {
        DOM.setAttribute(contentStart, 'select', selector);
      }
      var contentEnd = DOM.createScriptTag('type', 'ng/contentEnd');
      DOM.insertBefore(current.element, contentStart);
      DOM.insertBefore(current.element, contentEnd);
      DOM.remove(current.element);

      current.element = contentStart;
    }
  }

}
