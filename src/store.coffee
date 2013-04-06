Storm.store =
  get: (key, fallback=null) ->
    item = window.localStorage.getItem(Storm.store.makeKey(key))
    return fallback if item is null
    JSON.parse(item)
  set: (key, value) -> window.localStorage.setItem(Storm.store.makeKey(key), JSON.stringify(value))
  remove: (key) -> window.localStorage.removeItem(Storm.store.makeKey(key))
  makeKey: (parts) -> if typeof parts is 'string' then parts else parts.join(':')
