(function() {
  var Storm, buildActionProxies;

  window.Storm = Storm = {};

  Storm.bolts = {};

  Storm.keywords = {};

  Storm.init = function(selector) {
    return new Storm.Bar($(selector));
  };

  Storm.install = function(url) {
    if (url.search(/^https?:\/\//i) === 0) {
      return $.getJSON("http://anyorigin.com/get?callback=?&url=" + url, function(data) {
        return Storm.load(Storm.idFromURL(url), data.contents, false);
      });
    } else {
      return $.get(url, null, (function(data) {
        return Storm.load(Storm.idFromURL(url), data, true);
      }), 'text');
    }
  };

  Storm.idFromURL = function(url) {
    return CryptoJS.SHA1(url).toString();
  };

  Storm.load = function(id, boltCode, isPrivileged) {
    var bolt;

    if (isPrivileged == null) {
      isPrivileged = false;
    }
    bolt = new Storm.Bolt(id, boltCode, isPrivileged);
    return Storm.register(bolt);
  };

  Storm.register = function(bolt) {
    Storm.bolts[bolt.id] = bolt;
    Storm.keywords[bolt.getKeyword()] = Storm.keywords[bolt.getKeyword()] || [];
    return Storm.keywords[bolt.getKeyword()].push(bolt.id);
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
    }
  };

  Storm.Bar = (function() {
    function Bar(el) {
      this.el = el;
      this.el = $(this.el);
      this.searchField = this.el.find('input.search');
      this.resultsEl = this.el.find('.downpour');
      this.query = new Storm.Query(this, this.searchTerm());
      this.results = [];
      this.lastSearch = "";
      this.bindEvents();
      this.currentResultIndex = 0;
      this.focusSearchField();
      this.updateTimer = null;
    }

    Bar.prototype.bindEvents = function() {
      var _this = this;

      this.searchField.on('keyup', function() {
        return _this.considerUpdate();
      });
      this.searchField.on('change', function() {
        return _this.considerUpdate();
      });
      Mousetrap.bind('up', (function() {
        _this.moveUp();
        return false;
      }));
      Mousetrap.bind('down', (function() {
        _this.moveDown();
        return false;
      }));
      return Mousetrap.bind(['right', 'enter', 'tab'], (function() {
        _this.triggerAction();
        return false;
      }));
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
      return forceSearchTerm('');
    };

    Bar.prototype.searchTerm = function() {
      return this.searchField.val();
    };

    Bar.prototype.result = function(result) {
      this.results.push(result);
      this.resultsEl.append(result.render());
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

    Bar.prototype.triggerAction = function() {
      var result;

      result = this.results[this.currentResultIndex];
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
    sanitize: WWRPC.local(function(str) {
      return str.replace(/<\/?[a-z0-9]+>/gi, '');
    }),
    truncate: WWRPC.local(function(str, length) {
      return str.slice(0, length);
    }),
    command: WWRPC.pass(function() {
      return this.query.command;
    }),
    meta: WWRPC.pass(function() {
      return this.bolt.metadata;
    }),
    result: WWRPC.remote(function(opts) {
      return this.query.result(opts);
    }),
    actions: buildActionProxies(),
    http: {
      getJSON: WWRPC.remote(function(url, done) {
        return $.getJSON(url, function(res) {
          return done(res);
        });
      })
    }
  });

  Storm.Bolt = (function() {
    function Bolt(id, code, isPrivileged) {
      this.id = id;
      this.code = code;
      this.isPrivileged = isPrivileged != null ? isPrivileged : false;
      this.worker = null;
      this.metadata = {};
      this.processMetadata();
      this.stripCode();
    }

    Bolt.prototype.getKeyword = function() {
      return this.metadata.keyword;
    };

    Bolt.prototype.processMetadata = function() {
      var key, line, matches, value, _i, _len, _ref;

      _ref = this.code.split(/\n/g);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        matches = line.match(/^\/\/\s+(\w+):\s?(.+?)$/);
        if (!matches) {
          return;
        }
        key = matches[1];
        value = matches[2];
        this.set(key, value);
      }
    };

    Bolt.prototype.set = function(key, value) {
      return this.metadata[key] = value;
    };

    Bolt.prototype.process = function(query) {
      if (query.command.keyword === this.getKeyword()) {
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

    Bolt.prototype.wrappedCode = function() {
      return "(function() {\n" + this.code + "\n})";
    };

    Bolt.prototype.run = function(query) {
      this.worker = WWRPC.spawnWorker(Storm.BOLT_API, {
        query: query,
        bolt: this
      });
      return this.worker.loadCode(this.wrappedCode());
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
      this.hasKeyword = this.keyword && this.keyword.length > 0;
      this.query = this.text.replace(new RegExp("^" + this.keyword + "\\s+"), '');
      this.hasQuery = this.query && this.query.length > 0;
    }

    return Command;

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

    Query.prototype.result = function(opts) {
      return this.bar.result(new Storm.Result(opts));
    };

    return Query;

  })();

  Storm.Result = (function() {
    function Result(data) {
      this.data = data != null ? data : {};
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

}).call(this);
