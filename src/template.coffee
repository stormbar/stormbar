Storm.Template =
  CACHE: {}
  render: (name, context) ->
    template = Storm.Template.get(name)
    template(context)

  get: (name) ->
    Storm.Template.CACHE[name] or Storm.Template.compile(name)

  compile: (name) ->
    string = $("##{name}-template").html()
    Storm.Template.CACHE[name] = Handlebars.compile(string)
    Storm.Template.CACHE[name]