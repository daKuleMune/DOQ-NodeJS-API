/*!
 * DOQ API: libxmljs extension.
 * @version 0.0.3
 */

/*!
 * Included modules.
 */
var libxml = require( "libxmljs" );

/**
 * Copy of the method in attr to attrs to be able to overwrite.
 */
libxml.Element.prototype.attrs = libxml.Element.prototype.attr;
/**
 * The extended attr method, to act more like jQuery.
 * @param attribute string - Name of the attribute.
 * @param value string[optional] - Value to set the attribute to.
 * @returns string - The value of the attribute or a blank string if non is found.
 */
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

/**
 * Copy of the method in find to findxpath to be able to overwrite.
 */
libxml.Element.prototype.findxpath = libxml.Element.prototype.find;
/**
 * The extended find to act more like the dxq.
 * @param xpathQueryString string - The xpath query.
 * @param namespaceUri string[optional] - Namespace uri.
 * @returns mixed - The result of the xpath search.
 */
libxml.Element.prototype.find = function( xpathQueryString, namespaceUri ){
	var xpathQuery = this.findxpath( xpathQueryString, namespaceUri );
	if( xpathQuery.length > 0 ){
		var paths = xpathQueryString.split( "/" );
		if( paths[paths.length - 1][0] == "@" ){
			var xpathReconstruct = [];
			for( var i = 0; i < xpathQuery.length; i++ ){
				if( xpathQuery[i].text ){
					xpathReconstruct.push( xpathQuery[i].text() );
				}
				else if( xpathQuery[i].value ){
					xpathReconstruct.push( xpathQuery[i].value() );
				}
			}
			return xpathReconstruct;
		}
	}
	
	return xpathQuery;
	
};

exports.libxml = libxml;