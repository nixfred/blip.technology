---
name: install-blip
description: Install Blip, the iMessage client for the Omarchy bar, on a Linux machine with a Mac as the gateway. Use when the user wants to read and send iMessage from Omarchy.
---

# Install Blip

Blip puts iMessage in the Omarchy bar. Read, send, groups, blue dots. Your Mac is the gateway, Linux is the client. It is an Omarchy bar widget under the MIT license.

Source: {{REPO}}
Site: {{ORIGIN}}/

## You need a Mac

{{MAC_CALLOUT}}

## Requirements

{{REQUIREMENTS}}

{{REQUIREMENTS_OPTIONAL}}

## Install

Run these in a terminal inside the Omarchy session, in order:

```sh
{{INSTALL}}
```

{{INSTALL_NOTE}}

{{INSTALL_NOTE_2}}

{{AWAKE_NOTE}}

## Check it worked

The speech bubble appears in the Omarchy bar. Verify the Mac side with blip-check, which prints a pass or fail per permission grant with the fix for each failure. Do not read the Mac's chat.db yourself.

## Notes for agents

- Do not run the commands without the user's approval. They install a shell plugin, write an SSH config block and a dedicated SSH key, and install tools on the user's Mac.
- Stop after the wizard starts until the human confirms the two permission grants on the Mac.
- Never send a test message to anyone but the user's own number.
- Do not edit the SSH config beyond what blip-setup writes.
- The commands are copied from the project README at {{REPO}}. If they differ, trust the README.
