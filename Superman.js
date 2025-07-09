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

// Device detection and performance optimization
let isDesktop = false
let isMobile = false
let isIOS = false
let performanceMode = "normal"

// Performance monitoring
let frameCount = 0
let lastFPSCheck = 0
let currentFPS = 60
let targetFPS = 60

// Touch handling variables - optimized for iOS
let touchStartTime = 0
let touchStartY = 0
let isTouchActive = false
let lastTouchTime = 0
const TOUCH_DEBOUNCE_TIME = 50 // Prevent rapid touch events

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

// Images - preloaded and optimized
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

// Sound elements - optimized for iOS
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

// Performance optimization functions
function detectDevice() {
  const userAgent = navigator.userAgent
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // iOS detection
  isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)

  // Check for desktop: large screen + fine pointer + no touch primary input
  isDesktop =
    screenWidth >= 769 && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(hover: none)").matches
  isMobile = !isDesktop

  // Performance mode based on device
  if (isIOS) {
    performanceMode = "ios-optimized"
    targetFPS = 60
  } else if (isMobile) {
    performanceMode = "mobile-optimized"
    targetFPS = 60
  } else {
    performanceMode = "desktop"
    targetFPS = 60
  }

  console.log(`Device: ${isIOS ? "iOS" : isMobile ? "Mobile" : "Desktop"} | Performance Mode: ${performanceMode}`)
}

function optimizeAudioForIOS() {
  if (isIOS) {
    // iOS audio optimizations
    bgMusic.preload = "auto"
    flySound.preload = "auto"
    hitSound.preload = "auto"

    // Reduce audio quality for better performance
    bgMusic.volume = 0.7
    flySound.volume = 0.8
    hitSound.volume = 0.8

    // Enable hardware acceleration for audio
    bgMusic.setAttribute("webkit-playsinline", "true")
    flySound.setAttribute("webkit-playsinline", "true")
    hitSound.setAttribute("webkit-playsinline", "true")
  }
}

function optimizeCanvasForIOS() {
  if (isIOS) {
    // iOS canvas optimizations
    const contextOptions = {
      alpha: false,
      desynchronized: true,
      powerPreference: "high-performance",
    }

    // Re-get contexts with optimizations
    if (context) {
      context.imageSmoothingEnabled = false
      context.webkitImageSmoothingEnabled = false
    }

    if (uiContext) {
      uiContext.imageSmoothingEnabled = false
      uiContext.webkitImageSmoothingEnabled = false
    }
  }
}

function monitorPerformance() {
  frameCount++
  const now = performance.now()

  if (now - lastFPSCheck >= 1000) {
    currentFPS = frameCount
    frameCount = 0
    lastFPSCheck = now

    // Adjust performance based on FPS
    if (currentFPS < 45 && performanceMode !== "low-performance") {
      performanceMode = "low-performance"
      console.log("Switching to low-performance mode")
    } else if (currentFPS > 55 && performanceMode === "low-performance") {
      performanceMode = isIOS ? "ios-optimized" : "normal"
      console.log("Switching back to normal performance mode")
    }
  }
}

// Responsive canvas scaling - optimized for iOS
function updateCanvasSize() {
  detectDevice()

  const container = document.querySelector(".game-container")
  const containerRect = container.getBoundingClientRect()

  if (isMobile) {
    // Mobile: Full viewport with iOS optimizations
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Use device pixel ratio for crisp rendering on iOS
    const devicePixelRatio = window.devicePixelRatio || 1
    const scaleFactor = isIOS ? Math.min(devicePixelRatio, 2) : 1

    board.width = viewportWidth * scaleFactor
    board.height = viewportHeight * scaleFactor
    ui.width = viewportWidth * scaleFactor
    ui.height = viewportHeight * scaleFactor

    // Scale back down with CSS for crisp rendering
    board.style.width = viewportWidth + "px"
    board.style.height = viewportHeight + "px"
    ui.style.width = viewportWidth + "px"
    ui.style.height = viewportHeight + "px"

    const scaleX = (viewportWidth * scaleFactor) / boardWidth
    const scaleY = (viewportHeight * scaleFactor) / boardHeight

    window.gameScaleX = scaleX
    window.gameScaleY = scaleY

    board.style.transform = "none"
    ui.style.transform = "none"
  } else {
    // Desktop: Fixed container size
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
    board.style.transform = "none"
    ui.style.width = "100%"
    ui.style.height = "100%"
    ui.style.transform = "none"
  }

  // Apply iOS-specific optimizations
  optimizeCanvasForIOS()
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

  // Detect device and optimize
  detectDevice()
  updateCanvasSize()
  optimizeAudioForIOS()

  // Add event listeners for responsive updates
  window.addEventListener("resize", () => {
    setTimeout(updateCanvasSize, 100)
  })

  window.addEventListener("orientationchange", () => {
    setTimeout(updateCanvasSize, 200)
  })

  // Load and optimize images
  const imageLoadPromises = []

  powerUpImg.src = "./images/powerups.png"
  enemyImg.src = "./images/enemy.png"

  SupermanImg = new Image()
  SupermanImg.src = "./images/superman1.png"

  topPipeImg = new Image()
  topPipeImg.src = "./images/toppipe.png"

  bottomPipeImg = new Image()
  bottomPipeImg.src = "./images/bottompipe.png"

  newTopPipeImg = new Image()
  newTopPipeImg.src = "./images/pipe11.png"

  newBottomPipeImg = new Image()
  newBottomPipeImg.src = "./images/pipe1.png"

  gameOverImg = new Image()
  gameOverImg.src = "./images/gameover.png"

  highScoreImg = new Image()
  highScoreImg.src = "./images/highscore.png"

  collisionImg = new Image()
  collisionImg.src = "./images/collision.png"

  // Optimize images for iOS
  if (isIOS) {
    ;[
      powerUpImg,
      enemyImg,
      SupermanImg,
      topPipeImg,
      bottomPipeImg,
      newTopPipeImg,
      newBottomPipeImg,
      gameOverImg,
      highScoreImg,
      collisionImg,
    ].forEach((img) => {
      img.style.imageRendering = "-webkit-optimize-contrast"
      img.style.imageRendering = "optimize-contrast"
    })
  }

  // Initialize sound
  bgMusic.loop = true
  updateSoundDisplay()

  // Setup event listeners
  setupEventListeners()
  showHomepage()

  // iOS-specific touch behavior prevention
  if (isIOS) {
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

    // Prevent iOS bounce effect
    document.addEventListener(
      "touchforcechange",
      (e) => {
        e.preventDefault()
      },
      { passive: false },
    )
  }
}

function setupEventListeners() {
  // Enhanced button setup with iOS optimizations
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
    // Optimized mobile touch controls
    board.addEventListener("touchstart", handleGameTouchStart, { passive: false })
    board.addEventListener("touchend", handleGameTouchEnd, { passive: false })

    if (isIOS) {
      // iOS-specific optimizations
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

  // Remove existing event listeners to avoid duplicates
  button.removeEventListener("click", callback)
  button.removeEventListener("touchend", handleButtonTouch)

  // iOS-optimized touch handling for buttons
  function handleButtonTouch(e) {
    e.preventDefault()
    e.stopPropagation()

    // Immediate visual feedback for iOS
    button.classList.add("button-active")

    // Use requestAnimationFrame for smooth iOS performance
    requestAnimationFrame(() => {
      button.classList.remove("button-active")
      callback()
    })
  }

  // Add both mouse and touch events
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

// Optimized mobile touch handlers for iOS
function handleGameTouchStart(e) {
  if (!isMobile) return

  e.preventDefault()
  e.stopPropagation()

  const now = performance.now()

  // Debounce rapid touches for iOS performance
  if (now - lastTouchTime < TOUCH_DEBOUNCE_TIME) {
    return
  }
  lastTouchTime = now

  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  isTouchActive = true
  touchStartTime = now
  touchStartY = e.touches[0].clientY

  // Immediate response for iOS - no delay
  velocityY = -6

  if (soundEnabled) {
    // Optimized audio playback for iOS
    if (isIOS) {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    } else {
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

  // Debounce for iOS performance
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

// Desktop mouse handlers
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

  // Clear canvases efficiently
  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

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

  // Efficient clearing for iOS
  if (isIOS && performanceMode === "low-performance") {
    // Use fillRect for better iOS performance in low-performance mode
    context.fillStyle = "#000"
    context.fillRect(0, 0, boardWidth, boardHeight)
    uiContext.clearRect(0, 0, boardWidth, boardHeight)
  } else {
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
