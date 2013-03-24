(function() {
  var WWRPC;

  window.WWRPC = WWRPC = {};

  WWRPC.defineProtocol = function(p) {
    return new WWRPC.Protocol(p);
  };

  WWRPC.spawnWorker = function(protocol, context) {
    return new WWRPC.Worker(protocol, context);
  };

  WWRPC.remote = function(fn) {
    return new WWRPC.RemoteFunction(fn);
  };

  WWRPC.local = function(fn) {
    return new WWRPC.LocalFunction(fn);
  };

  WWRPC.pass = function(fn) {
    return new WWRPC.PassFunction(fn);
  };

  WWRPC.bridgeCode = function(name) {
    return "var " + name + " = (" + (WWRPC.BRIDGE.toString()) + ")();";
  };

  WWRPC.BRIDGE = function() {
    return {
      WAITING_CALLBACKS: [],
      unpack: function(obj, binding) {
        var key, value;

        if (binding == null) {
          binding = {};
        }
        for (key in obj) {
          value = obj[key];
          if (typeof value === 'object') {
            binding[key] = this.unpack(value);
          } else if (typeof value === 'string' && value.search(/^function/) === 0) {
            binding[key] = eval("(" + value + ")");
          } else {
            binding[key] = value;
          }
        }
        return binding;
      },
      init: function() {
        var _this = this;

        return addEventListener('message', function(e) {
          return _this.process(e.data);
        });
      },
      process: function(data) {
        switch (data.action) {
          case 'wwrpc:run':
            return eval("(" + data.code + ")()");
          case 'wwrpc:callback':
            return this.runCallback(data.callbackId, data.args);
        }
      },
      runCallback: function(id, args) {
        return this.WAITING_CALLBACKS[id].apply(args, args);
      },
      queueCallback: function(fn) {
        this.WAITING_CALLBACKS.push(fn);
        return this.WAITING_CALLBACKS.length - 1;
      },
      call: function(name, args) {
        var callbackId;

        if (args == null) {
          args = [];
        }
        callbackId = null;
        if (args.length > 0 && typeof args[args.length - 1] === 'function') {
          callbackId = this.queueCallback(args.pop());
        }
        return postMessage({
          action: "wwrpc:call",
          name: name,
          args: args,
          callbackId: callbackId
        });
      }
    };
  };

  WWRPC.Protocol = (function() {
    function Protocol(template) {
      this.template = template;
    }

    Protocol.prototype.workerCode = function(context) {
      var data;

      data = JSON.stringify(this.process(this.template, context));
      return "" + (WWRPC.bridgeCode('__bridge__')) + "\n__bridge__.unpack(" + data + ", self);\n__bridge__.init();";
    };

    Protocol.prototype.processLeaf = function(leaf, context, tree) {
      var key, o, value;

      if (tree == null) {
        tree = [];
      }
      o = {};
      for (key in leaf) {
        value = leaf[key];
        o[key] = this.process(value, context, tree.concat([key]));
      }
      return o;
    };

    Protocol.prototype.process = function(value, context, tree) {
      if (tree == null) {
        tree = [];
      }
      if (value.constructor === WWRPC.PassFunction) {
        return value.resultForContext(context);
      }
      if (value.constructor === WWRPC.RemoteFunction) {
        return value.toRpcString(tree);
      }
      if (value.constructor === WWRPC.LocalFunction) {
        return value.toRpcString(tree);
      }
      if (typeof value === 'object') {
        return this.processLeaf(value, context, tree);
      }
      return value;
    };

    Protocol.prototype.call = function(name, context, args, callback) {
      var fn;

      if (callback == null) {
        callback = null;
      }
      fn = this.findFn(name);
      if (!fn) {
        throw new Error("Undefined RPC function " + name + " called.");
      }
      return fn.run(context, args, callback);
    };

    Protocol.prototype.findFn = function(name) {
      var part, parts, scope, _i, _len;

      parts = name.split('.');
      scope = this.template;
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        if (scope !== void 0) {
          scope = scope[part];
        }
      }
      return scope;
    };

    return Protocol;

  })();

  WWRPC.RemoteFunction = (function() {
    function RemoteFunction(fn) {
      this.fn = fn;
      null;
    }

    RemoteFunction.prototype.run = function(context, args, callback) {
      if (callback !== null) {
        args.push(callback);
      }
      return this.fn.apply(context, args);
    };

    RemoteFunction.prototype.toRpcString = function(context) {
      return "function() { __bridge__.call('" + (context.join('.')) + "', Array.prototype.slice.apply(arguments)); }";
    };

    return RemoteFunction;

  })();

  WWRPC.LocalFunction = (function() {
    function LocalFunction(fn) {
      this.fn = fn;
      null;
    }

    LocalFunction.prototype.toRpcString = function(context) {
      return this.fn.toString();
    };

    return LocalFunction;

  })();

  WWRPC.PassFunction = (function() {
    function PassFunction(fn) {
      this.fn = fn;
      null;
    }

    PassFunction.prototype.resultForContext = function(context) {
      return this.fn.apply(context, context);
    };

    return PassFunction;

  })();

  WWRPC.Worker = (function() {
    function Worker(protocol, context) {
      this.protocol = protocol;
      this.context = context != null ? context : {};
      this.blob = new Blob([this.protocol.workerCode(this.context)], {
        "type": "text/javascript"
      });
      this.start();
    }

    Worker.prototype.process = function(data) {
      switch (data.action) {
        case 'wwrpc:call':
          return this.protocol.call(data.name, this.context, data.args, this.buildCallback(data.callbackId));
      }
    };

    Worker.prototype.buildCallback = function(id) {
      var _this = this;

      if (id === null) {
        return null;
      }
      return function() {
        return _this.worker.postMessage({
          action: 'wwrpc:callback',
          callbackId: id,
          args: Array.prototype.slice.apply(arguments)
        });
      };
    };

    Worker.prototype.terminate = function() {
      this.worker.terminate();
      return this.worker = null;
    };

    Worker.prototype.on = function(eventName, fn) {};

    Worker.prototype.trigger = function(eventName) {};

    Worker.prototype.start = function() {
      var _this = this;

      this.worker = new window.Worker(window.URL.createObjectURL(this.blob));
      return this.worker.addEventListener('message', function(e) {
        return _this.process(e.data);
      });
    };

    Worker.prototype.loadCode = function(code) {
      return this.worker.postMessage({
        action: 'wwrpc:run',
        code: code.toString()
      });
    };

    return Worker;

  })();

}).call(this);
