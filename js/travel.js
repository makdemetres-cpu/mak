/* ==========================================================================
   Ermis' Villas — arrival reference data
   --------------------------------------------------------------------------
   Where a guest can actually be met, and who they can actually arrive with.

   Why this file exists: "Picking up from" and "Flight or crossing" used to be
   two empty text boxes, and an empty text box accepts anything — including
   "jtyi45oy4", which is what somebody typed into it. A driver cannot be sent
   to that. So neither field is typed any more: the airport, the port, the
   airline and the ferry line are all chosen from the lists below, and the
   only thing still keyed in by hand is the flight's number, which is digits.

   What this does and does not prove
   ---------------------------------
   Choosing from these lists guarantees the airport is a real airport, the
   airline is a real airline, and that "A3 352" is a well-formed flight
   designator. It does NOT prove that A3 352 flies on the day in question —
   that needs a live schedules feed from a commercial flight-data provider,
   which is a paid subscription and a new processor to name in the privacy
   policy. Until that is wired in, treat a flight number here as "the guest
   says so", the same as any other thing they tell us.

   ⚠️  BEFORE LAUNCH — the airports, ports and operators below are real, but
   they were chosen to match the PLACEHOLDER estate locations in js/data.js.
   When the four houses become real ones, revisit `POINTS` so every entry is
   somewhere a driver would genuinely be sent. See README.md → "Before you
   launch".

   Loaded only by booking.html — no other page has an arrival to describe.
   ========================================================================== */

window.EV = window.EV || {};

/* --------------------------------------------------------------------------
   Where we meet people
   --------------------------------------------------------------------------
   Keyed by estate id, so a guest arriving at Villa Kyma on Mykonos is never
   offered a Cretan port. `kind` splits the list between the two arrival
   modes; `code` is the IATA airport code where there is one, and is shown
   beside the name because that is what appears on a boarding pass.
   -------------------------------------------------------------------------- */
window.EV.ARRIVAL_POINTS = {
  thalassa: [
    { id: 'her',  kind: 'air', code: 'HER', name: 'Heraklion Airport',    sub: 'Nikos Kazantzakis — 1h 10m by road' },
    { id: 'jsh',  kind: 'air', code: 'JSH', name: 'Sitia Airport',        sub: 'The small one — 1h by road' },
    { id: 'herp', kind: 'sea', name: 'Heraklion Port',                    sub: 'The overnight boat from Piraeus' },
    { id: 'agn',  kind: 'sea', name: 'Agios Nikolaos Port',               sub: 'Twenty minutes from the house' }
  ],
  anemos: [
    { id: 'pas',  kind: 'air', code: 'PAS', name: 'Paros Airport',        sub: 'Alyki — 25m by road' },
    { id: 'jmk',  kind: 'air', code: 'JMK', name: 'Mykonos Airport',      sub: 'With the crossing on from there' },
    { id: 'par',  kind: 'sea', name: 'Parikia Port',                      sub: 'The main harbour — 15m by road' },
    { id: 'nao',  kind: 'sea', name: 'Naoussa Port',                      sub: 'Five minutes from the house' }
  ],
  kyma: [
    { id: 'jmk',  kind: 'air', code: 'JMK', name: 'Mykonos Airport',      sub: 'Delos — 15m by road' },
    { id: 'mykn', kind: 'sea', name: 'Mykonos New Port',                  sub: 'Tourlos — where the big boats come in' },
    { id: 'myko', kind: 'sea', name: 'Mykonos Old Port',                  sub: 'Chora — the fast boats' }
  ],
  elaia: [
    { id: 'ath',  kind: 'air', code: 'ATH', name: 'Athens Airport',       sub: 'Eleftherios Venizelos — 2h 30m by road' },
    { id: 'pkh',  kind: 'air', code: 'PKH', name: 'Porto Heli Aerodrome', sub: 'Private and charter only — 10m by road' },
    { id: 'phl',  kind: 'sea', name: 'Porto Heli Port',                   sub: 'Ten minutes from the house' },
    { id: 'kos',  kind: 'sea', name: 'Kosta Port',                        sub: 'The Spetses crossing' },
    { id: 'pir',  kind: 'sea', name: 'Piraeus Port',                      sub: 'Athens — 2h 30m on by road' }
  ]
};

/* Offered when no house has been chosen yet, so the field is never empty of
   options. Every one of these is somewhere all four houses can be reached
   from. */
window.EV.ARRIVAL_POINTS_ANY = [
  { id: 'ath',  kind: 'air', code: 'ATH', name: 'Athens Airport',   sub: 'Eleftherios Venizelos' },
  { id: 'her',  kind: 'air', code: 'HER', name: 'Heraklion Airport', sub: 'Crete' },
  { id: 'jmk',  kind: 'air', code: 'JMK', name: 'Mykonos Airport',  sub: 'Delos' },
  { id: 'pas',  kind: 'air', code: 'PAS', name: 'Paros Airport',    sub: 'Alyki' },
  { id: 'pir',  kind: 'sea', name: 'Piraeus Port',                  sub: 'Athens' }
];

/* --------------------------------------------------------------------------
   Airlines
   --------------------------------------------------------------------------
   Carriers that serve Greek airports, with their IATA designator — the two
   characters printed in front of the flight number on the boarding pass.
   The designator is what makes the number checkable: "A3" plus digits is a
   flight, "oyo4yo4" is not.

   Not exhaustive, and deliberately so: a list of every carrier on earth is
   unreadable, and the point of the list is that everything in it is real. A
   guest flying with someone who is not here says so in the notes on the next
   step, which is one line of typing and reaches us just the same.
   -------------------------------------------------------------------------- */
window.EV.AIRLINES = [
  /* Greek carriers first — most arrivals are on one of these three. */
  { code: 'A3', name: 'Aegean Airlines',   group: 'Greece' },
  { code: 'OA', name: 'Olympic Air',       group: 'Greece' },
  { code: 'GQ', name: 'Sky Express',       group: 'Greece' },

  { code: 'FR', name: 'Ryanair',           group: 'Low cost' },
  { code: 'U2', name: 'easyJet',           group: 'Low cost' },
  { code: 'W6', name: 'Wizz Air',          group: 'Low cost' },
  { code: 'V7', name: 'Volotea',           group: 'Low cost' },
  { code: 'VY', name: 'Vueling',           group: 'Low cost' },
  { code: 'PC', name: 'Pegasus Airlines',  group: 'Low cost' },
  { code: 'HV', name: 'Transavia',         group: 'Low cost' },
  { code: 'TO', name: 'Transavia France',  group: 'Low cost' },
  { code: 'DY', name: 'Norwegian',         group: 'Low cost' },
  { code: 'LS', name: 'Jet2',              group: 'Low cost' },
  { code: 'BY', name: 'TUI Airways',       group: 'Low cost' },
  { code: 'X3', name: 'TUI fly',           group: 'Low cost' },
  { code: 'DE', name: 'Condor',            group: 'Low cost' },
  { code: 'EW', name: 'Eurowings',         group: 'Low cost' },

  { code: 'BA', name: 'British Airways',   group: 'Europe' },
  { code: 'AF', name: 'Air France',        group: 'Europe' },
  { code: 'KL', name: 'KLM',               group: 'Europe' },
  { code: 'LH', name: 'Lufthansa',         group: 'Europe' },
  { code: 'LX', name: 'SWISS',             group: 'Europe' },
  { code: 'OS', name: 'Austrian Airlines', group: 'Europe' },
  { code: 'SN', name: 'Brussels Airlines', group: 'Europe' },
  { code: 'AZ', name: 'ITA Airways',       group: 'Europe' },
  { code: 'IB', name: 'Iberia',            group: 'Europe' },
  { code: 'TP', name: 'TAP Air Portugal',  group: 'Europe' },
  { code: 'SK', name: 'SAS',               group: 'Europe' },
  { code: 'AY', name: 'Finnair',           group: 'Europe' },
  { code: 'LO', name: 'LOT Polish Airlines', group: 'Europe' },
  { code: 'BT', name: 'airBaltic',         group: 'Europe' },
  { code: 'FI', name: 'Icelandair',        group: 'Europe' },
  { code: 'OU', name: 'Croatia Airlines',  group: 'Europe' },
  { code: 'JU', name: 'Air Serbia',        group: 'Europe' },
  { code: 'RO', name: 'TAROM',             group: 'Europe' },
  { code: 'KM', name: 'KM Malta Airlines', group: 'Europe' },
  { code: 'WK', name: 'Edelweiss Air',     group: 'Europe' },
  { code: 'TK', name: 'Turkish Airlines',  group: 'Europe' },

  { code: 'EK', name: 'Emirates',          group: 'Long haul' },
  { code: 'QR', name: 'Qatar Airways',     group: 'Long haul' },
  { code: 'EY', name: 'Etihad Airways',    group: 'Long haul' },
  { code: 'FZ', name: 'flydubai',          group: 'Long haul' },
  { code: 'DL', name: 'Delta Air Lines',   group: 'Long haul' },
  { code: 'UA', name: 'United Airlines',   group: 'Long haul' },
  { code: 'AA', name: 'American Airlines', group: 'Long haul' },
  { code: 'AC', name: 'Air Canada',        group: 'Long haul' },
  { code: 'MS', name: 'EgyptAir',          group: 'Long haul' },
  { code: 'ET', name: 'Ethiopian Airlines', group: 'Long haul' },
  { code: 'LY', name: 'EL AL',             group: 'Long haul' },
  { code: '6H', name: 'Israir',            group: 'Long haul' },
  { code: 'SQ', name: 'Singapore Airlines', group: 'Long haul' }
];

/* --------------------------------------------------------------------------
   Ferry lines
   --------------------------------------------------------------------------
   The operators running the routes that reach the four houses. A crossing
   has no equivalent of a flight number that a guest reliably knows, so we
   ask for the line and the time it docks, which is what the driver needs.
   -------------------------------------------------------------------------- */
window.EV.FERRY_LINES = [
  { id: 'bluestar', name: 'Blue Star Ferries' },
  { id: 'seajets',  name: 'SeaJets' },
  { id: 'fast',     name: 'Fast Ferries' },
  { id: 'golden',   name: 'Golden Star Ferries' },
  { id: 'minoan',   name: 'Minoan Lines' },
  { id: 'anek',     name: 'ANEK Lines' },
  { id: 'hsw',      name: 'Hellenic Seaways' },
  { id: 'aegean',   name: 'Aegean Speed Lines' },
  { id: 'private',  name: 'A private boat' }
];

/* --------------------------------------------------------------------------
   Lookups, so booking.js never has to scan these itself
   -------------------------------------------------------------------------- */
window.EV.travel = {
  pointsFor(estateId) {
    return window.EV.ARRIVAL_POINTS[estateId] || window.EV.ARRIVAL_POINTS_ANY;
  },
  pointById(estateId, id) {
    return this.pointsFor(estateId).filter((p) => p.id === id)[0] || null;
  },
  airlineByCode(code) {
    return window.EV.AIRLINES.filter((a) => a.code === code)[0] || null;
  },
  ferryById(id) {
    return window.EV.FERRY_LINES.filter((f) => f.id === id)[0] || null;
  },

  /* A flight number is 1–4 digits. Nothing else: no letters, no spaces, no
     leading zero-padding games. The airline half of the designator comes from
     the list, so there is nothing to validate there. */
  validFlightNumber(s) {
    return /^[1-9][0-9]{0,3}$/.test(String(s).trim());
  },

  /* "21:40", 24-hour. Empty is allowed — plenty of people book before they
     know the time — but a half-written one is not. */
  validTime(s) {
    const v = String(s).trim();
    return v === '' || /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
  }
};
