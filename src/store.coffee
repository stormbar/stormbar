Storm.store =
  get: (key, fallback=null) -> $.jStorage.get(Storm.store.makeKey(key), fallback)
  set: (key, value) -> $.jStorage.set(Storm.store.makeKey(key), value)
  destroy: (key) -> $.jStorage.deleteKey(Storm.store.makeKey(key))
  makeKey: (parts) -> if typeof parts is 'string' then parts else parts.join(':')