'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const jshint = require('gulp-jshint');

const readFile = require('fs').readFileSync;
const pathJoin = require('path').join;

const eslintrc = loadJson('.eslintrc');
const jshintrc = loadJson('.jshintrc');

const sources = ['**/*.js', '!node_modules/**'];

function loadJson (configFile) {
  var data = readFile(pathJoin(__dirname, configFile), 'utf-8');
  return JSON.parse(data);
}

gulp.task('eslint', function () {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(sources)
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint(eslintrc))
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});

gulp.task('jshint', function () {
  return gulp.src(sources)
    .pipe(jshint(jshintrc))
    .pipe(jshint.reporter('default'));
});

gulp.task('lint', ['eslint', 'jshint']);

gulp.task('default', ['lint']);
