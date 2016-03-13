

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
		Observable.call(this); //call parent's constructor

		this._state = DemoApp.STATE.IDLE;
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
		}
	}
});

var demoApp;
var GlobalFunc; //to be called by outside
var $scope = {};


$(document).ready(function(){
	demoApp = new DemoApp();


	$scope.game= new Game(Game.MODE.TARGET);
	demoApp.subscribe($scope.game, $scope.game.onEvent);

	$scope.game.run();
});








