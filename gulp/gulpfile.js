/**
 * TODO: custom error handling
 */

'use strict';

const
    fs = require('fs'),
    del = require('del'),
    gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    chalk = require('chalk'),
    mergeStream = require('merge-stream'),
    config = require('./config.json');

class Log {
    about() {
        console.log(' _____ _____\n|     |     |\n|  K  |  2  |  GULP\n|_____|_____|\n');
        this.printTaskInfo('build', 'production', 'cleans enviroment, compiles and compress all files');
        this.printTaskInfo('build', 'dev', 'cleans enviroment, compiles all files, runs watcher');
        this.printTaskInfo('', 'run', 'hand picket queue of methods to run');
        console.log('');
    }

    printTaskInfo(group, name, description) {
        console.log(
            chalk.bgMagenta(group + chalk.bold((group.length ? ':' : '') + name)) + chalk.dim(` - ${description}`)
        );
    }

    error(message) {
        this.print(chalk.red(message));
    }

    print(message) {
        plugins.util.log(message);
    }
}

class Tasks {
    constructor() {
        this.log = new Log();
        this.paths = {
            stylesSource: config.paths.root + config.paths.sources + config.dirs.sass,
            stylesTemp: config.paths.root + config.paths.sources + config.paths.temp + config.dirs.css,
            stylesResult: config.paths.root + config.paths.results + config.dirs.css,
            scriptsSource: config.paths.root + config.paths.sources + config.dirs.js,
            scriptsVendors: config.paths.root + config.paths.sources + config.dirs.js + config.dirs.exclude,
            scriptsTemp: config.paths.root + config.paths.sources + config.paths.temp + config.dirs.js,
            scriptsResult: config.paths.root + config.paths.results + config.dirs.js,
            imagesSource: config.paths.root + config.paths.sources + config.dirs.img,
            imagesTemp: config.paths.root + config.paths.sources + config.paths.temp + config.dirs.img,
            imagesResult: config.paths.root + config.paths.results + config.dirs.img,
            templatesSource: config.paths.root + config.paths.sources + config.dirs.twig,
            templatesTemp: config.paths.root + config.paths.sources + config.paths.temp + config.dirs.html,
            templatesResult: config.paths.root + config.paths.results + config.dirs.html,
            temp: config.paths.root + config.paths.sources + config.paths.temp,
            public: config.paths.root + config.paths.results
        };
    }

    getPath(path) {
        if (!this.paths[path]) this.log.error(`Path "${path}" does not exist, build will probably won't work`);

        return this.paths[path];
    }

    getFilename(filename) {
        if (this.production) filename = filename.replace(/.([^.]*)$/, '.min.$1');

        return filename;
    }

    conditional(condition, output, options) {
        return plugins.if(condition, condition ? output.apply(this, options ? options : null) : plugins.rename(''));
    }

    compileSass() {
        return new Promise(resolve => {
            gulp.src(this.getPath('stylesSource') + config.files.stylesSource)
            .pipe(plugins.sourcemaps.init())
            .pipe(plugins.sass())
            .pipe(plugins.autoprefixer({
                browsers: ['last 10 version', 'ie 10'],
                remove: false,
                grid: false
            }))
            .pipe(this.conditional(this.production, plugins.cleanCss))
            .pipe(plugins.rename(this.getFilename(config.files.stylesResults)))
            .pipe(plugins.sourcemaps.write('./'))
            .pipe(gulp.dest(this.getPath('stylesTemp')))
            .on('end', () => {
                this.log.print('✔ Finished building css...');
                resolve();
            });
        });
    }

    compileJs() {
        return new Promise(resolve => {
            mergeStream(
                this.compileJsProject(),
                this.compileJsVendors()
            )
            .pipe(plugins.sourcemaps.init({loadMaps: true}))
            .pipe(plugins.order([config.files.scriptsSource, '*']))
            .pipe(plugins.concat(this.getFilename(config.files.scriptsResults), {newLine: ';'}))
            .pipe(this.conditional(this.production, plugins.uglify))
            .pipe(plugins.sourcemaps.write('./'))
            .pipe(gulp.dest(this.getPath('scriptsTemp')))
            .on('end', () => {
                this.log.print('✔ Finished building js...');
                resolve();
            });
        });
    }

    compileJsProject() {
        return browserify({
            entries: this.getPath('scriptsSource') + config.files.scriptsSource,
            debug: true
        })
        .transform('babelify', {
            presets: ['es2015']
        })
        .bundle()
        .pipe(source(config.files.scriptsSource))
        .pipe(buffer());
    }

    compileJsVendors() {
        return gulp.src(this.getPath('scriptsVendors') + '*')
        .pipe(plugins.concat(this.getFilename(config.files.scriptsResults)));
    }

    compileTwig(src = this.getPath('templatesSource') + '*.twig') {
        return new Promise(resolve => {
            fs.readFile(this.getPath('templatesSource') + config.files.twigGlobals, (err, _globals) => {
                gulp.src(src)
                .pipe(plugins.twig({data: JSON.parse(_globals)}))
                .pipe(gulp.dest(this.getPath('templatesTemp')))
                .on('end', () => {
                    this.log.print('✔ Finished building html...');
                    resolve();
                });
            });
        });
    }

    injectFiles() {
        return new Promise(resolve => {
            gulp.src(this.getPath('templatesTemp') + '*.html')
            .pipe(plugins.inject(
                gulp.src([
                    this.getPath('stylesTemp') + this.getFilename(config.files.stylesResults),
                    this.getPath('scriptsTemp') + this.getFilename(config.files.scriptsResults)
                ], {read: false}), {relative: true, quiet: true}
            ))
            .pipe(this.conditional(
                this.production,
                plugins.htmlmin,
                [{collapseWhitespace: true, removeComments: true}]
            ))
            .pipe(gulp.dest(this.getPath('templatesTemp')))
            .on('end', () => {
                this.log.print('✔ Finished injecting static files...');
                resolve();
            });
        });
    }

    compressImages() {
        return new Promise(resolve => {
            gulp.src(this.getPath('imagesSource') + '**/*')
            .pipe(plugins.newer(this.getPath('imagesTemp')))
            .pipe(this.conditional(this.production, plugins.imagemin, [
                [
                    plugins.imagemin.gifsicle(),
                    plugins.imagemin.jpegtran(),
                    require('imagemin-pngquant')(),
                    plugins.imagemin.svgo()
                ],
                {
                    progressive: true,
                    interlaced: true
                }
            ]))
            .pipe(gulp.dest(this.getPath('imagesTemp')))
            .on('end', () => {
                this.log.print('✔ Finished moving images...');
                resolve();
            });
        });
    }

    cleanPublic() {
        return new Promise(resolve => {
            del([
                this.getPath('stylesResult'),
                this.getPath('scriptsResult'),
                this.getPath('imagesResult'),
                this.getPath('templatesResult') + (config.dirs.html.length ? '' : '*.html')
            ], {force: true}).then(() => resolve());
        });
    }

    cleanTemp() {
        return new Promise(resolve => {
            del([
                this.getPath('temp')
            ], {force: true}).then(() => resolve());
        });
    }

    publish(dir = '**/', mask = '**') {
        return new Promise(resolve => {
            gulp.src(this.getPath('temp') + dir + mask)
            .pipe(gulp.dest(this.getPath('public')))
            .on('end', resolve);
        });
    }

    buildProduction() {
        this.production = true;

        return new Promise(resolve => {
            this.cleanTemp()
            .then(this.compileSass.bind(this))
            .then(this.compileJs.bind(this))
            .then(this.compressImages.bind(this))
            .then(this.compileTwig.bind(this))
            .then(this.injectFiles.bind(this))
            .then(this.cleanPublic.bind(this))
            .then(this.publish.bind(this))
            .then(this.cleanTemp.bind(this))
            .then(() => {
                this.log.print('✔ Production build finished');
                resolve();
            });
        });
    }

    buildDev() {
        this.production = false;

        return new Promise(resolve => {
            this.cleanTemp()
            .then(this.compileSass.bind(this))
            .then(this.compileJs.bind(this))
            .then(this.compressImages.bind(this))
            .then(this.compileTwig.bind(this))
            .then(this.injectFiles.bind(this))
            .then(this.publish.bind(this))
            .then(this.watch.bind(this))
            .then(resolve);
        });
    }

    watch() {
        this.log.print('Started files watcher');

        gulp.watch(this.getPath('stylesSource') + '**/*', () => {
            this.compileSass()
            .then(this.publish.bind(this, config.dirs.css.replace('/', '*/')));
        });
        gulp.watch(this.getPath('scriptsSource') + '**/*', () => {
            this.compileJs()
            .then(this.publish.bind(this, config.dirs.js.replace('/', '*/')));
        });
        gulp.watch(this.getPath('imagesSource') + '**/*', () => {
            this.compressImages()
            .then(this.publish.bind(this, config.dirs.img.replace('/', '*/')));
        });
        gulp.watch(
            [this.getPath('templatesSource') + '*/**', this.getPath('templatesSource') + config.files.twigGlobals],
            () => {
                this.compileTwig()
                .then(this.injectFiles.bind(this))
                .then(this.publish.bind(this, config.dirs.html.replace('/', '*/'), '*.html'));
            }
        );
        gulp.watch(this.getPath('templatesSource') + '*.twig', e => {
            this.compileTwig(e.path)
            .then(this.injectFiles.bind(this))
            .then(this.publish.bind(this, config.dirs.html.replace('/', '*/'), '*.html'));
        });
    }

    about() {
        this.log.about();
    }
}

const tasks = new Tasks();

gulp.task('build:production', () => tasks.buildProduction());
gulp.task('build:dev', () => tasks.buildDev());
gulp.task('default', () => tasks.about());
