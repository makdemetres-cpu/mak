/* ==========================================================================
   Ermis' Villas — shared data
   --------------------------------------------------------------------------
   The single place to change anything factual. The booking form, the contact
   page and the footer all read from here, so an estate renamed here is renamed
   everywhere.

   ⚠️  EVERYTHING MARKED "PLACEHOLDER" IS INVENTED and must be replaced before
   this site goes anywhere near a paying guest. The privacy policy and the
   booking terms are legally meaningless until BUSINESS below is real — see
   README.md → "Before you launch".
   ========================================================================== */

window.EV = window.EV || {};

/* --------------------------------------------------------------------------
   The business
   -------------------------------------------------------------------------- */
window.EV.BUSINESS = {
  tradingName: "Ermis' Villas",

  // PLACEHOLDER — the registered entity that actually signs the rental
  // agreements and appears as data controller in the privacy policy.
  legalName:   "ERMIS VILLAS P.C.",           // PLACEHOLDER
  legalForm:   "Private Company (I.K.E.)",    // PLACEHOLDER
  vatNumber:   "EL000000000",                 // PLACEHOLDER — ΑΦΜ
  gemiNumber:  "000000000000",                // PLACEHOLDER — Γ.Ε.ΜΗ.
  taxOffice:   "D.O.Y. — TBC",                // PLACEHOLDER

  // PLACEHOLDER — the registered seat, which the privacy policy must state.
  address: {
    line1:   "00 Example Street",             // PLACEHOLDER
    city:    "Athens",                        // PLACEHOLDER
    postcode:"000 00",                        // PLACEHOLDER
    country: "Greece"
  },

  // PLACEHOLDER — every contact route below.
  email:        "reservations@example.com",   // PLACEHOLDER
  privacyEmail: "privacy@example.com",        // PLACEHOLDER
  phone:        "+30 000 000 0000",           // PLACEHOLDER
  phoneHref:    "+300000000000",              // PLACEHOLDER
  whatsapp:     "+30 000 000 0000",           // PLACEHOLDER
  whatsappHref: "https://wa.me/300000000000", // PLACEHOLDER

  // Greece requires short-term rental properties to carry a registry number
  // from the AADE Short-Term Residence Property Registry, displayed on every
  // listing and advertisement. One per property.
  registryLabel: "AADE Short-Term Property Registry",

  // Social profiles. Leave a value empty and its icon simply does not render —
  // an icon that links nowhere is worse than no icon, so the footer only shows
  // the platforms you are actually on. Paste a full URL in to switch one on.
  social: {
    whatsapp:  "",   // e.g. https://wa.me/30XXXXXXXXXX  (or reuse whatsappHref)
    instagram: "",   // e.g. https://instagram.com/ermisvillas
    facebook:  ""    // e.g. https://facebook.com/ermisvillas
  },

  founded: 2019,
  founder: "Ermis",
  guests:  150,
  estates: 4
};

/* --------------------------------------------------------------------------
   The estates
   PLACEHOLDER — names, locations, capacities and rates are all invented.
   -------------------------------------------------------------------------- */
window.EV.ESTATES = [
  {
    id: 'thalassa',
    name: 'Villa Thalassa',
    place: 'Elounda, Crete',
    sleeps: 10, bedrooms: 5, baths: 5,
    from: 2400,
    registry: '00000000000',                  // PLACEHOLDER
    line: 'A headland above the Gulf of Mirabello, twelve minutes from the water by foot and forty from Heraklion by car.',
    features: ['Heated infinity pool', 'Private cove access', 'Cellar for forty', 'Staff quarters'],
    glyph: 'headland'
  },
  {
    id: 'anemos',
    name: 'Villa Anemos',
    place: 'Naoussa, Paros',
    sleeps: 8, bedrooms: 4, baths: 4,
    from: 1850,
    registry: '00000000000',                  // PLACEHOLDER
    line: 'Set back from the harbour in an old olive terrace, close enough to walk to dinner and far enough not to hear it.',
    features: ['Olive terrace', 'Outdoor kitchen', 'Roof deck', 'Two guest suites'],
    glyph: 'olives'
  },
  {
    id: 'kyma',
    name: 'Villa Kyma',
    place: 'Agios Lazaros, Mykonos',
    sleeps: 12, bedrooms: 6, baths: 6,
    from: 3600,
    registry: '00000000000',                  // PLACEHOLDER
    line: 'The largest of the four, cut into the slope so every bedroom opens level with its own terrace and the sunset.',
    features: ['60m infinity pool', 'Gym and hammam', 'Screening room', 'Helipad, 4km'],
    glyph: 'cove'
  },
  {
    id: 'elaia',
    name: 'Villa Elaia',
    place: 'Porto Heli, Peloponnese',
    sleeps: 8, bedrooms: 4, baths: 4,
    from: 1650,
    registry: '00000000000',                  // PLACEHOLDER
    line: 'The quiet one. Vineyards behind, a private jetty in front, and Spetses fifteen minutes across the water.',
    features: ['Private jetty', 'Vineyard walk', 'Tennis court', 'Boathouse'],
    glyph: 'vines'
  }
];

/* --------------------------------------------------------------------------
   The fleet
   PLACEHOLDER — confirm what is actually available before publishing.
   -------------------------------------------------------------------------- */
window.EV.CARS = [
  { id: 'maybach',  name: 'Mercedes-Maybach S-Class', seats: 3,
    note: 'The default, and the right answer for most arrivals. Rear executive seats, curtains, near silence.' },
  { id: 'phantom',  name: 'Rolls-Royce Phantom', seats: 3,
    note: 'For the arrival that is itself part of the occasion. Ask us early — it moves between the islands.' },
  { id: 'gallardo', name: 'Lamborghini Gallardo', seats: 1,
    note: 'Two seats and almost no luggage. Guests usually take it for the coast road, not the airport.' }
];

/* --------------------------------------------------------------------------
   Booking form options
   -------------------------------------------------------------------------- */
window.EV.SERVICES = [
  { id: 'transfer', label: 'Arrival & departure transfer', hint: 'Airport, port or station — with a car of your choosing.' },
  { id: 'chef',     label: 'Private chef',                 hint: 'By the evening, or for the whole stay.' },
  { id: 'experiences', label: 'Experiences & excursions',  hint: 'Boats, tables, cellars, guides.' },
  { id: 'concierge',   label: 'Dedicated concierge',       hint: 'Included with every stay — tell us anything you already know you will need.' }
];

/* Where the booking and contact forms POST.
   Leave empty and both forms fall back to opening a pre-filled email instead,
   which works on a plain static host with no backend at all. Set this to a
   form endpoint (Formspree, Netlify Forms, your own API) to collect them
   properly — and see README.md before you do, because the privacy policy
   names the processor. */
window.EV.FORM_ENDPOINT = '';

/* --------------------------------------------------------------------------
   Guest reviews
   --------------------------------------------------------------------------
   The homepage shows the four most recent reviews. Leave `url` and `anonKey`
   empty and the section runs in preview mode: the form works, the rolling four
   behave exactly as they will live, but everything is kept in the visitor's own
   browser and nobody else ever sees it. A visible note says so, and the note
   disappears by itself once the two values below are filled in.

   To make it real, see README.md → "Guest reviews". It is a Supabase project
   (free, no card) and one SQL statement; you paste the project URL and the
   *anon* key here. The anon key is designed to be public — it is in every
   visitor's browser either way — and the table's row-level security is what
   actually protects the data. Never paste the service_role key here.
   -------------------------------------------------------------------------- */
window.EV.REVIEWS = {
  url:     "",            // e.g. https://xxxxxxxx.supabase.co
  anonKey: "",            // the anon / publishable key, never service_role

  // How many to show. The oldest falls off the page as a newer one arrives.
  show: 4,

  /* ⚠️  Reviews go live the moment they are written, which is what was asked
     for and what the rolling four are built around.

     Turn this to true before you take real bookings. It costs you a tick in
     the Supabase table editor per review and it means nothing appears on your
     business's homepage at three in the morning without a person having read
     it first. It is also the honest answer to the question EU law now requires
     you to answer — whether and how you check that a review came from someone
     who actually stayed. See README.md and privacy.html §18. */
  moderated: false,

  // One review per browser per this many hours. A courtesy against double
  // taps and accidents, not a security measure — anyone determined can clear
  // their storage. Real protection is rate limiting at the database.
  cooldownHours: 12
};

/* The four the section starts with.
   PLACEHOLDER — written for layout, like everything else factual on this site.
   Real reviews push these off one at a time as they arrive, newest first. */
window.EV.SEED_REVIEWS = [
  { name: 'Villa Thalassa', rating: 5, seed: true,
    meta: 'Fourth stay · London',
    body: 'We landed at eleven at night with a sick child and a lost bag. By the time we reached the house there was a doctor’s number, a pharmacy run done, and someone had put the light on in the nursery.' },
  { name: 'Villa Kyma', rating: 5, seed: true,
    meta: 'Second stay · Zürich',
    body: 'I have booked a lot of houses that photograph better than they live. This is the first one I have walked into and thought: he actually stays here himself.' },
  { name: 'Villa Elaia', rating: 5, seed: true,
    meta: 'Sixth stay · Thessaloniki',
    body: 'The chef asked what my mother used to cook. On the last night he made it, badly on purpose, exactly the way she did. My father did not speak for a minute.' },
  { name: 'Villa Anemos', rating: 4, seed: true,
    meta: 'First stay · Copenhagen',
    body: 'The house is quieter than the photographs suggest, which turned out to be the point. We asked for a boat on the Tuesday and had one by lunchtime.' }
];

/* --------------------------------------------------------------------------
   Campaign attribution
   --------------------------------------------------------------------------
   When someone arrives on a tagged link — an Instagram bio, a partner's page,
   an email — the utm_* parameters are read from the URL and kept for the length
   of that visit only, then attached to whatever enquiry they send. It is how
   you find out that a €25,000 booking came from one particular post.

   Deliberately narrow: our own storage, nothing shared with anyone, cleared
   when the tab closes, and disclosed in privacy.html §9. Set this to false and
   nothing is read or stored at all.
   -------------------------------------------------------------------------- */
window.EV.TRACK_CAMPAIGN = true;
