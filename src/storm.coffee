window.Storm = Storm = {}

Storm.bolts = {}
Storm.keywords = {}

Storm.init = (selector) -> new Storm.Bar($(selector))

Storm.install = (url) ->
  if url.search(/^https?:\/\//i) is 0
    $.getJSON "http://anyorigin.com/get?callback=?&url=#{url}", (data) -> Storm.load(url, data.contents, false)
  else
    $.get url, null, ((data) -> Storm.load(url, data, true)), 'text'

Storm.idFromURL = (url) -> CryptoJS.SHA1(url).toString()

Storm.load = (id, boltCode, isPrivileged=false) ->
  bolt = new Storm.Bolt(id, boltCode, isPrivileged)
  Storm.register(bolt)

Storm.register = (bolt) ->
  Storm.bolts[bolt.id] = bolt
  Storm.keywords[bolt.getKeyword()] = Storm.keywords[bolt.getKeyword()] || []
  Storm.keywords[bolt.getKeyword()].push(bolt.id)

Storm.terminateAll = ->
  for id, bolt of Storm.bolts
    bolt.terminate()

Storm.utils = {
  prefixMatch: (prefix, string) -> string.search(new RegExp("^#{prefix}",'i')) is 0
  fuzzyMatch: (prefix, string, threshold=0) -> string.score(prefix) > threshold
}