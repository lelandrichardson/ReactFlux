var _assign = require('lodash-node/modern/objects/assign');
var _merge = require('lodash-node/modern/objects/merge');
var _forEach = require('lodash-node/modern/collections/forEach');
var _isArray = require('lodash-node/modern/objects/isArray');
var _isFunction = require('lodash-node/modern/objects/isFunction');

var Promise = require('es6-promise').Promise;
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = 'change';

/**
* Flux Store 
* @param {object} dispatcher
* @param {object} storePrototypeMixin
* @param {array} handlers
*/
var Store = function(dispatcher, storePrototypeMixin, handlers){
	this.state = {};
	this._handlers = {};
	this._dispatcherIndexes = {};
	this._dispatcher = dispatcher;
	this._setProperties(storePrototypeMixin);
	this._setInitialState();
	this._setHandlers(handlers);
	!!this.storeDidMount && this.storeDidMount();
}


Store.prototype = _assign(EventEmitter.prototype, {

	/**
	* @param {object} newState
	*/
	setState: function(newState){
		this.state = _merge(this.state, newState);
		this.emit(CHANGE_EVENT);
	},
	
	/**
	* @return {object} Store's state
	*/
	getState: function(){
		return this.state;
	},
	
	/**
	* @param {function} callback
	*/
	addChangeListener: function(callback){
		this.on(CHANGE_EVENT, callback);
	},
		
	/**
	* @param {function} callback
	*/
	removeChangeListener: function(callback){
		this.remove(CHANGE_EVENT, callback);
	},
	
	/**
	* Get dispatcher idx of this constant callback for this store
	* @param {string} constant
	* @return {number} Index of constant callback
	*/
	getHandlerIndex: function(constant){
		if( typeof this._dispatcherIndexes[constant] == "undefined" ){
			throw new Error('Can not get store handler for constant: ' + constant);
		}
		return this._dispatcherIndexes[constant];
	},


	/**
	* set extra properties & methods for this Store
	* @param {object} storePrototypeMixin
	*/
	_setProperties: function(storePrototypeMixin){
		_forEach(storePrototypeMixin, function(prop, propName){
			if( _isFunction(prop) ){
				prop = prop.bind(this);
			} 
			this[propName] = prop;
		}.bind(this));
	},

	/**
	* Set handlers for this Store
	* @param {array} handlers
	*/
	_setHandlers: function(handlers){
		this._dispatcherIndexes = {};
		_forEach(handlers, function(options){
			var constant, handler, waitFor;
			constant = options[0];
			
			if( options.length == 2 ){
				waitFor = null;
				handler = options[1];
			}else{
				waitFor = options[1];
				handler = options[2];
			}

			var waitForIndexes = null;
			if( waitFor ){
				var waitForIndexes = waitFor.map(function(store){
					return store.getHandlerIndex(constant);
				});
			}
			
			this._handlers[constant] = handler.bind(this);
			var dispatcherIndex = this._dispatcher.register(constant, this._handlers[constant], waitForIndexes);
			this._dispatcherIndexes[constant] = dispatcherIndex;
		}.bind(this));
	},

	/**
	* Sets intial state of the Store
	*/
	_setInitialState: function(){
		if( !!this.getInitialState ){
			this.setState( this.getInitialState() );
		}
	}

});

module.exports = Store;