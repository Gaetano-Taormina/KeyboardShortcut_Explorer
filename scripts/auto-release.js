const fs = require('fs');
const { execSync } = require('child_process');

// Config
const packageJsonPath = './package.json';
const readmePath = './README.md';

function execCommand(command) {
    return execSync(command, { encoding: 'utf-8' }).trim();
}

function getLatestTag() {
    try {
        return execCommand('git describe --tags --abbrev=0');
    } catch (e) {
        return null;
    }
}

function getCommitsSince(tag) {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    const log = execCommand(`git log ${range} --pretty=format:"%s"`);
    return log.split('\n').filter(line => line.trim().length > 0);
}

function getNextVersion(currentVersion, commits) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    let bumpType = 'patch';

    for (const commit of commits) {
        if (commit.includes('BREAKING CHANGE') || commit.includes('!')) {
            bumpType = 'major';
            break;
        }
        if (commit.startsWith('feat') || commit.startsWith('feat:')) {
            bumpType = 'minor';
        }
    }

    if (bumpType === 'major') return `${major + 1}.0.0`;
    if (bumpType === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

function run() {
    console.log('Starting Auto-Release Check...');
    const latestTag = getLatestTag();
    console.log(`Latest tag: ${latestTag || 'None'}`);

    const commits = getCommitsSince(latestTag);
    if (commits.length === 0) {
        console.log('No new commits found. Skipping release.');
        process.exit(0);
    }

    // Filter commits for changelog
    const changelogCommits = commits.filter(c => !c.startsWith('chore') && !c.startsWith('Merge'));
    if (changelogCommits.length === 0) {
        console.log('No significant changes to release (only chore/merge). Skipping.');
        process.exit(0);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const currentVersion = packageJson.version;
    const nextVersion = getNextVersion(currentVersion, commits);
    
    console.log(`Bumping version: ${currentVersion} -> ${nextVersion}`);

    // Update package.json
    packageJson.version = nextVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // Update README.md
    let readme = fs.readFileSync(readmePath, 'utf-8');
    const releaseNotesMarker = '## Release Notes\n';
    
    let changelogMarkdown = `\n### ${nextVersion}\n\n`;
    for (const commit of changelogCommits) {
        // Simple formatting to make it readable
        changelogMarkdown += `- ${commit}\n`;
    }

    if (readme.includes(releaseNotesMarker)) {
        readme = readme.replace(releaseNotesMarker, releaseNotesMarker + changelogMarkdown);
        fs.writeFileSync(readmePath, readme);
        console.log('README.md updated with new release notes.');
    } else {
        console.warn('Could not find "## Release Notes" in README.md. Skipping README update.');
    }

    // Git operations
    execCommand('git config --global user.name "github-actions[bot]"');
    execCommand('git config --global user.email "github-actions[bot]@users.noreply.github.com"');
    execCommand(`git add ${packageJsonPath} ${readmePath}`);
    execCommand(`git commit -m "chore: release v${nextVersion} [skip ci]"`);
    execCommand(`git tag v${nextVersion}`);
    
    // We export the new version to GITHUB_ENV so the workflow can use it
    if (process.env.GITHUB_ENV) {
        fs.appendFileSync(process.env.GITHUB_ENV, `NEW_VERSION=${nextVersion}\n`);
        fs.appendFileSync(process.env.GITHUB_ENV, `SHOULD_RELEASE=true\n`);
    }

    console.log(`Successfully bumped to v${nextVersion}`);
}

run();
