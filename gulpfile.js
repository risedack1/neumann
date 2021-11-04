const {
    src,
    dest,
    watch,
    parallel,
    series
} = require('gulp');

const scss = require('gulp-sass');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const del = require('del');
const svgSprite = require('gulp-svg-sprite');
const fileInclude = require('gulp-file-include');
const webp = require('gulp-webp');
const webphtml = require('gulp-webp-html');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const sourcemap = require('gulp-sourcemaps');

function htmlInclude() {
    return src('app/html/**/*.html')
        .pipe(fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(dest('app/'))
        .pipe(browserSync.stream());
}

function webpHtml() {
    return src('app/**/*.html')
        .pipe(webphtml())
        .pipe(dest('dist/'))
}

function svgSprites() {
    return src('app/images/icons/**/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../sprite.svg"
                }
            }
        }))
        .pipe(dest('app/images'))
}

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'app/'
        },
        // notofy: false
    })
}

function styles() {
    return src('app/scss/style.scss')
        .pipe(sourcemap.init())
        .pipe(scss({
            outputStyle: 'compressed'
        }))
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 10 versions'],
            grid: true
        }))
        .pipe(concat('style.min.css'))
        .pipe(sourcemap.write('.'))
        .pipe(dest('app/css'))
        .pipe(browserSync.stream())
}

function scripts() {
    return src([
            'node_modules/jquery/dist/jquery.js',
            'app/js/main.js'
        ])
        .pipe(fileInclude({
            prefix: '@'
        }))
        .pipe(concat('main.min.js'))
        .pipe(uglify())
        .pipe(dest('app/js'))
        .pipe(browserSync.stream())
}

function images() {
    return src('app/images/**/*.*')
        .pipe(webp({
            quality: 70
        }))
        .pipe(dest('dist/images'))
        .pipe(src('app/images/**/*.*'))
        .pipe(imagemin([
            imagemin.gifsicle({
                interlaced: true
            }),
            imagemin.mozjpeg({
                quality: 75,
                progressive: true
            }),
            imagemin.optipng({
                optimizationLevel: 5
            }),
            imagemin.svgo({
                plugins: [{
                        removeViewBox: true
                    },
                    {
                        cleanupIDs: false
                    }
                ]
            })
        ]))
        .pipe(dest('dist/images'))
}

// gulp fonts единожды для создания шрифтов

function fonts() {
    src('app/fonts/*.*')
        .pipe(ttf2woff())
        .pipe(dest('app/fonts'))
    // .pipe(dest('dist/fonts'))
    return src('app/fonts/*.*')
        .pipe(ttf2woff2())
        .pipe(dest('app/fonts'))
    // .pipe(dest('dist/fonts'))
}

function build() {
    return src([
            'app/*.html',
            'app/css/style.min.css',
            'app/js/main.min.js',
            'app/fonts/*.*'
        ], {
            base: 'app'
        })
        .pipe(dest('dist'))
}

function cleanDist() {
    return del(['dist', 'app/fonts/*.ttf'])
}

function watching() {
    watch(['app/scss/**/*.scss'], styles);
    watch(['app/js/**/*.js', "!app/js/main.min.js"], scripts);
    watch(['app/*.html']).on('change', browserSync.reload);
    watch('app/images/icons/**.svg', svgSprites);
    watch('app/html/**/*.html', htmlInclude);
}


exports.styles = styles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.images = images;
exports.cleanDist = cleanDist;
exports.webpHtml = webpHtml;
exports.fonts = fonts;
exports.build = series(cleanDist, images, build, webpHtml);

exports.default = parallel(styles, scripts, htmlInclude, browsersync, svgSprites, watching);