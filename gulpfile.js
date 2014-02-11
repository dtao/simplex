var fs      = require('fs'),
    gulp    = require('gulp'),
    closure = require('gulp-closure-compiler'),
    rename  = require('gulp-rename');

gulp.task('compile', function() {
  gulp.src('simplex.js')
    .pipe(closure({
      externs: 'externs.js',
      warning_level: 'VERBOSE'
    }))
    .pipe(rename('simplex.min.js'))
    .pipe(gulp.dest('.'));
});
