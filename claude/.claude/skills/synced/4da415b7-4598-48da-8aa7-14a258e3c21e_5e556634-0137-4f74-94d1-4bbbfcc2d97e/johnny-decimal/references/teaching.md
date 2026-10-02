# Teaching the system to a colleague

Someone new has a Notion login and no idea why the pages have numbers on them. The goal is
not that they can recite the rules — it's that they can find a document without asking, and
file one without creating a mess. Those are different skills and the first one matters more,
because most people only ever read.

Two failure modes to avoid. Explaining the whole thing before they've needed any of it
(they forget it all). And handing over a document instead of a conversation (they don't read
it, and you never find out what they misunderstood).

## Teach in this order

The order matters, because each step is what makes the next one make sense.

**1. Why numbers at all.** Start with the problem, not the solution. Folder names get
renamed, translated, reorganised and argued about; a number survives all of that. It also
gets spoken — "it's in 45.13" is a sentence people say. Two minutes.

**2. The three levels.** Area → category → ID, with one real example held open in front of
them: `40-49 Rekstur` → `46 Umbúðir og pökkunarfyrirmæli` → `46.03 Thermoboxes -
Hitakassar`. Let them see the three levels in the sidebar rather than describing them.

**3. The number is an address, not a description.** `46` means packaging. `46.03` means
nothing — it's the third page filed in 46. Almost every later rule follows from this, so
don't move on until it's landed. The test question: *"if we stopped using thermoboxes, what
happens to 46.03?"* Right answer: the page gets marked retired and the number stays dead
forever. Nothing else inherits it.

**4. The three knowledge bases.** Which entity, and why the same nine areas appear in all
three. Most people only ever need one tree — tell them which one is theirs and mention the
others exist so they aren't confused when they land in one.

**5. How to find something.** Entity → area → the KB's index page → the category. Then the
shortcut: search the topic in both languages. This is the part they'll use daily.

**6. How to file something.** Only for people who will actually write documents. Search
first, highest plus one, number first in the title, create it under the category page.

**7. What not to do.** Short and blunt: don't reuse a number, don't fill a gap, don't
renumber to tidy up, don't move someone else's page. Say that spotting a problem is useful
and fixing it silently isn't.

Stop after step 5 for most people. Steps 6 and 7 are for the handful who create pages.

## Exercises

Use these rather than explaining. Ask, let them reason out loud, then give the answer and
the rule it demonstrates. All of them are real pages in Maul í Reykjavík — check the current
index before running them, since ranges move.

**1. Where would you look for how thermoboxes get returned?**
`40-49 Rekstur` → `46 Umbúðir og pökkunarfyrirmæli` → `46.03`. *Rule: what we do with a
thing is operations.*

**2. And for who we buy thermoboxes from?**
`20-29 Birgjar` → `22 Umbúðir birgjar - pakkningar` → `22.02 Fastus er birgi fyrir litla
hitakassa`. *Rule: who we buy from is suppliers, what we do with it is operations. One
topic, two halves, two numbers — and this is the single most common source of "I couldn't
find it".*

Worth doing this one with the category page open, because they'll see `22.02 Vesture er
birgi fyrir hitagel` sitting directly underneath it. Let them notice. It sets up exercise 7
and it teaches the more important thing: the system has real defects and noticing them is
useful.

**3. You've written a new accounting process. What number?**
`44 Bókhaldsferli` runs to 44.11, so `44.12`. *Rule: highest plus one.*

**4. `23 Aðrir birgjar` runs 23.01–23.21, then jumps to 23.29 and runs to 23.39. A new
supplier — which number?**
`23.40`. Not 23.22. *Rule: gaps are retired numbers and stay dead.* This is the one people
get wrong, and they get it wrong because filling the gap feels tidy.

**5. We have forty workplace customers. Do they each get a number?**
No. `32 Vinnustaðir í viðskiptum` holds nine unnumbered pages on purpose. *Rule: numbers are
for documents, not records — a list that grows forever wants a database.*

**6. The ops manager wrote a guide to training new drivers. Where does it go?**
`41 Rúntar og útkeyrsla` — driver operations — not `12 Menntun`, even though it's training
and even though a manager wrote it. *Rule: subject matter decides, not authorship or job
title.* Then the follow-up that teaches the more important habit: search first, because
`41.17 Maul skólinn` already exists and the answer is to extend it, not to mint 41.21.

**7. So — two pages both numbered 22.02. What do you do?**
Report it. Don't renumber either one. *Rule: spotting is useful, fixing silently isn't —
somebody has to work out which page owns the number, and the wrong choice sends every
existing reference to the wrong page.* It's already on the register in the Notes column of
`1.02`, which is the answer to "was I supposed to tell someone?": yes, and someone did.

Exercise 2 and exercise 6 are the two worth keeping if you only have ten minutes.

### Better still: teach from a fresh audit

Those exercises are stock. If a `jd-audit` report exists for a branch the person actually
works in, build the walkthrough from that instead. A duplicate they just saw in their own
category teaches never-reuse better than `23.40` ever will, and a settled entry from `1.05`
teaches "some oddities are decisions" with evidence rather than assertion. This is why
`jd-audit` ends by offering the walkthrough — take it up when it's offered.

Map the findings to the lessons:

| What the report found | What it teaches |
|---|---|
| A duplicate number | The number is an address, and two pages can't share one |
| A gap in the sequence | A gap is a grave, not a free slot |
| An ID filed outside its category | The one guarantee the system makes, and what breaks without it |
| A settled entry on `1.05` | Some oddities are deliberate — ask before fixing |
| An empty or self-contradicting page | Numbering is the easy half |
| A process nobody is responsible for | The number says where it lives, not who keeps it true |

One rule when you do this: run the closing two-question check on pages the report *didn't*
mention. Otherwise you're testing whether they remember the report, not whether they can use
the system.

## The misconceptions that actually bite

Watch for these; they're what people arrive with.

**"The number describes the content."** It's an address. This is the root of most of the
others.

**"A gap is an unused slot."** It's a grave. Filling it resurrects a number that other
systems still point at.

**"Renumbering makes it tidier."** Renumbering is the most expensive operation in the
system. Untidy and working beats tidy and broken; slight mess is a feature of a
long-lived index.

**"Everything gets a number."** Documents do. Customers, suppliers, drivers and assets are
records — they belong in a database, one row each.

**"It's in the wrong place, so I'll move it."** Notion has no undo across pages, and someone
who knew where it was now doesn't. Report it.

**"I'll use `/link` to point at another page."** In Notion that creates a sub-page and
quietly changes the hierarchy. Use an `@` mention or an inline link on selected text. This
is Maul's own documented rule and it's the main source of accidental nesting.

**"The system is clean, so anything odd is my mistake."** It isn't clean. Around 500
numbered pages, several duplicate numbers, a handful of misfiles, some empty categories. Say
this out loud — a newcomer who assumes the system is immaculate concludes they're the
problem and stops trusting it. The Notes column on the index pages is the register of what's
known.

**And some oddities are deliberate.** Maul ehf.'s `12 Education` encodes a cross-reference in
its second pair — `12.71` points at area 70-79. Reykjavík's `23` and `24` order their pages
current-before-retired rather than numerically. Reykjavík's `12` has a `12.42` that may be
the same cross-reference convention or may be a defect; nobody has settled it. The lesson is
the useful part: when something looks wrong but *consistent*, ask before treating it as a
bug.

## The hand-out

Written material is a supplement, not a substitute. Its job is to be there when the person
has forgotten the conversation, so it should be short enough to read in three minutes and
end with where to look next.

**It belongs on `0 Númerakerfið - Johnny Decimal`** under `0-9 Getting started`. That page
exists for exactly this and is currently three lines long, with what look like leftover
scratch notes on it ("Setjum texta hvar sem er í Notion", "Hafa top level síðu...", "Reset
app og local data"). Extend that page. Do not create a second explainer somewhere else —
two documents explaining one system is the failure the system exists to prevent, and it
would be a funny way to fail.

Two things before writing to it: clearing the scratch lines is an edit to someone else's
page, so ask first (`maul-notion-writes` has the pattern), and link to `1 Index -
Efnisyfirlit` for the area skeleton rather than copying the table in. One copy of the map.

Match the language to the audience. Reykjavík operations staff read Icelandic; Maul ehf.
material is in English.

### Icelandic

```markdown
# Númerakerfið — fljótleg leiðsögn

Allar síður hér hafa númer, t.d. `46.03`. Númerið er *heimilisfang* síðunnar. Það breytist
ekki þótt titillinn breytist, og það er notað eins í Notion og í Google Drive.

## Þrjú þrep

- **Svið** — `40-49 Rekstur`. Níu svið, þau sömu í öllum þrem þekkingargrunnum.
- **Flokkur** — `46 Umbúðir og pökkunarfyrirmæli`.
- **Skjal** — `46.03 Thermoboxes`. Þetta er síðan sjálf.

`46` þýðir umbúðir. `46.03` þýðir ekkert sérstakt — það er þriðja síðan sem var sett í
flokk 46. Númerið segir hvar síðan er, ekki hvað hún fjallar um.

## Að finna eitthvað

1. Hvaða fyrirtæki? Rekstur í Reykjavík → **Maul í Reykjavík**. Hugbúnaður, vara,
   fjárfestar → **Maul ehf.**
2. Hvaða svið? Níu möguleikar — veldu eftir því hvað hluturinn *fjallar um*.
3. Opnaðu yfirlitssíðuna fyrir þekkingargrunninn (`1 Index`) og finndu flokkinn.
4. Opnaðu flokkinn og skoðaðu síðurnar.

Eða leitaðu einfaldlega — bæði á íslensku og ensku, því grunnarnir eru á báðum málum.

## Ef þú skrifar nýja síðu

- **Leitaðu fyrst.** Oft er síðan þegar til, hálfskrifuð. Betra að fylla hana en að búa til
  aðra.
- **Hæsta númerið plús einn.** Ef flokkurinn endar í 44.11 fær nýja síðan 44.12.
- **Aldrei fylla í skarð.** Skarð þýðir að eitthvað var eytt eða flutt. Gamla númerið gæti
  enn verið notað í Drive eða í minni fólks. Skörð eru ókeypis; tvöföld númer kosta tíma.
- **Númerið fremst í titlinum:** `46.03 Thermoboxes`, ekki `Thermoboxes - 46.03`.
- **Búðu síðuna til inni í flokknum**, ekki við hliðina á honum. Notaðu `@` til að vísa í
  aðrar síður — `/link` býr til undirsíðu og breytir uppbyggingunni.

## Þrennt sem á ekki að gera

Ekki endurnýta númer sem hefur verið tekið úr notkun. Ekki breyta númeri til að snyrta til.
Ekki færa síður sem aðrir eiga — segðu frá í staðinn.

Kerfið er ekki fullkomið: sum númer eru notuð tvisvar og einhverjar síður eru á vitlausum
stað. Það er skráð í athugasemdirnar á yfirlitssíðunum. Ef þú finnur eitthvað sem stemmir
ekki, þá er það líklega þekkt — og gott að segja frá.

Meira: `1 Index - Efnisyfirlit` og `0 Númerakerfið`.
```

### English

Same structure, with the entity guidance flipped toward Maul ehf.: software, product,
infrastructure, investors and group-wide policy live there, and its 40s are the software
that supports the operation rather than the physical operation itself. That distinction —
identical numbers meaning different things in different trees — is the one thing an English
reader needs that an Icelandic reader mostly doesn't.

## Checking it landed

Don't ask "does that make sense?" — people say yes. Ask them to do two things:

1. **Find a page you haven't mentioned.** "Where would the invoice approval process be?"
   They should reason area → category rather than reach for search.
2. **Place something new.** "You've written up how we handle a customer complaint — where
   does it go, and what number?" Getting the category right matters; getting the exact
   number right doesn't.

If they reach for search both times, that's fine — searching is a legitimate way to use the
system and most people never need more. The thing you actually want to hear is *"that would
be operations, so 40s"*. Once they think in areas, the rest is lookup.
