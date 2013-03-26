window.Storm = Storm = {}

Storm.bolts = {}
Storm.keywords = {}

Storm.init = (selector) ->
  params = URI(window.location.href).query(true)
  new Storm.Bar($(selector), query:params.q)
  Storm.loadAllFromIndex()

Storm.maybeInstall = (url) ->
  Storm.install(url) unless Storm.isInstalled(Storm.idFromURL(url))

Storm.install = (url) ->
  console.log "INSTALL #{url}"
  if url.search(/^https?:\/\//i) is 0
    $.getJSON "http://anyorigin.com/get?callback=?&url=#{url}", (data) -> Storm.load(url, data.contents, isPrivileged:false, isInstall:true)
  else
    $.get url, null, ((data) -> Storm.load(url, data, isPrivileged:true, isInstall:true)), 'text'

Storm.idFromURL = (url) -> CryptoJS.SHA1(url).toString()

Storm.load = (id, boltCode, options={}) ->
  bolt = new Storm.Bolt(id, boltCode, (options.isPrivileged or false))
  Storm.register(bolt, (options.isInstall or false))
  bolt

Storm.register = (bolt, isInstall=false) ->
  Storm.bolts[bolt.id] = bolt
  Storm.keywords[bolt.getKeyword()] = Storm.keywords[bolt.getKeyword()] || []
  Storm.keywords[bolt.getKeyword()].push(bolt.id) if $.inArray(bolt.id, Storm.keywords[bolt.getKeyword()]) is -1
  Storm.addToIndex(bolt) if isInstall
  bolt

Storm.addToIndex = (bolt) ->
  Storm.store.set(['bolt', bolt.id], url:bolt.url, isPrivileged:bolt.isPrivileged, source:bolt.source)
  bolts = Storm.store.get('bolts', {})
  bolts.installed = bolts.installed or []
  bolts.installed.push(bolt.id) if $.inArray(bolt.id, bolts.installed) is -1
  Storm.store.set('bolts', bolts)

Storm.loadAllFromIndex = ->
  bolts = Storm.store.get('bolts', {})
  return unless bolts.installed
  for boltId in bolts.installed
    Storm.loadFromIndex(boltId)

Storm.loadFromIndex = (boltId) ->
  data = Storm.store.get(['bolt', boltId])
  return unless data
  Storm.load(data.url, data.source, isInstall:false, isPrivileged:data.isPrivileged)

Storm.isInstalled = (id) ->
  bolts = Storm.store.get('bolts', {})
  return false unless bolts.installed
  $.inArray(id, bolts.installed) isnt -1

Storm.terminateAll = ->
  for id, bolt of Storm.bolts
    bolt.terminate()

Storm.utils = {
  prefixMatch: (prefix, string) -> string.search(new RegExp("^#{prefix}",'i')) is 0
  fuzzyMatch: (prefix, string, threshold=0) -> string.score(prefix) > threshold
}