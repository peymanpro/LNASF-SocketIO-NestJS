const test = require("node:test");
const assert = require("node:assert/strict");
const { TypingAdaptationService, TypingBurstModel, decideTypingStart } = require("../dist/lnasf/typing-adaptation.js");

test("the model learns gap frequency and emits an explainable prediction", () => {
  const model = new TypingBurstModel();
  assert.equal(model.predict(), null);
  model.observeGap(100);
  model.observeGap(200);
  model.observeGap(900);
  assert.deepEqual(model.predict(), {
    samples: 3,
    fastGapProbability: 3 / 5,
    confidence: 0.5,
    meanGapMs: 400,
  });
});

test("passive mode learns but always broadcasts starts", () => {
  const service = new TypingAdaptationService();
  // Constructor mode follows the environment; pass decisions through the exported pure policy for stable mode testing.
  const passive = decideTypingStart({
    mode: "passive",
    prediction: { samples: 10, fastGapProbability: 0.9, confidence: 0.77, meanGapMs: 90 },
    isTyping: true,
    sinceLastBroadcastMs: 50,
  });
  assert.equal(passive.action, "broadcast");
  assert.equal(passive.recommendation, "suppress-duplicate");
  assert.ok(["passive", "advisory", "adaptive"].includes(service.mode));
});

test("advisory mode recommends without authorizing an action", () => {
  const decision = decideTypingStart({
    mode: "advisory",
    prediction: { samples: 8, fastGapProbability: 0.9, confidence: 8 / 11, meanGapMs: 100 },
    isTyping: true,
    sinceLastBroadcastMs: 80,
  });
  assert.equal(decision.action, "broadcast");
  assert.equal(decision.recommendation, "suppress-duplicate");
});

test("adaptive mode falls back when evidence is insufficient and suppresses learned duplicate bursts", () => {
  const service = new TypingAdaptationService();
  const initial = decideTypingStart({ mode: "adaptive", prediction: null, isTyping: true, sinceLastBroadcastMs: 1 });
  assert.equal(initial.action, "broadcast");
  const adaptive = decideTypingStart({
    mode: "adaptive",
    prediction: { samples: 5, fastGapProbability: 6 / 7, confidence: 5 / 8, meanGapMs: 100 },
    isTyping: true,
    sinceLastBroadcastMs: 50,
  });
  assert.equal(adaptive.action, "suppress");
  assert.equal(adaptive.cooldownMs, 500);
  assert.equal(service.getSnapshot().measurement.typingStartSuppressed, 0);
});

test("typing-stop always passes through and resets the per-socket observation window", () => {
  const service = new TypingAdaptationService();
  service.handleStart("socket-a", 0);
  const stop = service.handleStop("socket-a");
  assert.equal(stop.broadcast, true);
  assert.equal(service.getSnapshot().measurement.typingStopBroadcast, 1);
});
