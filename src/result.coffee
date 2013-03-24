class Storm.Result

  constructor: (@data={}) ->
    if typeof @data.action is 'object'
      @data.action = Storm.actions[@data.action.name].apply(this, @data.action.args)

  render: ->
    Storm.Template.render('result', @data)

  triggerAction: (bar) ->
    if typeof @data.action is 'function'
      @data.action.call(this, bar)