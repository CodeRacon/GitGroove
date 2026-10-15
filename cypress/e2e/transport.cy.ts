function loadStudio() {
  const days = Array.from({ length: 365 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 0, 5 + i)).toISOString().slice(0, 10),
    contributionCount: 20,
  }))
  cy.intercept('GET', '/api/contributions.php*', {
    statusCode: 200,
    body: { totalContributions: 7300, weeks: [{ contributionDays: days }] },
  })
  cy.visit('/')
  cy.contains('button', 'Try CodeRacon').click()
  cy.get('.week').should('have.length', 53)
}
function space(selector: string) {
  cy.get(selector).focus()
  cy.get(selector).type(' ')
}

describe('Playback and section UX', () => {
  it('offers one-click common lengths and keeps extended/full selections clear on desktop and mobile', () => {
    loadStudio()
    for (const bars of [4, 8, 12, 16]) {
      cy.get(`.length-presets [aria-label="${bars} weeks"]`).click()
      cy.get(`.length-presets [aria-label="${bars} weeks"]`).should(
        'have.attr',
        'aria-pressed',
        'true',
      )
      cy.get('#sequence-length').invoke('prop', 'value').should('equal', '')
      cy.contains('.selection-summary', `Weeks 1–${bars}`).should('be.visible')
    }
    cy.get('#sequence-length').select('24')
    cy.get('.length-preset[aria-pressed="true"]').should('not.exist')
    cy.get('#sequence-length').should('have.value', '24')
    cy.get('#sequence-length').select('53')
    cy.contains('.selection-summary', 'Weeks 1–53').should('be.visible')
    cy.get('.length-presets [aria-label="8 weeks"]').click()
    cy.get('[aria-label="Play sequence"]').click()
    cy.get('.length-presets [aria-label="8 weeks"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.get('.length-presets [aria-label="12 weeks"]').click()
    cy.contains('.playback-state', 'Ready to play').should('be.visible')
    cy.contains('.bass-synth-panel .field-label', 'Arpeggio Pattern').should('exist')
    cy.contains('.lead-synth-panel .field-label', 'Arpeggio Pattern').should('exist')
    cy.viewport(1280, 900)
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(1280))
    cy.scrollTo('top')
    cy.screenshot('quick-lengths-desktop', { capture: 'viewport' })
    cy.viewport(390, 844)
    cy.get('.bar-selector').scrollIntoView()
    cy.screenshot('quick-lengths-mobile', { capture: 'viewport' })
    cy.viewport(320, 740)
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(320))
  })

  it('uses Space from content and knobs, preserves position, and respects controls and dialogs', () => {
    loadStudio()
    cy.get('[aria-label="Tempo"]').invoke('val', 30).trigger('input')
    space('main')
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.get('.playhead').should((head) =>
      expect(parseFloat(head[0].style.left)).to.be.greaterThan(1),
    )
    space('main')
    cy.contains('.playback-state', 'Paused').should('be.visible')
    cy.get('.playhead').then((head) => {
      const position = parseFloat(head[0].style.left)
      space('main')
      cy.contains('.playback-state', 'Playing').should('be.visible')
      cy.get('.playhead').should((current) =>
        expect(parseFloat(current[0].style.left)).to.be.at.least(position),
      )
    })
    // Native activation belongs to the focused button, without a second global action.
    space('[aria-label="Mute bass"]')
    cy.get('[aria-label="Mute bass"]').should('have.attr', 'aria-pressed', 'true')
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.get('#github-username').focus()
    cy.get('#github-username').type(' ')
    cy.get('#github-username').should('have.value', 'CodeRacon ')
    cy.contains('.playback-state', 'Playing').should('be.visible')
    space('.bass-synth-panel .knob[aria-label="Cutoff"]')
    cy.contains('.mini-status', 'Paused').should('be.visible')
    cy.window().then((window) => {
      const before = window.scrollY
      const knob = window.document.querySelector('.bass-synth-panel .knob')!
      const event = new window.KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true,
        cancelable: true,
      })
      knob.dispatchEvent(event)
      expect(event.defaultPrevented).to.equal(true)
      knob.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: ' ',
          repeat: true,
          bubbles: true,
          cancelable: true,
        }),
      )
      knob.dispatchEvent(new window.KeyboardEvent('keyup', { key: ' ', bubbles: true }))
      expect(window.scrollY).to.equal(before)
    })
    cy.contains('.mini-status', 'Playing').should('be.visible')
    cy.contains('button', 'Share sound').click()
    cy.get('dialog[open]').should('be.visible')
    cy.get('[aria-label="Snapshot link"]').should('not.have.value', '')
    cy.window().then((window) => {
      const event = new window.KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      })
      window.document.body.dispatchEvent(event)
      expect(event.defaultPrevented).to.equal(false)
    })
    cy.contains('.playback-state', 'Playing').should('exist')
    cy.get('[aria-label="Close sharing"]').click()
  })

  it('keeps audio and its position across views, with reachable mini controls and an unobscured footer', () => {
    loadStudio()
    cy.viewport(1280, 900)
    cy.get('.primary-transport-controls').scrollIntoView()
    cy.get('.mini-transport').should('not.exist')
    cy.get('[aria-label="Tempo"]').invoke('val', 30).trigger('input')
    cy.get('[aria-label="Play sequence"]').click()
    cy.get('.playhead').should((head) =>
      expect(parseFloat(head[0].style.left)).to.be.greaterThan(1),
    )
    cy.get('.bass-synth-panel').scrollIntoView()
    cy.get('.mini-transport').should('be.visible')
    cy.screenshot('mini-transport-desktop', { capture: 'viewport' })
    cy.get('[aria-label="Mini player: Pause sequence"]').click()
    cy.contains('.mini-status', 'Paused').should('be.visible')
    // A focused mini control remains available if scrolling reveals the primary transport.
    cy.get('.primary-transport-controls').scrollIntoView()
    cy.get('[aria-label="Mini player: Play sequence"]').should('be.focused')
    cy.get('[aria-label="Play sequence"]').focus()
    cy.get('.mini-transport').should('not.exist')
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('a', 'Glossary').click()
    cy.contains('.mini-status', 'Playing').should('be.visible')
    cy.window().its('scrollY').should('equal', 0)
    cy.contains('button', /^Arpeggio/).focus()
    cy.contains('button', /^Arpeggio/).type(' ')
    cy.contains('button', /^Arpeggio/).should('have.attr', 'aria-expanded', 'true')
    cy.contains('.mini-status', 'Playing').should('be.visible')
    space('[aria-label="Mini player: Pause sequence"]')
    cy.contains('.mini-status', 'Paused').should('be.visible')
    cy.contains('a', 'About').click()
    cy.contains('.mini-status', 'Paused').should('be.visible')
    space('main')
    cy.contains('.mini-status', 'Playing').should('be.visible')
    cy.viewport(390, 844)
    cy.screenshot('mini-about-mobile', { capture: 'viewport' })
    cy.get('[aria-label="Mini player: Pause sequence"]').click()
    cy.contains('.mini-status', 'Paused').should('be.visible')
    cy.scrollTo('bottom')
    cy.get('.app-footer').then((footer) => {
      const footerBottom = footer[0].getBoundingClientRect().bottom
      cy.get('.mini-transport').then((dock) =>
        expect(footerBottom).to.be.at.most(dock[0].getBoundingClientRect().top),
      )
    })
    cy.get('[aria-label="Show studio and playback controls"]').click()
    cy.contains('.playback-state', 'Paused').should('be.visible')
    cy.get('[aria-label="Play sequence"]').should('be.focused')
    cy.get('.primary-transport-controls').should((controls) => {
      const box = controls[0].getBoundingClientRect()
      expect(box.top).to.be.at.least(0)
      expect(box.bottom).to.be.at.most(844)
    })
    cy.get('.mini-transport').should('not.exist')
    cy.get('.lead-synth-panel').scrollIntoView()
    cy.get('.mini-transport').should('be.visible')
    cy.screenshot('mini-synth-mobile', { capture: 'viewport' })
    cy.viewport(320, 740)
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(320))
  })

  it('preserves a shared snapshot and subsequent edits across navigation without reloading it', () => {
    loadStudio()
    cy.contains('button', 'Share sound').click()
    cy.get('[aria-label="Snapshot link"]')
      .should('not.have.value', '')
      .invoke('val')
      .then((link) => cy.visit(String(link)))
    cy.contains('.snapshot-notice', 'Shared sound restored').should('be.visible')
    cy.get('[role="radio"][aria-label="D major"]').click()
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('a', 'Glossary').click()
    cy.location('hash').should('match', /^#sound=v1\./)
    cy.contains('.mini-status', 'Playing').should('be.visible')
    cy.contains('a', 'About').click()
    cy.contains('.mini-status', 'Playing').should('be.visible')
    cy.contains('a', 'Studio').click()
    cy.get('[role="radio"][aria-label="D major"]').should('have.attr', 'aria-checked', 'true')
    cy.contains('.playback-state', 'Playing').should('be.visible')
  })
})
