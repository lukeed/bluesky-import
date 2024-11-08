# bluesky-import

> (more) quickly find the GitHub and/or Twitter accounts you follow on [Bluesky](https://bsky.app/)~!

Includes two scripts and a (rough, but functional) UI to automate searcing & following of Bluesky accounts – at your command.

Absolutely no credentials are saved. In fact, you will have to reauthenticate every time you run a script or open the UI viewer.

https://github.com/user-attachments/assets/62809278-e6b9-4258-b972-927f3f406127


## Setup

1. Install [Deno](https://docs.deno.com/runtime/#install-deno)
2. Clone this GitHub repository
3. Have a Bluesky account

## GitHub

Find your GitHub follows' Bluesky accounts... if they've added it to their profiles.

> You will be prompted for a `GITHUB_TOKEN` that can access to your follows.
> 1. [Create a new (PAT) Personal Access Token](https://github.com/settings/personal-access-tokens/new)
> 2. Go to "Account Permissions" > "Followers" > "Read-only"

```sh
$ deno task github
```

A `export/github.json` file will be created. <br>You can open this in the viewer:

```sh
$ deno task view export/github.json
```

## Twitter

The Twitter API doesn't let you do anything, unless you pay big $$$ for Enterprise access... good thing we know our way around DevTools :wink:

1. Log into your Twitter account
2. Go to `https://twitter/com/following`
3. Copy & paste [`src/twitter.js`](src/twitter.js) into the Console
4. When it's done, run `copy(users)` in the Console
5. Paste the clipboard contents into a new `export/twitter.json` file

You may then open this in the viewer:

```sh
$ deno task view export/twitter.json
```

## Viewer

The viewer is a simple server and client, allowing you to read from & write to an existing `export/*.json` file.

Any first interaction with Bluesky will require you to login. This creates a local, in-memory session for the duration of your Viewer.

Any changes you make within the UI (eg; narrowing a search or following account(s)) unlock your ability to `Save Changes`. Pressing this button will sync all changes to your `export/*.json` file so that you can resume your progress the next time you open the viewer.

### Searching

AFAICT, Bluesky search seems pretty basic, where all keywords are restrictively additive — aka, everything operates as an `AND` condition. Because of this, I found it more reliable to search by GitHub **usernames** when viewing GitHub data & to search by Twitter **names** when viewing Twitter data.

It's not perfect, but was the best approaching when trying to find matches for my lists 😅

When search results appear, you are prompted to select the correct result. This is only a selection & does not follow the account.

## License

MIT
