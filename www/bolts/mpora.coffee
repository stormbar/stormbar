# name: MPORA
# description: Extreme Sports Videos
# keyword: mpora
# homepage: http://mpora.com

bolt.run ->
  if command.hasQuery
    result
      title: "MPORA Video"
      description: "Watch http://mpora.com/videos/#{command.query}"
      action: actions.iframe("http://mpora.com/videos/#{command.query}/embed")
  else
    result
      title: "MPORA Video"
      description: 'Enter a video ID to watch...'
