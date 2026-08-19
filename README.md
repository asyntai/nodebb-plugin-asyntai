# Asyntai AI Chatbot for NodeBB

Puts an AI assistant on your forum. A chat button sits in the corner, visitors
ask a question in their own words, and the assistant answers from your own
content in more than 80 languages.

Useful on a support or product forum, where the same questions come round every
week and nobody is awake at 2am to answer them.

Tested on NodeBB 4.15. Free, MIT licensed. You need an
[Asyntai](https://asyntai.com) account for the widget ID; there is a free plan.
Sign in at the [Asyntai dashboard](https://asyntai.com/dashboard).

## Install

From the admin control panel, open **Extend → Plugins**, search for
`asyntai`, and press install. Or install it from the command line:

```
npm install nodebb-plugin-asyntai
./nodebb build
./nodebb restart
```

Then open **Extend → Plugins → Asyntai AI Chatbot** and paste your widget ID.
You find the ID in the [Asyntai dashboard](https://asyntai.com/dashboard) under
Setup & Integration.

## Settings

**Asyntai widget ID.** The chat is on while this holds a valid ID, off when it
is empty. You can paste the whole snippet from the dashboard; the plugin keeps
only the ID and throws the rest away.

**Show the chat only to guests.** Off by default. Turn it on and members who
are signed in never see the chat, which is handy if the assistant is there to
answer newcomers rather than regulars.

**Script address.** Leave this as it is unless you host the widget yourself.

## How it works

The plugin adds one small script to the forum frontend. That script waits for
the page load event, then fetches the widget from asyntai.com. NodeBB draws
first, so page speed is unchanged, and the widget loads once per tab.

Your server never talks to Asyntai. Only the visitor's browser does. The plugin
publishes exactly three values to the page: the widget ID, the script address
and the guest-only switch. Nothing about your users or your posts.

NodeBB is a single page application. The widget survives the moves between
categories and topics, because it is loaded once and never torn down.

## Notes

The library is CommonJS rather than ESM, so the same file loads on NodeBB 3 and
on NodeBB 4.

A malformed widget ID publishes nothing at all, and a script address that is
not http or https falls back to the Asyntai address. Both rules are covered by
the tests.

## Links

- Asyntai: [asyntai.com](https://asyntai.com)
- Your dashboard: [asyntai.com/dashboard](https://asyntai.com/dashboard)

## Support

hello@asyntai.com
