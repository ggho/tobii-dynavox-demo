'use strict';

var Configs = {};
Configs.numOfObjects = 80;
Configs.colorSets = {
	1: ['#EE595D', '#F47211', '#FCC22C', '#EBC875', '#98C8EF', '#8172B5', '#83A97F', '#274297', '#B783BA'], //color pantone
	2: ['#121418', '#1D450B', '#386324', '#4D8D30', '#70b64f', '#e2f9cd', '#d3e29d', '#E5E590', '#aa6c54'], //caterpillar green

	3: ['#8c1637', '#C40358', '#fa479a', '#ff84d1', '#FDD7F9', '#E2F5FF', '#afccdc', '#87B3CB', '#5a84b6'], //pink and blue

	4: ['#2a282b', '#82c3c7', '#ebce7d', '#ff4c2d', '#c61800', '#f19645', '#f8f1d4', '#4e888a', '#17292e'], //pink and blue
};

var App = {};
App.settings = {
	colorSet: 1,
	faceStyle: 'none', //none, face, xmas
	length: 'medium' //numOfObjects = 30,50, 80
};

//temp for debug:
var game; 

angular.module('myApp.gameCaterpillar', [])

.controller('gameCaterpillarCtrl', ['$scope', function($scope){
	$scope._init = function(){
		$scope.game= new Game();
		game = $scope.game;
	};


	// Events handler
	$(window).mousemove(function(e) {
		if ($scope.game)
			$scope.game.setMouse(e.clientX, e.clientY);
	});

	// EyeX
	EyeX.ready(function (context) {
		EyeX.coords.setConverter(new EyeX.WebCoordinatesConverter());

		//EyeX 
		EyeX.coords.clientChanged.subscribe(EyeX.utils.proxy($scope.game.gameCanvas, $scope.game.gameCanvas.updateDimension));

		var webManager = new EyeX.WebManager(context);

		var canvasElement = document.getElementById("game-canvas");
		var canvasSelector = $(canvasElement);

		EyeX.streams.fixationData (function (gazePoint) {
        	// console.log(gazePoint.x + ', ' + gazePoint.y)

        	var canvasOffset = canvasSelector.offset();
        	var gazePointOnPage = EyeX.coords.screenToClient(gazePoint);
        	var x = gazePointOnPage.x - canvasOffset.left;
        	var y = gazePointOnPage.y - canvasOffset.top;


        	$scope.game.setMouse(x, y);

        });
	});



	var Game = function() {
		this.lastMouseX = -1;
		this.lastMouseY = -1;
		this.lastMouseTs = 0;

		this.mouseX = -1;
		this.mouseY = -1;
		this.mouseTs = 0;

		this.gameOn = false; //first on trigger by mouse move
		this.gameLoop;
		this.animationLoop;
		this.gameCanvas;

		var that = this;

		Game.prototype._init = function() {
		// this.creatureLine = new CreatureLine(5);
		this.gameCanvas = new GameCanvas($('#game-canvas'));

		this.music = this.gameCanvas.siblings('audio').get(0);
		this.music.volume = 0.1; //start with low

	};

	Game.prototype.getMousePosX = function() { //relative to dustie active area
		return (this.mouseX - this.offset().left) / this.width();
	};

	Game.prototype.getMousePosY = function() {
		return (this.mouseY - this.offset().top) / this.height();
	};

	Game.prototype.setMouse = function(mouseX, mouseY) {
		//time distance is long enough >20
		//filter out too frequent mouse event
		var now = new Date().getTime();
		if (now - this.mouseTs < 20) {
			return;
		}
		this.lastMouseX = this.mouseX;
		this.lastMouseY = this.mouseY;
		this.lastMouseTs = this.mouseTs;

		this.mouseX = mouseX;
		this.mouseY = mouseY;
		this.mouseTs = new Date().getTime();


		if (!this.gameOn) {
			this.gameOn = true;
			this.run();
		}

		//temp for debug
		$('#info').text(this.mouseX + ', ' + this.mouseY);

	};

	Game.prototype.startMusic = function() {

		this.music.play();
	};
	Game.prototype.setMusicVolume = function(volume) {
		if (volume >= 0 && volume <= 1) {

			this.music.volume = volume;
		}
	};
	Game.prototype.pauseMusic = function() {
		this.music.pause();
	};

	Game.prototype.run = function() {
		//
		this.gameCanvas.createObjects();
		this.startMusic();

		this.runGame();
		this.runAnimation();
	};

	Game.prototype.runAnimation = function() {
		that.gameCanvas.draw(); //  drawing code
		that.animationLoop = requestAnimationFrame(that.runAnimation);

		//porting for awesomium
		//that.animationLoop = setTimeout(that.runAnimation, 1000 / 30);
//		console.log(that.aniatmionLoop);

};

Game.prototype.runGame = function() {
		that.gameCanvas.step(1000 / 60); //  simulation code
		that.gameLoop = setTimeout(that.runGame, 1000 / 60);
	};



	Game.prototype.stop = function() {
		if (this.gameLoop) {
			clearTimeout(this.gameLoop);
			this.gameLoop = undefined;
		}

		if (this.animationLoop) {
			cancelAnimationFrame(this.animationLoop);
			// clearTimeout(this.animationLoop);
			this.animationLoop = undefined;
		}

		if (this.gameCanvas) {
			this.gameCanvas.clearCanvas();
		}

		this.pauseMusic();

	};

	this._init();

};


var GameCanvas = function(jqObj) {
	//constructor
	$.extend(this, jqObj);

	//init vars
	this._context = this.get(0).getContext("2d");
	this._context.clearRect(0, 0, this.width(), this.height());


	this.canvasObjects = [];
	var that = this;

	GameCanvas.prototype._init = function() {

		//force set canvas width and height
		this.updateDimension();
		this.clearCanvas();


	};

	GameCanvas.prototype.createObjects = function() {
		//put starting object
		var faceStyle = 'none';
		for (var i = 0; i < Configs.numOfObjects; i++) {

			if ((i === Configs.numOfObjects - 1) && App.settings.faceStyle !== 'none')
				faceStyle = App.settings.faceStyle;

			var newObj = new CanvasObject($scope.game.mouseX, $scope.game.mouseY, App.settings.colorSet, faceStyle);
			this.canvasObjects.push(newObj);
		}
	};

	GameCanvas.prototype.updateDimension = function() {
		this.get(0).width = this.width();
		this.get(0).height = this.height();
	};

	GameCanvas.prototype.clearCanvas = function() {
		this._context.clearRect(0, 0, this.width(), this.height());

	};
	GameCanvas.prototype.draw = function() {
		this.clearCanvas();
		var ctx = this._context;//$('#game-canvas').get(0).getContext("2d");//

		//set music volume according to moving Count
		var movingCount = 0;
		for (var i = 0; i < this.canvasObjects.length; i++) {
			this.canvasObjects[i].draw(ctx);
			movingCount += this.canvasObjects[i].isMoving;
		}
		$scope.game.setMusicVolume(movingCount / Configs.numOfObjects);
	};

	GameCanvas.prototype.step = function(time) {
		//do sth, e.g. physics, logic etc
		for (var i = (this.canvasObjects.length - 1); i >= 0; i--) {
			var timeDelay = (this.canvasObjects.length - 1 - i) * 50;

			var obj = that.canvasObjects[i];
			var targetX = $scope.game.mouseX;
			var targetY = $scope.game.mouseY;

			if(targetX && targetY){
				setTimeout(function(canvasObj) {
					if (!canvasObj) {
					}

				canvasObj.moveTowards(targetX, targetY);
			}, timeDelay, obj);

			}
		}

	};

	this._init();

};


var CanvasObject = function(x, y, colorSet, faceStyle) {
	// this.oldX = x;
	// this.oldY = y;
	this.x = x;
	this.y = y;
	this.faceStyle = faceStyle; //none, face, xmas
	this.decorImg = null;

	this.isMoving = false;

	var DAMPING = 0.999;
	var ACCELERATION = 0.1;
	var MAX_SPEED = 50; //no direction

	this.velocityX = 0;
	this.velocityY = 0;

	this.colors = Configs.colorSets[colorSet];

	this.color = this.colors[Math.floor((Math.random() * 9))]; //random number 0-8
	this.antennaColor = this.colors[Math.floor((Math.random() * 9))]; //random number 0-8
	this.size = (Math.floor((Math.random() * 11)) + 20); //size: 20 - 30

	if (this.faceStyle === 'xmas') {
		this.decorImg = new Image();

		var fileIdx = Math.floor((Math.random() * 9) + 1); //random 1-9
		this.decorImg.src = '../image/xmas/Hat' + fileIdx + '.png';
		this.decorImg.width = this.size * 4.5;//h/w = 414/421 = 0.98
		this.decorImg.height = this.decorImg.width * 0.98;

	}

	CanvasObject.prototype.setXY = function(newX, newY) {
		this.x = newX;
		this.y = newY;
	};


	CanvasObject.prototype.move = function() {
		this.x += this.velocityX * DAMPING;
		this.y += this.velocityY * DAMPING;
	};

	CanvasObject.prototype.attractTowards = function(x, y) {
		var dx = x - this.x;
		var dy = y - this.y;

		this.velocityX = dx * ACCELERATION;

		if (this.velocityX > MAX_SPEED) {
			this.velocityX = MAX_SPEED;
		} else if (this.velocityX < -MAX_SPEED) {
			this.velocityX = -MAX_SPEED;
		} else if (Math.abs(this.velocityX) < 0.01) {
			this.velocityX = 0;
		}

		this.velocityY = dy * ACCELERATION;
		if (this.velocityY > MAX_SPEED) {
			this.velocityY = MAX_SPEED;
		} else if (this.velocityY < -MAX_SPEED) {
			this.velocityY = -MAX_SPEED;
		} else if (Math.abs(this.velocityY) < 0.01) {
			this.velocityY = 0;
		}


		if (this.velocityX === 0 && this.velocityY === 0) { //no movement
			this.isMoving = false;
		} else {
			this.isMoving = true;
		}

	};

	CanvasObject.prototype.moveTowards = function(targetX, targetY) {
		this.move();
		this.attractTowards(targetX, targetY);
	};

	CanvasObject.prototype.draw = function(ctx) {
		ctx.fillStyle = this.color;

		if (this.faceStyle === 'none') {
			ctx.globalAlpha = 0.7;
		} else {
			ctx.globalAlpha = 1;
		}

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
		ctx.fill();


		if (this.faceStyle === 'face' || this.faceStyle === 'xmas') {
			//2 dots as eyes
			ctx.fillStyle = "#000";
			ctx.beginPath();
			ctx.arc(this.x - 8, this.y, 4, 0, 2 * Math.PI, false);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(this.x + 8, this.y, 4, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.fill();

			//right antenna
			var antenna1StartX = this.x + 10;
			var antenna1StartY = this.y - this.size + 4;
			var antenna1EndX = antenna1StartX + 10;
			var antenna1EndY = antenna1StartY - 20;
			ctx.strokeStyle = "#FFF";
			ctx.lineWidth = 3;

			ctx.beginPath();
			ctx.moveTo(antenna1StartX, antenna1StartY);
			ctx.lineTo(antenna1EndX, antenna1EndY);
			ctx.stroke();

			ctx.fillStyle = this.antennaColor;
			ctx.beginPath();
			ctx.arc(antenna1EndX, antenna1EndY, 6, 0, 2 * Math.PI, false);
			ctx.fill();

			//left antenna
			var antenna2StartX = this.x - 10;
			var antenna2StartY = this.y - this.size + 4;
			var antenna2EndX = antenna2StartX - 10;
			var antenna2EndY = antenna2StartY - 20;
			ctx.strokeStyle = "#FFF";
			ctx.lineWidth = 3;

			ctx.beginPath();
			ctx.moveTo(antenna2StartX, antenna2StartY);
			ctx.lineTo(antenna2EndX, antenna2EndY);
			ctx.stroke();

			ctx.fillStyle = this.antennaColor;
			ctx.beginPath();
			ctx.arc(antenna2EndX, antenna2EndY, 6, 0, 2 * Math.PI, false);
			ctx.fill();

			//mouth
			var mouthX = this.x - 10;
			var mouthY = this.y + 10;
			ctx.beginPath();
			ctx.moveTo(mouthX, mouthY);//(188, 130);
			ctx.bezierCurveTo(mouthX, mouthY, mouthX + 10, mouthY + 15, mouthX + 20, mouthY); //(140, 10, 388, 10, 388, 170)
			ctx.strokeStyle = "#000";
			ctx.lineWidth = 2;
			ctx.stroke();

			if (this.faceStyle === 'xmas') {
				var hatX = this.x - this.decorImg.width / 2;
				var hatY = this.y - this.decorImg.height / 2 - this.size * 0.9;

				ctx.drawImage(this.decorImg, hatX, hatY, this.decorImg.width, this.decorImg.height);
			}
		}



	};
};


$scope._init();

}]);
