import { Link } from 'react-router-dom';
import { RESERVATION_EMAIL, PHONE_DISPLAY, PHONE_HREF, ADDRESS_LINES } from '../data/restaurant';
import { useConsent } from '../consent/useConsent';
import './PrivacyPolicyPage.css';

const LAST_UPDATED = 'July 25, 2026';

export function PrivacyPolicyPage() {
  const { openPreferences } = useConsent();

  return (
    <div className="privacy-page">
      <header className="privacy-page__header">
        <div className="container privacy-page__header-inner">
          <Link to="/" className="privacy-page__logo">
            PYRA<span>.</span>
          </Link>
          <Link to="/" className="privacy-page__back">
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="privacy-page__main container">
        <p className="eyebrow">Legal</p>
        <h1 className="section-title">
          Privacy <em>Policy</em>
        </h1>
        <p className="privacy-page__updated">Last updated: {LAST_UPDATED}</p>

        <div className="privacy-page__body">
          <p>
            This policy explains what personal data PYRA Athens Steakhouse collects through this website,
            why, and what rights you have over it. We&rsquo;ve tried to write it in plain language rather
            than legal jargon &mdash; if anything is unclear, contact us using the details below.
          </p>

          <h2>1. Who we are</h2>
          <p>
            PYRA Athens Steakhouse (&ldquo;PYRA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates this
            website and is the data controller responsible for your personal data under the EU General Data
            Protection Regulation (GDPR) and Greek Law 4624/2019.
          </p>
          <address className="privacy-page__address">
            {ADDRESS_LINES.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
            <a href={`mailto:${RESERVATION_EMAIL}`}>{RESERVATION_EMAIL}</a>
            <br />
            <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
          </address>

          <h2>2. What data we collect, and why</h2>

          <h3>When you request a reservation</h3>
          <p>
            <strong>What we collect:</strong> your full name, email address, phone number (optional),
            reservation date and time, number of guests, and any special requests. If you&rsquo;re
            reserving one of our signature dishes, we also collect the dish name, quantity, and your
            preferred doneness.
          </p>
          <p>
            <strong>Why:</strong> to process and confirm your table booking.
          </p>
          <p>
            <strong>Legal basis:</strong> processing is necessary to take steps you&rsquo;ve requested
            before entering into a booking with us (Article 6(1)(b) GDPR).
          </p>
          <p>
            <strong>How it reaches us:</strong> submitting the form opens a pre-filled email in your own
            email application, addressed to us. We only receive your details if you go on to send that
            email &mdash; the request never passes through a server of ours.
          </p>
          <p>
            <strong>Is it mandatory:</strong> yes, for your name, email, date, and time &mdash; without
            these we can&rsquo;t process your reservation. Phone number and special requests are optional.
          </p>

          <h3>When you leave a review</h3>
          <p>
            <strong>What we collect:</strong> your full name, star rating, and review text.
          </p>
          <p>
            <strong>Why:</strong> to receive and consider your feedback about your visit.
          </p>
          <p>
            <strong>Legal basis:</strong> your consent (Article 6(1)(a) GDPR), given by voluntarily filling
            in and submitting the form. You can withdraw this consent at any time &mdash; see &ldquo;Your
            rights&rdquo; below &mdash; though this won&rsquo;t affect a review you&rsquo;ve already sent us.
          </p>
          <p>
            <strong>How it reaches us:</strong> the same pre-filled-email mechanism as the reservation form,
            addressed to our reviews mailbox.
          </p>
          <p>
            <strong>Is it mandatory:</strong> no &mdash; leaving a review is entirely voluntary.
          </p>

          <h3>Newsletter sign-up</h3>
          <p>
            Our footer includes a &ldquo;join our list&rdquo; email field. This feature is{' '}
            <strong>not active yet</strong>: submitting it does not send, store, or share your email address
            anywhere. If we switch this on in future, we&rsquo;ll update this policy first and ask for your
            consent before sending any marketing emails.
          </p>

          <h3>Cookies and similar technology</h3>
          <p>
            We use one strictly necessary cookie-like storage item to remember your cookie choices &mdash;
            nothing else runs until you allow it. We don&rsquo;t use analytics or advertising trackers of any
            kind. The only two optional items are:
          </p>
          <ul>
            <li>
              <strong>Web fonts:</strong> if you allow it, we load some of our typefaces directly from
              Google&rsquo;s servers (fonts.googleapis.com / fonts.gstatic.com). This sends your IP address
              and browser information to Google LLC, a company based in the United States. If you don&rsquo;t
              allow it, the site uses your device&rsquo;s default fonts instead.
            </li>
            <li>
              <strong>Location map:</strong> if you allow it, the map on our Visit and Reservation pages is
              embedded directly from OpenStreetMap, which sends your IP address to the OpenStreetMap
              Foundation to display the map tiles. If you don&rsquo;t allow it, you&rsquo;ll see our address
              as text plus a link to Google Maps instead.
            </li>
          </ul>
          <p>
            You can review or change these choices at any time from our{' '}
            <Link to="/cookies">Cookie Policy</Link> page, which lists every item along with its exact name,
            provider, and duration.
          </p>
          <p>
            Separately, our hosting provider, Hostinger, automatically logs visitor IP addresses, browser
            information, and request times for every visit, as part of running and securing the site.
          </p>
          <p>
            <strong>Legal basis:</strong> our legitimate interest (Article 6(1)(f) GDPR) in presenting our
            website correctly, securely, and reliably; for the two optional items above, your consent
            (Article 6(1)(a) GDPR), which you give or withdraw through the cookie banner or the Cookie Policy
            page.
          </p>

          <h2>3. Who we share your data with</h2>
          <table className="privacy-page__table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>What they receive</th>
                <th>Why</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PYRA (us)</td>
                <td>Reservation and review details</td>
                <td>To fulfil your request</td>
                <td>Greece</td>
              </tr>
              <tr>
                <td>Hostinger (hosting provider)</td>
                <td>Server access logs (IP, browser, request time)</td>
                <td>Hosting and site security</td>
                <td>[TO CONFIRM]</td>
              </tr>
              <tr>
                <td>Google LLC</td>
                <td>IP address and browser info, via font requests &mdash; only if you allow the &ldquo;Fonts&rdquo; cookie category</td>
                <td>Delivering our website&rsquo;s typefaces</td>
                <td>United States</td>
              </tr>
              <tr>
                <td>OpenStreetMap Foundation</td>
                <td>IP address, via the map embed &mdash; only if you allow the &ldquo;Maps&rdquo; cookie category</td>
                <td>Displaying our location map</td>
                <td>United Kingdom</td>
              </tr>
            </tbody>
          </table>
          <p className="privacy-page__note">
            Where you see &ldquo;[TO CONFIRM]&rdquo; above: that&rsquo;s a detail only our hosting provider,
            Hostinger, can confirm (which of their data centres serves this site, and how long they keep
            their own server logs). It doesn&rsquo;t change anything about how we handle your data
            ourselves &mdash; we&rsquo;ll fill it in once we&rsquo;ve confirmed it with them.
          </p>
          <p>
            Reservation and review requests are sent only to our own mailbox &mdash; we manage this
            ourselves, with no separate email provider acting as a processor on our behalf. We do not sell
            your personal data, and we do not share it with anyone for their own marketing purposes.
          </p>

          <h2>4. International data transfers</h2>
          <p>
            If you allow the &ldquo;Fonts&rdquo; cookie category, loading our web fonts involves sending your
            IP address outside the European Economic Area, to Google LLC in the United States. Google is
            certified under the EU-U.S. Data Privacy Framework,
            which the European Commission recognizes as providing an adequate level of protection for this
            kind of transfer. If you allow the &ldquo;Maps&rdquo; cookie category, the map embed sends your
            IP address to the OpenStreetMap Foundation in the United Kingdom; the UK has its own adequacy
            decision from the European Commission, so no additional safeguard is required for that transfer.
            We have a signed data processing agreement in place with Hostinger, our hosting provider.
          </p>

          <h2>5. How long we keep your data</h2>
          <ul>
            <li>Reservation and review emails: kept for a maximum of 3 days, then deleted.</li>
            <li>Server logs held by our hosting provider: [TO CONFIRM]</li>
            <li>We do not keep or store any data submitted via the (currently inactive) newsletter field.</li>
          </ul>

          <h2>6. Automated decision-making</h2>
          <p>
            We do not use automated decision-making or profiling of any kind. Every reservation and review
            is read and handled by a person.
          </p>

          <h2>7. Your rights</h2>
          <p>Under the GDPR, you have the right to:</p>
          <ul>
            <li>
              <strong>Access</strong> &mdash; ask us for a copy of the personal data we hold about you.
            </li>
            <li>
              <strong>Rectification</strong> &mdash; ask us to correct inaccurate or incomplete data.
            </li>
            <li>
              <strong>Erasure</strong> &mdash; ask us to delete your personal data.
            </li>
            <li>
              <strong>Restriction</strong> &mdash; ask us to limit how we use your data.
            </li>
            <li>
              <strong>Portability</strong> &mdash; ask us for your data in a portable format.
            </li>
            <li>
              <strong>Object</strong> &mdash; object to us processing your data based on our legitimate
              interest.
            </li>
            <li>
              <strong>Withdraw consent</strong> &mdash; where we rely on your consent (for example, reviews),
              withdraw it at any time, free of charge. This won&rsquo;t affect anything we did with your data
              before you withdrew it.
            </li>
            <li>
              <strong>Complain</strong> &mdash; lodge a complaint with the Hellenic Data Protection Authority
              if you believe we&rsquo;ve mishandled your data.
            </li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href={`mailto:${RESERVATION_EMAIL}`}>{RESERVATION_EMAIL}</a>.
          </p>
          <address className="privacy-page__address">
            Hellenic Data Protection Authority
            <br />
            Kifisias 1-3, PC 115 23, Athens, Greece
            <br />
            <a href="https://www.dpa.gr" target="_blank" rel="noreferrer">
              www.dpa.gr
            </a>
          </address>

          <h2>8. Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Any changes will be posted on this page, with an
            updated &ldquo;last updated&rdquo; date at the top.
          </p>
        </div>
      </main>

      <footer className="privacy-page__footer">
        <div className="container privacy-page__footer-inner">
          <p>&copy; {new Date().getFullYear()} PYRA Athens Steakhouse.</p>
          <div className="privacy-page__footer-links">
            <Link to="/cookies">Cookie Policy</Link>
            <button type="button" className="privacy-page__footer-btn" onClick={openPreferences}>
              Cookie Preferences
            </button>
            <Link to="/">Back to homepage</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
