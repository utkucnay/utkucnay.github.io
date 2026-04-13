// Mobile menu toggle
const btn = document.getElementById('mobile-menu-btn');
const menu = document.getElementById('mobile-menu');

if (btn && menu) {
  btn.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', String(!isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
  });

  const links = menu.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open navigation menu');
    });
  });
}

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Change the icons inside the button based on previous settings
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
    document.documentElement.classList.add('dark');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
    document.documentElement.classList.remove('dark');
}

themeToggleBtn.addEventListener('click', function() {
    // toggle icons inside button
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    // if set via local storage previously
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }

    // if NOT set via local storage previously
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }
});

// GitHub Avatar Fetch & Cache Logic (1 Week)
async function loadGithubAvatar() {
  const avatarImg = document.getElementById('github-avatar');
  if (!avatarImg) return;

  const cacheKey = 'github_avatar_data';
  const timeKey = 'github_avatar_time';
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(timeKey);
  const now = Date.now();

  // Show image with smooth fade in
  const displayImage = (src) => {
    avatarImg.src = src;
    avatarImg.onload = () => {
      avatarImg.classList.remove('opacity-0');
    };
  };

  // Check if we have valid cached data
  if (cachedData && cachedTime && (now - parseInt(cachedTime, 10)) < oneWeekMs) {
    displayImage(cachedData);
    return;
  }

  // Fetch new image if cache is expired or missing
  try {
    // Step 1: Use the GitHub API to get the avatar URL (Bypasses CORS issue on redirects)
    const apiResponse = await fetch('https://api.github.com/users/utkucnay');
    if (!apiResponse.ok) throw new Error('Failed to fetch GitHub API');
    
    const userData = await apiResponse.json();
    const avatarUrl = userData.avatar_url;

    // Step 2: Fetch the actual image from avatars.githubusercontent.com (Allows CORS)
    const imgResponse = await fetch(avatarUrl);
    if (!imgResponse.ok) throw new Error('Failed to fetch avatar image');
    
    const blob = await imgResponse.blob();
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64data = reader.result;
      // Save to localStorage
      try {
        localStorage.setItem(cacheKey, base64data);
        localStorage.setItem(timeKey, now.toString());
      } catch (e) {
        console.warn('LocalStorage quota exceeded or disabled, cannot cache avatar.');
      }
      displayImage(base64data);
    };
    
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error('Error loading GitHub avatar:', error);
    // On error, the initials "UA" will remain visible underneath
  }
}

// Initialize the avatar fetch
loadGithubAvatar();

// Show More Experience Toggle
const showMoreBtn = document.getElementById('show-more-btn');
const hiddenGroups = document.querySelectorAll('.hidden-experience-group');
const showMoreIcon = document.getElementById('show-more-icon');

if (showMoreBtn && hiddenGroups.length > 0) {
  let isExpanded = false;

  showMoreBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;

    hiddenGroups.forEach(group => {
      if (isExpanded) {
        group.classList.remove('hidden');
      } else {
        group.classList.add('hidden');
      }
    });

    // Update button text while keeping the icon SVG intact
    if (isExpanded) {
      showMoreBtn.firstChild.nodeValue = 'Show Less Experience\n              ';
      showMoreIcon.classList.add('rotate-180');
    } else {
      showMoreBtn.firstChild.nodeValue = 'Show More Experience\n              ';
      showMoreIcon.classList.remove('rotate-180');
    }

    // Reposition dots after toggling visibility
    requestAnimationFrame(positionTimelineDots);
  });
}

// =============================================
// Timeline Dot Positioning (JS-driven)
// =============================================
// Dynamically creates and positions dots on timeline lines
// so each dot aligns with the vertical center of its card.

function positionTimelineDots() {
  // Remove all existing dots first
  document.querySelectorAll('.timeline-dot').forEach(dot => dot.remove());

  // Config: each entry maps a timeline line element to a container
  // holding .timeline-card elements whose centers we want dots at.
  const configs = [
    {
      lineId: 'mobile-line-visible',
      // Cards are siblings in the flex container next to the line
      getCards: () => {
        const line = document.getElementById('mobile-line-visible');
        if (!line) return [];
        const cardContainer = line.nextElementSibling;
        return cardContainer ? cardContainer.querySelectorAll(':scope > .timeline-card') : [];
      }
    },
    {
      lineId: 'mobile-line-hidden',
      getCards: () => {
        const line = document.getElementById('mobile-line-hidden');
        if (!line) return [];
        const cardContainer = line.nextElementSibling;
        return cardContainer ? cardContainer.querySelectorAll(':scope > .timeline-card') : [];
      }
    },
    {
      lineId: 'desktop-line',
      // Desktop cards are in left and right columns (siblings of the line)
      getCards: () => {
        const line = document.getElementById('desktop-line');
        if (!line || !line.parentElement) return [];
        const grid = line.parentElement;
        // Get all visible .timeline-card elements within the grid
        return grid.querySelectorAll('.timeline-card');
      }
    }
  ];

  for (const config of configs) {
    const line = document.getElementById(config.lineId);
    if (!line) continue;

    // Skip if the line (or an ancestor) is hidden (display:none → offsetParent is null)
    // But note: position:fixed elements also have null offsetParent,
    // so also check if the line has zero height.
    if (line.offsetParent === null && line.offsetHeight === 0) continue;

    const lineRect = line.getBoundingClientRect();
    const cards = config.getCards();

    cards.forEach(card => {
      // Skip cards that are inside a hidden container
      if (card.offsetParent === null && card.offsetHeight === 0) return;

      const cardRect = card.getBoundingClientRect();
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const dotTop = cardCenterY - lineRect.top;

      const dot = document.createElement('div');
      dot.classList.add('timeline-dot');
      dot.style.top = dotTop + 'px';
      line.appendChild(dot);
    });
  }
}

// Run on initial load
positionTimelineDots();

// Debounced resize handler
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(positionTimelineDots, 150);
});

// =============================================
// Data-Driven Project Cards
// =============================================
import projects from './projects.json';

const TAG_COLORS = {
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-transparent dark:border-indigo-500/20',
  blue:   'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-transparent dark:border-blue-500/20',
  green:  'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-transparent dark:border-green-500/20',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-transparent dark:border-purple-500/20',
  yellow: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-transparent dark:border-yellow-500/20',
  gray:   'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 border-transparent dark:border-slate-600',
  rose:   'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-transparent dark:border-rose-500/20',
  cyan:   'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-transparent dark:border-cyan-500/20',
  sky:    'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-transparent dark:border-sky-500/20',
  orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-transparent dark:border-orange-500/20',
  red:    'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-transparent dark:border-red-500/20',
  teal:   'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border-transparent dark:border-teal-500/20',
};

const ICONS = {
  code: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />',
  cube: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />',
  bolt: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />',
};

const LINK_ICONS = {
  github: '<svg class="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" /></svg>',
  external: '<svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>',
};

function renderLinkStyle(type) {
  if (type === 'github') {
    return 'text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center transition-colors';
  }
  return 'text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center transition-colors';
}

function renderMedia(project) {
  if (project.video) {
    return `
      <div class="aspect-video w-full bg-gray-200 dark:bg-slate-800/80 relative overflow-hidden transition-colors">
        <iframe
          src="${project.video}"
          title="${project.title}"
          class="absolute inset-0 w-full h-full"
          frameborder="0"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>`;
  }

  const iconPath = ICONS[project.icon] || ICONS.code;
  return `
    <div class="h-48 bg-gray-200 dark:bg-slate-800/80 relative overflow-hidden flex items-center justify-center transition-colors">
      <svg class="w-12 h-12 text-gray-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        ${iconPath}
      </svg>
    </div>`;
}

function renderTags(tags) {
  return tags.map(tag => {
    const colorClasses = TAG_COLORS[tag.color] || TAG_COLORS.gray;
    return `<span class="px-2.5 py-1 ${colorClasses} text-xs font-medium rounded-md transition-colors border">${tag.label}</span>`;
  }).join('\n                  ');
}

function renderLinks(links) {
  if (!links || links.length === 0) return '';
  const inner = links.map(link => {
    const icon = LINK_ICONS[link.type] || LINK_ICONS.external;
    const style = renderLinkStyle(link.type);
    return `<a href="${link.url}" target="_blank" class="${style}">
                    ${link.label}
                    ${icon}
                  </a>`;
  }).join('\n                  ');

  return `
                <div class="flex gap-3">
                  ${inner}
                </div>`;
}

function renderProjectCard(project) {
  return `
            <div class="bg-white dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none hover:shadow-md transition-shadow group flex flex-col">
              ${renderMedia(project)}
              <div class="p-6 flex-1 flex flex-col">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">${project.title}</h3>
                <p class="text-gray-600 dark:text-slate-400 text-sm mb-4 flex-1 transition-colors">
                  ${project.description}
                </p>
                <div class="flex flex-wrap gap-2 mb-4">
                  ${renderTags(project.tags)}
                </div>${renderLinks(project.links)}
              </div>
            </div>`;
}

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  grid.innerHTML = projects.map(renderProjectCard).join('\n');
}

renderProjects();

// =============================================
// Active Nav Section Highlighting
// =============================================
const NAV_SECTIONS = ['about', 'projects', 'experience', 'skills', 'contact'];
const navLinks = document.querySelectorAll('.nav-link');

function setActiveNav(sectionId) {
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === `#${sectionId}`) {
      link.classList.add('nav-active');
    } else {
      link.classList.remove('nav-active');
    }
  });
}

const navObserver = new IntersectionObserver(
  (entries) => {
    // Find the entry with the largest intersection ratio
    let bestEntry = null;
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
          bestEntry = entry;
        }
      }
    }
    if (bestEntry) {
      setActiveNav(bestEntry.target.id);
    }
  },
  {
    rootMargin: '-20% 0px -60% 0px',
    threshold: [0, 0.25, 0.5],
  }
);

NAV_SECTIONS.forEach(id => {
  const section = document.getElementById(id);
  if (section) navObserver.observe(section);
});

// =============================================
// Scroll-Based Reveal Animations
// =============================================
const scrollElements = document.querySelectorAll('.animate-on-scroll, .stagger-children');

if (scrollElements.length > 0) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target); // only animate once
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  scrollElements.forEach(el => revealObserver.observe(el));
}

