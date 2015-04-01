import {AST} from 'angular2/change_detection';
import {isPresent, isBlank, BaseException} from 'angular2/src/facade/lang';
import {List, ListWrapper} from 'angular2/src/facade/collection';
import {ProtoView} from './proto_view';

/**
 * Note: Code that uses this class assumes that is immutable!
 */
export class ElementBinder {
  contentTagSelector: string;
  textNodeIndices: List<number>;
  nestedProtoView: ProtoView;
  eventLocals: AST;
  eventNames: List<string>;
  componentId: string;
  parentIndex:number;

  constructor({
    textNodeIndices,
    contentTagSelector,
    nestedProtoView,
    componentId,
    eventLocals,
    eventNames,
    parentIndex
  }) {
    this.textNodeIndices = textNodeIndices;
    this.contentTagSelector = contentTagSelector;
    this.nestedProtoView = nestedProtoView;
    this.componentId = componentId;
    this.eventLocals = eventLocals;
    this.eventNames = eventNames;
    this.parentIndex = parentIndex;
  }

  mergeChildComponentProtoView(protoView:ProtoView):ElementBinder {
    if (isBlank(this.componentId)) {
      throw new BaseException(`There is no component at this place!`);
    }
    return new ElementBinder({
      parentIndex: this.parentIndex,
      // Don't clone as we assume immutability!
      textNodeIndices: this.textNodeIndices,
      contentTagSelector: this.contentTagSelector,
      nestedProtoView: protoView,
      componentId: this.componentId,
      // Don't clone as we assume immutability!
      eventLocals: this.eventLocals,
      eventNames: this.eventNames
    });
  }
}
