var libxml = require( "libxmljs" );
libxml.Element.prototype.attrs = libxml.Element.prototype.attr;
libxml.Element.prototype.attr = function( attribute, value ){
	if( value === undefined ){
		var attr = this.attrs( attribute );
		if( attr ){
			return attr.value();
		}
		else{
			return "";
		}
	}
	else{
		var atbObject = {};
		atbObject[attribute] = value
		this.attrs( atbObject );
		return value;
	}
};

libxml.Element.prototype.findxpath = libxml.Element.prototype.find;

libxml.Element.prototype.find = function( xpathQueryString, namespaceUri ){
	var xpathQuery = this.findxpath( xpathQueryString, namespaceUri );
	if( xpathQuery.length > 0 ){
		var paths = xpathQueryString.split( "/" );
		if( paths[paths.length - 1][0] == "@" ){
			var xpathReconstruct = [];
			for( var i = 0; i < xpathQuery.length; i++ ){
				xpathReconstruct.push( xpathQuery[i].text() );
			}
			return xpathReconstruct;
		}
	}
	
	return xpathQuery;
	
};

exports.libxml = libxml;