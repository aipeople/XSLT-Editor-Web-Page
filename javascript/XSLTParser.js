//
//  Created by aipeople on 14/01/01.
//  Copyright (c) 2014年 Su Xing Yu. All rights reserved.
//

function XSLTParser(xml, xslt) {
	
	this.xml  = xml;
	this.xslt = xslt;
	
	this.getRootTag = function() {
		
		var rootTag = this.xml.replace(/<!--.*?-->/g, "").match(/<[^>^\/^\ ]*/g)[0];
		rootTag = rootTag.substring(1, rootTag.length);
		return rootTag;
	}
	
	this.getTemplates = function() {
		
		var xsltString = this.xslt;
		xsltString = xsltString.replace(/>[\s^\ ]*?</g, "><");
		
		var headIndexArray = xsltString.match(/<xsl:template[^>]*>[\s\S]*?<\/xsl:template>/g);
		var resultDictionary = {};
		
		for (var i=0; i <headIndexArray.length; i++) {
			
			var templateString = headIndexArray[i];
			var tagString = templateString.match(/<xsl:template[^>]*?>/g)[0];
			
			var attrString = tagString.match(/\ match\ *=\ *".*?"/)[0];
			var matchString = attrString.substring(attrString.indexOf('"') +1, attrString.length -1);
			
			if (matchString == "\/") matchString = this.getRootTag();
			resultDictionary[matchString] = templateString;
		}
		return resultDictionary;
	}
}

XSLTParser.prototype.htmlString = function() {
	
	var rootTag = this.getRootTag();
	var templates = this.getTemplates();
	var xml = this.xml;
	
	var rootTemplate = templates[rootTag];
	
	return generateHTMLString(rootTemplate, rootTag);
	
	
	//Generator
	function generateHTMLString(template, path, findAll, filterDictionary, sortTag) {
		
		var templateContent = contentInTemplate(template);
		var parts = sliceTemplate(templateContent);
		var html = "";
		
		if (findAll == undefined) findAll = false;
		if (filterDictionary == undefined) filterDictionary = {"tag":"", "content":""};
		if (sortTag == undefined) sortTag = "";
		
		var findRound = 0;
		var totalRound = 1;
		
		while (findRound < totalRound) {
			
			for (var partIndex =0; partIndex < parts.length; partIndex++) {
				
				var partString = parts[partIndex];
				
				if (partString.match(/<xsl:for-each(\ +[^>]*| *)(\/>|>[\s\S]*?<\/xsl:for-each\ *>)/) != null) {
					
					var forEachContent = contentInForEach(partString);
					
					var attrString = partString.match(/\ select\ *=\ *".*?"/)[0];
					var matchString = attrString.substring(attrString.indexOf('"') +1, attrString.length -1);
					
					//Check if need to sort
					var nextForEachIndex = forEachContent.regexIndexOf(/<xsl:for-each(\ +[^>]*| *)(\/>|>[\s\S]*?<\/xsl:for-each\ *>)/);
					nextForEachIndex = nextForEachIndex < 0 ? forEachContent.length : nextForEachIndex;
					
					var contentPart = forEachContent.substring(0, nextForEachIndex);
					var sortMatchStringArray = contentPart.match(/<xsl:sort\ *select=".*?".*?\/\ *?>/);
					var sortString = "";
					if (sortMatchStringArray != null) {
						var sortTag = sortMatchStringArray[0];
						sortTag = sortTag.match(/\ select\ *=\ *".*?"/)[0];
						sortString += sortTag.substring(sortTag.indexOf('"') +1, sortTag.length -1);
					}
					
					//Check if need to filt
					var filterString = matchString.match(/\[.*\]/);
					var filterTag = "";
					var filterContent = "";
					if (filterString != null) {
						filterString = filterString[0];
						filterTag = filterString.substring(1, filterString.indexOf("=")).replace(/\ /g, "");
						filterContent = filterString.substring(filterString.indexOf("'") +1, filterString.lastIndexOf("'"));
					}
					
					html += generateHTMLString(forEachContent, matchString.replace(/\[.*\]/, ""), true, {"tag":filterTag, "content":filterContent}, sortString);
				}
				else if (partString.match(/<xsl:apply-templates(\ +[^>]*| *)(\/>|><\/xsl:apply-templates\ *>)/) != null) {
					
					var attrString = partString.match(/\ select\ *=\ *".*?"/)[0];
					var matchString = attrString.substring(attrString.indexOf('"') +1, attrString.length -1);
					
					var targetTemplate = templates[matchString];
					if (targetTemplate == undefined) alert('No such template called "'+matchString+'"');
					
					html += generateHTMLString(targetTemplate, path +"/"+matchString);
				} 
				else if (partString.match(/<xsl:value-of(\ +[^>]*| *)(\/>|><\/xsl:value-of\ *>)/) != null) {
					
					var attrString = partString.match(/\ select\ *=\ *".*?"/)[0];
					var matchString = attrString.substring(attrString.indexOf('"') +1, attrString.length -1);
					
					var newPath = ""+path;
					contentArray = xmlContentWithPath(xml, newPath);
					
					if (sortTag.length > 0) sortXMLArrayWithTag(contentArray, sortTag);
					if (filterDictionary["tag"].length > 0) contentArray = filterXMLArrayWithTag(contentArray, filterDictionary["tag"], filterDictionary["content"]);
					
					var value = "";
					if (matchString == ".") {
						
						if (contentArray.length > 0) value = contentArray[findRound];
						value = value.replace(/<\/?.*?>/g, "");
						totalRound = contentArray.length;
					}
					else {
						
						var values = xmlContentWithPath(contentArray[findRound], matchString);
						if (values.length > 0) value = values[0];
					}
					
					html += value;
					if (findAll) totalRound = contentArray.length;
				}
				else if (partString.match(/<xsl:.*(\ +[^>]*| *)(\/>|><\/xsl:.*\ *>)/) == null) {
					html += partString;
				}
			}
			findRound++;
		}
		return html;
	}
	
	
	//Methods
	function sliceTemplate(template) {
		
		var rawPart = template.splitAtIndex(/<xsl:([^>]*\ *\/\ *|[^>]*?>[\s\S]*?<\/xsl:[^>]*|[^>]*)>/g, false);
		var partArray = [];
		
		for (var i=0; i <rawPart.length; i++) {
			
			var string = rawPart[i];
			
			if (string.length <= 0) continue;
			else {
				
				var xslTag = string.match(/<xsl:([^>]*\ *\/\ *|[^>]*?>[\s\S]*?<\/xsl:[^>]*|[^>]*)>/g);
				if (xslTag != null) partArray.push(xslTag[0]);
				
				var spliteStrings = string.split(/<xsl:([^>]*\ *\/\ *|[^>]*?>[\s\S]*?<\/xsl:[^>]*|[^>]*)>/g);
				var targetString = spliteStrings[spliteStrings.length -1];
				if (targetString.length >0) partArray.push(targetString);
			}
		}
		return partArray;
	}
	
	function contentInTemplate(template) {
		
		template = template.replace(/<xsl:template[^>]*>/, "");
		template = template.replace(/<\/xsl:template[^>]*>/, "");
		template = template.replace(/<xsl:template[^>]*\/>/, "");
		return template;
	}
	
	function contentInForEach(xslt) {
		
		xslt = xslt.replace(/<xsl:for-each[^>]*>/, "");
		
		var lastFootIndex = xslt.regexLastIndexOf(/<\/xsl:for-each[^>]*>/);
		var headString = xslt.substring(0, lastFootIndex);
		var footString = xslt.substring(lastFootIndex, xslt.length);
		footString = footString.replace(/<\/xsl:for-each[^>]*>/, "");
		
		return headString + footString;
	}
	
	function xmlContentWithPath(xmlContent, path) {
		
		var pathTags = path.split("/");
		var resultArray = [];
		
		if (pathTags.length > 1) {
			
			var regex = new RegExp('<'+pathTags[0]+'[^>]*>[\\s\\S]*?</'+pathTags[0]+'>', "g");
			var contents = xmlContent.match(regex);
			
			var newPath = "";
			for (tagIndex =1; tagIndex < pathTags.length; tagIndex++) {
			
				var tagString = pathTags[tagIndex];
				
				if (tagIndex > 1) newPath += "/";
				newPath += tagString;
			}
			
			for (var matchIndex =0; matchIndex < contents.length; matchIndex++) {
				
				resultArray = resultArray.concat(xmlContentWithPath(contents[matchIndex], newPath));
			}
		}
		else {
			
			var regex = new RegExp('<'+path+'[^>]*>[\\s\\S]*?</'+path+'>', "g");
			var contents = xmlContent.match(regex);
			
			if (contents == null) resultArray.push(xmlContent);
			else {
				for (var matchIndex =0; matchIndex < contents.length; matchIndex++) {
				
					var content = contents[matchIndex];
					
					var headRegex = new RegExp('< *'+path+'( *| +[^>])>', "g");
					content = content.replace(headRegex, "");
					
					var footRegex = new RegExp('< */ *'+path+'( *| +[^>])>', "g");
					content = content.replace(footRegex, "");
					
					resultArray.push(content);
				}
			}
		}
		return resultArray;
	}
	
	
	//XML
	function tagStringInXML(xmlString) {
		
		var matchString = "";
		matchString += xmlString.match(/<\ *[^\ ]*(\ |>)/);
		matchString = matchString.substring(0, matchString.length -1);
		matchString = matchString.replace(/\ /g, "");
		matchString = matchString.replace(/</g, "");
		
		return  matchString;
	}
	
	function tagContentInXML(xmlString, tagName) {

		xmlString = getXMLStringOfTag(xmlString, tagName);
		var headTagReg = new RegExp("<\\ *"+tagName+"(\\ +[^>]*>|>)");
		var closeTagReg = new RegExp("<\/\\ *"+tagName+".*>");
		
		var resultString =  xmlString.replace(headTagReg, "").replace(closeTagReg, "");
		return resultString;
	}
	
	function getXMLStringOfTag(sourceString, tagName) {

		sourceString = stringFromHTMLString(sourceString);
		
		var fullTagReg = new RegExp("<\\ *"+tagName+"(\\ +.*>|>).*?<\/\\ *"+tagName+".*>", "i");
		var matchStrings = sourceString.match(fullTagReg);
		
		var string = "";
		if(matchStrings != null) {
			string += matchStrings[0];
		}
		return string;
	}
	
	function sortXMLArrayWithTag(xmlArray, tagName) {
		
		return xmlArray.sort(compare);
		
		function compare(a,b) {
		
			var aContent = tagContentInXML(a, tagName);
			var bContent = tagContentInXML(b, tagName);
	
			if (aContent < bContent) return -1;
			if (aContent > bContent)return 1;
			return 0;
		}
	}
	
	function filterXMLArrayWithTag(xmlArray, tagName, matchString) {
		
		if (tagName.length <= 0) return xmlArray;
		
		var resultArray = [];
		for (var i =0; i < xmlArray.length; i++) {
		
			var xmlString = xmlArray[i];
			if(tagContentInXML(xmlString, tagName) == matchString) {
				
				resultArray.push(xmlString);
			}
		}
		return resultArray;
	}
}



//String Edit
String.prototype.insert = function (index, string) {
  if (index == this.length) {
	  return this + string;
  }
  else if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};

String.prototype.splitAtIndex = function (regx, findReverse) {
	
	var string = this;
	var subStringArray = [];
	if (findReverse == undefined) findReverse = true;
	
	if (findReverse) {
		while (string.regexLastIndexOf(regx) >= 0) {
			
			var index = string.regexLastIndexOf(regx);
			var subString = string.substring(index, string.length);
			subStringArray.push(subString);
			
			string = string.substring(0, index);
		}
		
		if (string.length > 0) {
			subStringArray.push(string.substring(0, string.length));
		}
		else if (this.length != 0) {
			
			subStringArray.push("");
		}
		return subStringArray.reverse();
	}
	else {
		
		var matchStrings = string.match(regx);
		var matchIndex = -1;
		
		while (string.regexIndexOf(regx) >= 0) {
			
			var index = string.regexIndexOf(regx);
			var subString = string.substring(0, index);
			if (matchIndex >= 0) subString = matchStrings[matchIndex] +subString;
			
			subStringArray.push(subString);
			
			matchIndex ++;
			var matchString = matchStrings[matchIndex];
			string = string.substring(index +matchString.length, string.length);
		}
		
		if (matchIndex < 0) {
			subStringArray.push(this+"");
		}
		else {
			string = matchStrings[matchIndex] +string;
			if (string.length > 0) {
				subStringArray.push(string.substring(0, string.length));
			}
		}
		return subStringArray;
	}
}

String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

String.prototype.regexLastIndexOf = function(regex, startpos) {
    regex = (regex.global) ? regex : new RegExp(regex.source, "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : ""));
    if(typeof (startpos) == "undefined") {
        startpos = this.length;
    } else if(startpos < 0) {
        startpos = 0;
    }
    var stringToWorkWith = this.substring(0, startpos + 1);
    var lastIndexOf = -1;
    var nextStop = 0;
    while((result = regex.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
}
