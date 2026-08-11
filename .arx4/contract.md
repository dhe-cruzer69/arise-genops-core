# ARX4 Engineering Contract

Priority ARX4 target. Preserve domain behavior while continuously improving correctness, performance, observability, and security.

Evidence classes: OBSERVED, CORRELATED, HYPOTHESIS, VALIDATED, UNKNOWN.

Rules: inspect first; smallest safe change; tests are evidence; never hide failures; never commit secrets; never delete tests to force green; bounded repair loop of three attempts.

Improvement loop: OBSERVE → MEASURE → BOTTLENECK → HYPOTHESIS → IMPLEMENT → TEST → COMPARE → VALIDATE → RECORD.
