import {PromiseWrapper} from 'angular2/src/facade/async';
import {List, ListWrapper} from 'angular2/src/facade/collection';
import {BaseException} from 'angular2/src/facade/lang';

import {Template} from '../api';
import {CompilePipeline} from './compile_pipeline';
import {TemplateLoader} from './template_loader';
import {Parser} from 'angular2/change_detection';
import {CompileStepFactory} from './compile_step_factory';

export class Compiler {
  _templateLoader: TemplateLoader;
  _stepFactory: CompileStepFactory;

  constructor(stepFactory: CompileStepFactory, templateLoader: TemplateLoader) {
    this._templateLoader = templateLoader;
    this._stepFactory = stepFactory;
  }

  compile(template: Template) {
    var tplElement = this._templateLoader.load(template);

    if (PromiseWrapper.isPromise(tplElement)) {
      return PromiseWrapper.then(tplElement,
        (el) => this._compileTemplate(template, el),
        (_) => { throw new BaseException(`Failed to load the template "${template.id}"`); }
      );
    }
    return this._compileTemplate(template, tplElement);

  }

  // TODO(tbosch): union type return ProtoView or Promise<ProtoView>
  _compileTemplate(template: Template, tplElement) {
    var subTaskPromises = [];
    var pipeline = new CompilePipeline(this._stepFactory.createSteps(template, subTaskPromises));
    var compileElements;

    compileElements = pipeline.process(tplElement, template.id);

    var protoView = compileElements[0].inheritedProtoView
      .setComponentId(template.id).build();

    if (subTaskPromises.length > 0) {
      // The protoView is ready after all asynchronous styles are ready
      var syncProtoView = protoView;
      protoView = PromiseWrapper.all(subTaskPromises).then((_) => syncProtoView);
    }

    return protoView;
  }
}