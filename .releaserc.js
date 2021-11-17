// @ts-check

module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      "@semantic-release/npm",
      // Create tarball of the package
      { "tarballDir": "pack" }
    ],
    [
      "@semantic-release/github",
      { "assets": "pack/*.tgz" }
    ],
    '@semantic-release/git', {
      assets: [
        'CHANGELOG.md',
        'package.json',
        'package-lock.json'
      ]
    }
  ]
};
