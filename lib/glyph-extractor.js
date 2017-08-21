'use strict';

const PLUGIN_NAME = 'gulp-font-blast';

var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var util = require('util');
var xmldom = require('xmldom');
var SVGO = require('svgo');
var svgo = new SVGO({});

/**
 * Callback recieves an array of characters with the format of
 * {
 * code: 'unicode',
 * name: 'special name, if provided',
 * ref: name or code
 * svg:  'full svg content required to render'
 * path: 'just the path from the svg content'
 * }
 *
 * @param fontSvgText SVG font definition containing all characters
 * @param charNameMap
 * @param callback
 * @param processCharInfoFn A function that provides the character filename
 * Array<IconInformation>
 */
function extractCharsFromFont (fontSvgText, charNameMap, callbackFn, processCharInfoFn) {
  var doc = new xmldom.DOMParser().parseFromString(fontSvgText, 'text/xml').documentElement;
  var fontSpec = doc.getElementsByTagName('font')[0];
  var defaultCharWidth = fontSpec.getAttribute('horiz-adv-x');
  var fontFace = doc.getElementsByTagName('font-face')[0];
  var defaultCharHeight = fontFace.getAttribute('units-per-em');
  var defaultCharAscent = fontFace.getAttribute('ascent');
  var glyphs = doc.getElementsByTagName('glyph');

  /**
   * "square" fonts tend to be based at the center (like glyphicon)
   * while other fonts tend to be based around the charAscent mark
   * so when need to flip them with different adjustments
   * (defaultCharWidth == defaultCharHeight ? defaultCharHeight : defaultCharAscent),
   */
  var translateOffset = defaultCharAscent;
  var charMap = charNameMap || {};
  var cleanCharacter = processCharInfoFn || function (char) {
    return char;
  };

  var dataOnGlyphs = [];
  for (var i = 0; i < glyphs.length; i++) {
    var glyph = glyphs[i];
    // some strange fonts put empty glyphs in them
    if (!glyph) {
      continue;
    }

    var iconCode = glyph.getAttribute('unicode');
    var pathData = glyph.getAttribute('d');
    var customWidthMatch = glyph.getAttribute('horiz-adv-x');
    var contentWidth = customWidthMatch ? customWidthMatch : defaultCharWidth;

    // some glyphs matched without a unicode value so we should ignore them
    if (!iconCode) {
      continue;
    }

    if (iconCode.indexOf('&#') !== -1) {
      iconCode = iconCode.replace('&#x', '');
    }

    if (iconCode.length === 1) {
      iconCode = iconCode.charCodeAt(0).toString(16);
    }

    // skip empty-looking glyphs
    if (!iconCode.length || !pathData || pathData.length < 10) {
      continue;
    }

    var useCharacterName = charMap[iconCode] || glyph.getAttribute('glyph-name') || iconCode;

    var charInfo = {
      code: iconCode,
      name: useCharacterName,
      ref: useCharacterName || iconCode,
      path: pathData,
      svg: util.format(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d">\n\t' +
        '<g transform="scale(1,-1) translate(0 -%d)">\n\t\t' +
        '<path d="%s"/>\n\t' +
        '</g>\n' +
        '</svg>',
        contentWidth,
        defaultCharHeight,
        translateOffset,
        pathData
      )
    };
    dataOnGlyphs = dataOnGlyphs.concat(charInfo);
  }

  var glyphsData = dataOnGlyphs.map(function (charInfo) {
    var cleanSvg;
    svgo.optimize(String(charInfo.svg), function (result) {
      if (result.error) {
        throw new PluginError(PLUGIN_NAME, result.error);
      }
      cleanSvg = result.data;
    });

    var newInfo = Object.assign({}, charInfo, {
      svg: cleanSvg,
      path: cleanSvg.match(/d="(.*?)"/)[1]
    });

    if (cleanCharacter) {
      newInfo = cleanCharacter(newInfo);
    }

    return newInfo;
  });

  if (callbackFn) {
    return callbackFn(glyphsData);
  }
  return glyphsData;
}

module.exports = extractCharsFromFont;
