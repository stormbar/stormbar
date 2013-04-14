stormbar.net
============

Let it Storm!

About Storm Bar
---------------

Do you use a Desktop launch bar on your computer? Maybe Alfred, Quicksilver or something similar? Well Storm Bar is just like that but built for the web.

Imagine a command bar for the web that has a documented public JavaScript based API where extensions are simply URLs. This is Storm Bar.

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

You will need an `aws.json` file with valid credentials in order to deploy. See `aws.json.example` for syntax.

    grunt build
    grunt deploy


Security
--------

Storm Bar is by it's very nature designed ot run untrusted third party code directly in the browser. Whilst this can probably never be 100% secure we go to great lengths to try.

- All Bolt code is run inside of a WebWorker. This means thrid party code cannot access any resources, including the DOM, AJAX, cookies, localstorage, etc.
- Bolt initiated HTTP requests are handed off to an iframe on a seperate domain to be fetched and parsed.
- All UI content is escaped and rendered through Handlebars.js


Lifecyle of a Command
---------------------

1. Command is entered in the UI
2. Command is parsed and the first word (the keyword) is matched against the database to find potential bolt matches.
3. If the keyword exactly matches any Bolts then they are started up inside of a WebWorker and their run function is involked.
4. Running Bolts call `result()` when they have a result to be show in the UI. Results have an `action` attached.
5. If a result is selected in the UI then it's `action` is triggered.