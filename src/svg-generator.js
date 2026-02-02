// Language colors matching GitHub's language colors
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Scala: '#c22d40',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Shell: '#89e051',
  PowerShell: '#012456',
  Lua: '#000080',
  Perl: '#0298c3',
  R: '#198CE7',
  Julia: '#a270ba',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Erlang: '#B83998',
  Zig: '#ec915c',
  Nim: '#ffc200',
  Solidity: '#AA6746',
  GLSL: '#5686a5',
  Makefile: '#427819',
  CMake: '#DA3434',
  Dockerfile: '#384d54'
};

/**
 * Calculate user rank based on stats
 */
function calculateRank(stats) {
  const contributions = stats.totalContributions || 0;
  const stars = stats.totalStars || 0;
  const prs = stats.totalPRs || 0;
  const repos = stats.publicRepos || 0;
  const followers = stats.followers || 0;

  // Weighted score calculation
  const score = (
    contributions * 1 +
    stars * 2 +
    prs * 3 +
    repos * 0.5 +
    followers * 0.5
  );

  // Rank thresholds
  if (score >= 1000) return { level: 'S', color: '#e3b341', percentile: 99 }; // Gold
  if (score >= 500) return { level: 'A+', color: '#3fb950', percentile: 95 }; // Green
  if (score >= 250) return { level: 'A', color: '#3fb950', percentile: 87 };
  if (score >= 100) return { level: 'B+', color: '#58a6ff', percentile: 75 }; // Blue
  if (score >= 50) return { level: 'B', color: '#58a6ff', percentile: 60 };
  if (score >= 25) return { level: 'C+', color: '#8b949e', percentile: 40 }; // Gray
  return { level: 'C', color: '#8b949e', percentile: 20 };
}

/**
 * Generate the unified stats card SVG
 */
function generateCard(stats, options = {}) {
  const {
    showStats = true,
    showLanguages = true,
    showStreak = true,
    showActivity = true,
    includePrivate = false,
    showName = true,
    fullWidth = false,
    accentColor = '58a6ff',
    username = stats.username
  } = options;

  // GitHub Dark Dimmed Theme Colors (True)
  const bgColor = '0d1117';     // Canvas
  const borderColor = '30363d'; // Border
  const textColor = 'c9d1d9';   // Fg Default
  const textSecondary = '8b949e'; // Fg Muted
  const accent = accentColor.replace('#', '');
  const titleColor = accent;  // Dynamic name color matching accent

  // Handle Private Commits
  // If includePrivate is true, add restricted contributions to total
  // Note: This only affects the "Total Contributions" number shown in streak section
  // It does NOT affect the graph or streak calculation as we don't have dates for private commits via this API method easily without more complexity
  let totalContributions = stats.totalContributions;
  if (includePrivate && stats.restrictedContributionsCount) {
    totalContributions += stats.restrictedContributionsCount;
  }

  // Recalculate rank with new totals if needed
  const rankStats = { ...stats, totalContributions };
  const rank = calculateRank(rankStats);

  // Calculate card height
  let height = 20; // Padding top
  const sections = [];

  if (showName) {
    height += 35; // Name header
  }

  if (showStats) {
    sections.push({ type: 'stats', y: height });
    // Stats section height: 3 rows * 40px + padding
    height += 135;
  }

  if (showLanguages && stats.languages?.length > 0) {
    sections.push({ type: 'languages', y: height });
    const langRows = Math.ceil(stats.languages.length / 2);
    height += 45 + langRows * 22;
  }

  if (showStreak) {
    sections.push({ type: 'streak', y: height });
    height += 85;
  }

  if (showActivity && stats.recentActivity?.length > 0) {
    sections.push({ type: 'activity', y: height });
    height += 120; // Increased for dates
  }

  height += 10; // Bottom padding

  const cardWidth = fullWidth ? "100%" : "450";
  const cardHeight = fullWidth ? "auto" : height;
  const internalWidth = 450;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${internalWidth} ${height}" fill="none">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap');
      * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
      .title { font-size: 20px; font-weight: 700; fill: #${titleColor}; letter-spacing: -0.5px; }
      .section-title { font-size: 11px; font-weight: 700; fill: #${textSecondary}; letter-spacing: 1.2px; text-transform: uppercase; }
      .stat-value { font-size: 15px; font-weight: 600; fill: #${textColor}; } 
      .stat-label { font-size: 12px; fill: #${textSecondary}; font-weight: 400; }
      .lang-name { font-size: 12px; fill: #${textColor}; font-weight: 500; }
      .lang-pct { font-size: 12px; fill: #${textSecondary}; font-weight: 400; }
      .streak-val { font-size: 22px; font-weight: 800; fill: #${textColor}; }
      .streak-sub { font-size: 11px; fill: #${textSecondary}; font-weight: 500; }
      .rank-circle { stroke-width: 4; stroke-linecap: round; }
      .rank-text { font-size: 18px; font-weight: 800; fill: ${rank.color}; }
      .date-label { font-size: 10px; fill: #${textSecondary}; font-weight: 500; }
    </style>
  </defs>
  
  <rect width="450" height="${height}" rx="6" fill="#${bgColor}" stroke="#${borderColor}" stroke-width="1"/>
  
  <!-- Header -->
  ${showName ? `
  <g transform="translate(25, 35)">
    <text class="card title">${escapeXml(stats.name || username)}</text>
  </g>
  
  <!-- Rank -->
  <g transform="translate(400, 30)">
     <circle cx="0" cy="0" r="18" fill="none" stroke="#21262d" stroke-width="3"/>
     <circle cx="0" cy="0" r="18" fill="none" stroke="${rank.color}" stroke-dasharray="${2 * Math.PI * 18 * (rank.percentile / 100)} 1000" transform="rotate(-90)" class="rank-circle"/>
     <text x="0" y="5" text-anchor="middle" class="card rank-text">${rank.level}</text>
  </g>` : ''}
`;

  for (const section of sections) {
    if (section.type === 'stats') {
      svg += generateStatsSection(stats, section.y, accent);
    } else if (section.type === 'languages') {
      svg += generateLanguagesSection(stats.languages, section.y, accent);
    } else if (section.type === 'streak') {
      svg += generateStreakSection({ ...stats, totalContributions }, section.y, accent);
    } else if (section.type === 'activity') {
      svg += generateActivitySection(stats.recentActivity, section.y, accent, borderColor);
    }
  }

  svg += '</svg>';
  return svg;
}

function generateStatsSection(stats, y, accent) {
  // Grid layout for stats: 2 rows, 2 columns? Or 3 columns.
  // Let's do 2 columns, 3 rows for more details.

  const items = [
    { label: 'Total Stars', value: stats.totalStars, icon: iconStars(accent) },
    { label: 'Commits', value: stats.totalCommits, icon: iconCommit(accent) },
    { label: 'Pull Requests', value: stats.totalPRs, icon: iconPR(accent) },
    { label: 'Issues', value: stats.totalIssues, icon: iconIssue(accent) },
    { label: 'Contributed to', value: stats.publicRepos, icon: iconRepo(accent) }, // Approximating 'repositories' as contributes for context
    { label: 'Followers', value: stats.followers, icon: iconFollowers(accent) }
  ];

  let svg = `<g transform="translate(25, ${y})">`;

  items.forEach((item, i) => {
    // 2 columns
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col * 200;
    const itemY = row * 40;

    svg += `
    <g transform="translate(${x}, ${itemY})">
      ${item.icon}
      <text x="25" y="11" class="stat-value">${formatNumber(item.value)}</text>
      <text x="25" y="27" class="stat-label">${item.label}</text>
    </g>`;
  });

  svg += `</g>`;
  return svg;
}

function generateLanguagesSection(languages, y, accent) {
  let svg = `
  <g transform="translate(25, ${y})">
    <text class="card section-title">Top Languages</text>
    
    <!-- Progress Bar -->
    <g transform="translate(0, 15)">
      <mask id="bar-mask">
        <rect width="400" height="8" rx="4" fill="white"/>
      </mask>
      <g mask="url(#bar-mask)">`;

  let currentX = 0;
  languages.forEach(lang => {
    const width = Math.max((parseFloat(lang.percentage) / 100) * 400, 0);
    const color = LANGUAGE_COLORS[lang.name] || '#8b949e';
    svg += `<rect x="${currentX}" width="${width}" height="8" fill="${color}"/>`;
    currentX += width;
  });

  svg += `
      </g>
    </g>
    
    <!-- Legend -->
    <g transform="translate(0, 35)">`;

  // 2 Cols of languages
  languages.slice(0, 6).forEach((lang, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col * 200;
    const ly = row * 22; // Slightly more spacing
    const color = LANGUAGE_COLORS[lang.name] || '#8b949e';

    svg += `
    <g transform="translate(${x}, ${ly})">
      <circle cx="5" cy="5" r="5" fill="${color}"/>
      <text x="18" y="9" class="lang-name">${escapeXml(lang.name)}</text>
      <text x="140" y="9" class="lang-pct" text-anchor="end">${lang.percentage}%</text>
    </g>`;
  });

  svg += `
    </g>
  </g>`;
  return svg;
}

function generateStreakSection(stats, y, accent) {
  return `
  <g transform="translate(25, ${y})">
    <text class="card section-title">Contribution Streak</text>
    
    <g transform="translate(0, 30)">
      <!-- Current Streak -->
      <g>
        <text class="streak-val" fill="#${accent}">${stats.currentStreak} <tspan font-size="12" font-weight="400" fill="#768390">days</tspan></text>
        <text y="20" class="streak-sub">Current Streak</text>
      </g>
      
      <!-- Longest Streak -->
      <g transform="translate(130, 0)">
        <text class="streak-val">${stats.longestStreak} <tspan font-size="12" font-weight="400" fill="#768390">days</tspan></text>
        <text y="20" class="streak-sub">Longest Streak</text>
      </g>
      
      <!-- Total Contributions -->
      <g transform="translate(260, 0)">
        <text class="streak-val">${formatNumber(stats.totalContributions)}</text>
        <text y="20" class="streak-sub">Total Contributions</text>
      </g>
    </g>
  </g>`;
}

function generateActivitySection(activity, y, accent, borderColor) {
  if (!activity || activity.length === 0) return '';

  const width = 400;
  const height = 60;
  const max = Math.max(...activity, 1);
  const points = activity.map((val, i) => {
    const x = (i / (activity.length - 1)) * width;
    const yPos = height - (val / max) * height;
    return `${x.toFixed(1)},${yPos.toFixed(1)}`;
  });

  const pathData = `M0,${height} L${points.join(' L')} L${width},${height} Z`;
  const linePath = `M${points.join(' L')}`;

  return `
    <g transform="translate(25, ${y})">
      <text class="card section-title">Contribution Activity (Last 30 Days)</text>
      <g transform="translate(0, 20)">
         <path d="${pathData}" fill="#${accent}" fill-opacity="0.1"/>
         <path d="${linePath}" fill="none" stroke="#${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
         
         <circle cx="${points[0].split(',')[0]}" cy="${points[0].split(',')[1]}" r="3" fill="#${accent}"/>
         <circle cx="${points[points.length - 1].split(',')[0]}" cy="${points[points.length - 1].split(',')[1]}" r="3" fill="#${accent}"/>

         <!-- Date Labels -->
         <text x="0" y="${height + 15}" class="date-label">30 days ago</text>
         <text x="${width}" y="${height + 15}" text-anchor="end" class="date-label">Today</text>
      </g>
    </g>`;
}

// Icons (16x16 Octicons conformant)
function iconStars(color) {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="#${color}"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>`;
}

function iconCommit(color) {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="#${color}"><path d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.001 4.001 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/></svg>`;
}

function iconPR(color) {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="#${color}"><path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854v2.396h2.25A1.75 1.75 0 0114 5v5.628a2.251 2.251 0 11-1.5 0V5a.25.25 0 00-.25-.25H10v2.396a.25.25 0 01-.427.177L7.177 4.927a.25.25 0 010-.354z"/></svg>`;
}

function iconIssue(color) {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="#${color}"><path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/></svg>`;
}

function iconRepo(color) {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="#${color}"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/></svg>`;
}

function iconFollowers(color) {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="#${color}"><path d="M2 5.5a3.5 3.5 0 115.898 2.549 5.507 5.507 0 013.034 4.084.75.75 0 11-1.482.235 4.001 4.001 0 00-7.9 0 .75.75 0 01-1.482-.236A5.507 5.507 0 013.102 8.05 3.49 3.49 0 012 5.5zM11 4a3.001 3.001 0 012.22 5.018 5.01 5.01 0 012.56 3.012.75.75 0 01-1.36.44 3.502 3.502 0 00-6.84 0 .75.75 0 01-1.36-.44 5.01 5.01 0 012.56-3.012A3.001 3.001 0 0111 4z"/></svg>`;
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = { generateCard };
