const statusEl = document.querySelector('[data-status]')
const inputEl = document.querySelector('[data-input]')
const translateBtn = document.querySelector('[data-translate]')
const translateBtnIcon = translateBtn?.querySelector('.btn-icon')
const translateBtnText = translateBtn?.querySelector('.btn-text')
const translateBtnSpinner = translateBtn?.querySelector('.btn-spinner')
const clearBtn = document.querySelector('[data-clear]')
const resultEl = document.querySelector('[data-result]')
const languageEl = document.querySelector('[data-language]')
const copyBtn = document.querySelector('[data-copy]')
const speakInputBtn = document.querySelector('[data-speak-input]')
const speakOutputBtn = document.querySelector('[data-speak-output]')
const modelSelect = document.querySelector('[data-model]')
const targetSelect = document.querySelector('[data-target]')
const translationModeSelect = document.querySelector('[data-translation-mode]')
const closeBtn = document.querySelector('[data-close]')
const settingsBtn = document.querySelector('[data-settings]')
const settingsPanel = document.querySelector('[data-settings-panel]')
const settingsCloseBtn = document.querySelector('[data-settings-close]')
const voiceSettingsContainer = document.querySelector('[data-voice-settings]')
const opacitySlider = document.querySelector('[data-opacity]')
const opacityValue = document.querySelector('[data-opacity-value]')
const startupCheckbox = document.querySelector('[data-startup]')

const state = {
  loading: false,
  current: null,
  model: 'gpt-4.1-nano',
  targetLanguage: 'Vietnamese',
  translationMode: 'meaning',
  isSpeaking: false,
  voiceSettings: {},
  voices: [],
  testingLanguage: null
}

const langToCode = {
  'Vietnamese': 'vi-VN',
  'English': 'en-US',
  'Japanese': 'ja-JP'
}

const sampleTexts = {
  'Vietnamese': 'Xin chào, đây là bản dịch tiếng Việt.',
  'English': 'Hello, this is an English translation.',
  'Japanese': 'こんにちは、これは日本語の翻訳です。'
}

const setStatus = (text) => {
  statusEl.textContent = text
}

const setLoading = (loading) => {
  state.loading = loading
  translateBtn.disabled = loading
  setStatus(loading ? 'Translating...' : 'Ready')
  
  if (loading) {
    translateBtnIcon.style.display = 'none'
    translateBtnText.textContent = 'Translating...'
    translateBtnSpinner.style.display = 'inline-block'
    translateBtn.classList.add('primary-btn--loading')
  } else {
    translateBtnIcon.style.display = 'inline-block'
    translateBtnText.textContent = 'Translate'
    translateBtnSpinner.style.display = 'none'
    translateBtn.classList.remove('primary-btn--loading')
  }
}

const renderResult = (payload) => {
  if (!payload) {
    resultEl.innerHTML = '<div class="output-placeholder">Translation will appear here...</div>'
    languageEl.textContent = 'Output'
    return
  }
  resultEl.textContent = payload.translatedText
  const langText = payload.detectedLanguage 
    ? `${payload.detectedLanguage} → ${payload.targetLanguage}`
    : payload.targetLanguage
  languageEl.textContent = langText
}

const updateSpeakButtons = () => {
  if (state.isSpeaking) {
    speakInputBtn.textContent = '⏸'
    speakOutputBtn.textContent = '⏸'
    speakInputBtn.title = 'Dừng'
    speakOutputBtn.title = 'Dừng'
  } else {
    speakInputBtn.textContent = '🔊'
    speakOutputBtn.textContent = '🔊'
    speakInputBtn.title = 'Đọc'
    speakOutputBtn.title = 'Đọc'
  }
}

const getVoicesForLanguage = (language) => {
  const langCode = langToCode[language] || 'en-US'
  const langPrefix = langCode.split('-')[0]
  return state.voices.filter(voice => voice.lang.startsWith(langPrefix))
}

const speakText = (text, language, isTest = false) => {
  if (!text || !text.trim()) return
  
  if (state.isSpeaking) {
    window.speechSynthesis.cancel()
    state.isSpeaking = false
    state.testingLanguage = null
    updateSpeakButtons()
    updateTestButtons()
    return
  }
  
  const utterance = new SpeechSynthesisUtterance(text)
  const langCode = langToCode[language] || 'en-US'
  utterance.lang = langCode
  
  const settings = state.voiceSettings[language] || {}
  utterance.rate = settings.rate || 1.0
  utterance.pitch = settings.pitch || 1.0
  utterance.volume = settings.volume || 0.85
  
  if (settings.voiceName) {
    const voices = getVoicesForLanguage(language)
    const selectedVoice = voices.find(v => v.name === settings.voiceName)
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }
  }
  
  utterance.onstart = () => {
    state.isSpeaking = true
    if (isTest) {
      state.testingLanguage = language
    }
    updateSpeakButtons()
    updateTestButtons()
  }
  
  utterance.onend = () => {
    state.isSpeaking = false
    state.testingLanguage = null
    updateSpeakButtons()
    updateTestButtons()
  }
  
  utterance.onerror = () => {
    state.isSpeaking = false
    state.testingLanguage = null
    updateSpeakButtons()
    updateTestButtons()
  }
  
  window.speechSynthesis.speak(utterance)
}

const updateTestButtons = () => {
  const testButtons = document.querySelectorAll('[data-test-voice]')
  testButtons.forEach(btn => {
    const lang = btn.dataset.testVoice
    if (state.isSpeaking && state.testingLanguage === lang) {
      btn.textContent = '⏸'
      btn.title = 'Dừng'
    } else {
      btn.textContent = '▶'
      btn.title = 'Nghe thử'
    }
  })
}


const handleManualTranslate = async () => {
  const text = inputEl.value.trim()
  if (!text) {
    setStatus('Please enter text')
    return
  }
  try {
    setLoading(true)
    const response = await window.translatorAPI.requestManualTranslate({
      text,
      model: state.model,
      targetLanguage: state.targetLanguage,
      translationMode: state.translationMode
    })
    state.current = response
    renderResult(state.current)
  } catch (error) {
    setStatus(error.message || 'Có lỗi xảy ra')
  } finally {
    setLoading(false)
  }
}

const bindEvents = () => {
  translateBtn.addEventListener('click', handleManualTranslate)
  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      handleManualTranslate()
    }
  })
  clearBtn.addEventListener('click', () => {
    if (state.isSpeaking) {
      window.speechSynthesis.cancel()
      state.isSpeaking = false
      updateSpeakButtons()
    }
    inputEl.value = ''
    state.current = null
    renderResult(null)
    setStatus('Ready')
  })
  copyBtn.addEventListener('click', async () => {
    if (!state.current?.translatedText) return
    await navigator.clipboard.writeText(state.current.translatedText)
    setStatus('Copied')
    setTimeout(() => setStatus('Ready'), 1200)
  })
  speakInputBtn.addEventListener('click', () => {
    const text = inputEl.value.trim()
    if (!text) return
    const detectedLang = state.current?.detectedLanguage || state.targetLanguage || 'English'
    speakText(text, detectedLang)
  })
  speakOutputBtn.addEventListener('click', () => {
    const text = state.current?.translatedText
    if (!text) return
    speakText(text, state.current?.targetLanguage || state.targetLanguage)
  })
  modelSelect.addEventListener('change', () => {
    state.model = modelSelect.value
    window.translatorAPI.setModel(state.model)
  })
  targetSelect.addEventListener('change', () => {
    state.targetLanguage = targetSelect.value
    window.translatorAPI.setTarget(state.targetLanguage)
  })
  translationModeSelect.addEventListener('change', () => {
    state.translationMode = translationModeSelect.value
    window.translatorAPI.setTranslationMode(state.translationMode)
  })
  closeBtn.addEventListener('click', () => {
    window.translatorAPI.hideWindow()
  })
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('settings-panel--visible')
    loadVoiceSettings()
    loadOpacity()
    loadStartup()
  })
  settingsCloseBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('settings-panel--visible')
  })
  opacitySlider.addEventListener('input', () => {
    const opacity = parseFloat(opacitySlider.value)
    opacityValue.textContent = `${Math.round(opacity * 100)}%`
    window.translatorAPI.setOpacity(opacity)
  })
  startupCheckbox.addEventListener('change', () => {
    window.translatorAPI.setStartupEnabled(startupCheckbox.checked)
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsPanel.classList.contains('settings-panel--visible')) {
      settingsPanel.classList.remove('settings-panel--visible')
    }
  })
}

const bindIpc = () => {
  window.translatorAPI.onProcessing((payload) => {
    setLoading(true)
    if (payload?.text) inputEl.value = payload.text
    if (payload?.model) {
      state.model = payload.model
      modelSelect.value = payload.model
    }
    if (payload?.targetLanguage) {
      state.targetLanguage = payload.targetLanguage
      targetSelect.value = payload.targetLanguage
    }
    if (payload?.translationMode) {
      state.translationMode = payload.translationMode
      translationModeSelect.value = payload.translationMode
    }
  })
  window.translatorAPI.onSuccess((payload) => {
    state.current = payload
    renderResult(state.current)
    setLoading(false)
  })
  window.translatorAPI.onError((message) => {
    setLoading(false)
    setStatus(message || 'Có lỗi xảy ra')
  })
  window.translatorAPI.onWarning((message) => {
    setStatus(message || 'Warning')
    setTimeout(() => setStatus('Ready'), 3000)
  })
  window.translatorAPI.onInfo((message) => {
    setStatus(message || 'Info')
    setTimeout(() => setStatus('Ready'), 3000)
  })
  window.translatorAPI.onFocusInput(() => inputEl.focus())
}

const loadVoices = () => {
  state.voices = window.speechSynthesis.getVoices()
  if (state.voices.length === 0) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        state.voices = window.speechSynthesis.getVoices()
      }
    }
  }
}

const renderVoiceSettings = () => {
  voiceSettingsContainer.innerHTML = ''
  
  const languages = ['Vietnamese', 'English', 'Japanese']
  
  languages.forEach(language => {
    const langSettings = state.voiceSettings[language] || {}
    const voices = getVoicesForLanguage(language)
    
    const langCard = document.createElement('div')
    langCard.className = 'settings-lang-card'
    
    const langHeader = document.createElement('div')
    langHeader.className = 'settings-lang-header'
    langHeader.textContent = language
    langCard.appendChild(langHeader)
    
    const voiceGroup = document.createElement('div')
    voiceGroup.className = 'settings-group'
    
    const voiceLabel = document.createElement('label')
    voiceLabel.className = 'settings-label'
    voiceLabel.textContent = 'Voice'
    voiceGroup.appendChild(voiceLabel)
    
    const voiceSelect = document.createElement('select')
    voiceSelect.className = 'settings-select'
    const defaultOption = document.createElement('option')
    defaultOption.value = ''
    defaultOption.textContent = 'Default'
    voiceSelect.appendChild(defaultOption)
    
    voices.forEach(voice => {
      const option = document.createElement('option')
      option.value = voice.name
      option.textContent = `${voice.name} (${voice.lang})`
      if (langSettings.voiceName === voice.name) {
        option.selected = true
      }
      voiceSelect.appendChild(option)
    })
    
    voiceSelect.addEventListener('change', () => {
      if (!state.voiceSettings[language]) {
        state.voiceSettings[language] = {}
      }
      state.voiceSettings[language].voiceName = voiceSelect.value || null
      window.translatorAPI.setVoiceSettings(state.voiceSettings)
    })
    
    voiceGroup.appendChild(voiceSelect)
    langCard.appendChild(voiceGroup)
    
    const rateGroup = document.createElement('div')
    rateGroup.className = 'settings-group'
    
    const rateLabel = document.createElement('label')
    rateLabel.className = 'settings-label'
    rateLabel.textContent = `Speed: ${(langSettings.rate || 1.0).toFixed(1)}x`
    rateGroup.appendChild(rateLabel)
    
    const rateInput = document.createElement('input')
    rateInput.type = 'range'
    rateInput.min = '0.5'
    rateInput.max = '2.0'
    rateInput.step = '0.1'
    rateInput.value = langSettings.rate || 1.0
    rateInput.className = 'settings-range'
    
    rateInput.addEventListener('input', () => {
      const rate = parseFloat(rateInput.value)
      rateLabel.textContent = `Speed: ${rate.toFixed(1)}x`
      if (!state.voiceSettings[language]) {
        state.voiceSettings[language] = {}
      }
      state.voiceSettings[language].rate = rate
      window.translatorAPI.setVoiceSettings(state.voiceSettings)
    })
    
    rateGroup.appendChild(rateInput)
    langCard.appendChild(rateGroup)
    
    const pitchGroup = document.createElement('div')
    pitchGroup.className = 'settings-group'
    
    const pitchLabel = document.createElement('label')
    pitchLabel.className = 'settings-label'
    pitchLabel.textContent = `Pitch: ${(langSettings.pitch || 1.0).toFixed(1)}`
    pitchGroup.appendChild(pitchLabel)
    
    const pitchInput = document.createElement('input')
    pitchInput.type = 'range'
    pitchInput.min = '0.5'
    pitchInput.max = '2.0'
    pitchInput.step = '0.1'
    pitchInput.value = langSettings.pitch || 1.0
    pitchInput.className = 'settings-range'
    
    pitchInput.addEventListener('input', () => {
      const pitch = parseFloat(pitchInput.value)
      pitchLabel.textContent = `Pitch: ${pitch.toFixed(1)}`
      if (!state.voiceSettings[language]) {
        state.voiceSettings[language] = {}
      }
      state.voiceSettings[language].pitch = pitch
      window.translatorAPI.setVoiceSettings(state.voiceSettings)
    })
    
    pitchGroup.appendChild(pitchInput)
    langCard.appendChild(pitchGroup)
    
    const volumeGroup = document.createElement('div')
    volumeGroup.className = 'settings-group'
    
    const volumeLabel = document.createElement('label')
    volumeLabel.className = 'settings-label'
    volumeLabel.textContent = `Volume: ${Math.round((langSettings.volume || 0.85) * 100)}%`
    volumeGroup.appendChild(volumeLabel)
    
    const volumeInput = document.createElement('input')
    volumeInput.type = 'range'
    volumeInput.min = '0.1'
    volumeInput.max = '1.0'
    volumeInput.step = '0.05'
    volumeInput.value = langSettings.volume || 0.85
    volumeInput.className = 'settings-range'
    
    volumeInput.addEventListener('input', () => {
      const volume = parseFloat(volumeInput.value)
      volumeLabel.textContent = `Volume: ${Math.round(volume * 100)}%`
      if (!state.voiceSettings[language]) {
        state.voiceSettings[language] = {}
      }
      state.voiceSettings[language].volume = volume
      window.translatorAPI.setVoiceSettings(state.voiceSettings)
    })
    
    volumeGroup.appendChild(volumeInput)
    langCard.appendChild(volumeGroup)
    
    const testGroup = document.createElement('div')
    testGroup.className = 'settings-group'
    
    const testBtn = document.createElement('button')
    testBtn.className = 'settings-test-btn'
    testBtn.setAttribute('data-test-voice', language)
    testBtn.textContent = '▶'
    testBtn.title = 'Nghe thử'
    
    testBtn.addEventListener('click', () => {
      const sampleText = sampleTexts[language]
      if (sampleText) {
        speakText(sampleText, language, true)
      }
    })
    
    testGroup.appendChild(testBtn)
    langCard.appendChild(testGroup)
    
    voiceSettingsContainer.appendChild(langCard)
  })
  
  updateTestButtons()
}

const loadVoiceSettings = async () => {
  state.voiceSettings = await window.translatorAPI.getVoiceSettings() || {}
  loadVoices()
  renderVoiceSettings()
}

const loadOpacity = async () => {
  const opacity = await window.translatorAPI.getOpacity() || 1.0
  opacitySlider.value = opacity
  opacityValue.textContent = `${Math.round(opacity * 100)}%`
}

const loadStartup = async () => {
  const startupEnabled = await window.translatorAPI.getStartupEnabled() || false
  startupCheckbox.checked = startupEnabled
}

const bootstrap = async () => {
  bindEvents()
  bindIpc()
  loadVoices()
  const storedModel = await window.translatorAPI.getModel()
  if (storedModel) {
    state.model = storedModel
    modelSelect.value = storedModel
  }
  const storedTarget = await window.translatorAPI.getTarget()
  if (storedTarget) {
    state.targetLanguage = storedTarget
    targetSelect.value = storedTarget
  } else {
    state.targetLanguage = targetSelect.value
  }
  const storedTranslationMode = await window.translatorAPI.getTranslationMode()
  if (storedTranslationMode) {
    state.translationMode = storedTranslationMode
    translationModeSelect.value = storedTranslationMode
  } else {
    state.translationMode = translationModeSelect.value
  }
  state.voiceSettings = await window.translatorAPI.getVoiceSettings() || {}
  await loadOpacity()
  await loadStartup()
  updateSpeakButtons()
  renderResult(null)
}

bootstrap()

