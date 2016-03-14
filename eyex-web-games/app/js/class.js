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

var Queue = function(){
	this._items = [];
};
Queue.prototype.enqueue = function(obj){
	this._items.push(obj);
};
Queue.prototype.dequeue = function(){
	return this._items.shift();
};
Queue.prototype.peek = function(){
	if(this._items.length > 0)
		return this._items[0];
	else
		return null;
}
Queue.prototype.peekAt = function(idx){
	if(idx < this._items.length)
		return this._items[idx];
	else
		return null;
}
Queue.prototype.peekLast = function(){
	if(this._items.length > 0)
		return this._items[this._items.length-1];
	else
		return null;
}
Queue.prototype.isEmpty = function(){
	return this._items.length > 0 ? false : true;
}
Queue.prototype.getLength = function(){
	return this._items.length;
}

