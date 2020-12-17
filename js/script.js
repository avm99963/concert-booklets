var bookletNames = [
  'nadal2020joves',
  'nadal2020nens',
];

var isBookletShown = false;

function showSection(section) {
  document.querySelectorAll('section').forEach(el => {
    if (el.id === section)
      el.removeAttribute('hidden');
    else
      el.setAttribute('hidden', '');
  });
}

function songElement(song) {
  var div = document.createElement('div');
  div.classList.add('song');

  var title = document.createElement('h3');
  title.classList.add('song-title');
  title.textContent = song.title;

  var author = document.createElement('div');
  author.classList.add('song-author');
  author.textContent = song.author;

  var performers = document.createElement('div');
  performers.classList.add('performers');

  song.performers.forEach(performer => {
    var item = document.createElement('div');
    item.classList.add('performers-item');

    var span = document.createElement('span');
    span.classList.add('instrument');
    span.textContent = performer.instrument;

    var people = document.createTextNode(': ' + performer.names.join(', '));

    item.append(span, people);
    performers.append(item);
  });

  div.append(title, author, performers);
  return div;
}

function loadBooklet(booklet) {
  console.info('Booklet: ', booklet);

  document.getElementById('concert-title').textContent = booklet.title;
  document.getElementById('concert-subtitle').textContent = booklet.subtitle;

  var bookletContent = document.getElementById('booklet-content');
  booklet.songs.forEach(song => {
    var songEl = songElement(song);
    bookletContent.append(songEl);
  });

  showSection('booklet');
}

function checkBooklets(booklets) {
  if (isBookletShown)
    return;

  var now = Date.now();
  var latest = null;
  booklets.forEach(booklet => {
    if (booklet.begins * 1000 <= now &&
        (latest === null || booklet.begins * 1000 < booklet.begins))
      latest = booklet;
  });

  if (latest === null)
    showSection('wait-screen');
  else {
    loadBooklet(latest);
    isBookletShown = true;
  }
}

window.addEventListener('load', _ => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(_ => {
          var promises = [];
          bookletNames.forEach(name => {
            var p = fetch('concerts/' + name + '.json').then(res => res.json());
            promises.push(p);
          });

          Promise.all(promises).then(booklets => {
            checkBooklets(booklets);
            window.setInterval(_ => { checkBooklets(booklets); }, 60 * 1000);
          });
        })
        .catch(err => {
          showSection('cant-install');
          console.error('The service worker failed to be registered.');
        });
  } else {
    showSection('no-service-worker');
  }
});
