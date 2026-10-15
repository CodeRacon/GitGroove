import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BracketSelector from './BracketSelector.vue'

describe('calendar selection', () => {
  it('moves by whole weeks during pointer gestures and ignores moves after release', async () => {
    const wrapper = mount(BracketSelector, { props: { totalWeeks: 53, selectedBars: 8, start: 2 } })
    const slider = wrapper.get('[role="slider"]')
    Object.defineProperty(slider.element, 'setPointerCapture', { value: vi.fn() })
    await slider.trigger('pointerdown', { button: 0, pointerId: 2, clientX: 100 })
    await slider.trigger('pointermove', { pointerId: 2, clientX: 132 })
    expect(wrapper.emitted('update:range')?.at(-1)?.[0]).toEqual({ start: 4, bars: 8 })
    await slider.trigger('pointerup', { pointerId: 2 })
    await slider.trigger('pointermove', { pointerId: 2, clientX: 200 })
    expect(wrapper.emitted('update:range')).toHaveLength(1)
    wrapper.unmount()
  })

  it('supports keyboard movement and bounds the selection at both calendar edges', async () => {
    const wrapper = mount(BracketSelector, { props: { totalWeeks: 53, selectedBars: 8, start: 0 } })
    const slider = wrapper.get('[role="slider"]')
    await slider.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.emitted('update:range')).toBeUndefined()
    await slider.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:range')?.at(-1)?.[0]).toEqual({ start: 45, bars: 8 })
    await wrapper.setProps({ start: 45 })
    expect(slider.attributes('aria-valuenow')).toBe('46')
    expect(slider.attributes('aria-valuetext')).toBe('Weeks 46 through 53')
    await slider.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:range')).toHaveLength(1)
    await slider.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:range')?.at(-1)?.[0]).toEqual({ start: 0, bars: 8 })
    wrapper.unmount()
  })

  it('does not emit changes when disabled or when the entire calendar is selected', async () => {
    const wrapper = mount(BracketSelector, { props: { totalWeeks: 1, selectedBars: 1, start: 0 } })
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:range')).toBeUndefined()
    await wrapper.setProps({ totalWeeks: 53, disabled: true })
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:range')).toBeUndefined()
    wrapper.unmount()
  })
})
