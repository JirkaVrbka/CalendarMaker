// Vitest global setup — extends `expect` with jest-dom matchers for all tests.
import '@testing-library/jest-dom/vitest'

// jsdom does not implement object-URL APIs (its `URL.createObjectURL` throws
// "Not implemented"). The image store relies on them, so provide lightweight
// stubs here (no dependency added). Tests that need to assert revoke behavior
// `vi.spyOn(URL, 'revokeObjectURL')` over these.
let objectUrlCounter = 0
URL.createObjectURL = () => `blob:mock/${++objectUrlCounter}`
URL.revokeObjectURL = () => {}
