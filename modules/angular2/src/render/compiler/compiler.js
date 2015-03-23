import {PromiseWrapper} from 'angular2/src/facade/async';
import {List, ListWrapper} from 'angular2/src/facade/collection';

import {Template} from '../api';
import {CompilePipeline} from './compile_pipeline';
import {TemplateLoader} from './template_loader';

import {CompileStepFactory} from './compile_step_factory';

export class Compiler {
  _templateLoader: TemplateLoader;
  _parser: Parser;
  _compileStepFactory: CompileStepFactory;

  constructor(compileStepFactory: CompileStepFactory, templateLoader: TemplateLoader) {
    this._templateLoader = templateLoader;
    this._compileStepFactory = compileStepFactory;
  }

  compile(template: Template) {
    var tplElement = this._templateLoader.load(template);

    if (PromiseWrapper.isPromise(tplElement)) {
      pvPromise = PromiseWrapper.then(tplElement,
        (el) => this._compileTemplate(template, el),
        (_) => { throw new BaseException(`Failed to load the template ${template.id}`); }
      );
      return pvPromise;
    }
    return this._compileTemplate(template, tplElement);

  }

  // TODO(tbosch): union type return ProtoView or Promise<ProtoView>
  _compileTemplate(template: Template, tplElement) {
    var subTaskPromises = [];
    var pipeline = new CompilePipeline(this._compileStepFactory.createSteps(template, subTaskPromises));
    var compileElements;

    // TODOz uncomment try/catch again
    // try {
      compileElements = pipeline.process(tplElement, template.id);
    // } catch(ex) {
    //   return PromiseWrapper.reject(ex);
    // }

    var protoView = compileElements[0].inheritedProtoView.setComponentId(template.id).build();

    if (subTaskPromises.length > 0) {
      // The protoView is ready after all asynchronous styles are ready
      var syncProtoView = protoView;
      protoView = PromiseWrapper.all(subTaskPromises).then((_) => syncProtoView);
    }

    return protoView;
  }
}