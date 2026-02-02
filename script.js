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
        to.classList.add('active');
    }, 300);
}

function generateImagePool() {
    const pool = [];
    
    Object.entries(CONFIG.FOLDERS).forEach(([folderName, folderData]) => {
        for (let i = 1; i <= folderData.count; i++) {
            // Always start with the first extension to ensure fallback chain works
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
        if (selected.length === CONFIG.TOTAL_QUESTIONS) break;
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
    
    console.log('Game initialized with questions:', gameState.questions);
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
    
    // Update UI
    elements.questionNumber.textContent = questionNum;
    elements.categoryBadge.textContent = question.category;
    elements.currentScore.textContent = `${gameState.score}/${gameState.currentQuestionIndex}`;
    
    // Update progress bar
    const progress = (questionNum / CONFIG.TOTAL_QUESTIONS) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    // Load image
    loadImageWithFallback(question);
    
    // Update undo button state
    updateUndoButton();
}

function loadImageWithFallback(question) {
    const img = new Image();
    
    img.onload = () => {
        elements.gameImage.src = question.path;
        elements.gameImage.style.opacity = '0';
        setTimeout(() => {
            elements.gameImage.style.opacity = '1';
        }, 50);
    };
    
    img.onerror = () => {
        console.error(`Failed to load image: ${question.path}`);
        
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
    
    img.src = question.path;
}

// Update undo button enabled/disabled state
function updateUndoButton() {
    if (gameState.undoStack && gameState.undoStack.length > 0) {
        elements.undoBtn.disabled = false;
    } else {
        elements.undoBtn.disabled = true;
    }
}

function handleCorrect() {
    // Flash animation
    document.querySelector('.image-frame').classList.add('flash-correct');
    setTimeout(() => {
        document.querySelector('.image-frame').classList.remove('flash-correct');
    }, 600);
    
    // Save state for undo
    gameState.undoStack.push({
        questionIndex: gameState.currentQuestionIndex,
        score: gameState.score
    });
    
    // Update score and move to next
    gameState.score++;
    gameState.currentQuestionIndex++;
    
    // Update UI and load next question
    setTimeout(() => {
        loadQuestion();
    }, 400);
}

function handleWrong() {
    // Flash animation
    document.querySelector('.image-frame').classList.add('flash-wrong');
    setTimeout(() => {
        document.querySelector('.image-frame').classList.remove('flash-wrong');
    }, 600);
    
    // Save state for undo
    gameState.undoStack.push({
        questionIndex: gameState.currentQuestionIndex,
        score: gameState.score
    });
    
    // Move to next (score stays same)
    gameState.currentQuestionIndex++;
    
    // Update UI and load next question
    setTimeout(() => {
        loadQuestion();
    }, 400);
}

// ---------------- HANDLE UNDO ----------------
function handleUndo() {
    if (!gameState.undoStack || gameState.undoStack.length === 0) {
        console.log('No more undo available');
        return;
    }

    const previousState = gameState.undoStack.pop();
    console.log('Undo triggered:', previousState);

    // Restore state
    gameState.currentQuestionIndex = previousState.questionIndex;
    gameState.score = previousState.score;

    // Reload UI
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
    
    // Animate circle
    const circumference = 565.48;
    const offset = circumference - (targetPercentage / 100) * circumference;
    
    setTimeout(() => {
        elements.scoreCircleProgress.style.strokeDashoffset = offset;
    }, 100);
    
    // Animate percentage number
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
    let message = '';
    
    if (percentage === 100) {
        message = '🎉 PERFECT SCORE! You\'re a legend!';
    } else if (percentage >= 75) {
        message = '🌟 Excellent! Outstanding performance!';
    } else if (percentage >= 50) {
        message = '👍 Great job! Keep it up!';
    } else if (percentage >= 25) {
        message = '💪 Good effort! Practice more!';
    } else {
        message = '🎯 Keep trying! You\'ll get better!';
    }
    
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
elements.correctBtn.addEventListener('click', handleCorrect);
elements.wrongBtn.addEventListener('click', handleWrong);
elements.undoBtn.addEventListener('click', handleUndo);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!screens.game.classList.contains('active')) return;
    
    switch(e.key.toLowerCase()) {
        case 'c':
        case 'arrowright':
            handleCorrect();
            break;
        case 'w':
        case 'arrowleft':
            handleWrong();
            break;
        case 'u':
        case 'arrowup':
            handleUndo();
            break;
    }
});

// Add image transition effect
elements.gameImage.style.transition = 'opacity 0.3s ease';

// === INITIALIZATION ===
console.log('PRAKARSH \'26 Game Challenge Loaded!');
console.log('Total questions configured:', CONFIG.TOTAL_QUESTIONS);
console.log('Folders:', Object.keys(CONFIG.FOLDERS).join(', '));