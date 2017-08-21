'use strict';

const PLUGIN_NAME = 'gulp-font-blast';

var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var path = require('path');
var extractor = require('./lib/glyph-extractor');

/**
 * Hint for the configuration from the original font-blast sources
 *
 * type UserConf = {
 *   png?: Boolean,
 *   filenames?: Object,
 *   icons?: Array<string>,
 *   cleanCharacter?: Function
 * };
 *
 * const defaultConfig: UserConf = {};
 */
var defaultConfig = {};

function gulpBlaster (userConfig) {
  var config = Object.assign({}, defaultConfig, userConfig || {});
  var stream = through.obj(function (file, enc, cb) {
    var f = path.parse(file.path);
    var self = this;

    // extract glyphs and make new file objects
    extractor(
      file.contents.toString(),
      config.filenames,
      function (characterSvgs) {
        console.info(
          'Found ' + characterSvgs.length + ' available icons in the <' + f.name + '> font'
        );
        console.info('Generating SVG content for each character...');

        var savedIcons = [];
        characterSvgs.forEach(function (char) {
          var filename = char.name ? char.name : char.code;
          // if a subset of icons set was requested, ignore any others
          // that are not within the subset
          if (
            config.icons &&
            config.icons.length &&
            config.icons.indexOf(char.code) === -1 &&
            config.icons.indexOf(filename) === -1
          ) {
            return;
          }

          savedIcons.push(char);
          var glyph = file.clone();
          glyph.path = path.join(glyph.base, filename + f.ext);
          glyph.contents = Buffer.from(String(char.svg));
          self.push(glyph);
        });
        console.info('Saved ' + savedIcons.length + ' files from the <' + f.name + '> font');

        // TODO: png images?
        // TODO: verify?
      },
      config.cleanCharacter
    );

    return cb(); // discard original file
  });

  return stream;
}

module.exports = gulpBlaster;
