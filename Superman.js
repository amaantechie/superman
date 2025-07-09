// Game constants
const boardWidth = 360
const boardHeight = 640
let context
let uiContext
const homepage = document.getElementById("homepage")
const board = document.getElementById("board")
const ui = document.getElementById("ui")
const startBtn = document.getElementById("start-btn")
const restartBtn = document.getElementById("restart-btn")
const soundBtnPause = document.getElementById("sound-btn-pause")
const muteBtnPause = document.getElementById("mute-btn-pause")
const pauseOverlay = document.getElementById("pause-overlay")
const resumeBtn = document.getElementById("resume-btn")
const powerUpImg = new Image()
const enemyImg = new Image()
let shieldActive = false
const shieldDuration = 5000 // 5 seconds
let shieldEndTime = 0
let powerUpArray = []
let lastPowerUpSpawn = 0
const powerUpSpawnInterval = 10000 // 10 seconds
let enemyArray = []
const enemySpawnInterval = 4000 // 4 seconds
let lastEnemySpawn = 0
const baseEnemySpeed = -4
const enemySpeedIncrease = -0.5
const maxEnemySpeed = -8
const MAX_DIFFICULTY_LEVEL = 5
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200

// Debug and logging system
const DEBUG_MODE = true
const debugLog = []
let debugElement = null

function createDebugConsole() {
  if (!DEBUG_MODE) return

  debugElement = document.createElement("div")
  debugElement.id = "debug-console"
  debugElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 200px;
    background: rgba(0,0,0,0.9);
    color: #00ff00;
    font-family: monospace;
    font-size: 10px;
    padding: 10px;
    overflow-y: auto;
    z-index: 9999;
    display: none;
    border-bottom: 2px solid #00ff00;
  `
  document.body.appendChild(debugElement)

  // Toggle debug console with triple tap
  let tapCount = 0
  let tapTimer = null
  document.addEventListener("touchstart", (e) => {
    tapCount++
    if (tapTimer) clearTimeout(tapTimer)
    tapTimer = setTimeout(() => {
      if (tapCount >= 3) {
        debugElement.style.display = debugElement.style.display === "none" ? "block" : "none"
      }
      tapCount = 0
    }, 500)
  })
}

function log(message, type = "INFO") {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0]
  const logMessage = `[${timestamp}] ${type}: ${message}`

  console.log(logMessage)
  debugLog.push(logMessage)

  if (debugElement) {
    debugElement.innerHTML = debugLog.slice(-20).join("<br>")
    debugElement.scrollTop = debugElement.scrollHeight
  }

  // Keep only last 100 logs
  if (debugLog.length > 100) {
    debugLog.splice(0, 50)
  }
}

function logError(error, context = "") {
  const errorMessage = `${context} - ${error.name}: ${error.message}`
  log(errorMessage, "ERROR")
  log(`Stack: ${error.stack}`, "ERROR")
}

// Browser and device detection with enhanced iOS detection
let isDesktop = false
let isMobile = false
let isIOS = false
let isSafari = false
let isChrome = false
let isWebKit = false
let performanceMode = "normal"
let TOUCH_DEBOUNCE_TIME = 50
let gameInitialized = false
let resourcesLoaded = false
let audioInitialized = false

// iOS-specific variables
let iOSVersion = null
let isStandalone = false
let hasNotch = false

// Performance monitoring and optimization
let frameCount = 0
let lastFPSCheck = 0
let currentFPS = 60
let targetFPS = 60
let lastFrameTime = 0
let frameTimeBuffer = []
let averageFrameTime = 16.67

// Enhanced browser detection with iOS specifics
function detectDeviceAndBrowser() {
  try {
    log("Starting device and browser detection...")

    const userAgent = navigator.userAgent
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    log(`UserAgent: ${userAgent}`)
    log(`Screen: ${screenWidth}x${screenHeight}`)
    log(`Touch support: ${hasTouch}`)
    log(`Max touch points: ${navigator.maxTouchPoints}`)

    // Enhanced iOS detection
    isIOS =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
      /iPhone|iPad|iPod|iOS/.test(userAgent)

    // iOS version detection
    if (isIOS) {
      const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/)
      if (match) {
        iOSVersion = `${match[1]}.${match[2]}.${match[3] || 0}`
        log(`iOS Version: ${iOSVersion}`)
      }

      // Check if running as standalone app
      isStandalone = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches
      log(`Standalone mode: ${isStandalone}`)

      // Check for notch (iPhone X and newer)
      hasNotch = screenHeight >= 812 && screenWidth >= 375
      log(`Has notch: ${hasNotch}`)
    }

    // Browser detection
    isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) || isIOS
    isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor) && !isIOS
    isWebKit = /WebKit/.test(userAgent)

    // Device type detection
    isDesktop =
      screenWidth >= 769 &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(hover: none)").matches &&
      !isIOS
    isMobile = !isDesktop

    log(`Device: ${isIOS ? "iOS" : isMobile ? "Mobile" : "Desktop"}`)
    log(`Browser: ${isSafari ? "Safari" : isChrome ? "Chrome" : "Other"}`)

    // Performance mode based on device and browser
    if (isIOS) {
      performanceMode = "ios-optimized"
      targetFPS = 60
      TOUCH_DEBOUNCE_TIME = 30
    } else if (isSafari) {
      performanceMode = "safari-optimized"
      targetFPS = 60
      TOUCH_DEBOUNCE_TIME = 30
    } else if (isChrome) {
      performanceMode = "chrome-optimized"
      targetFPS = 60
    } else {
      performanceMode = "standard"
      targetFPS = 60
    }

    log(`Performance mode: ${performanceMode}`)
    log("Device and browser detection completed successfully")

    return true
  } catch (error) {
    logError(error, "Device detection failed")
    return false
  }
}

// iOS-specific optimizations and fixes
function applyIOSOptimizations() {
  if (!isIOS) return

  try {
    log("Applying iOS-specific optimizations...")

    // Prevent iOS bounce and zoom
    document.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()
      },
      { passive: false },
    )

    document.addEventListener("gesturestart", (e) => {
      e.preventDefault()
    })

    document.addEventListener("gesturechange", (e) => {
      e.preventDefault()
    })

    document.addEventListener("gestureend", (e) => {
      e.preventDefault()
    })

    // iOS viewport fixes
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no",
      )
    }

    // iOS CSS optimizations
    document.documentElement.style.setProperty("-webkit-touch-callout", "none")
    document.documentElement.style.setProperty("-webkit-user-select", "none")
    document.documentElement.style.setProperty("-webkit-tap-highlight-color", "transparent")
    document.documentElement.style.setProperty("touch-action", "none")

    // iOS body optimizations
    document.body.style.webkitTouchCallout = "none"
    document.body.style.webkitUserSelect = "none"
    document.body.style.webkitTapHighlightColor = "transparent"
    document.body.style.touchAction = "none"
    document.body.style.webkitOverflowScrolling = "touch"
    document.body.style.webkitBackfaceVisibility = "hidden"
    document.body.style.webkitPerspective = "1000px"

    log("iOS optimizations applied successfully")
  } catch (error) {
    logError(error, "iOS optimizations failed")
  }
}

// Enhanced canvas initialization with iOS fixes
function initializeCanvas() {
  try {
    log("Initializing canvas...")

    if (!board || !ui) {
      throw new Error("Canvas elements not found")
    }

    // Get canvas contexts with iOS-optimized settings
    const contextOptions = {
      alpha: false,
      desynchronized: true,
      powerPreference: "high-performance",
      antialias: false,
      preserveDrawingBuffer: false,
    }

    context = board.getContext("2d", contextOptions)
    uiContext = ui.getContext("2d", contextOptions)

    if (!context || !uiContext) {
      throw new Error("Failed to get canvas contexts")
    }

    log("Canvas contexts created successfully")

    // iOS-specific canvas optimizations
    if (isIOS) {
      log("Applying iOS canvas optimizations...")

      // Disable image smoothing for better iOS performance
      context.imageSmoothingEnabled = false
      context.webkitImageSmoothingEnabled = false
      context.mozImageSmoothingEnabled = false
      context.msImageSmoothingEnabled = false

      uiContext.imageSmoothingEnabled = false
      uiContext.webkitImageSmoothingEnabled = false
      uiContext.mozImageSmoothingEnabled = false
      uiContext.msImageSmoothingEnabled = false

      // iOS-specific rendering optimizations
      if (context.textRenderingOptimization) {
        context.textRenderingOptimization = "speed"
      }
      if (uiContext.textRenderingOptimization) {
        uiContext.textRenderingOptimization = "speed"
      }

      log("iOS canvas optimizations applied")
    }

    log("Canvas initialization completed successfully")
    return true
  } catch (error) {
    logError(error, "Canvas initialization failed")
    return false
  }
}

// Enhanced image loading with iOS fixes
function loadImages() {
  return new Promise((resolve, reject) => {
    try {
      log("Starting image loading...")

      const imageUrls = [
        "./images/powerups.png",
        "./images/enemy.png",
        "./images/superman1.png",
        "./images/toppipe.png",
        "./images/bottompipe.png",
        "./images/pipe11.png",
        "./images/pipe1.png",
        "./images/gameover.png",
        "./images/highscore.png",
        "./images/collision.png",
      ]

      let loadedCount = 0
      const totalImages = imageUrls.length
      const loadedImages = {}

      log(`Loading ${totalImages} images...`)

      imageUrls.forEach((url, index) => {
        const img = new Image()

        // iOS-specific image settings
        if (isIOS) {
          img.crossOrigin = "anonymous"
          img.style.imageRendering = "-webkit-optimize-contrast"
        }

        img.onload = () => {
          loadedCount++
          loadedImages[url] = img
          log(`Image loaded (${loadedCount}/${totalImages}): ${url}`)

          if (loadedCount === totalImages) {
            log("All images loaded successfully")
            assignImages(loadedImages)
            resolve(loadedImages)
          }
        }

        img.onerror = (error) => {
          logError(new Error(`Failed to load image: ${url}`), "Image loading")
          // Continue loading other images
          loadedCount++
          if (loadedCount === totalImages) {
            log("Image loading completed with some errors")
            assignImages(loadedImages)
            resolve(loadedImages)
          }
        }

        // Add timeout for iOS
        if (isIOS) {
          setTimeout(() => {
            if (!img.complete) {
              log(`Image loading timeout: ${url}`, "WARN")
              img.onerror(new Error("Timeout"))
            }
          }, 10000) // 10 second timeout
        }

        img.src = url
      })
    } catch (error) {
      logError(error, "Image loading setup failed")
      reject(error)
    }
  })
}

function assignImages(loadedImages) {
  try {
    log("Assigning loaded images...")

    powerUpImg.src = "./images/powerups.png"
    enemyImg.src = "./images/enemy.png"

    SupermanImg = loadedImages["./images/superman1.png"] || new Image()
    if (!SupermanImg.src) SupermanImg.src = "./images/superman1.png"

    topPipeImg = loadedImages["./images/toppipe.png"] || new Image()
    if (!topPipeImg.src) topPipeImg.src = "./images/toppipe.png"

    bottomPipeImg = loadedImages["./images/bottompipe.png"] || new Image()
    if (!bottomPipeImg.src) bottomPipeImg.src = "./images/bottompipe.png"

    newTopPipeImg = loadedImages["./images/pipe11.png"] || new Image()
    if (!newTopPipeImg.src) newTopPipeImg.src = "./images/pipe11.png"

    newBottomPipeImg = loadedImages["./images/pipe1.png"] || new Image()
    if (!newBottomPipeImg.src) newBottomPipeImg.src = "./images/pipe1.png"

    gameOverImg = loadedImages["./images/gameover.png"] || new Image()
    if (!gameOverImg.src) gameOverImg.src = "./images/gameover.png"

    highScoreImg = loadedImages["./images/highscore.png"] || new Image()
    if (!highScoreImg.src) highScoreImg.src = "./images/highscore.png"

    collisionImg = loadedImages["./images/collision.png"] || new Image()
    if (!collisionImg.src) collisionImg.src = "./images/collision.png"

    log("Images assigned successfully")
    resourcesLoaded = true
  } catch (error) {
    logError(error, "Image assignment failed")
  }
}

// Enhanced audio initialization with iOS fixes
function initializeAudio() {
  return new Promise((resolve) => {
    try {
      log("Initializing audio system...")

      // iOS requires user interaction for audio
      if (isIOS) {
        log("iOS detected - audio will be initialized on first user interaction")[
          // Set up audio elements with iOS-specific settings
          (bgMusic, flySound, hitSound)
        ].forEach((audio, index) => {
          audio.preload = "metadata"
          audio.setAttribute("webkit-playsinline", "true")
          audio.setAttribute("playsinline", "true")
          audio.muted = false
          audio.volume = 0.7

          audio.addEventListener("canplaythrough", () => {
            log(`Audio ${index} ready for playback`)
          })

          audio.addEventListener("error", (e) => {
            log(`Audio ${index} error: ${e.message}`, "WARN")
          })
        })

        bgMusic.loop = true

        // iOS audio unlock function
        const unlockAudio = () => {
          log("Attempting to unlock iOS audio...")

          Promise.all([
            bgMusic.play().then(() => bgMusic.pause()),
            flySound.play().then(() => flySound.pause()),
            hitSound.play().then(() => hitSound.pause()),
          ])
            .then(() => {
              log("iOS audio unlocked successfully")
              audioInitialized = true
              document.removeEventListener("touchstart", unlockAudio)
              document.removeEventListener("click", unlockAudio)
              resolve(true)
            })
            .catch((error) => {
              log(`iOS audio unlock failed: ${error.message}`, "WARN")
              // Continue without audio
              audioInitialized = true
              resolve(true)
            })
        }

        // Add event listeners for iOS audio unlock
        document.addEventListener("touchstart", unlockAudio, { once: true })
        document.addEventListener("click", unlockAudio, { once: true })

        // Fallback timeout
        setTimeout(() => {
          if (!audioInitialized) {
            log("Audio initialization timeout - continuing without audio", "WARN")
            audioInitialized = true
            resolve(true)
          }
        }, 5000)
      } else {
        // Non-iOS audio initialization
        bgMusic.loop = true
        bgMusic.preload = "auto"
        flySound.preload = "auto"
        hitSound.preload = "auto"

        audioInitialized = true
        log("Audio initialized for non-iOS device")
        resolve(true)
      }
    } catch (error) {
      logError(error, "Audio initialization failed")
      audioInitialized = true // Continue without audio
      resolve(false)
    }
  })
}

// Enhanced canvas sizing with iOS fixes
function updateCanvasSize() {
  try {
    log("Updating canvas size...")

    const container = document.querySelector(".game-container")
    if (!container) {
      throw new Error("Game container not found")
    }

    const containerRect = container.getBoundingClientRect()
    log(`Container size: ${containerRect.width}x${containerRect.height}`)

    if (isMobile) {
      let viewportWidth = window.innerWidth
      let viewportHeight = window.innerHeight

      // iOS-specific viewport handling
      if (isIOS) {
        // Handle iOS viewport quirks
        const visualViewport = window.visualViewport
        if (visualViewport) {
          viewportWidth = visualViewport.width
          viewportHeight = visualViewport.height
          log(`Visual viewport: ${viewportWidth}x${viewportHeight}`)
        }

        // Handle notch area
        if (hasNotch) {
          const safeAreaTop = Number.parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--sat") || "0",
          )
          const safeAreaBottom = Number.parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--sab") || "0",
          )
          log(`Safe area: top=${safeAreaTop}, bottom=${safeAreaBottom}`)
        }
      }

      const devicePixelRatio = window.devicePixelRatio || 1
      let scaleFactor = devicePixelRatio

      // Limit scale factor for iOS performance
      if (isIOS) {
        scaleFactor = Math.min(devicePixelRatio, 2)
      }

      log(`Device pixel ratio: ${devicePixelRatio}, Scale factor: ${scaleFactor}`)

      board.width = viewportWidth * scaleFactor
      board.height = viewportHeight * scaleFactor
      ui.width = viewportWidth * scaleFactor
      ui.height = viewportHeight * scaleFactor

      board.style.width = viewportWidth + "px"
      board.style.height = viewportHeight + "px"
      ui.style.width = viewportWidth + "px"
      ui.style.height = viewportHeight + "px"

      const scaleX = (viewportWidth * scaleFactor) / boardWidth
      const scaleY = (viewportHeight * scaleFactor) / boardHeight

      window.gameScaleX = scaleX
      window.gameScaleY = scaleY

      log(`Game scale: ${scaleX}x${scaleY}`)
    } else {
      // Desktop sizing
      const containerWidth = containerRect.width
      const containerHeight = containerRect.height

      board.width = containerWidth
      board.height = containerHeight
      ui.width = containerWidth
      ui.height = containerHeight

      const scaleX = containerWidth / boardWidth
      const scaleY = containerHeight / boardHeight

      window.gameScaleX = scaleX
      window.gameScaleY = scaleY

      log(`Desktop scale: ${scaleX}x${scaleY}`)
    }

    // Apply iOS-specific canvas styles
    if (isIOS) {
      board.style.webkitTransform = "translateZ(0)"
      board.style.webkitBackfaceVisibility = "hidden"
      ui.style.webkitTransform = "translateZ(0)"
      ui.style.webkitBackfaceVisibility = "hidden"
    }

    log("Canvas size updated successfully")
    return true
  } catch (error) {
    logError(error, "Canvas size update failed")
    return false
  }
}

// Game initialization with comprehensive error handling
async function initializeGame() {
  try {
    log("=== GAME INITIALIZATION STARTED ===")

    // Step 1: Create debug console
    createDebugConsole()

    // Step 2: Detect device and browser
    if (!detectDeviceAndBrowser()) {
      throw new Error("Device detection failed")
    }

    // Step 3: Apply iOS optimizations
    if (isIOS) {
      applyIOSOptimizations()
    }

    // Step 4: Initialize canvas
    if (!initializeCanvas()) {
      throw new Error("Canvas initialization failed")
    }

    // Step 5: Update canvas size
    if (!updateCanvasSize()) {
      throw new Error("Canvas sizing failed")
    }

    // Step 6: Load images
    await loadImages()

    // Step 7: Initialize audio
    await initializeAudio()

    // Step 8: Setup event listeners
    setupEventListeners()

    // Step 9: Initialize game state
    initializeGameState()

    // Step 10: Show homepage
    showHomepage()

    gameInitialized = true
    log("=== GAME INITIALIZATION COMPLETED SUCCESSFULLY ===")

    return true
  } catch (error) {
    logError(error, "Game initialization failed")
    showErrorScreen(error)
    return false
  }
}

function initializeGameState() {
  try {
    log("Initializing game state...")

    // Initialize game variables
    gameOver = false
    gameStarted = false
    score = 0
    highScore = Number.parseInt(localStorage.getItem("supermanHighScore")) || 0
    currentLevel = 0
    lastLevelCheckpoint = 0
    velocityX = baseVelocityX
    velocityY = 0
    Superman.x = SupermanX
    Superman.y = SupermanY
    pipeArray = []
    powerUpArray = []
    enemyArray = []
    shieldActive = false
    isPaused = false
    isCountdownActive = false
    countdown = 3

    // Initialize performance monitoring
    frameCount = 0
    lastFPSCheck = performance.now()
    lastFrameTime = performance.now()
    frameTimeBuffer = []

    log("Game state initialized successfully")
  } catch (error) {
    logError(error, "Game state initialization failed")
  }
}

function showErrorScreen(error) {
  try {
    log("Showing error screen...")

    // Create error screen
    const errorScreen = document.createElement("div")
    errorScreen.id = "error-screen"
    errorScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    `

    errorScreen.innerHTML = `
      <h1 style="font-size: 24px; margin-bottom: 20px;">⚠️ Game Loading Error</h1>
      <p style="font-size: 16px; margin-bottom: 20px;">
        The game failed to initialize properly on your device.
      </p>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px; max-width: 90%; overflow: auto;">
        <strong>Error Details:</strong><br>
        ${error.message}<br><br>
        <strong>Device Info:</strong><br>
        ${navigator.userAgent}<br><br>
        <strong>Screen:</strong> ${window.innerWidth}x${window.innerHeight}<br>
        <strong>iOS:</strong> ${isIOS ? "Yes" : "No"}<br>
        <strong>Safari:</strong> ${isSafari ? "Yes" : "No"}
      </div>
      <button id="retry-btn" style="
        background: #fff;
        color: #333;
        border: none;
        padding: 15px 30px;
        border-radius: 25px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        margin: 10px;
      ">🔄 Retry</button>
      <button id="debug-btn" style="
        background: rgba(255,255,255,0.2);
        color: #fff;
        border: 2px solid #fff;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 14px;
        cursor: pointer;
        margin: 10px;
      ">🐛 Show Debug Info</button>
    `

    document.body.appendChild(errorScreen)

    // Add retry functionality
    document.getElementById("retry-btn").addEventListener("click", () => {
      document.body.removeChild(errorScreen)
      location.reload()
    })

    // Add debug functionality
    document.getElementById("debug-btn").addEventListener("click", () => {
      if (debugElement) {
        debugElement.style.display = "block"
      }
    })
  } catch (e) {
    console.error("Failed to show error screen:", e)
  }
}

// Touch handling variables - browser-optimized
let touchStartTime = 0
let touchStartY = 0
let isTouchActive = false
let lastTouchTime = 0

// Superman
const SupermanWidth = 74.8
const SupermanHeight = 32.4
const SupermanX = boardWidth / 8
const SupermanY = boardHeight / 2
let SupermanImg

const Superman = {
  x: SupermanX,
  y: SupermanY,
  width: SupermanWidth,
  height: SupermanHeight,
}

// Pipes
let pipeArray = []
const pipeWidth = 64
const pipeHeight = 512
const pipeX = boardWidth
const pipeY = 0

// Difficulty parameters
const basePipeInterval = 1700
const minPipeInterval = 900
const maxPipeInterval = 1720
const basePipeGap = boardHeight / 3.2
const minPipeGap = 90
const baseVelocityX = -2
const maxVelocityX = -6
const levelSpeedIncrease = -0.5
const baseObstacleChance = 0.1
const obstacleIncreasePerLevel = 0.05

// Images - browser-optimized loading
let topPipeImg
let bottomPipeImg
let newTopPipeImg
let newBottomPipeImg
let gameOverImg
let yourScoreImg
let highScoreImg
let collisionImg

// Game variables
let velocityX = baseVelocityX
let velocityY = 0
const gravity = 0.4
let gameOver = false
let score = 0
let highScore = 0
let gameStarted = false
let pipeInterval = null
let animationFrameId = null
let currentLevel = 0
let lastLevelCheckpoint = 0
let countdown = 3
let isCountdownActive = false
let lastPipeGap = { top: 0, bottom: 0 }

// Level animation
let isLevelAnimating = false
let levelAnimationStartTime = 0
const levelAnimationDuration = 1000

// Sound elements - browser-optimized
const bgMusic = new Audio("./sound/bg.mp3")
const flySound = new Audio("./sound/fly.mp3")
const hitSound = new Audio("./sound/hit.mp3")
let soundEnabled = true
let isPaused = false

// UI elements
const pauseBtn = document.getElementById("pause-btn")
const playBtn = document.getElementById("play-btn")
const soundBtnHome = document.getElementById("sound-btn-home")
const muteBtnHome = document.getElementById("mute-btn-home")
const soundBtnGameover = document.getElementById("sound-btn-gameover")
const muteBtnGameover = document.getElementById("mute-btn-gameover")

// Enhanced event listener setup with iOS fixes
function setupEventListeners() {
  try {
    log("Setting up event listeners...")

    // Button event listeners
    setupButton(startBtn, startGame)
    setupButton(restartBtn, restartGame)
    setupButton(pauseBtn, pauseGame)
    setupButton(playBtn, resumeGame)
    setupButton(resumeBtn, resumeGame)
    setupButton(soundBtnHome, toggleSound)
    setupButton(muteBtnHome, toggleSound)
    setupButton(soundBtnGameover, toggleSound)
    setupButton(muteBtnGameover, toggleSound)
    setupButton(soundBtnPause, toggleSound)
    setupButton(muteBtnPause, toggleSound)

    // Keyboard controls (desktop only)
    if (!isMobile) {
      document.addEventListener("keydown", handleKeyPress)
    }

    if (isMobile) {
      // Mobile touch controls with iOS optimizations
      if (board) {
        board.addEventListener("touchstart", handleGameTouchStart, { passive: false })
        board.addEventListener("touchend", handleGameTouchEnd, { passive: false })

        if (isIOS) {
          board.addEventListener("touchcancel", handleGameTouchEnd, { passive: false })
        }
      }

      const gameContainer = document.querySelector(".game-container")
      if (gameContainer) {
        gameContainer.addEventListener("touchstart", handleContainerTouch, { passive: false })
      }

      document.addEventListener("touchstart", handleGlobalTouch, { passive: false })
    } else {
      // Desktop mouse controls
      if (board) {
        board.addEventListener("click", handleDesktopClick)
      }
      document.addEventListener("click", handleDesktopGlobalClick)
    }

    // Window event listeners
    window.addEventListener("resize", () => {
      log("Window resized")
      setTimeout(updateCanvasSize, 100)
    })

    window.addEventListener("orientationchange", () => {
      log("Orientation changed")
      setTimeout(() => {
        updateCanvasSize()
        if (isIOS) {
          // iOS-specific orientation handling
          setTimeout(updateCanvasSize, 500)
        }
      }, 200)
    })

    // iOS-specific event listeners
    if (isIOS) {
      // Handle iOS viewport changes
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => {
          log("Visual viewport resized")
          setTimeout(updateCanvasSize, 100)
        })
      }

      // Handle iOS app state changes
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          log("App went to background")
          if (gameStarted && !gameOver && !isPaused) {
            pauseGame()
          }
        } else {
          log("App came to foreground")
        }
      })
    }

    log("Event listeners set up successfully")
  } catch (error) {
    logError(error, "Event listener setup failed")
  }
}

function setupButton(button, callback) {
  if (!button) {
    log(`Button not found for callback: ${callback.name}`, "WARN")
    return
  }

  try {
    // Remove existing event listeners
    button.removeEventListener("click", callback)
    button.removeEventListener("touchend", handleButtonTouch)

    // iOS-optimized touch handling
    function handleButtonTouch(e) {
      e.preventDefault()
      e.stopPropagation()

      button.classList.add("button-active")

      if (isIOS) {
        // iOS-optimized button response
        setTimeout(() => {
          button.classList.remove("button-active")
          callback()
        }, 50)
      } else {
        requestAnimationFrame(() => {
          button.classList.remove("button-active")
          callback()
        })
      }
    }

    // Click event for all devices
    button.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      log(`Button clicked: ${button.id}`)
      callback()
    })

    if (isMobile) {
      button.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          button.classList.add("button-active")
          log(`Button touch start: ${button.id}`)
        },
        { passive: false },
      )

      button.addEventListener("touchend", handleButtonTouch, { passive: false })

      button.addEventListener(
        "touchcancel",
        (e) => {
          e.preventDefault()
          button.classList.remove("button-active")
          log(`Button touch cancel: ${button.id}`)
        },
        { passive: false },
      )
    }
  } catch (error) {
    logError(error, `Button setup failed for: ${button.id}`)
  }
}

// iOS-optimized touch handlers
function handleGameTouchStart(e) {
  if (!isMobile) return

  try {
    e.preventDefault()
    e.stopPropagation()

    const now = performance.now()
    log(`Game touch start - Time: ${now}`)

    if (now - lastTouchTime < TOUCH_DEBOUNCE_TIME) {
      log("Touch debounced")
      return
    }
    lastTouchTime = now

    if (!gameStarted || gameOver || isPaused || isCountdownActive) {
      log("Game not ready for touch input")
      return
    }

    isTouchActive = true
    touchStartTime = now
    touchStartY = e.touches[0].clientY

    // Immediate jump response
    velocityY = -6
    log("Jump triggered")

    if (soundEnabled && audioInitialized) {
      flySound.currentTime = 0
      flySound.play().catch((error) => {
        log(`Fly sound failed: ${error.message}`, "WARN")
      })
    }
  } catch (error) {
    logError(error, "Game touch start failed")
  }
}

function handleGameTouchEnd(e) {
  if (!isMobile) return

  try {
    e.preventDefault()
    e.stopPropagation()
    isTouchActive = false
    log("Game touch end")
  } catch (error) {
    logError(error, "Game touch end failed")
  }
}

function handleGlobalTouch(e) {
  if (!isMobile) return

  try {
    if (e.target.closest(".game-control")) return

    e.preventDefault()
    log("Global touch detected")

    if (isCountdownActive) return

    if (!gameStarted && !gameOver) {
      log("Starting game from global touch")
      startGame()
      return
    }

    if (isPaused) {
      log("Resuming game from global touch")
      resumeGame()
      return
    }
  } catch (error) {
    logError(error, "Global touch failed")
  }
}

function handleContainerTouch(e) {
  if (!isMobile) return

  try {
    if (e.target.closest(".game-control")) return
    if (e.target.closest(".pause-overlay")) return
    if (gameOver) return

    e.preventDefault()
    e.stopPropagation()

    const now = performance.now()

    if (now - lastTouchTime < TOUCH_DEBOUNCE_TIME) {
      return
    }
    lastTouchTime = now

    if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
      velocityY = -6
      log("Container touch jump")

      if (soundEnabled && audioInitialized) {
        flySound.currentTime = 0
        flySound.play().catch(() => {})
      }
    }
  } catch (error) {
    logError(error, "Container touch failed")
  }
}

function handleDesktopClick(e) {
  if (!isDesktop) return

  try {
    e.preventDefault()
    e.stopPropagation()

    if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
      velocityY = -6
      if (soundEnabled && audioInitialized) {
        flySound.currentTime = 0
        flySound.play().catch(() => {})
      }
    }
  } catch (error) {
    logError(error, "Desktop click failed")
  }
}

function handleDesktopGlobalClick(e) {
  if (!isDesktop) return

  try {
    if (e.target.closest(".game-control")) return
    if (e.target.closest(".pause-overlay")) return

    if (isCountdownActive) return

    if (!gameStarted && !gameOver) {
      startGame()
      return
    }

    if (isPaused) {
      resumeGame()
      return
    }
  } catch (error) {
    logError(error, "Desktop global click failed")
  }
}

function toggleSound() {
  try {
    soundEnabled = !soundEnabled
    log(`Sound toggled: ${soundEnabled}`)

    if (gameOver) {
      soundBtnGameover.style.display = soundEnabled ? "block" : "none"
      muteBtnGameover.style.display = soundEnabled ? "none" : "block"
    } else if (isPaused) {
      soundBtnPause.style.display = soundEnabled ? "block" : "none"
      muteBtnPause.style.display = soundEnabled ? "none" : "block"
    } else if (!gameStarted) {
      soundBtnHome.style.display = soundEnabled ? "block" : "none"
      muteBtnHome.style.display = soundEnabled ? "none" : "block"
    }

    if (soundEnabled && audioInitialized) {
      bgMusic.play().catch(() => {})
    } else {
      bgMusic.pause()
    }
  } catch (error) {
    logError(error, "Sound toggle failed")
  }
}

function updateSoundDisplay() {
  try {
    const showSound = soundEnabled
    soundBtnHome.style.display = showSound ? "block" : "none"
    muteBtnHome.style.display = showSound ? "none" : "block"
    soundBtnGameover.style.display = showSound ? "block" : "none"
    muteBtnGameover.style.display = showSound ? "none" : "block"
  } catch (error) {
    logError(error, "Sound display update failed")
  }
}

function pauseGame() {
  try {
    if (!gameStarted || gameOver) return

    log("Pausing game")
    isPaused = true
    pauseOverlay.style.display = "flex"
    pauseBtn.style.display = "none"
    playBtn.style.display = "block"
    soundBtnPause.style.display = soundEnabled ? "flex" : "none"
    muteBtnPause.style.display = soundEnabled ? "none" : "flex"

    if (audioInitialized) {
      bgMusic.pause()
    }

    cancelAnimationFrame(animationFrameId)
    clearInterval(pipeInterval)
  } catch (error) {
    logError(error, "Pause game failed")
  }
}

function resumeGame() {
  try {
    log("Resuming game")
    isPaused = false
    pauseOverlay.style.display = "none"
    pauseBtn.style.display = "block"
    playBtn.style.display = "none"

    if (soundEnabled && audioInitialized) {
      bgMusic.play().catch(() => {})
    }

    pipeInterval = setDynamicPipeInterval()
    cancelAnimationFrame(animationFrameId)
    requestAnimationFrame(update)
  } catch (error) {
    logError(error, "Resume game failed")
  }
}

function startGame() {
  try {
    log("Starting game...")

    if (!gameInitialized || !resourcesLoaded) {
      log("Game not ready to start", "WARN")
      return
    }

    gameOver = false
    gameStarted = true
    score = 0
    currentLevel = 0
    lastLevelCheckpoint = 0
    velocityX = baseVelocityX
    velocityY = 0
    Superman.y = SupermanY
    pipeArray = []
    isLevelAnimating = false
    powerUpArray = []
    enemyArray = []
    shieldActive = false

    // Reset performance monitoring
    frameCount = 0
    lastFPSCheck = performance.now()
    lastFrameTime = performance.now()
    frameTimeBuffer = []

    // Hide/show elements
    homepage.style.display = "none"
    board.style.display = "block"
    ui.style.display = "block"
    startBtn.style.display = "none"
    restartBtn.style.display = "none"
    pauseBtn.style.display = "none"
    soundBtnHome.style.display = "none"
    muteBtnHome.style.display = "none"
    soundBtnGameover.style.display = "none"
    muteBtnGameover.style.display = "none"

    // Start countdown
    isCountdownActive = true
    countdown = 3
    animateCountdown()

    log("Game started successfully")
  } catch (error) {
    logError(error, "Start game failed")
  }
}

function animateCountdown() {
  if (!isCountdownActive) return

  try {
    const scaleX = window.gameScaleX || 1
    const scaleY = window.gameScaleY || 1

    context.save()
    context.scale(scaleX, scaleY)
    uiContext.save()
    uiContext.scale(scaleX, scaleY)

    // Clear canvases
    context.clearRect(0, 0, boardWidth, boardHeight)
    uiContext.clearRect(0, 0, boardWidth, boardHeight)

    // Draw Superman
    if (SupermanImg && SupermanImg.complete) {
      context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)
    }

    // Animate countdown number
    const fontSize = 100 + 50 * (countdown - Math.floor(countdown))
    const alpha = 1 - (countdown - Math.floor(countdown))

    uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`
    uiContext.font = `bold ${fontSize}px Arial`
    uiContext.textAlign = "center"
    uiContext.fillText(Math.ceil(countdown).toString(), boardWidth / 2, boardHeight / 2)

    countdown -= 0.016

    context.restore()
    uiContext.restore()

    if (countdown <= 0) {
      isCountdownActive = false
      gameStarted = true
      pauseBtn.style.display = "block"

      if (soundEnabled && audioInitialized) {
        bgMusic.play().catch(() => {})
      }

      pipeInterval = setDynamicPipeInterval()
      requestAnimationFrame(update)
      log("Countdown completed, game loop started")
    } else {
      requestAnimationFrame(animateCountdown)
    }
  } catch (error) {
    logError(error, "Countdown animation failed")
  }
}

function update() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  try {
    // Performance monitoring
    monitorPerformance()

    animationFrameId = requestAnimationFrame(update)

    // Scale context to match viewport
    const scaleX = window.gameScaleX || 1
    const scaleY = window.gameScaleY || 1

    context.save()
    context.scale(scaleX, scaleY)
    uiContext.save()
    uiContext.scale(scaleX, scaleY)

    // Clear canvases
    context.clearRect(0, 0, boardWidth, boardHeight)
    uiContext.clearRect(0, 0, boardWidth, boardHeight)

    currentLevel = Math.floor(score / 15)
    if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
      isLevelAnimating = true
      levelAnimationStartTime = performance.now()
      updateDifficulty()
    }

    // UI elements
    uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
    uiContext.fillRect(0, 0, boardWidth, 50)
    uiContext.fillStyle = "#FFD700"
    uiContext.font = "16px Arial"
    uiContext.textAlign = "center"
    uiContext.fillText(`HIGH: ${highScore}`, boardWidth / 2 - 140, 30)
    uiContext.textAlign = "center"
    uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30)

    // Superman physics
    velocityY += gravity
    Superman.y = Math.max(Superman.y + velocityY, 0)

    if (SupermanImg && SupermanImg.complete) {
      context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)
    }

    if (Superman.y > board.height) endGame()

    // Handle pipes
    for (let i = 0; i < pipeArray.length; i++) {
      const pipe = pipeArray[i]
      pipe.x += velocityX

      if (pipe.img && pipe.img.complete) {
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)
      }

      if (!pipe.passed && Superman.x > pipe.x + pipe.width) {
        score += 0.5
        pipe.passed = true
      }

      if (detectCollision(Superman, pipe)) {
        drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height)
        endGame(pipe)
      }
    }

    // Clean up pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
      pipeArray.shift()
    }

    if (currentLevel !== lastLevelCheckpoint) {
      lastLevelCheckpoint = currentLevel
      if (pipeInterval) clearInterval(pipeInterval)
      pipeInterval = setDynamicPipeInterval()
    }

    // Score display
    uiContext.fillStyle = "#FFD700"
    uiContext.font = "bold 45px 'Arial Black'"
    uiContext.textAlign = "center"
    uiContext.fillText(Math.floor(score), boardWidth / 2, 100)

    // Level animation
    if (isLevelAnimating) {
      const elapsed = performance.now() - levelAnimationStartTime
      const progress = Math.min(elapsed / levelAnimationDuration, 1)
      uiContext.save()
      uiContext.textAlign = "center"
      uiContext.fillStyle = `rgba(255, 215, 0, ${1 - progress})`
      uiContext.font = `bold ${40 + 20 * (1 - progress)}px Arial`
      uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, boardHeight / 2)
      uiContext.restore()
      if (progress >= 1) isLevelAnimating = false
    }

    // Handle shield
    if (shieldActive && Date.now() > shieldEndTime) {
      shieldActive = false
    }

    // Draw shield if active
    if (shieldActive) {
      const timeLeft = shieldEndTime - Date.now()
      const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0

      const shieldSize = 50

      if (!isFlashing && powerUpImg && powerUpImg.complete) {
        context.drawImage(
          powerUpImg,
          Superman.x - (shieldSize - Superman.width) / 2,
          Superman.y - (shieldSize - Superman.height) / 2,
          shieldSize,
          shieldSize,
        )
      } else if (powerUpImg && powerUpImg.complete) {
        context.globalAlpha = 0.5
        context.drawImage(
          powerUpImg,
          Superman.x - (shieldSize - Superman.width) / 2,
          Superman.y - (shieldSize - Superman.height) / 2,
          shieldSize,
          shieldSize,
        )
        context.globalAlpha = 1.0
      }

      if (timeLeft <= 0) {
        shieldActive = false
      }
    }

    // Handle powerups
    for (let i = powerUpArray.length - 1; i >= 0; i--) {
      const p = powerUpArray[i]
      p.x += velocityX

      if (p.img && p.img.complete) {
        context.drawImage(p.img, p.x, p.y, p.width, p.height)
      }

      if (detectCollision(Superman, p)) {
        shieldActive = true
        shieldEndTime = Date.now() + shieldDuration
        powerUpArray.splice(i, 1)
      }

      if (p.x < -p.width) powerUpArray.splice(i, 1)
    }

    // Handle enemies
    for (let i = enemyArray.length - 1; i >= 0; i--) {
      const e = enemyArray[i]
      e.x += e.speed

      if (e.img && e.img.complete) {
        context.drawImage(e.img, e.x, e.y, e.width, e.height)
      }

      if (!shieldActive && detectCollision(Superman, e)) {
        drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height)
        endGame()
      }

      if (e.x < -e.width) enemyArray.splice(i, 1)
    }

    const now = Date.now()

    if (now - lastPowerUpSpawn > powerUpSpawnInterval) {
      spawnPowerUp()
      lastPowerUpSpawn = now
    }

    if (now - lastEnemySpawn > enemySpawnInterval) {
      spawnEnemy()
      lastEnemySpawn = now
    }

    context.restore()
    uiContext.restore()
  } catch (error) {
    logError(error, "Game update failed")
  }
}

function monitorPerformance() {
  const now = performance.now()
  const frameTime = now - lastFrameTime
  lastFrameTime = now

  frameTimeBuffer.push(frameTime)
  if (frameTimeBuffer.length > 60) {
    frameTimeBuffer.shift()
  }

  averageFrameTime = frameTimeBuffer.reduce((a, b) => a + b, 0) / frameTimeBuffer.length
  currentFPS = 1000 / averageFrameTime

  frameCount++

  if (now - lastFPSCheck >= 1000) {
    const measuredFPS = frameCount
    frameCount = 0
    lastFPSCheck = now

    if (measuredFPS < 45) {
      performanceMode = "low-performance"
    } else if (measuredFPS > 55) {
      performanceMode = isIOS ? "ios-optimized" : isSafari ? "safari-optimized" : "normal"
    }
  }
}

function updateDifficulty() {
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  velocityX = baseVelocityX + levelSpeedIncrease * effectiveLevel
  velocityX = Math.max(maxVelocityX, velocityX)
}

function placePipes() {
  if (gameOver || !gameStarted) return

  try {
    const currentGap = basePipeGap
    const minPipeY = -pipeHeight + 50
    const maxPipeY = 0 - currentGap - 150
    const randomPipeY = Math.random() * (maxPipeY - minPipeY) + minPipeY

    const gapTopY = randomPipeY + pipeHeight
    const gapBottomY = gapTopY + basePipeGap
    lastPipeGap = { top: gapTopY, bottom: gapBottomY }

    let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel
    obstacleChance = Math.min(obstacleChance, 0.75)

    const topPipeType = Math.random() < obstacleChance ? "obstacle" : "normal"
    const bottomPipeType = Math.random() < obstacleChance ? "obstacle" : "normal"

    const topImg = topPipeType === "obstacle" ? newTopPipeImg : topPipeImg
    const bottomImg = bottomPipeType === "obstacle" ? newBottomPipeImg : bottomPipeImg

    pipeArray.push({
      img: topImg,
      x: pipeX,
      y: randomPipeY,
      width: pipeWidth,
      height: pipeHeight,
      passed: false,
    })

    pipeArray.push({
      img: bottomImg,
      x: pipeX,
      y: randomPipeY + pipeHeight + currentGap,
      width: pipeWidth,
      height: pipeHeight,
      passed: false,
    })
  } catch (error) {
    logError(error, "Place pipes failed")
  }
}

function setDynamicPipeInterval() {
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  let interval = basePipeInterval - effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL
  interval = Math.max(interval, minPipeInterval)
  return setInterval(placePipes, interval)
}

function handleKeyPress(e) {
  try {
    if (e.code === "KeyM") toggleSound()
    if (isCountdownActive) return
    if (e.code === "KeyP" && !gameOver) {
      if (isPaused) resumeGame()
      else pauseGame()
    }
    if (!gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
      startGame()
      return
    }

    if (gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
      velocityY = -6
      if (soundEnabled && audioInitialized) {
        flySound.currentTime = 0
        flySound.play().catch(() => {})
      }
    }

    if (gameOver && e.code === "Enter") restartGame()
  } catch (error) {
    logError(error, "Key press failed")
  }
}

function restartGame() {
  try {
    log("Restarting game...")

    if (pipeInterval) {
      clearInterval(pipeInterval)
      pipeInterval = null
    }

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    gameOver = false
    gameStarted = false
    score = 0
    currentLevel = 0
    lastLevelCheckpoint = 0
    velocityX = baseVelocityX
    velocityY = 0
    Superman.y = SupermanY
    pipeArray = []
    isLevelAnimating = false
    shieldActive = false
    powerUpArray = []
    enemyArray = []

    // Reset performance monitoring
    frameCount = 0
    lastFPSCheck = performance.now()
    lastFrameTime = performance.now()
    frameTimeBuffer = []

    context.clearRect(0, 0, board.width, board.height)
    uiContext.clearRect(0, 0, board.width, board.height)

    if (soundEnabled && audioInitialized) {
      bgMusic.play().catch(() => {})
    }

    showHomepage()
    log("Game restarted successfully")
  } catch (error) {
    logError(error, "Restart game failed")
  }
}

function endGame() {
  try {
    log("Ending game...")
    gameOver = true

    if (score > highScore) {
      highScore = score
      localStorage.setItem("supermanHighScore", highScore)
      log(`New high score: ${highScore}`)
    }

    pauseBtn.style.display = "none"
    board.style.display = "block"
    homepage.style.display = "none"
    ui.style.display = "block"
    restartBtn.style.display = "block"

    uiContext.clearRect(0, 0, board.width, board.height)

    uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
    uiContext.fillRect(0, 0, boardWidth, boardHeight)

    const centerX = boardWidth / 2

    if (gameOverImg && gameOverImg.complete) {
      uiContext.drawImage(gameOverImg, centerX - 225, 95, 450, 200)
    }

    uiContext.fillStyle = "#FFD700"
    uiContext.font = "bold 45px 'Arial Black'"
    uiContext.textAlign = "center"
    uiContext.fillText(Math.floor(score), centerX, 100)

    if (highScoreImg && highScoreImg.complete) {
      uiContext.drawImage(highScoreImg, centerX - 110, 280, 150, 80)
    }
    uiContext.fillText(highScore, centerX + 75, 330)

    soundBtnGameover.style.display = soundEnabled ? "block" : "none"
    muteBtnGameover.style.display = soundEnabled ? "none" : "block"

    if (pipeInterval) clearInterval(pipeInterval)

    if (audioInitialized) {
      bgMusic.pause()
      if (soundEnabled) {
        hitSound.currentTime = 0
        hitSound.play().catch(() => {})
      }
    }

    log("Game ended successfully")
  } catch (error) {
    logError(error, "End game failed")
  }
}

function spawnPowerUp() {
  try {
    powerUpArray.push({
      img: powerUpImg,
      x: boardWidth,
      y: Math.random() * (boardHeight - 40),
      width: 40,
      height: 40,
    })
  } catch (error) {
    logError(error, "Spawn power up failed")
  }
}

function spawnEnemy() {
  try {
    const enemyHeight = 40
    let y
    let tries = 0

    do {
      y = Math.random() * (boardHeight - enemyHeight)
      tries++
    } while (lastPipeGap && y + enemyHeight > lastPipeGap.top && y < lastPipeGap.bottom && tries < 10)

    let speed = baseEnemySpeed + enemySpeedIncrease * currentLevel
    speed = Math.max(maxEnemySpeed, speed)
    speed += Math.random() - 0.5

    enemyArray.push({
      img: enemyImg,
      x: boardWidth,
      y: y,
      width: 60,
      height: enemyHeight,
      speed: speed,
    })
  } catch (error) {
    logError(error, "Spawn enemy failed")
  }
}

function detectCollision(a, b) {
  if (shieldActive) return false
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function drawCollisionEffect(x, y, width, height) {
  try {
    const scale = 1
    const collisionW = width * scale
    const collisionH = height * scale
    const collisionX = x + (width - collisionW) / 2
    const collision
