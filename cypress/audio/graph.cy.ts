interface AudioMetrics {
  name: string
  peak: number
  clipped: number
  rms: number
  tailRatio: number
  switchJump: number
}

function measure(name: string) {
  cy.visit('/cypress/fixtures/audio-probe.html')
  cy.get('#ready').should('have.text', 'Ready')
  return cy.window().then({ timeout: 60000 }, (window) => {
    const probe = (window as unknown as { audioProbe: (name: string) => Promise<AudioMetrics> })
      .audioProbe
    return probe(name)
  })
}

describe('Rendered studio audio', () => {
  for (const name of ['bass-hot', 'dense-default', 'dense-effects', 'dense-hot', 'dense-extreme']) {
    it(`keeps ${name} within the output range without silencing it`, () => {
      measure(name).then((audio) => {
        expect(audio.clipped, 'samples beyond ±1').to.equal(0)
        expect(audio.peak, 'output peak').to.be.at.most(0.98)
        expect(audio.rms, 'audible signal retained').to.be.greaterThan(0.0001)
      })
    })
  }
  it('lets the maximum-feedback echo decay after the note ends', () => {
    measure('feedback-full').then((audio) => {
      expect(audio.tailRatio, 'RMS after 12 seconds / initial RMS').to.be.lessThan(0.02)
    })
  })
  for (const name of ['bass-wave', 'bass-wave-saw-1060', 'bass-octave', 'lead-octave']) {
    it(`keeps the quiet ${name} transition bounded`, () => {
      measure(name).then((audio) => {
        expect(audio.clipped).to.equal(0)
        expect(audio.switchJump).to.be.lessThan(0.04)
        expect(audio.rms).to.be.greaterThan(0.0001)
      })
    })
  }
})
