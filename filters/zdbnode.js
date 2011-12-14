/*!
 * DOQ API: Filter for database sub nodes.
 * @version 0.0.1
 * @author Stev0 <steven@navolutions.com>
 */

/*!
 * Required modules.
 */
var filterObject = require( "../lib/filter.js" ).Filter;
var doqInterface = require('../lib/interface.js').Interface;

exports.Filter = function(){
	
	this.name = "dbnode";
	
	this.compileOnLoad = true;
	
	this.bnfSyntax = "";
	var column = '<columnName> ::= <_text>\n'
		+'<selectionStyle> ::= <selectAll> | <selectFirst> | <selectExecute>\n'
		+'<selectAll> ::= "*"\n'
		+'<selectFirst> ::= "$"\n'
		+'<selectExecute> ::= "!"\n'
		+'<optsubcolumn> ::= "" | "/" <subcolumn>\n'
		+'<subcolumn> ::= <column>';
	if( doqInterface.GetCompiledFilters().length > 0 ){
		bnfSyntax = '<syntax> ::= <column> <selectionStyle>\n<column> ::= <columnName> | <columnName> <optsubcolumn> | #' + doqInterface.GetCompiledFilters().join( ' | #' ) + '\n' + column;
	}
	else{
		bnfSyntax = '<syntax> ::= <columnName> <selectionStyle> | <columnName> <optsubcolumn>\n' + column;
	}

	this.parseEvents = {
		'columnName':function( token ){
			console.log( token.text );
		}
	};
	
	this.QueryObject = function( query ){
		//query.type
		if( query.columnQuery != undefined ){
			return this.dataObject.Query( { serverQuery:true }, query.columnQuery + query.type );
		}
		else{
			return this;
		}
	};

	this.Creation = function( ){
		var subfactor = this.parent.__subfactors;
		var dbpath = subfactor.connection.dataCatalogue.ReadNodeAttribute( subfactor.connectionName, "node[@id='"+ subfactor.baseNode + "']/node[@id='" + this.saveName + "']", "dbpath" );
		dbpath = dbpath.replace( /\{\%value\}/, this.dataStream );
		var self = this;
		
		doqInterface.Query( { serverQuery:true }, dbpath, null, function( result ){
			self.dataObject = result;
			self.parent.NotifyCompiledItem();
		} );
		this.dataObject = "unset";
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
