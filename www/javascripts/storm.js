(function() {
  var Storm, buildActionProxies,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.Storm = Storm = {};

  Storm.bolts = {};

  Storm.keywords = {};

  Storm.env = {
    production: window.location.hostname === 'stormbar.net',
    development: window.location.hostname !== 'stormbar.net',
    server: this.production ? 'stormbar.net' : 'localhost:9000'
  };

  Storm.init = function(selector) {
    var params;

    params = URI(window.location.href).query(true);
    new Storm.Bar($(selector), {
      query: params.q
    });
    return Storm.loadAllFromIndex();
  };

  Storm.boltURL = function(url) {
    var name;

    if (url.search(/^https?:\/\//i) === 0) {
      return url;
    }
    if (url.search(/^dev\//) === 0) {
      name = url.split('/')[1];
      return "http://localhost:9001/" + name + "/" + name + ".bolt.coffee";
    }
    if (url.search(/^\//) === 0) {
      return url;
    }
    return "http://raw.github.com/stormbar/bolts/master/" + url + "/" + url + ".bolt.coffee";
  };

  Storm.maybeInstall = function(url) {
    if (!Storm.isInstalled(Storm.idFromURL(url))) {
      return Storm.install(url);
    }
  };

  Storm.install = function(url) {
    return Storm.activity('installing bolt', function(activity) {
      url = Storm.boltURL(url);
      if (url.search(/^\//i) === 0) {
        return $.get(url, null, (function(data) {
          Storm.load(url, data, {
            isPrivileged: true,
            isInstall: true
          });
          return activity.end();
        }), 'text');
      } else if (url.search(/^http:\/\/localhost/) === 0) {
        return $.get(url, null, (function(data) {
          Storm.load(url, data, {
            isPrivileged: false,
            isInstall: true
          });
          return activity.end();
        }), 'text');
      } else {
        return $.getJSON("http://anyorigin.com/get?callback=?&url=" + url, function(data) {
          Storm.load(url, data.contents, {
            isPrivileged: false,
            isInstall: true
          });
          return activity.end();
        });
      }
    });
  };

  Storm.idFromURL = function(url) {
    return CryptoJS.SHA1(url).toString();
  };

  Storm.load = function(id, boltCode, options) {
    var bolt;

    if (options == null) {
      options = {};
    }
    bolt = new Storm.Bolt(id, boltCode, options.isPrivileged || false);
    Storm.register(bolt, options.isInstall || false);
    if (options.isInstall) {
      bolt.install();
    }
    return bolt;
  };

  Storm.register = function(bolt, isInstall) {
    if (isInstall == null) {
      isInstall = false;
    }
    Storm.bolts[bolt.id] = bolt;
    Storm.keywords[bolt.getKeyword()] = Storm.keywords[bolt.getKeyword()] || [];
    if ($.inArray(bolt.id, Storm.keywords[bolt.getKeyword()]) === -1) {
      Storm.keywords[bolt.getKeyword()].push(bolt.id);
    }
    if (isInstall) {
      Storm.addToIndex(bolt);
    }
    return bolt;
  };

  Storm.update = function(boltId) {
    var bolt;

    bolt = Storm.bolts[boltId];
    return Storm.install(bolt.url);
  };

  Storm.updateAll = function() {
    var bolt, id, _ref, _results;

    _ref = Storm.bolts;
    _results = [];
    for (id in _ref) {
      bolt = _ref[id];
      _results.push(Storm.install(bolt.url));
    }
    return _results;
  };

  Storm.uninstall = function(boltId) {
    var bolt;

    bolt = Storm.bolts[boltId];
    bolt.uninstall();
    Storm.removeFromIndex(bolt);
    delete Storm.bolts[boltId];
    return Storm.keywords[bolt.getKeyword()] = Storm.keywords[bolt.getKeyword()].filter(function(id) {
      return id !== boltId;
    });
  };

  Storm.removeFromIndex = function(bolt) {
    var bolts;

    Storm.store.remove(['bolt', bolt.id]);
    bolts = Storm.store.get('bolts', {});
    bolts.installed = bolts.installed || [];
    bolts.installed = bolts.installed.filter(function(id) {
      return id !== bolt.id;
    });
    return Storm.store.set('bolts', bolts);
  };

  Storm.addToIndex = function(bolt) {
    var bolts;

    Storm.store.set(['bolt', bolt.id], {
      url: bolt.url,
      isPrivileged: bolt.isPrivileged,
      source: bolt.source
    });
    bolts = Storm.store.get('bolts', {});
    bolts.installed = bolts.installed || [];
    if ($.inArray(bolt.id, bolts.installed) === -1) {
      bolts.installed.push(bolt.id);
    }
    return Storm.store.set('bolts', bolts);
  };

  Storm.loadAllFromIndex = function() {
    var boltId, bolts, _i, _len, _ref, _results;

    bolts = Storm.store.get('bolts', {});
    if (!bolts.installed) {
      return;
    }
    _ref = bolts.installed;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      boltId = _ref[_i];
      _results.push(Storm.loadFromIndex(boltId));
    }
    return _results;
  };

  Storm.loadFromIndex = function(boltId) {
    var data;

    data = Storm.store.get(['bolt', boltId]);
    if (!data) {
      return;
    }
    return Storm.load(data.url, data.source, {
      isInstall: false,
      isPrivileged: data.isPrivileged
    });
  };

  Storm.isInstalled = function(id) {
    var bolts;

    bolts = Storm.store.get('bolts', {});
    if (!bolts.installed) {
      return false;
    }
    return $.inArray(id, bolts.installed) !== -1;
  };

  Storm.terminateAll = function() {
    var bolt, id, _ref, _results;

    _ref = Storm.bolts;
    _results = [];
    for (id in _ref) {
      bolt = _ref[id];
      _results.push(bolt.terminate());
    }
    return _results;
  };

  Storm.activity = function(status, cb) {
    var activity;

    activity = Storm.ActivityManager.create();
    activity.start(status);
    return cb(activity);
  };

  Storm.utils = {
    prefixMatch: function(prefix, string) {
      return string.search(new RegExp("^" + prefix, 'i')) === 0;
    },
    fuzzyMatch: function(prefix, string, threshold) {
      if (threshold == null) {
        threshold = 0;
      }
      return string.score(prefix) > threshold;
    }
  };

  Storm.actions = {
    repeat: function() {
      return function(bar) {
        return bar.update(true);
      };
    },
    open: function(url) {
      return function(bar) {
        return window.open(url);
      };
    },
    image: function(url, title) {
      return function(bar) {
        return new Storm.Modal('image', {
          title: title,
          image: url
        }).open();
      };
    },
    iframe: function(url) {
      return function(bar) {
        return new Storm.Modal('iframe', {
          src: url
        }).open();
      };
    },
    fill: function(searchTerm) {
      return function(bar) {
        return bar.forceSearchTerm(searchTerm);
      };
    },
    fillKeyword: function(token) {
      return function(bar) {
        return bar.forceSearchTerm(token + ' ');
      };
    },
    fillCommand: function(keyword, command) {
      return function(bar) {
        return bar.forceSearchTerm("" + keyword + " " + command + " ");
      };
    },
    reset: function() {
      return function(bar) {
        return bar.reset();
      };
    },
    ignore: function() {
      return function(bar) {
        return null;
      };
    },
    install: function(url) {
      return function(bar) {
        if (this.isPrivileged) {
          Storm.install(url);
          return bar.reset();
        }
      };
    },
    uninstall: function(boltId) {
      return function(bar) {
        if (this.isPrivileged) {
          Storm.uninstall(boltId);
          return bar.reset();
        }
      };
    },
    update: function(boltId) {
      return function(bar) {
        if (this.isPrivileged) {
          Storm.update(boltId);
          return bar.reset();
        }
      };
    },
    updateAll: function(boltId) {
      return function(bar) {
        if (this.isPrivileged) {
          Storm.updateAll();
          return bar.reset();
        }
      };
    }
  };

  Storm.ActivityManager = {
    activities: [],
    indicatorShowing: false,
    hasRunningActivities: false,
    create: function() {
      var activity;

      activity = new Storm.Activity(this);
      this.activities.push(activity);
      return activity;
    },
    update: function() {
      var activity;

      this.activities = (function() {
        var _i, _len, _ref, _results;

        _ref = this.activities;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          activity = _ref[_i];
          if (activity.isRunning()) {
            _results.push(activity);
          }
        }
        return _results;
      }).call(this);
      this.hasRunningActivities = this.activities.length > 0;
      return this.updateIndicator();
    },
    updateIndicator: function() {
      var indicator;

      indicator = $('#activity-indicator');
      if (this.hasRunningActivities) {
        indicator.find('.status').text(this.activities[0].status());
        indicator.addClass('on');
        return this.indicatorShowing = true;
      } else {
        indicator.removeClass('on');
        return this.indicatorShowing = true;
      }
    }
  };

  Storm.Activity = (function() {
    Activity.TIMEOUT = 10000;

    function Activity(_manager) {
      this._manager = _manager;
      this._running = false;
      this._status = 'working';
      this._timeout = null;
    }

    Activity.prototype.start = function(initialStatus) {
      var _this = this;

      this._timeout = setTimeout((function() {
        return _this.end();
      }), Storm.Activity.TIMEOUT);
      this._running = true;
      this._status = initialStatus;
      return this._manager.update();
    };

    Activity.prototype.end = function() {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      this._running = false;
      return this._manager.update();
    };

    Activity.prototype.status = function(msg) {
      if (msg == null) {
        msg = null;
      }
      if (msg) {
        this._status = msg;
        this._manager.update();
      }
      return this._status;
    };

    Activity.prototype.isRunning = function() {
      return this._running;
    };

    return Activity;

  })();

  Storm.Bar = (function() {
    function Bar(el, options) {
      var _this = this;

      this.el = el;
      this.options = options != null ? options : {};
      this.el = $(this.el);
      this.searchField = this.el.find('input.search');
      this.resultsEl = this.el.find('.downpour');
      this.query = new Storm.Query(this, this.searchTerm());
      this.results = [];
      this.lastSearch = "";
      this.bindEvents();
      this.currentResultIndex = 0;
      this.updateTimer = null;
      $(document).ready(function() {
        return _this.onLoad();
      });
    }

    Bar.prototype.onLoad = function() {
      if (this.options.query) {
        this.forceSearchTerm(this.options.query);
      }
      this.bindEvents();
      return this.focusSearchField();
    };

    Bar.prototype.bindEvents = function() {
      var _this = this;

      this.searchField.on('keyup', function() {
        return _this.considerUpdate();
      });
      this.searchField.on('change', function() {
        return _this.considerUpdate();
      });
      Mousetrap.bind('up', this.closeModalAnd(function() {
        return _this.moveUp();
      }));
      Mousetrap.bind('down', this.closeModalAnd(function() {
        return _this.moveDown();
      }));
      Mousetrap.bind('esc', this.closeModalOr(function() {
        return _this.reset();
      }));
      return Mousetrap.bind(['enter', 'tab'], this.closeModalOr(function() {
        return _this.triggerAction();
      }));
    };

    Bar.prototype.closeModalOr = function(fn) {
      return function() {
        if (Storm.Modal.hasOpenModal()) {
          Storm.Modal.close();
        } else {
          fn();
        }
        return false;
      };
    };

    Bar.prototype.closeModalAnd = function(fn) {
      return function() {
        if (Storm.Modal.hasOpenModal()) {
          Storm.Modal.close();
        }
        fn();
        return false;
      };
    };

    Bar.prototype.focusSearchField = function() {
      var _this = this;

      return $(document).ready(function() {
        return _this.searchField.focus();
      });
    };

    Bar.prototype.forceSearchTerm = function(term) {
      this.searchField.val(term);
      return this.update(true);
    };

    Bar.prototype.reset = function() {
      return this.forceSearchTerm('');
    };

    Bar.prototype.searchTerm = function() {
      return this.searchField.val();
    };

    Bar.prototype.result = function(result) {
      var resultHTML,
        _this = this;

      this.results.push(result);
      resultHTML = $.parseHTML(result.render());
      this.resultsEl.append(resultHTML);
      $(resultHTML).click(function() {
        return _this.triggerAction(result);
      });
      this.updateSelection();
      this.updateHeight();
      return this.el.addClass('has-results');
    };

    Bar.prototype.considerUpdate = function() {
      var _this = this;

      if (this.updateTimer) {
        clearTimeout(this.updatetimer);
      }
      if (this.searchTerm().split(' ') > 1) {
        return setTimeout((function() {
          return _this.update();
        }), 300);
      } else {
        return this.update();
      }
    };

    Bar.prototype.update = function(force) {
      if (force == null) {
        force = false;
      }
      this.updateTimer = null;
      if (this.searchTerm() === this.activeSearch && force === false) {
        return true;
      }
      this.wipe();
      this.activeSearch = this.searchTerm();
      this.query = new Storm.Query(this, this.searchTerm());
      this.query.run();
      return true;
    };

    Bar.prototype.wipe = function() {
      this.results = [];
      this.currentResultIndex = 0;
      this.query.cancel();
      this.resultsEl.html('');
      this.el.removeClass('has-results');
      return this.updateHeight();
    };

    Bar.prototype.moveUp = function() {
      if (this.currentResultIndex === 0) {
        return;
      }
      this.currentResultIndex--;
      return this.updateSelection();
    };

    Bar.prototype.moveDown = function() {
      if (!(this.currentResultIndex < this.results.length - 1)) {
        return;
      }
      this.currentResultIndex++;
      return this.updateSelection();
    };

    Bar.prototype.updateSelection = function() {
      var allResults;

      allResults = this.resultsEl.find('.result');
      allResults.removeClass('selected');
      return $(allResults.get(this.currentResultIndex)).addClass('selected');
    };

    Bar.prototype.updateHeight = function() {
      var child, h, _i, _len, _ref;

      h = 0;
      _ref = this.resultsEl.children();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        h += $(child).outerHeight();
      }
      return this.resultsEl.height(h);
    };

    Bar.prototype.triggerAction = function(result) {
      if (result == null) {
        result = this.results[this.currentResultIndex];
      }
      if (!result) {
        return;
      }
      return result.triggerAction(this);
    };

    return Bar;

  })();

  buildActionProxies = function() {
    var actions, fn, name, _fn, _ref;

    actions = {};
    _ref = Storm.actions;
    _fn = function(name) {
      return actions[name] = "function() { return {name:\"" + name + "\", args:Array.prototype.slice.apply(arguments)} }";
    };
    for (name in _ref) {
      fn = _ref[name];
      _fn(name);
    }
    return actions;
  };

  Storm.BOLT_API = WWRPC.defineProtocol({
    log: WWRPC.remote(function(msg) {
      return console.log(msg);
    }),
    utils: {
      sanitize: WWRPC.local(function(str) {
        return str.replace(/<\/?[a-z0-9]+>/gi, '');
      }),
      truncate: WWRPC.local(function(str, length) {
        return str.slice(0, length);
      }),
      prefixMatch: WWRPC.local(Storm.utils.prefixMatch),
      unescape: WWRPC.local(function(str) {
        return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/");
      })
    },
    command: WWRPC.pass(function() {
      return this.query.command;
    }),
    meta: WWRPC.pass(function() {
      return this.bolt.metadata;
    }),
    bolts: WWRPC.pass(function() {
      var bolt, boltId, ret, _ref;

      ret = {
        installed: {}
      };
      _ref = Storm.bolts;
      for (boltId in _ref) {
        bolt = _ref[boltId];
        ret.installed[bolt.id] = bolt.metadata;
      }
      return ret;
    }),
    result: WWRPC.remote(function(opts) {
      return this.query.result(opts, this.bolt.isPrivileged);
    }),
    perform: WWRPC.remote(function(action) {
      Storm.actions[action.name].apply(this.bolt, action.args)(this.query.bar);
      return this.query.bar.reset();
    }),
    actions: buildActionProxies(),
    http: {
      getJSON: WWRPC.remote(function(url, done) {
        return Storm.activity('downloading', function(activity) {
          return Storm.Vault.get(url, function(res) {
            activity.end();
            return done(res);
          });
        });
      })
    },
    options: WWRPC.local(function(options) {
      var kw, settings, token, _results, _results1;

      this._tokenDepth = (this._tokenDepth || 0) + 1;
      token = command.tokens[this._tokenDepth];
      if (command.hasQuery) {
        _results = [];
        for (kw in options) {
          settings = options[kw];
          if (token === kw) {
            _results.push(settings.action());
          } else if (utils.prefixMatch(command.tokens[1], kw)) {
            _results.push(result({
              title: settings.title,
              description: settings.description,
              action: actions.fillCommand(command.keyword, kw)
            }));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      } else {
        _results1 = [];
        for (kw in options) {
          settings = options[kw];
          _results1.push(result({
            title: settings.title,
            description: settings.description,
            action: actions.fillCommand(command.keyword, kw)
          }));
        }
        return _results1;
      }
    }),
    bolt: {
      run: WWRPC.local(function(fn) {
        return this._run = fn;
      }),
      install: WWRPC.local(function(fn) {
        return this._install = fn;
      }),
      uninstall: WWRPC.local(function(fn) {
        return this._uninstall = fn;
      })
    }
  });

  Storm.Bolt = (function() {
    function Bolt(url, source, isPrivileged) {
      this.url = url;
      this.source = source;
      this.isPrivileged = isPrivileged != null ? isPrivileged : false;
      this.id = Storm.idFromURL(this.url);
      this.code = this.source;
      this.worker = null;
      this.metadata = {};
      this.processMetadata();
      this.set('url', this.url);
      this.stripCode();
      this.compile();
    }

    Bolt.prototype.getKeyword = function() {
      return this.metadata.keyword;
    };

    Bolt.prototype.processMetadata = function() {
      var key, line, matches, value, _i, _len, _ref;

      _ref = this.code.split(/\n/g);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        matches = line.match(/^(\/\/|#)\s+(\w+):\s?(.+?)$/);
        if (!matches) {
          return;
        }
        key = matches[2];
        value = matches[3];
        this.set(key, value);
      }
    };

    Bolt.prototype.set = function(key, value) {
      return this.metadata[key] = value;
    };

    Bolt.prototype.process = function(query) {
      if (query.command.hasKeyword && query.command.keyword === this.getKeyword()) {
        return this.run(query);
      } else {
        return query.result({
          title: this.metadata.name,
          description: this.metadata.description,
          action: Storm.actions.fillKeyword(this.metadata.keyword)
        });
      }
    };

    Bolt.prototype.stripCode = function() {
      return this.code = this.code.replace(/^(\n|\/\/.+?\n)/gm, '');
    };

    Bolt.prototype.compile = function() {
      if (this.url.search(/\.coffee$/i) > 0) {
        this.code = CoffeeScript.compile(this.code);
      }
      return this.code = "(function() {\n" + this.code + "\n})";
    };

    Bolt.prototype.install = function() {
      return this.execute('install');
    };

    Bolt.prototype.uninstall = function() {
      return this.execute('uninstall');
    };

    Bolt.prototype.run = function(query) {
      return this.execute('run', query);
    };

    Bolt.prototype.execute = function(mode, query) {
      if (query == null) {
        query = {};
      }
      this.worker = WWRPC.spawnWorker(Storm.BOLT_API, {
        query: query,
        bolt: this
      });
      this.worker.loadCode(this.code);
      return this.worker.loadCode("(function() { if(typeof bolt._" + mode + " === 'function') bolt._" + mode + "() })");
    };

    Bolt.prototype.terminate = function() {
      if (this.worker) {
        this.worker.terminate();
        return this.worker = null;
      }
    };

    return Bolt;

  })();

  Storm.Command = (function() {
    function Command(text) {
      this.text = text;
      this.tokens = this.text.split(/\s+/g);
      this.keyword = this.tokens[0];
      this.hasKeyword = this.text.search(/\s/) > 0;
      this.query = this.text.replace(new RegExp("^" + this.keyword + "\\s+"), '');
      this.hasQuery = this.query && this.query.length > 0;
    }

    return Command;

  })();

  Storm.Modal = (function() {
    Modal.activeModal = null;

    Modal.hasOpenModal = function() {
      return Storm.Modal.activeModal && Storm.Modal.activeModal.isOpen;
    };

    Modal.close = function() {
      return Storm.Modal.activeModal.close();
    };

    function Modal(template, options) {
      this.template = template;
      this.options = options;
      this.onMessage = __bind(this.onMessage, this);
      this.content = Storm.Template.render('modal-' + this.template, this.options);
      this.el = null;
      this.isOpen = false;
      Storm.Modal.activeModal = this;
    }

    Modal.prototype.open = function() {
      this.el = $.parseHTML(this.content);
      $('body').append(this.el);
      this.isOpen = true;
      return window.addEventListener('message', this.onMessage, false);
    };

    Modal.prototype.close = function() {
      if (!this.isOpen) {
        return;
      }
      $(this.el).remove();
      this.isOpen = false;
      return window.removeEventListener('message', this.onMessage, false);
    };

    Modal.prototype.onMessage = function(e) {
      if (!(e.data = 'closeModal')) {
        return;
      }
      return this.close();
    };

    return Modal;

  })();

  Storm.Query = (function() {
    function Query(bar, text) {
      this.bar = bar;
      this.command = new Storm.Command(text);
    }

    Query.prototype.cancel = function() {
      return Storm.terminateAll();
    };

    Query.prototype.run = function() {
      var boltId, bolts, keyword, _i, _len, _ref;

      _ref = Storm.keywords;
      for (keyword in _ref) {
        bolts = _ref[keyword];
        if (Storm.utils.fuzzyMatch(this.command.keyword, keyword)) {
          for (_i = 0, _len = bolts.length; _i < _len; _i++) {
            boltId = bolts[_i];
            Storm.bolts[boltId].process(this);
          }
        }
      }
      return null;
    };

    Query.prototype.result = function(opts, isPrivileged) {
      if (isPrivileged == null) {
        isPrivileged = false;
      }
      return this.bar.result(new Storm.Result(opts, isPrivileged));
    };

    return Query;

  })();

  Storm.Result = (function() {
    function Result(data, isPrivileged) {
      this.data = data != null ? data : {};
      this.isPrivileged = isPrivileged != null ? isPrivileged : false;
      if (typeof this.data.action === 'object') {
        this.data.action = Storm.actions[this.data.action.name].apply(this, this.data.action.args);
      }
    }

    Result.prototype.render = function() {
      return Storm.Template.render('result', this.data);
    };

    Result.prototype.triggerAction = function(bar) {
      if (typeof this.data.action === 'function') {
        return this.data.action.call(this, bar);
      }
    };

    return Result;

  })();

  Storm.store = {
    get: function(key, fallback) {
      var item;

      if (fallback == null) {
        fallback = null;
      }
      item = window.localStorage.getItem(Storm.store.makeKey(key));
      if (item === null) {
        return fallback;
      }
      return JSON.parse(item);
    },
    set: function(key, value) {
      return window.localStorage.setItem(Storm.store.makeKey(key), JSON.stringify(value));
    },
    remove: function(key) {
      return window.localStorage.removeItem(Storm.store.makeKey(key));
    },
    makeKey: function(parts) {
      if (typeof parts === 'string') {
        return parts;
      } else {
        return parts.join(':');
      }
    }
  };

  Storm.Template = {
    CACHE: {},
    render: function(name, context) {
      var template;

      template = Storm.Template.get(name);
      return template(context);
    },
    get: function(name) {
      return Storm.Template.CACHE[name] || Storm.Template.compile(name);
    },
    compile: function(name) {
      var string;

      string = $("#" + name + "-template").html();
      Storm.Template.CACHE[name] = Handlebars.compile(string);
      return Storm.Template.CACHE[name];
    }
  };

  Storm.Vault = (function() {
    Vault.COUNTER = 1;

    Vault.PATH = Storm.env.production ? 'http://vault.stormbar.net/vault.html' : '/vault.html';

    Vault.get = function(url, callback) {
      return new Storm.Vault(url, callback);
    };

    function Vault(url, callback) {
      this.url = url;
      this.callback = callback;
      this.onMessage = __bind(this.onMessage, this);
      this.id = (Storm.Vault.COUNTER++).toString();
      this.registerCallback();
      this.frame = document.createElement("iframe");
      this.frame.setAttribute("src", this.vaultURL());
      this.frame.style.width = "0px";
      this.frame.style.height = "0px";
      $('body').append(this.frame);
    }

    Vault.prototype.registerCallback = function() {
      return window.addEventListener('message', this.onMessage, false);
    };

    Vault.prototype.vaultURL = function() {
      return "" + Storm.Vault.PATH + "#" + this.id + "|" + this.url;
    };

    Vault.prototype.onMessage = function(e) {
      if (!(e.data.vault && e.data.id === this.id)) {
        return;
      }
      this.callback(e.data.response);
      return this.cleanup();
    };

    Vault.prototype.cleanup = function() {
      $(this.frame).remove();
      return window.removeEventListener('message', this.onMessage, false);
    };

    return Vault;

  })();

}).call(this);
