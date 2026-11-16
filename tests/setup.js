import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "node:util";

// React Router a besoin de ces API, absentes de certaines versions de jsdom.
Object.assign(globalThis, { TextEncoder, TextDecoder });
