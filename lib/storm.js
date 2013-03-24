(function() {
  var Storm;

  window.Storm = Storm = {};

  Storm.bolts = {};

  Storm.keywords = {};

  Storm.install = function(url) {
    return $.get(url, function(data) {
      return Storm.load(Storm.idFromURL(url), data);
    });
  };

  Storm.idFromURL = function(url) {
    return CryptoJS.SHA1(url).toString();
  };

  Storm.load = function(id, boltCode) {
    var bolt;

    bolt = new Storm.Bolt(id, boltCode);
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

  Storm.BOLT_API = WWRPC.defineProtocol({
    result: WWRPC.remote(function(opts) {
      return this.result(opts);
    })
  });

  Storm.Bolt = (function() {
    function Bolt(id, code) {
      this.id = id;
      this.code = code;
      this.worker = null;
      this.metadata = {};
      this.processMetadata();
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
          description: this.metadata.description
        });
      }
    };

    Bolt.prototype.wrappedCode = function() {
      return "(function() {\n" + this.code + "\n})";
    };

    Bolt.prototype.run = function(query) {
      this.worker = WWRPC.spawnWorker(Storm.BOLT_API, query);
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
    }

    return Command;

  })();

  Storm.Query = (function() {
    function Query(text) {
      this.command = new Storm.Command(text);
    }

    Query.prototype.run = function() {
      var boltId, bolts, keyword, _i, _len, _ref;

      Storm.terminateAll();
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
      return console.log(opts);
    };

    return Query;

  })();

}).call(this);
