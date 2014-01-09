//
//  Created by aipeople on 14/01/01.
//  Copyright (c) 2014年 Su Xing Yu. All rights reserved.
//

var xsltAutocompleteContent = [
	"apply-templates",
	"for-each",
	"sort",
	"value-of",
	"template"
	];

var isContentSelected = false;

$(window).ready(function() {
			
	//Init Segment Control
	$(".segmentControl").each(function(index) {
		
		$(this).attr("selectedIndex", "0").find(">a:eq(0)").addClass("selected");
		$(this).find(">a").click(function () {
			$(this).parent().find(">a").removeClass("selected");
			$(this).addClass("selected");
			
			var selectedIndex = $(this).parent(".segmentControl").find("a").index($(this));
			$(this).parent(".segmentControl").attr("selectedIndex", selectedIndex);
			if (selectedIndex == 0) {
				$(".paper").html("");
				generateNewContentLine(undefined);
				if (localStorage.xmlData == undefined) localStorage.xmlData = "";
				inputValue(localStorage.xmlData);
				moveCaretToElement($(".paper .contentLine:first-child"));
				setCaretOffset(0);
			}
			else {
				$(".paper").html("");
				generateNewContentLine(undefined);
				if (localStorage.xsltData == undefined) localStorage.xsltData = "";
				inputValue(localStorage.xsltData);
				moveCaretToElement($(".paper .contentLine:first-child"));
				setCaretOffset(0);
				
			}
		});
	});
	
	//Setup Paper
	$(".paper").click(function(){
		if (isUserSelected()) {
		
		}
		else {
			$(this).find("#caret").focus();
		}
	});
	
	//Init Content Line
	generateNewContentLine(undefined);
	
	//Test
	//var testXMLString = '<test><child><span class="contentColor">test</span></child></test>1';
	//testXMLString = cleanStringFromColorString(testXMLString);
	//alert(testXMLString);
	//testXMLString = htmlStringFromString(testXMLString);
	//alert(colorStringFromXMLString(testXMLString, true));
	
	
	//Recovery data
	inputValue(localStorage.xmlData);
});

function previewButton_onClick() {
	
	var xsltParser = new XSLTParser(localStorage.xmlData, localStorage.xsltData);
	
	
	var iframe = document.getElementById('htmlFrame');
	var html_string = xsltParser.htmlString();
	
	var iframedoc = iframe.document;
	if (iframe.contentDocument) 
		iframedoc = iframe.contentDocument;
	else if (iframe.contentWindow)
		iframedoc = iframe.contentWindow.document;

	if (iframedoc){
		
		iframedoc.open();
		iframedoc.writeln(html_string);
		iframedoc.close();
	} else {
		alert('Cannot inject dynamic contents into iframe.');
	}
	$('#editBoxTrigger').click();
}


// ----------------------------------
//	Handle Curser Position
// ----------------------------------

function contentLine_onClick(event) {
	
	var thisLine = $(event.target);
	while (thisLine.hasClass("contentLine") == false) {
		thisLine = thisLine.parent();
	}
	
	var mousePositionX = event.pageX - thisLine.offset().left
	var content = contentStringInLine(thisLine);
	
	if (isUserSelected()) {
		
	}
	else {
		var totalContentWidth = getStringWidth(content, -1);
		if (mousePositionX > totalContentWidth) {
			
			moveCaretToElement(thisLine);
			setCaretOffset(-1);
		}
		else {
			
			var index = 1;
			var positionX = getStringWidth(content, index);
			while (positionX < mousePositionX) {	
				index ++;
				positionX = getStringWidth(content, index);
			}
			
			var lastPositionX = getStringWidth(content, index -1);
			if (mousePositionX -lastPositionX < positionX -mousePositionX) {
				index -= 1;
			}
			
			moveCaretToElement(thisLine);
			setCaretOffset(index);
		}
	}
}

function getStringWidth(string, index) {

	index = index < 0 ? string.length : index;
	var subString = string.substring(0, index);
	subString = htmlStringFromString(subString);
	
	$("#Test").html(subString);
	return $("#Test").width()
}


// ----------------------------------
//	Handle Input
// ----------------------------------
var lastInputLength = 0;
var neededInput = false;
var neededDelete = false;
var isChineseCode = false;
var isShiftPressed = false;

function body_keyDown(event) {

	var code = event.keyCode || event.which;
	console.log(code);
	if (isUserSelected() && code == 8) {
			
		deleteSelectedContent();
		return false;
	}
	return true;
}

function contentLine_keyUp(event) {
	
}

function caret_keyDown(event) {

	event.stopPropagation();
	neededInput = false;
	neededDelete = false;
	isChineseCode = false;
	isShiftPressed = false;
	
	var code = event.keyCode || event.which;
	
	//console.log(code);
	
	if (code == 229) {
		isChineseCode = true;
		
		var currentLength = $("#caret").val().length;
		if (currentLength != lastInputLength) {
			lastInputLength = currentLength;
		}
		else {
			neededInput = true;
		}
	}
	
	//enter
	else if(code == 13) {
	
		var currentLine = $("#caret").parent();
		var content = contentStringInLine(currentLine);
		
		if ($("#autoComplete>a.highlight").length > 0) {
			
			insertAutoComplete();
			return false;
		}
		
	
		//Count previous line head space
		var headSpace = "";
		var headIndex = 0;
		while (content.substring(headIndex, headIndex +1) == " ") {
			headSpace += " ";
			headIndex ++;
		}
		
			
		//Generate New Line
		var offset = getCaretOffset();
		var preString = content.substring(0, offset);
		var posString = headSpace + content.substring(offset, content.length);
		
		posString = htmlStringFromString(posString);
		posString = colorStringFromXMLString(posString, true);
		generateNewContentLine($("#caret").parent().get(0));
		
		var newLine = $("#caret").parent();
		newLine.html(posString);
		moveCaretToElement(newLine);
		setCaretOffset(headIndex);
		
		preString = htmlStringFromString(preString);
		preString = colorStringFromXMLString(preString, true);
		currentLine.html(preString);
		
		return false;
	}
	
	//left
	else if(code == 37) {
		
		var caretOffset = getCaretOffset();
		var content = contentStringInLine($("#caret").parent());
		
		$("#autoComplete").remove();
		
		if (content.substring(caretOffset -4, caretOffset) == "    ") {
			setCaretOffset(caretOffset -4);
		}
		else {
			
			if (caretOffset == 0 && $("#caret").parent().attr("isroot") != "true") {
				
				moveCaretToElement($("#caret").parent().prev("div.contentLine"));
				setCaretOffset(-1);
			}
			else {
				setCaretOffset(caretOffset -1 < 0 ? 0 : caretOffset -1);		
			}
		}
	}
	
	//up
	else if(code == 38) {

		if ($("#autoComplete").length > 0) {
			
			var highLightIndex = 0;
			var elementNum = $("#autoComplete>a").length;
			$("#autoComplete>a").each(function (index) {
				
				if ($(this).hasClass("highlight")) {
					
					$(this).removeClass();
					highLightIndex = index -1 <0 ? elementNum -1 : index -1;
				}
			});
			$("#autoComplete>a:eq("+highLightIndex+")").addClass("highlight");
		}
		else if($("#caret").parent().attr("isRoot") != "true") {
			var caretOffset = getCaretOffset();
			var preElement = $("#caret").parent().prev("div.contentLine");
			preElement.focus();
			moveCaretToElement(preElement);
			setCaretOffset(caretOffset);	
		}
		return false;
	}
	
	//right
	else if(code == 39) {
		
		var caretOffset = getCaretOffset();
		var content = contentStringInLine($("#caret").parent());
		
		$("#autoComplete").remove();
		//console.log(content.length);
		if (content.substring(caretOffset, caretOffset +4) == "    ") {
			setCaretOffset(caretOffset +4);
		}
		else {
		
			if (caretOffset >= content.length) {
				var nextElement = $("#caret").parent().next("div.contentLine");
				if (nextElement.html() != undefined) {
				 
					moveCaretToElement(nextElement);
					setCaretOffset(0);
				}
				else setCaretOffset(caretOffset +1);
			}
			else setCaretOffset(caretOffset +1);
		}
		return false
	}
	
	//down
	else if(code == 40) {
	
		if ($("#autoComplete").length > 0) {
			
			var highLightIndex = 0;
			var elementNum = $("#autoComplete>a").length;
			$("#autoComplete>a").each(function (index) {
				
				if ($(this).hasClass("highlight")) {
					
					$(this).removeClass();
					highLightIndex = index +1 >= elementNum ? 0 : index +1;
				}
			});
			$("#autoComplete>a:eq("+highLightIndex+")").addClass("highlight");
		}
		else {
			var nextElement = $("#caret").parent().next("div.contentLine");
			if (nextElement.hasClass("contentLine")) {
				
				var caretOffset = getCaretOffset();
				moveCaretToElement(nextElement);
				setCaretOffset(caretOffset);
			}
		}
	}
	
	//delete
	else if(code == 8) {
	
		var content = contentStringInLine($("#caret").parent());
		
		var offset = getCaretOffset();
		var length = content.length;
		if (length <=0) {
			
			if ($("#caret").parent().attr("isRoot") != "true") {
				var preElement = $("#caret").parent().prev("div.contentLine");
				$("#caret").parent().remove();
				
				moveCaretToElement(preElement);
				setCaretOffset(-1);
				
				return false;
			}
		}
		else if (offset == 0) {
		
			var preElement = $("#caret").parent().prev("div.contentLine");
			
			var oldContent = contentStringInLine($("#caret").parent());
			var newContent = contentStringInLine(preElement);
			$("#caret").parent().remove();
			
			var content = newContent + oldContent;
			content = htmlStringFromString(content);
			content = colorStringFromXMLString(content, true);
			preElement.html(content);
			moveCaretToElement(preElement);
			setCaretOffset(newContent.length);
		}
		else {
			
			if (content.substring(offset -4, offset) == "    ") {
				
				for (var i =0; i<4; i++) {
					deleteValue();
				}
			}
			else deleteValue();
			neededDelete = true;
		}
	}
	
	//tab
	else if(code == 9) {
		
		neededInput = true;
		return false;
	}
	
	else {
		neededInput = true;
	}
}

function caret_keyUp(event) {
	
	var code = event.keyCode || event.which;

	if (neededInput) {
	
		if (isChineseCode) {
			
			if(code == 13) {
				inputValue();
			}
		}
		else if (code == 32 && lastInputLength > 0) {
			
		}
		else if (code == 9) {
			inputValue("    ");
		}
		else {
			inputValue();
		}
	}
	if (neededDelete) {
		//deleteValue();
	}
	resizeCaret();
	
}

function inputValue(value) {

	var string = contentStringInLine($("#caret").parent());
	var offset = getCaretOffset();
	var newString = "";
	
	if (value) newString = value;
	else newString = $("#caret").val();
	
	var prevString = string.substring(0, offset);
	var postString = string.substring(offset, string.length);
	
	var contentArray = newString.replace(/\t/g, "    ").replace(/\r/g, "").split("\n");
	var lastContentLine = $("#caret").parent();
	var content = "";
	
	//console.log(newString);
	if (isUserSelected()) {
		deleteSelectedContent();
	}
	for (var index =0; index <contentArray.length; index++) {
		
		var contentPartString = contentArray[index];
		
		if(index == 0) {
			
			content = prevString + contentArray[index];
			offset = content.length;
			if (contentArray.length == 1) content += postString;
		}
		else if(index == contentArray.length -1) {
			
			content = contentArray[index] + postString;
			generateNewContentLine(lastContentLine);
			lastContentLine = $("#caret").parent();
			offset = contentArray[index].length;
		}
		else {
			
			content = contentArray[index];
			generateNewContentLine(lastContentLine);
			lastContentLine = $("#caret").parent();
			offset = -1;
		}
	
		content = htmlStringFromString(content);
		content = colorStringFromXMLString(content, false);
		lastContentLine.html(content);	
	}
	moveCaretToElement(lastContentLine)
	
	setCaretOffset(offset);
	lastInputLength = 0;
	
	renewAutoComplete();
	saveData();
}

function deleteValue() {
	
	var string = $("#caret").parent().html();
	var caretString = string.match(/<textarea\ .*id="caret".*><\/textarea>/g)[0];
	string = string.replace(/<textarea\ .*id="caret".*><\/textarea>/g, "");
	string = string.replace(/<div\ .*id="autoComplete".*>.*<\/div>/g, "");
	string = cleanStringFromColorString(string);
	string = stringFromHTMLString(string);

	var offset = getCaretOffset();
	string = string.substring(0, offset -1) + string.substring(offset, string.length);
	string = htmlStringFromString(string);
	string = colorStringFromXMLString(string, true);
	
	
	$("#caret").parent().html(string + caretString);
	$("#caret").val("").focus();
	setCaretOffset(offset -1);
	lastInputLength = 0;
	
	renewAutoComplete();
	saveData();
}

function resizeCaret() {
	
	var width = getStringWidth($("#caret").val(), -1);
	width = width < 1 ? 1 : width;
	$("#caret").css("width",width);
}

function saveData() {
	
	//Get Data
	var data = "";
	$(".paper .contentLine").each(function(index) {
		
		if (index == 0) {
			data += contentStringInLine($(this));
		}
		else {
			data += "\n" + contentStringInLine($(this));
		}
	});
	
	var selectedIndex = $(".segmentControl").attr("selectedIndex");
	if (parseInt(selectedIndex) == 0) {
		
		localStorage.xmlData = data;
	}
	else {
		
		localStorage.xsltData = data;
	}
}

function renewAutoComplete() {
	
	$("#autoComplete").remove();
	
	var autoCpltHtml = "";
	var string = contentStringInLine($("#caret").parent());
	string = string.substring(0, getCaretOffset());
	
	var lastColonIndex = string.lastIndexOf("xsl:");
	if (lastColonIndex > 0) {
		string = string.substring(lastColonIndex +4, string.length);
		var spaceIndex = string.indexOf(" ");
		if (spaceIndex < 0) {
			
			autoCpltHtml = xsl_autoCompleteHtmlWithContent(string) ;
		}
	}
	
	
		
	$("#caret").after(autoCpltHtml);
	$("#autoComplete").css(
		{"left" : $("#caret").css("left")},
		{"top" : $("#caret").parent().height}
		);
}

function xsl_autoCompleteHtmlWithContent(string) {
	
	string = string.toLowerCase();
	
	var htmlString = "";
	for (var i =0; i <xsltAutocompleteContent.length; i++) {
		
		var xslString = xsltAutocompleteContent[i];
		
		if (xslString.indexOf(string) >= 0) {
			
			if (htmlString.length == 0) {
				htmlString += '<div id="autoComplete" style="width:200px; position:absolute;">';
			}
			htmlString += '<a>'+xslString+'</a>';
		}
		else if (string.length == 0) {
		
			if (htmlString.length == 0) {
				htmlString += '<div id="autoComplete" style="width:200px; position:absolute;">';
			}
			htmlString += '<a>'+xslString+'</a>';
		}
	}
	if (htmlString.length > 0) {
		htmlString += '</div>';
	}
	return htmlString;
}

function insertAutoComplete() {
	
	var targetLine = $("#caret").parent();
	var string = contentStringInLine(targetLine);
	var firstPart = string.substring(0, getCaretOffset());
	var lastPart = string.substring(getCaretOffset(), string.length);
	
	var selectedString = $("#autoComplete >a.highlight").html();
	
	var lastColonIndex = string.lastIndexOf("xsl:");
	if (lastColonIndex > 0) {
		
		firstPart = firstPart.substring(0, lastColonIndex +4);
		firstPart += selectedString;
		string = firstPart +lastPart;
	}
	
	$("#caret").parent().html(colorStringFromXMLString(string, false));
	moveCaretToElement(targetLine);
	setCaretOffset(firstPart.length);
	
	saveData();
}


// ----------------------------------
// Handle Selection
// ----------------------------------

function deleteSelectedContent() {
	
	numberContentLine ();
	
	var selectedHtml = getSelectionHtml();
	$("#SelectTemp").html(selectedHtml);
	
	var selection  = window.getSelection().getRangeAt(0);
	var nodeName = selection.commonAncestorContainer.nodeName;
	
	if(nodeName == "DIV") {
	
		var parentDIV = $(selection.commonAncestorContainer);
		
		if (parentDIV.hasClass("paper")) {
			
			var paper = $(selection.commonAncestorContainer);
			var startOffset = selection.startOffset;
			
			//Remove Content
			var firstLine;
			var firstPartContent = "";
			var lastPartContent = "";
			
			var targetLineNum = $("#SelectTemp>div.contentLine").length;
			var firstSpanID, firstLineID;
			var removeLineArray = [];
			$("#SelectTemp>div.contentLine").each(function(index) {
				
				var lineIndex = $(this).attr("lineIndex");
				var targetLine = paper.children('div.contentLine:eq('+lineIndex+')');
				
				if (index == 0) {
				
					firstLine = targetLine;
					
					var selectionStartSpanID = $(this).find("span:eq(0)").attr("spanID");
					selectionStartSpanID = parseInt(selectionStartSpanID);
					targetLine.children("span").each(function(spanIndex) {
						
						if (spanIndex < selectionStartSpanID) {
							firstPartContent += stringFromHTMLString( $(this).html() );
						}
						else if (spanIndex == selectionStartSpanID) {
							var content = stringFromHTMLString($(this).html());
							firstPartContent += content.substring(0, selection.startOffset);
						}
					});
				}
				else if (index == targetLineNum -1) {
				
					var lastSpan = $(this).find("span:last-child");
					
					if (lastSpan.length <= 0) {
						lastPartContent = contentStringInLine(targetLine)
					}
					else {
						var selectionStartSpanID = lastSpan.attr("spanID");
						selectionStartSpanID = parseInt(selectionStartSpanID);
						targetLine.children("span").each(function(spanIndex) {
							
							if (spanIndex > selectionStartSpanID) {
								lastPartContent += stringFromHTMLString( $(this).html() );
							}
							else if (spanIndex == selectionStartSpanID) {
							
								var content = stringFromHTMLString($(this).html());
								lastPartContent += content.substring(selection.endOffset, content.length);
							}
						});	
					}
					removeLineArray.push(targetLine);
				}
				else {
					removeLineArray.push(targetLine);
				}
			});
			
			//Remove Line
			for(var index =0; index < removeLineArray.length; index++) {
				var line =removeLineArray[index];
				line.remove();
			}
			
			//Renew first line content
			var newContent = colorStringFromXMLString(firstPartContent + lastPartContent, false);
			firstLine.html(newContent);
			
			//Set Caret position
			moveCaretToElement(firstLine);
			setCaretOffset(firstPartContent.length);
			
		}
		else if (parentDIV.hasClass("contentLine")) {
		
			var startOffset = selection.startOffset;
			
			//Remove content
			var targetSpanNum = $("#SelectTemp>span").length;
			var firstSpanID;
			var removeSpanArray = [];
			$("#SelectTemp span").each(function(index) {
				
				var spanIndex  = $(this).attr("spanID");
				var targetSpan = parentDIV.children('span:eq('+spanIndex+')');
				
				if (targetSpanNum == 1) {
					
					var spanContent = targetSpan.html();
					spanContent = stringFromHTMLString(spanContent);
					var firstPart = spanContent.substring(0, selection.startOffset);
					var lastPart = spanContent.substring(selection.endOffset, spanContent.length);
					spanContent = htmlStringFromString(spanContent);
					
					targetSpan.html(spanContent);
				}
				else if (index == 0) {
				
					var spanContent = targetSpan.html();
					
					spanContent = stringFromHTMLString(spanContent);
					spanContent = spanContent.substring(0, selection.startOffset);
					spanContent = htmlStringFromString(spanContent);
					
					targetSpan.html(spanContent);
					firstSpanID = parseInt(spanIndex);
				}
				else if (index == targetSpanNum -1) {
					
					var spanContent = targetSpan.html();
					spanContent = stringFromHTMLString(spanContent);
					spanContent = spanContent.substring(selection.endOffset, spanContent.length);
					spanContent = htmlStringFromString(spanContent);
					
					targetSpan.html(spanContent);
				}
				else {
					removeSpanArray.push(targetSpan);
				}
			});
			
			//Remove Line
			for(var index =0; index < removeSpanArray.length; index++) {
				var span =removeSpanArray[index];
				span.remove();
			}
			
			//Set Caret Position
			var offset = 0;
			var targetSpanIndex = firstSpanID;
			
			parentDIV.find('span').each(function (index) {
	
				if (index == targetSpanIndex) {
					
					offset += startOffset;
				}
				else if (index < targetSpanIndex) {
					
					var content = $(this).html();
					content = stringFromHTMLString(content);
					offset += content.length;	
				}
				else {
					
				}
			});
			renewContentLineColor(parentDIV);
			setCaretOffset(offset);
			$("#caret").focus();
			$("#SelectTemp").remove();
		}
	}
	else if(nodeName == "SPAN") {
		
	}
	else if(nodeName == "#text") {
		
		var parentSpan = $(selection.commonAncestorContainer.parentNode);
		var spanHtml = parentSpan.html();
		var startOffset = selection.startOffset;
		spanHtml = stringFromHTMLString(spanHtml);
		
		var newHtml = spanHtml.substring(0, selection.startOffset) + spanHtml.substring(selection.endOffset, spanHtml.length);
		parentSpan.html(htmlStringFromString(newHtml));
		
		//Set Caret Position
		var offset = 0;
		var targetSpanIndex = parseInt(parentSpan.attr("spanID"));
		parentSpan.parent().children('span').each(function (index) {

			if (index == targetSpanIndex) {
				
				offset += startOffset;
			}
			else if (index < targetSpanIndex) {
				
				var content = $(this).html();
				content = stringFromHTMLString(content);
				offset += content.length;	
			}
			else {
				
			}
		});
		renewContentLineColor(parentSpan.parent());
		setCaretOffset(offset);
		$("#caret").focus();
	}
	saveData();
}

function printObject(o) {
  var out = '';
  for (var p in o) {
    out += p + ': ' + o[p] + '\n';
  }
  alert(out);
}

//Get Selection Content

function isUserSelected() {
	
	var selection = window.getSelection();
	var selectionString = selection.toString()
	return selectionString.length > 0 ? true : false;
}

function getSelectionHtml() {

    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}

function numberContentLine () {
	
	var index = 0;
	$(".paper .contentLine").each(function () {
		
		var spanIndex = 0;
		$(this).attr("lineIndex", index);
		$(this).find("span").each(function() {
			$(this).attr("spanID", spanIndex);
			spanIndex++;
		});
		index++;
	});
}


// ----------------------------------
// Handle Copy & Paste
// ----------------------------------

var isCopyEvent = false;
var isPasteEvent = false;

function contentLine_onBeforeCopy(event) {
	
	if (isPasteEvent) isPasteEvent = false;
	else isCopyEvent = true;
}

function contentLine_onBeforePaste(event) {
	
	isPasteEvent = true;
	
	if (isUserSelected()) {
	
		if (isCopyEvent) {
			isCopyEvent = false;
			return false;
		}
		else {
			deleteSelectedContent();
			return true;
		}
	}
	return false;
}


// ----------------------------------
//	Draw Color
// ----------------------------------

function renewContentLineColor(contentLine) {
	
	var content = contentStringInLine(contentLine);
	content = htmlStringFromString(content);
	content = colorStringFromXMLString(content, false);
	
	var caretString = contentLine.html().match(/<textarea\ .*id="caret".*><\/textarea>/g);
	if (caretString == null) caretString = "";
	
	contentLine.html(content + caretString);
	if (caretString.length <= 0) {
		moveCaretToElement(contentLine);
		setCaretOffset(-1);
	}
}

//Formet String
function contentStringInLine(contentLine) {
	
	var content = contentLine.html();
	content = content.replace(/<textarea\ .*id="caret".*><\/textarea>/g, "");
	content = content.replace(/<div\ .*id="autoComplete".*>.*<\/div>/g, "");
	if (content == undefined) return content;
	
	content = cleanStringFromColorString(content);
	content = stringFromHTMLString(content);
	
	return content;
}

function cleanStringFromColorString(string) {
	
	return string.replace(/<\/?span[^>^<]*>/g, "");
}

function stringFromHTMLString(string) {
	
	return string.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

function htmlStringFromString(string) {
	
	return string.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\ /g, "&nbsp;");
}

//Draw String
function colorStringFromXMLString(sourceString, isRoot) {

	sourceString = htmlStringFromString(sourceString);
	var colorString = "";
	
	var commentArray = sourceString.split("&lt;!--");
	
	for (var index =0; index <commentArray.length; index++) {
	
		var string = commentArray[index];
		if (string.length <= 0 && index == 0) continue;
		
		//Draw Color
		var commentEndIndex = string.lastIndexOf("--&gt;");
		if (commentEndIndex > 0) {
			
			var commentString = string.substring(0, commentEndIndex +6);
			var xmlString = string.substring(commentEndIndex +6, string.length);
			var prefix = index == 0 ? "" : "&lt;!--";
			colorString += '<span class="commentColor">' + prefix + commentString + '</span>' + drawContentString(xmlString);
		}
		else {
			if (index == 0) colorString += drawContentString(string);
			else {
				colorString += '<span class="commentColor">' + "&lt;!--" + string + '</span>';
			}
		}
	}
	
	return colorString;
	
	
	/*
	var tagHead = getXMLTagName(string);
	//alert(tagHead);
	if (tagHead.length > 0) {
		
		var xmlString = getXMLStringOfTag(string, tagHead);
		var content = getXMLContent(xmlString, tagHead);
		//alert(xmlString + ", "+ content);
		if (xmlString.length > 0) {
			var newXmlString = xmlString.replace(content, colorStringFromXMLString(content, false));
			string = string.replace(xmlString, newXmlString);
			return string;
		}
		else {
			return string;//.replace(content, colorStringFromXMLString(content, false));
		}	
	}
	else {
		if (isRoot) {
			return string;
		}
		else {
			return '<span class="contentColor">' +  string + '</span>';	
		}
	}
	*/
}

function drawContentString(string) {
	
	var selectedIndex = $(".segmentControl").attr("selectedIndex");
	
	if (parseInt(selectedIndex) == 0) {
		
		return drawXMLContentString(string);
	}
	else {
		return drawXSLTContentString(string);
	}
}

function drawXMLContentString(string) {
	
	var tagArray = string.splitAtIndex(/&lt;/);
	var resultString = "";
	
	for (var index =0; index <tagArray.length; index++) {
		
		var tagString = tagArray[index];
		if (tagString.length <= 0 && index == 0) continue;
		
		//Draw Content Color
		var lastGTIndex = tagString.lastIndexOf("&gt;");
		if (lastGTIndex > 0 && 
			lastGTIndex < tagString.length -4 &&
			tagString.substring(1, 2) != "/") {
			
			var preString = tagString.substring(0, lastGTIndex +4);
			resultString += '<span>' + drawAttritubeString(preString) + '</span>' + '<span class="contentColor">' + tagString.substring(lastGTIndex +4, tagString.lenght) + '</span>';
		}
		else {
			if (index == 0) resultString += '<span class="contentColor">' + tagString + '</span>';
			else resultString += '<span>'+ drawAttritubeString(tagString) + '</span>';
		}
	}
	return cleanEmptyColorTag(resultString);
}

function drawXSLTContentString(string) {
	
	var tagArray = string.splitAtIndex(/&lt;\/?xsl:/);
	var resultString = "";
	
	for (var index =0; index <tagArray.length; index++) {
		
		var tagString = tagArray[index];
		if (tagString.length <= 0 && index == 0) continue;
		
		//Draw Content Color
		var lastGTIndex = tagString.indexOf("&gt;");
		if (lastGTIndex > 0 && 
			lastGTIndex < tagString.length -4 &&
			tagString.substring(1, 2) != "/" &&
			tagString.regexIndexOf(/&lt;\/?xsl:/) >= 0) {
			
			var preString = tagString.substring(0, lastGTIndex +4);
			resultString += '<span>' + drawAttritubeString(preString) + '</span>' + '<span class="contentColor">' + tagString.substring(lastGTIndex +4, tagString.lenght) + '</span>';
		}
		else {
			if (index == 0) resultString += '<span class="contentColor">' + tagString + '</span>';
			else resultString += '<span>' + drawAttritubeString(tagString) + '</span>';
		}
	}
	//return cleanEmptyColorTag(resultString);
	return resultString;
}

function drawAttritubeString(string) {

	var firstSpaceIndex = string.indexOf("&nbsp;");
	var hasAttr = false;
	if (firstSpaceIndex > 0 && firstSpaceIndex < string.length -6) hasAttr = true;

	var attrIndexArray = [];
	var regex = /"/gi;
	var matchString = "";
	while ( (matchString = regex.exec(string)) ) {
    	attrIndexArray.push(matchString.index);
	}
	
	var fixIndex = 0;
	if (hasAttr) {
		string = string.insert(firstSpaceIndex +6, '</span><span class="attrColor">');
		fixIndex += 7 +24;
	}
	
	for (var index =0; index <attrIndexArray.length; index++) {
		
		var targetIndex = attrIndexArray[index];
		if (index%2 == 0) {
			
			var attrCloseSpan = '';
			if (hasAttr) {
				attrCloseSpan = '</span>';
				hasAttr = false;
			}
			
			string = string.insert(targetIndex +fixIndex, attrCloseSpan +'<span class="attrStringColor">');
			fixIndex += (attrCloseSpan.length + 30);
		}
		else {
			string = string.insert(targetIndex +fixIndex +1, '</span><span class="attrColor">');
			fixIndex += 7 +24;
			hasAttr = true;
		}
	}
	
	var endSymbolIndex = string.lastIndexOf("&gt;");
	var endFixIndex = 0;
	var posFix = "";
	if (endSymbolIndex == string.length -4) {
	
		if (string.substring(endSymbolIndex -1, endSymbolIndex) == "/") {
			endFixIndex = -5;
		}
		else {
			endFixIndex = -4;
		}
		posFix = '<span>';
	}
	
	if (attrIndexArray.length % 2 == 1) {
		
		string = string.insert(string.length +endFixIndex, '</span>' + posFix);
	}
	if (hasAttr) string = string.insert(string.length +endFixIndex, '</span>' + posFix);
	
	return string;
}

function cleanEmptyColorTag(string) {
	
	return string.replace(/<[^\/^>]*><\/[^\/^>]*>/g, "");
}

//Extract String
function getXMLTagName(xmlString) {

	xmlString = stringFromHTMLString(xmlString);
	
	var firstTagReg = new RegExp("<\\ *\\w+(\\ |>)", 'i');
	if (firstTagReg.test(xmlString)) {
		var resultString = xmlString.match(firstTagReg)[0].replace(/\ */g, "").replace(/</g, "").replace(/>/g, "");
		return htmlStringFromString(resultString);
	}
	else {
		return "";
	}
}

function getXMLStringOfTag(sourceString, tagName) {

	sourceString = stringFromHTMLString(sourceString);
	
	var fullTagReg = new RegExp("<\\ *"+tagName+"(\\ +.*>|>).*<\/\\ *"+tagName+".*>", "i");
	if (fullTagReg.test(sourceString)) {
		
		return htmlStringFromString(sourceString.match(fullTagReg)[0]);
	}
	else {
		return "";
	}
}

function getXMLContent(xmlString, tagName) {

	xmlString = getXMLStringOfTag(xmlString, tagName);
	xmlString = stringFromHTMLString(xmlString);
	var headTagReg = new RegExp("<\\ *"+tagName+"(\\ +[^>]*>|>)");
	var closeTagReg = new RegExp("<\/\\ *"+tagName+".*>");
	
	var resultString =  xmlString.replace(headTagReg, "").replace(closeTagReg, "");
	return htmlStringFromString(resultString);
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

String.prototype.splitAtIndex = function (regx) {
	
	var string = this;
	var subStringArray = [];
	
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



// ----------------------------------
//	Caret
// ----------------------------------

//Caret Location

function setCursorToEnd(ele) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(ele.get(0), 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    ele.focus();
}
 
function setCursorToIndex(ele, targetIndex) {
	
	if (ele.get(0).firstChild == null) return;
	targetIndex = ele.get(0).firstChild.length < targetIndex ? ele.get(0).firstChild.length : targetIndex;
	
	var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(ele.get(0).firstChild, targetIndex);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}


//New Content Line

function generateNewContentLine(previousLineTarget) {
	
	var htmlString = '<div class="contentLine"></div>'
	var target = 0;
	if(previousLineTarget == undefined) {
		$(".paper").append(htmlString);
		target = $(".paper>div.contentLine").eq(0);
		target.attr("isRoot","true");
	}
	else {
		$(previousLineTarget).after(htmlString);
		target = $(previousLineTarget).next("div.contentLine");
	}
	target.attr({
		"onmouseup":"contentLine_onClick(event)",
		"onkeydown":"return body_keyDown(event)",
		"onbeforepaste":"contentLine_onBeforePaste(event);",
		"onbeforecopy":"contentLine_onBeforeCopy(event);"
		}).html("");
	moveCaretToElement(target);
}

function moveCaretToElement(targetElement) {
	
	$("#caret").remove();
	targetElement.append('<textarea contenteditable="" id="caret" class="contentCaret" offset="0" onkeydown="return caret_keyDown(event)" onkeyup="return caret_keyUp(event)"></textarea>')
	$("#caret").focus();
}

function setCaretOffset(offset) {
	
	string = contentStringInLine($("#caret").parent());
	
	offset = offset > string.length ? string.length : offset;
	if (offset < 0) offset = string.length;
	
	$("#caret").css("left", getStringWidth(string, offset)).attr("offset", offset);
}

function getCaretOffset() {
	
	var offsetString = $("#caret").attr("offset");
	return parseInt(offsetString);
}





