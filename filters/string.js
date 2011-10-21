/*!
 * DOQ API: Filter for strings
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;

exports.Filter = function(){
	
	this.name = "string";
	
	this.queryable = false;

	this.QueryObject = function( query ){
		if( query.value != undefined ){
			//The compile flag gets turned off so the object will be recreated with the new value//
			this.dataStream = v;
			this.dataObject = null;
			//SAVE
		}
		return this.dataObject;
	};

	this.Creation = function( ){
		this.dataObject = this.dataStream;
	};
	
	//ABSTRACTION LAYER//
	var _parent = null;
	function _Inherit( ){
		_parent = new filterObject( arguments[0], this );
		for( i in _parent ){
			if( !this[i] ){
				this[i] = _parent[i];
			}
		}
	}
	_Inherit.apply( this, arguments );
	//ABSTRACTION LAYER//
};
