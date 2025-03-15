// Константы и переменные состояния
var mapWidth = 40;
var mapHeight = 24;
var map = []; // 2D массив для карты
var hero = { x: 0, y: 0, health: 100, maxHealth: 100, attack: 10};
var enemies = [];
var items = [];
var rooms = [];
var gameOver = false;

// Инициализация карты
function initMap() {
  for (var y = 0; y < mapHeight; y++) {
    map[y] = [];
    for (var x = 0; x < mapWidth; x++) {
      map[y][x] = 'wall';
    }
  }
}

// Проверка пересечения
function rectanglesIntersect(r1, r2) {
  return !(r2.x > r1.x + r1.w ||
           r2.x + r2.w < r1.x ||
           r2.y > r1.y + r1.h ||
           r2.y + r2.h < r1.y);
}

// Создание комнаты
function createRoom(x, y, w, h) {
  var newRoom = { x: x, y: y, w: w, h: h };
  for (var i = 0; i < rooms.length; i++) {
    if (rectanglesIntersect(newRoom, rooms[i])) {
      return false;
    }
  }
  for (var j = y; j < y + h; j++) {
    for (var i = x; i < x + w; i++) {
      map[j][i] = 'floor';
    }
  }
  rooms.push(newRoom);
  return true;
}

// Генерация комнат
function generateRooms() {
  var attempts = 0;
  var maxAttempts = 100;
  while (rooms.length < 10 && attempts < maxAttempts) {
    var w = Math.floor(Math.random() * 6) + 3;
    var h = Math.floor(Math.random() * 6) + 3;
    var x = Math.floor(Math.random() * (mapWidth - w - 1)) + 1;
    var y = Math.floor(Math.random() * (mapHeight - h - 1)) + 1;
    if (createRoom(x, y, w, h)) {
      attempts = 0;
    } else {
      attempts++;
    }
  }
}

// Соединение комнат коридорами
function connectRooms() {
  for (var i = 0; i < rooms.length - 1; i++) {
    var roomA = rooms[i];
    var roomB = rooms[i + 1];
    var centerA = { x: Math.floor(roomA.x + roomA.w / 2), y: Math.floor(roomA.y + roomA.h / 2) };
    var centerB = { x: Math.floor(roomB.x + roomB.w / 2), y: Math.floor(roomB.y + roomB.h / 2) };
    // Горизонтальный коридор
    for (var x = Math.min(centerA.x, centerB.x); x <= Math.max(centerA.x, centerB.x); x++) {
      map[centerA.y][x] = 'floor';
    }
    // Вертикальный коридор
    for (var y = Math.min(centerA.y, centerB.y); y <= Math.max(centerA.y, centerB.y); y++) {
      map[y][centerB.x] = 'floor';
    }
  }
}

// Поиск случайной свободной позиции на полу
function getEmptyFloorPosition() {
  var x, y;
  do {
    x = Math.floor(Math.random() * mapWidth);
    y = Math.floor(Math.random() * mapHeight);
  } while (
    map[y][x] !== 'floor' ||
    (hero.x === x && hero.y === y) ||
    enemies.some(function(e) { return e.x === x && e.y === y; }) ||
    items.some(function(i) { return i.x === x && i.y === y; })
  );
  return { x: x, y: y };
}

// Размещение персонажей
function placeCharacters() {
  var pos = getEmptyFloorPosition();
  hero.x = pos.x;
  hero.y = pos.y;
  for (var i = 0; i < 10; i++) {
    pos = getEmptyFloorPosition();
    enemies.push({ x: pos.x, y: pos.y, health: 30, maxHealth: 30, attack: 10 });
  }
}

// Размещение предметов
function placeItems() {
  for (var i = 0; i < 2; i++) {
    var pos = getEmptyFloorPosition();
    items.push({ x: pos.x, y: pos.y, type: 'sword' });
  }
  for (var i = 0; i < 10; i++) {
    pos = getEmptyFloorPosition();
    items.push({ x: pos.x, y: pos.y, type: 'potion' });
  }
}

// Отрисовка игрового поля
function render() {
  var field = document.querySelector('.field');
  field.innerHTML = '';
  for (var y = 0; y < mapHeight; y++) {
    for (var x = 0; x < mapWidth; x++) {
      var tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.left = (x * 50) + 'px';
      tile.style.top = (y * 50) + 'px';

      if (map[y][x] === 'wall') {
        tile.className += ' tileW';
      } else if (hero.x === x && hero.y === y) {
        tile.className += ' tileP';
        var health = document.createElement('div');
        health.className = 'health';
        health.style.width = (hero.health / hero.maxHealth * 100) + '%';
        tile.appendChild(health);
      } else {
        var enemy = enemies.find(function(e) { return e.x === x && e.y === y; });
        if (enemy) {
          tile.className += ' tileE';
          var health = document.createElement('div');
          health.className = 'health';
          health.style.width = (enemy.health / enemy.maxHealth * 100) + '%';
          tile.appendChild(health);
        } else {
          var item = items.find(function(i) { return i.x === x && i.y === y; });
          if (item) {
            tile.className += item.type === 'sword' ? ' tileSW' : ' tileHP';
          }
        }
      }
      field.appendChild(tile);
    }
  }
}

// Проверка соседства
function isAdjacent(pos1, pos2) {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y) === 1;
}


// Атака героя по соседним клеткам
function heroAttack() {
  if (gameOver) return;
  for (var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    if (isAdjacent(hero, enemy)) {
      enemy.health -= hero.attack;
      if (enemy.health <= 0) {
        enemies.splice(i, 1);
        i--;
      }
    }
  }
}

// Проверка на завершение игры
function checkGameOver() {
  if (hero.health <= 0) {
    gameOver = true;
    render();
    alert('Игра окончена: Вы проиграли!');
  } else if (enemies.length === 0) {
    gameOver = true;
    render();
    alert('Игра окончена: Вы победили!');
  }
}

// Ход врагов
function enemyTurn() {
  for (var i = 0; i < enemies.length; i++) {
    var enemy = enemies[i];
    if (isAdjacent(enemy, hero)) {
      hero.health = Math.max(0, hero.health - enemy.attack);
    } else {
      var directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];
      var dir = directions[Math.floor(Math.random() * 4)];
      var newX = enemy.x + dir.dx;
      var newY = enemy.y + dir.dy;
      if (
        newX >= 0 && newX < mapWidth &&
        newY >= 0 && newY < mapHeight &&
        map[newY][newX] === 'floor' &&
        !enemies.some(function(e) { return e.x === newX && e.y === newY; }) &&
        !(hero.x === newX && hero.y === newY)
      ) {
        enemy.x = newX;
        enemy.y = newY;
      }
    }
  }
  render();
  checkGameOver();
}

// Обработка ввода
document.addEventListener('keydown', function(event) {
  var key = event.key.toLowerCase();
  var newX = hero.x;
  var newY = hero.y;

  if (key === 'w') newY--;
  else if (key === 's') newY++;
  else if (key === 'a') newX--;
  else if (key === 'd') newX++;
  else if (key === ' ') {
    heroAttack();
    enemyTurn();
    return;
  } else return;

  if (
    newX >= 0 && newX < mapWidth &&
    newY >= 0 && newY < mapHeight &&
    map[newY][newX] === 'floor' &&
    !enemies.some(function(e) { return e.x === newX && e.y === newY; })
  ) {
    hero.x = newX;
    hero.y = newY;
    var itemIndex = items.findIndex(function(i) { return i.x === newX && i.y === newY; });
    if (itemIndex !== -1) {
      var item = items[itemIndex];
      if (item.type === 'potion') {
        hero.health = Math.min(hero.maxHealth, hero.health + 20);
      } else if (item.type === 'sword') {
        hero.attack += 5;
      }
      items.splice(itemIndex, 1);
    }
    enemyTurn();
  }
});

// Инициализация игры
function Game() {
  this.init = function() {
    initMap();
    generateRooms();
    connectRooms();
    placeCharacters();
    placeItems();
    render();
  };
}