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
  for (const name of [
    'bass-hot',
    'dense-default',
    'dense-patterns',
    'dense-effects',
    'dense-hot',
    'dense-extreme',
  ]) {
    it(`keeps ${name} within the output range without silencing it`, () => {
      measure(name).then((audio) => {
        expect(audio.clipped, 'samples beyond ±1').to.equal(0)
        expect(audio.peak, 'output peak').to.be.at.most(0.98)
        expect(audio.rms, 'audible signal retained').to.be.greaterThan(0.0001)
      })
    })
  }
  it('stops the actual transport for a new calendar and plays its notes only after explicit restart', () => {
    cy.visit('/cypress/fixtures/audio-probe.html')
    cy.get('#ready').should('have.text', 'Ready')
    type Event = { voice: string; notes: string[]; time: number }
    type Result = {
      played: Event[]
      expected: Event[]
      stoppedAt: number
      restartedAt: number
      peak: number
      rms: number
    }
    cy.window()
      .then({ timeout: 60000 }, (window) => {
        return (window as unknown as { transportProbe: () => Promise<Result> }).transportProbe()
      })
      .then((result) => {
        expect(result.played.length).to.equal(result.expected.length)
        result.played.forEach((event, i) => {
          const expected = result.expected[i]
          expect(event.voice).to.equal(expected.voice)
          expect(event.notes).to.deep.equal(expected.notes)
          expect(event.time).to.be.closeTo(expected.time, 0.0001)
        })
        expect(
          result.played.filter(
            (event) => event.time >= result.stoppedAt && event.time < result.restartedAt,
          ),
        ).to.have.length(0)
        expect(result.peak).to.be.at.most(0.98)
        expect(result.rms).to.be.greaterThan(0.0001)
      })
  })
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
