module.exports = (grunt) ->

  grunt.initConfig

    pkg: grunt.file.readJSON('package.json')
    aws: if grunt.file.exists('aws.json') then grunt.file.readJSON('aws.json') else {}

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

    s3:
      options:
        key: '<%= aws.key %>'
        secret: '<%= aws.secret %>'
        bucket: '<%= aws.bucket %>'
        access: 'public-read'
      site:
        upload: [
          { src: 'www/*', dest: '' }
          { src: 'www/bolts/*', dest: 'bolts/' }
          { src: 'www/images/*', dest: 'images/' }
          { src: 'www/help/*', dest: 'help/' }
          { src: 'www/javascripts/*', dest: 'javascripts/' }
          { src: 'www/javascripts/*', dest: 'javascripts/', gzip:true }
          { src: 'www/stylesheets/*', dest: 'stylesheets/' }
          { src: 'www/stylesheets/*', dest: 'stylesheets/', gzip:true }
        ]
      vault:
        options:
          bucket: 'vault.stormbar.net'
        upload: [
          { src: 'www/vault.html', dest: 'vault.html' }
        ]



  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-compass')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-s3')

  grunt.registerTask('build', ['compass', 'coffee', 'uglify'])
  grunt.registerTask('default', ['build'])
  grunt.registerTask('dev', ['connect', 'watch'])
  grunt.registerTask('deploy', ['s3'])