const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fm = new GoogleAIFileManager("test");
console.log("Instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(fm)));
