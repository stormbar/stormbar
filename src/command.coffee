class Storm.Command
  constructor: (@text) ->
    @tokens = @text.split(/\s+/g)
    @keyword = @tokens[0]
    @hasKeyword = @text.search(/\s/) > 0
    @query = @text.replace(new RegExp("^#{@keyword}\\s+"), '')
    @hasQuery = @query and @query.length > 0
    console.log this

