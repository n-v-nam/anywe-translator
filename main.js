import { config } from 'dotenv'
import { app, BrowserWindow, Tray, Menu, globalShortcut, clipboard, nativeImage, ipcMain, screen } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import Store from 'electron-store'
import { translateText } from './utils/translator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env file với đường dẫn tuyệt đối để đảm bảo hoạt động khi chạy ở background
// Thử load từ các vị trí có thể
const loadEnvFile = () => {
  const possibleEnvPaths = [
    path.join(__dirname, '.env'), // Development: cùng thư mục với main.js
    path.join(process.cwd(), '.env') // Development: thư mục hiện tại
  ]

  // Thêm các path production sau khi app ready
  if (app.isReady()) {
    possibleEnvPaths.push(
      path.join(app.getPath('userData'), '.env'), // Production: thư mục user data
      path.join(app.getAppPath(), '.env') // Production: thư mục app
    )
  }

  let envLoaded = false
  for (const envPath of possibleEnvPaths) {
    try {
      const result = config({ path: envPath })
      if (result.parsed && Object.keys(result.parsed).length > 0) {
        envLoaded = true
        console.log(`✓ Loaded .env from: ${envPath}`)
        break
      }
    } catch (error) {
      // Continue to next path
    }
  }

  return envLoaded
}

// Load .env ngay lập tức (development paths)
loadEnvFile()

let tray
let mainWindow
let hasBeenPositioned = false
const isMac = process.platform === 'darwin'
const store = new Store({ name: 'translator-preferences' })

const getModel = () => store.get('model', 'gpt-4.1-nano')
const getTargetLanguage = () => store.get('targetLanguage', 'Vietnamese')
const getTranslationMode = () => store.get('translationMode', 'meaning')
const getOpacity = () => store.get('opacity', 1.0)
const getStartupEnabled = () => store.get('startupEnabled', false)

const applyOpacity = (opacity) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setOpacity(opacity)
  }
}

const setStartupEnabled = (enabled) => {
  store.set('startupEnabled', enabled)
  // Sử dụng setLoginItemSettings để thêm/xóa app khỏi startup
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true // Chạy ở background (không hiển thị window)
  })
  console.log(`✓ Startup ${enabled ? 'enabled' : 'disabled'}`)
}

const showWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    // Nếu window bị destroy, tạo lại window
    createWindow()
    // Đợi window ready trước khi show
    mainWindow.once('ready-to-show', () => {
      showWindow()
    })
    return
  }

  if (!hasBeenPositioned) {
    hasBeenPositioned = true
  }

  if (isMac) {
    try {
      mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })

      mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)

      mainWindow.showInactive()

      if (typeof mainWindow.moveTop === 'function') {
        mainWindow.moveTop()
      }

      setTimeout(() => {
        if (!mainWindow || mainWindow.isDestroyed()) {
          return
        }
        try {
          mainWindow.setVisibleOnAllWorkspaces(true, {
            visibleOnFullScreen: true,
            skipTransformProcessType: true
          })
          mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
          mainWindow.focus()
        } catch (error) {
          console.error('Error showing window:', error)
        }
      }, 50)
    } catch (error) {
      console.error('Error showing window:', error)
    }
  } else {
    try {
      mainWindow.setAlwaysOnTop(true)
      mainWindow.show()
      mainWindow.focus()
    } catch (error) {
      console.error('Error showing window:', error)
    }
  }
}

const createWindow = () => {
  // Nếu window đã tồn tại và chưa bị destroy, không tạo lại
  if (mainWindow && !mainWindow.isDestroyed()) {
    return
  }

  // Reset positioning flag khi tạo window mới
  hasBeenPositioned = false

  mainWindow = new BrowserWindow({
    width: 800,
    height: 420,
    minWidth: 600,
    minHeight: 300,
    show: false,
    frame: false,
    resizable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    backgroundColor: '#00000000',
    fullscreenable: false,
    focusable: true,
    movable: true,
    hasShadow: true,
    acceptFirstMouse: true,
    titleBarStyle: 'hiddenInset',
    type: isMac ? 'panel' : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isMac) {
    if (typeof mainWindow.setVibrancy === 'function') {
      mainWindow.setVibrancy('hud')
    }
    if (typeof mainWindow.setVisualEffectState === 'function') {
      mainWindow.setVisualEffectState('active')
    }

    mainWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true
    })

    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
  } else {
    mainWindow.setAlwaysOnTop(true)
  }

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'))

  // Áp dụng opacity đã lưu khi window ready
  const savedOpacity = getOpacity()
  applyOpacity(savedOpacity)

  mainWindow.on('ready-to-show', () => {
    if (isMac) {
      mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
      })
      mainWindow.setAlwaysOnTop(true, 'screen-saver', 1)
    }
    // Đảm bảo opacity được áp dụng
    applyOpacity(savedOpacity)
  })

  mainWindow.on('hide', () => {
    if (isMac && mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.setVisibleOnAllWorkspaces(true, {
          visibleOnFullScreen: true,
          skipTransformProcessType: true
        })
      } catch (error) {
        console.error('Error in hide handler:', error)
      }
    }
  })

  mainWindow.on('closed', () => {
    // Reset reference khi window bị đóng
    mainWindow = null
    hasBeenPositioned = false
  })
}

const getSelectedText = async () => {
  // Đơn giản: chỉ đọc giá trị đang copy trong clipboard
  return clipboard.readText().trim()
}

const handleTranslateShortcut = async () => {
  // Đảm bảo window tồn tại trước khi sử dụng
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    // Đợi window ready
    mainWindow.once('ready-to-show', () => {
      handleTranslateShortcut()
    })
    return
  }

  // Đọc selected text (qua clipboard) và ghi thẳng vào input field
  const original = await getSelectedText()

  const model = getModel()
  const targetLanguage = getTargetLanguage()
  const translationMode = getTranslationMode()

  // Show window và ghi text vào input field
  showWindow()

  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    if (original) {
      // Ghi text vào input field và tự động dịch
      mainWindow.webContents.send('translation:processing', { text: original, model, targetLanguage, translationMode })

      // Tự động dịch ngay
      try {
        const result = await translateText({ text: original, model, targetLanguage, translationMode })
        mainWindow.webContents.send('translation:success', result)
      } catch (error) {
        mainWindow.webContents.send('translation:error', error.message || 'Có lỗi xảy ra')
      }
    } else {
      // Nếu không có selected text, chỉ show window với input trống
      mainWindow.webContents.send('ui:focus-input')
    }
  }
}

const showDialog = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    // Nếu window bị destroy, tạo lại window
    createWindow()
    // Đợi window ready trước khi show và focus
    mainWindow.once('ready-to-show', () => {
      showWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('ui:focus-input')
      }
    })
    return
  }

  showWindow()

  // Đợi một chút để đảm bảo window đã show
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      try {
        mainWindow.webContents.send('ui:focus-input')
      } catch (error) {
        console.error('Error sending focus input:', error)
      }
    }
  }, 100)
}

const createTray = () => {
  try {
    const iconPath = path.join(__dirname, 'assets/iconTemplate.png')
    console.log(`Trying to load tray icon from: ${iconPath}`)

    let icon = nativeImage.createFromPath(iconPath)

    // Kiểm tra xem icon có được load thành công không
    if (icon.isEmpty()) {
      console.warn('⚠️  Icon file is empty or not found, creating fallback icon')
      // Tạo icon fallback với kích thước phù hợp
      const size = 22 // Kích thước chuẩn cho menu bar icon trên macOS
      // Fallback: tạo icon từ data URL đơn giản (màu xanh nhạt)
      const fallbackDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAAkSURBVAiZY/z//z8DJYAFiA3//wMxJYAFiA3//wMxJQAA8wMfAQAAAABJRU5ErkJggg=='
      icon = nativeImage.createFromDataURL(fallbackDataURL)
      icon = icon.resize({ width: size, height: size })
    }

    // Đảm bảo icon có kích thước phù hợp cho menu bar
    const iconSize = icon.getSize()
    console.log(`Icon size: ${iconSize.width}x${iconSize.height}`)

    if (iconSize.width < 16 || iconSize.height < 16) {
      icon = icon.resize({ width: 22, height: 22 })
    } else if (iconSize.width > 32 || iconSize.height > 32) {
      // Resize nếu quá lớn
      icon = icon.resize({ width: 22, height: 22 })
    }

    // Trên macOS, không set template nếu muốn giữ màu của icon
    // Chỉ set template nếu icon là monochrome
    if (isMac) {
      // Thử không set template trước để giữ màu
      // Nếu icon không hiển thị, có thể thử set template = true
    }

    tray = new Tray(icon)
    console.log('✓ Tray icon created successfully')

    // Đảm bảo tray icon hiển thị trên menu bar
    if (isMac) {
      tray.setTitle('') // Không hiển thị text, chỉ icon
    }

    // Tạo context menu với các option
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Dialog',
        click: showDialog
      },
      {
        label: 'Dịch nhanh',
        click: handleTranslateShortcut
      },
      { type: 'separator' },
      {
        label: 'Exit',
        click: () => app.quit()
      }
    ])
    tray.setContextMenu(contextMenu)
    tray.setToolTip('Cris Translator')

    // Trên macOS, chỉ cần set context menu, macOS sẽ tự động hiển thị menu khi click
    // Không cần click handler vì macOS tự động xử lý
    // Nếu muốn custom behavior, có thể thêm click handler nhưng cần đảm bảo window tồn tại
    if (!isMac) {
      // Windows/Linux: click toggle window
      tray.on('click', () => {
        if (!mainWindow) return
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          showDialog()
        }
      })
    }
    // macOS: Không cần click handler, context menu sẽ tự động hiển thị khi click
    // Nếu cần custom behavior, có thể thêm nhưng phải đảm bảo window tồn tại

    // Đảm bảo tray icon luôn hiển thị
    tray.setIgnoreDoubleClickEvents(true)

    console.log('✓ Tray icon configured and should be visible in menu bar')
    console.log('  Click icon to show menu with options: Show Dialog, Dịch nhanh, Exit')
  } catch (error) {
    console.error('❌ Error creating tray icon:', error)
    console.error(error.stack)
    // Vẫn tạo tray với icon mặc định để app có thể chạy
    try {
      const emptyIcon = nativeImage.createEmpty()
      tray = new Tray(emptyIcon)
      tray.setToolTip('Cris Translator')
      const fallbackMenu = Menu.buildFromTemplate([
        { label: 'Show Dialog', click: showDialog },
        { label: 'Exit', click: () => app.quit() }
      ])
      tray.setContextMenu(fallbackMenu)
      console.log('⚠️  Created tray with empty icon as fallback')
    } catch (fallbackError) {
      console.error('❌ Failed to create tray even with fallback:', fallbackError)
    }
  }
}

const registerShortcuts = () => {
  // Đổi phím tắt để tránh trùng với Terminal (Cmd+Shift+T mở tab mới trong Terminal)
  // Sử dụng Cmd+Option+T thay vì Cmd+Shift+T
  const translateShortcut = isMac ? 'Command+Option+T' : 'Control+Alt+T'
  const quitShortcut = isMac ? 'Command+Shift+Q' : 'Control+Shift+Q'

  const translateRegistered = globalShortcut.register(translateShortcut, handleTranslateShortcut)
  if (!translateRegistered) {
    console.warn(`⚠️  Không thể đăng ký phím tắt ${translateShortcut}, có thể đã bị app khác sử dụng`)
    // Thử phím tắt dự phòng
    const altShortcut = isMac ? 'Command+Option+X' : 'Control+Alt+X'
    if (globalShortcut.register(altShortcut, handleTranslateShortcut)) {
      console.log(`✓ Đã đăng ký phím tắt dự phòng: ${altShortcut}`)
    }
  } else {
    console.log(`✓ Đã đăng ký phím tắt dịch: ${translateShortcut}`)
    console.log(`  (Đã đổi từ Cmd+Shift+T để tránh trùng với Terminal)`)
  }

  const quitRegistered = globalShortcut.register(quitShortcut, () => app.quit())
  if (!quitRegistered) {
    console.warn(`⚠️  Không thể đăng ký phím tắt ${quitShortcut}`)
  } else {
    console.log(`✓ Đã đăng ký phím tắt thoát: ${quitShortcut}`)
  }
}

const checkAccessibilityPermission = () => {
  if (!isMac) return

  console.log('\n⚠️  ĐỂ POPUP HIỂN THỊ TRÊN FULL SCREEN:')
  console.log('1. Mở System Settings > Privacy & Security > Accessibility')
  console.log('2. Thêm một trong các ứng dụng sau vào danh sách:')
  console.log('   - Terminal (nếu bạn chạy từ Terminal)')
  console.log('   - Electron (tìm trong danh sách khi app đang chạy)')
  console.log('   - Hoặc build app: npm run build\n')
}

app.whenReady().then(() => {
  // Thử load .env lại với production paths sau khi app ready
  if (!process.env.OPENAI_API_KEY) {
    loadEnvFile()
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY không được tìm thấy')
      console.warn('   Vui lòng tạo file .env với nội dung: OPENAI_API_KEY=your_key')
      console.warn('   Đặt file .env ở một trong các vị trí sau:')
      console.warn(`   - ${path.join(__dirname, '.env')}`)
      console.warn(`   - ${path.join(process.cwd(), '.env')}`)
      console.warn(`   - ${path.join(app.getPath('userData'), '.env')}`)
      console.warn(`   - ${path.join(app.getAppPath(), '.env')}`)
    }
  }

  // Áp dụng startup setting khi app khởi động
  const startupEnabled = getStartupEnabled()
  setStartupEnabled(startupEnabled)

  checkAccessibilityPermission()

  // Ẩn ứng dụng khỏi dock trên macOS (chạy ở chế độ nền)
  // Lưu ý: Ẩn dock KHÔNG ảnh hưởng đến tray icon trên menu bar
  if (isMac && app.dock) {
    app.dock.hide()
    console.log('✓ App hidden from dock (running in background)')
  }

  // Tạo window TRƯỚC để đảm bảo có window reference cho menu
  createWindow()

  // Đợi window ready trước khi tạo tray (quan trọng cho production)
  mainWindow.once('ready-to-show', () => {
    // Tạo tray sau khi window đã ready
    createTray()

    // Đảm bảo tray icon đã được tạo
    if (tray) {
      console.log('✓ Tray icon should now be visible in menu bar')
    } else {
      console.error('❌ Tray icon was not created!')
    }
  })

  registerShortcuts()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Ngăn ứng dụng tự động quit khi đóng tất cả windows
app.on('window-all-closed', () => {
  // Trên macOS, giữ app chạy ngay cả khi không có window nào (chạy ở chế độ nền)
  // Chỉ quit trên các platform khác
  if (!isMac) {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

ipcMain.handle('preferences:get', (_, key) => {
  if (key === 'model') return getModel()
  if (key === 'targetLanguage') return getTargetLanguage()
  if (key === 'translationMode') return getTranslationMode()
  if (key === 'opacity') return getOpacity()
  if (key === 'startupEnabled') {
    // Lấy trạng thái thực tế từ system
    const loginItemSettings = app.getLoginItemSettings()
    return loginItemSettings.openAtLogin
  }
  if (key === 'voiceSettings') return store.get('voiceSettings', {})
  return null
})

ipcMain.on('preferences:set-model', (_, model) => {
  if (typeof model === 'string') store.set('model', model)
})

ipcMain.on('preferences:set-target', (_, target) => {
  if (typeof target === 'string') store.set('targetLanguage', target)
})

ipcMain.on('preferences:set-translation-mode', (_, mode) => {
  if (typeof mode === 'string') store.set('translationMode', mode)
})

ipcMain.on('preferences:set-opacity', (_, opacity) => {
  const opacityValue = typeof opacity === 'number' ? Math.max(0.3, Math.min(1.0, opacity)) : 1.0
  store.set('opacity', opacityValue)
  applyOpacity(opacityValue)
})

ipcMain.on('preferences:set-startup', (_, enabled) => {
  const startupValue = typeof enabled === 'boolean' ? enabled : false
  setStartupEnabled(startupValue)
})

ipcMain.on('preferences:set-voice-settings', (_, settings) => {
  if (settings && typeof settings === 'object') {
    store.set('voiceSettings', settings)
  }
})

ipcMain.on('window:hide', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide()
  }
})

ipcMain.handle('translation:manual', async (_, payload) => {
  // Đảm bảo window tồn tại
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow()
    // Đợi window ready
    await new Promise((resolve) => {
      if (mainWindow) {
        mainWindow.once('ready-to-show', resolve)
      } else {
        resolve()
      }
    })
  }

  const text = typeof payload?.text === 'string' ? payload.text.trim() : ''
  const model = payload?.model || getModel()
  const targetLanguage = payload?.targetLanguage || getTargetLanguage()
  const translationMode = payload?.translationMode || getTranslationMode()
  if (!text) throw new Error('Nội dung trống')
  store.set('targetLanguage', targetLanguage)
  if (payload?.translationMode) {
    store.set('translationMode', translationMode)
  }
  showWindow()

  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('translation:processing', { text, model, targetLanguage, translationMode })
  }

  try {
    const result = await translateText({ text, model, targetLanguage, translationMode })
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send('translation:success', result)
    }
    return result
  } catch (error) {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send('translation:error', error.message || 'Có lỗi xảy ra')
    }
    throw error
  }
})

