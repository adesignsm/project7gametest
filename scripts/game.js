var ctx = null;
var gameMap = randMap(gameMaps);

var characterLight = document.getElementById("light");
var characterLightW = characterLight.width;
var characterLightH = characterLight.height;

console.log(characterLightW, characterLightH);

var tileW = 100;
var tileH = 100;

var mapW = 20; 
var mapH = 20;

var currentSecond = 0; 
var frameCount = 0;
var framesLastSecond = 0; 
var lastFrameTime = 0;

var grass = new Image();
var dirt = new Image();
var kirby = new Image();
var npc = new Image();

grass.src = "assets/textures/grass.png";
dirt.src = "assets/textures/dirt.png";
kirby.src = "assets/sprites/character.png"; 
npc.src = "assets/sprites/npc.png";

var tileset = null;
var tilesetURL = "assets/textures/tileset.png";
var tilesetLoaded = false;

var gameTime = 0;
var gameSpeeds = [
	{name: "normal", mult: 1},
	{name: "slow", mult: 0.3},
	{name: "fast", mult: 3},
	{name: "paused", mult: 0}	
];

var currentSpeed = 0;

var tileEvents = {

	378: function(c) {c.placeAt(1, 1)},
	66: activateChest,
	3: alertFunction
};

var spriteTypes = {

	grass: 0,
	dirt: 1,
	chest: 2,
	wood: 3,
};

var tileTypes = {

	0: {color: "#7cfc00", sprite: spriteTypes.grass, img: [{x: 172, y: 0, w: 170, h: 170}]},
	1: {color: "#a52a2a", sprite: spriteTypes.dirt, img: [{x: 1, y: 0, w: 170, h: 170}]},
	2: {color: "#ff0000", sprite: spriteTypes.chest, img: [{x: 349, y: 0, w: 200, h: 170}]},
	3: {color: "#ffffff", sprite: spriteTypes.wood, img: [{x: 551, y: 1, w: 155, h: 170}]},
};

var keysDown = {

	37 : false,
	38 : false,
	39 : false,
	40 : false
};

var viewport = {

	screen: [0,0],
	startTile: [0,0],
	endTile: [0,0],
	offset: [0,0],

	update: function(px, py) {

		this.offset[0] = Math.floor((this.screen[0] / 2) - px);
		this.offset[1] = Math.floor((this.screen[1] / 2) - py);

		var tile = [Math.floor(px / tileW), Math.floor(py / tileH)];

		this.startTile[0] = tile[0] - 1 - Math.ceil((this.screen[0] / 2) / tileW);
		this.startTile[1] = tile[1] - 1 - Math.ceil((this.screen[1] / 2) / tileH);

		if (this.startTile[0] < 0) {

			this.startTile[0] = 0;
		}

		if (this.startTile[1] < 0) {

			this.startTile[1] = 0;
		}

		this.endTile[0] = tile[0] + 1 + Math.ceil((this.screen[0] / 2) / tileW);
		this.endTile[1] = tile[1] + 1 + Math.ceil((this.screen[1] / 2) / tileH);

		if (this.endTile[0] >= mapW) {

			this.endTile[0] = mapW - 1;
		}

		if (this.endTile[1] >= mapH) {

			this.endTile[1] = mapH - 1;
		}
	}
};

var player = new Character();

function Character() {

	this.tileFrom = [1, 1];
	this.tileTo	= [1, 1];
	this.timeMoved = 0;
	this.dimensions	= [50, 50];
	this.position = [125, 119];
	this.delayMove = 150;
}

Character.prototype.placeAt = function(x, y) {

	this.tileFrom = [x, y];
	this.tileTo	= [x, y];
	this.position = [((tileW * x) + ((tileW - this.dimensions[0]) / 2)),
		((tileH * y) + ((tileH - this.dimensions[1]) / 2))];
};

Character.prototype.processMovement = function(t) {

	if (this.tileFrom[0] == this.tileTo[0] && this.tileFrom[1] == this.tileTo[1]) { 

		return false; 
	}

	if ((t - this.timeMoved) >= this.delayMove) {
		
		this.placeAt(this.tileTo[0], this.tileTo[1]);

		if (typeof tileEvents[toIndex(this.tileTo[0], this.tileTo[1])] != "undefined") {

			tileEvents[toIndex(this.tileTo[0], this.tileTo[1])](this);
		}
	
	} else {

		this.position[0] = (this.tileFrom[0] * tileW) + ((tileW - this.dimensions[0]) / 2);
		this.position[1] = (this.tileFrom[1] * tileH) + ((tileH - this.dimensions[1]) / 2);

		if (this.tileTo[0] != this.tileFrom[0]) {

			var diff = (tileW / this.delayMove) * (t - this.timeMoved);
			this.position[0] += (this.tileTo[0] < this.tileFrom[0] ? 0 - diff : diff);
		}
		
		if (this.tileTo[1] != this.tileFrom[1]) {

			var diff = (tileH / this.delayMove) * (t - this.timeMoved);
			this.position[1] += (this.tileTo[1] < this.tileFrom[1] ? 0 - diff : diff);
		}

		this.position[0] = Math.round(this.position[0]);
		this.position[1] = Math.round(this.position[1]);
	}

	return true;
}

Character.prototype.canMoveTo = function(x, y) {

	if (x < 0 || x >= mapW || y < 0 || y >= mapH) {

		return false;
	}

	if (tileTypes[gameMap[toIndex(x,y)]].sprite != spriteTypes.dirt) {

		return false;
	}

	return true;
};

Character.prototype.canMoveUp = function() {

	return this.canMoveTo(this.tileFrom[0], this.tileFrom[1] - 1);
};

Character.prototype.canMoveDown = function() {

	return this.canMoveTo(this.tileFrom[0], this.tileFrom[1] + 1);
};

Character.prototype.canMoveLeft = function() {

	return this.canMoveTo(this.tileFrom[0] - 1, this.tileFrom[1]);
};

Character.prototype.canMoveRight = function() {

	return this.canMoveTo(this.tileFrom[0] + 1, this.tileFrom[1]);
};

Character.prototype.moveLeft = function(t) { 
	
	this.tileTo[0] -= 1; 
	this.timeMoved = t; 
};

Character.prototype.moveRight = function(t) { 

	this.tileTo[0] += 1; 
	this.timeMoved = t; 
};

Character.prototype.moveUp = function(t) { 

	this.tileTo[1] -= 1; 
	this.timeMoved = t; 
};

Character.prototype.moveDown = function(t) { 

	this.tileTo[1] += 1; 
	this.timeMoved = t; 
};

function toIndex(x, y) {

	return ((y * mapW) + x);
}

window.onload = function() {

	ctx = document.getElementById('game').getContext("2d");
	requestAnimationFrame(drawGame);
	ctx.font = "bold 10pt sans-serif";

	window.addEventListener("keydown", function(e) {

		if (e.keyCode >= 37 && e.keyCode <= 40) { 

			keysDown[e.keyCode] = true; 
		}
	});

	window.addEventListener("keyup", function(e) {

		if (e.keyCode >= 37 && e.keyCode <= 40) { 

			keysDown[e.keyCode] = false; 
		}

		if (e.keyCode == 27) {

			currentSpeed = (currentSpeed >= (gameSpeeds.length - 1) ? 0 : currentSpeed + 1);
		}
	});

	viewport.screen = [document.getElementById("game").width, document.getElementById("game").height];

	tileset = new Image();
	tileset.onerror = function() {

		ctx = null;
		alert("failed to load sprite sheet");
	};

	tileset.onload = function() {

		tilesetLoaded = true;
	}

	tileset.src = tilesetURL;
};

function alertFunction() {

	console.log("hello");
}

function activateChest() {

	console.log("chest activated");
}

function drawGame() {

	if (ctx == null) { 

		return; 
	}

	if (!tilesetLoaded) {

		requestAnimationFrame(drawGame);
		return;
	}

	var currentFrameTime = Date.now();
	var timeElapsed = currentFrameTime - lastFrameTime;

	gameTime += Math.floor(timeElapsed * gameSpeeds[currentSpeed].mult);

	var sec = Math.floor(Date.now() / 1000);
	
	if (sec != currentSecond) {

		currentSecond = sec;
		framesLastSecond = frameCount;
		frameCount = 1;
	} else { 

		frameCount++; 
	}

	if (!player.processMovement(gameTime) && gameSpeeds[currentSpeed].mult != 0) {

		if (keysDown[38] && player.canMoveUp()) { 

			player.moveUp(gameTime); 
		
		} else if (keysDown[40] && player.canMoveDown()) { 

			player.moveDown(gameTime);
		
		} else if (keysDown[37] && player.canMoveLeft()) { 

			player.moveLeft(gameTime);
		
		} else if (keysDown[39] && player.canMoveRight()) { 

			player.moveRight(gameTime); 

		}
	}

	viewport.update(player.position[0] + (player.dimensions[0] / 2), player.position[1] + (player.dimensions[1] / 2));
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, viewport.screen[0], viewport.screen[1]);

	for(var y = viewport.startTile[1]; y <= viewport.endTile[1]; y++) {

		for(var x = viewport.startTile[0]; x <= viewport.endTile[0]; x++) {

			var tile = tileTypes[gameMap[toIndex(x,y)]];
			ctx.drawImage(tileset, tile.img[0].x, tile.img[0].y, tile.img[0].w, tile.img[0].h, viewport.offset[0] + (x * tileW), viewport.offset[1] + (y * tileH), tileW, tileH);

		}
	}

	ctx.drawImage(npc, viewport.offset[0] + player.position[0], viewport.offset[1] + player.position[1], player.dimensions[0], player.dimensions[1]);
	// ctx.fillStyle = "#ff0000";
	// ctx.fillText("FPS: " + framesLastSecond, 10, 20);
	console.log("Game speed: " + gameSpeeds[currentSpeed].name, 10, 40);

	lastFrameTime = currentFrameTime;
	requestAnimationFrame(drawGame);
	// requestAnimationFrame(kirby);
}

/////////////////////////////////////////////////////
$(document).ready(function() {
	$(this).mousedown(function(e) {
	    switch (e.which) {
	        case 1:
	            $("#light").toggleClass("light-off");
	            break;
	        case 2:
	            console.log('Middle Mouse button pressed.');
	            break;
	        case 3:
	            console.log('Right Mouse button pressed.');
	            break;
	        default:
	            console.log('You have a strange Mouse!');
	    }
 	 });
});