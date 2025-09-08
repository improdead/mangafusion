import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export type EventPayload =
  | { type: 'planning_started'; episodeId: string; message?: string }
  | { type: 'planning_progress'; episodeId: string; message?: string }
  | { type: 'planning_complete'; episodeId: string; message?: string }
  | { type: 'page_progress'; episodeId: string; page: number; pct: number }
  | { type: 'page_done'; episodeId: string; page: number; imageUrl: string; seed: number; version: number }
  | { type: 'page_failed'; episodeId: string; page: number; error: string };

export class EventsService {
  private streams = new Map<string, Subject<EventPayload>>();

  private ensureStream(episodeId: string): Subject<EventPayload> {
    let s = this.streams.get(episodeId);
    if (!s) {
      s = new Subject<EventPayload>();
      this.streams.set(episodeId, s);
    }
    return s;
  }

  emit(episodeId: string, event: EventPayload) {
    this.ensureStream(episodeId).next(event);
  }

  stream(episodeId: string): Observable<{ data: EventPayload }> {
    return this.ensureStream(episodeId).asObservable().pipe(map((e) => ({ data: e })));
  }
}

