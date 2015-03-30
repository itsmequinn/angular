import {List} from 'angular2/src/facade/collection';

import {Parser} from 'angular2/change_detection';

import {CompileStep} from './compile_step';
import {PropertyBindingParser} from './property_binding_parser';
import {TextInterpolationParser} from './text_interpolation_parser';
import {DirectiveParser} from './directive_parser';
import {ViewSplitter} from './view_splitter';

export class CompileStepFactory {
  createSteps(template: Template, subTaskPromises: List<Promise>):List<CompileStep> {}
}

export class DefaultStepFactory extends CompileStepFactory {
  _parser: Parser;
  constructor(parser: Parser) {
    this._parser = parser;
  }

  createSteps(template: Template, subTaskPromises: List<Promise>) {
    return [
      new ViewSplitter(),
      new PropertyBindingParser(this._parser),
      new DirectiveParser(template.directives),
      new TextInterpolationParser()
    ];
  }
}