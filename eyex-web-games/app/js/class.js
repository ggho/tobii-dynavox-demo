var Observable = Class({
	constructor: function(){
		this.handlers = []; //observers handlers	
	},

	subscribe: function(fn) {
		if(this.handlers == undefined){
			this.handlers = [];
		}
		this.handlers.push(fn);
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

	raise: function(o, thisObj) {
		var scope = thisObj || window;
		this.handlers.forEach(function(item) {
			item.call(scope, o);
		});
	}

});
