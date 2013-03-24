class Storm.Bolt
  constructor: (@id, @code) ->
    @worker = null
    @metadata = {}
    @processMetadata()
    @stripCode()

  getKeyword: -> @metadata.keyword

  processMetadata: ->
    for line in @code.split(/\n/g)
      matches = line.match(/^\/\/\s+(\w+):\s?(.+?)$/)
      return unless matches
      key = matches[1]
      value = matches[2]
      @set(key, value)

  set: (key, value) ->
    @metadata[key] = value

  process: (query) ->
    if query.command.keyword is @getKeyword()
      @run(query)
    else
      query.result
        title: @metadata.name
        description: @metadata.description
        action: Storm.actions.fillKeyword(@metadata.keyword)

  stripCode: ->
    # removes comments and blank lines from code
    @code = @code.replace(/^(\n|\/\/.+?\n)/gm, '')

  wrappedCode: ->
    # wraps code in an anonymous function so that it evals cleanly
    "(function() {\n#{@code}\n})"

  run: (query) ->
    @worker = WWRPC.spawnWorker(Storm.BOLT_API, query)
    @worker.loadCode(@wrappedCode())

  terminate: ->
    if @worker
      @worker.terminate()
      @worker = null