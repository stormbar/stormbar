// name: Random
// description: A super minimal example random number generator bolt
// keyword: random
// homepage: http://stormbar.com

if(command.hasQuery) {
  result({
    title: Math.floor(Math.random() * Number(command.query)),
    description: 'is your lucky number! (hit enter to try again)',
    action: actions.repeat()
  });
} else {
  result({
    title: 'Type a Maximum Number...',
    description: "and I'll spin the magic 8 ball."
  });
  result({
    title: 'Give me a hand...',
    description: "I'll randomise the max too if you like!",
    action: actions.fillCommand(meta.keyword, Math.floor(Math.random()*1000))
  });
};