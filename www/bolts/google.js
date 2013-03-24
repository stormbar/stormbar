// name: Google Search
// description: Search Google for stuff.
// keyword: google
// homepage: http://google.com

result({title:'Hello', description:'from a bolt'});

// var url = "http://ajax.googleapis.com/ajax/services/search/web?v=1.0&q="+query.textWithoutKeyword()+"&callback=?"
// http.get(url, function(data) {
//   if(data.responseData) {
//     for(i in data.responseData.results) {
//       var item = data.responseData.results[i];
//       result({
//         title:       sanitize(item.title),
//         description: sanitize(item.content),
//         action:      actions.open(item.url)
//       });
//     }
//   } else {
//     result({
//       title:       "Query Failed!",
//       description: "Google Failed to serve this query. Try Again?",
//       action:      actions.repeat()
//     });
//   }
// });