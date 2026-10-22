# Jobee'sLair Homebrew

The Homebrew section of [Jobee'sLair](https://github.com/JVK3R/JobeesLair), on its own: the catalog it reads,
the tool that builds it, and the home of **Jobee'sLair Homebrew**, the section built as an app of its own for
jailbroken PS5 consoles.

## The index

`index.json` lists over 200 open-source PS5 homebrew apps, payloads and tools, each read from its own GitHub
repository and newest release: what it is, its README, its screenshots, which file to install and how.
It is rebuilt every six hours by the `homebrew index` workflow (`tools/build-index.mjs`), and committed when
something changed. Jobee'sLair reads it from

    https://raw.githubusercontent.com/JVK3R/JobeesLair-Homebrew/main/index.json

a little after it starts, so a new release of a listed app reaches consoles the same day, without a new build
of anything.

The list of repositories is nexgen999's [PS5 Repository List](https://github.com/nexgen999/PS5-Repository-List),
read live on every run with his permission, plus `sources.json`: our own picks and categories, how his
categories map to ours, and what is never listed (PC-side tools, for one). To add or fix an app, change
`sources.json` and open a pull request; the workflow rebuilds the index when it lands.

Build it yourself:

    npm install    # nothing to install, the builder has no dependencies; Node 22
    GITHUB_TOKEN=<a token, for the API's rate limit> node tools/build-index.mjs

`cache.json` (archive listings, image checks, README reads) is kept between runs in the Actions cache, not here.

## Jobee'sLair Homebrew, the app

Jobee'sLair can be built with only its Homebrew section: title `PPSA99472`, a dock with Homebrew and Settings,
installed beside the store from its own image, `JobeesLair-Homebrew.exfat`. The build switch is
`packaging/homebrew-edition.sh` in the Jobee'sLair repository; its releases, when there are any, are published
here, and the app checks this repository for updates.

## License

GPL-3.0-or-later, as Jobee'sLair (see LICENSE). The index describes other people's projects; each keeps its own
license, named in its entry.
