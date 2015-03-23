import {
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  el,
  expect,
  iit,
  inject,
  IS_DARTIUM,
  it,
} from 'angular2/test_lib';

import {DOM} from 'angular2/src/dom/dom_adapter';
import {List, ListWrapper, Map, MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {Type, isBlank, stringify, isPresent} from 'angular2/src/facade/lang';
import {PromiseWrapper} from 'angular2/src/facade/async';

import {Compiler, CompilerCache} from 'angular2/src/render/compiler/compiler';
import {ProtoView} from 'angular2/src/render/api';
import {CompileElement} from 'angular2/src/render/compiler/compile_element';
import {CompileStep} from 'angular2/src/render/compiler/compile_step'
import {CompileStepFactory} from 'angular2/src/render/compiler/compile_step_factory';
import {CompileControl} from 'angular2/src/render/compiler/compile_control';
import {TemplateLoader} from 'angular2/src/render/compiler/template_loader';

export function runCompilerCommonTests() {
  xdescribe('compiler', function() {

    function createCompiler(processClosure) {
      var tplLoader =  new FakeTemplateLoader();
      return new Compiler(new MockStepFactory([new MockStep(processClosure)]), tplLoader);
    }

    iit('should run the steps and build the ProtoView of the root element', () => {
      var compiler = createCompiler((parent, current, control) => {
        current.inheritedProtoView.bindVariable('a', 'b');
      });
      var protoView = compiler.compile(new Template({
        inline: '<div></div>'
      }));
      expect(protoView.variableBindings).toEqual(MapWrapper.createFromStringMap({
        'a': 'b'
      }));
    });

    it('should save the component id into the ProtoView', () => {
      var compiler = createCompiler((parent, current, control) => {
        current.inheritedProtoView.bindVariable('a', 'b');
      });
      var protoView = compiler.compile(new Template({
        id: 'someId',
        inline: '<div></div>'
      }));
      expect(protoView.componentId).toBe('someId');
    });

    it('should use the inline template and compile in sync', () => {
      var compiler = createCompiler( (parent, current, control) => {
        current.inheritedProtoView = new ProtoView(current.element, null, null);
      });
      var protoView = compiler.compile(MainComponent);
      expect(DOM.getInnerHTML(protoView.element)).toEqual('inline component');
      async.done();
    });

    it('should load url templates', inject([AsyncTestCompleter], (async) => {
      var compiler = createCompiler( (parent, current, control) => {
        current.inheritedProtoView = new ProtoView(current.element, null, null);
      });
      compiler.compile(MainComponent).then( (protoView) => {
        expect(DOM.getInnerHTML(protoView.element)).toEqual('inline component');
        async.done();
      });
    }));

    it('should wait for async subtasks to be resolved', inject([AsyncTestCompleter], (async) => {
      var subTasksCompleted = false;

      var completer = PromiseWrapper.completer();

      var compiler = createCompiler( (parent, current, control) => {
        var protoView = new ProtoView(current.element, null, null);
        ListWrapper.push(protoView.stylePromises, completer.promise.then((_) => {
          subTasksCompleted = true;
        }));
        current.inheritedProtoView = protoView;
      });

      // It should always return a Promise because the subtask is async
      var pvPromise = compiler.compile(MainComponent);
      expect(pvPromise).toBePromise();
      expect(subTasksCompleted).toEqual(false);

      // The Promise should resolve after the subtask is ready
      completer.resolve(null);
      pvPromise.then((protoView) => {
        expect(subTasksCompleted).toEqual(true);
        async.done();
      });
    }));

  });

}

class MockStepFactory extends CompileStepFactory {
  steps:List<CompileStep>;
  constructor(steps) {
    this.steps = steps;
  }
  createSteps() {
    return steps;
  }
}

class MockStep extends CompileStep {
  processClosure:Function;
  constructor(process) {
    super();
    this.processClosure = process;
  }
  process(parent:CompileElement, current:CompileElement, control:CompileControl) {
    this.processClosure(parent, current, control);
  }
}

class FakeTemplateLoader extends TemplateLoader {
  constructor() {
    super(null, new UrlResolver());
  }

  load(template: Template) {
    if (isPresent(template.inline)) {
      return DOM.createTemplate(template.inline);
    }

    if (isPresent(template.url)) {
      var tplElement = DOM.createTemplate(template.url);
      return PromiseWrapper.resolve(tplElement);
    }

    return PromiseWrapper.reject('Fail to load');
  }
}
