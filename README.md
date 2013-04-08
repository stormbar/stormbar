stormbar.net
============

Let it Storm!

About Storm Bar
---------------

Do you use a Desktop launch bar on your computer? Maybe Alfred, Quicksilver or something similar? Well Storm Bar is just like that but built for the web.

Imagine a launch bar for the web that has a documented public JavaScript based API where extensions are simply URLs. This is Storm Bar.

Storm Bar is written in CoffeeScript and managed by Grunt. It is designed to run entirely in the browser without a server component. In production it is hosted as static files stored on Amazon S3.


Setup
-----

  npm install -g grunt-cli
  npm install
  grunt build


Local Dev
---------

    grunt watch
    grunt connect
    open http://localhost:9000


Deployment
----------

    grunt build
    grunt deploy