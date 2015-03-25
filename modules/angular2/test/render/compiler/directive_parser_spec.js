import {describe, beforeEach, it, xit, expect, iit, ddescribe, el} from 'angular2/test_lib';
import {isPresent, assertionsEnabled} from 'angular2/src/facade/lang';
import {ListWrapper, MapWrapper, StringMapWrapper} from 'angular2/src/facade/collection';
import {DirectiveParser} from 'angular2/src/render/compiler/directive_parser';
import {CompilePipeline} from 'angular2/src/render/compiler/compile_pipeline';
import {CompileStep} from 'angular2/src/render/compiler/compile_step';
import {CompileElement} from 'angular2/src/render/compiler/compile_element';
import {CompileControl} from 'angular2/src/render/compiler/compile_control';
import {Template, DirectiveMetadata} from 'angular2/src/render/api';
import {Lexer, Parser} from 'angular2/change_detection';

export function main() {
  describe('DirectiveParser', () => {
    var parser, annotatedDirectives;

    beforeEach( () => {
      annotatedDirectives = [
        someDecorator,
        someDecoratorIgnoringChildren,
        someDecoratorWithProps,
        someDecoratorWithEvents
      ];
      parser = new Parser(new Lexer());
    });

    function createPipeline(propertyBindings = null) {
      return new CompilePipeline([
        new MockStep( (parent, current, control) => {
          if (isPresent(propertyBindings)) {
            StringMapWrapper.forEach(propertyBindings, (ast, name) => {
              current.bindElement().bindProperty(name, ast);
            });
          }
        }),
        new DirectiveParser(parser, annotatedDirectives)
      ]);
    }

    function process(el, propertyBindings = null) {
      var pipeline = createPipeline(propertyBindings);
      return ListWrapper.map(pipeline.process(el), (ce) => ce.inheritedElementBinder );
    }

    it('should not add directives if they are not used', () => {
      var results = process(el('<div></div>'));
      expect(results[0]).toBe(null);
    });

    it('should detect directives in attributes', () => {
      var results = process(el('<div some-decor></div>'));
      expect(results[0].directives[0].directiveIndex).toBe(
        annotatedDirectives.indexOf(someDecorator)
      );
    });

    it('should compile children by default', () => {
      var results = createPipeline().process(el('<div some-decor></div>'));
      expect(results[0].compileChildren).toEqual(true);
    });

    it('should stop compiling children when specified in the directive config', () => {
      var results = createPipeline().process(el('<div some-decor-ignoring-children></div>'));
      expect(results[0].compileChildren).toEqual(false);
    });

    it('should bind directive properties from bound properties', () => {
      var results = process(
        el('<div some-decor-props></div>'),
        {
          'elProp': parser.parseBinding('someExpr', '')
        }
      );
      var directiveBinding = results[0].directives[0];
      expect(MapWrapper.get(directiveBinding.propertyBindings, 'dirProp').source)
        .toEqual('someExpr');
    });

    it('should bind directive properties with pipes', () => {
      var results = process(
        el('<div some-decor-props></div>'),
        {
          'elProp': parser.parseBinding('someExpr', '')
        }
      );
      var directiveBinding = results[0].directives[0];
      var pipedProp = MapWrapper.get(directiveBinding.propertyBindings, 'doubleProp');
      var simpleProp = MapWrapper.get(directiveBinding.propertyBindings, 'dirProp');
      expect(pipedProp.ast.name).toEqual('double');
      expect(pipedProp.ast.exp).toEqual(simpleProp.ast);
      expect(simpleProp.source).toEqual('someExpr');
    });

    it('should bind directive properties from attribute values', () => {
      var results = process(
        el('<div some-decor-props el-prop="someValue"></div>')
      );
      var directiveBinding = results[0].directives[0];
      var simpleProp = MapWrapper.get(directiveBinding.propertyBindings, 'dirProp');
      expect(simpleProp.source).toEqual('someValue');
    });

    it('should store working property setters', () => {
      var element = el('<input some-decor-props>');
      var results = process(element);
      var directiveBinding = results[0].directives[0];
      var setter = MapWrapper.get(directiveBinding.propertySetters, 'value');
      setter(element, 'abc');
      expect(element.value).toEqual('abc');
    });

    it('should bind directive events', () => {
      var results = process(
        el('<div some-decor-events></div>')
      );
      var directiveBinding = results[0].directives[0];
      expect(MapWrapper.get(directiveBinding.eventBindings, 'click').source)
        .toEqual('doIt()');
    });

    it('should not throw any errors if there is no element property bindings for a directive ' +
        'property binding', () => {
    });

  });
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

var someDecorator = new DirectiveMetadata({
  selector: '[some-decor]'
});

var someDecoratorIgnoringChildren = new DirectiveMetadata({
  selector: '[some-decor-ignoring-children]',
  compileChildren: false
});

var someDecoratorWithProps = new DirectiveMetadata({
  selector: '[some-decor-props]',
  bind: {
    'dirProp': 'elProp',
    'doubleProp': 'elProp | double'
  },
  setters: ['value']
});

var someDecoratorWithEvents = new DirectiveMetadata({
  selector: '[some-decor-events]',
  events: {
    'click': 'doIt()'
  }
});
