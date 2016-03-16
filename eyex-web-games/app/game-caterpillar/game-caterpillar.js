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


$(document).ready(function() {
	// Events handler
	$(window).mousemove(function(e) {
		if ($scope.game && demoApp.state !== DemoApp.STATE.IDLE)
			$scope.game.setMouse(e.clientX, e.clientY);
	});


	window.onresize = function() {
		if ($scope.game)
			$scope.game.gameCanvas.updateDimension();
	};

	$(window).blur(function(){
		console.log('blurring');
		if ($scope.game)
			$scope.game.pause();
	});

	$(window).focus(function(){
		console.log('focusing');
		if ($scope.game)
			$scope.game.resume();
	});


	

});


var Game = function(appState) {
	this.mouseX = null;
	this.mouseY = null;
	this.mouseTs = 0;

	this.gameLoop;
	this.animationLoop;
	this.gameCanvas;

	this.music;

	this._init(appState);
};

Game.prototype._init = function(appState) {
	// this.creatureLine = new CreatureLine(5);
	this.gameCanvas = new GameCanvas($('#game-canvas'), appState);

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

	this.mouseX = mouseX;
	this.mouseY = mouseY;
	this.mouseTs = new Date().getTime();

	//TODO: remove this
	this.startMusic();

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
	// this.gameCanvas.createWorm();
	//this.startMusic();

	this.runGame();
	this.runAnimation();
};

Game.prototype.runAnimation = function() {
	this.gameCanvas.draw(); //  drawing code

	var that = this;
	if (typeof requestAnimationFrame !== "undefined"){
		//console.log(this.runAnimation);
		this.animationLoop = requestAnimationFrame(function(){that.runAnimation.call(that)});
	}
	else{ 
		//For browsers that doesn't support requestAnimationFrame, e.g. awesomium
		this.animationLoop = setTimeout(function(){that.runAnimation.call(that);}, 1000/30); // 30 FPS 
	}
};

Game.prototype.runGame = function() {
	var that = this;
	this.gameCanvas.step(Date.now()); //  simulation code
	this.gameLoop = setTimeout(function(){that.runGame.call(that);}, 1000/60); //this.runGame.call(this), freq= 1/60s; 60FPS
};

Game.prototype.pause = function(){
	this.pauseMusic();
};

Game.prototype.resume = function(){
	this.startMusic();
};

Game.prototype.stop = function() {
	if (this.gameLoop) {
		clearTimeout(this.gameLoop);
		this.gameLoop = undefined;
	}

	if (this.animationLoop) {
		if (typeof requestAnimationFrame != "undefined")
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

//HERE: TODO: handle different states / modes
Game.prototype.onEvent = function(evt, sender){
	switch (evt.event) {
		case 'stateChange':

	//TOFIX: dont always replay music when state change
	console.log(evt);
	var newState = evt.data;
	this.gameCanvas.reset(newState);
	break;
	default:
	console.log("Undefined raised event: " + evt.event);
}
};

//HERE
Game.prototype.startPositioningMode = function(){


};

/*
* Class GameCanvas
*
*/
var GameCanvas = function(jqObj, gameState) {
	//constructor
	$.extend(this, jqObj);

	//init vars
	this._context = this.get(0).getContext("2d");
	//this._context.clearRect(0, 0, this.width(), this.height());

	this.gameState = null;
	this.reset(gameState);

};

//static vars
GameCanvas.idleMovementInterval = 1000; //1s

//class methods
GameCanvas.prototype.reset = function(gameState) {
	if(gameState)
		this.gameState = gameState ;

	this.worm;
	//this.wormHide = true; //for idle mode, switching between true and false (hide and show)
	this.wormPathQueue = new Queue();
	this.isAttentivePlanned = false;

	this.foods = [];
	this.lastFoodTs = 0;
	this.maxFood = 10;

	this._init();
};

GameCanvas.prototype.draw = function() {
	this.clearCanvas();
	var ctx = this._context;//$('#game-canvas').get(0).getContext("2d");//

	//Draw Food
	for (var i = 0; i < this.foods.length; i++) {
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
	if (targetX !== null && targetY !== null){
		this.worm.moveTowards(targetX, targetY);
	}

	//TODO: handle different states here
	switch(this.gameState){
		case DemoApp.STATE.IDLE:
		this.stepIdle(time);
		break;
		case DemoApp.STATE.ATTENTIVE:
		this.stepAttentive(time);
		break;
		case DemoApp.STATE.POSITIONING:

		break;
		case DemoApp.STATE.GAME_TARGET:
		//gen food every 5 s
		this.stepGameTarget(time);
		break;
		default:
	}
};

GameCanvas.prototype.stepIdle = function(time){
	//dequeue and do it
	var curMovement = this.wormPathQueue.peek();
	var nextRegion = 0;

	if(curMovement === null){
		//empty queue
		this._planIdleMovements(nextRegion, time+GameCanvas.idleMovementInterval);
	}else if(curMovement && time > curMovement.timestamp){
		curMovement = this.wormPathQueue.dequeue();

		if(curMovement.targetX!=undefined && curMovement.targetY!=undefined)
			$scope.game.setMouse(curMovement.targetX, curMovement.targetY);

		//only queue movement for each set of movements (wait,show, hide) is out of canvas 
		if(curMovement.region < 10){
			nextRegion = (curMovement.region+1)%4;

			//time should be set relative to last item in the queue
			var ts = this.wormPathQueue.peekLast().timestamp+GameCanvas.idleMovementInterval;
			this._planIdleMovements(nextRegion, ts);
		}
	}
};

GameCanvas.prototype.stepAttentive = function(time){
	//check and finish last played idleMovement
	//and plan according positioning movement next

	var nextMovement = this.wormPathQueue.peek();
	if(this.isAttentivePlanned){
		//TOFIX: freeze the movement of body 


		//then just execute the queue
		if(nextMovement && time > nextMovement.timestamp){
			nextMovement = this.wormPathQueue.dequeue();
			$scope.game.setMouse(nextMovement.targetX, nextMovement.targetY);
		}
	}else{
		//planPositioningMoves
		var region = 20, ts = time+GameCanvas.idleMovementInterval;
		if(nextMovement !== null){
			ts = nextMovement.timestamp;

			switch(nextMovement.getState()){
				case IdleMovement.STATE.IN_MOVE:
				//worm is currently at WAIT (next movement is IN_MOVE), this means ready for positioning
				region = (nextMovement.region)%4 + 20; //region idx for positioning
				break;

				case IdleMovement.STATE.WAIT:
				//worm is currently OUT_MOVE (next movement is WAIT), this means ready for positioning after wait a bit
				region = (nextMovement.region + 1)%4 + 20;
				ts += GameCanvas.idleMovementInterval;
				break;

				case IdleMovement.STATE.OUT_MOVE:
				//if current is IN_MOVE (next is OUT_MOVE), then complete next OUT_MOVE
				region = (nextMovement.region + 1)%4 + 20;
				ts += GameCanvas.idleMovementInterval;

				//TODO: push it to plan queue?
				if(nextMovement.targetX!=undefined && nextMovement.targetY!=undefined)
					$scope.game.setMouse(nextMovement.targetX, nextMovement.targetY);
			}
		}

		this.wormPathQueue.clear();
		this.isAttentivePlanned = true;
		this._planAttentiveMovements(region, ts);
	}

};


GameCanvas.prototype.stepGameTarget = function(time){
	if ((time - this.lastFoodTs) > 5000 && this.foods.length < this.maxFood) {
		this.createOneFood();
		this.lastFoodTs = time;
	}
};

/**
@param regionIdx: 0, 1,2,3
*/
GameCanvas.prototype._planIdleMovements = function(regionIdx, nextTimestamp){
	if(regionIdx > 4){
		return;
	}

	var waitPlaceholder = this.createIdleMovement((regionIdx +3)%4 +10, nextTimestamp, true);

	//gen random waiting time
	if(Math.random()<0.5){
		//TODO: vary waiting time
		nextTimestamp += 3000; //GameCanvas.idleMovementInterval;
	}

	var showMovement = this.createIdleMovement(regionIdx, nextTimestamp);

	
	nextTimestamp += GameCanvas.idleMovementInterval;
	var hideMovement = this.createIdleMovement(regionIdx + 10, nextTimestamp);

	if(waitPlaceholder && showMovement && hideMovement){
		this.wormPathQueue.enqueue(waitPlaceholder);
		this.wormPathQueue.enqueue(showMovement);
		this.wormPathQueue.enqueue(hideMovement);	
	}
};

GameCanvas.prototype._planAttentiveMovements = function(regionIdx, nextTimestamp){
	if(regionIdx < 20){
		return;
	}

	for(var i=0; i<3; i++){
		var movement = this.createAttentiveMovement(regionIdx, i, nextTimestamp);
		this.wormPathQueue.enqueue(movement);
		nextTimestamp += GameCanvas.idleMovementInterval;
	}
};

GameCanvas.prototype.createIdleMovement = function(regionIdx, timestamp, noMove){
	if(noMove){
		return new IdleMovement(regionIdx, null, null, timestamp);
	}

	var x, y; //normalised x and y (0,1)
	if(regionIdx < 10){
		//in canvas region: 0,1,2,3
		switch(regionIdx){
			case 0:
			x=0.5; y=0.1; 
			break;
			case 1:
			x=0.95; y=0.5;
			break;
			case 2:
			x=0.5; y=0.9;
			break;
			case 3:
			x=0.05; y=0.5;
			break;
		}
	}else{
		//out of canvas region: 10,11,12,13
		switch(regionIdx%10){
			case 0:
			x=1.2; y=-0.2; 
			break;
			case 1:
			x=1.2; y=1.2;
			break;
			case 2:
			x=-0.2; y=1.2;
			break;
			case 3:
			x=-0.2; y=-0.2;
			break;
		}

	}

	if(x!==undefined && y!==undefined){
		return new IdleMovement(regionIdx, x*this.width(), y*this.height(), timestamp);
	}

	return null;
};

GameCanvas.prototype.createAttentiveMovement = function(regionIdx, positionIdx, timestamp){
	var x, y;
	var positions = [
	[[0.2,0.1], [0.3, -0.1], [0.4, 0.15]], //top position 1, 2,3
	[[0.9,0.1], [1.1, 0.2], [0.85, 0.3]], //right position 1, 2,3
	[[0.9,0.9], [0.8, 1.1], [0.7, 0.85]], //bottom position 1, 2,3
	[[0.1,0.9], [-0.1, 0.8], [0.15, 0.7]] //left position 1, 2,3
	];
	
	x = positions[regionIdx%20][positionIdx][0];
	y = positions[regionIdx%20][positionIdx][1];

	return new IdleMovement(regionIdx, x*this.width(), y*this.height(), timestamp);

};

GameCanvas.prototype._init = function() {

	//force set canvas width and height
	this.updateDimension();
	this.clearCanvas();

	this.createWorm();
};


GameCanvas.prototype.onEvent = function(evt, sender){
	switch (evt.event) {
		case 'wormMove':
		//console.log('wormMove');
		this.onWormMove(evt);
		break;
		default:
		console.log("Undefined raised event: " + evt.event);
	}
};
GameCanvas.prototype.onWormMove = function(evt) {

	var head = this.worm.getHeadPart();
	for (var i = 0; i < this.foods.length; i++) {
		if (this.foods[i].checkCollide(head.x, head.y, head.size)) {
			//remove food
			this.foods.splice(i, 1); //remove item at i

			//grow
			this.worm.grow();
		}
	}
};

GameCanvas.prototype.createWorm = function() {
	var wormLength;

	if (this.gameState === DemoApp.STATE.GAME_TARGET) {
		wormLength = 3;
	} else {
		wormLength = Configs.wormLength;
	}
	this.worm = new Worm(wormLength, Worm.STYLE.FACE);

	//also register a move event listerning to check collide?
	this.worm.subscribe(this,this.onEvent);
};

GameCanvas.prototype.createOneFood = function() {
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



var Worm = Class([Observable], {
	$const: {
		STYLE: {
			NONE: 'none',
			FACE: 'face',
			XMAS: 'xmas'
		}
	},
	constructor: function(length, style, initX, initY) {
		//call parents constructor
		Observable.call(this);

		this.bodyParts = [];
		this.initLength = length;
		this.style = style ? style : Worm.STYLE.NONE;
		this.reactionTime = 50; //200ms, 0.2s
		this.colorSet = App.settings.colorSet;

		this.x = initX || -100;
		this.y = initY || -100;


		//put starting object
		for (var i = 0; i < this.initLength; i++) {
			var faceStyle = Worm.STYLE.NONE;

			//first bodypart is head
			if ((i === 0) && this.style !== Worm.STYLE.NONE)
				faceStyle = this.style;


			var newPart = new BodyPart(this.x, this.y, this.colorSet, faceStyle);
			this.bodyParts.push(newPart);
		}

	},
	grow: function() {
		//TODO: GROW the new part with a more catchy animation, 

		var tailPart = this.bodyParts[this.bodyParts.length - 1];
		//var newPart = new BodyPart(tailPart.x, tailPart.y, this.colorSet, Worm.STYLE.NONE);

		//also clone movementQueue
		var newPart = tailPart.clone();
		this.bodyParts.push(newPart);
	},
	getHeadPart: function() {

		return this.bodyParts[0];
	},
	draw: function(ctx) {
		//draw
		
		//draw from tail to head so head is always on top
		for (var i = this.bodyParts.length - 1; i >= 0; i--) {
			this.bodyParts[i].draw(ctx);
		}
	},
	moveTowards: function(targetX, targetY) {
		

		this.move();
		this.attractTowards(targetX, targetY);
	},
	move: function() {
		//trigger movement that match the ts
		var now = Date.now();
		//set music volume according to moving Count
		var movingCount = 0;
		//loop from head to tail
		for (var i = 0; i < this.bodyParts.length; i++) {
			var eachBodyPart = this.bodyParts[i];
			var movementQueue = eachBodyPart.movementQueue;
			// console.log('before: ' + movementQueue.getLength());

			//0 is the earliest
			while(movementQueue.getLength() >0){
				var eachMovement = movementQueue.peek();
				if (now > eachMovement.timestamp) {
					
					//dequeue it
					eachMovement = movementQueue.dequeue();
					//do the movement
					eachBodyPart.moveTowards(eachMovement.targetX, eachMovement.targetY);

				} else {
					//if the earlier one is not time yet, any items later wont be time yet either
					//console.log(now + ' ' + eachMovement.timestamp);
					break;
				}
				
			}

			// console.log('after: ' + movementQueue.getLength());

			movingCount += eachBodyPart.isMoving();
		}
		if(movingCount>0){
			//console.log(movingCount + ' ');
			//raise an event
			this.raise({event: "wormMove"}, this);
		}
		//console.log(this.bodyParts[this.bodyParts.length-1].movementQueue);

		$scope.game.setMusicVolume(movingCount / this.bodyParts.length);
	},
	attractTowards: function(targetX, targetY) {
		// var head = this.getHeadPart();
		// if(head.x === targetX && head.y === targetY)
		// 	return;
		
		//remember timestamp that triiger this function
		var now = Date.now();
		// var that = this;

		//TODO: add logic to smooth out movements
		this.x = targetX;
		this.y = targetY;

		//loop from head to tail
		for (var i = 0; i < this.bodyParts.length; i++) {
			//queue movement with delay
			var fireTimestamp = now + this.reactionTime * i;
			this.bodyParts[i].movementQueue.enqueue(new Movement(targetX, targetY, fireTimestamp));
		}
		//console.log('before:' +this.bodyParts[0].movementQueue.length + ' ' + this.bodyParts[this.bodyParts.length-1].movementQueue.length);

	}

});


var Movement = function(targetX, targetY, fireTimestamp) {
	this.targetX = targetX;
	this.targetY = targetY;
	this.timestamp = fireTimestamp;
};


/**
TODO: to be renamed to AutoMovements
@param region: 0 = top, 1 = right, 2 = bottom, 3 = left;
			 10 = top-right hidden, 11 = bottom-right hidden, 12 = bottom-left hidden, 13 = top-left hidden
			 20 = top, 21 = right, 22 = bottom, 23 = left
			 */
			 var IdleMovement = function(region, targetX, targetY, fireTimestamp){
			 	Movement.call(this,targetX, targetY, fireTimestamp);

			 	this.region = region;
			 };
			 IdleMovement.prototype = new Movement();
			 IdleMovement.prototype.constructor = IdleMovement;
			 IdleMovement.STATE = {
	IN_MOVE : 'movein', //moving in canvas
	OUT_MOVE : 'moveout', //moving out of canvas
	WAIT : 'wait' //waiting out of canvas
};
IdleMovement.prototype.getState = function(){
	if(this.region < 10)
		return IdleMovement.STATE.MOVE_IN;
	else if(this.targetX === null && this.targetY === null)
		return IdleMovement.STATE.WAIT;
	else
		return IdleMovement.STATE.MOVE_OUT;

};

Movement.prototype.clone = function(){
	return new Movement(this.targetX, this.targetY, this.timestamp);
}

var BodyPart = function(x, y, colorSet, faceStyle) {
	// this.oldX = x;
	// this.oldY = y;
	this.x = x;
	this.y = y;
	this.faceStyle = faceStyle; //none, face, xmas
	this.decorImg = null;

	this.movementQueue = new Queue();

	this.velocityX = 0;
	this.velocityY = 0;
	this.direction = 0; //North

	this.colorSet = colorSet;

	this.color = Configs.colorSets[this.colorSet][Math.floor((Math.random() * 9))]; //random number 0-8
	this.antennaColor = Configs.colorSets[this.colorSet][Math.floor((Math.random() * 9))]; //random number 0-8
	this.size = (Math.floor((Math.random() * 11)) + 20); //size: 20 - 30


	if (this.faceStyle === 'xmas') {
		this.decorImg = new Image();

		var fileIdx = Math.floor((Math.random() * 9) + 1); //random 1-9
		this.decorImg.src = '../image/xmas/Hat' + fileIdx + '.png';
		this.decorImg.width = this.size * 4.5;//h/w = 414/421 = 0.98
		this.decorImg.height = this.decorImg.width * 0.98;
	}
};

BodyPart.prototype.clone = function(){
	var newPart = new BodyPart(this.x, this.y, this.colorSet, this.faceStyle);

	for(var i=0; i<this.movementQueue.getLength(); i++){
		var eachMovement = this.movementQueue.peekAt(i);
		newPart.movementQueue.enqueue(eachMovement.clone());
	}
	return newPart;
};
//static vars
BodyPart.DAMPING = 0.999;
BodyPart.ACCELERATION = 0.1;
BodyPart.MAX_SPEED = 20; //no direction

BodyPart.prototype.moveTowards = function(targetX, targetY) {
	this.move();
	this.attractTowards(targetX, targetY);
};

BodyPart.prototype.move = function() {
	this.x += this.velocityX * BodyPart.DAMPING;
	this.y += this.velocityY * BodyPart.DAMPING;
};

BodyPart.prototype.attractTowards = function(x, y) {
	var dx = x - this.x;
	var dy = y - this.y;

	this.velocityX = dx * BodyPart.ACCELERATION;
	if (this.velocityX > BodyPart.MAX_SPEED) {
		this.velocityX = BodyPart.MAX_SPEED;
	} else if (this.velocityX < - BodyPart.MAX_SPEED) {
		this.velocityX = - BodyPart.MAX_SPEED;
	} else if (Math.abs(this.velocityX) < 0.01) {
		this.velocityX = 0;
	}

	this.velocityY = dy * BodyPart.ACCELERATION;
	if (this.velocityY > BodyPart.MAX_SPEED) {
		this.velocityY = BodyPart.MAX_SPEED;
	} else if (this.velocityY < - BodyPart.MAX_SPEED) {
		this.velocityY = -BodyPart.MAX_SPEED;
	} else if (Math.abs(this.velocityY) < 0.01) {
		this.velocityY = 0;
	}


	if (this.velocityX === 0 && this.velocityY === 0) { //no movement
		this.x = x; 
		this.y = y;
	}

};

BodyPart.prototype.isMoving = function(){
	return this.velocityX !== 0 && this.velocityY !== 0;
}


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

var Food = Class({
	$const: {
		TYPE: {
			BEAN: 'bean',
			APPLE: 'apple',
			LEAF: 'leaf',
			FLOWER: 'flower'
			//TODO: split different types into sub class?
		}
	},
	constructor: function(ctx) {
		//random type of food
		this.type = Food.TYPE.BEAN;

		//random lcoation
		this.x = Math.random() * ctx.canvas.width;
		this.y = Math.random() * ctx.canvas.height;

		this.size = 10;

	},
	draw: function(ctx) {


		switch (this.type) {
			case Food.TYPE.BEAN:
			ctx.fillStyle = "#F00"
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI, false);
			ctx.fill();

			break;
			default:

		}

	},
	checkCollide: function(targetX, targetY, targetSize) {
		//check distance between target and food location, if < this.size, then collide
		var distance = Math.sqrt(Math.pow((targetX - this.x), 2) + Math.pow((targetY - this.y), 2));
		if (distance <= (this.size + targetSize)) {
			return true;
		}

		return false;
	}
});
