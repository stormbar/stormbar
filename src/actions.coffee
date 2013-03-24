Storm.actions =

  repeat: ->
    (bar) -> bar.update(true)

  open: (url) ->
    (bar) -> window.open(url)

  fill: (searchTerm) ->
    (bar) -> bar.forceSearchTerm(searchTerm)

  fillKeyword: (token) ->
    (bar) -> bar.forceSearchTerm(token + ' ')

  fillCommand: (keyword, command) ->
    console.log keyword, command
    (bar) -> bar.forceSearchTerm("#{keyword} #{command} ")

  reset: ->
    (bar) -> bar.reset()