<?php
/**
 * Vet Care — reviews quoted by hand from the clinic's Google listing
 * ---------------------------------------------------------------------------
 * These are REAL reviews, copied word for word from Google. They are kept here
 * rather than fetched through the Places API so the section works with no
 * Google Cloud account, no API key, no card on file and no monthly quota.
 *
 * They are pinned: they always appear, ahead of anything else. Reviews left
 * through the website's own form fill whatever slots remain.
 *
 * RULES FOR EDITING — these matter, because this is other people's writing:
 *   · Copy the wording EXACTLY, including punctuation and typos. Tidying up
 *     someone's review changes what they said.
 *   · Only quote reviews that are actually on the clinic's Google listing.
 *     Never write one. An invented review is a fake testimonial, and both
 *     unlawful and obvious to readers.
 *   · 'translation' is optional and is shown, clearly labelled as a
 *     translation, only when a visitor switches the site to English. Leave it
 *     empty and English visitors simply see the Greek original.
 *   · 'author' and 'rating' are optional, and nothing is invented to stand in
 *     for them: with no name the card carries no name, with no rating it
 *     carries no stars. Fill them in from the Google listing and the card
 *     fills in with them. An entry with no 'text' is skipped entirely.
 *
 * TO REMOVE ONE: delete its block, or set 'show' => false.
 */

return [

    [
        'show'        => true,
        'author'      => 'Σαββούλα Νικολοπούλου',
        'rating'      => 5,
        'date'        => '',          // optional, YYYY-MM-DD, used only for ordering
        'text'        => 'Πολύ καλή εξυπηρέτηση. Είμαι πολύ ικανοποιημένη. Πάντα κάθε απορία ή ερώτηση που έχω είναι πάντα εκεί για να μου την λύσουν. Είναι επαγγελματίες! Σας ευχαριστούμε από καρδιάς που προσέχετε την Minnie μας.',
        'translation' => 'Very good service. I am very satisfied. Whatever query or question I have, they are always there to answer it. They are professionals! Thank you from the bottom of our hearts for looking after our Minnie.',
    ],

    [
        'show'        => true,
        'author'      => 'Διονύσης Παναγιωτόπουλος',
        'rating'      => 5,
        'date'        => '',
        'text'        => 'Και οι 3 γιατροί είναι εξαιρετικοί.. Πρόθυμοι, ευγενικοί και υπέροχη συμπεριφορά και φροντίδα προς τα ζωάκια..',
        'translation' => 'All 3 vets are excellent.. Obliging, kind, and a wonderful manner and care towards the animals..',
    ],

    [
        'show'        => true,
        'author'      => 'tina pap',
        'rating'      => 5,
        'date'        => '',
        'text'        => 'Πολύ περιποιητικοι και τρυφεροί με τους ασθενείς τους, άψογη εξυπηρέτηση και συνέπεια με τους ιδιοκτήτες. Ευχαριστούμε Ελένη και Γιώργο !',
        'translation' => 'Very attentive and gentle with their patients, impeccable service and reliability towards the owners. Thank you Eleni and Giorgos!',
    ],

    [
        'show'        => true,
        'author'      => 'Νικος Σπυ',
        'rating'      => 5,
        'date'        => '',
        'text'        => 'Τούς χρωστάω τήν αρτιμέλεια τού σκύλου μου. Εξαιρετικοί άνθρωποι καί γιατροί !',
        'translation' => 'I owe them the fact that my dog is sound and whole. Exceptional people and exceptional vets!',
    ],

];
