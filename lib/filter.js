/*!
 * DOQ API: filter object framework
 * @version 0.0.1
 */

/*!
 * Required modules.
 */
var compiler = require('bnf').Compiler;

/**
 * The data container for the filter.
 */
function FilterDataObject(){
    /**
     * Constructor of the object
     * @param parser bnf.parser - The parser of the filter.
     * @param datastream string - The data for the object.
     */
    function Constructor( parser, datastream, queryMethod, objectQueryMethod ){
    	this.parser = parser;
    	this.dataStream = datastream;
    	this.Query = queryMethod;
    	this.QueryObject = objectQueryMethod;
    	Object.defineProperty( this, "value", {
			get:function(){
				return this.Query( null );
			},
			set:function( v ){
				this.compiled = false;
				this.Query( null, v );
			}
		} );
    }
    /////////////////////
//////PRIVATE VARIABLES//
    /////////////////////

    ///////////////////
//////PRIVATE METHODS//
    ///////////////////
  
    ////////////////////
//////PUBLIC VARIABLES//
    ////////////////////
    this.parser = null;
    this.dataStream = "";
    this.dataObject = null;
    //////////////////
//////PUBLIC METHODS//
    //////////////////
    this.Query = function( queryString ){
    	console.log( "This method is inherited from the Filter." );
    };
    this.QueryObject = function( query ){
    	console.log( "This method is inherited from the Filter." );
    };
    
  //CALL TO CONSTRUCTOR//
    Constructor.call( this, arguments[0], arguments[1], arguments[2], arguments[3] );
    //CALL TO CONSTRUCTOR//
}

/**
 * Abstract object for creating new filters
 * @see Filter.Constructor
 */
exports.Filter = function(){
    /**
     * Constructor of the object
     * @param compiler bnf.Compiler - The BNF compiler to compile to filter language file.
     */
    function Constructor( compiler, child ){
    		{_Inherit.call( this, child )}
    	_compiler = compiler;
    	if( this.bnf != "" ){
    		child.bnf += '\n<columnName> ::= <_text>';
    		this.parseEvents["columnName"] = function( token ){
				this.query.column = token.text;
				this.currentTree.name = token.text;
				this.currentTree.tree = {};
				this.currentTree = this.currentTree.tree;
			};
			this.includeInFilters = true;
    	}
    }
    /////////////////////
//////PRIVATE VARIABLES//
    /////////////////////
    var _filterParser = null;
    var _compiler = null;
    ///////////////////
//////PRIVATE METHODS//
    ///////////////////
    
    ////////////////////
//////PUBLIC VARIABLES//
    ////////////////////
    this.includeInFilters = false;
    //////////////////
//////PUBLIC METHODS//
    //////////////////
    this.Create = function( dataString ){
    	var dataFilter = new FilterDataObject( _filterParser, dataString, this.Query, this.QueryObject );
    	this.Creation.call( dataFilter );
    	return dataFilter;
    };
    /**
     * Initializes the parser for this filter.
     */
    this.InitializeParser = function( columnParser ){
    	var self = this;
    	_compiler.CompileString( this.bnf, this.name, function( interpreter ){
    		_filterParser = _compiler.CreateParser( interpreter, self.parseEvents );
    		columnParser.IncludeLanguage( _filterParser );
    		_filterParser.IncludeLanguage( columnParser );
    	});
    };
    
    this.Query = function( queryString ){
    	//Turn the string into an object//
    	
    }
    //////////////////////
//////ABSTRACT VARIABLES//
    //////////////////////
    this.name = "";
    
	this.bnf = "";
    
	this.parseEvents = {};
    
    ////////////////////
//////ABSTRACT METHODS//
    ////////////////////
    if( !this.QueryObject ){
		this.QueryObject = function( query ){
			console.log( "This is abstract, please create a method for this.\n.prototype.QueryObject or objectinstance.QueryObject" );
		};
	}
    
    //ABSTRACTION LAYER//
    var _child = null;
	function _Inherit( child ){
		_child = child;
		for( i in _child ){
			this[i] = _child[i];
		}
	}
    //ABSTRACTION LAYER//
    
    //CALL TO CONSTRUCTOR//
    Constructor.call( this, arguments[0], arguments[1] );
    //CALL TO CONSTRUCTOR//
};