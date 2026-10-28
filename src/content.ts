// All page copy and facts live here. The build renders index.html, index.md,
// the agent skill and the WebMCP tool text from this one file.
// Rules: short sentences, plain English, no dashes used as punctuation,
// nothing that is not in https://github.com/nixfred/blip (README, manifest.json).

export const SITE = {
  origin: 'https://blip.technology',
  name: 'Blip',
  repo: 'https://github.com/nixfred/blip',
  repoSlug: 'nixfred/blip',
  readmeRaw: 'https://raw.githubusercontent.com/nixfred/blip/main/README.md',
  home: 'https://nixfred.com/',
  email: 'frednix@gmail.com',
  title: 'Blip: iMessage in the Omarchy bar',
  description:
    'Blip puts iMessage in the Omarchy bar. Read, send, groups, blue dots. Your Mac is the gateway, Linux is the client. MIT licensed.',
}

export const TAGLINE = 'iMessage in the Omarchy bar.'
export const SUB =
  'Read, send, groups, blue dots. Your Mac is the gateway, Linux is the client. An Omarchy bar widget under the MIT license.'

export const MAC_CALLOUT_TITLE = 'You need a Mac. That is the whole trick.'
export const MAC_CALLOUT =
  'Blip does not reimplement iMessage. Apple\'s protocol only runs on Apple hardware, so Blip uses a Mac you already own as the gateway: any Mac signed into your Apple ID, awake and reachable over SSH. The Linux side is a thin client. No Mac, no Blip. When the Mac sleeps, Blip dims and waits.'

// Verbatim from the repo README, Install steps 1 and 2. The build compares
// these to the live README and warns if they drifted.
export const INSTALL_LINES = [
  'omarchy plugin add https://github.com/nixfred/blip.git --enable --yes',
  '~/.config/omarchy/plugins/nixfred.blip/scripts/blip-setup you@your-mac',
]
export const INSTALL = INSTALL_LINES.join('\n')

export const INSTALL_INTRO =
  'Two commands, copied from the project README. The first installs the plugin and adds the bar widget. The second runs the setup wizard for the bridge to your Mac.'

export const REQUIREMENTS = [
  'A Mac on macOS 13 Ventura or newer, signed into Messages with your Apple ID, reachable from the Linux box over SSH with key auth. Tailscale is recommended.',
  'Messages in iCloud turned on, so the Mac mirrors your phone.',
  'Xcode Command Line Tools on the Mac (xcode-select --install).',
  'Linux: Omarchy (Hyprland plus the Omarchy shell), with bun, jq, openssh, libnotify, wl-clipboard and xdg-utils. The wizard checks for each and prints the pacman line for what is missing.',
]
export const REQUIREMENTS_OPTIONAL =
  'Optional: ffmpeg and mpv for voice messages. zenity for the Save vCard folder picker.'
export const INSTALL_NOTE =
  'The wizard pauses for two permission grants on the Mac: Full Disk Access for /usr/libexec/sshd-keygen-wrapper, and Automation for Messages on the first send. The Mac needs a screen, or Screen Sharing, once. Budget ten minutes.'
export const INSTALL_NOTE_2 =
  'Run the install from a terminal inside your Omarchy session. Nothing sends a message until you press Enter in a conversation.'
export const AWAKE_NOTE =
  'After setup, the Mac must stay in a logged-in desktop session with Messages able to run, and it must not sleep. A sleeping Mac is an unreachable gateway: the widget dims and says so.'

export const DEMO_ALT_APP =
  'The Blip app window with demo data: a conversation list on the left, a thread with two demo photos, a reply and a read receipt on the right'
export const DEMO_ALT_PANEL =
  'The Blip bar popout with demo data: pinned conversations as tiles above the thread list'
export const DEMO_ALT_PANEL_CONV =
  'A conversation in the Blip bar popout with demo data: two demo photos from one message, a reply and a read receipt'
export const DEMO_CAPTION =
  'Demo data. Every screenshot is the real client rendered against invented people. The project\'s demo script points the shipping code at a fake bridge, so nothing here is anyone\'s conversation. The numbers are in the 555-0100 range reserved for fiction.'

export const FEATURES = [
  {
    tag: 'Bar',
    title: 'Unread count in the bar',
    body:
      'The bar widget shows the unread count across every thread. It dims with a slashed glyph when the Mac is unreachable. Left-click opens the panel, double-click opens the app window, middle-click refreshes, right-click marks all read.',
    short: 'Unread count across every thread. It dims with a slashed glyph when the Mac is unreachable.',
  },
  {
    tag: 'Threads',
    title: 'Blue dots, groups, pins',
    body:
      'A blue dot stays until you open that conversation, the way iMessage does it. Groups are titled the way Messages titles them. Pinned conversations are mirrored from Messages on the Mac, in the same order, as avatar tiles above the list.',
    short: 'A blue dot stays until you open that conversation. Pins are mirrored from Messages, read-only.',
  },
  {
    tag: 'Messages',
    title: 'Read and send',
    body:
      'Real bubbles, yours blue on the right and theirs grey on the left. Send to people and to groups. Photos render inline, files send by Ctrl+V, drag and drop or /attach, and the "Read" receipt shows under your last read message. Tapbacks, inline replies and link cards show too.',
    short: 'Send to people and groups. Photos render inline, files send with a caption, and read receipts show.',
  },
  {
    tag: 'App',
    title: 'A Messages-style window',
    body:
      'A window with a sidebar of every conversation, the open thread and a compose box, next to the bar popout. Open it with SUPER+M after adding the keybind from the README, or double-click the bar icon. It remembers its size across shell restarts.',
    short: 'A Messages-style window: sidebar, thread and compose. SUPER+M opens it once you add the keybind.',
  },
  {
    tag: 'Toasts',
    title: 'Desktop toasts, on your terms',
    body:
      'Desktop notifications fire only for senders on your allowlist. Everything else still counts and still shows, it just does not interrupt you. Click a toast and the panel opens on that conversation with the compose box focused.',
    short: 'Toasts only for senders on your allowlist. Everything else still counts. Click a toast to reply.',
  },
  {
    tag: 'Private',
    title: 'Real time, nothing in the clear',
    body:
      'A push watcher on the Mac pings when chat.db changes, so messages land in about 2 seconds. There is no server, no telemetry and no accounts. Everything between the two machines travels inside SSH on a dedicated key, and message text never lands on disk.',
    short: 'Messages land in about 2 seconds. No server, no telemetry, no accounts. Everything travels inside SSH.',
  },
]

export const CANT_DO =
  'What it cannot do: work without a Mac, or while the Mac sleeps. Blip displays edits and threaded replies but does not send them.'
