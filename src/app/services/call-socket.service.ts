// src/app/services/call-socket.service.ts
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

import config from '../../config';


@Injectable({
    providedIn: 'root'
  })
  export class CallSocketService {
    private socket: Socket;
  
    constructor() {
      this.socket = io(config.apiServer, {
        transports: ['websocket'],
        withCredentials: true,
      });
    }
  
    // ฟัง event ตอน job มีการเปลี่ยน
    onJobChanged(): Observable<any> {
      return new Observable(observer => {
        const handler = (data: any) => observer.next(data);
  
        this.socket.on('palletLabel:changed', handler);
  
        // cleanup ตอน unsubscribe
        return () => {
          this.socket.off('palletLabel:changed', handler);
        };
      });
    }
    
  }

