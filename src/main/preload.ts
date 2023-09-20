import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example' | 'parse-csv';

const electronHandler = {
  ipcRenderer: {
    send: (channel: Channels, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
    on: (
      channel: Channels,
      listener: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => {
      ipcRenderer.on(channel, listener);
      return () => {
        ipcRenderer.removeListener(channel, listener);
      };
    },
    once: (
      channel: Channels,
      listener: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => {
      ipcRenderer.once(channel, (_, arg) => {
        listener(arg);
      });
    },
    removeListener: (
      channel: Channels,
      listener: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => {
      ipcRenderer.removeListener(channel, listener);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
