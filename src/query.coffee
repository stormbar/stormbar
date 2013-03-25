class Storm.Query
  constructor: (@bar, text) ->
    @command = new Storm.Command(text)

  cancel: ->
    Storm.terminateAll()

  run: ->
    for keyword, bolts of Storm.keywords
      if Storm.utils.fuzzyMatch(@command.keyword, keyword)
        Storm.bolts[boltId].process(this) for boltId in bolts
    null

  result: (opts, isPrivileged=false) ->
    @bar.result(new Storm.Result(opts, isPrivileged))