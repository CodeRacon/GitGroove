import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RotaryKnob from './RotaryKnob.vue'

describe('rotary knob keyboard controls', () => {
  it('keeps the existing release step alignment when the minimum is not a multiple of the step', async () => {
    const wrapper = mount(RotaryKnob, {
      props: { modelValue: 1.6, min: 0.01, max: 5, step: 0.05, label: 'Release' },
    })
    await wrapper.get('[role="slider"]').trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(1.65)
    wrapper.unmount()
  })

  it('captures a pointer drag and stops applying it after cancellation', async () => {
    const wrapper = mount(RotaryKnob, {
      props: { modelValue: 50, min: 0, max: 100, step: 1, label: 'Cutoff' },
    })
    const slider = wrapper.get('[role="slider"]')
    const capture = vi.fn()
    Object.defineProperty(slider.element, 'setPointerCapture', { value: capture })
    await slider.trigger('pointerdown', { button: 0, pointerId: 1, clientY: 100 })
    expect(capture).toHaveBeenCalledWith(1)
    await slider.trigger('pointermove', { pointerId: 1, clientY: 70 })
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(70)
    await slider.trigger('pointercancel', { pointerId: 1 })
    await slider.trigger('pointermove', { pointerId: 1, clientY: 0 })
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    wrapper.unmount()
  })

  it('preserves fractional precision, supports exact endpoints and clamps values', async () => {
    const wrapper = mount(RotaryKnob, {
      props: { modelValue: 0.85, min: 0, max: 1, step: 0.05, label: 'Reverb' },
    })
    const slider = wrapper.get('[role="slider"]')
    expect(slider.attributes('aria-valuetext')).toBe('0.85')
    await slider.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(0.9)
    await slider.trigger('keydown', { key: 'Home' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(0)
    await slider.trigger('keydown', { key: 'End' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(1)
    await wrapper.setProps({ modelValue: 1 })
    await slider.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(1)
    wrapper.unmount()
  })
})
