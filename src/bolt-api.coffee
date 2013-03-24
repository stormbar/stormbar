buildActionProxies = ->
  actions = {}
  for name, fn of Storm.actions
    do (name) ->
      actions[name] = """function() { return {name:"#{name}", args:Array.prototype.slice.apply(arguments)} }"""
  actions




Storm.BOLT_API = WWRPC.defineProtocol

  command: WWRPC.pass -> this.command

  result: WWRPC.remote (opts) -> this.result(opts)

  actions: buildActionProxies()
