/*!
 * DOQ API: filter object framework
 * @version 0.0.2
 */

/*!
 * Included modules.
 */
var compiler = require('bnf').Compiler;

/**
 * The data container for the filter.
 * @see FilterDataObject.Constructor
 */
function FilterDataObject(){
    /**
     * Constructor of the FilterDataObject
     * @param parser bnf.parser - The parser of the filter.
     * @param datastream string - The data for the object.
     * @param queryMethod function - Query method for executing queries from strings.
     * @param objectQueryMethod function - Query method for executing queries from objects.
     * @param queryable boolean - Is it even possible to query this data object?
     */
    function Constructor( parser, datastream, queryMethod, objectQueryMethod, queryable ){
    	this.parser = parser;
    	this.dataStream = datastream;
    	this.Query = queryMethod;
    	this.QueryObject = objectQueryMethod;
    	this.queryable = queryable;
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
    /**
     * The parser for the filters language.
     * @type {bnf.Parser}
     */
    this.parser = null;
    /**
     * The raw data stream for the object.
     * @type string
     */
    this.dataStream = "";
    /**
     * The compiled data object.
     * @type mixed
     */
    this.dataObject = null;
    //////////////////
//////PUBLIC METHODS//
    //////////////////
    /**
     * Abstract query method, overwritten by the filter.
     */
    this.Query = function( queryString ){
    	console.log( "This method is inherited from the Filter." );
    };
    /**
     * Abstract object query method, overwritten by the filter.
     */
    this.QueryObject = function( query ){
    	console.log( "This method is inherited from the Filter." );
    };
    
    //CALL TO CONSTRUCTOR//
    Constructor.call( this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4] );
    //CALL TO CONSTRUCTOR//
}

/**
 * Abstract object for creating new filters
 * @see Filter.Constructor
 * @TODO - Need to find a better way to do JavaScript abstraction.
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
    /**
     * The compiler for the filter, if it needs one.
     * @type {bnf.Compiler}
     */
    var _compiler = null;
    /**
     * The parser for the filter, if it needs one.
     * @type {bnf.Parser}
     */
    var _filterParser = null;
    
    ///////////////////
//////PRIVATE METHODS//
    ///////////////////
    
    ////////////////////
//////PUBLIC VARIABLES//
    ////////////////////
    /**
     * Check to see if this filter should be included in the list of filters in the column language layer, does it have a compiler?
     * @type boolean
     */
    this.includeInFilters = false;
    
    //////////////////
//////PUBLIC METHODS//
    //////////////////
    /**
     * Creation method for new data strings to compile.
     * @param dataString string - The raw data string.
     * @returns {FilterDataObject} - Compiled data object.
     */
    this.Create = function( dataString ){
    	var dataFilter = new FilterDataObject( _filterParser, dataString, this.Query, this.QueryObject, this.queryable );
    	this.Creation.call( dataFilter );
    	return dataFilter;
    };
    /**
     * Initializes the parser for this filter.
     * @param columnParser {bnf.Parser} - Column parser to include this filter into.
     */
    this.InitializeParser = function( columnParser ){
    	var self = this;
    	_compiler.CompileString( this.bnf, this.name, function( interpreter ){
    		_filterParser = _compiler.CreateParser( interpreter, self.parseEvents );
    		columnParser.IncludeLanguage( _filterParser );
    		_filterParser.IncludeLanguage( columnParser );
    	});
    };
    /**
     * Filter string query method, which turns into a query object that can be processed by the abstract filter.
     * @param queryString - String for the query run/execution path.
     */
    this.Query = function( queryString ){
    	//Turn the string into an object//
    	
    }
    //////////////////////
//////ABSTRACT VARIABLES//
    //////////////////////
    /**
     * The bnf syntax for the filter language, if any.
     * @type string
     */
	this.bnf = "";
    /**
     * The name of the filter language.
     * @type string
     */
    this.name = "";
    /**
     * The parser events for the filter language, if any.
     * @type assoArray
     */
	this.parseEvents = {};
    
    ////////////////////
//////ABSTRACT METHODS//
    ////////////////////
    if( !this.QueryObject ){
    	/**
    	 * The query object method, that executes the query.
    	 * @param query object - Query object to execute.
    	 */
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