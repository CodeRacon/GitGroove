describe('GitGroove', () => {
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
    cy.contains('.playback-state', 'Paused').should('be.visible')
    cy.get('[aria-label="Stop and return to section start"]').click()
    cy.contains('.playback-state', 'Ready to play').should('be.visible')
    cy.get('#sequence-length').select('8')
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
})
