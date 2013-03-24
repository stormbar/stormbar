buildActionProxies = ->
  actions = {}
  for name, fn of Storm.actions
    do (name) ->
      actions[name] = """function() { return {name:"#{name}", args:Array.prototype.slice.apply(arguments)} }"""
  actions




Storm.BOLT_API = WWRPC.defineProtocol

  log: WWRPC.remote (msg) -> console.log(msg)

  sanitize: WWRPC.local (str) -> str.replace(/<\/?[a-z0-9]+>/gi, '')
  truncate: WWRPC.local (str, length) -> str.slice(0, length)

  command: WWRPC.pass -> this.query.command
  meta: WWRPC.pass -> this.bolt.metadata

  result: WWRPC.remote (opts) -> this.query.result(opts)

  actions: buildActionProxies()

  http:
    getJSON: WWRPC.remote (url, done) ->
      $.getJSON url, (res) -> done(res)