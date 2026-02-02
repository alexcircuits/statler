const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'GitHubStatsGenerator/1.0'
};

/**
 * Fetch user profile and stats from GitHub GraphQL API
 */
async function fetchUserStats(username) {
    if (!GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN is missing in environment variables');
    }

    const query = `
    query userInfo($login: String!) {
      user(login: $login) {
        name
        login
        avatarUrl
        followers {
          totalCount
        }
        following {
          totalCount
        }
        repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: UPDATED_AT, direction: DESC}, isFork: false) {
          totalCount
          nodes {
            name
            stargazers {
              totalCount
            }
            languages(first: 8, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  color
                  name
                }
              }
            }
          }
        }
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
    `;

    try {
        const res = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query,
                variables: { login: username }
            })
        });

        const data = await res.json();

        if (data.errors) {
            if (data.errors[0].type === 'NOT_FOUND') {
                throw new Error('User not found');
            }
            throw new Error(`GraphQL Error: ${data.errors[0].message}`);
        }

        const user = data.data.user;

        // processing languages
        let langMap = {};
        user.repositories.nodes.forEach(repo => {
            repo.languages.edges.forEach(edge => {
                const name = edge.node.name;
                const size = edge.size;
                const color = edge.node.color;
                if (!langMap[name]) {
                    langMap[name] = { size: 0, color: color };
                }
                langMap[name].size += size;
            });
        });

        const totalSize = Object.values(langMap).reduce((acc, curr) => acc + curr.size, 0);
        const languages = Object.entries(langMap)
            .map(([name, data]) => ({
                name,
                color: data.color,
                percentage: ((data.size / totalSize) * 100).toFixed(1)
            }))
            .sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage))
            .slice(0, 8); // Top 8

        // Calculate total stars
        const totalStars = user.repositories.nodes.reduce((acc, repo) => acc + repo.stargazers.totalCount, 0);

        // Contributions
        const contrib = user.contributionsCollection;
        const totalContributions = contrib.contributionCalendar.totalContributions;

        // Calculate Streak
        const weeks = contrib.contributionCalendar.weeks;
        let days = [];
        weeks.forEach(week => {
            week.contributionDays.forEach(day => {
                days.push({ date: day.date, count: day.contributionCount });
            });
        });

        // Reverse to check from today backwards
        days.reverse();

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Check if today has contribution
        // Note: The last day in the array is today or yesterday depending on timezone, 
        // we'll just iterate. Use simple logic: if count > 0, streak++. 
        // If count == 0, if it's NOT today, break current streak.

        const today = new Date().toISOString().split('T')[0];
        let streakBroken = false;

        for (const day of days) {
            if (day.count > 0) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
                if (!streakBroken) {
                    currentStreak++;
                }
            } else {
                tempStreak = 0;
                // If the day with 0 contributions is NOT today, then the streak is broken
                if (day.date !== today) {
                    streakBroken = true;
                }
            }
        }

        // Recent activity (last 30 days) for sparkline
        const recentActivity = days.slice(0, 30).map(d => d.count).reverse();

        return {
            username: user.login,
            name: user.name || user.login,
            avatar: user.avatarUrl,
            publicRepos: user.repositories.totalCount,
            followers: user.followers.totalCount,
            following: user.following.totalCount,
            totalStars,
            languages,
            totalContributions,
            totalCommits: contrib.totalCommitContributions,
            restrictedContributionsCount: contrib.restrictedContributionsCount,
            totalPRs: contrib.totalPullRequestContributions,
            totalIssues: contrib.totalIssueContributions,
            totalReviews: contrib.totalPullRequestReviewContributions,
            currentStreak,
            longestStreak,
            recentActivity
        };

    } catch (error) {
        console.error('Error fetching stats:', error);
        throw error;
    }
}

module.exports = { fetchUserStats };

