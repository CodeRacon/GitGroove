describe('GitGroove', () => {
  it('loads a profile and renders the normalized calendar', () => {
    cy.intercept('GET', '/api/contributions.php*', {
      statusCode: 200,
      body: {
        totalContributions: 21,
        weeks: [{ contributionDays: [
          { date: '2026-01-05', contributionCount: 21 },
          { date: '2026-01-06', contributionCount: 0 },
        ] }],
      },
    }).as('calendar')
    cy.visit('/')
    cy.get('input[placeholder="GitHub Username"]').type('CodeRacon')
    cy.contains('button', 'Load Data').click()
    cy.wait('@calendar')
    cy.contains('.status', 'CodeRacon').should('be.visible')
    cy.get('.week').should('have.length', 1)
    cy.get('.day').should('have.length', 7)
    cy.get('.day.level-4').should('have.length', 1)
    cy.contains('.bar-buttons button', '1').should('exist')
  })

  it('does not show stale data after a failed profile change', () => {
    cy.intercept('GET', '/api/contributions.php?username=first', {
      statusCode: 200,
      body: { totalContributions: 0, weeks: [{ contributionDays: [{ date: '2026-01-05', contributionCount: 0 }] }] },
    })
    cy.intercept('GET', '/api/contributions.php?username=missing', { statusCode: 404, body: { error: 'not found' } })
    cy.visit('/')
    cy.get('input[placeholder="GitHub Username"]').type('first{enter}')
    cy.get('.week').should('have.length', 1)
    cy.get('input[placeholder="GitHub Username"]').clear()
    cy.get('input[placeholder="GitHub Username"]').type('missing{enter}')
    cy.contains('.error', 'Dieses GitHub-Profil wurde nicht gefunden.').should('be.visible')
    cy.get('.week').should('not.exist')
  })
})
