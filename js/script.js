// Variables globales
let gridSize = 5;
let treasurePos = { x: 0, y: 0 };
let found = false;
let attempts = 0;
let lives = 5;
let timer = 30;
let timerInterval = null;
const maxLives = 5;

// Références DOM
const grid = document.getElementById('grid');
const message = document.getElementById('message');
const attemptsSpan = document.getElementById('attempts');
const timerSpan = document.getElementById('timer');
const livesSpan = document.getElementById('lives');
const levelSelect = document.getElementById('levelSelect');
const startBtn = document.getElementById('startBtn');
const scoreBtn = document.getElementById('scoreBtn');
const scoreBoard = document.getElementById('scoreBoard');

// Score sauvegardé en localStorage
const STORAGE_KEY = 'chasseAuTresorScores';

// Initialise le jeu
function init() {
  startBtn.addEventListener('click', startGame);
  scoreBtn.addEventListener('click', showScores);
  levelSelect.addEventListener('change', () => {
    gridSize = parseInt(levelSelect.value);
  });
  loadScores();
  startGame();
}

// Crée la grille selon la taille choisie
function createGrid() {
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 60px)`;
  grid.style.gridTemplateRows = `repeat(${gridSize}, 60px)`;

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', () => onCellClick(x, y, cell));
      grid.appendChild(cell);
    }
  }
}

// Démarre une nouvelle partie
function startGame() {
  found = false;
  attempts = 0;
  lives = maxLives;
  timer = 30 + gridSize * 5; // Plus grand niveau => plus de temps

  updateUI();

  // Position aléatoire trésor
  treasurePos.x = Math.floor(Math.random() * gridSize);
  treasurePos.y = Math.floor(Math.random() * gridSize);

  createGrid();

  message.textContent = 'À toi de jouer ! Clique sur une case.';

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    updateTimer();
    if (timer <= 0) {
      clearInterval(timerInterval);
      if (!found) {
        endGame(false, '⏰ Temps écoulé, tu as perdu !');
      }
    }
  }, 1000);

  scoreBoard.innerHTML = '';
}

// Mise à jour affichage timer, essais, vies
function updateUI() {
  attemptsSpan.textContent = attempts;
  timerSpan.textContent = timer;
  livesSpan.textContent = lives;
}

// Mise à jour timer seulement (pour optimisation)
function updateTimer() {
  timerSpan.textContent = timer;
}

// Gestion du clic sur une case
function onCellClick(x, y, cell) {
  if (found || timer <= 0 || lives <= 0) return;

  // Ignore clic case déjà jouée
  if (cell.classList.contains('miss') || cell.classList.contains('found')) return;

  attempts++;

  if (x === treasurePos.x && y === treasurePos.y) {
    cell.classList.add('found');
    cell.textContent = '💎';
    found = true;
    endGame(true, `🎉 Bravo ! Tu as trouvé le trésor en ${attempts} essais.`);
  } else {
    lives--;
    cell.classList.add('miss');
    cell.textContent = '❌';

    // Donne un indice
    const dist = distance(x, y, treasurePos.x, treasurePos.y);
    const dir = direction(x, y, treasurePos.x, treasurePos.y);

    message.textContent = `Indice: Le trésor est à ${dist.toFixed(1)} cases, direction: ${dir}`;

    if (lives <= 0) {
      endGame(false, '💀 Plus de vies restantes, tu as perdu !');
      revealTreasure();
    }
  }

  updateUI();
}

// Calcule distance euclidienne entre deux points
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Calcule direction cardinale (N, NE, E, SE, S, SO, O, NO)
function direction(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y1 - y2; // y croissant vers le bas

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  if (angle >= -22.5 && angle < 22.5) return 'Est';
  if (angle >= 22.5 && angle < 67.5) return 'Nord-Est';
  if (angle >= 67.5 && angle < 112.5) return 'Nord';
  if (angle >= 112.5 && angle < 157.5) return 'Nord-Ouest';
  if (angle >= 157.5 || angle < -157.5) return 'Ouest';
  if (angle >= -157.5 && angle < -112.5) return 'Sud-Ouest';
  if (angle >= -112.5 && angle < -67.5) return 'Sud';
  if (angle >= -67.5 && angle < -22.5) return 'Sud-Est';
  return '';
}

// Fin du jeu (victoire ou défaite)
function endGame(won, msg) {
  clearInterval(timerInterval);
  message.textContent = msg;

  if (won) {
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();

  saveScore(attempts, timer, gridSize);
}

}


// Révèle où était le trésor après défaite
function revealTreasure() {
  const cells = grid.querySelectorAll('.cell');
  for (const cell of cells) {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    if (x === treasurePos.x && y === treasurePos.y) {
      cell.classList.add('found');
      cell.textContent = '💎';
    }
  }
}

// --- Gestion scores ---

// Charge scores depuis localStorage
function loadScores() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Sauvegarde un score
function saveScore(essais, temps, niveau) {
  const scores = loadScores();
  const score = {
    date: new Date().toLocaleString(),
    essais,
    temps,
    niveau,
  };
  scores.push(score);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
}

// Affiche le tableau des scores
function showScores() {
  const scores = loadScores();
  if (scores.length === 0) {
    scoreBoard.innerHTML = `<p class="text-center">Aucun score enregistré.</p>`;
    return;
  }
  // Tri par essais puis temps (meilleurs en haut)
  scores.sort((a, b) => a.essais - b.essais || a.temps - b.temps);

  let html = `<table class="table table-striped table-bordered text-center">
    <thead>
      <tr><th>Date</th><th>Niveau</th><th>Essais</th><th>Temps restant</th></tr>
    </thead><tbody>`;

  for (const s of scores) {
    html += `<tr>
      <td>${s.date}</td>
      <td>${s.niveau}x${s.niveau}</td>
      <td>${s.essais}</td>
      <td>${s.temps}s</td>
    </tr>`;
  }
  html += '</tbody></table>';
  scoreBoard.innerHTML = html;
}

// Lance le script au chargement
window.onload = init;
