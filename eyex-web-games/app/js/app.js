

//App level logic
var DemoApp = Class([Observable],{
	$const: {
		STATE: {
			IDLE: 'idle',
			ATTENTIVE: 'attentive',
			POSITIONING: 'positioning',
			CALIBRATION: 'calibration',
			GAME_EXPLORE: 'game-explore',
			GAME_TARGET: 'game-target',
		}
	},
	constructor: function(){
		this._state = DemoApp.STATE.IDLE;
	},
	// Getter/Setter 
	state: {
		get: function() {
			return this._state;
		},
		set: function(value) {
			this._state = value;
		}
	}
});

var demoApp;
var GlobalFunc; //to be called by outside
var $scope = {};


$(document).ready(function(){
	demoApp = new DemoApp();


	$scope.game= new Game(Game.MODE.TARGET);
});








