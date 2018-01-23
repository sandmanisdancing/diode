/**
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

'use strict';

// This gulpfile makes use of new JavaScript features.
// Babel handles this without us having to do anything. It just works.
// You can read more about the new JavaScript features here:
// https://babeljs.io/docs/learn-es2015/

const fs = require('fs'),
      path = require('path'),
      gulp = require('gulp'),
      del = require('del'),
      runSequence = require('run-sequence'),
      bs = require('browser-sync'),
      gulpLoadPlugins = require('gulp-load-plugins'),
      pkg = require('./package.json'),

      autoprefixer = require('autoprefixer'),
      cssimport = require('postcss-import'),
      cssvars = require('postcss-custom-properties'),

      $ = gulpLoadPlugins(),
      browserSync = bs.create(),
      reload = browserSync.reload;


// Copy images
gulp.task('copy-images', () =>
  gulp.src([
    'app/images/**/*'
  ], {
    dot: true
  }).pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'copy-images'}))
);

// Compile and automatically prefix stylesheets
gulp.task('styles', () => {
  var plugins = [
    cssimport,
    autoprefixer({browsers: ['> 1%'], cascade: false}),
    cssvars({
      preserve: true
    })
  ];

  return gulp.src([
    'app/styles/main.css'
  ])
    .pipe($.postcss(plugins))
    .on('error', handleError)
    .pipe($.if('*.css', $.cssnano({
      discardUnused: false
    })))
    .pipe($.size({title: 'styles'}))
    .pipe(gulp.dest('dist/styles'))
    .pipe(browserSync.stream({match: "**/*.css"}));
});

function handleError (error) {
  console.log(error.toString());
  this.emit('end');
}

// Concatenate and minify JavaScript. Optionally transpiles ES2015 code to ES5.
// to enables ES2015 support remove the line `"only": "gulpfile.babel.js",` in the
// `.babelrc` file.
var scriptsArray = [
  './app/scripts/main.js'
];

// Copy scripts
gulp.task('copy-scripts', () => {
  gulp.src([
    './app/scripts/*'
  ])
  .pipe($.size({title: 'copyScripts'}))
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('dist/scripts'))
}
);

// Concatenate & transpile all scripts
gulp.task('scripts', () => {
  gulp.src(scriptsArray)
  .pipe($.concat('main.js'))
  .pipe($.babel({
    presets: [
      ["es2015", {
        "targets": {
          "browsers": ["IE >= 9"]
        }
      }]
    ]
  }))
  .pipe($.size({title: 'copyScripts'}))
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('dist/scripts'))
}
);

// Concatenate, transpile & minify all scripts
gulp.task('scripts-prod', ['copy-scripts'], () => {
  gulp.src(scriptsArrayProd)
  .pipe($.babel())
  .on('error', handleError)
  .pipe($.concat('main.js'))
  .pipe($.uglify({preserveComments: 'some'}).on('error', function (uglify) {
    console.error(uglify.message);
    this.emit('end');
  }))
  .pipe($.size({title: 'scriptsProd'}))
  .pipe($.sourcemaps.write('.'))
  .pipe(gulp.dest('dist/scripts'))
}
);

// Scan your HTML for assets & optimize them
gulp.task('html', () => {
  return gulp.src('app/**/*.html')
    .pipe($.useref({
      searchPath: '{.tmp,app}',
      noAssets: true,
    }))
    // Output files
    .pipe($.if('*.html', $.size({title: 'html', showFiles: true})))
    .pipe(gulp.dest('dist'));
});

// Clean output directory
gulp.task('clean', cb => del(['.tmp', 'dist/*', '!dist/.git'], {dot: true}));

// Watch files for changes & reload
gulp.task('serve', ['default'], () => {
  browserSync.init({
    notify: true,
    server: ['.tmp', 'dist'],
    reloadDelay: 800,
    port: 3000,
    ghostMode: false
  });

  gulp.watch(['app/**/*.html'], ['html', reload]);
  gulp.watch(['app/styles/**/*.css'], ['styles']);
  gulp.watch(['app/scripts/**/*.js'], ['scripts', reload]);
  gulp.watch(['app/images/**/*.{jpg,png}', '!app/images/sprite/*'], ['images']);
});

// Build dev files, the default task
gulp.task('default', ['clean'], cb =>
  runSequence(
    ['html', 'scripts', 'copy-images', 'styles'],
    cb
  )
);

// Build production files, the default task
gulp.task('build', ['clean'], cb =>
  runSequence(
    ['html', 'scripts-prod', 'copy-images', 'styles'],
    cb
  )
);
