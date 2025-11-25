/**
 * EventEmitter base class for cross-module communication
 * Similar to Amethyst's eventEmitter.ts
 */
import mitt from 'mitt';

export class EventEmitter {
  constructor() {
    this.events = mitt();
  }

  emit(event, data) {
    this.events.emit(event, data);
  }

  on(event, handler) {
    this.events.on(event, handler);
  }

  off(event, handler) {
    this.events.off(event, handler);
  }
}

