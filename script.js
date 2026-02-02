// === CONFIGURATION ===
const CONFIG = {
    TOTAL_QUESTIONS: 8,
    FOLDERS: {
        dialogues: { path: 'assets/dialogues/', count: 45, label: 'Dialogue' },
        logos: { path: 'assets/logos/', count: 28, label: 'Logo' },
        memes: { path: 'assets/memes/', count: 31, label: 'Meme' }
    },
    IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

// === MOBILE VIEWPORT & TEXT FIX ===
function adjustMobileViewport() {
    // 1. Fix Layout Height (Address Bar Bug)
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // 2. FIX: Resize Title Text to fit Mobile Screens
    const titleText = document.querySelector('.title-line');
    
    // Check if screen is mobile (less than 768px)
    if (titleText && window.innerWidth < 768) {
        // CHANGED: Reduced from 10vw to 8.5vw
        // ADDED: width: 100% to ensure it uses all available space
        // ADDED: letter-spacing: -1px to squeeze text slightly
        titleText.style.cssText = `
            font-size: 8.5vw !important; 
            line-height: 1.2 !important;
            width: 100% !important;
            letter-spacing: -1px !important;
            display: block !important;
            text-align: center !important;
        `;
    } else if (titleText) {
        // Reset for desktop
        titleText.style.cssText = ""; 
    }
}
window.addEventListener('resize', adjustMobileViewport);
window.addEventListener('orientationchange', adjustMobileViewport);
// Run immediately on load
adjustMobileViewport();

// === GAME STATE ===
let gameState = {
    currentQuestionIndex: 0,
    score: 0,
    questions: [],
    undoStack: []
};

// === DOM ELEMENTS ===
const screens = {
    landing: document.getElementById('landing-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen'),
    wheel: document.getElementById('wheel-screen')
};

const elements = {
    startBtn: document.getElementById('start-game-btn'),
    restartBtn: document.getElementById('restart-btn'),
    correctBtn: document.getElementById('correct-btn'),
    wrongBtn: document.getElementById('wrong-btn'),
    undoBtn: document.getElementById('undo-btn'),
    gameImage: document.getElementById('game-image'),
    categoryBadge: document.getElementById('category-badge'),
    questionNumber: document.getElementById('question-number'),
    progressFill: document.getElementById('progress-fill'),
    currentScore: document.getElementById('current-score'),
    finalScore: document.getElementById('final-score'),
    scoreDetails: document.getElementById('score-details'),
    performanceMessage: document.getElementById('performance-message'),
    scoreCircleProgress: document.getElementById('score-circle-progress')
};

// === UTILITY FUNCTIONS ===

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function switchScreen(from, to) {
    from.classList.remove('active');
    setTimeout(() => {
        // Force scroll to top for mobile view logic
        window.scrollTo(0,0);
        to.classList.add('active');
    }, 300);
}

function generateImagePool() {
    const pool = [];
    Object.entries(CONFIG.FOLDERS).forEach(([folderName, folderData]) => {
        for (let i = 1; i <= folderData.count; i++) {
            const ext = CONFIG.IMAGE_EXTENSIONS[0];
            pool.push({
                path: `${folderData.path}${i}${ext}`,
                category: folderData.label,
                folder: folderName,
                number: i
            });
        }
    });
    return pool;
}

function selectRandomQuestions() {
    const imagePool = generateImagePool();
    const shuffled = shuffleArray(imagePool);
    const selected = [];
    const usedImages = new Set();
    
    for (const image of shuffled) {
        const uniqueKey = `${image.folder}-${image.number}`;
        if (!usedImages.has(uniqueKey) && selected.length < CONFIG.TOTAL_QUESTIONS) {
            selected.push(image);
            usedImages.add(uniqueKey);
        }
    }
    return selected;
}

// === GAME LOGIC ===

function initGame() {
    gameState = {
        currentQuestionIndex: 0,
        score: 0,
        questions: selectRandomQuestions(),
        undoStack: []
    };
}

function startGame() {
    initGame();
    switchScreen(screens.landing, screens.game);
    setTimeout(() => loadQuestion(), 400);
}

function loadQuestion() {
    if (gameState.currentQuestionIndex >= CONFIG.TOTAL_QUESTIONS) {
        endGame();
        return;
    }
    
    const question = gameState.questions[gameState.currentQuestionIndex];
    const questionNum = gameState.currentQuestionIndex + 1;
    
    elements.questionNumber.textContent = questionNum;
    elements.categoryBadge.textContent = question.category;
    elements.currentScore.textContent = `${gameState.score}/${gameState.currentQuestionIndex}`;
    
    const progress = (questionNum / CONFIG.TOTAL_QUESTIONS) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    loadImageWithFallback(question);
    updateUndoButton();
}

function loadImageWithFallback(question) {
    const img = new Image();
    img.onload = () => {
        elements.gameImage.src = question.path;
        elements.gameImage.style.opacity = '1';
    };
    img.onerror = () => {
        const currentIndex = CONFIG.IMAGE_EXTENSIONS.indexOf(
            question.path.substring(question.path.lastIndexOf('.'))
        );
        if (currentIndex < CONFIG.IMAGE_EXTENSIONS.length - 1) {
            const basePath = question.path.substring(0, question.path.lastIndexOf('.'));
            question.path = basePath + CONFIG.IMAGE_EXTENSIONS[currentIndex + 1];
            loadImageWithFallback(question);
        } else {
            elements.gameImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="%23000"/><text x="50%" y="50%" text-anchor="middle" fill="%2300f0ff" font-size="20" font-family="Arial">Image not found</text></svg>';
        }
    };
    elements.gameImage.style.opacity = '0';
    img.src = question.path;
}

function updateUndoButton() {
    elements.undoBtn.disabled = !(gameState.undoStack && gameState.undoStack.length > 0);
}

function handleAnswer(isCorrect) {
    const frame = document.querySelector('.image-frame');
    const animationClass = isCorrect ? 'flash-correct' : 'flash-wrong';
    
    frame.classList.add(animationClass);
    setTimeout(() => frame.classList.remove(animationClass), 600);
    
    gameState.undoStack.push({
        questionIndex: gameState.currentQuestionIndex,
        score: gameState.score
    });
    
    if (isCorrect) gameState.score++;
    gameState.currentQuestionIndex++;
    
    setTimeout(() => loadQuestion(), 400);
}

function handleUndo() {
    if (!gameState.undoStack || gameState.undoStack.length === 0) return;
    const previousState = gameState.undoStack.pop();
    gameState.currentQuestionIndex = previousState.questionIndex;
    gameState.score = previousState.score;
    loadQuestion();
}

// === CONFETTI ===
function startConfetti() {
    const container = document.getElementById('celebration');
    if (!container) return;
    
    // Clear existing
    container.innerHTML = '';
    
    const colors = ['#00f0ff', '#b000ff', '#00ff88', '#ff0055', '#ffffff', '#ffee00'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Random properties
        const left = Math.random() * 100;
        const animDuration = 3 + Math.random() * 4; // 3-7s
        const animDelay = Math.random() * 5; // 0-5s
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        confetti.style.left = `${left}%`;
        confetti.style.animationDuration = `${animDuration}s`;
        confetti.style.animationDelay = `${animDelay}s`;
        confetti.style.backgroundColor = color;
        
        // Random size
        const size = 5 + Math.random() * 10;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        
        container.appendChild(confetti);
    }
}

function stopConfetti() {
    const container = document.getElementById('celebration');
    if (container) {
        container.innerHTML = '';
    }
}

// === WHEEL CONFIGURATION ===
const WHEEL_CONFIG = {
    segments: [
        { label: '5%', color: '#00f0ff', probability: 0.38 },
        { label: '6%', color: '#b000ff', probability: 0.38 },
        { label: '8%', color: '#00ff88', probability: 0.24 }
    ],
    // Repeat segments to make the wheel look fuller (e.g. 6 slices)
    // We will alternate them. 
    fullSegments: [] 
};

// Generate full segments array for display (e.g., repeating the pattern twice for 6 slices)
// Probabilities are handled logically, visual slices are just for display.
function initWheelSegments() {
    WHEEL_CONFIG.fullSegments = [
        { label: '5%', color: '#00eeff70', value: '5% Discount' },
        { label: '6%', color: '#391b7e70', value: '6% Discount' },
        { label: '8%', color: '#00ff8870', value: '8% Discount' },
        { label: '5%', color: '#00eeff70', value: '5% Discount' },
        { label: '6%', color: '#391b7e70', value: '6% Discount' },
        { label: '8%', color: '#00ff8870', value: '8% Discount' }
    ];
}
initWheelSegments();

let wheelState = {
    rotation: 0,
    isSpinning: false,
    hasSpun: false
};

// === WHEEL FUNCTIONS ===

function drawWheel() {
    const canvas = document.getElementById('bonus-wheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;
    const segments = WHEEL_CONFIG.fullSegments;
    const arc = (Math.PI * 2) / segments.length;

    ctx.clearRect(0, 0, width, height);
    
    // Draw Segments
    segments.forEach((segment, i) => {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = segment.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.stroke();

        // Draw Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Poppins";
        ctx.fillText(segment.label, radius - 20, 10);
        ctx.restore();
    });

    // Draw Outer Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    
   
}

function spinTheWheel() {
    if (wheelState.isSpinning || wheelState.hasSpun) return;
    
    wheelState.isSpinning = true;
    document.getElementById('spin-btn').disabled = true;
    
    // Determine the result based on probability
    const rand = Math.random();
    let cumulativeProbability = 0;
    let selectedTypeIndex = 0;
    
    // Logic for Probabilities: 5% (0.37), 6% (0.37), 8% (0.26)
    // We map this to our 6 slices logic. 
    // Slices 0, 3 are 5%
    // Slices 1, 4 are 6%
    // Slices 2, 5 are 8%
    
    let winningBaseIndex = 0; // 0, 1, or 2
    
    if (rand < 0.37) {
        winningBaseIndex = 0; // 5%
    } else if (rand < 0.37 + 0.37) {
        winningBaseIndex = 1; // 6%
    } else {
        winningBaseIndex = 2; // 8%
    }
    
    // Randomly choose one of the two slices for that prize to add variety
    const winningSliceIndex = winningBaseIndex + (Math.random() < 0.5 ? 0 : 3);
    const winningSegment = WHEEL_CONFIG.fullSegments[winningSliceIndex];
    
    // Calculate rotation
    // We need to land on the chosen slice. The pointer is at the top (270 degrees or -90 degrees).
    // In our drawing, 0 radians is at 3 o'clock. 
    // Top is 3 * PI / 2.
    
    const sliceAngle = (Math.PI * 2) / WHEEL_CONFIG.fullSegments.length; // 60 degrees
    
    // Target angle to rotate TO
    // We want the center of the winning slice to align with 3 * PI / 2 (270 deg)
    // The center of slice i is at: i * sliceAngle + sliceAngle / 2
    // So we want: rotation + (i * sliceAngle + sliceAngle / 2) = 3 * PI / 2 + 2 * PI * K
    
    // Simpler way: add many rotations + offset
    const spins = 5;
    const degreesPerSlice = 360 / WHEEL_CONFIG.fullSegments.length;
    
    // The winning index 'i' starts at 'i * 60'. To bring it to top (270), we rotate:
    // 270 - (center of slice)
    // Center of slice in current rotation: (winningSliceIndex * 60 + 30)
    // Delta needed: 270 - (winningSliceIndex * 60 + 30)
    
    const targetRotation = 270 - (winningSliceIndex * degreesPerSlice + degreesPerSlice / 2);
    const totalRotation = 360 * spins + targetRotation;
    
    const canvas = document.getElementById('bonus-wheel');
    canvas.style.transform = `rotate(${totalRotation}deg)`;
    
    setTimeout(() => {
        wheelState.isSpinning = false;
        wheelState.hasSpun = true;
        const resultDiv = document.getElementById('spin-result');
        resultDiv.textContent = `You won: ${winningSegment.value}!`;
        // Confetti again!
        startConfetti();
        // Show restart button
        // document.getElementById('wheel-restart-btn').style.display = 'block';
    }, 4000); // 4s matches CSS transition
}

function endGame() {
    const percentage = Math.round((gameState.score / CONFIG.TOTAL_QUESTIONS) * 100);
    
    // Only show confetti if score is 40% or higher
    if (percentage >= 40) {
        startConfetti();
    }
    
    switchScreen(screens.game, screens.result);
    setTimeout(() => {
        animateScore(percentage);
        displayPerformanceMessage(percentage);
        
        // Reset wheel entry buttons
        const claimBtn = document.getElementById('claim-bonus-btn');
        const restartBtn = document.getElementById('restart-btn');
        claimBtn.style.display = 'none';
        restartBtn.style.display = 'block';

        // Check if wheel condition is met (>= 5 questions correct)
        if (gameState.score >= 5) {
            claimBtn.style.display = 'block';
            restartBtn.style.display = 'none'; 
            // Ensure button is centered (if not handled by CSS)
            claimBtn.style.margin = '0 auto 1rem auto';
        }
        
    }, 400);
}

function goToWheel() {
    switchScreen(screens.result, screens.wheel);
    drawWheel();
     // Reset wheel state if needed
     wheelState = { rotation: 0, isSpinning: false, hasSpun: false };
     document.getElementById('bonus-wheel').style.transform = 'rotate(0deg)';
     document.getElementById('spin-btn').disabled = false;
     document.getElementById('spin-result').textContent = '';
     document.getElementById('wheel-restart-btn').style.display = 'none';
     stopConfetti(); // Stop previous confetti
}

function animateScore(targetPercentage) {
    elements.scoreDetails.textContent = `${gameState.score}/${CONFIG.TOTAL_QUESTIONS} Correct`;
    const circumference = 565.48;
    const offset = circumference - (targetPercentage / 100) * circumference;
    
    setTimeout(() => {
        elements.scoreCircleProgress.style.strokeDashoffset = offset;
    }, 100);
    
    let currentPercentage = 0;
    const increment = targetPercentage / 60;
    const percentageInterval = setInterval(() => {
        currentPercentage += increment;
        if (currentPercentage >= targetPercentage) {
            currentPercentage = targetPercentage;
            clearInterval(percentageInterval);
        }
        elements.finalScore.textContent = `${Math.round(currentPercentage)}%`;
    }, 30);
}

function displayPerformanceMessage(percentage) {
    let message = percentage === 100 ? '🎉 PERFECT!' : percentage >= 75 ? '🌟 Excellent!' : percentage >= 50 ? '👍 Great job!' : '🎯 Keep trying!';
    elements.performanceMessage.querySelector('p').textContent = message;
}

function restartGame() {
    stopConfetti();
    // Check which screen is active to switch from
    const activeScreen = screens.wheel.classList.contains('active') ? screens.wheel : screens.result;
    switchScreen(activeScreen, screens.landing);
    
    setTimeout(() => {
        elements.scoreCircleProgress.style.strokeDashoffset = '565.48';
        elements.finalScore.textContent = '0%';
    }, 500);
}

// === EVENT LISTENERS ===
elements.startBtn.addEventListener('click', startGame);
elements.restartBtn.addEventListener('click', restartGame);
elements.correctBtn.addEventListener('click', () => handleAnswer(true));
elements.wrongBtn.addEventListener('click', () => handleAnswer(false));
elements.undoBtn.addEventListener('click', handleUndo);
document.getElementById('spin-btn')?.addEventListener('click', spinTheWheel);
document.getElementById('claim-bonus-btn')?.addEventListener('click', goToWheel);
document.getElementById('wheel-restart-btn')?.addEventListener('click', restartGame);
document.getElementById('spin-btn')?.addEventListener('click', spinTheWheel);

// Fix for iOS "Double Tap to Zoom" delay
document.addEventListener('touchend', (e) => {
    // Only prevents default if clicking buttons to speed up reaction time
    if(e.target.tagName === 'BUTTON') {
        // Optional: can add e.preventDefault() here if specific button bugs occur
    }
}, false);

// Initial call
console.log('PRAKARSH \'26 Game Loaded for Mobile');