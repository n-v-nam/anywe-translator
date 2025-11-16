const { contextBridge, ipcRenderer } = require('electron')

const createListener = (channel) => (callback) => {
  const listener = (_, data) => callback(data)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('translatorAPI', {
  onProcessing: createListener('translation:processing'),
  onSuccess: createListener('translation:success'),
  onError: createListener('translation:error'),
  onWarning: createListener('translation:warning'),
  onInfo: createListener('translation:info'),
  onFocusInput: createListener('ui:focus-input'),
  requestManualTranslate: (payload) => ipcRenderer.invoke('translation:manual', payload),
  getModel: () => ipcRenderer.invoke('preferences:get', 'model'),
  setModel: (model) => ipcRenderer.send('preferences:set-model', model),
  getTarget: () => ipcRenderer.invoke('preferences:get', 'targetLanguage'),
  setTarget: (target) => ipcRenderer.send('preferences:set-target', target),
  getTranslationMode: () => ipcRenderer.invoke('preferences:get', 'translationMode'),
  setTranslationMode: (mode) => ipcRenderer.send('preferences:set-translation-mode', mode),
  getOpacity: () => ipcRenderer.invoke('preferences:get', 'opacity'),
  setOpacity: (opacity) => ipcRenderer.send('preferences:set-opacity', opacity),
  getStartupEnabled: () => ipcRenderer.invoke('preferences:get', 'startupEnabled'),
  setStartupEnabled: (enabled) => ipcRenderer.send('preferences:set-startup', enabled),
  getVoiceSettings: () => ipcRenderer.invoke('preferences:get', 'voiceSettings'),
  setVoiceSettings: (settings) => ipcRenderer.send('preferences:set-voice-settings', settings),
  hideWindow: () => ipcRenderer.send('window:hide')
})

