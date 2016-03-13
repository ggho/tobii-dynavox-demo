var Observable = Class({
	constructor: function(){
		this.handlers = []; //observers handlers	
	},

	subscribe: function(subscriber, handler) {
		// if(this.handlers == undefined){
		// 	this.handlers = [];
		// }
		this.handlers.push({
			thisObj: subscriber,
			fn: handler
		});
	},

	unsubscribe: function(fn) {
		this.handlers = this.handlers.filter(
			function(item) {
				if (item !== fn) {
					return item;
				}
			}
			);
	},

	raise: function(evt, thisObj) {
		var sender = thisObj || window;
		this.handlers.forEach(function(item) {
			var scope = item.thisObj || window;
			item.fn.call(scope, evt, sender);
		});
	}

});
