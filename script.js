// === CONFIGURATION ===
const CONFIG = {
    TOTAL_QUESTIONS: 8,
    FOLDERS: {
        dialogues: { path: 'assets/dialogues/', count: 50, label: 'Dialogue' },
        logos: { path: 'assets/logos/', count: 50, label: 'Logo' },
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
    result: document.getElementById('result-screen')
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

function endGame() {
    const percentage = Math.round((gameState.score / CONFIG.TOTAL_QUESTIONS) * 100);
    switchScreen(screens.game, screens.result);
    setTimeout(() => {
        animateScore(percentage);
        displayPerformanceMessage(percentage);
    }, 400);
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
    switchScreen(screens.result, screens.landing);
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

// Fix for iOS "Double Tap to Zoom" delay
document.addEventListener('touchend', (e) => {
    // Only prevents default if clicking buttons to speed up reaction time
    if(e.target.tagName === 'BUTTON') {
        // Optional: can add e.preventDefault() here if specific button bugs occur
    }
}, false);

// Initial call
console.log('PRAKARSH \'26 Game Loaded for Mobile');