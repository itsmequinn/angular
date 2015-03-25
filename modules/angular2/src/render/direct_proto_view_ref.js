import {ProtoViewRef} from './api';
import {ProtoView} from './view/proto_view';

export class DirectProtoViewRef extends ProtoViewRef {
  delegate:ProtoView;

  constructor(delegate:ProtoView) {
    this.delegate = delegate;
  }
}

