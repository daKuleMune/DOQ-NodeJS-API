/*!
 * DOQ API: Filter for numbers
 * @version 0.0.1
 * @author Stev0 <steven@navolutions.com>
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;

exports.Filter = function(){
	
	this.name = "number";

	this.Creation = function( ){
		this.dataObject = parseInt( this.dataStream );
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
