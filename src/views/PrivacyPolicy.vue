<script setup lang="ts">
import LegalPage from '@/components/legal/LegalPage.vue'
import OperatorContact from '@/components/legal/OperatorContact.vue'
</script>

<template>
  <LegalPage
    title="Privacy policy"
    description="Datenschutz · How GitGroove processes personal data. Last updated: 15 October 2026."
  >
    <h2>1. Controller and contact</h2>
    <p>The controller responsible for personal data processed through GitGroove is:</p>
    <OperatorContact />
    <p>
      This policy covers visitors to GitGroove and people whose GitHub profiles are requested
      through the application. You can contact us using the details above about any privacy question
      or to exercise your rights.
    </p>

    <h2>2. Website delivery and hosting</h2>
    <p>
      This website is hosted by Hostinger. Hostinger processes website connection data on our behalf
      as a hosting provider. Its hosting entities and processing arrangements are described in the
      <a href="https://www.hostinger.com/legal/dpa" target="_blank" rel="noopener noreferrer"
        >Hostinger data processing addendum</a
      >. Further information is available in
      <a
        href="https://www.hostinger.com/legal/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
        >Hostinger's privacy policy</a
      >.
    </p>
    <p>
      When you visit GitGroove, the hosting infrastructure processes connection and request data to
      deliver the website. This includes your IP address, the time of the request, the requested
      URL, response status and browser information transmitted with the request. A contribution
      request includes the requested GitHub username and, where selected, the year in its URL.
    </p>
    <p>
      The purpose is to provide a functioning, secure website and investigate technical problems or
      abuse. The legal basis is Article 6 (1) (f) GDPR: our legitimate interest in reliably and
      securely operating this public portfolio application. Connection data is required to deliver
      the site; without it, the website cannot be provided.
    </p>
    <p>
      Connection data is processed during delivery of the website. Where retained in technical or
      security logs, the retention criteria are the time needed to maintain secure operation,
      diagnose faults and investigate specific incidents, together with applicable legal retention
      obligations. The technical rotation of hosting logs depends on Hostinger's service and hosting
      configuration; this policy does not promise a fixed deletion period for those logs. Please
      contact us for information about a particular request. Hostinger may use subprocessors and
      process data outside the EU/EEA; its data processing addendum describes the applicable
      transfer safeguards, including standard contractual clauses where required.
    </p>

    <h2>3. GitHub contribution data</h2>
    <p>
      When you load a profile or select a contribution year, GitGroove sends the username and
      selected period to its own server endpoint. The server requests data from the GitHub GraphQL
      API. The returned data consists of contribution dates, daily counts, totals and available
      years. The application associates these with the requested username to display the calendar
      and generate music. It does not request repository contents, commit messages, email addresses
      or a GitHub login from you. Visibility is determined by GitHub and the profile's settings.
    </p>
    <p>
      The source of these data is GitHub. A profile may belong to you or to another person. Insofar
      as the data relate to an identifiable person, the legal basis is Article 6 (1) (f) GDPR. Our
      legitimate interest is to let visitors explore publicly accessible coding activity as a
      calendar and musical sequence, using only profile identifiers and aggregate activity rather
      than the underlying contributions. Profiles are retrieved on request; GitGroove does not build
      a profile directory or use these data for advertising or automated decisions about people.
    </p>
    <p>
      GitHub receives the requested username and period, the server's IP address and its API
      authentication. GitGroove does not forward your browser IP address or browser cookies to
      GitHub through this API request. The provider is GitHub, Inc., 88 Colin P. Kelly Jr. Street,
      San Francisco, CA 94107, USA, and/or GitHub B.V., Prins Bernhardplein 200, 1097 JB Amsterdam,
      Netherlands. Processing by GitHub may take place in the USA and other countries. GitHub
      describes its international transfer arrangements, including the EU–US Data Privacy Framework
      and standard contractual clauses where applicable, in its
      <a
        href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
        target="_blank"
        rel="noopener noreferrer"
        >privacy statement</a
      >.
    </p>
    <p>
      The application processes calendar responses on the server for the duration of the request and
      does not save them in a server-side calendar database or file cache. In your browser, loaded
      calendars and sound settings remain in the current page's memory until you reload or close it.
      A small memory cache reuses successful responses for five minutes; this does not delete the
      calendar currently displayed. Hosting logs are separate from calendar processing.
    </p>

    <h2>4. Shared sounds, QR codes and audio downloads</h2>
    <p>
      Creating a shared sound encodes the username, contribution dates and counts, selected weeks
      and all sound settings in the fragment of a URL, after the # character. The link and QR code
      are generated in your browser; GitGroove does not upload the snapshot to a storage service. A
      URL fragment is not sent to the web server in the HTTP request. Opening a valid snapshot
      restores it locally without a new contribution API request.
    </p>
    <p>
      Anyone with the full link or QR code can read and reproduce the included snapshot. Only share
      data you intend to disclose. Copies can remain in browser history, bookmarks, clipboard,
      downloads or the service you choose for sharing, until removed there. GitGroove cannot delete
      copies held by recipients. The legal basis for creating and restoring snapshots is Article 6
      (1) (f) GDPR, our legitimate interest in providing the sharing function you request.
    </p>
    <p>
      WAV files are rendered and downloaded locally. Audio is not recorded from your microphone or
      uploaded to GitGroove. Clipboard access is requested only when you choose to copy a sound
      link.
    </p>

    <h2>5. Cookies, browser storage and external links</h2>
    <p>
      The GitGroove application does not set analytics or advertising cookies, use tracking pixels,
      or store preferences in localStorage or sessionStorage. Glossary entries stay open only while
      that view is mounted. If an earlier version saved glossary preferences, the application
      removes that legacy entry when it starts; it does not read or reuse its contents. Your browser
      may cache application files as part of normal website delivery.
    </p>
    <p>
      Fonts and application libraries are served with the application. External websites, such as
      GitHub, LinkedIn and the developer portfolio, are linked rather than embedded. If you follow a
      link, the destination processes your connection under its own privacy policy.
    </p>

    <h2>6. Contact by email</h2>
    <p>
      If you contact us, we process your contact details and the information you provide to respond
      and handle your request. The legal basis is Article 6 (1) (f) GDPR, our legitimate interest in
      communicating with people interested in the project; Article 6 (1) (b) GDPR applies where the
      request concerns steps towards a contract or an existing contract. Messages are deleted when
      the request is resolved and no further retention is necessary, unless statutory retention
      duties or the establishment, exercise or defence of legal claims require longer storage.
    </p>

    <h2>7. Your rights</h2>
    <p>
      Subject to the applicable legal requirements, you have rights of access, rectification,
      erasure, restriction of processing and data portability under Articles 15–20 GDPR. Where
      processing relies on consent, you may withdraw it at any time with effect for the future.
    </p>
    <p>
      <strong>Right to object:</strong> Where processing is based on Article 6 (1) (f) GDPR, you may
      object at any time on grounds relating to your particular situation, under Article 21 GDPR.
      This also applies if your GitHub profile was requested by somebody else. Contact us at
      <a href="mailto:hey@michael-buschmann.dev">hey@michael-buschmann.dev</a>.
    </p>
    <p>
      You may lodge a complaint with a data protection supervisory authority, in particular in the
      EU member state of your habitual residence, place of work or the alleged infringement. The
      authority responsible for our location is the
      <a href="https://www.datenschutz.sachsen.de/" target="_blank" rel="noopener noreferrer"
        >Sächsische Datenschutz- und Transparenzbeauftragte</a
      >.
    </p>
    <p>
      GitGroove does not use automated decision-making, including profiling, that produces legal or
      similarly significant effects concerning you. You do not need to register or supply personal
      contact details to try the application.
    </p>
  </LegalPage>
</template>
