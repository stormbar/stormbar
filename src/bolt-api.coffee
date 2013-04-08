buildActionProxies = ->
  actions = {}
  for name, fn of Storm.actions
    do (name) ->
      actions[name] = """function() { return {name:"#{name}", args:Array.prototype.slice.apply(arguments)} }"""
  actions

Storm.BOLT_API = WWRPC.defineProtocol


  # Utils

  log: WWRPC.remote (msg) -> console.log(msg)

  utils:
    sanitize: WWRPC.local (str) -> str.replace(/<\/?[a-z0-9]+>/gi, '')
    truncate: WWRPC.local (str, length) -> str.slice(0, length)
    prefixMatch: WWRPC.local Storm.utils.prefixMatch
    unescape: WWRPC.local (str) ->
      str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/")

  # Data Structures

  command: WWRPC.pass -> this.query.command
  meta: WWRPC.pass -> this.bolt.metadata
  bolts: WWRPC.pass ->
    ret = {installed:{}}
    for boltId, bolt of Storm.bolts
      ret.installed[bolt.id] = bolt.metadata
    ret


  # Results

  result: WWRPC.remote (opts) -> this.query.result(opts, this.bolt.isPrivileged)

  actions: buildActionProxies()


  # HTTP

  http:
    getJSON: WWRPC.remote (url, done) ->
      Storm.activity 'downloading', (activity) ->
        $.getJSON url, (res) ->
          activity.end()
          done(res)



  # Option Handing

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


  # Lifecycle

  bolt:
    run: WWRPC.local (fn) -> this._run = fn
    install: WWRPC.local (fn) -> this._install = fn
    uninstall: WWRPC.local (fn) -> this._uninstall = fn
