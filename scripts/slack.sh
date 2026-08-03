#!/bin/bash
# Slack helpers (DND/snooze, status) driven by a user token.
#
# Requires SLACKPCUSERKEY -- a Slack user OAuth token, exported outside this
# repo (never commit it).
#
# TODO: support multiple workspaces by selecting a different key per target.

# Note: `$(SLACKPCUSERKEY)` here would be *command substitution* -- bash would
# try to run SLACKPCUSERKEY as a command and print "command not found", losing
# the variable name from the message. Braces are what interpolate the name.
if [[ -z "${SLACKPCUSERKEY}" ]]; then
	echo "Missing SLACKPCUSERKEY environment variable." >&2
	exit 1
fi

slack_dnd_on() {
	local MINUTES="$1"
	if [[ "$MINUTES" == "" ]]; then
		MINUTES="5"
	fi
	curl --location 'https://slack.com/api/dnd.setSnooze?num_minutes='"$MINUTES"'' \
		--header 'Authorization: Bearer '"$SLACKPCUSERKEY"''
}

slack_dnd_off() {
	curl --location 'https://slack.com/api/dnd.endSnooze' \
		--header 'Authorization: Bearer '"$SLACKPCUSERKEY"''
}

slack_status() {
	local TEXT="$1"
	local EMOJI="$2"
	local EXP="$3"
	if [[ "$EXP" == "" ]]; then
		EXP="0"
	else
		local NOW=$(date +%s)
		EXP=$(($NOW + $EXP * 60))
	fi

	curl --location 'https://slack.com/api/users.profile.set' \
		--header 'Authorization: Bearer '"$SLACKPCUSERKEY"'' \
		--header 'Content-Type: application/json; charset=utf-8' \
		--data '{
      "profile": {
          "status_emoji": "'"$EMOJI"'",
          "status_text": "'"$TEXT"'",
          "status_expiration": "'"$EXP"'"
      }
  }'
}

slack_status_clear() {
	slack_status "" "" ""
}

slack_afk() {
	local TIMER="$1"
	if [[ "$TIMER" == "" ]]; then
		TIMER="5"
	fi

	local NOW=$(date +%s)
	local END=$(($NOW + $TIMER * 60))
	local ENDTEXT=$(echo $(date -r "$END" +"%l:%M %p"))
	local TEXT="AFK until $ENDTEXT, SMS if urgent"
	local EMOJI=":no_entry:"

	slack_status "$TEXT" "$EMOJI" "$END"
	slack_dnd_on "$TIMER"
}

slack_dnd() {
	if [[ "$1" == "on" ]]; then
		slack_dnd_on $2
	else
		slack_dnd_off
	fi
}

# Args MUST stay quoted here. Unquoted "$2" word-splits, so the documented
# example `./slack.sh status "Out surfing" ":man-surfing:" "180"` used to arrive
# as TEXT="Out", EMOJI="surfing", EXP=":man-surfing:".
case "$1" in
"afk")
	slack_afk "$2"
	;;
"dnd")
	slack_dnd "$2" "$3"
	;;
"status")
	slack_status "$2" "$3" "$4"
	;;
*)
	cat <<EOF
Syntax is './slack.sh <command>' where command must be one of 'afk', 'status', or 'dnd'

Examples:
  Set status to the away from keyboard (afk) message for 30mins:

  ./slack.sh afk 30

  Turn on do not disturb for 60 minutes:

  ./slack.sh dnd 60

  Set slack status to "Out surfing" with a surfing emoji for 3 hours:

  ./slack.sh status "Out surfing" ":man-surfing:" "180"
EOF
	;;
esac
