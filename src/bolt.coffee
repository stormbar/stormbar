class Storm.Bolt
  constructor: (@url, @source, @isPrivileged=false) ->
    @id = Storm.idFromURL(@url)
    @code = @source
    @worker = null
    @metadata = {}
    @processMetadata()
    @stripCode()
    @compile()

  getKeyword: -> @metadata.keyword

  processMetadata: ->
    for line in @code.split(/\n/g)
      matches = line.match(/^(\/\/|#)\s+(\w+):\s?(.+?)$/)
      return unless matches
      key = matches[2]
      value = matches[3]
      @set(key, value)

  set: (key, value) ->
    @metadata[key] = value

  process: (query) ->
    if query.command.hasKeyword and query.command.keyword is @getKeyword()
      @run(query)
    else
      query.result
        title: @metadata.name
        description: @metadata.description
        action: Storm.actions.fillKeyword(@metadata.keyword)

  stripCode: ->
    # removes comments and blank lines from code
    @code = @code.replace(/^(\n|\/\/.+?\n)/gm, '')

  compile: ->
    if @url.search(/\.coffee$/i) > 0
      @code = CoffeeScript.compile(@code)
    # wraps code in an anonymous function so that it evals cleanly
    @code = "(function() {\n#{@code}\n})"

  run: (query) ->
    @worker = WWRPC.spawnWorker(Storm.BOLT_API, {query:query, bolt:this})
    @worker.loadCode(@code)

  terminate: ->
    if @worker
      @worker.terminate()
      @worker = null