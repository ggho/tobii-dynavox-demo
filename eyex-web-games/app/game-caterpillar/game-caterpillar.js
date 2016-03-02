'use strict';

var Configs = {};
Configs.wormLength = 30;
Configs.colorSets = {
	1: ['#EE595D', '#F47211', '#FCC22C', '#EBC875', '#98C8EF', '#8172B5', '#83A97F', '#274297', '#B783BA'], //color pantone
	2: ['#121418', '#1D450B', '#386324', '#4D8D30', '#70b64f', '#e2f9cd', '#d3e29d', '#E5E590', '#aa6c54'], //caterpillar green

	3: ['#8c1637', '#C40358', '#fa479a', '#ff84d1', '#FDD7F9', '#E2F5FF', '#afccdc', '#87B3CB', '#5a84b6'], //pink and blue

	4: ['#2a282b', '#82c3c7', '#ebce7d', '#ff4c2d', '#c61800', '#f19645', '#f8f1d4', '#4e888a', '#17292e'], //pink and blue
};

var App = {};
App.settings = {
	colorSet: 1,
	faceStyle: 'face', //none, face, xmas
	length: 'short' //wormLength = 30,50, 80
};

//temp for debug:
//var game; 


$(document).ready(function(){
	
	

	// Events handler
	$(window).mousemove(function(e) {
		if ($scope.game)
			$scope.game.setMouse(e.clientX, e.clientY);
	});


	window.onresize = function(){
		if ($scope.game)
			$scope.game.gameCanvas.updateDimension();
	};


	// From native app
	GlobalFunc = function(x,y){

		$scope.game.setMouse(x, y);
	};

});


var Game = function(mode) {
	this.lastMouseX = -1;
	this.lastMouseY = -1;
	this.lastMouseTs = 0;

	this.mouseX = -1;
	this.mouseY = -1;
	this.mouseTs = 0;


	this.gameMode = mode ? mode : Game.MODE.EXPLORE;
	this.gameOn = false; //first on trigger by mouse move
	this.gameLoop;
	this.animationLoop;
	this.gameCanvas;

	var that = this;

	Game.prototype._init = function() {
		// this.creatureLine = new CreatureLine(5);
		this.gameCanvas = new GameCanvas($('#game-canvas'), this.gameMode);

		//TODO: fix hardcoding first audio, but whatever the brwoser support!!
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
		this.gameCanvas.createWorm();
		this.startMusic();

		this.runGame();
		this.runAnimation();
	};

	Game.prototype.runAnimation = function() {
		that.gameCanvas.draw(); //  drawing code

		if(typeof requestAnimationFrame != "undefined")
			that.animationLoop = requestAnimationFrame(that.runAnimation);
		//For browsers that doesn't support requestAnimationFrame, e.g. awesomium
		else
			that.animationLoop = setTimeout(that.runAnimation, 1000 / 30); // 30 FPS 
		//		console.log(that.aniatmionLoop);

	};

	Game.prototype.runGame = function() {
		that.gameCanvas.step(Date.now()); //  simulation code
		that.gameLoop = setTimeout(that.runGame, 1000 / 60); //freq= 1/60s; 60FPS
	};



	Game.prototype.stop = function() {
		if (this.gameLoop) {
			clearTimeout(this.gameLoop);
			this.gameLoop = undefined;
		}

		if (this.animationLoop) {
			if(typeof requestAnimationFrame != "undefined")
				cancelAnimationFrame(this.animationLoop);
			else
				clearTimeout(this.animationLoop);
			this.animationLoop = undefined;
		}

		if (this.gameCanvas) {
			this.gameCanvas.clearCanvas();
		}

		this.pauseMusic();

	};

	this._init();

};

Game.MODE = {
	EXPLORE : 'explore',
	TARGET : 'target'
};


var GameCanvas = function(jqObj, gameMode) {
	//constructor
	$.extend(this, jqObj);

	//init vars
	this._context = this.get(0).getContext("2d");
	this._context.clearRect(0, 0, this.width(), this.height());

	this.gameMode = gameMode;
	this.worm;
	
	this.foods = [];
	this.lastFoodTs = 0;
	this.maxFood = 10;


	var that = this;

	GameCanvas.prototype._init = function() {

		//force set canvas width and height
		this.updateDimension();
		this.clearCanvas();
	};

	GameCanvas.prototype.createWorm = function() {
		var wormLength;

		if(this.gameMode === Game.MODE.TARGET){
			wormLength = 3;
		}else{
			wormLength = Configs.wormLength;
		}
		this.worm = new Worm(wormLength, Worm.STYLE.FACE);

		//also register a move event listerning to check collide?
		this.worm.subscribe(function(evt){
			switch(evt.event){
				case 'move':
				that.onWormMove(evt);
				break;
				default:
				console.log("Undefined raised event: " + evt.event);
			}
		});
	};
	GameCanvas.prototype.onWormMove = function(evt){

		var head = evt.sender.getHeadPart();
		for(var i=0; i<this.foods.length; i++){
			if(this.foods[i].checkCollide(head.x, head.y, head.size)){
				//remove food
				this.foods.splice(i,1); //remove item at i

				//grow
				this.worm.grow();
			}
		}
	};


	GameCanvas.prototype.createOneFood = function(){
		var food = new Food(this._context);
		this.foods.push(food);
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

		//Draw Food
		for(var i = 0; i < this.foods.length; i++){
			this.foods[i].draw(ctx);
		}

		//Draw worm
		this.worm.draw(ctx);
		

	};

	GameCanvas.prototype.step = function(time) {
		//do sth, e.g. physics, logic etc

		//update worm location based on mouse
		var targetX = $scope.game.mouseX;
		var targetY = $scope.game.mouseY;
		if(targetX && targetY)
			this.worm.moveTowards(targetX, targetY);
		
		//gen food every 5 s
		if(this.gameMode === Game.MODE.TARGET){
			if((time - this.lastFoodTs) > 5000 && this.foods.length < this.maxFood){
				this.createOneFood();
				this.lastFoodTs = time;

			} 
		}
	};

	this._init();

};

var Worm = Class([Observable],{
	$const: {
		STYLE: {
			NONE: 'none',
			FACE: 'face',
			XMAS: 'xmas'
		}
	},
	constructor: function(length, style){
		this.bodyParts = [];
		this.initLength = length;
		this.style = style ? style : Worm.STYLE.NONE;
		this.reactionTime = 50; //200ms, 0.2s
		this.colorSet = App.settings.colorSet;
		

		//put starting object
		for (var i = 0; i < this.initLength; i++) {
			var faceStyle = Worm.STYLE.NONE;

			//first bodypart is head
			if ((i === 0) && this.style !== Worm.STYLE.NONE)
				faceStyle = this.style;

			var newPart = new BodyPart($scope.game.mouseX, $scope.game.mouseY, this.colorSet, faceStyle);
			this.bodyParts.push(newPart);
		}

	},
	grow: function(){
		var tailPart = this.bodyParts[this.bodyParts.length-1];
		var newPart = new BodyPart(tailPart.x, tailPart.y, this.colorSet, Worm.STYLE.NONE);
		this.bodyParts.push(newPart);
	},
	getHeadPart : function(){

		return this.bodyParts[0];
	},
	draw: function(ctx){
		//draw
		//set music volume according to moving Count
		var movingCount = 0;
		//draw from tail to head so head is always on top
		for (var i = this.bodyParts.length-1; i >= 0; i--) {
			this.bodyParts[i].draw(ctx);
			movingCount += this.bodyParts[i].isMoving;
		}
		$scope.game.setMusicVolume(movingCount / this.bodyParts.length);
	},
	moveTowards: function(targetX, targetY){
		this.move();
		this.attractTowards(targetX, targetY);
	},
	move: function(){
		//trigger movement that match the ts
		
		var now = Date.now();
		//loop from head to tail
		for (var i = 0; i < this.bodyParts.length; i++) {
			var eachBodyPart = this.bodyParts[i];
			var movementQueue = eachBodyPart.movementQueue;

			for(var j=0; j<movementQueue.length; j++){
				if(now > movementQueue[j].timestamp){
					
					//do the movement
					eachBodyPart.moveTowards(movementQueue[j].targetX, movementQueue[j].targetY);
					//dequeue it
					movementQueue.splice(j,1);

					//raise an event
					this.raise({event: "move", sender: this});
					
				}else{
					//if the earlier one is not time yet, any items later wont be time yet either
					break;
				}
			}
		}

		
	},
	attractTowards: function(targetX, targetY){
		//remember timestamp that triiger this function
		var now = Date.now();
		// var that = this;

		//loop from head to tail
		for (var i = 0; i < this.bodyParts.length; i++) {
			//queue movement with delay
			var fireTimestamp = now + this.reactionTime * i ;
			this.bodyParts[i].movementQueue.push(new Movement(targetX, targetY, fireTimestamp));
			
		}

	}

});

var Movement = function(targetX, targetY, fireTimestamp){
	this.targetX = targetX;
	this.targetY = targetY;
	this.timestamp = fireTimestamp;

};

var BodyPart = function(x, y, colorSet, faceStyle) {
	// this.oldX = x;
	// this.oldY = y;
	this.x = x;
	this.y = y;
	this.faceStyle = faceStyle; //none, face, xmas
	this.decorImg = null;

	this.isMoving = false;


	var now = Date.now();
	var targetX = $scope.game.mouseX;
	var targetY = $scope.game.mouseY;
	this.movementQueue = [];

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

	BodyPart.prototype.setXY = function(newX, newY) {
		this.x = newX;
		this.y = newY;
	};

	BodyPart.prototype.moveTowards = function(targetX, targetY) {
		this.move();
		this.attractTowards(targetX, targetY);
	};

	BodyPart.prototype.move = function() {
		this.x += this.velocityX * DAMPING;
		this.y += this.velocityY * DAMPING;

	};

	BodyPart.prototype.attractTowards = function(x, y) {
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


	BodyPart.prototype.draw = function(ctx) {
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

var Food = Class({
	$const: {
		TYPE: {
			BEAN : 'bean',
			APPLE: 'apple',
			LEAF: 'leaf',
			FLOWER: 'flower'
			//TODO: split different types into sub class?
		}
	},
	constructor: function(ctx){
		//random type of food
		this.type = Food.TYPE.BEAN;

		//random lcoation
		this.x = Math.random()*ctx.canvas.width;
		this.y = Math.random()*ctx.canvas.height;

		this.size = 10;

	},
	draw: function(ctx){
		

		switch(this.type){
			case Food.TYPE.BEAN:
			ctx.fillStyle = "#F00"
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
			ctx.fill();

			break;
			default:

		}

	},
	checkCollide: function(targetX, targetY, targetSize){
		//check distance between target and food location, if < this.size, then collide
		var distance = Math.sqrt(Math.pow((targetX - this.x),2) + Math.pow((targetY - this.y),2));
		if(distance <= (this.size+targetSize)){
			return true;
		}

		return false;
	}
});
