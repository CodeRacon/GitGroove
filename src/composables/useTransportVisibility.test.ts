import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import { useTransportVisibility } from './useTransportVisibility'

afterEach(() => vi.unstubAllGlobals())
describe('transport visibility', () => {
  it('tracks fully visible controls, changes targets across views and disconnects on unmount', async () => {
    let changed!: IntersectionObserverCallback
    const disconnect = vi.fn(),
      observe = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          changed = callback
        }
        observe = observe
        disconnect = disconnect
      },
    )
    const target = ref<HTMLElement | null>(null)
    const view = mount(
      defineComponent({
        setup() {
          return { visible: useTransportVisibility(target) }
        },
        template: '<span>{{ visible }}</span>',
      }),
    )
    target.value = document.createElement('div')
    await nextTick()
    expect(observe).toHaveBeenCalledWith(target.value)
    const report = (ratio: number) =>
      changed(
        [{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    report(1)
    await nextTick()
    expect(view.text()).toBe('true')
    report(0.5)
    await nextTick()
    expect(view.text()).toBe('false')
    const previousCallback = changed
    target.value = null
    await nextTick()
    expect(disconnect).toHaveBeenCalledOnce()
    target.value = document.createElement('div')
    await nextTick()
    expect(observe).toHaveBeenCalledTimes(2)
    report(1)
    previousCallback(
      [{ isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    await nextTick()
    expect(view.text()).toBe('true')
    view.unmount()
    expect(disconnect).toHaveBeenCalledTimes(3)
  })
})
