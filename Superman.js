// Game constants
const boardWidth = 360
const boardHeight = 640
let context
let uiContext
const homepage = document.getElementById("homepage")
let board = document.getElementById("board")
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

// Browser and device detection
let isDesktop = false
let isMobile = false
let isIOS = false
let isSafari = false
let isChrome = false
let isWebKit = false
let performanceMode = "normal"
let TOUCH_DEBOUNCE_TIME = 50 // Initial value for TOUCH_DEBOUNCE_TIME

// Performance monitoring and optimization
let frameCount = 0
let lastFPSCheck = 0
let currentFPS = 60
let targetFPS = 60
let lastFrameTime = 0
let frameTimeBuffer = []
let averageFrameTime = 16.67 // 60fps target

// Safari-specific optimizations
const safariOptimizations = {
  useOffscreenCanvas: false,
  reduceImageSmoothing: true,
  optimizeAudioLoading: true,
  useRequestIdleCallback: false,
  batchDOMUpdates: true,
  useWebGLFallback: false,
}

// Chrome-specific optimizations
const chromeOptimizations = {
  useOffscreenCanvas: true,
  enableImageSmoothing: false,
  useAdvancedAudio: true,
  useRequestIdleCallback: true,
  enableGPUAcceleration: true,
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

// Image cache for Safari optimization
const imageCache = new Map()
let preloadedImages = false

// Game variables
let velocityX = baseVelocityX
let velocityY = 0
const gravity = 0.4
let gameOver = false
let score = 0
let highScore = Number.parseInt(localStorage.getItem("supermanHighScore")) || 0
let gameStarted = false
let pipeInterval = null
let animationFrameId = null
let currentLevel = 0
let lastLevelCheckpoint = 0
let countdown = 3
let isCountdownActive = false
let lastPipeGap = { top: 0, bottom: 0 } // Stores the Y-range of the pipe gap

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
let audioContext = null
const audioBuffers = new Map()

// UI elements
const pauseBtn = document.getElementById("pause-btn")
const playBtn = document.getElementById("play-btn")
const soundBtnHome = document.getElementById("sound-btn-home")
const muteBtnHome = document.getElementById("mute-btn-home")
const soundBtnGameover = document.getElementById("sound-btn-gameover")
const muteBtnGameover = document.getElementById("mute-btn-gameover")

// Browser detection and optimization setup
function detectBrowserAndOptimize() {
  const userAgent = navigator.userAgent
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // Browser detection
  isSafari = /^((?!chrome|android).)*safari/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent)
  isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor)
  isWebKit = /WebKit/.test(userAgent)
  isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

  // Device detection
  isDesktop =
    screenWidth >= 769 && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(hover: none)").matches
  isMobile = !isDesktop

  // Performance mode based on browser and device
  if (isSafari) {
    performanceMode = "safari-optimized"
    targetFPS = 60
    TOUCH_DEBOUNCE_TIME = 30 // Faster response for Safari
  } else if (isChrome) {
    performanceMode = "chrome-optimized"
    targetFPS = 60
  } else if (isIOS) {
    performanceMode = "ios-webkit"
    targetFPS = 60
  } else {
    performanceMode = "standard"
    targetFPS = 60
  }

  console.log(
    `Browser: ${isSafari ? "Safari" : isChrome ? "Chrome" : "Other"} | Device: ${isIOS ? "iOS" : isMobile ? "Mobile" : "Desktop"} | Mode: ${performanceMode}`,
  )

  // Apply browser-specific optimizations
  if (isSafari) {
    applySafariOptimizations()
  } else if (isChrome) {
    applyChromeOptimizations()
  }
}

function applySafariOptimizations() {
  // Safari-specific canvas optimizations
  safariOptimizations.useOffscreenCanvas = false // Safari has poor OffscreenCanvas support
  safariOptimizations.reduceImageSmoothing = true
  safariOptimizations.optimizeAudioLoading = true
  safariOptimizations.batchDOMUpdates = true

  // Safari-specific CSS optimizations
  document.documentElement.style.setProperty("--webkit-transform", "translateZ(0)")
  document.body.style.webkitBackfaceVisibility = "hidden"
  document.body.style.webkitPerspective = "1000px"

  // Optimize for Safari's rendering engine
  if (board) {
    board.style.webkitTransform = "translateZ(0)"
    board.style.webkitBackfaceVisibility = "hidden"
  }

  if (ui) {
    ui.style.webkitTransform = "translateZ(0)"
    ui.style.webkitBackfaceVisibility = "hidden"
  }
}

function applyChromeOptimizations() {
  // Chrome-specific optimizations
  chromeOptimizations.useOffscreenCanvas = true
  chromeOptimizations.enableImageSmoothing = false
  chromeOptimizations.useAdvancedAudio = true
  chromeOptimizations.enableGPUAcceleration = true

  // Chrome-specific performance hints
  if (board) {
    board.style.willChange = "transform"
  }

  if (ui) {
    ui.style.willChange = "transform"
  }
}

function optimizeAudioForBrowser() {
  if (isSafari) {
    // Safari audio optimizations
    bgMusic.preload = "metadata" // Reduce initial loading
    flySound.preload = "auto"
    hitSound.preload = "auto"

    // Safari-specific audio settings
    bgMusic.volume = 0.6
    flySound.volume = 0.7
    hitSound.volume = (0.7)[
      // Enable hardware acceleration for Safari
      (bgMusic, flySound, hitSound)
    ].forEach((audio) => {
      audio.setAttribute("webkit-playsinline", "true")
      audio.setAttribute("playsinline", "true")
      audio.muted = false
    })

    // Safari audio context optimization
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.log("AudioContext not supported")
    }
  } else if (isChrome) {
    // Chrome audio optimizations
    bgMusic.preload = "auto"
    flySound.preload = "auto"
    hitSound.preload = "auto"

    // Chrome-specific audio settings
    bgMusic.volume = 0.8
    flySound.volume = 0.9
    hitSound.volume = 0.9
  }
}

function optimizeCanvasForBrowser() {
  if (!context || !uiContext) return

  if (isSafari) {
    // Safari canvas optimizations
    const contextOptions = {
      alpha: false,
      desynchronized: true,
      powerPreference: "high-performance",
      antialias: false,
    }

    // Disable image smoothing for better Safari performance
    context.imageSmoothingEnabled = false
    context.webkitImageSmoothingEnabled = false
    context.mozImageSmoothingEnabled = false
    context.msImageSmoothingEnabled = false

    uiContext.imageSmoothingEnabled = false
    uiContext.webkitImageSmoothingEnabled = false
    uiContext.mozImageSmoothingEnabled = false
    uiContext.msImageSmoothingEnabled = false

    // Safari-specific rendering optimizations
    context.textRenderingOptimization = "speed"
    uiContext.textRenderingOptimization = "speed"
  } else if (isChrome) {
    // Chrome canvas optimizations
    context.imageSmoothingEnabled = false
    uiContext.imageSmoothingEnabled = false

    // Chrome-specific optimizations
    if (context.getContextAttributes) {
      const attrs = context.getContextAttributes()
      if (attrs) {
        attrs.desynchronized = true
        attrs.powerPreference = "high-performance"
      }
    }
  }
}

function preloadImagesOptimized() {
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

  const imagePromises = imageUrls.map((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()

      if (isSafari) {
        // Safari-specific image loading
        img.crossOrigin = "anonymous"
        img.style.imageRendering = "-webkit-optimize-contrast"
      } else if (isChrome) {
        // Chrome-specific image loading
        img.style.imageRendering = "pixelated"
      }

      img.onload = () => {
        imageCache.set(url, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = url
    })
  })

  return Promise.all(imagePromises).then(() => {
    preloadedImages = true
    console.log("Images preloaded for", isSafari ? "Safari" : "Chrome")
  })
}

function monitorPerformanceAdvanced() {
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

    // Browser-specific performance adjustments
    if (isSafari && measuredFPS < 45) {
      // Safari performance degradation handling
      performanceMode = "safari-low-performance"
      safariOptimizations.reduceImageSmoothing = true
      safariOptimizations.batchDOMUpdates = true
    } else if (isChrome && measuredFPS < 50) {
      // Chrome performance degradation handling
      performanceMode = "chrome-low-performance"
    } else if (measuredFPS > 55) {
      // Restore normal performance mode
      performanceMode = isSafari ? "safari-optimized" : isChrome ? "chrome-optimized" : "standard"
    }

    console.log(
      `FPS: ${measuredFPS} | Mode: ${performanceMode} | Browser: ${isSafari ? "Safari" : isChrome ? "Chrome" : "Other"}`,
    )
  }
}

// Responsive canvas scaling - browser-optimized
function updateCanvasSize() {
  detectBrowserAndOptimize()

  const container = document.querySelector(".game-container")
  const containerRect = container.getBoundingClientRect()

  if (isMobile) {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (isSafari) {
      // Safari-specific canvas sizing
      const devicePixelRatio = window.devicePixelRatio || 1
      const scaleFactor = Math.min(devicePixelRatio, 2) // Limit for Safari performance

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
    } else {
      // Chrome and other browsers
      const devicePixelRatio = window.devicePixelRatio || 1

      board.width = viewportWidth * devicePixelRatio
      board.height = viewportHeight * devicePixelRatio
      ui.width = viewportWidth * devicePixelRatio
      ui.height = viewportHeight * devicePixelRatio

      board.style.width = viewportWidth + "px"
      board.style.height = viewportHeight + "px"
      ui.style.width = viewportWidth + "px"
      ui.style.height = viewportHeight + "px"

      const scaleX = (viewportWidth * devicePixelRatio) / boardWidth
      const scaleY = (viewportHeight * devicePixelRatio) / boardHeight

      window.gameScaleX = scaleX
      window.gameScaleY = scaleY
    }
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

    board.style.width = "100%"
    board.style.height = "100%"
    ui.style.width = "100%"
    ui.style.height = "100%"
  }

  // Apply browser-specific canvas optimizations
  optimizeCanvasForBrowser()
}

window.onload = () => {
  board = document.getElementById("board")
  board.height = boardHeight
  board.width = boardWidth
  context = board.getContext("2d")

  const uiCanvas = document.getElementById("ui")
  uiCanvas.height = boardHeight
  uiCanvas.width = boardWidth
  uiContext = uiCanvas.getContext("2d")

  // Browser detection and optimization
  detectBrowserAndOptimize()
  updateCanvasSize()
  optimizeAudioForBrowser()

  // Preload images with browser optimization
  preloadImagesOptimized().then(() => {
    // Initialize images after preloading
    powerUpImg.src = "./images/powerups.png"
    enemyImg.src = "./images/enemy.png"
    SupermanImg = imageCache.get("./images/superman1.png") || new Image()
    if (!SupermanImg.src) SupermanImg.src = "./images/superman1.png"

    topPipeImg = imageCache.get("./images/toppipe.png") || new Image()
    if (!topPipeImg.src) topPipeImg.src = "./images/toppipe.png"

    bottomPipeImg = imageCache.get("./images/bottompipe.png") || new Image()
    if (!bottomPipeImg.src) bottomPipeImg.src = "./images/bottompipe.png"

    newTopPipeImg = imageCache.get("./images/pipe11.png") || new Image()
    if (!newTopPipeImg.src) newTopPipeImg.src = "./images/pipe11.png"

    newBottomPipeImg = imageCache.get("./images/pipe1.png") || new Image()
    if (!newBottomPipeImg.src) newBottomPipeImg.src = "./images/pipe1.png"

    gameOverImg = imageCache.get("./images/gameover.png") || new Image()
    if (!gameOverImg.src) gameOverImg.src = "./images/gameover.png"

    highScoreImg = imageCache.get("./images/highscore.png") || new Image()
    if (!highScoreImg.src) highScoreImg.src = "./images/highscore.png"

    collisionImg = imageCache.get("./images/collision.png") || new Image()
    if (!collisionImg.src) collisionImg.src = "./images/collision.png"
  })

  // Add event listeners for responsive updates
  window.addEventListener("resize", () => {
    setTimeout(updateCanvasSize, 100)
  })

  window.addEventListener("orientationchange", () => {
    setTimeout(updateCanvasSize, 200)
  })

  // Initialize sound
  bgMusic.loop = true
  updateSoundDisplay()

  // Setup event listeners
  setupEventListeners()
  showHomepage()

  // Browser-specific touch behavior prevention
  if (isSafari || isMobile) {
    document.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()
      },
      { passive: false },
    )

    document.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
      },
      { passive: false },
    )

    if (isSafari) {
      // Safari-specific touch optimizations
      document.addEventListener(
        "touchforcechange",
        (e) => {
          e.preventDefault()
        },
        { passive: false },
      )
    }
  }
}

function setupEventListeners() {
  // Browser-optimized button setup
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

  // Keyboard controls (desktop)
  document.addEventListener("keydown", handleKeyPress)

  if (isMobile) {
    // Browser-optimized mobile touch controls
    board.addEventListener("touchstart", handleGameTouchStart, { passive: false })
    board.addEventListener("touchend", handleGameTouchEnd, { passive: false })

    if (isSafari) {
      // Safari-specific touch optimizations
      board.addEventListener("touchcancel", handleGameTouchEnd, { passive: false })
    }

    const gameContainer = document.querySelector(".game-container")
    gameContainer.addEventListener("touchstart", handleContainerTouch, { passive: false })
    document.addEventListener("touchstart", handleGlobalTouch, { passive: false })
  } else {
    // Desktop mouse controls
    board.addEventListener("click", handleDesktopClick)
    document.addEventListener("click", handleDesktopGlobalClick)
  }
}

function setupButton(button, callback) {
  if (!button) return

  // Remove existing event listeners
  button.removeEventListener("click", callback)
  button.removeEventListener("touchend", handleButtonTouch)

  // Browser-optimized touch handling
  function handleButtonTouch(e) {
    e.preventDefault()
    e.stopPropagation()

    button.classList.add("button-active")

    if (isSafari) {
      // Safari-optimized button response
      setTimeout(() => {
        button.classList.remove("button-active")
        callback()
      }, 50) // Faster response for Safari
    } else {
      // Chrome and other browsers
      requestAnimationFrame(() => {
        button.classList.remove("button-active")
        callback()
      })
    }
  }

  button.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    callback()
  })

  if (isMobile) {
    button.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        button.classList.add("button-active")
      },
      { passive: false },
    )

    button.addEventListener("touchend", handleButtonTouch, { passive: false })

    button.addEventListener(
      "touchcancel",
      (e) => {
        e.preventDefault()
        button.classList.remove("button-active")
      },
      { passive: false },
    )
  }
}

// Browser-optimized touch handlers
function handleGameTouchStart(e) {
  if (!isMobile) return

  e.preventDefault()
  e.stopPropagation()

  const now = performance.now()

  if (now - lastTouchTime < TOUCH_DEBOUNCE_TIME) {
    return
  }
  lastTouchTime = now

  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  isTouchActive = true
  touchStartTime = now
  touchStartY = e.touches[0].clientY

  // Immediate jump response
  velocityY = -6

  if (soundEnabled) {
    if (isSafari) {
      // Safari audio optimization
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    } else {
      // Chrome and other browsers
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    }
  }
}

function handleGameTouchEnd(e) {
  if (!isMobile) return
  e.preventDefault()
  e.stopPropagation()
  isTouchActive = false
}

function handleGlobalTouch(e) {
  if (!isMobile) return
  if (e.target.closest(".game-control")) return
  e.preventDefault()

  if (isCountdownActive) return

  if (!gameStarted && !gameOver) {
    startGame()
    return
  }

  if (isPaused) {
    resumeGame()
    return
  }
}

function handleContainerTouch(e) {
  if (!isMobile) return
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
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    }
  }
}

function handleDesktopClick(e) {
  if (!isDesktop) return

  e.preventDefault()
  e.stopPropagation()

  if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
    velocityY = -6
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    }
  }
}

function handleDesktopGlobalClick(e) {
  if (!isDesktop) return

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
}

function toggleSound() {
  soundEnabled = !soundEnabled

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

  if (soundEnabled) {
    bgMusic.play().catch(() => {})
  } else {
    bgMusic.pause()
  }
}

function updateSoundDisplay() {
  const showSound = soundEnabled
  soundBtnHome.style.display = showSound ? "block" : "none"
  muteBtnHome.style.display = showSound ? "none" : "block"
  soundBtnGameover.style.display = showSound ? "block" : "none"
  muteBtnGameover.style.display = showSound ? "none" : "block"
}

function pauseGame() {
  if (!gameStarted || gameOver) return

  isPaused = true
  pauseOverlay.style.display = "flex"
  pauseBtn.style.display = "none"
  playBtn.style.display = "block"
  soundBtnPause.style.display = soundEnabled ? "flex" : "none"
  muteBtnPause.style.display = soundEnabled ? "none" : "flex"
  bgMusic.pause()
  cancelAnimationFrame(animationFrameId)
  clearInterval(pipeInterval)
}

function resumeGame() {
  isPaused = false
  pauseOverlay.style.display = "none"
  pauseBtn.style.display = "block"
  playBtn.style.display = "none"
  if (soundEnabled) bgMusic.play().catch(() => {})
  pipeInterval = setDynamicPipeInterval()
  cancelAnimationFrame(animationFrameId)
  requestAnimationFrame(update)
}

function startGame() {
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
}

function animateCountdown() {
  if (!isCountdownActive) return

  const scaleX = window.gameScaleX || 1
  const scaleY = window.gameScaleY || 1

  context.save()
  context.scale(scaleX, scaleY)
  uiContext.save()
  uiContext.scale(scaleX, scaleY)

  // Browser-optimized clearing
  if (isSafari && performanceMode === "safari-low-performance") {
    context.fillStyle = "#000"
    context.fillRect(0, 0, boardWidth, boardHeight)
    uiContext.clearRect(0, 0, boardWidth, boardHeight)
  } else {
    context.clearRect(0, 0, boardWidth, boardHeight)
    uiContext.clearRect(0, 0, boardWidth, boardHeight)
  }

  // Draw Superman
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

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

    if (soundEnabled) bgMusic.play().catch(() => {})
    pipeInterval = setDynamicPipeInterval()
    requestAnimationFrame(update)
  } else {
    requestAnimationFrame(animateCountdown)
  }
}

function update() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  // Advanced performance monitoring
  monitorPerformanceAdvanced()

  animationFrameId = requestAnimationFrame(update)

  // Scale context to match viewport
  const scaleX = window.gameScaleX || 1
  const scaleY = window.gameScaleY || 1

  context.save()
  context.scale(scaleX, scaleY)
  uiContext.save()
  uiContext.scale(scaleX, scaleY)

  // Browser-optimized canvas clearing
  if (isSafari) {
    if (performanceMode === "safari-low-performance") {
      // Use fillRect for better Safari performance in low-performance mode
      context.fillStyle = "#000"
      context.fillRect(0, 0, boardWidth, boardHeight)
    } else {
      context.clearRect(0, 0, boardWidth, boardHeight)
    }
    uiContext.clearRect(0, 0, boardWidth, boardHeight)
  } else {
    // Chrome and other browsers
    context.clearRect(0, 0, boardWidth, boardHeight)
    uiContext.clearRect(0, 0, boardWidth, boardHeight)
  }

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

  // Superman physics (unchanged)
  velocityY += gravity
  Superman.y = Math.max(Superman.y + velocityY, 0)
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  if (Superman.y > board.height) endGame()

  // Optimized pipe handling
  for (let i = 0; i < pipeArray.length; i++) {
    const pipe = pipeArray[i]
    pipe.x += velocityX
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)

    if (!pipe.passed && Superman.x > pipe.x + pipe.width) {
      score += 0.5
      pipe.passed = true
    }

    if (detectCollision(Superman, pipe)) {
      drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height)
      endGame(pipe)
    }
  }

  // Efficient array cleanup
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

    if (!isFlashing) {
      context.drawImage(
        powerUpImg,
        Superman.x - (shieldSize - Superman.width) / 2,
        Superman.y - (shieldSize - Superman.height) / 2,
        shieldSize,
        shieldSize,
      )
    } else {
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
    context.drawImage(p.img, p.x, p.y, p.width, p.height)

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
    context.drawImage(e.img, e.x, e.y, e.width, e.height)

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
}

function updateDifficulty() {
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  velocityX = baseVelocityX + levelSpeedIncrease * effectiveLevel
  velocityX = Math.max(maxVelocityX, velocityX)
}

function placePipes() {
  if (gameOver || !gameStarted) return
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
}

function setDynamicPipeInterval() {
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  let interval = basePipeInterval - effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL
  interval = Math.max(interval, minPipeInterval)
  return setInterval(placePipes, interval)
}

function handleKeyPress(e) {
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
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    }
  }

  if (gameOver && e.code === "Enter") restartGame()
}

function restartGame() {
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

  if (soundEnabled) bgMusic.play().catch(() => {})
  showHomepage()
}

function endGame() {
  gameOver = true

  if (score > highScore) {
    highScore = score
    localStorage.setItem("supermanHighScore", highScore)
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

  uiContext.drawImage(gameOverImg, centerX - 225, 95, 450, 200)

  uiContext.fillStyle = "#FFD700"
  uiContext.font = "bold 45px 'Arial Black'"
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), centerX, 100)

  uiContext.drawImage(highScoreImg, centerX - 110, 280, 150, 80)
  uiContext.fillText(highScore, centerX + 75, 330)

  soundBtnGameover.style.display = soundEnabled ? "block" : "none"
  muteBtnGameover.style.display = soundEnabled ? "none" : "block"

  if (pipeInterval) clearInterval(pipeInterval)
  bgMusic.pause()

  if (soundEnabled) {
    hitSound.currentTime = 0
    hitSound.play().catch(() => {})
  }
}

function spawnPowerUp() {
  powerUpArray.push({
    img: powerUpImg,
    x: boardWidth,
    y: Math.random() * (boardHeight - 40),
    width: 40,
    height: 40,
  })
}

function spawnEnemy() {
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
}

function detectCollision(a, b) {
  if (shieldActive) return false
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function drawCollisionEffect(x, y, width, height) {
  const scale = 1
  const collisionW = width * scale
  const collisionH = height * scale
  const collisionX = x + (width - collisionW) / 2
  const collisionY = y + (height - collisionH) / 2
  context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH)
}

function showHomepage() {
  homepage.style.display = "block"
  board.style.display = "none"
  ui.style.display = "none"
  startBtn.style.display = "block"
  restartBtn.style.display = "none"
  pauseBtn.style.display = "none"
  playBtn.style.display = "none"
  soundBtnHome.style.display = soundEnabled ? "block" : "none"
  muteBtnHome.style.display = soundEnabled ? "none" : "block"
  soundBtnGameover.style.display = "none"
  muteBtnGameover.style.display = "none"

  gameOver = false
  gameStarted = false
  pipeArray = []
  score = 0
  Superman.y = SupermanY
  pauseOverlay.style.display = "none"
}
