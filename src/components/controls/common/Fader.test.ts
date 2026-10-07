import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Fader from './Fader.vue'

describe('Fader', () => {
  it('emits a new value from the native range control', async () => {
    const wrapper = mount(Fader, { props: { modelValue: 90, min: 30, max: 300, step: 1 } })
    const input = wrapper.get('input[type="range"]')
    expect(input.attributes('min')).toBe('30')
    expect(input.attributes('max')).toBe('300')
    await input.setValue('165')
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe(165)
    wrapper.unmount()
  })
})
