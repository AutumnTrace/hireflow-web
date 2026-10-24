import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrolling.
Element.prototype.scrollIntoView ??= () => {}
