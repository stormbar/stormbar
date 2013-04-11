class Storm.Vault
  @COUNTER = 1
  @PATH = if Storm.env.production then 'http://vault.stormbar.net/vault.html' else '/vault.html'

  @get = (url, callback) ->
    new Storm.Vault(url, callback)

  constructor: (@url, @callback) ->
    @id = (Storm.Vault.COUNTER++).toString()
    @registerCallback()
    @frame = document.createElement("iframe")
    @frame.setAttribute("src", @vaultURL())
    @frame.style.width = "0px"
    @frame.style.height = "0px"
    $('body').append(@frame)

  registerCallback: ->
    window.addEventListener('message', @onMessage, false)

  vaultURL: ->
    "#{Storm.Vault.PATH}##{@id}|#{@url}"

  onMessage: (e) =>
    return unless e.data.vault and e.data.id is @id
    @callback(e.data.response)
    @cleanup()

  cleanup: ->
    $(@frame).remove()
    window.removeEventListener('message', @onMessage, false)