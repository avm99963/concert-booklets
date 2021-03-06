var bookletNames = [
  'ciba2021',
  'nadal2020nens',
  'nadal2020joves',
];

var interval = null;
var isBookletShown = false;
var showAllConcerts = false;
var forceConcert = null;

function showSection(section) {
  document.querySelectorAll('section').forEach(el => {
    if (el.id === section)
      el.removeAttribute('hidden');
    else
      el.setAttribute('hidden', '');
  });
}

function convertTime(time) {
  var hour = Math.floor(time);
  var totalMinutes = time*60;
  var minutes = totalMinutes - hour*60;

  return hour + ':' + minutes;
}

function songElement(song, hasTimes) {
  var div = document.createElement('div');
  div.classList.add('song');

  if (hasTimes) {
    var time = document.createElement('div');
    time.classList.add('song-time');
    console.log(song.begins);
    time.textContent = convertTime(song.begins);

    div.append(time);
  }

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

function loadBooklet(booklet, showBackButton = false) {
  console.info('Booklet: ', booklet);

  var hasTimes = booklet.hasTimes;
  if (hasTimes) {
    booklet.songs.sort((a, b) => {
      return a.begins - b.begins;
    });
  }

  document.getElementById('concert-title').textContent = booklet.title;
  document.getElementById('concert-subtitle').textContent = booklet.subtitle;

  if ('customHeader' in booklet)
    document.getElementById('booklet-custom-header').innerHTML =
        booklet.customHeader;
  if ('customFooter' in booklet)
    document.getElementById('booklet-custom-footer').innerHTML =
        booklet.customFooter;

  var bookletContent = document.getElementById('booklet-content');
  bookletContent.textContent = '';
  booklet.songs.forEach(song => {
    var songEl = songElement(song, hasTimes);
    bookletContent.append(songEl);
  });

  showSection('booklet');
  if (showBackButton)
    document.getElementById('previous-concerts-btn').removeAttribute('hidden');
}

function loadPreviousBookletsList(booklets) {
  var now = Date.now();
  var list = document.getElementById('previous-concerts-list');

  var existsPreviousConcert = false;
  booklets.forEach(booklet => {
    if (showAllConcerts || booklet.ends * 1000 <= now) {
      existsPreviousConcert = true;

      var el = document.createElement('div');
      el.classList.add('concert');

      var title = document.createElement('div');
      title.classList.add('concert-title');
      title.textContent = booklet.title;

      var subtitle = document.createElement('div');
      subtitle.classList.add('concert-subtitle');
      subtitle.textContent = booklet.subtitle;

      var view = document.createElement('button');
      view.classList.add('concert-btn', 'linkify');
      view.textContent = 'Obre el programa';

      el.append(title, subtitle, view);

      el.addEventListener('click', _ => {
        loadBooklet(booklet, true);
      });

      list.append(el);
    }
  });

  if (existsPreviousConcert)
    document.getElementById('previous-concerts-btn').removeAttribute('hidden');
}

function checkBooklets(booklets) {
  if (isBookletShown)
    return;

  var now = Date.now();
  var latest = null;
  for (var booklet of booklets) {
    if (forceConcert !== null && ('codename' in booklet) &&
        booklet['codename'] == forceConcert) {
      latest = booklet;
      break;
    }

    if (booklet['begins'] * 1000 <= now && booklet['ends'] * 1000 >= now &&
        (latest === null || latest['begins'] < booklet['begins']))
      latest = booklet;
  }

  if (latest !== null) {
    document.getElementById('previous-concerts-btn').setAttribute('hidden', '');
    loadBooklet(latest);
    window.clearInterval(interval);
    isBookletShown = true;
  }
}

function showUpdateFooter() {
  document.getElementById('update-available').removeAttribute('hidden');
}

window.addEventListener('load', _ => {
  document.getElementById('previous-concerts-btn')
      .addEventListener('click', e => {
        showSection('previous-concerts');
        document.getElementById('previous-concerts-btn')
            .setAttribute('hidden', '');
      });

  var searchParams = new URLSearchParams(location.search);
  if (searchParams.has('showAllConcerts'))
    showAllConcerts = true;
  if (searchParams.has('concert'))
    forceConcert = searchParams.get('concert');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          reg.addEventListener('updatefound', _ => {
            showUpdateFooter();
          });

          var promises = [];
          bookletNames.forEach(name => {
            var p = fetch('concerts/' + name + '.json').then(res => res.json());
            promises.push(p);
          });

          Promise.all(promises).then(booklets => {
            showSection('wait-screen');
            loadPreviousBookletsList(booklets);
            checkBooklets(booklets);
            interval = window.setInterval(_ => {
              checkBooklets(booklets);
            }, 15 * 1000);
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
