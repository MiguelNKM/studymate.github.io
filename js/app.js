const YOUTUBE_API_KEY = 'AIzaSyB2rnHY9f3tHESaJ1Bgm_3r_CsuhvtB794';

document.getElementById('search-btn').addEventListener('click', function () {
  const query = document.getElementById('search').value;
  if (query) {
    fetchCombinedResults(query);
  }
});

document.getElementById('library-search-btn').addEventListener('click', function () {
  const searchQuery = document.getElementById('library-search').value.toLowerCase();
  searchLibrary(searchQuery);
});

function fetchCombinedResults(query) {
  // Search Wikipedia
  fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*`)
    .then(response => response.json())
    .then(data => {
      const wikiResults = data.query.search;
      // Search Crash Course Videos
      return fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${query} Crash Course&key=${YOUTUBE_API_KEY}`)
        .then(response => response.json())
        .then(videoData => {
          const videoResults = videoData.items.map(item => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/embed/${item.id.videoId}`
          }));
          return { wikiResults, videoResults };
        });
    })
    .then(({ wikiResults, videoResults }) => {
      displayCombinedResults(wikiResults, videoResults);
    });
}

function displayCombinedResults(wikiResults, videoResults) {
  const searchResultsDiv = document.getElementById('search-results');
  searchResultsDiv.innerHTML = '';

  if (wikiResults.length === 0 && videoResults.length === 0) {
    searchResultsDiv.innerHTML = '<p>No results found.</p>';
    return;
  }

  wikiResults.forEach(result => {
    const resultItem = document.createElement('div');
    resultItem.classList.add('result-item');

    resultItem.innerHTML = `
            <h3>${result.title}</h3>
            <p>${result.snippet}...</p>
            <button onclick="saveResource('${result.title}', '${result.pageid}')">Add to Library</button>
        `;

    searchResultsDiv.appendChild(resultItem);
  });

  videoResults.forEach(result => {
    const resultItem = document.createElement('div');
    resultItem.classList.add('result-item');

    resultItem.innerHTML = `
            <h3>${result.title}</h3>
            <iframe class="video-player" src="${result.url}" frameborder="0" allowfullscreen></iframe>
            <button onclick="saveCrashCourseVideo('${result.title}', '${result.url}')">Add to Library</button>
        `;

    searchResultsDiv.appendChild(resultItem);
  });
}

function saveResource(title, pageid) {
  const resource = {
    title: title,
    content: '',
    id: pageid
  };

  fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&format=json&pageids=${pageid}&origin=*`)
    .then(response => response.json())
    .then(data => {
      const page = data.query.pages[pageid];
      resource.content = page.extract;
      let resources = JSON.parse(localStorage.getItem('resources')) || [];
      resources.push(resource);
      localStorage.setItem('resources', JSON.stringify(resources));
      updateResourceList();
    });
}

function saveCrashCourseVideo(title, url) {
  const resource = {
    title: title,
    content: `<iframe class="video-player" src="${url}" frameborder="0" allowfullscreen></iframe>`,
    type: 'video'
  };

  let resources = JSON.parse(localStorage.getItem('resources')) || [];
  resources.push(resource);
  localStorage.setItem('resources', JSON.stringify(resources));
  updateResourceList();
}

function updateResourceList() {
  const resources = JSON.parse(localStorage.getItem('resources')) || [];
  const resourceListDiv = document.getElementById('resource-list');
  resourceListDiv.innerHTML = '';

  if (resources.length === 0) {
    resourceListDiv.innerHTML = '<p>No resources added yet.</p>';
    return;
  }

  resources.forEach((resource, index) => {
    const resourceItem = document.createElement('div');
    resourceItem.classList.add('resource-item');

    resourceItem.innerHTML = `
            <div class="title">${resource.title}</div>
            <button class="toggle-btn" onclick="toggleContent(${index})">Show More</button>
            <button class="remove-btn" onclick="removeResource(${index})">Remove</button>
            <div class="content" id="content-${index}" style="display: none;">
                ${resource.content}
            </div>
        `;

    resourceListDiv.appendChild(resourceItem);
  });
}

function toggleContent(index) {
  const contentDiv = document.getElementById(`content-${index}`);
  const toggleBtn = contentDiv.previousElementSibling;

  if (contentDiv.style.display === 'none') {
    contentDiv.style.display = 'block';
    toggleBtn.textContent = 'Show Less';
  } else {
    contentDiv.style.display = 'none';
    toggleBtn.textContent = 'Show More';
  }
}

function removeResource(index) {
  let resources = JSON.parse(localStorage.getItem('resources')) || [];
  resources.splice(index, 1);
  localStorage.setItem('resources', JSON.stringify(resources));
  updateResourceList();
}

function searchLibrary(query) {
  const resources = JSON.parse(localStorage.getItem('resources')) || [];
  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(query)
  );

  const resourceListDiv = document.getElementById('resource-list');
  resourceListDiv.innerHTML = '';

  if (filteredResources.length === 0) {
    resourceListDiv.innerHTML = '<p>No resources found.</p>';
    return;
  }

  filteredResources.forEach((resource, index) => {
    const resourceItem = document.createElement('div');
    resourceItem.classList.add('resource-item');

    resourceItem.innerHTML = `
            <div class="title">${resource.title}</div>
            <button class="toggle-btn" onclick="toggleContent(${index})">Show More</button>
            <button class="remove-btn" onclick="removeResource(${index})">Remove</button>
            <div class="content" id="content-${index}" style="display: none;">
                ${resource.content}
            </div>
        `;

    resourceListDiv.appendChild(resourceItem);
  });
}

// Add service worker registration for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Initialize resource list
updateResourceList();
