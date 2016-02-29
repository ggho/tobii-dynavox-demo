

//App level logic
var DemoApp = Class([Observable],{
	$const: {
		STATE: {
			IDLE: 'idle',
			ATTENTIVE: 'attentive',
			POSITIONING: 'positioning',
			CALIBRATION: 'calibration',
			GAME: 'game',
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
$(document).ready(function(){
	demoApp = new DemoApp();
});








