import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import BarSelector from './BarSelector.vue'

function selector(bars = 8, weeks = 53, disabled = false) {
  return mount(
    defineComponent({
      components: { BarSelector },
      setup: () => ({ bars: ref(bars), weeks, disabled }),
      template: '<BarSelector v-model:bars="bars" :total-weeks="weeks" :disabled="disabled" />',
    }),
  )
}
describe('section length quick choices', () => {
  it('keeps quick choices and the extended selector mutually consistent', async () => {
    const view = selector()
    const buttons = view.findAll('button')
    expect(buttons.map((button) => button.text())).toEqual(['4', '8', '12', '16'])
    expect(buttons[1].attributes('aria-pressed')).toBe('true')
    await buttons[2].trigger('click')
    expect(buttons[2].attributes('aria-pressed')).toBe('true')
    expect(view.get('select').element.value).toBe('')
    await view.get('select').setValue('24')
    expect(buttons.every((button) => button.attributes('aria-pressed') === 'false')).toBe(true)
    expect(view.get('select').element.value).toBe('24')
    await view.get('select').setValue('53')
    expect(view.get('select').element.value).toBe('53')
    await buttons[0].trigger('click')
    expect(view.get('select').element.value).toBe('')
  })
  it('supports short calendars, custom restored lengths and the full-calendar quick overlap', async () => {
    const short = selector(2, 3)
    expect(short.findAll('button')).toHaveLength(0)
    expect(short.get('select').element.value).toBe('2')
    const custom = selector(13)
    expect(custom.get('select').element.value).toBe('13')
    const full = selector(4, 4)
    await full.get('select').setValue('4')
    expect(full.get('select').element.value).toBe('')
    expect(full.get('button').attributes('aria-pressed')).toBe('true')
  })
  it('does not reload the current length and respects disabled controls', async () => {
    const view = mount(BarSelector, { props: { bars: 8, totalWeeks: 53 } })
    await view.get('[aria-label="8 weeks"]').trigger('click')
    expect(view.emitted('update:bars')).toBeUndefined()
    await view.setProps({ disabled: true })
    await view.get('[aria-label="4 weeks"]').trigger('click')
    expect(view.emitted('update:bars')).toBeUndefined()
    expect(view.get('select').attributes('disabled')).toBeDefined()
  })
})
