describe('GitGroove', () => {
  it('keeps profile focus clean across reloads and explains the updated studio', () => {
    cy.visit('/')
    cy.get('#github-username').should('not.be.focused')
    cy.reload()
    cy.get('#github-username').should('not.be.focused').click()
    cy.get('#github-username').should('be.focused').and('have.css', 'outline-style', 'none')
    cy.viewport(1280, 800)
    cy.scrollTo('top')
    cy.screenshot('profile-focus-desktop', { capture: 'viewport' })
    cy.reload()
    cy.get('#github-username').should('have.css', 'outline-style', 'none')

    cy.contains('a', 'About').click()
    cy.contains('h2', 'About GitGroove').should('be.visible')
    cy.contains('h3', 'Share a Sound, Save a Loop').should('be.visible')
    cy.contains('p', 'Live playback and WAV export').should('be.visible')
    cy.viewport(1280, 900)
    cy.scrollTo('top')
    cy.screenshot('about-desktop', { capture: 'fullPage' })
    cy.viewport(390, 844)
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(390)
    })
    cy.scrollTo('top')
    cy.screenshot('about-mobile', { capture: 'fullPage' })

    cy.contains('a', 'Glossary').click()
    for (const term of ['Lead Focus', 'Modulation', 'Snapshot', 'WAV Export']) {
      cy.contains('button', new RegExp(`^${term}`)).click()
      cy.contains('button', new RegExp(`^${term}`))
        .should('have.attr', 'aria-expanded', 'true')
        .parent()
        .find('.wrapper')
        .should('be.visible')
    }
    cy.contains('.content', 'it does not turn FM on or off').should('be.visible')
    cy.contains('.content', 'without fetching GitHub again').should('be.visible')
    cy.reload()
    cy.contains('button', /^Snapshot/).should('have.attr', 'aria-expanded', 'true')
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(390)
    })
    cy.scrollTo('top')
    cy.window().should((window) => expect(window.scrollY).to.equal(0))
    // Let restored accordion heights and scrolling paint before Cypress stitches the screenshot.
    cy.window().then(
      (window) =>
        new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
        }),
    )
    cy.screenshot('glossary-mobile', { capture: 'fullPage' })
    cy.viewport(1280, 900)
    cy.scrollTo('top')
    cy.screenshot('glossary-desktop', { capture: 'fullPage' })
  })

  it('loads a profile and renders the normalized calendar', () => {
    cy.intercept('GET', '/api/contributions.php*', {
      statusCode: 200,
      body: {
        totalContributions: 21,
        weeks: [
          {
            contributionDays: [
              { date: '2026-01-05', contributionCount: 21 },
              { date: '2026-01-06', contributionCount: 0 },
            ],
          },
        ],
      },
    }).as('calendar')
    cy.visit('/')
    cy.get('input[placeholder="GitHub Username"]').type('CodeRacon')
    cy.contains('button', 'Load profile').click()
    cy.wait('@calendar')
    cy.contains('.status', 'CodeRacon').should('be.visible')
    cy.get('.week').should('have.length', 1)
    cy.get('.contribution-grid .day').should('have.length', 7)
    cy.get('.contribution-grid .day.level-4').should('have.length', 1)
    cy.get('#sequence-length').should('have.value', '1')
    cy.get('input[type="range"][aria-label="Tempo"]').invoke('val', 150).trigger('input')
    cy.contains('.bpm-control', '150 BPM').should('be.visible')
  })

  it('does not show stale data after a failed profile change', () => {
    cy.intercept('GET', '/api/contributions.php?username=first', {
      statusCode: 200,
      body: {
        totalContributions: 0,
        weeks: [{ contributionDays: [{ date: '2026-01-05', contributionCount: 0 }] }],
      },
    })
    cy.intercept('GET', '/api/contributions.php?username=missing', {
      statusCode: 404,
      body: { error: 'not found' },
    })
    cy.visit('/')
    cy.get('input[placeholder="GitHub Username"]').type('first{enter}')
    cy.get('.week').should('have.length', 1)
    cy.get('input[placeholder="GitHub Username"]').clear()
    cy.get('input[placeholder="GitHub Username"]').type('missing{enter}')
    cy.contains('.error', 'GitHub profile not found.').should('be.visible')
    cy.get('.week').should('not.exist')
  })
  it('lets a newcomer use the example, move the selection and operate the studio', () => {
    const weeks = Array.from({ length: 53 }, (_, week) => ({
      contributionDays: Array.from({ length: 7 }, (_, day) => ({
        date: new Date(Date.UTC(2025, 9, 12 + week * 7 + day)).toISOString().slice(0, 10),
        contributionCount: 20,
      })),
    }))
    cy.intercept('GET', '/api/contributions.php?username=CodeRacon', {
      statusCode: 200,
      body: { totalContributions: 7420, weeks },
    }).as('example')
    cy.visit('/')
    cy.contains('button', 'Load profile').should('be.disabled')
    cy.contains('button', 'Try CodeRacon').click()
    cy.wait('@example')
    cy.get('.week').should('have.length', 53)
    cy.get('[aria-label="Selection start week"]').trigger('keydown', { key: 'End' })
    cy.contains('.selection-summary', 'Weeks 46–53').should('be.visible')
    cy.get('#sequence-length').select('53')
    cy.contains('.selection-summary', 'Weeks 1–53').should('be.visible')
    cy.get('[aria-label="Selection start week"]').should('have.attr', 'aria-valuemax', '1')
    cy.get('[aria-label="Mute bass"]').click()
    cy.get('[aria-label="Mute bass"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[aria-label="Solo bass"]').click()
    cy.get('[aria-label="Solo bass"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('.bass-synth-panel [aria-label="Cutoff"]').trigger('keydown', { key: 'ArrowUp' })
    cy.get('.bass-synth-panel [aria-label="Cutoff"]').should('have.attr', 'aria-valuenow', '250')
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.contains('a', 'Glossary').click()
    cy.contains('a', 'Studio').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.get('[aria-label="Stop and return to section start"]').click()
    cy.contains('.playback-state', 'Ready to play').should('be.visible')
    cy.get('.length-presets [aria-label="8 weeks"]').click()
    cy.viewport(1280, 800)
    cy.scrollTo('top')
    cy.get('[aria-label="Play sequence"]').then((button) => {
      expect(button[0].getBoundingClientRect().bottom).to.be.at.most(800)
    })
    cy.screenshot('studio-desktop', { capture: 'fullPage' })
    cy.viewport(768, 1024)
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(768)
    })
    cy.screenshot('studio-tablet', { capture: 'fullPage' })
    cy.viewport(390, 844)
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(390)
    })
    cy.get('.timeline-scroller').should('be.visible')
    cy.screenshot('studio-mobile', { capture: 'fullPage' })
    cy.viewport(320, 740)
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(320)
    })
  })

  it('explains why an empty contribution section plays silence', () => {
    cy.intercept('GET', '/api/contributions.php*', {
      statusCode: 200,
      body: {
        totalContributions: 0,
        weeks: [{ contributionDays: [{ date: '2026-01-05', contributionCount: 0 }] }],
      },
    })
    cy.visit('/')
    cy.contains('button', 'Try CodeRacon').click()
    cy.contains('.selection-feedback', 'This section has no contributions').should('be.visible')
  })

  it('keeps playing and preserves its position when changing key and each voice octave', () => {
    const weeks = Array.from({ length: 8 }, (_, week) => ({
      contributionDays: Array.from({ length: 7 }, (_, day) => ({
        date: new Date(Date.UTC(2026, 0, 4 + week * 7 + day)).toISOString().slice(0, 10),
        contributionCount: 20,
      })),
    }))
    cy.intercept('GET', '/api/contributions.php*', {
      statusCode: 200,
      body: { totalContributions: 1120, weeks },
    })
    cy.visit('/')
    cy.contains('button', 'Try CodeRacon').click()
    cy.get('[aria-label="Tempo"]').invoke('val', 30).trigger('input')
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.get('.playhead').should((head) => {
      expect(parseFloat(head[0].style.left)).to.be.greaterThan(1)
    })
    cy.get('.playhead').then((head) => {
      const position = parseFloat(head[0].style.left)
      cy.get('[role="radio"][aria-label="F# major"]').click()
      cy.get('[aria-label="bass arpeggio pattern"]').select('up-down')
      cy.get('[aria-label="lead arpeggio pattern"]').select('down')
      for (const [voice, octave] of [
        ['bass', '-1'],
        ['pad', '1'],
        ['lead', '1'],
      ]) {
        cy.get(`[aria-label="${voice} octave"]`).select(octave)
        cy.contains('.playback-state', 'Playing').should('be.visible')
        cy.get('.playhead').should((current) => {
          expect(parseFloat(current[0].style.left)).to.be.at.least(position)
        })
      }
    })
    cy.get('[aria-label="Pause sequence"]').click()
    cy.contains('.playback-state', 'Paused').should('be.visible')
    cy.get('.playhead').then((head) => {
      const position = parseFloat(head[0].style.left)
      cy.get('[role="radio"][aria-label="D major"]').click()
      cy.get('[aria-label="bass octave"]').select('1')
      cy.contains('.playback-state', 'Paused').should('be.visible')
      cy.get('.playhead').should((current) => {
        expect(parseFloat(current[0].style.left)).to.equal(position)
      })
      cy.get('[aria-label="Play sequence"]').click()
      cy.contains('.playback-state', 'Playing').should('be.visible')
      cy.get('.playhead').should((current) => {
        expect(parseFloat(current[0].style.left)).to.be.at.least(position)
      })
    })
    cy.viewport(1280, 900)
    cy.scrollTo('top')
    cy.screenshot('live-transposition', { capture: 'fullPage' })
    cy.get('.length-presets [aria-label="4 weeks"]').click()
    cy.contains('.playback-state', 'Ready to play').should('be.visible')
  })

  it('shares and restores the frozen calendar and complete sound without another GitHub request', () => {
    const weeks = Array.from({ length: 53 }, (_, week) => ({
      contributionDays: Array.from({ length: 7 }, (_, day) => ({
        date: new Date(Date.UTC(2025, 9, 12 + week * 7 + day)).toISOString().slice(0, 10),
        contributionCount: 20,
      })),
    }))
    let requests = 0
    cy.intercept('GET', '/api/contributions.php*', (req) => {
      requests++
      req.reply({ statusCode: 200, body: { totalContributions: 7420, weeks } })
    }).as('source')
    cy.visit('/')
    cy.contains('button', 'Try CodeRacon').click()
    cy.wait('@source')
    cy.get('[aria-label="Selection start week"]').trigger('keydown', { key: 'End' })
    cy.get('[role="radio"][aria-label="F# major"]').click()
    cy.get('[aria-label="Bass waveform"]').select('sawtooth')
    cy.get('[aria-label="bass octave"]').select('-1')
    cy.get('[aria-label="lead octave"]').select('1')
    cy.get('[aria-label="bass arpeggio pattern"]').select('down')
    cy.get('[aria-label="lead arpeggio pattern"]').select('up-down')
    cy.get('[aria-label="Tempo"]').invoke('val', 147).trigger('input')
    cy.get('[aria-label="Lead focus"]').invoke('val', 45).trigger('input')
    cy.get('[aria-label="Mute bass"]').click()
    cy.get('[aria-label="Solo lead"]').click()
    cy.get('[role="switch"][aria-label="Modulation"]').click()
    cy.get('.pad-synth-panel [aria-label="Mod Decay"]').trigger('keydown', { key: 'PageUp' })
    cy.get('[role="switch"][aria-label="Chorus"]').click()
    cy.get('[role="switch"][aria-label="Distortion"]').click()
    cy.contains('button', 'Share sound').click()
    cy.get('dialog[open] .qr-image', { timeout: 10000 }).should('be.visible')
    cy.get('[aria-label="Snapshot link"]')
      .invoke('val')
      .then((value) => {
        const link = String(value)
        expect(link).to.contain('#sound=v1.')
        cy.writeFile('cypress/downloads/shared-link.txt', link)
        cy.contains('button', 'Download QR').click()
        cy.readFile('cypress/downloads/gitgroove-sound-qr.png', 'base64').should('not.be.empty')
        cy.screenshot('shared-sound-desktop', { capture: 'viewport' })
        cy.viewport(390, 844)
        cy.get('dialog[open]').then((dialog) => {
          expect(dialog[0].getBoundingClientRect().width).to.be.at.most(390)
        })
        cy.screenshot('shared-sound-mobile', { capture: 'viewport' })
        cy.visit(link)
      })
    cy.contains('.snapshot-notice', 'Shared sound restored').should('be.visible')
    cy.then(() => expect(requests).to.equal(1))
    cy.get('.week').should('have.length', 53)
    cy.contains('.selection-summary', 'Weeks 46–53').should('be.visible')
    cy.get('[aria-label="Bass waveform"]').should('have.value', 'sawtooth')
    cy.get('[aria-label="bass octave"]').should('have.value', '-1')
    cy.get('[aria-label="lead octave"]').should('have.value', '1')
    cy.get('[aria-label="bass arpeggio pattern"]').should('have.value', 'down')
    cy.get('[aria-label="lead arpeggio pattern"]').should('have.value', 'up-down')
    cy.get('[role="radio"][aria-label="F# major"]').should('have.attr', 'aria-checked', 'true')
    cy.contains('.bpm-control', '147 BPM').should('be.visible')
    cy.get('[aria-label="Lead focus"]').should('have.value', '45')
    cy.get('[aria-label="Mute bass"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[aria-label="Solo lead"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[role="switch"][aria-label="Modulation"]').should('have.attr', 'aria-checked', 'true')
    cy.get('.pad-synth-panel [aria-label="Mod Decay"]').should('have.attr', 'aria-valuenow', '1.1')
    cy.get('[role="switch"][aria-label="Chorus"]').should('have.attr', 'aria-checked', 'false')
    cy.get('[role="switch"][aria-label="Distortion"]').should('have.attr', 'aria-checked', 'true')
    cy.contains('.playback-state', 'Ready to play').should('be.visible')
    cy.contains('button', 'Reset sound').click()
    cy.contains('.selection-summary', 'Weeks 46–53').should('be.visible')
    cy.get('[aria-label="Bass waveform"]').should('have.value', 'square8')
    cy.get('[aria-label="bass octave"]').should('have.value', '0')
    cy.get('[aria-label="lead octave"]').should('have.value', '0')
    cy.get('[aria-label="bass arpeggio pattern"]').should('have.value', 'original')
    cy.get('[aria-label="lead arpeggio pattern"]').should('have.value', 'original')
    cy.get('[role="radio"][aria-label="C major"]').should('have.attr', 'aria-checked', 'true')
    cy.get('[aria-label="Solo lead"]').should('have.attr', 'aria-pressed', 'false')
    cy.get('[aria-label="Mute bass"]').should('have.attr', 'aria-pressed', 'false')
    cy.get('[role="switch"][aria-label="Modulation"]').should('have.attr', 'aria-checked', 'false')
    cy.contains('.bpm-control', '90 BPM').should('be.visible')
    cy.get('[aria-label="Lead focus"]').should('have.value', '0')
  })

  it('exports an exact WAV loop and effect tail without interrupting live playback', () => {
    cy.intercept('GET', '/api/contributions.php*', {
      statusCode: 200,
      body: {
        totalContributions: 21,
        weeks: [{ contributionDays: [{ date: '2026-01-05', contributionCount: 21 }] }],
      },
    })
    cy.visit('/')
    cy.contains('button', 'Try CodeRacon').click()
    cy.get('.week').should('have.length', 1)
    cy.get('[aria-label="bass arpeggio pattern"]').select('down')
    cy.get('[aria-label="lead arpeggio pattern"]').select('up')
    cy.get('[aria-label="Tempo"]').invoke('val', 300).trigger('input')
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.get('.studio-actions').contains('button', 'Download WAV').click()
    cy.get('dialog[open]').contains('button', 'Download WAV').click()
    cy.get('dialog[open]').contains('WAV downloaded', { timeout: 60000 }).should('be.visible')
    const loopFile = 'cypress/downloads/gitgroove-CodeRacon-weeks-1-1-300bpm-C-loop.wav'
    cy.readFile(loopFile, null).should((bytes) => {
      expect(bytes.toString('ascii', 0, 4)).to.equal('RIFF')
      expect(bytes.toString('ascii', 8, 12)).to.equal('WAVE')
      expect(bytes.readUInt16LE(22)).to.equal(2)
      expect(bytes.readUInt32LE(24)).to.equal(44100)
      expect(bytes.readUInt16LE(34)).to.equal(16)
      expect(bytes.length).to.equal(44 + 35280 * 4)
      expect(bytes.readInt16LE(44)).to.equal(0)
      expect(bytes.readInt16LE(bytes.length - 2)).to.equal(0)
      let peak = 0
      for (let i = 44; i < bytes.length; i += 2)
        peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)))
      expect(peak).to.be.greaterThan(0)
    })
    cy.get('dialog[open] input[value="tail"]').check()
    cy.get('dialog[open]').contains('button', 'Download WAV').click()
    cy.get('dialog[open]').contains('WAV downloaded', { timeout: 60000 }).should('be.visible')
    cy.readFile('cypress/downloads/gitgroove-CodeRacon-weeks-1-1-300bpm-C-tail.wav', null).should(
      (bytes) => {
        expect(bytes.length).to.equal(44 + Math.round(12.8 * 44100) * 4)
        expect(bytes.readInt16LE(bytes.length - 2)).to.equal(0)
      },
    )
    cy.get('[aria-label="Close export"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.get('[aria-label="Pause sequence"]').click()
    cy.contains('.playback-state', 'Paused').should('be.visible')
  })

  it('shows a recoverable error for a broken shared link', () => {
    cy.visit('/#sound=v1.broken')
    cy.contains('[role="alert"]', 'damaged').should('be.visible')
    cy.contains('button', 'Try CodeRacon').should('be.enabled')
    cy.get('.week').should('not.exist')
  })
})
