XSLT-Editor-Web-Page
====================

A Web page to write XSLT with following features :

1. Text color scheme

2. Auto complete for available XSLT tags

3. Quick switching tabs

4. Quick preview of result

5. Auto saving with local storage


How to use XSLT parser
--------------------
  
  var xsltParser = new XSLTParser(xmlString, xsltString);
  
  var htmlResult = xsltParser.htmlString();
  
  
Supported XSLT Tags
--------------------

\<xsl:apply-templates />

\<xsl:for-each />

\<xsl:sort />

\<xsl:value-of />

\<xsl:template />
