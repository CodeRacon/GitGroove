describe('Legal information and storage', () => {
  it('places a short page footer at the viewport bottom and directly above the mini player', () => {
    cy.viewport(1440, 1400)
    cy.visit('/?view=legal')
    cy.get('.app-footer').should((footer) => {
      const bottom = footer[0].getBoundingClientRect().bottom
      expect(bottom).to.be.closeTo(footer[0].ownerDocument.defaultView!.innerHeight, 1)
    })

    cy.intercept('GET', '/api/contributions.php*', {
      statusCode: 200,
      body: {
        totalContributions: 10,
        weeks: [{ contributionDays: [{ date: '2026-01-05', contributionCount: 10 }] }],
      },
    })
    cy.contains('a', 'Studio').click()
    cy.contains('button', 'Try CodeRacon').click()
    cy.get('[aria-label="Legal information"]').contains('a', 'Imprint').click()
    cy.contains('h1', 'Imprint').should('be.visible')
    cy.get('.mini-transport').should('be.visible')
    const checkDockGap = () => {
      cy.get('.app-footer').should((footer) => {
        const dock = footer[0].ownerDocument.querySelector('.mini-transport')!
        const gap = dock.getBoundingClientRect().top - footer[0].getBoundingClientRect().bottom
        expect(gap, 'space between footer and mini player').to.be.within(8, 32)
      })
    }
    checkDockGap()
    cy.viewport(1280, 720)
    cy.scrollTo('bottom', { ensureScrollable: false })
    checkDockGap()
    cy.screenshot('footer-short-page-desktop', { capture: 'viewport' })

    cy.viewport(390, 844)
    cy.scrollTo('bottom', { ensureScrollable: false })
    checkDockGap()
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(390))
    cy.viewport(390, 720)
    cy.scrollTo('bottom', { ensureScrollable: false })
    checkDockGap()
    cy.screenshot('footer-short-page-mobile', { capture: 'viewport' })
    cy.get('[aria-label="Legal information"]').contains('a', 'Privacy').click()
    cy.contains('h1', 'Privacy policy').should('be.visible')
    cy.scrollTo('bottom')
    checkDockGap()
    cy.get('.legal-links').should('be.visible')
  })

  it('makes provider and privacy information reachable on desktop and mobile', () => {
    cy.visit('/')
    cy.viewport(1280, 900)
    cy.get('[aria-label="Legal information"]').contains('a', 'Imprint').click()
    cy.contains('h1', 'Imprint').should('be.visible')
    cy.contains('address', 'Michael Buschmann').should('be.visible')
    cy.contains('address', 'Wernerstraße 18').should('be.visible')
    cy.contains('address', '01159 Dresden').should('be.visible')
    cy.get('address a[href^="tel:"]').should('not.exist')
    cy.get('address a[href^="mailto:hey@michael-buschmann.dev"]').should('be.visible')
    cy.screenshot('imprint-desktop', { capture: 'viewport' })
    cy.contains('a', 'privacy policy').click()
    cy.contains('h1', 'Privacy policy').should('be.visible')
    cy.contains('a', 'Hostinger data processing addendum').should('be.visible')
    cy.contains('h2', 'Your rights').should('exist')
    cy.viewport(390, 844)
    cy.scrollTo('top')
    cy.screenshot('privacy-mobile', { capture: 'viewport' })
    cy.viewport(320, 740)
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(320))
    cy.get('[aria-label="Legal information"]').contains('a', 'Imprint').click()
    cy.contains('h1', 'Imprint').should('be.visible')
    cy.document().then((doc) => expect(doc.documentElement.scrollWidth).to.be.at.most(320))
    cy.contains('a', 'About').click()
    cy.contains('h2', 'About GitGroove').should('be.visible')
    cy.get('[aria-label="Legal information"]').contains('a', 'Privacy').click()
    cy.reload()
    cy.contains('h1', 'Privacy policy').should('be.visible')
  })

  it('removes legacy preferences without persisting new glossary choices', () => {
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.setItem('glossaryOpenEntries', '["Arpeggio"]')
        window.localStorage.setItem('unrelated', 'keep')
      },
    })
    cy.window().then((window) => {
      expect(window.localStorage.getItem('glossaryOpenEntries')).to.equal(null)
      expect(window.localStorage.getItem('unrelated')).to.equal('keep')
    })
    cy.contains('a', 'Glossary').click()
    cy.contains('button', /^Arpeggio/)
      .should('have.attr', 'aria-expanded', 'false')
      .click()
    cy.contains('button', /^Arpeggio/).should('have.attr', 'aria-expanded', 'true')
    cy.window().then((window) =>
      expect(window.localStorage.getItem('glossaryOpenEntries')).to.equal(null),
    )
    cy.contains('a', 'About').click()
    cy.contains('a', 'Glossary').click()
    cy.contains('button', /^Arpeggio/).should('have.attr', 'aria-expanded', 'false')
  })

  it('keeps playback and snapshot fragments when visiting legal pages', () => {
    cy.intercept('GET', '/api/contributions.php*', {
      statusCode: 200,
      body: {
        totalContributions: 140,
        weeks: [
          {
            contributionDays: Array.from({ length: 14 }, (_, i) => ({
              date: new Date(Date.UTC(2026, 0, 5 + i)).toISOString().slice(0, 10),
              contributionCount: 10,
            })),
          },
        ],
      },
    })
    cy.visit('/')
    cy.contains('button', 'Try CodeRacon').click()
    cy.get('[aria-label="Play sequence"]').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
    cy.contains('button', 'Share sound').click()
    cy.get('[aria-label="Snapshot link"]')
      .should('not.have.value', '')
      .invoke('val')
      .then((link) => {
        cy.visit(String(link))
      })
    cy.contains('.snapshot-notice', 'Shared sound restored').should('be.visible')
    cy.get('[aria-label="Play sequence"]').click()
    for (const page of ['Imprint', 'Privacy']) {
      cy.get('[aria-label="Legal information"]').contains('a', page).click()
      cy.contains('.mini-status', 'Playing').should('be.visible')
      cy.location('hash').should('match', /^#sound=v1\./)
      cy.scrollTo('bottom')
      cy.get('.app-footer').then((footer) => {
        cy.get('.mini-transport').then((dock) => {
          expect(footer[0].getBoundingClientRect().bottom).to.be.at.most(
            dock[0].getBoundingClientRect().top,
          )
        })
      })
    }
    cy.contains('a', 'Studio').click()
    cy.contains('.playback-state', 'Playing').should('be.visible')
  })
})
