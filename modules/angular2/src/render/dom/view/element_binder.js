import {AST} from 'angular2/change_detection';
import {List} from 'angular2/src/facade/collection';
import {ProtoView} from './proto_view';

export class ElementBinder {
  contentTagSelector: string;
  textNodeIndices: List<number>;
  nestedProtoView: ProtoView;
  eventLocals: List<AST>;
  constructor({
    textNodeIndices,
    contentTagSelector,
    nestedProtoView,
    eventLocals
  }) {
    this.textNodeIndices = textNodeIndices;
    this.contentTagSelector = contentTagSelector;
    this.nestedProtoView = nestedProtoView;
    this.eventLocals = eventLocals;
  }
}
