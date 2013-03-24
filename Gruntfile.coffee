module.exports = (grunt) ->

  grunt.initConfig

    pkg: grunt.file.readJSON('package.json'),

    coffee:
      src:
        options:
          join: true
        files:
          'www/javascripts/storm.js': ['src/storm.coffee', 'src/*.coffee']

    uglify:
      src:
        files:
          'www/javascripts/storm.min.js': 'www/javascripts/storm.js'
      vendor:
        files:
          'www/javascripts/vendor.min.js': 'vendor/*.js'

    compass:
      storm:
        options:
          sassDir: 'sass',
          cssDir: 'www/stylesheets'

    watch:
      src:
        files: ['src/*.coffee']
        tasks: ['coffee:src', 'uglify:src']
      vendor:
        files: ['vendor/*.js']
        tasks: ['uglify:vendor']
      styles:
        files: ['sass/*.scss']
        tasks: ['compass']

    connect:
      server:
        options:
          port: 9000,
          base: 'www'
          keepalive: true


  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-compass')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-connect')

  grunt.registerTask('build', ['coffee', 'uglify'])
  grunt.registerTask('default', ['build'])
  grunt.registerTask('dev', ['connect', 'watch'])