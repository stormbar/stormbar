class Storm.Command
  constructor: (@text) ->
    @tokens = @text.split(/\s+/g)
    @keyword = @tokens[0]
    @hasKeyword = @keyword and @keyword.length > 0
    @query = @text.replace(new RegExp("^#{@keyword}\\s+"), '')
    @hasQuery = @query and @query.length > 0

