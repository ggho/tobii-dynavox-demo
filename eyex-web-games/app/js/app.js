'use strict';

//App level logic
var DemoApp = Class([Observable],{
	$const: {
		STATE: {
			IDLE: 1,
			ATTENTIVE: 2,
			POSITIONING: 3,
			CALIBRATION: 4,
			GAME_EXPLORE: 5,
			GAME_TARGET: 6,
		}
	},
	constructor: function(){
		Observable.call(this); //call parent's constructor

		// this._state = DemoApp.STATE.IDLE;
		this._state = DemoApp.STATE.GAME_TARGET; //dev mode

		$('#info-state').text('').text(this._state);
	},
	// Getter/Setter 
	state: {
		get: function() {
			return this._state;
		},
		set: function(value) {
			if(this._state == value)
				return;
			
			this._state = value;
			this.raise({event: 'stateChange', data: this._state}, this);

			//debug
			$('#info-state').text(this._state);
		}
	},
	nextState: function(){
		if(this.state === DemoApp.STATE.IDLE)
			this.state = DemoApp.STATE.ATTENTIVE;
		else if(this.state === DemoApp.STATE.ATTENTIVE)
			this.state = DemoApp.STATE.POSITIONING;
		else if(this.state === DemoApp.STATE.POSITIONING)
			this.state = DemoApp.STATE.GAME_EXPLORE;
		else if(this.state === DemoApp.STATE.GAME_EXPLORE)
			this.state = DemoApp.STATE.GAME_TARGET;
		else if(this.state === DemoApp.STATE.GAME_TARGET)
			this.state = DemoApp.STATE.IDLE;
	}
});

var demoApp;
var $scope = {};
var nativeApp;

//to be called by outside
var callWeb = function(event, data) {

	if(event == 'fixationPoint'){
		if(demoApp.state !== DemoApp.STATE.GAME_EXPLORE && demoApp.state !== DemoApp.STATE.GAME_TARGET)
			return; //do nothing

		$scope.game.setMouse(data.x, data.y);
		
	}else if(event == 'setState'){
		console.log("setState: " + data.state);
		demoApp.state = data.state;
	}else{
		console.log('Unrecognized call: ' + event);

	}



};

$(document).ready(function(){
	demoApp = new DemoApp();


	$scope.game= new Game(demoApp.state);
	demoApp.subscribe($scope.game, $scope.game.onEvent);
	//$scope.game.

	$scope.game.run();

	// From native app


	// Get native object
	nativeApp = window.native || null;

	if (nativeApp) {
		nativeApp.callNative("Hello native app. blah.");
		console.log("This is Native app");
	} else {
		console.log("This is NO Native app");
	}

	//For standalone demo/ debug purpose 
	$(window).keydown(function(event) {
		if(event.which === 32 || event.which === 13 || event.which === 13){ //SPACE: 32, ENTER: 13, RIGHT-> : 39
			demoApp.nextState();

			// event.preventDeault();
		}
	});
});








