function calendar(year: number, count: number, days = 365) {
  return {
    totalContributions: days * count,
    contributionYears: [
      2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012,
      2011, 2010, 2009, 2008,
    ],
    weeks: [
      {
        contributionDays: Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.UTC(year, 0, 1 + i)).toISOString().slice(0, 10),
          contributionCount: count,
        })),
      },
    ],
  }
}

describe('Contribution history', () => {
  it('loads calendar years on demand, preserves controls, caches visits and recovers from errors', () => {
    let yearRequests = 0
    cy.intercept('GET', '/api/contributions.php*', (req) => {
      const year = new URL(req.url).searchParams.get('year')
      if (year === '2023') return req.reply({ statusCode: 502, body: { error: 'offline' } })
      if (year === '2024') yearRequests++
      req.reply({
        statusCode: 200,
        body: calendar(Number(year ?? 2025), year ? 20 : 2, year === '2024' ? 366 : 365),
      })
    }).as('source')
    cy.visit('/')
    cy.contains('button', 'Try CodeRacon').click()
    cy.wait('@source')
    cy.get('.year-options button').first().should('have.attr', 'aria-pressed', 'true')
    cy.then(() => expect(yearRequests).to.equal(0))
    cy.get('.length-presets [aria-label="4 weeks"]').click()
    cy.get('[aria-label="Selection start week"]').trigger('keydown', { key: 'End' })
    cy.get('[aria-label="bass arpeggio pattern"]').select('up-down')
    cy.get('[aria-label="lead arpeggio pattern"]').select('down')
    cy.get('[aria-label="Tempo"]').invoke('val', 147).trigger('input')
    cy.contains('.year-button', /^2024$/).click()
    cy.get('.year-button[aria-pressed="true"]').should('have.text', '2024')
    cy.get('.contribution-grid [title="Feb 29, 2024: 20 contributions"]').should('exist')
    cy.get('.length-presets [aria-label="4 weeks"]').should('have.attr', 'aria-pressed', 'true')
    cy.contains('.selection-summary', 'Weeks 50–53').should('be.visible')
    cy.get('[aria-label="bass arpeggio pattern"]').should('have.value', 'up-down')
    cy.contains('.bpm-control', '147 BPM').should('be.visible')
    cy.contains('.year-button', 'Last 12 months').click()
    cy.contains('.year-button', /^2024$/).click()
    cy.then(() => expect(yearRequests).to.equal(1))
    cy.contains('.year-button', /^2023$/).click()
    cy.contains('.year-feedback', 'unchanged').should('be.visible')
    cy.get('.year-button[aria-pressed="true"]').should('have.text', '2024')
    cy.get('.contribution-grid [title="Feb 29, 2024: 20 contributions"]').should('exist')
    cy.viewport(1280, 900)
    cy.scrollTo('top')
    cy.screenshot('history-patterns-desktop', { capture: 'fullPage' })
    cy.viewport(390, 844)
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(390))
    cy.get('.year-options').then((options) =>
      expect(options[0].scrollWidth).to.be.greaterThan(options[0].clientWidth),
    )
    cy.screenshot('history-patterns-mobile', { capture: 'fullPage' })
    cy.get('.year-selector').scrollIntoView()
    cy.screenshot('history-year-mobile', { capture: 'viewport' })
    cy.get('.bass-synth-panel').scrollIntoView()
    cy.screenshot('history-bass-mobile', { capture: 'viewport' })
    cy.viewport(320, 740)
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(320))

    cy.contains('button', 'Share sound').click()
    cy.get('[aria-label="Snapshot link"]')
      .should('not.have.value', '')
      .invoke('val')
      .then((link) => cy.visit(String(link)))
    cy.contains('.snapshot-notice', 'Shared sound restored').should('be.visible')
    cy.contains('.history-heading', 'Frozen calendar · 2024').should('be.visible')
    cy.get('[aria-label="bass arpeggio pattern"]').should('have.value', 'up-down')
    cy.get('[aria-label="lead arpeggio pattern"]').should('have.value', 'down')
    cy.then(() => expect(yearRequests).to.equal(1))
    cy.contains('button', 'Explore profile history').click()
    cy.contains('.year-button', 'Last 12 months').should('have.attr', 'aria-pressed', 'true')
    cy.get('[aria-label="bass arpeggio pattern"]').should('have.value', 'up-down')
  })

  it('stops immediately, loads only the newest year and waits for Play even after an error', () => {
    cy.intercept('GET', '/api/contributions.php*', (req) => {
      const year = new URL(req.url).searchParams.get('year')
      if (year === '2022')
        return req.reply({ statusCode: 502, delay: 200, body: { error: 'offline' } })
      req.reply({
        statusCode: 200,
        delay: year === '2023' ? 900 : year ? 400 : 0,
        body: calendar(Number(year ?? 2026), year ? 20 : 2, 7),
      })
    })
    cy.visit('/')
    cy.contains('button', 'Try CodeRacon').click()
    cy.get('#sequence-length').select('2')
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.contains('.year-button', 'Last 12 months').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.contains('.year-button', /^2023$/).click()
    cy.contains('.year-feedback', 'Playback stopped').should('be.visible')
    cy.get('[aria-label="Play sequence"]').should('be.disabled')
    cy.get('.playhead').should('not.exist')
    cy.contains('.year-button', /^2024$/).click()
    cy.get('[aria-label="lead arpeggio pattern"]').select('up')
    cy.contains('.year-button', /^2024$/).should('have.attr', 'aria-pressed', 'true')
    cy.contains('.playback-state', 'Ready to play').should('be.visible')
    cy.get('.contribution-grid [title*="2024: 20 contributions"]').should('exist')
    cy.get('.contribution-grid [title*="2023:"]').should('not.exist')
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.contains('.year-button', /^2022$/).click()
    cy.contains('.year-feedback', 'unchanged').should('be.visible')
    cy.contains('.playback-state', 'Ready to play').should('be.visible')
    cy.contains('.year-button', /^2024$/).should('have.attr', 'aria-pressed', 'true')
    cy.get('[aria-label="lead arpeggio pattern"]').should('have.value', 'up')
  })
})
