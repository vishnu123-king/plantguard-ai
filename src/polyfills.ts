// Polyfill Web Streams & Globals for Node.js environments if missing
import * as webStreams from "node:stream/web";

if (typeof (globalThis as any).ReadableStream === "undefined") {
  (globalThis as any).ReadableStream = webStreams.ReadableStream;
}
if (typeof (globalThis as any).WritableStream === "undefined") {
  (globalThis as any).WritableStream = webStreams.WritableStream;
}
if (typeof (globalThis as any).TransformStream === "undefined") {
  (globalThis as any).TransformStream = webStreams.TransformStream;
}
if (typeof (globalThis as any).ByteLengthQueuingStrategy === "undefined") {
  (globalThis as any).ByteLengthQueuingStrategy = webStreams.ByteLengthQueuingStrategy;
}
if (typeof (globalThis as any).CountQueuingStrategy === "undefined") {
  (globalThis as any).CountQueuingStrategy = webStreams.CountQueuingStrategy;
}
