module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: ['should'],
        },
        src: ['test.js']
      }
    }

  });

  grunt.registerTask('test', ['mochaTest:test'])

};
