buildActionProxies = ->
  actions = {}
  for name, fn of Storm.actions
    do (name) ->
      actions[name] = """function() { return {name:"#{name}", args:Array.prototype.slice.apply(arguments)} }"""
  actions

Storm.BOLT_API = WWRPC.defineProtocol

  log: WWRPC.remote (msg) -> console.log(msg)

  utils:
    sanitize: WWRPC.local (str) -> str.replace(/<\/?[a-z0-9]+>/gi, '')
    truncate: WWRPC.local (str, length) -> str.slice(0, length)
    prefixMatch: WWRPC.local Storm.utils.prefixMatch

  command: WWRPC.pass -> this.query.command
  meta: WWRPC.pass -> this.bolt.metadata
  bolts: WWRPC.pass ->
    ret = {installed:{}}
    for boltId, bolt of Storm.bolts
      ret.installed[bolt.id] = bolt.metadata
    ret

  result: WWRPC.remote (opts) -> this.query.result(opts, this.bolt.isPrivileged)

  actions: buildActionProxies()

  http:
    getJSON: WWRPC.remote (url, done) ->
      $.getJSON url, (res) -> done(res)

  options: WWRPC.local (options) ->
    this._tokenDepth = (this._tokenDepth or 0) + 1
    token = command.tokens[this._tokenDepth]
    if command.hasQuery
      for kw, settings of options
        if token is kw
          settings.action()
        else if utils.prefixMatch(command.tokens[1], kw)
          result
            title: settings.title
            description: settings.description
            action: actions.fillCommand(command.keyword, kw)
    else
      for kw, settings of options
        result
          title: settings.title
          description: settings.description
          action: actions.fillCommand(command.keyword, kw)
